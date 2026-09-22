import type {
  ApiResponse,
  ConsumeSubsidyAllocation,
  ConsumeSubsidyRecord,
  ConsumeSubsidyRefund,
  ListData,
  LoanSubsidy,
  SubsidyAgreement,
  SubsidyApproval,
  SubsidyConsumptionDetail,
  SubsidyFlow,
  SubsidyListParams,
  SubsidyRefundDetail,
  SubsidyRule,
  SubsidyVoucher,
  SystemApproval,
} from '../types';
import { delay } from '../utils';

const respond = <T,>(data: T, message = 'success', code = 0): Promise<ApiResponse<T>> =>
  delay({ code, data, message }, 300, 800);

function paginate<T>(items: T[], page: number, pageSize: number): ListData<T> {
  const safePage = Math.max(1, page);
  const safeSize = Math.max(1, pageSize);
  const start = (safePage - 1) * safeSize;
  return { list: items.slice(start, start + safeSize), total: items.length, page: safePage, pagesize: safeSize };
}

const institutions = [
  { code: '2001', name: '北京分行' }, { code: '2002', name: '上海分行' },
  { code: '2003', name: '广州分行' }, { code: '2004', name: '深圳分行' },
];
const productGroups = [
  ['消费贷A', '消费贷B'], ['消费贷C', '消费贷D'], ['消费贷E'], ['消费贷F', '消费贷G'],
];
export const subsidyInstitutions = institutions.map(({ name }) => name);
export const subsidyProducts = institutions.flatMap(({ name }, index) => productGroups[index].map((productName, productIndex) => ({
  label: `${productName}（${name}）`, value: `${name}-${productName}-${productIndex + 1}`,
  institutionName: name, productName, productCode: `P${index + 1}${String(productIndex + 1).padStart(3, '0')}`,
})));
export const subsidySigningModes = ['CROS签署', '银行APP签署', '自动签署'];
export const subsidyApprovalSchemes = ['系统核定', '自主申请'];
export const subsidyFlowTypes = ['实时贴息', '补贴息', '收回贴息'];
export const subsidyFlowStatuses = ['待处理', '成功', '失败', '处理中', '已冲正', '冲正中'];
const ruleAccountScopes = ['仅支持本行一类户', '不限制'];
const ruleSupplyScopes = ['未到期', '已到期和未到期'];
const realtimeModes = ['日间代收一笔（两借两贷）', '日间代收两笔（贴息无资金流）'];
const subsidyModes = ['日间接口补息', '日终文件补息'];
const recoveryModes = ['日间接口退息', '日终文件退息'];
const traceRules = ['政策起始日之后', '当前日期之前的追溯天数之内', '发放贷款多少天之内的消费'];
export const subsidySystemStatuses = ['初始化', '成功', '失败', '处理中'];
export const subsidyApprovalSources = ['系统核定', '自主申请'];
export const subsidyApprovalStatuses = ['审核中', '已通过', '已拒绝', '已撤销'];
export const subsidyRetryCards = ['6222 **** 1001', '6222 **** 1002', '6222 **** 1003'];

function dateFor(index: number, offset = 0) {
  return `2026-${String(((index + offset) % 8) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`;
}
function institutionFor(index: number) { return institutions[index % institutions.length]; }
function productsFor(institutionName: string) { return subsidyProducts.filter((item) => item.institutionName === institutionName); }

