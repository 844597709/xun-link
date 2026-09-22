import type { ApiResponse } from './index';

export type SignPlanStatus = '未还' | '已还';

export interface SignRepaymentPlan {
  period: number;
  date: string;
  total: number;
  principal: number;
  interest: number;
  discount?: number;
  status: SignPlanStatus;
}

export interface SignSchemeStage {
  period: string;
  method: string;
  principalRatio: string;
  description: string;
}

export interface SignAdjustment {
  originalRepaymentMethod: string;
  newRepaymentMethod: string;
  originalTotalPeriods: number;
  newTotalPeriods: number;
  originalRemainingPeriods: number;
  newRemainingPeriods: number;
  originalNormalRate: string;
  newNormalRate: string;
  originalPenaltyRate: string;
  newPenaltyRate: string;
  originalCompoundRate: string;
  newCompoundRate: string;
  interestRelief: string;
  firstPaymentDelay: string;
}

export interface AgilitySignData {
  loanNo: string;
  usedAmount: number;
  loanAmount: number;
  totalPeriods: number;
  remainingPeriods: number;
  voucherStatus: string;
  repaymentPlans: SignRepaymentPlan[];
  adjustmentPlans: SignRepaymentPlan[];
  adjustment: SignAdjustment;
  schemes: SignSchemeStage[];
  loanPeriod: string;
}

export type AgilitySignResponse = ApiResponse<AgilitySignData>;
