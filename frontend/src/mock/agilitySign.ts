import { delay } from '../utils';
import type { AgilitySignResponse, AgilitySignData, SignRepaymentPlan } from '../types/agilitySign';

const plans: SignRepaymentPlan[] = [
  { period: 7, date: '2026年09月20日', total: 9066.67, principal: 6500, interest: 2566.67, discount: 180, status: '未还' },
  { period: 8, date: '2026年10月20日', total: 8980.23, principal: 6500, interest: 2480.23, discount: 120, status: '未还' },
  { period: 9, date: '2026年11月20日', total: 8893.80, principal: 6500, interest: 2393.80, status: '未还' },
  { period: 10, date: '2026年12月20日', total: 8807.36, principal: 6500, interest: 2307.36, discount: 100, status: '未还' },
  { period: 11, date: '2027年01月20日', total: 8720.93, principal: 6500, interest: 2220.93, status: '未还' },
  { period: 6, date: '2026年08月20日', total: 9153.10, principal: 6500, interest: 2653.10, status: '已还' },
  { period: 5, date: '2026年07月20日', total: 9239.54, principal: 6500, interest: 2739.54, status: '已还' },
];

const signData: AgilitySignData = {
  loanNo: 'LD20260318000128',
  usedAmount: 260000,
  loanAmount: 300000,
  totalPeriods: 36,
  remainingPeriods: 30,
  voucherStatus: '已上传',
  repaymentPlans: plans,
  adjustmentPlans: Array.from({ length: 30 }, (_, index) => {
    const total = 324800 / 30;
    const principal = 10000;
    return {
      period: index + 1,
      date: `${2026 + Math.floor((8 + index) / 12)}年${String((8 + index) % 12 + 1).padStart(2, '0')}月20日`,
      total,
      principal,
      interest: total - principal,
      discount: index % 3 === 0 ? 200 : undefined,
      status: '未还' as const,
    };
  }),
  adjustment: {
    originalRepaymentMethod: '等额本息',
    newRepaymentMethod: '先息后本·等额本金组合',
    originalTotalPeriods: 36,
    newTotalPeriods: 36,
    originalRemainingPeriods: 30,
    newRemainingPeriods: 30,
    originalNormalRate: '4.35%',
    newNormalRate: '4.35%',
    originalPenaltyRate: '8.70%',
    newPenaltyRate: '7.25%',
    originalCompoundRate: '12.00%',
    newCompoundRate: '10.00%',
    interestRelief: '2,800.00元',
    firstPaymentDelay: '1个月',
  },
  schemes: [
    { period: '第1-18期', method: '先息后本', principalRatio: '本金30%', description: '前18期按月支付利息，期末归还约定比例本金，减轻近期还款压力。' },
    { period: '第19-30期', method: '等额本金', principalRatio: '本金70%', description: '剩余期数按等额本金方式偿还，剩余本金逐期递减。' },
    { period: '第31-36期', method: '等额本息', principalRatio: '本金100%', description: '最后阶段按等额本息方式结清剩余贷款本息。' },
  ],
  loanPeriod: '2024年03月20日 - 2027年03月20日',
};

export async function getAgilitySignData(): Promise<AgilitySignResponse> {
  return delay({ code: 0, data: signData, message: 'success' }, 400, 700);
}
