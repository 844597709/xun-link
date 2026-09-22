import { describe, expect, it } from 'vitest';
import {
  getLoanSubsidy,
  getSubsidyAgreement,
  getSubsidyAgreements,
  getSubsidyApprovals,
  getSubsidyFlow,
  getSubsidyFlows,
  getSubsidyRules,
  getSystemApprovals,
  getConsumeSubsidy,
  getConsumeSubsidies,
  consumeSubsidies,
  loanSubsidies,
  subsidyAgreements,
  subsidyFlows,
  subsidyRules,
  submitManualRecovery,
  submitManualSubsidy,
  terminateConsumeSubsidy,
} from './subsidy';

describe('贴息运营 Mock 服务', () => {
  it('规则列表支持机构、状态和分页', async () => {
    const response = await getSubsidyRules({ page: 1, pageSize: 5, institutionName: '北京分行', status: '生效' });
    expect(response.code).toBe(0);
    expect(response.data.list.length).toBeLessThanOrEqual(5);
    expect(response.data.list.every((item) => item.institutionName === '北京分行' && item.status === '生效')).toBe(true);
  });

  it('流水只筛选指定类型和状态，并返回消费明细', async () => {
    const response = await getSubsidyFlows({ page: 1, pageSize: 50, type: '补贴息', status: '失败' });
    expect(response.data.list.length).toBeGreaterThan(0);
    expect(response.data.list.every((item) => item.type === '补贴息' && item.status === '失败')).toBe(true);
    expect(response.data.list[0]?.consumptionDetails.length).toBeGreaterThan(0);
  });

  it('系统核定支持交易类型和状态筛选', async () => {
    const response = await getSystemApprovals({ page: 1, pageSize: 50, transactionType: '退款', status: '初始化' });
    expect(response.data.list.every((item) => item.transactionType === '退款' && item.status === '初始化')).toBe(true);
  });

  it('贷款贴息详情包含五类明细', async () => {
    const response = await getLoanSubsidy(loanSubsidies[0]!.id);
    expect(Object.keys(response.data.tabs)).toHaveLength(5);
    expect(response.data.baseInfo).toHaveProperty('贷款编号');
  });

  it('失败补贴息可以提交审批流', async () => {
    const flow = subsidyFlows.find((item) => item.type === '补贴息' && item.status === '失败')!;
    const detail = await getSubsidyFlow(flow.id);
    expect(detail.data.failureReason).not.toBe('');
    const response = await submitManualSubsidy(flow.id, { remark: '核对卡号后重试', retryCards: ['6222 **** 1001'] });
    expect(response.code).toBe(0);
    expect(response.data).toHaveProperty('approvalNo');
  });

  it('流水详情按类型提供贴息或收回金额，并包含退款明细', async () => {
    const flow = subsidyFlows.find((item) => item.refundDetails.length > 0)!;
    const response = await getSubsidyFlow(flow.id);
    expect(response.data.refundDetails.length).toBeGreaterThan(0);
    expect(response.data.consumptionDetails[0]).toHaveProperty('approvedAt');
    expect(response.data.expectedRecoveryAmount).toBeGreaterThanOrEqual(0);
  });

  it('收回贴息失败记录支持手动重试', async () => {
    const flow = subsidyFlows.find((item) => item.type === '收回贴息' && item.status === '失败')!;
    const response = await submitManualRecovery(flow.id, { remark: '确认收回卡号后重试', retryCards: flow.retryCards.slice(0, 1) });
    expect(response.code).toBe(0);
    expect(response.data).toHaveProperty('approvalNo');
  });

  it('协议列表覆盖银行 APP 场景且详情可查询', async () => {
    const bankApp = subsidyAgreements.find((item) => item.channel === '银行APP签署')!;
    expect(bankApp.contractNo).toBe('-');
    const response = await getSubsidyAgreement(bankApp.id);
    expect(response.data.channel).toBe('银行APP签署');
    const list = await getSubsidyAgreements({ page: 1, pageSize: 50, signingChannel: '银行APP签署' });
    expect(list.data.list.every((item) => item.channel === '银行APP签署')).toBe(true);
  });

  it('消费贴息列表返回详情分摊和退款数据', async () => {
    const response = await getConsumeSubsidies({ page: 1, pageSize: 50 });
    expect(response.data.list).toHaveLength(24);
    const record = response.data.list.find((item) => item.refunds.length > 0)!;
    const detail = await getConsumeSubsidy(record.id);
    expect(detail.data.allocations.length).toBeGreaterThan(0);
    expect(detail.data.refundAmount).toBeGreaterThan(0);
    const byIdCard = await getConsumeSubsidies({ page: 1, pageSize: 50, idCardNo: record.idCardNo });
    expect(byIdCard.data.list.every((item) => item.idCardNo === record.idCardNo)).toBe(true);
  });

  it('终止成功消费后更新消费状态并拒绝重复终止', async () => {
    const record = consumeSubsidies.find((item) => item.status === '成功')!;
    const response = await terminateConsumeSubsidy(record.id, '消费异常终止');
    expect(response.code).toBe(0);
    if (!response.data) throw new Error('终止贴息返回数据为空');
    expect(['已冲正', '已失效']).toContain(response.data.status);
    const repeated = await terminateConsumeSubsidy(record.id, '重复终止');
    expect(repeated.code).toBe(1);
  });

  it('非通过核定记录仍保留申请数据并可按状态筛选', async () => {
    const response = await getSubsidyRules({ page: 1, pageSize: 50 });
    expect(response.data.list.length).toBeGreaterThan(0);
    const approvals = await getSubsidyApprovals({ page: 1, pageSize: 50, status: '审核中' });
    expect(approvals.data.list.every((item) => item.status === '审核中')).toBe(true);
  });

  it('规则详情包含完整参数', async () => {
    const response = await getSubsidyRules({ page: 1, pageSize: 1 });
    const rule = response.data.list[0];
    expect(rule).toBeDefined();
    expect(rule).toHaveProperty('calculationRule');
    expect(rule).toHaveProperty('minConsumptionAmount');
    expect(subsidyRules.length).toBeGreaterThanOrEqual(20);
  });
});
