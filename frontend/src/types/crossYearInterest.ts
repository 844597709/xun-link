export type CrossYearSchemeId = 'scheme1' | 'scheme2' | 'scheme3' | 'scheme4';
export type CrossYearPolicyYear = 2027 | 2026 | 2025;
export type CrossYearAgreementStatus = '已生效' | '未签署' | '已过期' | '暂不支持补签';

export interface CrossYearPolicyYearState {
  year: CrossYearPolicyYear;
  agreementStatus: CrossYearAgreementStatus;
  agreementDate?: string;
  validPeriod: string;
  canApply: boolean;
  todoCount: number;
  subsidyTotal: number;
  statusRemark: string;
}

export interface CrossYearBusinessEntry {
  key: 'apply' | 'agreement' | 'verify' | 'record';
  label: string;
  description: string;
}

export interface CrossYearScheme {
  id: CrossYearSchemeId;
  name: string;
  shortName: string;
  positioning: string;
  recommended?: boolean;
  suitableFor: string;
  risk: string;
}
