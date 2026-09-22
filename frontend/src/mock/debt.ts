import type { Dayjs } from 'dayjs';
import type {
  ApiResponse, DebtApplicationChannel, DebtApprovalRecord, DebtBusinessType, DebtCombinationScheme, DebtDetailRecord,
  DebtFormValues, DebtGlobalStatus, DebtLoan, DebtLoanStatus, DebtOriginalLoan, DebtRepaymentPlan,
  DebtTransactionStage, ListData,
} from '../types';
import { delay } from '../utils';

export interface DebtListParams {
  page: number;
  pageSize: number;
  institutionName?: string;
  customerNo?: string;
  idCardNo?: string;
  mobile?: string;
  loanNo?: string;
  loanStatus?: DebtLoanStatus;
  productName?: string;
}

export interface DebtDetailParams extends DebtListParams {
  originalLoanNo?: string;
  businessType?: string;
  applyDate?: [Dayjs, Dayjs];
  globalStatus?: DebtGlobalStatus;
  transactionStage?: DebtTransactionStage;
  stageStatus?: string;
  applicationChannel?: string;
}

export const debtInstitutions = ['北京分行', '上海分行', '广州分行', '深圳分行'];
export const debtProducts = ['个人经营贷', '个人消费贷', '住房按揭贷', '小微企业贷'];
export const debtLoanStatuses: DebtLoanStatus[] = ['正常', '逾期', '减值', '核销'];
export const debtGlobalStatuses: DebtGlobalStatus[] = ['初始化', '待处理', '成功', '失败', '处理中', '撤销', '过期'];
export const debtTransactionStages: DebtTransactionStage[] = ['初始化阶段', '贷中调额阶段', '审批阶段', '客户签约阶段', '贷中提现阶段', '核心签约阶段', '合同签署阶段'];
export const debtStageStatuses: Record<DebtTransactionStage, string[]> = {
  初始化阶段: ['初始化成功', '初始化失败', '初始化中'],
  贷中调额阶段: ['调额策略通过', '调额策略拒绝', '调额策略处理中'],
  审批阶段: ['审批通过', '审批拒绝', '待审批', '待发起审批'],
  客户签约阶段: ['待客户确认', '反欺诈拒绝', '已签约', '待签约'],
  贷中提现阶段: ['提现策略通过', '提现策略拒绝', '提现策略处理中'],
  核心签约阶段: ['待签约', '已签约', '签约处理中'],
  合同签署阶段: ['合同签署', '合同签署成功', '合同签署失败'],
};
export const debtBusinessTypes: DebtBusinessType[] = ['借新还旧', '无还本续贷'];
export const debtDetailBusinessTypes = ['无还本续贷', '借新还旧'];
export const debtApplicationChannels = ['单次发起', '名单上传', '贷中规则跳转', '行方接口发起', '客户主动发起'];
export const debtRepaymentMethods = [
  '一次性还本付息（1）',
  '先息后本（2）',
  '等额本息（3）',
  '等额本金（4）',
  '自定义还本还息（5）',
  '等额本息气球贷（6）',
  '等额本金气球贷（7）',
  '自定义还本还息气球贷（8）',
  '先息后本等额本息组合（10）',
  '先息后本等额本金组合（11）',
  '按月付息按计划还本（12）',
];

const respond = <T,>(data: T, message = 'success', code = 0): Promise<ApiResponse<T>> =>
  delay({ code, data, message }, 300, 800);

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function paginate<T>(items: T[], page: number, pageSize: number): ListData<T> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const start = (safePage - 1) * safePageSize;
  return { list: items.slice(start, start + safePageSize), total: items.length, page: safePage, pagesize: safePageSize };
}

function toDate(value: unknown) {
  if (!value || typeof value !== 'object' || !('format' in value)) return '';
  return String((value as { format: (format: string) => string }).format('YYYY-MM-DD'));
}