export const subsidyRules: SubsidyRule[] = Array.from({ length: 24 }, (_, index) => {
  const institution = institutionFor(index);
  const products = productsFor(institution.name);
  return {
    id: index + 1, institutionCode: institution.code, institutionName: institution.name,
    crosRuleNo: `CROS-RULE-${String(index + 1).padStart(4, '0')}`, bankRuleNo: `BANK-RULE-${String(index + 1).padStart(4, '0')}`,
    description: `${institution.name}消费贷款贴息规则${index + 1}`, status: index % 5 === 0 ? '失效' : '生效',
    annualRate: 1.5 + (index % 5) * 0.25, startDate: dateFor(index), endDate: dateFor(index, 5),
    products: products.map((item) => item.productName), signingMode: subsidySigningModes[index % 3] as SubsidyRule['signingMode'],
    approvalScheme: subsidyApprovalSchemes[index % 2] as SubsidyRule['approvalScheme'], accountScope: ruleAccountScopes[index % ruleAccountScopes.length], supplyScope: ruleSupplyScopes[index % ruleSupplyScopes.length],
    realtimeMode: realtimeModes[index % realtimeModes.length], subsidyMode: subsidyModes[index % subsidyModes.length], recoveryMode: recoveryModes[index % recoveryModes.length], queryBankConsumption: index % 4 === 0 ? '否' : '是',
    calculationRule: index % 2 === 0 ? '标准' : '标准(30/360)', loanSubsidyOrder: index % 2 === 0 ? '按放款先后顺序' : '按贷余大小顺序',
    eligibleLoanRule: index % 2 === 0 ? '政策时间内所有贷款' : '指定日期后发放的贷款', designatedLoanStartDate: dateFor(index, 1), consumptionTraceRule: traceRules[index % traceRules.length],
    traceDays: 30 + (index % 4) * 15, allowSettledLoan: index % 3 === 0 ? '否' : '是', allowBusinessLoan: '否', checkAccountMatch: '是', allowGracePeriod: index % 2 === 0 ? '是' : '否', allowNormalPrincipalAfterOverdue: '是',
    overdueFailureRule: index % 2 === 0 ? '仅失效当期' : '失效后续所有期', minConsumptionAmount: 100 + index * 10,
  };
});

export const subsidyAgreements: SubsidyAgreement[] = Array.from({ length: 24 }, (_, index) => {
  const institution = institutionFor(index);
  return {
    id: index + 1, institutionCode: institution.code, institutionName: institution.name,
    customerNo: `C${String(index + 1).padStart(5, '0')}`, customerName: ['张三', '李四', '王五', '赵六'][index % 4], idCardNo: `11010119900101${String(index + 1).padStart(4, '0')}`, mobile: `1380000${String(index + 1).padStart(4, '0')}`,
    ruleNo: subsidyRules[index].crosRuleNo, contractNo: index % 3 === 1 ? '-' : `AGR-2026-${String(index + 1).padStart(5, '0')}`,
    signedAt: `${dateFor(index)} 1${index % 10}:2${index % 6}:00`, channel: subsidySigningModes[index % 3] as SubsidyAgreement['channel'],
    status: index % 11 === 0 ? '签署失败' : '已签署',
    content: '本人已阅读并同意消费贷款贴息协议，授权按协议约定进行贴息、补贴息及收回贴息处理。',
  };
});

function consumption(index: number, parentIndex: number): SubsidyConsumptionDetail {
  return {
    id: parentIndex * 10 + index + 1, crosConsumptionNo: `CROS-C-${parentIndex + 1}-${index + 1}`,
    bankConsumptionNo: `BANK-C-${parentIndex + 1}-${index + 1}`, invoiceNo: `INV-${20260000 + parentIndex * 10 + index + 1}`,
    consumptionDate: dateFor(index + parentIndex, 1), consumptionAmount: 800 + index * 360 + parentIndex * 25,
    appliedAmount: 700 + index * 300, purpose: ['日常消费', '教育培训', '医疗健康'][index % 3], merchantName: ['华联超市', '优选商城', '城市服务'][index % 3],
    approvalSource: index % 2 === 0 ? '系统核定' : '自主申请', approvedAmount: 650 + index * 270, approvedAt: dateFor(index + parentIndex, 2),
    subsidyAmount: 30 + index * 8, recoveryAmount: index % 3 === 0 ? 0 : 6 + index, account: `6222 **** ${1000 + parentIndex}`,
    accountType: '借记卡', loanNo: `LN2026${String(parentIndex + 1).padStart(5, '0')}`, availablePrincipal: 50000 - index * 1000,
    description: '符合规则的消费交易', approvalStatus: index % 3 === 0 ? '未核定' : '通过',
  };
}

function refund(index: number, parentIndex: number): SubsidyRefundDetail {
  return {
    id: parentIndex * 10 + index + 1,
    crosRefundNo: `CROS-R-${parentIndex + 1}-${index + 1}`,
    bankTransactionNo: `BANK-R-${parentIndex + 1}-${index + 1}`,
    bankOriginalTransactionNo: `BANK-C-${parentIndex + 1}-1`,
    consumptionDate: dateFor(index + parentIndex, 1),
    consumptionAmount: 800 + parentIndex * 25,
    approvedAmount: 650 + parentIndex * 20,
    refundAmount: index === 0 ? 180 + parentIndex * 5 : 90 + parentIndex * 3,
    expectedRecoveryAmount: 6 + parentIndex,
    recoveryAmount: parentIndex % 3 === 0 ? 0 : 4 + parentIndex,
  };
}

