import type {
  ApiResponse, ListData, ManualRepaymentCalculation, ManualRepaymentCalculationResponse,
  ManualRepaymentPlan, ManualRepaymentRecord, ManualRepaymentSettings,
} from '../types';
import { delay } from '../utils';

export interface ManualRepaymentListParams {
  page: number;
  pageSize: number;
  institutionName?: string;
  customerNo?: string;
  idCardNo?: string;
  mobile?: string;
  customerName?: string;
  loanNo?: string;
  loanStatus?: ManualRepaymentRecord['loanStatus'];
  accountStatus?: ManualRepaymentRecord['accountStatus'];
  productName?: string;
}

const respond = <T,>(data: T, message = 'success', code = 0): Promise<ApiResponse<T>> =>
  delay({ code, data, message }, 300, 800);

export const manualRepaymentInstitutions = ['北京分行', '上海分行', '广州分行', '深圳分行'];
export const manualRepaymentProducts = ['个人经营贷', '个人消费贷', '住房按揭贷', '小微企业贷'];
export const manualRepaymentLoanStatuses: ManualRepaymentRecord['loanStatus'][] = ['正常', '逾期', '减值', '核销'];
export const manualRepaymentAccountStatuses: ManualRepaymentRecord['accountStatus'][] = ['正常', '冻结', '销户'];

function money(value: number) {
  return Math.round(Math.max(0, value) * 100) / 100;
}

