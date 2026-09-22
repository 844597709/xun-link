import type { ReactNode } from 'react';

export type { ApprovalDetailType, ApprovalListParams, ApprovalRecord, ApprovalStatus, ApprovalTimelineItem, AgileRestructuringDetail, DebtRestructuringDetail, ManualRepaymentDetail, ManualRepaymentSummary, ProductMaintenanceDetail } from './approval';

export type { DebtSignData, DebtSignLoanNote, DebtSignNewLoanPlan, DebtSignRepaymentItem, DebtSignResponse, DebtSignStep, DebtSignTodo, DebtSignTodoStatus, DebtSignMode, DebtSignSubmitResponse } from './debtSign';
export type { CrossYearBusinessEntry, CrossYearPolicyYearState, CrossYearScheme, CrossYearSchemeId, CrossYearPolicyYear, CrossYearAgreementStatus } from './crossYearInterest';
export type {
  ComboBankCard,
  ComboCoupon,
  ComboCreditSummary,
  ComboFaceStage,
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
  ComboRecordStatus,
} from './comboRepaymentWithdrawal';

export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export interface ListData<T> {
  list: T[];
  total: number;
  page: number;
  pagesize: number;
}

export interface MenuItem {
  id: number;
  mpid: string;
  name: string;
  route?: string;
  icon?: string;
}