export const subsidyFlows: SubsidyFlow[] = Array.from({ length: 30 }, (_, index) => {
  const institution = institutionFor(index);
  const type = subsidyFlowTypes[index % 3] as SubsidyFlow['type'];
  const status = (index % 9 === 1 || (type === '收回贴息' && index % 6 === 2) ? '失败' : index % 5 === 0 ? '处理中' : index % 4 === 0 ? '待处理' : '成功') as SubsidyFlow['status'];
  const subsidyAmount = 80 + index * 12;
  const recoveryAmount = type === '收回贴息' ? 20 + index : 0;
  return {
    id: index + 1, institutionCode: institution.code, institutionName: institution.name,
    customerNo: `C${String(index + 1).padStart(5, '0')}`, customerName: ['张三', '李四', '王五', '赵六'][index % 4], idCardNo: `11010119900101${String(index + 1).padStart(4, '0')}`, mobile: `1380000${String(index + 1).padStart(4, '0')}`,
    productCode: `P${(index % 4) + 1}00${(index % 3) + 1}`, productName: productGroups[index % 4][index % productGroups[index % 4].length],
    loanNo: `LN2026${String(index + 1).padStart(5, '0')}`, crosTransactionNo: `CROS-T-${String(index + 1).padStart(6, '0')}`,
    type, expectedSubsidyAmount: type === '收回贴息' ? 0 : subsidyAmount,
    actualSubsidyAmount: type === '收回贴息' || status !== '成功' ? 0 : subsidyAmount,
    subsidyAmount, subsidyCardNo: type === '补贴息' ? `6222 **** ${1000 + index}` : '-',
    expectedRecoveryAmount: type === '收回贴息' ? recoveryAmount : 0,
    actualRecoveryAmount: type === '收回贴息' && status === '成功' ? recoveryAmount : 0,
    recoveryAmount, recoveryCardNo: type === '收回贴息' ? `6222 **** ${2000 + index}` : '-',
    subsidyAt: `${dateFor(index, 2)} 10:20:00`, status,
    failureReason: status === '失败' ? '银行卡状态异常，资金划扣失败' : '',
    consumptionDetails: [consumption(0, index), consumption(1, index)],
    refundDetails: index % 4 === 0 ? [refund(0, index)] : [], retryCards: subsidyRetryCards,
  };
});

export const systemApprovals: SystemApproval[] = Array.from({ length: 30 }, (_, index) => {
  const institution = institutionFor(index);
  const status = subsidySystemStatuses[index % 4] as SystemApproval['status'];
  return {
    id: index + 1, institutionCode: institution.code, institutionName: institution.name, customerNo: `C${String(index + 1).padStart(5, '0')}`,
    customerName: ['张三', '李四', '王五', '赵六'][index % 4], bankTransactionNo: `BANK-T-${String(index + 1).padStart(6, '0')}`,
    consumptionDate: dateFor(index, 1), consumptionCardNo: `6222 **** ${3000 + index}`, transactionType: index % 6 === 0 ? '退款' : '消费',
    totalAmount: 500 + index * 180, availableAmount: 400 + index * 150, refundOriginalNo: index % 6 === 0 ? `BANK-T-${String(index).padStart(6, '0')}` : '-',
    purpose: ['日常消费', '教育培训', '医疗健康'][index % 3], merchantName: ['华联超市', '优选商城', '城市服务'][index % 3], status,
    statusRemark: status === '失败' ? '消费账户与收款账户不一致' : status === '成功' ? '系统核定通过' : '等待系统处理',
  };
});

