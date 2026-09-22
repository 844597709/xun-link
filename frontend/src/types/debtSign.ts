import type { ApiResponse } from './index';

export type DebtSignStep = 'todo' | 'choose' | 'confirm' | 'processing';
export type DebtSignTodoStatus = '未处理' | '已处理';
export type DebtSignMode = 'single' | 'batch';

export interface DebtSignTodo {
  id: number;
  title: string;
  productName: string;
  deadline: string;
  tip: string;
  createdAt: string;
  status: DebtSignTodoStatus;
  mode: DebtSignMode;
}

export interface DebtSignLoanNote {
  id: number;
  title: string;
  loanNo: string;
  overdue: boolean;
  remainingPrincipal: number;
  totalInterest: number;
  totalPenalty: number;
  recoveryDiscount: number;
  currentPeriod: number;
  totalPeriods: number;
  dueInterest: number;
  penalty: number;
  term: string;
  remainingPeriods: number;
  principal: number;
  rate: string;
  productName: string;
}

export interface DebtSignNewLoanPlan {
  principal: number;
  annualRate: string;
  repaymentMethod: string;
  term: string;
  purpose: string;
  account: string;
}

export interface DebtSignRepaymentItem {
  period: number;
  dueDate: string;
  amount: number;
  principal: number;
  interest: number;
}

export interface DebtSignData {
  todos: DebtSignTodo[];
  notes: DebtSignLoanNote[];
  plan: DebtSignNewLoanPlan;
  repaymentPlan: DebtSignRepaymentItem[];
}

export type DebtSignResponse = ApiResponse<DebtSignData>;
export type DebtSignSubmitResponse = ApiResponse<{ applicationNo: string }>;
