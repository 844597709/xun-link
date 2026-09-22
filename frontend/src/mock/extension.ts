import type {
  ApiResponse,
  ExtensionAdjustmentType,
  ExtensionApplication,
  ExtensionApplicationStatus,
  ExtensionDetail,
  ExtensionGlobalStatus,
  ExtensionHistory,
  ExtensionListParams,
  ExtensionLoan,
  ExtensionRepaymentPlan,
  ListData,
} from '../types';
import { delay } from '../utils';

export type { ExtensionListParams };

export const extensionInstitutions = ['北京分行', '上海分行', '广州分行', '深圳分行'];
export const extensionProducts = ['个人经营贷', '个人消费贷', '住房按揭贷', '小微企业贷'];
export const extensionLoanStatuses: ExtensionLoan['loanStatus'][] = ['正常', '逾期', '结清', '核销'];
export const extensionApplicationStatuses: ExtensionApplicationStatus[] = ['待处理', '处理中', '已生效', '已失效', '已驳回'];
export const extensionGlobalStatuses: ExtensionGlobalStatus[] = ['初始化', '待审核', '处理中', '成功', '失败', '撤销中', '已撤销'];
export const extensionAdjustmentTypes: ExtensionAdjustmentType[] = ['延展', '摊薄'];

const respond = <T,>(data: T, message = 'success', code = 0): Promise<ApiResponse<T>> =>
  delay({ code, data, message }, 300, 800);

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addMonths(value: string, months: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setMonth(date.getMonth() + months);
  return formatDate(date);
}

function paginate<T>(items: T[], page: number, pageSize: number): ListData<T> {
  const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
  const safePageSize = Number.isFinite(pageSize) ? Math.max(1, pageSize) : 10;
  return {
    list: items.slice((safePage - 1) * safePageSize, safePage * safePageSize),
    total: items.length,
    page: safePage,
    pagesize: safePageSize,
  };
}

export const extensionLoans: ExtensionLoan[] = Array.from({ length: 32 }, (_, index) => {
  const institutionIndex = index % extensionInstitutions.length;
  const productIndex = index % extensionProducts.length;
  const loanTerm = 24 + (index % 3) * 12;
  const settledPeriods = index % 4;
  const remainingTerm = loanTerm - settledPeriods;
  const loanAmount = 80000 + index * 9000;
  const loanBalance = Math.max(12000, loanAmount - 6000 - index * 1800);
  return {
    id: index + 1,
    institutionName: extensionInstitutions[institutionIndex],
    institutionCode: `20${String(institutionIndex + 1).padStart(2, '0')}`,
    customerName: ['张三', '李四', '王五', '赵六'][index % 4],
    customerNo: `EX${String(index + 1).padStart(5, '0')}`,
    idCardNo: `11010119900101${String(index + 1).padStart(4, '0')}`,
    mobile: `1382000${String(index + 1).padStart(4, '0')}`,
    loanNo: `EX2024${String(index + 1).padStart(5, '0')}`,
    productName: extensionProducts[productIndex],
    productCode: `EXP${String(productIndex + 1).padStart(3, '0')}`,
    loanAmount,
    loanBalance,
    startDate: `2024-${String((index % 8) + 1).padStart(2, '0')}-15`,
    maturityDate: `2027-${String((index % 8) + 1).padStart(2, '0')}-15`,
    nextRepaymentDate: `2026-${String((index % 8) + 1).padStart(2, '0')}-15`,
    repaymentMethod: ['等额本息', '等额本金', '先息后本'][index % 3],
    loanTerm,
    remainingTerm,
    settledPeriods,
    loanStatus: extensionLoanStatuses[index % extensionLoanStatuses.length],
    accountStatus: index % 7 === 0 ? '冻结' : '正常',
    repaymentProgress: Math.min(100, Math.round(((settledPeriods + index % 8) / loanTerm) * 100)),
    attachmentName: index % 2 === 0 ? `延展期材料${index + 1}.zip` : undefined,
    maxThinningMonths: 12,
    maxTerm: index % 3 === 0 ? loanTerm : loanTerm + 2,
    allowExceedMaxTerm: index % 2 === 0,
  };
});