const vouchersFor = (index: number): SubsidyVoucher[] => [
  { id: `invoice-${index}`, name: `发票${index}.png`, url: `https://placehold.co/160x110/e8f3ff/1677ff?text=Invoice+${index}`, kind: '发票', invoiceNo: `INV-${index}`, invoiceDate: dateFor(index), invoiceAmount: 1200 + index * 100 },
  { id: `receipt-${index}`, name: `消费凭证${index}.png`, url: `https://placehold.co/160x110/f0fdf4/16a34a?text=Receipt+${index}`, kind: '消费凭证' },
];
export const subsidyApprovals: SubsidyApproval[] = Array.from({ length: 24 }, (_, index) => {
  const institution = institutionFor(index);
  const source = subsidyApprovalSources[index % 2] as SubsidyApproval['source'];
  return {
    id: index + 1, institutionCode: institution.code, institutionName: institution.name, customerNo: `C${String(index + 1).padStart(5, '0')}`,
    customerName: ['张三', '李四', '王五', '赵六'][index % 4], idCardNo: `11010119900101${String(index + 1).padStart(4, '0')}`, mobile: `1380000${String(index + 1).padStart(4, '0')}`, applicationNo: `APP-2026-${String(index + 1).padStart(5, '0')}`,
    appliedAt: `${dateFor(index)} 09:30:00`, appliedAmount: 900 + index * 40, consumptionCount: source === '系统核定' ? 2 + index % 4 : 1 + index % 3,
    source, status: subsidyApprovalStatuses[index % 4] as SubsidyApproval['status'], approvedAt: dateFor(index, 2), approvedAmount: 800 + index * 35,
    statusRemark: index % 4 === 2 ? '消费用途不符合贴息范围' : '资料核验正常', reason: index % 4 === 2 ? '消费凭证缺少关键信息' : '申请消费贴息', estimatedTotal: 150 + index * 15,
    consumptions: [consumption(0, index), consumption(1, index), ...(source === '系统核定' ? [consumption(2, index)] : [])], vouchers: vouchersFor(index + 1),
  };
});

const consumeAllocation = (index: number, allocationIndex: number): ConsumeSubsidyAllocation => ({
  id: index * 10 + allocationIndex + 1,
  loanNo: `LN2026${String(index + allocationIndex + 1).padStart(5, '0')}`,
  productCode: `P${(index % 4) + 1}001`, productName: productGroups[index % 4][0],
  loanAmount: 100000 + index * 5000, allocatedAmount: 600 + allocationIndex * 180,
  expectedSubsidyAmount: 42 + index * 2, dueSubsidyAmount: 38 + index,
  actualSubsidyAmount: index % 4 === 1 ? 0 : 30 + index, dueRecoveryAmount: index % 5 === 0 ? 12 : 0,
  actualRecoveryAmount: index % 5 === 0 ? 8 : 0,
});
const consumeRefund = (index: number): ConsumeSubsidyRefund => ({
  id: index + 1, crosRefundNo: `CROS-REF-${String(index + 1).padStart(5, '0')}`,
  bankConsumptionNo: `BANK-REF-${String(index + 1).padStart(5, '0')}`,
  bankOriginalConsumptionNo: `BANK-C-${String(index + 1).padStart(5, '0')}`,
  refundDate: dateFor(index, 4), refundAmount: 100 + index * 20,
  dueRecoveryAmount: 8 + index, actualRecoveryAmount: index % 3 === 0 ? 0 : 5 + index,
});
export const consumeSubsidies: ConsumeSubsidyRecord[] = Array.from({ length: 24 }, (_, index) => {
  const institution = institutionFor(index);
  const refundAmount = index % 4 === 0 ? 100 + index * 20 : 0;
  const allocations = [consumeAllocation(index, 0), ...(index % 3 === 0 ? [consumeAllocation(index, 1)] : [])];
  return {
    id: index + 1, crosConsumptionNo: `CROS-C-${String(index + 1).padStart(6, '0')}`,
    bankConsumptionNo: index % 5 === 0 ? '' : `BANK-C-${String(index + 1).padStart(6, '0')}`,
    invoiceNo: index % 6 === 0 ? '' : `INV-${20260000 + index + 1}`,
    institutionCode: institution.code, institutionName: institution.name,
    customerNo: `C${String(index + 1).padStart(5, '0')}`, customerName: ['张三', '李四', '王五', '赵六'][index % 4], idCardNo: `11010119900101${String(index + 1).padStart(4, '0')}`, mobile: `1380000${String(index + 1).padStart(4, '0')}`,
    consumptionDate: dateFor(index, 1), consumptionAmount: 900 + index * 60, appliedSubsidyAmount: 760 + index * 30,
    purpose: ['日常消费', '教育培训', '医疗健康'][index % 3], merchantName: ['华联超市', '优选商城', '城市服务'][index % 3],
    approvedAmount: 700 + index * 25, approvedAt: dateFor(index, 2), expectedSubsidyAmount: 120 + index * 8,
    dueSubsidyAmount: 100 + index * 7, actualSubsidyAmount: index % 4 === 1 ? 0 : 85 + index * 5,
    refundAmount, dueRecoveryAmount: refundAmount ? 10 + index : 0, actualRecoveryAmount: refundAmount && index % 3 !== 0 ? 6 + index : 0,
    status: (index % 7 === 0 ? '已冲正' : index % 5 === 0 ? '已失效' : '成功') as ConsumeSubsidyRecord['status'],
    allocations, refunds: refundAmount ? [consumeRefund(index)] : [],
  };
});

