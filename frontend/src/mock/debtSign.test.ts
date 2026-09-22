import { describe, expect, it } from 'vitest';
import { getDebtSignData, submitDebtSign } from './debtSign';

describe('债务重组签约 Mock 服务', () => {
  it('返回未处理/已处理待办及单笔、批量模式', async () => {
    const response = await getDebtSignData();
    expect(response.code).toBe(0);
    expect(response.data.todos).toHaveLength(3);
    expect(response.data.todos.some((item) => item.status === '未处理' && item.mode === 'single')).toBe(true);
    expect(response.data.todos.some((item) => item.status === '未处理' && item.mode === 'batch')).toBe(true);
  });

  it('借据包含金额联动所需字段，且还款计划为30期', async () => {
    const { data } = await getDebtSignData();
    expect(data.notes).toHaveLength(3);
    expect(data.notes[0]).toEqual(expect.objectContaining({ overdue: true, remainingPrincipal: 260000, totalInterest: expect.any(Number) }));
    expect(data.repaymentPlan).toHaveLength(30);
    expect(data.repaymentPlan.every((item) => item.amount === item.principal + item.interest)).toBe(true);
  });

  it('提交接口返回申请编号和处理中消息', async () => {
    const response = await submitDebtSign([1, 2]);
    expect(response.code).toBe(0);
    expect(response.data.applicationNo).toMatch(/^DR/);
    expect(response.message).toContain('2笔借据');
  });
});
