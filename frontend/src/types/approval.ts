import type { Dayjs } from 'dayjs';

export type ApprovalStatus = '待审批' | '已通过' | '已驳回';
export type ApprovalDetailType = 'product-maintenance' | 'manual-repayment' | 'debt-restructuring' | 'agile-restructuring' | 'batch-deduction';

export interface ApprovalTimelineItem {
  title: string;
  operator: string;
  time: string;
  status: string;
}

export interface ProductMaintenanceDetail {
  institutionCode: string;
  institutionName: string;
  productCode: string;
  productName: string;
  loanType: string;
  loanCategory: string;
  operator: string;
  operatorName: string;
  originalRepayment: string;
  newRepayment: string;
  schemes: Array<{ repaymentMethod: string; periods: string; name?: string; description: string }>;
}

export interface ManualRepaymentSummary {
  loanNo: string;
  principal: number;
  interest: number;
  penalty: number;
  total: number;
}

export interface ManualRepaymentDetail {
  institutionCode: string;
  institutionName: string;
  productCode: string;
  productName: string;
  customerNo: string;
  customerName: string;
  operator: string;
  operatorName: string;
  repaymentAccount: string;
  accountType: string;
  disbursementAccount: string;
  repaymentNo: string;
  additionalInfo: string;
  compensation: string;
  dueSummary: ManualRepaymentSummary[];
  actualSummary: ManualRepaymentSummary[];
}

export interface DebtRestructuringDetail {
  institutionCode: string;
  institutionName: string;
  productCode: string;
  productName: string;
  customerNo: string;
  customerName: string;
  operator: string;
  operatorName: string;
  applicationSource: string;
  operatorId: string;
  repaymentInfo: Array<{ label: string; value: string }>;
  newLoanInfo: Array<{ label: string; value: string }>;
  scheme: { name: string; stages: Array<{ sequence: number; term: string; method: string; ratio: string }> };
  originalLoans: Array<{ loanNo: string; status: '正常' | '关闭'; amount: number; balance: number; duePrincipalInterest: number; duePrincipal: number; totalInterest: number; settled: '是' | '否' }>;
  attachments: string[];
}

export interface AgileRestructuringDetail {
  institutionCode: string;
  institutionName: string;
  productCode: string;
  productName: string;
  customerNo: string;
  customerName: string;
  operator: string;
  operatorName: string;
  originalState: Array<{ label: string; value: string }>;
  newState: Array<{ label: string; value: string }>;
  scheme: { name: string; stages: Array<{ sequence: number; term: string; method: string; ratio: string }> };
  reason: string;
  attachments: string[];
  plans: Array<{ period: number; startDate: string; dueDate: string; status: string; initialTotal: number; initialPrincipal: number; initialInterest: number; remainingPrincipal: number; paidAmount: number; paidPrincipal: number }>;
}

export interface BatchDeductionDetail {
  operatorType: '停止批扣' | '恢复批扣';
  operatorId: string;
  operatorName: string;
  recovery?: {
    strategy: string;
    date: string;
    days: number;
  };
  loans: Array<{
    institutionCode: string;
    institutionName: string;
    customerNo: string;
    customerName: string;
    loanNo: string;
    amount: number;
    balance: number;
    status: '正常' | '关闭';
  }>;
}

export interface ApprovalRecord {
  id: number;
  institution: string;
  product: string;
  type: string;
  caseSubtype: string;
  initiator: string;
  applyTime: string;
  approver: string;
  approvalStatus: ApprovalStatus;
  approvalResult: string;
  businessStatus: string;
  failureReason: string;
  detailType: ApprovalDetailType;
  timeline: ApprovalTimelineItem[];
  detail: ProductMaintenanceDetail | ManualRepaymentDetail | DebtRestructuringDetail | AgileRestructuringDetail | BatchDeductionDetail;
}

export interface ApprovalListParams {
  page: number;
  pageSize: number;
  type?: string;
  caseSubtype?: string;
  initiator?: string;
  applyTime?: [Dayjs, Dayjs];
  approvalStatus?: ApprovalStatus;
}