const loanTabs = (index: number): Record<string, Array<Record<string, string | number>>> => ({
  '关联消费明细': [{ crosConsumptionNo: `CROS-C-${index}`, bankConsumptionNo: `BANK-C-${index}`, invoiceNo: `INV-${index}`, consumptionDate: dateFor(index), consumptionAmount: 1200 + index * 40, appliedAmount: 1100 + index * 30, purpose: '日常消费', merchantName: '华联超市', approvedAt: dateFor(index, 1), approvedAmount: 1050 + index * 30, expectedSubsidyAmount: 60 + index, actualSubsidyAmount: 50 + index, status: '正常' }],
  '历史期供贴息明细': [{ period: 1, startDate: dateFor(index), dueDate: dateFor(index, 1), repaidAt: dateFor(index, 1), totalAmount: 2800 + index * 20, principal: 2400 + index * 15, interest: 400 + index * 5, customerInterest: 360 + index * 5, dueSubsidyAmount: 42 + index, actualSubsidyAmount: 40 + index, status: '正常' }],
  '未来期供贴息计划': [{ period: 2, startDate: dateFor(index, 2), dueDate: dateFor(index, 3), dueTotal: 2850 + index * 20, duePrincipal: 2450 + index * 15, dueInterest: 400 + index * 5, discountAmount: 0, expectedSubsidyAmount: 45 + index, status: '正常' }],
  '贴息流水明细': [{ crosTransactionNo: `FLOW-${index}`, type: '实时贴息', expectedSubsidyAmount: 45 + index, actualSubsidyAmount: 45 + index, subsidyCardNo: '-', expectedRecoveryAmount: 0, actualRecoveryAmount: 0, recoveryCardNo: '-', subsidyAt: `${dateFor(index)} 10:20:00`, status: '成功' }],
  '还款流水明细': [{ crosRepaymentNo: `REPAY-${index}`, repaymentDate: dateFor(index, 3), repaymentTime: '09:30:00', repaymentType: '正常还款', source: '批扣还款', loanStatus: '正常', totalAmount: 2800 + index * 20, principal: 2400 + index * 15, interest: 400 + index * 5, account: `6222 **** ${4000 + index}`, dueSubsidyAmount: 42 + index, actualSubsidyAmount: 40 + index, status: '成功', remark: '正常扣款' }],
});
export const loanSubsidies: LoanSubsidy[] = Array.from({ length: 24 }, (_, index) => {
  const institution = institutionFor(index);
  return {
    id: index + 1, institutionCode: institution.code, institutionName: institution.name, customerNo: `C${String(index + 1).padStart(5, '0')}`,
    customerName: ['张三', '李四', '王五', '赵六'][index % 4], idCardNo: `11010119900101${String(index + 1).padStart(4, '0')}`, mobile: `1380000${String(index + 1).padStart(4, '0')}`, productCode: `P${(index % 4) + 1}001`, productName: productGroups[index % 4][0],
    loanNo: `LN2026${String(index + 1).padStart(5, '0')}`, startDate: dateFor(index, 1), maturityDate: dateFor(index, 7), loanTerm: 36 + (index % 3) * 12,
    loanAmount: 100000 + index * 5000, occupiedPrincipal: 38000 + index * 800, remainingPrincipal: 62000 + index * 4200, consumptionCount: 2 + index % 5,
    dueTotal: 900 + index * 30, realtimeTotal: 500 + index * 18, dueSubsidyTotal: 400 + index * 12, actualSubsidyTotal: 360 + index * 10,
    dueRecoveryTotal: 80 + index * 5, actualRecoveryTotal: 60 + index * 4, settled: index % 5 === 0 ? '是' : '否', loanStatus: ['正常', '逾期', '减值', '核销'][index % 4] as LoanSubsidy['loanStatus'],
    baseInfo: { 机构号: institution.code, 机构名称: institution.name, 客户号: `C${String(index + 1).padStart(5, '0')}`, 客户名称: ['张三', '李四', '王五', '赵六'][index % 4], 产品号: `P${(index % 4) + 1}001`, 产品名称: productGroups[index % 4][0], 贷款编号: `LN2026${String(index + 1).padStart(5, '0')}`, 放款日期: dateFor(index, 1), 到期日期: dateFor(index, 7), 贷款利率: '4.35%', 贷款期数: 36 + (index % 3) * 12, 还款方式: '等额本息', 贷款本金: 100000 + index * 5000, 已占用本金: 38000 + index * 800, 剩余可占用本金: 62000 + index * 4200, 关联消费笔数: 2 + index % 5, 应贴息总额: 900 + index * 30, 实时贴息总额: 500 + index * 18, 应补贴息总额: 400 + index * 12, 实补贴息总额: 360 + index * 10, 应收回贴息总额: 80 + index * 5, 实收回贴息总额: 60 + index * 4, 是否结清: index % 5 === 0 ? '是' : '否', 贷款状态: ['正常', '逾期', '减值', '核销'][index % 4] },
    tabs: loanTabs(index + 1),
  };
});