export const extensionHistories: ExtensionHistory[] = extensionLoans.flatMap((loan, index) => {
  const count = index % 3;
  return Array.from({ length: count }, (_, historyIndex) => {
    const months = historyIndex + 1;
    const type: ExtensionAdjustmentType = historyIndex % 2 === 0 ? '延展' : '摊薄';
    const newTotalTerm = type === '延展' ? loan.loanTerm + months : loan.loanTerm - months;
    const applicationDate = `2025-${String((index + historyIndex) % 9 + 1).padStart(2, '0')}-${String((index + 3) % 25 + 1).padStart(2, '0')}`;
    return {
      id: loan.id * 10 + historyIndex + 1,
      loanId: loan.id,
      applicationId: `EXT-${loan.id}-${historyIndex + 1}`,
      applicationDate,
      signingTime: addMonths(applicationDate, 1),
      expiryDate: addMonths(applicationDate, 13),
      adjustmentType: type,
      adjustmentMonths: months,
      originalTotalTerm: loan.loanTerm,
      newTotalTerm,
      originalMaturityDate: loan.maturityDate,
      newMaturityDate: addMonths(loan.maturityDate, type === '延展' ? months : -months),
    };
  });
});

export async function getExtensionLoans(params: ExtensionListParams): Promise<ApiResponse<ListData<ExtensionLoan>>> {
  const institutionName = String(params.institutionName ?? '').trim().toLowerCase();
  const customerNo = String(params.customerNo ?? '').trim().toLowerCase();
  const idCardNo = String(params.idCardNo ?? '').trim().toLowerCase();
  const mobile = String(params.mobile ?? '').trim().toLowerCase();
  const loanNo = String(params.loanNo ?? '').trim().toLowerCase();
  const productName = String(params.productName ?? '').trim().toLowerCase();
  const filtered = extensionLoans.filter((item) =>
    (!institutionName || item.institutionName.toLowerCase().includes(institutionName)) &&
    (!customerNo || item.customerNo.toLowerCase() === customerNo) &&
    (!idCardNo || item.idCardNo.toLowerCase() === idCardNo) &&
    (!mobile || item.mobile.toLowerCase() === mobile) &&
    (!loanNo || item.loanNo.toLowerCase() === loanNo) &&
    (!productName || item.productName.toLowerCase().includes(productName)),
  );
  return respond(paginate(filtered, Number(params.page), Number(params.pageSize)));
}

export async function getExtensionLoan(id: number): Promise<ApiResponse<ExtensionLoan>> {
  return respond(extensionLoans.find((item) => item.id === id) ?? extensionLoans[0]);
}

export async function getExtensionHistory(id: number): Promise<ApiResponse<ExtensionHistory[]>> {
  return respond(extensionHistories.filter((item) => item.loanId === id));
}

