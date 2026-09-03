import type { ApiResponse, AgilityApplication, AgilityFormValues, ListData, RepaymentPlan } from '../types';
import { delay } from '../utils';
import type { Dayjs } from 'dayjs';

export interface AgilityListParams {
  page: number;
  pageSize: number;
  institutionName?: string;
  institutionCode?: string;
  customerNo?: string;
  idCardNo?: string;
  mobile?: string;
  loanNo?: string;
  loanStatus?: string;
  accountStatus?: string;
  maturityDate?: [Dayjs, Dayjs];
  applyTime?: [Dayjs, Dayjs];
  globalStatus?: string;
  transactionStage?: string;
  stageStatus?: string;
  productName?: string;
}

const repaymentMethods = [
  '等额本息', '等额本金', '自定义还本还息', '等额本息气球贷', '等额本金气球贷',
  '自定义还本还息气球贷', '先息后本等额本息组合', '先息后本等额本金组合', '按月付息按计划还本',
];
const stages = ['初始化成功', '贷中拒绝', '审批通过', '核心申请阶段'] as const;
const stageStatuses = ['初始化失败', '贷中拒绝', '审批通过', '申请成功'] as const;
const statuses = ['初始化', '待处理', '成功', '失败'] as const;
const loanStatuses = ['正常', '逾期', '结清'] as const;
const accountStatuses = ['正常', '关注', '冻结'] as const;

const respond = <T,>(data: T, message = 'success', code = 0): Promise<ApiResponse<T>> =>
  delay({ code, data, message }, 300, 800);

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const agilityApplications: AgilityApplication[] = Array.from({ length: 36 }, (_, index) => {
  const date = new Date(2026, 0, 1 + index);
  const originalMethod = repaymentMethods[index % repaymentMethods.length];
  const newMethod = repaymentMethods[(index + 1) % repaymentMethods.length];
  const status = statuses[index % statuses.length];
  const maturityDate = new Date(2026, 4 + (index % 6), 10 + (index % 18));
  const nextRepaymentDate = new Date(maturityDate);
  nextRepaymentDate.setDate(nextRepaymentDate.getDate() - 30);
  return {
    id: index + 1,
    institutionName: ['北京分行', '上海分行', '广州分行', '深圳分行'][index % 4],
    institutionCode: `200${index % 4}`,
    productName: ['个人经营贷', '个人消费贷', '住房按揭贷', '小微企业贷'][index % 4],
    productCode: `PRD010${index % 4}`,
    customerName: ['张三', '李四', '王五', '赵六'][index % 4],
    customerNo: `C${String(index + 1).padStart(3, '0')}`,
    idCardNo: `11010119900101${String(index + 1).padStart(2, '02')}`,
    mobile: `1380000${String(index + 1).padStart(4, '0')}`,
    loanNo: `PJ2024${String(index + 1).padStart(4, '03')}`,
    globalStatus: status,
    holoSerialNo: `GL2026${String(index + 1).padStart(4, '0')}`,
    applyTime: formatDate(date),
    transactionStage: stages[index % stages.length],
    stageStatus: stageStatuses[index % stageStatuses.length],
    originalRepaymentMethod: originalMethod,
    newRepaymentMethod: newMethod,
    originalTotalTerm: 36 + (index % 4) * 12,
    newTotalTerm: 14 + (index % 5) * 7,
    originalRemainingTerm: 30 + (index % 5) * 4,
    newRemainingTerm: 14 + (index % 5) * 7,
    originalNormalRate: 4.35 + (index % 3) * 0.2,
    newNormalRate: 4.1 + (index % 3) * 0.2,
    originalPenaltyRate: 6.525 + (index % 3) * 0.3,
    newPenaltyRate: 6.1 + (index % 3) * 0.3,
    originalCompoundRate: 8.7 + (index % 3) * 0.4,
    newCompoundRate: 8.2 + (index % 3) * 0.4,
    interestRelief: (index % 2 ? '否' : '是') as AgilityApplication['interestRelief'],
    firstPaymentDelayMonths: index % 2 ? 0 : 3,
    repaymentCombination: '第1-12期·先息后本·本金比例0%\n第13-24期·先息后本·本金比例20%\n第25-36期·先息后本·本金比例80%',
    supportedRepayment: '等额本息（1-36期）、等额本金（1-36期）',
    expiryDate: `2026-${String((index % 8) + 5).padStart(2, '0')}-28`,
    signing: index % 3 === 0 ? '已签约' : '未签约',
    loanBalance: 120000 + index * 8500,
    loanAmount: 180000 + index * 12000,
    maturityDate: formatDate(maturityDate),
    nextRepaymentDate: formatDate(nextRepaymentDate),
    repaymentMethod: originalMethod,
    loanTerm: 24 + (index % 3) * 12,
    loanStatus: loanStatuses[index % loanStatuses.length],
    accountStatus: accountStatuses[index % accountStatuses.length],
    maxTerm: index % 3 === 0 ? 36 : 48,
    attachmentName: index % 2 === 0 ? `调整材料${index + 1}.zip` : undefined,
  };
}).sort((a, b) => b.applyTime.localeCompare(a.applyTime));

function paginate<T>(items: T[], page: number, pageSize: number): ListData<T> {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return { list: items.slice(start, start + pageSize), total: items.length, page: safePage, pagesize: pageSize };
}