function valueDate(value: unknown): string { return value && typeof value === 'object' && 'format' in value ? String((value as { format: (format: string) => string }).format('YYYY-MM-DD')) : ''; }
function rangeValues(value: unknown): [string, string] { return Array.isArray(value) ? [valueDate(value[0]), valueDate(value[1])] : ['', '']; }
function includesStatus(value: string | string[] | undefined, target: string) { return !value || (Array.isArray(value) ? value.length === 0 || value.includes(target) : value === target); }
function matchesCommon(item: { institutionName: string; customerNo?: string; idCardNo?: string; mobile?: string }, params: SubsidyListParams) {
  const institution = String(params.institutionName ?? '').trim();
  const customerNo = String(params.customerNo ?? '').trim().toLowerCase();
  const idCardNo = String(params.idCardNo ?? '').trim().toLowerCase();
  const mobile = String(params.mobile ?? '').trim().toLowerCase();
  return (!institution || item.institutionName === institution) &&
    (!customerNo || (item.customerNo ?? '').toLowerCase().includes(customerNo)) &&
    (!idCardNo || (item.idCardNo ?? '').toLowerCase().includes(idCardNo)) &&
    (!mobile || (item.mobile ?? '').toLowerCase().includes(mobile));
}
function filterDate(date: string, range: unknown) { const [from, to] = rangeValues(range); return (!from || date >= from) && (!to || date <= to); }

