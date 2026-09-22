import { delay } from '../utils';
import type {
  ApiResponse,
  ComboBankCard,
  ComboCoupon,
  ComboPlanParams,
  ComboPlanResponse,
  ComboRepaymentData,
  ComboRepaymentItem,
  ComboRepaymentResponse,
  ComboRepaymentScheme,
  ComboRepaymentStage,
  ComboSubmitResponse,
  ComboTermOption,
} from '../types';

const terms = [6, 12, 24];
const purposes = ['个人消费', '装修家居', '教育培训'];
const toDate = (period: number) => `${2026 + Math.floor((8 + period) / 12)}-${String(((8 + period) % 12) + 1).padStart(2, '0')}-18`;

function createItems(amount: number, term: number, annualRate: number, couponDiscount = 0): ComboRepaymentItem[] {
  const principal = amount / term;
  const totalInterest = amount * annualRate / 100;
  return Array.from({ length: term }, (_, index) => {
    const discount = index === 0 ? Math.min(couponDiscount, totalInterest / 2) : 0;
    const interest = totalInterest / term;
    return {
      period: index + 1,
      date: toDate(index),
      principal,
      interest,
      discount,
      totalAmount: Math.max(0, principal + interest - discount),
    };
  });
}

function createScheme(term: number, sequence: number, annualRate: number): ComboRepaymentScheme {
  const id = `combo-${term}-${sequence}`;
  const items = createItems(10000, term, annualRate);
  const split = Math.max(1, Math.ceil(term / 2));
  const stages: ComboRepaymentStage[] = [
    { id: `${id}-stage-1`, startPeriod: 1, endPeriod: split, principalRatio: 0, repaymentLabel: '先息后本', items: items.slice(0, split) },
    { id: `${id}-stage-2`, startPeriod: split + 1, endPeriod: term, principalRatio: 100, repaymentLabel: '按计划还本', items: items.slice(split) },
  ];
  return { id, name: `方案${String.fromCharCode(64 + sequence)}`, term, annualRate, dailyRate: annualRate / 365, stages };
}

const termOptions: ComboTermOption[] = terms.map((term) => ({
  term,
  schemes: [createScheme(term, 1, term === 6 ? 5.2 : term === 12 ? 4.8 : 4.35), createScheme(term, 2, term === 6 ? 5.35 : term === 12 ? 4.95 : 4.5)],
}));

const coupons: ComboCoupon[] = [
  { id: 'coupon-38', name: '提现满减券', threshold: 10000, discount: 38, expiresAt: '2026-12-31' },
  { id: 'coupon-88', name: '借款优惠券', threshold: 50000, discount: 88, expiresAt: '2026-10-31' },
];

const bankCards: ComboBankCard[] = [
  { id: 'card-cmb-2866', bankName: '招商银行', cardType: '储蓄卡', maskedNo: '尾号 2866', enabled: true },
  { id: 'card-icbc-7632', bankName: '工商银行', cardType: '储蓄卡', maskedNo: '尾号 7632', enabled: true },
];

const data: ComboRepaymentData = {
  credit: { total: 500000, used: 186000, available: 314000, dailyRateRange: '0.04% - 0.05%', repaymentMethod: '按月付息按计划还本' },
  terms: termOptions,
  coupons,
  bankCards,
  records: [
    { id: 'record-1', applicationNo: 'CR202608180001', amount: 10000, bankName: '招商银行', maskedNo: '尾号 2866', status: '已完成', createdAt: '2026-08-18 10:20' },
  ],
};

const response = <T,>(value: T, message: string): Promise<ApiResponse<T>> => delay({ code: 0, data: value, message }, 300, 800);

export async function getComboRepaymentData(): Promise<ComboRepaymentResponse> {
  return response(data, '组合还款提现数据加载成功');
}

export async function getComboRepaymentPlan(params: ComboPlanParams): Promise<ComboPlanResponse> {
  const scheme = termOptions.flatMap((item) => item.schemes).find((item) => item.id === params.schemeId && item.term === params.term);
  const annualRate = scheme?.annualRate ?? 4.35;
  return response(createItems(params.amount, params.term, annualRate, params.couponDiscount), '还款计划加载成功');
}

export async function submitComboRepayment(params: ComboPlanParams & { bankCard: string }): Promise<ComboSubmitResponse> {
  return response({
    applicationNo: `CR${Date.now()}`,
    submittedAt: '2026-09-07 10:00',
    status: '提交成功',
    loanAmount: params.amount,
    bankCard: params.bankCard,
    notice: '预计 5 分钟内完成放款，结果将通过微信/短信通知',
  }, '借款申请已提交');
}

export { bankCards, coupons, data as comboRepaymentData, purposes, termOptions };