function makeOriginalLoan(index: number, offset: number): DebtOriginalLoan {
  const amount = 60000 + index * 12000 + offset * 1500;
  const balance = Math.max(16000, amount - 8000 - index * 1800);
  const duePrincipal = Math.round(balance * (0.22 + (index % 3) * 0.08));
  const dueInterest = Math.round((balance * (0.045 + (index % 4) * 0.005)) * 100) / 100;
  const overdueDays = index % 4 === 1 ? 12 + index : index % 5 === 0 ? 3 : 0;
  const isFullInterest = index % 3 === 0 ? '是' : '否';
  const repayInterest = isFullInterest === '是' ? dueInterest : Math.round(dueInterest * 0.72 * 100) / 100;
  return {
    id: offset * 10 + index + 1,
    loanNo: `DB2024${String(offset * 10 + index + 1).padStart(5, '0')}`,
    loanStatus: debtLoanStatuses[(index + offset) % debtLoanStatuses.length],
    loanAmount: amount,
    loanBalance: balance,
    duePrincipal,
    dueInterest,
    repayInterest,
    ledgerInterest: Math.max(0, Math.round((dueInterest - repayInterest) * 100) / 100),
    overdueDays,
    interestRelief: index % 3 === 1 ? Math.round(dueInterest * 0.12 * 100) / 100 : 0,
    isFullInterest,
    startDate: `2024-${String((index % 8) + 1).padStart(2, '0')}-15`,
    maturityDate: `2027-${String((index % 8) + 1).padStart(2, '0')}-15`,
  };
}

export const debtLoans: DebtLoan[] = Array.from({ length: 32 }, (_, index) => {
  const institutionName = debtInstitutions[index % debtInstitutions.length];
  const productName = debtProducts[index % debtProducts.length];
  const originalLoans = [makeOriginalLoan(0, index), ...(index % 3 === 0 ? [makeOriginalLoan(1, index)] : [])];
  const loanBalance = originalLoans.reduce((sum, item) => sum + item.loanBalance, 0);
  const loanAmount = originalLoans.reduce((sum, item) => sum + item.loanAmount, 0);
  return {
    id: index + 1,
    institutionName,
    institutionCode: `20${String(index % debtInstitutions.length + 1).padStart(2, '0')}`,
    productName,
    productCode: `DCP${String(index % debtProducts.length + 1).padStart(3, '0')}`,
    customerName: ['张三', '李四', '王五', '赵六'][index % 4],
    customerNo: `DC${String(index + 1).padStart(5, '0')}`,
    idCardNo: `11010119900101${String(index + 1).padStart(4, '0')}`,
    mobile: `1381000${String(index + 1).padStart(4, '0')}`,
    loanNo: originalLoans[0].loanNo,
    loanAmount,
    loanBalance,
    startDate: originalLoans[0].startDate,
    maturityDate: originalLoans[0].maturityDate,
    repaymentMethod: ['等额本息', '等额本金', '先息后本'][index % 3],
    loanTerm: 24 + (index % 3) * 12,
    loanStatus: debtLoanStatuses[index % debtLoanStatuses.length],
    normalRate: 4.35 + (index % 3) * 0.2,
    penaltyRate: 6.525 + (index % 3) * 0.3,
    compoundRate: 4.35 + (index % 3) * 0.2,
    termOptions: [12, 24, 36, 48],
    originalLoans,
  };
});

export const debtCombinationSchemes: DebtCombinationScheme[] = [
  {
    id: 'debt-scheme-a', name: '方案A（先息后本转等额本息）', stages: [
      { sequence: 1, startPeriod: 1, endPeriod: 12, repaymentMethod: '先息后本', principalRatio: 0 },
      { sequence: 2, startPeriod: 13, endPeriod: 36, repaymentMethod: '等额本息', principalRatio: 100 },
    ],
  },
  {
    id: 'debt-scheme-b', name: '方案B（分段还本）', stages: [
      { sequence: 1, startPeriod: 1, endPeriod: 12, repaymentMethod: '先息后本', principalRatio: 0 },
      { sequence: 2, startPeriod: 13, endPeriod: 24, repaymentMethod: '等额本金', principalRatio: 40 },
      { sequence: 3, startPeriod: 25, endPeriod: 36, repaymentMethod: '等额本金', principalRatio: 60 },
    ],
  },
];

