import type { ApiResponse } from './index';

export type ComboPanel = 'home' | 'loan' | 'detail' | 'result' | 'records';
export type ComboOverlay = 'term' | 'coupon' | 'repaymentPlan' | 'more' | 'password' | 'face' | null;
export type ComboFaceStage = 'ready' | 'scanning' | 'verified';
export type ComboRecordStatus = '处理中' | '放款成功' | '已完成';

export interface ComboCreditSummary {
  total: number;
  used: number;
  available: number;
  dailyRateRange: string;
  repaymentMethod: string;
}

export interface ComboRepaymentItem {
  period: number;
  date: string;
  totalAmount: number;
  principal: number;
  interest: number;
  discount: number;
}

export interface ComboRepaymentStage {
  id: string;
  startPeriod: number;
  endPeriod: number;
  principalRatio: number;
  repaymentLabel: string;
  items: ComboRepaymentItem[];
}

export interface ComboRepaymentScheme {
  id: string;
  name: string;
  term: number;
  annualRate: number;
  dailyRate: number;
  stages: ComboRepaymentStage[];
}

export interface ComboTermOption {
  term: number;
  schemes: ComboRepaymentScheme[];
}

export interface ComboCoupon {
  id: string;
  name: string;
  threshold: number;
  discount: number;
  expiresAt: string;
}

export interface ComboBankCard {
  id: string;
  bankName: string;
  cardType: string;
  maskedNo: string;
  enabled: boolean;
}

export interface ComboRepaymentRecord {
  id: string;
  applicationNo: string;
  amount: number;
  bankName: string;
  maskedNo: string;
  status: ComboRecordStatus;
  createdAt: string;
}

export interface ComboRepaymentData {
  credit: ComboCreditSummary;
  terms: ComboTermOption[];
  coupons: ComboCoupon[];
  bankCards: ComboBankCard[];
  records: ComboRepaymentRecord[];
}

export interface ComboPlanParams {
  amount: number;
  term: number;
  schemeId: string;
  couponDiscount?: number;
}

export interface ComboLoanPayload extends ComboPlanParams {
  purpose: string;
  bankCardId: string;
}

export interface ComboSubmitResult {
  applicationNo: string;
  submittedAt: string;
  status: '提交成功';
  loanAmount: number;
  bankCard: string;
  notice: string;
}

export type ComboRepaymentResponse = ApiResponse<ComboRepaymentData>;
export type ComboPlanResponse = ApiResponse<ComboRepaymentItem[]>;
export type ComboSubmitResponse = ApiResponse<ComboSubmitResult>;
