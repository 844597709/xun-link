import type {
  ApiResponse,
  InLoanAdjustmentApplication,
  InLoanAdjustmentChannel,
  InLoanAdjustmentElement,
  InLoanAdjustmentStatus,
  InLoanAdjustmentValues,
  InLoanListParams,
  InLoanLoan,
  InLoanRepaymentPlan,
  ListData,
} from '../types';
import { delay } from '../utils';

export const inLoanInstitutions = ['北京分行', '上海分行', '广州分行', '深圳分行'];
export const inLoanProducts = ['个人经营贷', '个人消费贷', '小微企业贷', '住房按揭贷'];
export const inLoanStatuses: InLoanAdjustmentStatus[] = ['待签约', '已签约', '已撤销'];
export const inLoanChannels: InLoanAdjustmentChannel[] = ['单笔发起', '系统批量', '客户发起'];
export const adjustmentElementOptions: Array<{ label: string; value: InLoanAdjustmentElement }> = [
  { label: '贷款利率变更', value: 'rate' },
  { label: '还款方式变更', value: 'repayment' },
  { label: '贷款期数变更', value: 'term' },
];
export const repaymentMethodOptions = [
  { label: '等额本息', value: '等额本息' },
  { label: '等额本金', value: '等额本金' },
  { label: '5气球贷', value: '5' },
  { label: '6气球贷', value: '6' },
  { label: '7气球贷', value: '7' },
  { label: '8气球贷', value: '8' },
];
export const cycleOptions = [
  { label: '按月', value: '按月' },
  { label: '按季', value: '按季' },
  { label: '按半年', value: '按半年' },
  { label: '按年', value: '按年' },
];
export const principalRatioOptions = ['10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%']
  .map((value) => ({ label: value, value }));

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const respond = <T,>(data: T, message = 'success', code = 0): Promise<ApiResponse<T>> =>
  delay({ code, data, message }, 300, 800);

function paginate<T>(items: T[], page: number, pageSize: number): ListData<T> {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(1, Number(pageSize) || 10);
  const start = (safePage - 1) * safePageSize;
  return { list: items.slice(start, start + safePageSize), total: items.length, page: safePage, pagesize: safePageSize };
}

function dateValue(value: unknown) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object' || !('format' in value) || typeof value.format !== 'function') return '';
  return String(value.format('YYYY-MM-DD'));
}

function rangeValue(value: unknown, index: number) {
  if (!Array.isArray(value) || !value[index]) return '';
  return dateValue(value[index]);
}

export const inLoanLoans: InLoanLoan[] = Array.from({ length: 36 }, (_, index) => {
  const startDate = new Date(2023, index % 12, (index % 25) + 1);
  const maturityDate = new Date(2027, index % 12, ((index + 10) % 25) + 1);
  const loanTerm = [24, 36, 48, 60][index % 4];
  const settledPeriods = index % 6;
  const institution = inLoanInstitutions[index % inLoanInstitutions.length];
  const product = inLoanProducts[index % inLoanProducts.length];
  return {
    id: index + 1,
    institutionName: institution,
    institutionCode: `20${String(index % inLoanInstitutions.length + 1).padStart(2, '0')}`,
    productName: product,
    productCode: `PL${String(index % inLoanProducts.length + 1).padStart(4, '0')}`,
    customerName: ['张三', '李四', '王五', '赵六', '陈晨'][index % 5],
    customerNo: `CUST${String(index + 1).padStart(5, '0')}`,
    idCardNo: `11010119900101${String(index + 1).padStart(4, '0')}`,
    mobile: `138000${String(index + 1).padStart(5, '0')}`,
    loanNo: `LN2026${String(index + 1).padStart(6, '0')}`,
    loanAmount: 180000 + index * 15000,
    loanBalance: 128000 + index * 7300,
    startDate: formatDate(startDate),
    maturityDate: formatDate(maturityDate),
    nextRepaymentDate: formatDate(new Date(2026, (index + 1) % 12, ((index + 12) % 25) + 1)),
    repaymentMethod: index % 3 === 0 ? '等额本息' : index % 3 === 1 ? '等额本金' : '6气球贷',
    loanTerm,
    remainingTerm: loanTerm - settledPeriods,
    normalRate: Number((4.35 + (index % 4) * 0.15).toFixed(4)),
    penaltyRate: Number((6.525 + (index % 4) * 0.2).toFixed(4)),
    compoundRate: Number((8.7 + (index % 4) * 0.25).toFixed(4)),
    loanStatus: (index % 5 === 0 ? '逾期' : '正常'),
    accountStatus: index % 11 === 0 ? '冻结' : '正常',
    maxTerm: index % 3 === 0 ? 36 : 48,
  };
});

