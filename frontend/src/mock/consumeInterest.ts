import type { ApiResponse, ListData } from '../types';
import { delay } from '../utils';
import type {
  ApplicationQuery,
  ApplicationStatus,
  CancelApplicationResponse,
  ConsumeInfo,
  ConsumeInterestApplication,
  ConsumeInterestClientData,
  EligibleLoan,
  InterestAgreement,
  InterestRecord,
  InterestRecordQuery,
  SubmitConsumeInterestPayload,
  SubmitConsumeInterestResponse,
  Voucher,
} from '../types/consumeInterest';

const respond = <T,>(data: T): Promise<ApiResponse<T>> =>
  delay({ code: 0, data, message: 'success' }, 300, 500);

const imagePlaceholder = (label: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160" viewBox="0 0 240 160"><rect width="240" height="160" rx="12" fill="#eaf3ff"/><text x="120" y="86" text-anchor="middle" fill="#3977bd" font-size="18" font-family="Arial">${label}</text></svg>`)}`;

export const eligibleLoans: EligibleLoan[] = [
  { id: 'loan-1', loanNo: 'XB202601180001', loanDate: '2026-01-18', term: '12个月', loanAmount: 180000, selectable: true, remainingSubsidyPrincipal: 156000 },
  { id: 'loan-2', loanNo: 'XB202603260015', loanDate: '2026-03-26', term: '24个月', loanAmount: 260000, selectable: true, remainingSubsidyPrincipal: 238000 },
  { id: 'loan-3', loanNo: 'XB202604120008', loanDate: '2026-04-12', term: '12个月', loanAmount: 96000, selectable: false, reason: '该笔已全部贴息', remainingSubsidyPrincipal: 0 },
  { id: 'loan-4', loanNo: 'XB202605090026', loanDate: '2026-05-09', term: '36个月', loanAmount: 320000, selectable: false, reason: '该笔未满足贴息条件', remainingSubsidyPrincipal: 320000 },
];

const invoice: Voucher = {
  id: 'voucher-invoice-1', type: 'invoice', imageUrl: imagePlaceholder('消费发票'), fileName: '数码产品发票.png', invoiceNo: '04400129', amount: 12800, invoiceDate: '2026-07-03',
};
const proof: Voucher = {
  id: 'voucher-proof-1', type: 'proof', imageUrl: imagePlaceholder('消费凭证'), fileName: '消费合同.png',
};

const selfConsume: ConsumeInfo = {
  id: 'consume-self-1', account: '招商银行（尾号 6688）', consumeDate: '2026-07-03', transactionNo: 'TX202607030001', amount: 12800, purpose: '家用电器', interestAmount: 384, loanIds: ['loan-1', 'loan-2'],
};
const systemConsumes: ConsumeInfo[] = [
  { id: 'consume-system-1', account: '中国银行（尾号 1122）', consumeDate: '2026-06-18', transactionNo: 'TX202606180022', amount: 12000, purpose: '家装消费', interestAmount: 360, loanIds: ['loan-1'] },
  { id: 'consume-system-2', account: '中国银行（尾号 1122）', consumeDate: '2026-05-23', transactionNo: 'TX202605230019', amount: 18600, purpose: '家具消费', interestAmount: 558, loanIds: ['loan-1', 'loan-2'] },
];

export const interestAgreements: InterestAgreement[] = [
  {
    id: 'agreement-1', title: '消费贷款财政贴息服务协议', signedAt: '2026-01-05 10:22:18', effectiveDate: '2026-01-05', status: 'effective', summary: '用于约定消费贷款贴息服务范围、申请条件及双方权利义务。',
    content: ['甲方（服务方）：银行宝', '乙方（客户）：张先生', '第一条 甲方依据相关财政贴息政策，为符合条件的乙方消费贷款提供贴息服务。', '第二条 乙方应保证消费用途真实、合法，并按要求提交消费凭证。', '第三条 贴息金额以最终核定结果为准，具体以系统展示及通知为准。', '第四条 本协议自双方完成电子签署之日起生效。'],
  },
];

export const consumeApplications: ConsumeInterestApplication[] = [
  {
    id: 'CI202607030001', interestAmount: 384, applyTime: '2026-07-03 14:26:12', source: 'self', consumeDate: '2026-07-03', approvedAt: '2026-07-05 09:18:20', status: 'passed', statusRemark: '核定通过', loanIds: ['loan-1', 'loan-2', 'loan-3', 'loan-4'], remainingSubsidyPrincipal: 714000, consumeDescription: '购买家用电器，家庭日常使用。', vouchers: [invoice, proof], consumeInfo: selfConsume,
  },
  {
    id: 'CI202606180002', interestAmount: 360, applyTime: '2026-06-18 11:08:42', source: 'system', consumeDate: '2026-06-18', approvedAt: '2026-06-19 16:03:08', status: 'passed', statusRemark: '核定通过', loanIds: ['loan-1'], remainingSubsidyPrincipal: 156000, consumeDescription: '系统识别符合条件的消费流水。', vouchers: [], systemConsumes: [systemConsumes[0]],
  },
  {
    id: 'CI202605230003', interestAmount: 558, applyTime: '2026-05-23 16:42:31', source: 'system', consumeDate: '2026-05-23', status: 'reviewing', statusRemark: '正在进行资质认定', loanIds: ['loan-1', 'loan-2'], remainingSubsidyPrincipal: 394000, consumeDescription: '系统识别符合条件的消费流水。', vouchers: [], systemConsumes: [systemConsumes[1]],
  },
  {
    id: 'CI202604090004', interestAmount: 210, applyTime: '2026-04-09 09:32:10', source: 'self', consumeDate: '2026-04-08', status: 'rejected', statusRemark: '资质不符合要求，请补充真实有效的消费凭证后重新申请。', loanIds: ['loan-2'], remainingSubsidyPrincipal: 238000, consumeDescription: '个人培训课程费用。', vouchers: [{ ...proof, id: 'voucher-proof-2', fileName: '培训合同.png' }], consumeInfo: { ...selfConsume, id: 'consume-self-2', consumeDate: '2026-04-08', amount: 7000, interestAmount: 210, purpose: '教育培训', loanIds: ['loan-2'] },
  },
  {
    id: 'CI202603160005', interestAmount: 120, applyTime: '2026-03-16 13:20:08', source: 'self', consumeDate: '2026-03-16', status: 'cancelled', statusRemark: '用户主动撤销申请', loanIds: ['loan-1'], remainingSubsidyPrincipal: 156000, consumeDescription: '家庭装修消费。', vouchers: [], consumeInfo: { ...selfConsume, id: 'consume-self-3', consumeDate: '2026-03-16', amount: 4000, interestAmount: 120, purpose: '装修消费', loanIds: ['loan-1'] },
  },
];

export const interestRecords: InterestRecord[] = [
  { id: 'IR202607030001', date: '2026-07-03', amount: 384, loanNo: 'XB202601180001', cardNo: '6214 **** 6688', interestTime: '2026-07-05 09:18:20', interestType: 'realtime' },
  { id: 'IR202606180002', date: '2026-06-18', amount: 360, loanNo: 'XB202601180001', cardNo: '6214 **** 6688', interestTime: '2026-06-19 16:03:08', interestType: 'subsidy' },
  { id: 'IR202605230003', date: '2026-05-23', amount: 558, loanNo: 'XB202603260015', cardNo: '6214 **** 6688', interestTime: '2026-05-30 10:42:16', interestType: 'reclaim' },
  { id: 'IR202604080004', date: '2026-04-08', amount: 210, loanNo: 'XB202603260015', cardNo: '6214 **** 6688', interestTime: '2026-04-10 14:12:02', interestType: 'realtime' },
  { id: 'IR202603120005', date: '2026-03-12', amount: 168, loanNo: 'XB202601180001', cardNo: '6214 **** 6688', interestTime: '2026-03-13 11:05:40', interestType: 'subsidy' },
];

let home: ConsumeInterestClientData['home'] = { agreementStatus: 'unsigned', eligibility: 'eligible', interestPeriod: { start: '2026-01-01', end: '2026-12-31' } };

export const consumeInterestClientData: ConsumeInterestClientData = {
  customer: { nickname: '张先生', mobile: '6888 **** 6688', avatarText: '张' },
  home,
  config: { showTransactionNo: true, maxProofCount: 6 },
  agreements: interestAgreements,
  loans: eligibleLoans,
  applications: consumeApplications,
  interestRecords,
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function paginate<T>(items: T[], page = 1, pageSize = 20): ListData<T> {
  const safePage = Math.max(1, page);
  return { list: items.slice((safePage - 1) * pageSize, safePage * pageSize), total: items.length, page: safePage, pagesize: pageSize };
}

function inDateRange(value: string, from?: string, to?: string): boolean {
  return (!from || value.slice(0, 10) >= from) && (!to || value.slice(0, 10) <= to);
}

export async function getConsumeInterestClientData(): Promise<ApiResponse<ConsumeInterestClientData>> {
  return respond(clone({ ...consumeInterestClientData, home }));
}

export async function signInterestAgreement(): Promise<ApiResponse<InterestAgreement>> {
  const now = '2026-09-07 10:00:00';
  home = { ...home, agreementStatus: 'signed' };
  const existing = interestAgreements[0];
  const signed = { ...existing, signedAt: now, effectiveDate: '2026-09-07', status: 'effective' as const };
  interestAgreements[0] = signed;
  return respond(clone(signed));
}

export async function getInterestAgreements(params: { page?: number; pageSize?: number } = {}): Promise<ApiResponse<ListData<InterestAgreement>>> {
  return respond(paginate(clone(interestAgreements), params.page, params.pageSize));
}

export async function getConsumeInterestApplications(params: ApplicationQuery = {}): Promise<ApiResponse<ListData<ConsumeInterestApplication>>> {
  const filtered = consumeApplications.filter((item) => (!params.status || item.status === params.status) && inDateRange(item.applyTime, params.from, params.to));
  return respond(paginate(clone(filtered), params.page, params.pageSize));
}

export async function getInterestRecords(params: InterestRecordQuery = {}): Promise<ApiResponse<ListData<InterestRecord>>> {
  const filtered = interestRecords.filter((item) => inDateRange(item.date, params.from, params.to));
  return respond(paginate(clone(filtered), params.page, params.pageSize));
}

export async function submitConsumeInterestApplication(payload: SubmitConsumeInterestPayload): Promise<SubmitConsumeInterestResponse> {
  const applicationId = `CI${Date.now()}`;
  const consumeInfo: ConsumeInfo = {
    id: `consume-${applicationId}`, account: payload.account, consumeDate: payload.consumeDate, transactionNo: payload.transactionNo, amount: payload.vouchers.find((item) => item.type === 'invoice')?.amount ?? 0, purpose: payload.purpose, interestAmount: 0, loanIds: payload.loanIds,
  };
  const application: ConsumeInterestApplication = {
    id: applicationId, interestAmount: 0, applyTime: '2026-09-07 10:00:00', source: 'self', consumeDate: payload.consumeDate, status: 'reviewing', statusRemark: '正在进行资质认定', loanIds: payload.loanIds, remainingSubsidyPrincipal: payload.loanIds.reduce((sum, id) => sum + (eligibleLoans.find((item) => item.id === id)?.remainingSubsidyPrincipal ?? 0), 0), consumeDescription: payload.description ?? '', vouchers: clone(payload.vouchers), consumeInfo,
  };
  consumeApplications.unshift(application);
  return respond({ application: clone(application) });
}

export async function cancelConsumeInterestApplication(applicationId: string): Promise<CancelApplicationResponse> {
  const application = consumeApplications.find((item) => item.id === applicationId);
  if (application) {
    application.status = 'cancelled';
    application.statusRemark = '用户主动撤销申请';
  }
  return respond({ applicationId, status: 'cancelled' });
}

export const getConsumeInterestLoans = async () => respond(clone(eligibleLoans));
export const getConsumeInterestAgreement = async () => respond(clone(interestAgreements[0]));