function toDate(value: unknown) {
  if (!value || typeof value !== 'object' || !('format' in value)) return '';
  return String((value as { format: (format: string) => string }).format('YYYY-MM-DD'));
}

export async function getAgilityApplications(params: AgilityListParams): Promise<ApiResponse<ListData<AgilityApplication>>> {
  const institutionName = String(params.institutionName ?? '').trim().toLowerCase();
  const institutionCode = String(params.institutionCode ?? '').trim().toLowerCase();
  const customerNo = String(params.customerNo ?? '').trim().toLowerCase();
  const idCardNo = String(params.idCardNo ?? '').trim().toLowerCase();
  const mobile = String(params.mobile ?? '').trim().toLowerCase();
  const loanNo = String(params.loanNo ?? '').trim().toLowerCase();
  const loanStatus = String(params.loanStatus ?? '');
  const accountStatus = String(params.accountStatus ?? '');
  const globalStatus = String(params.globalStatus ?? '');
  const transactionStage = String(params.transactionStage ?? '');
  const stageStatus = String(params.stageStatus ?? '');
  const productName = String(params.productName ?? '').trim().toLowerCase();
  const range = Array.isArray(params.applyTime) ? params.applyTime : [];
  const from = toDate(range[0]);
  const to = toDate(range[1]);
  const maturityRange = Array.isArray(params.maturityDate) ? params.maturityDate : [];
  const maturityFrom = toDate(maturityRange[0]);
  const maturityTo = toDate(maturityRange[1]);
  const filtered = agilityApplications.filter((item) =>
    (!institutionName || item.institutionName.toLowerCase().includes(institutionName)) &&
    (!institutionCode || item.institutionCode.toLowerCase() === institutionCode) &&
    (!customerNo || item.customerNo.toLowerCase() === customerNo) &&
    (!idCardNo || item.idCardNo.toLowerCase() === idCardNo) &&
    (!mobile || item.mobile.toLowerCase() === mobile) &&
    (!loanNo || item.loanNo.toLowerCase() === loanNo) &&
    (!loanStatus || item.loanStatus === loanStatus) &&
    (!accountStatus || item.accountStatus === accountStatus) &&
    (!globalStatus || item.globalStatus === globalStatus) &&
    (!transactionStage || item.transactionStage === transactionStage) &&
    (!stageStatus || item.stageStatus === stageStatus) &&
    (!productName || item.productName.toLowerCase().includes(productName)) &&
    (!from || item.applyTime >= from) && (!to || item.applyTime <= to) &&
    (!maturityFrom || item.maturityDate >= maturityFrom) && (!maturityTo || item.maturityDate <= maturityTo),
  );
  return respond(paginate(filtered, Number(params.page), Number(params.pageSize)));
}

export async function getAgilityApplication(id: number): Promise<ApiResponse<AgilityApplication>> {
  const item = agilityApplications.find((application) => application.id === id) ?? agilityApplications[0];
  return respond(item);
}

export async function calculateAgilityPlan(id: number, values: AgilityFormValues): Promise<ApiResponse<RepaymentPlan[]>> {
  const loan = agilityApplications.find((item) => item.id === id) ?? agilityApplications[0];
  const term = Number(values.newRemainingTerm);
  if (!Number.isInteger(term) || term < 1) {
    return respond([], '请输入正整数的新剩余期数。', 1);
  }
  if (term > loan.maxTerm) {
    return respond([], `借据新还款计划总期数（${term}期）已超过产品要求的最长还款期限（${loan.maxTerm}期）。`, 1);
  }
  const monthlyPrincipal = loan.loanBalance / term;
  const monthlyInterest = loan.loanBalance * (Number(values.newNormalRate || loan.newNormalRate) / 100) / 12;
  const plans: RepaymentPlan[] = Array.from({ length: term }, (_, index) => {
    const start = new Date(2026, 5, 1 + index * 30);
    const due = new Date(start);
    due.setDate(due.getDate() + 29);
    const principal = index === term - 1 ? loan.loanBalance - monthlyPrincipal * index : monthlyPrincipal;
    return {
      period: index + 1,
      startDate: formatDate(start),
      dueDate: formatDate(due),
      status: index < 2 ? '结清' : '待还',
      initialTotal: Math.round((principal + monthlyInterest) * 100) / 100,
      initialPrincipal: Math.round(principal * 100) / 100,
      initialInterest: Math.round(monthlyInterest * 100) / 100,
      remainingPrincipal: Math.max(0, Math.round((loan.loanBalance - monthlyPrincipal * (index + 1)) * 100) / 100),
      paidAmount: index < 2 ? Math.round((principal + monthlyInterest) * 100) / 100 : 0,
    };
  });
  return respond(plans);
}

export async function submitAgilityApplication(id: number, _values: AgilityFormValues): Promise<ApiResponse<null>> {
  await delay(null, 400, 700);
  return { code: 0, data: null, message: `调整申请 ${id} 已提交审批` };
}

export async function revokeAgilityApplication(id: number): Promise<ApiResponse<null>> {
  await delay(null, 300, 600);
  const application = agilityApplications.find((item) => item.id === id);
  if (application) application.globalStatus = '失败';
  return { code: 0, data: null, message: `调整申请 ${id} 已撤销` };
}
