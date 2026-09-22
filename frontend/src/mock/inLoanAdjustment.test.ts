import { describe, expect, it } from 'vitest';
import {
  calculateInLoanPlan,
  getInLoanAdjustmentDetails,
  getInLoanLoans,
  inLoanApplications,
  revokeInLoanAdjustment,
  submitInLoanAdjustment,
} from './inLoanAdjustment';

describe('在贷要素调整 Mock 服务', () => {
  it('返回借据列表并支持机构、客户号筛选', async () => {
    const response = await getInLoanLoans({ page: 1, pageSize: 10, institutionName: '北京', customerNo: 'CUST00001' });
    expect(response.code).toBe(0);
    expect(response.data.list).toHaveLength(1);
    expect(response.data.list[0].institutionName).toContain('北京');
  });

  it('返回申请明细并支持状态、渠道和日期范围筛选', async () => {
    const response = await getInLoanAdjustmentDetails({ page: 1, pageSize: 20, status: '待签约', applicationChannel: '单笔发起' });
    expect(response.code).toBe(0);
    expect(response.data.list.length).toBeGreaterThan(0);
    expect(response.data.list.every((item) => item.status === '待签约' && item.applicationChannel === '单笔发起')).toBe(true);
  });

  it('期数变更会生成完整还款计划并计算剩余期数', async () => {
    const response = await calculateInLoanPlan(2, {
      adjustmentElements: ['term'],
      newTotalTerm: 48,
    });
    expect(response.code).toBe(0);
    expect(response.data).toHaveLength(48);
    expect(response.data[0]).toEqual(expect.objectContaining({ period: 1, status: '结清' }));
    expect(response.data[47]).toHaveProperty('dueInterest');
  });

  it('新总期数不大于已结清期数时返回业务错误', async () => {
    const response = await calculateInLoanPlan(2, { adjustmentElements: ['term'], newTotalTerm: 1 });
    expect(response.code).toBe(1);
    expect(response.message).toContain('已结清期数');
  });

  it('待签约申请支持撤销并拒绝重复撤销', async () => {
    const application = inLoanApplications.find((item) => item.status === '待签约');
    expect(application).toBeDefined();
    const first = await revokeInLoanAdjustment(application!.applicationId);
    const second = await revokeInLoanAdjustment(application!.applicationId);
    expect(first.code).toBe(0);
    expect(second.code).toBe(1);
  });

  it('提交申请后明细增加待签约记录并格式化失效日期', async () => {
    const before = inLoanApplications.length;
    const response = await submitInLoanAdjustment(2, {
      adjustmentElements: ['rate'],
      newNormalRate: 4.1,
      newPenaltyRate: 6.2,
      newCompoundRate: 8.1,
      reason: '测试申请',
      expiryDate: { format: () => '2026-12-31' },
    });
    expect(response.code).toBe(0);
    expect(inLoanApplications.length).toBe(before + 1);
    expect(inLoanApplications[0].status).toBe('待签约');
    expect(inLoanApplications[0].expiryDate).toBe('2026-12-31');
  });
});