export interface MenuNode extends MenuItem {
  children?: MenuNode[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  status: '启用' | '停用';
  createdAt: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  userCount: number;
  status: '启用' | '停用';
}

export interface Article {
  id: number;
  title: string;
  category: string;
  author: string;
  status: '已发布' | '草稿';
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  parentName: string;
  sort: number;
  status: '启用' | '停用';
}

export interface BusinessRecord {
  id: number;
  referenceNo: string;
  customer: string;
  amount: number;
  status: '待处理' | '处理中' | '已完成' | '已驳回';
  updatedAt: string;
  remark: string;
}

export interface ProductRecord {
  id: number;
  rowNo: 1 | 2 | 3;
  institutionCode: string;
  institutionName: string;
  productCode: string;
  productName: string;
  loanType: string;
  loanSubType: string;
  creditType: '循环额度' | '一次性额度';
  maxCreditLimit: number;
  normalRateMin: number;
  normalRateMax: number;
  repaymentMethods: RepaymentMethodSummary[];
}

export type ProductModeCode = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '10' | '11' | '12';
export type InternalRepaymentMode = '2' | '3' | '4';
export type CombinationModeCode = '10' | '11' | '12';
export type CustomModeCode = '5' | '6' | '7' | '8';

export interface RepaymentMethodSummary {
  code: ProductModeCode;
  name: string;
  periods: number[];
}

export interface RepaymentStage {
  id: string;
  startPeriod: number;
  endPeriod: number;
  repaymentMode: InternalRepaymentMode;
  principalRatio: number;
}

export interface CombinationPlan {
  id: string;
  planSeq: number;
  stages: RepaymentStage[];
}

export interface CombinationTermConfig {
  id: string;
  totalTerm: number;
  plans: CombinationPlan[];
}

export interface CombinationConfig {
  code: CombinationModeCode;
  name: string;
  expanded: boolean;
  terms: CombinationTermConfig[];
}

export interface CustomRatioEntry {
  id: string;
  term?: number;
  ratio: number;
}

export interface CustomRepaymentConfig {
  code: CustomModeCode;
  name: string;
  expanded: boolean;
  interestCycle: string;
  principalCycle: string;
  ratios: CustomRatioEntry[];
}

export interface AssociatedComponent {
  id: string;
  repaymentModeCode: ProductModeCode;
  repaymentModeName: string;
  releaseComponent: string;
  repaymentComponent: string;
  interestComponent: string;
  editable: boolean;
}

export interface RepaymentMaintenanceData {
  product: ProductRecord;
  supportedMethods: RepaymentMethodSummary[];
  combinations: CombinationConfig[];
  customConfigs: CustomRepaymentConfig[];
  associatedComponents: AssociatedComponent[];
}

export interface ProductEditValues {
  productName: string;
  loanType: string;
  loanSubType: string;
  creditType: ProductRecord['creditType'];
  maxCreditLimit: number;
}

export interface RepaymentMaintenancePayload {
  supportedMethods: RepaymentMethodSummary[];
  combinations: CombinationConfig[];
  customConfigs: CustomRepaymentConfig[];
  associatedComponents: AssociatedComponent[];
}

export type InLoanAdjustmentElement = 'rate' | 'repayment' | 'term';
export type InLoanAdjustmentStatus = '待签约' | '已签约' | '已撤销';
export type InLoanAdjustmentChannel = '单笔发起' | '系统批量' | '客户发起';
export type InLoanLoanStatus = '正常' | '逾期' | '减值' | '核销';

export interface InLoanLoan {
  id: number;
  institutionName: string;
  institutionCode: string;
  productName: string;
  productCode: string;
  customerName: string;
  customerNo: string;
  idCardNo: string;
  mobile: string;
  loanNo: string;
  loanAmount: number;
  loanBalance: number;
  startDate: string;
  maturityDate: string;
  nextRepaymentDate: string;
  repaymentMethod: string;
  loanTerm: number;
  remainingTerm: number;
  normalRate: number;
  penaltyRate: number;
  compoundRate: number;
  loanStatus: InLoanLoanStatus;
  accountStatus: '正常' | '冻结' | '关闭';
  maxTerm: number;
}

export interface InLoanAdjustmentApplication extends InLoanLoan {
  applicationId: number;
  applyTime: string;
  status: InLoanAdjustmentStatus;
  originalRepaymentMethod: string;
  newRepaymentMethod: string;
  originalTotalTerm: number;
  newTotalTerm: number;
  originalRemainingTerm: number;
  newRemainingTerm: number;
  originalNormalRate: number;
  newNormalRate: number;
  originalPenaltyRate: number;
  newPenaltyRate: number;
  originalCompoundRate: number;
  newCompoundRate: number;
  expiryDate?: string;
  signingTime?: string;
  revokeTime?: string;
  reason: string;
  revokeReason?: string;
  applicationChannel: InLoanAdjustmentChannel;
  applicantName: string;
  applicantId: string;
  videoSignAvailable: boolean;
  attachmentName?: string;
}

export interface InLoanAdjustmentValues {
  adjustmentElements: InLoanAdjustmentElement[];
  newNormalRate?: number;
  newPenaltyRate?: number;
  newCompoundRate?: number;
  newRepaymentMethod?: string;
  interestCycle?: string;
  principalCycle?: string;
  finalPrincipalRatio?: string;
  newTotalTerm?: number;
  newRemainingTerm?: number;
  expiryDate?: unknown;
  reason?: string;
  attachmentName?: string;
  allowExceedMaxTerm?: boolean;
}

export interface InLoanRepaymentPlan {
  period: number;
  startDate: string;
  dueDate: string;
  status: '结清' | '正常';
  initialTotal: number;
  initialPrincipal: number;
  initialInterest: number;
  remainingPrincipal: number;
  paidAmount: number;
  paidPrincipal: number;
  paidInterest: number;
  dueAmount: number;
  duePrincipal: number;
  dueInterest: number;
}

export interface InLoanListParams {
  page: number;
  pageSize: number;
  institutionName?: string;
  customerNo?: string;
  idCardNo?: string;
  mobile?: string;
  loanNo?: string;
  productName?: string;
  applyTime?: unknown;
  status?: InLoanAdjustmentStatus;
  applicationChannel?: InLoanAdjustmentChannel;
}

export type AgilityGlobalStatus = '初始化' | '待处理' | '成功' | '失败' | '处理中' | '撤销' | '过期';
export type AgilityTransactionStage = '初始化阶段' | '贷中阶段' | '审批阶段' | '核心申请阶段' | '客户签约阶段';
export type AgilityStageStatus = '初始化成功' | '初始化失败' | '初始化中' | '贷中通过' | '贷中拒绝' | '贷中处理中' | '审批通过' | '审批拒绝' | '待审批' | '待发起审批' | '申请成功' | '申请失败' | '申请处理中' | '待签约' | '已签约' | '签约处理中' | '已失效';
export type AgilityLoanStatus = '正常' | '逾期' | '减值' | '核销';
export type AgilityAccountStatus = '正常';

export interface AgilityApplication {
  id: number;
  institutionName: string;
  institutionCode: string;
  productName: string;
  productCode: string;
  customerName: string;
  customerNo: string;
  idCardNo: string;
  mobile: string;
  loanNo: string;
  loanAccount: string;
  currency: string;
  startDate: string;
  globalStatus: AgilityGlobalStatus;
  holoSerialNo: string;
  applyTime: string;
  transactionStage: AgilityTransactionStage;
  stageStatus: AgilityStageStatus;
  originalRepaymentMethod: string;
  newRepaymentMethod: string;
  originalTotalTerm: number;
  newTotalTerm: number;
  originalRemainingTerm: number;
  newRemainingTerm: number;
  originalNormalRate: number;
  newNormalRate: number;
  originalPenaltyRate: number;
  newPenaltyRate: number;
  originalCompoundRate: number;
  newCompoundRate: number;
  interestRelief: '是' | '否';
  interestReliefEnabled: boolean;
  firstPaymentDelayAllowed: boolean;
  firstPaymentDelayMonths: number;
  repaymentCombination: string;
  supportedRepayment: string;
  expiryDate: string;
  signing: string;
  signingTime?: string;
  revokeTime?: string;
  reason?: string;
  statusRemark?: string;
  applicationChannel?: string;
  applicantName?: string;
  applicantId?: string;
  loanBalance: number;
  loanAmount: number;
  maturityDate: string;
  nextRepaymentDate: string;
  repaymentMethod: string;
  loanTerm: number;
  settledPeriods: number;
  allowExceedMaxTerm: boolean;
  loanStatus: AgilityLoanStatus;
  accountStatus: AgilityAccountStatus;
  maxTerm: number;
  attachmentName?: string;
}

export interface RepaymentPlan {
  period: number;
  startDate: string;
  dueDate: string;
  status: '结清' | '正常';
  initialTotal: number;
  initialPrincipal: number;
  initialInterest: number;
  remainingPrincipal: number;
  paidAmount: number;
  paidPrincipal: number;
  paidInterest: number;
  dueAmount: number;
  duePrincipal: number;
  dueInterest: number;
  adjustmentInterest: number;
}

export interface AgilityCustomStage {
  sequence: number;
  startPeriod?: number;
  endPeriod?: number;
  repaymentMethod?: string;
  principalRatio?: number;
}

export interface AgilityRepaymentSchemeStage {
  sequence: number;
  startPeriod: number;
  endPeriod: number;
  repaymentMethod: string;
  principalRatio: number;
}

export interface AgilityRepaymentScheme {
  id: string;
  name: string;
  stages: AgilityRepaymentSchemeStage[];
  custom?: boolean;
}

export interface AgilityFormValues {
  newRepaymentMethod: string;
  newRemainingTerm: number;
  interestReliefAmount?: number;
  extensionPeriods?: number;
  newNormalRate: number;
  newPenaltyRate: number;
  newCompoundRate?: number;
  rateFlag?: number;
  interestCycle?: string;
  principalCycle?: string;
  repaymentPlanId?: string;
  customRepaymentStages?: AgilityCustomStage[];
  expiryDate?: unknown;
  reason?: string;
  interestReliefEnabled?: boolean;
  firstPaymentDelayAllowed?: boolean;
  firstPaymentDelayMonths?: number;
  collectCompoundInterest?: boolean;
}

export type DebtLoanStatus = '正常' | '逾期' | '减值' | '核销';
export type DebtBusinessType = '借新还旧' | '无还本续贷';
export type DebtCombinationCode = '10' | '11' | '12';
export type DebtDrawerMode = 'single-calculate' | 'single-request' | 'batch-calculate' | 'batch-request';
export type DebtGlobalStatus = '初始化' | '待处理' | '成功' | '失败' | '处理中' | '撤销' | '过期';
export type DebtTransactionStage = '初始化阶段' | '贷中调额阶段' | '审批阶段' | '客户签约阶段' | '贷中提现阶段' | '核心签约阶段' | '合同签署阶段';
export type DebtApplicationChannel = '单次发起' | '名单上传' | '贷中规则跳转' | '行方接口发起' | '客户主动发起';

export interface DebtAttachment {
  uid: string;
  name: string;
  status?: string;
  url?: string;
}

export interface DebtOriginalLoan {
  id: number;
  loanNo: string;
  loanStatus: DebtLoanStatus;
  loanAmount: number;
  loanBalance: number;
  duePrincipal: number;
  dueInterest: number;
  repayInterest: number;
  ledgerInterest: number;
  overdueDays: number;
  interestRelief: number;
  isFullInterest: '是' | '否';
  startDate: string;
  maturityDate: string;
}

export interface DebtLoan {
  id: number;
  institutionName: string;
  institutionCode: string;
  productName: string;
  productCode: string;
  customerName: string;
  customerNo: string;
  idCardNo: string;
  mobile: string;
  loanNo: string;
  loanAmount: number;
  loanBalance: number;
  startDate: string;
  maturityDate: string;
  repaymentMethod: string;
  loanTerm: number;
  loanStatus: DebtLoanStatus;
  normalRate: number;
  penaltyRate: number;
  compoundRate: number;
  termOptions: number[];
  originalLoans: DebtOriginalLoan[];
}

export interface DebtCombinationScheme {
  id: string;
  name: string;
  stages: Array<{
    sequence: number;
    startPeriod: number;
    endPeriod: number;
    repaymentMethod: string;
    principalRatio: number;
  }>;
  custom?: boolean;
}

export interface DebtRepaymentPlan {
  period: number;
  dueDate: string;
  repaymentMethod: string;
  principal: number;
  interest: number;
  amount: number;
  remainingPrincipal: number;
}

export interface DebtDetailRecord {
  id: number;
  institutionName: string;
  institutionCode: string;
  productName: string;
  productCode: string;
  customerNo: string;
  customerName: string;
  holoSerialNo: string;
  originalLoanNo: string;
  applyDate: string;
  contractStatus: string;
  globalStatus: DebtGlobalStatus;
  transactionStage: DebtTransactionStage;
  stageStatus: string;
  newLoan: number;
  loanAmount: number;
  repayPrincipal: number;
  repayInterest: number;
  ledgerInterest: number;
  repaymentMethod: string;
  unpaidRatio: number;
  loanTerm: number;
  delayMonths: number;
  interestCycle: string;
  principalCycle: string;
  normalRate: number;
  penaltyRate: number;
  compoundRate: number;
  expiryDate: string;
  signingDate?: string;
  revokeDate?: string;
  reason: string;
  statusRemark: string;
  applicationChannel: DebtApplicationChannel;
  applicantName: string;
  applicantId: string;
  videoSign: boolean;
  attachmentName?: string;
}

export interface DebtApprovalRecord {
  id: number;
  caseType: '案件贷后贷';
  caseSubtype: string;
  customerName: string;
  customerNo: string;
  loanNo: string;
  applyDate: string;
  approvalStatus: '待审批' | '审批通过';
  debtLoanId?: number;
}

export interface DebtRepaymentSummary {
  repayPrincipal: number;
  repayInterest: number;
  interestRelief: number;
  totalRepayment: number;
  newLoanAmount: number;
}

export interface DebtFormValues extends DebtRepaymentSummary {
  businessType: DebtBusinessType;
  repaymentMethod: string;
  loanTerm: number;
  delayMonths: number;
  normalRate: number;
  penaltyRate: number;
  compoundRate: number;
  repaymentSchemeId?: string;
  customRepaymentStages?: DebtCombinationScheme['stages'];
  expiryDate?: unknown;
  remark?: string;
  attachments?: DebtAttachment[];
}

export type ManualRepaymentType = '正常还款' | '全部结清' | '提前部分还款' | '按期还款' | '灵活还款';
export type BatchManualRepaymentType = Exclude<ManualRepaymentType, '按期还款'>;
export type ManualAccountType = '绑定卡列表' | '内部户' | '对公户' | '代还账户' | '卡系列' | '代还虚账户';
export type ManualRepaymentMode = 'calculate' | 'request';

export interface ManualRepaymentPlan {
  period: number;
  startDate: string;
  dueDate: string;
  initialPrincipal: number;
  initialInterest: number;
  dueAmount: number;
  duePrincipal: number;
  dueTotalInterest: number;
  dueInterest: number;
  duePenalty: number;
  dueFee: number;
  dueFeePenalty: number;
  adjustmentInterest: number;
  status: '正常' | '逾期' | '结清';
}

export interface ManualRepaymentRecord {
  id: number;
  institutionName: string;
  institutionCode: string;
  customerName: string;
  customerNo: string;
  idCardNo: string;
  mobile: string;
  loanNo: string;
  productName: string;
  productCode: string;
  loanAmount: number;
  loanBalance: number;
  startDate: string;
  maturityDate: string;
  nextRepaymentDate: string;
  repaymentMethod: string;
  loanTerm: number;
  loanStatus: '正常' | '逾期' | '减值' | '核销';
  accountStatus: '正常' | '冻结' | '销户';
  operator: string;
  dueTotal: number;
  plans: ManualRepaymentPlan[];
}

export interface ManualRepaymentCalculation {
  total: number;
  principal: number;
  totalInterest: number;
  interest: number;
  penalty: number;
  fee: number;
  feeDetail: string;
  adjustmentInterest: number;
}

export interface ManualRepaymentSettings {
  repaymentType: ManualRepaymentType | BatchManualRepaymentType;
  compensation: '是' | '否';
  accountType: ManualAccountType | undefined;
  repaymentOrder: string;
  accountNo: string;
  accountName: string;
  actualAmount: number;
  partialPrincipal: number;
  exceedProductElement: '是' | '否';
  remark: string;
}

export interface ManualRepaymentCalculationResponse {
  record: ManualRepaymentRecord;
  due: ManualRepaymentCalculation;
  actual: ManualRepaymentCalculation;
  plans: ManualRepaymentPlan[];
}

export type SubsidyRuleStatus = '生效' | '失效';
export type SubsidySigningMode = 'CROS签署' | '银行APP签署' | '自动签署';
export type SubsidyApprovalScheme = '系统核定' | '自主申请';
export type SubsidyFlowType = '实时贴息' | '补贴息' | '收回贴息';
export type SubsidyFlowStatus = '待处理' | '成功' | '失败' | '处理中' | '已冲正' | '冲正中';
export type SystemApprovalStatus = '初始化' | '成功' | '失败' | '处理中';
export type SubsidyApprovalSource = '系统核定' | '自主申请';
export type SubsidyApprovalStatus = '审核中' | '已通过' | '已拒绝' | '已撤销';

export interface SubsidyRule {
  id: number;
  institutionCode: string;
  institutionName: string;
  crosRuleNo: string;
  bankRuleNo: string;
  description: string;
  status: SubsidyRuleStatus;
  annualRate: number;
  startDate: string;
  endDate: string;
  products: string[];
  signingMode: SubsidySigningMode;
  approvalScheme: SubsidyApprovalScheme;
  accountScope: string;
  supplyScope: string;
  realtimeMode: string;
  subsidyMode: string;
  recoveryMode: string;
  queryBankConsumption: '是' | '否';
  calculationRule: string;
  loanSubsidyOrder: string;
  eligibleLoanRule: string;
  designatedLoanStartDate: string;
  consumptionTraceRule: string;
  traceDays: number;
  allowSettledLoan: '是' | '否';
  allowBusinessLoan: '是' | '否';
  checkAccountMatch: '是' | '否';
  allowGracePeriod: '是' | '否';
  allowNormalPrincipalAfterOverdue: '是' | '否';
  overdueFailureRule: string;
  minConsumptionAmount: number;
}

export interface SubsidyAgreement {
  id: number;
  institutionCode: string;
  institutionName: string;
  customerNo: string;
  customerName: string;
  idCardNo?: string;
  mobile?: string;
  ruleNo: string;
  contractNo: string;
  signedAt: string;
  channel: SubsidySigningMode;
  status: '已签署' | '待签署' | '签署失败';
  content: string;
}

export interface SubsidyConsumptionDetail {
  id: number;
  crosConsumptionNo: string;
  bankConsumptionNo: string;
  invoiceNo: string;
  consumptionDate: string;
  consumptionAmount: number;
  appliedAmount: number;
  purpose: string;
  merchantName: string;
  approvalSource: SubsidyApprovalSource;
  approvedAmount: number;
  approvedAt: string;
  subsidyAmount: number;
  recoveryAmount: number;
  account?: string;
  accountType?: string;
  loanNo?: string;
  availablePrincipal?: number;
  description?: string;
  approvalStatus?: '通过' | '未核定';
}

export interface SubsidyRefundDetail {
  id: number;
  crosRefundNo: string;
  bankTransactionNo: string;
  bankOriginalTransactionNo: string;
  consumptionDate: string;
  consumptionAmount: number;
  approvedAmount: number;
  refundAmount: number;
  expectedRecoveryAmount: number;
  recoveryAmount: number;
}

export interface SubsidyFlow {
  id: number;
  institutionCode: string;
  institutionName: string;
  customerNo: string;
  customerName: string;
  idCardNo?: string;
  mobile?: string;
  productCode: string;
  productName: string;
  loanNo: string;
  crosTransactionNo: string;
  type: SubsidyFlowType;
  expectedSubsidyAmount: number;
  actualSubsidyAmount: number;
  subsidyAmount: number;
  subsidyCardNo: string;
  expectedRecoveryAmount: number;
  actualRecoveryAmount: number;
  recoveryAmount: number;
  recoveryCardNo: string;
  subsidyAt: string;
  status: SubsidyFlowStatus;
  failureReason: string;
  consumptionDetails: SubsidyConsumptionDetail[];
  refundDetails: SubsidyRefundDetail[];
  retryCards: string[];
}

export interface SystemApproval {
  id: number;
  institutionCode: string;
  institutionName: string;
  customerNo: string;
  customerName: string;
  bankTransactionNo: string;
  consumptionDate: string;
  consumptionCardNo: string;
  transactionType: '消费' | '退款';
  totalAmount: number;
  availableAmount: number;
  refundOriginalNo: string;
  purpose: string;
  merchantName: string;
  status: SystemApprovalStatus;
  statusRemark: string;
}

export interface SubsidyVoucher {
  id: string;
  name: string;
  url: string;
  kind: '发票' | '消费凭证';
  invoiceNo?: string;
  invoiceDate?: string;
  invoiceAmount?: number;
}

export interface SubsidyApproval {
  id: number;
  institutionCode: string;
  institutionName: string;
  customerNo: string;
  customerName: string;
  idCardNo?: string;
  mobile?: string;
  applicationNo: string;
  appliedAt: string;
  appliedAmount: number;
  consumptionCount: number;
  source: SubsidyApprovalSource;
  status: SubsidyApprovalStatus;
  approvedAt: string;
  approvedAmount: number;
  statusRemark: string;
  reason: string;
  estimatedTotal: number;
  consumptions: SubsidyConsumptionDetail[];
  vouchers: SubsidyVoucher[];
}

export interface LoanSubsidy {
  id: number;
  institutionCode: string;
  institutionName: string;
  customerNo: string;
  customerName: string;
  idCardNo?: string;
  mobile?: string;
  productCode: string;
  loanNo: string;
  startDate: string;
  maturityDate: string;
  loanTerm: number;
  loanAmount: number;
  occupiedPrincipal: number;
  remainingPrincipal: number;
  consumptionCount: number;
  dueTotal: number;
  realtimeTotal: number;
  dueSubsidyTotal: number;
  actualSubsidyTotal: number;
  dueRecoveryTotal: number;
  actualRecoveryTotal: number;
  settled: '是' | '否';
  loanStatus: '正常' | '逾期' | '减值' | '核销';
  productName: string;
  baseInfo: Record<string, string | number>;
  tabs: Record<string, Array<Record<string, string | number>>>;
}

export interface ConsumeSubsidyAllocation {
  id: number;
  loanNo: string;
  productCode: string;
  productName: string;
  loanAmount: number;
  allocatedAmount: number;
  expectedSubsidyAmount: number;
  dueSubsidyAmount: number;
  actualSubsidyAmount: number;
  dueRecoveryAmount: number;
  actualRecoveryAmount: number;
}

export interface ConsumeSubsidyRefund {
  id: number;
  crosRefundNo: string;
  bankConsumptionNo: string;
  bankOriginalConsumptionNo: string;
  refundDate: string;
  refundAmount: number;
  dueRecoveryAmount: number;
  actualRecoveryAmount: number;
}

export type ConsumeSubsidyStatus = '成功' | '已失效' | '已冲正';

export interface ConsumeSubsidyRecord {
  id: number;
  crosConsumptionNo: string;
  bankConsumptionNo: string;
  invoiceNo: string;
  institutionCode: string;
  institutionName: string;
  customerNo: string;
  customerName: string;
  idCardNo: string;
  mobile: string;
  consumptionDate: string;
  consumptionAmount: number;
  appliedSubsidyAmount: number;
  purpose: string;
  merchantName: string;
  approvedAmount: number;
  approvedAt: string;
  expectedSubsidyAmount: number;
  dueSubsidyAmount: number;
  actualSubsidyAmount: number;
  refundAmount: number;
  dueRecoveryAmount: number;
  actualRecoveryAmount: number;
  status: ConsumeSubsidyStatus;
  allocations: ConsumeSubsidyAllocation[];
  refunds: ConsumeSubsidyRefund[];
}

export type ConsumeSubsidyListParams = SubsidyListParams;

export interface SubsidyFlowListParams extends SubsidyListParams {
  crosConsumptionNo?: string;
  bankConsumptionNo?: string;
  invoiceNo?: string;
}

export interface SubsidyListParams {
  page: number;
  pageSize: number;
  institutionName?: string;
  productCode?: string;
  customerNo?: string;
  idCardNo?: string;
  mobile?: string;
  loanNo?: string;
  bankTransactionNo?: string;
  type?: SubsidyFlowType;
  status?: string | string[];
  signingChannel?: SubsidySigningMode;
  approvalScheme?: SubsidyApprovalScheme;
  transactionType?: '消费' | '退款';
  source?: SubsidyApprovalSource;
  settled?: '是' | '否';
  loanStatus?: Array<'正常' | '逾期' | '减值' | '核销'>;
  signedAt?: unknown;
  consumptionDate?: unknown;
  appliedAt?: unknown;
  startDate?: unknown;
  crosConsumptionNo?: string;
  bankConsumptionNo?: string;
  invoiceNo?: string;
}

export type ExtensionAdjustmentType = '延展' | '摊薄';
export type ExtensionLoanStatus = '正常' | '逾期' | '结清' | '核销';
export type ExtensionApplicationStatus = '待处理' | '处理中' | '已生效' | '已失效' | '已驳回';
export type ExtensionGlobalStatus = '初始化' | '待审核' | '处理中' | '成功' | '失败' | '撤销中' | '已撤销';
export type ExtensionTransactionStage = '初始化阶段' | '审批阶段' | '客户签约阶段' | '核心申请阶段';
export type ExtensionStageStatus = '初始化中' | '待审核' | '处理中' | '已通过' | '已拒绝' | '已签约' | '已完成' | '已撤销';
export type ExtensionApplicationChannel = '内管申请' | '客户申请' | '批量导入';

export interface ExtensionLoan {
  id: number;
  institutionName: string;
  institutionCode: string;
  customerName: string;
  customerNo: string;
  idCardNo: string;
  mobile: string;
  loanNo: string;
  productName: string;
  productCode: string;
  loanAmount: number;
  loanBalance: number;
  startDate: string;
  maturityDate: string;
  nextRepaymentDate: string;
  repaymentMethod: string;
  loanTerm: number;
  remainingTerm: number;
  settledPeriods: number;
  loanStatus: ExtensionLoanStatus;
  accountStatus: '正常' | '冻结' | '关闭';
  repaymentProgress: number;
  attachmentName?: string;
  maxThinningMonths: number;
  maxTerm: number;
  allowExceedMaxTerm: boolean;
}

export interface ExtensionHistory {
  id: number;
  loanId: number;
  applicationId: string;
  applicationDate: string;
  signingTime: string;
  expiryDate: string;
  adjustmentType: ExtensionAdjustmentType;
  adjustmentMonths: number;
  originalTotalTerm: number;
  newTotalTerm: number;
  originalMaturityDate: string;
  newMaturityDate: string;
}

export interface ExtensionRepaymentPlan {
  period: number;
  startDate: string;
  dueDate: string;
  status: '结清' | '待还';
  initialTotal: number;
  initialPrincipal: number;
  initialInterest: number;
  remainingPrincipal: number;
}

export interface ExtensionApplication {
  loanId: number;
  adjustmentType: ExtensionAdjustmentType;
  adjustmentMonths: number;
  allowExceedMaxTerm: boolean;
}

export interface ExtensionDetail {
  id: number;
  loanId: number;
  institutionName: string;
  institutionCode: string;
  customerName: string;
  customerNo: string;
  loanNo: string;
  globalSerialNo: string;
  globalStatus: ExtensionGlobalStatus;
  transactionStage: ExtensionTransactionStage;
  stageStatus: ExtensionStageStatus;
  applicationDate: string;
  originalRepaymentMethod: string;
  newRepaymentMethod: string;
  originalRemainingTerm: number;
  newRemainingTerm: number;
  originalTotalTerm: number;
  newTotalTerm: number;
  expiryDate: string;
  signingTime?: string;
  revokeTime?: string;
  reason: string;
  statusRemark: string;
  applicationChannel: ExtensionApplicationChannel;
  applicantName: string;
  applicantId: string;
  applicationId: string;
  videoSignAvailable: boolean;
  attachmentName?: string;
}

export interface ExtensionListParams {
  page: number;
  pageSize: number;
  institutionName?: string;
  customerNo?: string;
  idCardNo?: string;
  mobile?: string;
  loanNo?: string;
  productName?: string;
  status?: ExtensionApplicationStatus;
  globalStatus?: ExtensionGlobalStatus;
}