export async function getSubsidyRules(params: SubsidyListParams) {
  const selectedProduct = subsidyProducts.find((item) => item.productCode === params.productCode);
  const filtered = subsidyRules.filter((item) => matchesCommon(item, params) && (!selectedProduct || (item.institutionName === selectedProduct.institutionName && item.products.includes(selectedProduct.productName))) && (!params.status || item.status === params.status) && (!params.signingChannel || item.signingMode === params.signingChannel) && (!params.approvalScheme || item.approvalScheme === params.approvalScheme));
  return respond(paginate(filtered, params.page, params.pageSize));
}
export async function getSubsidyRule(id: number) { return respond(subsidyRules.find((item) => item.id === id) ?? subsidyRules[0]); }
export async function getSubsidyAgreements(params: SubsidyListParams) {
  const keyword = String(params.idCardNo ?? params.mobile ?? '').trim().toLowerCase();
  const filtered = subsidyAgreements.filter((item) => matchesCommon(item, params) && (!keyword || item.customerName.toLowerCase().includes(keyword) || item.customerNo.toLowerCase().includes(keyword) || (item.idCardNo ?? '').toLowerCase().includes(keyword) || (item.mobile ?? '').toLowerCase().includes(keyword)) && (!params.signingChannel || item.channel === params.signingChannel) && filterDate(item.signedAt.slice(0, 10), params.signedAt));
  return respond(paginate(filtered, params.page, params.pageSize));
}
export async function getSubsidyAgreement(id: number) { return respond(subsidyAgreements.find((item) => item.id === id) ?? subsidyAgreements[0]); }
export async function getSubsidyFlows(params: SubsidyListParams) {
  const keyword = String(params.idCardNo ?? params.mobile ?? '').trim().toLowerCase();
  const filtered = subsidyFlows.filter((item) => matchesCommon(item, params) && (!keyword || item.customerName.toLowerCase().includes(keyword) || item.customerNo.toLowerCase().includes(keyword) || (item.idCardNo ?? '').toLowerCase().includes(keyword) || (item.mobile ?? '').toLowerCase().includes(keyword)) && (!params.productCode || item.productCode === params.productCode) && (!params.type || item.type === params.type) && includesStatus(params.status, item.status));
  return respond(paginate(filtered, params.page, params.pageSize));
}
export async function getSubsidyFlow(id: number) { return respond(subsidyFlows.find((item) => item.id === id) ?? subsidyFlows[0]); }
export async function submitManualSubsidy(id: number, payload: { remark: string; retryCards: string[] }) { return respond({ id, ...payload, approvalNo: `APV-${Date.now()}` }, '已提交审批流'); }
export async function submitManualRecovery(id: number, payload: { remark: string; retryCards: string[] }) { return respond({ id, ...payload, approvalNo: `REC-${Date.now()}` }, '已提交收回贴息审批流'); }
export async function getSystemApprovals(params: SubsidyListParams) {
  const filtered = systemApprovals.filter((item) => matchesCommon(item, params) && (!params.bankTransactionNo || item.bankTransactionNo.includes(params.bankTransactionNo)) && (!params.transactionType || item.transactionType === params.transactionType) && (!params.status || item.status === params.status) && filterDate(item.consumptionDate, params.consumptionDate));
  return respond(paginate(filtered, params.page, params.pageSize));
}
export async function getSubsidyApprovals(params: SubsidyListParams) {
  const keyword = String(params.idCardNo ?? params.mobile ?? '').trim().toLowerCase();
  const filtered = subsidyApprovals.filter((item) => matchesCommon(item, params) && (!keyword || item.customerName.toLowerCase().includes(keyword) || item.customerNo.toLowerCase().includes(keyword) || (item.idCardNo ?? '').toLowerCase().includes(keyword) || (item.mobile ?? '').toLowerCase().includes(keyword)) && (!params.source || item.source === params.source) && (!params.status || item.status === params.status) && filterDate(item.appliedAt.slice(0, 10), params.appliedAt));
  return respond(paginate(filtered, params.page, params.pageSize));
}
export async function getSubsidyApproval(id: number) { return respond(subsidyApprovals.find((item) => item.id === id) ?? subsidyApprovals[0]); }
export async function getConsumeSubsidies(params: SubsidyListParams) {
  const crosNo = String(params.crosConsumptionNo ?? '').trim().toLowerCase();
  const bankNo = String(params.bankConsumptionNo ?? '').trim().toLowerCase();
  const invoiceNo = String(params.invoiceNo ?? '').trim().toLowerCase();
  const filtered = consumeSubsidies.filter((item) => matchesCommon(item, params) &&
    (!crosNo || item.crosConsumptionNo.toLowerCase().includes(crosNo)) &&
    (!bankNo || item.bankConsumptionNo.toLowerCase().includes(bankNo)) &&
    (!invoiceNo || item.invoiceNo.toLowerCase().includes(invoiceNo)) &&
    filterDate(item.consumptionDate, params.consumptionDate));
  return respond(paginate(filtered, params.page, params.pageSize));
}
export async function getConsumeSubsidy(id: number) { return respond(consumeSubsidies.find((item) => item.id === id) ?? consumeSubsidies[0]); }
export async function terminateConsumeSubsidy(id: number, reason: string) {
  const record = consumeSubsidies.find((item) => item.id === id);
  if (!record) return respond(null, '消费贴息记录不存在', 1);
  if (record.status !== '成功') return respond(null, '当前消费状态不可终止贴息', 1);
  record.status = record.actualSubsidyAmount > 0 ? '已冲正' : '已失效';
  return respond({ id, reason, status: record.status }, '终止贴息已提交审批');
}
export async function getLoanSubsidies(params: SubsidyListParams) {
  const filtered = loanSubsidies.filter((item) => matchesCommon(item, params) && (!params.productCode || item.productCode === params.productCode) && (!params.loanNo || item.loanNo.includes(params.loanNo)) && (!params.settled || item.settled === params.settled) && (!params.loanStatus || params.loanStatus.length === 0 || params.loanStatus.includes(item.loanStatus)) && filterDate(item.startDate, params.startDate));
  return respond(paginate(filtered, params.page, params.pageSize));
}
export async function getLoanSubsidy(id: number) { return respond(loanSubsidies.find((item) => item.id === id) ?? loanSubsidies[0]); }
