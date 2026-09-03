import type { ReactNode } from 'react';

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

export type PageIcon = ReactNode;

export type AgilityGlobalStatus = '初始化' | '待处理' | '成功' | '失败';
export type AgilityTransactionStage = '初始化成功' | '贷中拒绝' | '审批通过' | '核心申请阶段';
export type AgilityStageStatus = '初始化失败' | '贷中拒绝' | '审批通过' | '申请成功';
export type AgilityLoanStatus = '正常' | '逾期' | '结清';
export type AgilityAccountStatus = '正常' | '关注' | '冻结';

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
  firstPaymentDelayMonths: number;
  repaymentCombination: string;
  supportedRepayment: string;
  expiryDate: string;
  signing: string;
  loanBalance: number;
  loanAmount: number;
  maturityDate: string;
  nextRepaymentDate: string;
  repaymentMethod: string;
  loanTerm: number;
  loanStatus: AgilityLoanStatus;
  accountStatus: AgilityAccountStatus;
  maxTerm: number;
  attachmentName?: string;
}

export interface RepaymentPlan {
  period: number;
  startDate: string;
  dueDate: string;
  status: '结清' | '待还';
  initialTotal: number;
  initialPrincipal: number;
  initialInterest: number;
  remainingPrincipal: number;
  paidAmount: number;
}

export interface AgilityFormValues {
  newRepaymentMethod: string;
  newRemainingTerm: number;
  interestReliefEnabled: boolean;
  firstPaymentDelayAllowed: boolean;
  firstPaymentDelayMonths: number;
  newNormalRate: number;
  newPenaltyRate: number;
  collectCompoundInterest: boolean;
  newCompoundRate?: number;
  expiryDate?: unknown;
  reason?: string;
}