export const inLoanApplications: InLoanAdjustmentApplication[] = inLoanLoans.map((loan, index) => ({
  ...loan,
  applicationId: 10001 + index,
  applyTime: `2026-${String((index % 8) + 1).padStart(2, '0')}-${String((index % 26) + 1).padStart(2, '0')} ${String(9 + index % 8).padStart(2, '0')}:30:00`,
  status: inLoanStatuses[index % inLoanStatuses.length],
  originalRepaymentMethod: loan.repaymentMethod,
  newRepaymentMethod: index % 2 ? '等额本金' : '6',
  originalTotalTerm: loan.loanTerm,
  newTotalTerm: index % 4 === 0 ? loan.loanTerm + 12 : loan.loanTerm,
  originalRemainingTerm: loan.remainingTerm,
  newRemainingTerm: index % 4 === 0 ? loan.remainingTerm + 12 : loan.remainingTerm,
  originalNormalRate: loan.normalRate,
  newNormalRate: Number((loan.normalRate - 0.15).toFixed(4)),
  originalPenaltyRate: loan.penaltyRate,
  newPenaltyRate: Number((loan.penaltyRate - 0.2).toFixed(4)),
  originalCompoundRate: loan.compoundRate,
  newCompoundRate: Number((loan.compoundRate - 0.25).toFixed(4)),
  expiryDate: `2026-${String((index % 8) + 5).padStart(2, '0')}-28`,
  signingTime: index % 3 === 1 ? `2026-03-${String((index % 20) + 1).padStart(2, '0')} 14:20:00` : undefined,
  revokeTime: index % 3 === 2 ? `2026-04-${String((index % 20) + 1).padStart(2, '0')} 16:10:00` : undefined,
  reason: index % 2 ? '客户阶段性资金周转困难，申请优化还款安排' : '根据客户经营情况调整贷款要素',
  revokeReason: index % 3 === 2 ? '客户主动取消调整申请' : undefined,
  applicationChannel: inLoanChannels[index % inLoanChannels.length],
  applicantName: ['张经理', '李经理', '王经理'][index % 3],
  applicantId: `U${String(index + 1).padStart(5, '0')}`,
  videoSignAvailable: index % 4 !== 3,
  attachmentName: index % 2 === 0 ? `在贷调整材料${index + 1}.zip` : undefined,
}));

export async function getInLoanLoans(params: InLoanListParams): Promise<ApiResponse<ListData<InLoanLoan>>> {
  const match = (value: unknown) => String(value ?? '').trim().toLowerCase();
  const institution = match(params.institutionName);
  const customerNo = match(params.customerNo);
  const idCardNo = match(params.idCardNo);
  const mobile = match(params.mobile);
  const loanNo = match(params.loanNo);
  const product = match(params.productName);
  const filtered = inLoanLoans.filter((item) =>
    (!institution || item.institutionName.toLowerCase().includes(institution)) &&
    (!customerNo || item.customerNo.toLowerCase().includes(customerNo)) &&
    (!idCardNo || item.idCardNo.toLowerCase().includes(idCardNo)) &&
    (!mobile || item.mobile.toLowerCase().includes(mobile)) &&
    (!loanNo || item.loanNo.toLowerCase().includes(loanNo)) &&
    (!product || item.productName.toLowerCase().includes(product)),
  );
  return respond(paginate(filtered, params.page, params.pageSize));
}

export async function getInLoanLoan(id: number): Promise<ApiResponse<InLoanLoan>> {
  return respond(inLoanLoans.find((item) => item.id === id) ?? inLoanLoans[0]);
}

