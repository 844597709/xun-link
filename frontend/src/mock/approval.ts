import type { ApiResponse, ListData } from '../types';
import type {
  AgileRestructuringDetail, ApprovalListParams, ApprovalRecord, ApprovalStatus, BatchDeductionDetail, DebtRestructuringDetail,
  ManualRepaymentDetail, ManualRepaymentSummary, ProductMaintenanceDetail,
} from '../types/approval';
import { delay } from '../utils';

const respond = <T,>(data: T, message = 'success'): Promise<ApiResponse<T>> =>
  delay({ code: 0, data, message }, 300, 700);

const paginate = <T,>(list: T[], page: number, pageSize: number): ListData<T> => {
  const safePageSize = Math.max(1, pageSize);
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * safePageSize;
  return { list: list.slice(start, start + safePageSize), total: list.length, page: safePage, pagesize: safePageSize };
};

const institutions = ['华北分行', '华东分行', '华南分行', '西南分行'];
const products = ['个人消费贷', '个人经营贷', '小微企业贷', '灵活周转贷'];
const types = ['产品维护', '营运管理', '贷后纾困', '贷后纾困'];
const subtypes = ['还款方式维护审批', '手动还款审批', '债务重组', '灵动重组'];
const detailTypes = ['product-maintenance', 'manual-repayment', 'debt-restructuring', 'agile-restructuring'] as const;
const statuses: ApprovalStatus[] = ['待审批', '已通过', '待审批', '已驳回'];

const productDetail = (index: number): ProductMaintenanceDetail => ({
  institutionCode: `20${String(index % 4 + 1).padStart(2, '0')}`,
  institutionName: institutions[index % institutions.length],
  productCode: `PRD${String(index + 1).padStart(4, '0')}`,
  productName: products[index % products.length],
  loanType: index % 2 ? '个人经营性贷款' : '个人消费贷款',
  loanCategory: index % 2 ? '经营类' : '消费类',
  operator: `U${String(index + 11).padStart(4, '0')}`,
  operatorName: ['张晓宁', '李明远', '王芳'][index % 3],
  originalRepayment: index % 5 === 0 ? '--' : '先息后本(2)：12,24,36',
  newRepayment: index % 5 === 0 ? '--' : '先息后本(2)：12,24,36,48,60',
  schemes: [
    { repaymentMethod: '先息后本(2)', periods: '12, 24, 36', name: '标准方案', description: '还款周期：按月；还本周期：到期一次性还本；阶段1：本金比例 0%' },
    { repaymentMethod: '等额本息(3)', periods: '12, 24, 36, 48, 60', name: '长期方案', description: '还款周期：按月；还本周期：按月；阶段1：本金比例 100%' },
    { repaymentMethod: '组合还款(10)', periods: '24, 36, 48', description: '还款周期：按月；还本周期：按阶段；阶段1（1-12期）：比例 20%；阶段2（13-36期）：比例 80%' },
  ],
});

const summary = (index: number, offset: number): ManualRepaymentSummary[] => Array.from({ length: 3 }, (_, row) => ({
  loanNo: `LN2026${String(index * 10 + row + 1).padStart(5, '0')}`,
  principal: 12000 + row * 2500 + offset * 100,
  interest: 860 + row * 180,
  penalty: row === 2 ? 120 : 0,
  total: 12860 + row * 2680 + offset * 100,
}));

const manualDetail = (index: number): ManualRepaymentDetail => ({
  institutionCode: `20${String(index % 4 + 1).padStart(2, '0')}`,
  institutionName: institutions[index % institutions.length],
  productCode: `PRD${String(index + 1).padStart(4, '0')}`,
  productName: products[index % products.length],
  customerNo: `CUS${String(index + 1).padStart(6, '0')}`,
  customerName: ['张三', '李四', '王五', '赵六'][index % 4],
  operator: `U${String(index + 11).padStart(4, '0')}`,
  operatorName: ['张晓宁', '李明远', '王芳'][index % 3],
  repaymentAccount: `6222 **** **** ${String(1200 + index).padStart(4, '0')}`,
  accountType: index % 2 ? '内部户' : '绑定卡列表',
  disbursementAccount: `DK202600${String(index + 1).padStart(3, '0')}`,
  repaymentNo: `RP202609${String(index + 1).padStart(4, '0')}`,
  additionalInfo: '客户申请提前归还本期应还款项',
  compensation: index % 3 === 0 ? '是' : '否',
  dueSummary: summary(index, 0),
  actualSummary: summary(index, 1).map((item) => ({ ...item, interest: item.interest - 100, total: item.total - 100 })),
});

