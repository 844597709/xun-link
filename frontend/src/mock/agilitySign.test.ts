import { describe, expect, it } from 'vitest';
import { getAgilitySignData } from './agilitySign';

describe('灵动重组签约 Mock 服务', () => {
  it('返回详情金额、期数和未还/已还计划', async () => {
    const response = await getAgilitySignData();
    expect(response.code).toBe(0);
    expect(response.data.loanAmount).toBe(300000);
    expect(response.data.totalPeriods).toBe(36);
    expect(response.data.repaymentPlans.length).toBeGreaterThan(2);
    expect(response.data.repaymentPlans.some((item) => item.status === '未还')).toBe(true);
    expect(response.data.repaymentPlans.some((item) => item.status === '已还')).toBe(true);
  });

  it('返回签约对比字段和三阶段组合方案', async () => {
    const { data } = await getAgilitySignData();
    expect(data.adjustment.newRepaymentMethod).toContain('组合');
    expect(data.schemes).toHaveLength(3);
    expect(data.schemes[0]).toEqual(expect.objectContaining({ period: '第1-18期', principalRatio: '本金30%' }));
    expect(data.schemes[data.schemes.length - 1]?.period).toBe('第31-36期');
  });

  it('新还款计划包含本金、利息和应还总额', async () => {
    const { data } = await getAgilitySignData();
    expect(data.adjustmentPlans).toHaveLength(30);
    expect(data.adjustmentPlans.every((item) => item.total === item.principal + item.interest)).toBe(true);
  });
});