export async function calculateExtensionPlan(
  id: number,
  adjustmentType: ExtensionAdjustmentType,
  adjustmentMonths: number,
): Promise<ApiResponse<ExtensionRepaymentPlan[]>> {
  const loan = extensionLoans.find((item) => item.id === id) ?? extensionLoans[0];
  if (!Number.isInteger(adjustmentMonths) || adjustmentMonths < 1) return respond([], '调整月数必须是大于等于1的整数。', 1);
  if (adjustmentType === '摊薄' && adjustmentMonths > loan.maxThinningMonths) return respond([], `摊薄月数不能超过${loan.maxThinningMonths}个月。`, 1);
  const futureTerm = adjustmentType === '延展'
    ? loan.remainingTerm + adjustmentMonths
    : Math.max(1, loan.remainingTerm - adjustmentMonths);
  const totalTerm = loan.settledPeriods + futureTerm;
  const monthlyInterest = loan.loanBalance * 0.0435 / 12;
  const principalPerPeriod = loan.loanBalance / futureTerm;
  return respond(Array.from({ length: totalTerm }, (_, index) => {
    const settled = index < loan.settledPeriods;
    const periodPrincipal = settled ? 0 : (index - loan.settledPeriods === futureTerm - 1
      ? loan.loanBalance - principalPerPeriod * (futureTerm - 1)
      : principalPerPeriod);
    const interest = settled ? 0 : monthlyInterest;
    const dueDate = addMonths(loan.nextRepaymentDate, index - loan.settledPeriods);
    return {
      period: index + 1,
      startDate: addMonths(loan.nextRepaymentDate, index - loan.settledPeriods - 1),
      dueDate,
      status: settled ? '结清' : '待还',
      initialTotal: Math.round((periodPrincipal + interest) * 100) / 100,
      initialPrincipal: Math.round(periodPrincipal * 100) / 100,
      initialInterest: Math.round(interest * 100) / 100,
      remainingPrincipal: Math.max(0, Math.round((loan.loanBalance - (settled ? 0 : periodPrincipal * (index - loan.settledPeriods + 1))) * 100) / 100),
    };
  }));
}

export async function submitExtensionApplication(application: ExtensionApplication): Promise<ApiResponse<null>> {
  if (!Number.isInteger(application.adjustmentMonths) || application.adjustmentMonths < 1) return respond(null, '调整月数必须是大于等于1的整数。', 1);
  const loan = extensionLoans.find((item) => item.id === application.loanId) ?? extensionLoans[0];
  if (application.adjustmentType === '摊薄' && application.adjustmentMonths > loan.maxThinningMonths) return respond(null, `摊薄月数不能超过${loan.maxThinningMonths}个月。`, 1);
  const totalTerm = loan.settledPeriods + (application.adjustmentType === '延展'
    ? loan.remainingTerm + application.adjustmentMonths
    : Math.max(1, loan.remainingTerm - application.adjustmentMonths));
  if (totalTerm > loan.maxTerm && !application.allowExceedMaxTerm) return respond(null, `借款调整计划总期数（${totalTerm}期）已超过产品最长的贷款期限（${loan.maxTerm}期），调整后重新提交`, 1);
  return respond(null, `借据${loan.loanNo}的${application.adjustmentType}申请已提交。`);
}

