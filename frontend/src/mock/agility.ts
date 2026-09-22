import type { ApiResponse, AgilityApplication, AgilityFormValues, AgilityRepaymentScheme, ListData, RepaymentPlan } from '../types';
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
  productName?: string;
  loanStatus?: AgilityApplication['loanStatus'];
  accountStatus?: AgilityApplication['accountStatus'];
  maturityDate?: [Dayjs, Dayjs];
  applyTime?: [Dayjs, Dayjs];
  globalStatus?: AgilityApplication['globalStatus'];
  transactionStage?: AgilityApplication['transactionStage'];
  stageStatus?: AgilityApplication['stageStatus'];
}

export const agilityInstitutions = ['北京分行', '上海分行', '广州分行', '深圳分行'];
export const agilityProducts = ['个人经营贷', '个人消费贷', '住房按揭贷', '小微企业贷'];
export const agilityGlobalStatuses = ['初始化', '待处理', '成功', '失败', '处理中', '撤销', '过期'];
export const agilityTransactionStages = ['初始化阶段', '贷中阶段', '审批阶段', '核心申请阶段', '客户签约阶段'];
export const agilityStageStatuses = ['初始化成功', '初始化失败', '初始化中', '贷中通过', '贷中拒绝', '贷中处理中', '审批通过', '审批拒绝', '待审批', '待发起审批', '申请成功', '申请失败', '申请处理中', '待签约', '已签约', '签约处理中', '已失效'];
export const agilityLoanStatuses = ['正常', '逾期', '减值', '核销'];
const repaymentMethods = [
  '等额本息', '等额本金', '自定义还本还息', '等额本息气球贷', '等额本金气球贷',
  '自定义还本还息气球贷', '先息后本等额本息组合（10）', '先息后本等额本金组合（11）', '按月付息按计划还本（12）',
];

const stageStatusesByStage = [
  ['初始化成功', '初始化失败', '初始化中'],
  ['贷中通过', '贷中拒绝', '贷中处理中'],
  ['审批通过', '审批拒绝', '待审批', '待发起审批'],
  ['申请成功', '申请失败', '申请处理中'],
  ['待签约', '已签约', '签约处理中', '已失效'],
];