export async function getDebtLoans(params: DebtListParams): Promise<ApiResponse<ListData<DebtLoan>>> {
  const institution = String(params.institutionName ?? '').trim().toLowerCase();
  const customerNo = String(params.customerNo ?? '').trim().toLowerCase();
  const idCardNo = String(params.idCardNo ?? '').trim().toLowerCase();
  const mobile = String(params.mobile ?? '').trim().toLowerCase();
  const loanNo = String(params.loanNo ?? '').trim().toLowerCase();
  const product = String(params.productName ?? '').trim().toLowerCase();
  const filtered = debtLoans.filter((item) =>
    (!institution || item.institutionName.toLowerCase().includes(institution)) &&
    (!customerNo || item.customerNo.toLowerCase() === customerNo) &&
    (!idCardNo || item.idCardNo.toLowerCase() === idCardNo) &&
    (!mobile || item.mobile.toLowerCase() === mobile) &&
    (!loanNo || item.loanNo.toLowerCase() === loanNo) &&
    (!params.loanStatus || item.loanStatus === params.loanStatus) &&
    (!product || item.productName.toLowerCase().includes(product)),
  );
  return respond(paginate(filtered, params.page, params.pageSize));
}

export async function getDebtLoan(id: number): Promise<ApiResponse<DebtLoan>> {
  return respond(debtLoans.find((item) => item.id === id) ?? debtLoans[0]);
}

export async function getDebtRepaymentPlan(id: number, values?: Partial<DebtFormValues>): Promise<ApiResponse<DebtRepaymentPlan[]>> {
  const loan = debtLoans.find((item) => item.id === id) ?? debtLoans[0];
  const term = Number(values?.loanTerm ?? 12);
  const principal = loan.originalLoans.reduce((sum, item) => sum + item.loanBalance, 0) / term;
  const rate = Number(values?.normalRate ?? loan.normalRate) / 100 / 12;
  const plan = Array.from({ length: term }, (_, index) => {
    const currentPrincipal = index === term - 1 ? loan.loanBalance - principal * (term - 1) : principal;
    const interest = Math.round(loan.loanBalance * rate * 100) / 100;
    return {
      period: index + 1,
      dueDate: formatDate(new Date(2026, 8, 30 + index * 30)),
      repaymentMethod: values?.repaymentMethod ?? '等额本息',
      principal: Math.round(currentPrincipal * 100) / 100,
      interest,
      amount: Math.round((currentPrincipal + interest) * 100) / 100,
      remainingPrincipal: Math.max(0, Math.round((loan.loanBalance - currentPrincipal * (index + 1)) * 100) / 100),
    };
  });
  return respond(plan);
}

