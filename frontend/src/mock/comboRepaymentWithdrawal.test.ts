import { describe, expect, it } from 'vitest';
import { getComboRepaymentData, getComboRepaymentPlan, submitComboRepayment } from './comboRepaymentWithdrawal';

describe('组合还款提现 Mock 服务', () => {
  it('返回额度、期数、优惠券、银行卡和借还记录', async () => {
    const response = await getComboRepaymentData();
    expect(response.code).toBe(0);
    expect(response.data.credit.available).toBe(314000);
    expect(response.data.terms.map((item) => item.term)).toEqual([6, 12, 24]);
    expect(response.data.coupons.length).toBeGreaterThan(0);
    expect(response.data.bankCards.every((item) => item.enabled)).toBe(true);
    expect(response.data.records.length).toBeGreaterThan(0);
  });

  it('根据金额、期数和方案生成对应期数的还款计划', async () => {
    const { data } = await getComboRepaymentData();
    const scheme = data.terms.find((item) => item.term === 12)?.schemes[0];
    expect(scheme).toBeDefined();
    const response = await getComboRepaymentPlan({ amount: 12000, term: 12, schemeId: scheme!.id, couponDiscount: 38 });
    expect(response.code).toBe(0);
    expect(response.data).toHaveLength(12);
    expect(response.data[0].discount).toBe(38);
    expect(response.data.every((item) => item.totalAmount >= 0)).toBe(true);
  });

  it('提交接口返回申请编号、金额和收款账户', async () => {
    const response = await submitComboRepayment({ amount: 10000, term: 6, schemeId: 'combo-6-1', bankCard: '招商银行（尾号 2866）' });
    expect(response.code).toBe(0);
    expect(response.data.applicationNo).toMatch(/^CR/);
    expect(response.data.loanAmount).toBe(10000);
    expect(response.data.bankCard).toContain('招商银行');
  });
});