const respond = <T,>(data: T, message = 'success', code = 0): Promise<ApiResponse<T>> =>
  delay({ code, data, message }, 300, 800);

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const agilityApplications: AgilityApplication[] = Array.from({ length: 36 }, (_, index) => {
  const applyDate = new Date(2026, 0, 1 + index);
  const startDate = new Date(2023, index % 12, 1 + (index % 20));
  const maturityDate = new Date(2026, 4 + (index % 6), 10 + (index % 18));
  const nextRepaymentDate = new Date(maturityDate);
  nextRepaymentDate.setDate(nextRepaymentDate.getDate() - 30);
  const institutionName = agilityInstitutions[index % agilityInstitutions.length];
  const productName = agilityProducts[index % agilityProducts.length];
  const transactionStageIndex = index % agilityTransactionStages.length;
  const originalMethod = repaymentMethods[index % repaymentMethods.length];
  const newMethod = repaymentMethods[(index + 1) % repaymentMethods.length];
  return {
    id: index + 1,
    institutionName,
    institutionCode: `200${index % agilityInstitutions.length}`,
    productName,
    productCode: `PRD010${index % agilityProducts.length}`,
    customerName: ['张三', '李四', '王五', '赵六'][index % 4],
    customerNo: `C${String(index + 1).padStart(3, '0')}`,
    idCardNo: `11010119900101${String(index + 1).padStart(4, '0')}`,
    mobile: `1380000${String(index + 1).padStart(4, '0')}`,
    loanNo: `PJ2024${String(index + 1).padStart(4, '0')}`,
    loanAccount: `62220000${String(index + 1).padStart(10, '0')}`,
    currency: '人民币',
    startDate: formatDate(startDate),
    globalStatus: agilityGlobalStatuses[index % agilityGlobalStatuses.length] as AgilityApplication['globalStatus'],
    holoSerialNo: `GL2026${String(index + 1).padStart(4, '0')}`,
    applyTime: formatDate(applyDate),
    transactionStage: agilityTransactionStages[transactionStageIndex] as AgilityApplication['transactionStage'],
    stageStatus: stageStatusesByStage[transactionStageIndex][index % stageStatusesByStage[transactionStageIndex].length] as AgilityApplication['stageStatus'],
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
    interestReliefEnabled: index % 3 !== 1,
    firstPaymentDelayAllowed: index % 3 === 0,
    firstPaymentDelayMonths: index % 2 ? 0 : 3,
    repaymentCombination: '第1-12期·先息后本·本金比例0%\n第13-24期·先息后本·本金比例20%\n第25-36期·先息后本·本金比例80%',
    supportedRepayment: '等额本息（1-36期）、等额本金（1-36期）',
    expiryDate: `2026-${String((index % 8) + 5).padStart(2, '0')}-28`,
    signing: index % 3 === 0 ? '已签约' : '未签约',
    signingTime: index % 3 === 0 ? `2026-03-${String((index % 8) + 1).padStart(2, '0')}` : undefined,
    revokeTime: undefined,
    reason: index % 2 === 0 ? '优化还款安排，缓解阶段性还款压力' : '申请调整还款计划',
    statusRemark: index % 4 === 0 ? '等待客户确认' : '系统处理正常',
    applicationChannel: ['内管申请', 'nwa批量申请', 'nwa规则审批'][index % 3],
    applicantName: ['张三', '李四', '王五'][index % 3],
    applicantId: `U${String(index + 1).padStart(4, '0')}`,
    loanBalance: 120000 + index * 8500,
    loanAmount: 180000 + index * 12000,
    maturityDate: formatDate(maturityDate),
    nextRepaymentDate: formatDate(nextRepaymentDate),
    repaymentMethod: originalMethod,
    loanTerm: 24 + (index % 3) * 12,
    settledPeriods: index % 3,
    allowExceedMaxTerm: index % 2 === 0,
    loanStatus: agilityLoanStatuses[index % agilityLoanStatuses.length] as AgilityApplication['loanStatus'],
    accountStatus: '正常' as AgilityApplication['accountStatus'],
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
  const productName = String(params.productName ?? '').trim().toLowerCase();
  const maturityRange = Array.isArray(params.maturityDate) ? params.maturityDate : [];
  const maturityFrom = toDate(maturityRange[0]);
  const maturityTo = toDate(maturityRange[1]);
  const range = Array.isArray(params.applyTime) ? params.applyTime : [];
  const from = toDate(range[0]);
  const to = toDate(range[1]);
  const filtered = agilityApplications.filter((item) =>
    (!institutionName || item.institutionName.toLowerCase().includes(institutionName)) &&
    (!institutionCode || item.institutionCode.toLowerCase() === institutionCode) &&
    (!customerNo || item.customerNo.toLowerCase() === customerNo) &&
    (!idCardNo || item.idCardNo.toLowerCase() === idCardNo) &&
    (!mobile || item.mobile.toLowerCase() === mobile) &&
    (!loanNo || item.loanNo.toLowerCase() === loanNo) &&
    (!productName || item.productName.toLowerCase().includes(productName)) &&
    (!params.loanStatus || item.loanStatus === params.loanStatus) &&
    (!params.accountStatus || item.accountStatus === params.accountStatus) &&
    (!params.globalStatus || item.globalStatus === params.globalStatus) &&
    (!params.transactionStage || item.transactionStage === params.transactionStage) &&
    (!params.stageStatus || item.stageStatus === params.stageStatus) &&
    (!maturityFrom || item.maturityDate >= maturityFrom) && (!maturityTo || item.maturityDate <= maturityTo) &&
    (!from || item.applyTime >= from) && (!to || item.applyTime <= to),
  );
  return respond(paginate(filtered, Number(params.page), Number(params.pageSize)));
}

export async function getAgilityApplication(id: number): Promise<ApiResponse<AgilityApplication>> {
  const item = agilityApplications.find((application) => application.id === id) ?? agilityApplications[0];
  return respond(item);
}

const combinationModeLabels: Record<'10' | '11' | '12', string> = {
  '10': '等额本息（10）',
  '11': '等额本金（11）',
  '12': '先息后本（2）',
};

function configuredScheme(code: '10' | '11' | '12', originalTerm: number, newTerm: number, planSeq: number): AgilityRepaymentScheme {
  const split = Math.max(1, Math.floor(newTerm / 3));
  const secondStart = split + 1;
  const secondEnd = Math.floor(newTerm * 2 / 3);
  const mode = combinationModeLabels[code];
  const stages = newTerm === 1
    ? [{ sequence: 1, startPeriod: 1, endPeriod: 1, repaymentMethod: mode, principalRatio: 100 }]
    : planSeq === 1
      ? [
        { sequence: 1, startPeriod: 1, endPeriod: split, repaymentMethod: '先息后本（2）', principalRatio: 0 },
        { sequence: 2, startPeriod: secondStart, endPeriod: newTerm, repaymentMethod: mode, principalRatio: 100 },
      ]
      : newTerm === 2
        ? [
          { sequence: 1, startPeriod: 1, endPeriod: 1, repaymentMethod: '先息后本（2）', principalRatio: 0 },
          { sequence: 2, startPeriod: 2, endPeriod: 2, repaymentMethod: mode, principalRatio: 100 },
        ]
        : [
          { sequence: 1, startPeriod: 1, endPeriod: split, repaymentMethod: '先息后本（2）', principalRatio: 0 },
          { sequence: 2, startPeriod: secondStart, endPeriod: secondEnd, repaymentMethod: mode, principalRatio: 40 },
          { sequence: 3, startPeriod: secondEnd + 1, endPeriod: newTerm, repaymentMethod: mode, principalRatio: 60 },
        ];
  return { id: `${code}-${originalTerm}-${newTerm}-${planSeq}`, name: `方案${String.fromCharCode(64 + planSeq)}`, stages };
}

export async function getAgilityRepaymentSchemes(
  code: '10' | '11' | '12',
  originalRemainingTerm: number,
  newRemainingTerm: number,
): Promise<ApiResponse<AgilityRepaymentScheme[]>> {
  const originalTerm = Math.max(1, Number(originalRemainingTerm) || 1);
  const newTerm = Math.max(1, Number(newRemainingTerm) || 1);
  const schemes = [
    configuredScheme(code, originalTerm, newTerm, 1),
    configuredScheme(code, originalTerm, newTerm, 2),
    { id: 'custom', name: '其他（自定义还款方案）', stages: [], custom: true },
  ];
  return respond(schemes);
}

export function displayAgilityRepaymentMethod(value: string) {
  return value.replace(/[（(]\d+[）)]$/, '');
}

export function formatAgilitySchemeSummary(scheme: AgilityRepaymentScheme) {
  return scheme.stages
    .map((stage) => `${stage.startPeriod}-${stage.endPeriod}期 ${displayAgilityRepaymentMethod(stage.repaymentMethod)} ${stage.principalRatio}%`)
    .join('  ');
}

export async function calculateAgilityPlan(id: number, values: AgilityFormValues): Promise<ApiResponse<RepaymentPlan[]>> {
  const loan = agilityApplications.find((item) => item.id === id) ?? agilityApplications[0];
  const remainingTerm = Number(values.newRemainingTerm);
  if (!Number.isInteger(remainingTerm) || remainingTerm < 1) {
    return respond([], '请输入正整数的新剩余期数。', 1);
  }
  const totalTerm = loan.settledPeriods + remainingTerm;
  const principalPerPeriod = loan.loanBalance / totalTerm;
  const monthlyInterest = loan.loanBalance * (Number(values.newNormalRate ?? loan.newNormalRate) / 100) / 12;
  const plans: RepaymentPlan[] = Array.from({ length: totalTerm }, (_, index) => {
    const start = new Date(2026, 5, 1 + index * 30);
    const due = new Date(start);
    due.setDate(due.getDate() + 29);
    const principal = index === totalTerm - 1 ? loan.loanBalance - principalPerPeriod * index : principalPerPeriod;
    const settled = index < loan.settledPeriods;
    const paidPrincipal = settled ? principal : 0;
    const paidInterest = settled ? monthlyInterest : 0;
    const dueInterest = monthlyInterest;
    return {
      period: index + 1,
      startDate: formatDate(start),
      dueDate: formatDate(due),
      status: settled ? '结清' : '正常',
      initialTotal: Math.round((principal + dueInterest) * 100) / 100,
      initialPrincipal: Math.round(principal * 100) / 100,
      initialInterest: Math.round(dueInterest * 100) / 100,
      remainingPrincipal: Math.max(0, Math.round((loan.loanBalance - principalPerPeriod * (index + 1)) * 100) / 100),
      paidAmount: Math.round((paidPrincipal + paidInterest) * 100) / 100,
      paidPrincipal: Math.round(paidPrincipal * 100) / 100,
      paidInterest: Math.round(paidInterest * 100) / 100,
      dueAmount: Math.round((principal + dueInterest) * 100) / 100,
      duePrincipal: Math.round(principal * 100) / 100,
      dueInterest: Math.round(dueInterest * 100) / 100,
      adjustmentInterest: -Math.max(0.01, Math.round(dueInterest * 0.1 * 100) / 100),
    };
  });
  return respond(plans);
}

export async function submitAgilityApplication(id: number, values: AgilityFormValues): Promise<ApiResponse<null>> {
  await delay(null, 400, 700);
  const loan = agilityApplications.find((item) => item.id === id) ?? agilityApplications[0];
  const totalTerm = loan.settledPeriods + Number(values.newRemainingTerm);
  if (totalTerm > loan.maxTerm && !loan.allowExceedMaxTerm) {
    return { code: 1, data: null, message: `新还款计划总期数（${totalTerm}期）超过产品最长贷款期限（${loan.maxTerm}期），请调整后再提交` };
  }
  return { code: 0, data: null, message: `调整申请 ${id} 已提交审批` };
}

export async function revokeAgilityApplication(id: number): Promise<ApiResponse<null>> {
  await delay(null, 300, 600);
  const application = agilityApplications.find((item) => item.id === id);
  if (application) {
    application.globalStatus = '撤销';
    application.revokeTime = formatDate(new Date());
  }
  return { code: 0, data: null, message: `调整申请 ${id} 已撤销` };
}