const debtDetail = (index: number): DebtRestructuringDetail => ({
  institutionCode: `20${String(index % 4 + 1).padStart(2, '0')}`,
  institutionName: institutions[index % institutions.length],
  productCode: `PRD${String(index + 1).padStart(4, '0')}`,
  productName: products[index % products.length],
  customerNo: `CUS${String(index + 1).padStart(6, '0')}`,
  customerName: ['张三', '李四', '王五', '赵六'][index % 4],
  operator: `U${String(index + 11).padStart(4, '0')}`,
  operatorName: ['张晓宁', '李明远', '王芳'][index % 3],
  applicationSource: index % 2 ? '行方接口发起' : '客户主动发起',
  operatorId: `OP${String(index + 1001)}`,
  repaymentInfo: [
    { label: '归还总本', value: '32,800.00 元' }, { label: '归还总息', value: '2,460.00 元' },
    { label: '减免总息', value: '360.00 元' }, { label: '归还总额', value: '34,900.00 元' },
    { label: '原还款方式', value: '先息后本' }, { label: '原贷款期数', value: '36 期' },
  ],
  newLoanInfo: [
    { label: '贷款金额', value: '78,600.00 元' }, { label: '还款方式', value: '先息后本等额本息组合' },
    { label: '贷款期数', value: '36 期' }, { label: '首期延迟', value: '0 个月' },
    { label: '正常利率', value: '4.35%' }, { label: '备注说明', value: '按新方案执行，关注客户还款情况' },
  ],
  scheme: { name: index % 2 ? '已有方案-方案B' : '已有方案-方案A', stages: [
    { sequence: 1, term: '1-12期', method: '先息后本', ratio: '20%' },
    { sequence: 2, term: '13-24期', method: '等额本金', ratio: '40%' },
    { sequence: 3, term: '25-36期', method: '等额本金', ratio: '40%' },
  ] },
  originalLoans: [
    { loanNo: `DB2026${String(index + 1).padStart(5, '0')}`, status: '正常', amount: 68000, balance: 42600, duePrincipalInterest: 14800, duePrincipal: 12800, totalInterest: 2000, settled: '否' },
    { loanNo: `DB2026${String(index + 101).padStart(5, '0')}`, status: '关闭', amount: 36000, balance: 0, duePrincipalInterest: 0, duePrincipal: 0, totalInterest: 0, settled: '是' },
  ],
  attachments: ['债务重组申请材料.zip', '客户情况说明.pdf'],
});

const batchDeductionDetail = (index: number, operatorType: BatchDeductionDetail['operatorType']): BatchDeductionDetail => ({
  operatorType,
  operatorId: `OP${String(index + 1001)}`,
  operatorName: ['张晓宁', '李明远', '王芳'][index % 3],
  recovery: operatorType === '停止批扣' ? {
    strategy: '固定天数后恢复',
    date: '2026-10-01',
    days: 30,
  } : undefined,
  loans: [
    { institutionCode: '2001', institutionName: '华北分行', customerNo: `CUS${String(index + 1).padStart(6, '0')}`, customerName: '张三', loanNo: `DK2026${String(index + 1).padStart(5, '0')}`, amount: 86000, balance: 42600, status: '正常' },
    { institutionCode: '2002', institutionName: '华东分行', customerNo: `CUS${String(index + 2).padStart(6, '0')}`, customerName: '李四', loanNo: `DK2026${String(index + 101).padStart(5, '0')}`, amount: 52000, balance: 18000, status: '正常' },
  ],
});

const agileDetail = (index: number): AgileRestructuringDetail => ({
  institutionCode: `20${String(index % 4 + 1).padStart(2, '0')}`,
  institutionName: institutions[index % institutions.length],
  productCode: `PRD${String(index + 1).padStart(4, '0')}`,
  productName: products[index % products.length],
  customerNo: `CUS${String(index + 1).padStart(6, '0')}`,
  customerName: ['张三', '李四', '王五', '赵六'][index % 4],
  operator: `U${String(index + 11).padStart(4, '0')}`,
  operatorName: ['张晓宁', '李明远', '王芳'][index % 3],
  originalState: [
    { label: '还款方式', value: '等额本息' }, { label: '剩余期数', value: '24 期' },
    { label: '利息减免', value: '否' }, { label: '正常利率', value: '4.75%' },
    { label: '罚息利率', value: '7.125%' }, { label: '复息利率', value: '4.75%' },
  ],
  newState: [
    { label: '新还款方式', value: '按月付息按计划还本' }, { label: '新剩余期数', value: '36 期' },
    { label: '新利息减免', value: '是，减免 360 元' }, { label: '新正常利率', value: '4.35%' },
    { label: '新罚息利率', value: '6.525%' }, { label: '新复息利息', value: '4.35%' },
    { label: '失效日期', value: '2026-12-31' },
  ],
  scheme: { name: '已有方案-方案A', stages: [
    { sequence: 1, term: '1-12期', method: '按月付息按计划还本', ratio: '20%' },
    { sequence: 2, term: '13-24期', method: '等额本金', ratio: '40%' },
    { sequence: 3, term: '25-36期', method: '等额本金', ratio: '40%' },
  ] },
  reason: '客户经营阶段性困难，申请调整还款安排并适当延长剩余期限。',
  attachments: ['灵动重组申请附件.pdf', '客户授权书.jpg'],
  plans: Array.from({ length: 18 }, (_, row) => ({
    period: row + 1, startDate: `2026-${String(Math.floor(row / 2) + 10).padStart(2, '0')}-01`, dueDate: `2026-${String(Math.floor(row / 2) + 10).padStart(2, '0')}-28`, status: row < 2 ? '已结清' : '待还款', initialTotal: 4200 + row * 28, initialPrincipal: 3200 + row * 45, initialInterest: 1000 - row * 17, remainingPrincipal: Math.max(0, 42600 - row * 2400), paidAmount: row < 2 ? 4200 : 0, paidPrincipal: row < 2 ? 3200 : 0,
  })),
});