function toDetail(loan: ExtensionLoan, index: number): ExtensionDetail {
  const globalStatus = extensionGlobalStatuses[index % extensionGlobalStatuses.length];
  const adjustmentType: ExtensionAdjustmentType = index % 2 === 0 ? '延展' : '摊薄';
  const adjustmentMonths = index % 4 + 1;
  const newTotalTerm = adjustmentType === '延展' ? loan.loanTerm + adjustmentMonths : Math.max(1, loan.loanTerm - adjustmentMonths);
  const applicationId = `EXT-${String(index + 1).padStart(6, '0')}`;
  return {
    id: loan.id,
    loanId: loan.id,
    institutionName: loan.institutionName,
    institutionCode: loan.institutionCode,
    customerName: loan.customerName,
    customerNo: loan.customerNo,
    loanNo: loan.loanNo,
    globalSerialNo: `GLB2026${String(index + 1).padStart(8, '0')}`,
    globalStatus,
    transactionStage: (['初始化阶段', '审批阶段', '客户签约阶段', '核心申请阶段'] as const)[index % 4],
    stageStatus: globalStatus === '成功' ? '已完成' : globalStatus === '失败' ? '已拒绝' : globalStatus === '已撤销' ? '已撤销' : globalStatus === '待审核' ? '待审核' : '处理中',
    applicationDate: `2026-${String(index % 6 + 1).padStart(2, '0')}-${String(index % 25 + 1).padStart(2, '0')}`,
    originalRepaymentMethod: loan.repaymentMethod,
    newRepaymentMethod: adjustmentType === '延展' ? loan.repaymentMethod : '等额本金',
    originalRemainingTerm: loan.remainingTerm,
    newRemainingTerm: adjustmentType === '延展' ? loan.remainingTerm + adjustmentMonths : Math.max(1, loan.remainingTerm - adjustmentMonths),
    originalTotalTerm: loan.loanTerm,
    newTotalTerm,
    expiryDate: `2027-${String(index % 8 + 1).padStart(2, '0')}-28`,
    signingTime: globalStatus === '失败' || globalStatus === '待审核' ? undefined : `2026-${String(index % 6 + 1).padStart(2, '0')}-18`,
    revokeTime: globalStatus === '已撤销' ? `2026-${String(index % 6 + 2).padStart(2, '0')}-02` : undefined,
    reason: index % 2 === 0 ? '客户阶段性经营困难，申请优化还款安排' : '调整还款频次，降低当期还款压力',
    statusRemark: globalStatus === '失败' ? '核心系统处理失败' : globalStatus === '处理中' ? '等待核心系统处理' : globalStatus === '成功' ? '系统处理成功' : '流程待处理',
    applicationChannel: (['内管申请', '客户申请', '批量导入'] as const)[index % 3],
    applicantName: ['张三', '李四', '王五'][index % 3],
    applicantId: `APPLICANT-${String(index + 1).padStart(4, '0')}`,
    applicationId,
    videoSignAvailable: index % 2 === 0,
    attachmentName: index % 2 === 0 ? `延展期明细材料${index + 1}.zip` : undefined,
  };
}

export const extensionDetails: ExtensionDetail[] = extensionLoans.map(toDetail);

export async function getExtensionDetails(params: ExtensionListParams): Promise<ApiResponse<ListData<ExtensionDetail>>> {
  const institutionName = String(params.institutionName ?? '').trim().toLowerCase();
  const customerNo = String(params.customerNo ?? '').trim().toLowerCase();
  const idCardNo = String(params.idCardNo ?? '').trim().toLowerCase();
  const mobile = String(params.mobile ?? '').trim().toLowerCase();
  const loanNo = String(params.loanNo ?? '').trim().toLowerCase();
  const productName = String(params.productName ?? '').trim().toLowerCase();
  const filtered = extensionDetails.filter((item) => {
    const loan = extensionLoans.find((entry) => entry.id === item.loanId);
    return (!institutionName || item.institutionName.toLowerCase().includes(institutionName)) &&
      (!customerNo || item.customerNo.toLowerCase() === customerNo) &&
      (!idCardNo || loan?.idCardNo.toLowerCase() === idCardNo) &&
      (!mobile || loan?.mobile.toLowerCase() === mobile) &&
      (!loanNo || item.loanNo.toLowerCase() === loanNo) &&
      (!productName || loan?.productName.toLowerCase().includes(productName)) &&
      (!params.globalStatus || item.globalStatus === params.globalStatus);
  });
  return respond(paginate(filtered, Number(params.page), Number(params.pageSize)));
}

export async function revokeExtensionDetail(id: number): Promise<ApiResponse<null>> {
  const detail = extensionDetails.find((item) => item.id === id);
  if (!detail) return respond(null, '延展期单据不存在。', 1);
  if (detail.globalStatus === '成功' || detail.globalStatus === '失败') return respond(null, '成功或失败状态的单据不可撤销。', 1);
  detail.globalStatus = '已撤销';
  detail.transactionStage = '核心申请阶段';
  detail.stageStatus = '已撤销';
  detail.statusRemark = '已人工撤销';
  detail.revokeTime = formatDate(new Date());
  return respond(null, `延展期单据${id}已撤销。`);
}

export async function deleteExtensionDetail(id: number): Promise<ApiResponse<null>> {
  return respond(null, `延展期单据${id}已删除。`);
}
