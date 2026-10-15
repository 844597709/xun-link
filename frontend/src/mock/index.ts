import type { ApiResponse, Article, BusinessRecord, Category, ListData, Role, User } from '../types';
import { getApprovalRecords, claimApproval, approvalRecords } from './approval';

export { getApprovalRecords, claimApproval, approvalRecords };
import { delay } from '../utils';

export type { CrossYearBusinessEntry, CrossYearPolicyYearState, CrossYearScheme, CrossYearSchemeId, CrossYearPolicyYear, CrossYearAgreementStatus } from '../types/crossYearInterest';
export { crossYearBusinessEntries, crossYearSchemes, crossYearYears, findCrossYearYear } from './crossYearInterest';

export interface ListParams {
  page: number;
  pageSize: number;
  [key: string]: unknown;
}

const roles = ['管理员', '运营专员', '审核专员', '客服专员'];
const statuses = ['启用', '停用'] as const;
const businessStatuses = ['待处理', '处理中', '已完成', '已驳回'] as const;

const respond = <T,>(data: T): Promise<ApiResponse<T>> =>
  delay({ code: 0, data, message: 'success' }, 300, 500);

function paginate<T>(items: T[], page: number, pageSize: number): ListData<T> {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return { list: items.slice(start, start + pageSize), total: items.length, page: safePage, pagesize: pageSize };
}

export const users: User[] = Array.from({ length: 24 }, (_, index) => ({
  id: index + 1,
  username: `user${String(index + 1).padStart(2, '0')}`,
  email: `user${index + 1}@xun-link.test`,
  role: roles[index % roles.length],
  status: statuses[index % statuses.length],
  createdAt: `2026-${String((index % 8) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
}));

export const roleList: Role[] = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  name: roles[index % roles.length],
  description: `${roles[index % roles.length]}角色权限组`,
  userCount: 6 + index * 2,
  status: statuses[index % statuses.length],
}));

export const articles: Article[] = Array.from({ length: 24 }, (_, index) => ({
  id: index + 1,
  title: `信贷服务运营资讯第 ${index + 1} 期`,
  category: ['业务公告', '产品动态', '帮助中心'][index % 3],
  author: ['运营中心', '产品中心', '客户服务'][index % 3],
  status: index % 4 === 0 ? '草稿' : '已发布',
  createdAt: `2026-${String((index % 8) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
}));

export const categories: Category[] = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  name: ['业务公告', '产品动态', '帮助中心'][index % 3] + (index > 2 ? ` ${Math.ceil(index / 3)}` : ''),
  parentName: index % 3 === 0 ? '顶级分类' : ['业务公告', '产品动态', '帮助中心'][index % 3],
  sort: index + 1,
  status: statuses[index % statuses.length],
}));

export async function getUsers(params: ListParams): Promise<ApiResponse<ListData<User>>> {
  const username = String(params.username ?? '').trim().toLowerCase();
  const role = String(params.role ?? '');
  const status = String(params.status ?? '');
  const filtered = users.filter((item) =>
    (!username || item.username.toLowerCase().includes(username)) &&
    (!role || item.role === role) &&
    (!status || item.status === status),
  );
  return respond(paginate(filtered, Number(params.page), Number(params.pageSize)));
}

export async function getRoles(params: ListParams): Promise<ApiResponse<ListData<Role>>> {
  const name = String(params.name ?? '').trim().toLowerCase();
  const status = String(params.status ?? '');
  const filtered = roleList.filter((item) =>
    (!name || item.name.toLowerCase().includes(name)) && (!status || item.status === status),
  );
  return respond(paginate(filtered, Number(params.page), Number(params.pageSize)));
}

export async function getArticles(params: ListParams): Promise<ApiResponse<ListData<Article>>> {
  const title = String(params.title ?? '').trim().toLowerCase();
  const category = String(params.category ?? '');
  const status = String(params.status ?? '');
  const range = Array.isArray(params.createdAt) ? params.createdAt : [];
  const from = range[0] && typeof range[0] === 'object' && 'format' in range[0]
    ? String((range[0] as { format: (format: string) => string }).format('YYYY-MM-DD')) : '';
  const to = range[1] && typeof range[1] === 'object' && 'format' in range[1]
    ? String((range[1] as { format: (format: string) => string }).format('YYYY-MM-DD')) : '';
  const filtered = articles.filter((item) =>
    (!title || item.title.toLowerCase().includes(title)) &&
    (!category || item.category === category) &&
    (!status || item.status === status) &&
    (!from || item.createdAt >= from) && (!to || item.createdAt <= to),
  );
  return respond(paginate(filtered, Number(params.page), Number(params.pageSize)));
}

