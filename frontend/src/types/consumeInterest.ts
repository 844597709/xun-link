import type { ApiResponse, ListData } from './index';

export type AgreementStatus = 'unsigned' | 'signed';
export type Eligibility = 'eligible' | 'noEligibleLoan';
export type ApplicationStatus = 'passed' | 'reviewing' | 'rejected' | 'cancelled';
export type ApplicationSource = 'system' | 'self';
export type VoucherType = 'invoice' | 'proof';
export type AgreementRecordStatus = 'effective' | 'expired';
export type InterestType = 'realtime' | 'subsidy' | 'reclaim';

export interface CustomerProfile {
  nickname: string;
  mobile: string;
  avatarText: string;
}

export interface ConsumeInterestHomeState {
  agreementStatus: AgreementStatus;
  eligibility: Eligibility;
  interestPeriod: { start: string; end: string };
}

export interface InterestAgreement {
  id: string;
  title: string;
  signedAt?: string;
  effectiveDate?: string;
  summary: string;
  status: AgreementRecordStatus;
  content: string[];
}

export interface EligibleLoan {
  id: string;
  loanNo: string;
  loanDate: string;
  term: string;
  loanAmount: number;
  selectable: boolean;
  reason?: string;
  remainingSubsidyPrincipal: number;
}

export interface ConsumeInfo {
  id: string;
  account: string;
  consumeDate: string;
  transactionNo?: string;
  amount: number;
  purpose: string;
  interestAmount: number;
  loanIds: string[];
}

export interface Voucher {
  id: string;
  type: VoucherType;
  imageUrl: string;
  fileName: string;
  invoiceNo?: string;
  amount?: number;
  invoiceDate?: string;
}

export interface ConsumeInterestApplication {
  id: string;
  interestAmount: number;
  applyTime: string;
  source: ApplicationSource;
  consumeDate: string;
  approvedAt?: string;
  status: ApplicationStatus;
  statusRemark: string;
  loanIds: string[];
  remainingSubsidyPrincipal: number;
  consumeDescription: string;
  vouchers: Voucher[];
  consumeInfo?: ConsumeInfo;
  systemConsumes?: ConsumeInfo[];
}

export interface InterestRecord {
  id: string;
  date: string;
  amount: number;
  loanNo: string;
  cardNo: string;
  interestTime: string;
  interestType: InterestType;
}

export interface ConsumeInterestClientConfig {
  showTransactionNo: boolean;
  maxProofCount: number;
}

export interface ConsumeInterestClientData {
  customer: CustomerProfile;
  home: ConsumeInterestHomeState;
  config: ConsumeInterestClientConfig;
  agreements: InterestAgreement[];
  loans: EligibleLoan[];
  applications: ConsumeInterestApplication[];
  interestRecords: InterestRecord[];
}

export interface ConsumeInterestClientResponse extends ApiResponse<ConsumeInterestClientData> {}
export type AgreementListResponse = ApiResponse<ListData<InterestAgreement>>;
export type ApplicationListResponse = ApiResponse<ListData<ConsumeInterestApplication>>;
export type InterestRecordListResponse = ApiResponse<ListData<InterestRecord>>;

export interface ApplicationQuery {
  page?: number;
  pageSize?: number;
  status?: ApplicationStatus;
  from?: string;
  to?: string;
}

export interface InterestRecordQuery {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}

export interface SubmitConsumeInterestPayload {
  account: string;
  consumeDate: string;
  transactionNo?: string;
  purpose: string;
  loanIds: string[];
  description?: string;
  vouchers: Voucher[];
}

export interface SubmitConsumeInterestResult {
  application: ConsumeInterestApplication;
}

export interface CancelApplicationResult {
  applicationId: string;
  status: 'cancelled';
}

export type GetConsumeInterestClientDataResponse = ConsumeInterestClientResponse;
export type SubmitConsumeInterestResponse = ApiResponse<SubmitConsumeInterestResult>;
export type CancelApplicationResponse = ApiResponse<CancelApplicationResult>;