export async function getDebtDetails(params: DebtDetailParams): Promise<ApiResponse<ListData<DebtDetailRecord>>> {
  const records: DebtDetailRecord[] = debtLoans.map((loan, index) => {
    const stage = debtTransactionStages[index % debtTransactionStages.length];
    return {
      id: loan.id,
      institutionName: loan.institutionName,
      institutionCode: loan.institutionCode,
      productName: loan.productName,
      productCode: loan.productCode,
      customerNo: loan.customerNo,
      customerName: loan.customerName,
      holoSerialNo: `DB流水2026${String(index + 1).padStart(5, '0')}`,
      originalLoanNo: loan.loanNo,
      applyDate: `2026-${String((index % 8) + 1).padStart(2, '0')}-${String((index % 25) + 1).padStart(2, '0')}`,
      contractStatus: index % 3 === 0 ? '已签约' : '待签约',
      globalStatus: debtGlobalStatuses[index % debtGlobalStatuses.length],
      transactionStage: stage,
      stageStatus: debtStageStatuses[stage][index % debtStageStatuses[stage].length],
      newLoan: Math.max(0, loan.loanBalance - loan.originalLoans[0].duePrincipal),
      loanAmount: loan.loanAmount,
      repayPrincipal: loan.originalLoans.reduce((sum, item) => sum + item.duePrincipal, 0),
      repayInterest: loan.originalLoans.reduce((sum, item) => sum + item.repayInterest, 0),
      ledgerInterest: loan.originalLoans.reduce((sum, item) => sum + item.ledgerInterest, 0),
      repaymentMethod: loan.repaymentMethod,
      unpaidRatio: index % 4 * 0.1,
      loanTerm: loan.loanTerm,
      delayMonths: index % 3,
      interestCycle: '按月还息',
      principalCycle: '按月还本',
      normalRate: loan.normalRate,
      penaltyRate: loan.penaltyRate,
      compoundRate: loan.compoundRate,
      expiryDate: `2026-${String((index % 8) + 5).padStart(2, '0')}-28`,
      signingDate: index % 3 === 0 ? '2026-02-18' : undefined,
      revokeDate: index % 7 === 0 ? '2026-03-02' : undefined,
      reason: index % 2 === 0 ? '优化还款安排，缓解阶段性还款压力' : '客户经营周转困难，申请债务重组',
      statusRemark: index % 3 === 0 ? '等待客户签约' : '系统处理正常',
      applicationChannel: debtApplicationChannels[index % debtApplicationChannels.length] as DebtApplicationChannel,
      applicantName: ['张三', '李四', '王五'][index % 3],
      applicantId: `U${String(index + 1).padStart(4, '0')}`,
      videoSign: index % 2 === 0,
      attachmentName: index % 2 === 0 ? `债务重组材料${index + 1}.zip` : undefined,
    };
  });
  const institution = String(params.institutionName ?? '').trim().toLowerCase();
  const customerNo = String(params.customerNo ?? '').trim().toLowerCase();
  const idCardNo = String(params.idCardNo ?? '').trim().toLowerCase();
  const mobile = String(params.mobile ?? '').trim().toLowerCase();
  const originalLoanNo = String(params.originalLoanNo ?? '').trim().toLowerCase();
  const product = String(params.productName ?? '').trim().toLowerCase();
  const range = Array.isArray(params.applyDate) ? params.applyDate : [];
  const from = toDate(range[0]);
  const to = toDate(range[1]);
  const filtered = records.filter((item) =>
    (!institution || item.institutionName.toLowerCase().includes(institution)) &&
    (!customerNo || item.customerNo.toLowerCase() === customerNo) &&
    (!idCardNo || debtLoans[item.id - 1]?.idCardNo.toLowerCase() === idCardNo) &&
    (!mobile || debtLoans[item.id - 1]?.mobile.toLowerCase() === mobile) &&
    (!originalLoanNo || item.originalLoanNo.toLowerCase() === originalLoanNo) &&
    (!product || item.productName.toLowerCase().includes(product)) &&
    (!params.businessType || (params.businessType === '借新还旧' ? item.newLoan > 0 : item.newLoan === 0)) &&
    (!params.globalStatus || item.globalStatus === params.globalStatus) &&
    (!params.transactionStage || item.transactionStage === params.transactionStage) &&
    (!params.stageStatus || item.stageStatus === params.stageStatus) &&
    (!params.applicationChannel || item.applicationChannel === params.applicationChannel) &&
    (!from || item.applyDate >= from) && (!to || item.applyDate <= to),
  );
  return respond(paginate(filtered, params.page, params.pageSize));
}

export async function getDebtApprovalRecords(): Promise<ApiResponse<DebtApprovalRecord[]>> {
  const records: DebtApprovalRecord[] = debtLoans.slice(0, 8).map((loan, index) => ({
    id: index + 1,
    caseType: '案件贷后贷',
    caseSubtype: index === 4 ? '债务重组审批记录' : ['贷款调整审批', '灵动重组审批记录', '延期审批记录'][index % 3],
    customerName: loan.customerName,
    customerNo: loan.customerNo,
    loanNo: loan.loanNo,
    applyDate: `2026-0${(index % 3) + 1}-${String(index + 3).padStart(2, '0')}`,
    approvalStatus: index === 4 || index % 2 === 0 ? '待审批' : '审批通过',
    debtLoanId: loan.id,
  }));
  return respond(records);
}

export async function calculateDebtRepaymentPlan(id: number, values: Partial<DebtFormValues>): Promise<ApiResponse<DebtRepaymentPlan[]>> {
  if (!values.repaymentMethod || !values.loanTerm) return respond([], '请先填写还款方式和贷款期数', 1);
  return getDebtRepaymentPlan(id, values);
}

export { debtLoans as debtApplications };