export async function getInLoanAdjustmentDetails(params: InLoanListParams): Promise<ApiResponse<ListData<InLoanAdjustmentApplication>>> {
  const match = (value: unknown) => String(value ?? '').trim().toLowerCase();
  const institution = match(params.institutionName);
  const customerNo = match(params.customerNo);
  const idCardNo = match(params.idCardNo);
  const mobile = match(params.mobile);
  const loanNo = match(params.loanNo);
  const from = rangeValue(params.applyTime, 0);
  const to = rangeValue(params.applyTime, 1);
  const filtered = inLoanApplications.filter((item) =>
    (!institution || item.institutionName.toLowerCase().includes(institution)) &&
    (!customerNo || item.customerNo.toLowerCase().includes(customerNo)) &&
    (!idCardNo || item.idCardNo.toLowerCase().includes(idCardNo)) &&
    (!mobile || item.mobile.toLowerCase().includes(mobile)) &&
    (!loanNo || item.loanNo.toLowerCase().includes(loanNo)) &&
    (!params.status || item.status === params.status) &&
    (!params.applicationChannel || item.applicationChannel === params.applicationChannel) &&
    (!from || item.applyTime.slice(0, 10) >= from) && (!to || item.applyTime.slice(0, 10) <= to),
  );
  return respond(paginate(filtered, params.page, params.pageSize));
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export async function calculateInLoanPlan(id: number, values: InLoanAdjustmentValues): Promise<ApiResponse<InLoanRepaymentPlan[]>> {
  const loan = inLoanLoans.find((item) => item.id === id) ?? inLoanLoans[0];
  const newTotalTerm = values.adjustmentElements.includes('term') ? Number(values.newTotalTerm) : loan.loanTerm;
  if (!Number.isInteger(newTotalTerm) || newTotalTerm < 1) return respond([], '新总期数必须为正整数。', 1);
  const consumedPeriods = loan.loanTerm - loan.remainingTerm;
  if (newTotalTerm <= consumedPeriods) return respond([], `新总期数必须大于已结清期数（${consumedPeriods}期）。`, 1);
  const remainingTerm = newTotalTerm - consumedPeriods;
  const principalPerPeriod = loan.loanBalance / remainingTerm;
  const monthlyInterest = loan.loanBalance * (Number(values.newNormalRate ?? loan.normalRate) / 100) / 12;
  const plans: InLoanRepaymentPlan[] = Array.from({ length: newTotalTerm }, (_, index) => {
    const start = new Date(2026, 5, 1 + index * 30);
    const due = new Date(start);
    due.setDate(due.getDate() + 29);
    const settled = index < consumedPeriods;
    const principal = index === newTotalTerm - 1 ? loan.loanBalance - principalPerPeriod * Math.max(0, remainingTerm - 1) : (settled ? 0 : principalPerPeriod);
    const interest = settled ? 0 : monthlyInterest;
    return {
      period: index + 1,
      startDate: formatDate(start),
      dueDate: formatDate(due),
      status: settled ? '结清' : '正常',
      initialTotal: round(principal + interest),
      initialPrincipal: round(principal),
      initialInterest: round(interest),
      remainingPrincipal: round(Math.max(0, loan.loanBalance - principalPerPeriod * Math.max(0, index - consumedPeriods + 1))),
      paidAmount: settled ? round(principal) : 0,
      paidPrincipal: settled ? round(principal) : 0,
      paidInterest: 0,
      dueAmount: round(principal + interest),
      duePrincipal: round(principal),
      dueInterest: round(interest),
    };
  });
  return respond(plans, '贷款试算完成');
}

export async function submitInLoanAdjustment(id: number, values: InLoanAdjustmentValues): Promise<ApiResponse<null>> {
  const loan = inLoanLoans.find((item) => item.id === id) ?? inLoanLoans[0];
  const totalTerm = values.adjustmentElements.includes('term') ? Number(values.newTotalTerm) : loan.loanTerm;
  await delay(null, 400, 700);
  if (totalTerm > loan.maxTerm && !values.allowExceedMaxTerm) {
    return { code: 1, data: null, message: `借据新还款计划总期数(${totalTerm}期)已超过产品要素的最长贷款期限(${loan.maxTerm}期)，请调整后重新提交` };
  }
  const index = inLoanApplications.length;
  inLoanApplications.unshift({
    ...loan,
    applicationId: 10001 + index,
    applyTime: `${formatDate(new Date())} 10:00:00`,
    status: '待签约',
    originalRepaymentMethod: loan.repaymentMethod,
    newRepaymentMethod: values.newRepaymentMethod ?? loan.repaymentMethod,
    originalTotalTerm: loan.loanTerm,
    newTotalTerm: totalTerm,
    originalRemainingTerm: loan.remainingTerm,
    newRemainingTerm: totalTerm - (loan.loanTerm - loan.remainingTerm),
    originalNormalRate: loan.normalRate,
    newNormalRate: values.newNormalRate ?? loan.normalRate,
    originalPenaltyRate: loan.penaltyRate,
    newPenaltyRate: values.newPenaltyRate ?? loan.penaltyRate,
    originalCompoundRate: loan.compoundRate,
    newCompoundRate: values.newCompoundRate ?? loan.compoundRate,
    expiryDate: rangeValue([values.expiryDate], 0),
    reason: values.reason ?? '',
    applicationChannel: '单笔发起',
    applicantName: '当前操作人',
    applicantId: 'CURRENT_USER',
    videoSignAvailable: true,
    attachmentName: values.attachmentName,
  });
  return { code: 0, data: null, message: '调整申请已提交，请等待客户签约' };
}

export async function revokeInLoanAdjustment(applicationId: number): Promise<ApiResponse<null>> {
  await delay(null, 300, 600);
  const application = inLoanApplications.find((item) => item.applicationId === applicationId);
  if (!application) return { code: 1, data: null, message: '未找到调整申请' };
  if (application.status !== '待签约') return { code: 1, data: null, message: '仅待签约申请支持撤销' };
  application.status = '已撤销';
  application.revokeTime = formatDate(new Date());
  application.revokeReason = '操作人主动撤销';
  return { code: 0, data: null, message: '调整申请已撤销' };
}