function paginate<T>(items: T[], page: number, pageSize: number): ListData<T> {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(1, Number(pageSize) || 10);
  const start = (safePage - 1) * safePageSize;
  return { list: items.slice(start, start + safePageSize), total: items.length, page: safePage, pagesize: safePageSize };
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildPlans(index: number, balance: number, term: number, loanStatus: ManualRepaymentRecord['loanStatus']): ManualRepaymentPlan[] {
  const periods = Math.min(6, term);
  const monthlyPrincipal = balance / term;
  return Array.from({ length: periods }, (_, periodIndex) => {
    const principal = periodIndex === periods - 1 ? balance - monthlyPrincipal * (periods - 1) : monthlyPrincipal;
    const interest = balance * (0.0435 + (index % 3) * 0.002) / 12;
    const penalty = loanStatus === '逾期' && periodIndex === 0 ? balance * 0.0008 : 0;
    const fee = 18 + (index % 4) * 6;
    const start = new Date(2026, 6, 1 + periodIndex * 30 + index % 6);
    const due = new Date(start);
    due.setDate(due.getDate() + 29);
    return {
      period: periodIndex + 1,
      startDate: formatDate(start),
      dueDate: formatDate(due),
      initialPrincipal: money(principal),
      initialInterest: money(interest),
      dueAmount: money(principal + interest + penalty + fee),
      duePrincipal: money(principal),
      dueTotalInterest: money(interest + penalty),
      dueInterest: money(interest),
      duePenalty: money(penalty),
      dueFee: money(fee),
      dueFeePenalty: money(fee * 0.05),
      adjustmentInterest: money(-(interest * 0.08)),
      status: loanStatus === '逾期' && periodIndex === 0 ? '逾期' : periodIndex === periods - 1 ? '正常' : '正常',
    };
  });
}

export const manualRepaymentRecords: ManualRepaymentRecord[] = Array.from({ length: 36 }, (_, index) => {
  const institutionName = manualRepaymentInstitutions[index % manualRepaymentInstitutions.length];
  const productName = manualRepaymentProducts[index % manualRepaymentProducts.length];
  const loanStatus = manualRepaymentLoanStatuses[index % manualRepaymentLoanStatuses.length];
  const loanAmount = 80000 + index * 9500;
  const loanBalance = money(loanAmount * (0.46 + (index % 5) * 0.07));
  const term = 24 + (index % 3) * 12;
  const plans = buildPlans(index, loanBalance, term, loanStatus);
  const dueTotal = money(plans.reduce((sum, plan) => sum + plan.dueAmount, 0));
  const start = new Date(2024, index % 8, 5 + (index % 20));
  const maturity = new Date(start);
  maturity.setMonth(maturity.getMonth() + term);
  const nextRepayment = new Date(start);
  nextRepayment.setMonth(nextRepayment.getMonth() + Math.max(1, index % 8));
  return {
    id: index + 1,
    institutionName,
    institutionCode: `20${String((index % manualRepaymentInstitutions.length) + 1).padStart(2, '0')}`,
    customerName: ['张三', '李四', '王五', '赵六', '陈晓'][index % 5],
    customerNo: `C${String(index + 1).padStart(5, '0')}`,
    idCardNo: `11010119900101${String(index + 1).padStart(4, '0')}`,
    mobile: `1381000${String(index + 1).padStart(4, '0')}`,
    loanNo: `DK2024${String(index + 1).padStart(6, '0')}`,
    productName,
    productCode: `P${String((index % manualRepaymentProducts.length) + 1).padStart(4, '0')}`,
    loanAmount,
    loanBalance,
    startDate: formatDate(start),
    maturityDate: formatDate(maturity),
    nextRepaymentDate: formatDate(nextRepayment),
    repaymentMethod: ['等额本息', '等额本金', '先息后本'][index % 3],
    loanTerm: term,
    loanStatus,
    accountStatus: manualRepaymentAccountStatuses[index % manualRepaymentAccountStatuses.length],
    operator: ['系统管理员', '运营专员', '贷后专员'][index % 3],
    dueTotal,
    plans,
  };
});

export async function getManualRepayments(params: ManualRepaymentListParams): Promise<ApiResponse<ListData<ManualRepaymentRecord>>> {
  const contains = (value: unknown, source: string) => !String(value ?? '').trim() || source.toLowerCase().includes(String(value).trim().toLowerCase());
  const equals = (value: unknown, source: string) => !String(value ?? '').trim() || source.toLowerCase() === String(value).trim().toLowerCase();
  const filtered = manualRepaymentRecords.filter((item) =>
    contains(params.institutionName, item.institutionName) &&
    equals(params.customerNo, item.customerNo) &&
    equals(params.idCardNo, item.idCardNo) &&
    equals(params.mobile, item.mobile) &&
    contains(params.customerName, item.customerName) &&
    equals(params.loanNo, item.loanNo) &&
    (!params.loanStatus || item.loanStatus === params.loanStatus) &&
    (!params.accountStatus || item.accountStatus === params.accountStatus) &&
    contains(params.productName, item.productName),
  );
  return respond(paginate(filtered, params.page, params.pageSize));
}

function allocate(total: number, record: ManualRepaymentRecord): ManualRepaymentCalculation {
  const safeTotal = money(Math.max(0, total));
  const source = record.plans.reduce((summary, plan) => ({
    interest: summary.interest + plan.dueInterest,
    penalty: summary.penalty + plan.duePenalty,
    fee: summary.fee + plan.dueFee,
    adjustmentInterest: summary.adjustmentInterest + plan.adjustmentInterest,
  }), { interest: 0, penalty: 0, fee: 0, adjustmentInterest: 0 });
  let remaining = safeTotal;
  const fee = money(Math.min(remaining, source.fee)); remaining = money(remaining - fee);
  const penalty = money(Math.min(remaining, source.penalty)); remaining = money(remaining - penalty);
  const interest = money(Math.min(remaining, source.interest)); remaining = money(remaining - interest);
  const totalInterest = money(penalty + interest);
  const principal = money(Math.min(remaining, record.loanBalance));
  return {
    total: money(fee + totalInterest + principal),
    principal,
    totalInterest,
    interest,
    penalty,
    fee,
    feeDetail: fee ? `基础费用 ${fee.toFixed(2)} 元` : '无',
    adjustmentInterest: money(source.adjustmentInterest),
  };
}

export function calculateManualRepayment(record: ManualRepaymentRecord, settings: Partial<ManualRepaymentSettings>): ManualRepaymentCalculationResponse {
  const isPartial = settings.repaymentType === '提前部分还款';
  const due = allocate(record.dueTotal, record);
  const requestedActual = isPartial
    ? Math.max(0, Number(settings.partialPrincipal ?? 0)) + due.fee + due.totalInterest
    : Number(settings.actualAmount ?? record.dueTotal);
  const actual = allocate(Math.min(Math.max(0, requestedActual), record.loanBalance + due.totalInterest + due.fee), record);
  return { record, due, actual, plans: record.plans };
}

export async function getManualRepaymentCalculation(id: number, settings: Partial<ManualRepaymentSettings>): Promise<ApiResponse<ManualRepaymentCalculationResponse>> {
  const record = manualRepaymentRecords.find((item) => item.id === id) ?? manualRepaymentRecords[0];
  return respond(calculateManualRepayment(record, settings));
}

export async function submitManualRepayment(ids: number[], settings: Partial<ManualRepaymentSettings>): Promise<ApiResponse<null>> {
  await delay(null, 400, 700);
  if (!ids.length) return { code: 1, data: null, message: '请选择至少一笔借据' };
  if (!settings.repaymentType || !settings.accountType || !settings.accountNo || !settings.accountName) {
    return { code: 1, data: null, message: '请完善还款设置后再提交' };
  }
  return { code: 0, data: null, message: `${ids.length} 笔借据还款已提交` };
}

export { allocate as allocateManualRepayment };
