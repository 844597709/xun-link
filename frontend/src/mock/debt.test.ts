import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import {
  debtCombinationSchemes, debtLoans, debtRepaymentMethods, debtStageStatuses, getDebtApprovalRecords, getDebtDetails, getDebtLoans, getDebtRepaymentPlan,
} from './debt';

describe('债务重组 Mock 服务', () => {
  it('返回借据完整字段并支持机构、产品模糊筛选', async () => {
    const record = debtLoans[0];
    const response = await getDebtLoans({ page: 1, pageSize: 20, institutionName: record.institutionName.slice(0, 2), productName: record.productName.slice(0, 2) });
    expect(response.code).toBe(0);
    expect(response.data.list.length).toBeGreaterThan(0);
    expect(response.data.list.every((item) => item.institutionName.includes(record.institutionName.slice(0, 2)) && item.productName.includes(record.productName.slice(0, 2)))).toBe(true);
    expect(response.data.list[0]?.originalLoans.length).toBeGreaterThan(0);
  });

  it('支持客户与借据精确查询及借据状态筛选', async () => {
    const record = debtLoans[3];
    const response = await getDebtLoans({ page: 1, pageSize: 20, customerNo: record.customerNo, idCardNo: record.idCardNo, mobile: record.mobile, loanNo: record.loanNo, loanStatus: record.loanStatus });
    expect(response.data.list).toHaveLength(1);
    expect(response.data.list[0]?.id).toBe(record.id);
  });

  it('原借据计划按贷款期数返回并补齐金额字段', async () => {
    const response = await getDebtRepaymentPlan(1, { loanTerm: 12, repaymentMethod: '10 组合还款', normalRate: 4.35 });
    expect(response.code).toBe(0);
    expect(response.data).toHaveLength(12);
    expect(response.data[0]).toEqual(expect.objectContaining({ period: 1, dueDate: expect.any(String), amount: expect.any(Number), remainingPrincipal: expect.any(Number) }));
    expect(response.data[response.data.length - 1]?.remainingPrincipal).toBe(0);
  });

  it('明细阶段状态与交易阶段联动且支持日期范围', async () => {
    const record = (await getDebtDetails({ page: 1, pageSize: 50 })).data.list[2];
    const response = await getDebtDetails({ page: 1, pageSize: 50, transactionStage: record.transactionStage, stageStatus: record.stageStatus, applyDate: [dayjs(record.applyDate), dayjs(record.applyDate)] });
    expect(response.data.list).toHaveLength(1);
    expect(response.data.list[0]?.id).toBe(record.id);
    expect(debtStageStatuses[record.transactionStage]).toContain(record.stageStatus);
  });

  it('还款方式按编码顺序完整返回并包含组合方式', () => {
    expect(debtRepaymentMethods).toEqual([
      '一次性还本付息（1）', '先息后本（2）', '等额本息（3）', '等额本金（4）',
      '自定义还本还息（5）', '等额本息气球贷（6）', '等额本金气球贷（7）',
      '自定义还本还息气球贷（8）', '先息后本等额本息组合（10）',
      '先息后本等额本金组合（11）', '按月付息按计划还本（12）',
    ]);
  });

  it('组合还款方式和贷款期数均有效时可以试算计划', async () => {
    const response = await getDebtRepaymentPlan(1, { loanTerm: 24, repaymentMethod: '先息后本等额本息组合（10）', normalRate: 4.35 });
    expect(response.code).toBe(0);
    expect(response.data).toHaveLength(24);
    expect(response.data.every((item) => item.repaymentMethod === '先息后本等额本息组合（10）')).toBe(true);
  });

  it('预置还款方案阶段数量符合业务配置', () => {
    expect(debtCombinationSchemes.find((scheme) => scheme.id === 'debt-scheme-a')?.stages).toHaveLength(2);
    expect(debtCombinationSchemes.find((scheme) => scheme.id === 'debt-scheme-b')?.stages).toHaveLength(3);
  });

  it('审批列表第5条为债务重组审批记录', async () => {
    const response = await getDebtApprovalRecords();
    expect(response.data[4]).toMatchObject({ caseType: '案件贷后贷', caseSubtype: '债务重组审批记录' });
  });
});
