import { delay } from '../utils';
import type { DebtSignData, DebtSignResponse, DebtSignSubmitResponse } from '../types';

const notes = [
  {
    id: 1, title: '信用消费类剩余本金', loanNo: 'DB202608180001', overdue: true,
    remainingPrincipal: 260000, totalInterest: 22000, totalPenalty: 2800, recoveryDiscount: 1200,
    currentPeriod: 6, totalPeriods: 36, dueInterest: 22000, penalty: 2800, term: '36个月', remainingPeriods: 30,
    principal: 300000, rate: '4.35%', productName: '个人消费贷',
  },
  {
    id: 2, title: '信用消费类剩余本金', loanNo: 'DB202608180002', overdue: false,
    remainingPrincipal: 84000, totalInterest: 7200, totalPenalty: 0, recoveryDiscount: 400,
    currentPeriod: 8, totalPeriods: 24, dueInterest: 7200, penalty: 0, term: '24个月', remainingPeriods: 16,
    principal: 100000, rate: '4.35%', productName: '个人消费贷',
  },
  {
    id: 3, title: '信用消费类剩余本金', loanNo: 'DB202608180003', overdue: false,
    remainingPrincipal: 52000, totalInterest: 4600, totalPenalty: 0, recoveryDiscount: 300,
    currentPeriod: 4, totalPeriods: 18, dueInterest: 4600, penalty: 0, term: '18个月', remainingPeriods: 14,
    principal: 60000, rate: '4.35%', productName: '个人消费贷',
  },
];

const repaymentPlan = Array.from({ length: 30 }, (_, index) => {
  const principal = 260000 / 30;
  const interest = 64800 / 30;
  return {
    period: index + 1,
    dueDate: `${2026 + Math.floor((8 + index) / 12)}-${String(((8 + index) % 12) + 1).padStart(2, '0')}-20`,
    amount: principal + interest,
    principal,
    interest,
  };
});

const data: DebtSignData = {
  todos: [
    { id: 1, title: '借新还旧', productName: '个人消费贷', deadline: '2026-08-20 23:59', tip: '申请前需还清旧借据利息部分，本部分将生成一笔新借据', createdAt: '2026-08-18 10:26', status: '未处理', mode: 'single' },
    { id: 2, title: '借新还旧', productName: '个人消费贷（批量）', deadline: '2026-08-22 23:59', tip: '请确认所选借据，提交后旧借据本金将生成新借据', createdAt: '2026-08-18 09:12', status: '未处理', mode: 'batch' },
    { id: 3, title: '借新还旧', productName: '个人消费贷', deadline: '2026-08-12 23:59', tip: '已完成签约，等待系统归档', createdAt: '2026-08-10 14:08', status: '已处理', mode: 'single' },
  ],
  notes,
  plan: {
    principal: 260000,
    annualRate: '4.35%',
    normalRate: '4.35%',
    penaltyRate: '6.53%',
    compoundRate: '6.53%',
    firstPaymentDelayMonths: 2,
    repaymentMethod: '按月付息按计划还本',
    term: '36期',
    purpose: '偿还原借据本金',
    account: '招商银行（尾号 2866）',
    repaymentAccount: '中国工商银行 8888',
    receivingAccount: '中国工商银行 ****8888',
    interestReliefAmount: -360,
    repaymentStages: [
      { sequence: 1, startPeriod: 1, endPeriod: 18, repaymentMethod: '先息后本', principalRatio: '本金30%', description: '第1-18期先息后本，本金30%' },
      { sequence: 2, startPeriod: 19, endPeriod: 30, repaymentMethod: '等额本金', principalRatio: '本金70%', description: '第19-30期先息后本金70%' },
    ],
  },
  repaymentPlan,
};

export async function getDebtSignData(): Promise<DebtSignResponse> {
  return delay({ code: 0, data, message: '债务重组签约数据加载成功' }, 400, 700);
}

export async function submitDebtSign(noteIds: number[]): Promise<DebtSignSubmitResponse> {
  return delay({ code: 0, data: { applicationNo: `DR${Date.now()}` }, message: `已提交${noteIds.length}笔借据，系统处理中` }, 600, 800);
}