export async function getCategories(params: ListParams): Promise<ApiResponse<ListData<Category>>> {
  const name = String(params.name ?? '').trim().toLowerCase();
  const status = String(params.status ?? '');
  const filtered = categories.filter((item) =>
    (!name || item.name.toLowerCase().includes(name)) && (!status || item.status === status),
  );
  return respond(paginate(filtered, Number(params.page), Number(params.pageSize)));
}

export type BusinessModuleKey =
  | 'adjustRequest' | 'adjustDetail' | 'agilityRequest' | 'agilityDetail'
  | 'debtRequest' | 'debtDetail' | 'extensionRequest' | 'extensionDetail'
  | 'litigationRequest' | 'litigationExecution' | 'litigationDetail'
  | 'interestRule' | 'interestAgreement' | 'interestFlow' | 'interestSystemVerify'
  | 'interestVerify' | 'loanInterest' | 'consumeInterest'
  | 'productList' | 'repayment' | 'approvalPending'
  | 'agilitySign' | 'debtSign' | 'repaymentWithdraw' | 'bankConsumeInterest';

const businessLabels: Record<BusinessModuleKey, string> = {
  adjustRequest: '调整申请', adjustDetail: '调整明细', agilityRequest: '调整申请', agilityDetail: '调整明细',
  debtRequest: '调整申请', debtDetail: '调整明细', extensionRequest: '调整申请', extensionDetail: '调整明细',
  litigationRequest: '诉讼申请', litigationExecution: '诉讼回款执行', litigationDetail: '诉讼回款明细',
  interestRule: '贴息规则配置', interestAgreement: '协议签署', interestFlow: '贴息流水',
  interestSystemVerify: '系统核定', interestVerify: '贴息核定', loanInterest: '贷款贴息', consumeInterest: '消费贴息',
  productList: '产品信息列表', repayment: '手动还款', approvalPending: '待审列表',
  agilitySign: '灵动重组签约', debtSign: '债务重组签约', repaymentWithdraw: '组合还款提现',
  bankConsumeInterest: '消费贷款贴息',
};