function createTimeline(index: number): ApprovalRecord['timeline'] {
  return [
    { title: '提交申请', operator: ['张晓宁', '李明远', '王芳'][index % 3], time: `2026-09-${String(index + 1).padStart(2, '0')} 09:12:08`, status: '申请已提交' },
    { title: '提交成功', operator: '系统', time: `2026-09-${String(index + 1).padStart(2, '0')} 09:12:10`, status: '流程已创建' },
    { title: '审批认领', operator: index % 3 === 0 ? '待认领' : '审核中心', time: `2026-09-${String(index + 1).padStart(2, '0')} 09:15:26`, status: index % 3 === 0 ? '待审批' : '已进入审批队列' },
  ];
}

export const approvalRecords: ApprovalRecord[] = Array.from({ length: 24 }, (_, index) => {
  const isBatchDeduction = index === 5 || index === 6;
  const batchOperatorType = index === 5 ? '停止批扣' : '恢复批扣';
  const detailType = isBatchDeduction ? 'batch-deduction' : detailTypes[index % detailTypes.length];
  const status = statuses[index % statuses.length];
  const detail = detailType === 'product-maintenance' ? productDetail(index) : detailType === 'manual-repayment' ? manualDetail(index) : detailType === 'debt-restructuring' ? debtDetail(index) : detailType === 'agile-restructuring' ? agileDetail(index) : batchDeductionDetail(index, batchOperatorType);
  return {
    id: index + 1,
    institution: institutions[index % institutions.length],
    product: products[index % products.length],
    type: isBatchDeduction ? '内管审批' : types[index % types.length],
    caseSubtype: isBatchDeduction ? '批扣操作' : subtypes[index % subtypes.length],
    initiator: ['张晓宁', '李明远', '王芳', '陈志强'][index % 4],
    applyTime: `2026-09-${String((index % 8) + 1).padStart(2, '0')} ${String(9 + index % 8).padStart(2, '0')}:12:08`,
    approver: status === '待审批' ? '--' : ['审核中心-赵敏', '审核中心-周宁'][index % 2],
    approvalStatus: status,
    approvalResult: status === '待审批' ? '--' : status === '已通过' ? '审批通过' : '审批驳回',
    businessStatus: index % 5 === 0 ? '处理失败' : '处理中',
    failureReason: index % 5 === 0 ? '核心系统暂时无法响应，请稍后重试' : '--',
    detailType,
    timeline: createTimeline(index),
    detail,
  };
});

export async function getApprovalRecords(params: ApprovalListParams): Promise<ApiResponse<ListData<ApprovalRecord>>> {
  const initiator = String(params.initiator ?? '').trim().toLowerCase();
  const from = params.applyTime?.[0]?.format('YYYY-MM-DD HH:mm:ss') ?? '';
  const to = params.applyTime?.[1]?.format('YYYY-MM-DD HH:mm:ss') ?? '';
  const filtered = approvalRecords.filter((item) =>
    (!params.type || item.type === params.type) &&
    (!params.caseSubtype || item.caseSubtype === params.caseSubtype) &&
    (!initiator || item.initiator.toLowerCase().includes(initiator)) &&
    (!params.approvalStatus || item.approvalStatus === params.approvalStatus) &&
    (!from || item.applyTime >= from) && (!to || item.applyTime <= to),
  );
  return respond(paginate(filtered, params.page, params.pageSize));
}

export async function claimApproval(id: number): Promise<ApiResponse<ApprovalRecord>> {
  const record = approvalRecords.find((item) => item.id === id);
  if (!record) return respond({} as ApprovalRecord, '审批记录不存在');
  record.approver = '当前用户-审核专员';
  record.timeline = record.timeline.map((item) => item.title === '审批认领' ? { ...item, operator: '当前用户-审核专员', status: '已认领' } : item);
  return respond(record, '认领成功');
}