const businessData: Record<BusinessModuleKey, BusinessRecord[]> = Object.fromEntries(
  (Object.keys(businessLabels) as BusinessModuleKey[]).map((key) => [
    key,
    Array.from({ length: 24 }, (_, index) => ({
      id: index + 1,
      referenceNo: `${key.toUpperCase().slice(0, 4)}2026${String(index + 1).padStart(4, '0')}`,
      customer: `${businessLabels[key]}客户${index + 1}`,
      amount: 10000 + index * 1250,
      status: businessStatuses[index % businessStatuses.length],
      updatedAt: `2026-${String((index % 8) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
      remark: `${businessLabels[key]}业务记录`,
    })),
  ]),
) as Record<BusinessModuleKey, BusinessRecord[]>;

export async function getBusinessList(
  module: BusinessModuleKey,
  params: ListParams,
): Promise<ApiResponse<ListData<BusinessRecord>>> {
  const keyword = String(params.keyword ?? params.customer ?? '').trim().toLowerCase();
  const status = String(params.status ?? '');
  const source = businessData[module];
  const filtered = source.filter((item) =>
    (!keyword || item.customer.toLowerCase().includes(keyword) || item.referenceNo.toLowerCase().includes(keyword)) &&
    (!status || item.status === status),
  );
  return respond(paginate(filtered, Number(params.page), Number(params.pageSize)));
}

export type { AgilitySignData, AgilitySignResponse, SignAdjustment, SignRepaymentPlan, SignSchemeStage, SignPlanStatus } from '../types/agilitySign';
export { getAgilitySignData } from './agilitySign';

export type { DebtSignData, DebtSignLoanNote, DebtSignNewLoanPlan, DebtSignRepaymentItem, DebtSignResponse, DebtSignStep, DebtSignTodo, DebtSignTodoStatus, DebtSignMode, DebtSignSubmitResponse } from '../types/debtSign';
export { getDebtSignData, submitDebtSign } from './debtSign';

export type {
  ComboBankCard,
  ComboCoupon,
  ComboCreditSummary,
  ComboLoanPayload,
  ComboOverlay,
  ComboPanel,
  ComboPlanParams,
  ComboPlanResponse,
  ComboRepaymentData,
  ComboRepaymentItem,
  ComboRepaymentRecord,
  ComboRepaymentResponse,
  ComboRepaymentScheme,
  ComboRepaymentStage,
  ComboSubmitResponse,
  ComboSubmitResult,
  ComboTermOption,
} from '../types/comboRepaymentWithdrawal';
export {
  bankCards,
  comboRepaymentData,
  coupons,
  getComboRepaymentData,
  getComboRepaymentPlan,
  purposes,
  submitComboRepayment,
  termOptions,
} from './comboRepaymentWithdrawal';


export {
  calculateExtensionPlan,
  deleteExtensionDetail,
  extensionAdjustmentTypes,
  extensionApplicationStatuses,
  extensionGlobalStatuses,
  extensionDetails,
  extensionInstitutions,
  extensionLoans,
  extensionLoanStatuses,
  extensionProducts,
  extensionHistories,
  getExtensionDetails,
  getExtensionHistory,
  getExtensionLoan,
  getExtensionLoans,
  revokeExtensionDetail,
  submitExtensionApplication,
} from './extension';
export type { ExtensionListParams } from '../types';

export {
  adjustmentElementOptions,
  calculateInLoanPlan,
  cycleOptions,
  getInLoanAdjustmentDetails,
  getInLoanLoan,
  getInLoanLoans,
  inLoanApplications,
  inLoanChannels,
  inLoanInstitutions,
  inLoanLoans,
  inLoanProducts,
  inLoanStatuses,
  principalRatioOptions,
  repaymentMethodOptions,
  revokeInLoanAdjustment,
  submitInLoanAdjustment,
} from './inLoanAdjustment';
export type { InLoanListParams } from '../types';

export {
  getConsumeSubsidy,
  getConsumeSubsidies,
  getLoanSubsidy,
  getLoanSubsidies,
  getSubsidyAgreement,
  getSubsidyAgreements,
  getSubsidyApproval,
  getSubsidyApprovals,
  getSubsidyFlow,
  getSubsidyFlows,
  getSubsidyRule,
  getSubsidyRules,
  getSystemApprovals,
  loanSubsidies,
  subsidyAgreements,
  subsidyApprovalSources,
  subsidyApprovalStatuses,
  subsidyFlowStatuses,
  subsidyFlowTypes,
  subsidyInstitutions,
  subsidyProducts,
  subsidyRules,
  subsidySigningModes,
  subsidySystemStatuses,
  subsidyRetryCards,
  consumeSubsidies,
  submitManualRecovery,
  submitManualSubsidy,
  terminateConsumeSubsidy,
} from './subsidy';
export type { ConsumeSubsidyAllocation, ConsumeSubsidyRecord, ConsumeSubsidyRefund, ConsumeSubsidyStatus, ConsumeSubsidyListParams, SubsidyRefundDetail } from '../types';
export type {
  AgreementStatus,
  ApplicationListResponse,
  ApplicationQuery,
  ApplicationSource,
  ApplicationStatus,
  CancelApplicationResponse,
  ConsumeInfo,
  ConsumeInterestApplication,
  ConsumeInterestClientConfig,
  ConsumeInterestClientData,
  ConsumeInterestClientResponse,
  ConsumeInterestHomeState,
  EligibleLoan,
  Eligibility,
  GetConsumeInterestClientDataResponse,
  InterestAgreement,
  InterestRecord,
  InterestRecordListResponse,
  InterestRecordQuery,
  SubmitConsumeInterestPayload,
  SubmitConsumeInterestResponse,
  SubmitConsumeInterestResult,
  Voucher,
  VoucherType,
} from '../types/consumeInterest';
export {
  cancelConsumeInterestApplication,
  consumeApplications,
  consumeInterestClientData,
  eligibleLoans,
  getConsumeInterestAgreement,
  getConsumeInterestApplications,
  getConsumeInterestClientData,
  getConsumeInterestLoans,
  getInterestRecords,
  interestAgreements,
  interestRecords,
  signInterestAgreement,
  submitConsumeInterestApplication,
} from './consumeInterest';
export {
  getStopBatchDeductionExecutions,
  getStopBatchDeductionDetails,
  restoreBatchDeduction,
  resetStopBatchDeductionMock,
  stopBatchDeduction,
  stopBatchDeductionExecutions,
  stopBatchDeductionFiveLevelCategories,
  stopBatchDeductionFlags,
  stopBatchDeductionInstitutions,
  stopBatchDeductionLoanStatuses,
  stopBatchDeductionProcessResults,
  stopBatchDeductionProcessStatuses,
  stopBatchDeductionOperationTypes,
  stopBatchDeductionProducts,
  stopBatchDeductionRecoveryStrategies,
  stopBatchDeductionHistories,
} from './stopBatchDeduction';
export type {
  StopBatchDeductionDetailParams,
  StopBatchDeductionExecutionRecord,
  StopBatchDeductionHistoryRecord,
  StopBatchDeductionListParams,
  StopBatchDeductionOperationType,
  StopBatchDeductionProcessStatus,
  StopBatchDeductionSubmitResult,
  StopBatchDeductionRestoreParams,
  StopBatchDeductionRestoreResult,
} from '../types/stopBatchDeduction';
