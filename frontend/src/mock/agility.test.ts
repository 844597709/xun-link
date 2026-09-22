import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import {
  agilityApplications, calculateAgilityPlan, formatAgilitySchemeSummary, getAgilityApplications, getAgilityRepaymentSchemes, submitAgilityApplication,
} from './agility';
import type { AgilityFormValues } from '../types';

const values: AgilityFormValues = {
  newRepaymentMethod: '等额本息',
  newRemainingTerm: 12,
  newNormalRate: 4.1,
  newPenaltyRate: 6.1,
  newCompoundRate: 8.2,
  interestCycle: '按月还息',
  principalCycle: '按年还本',
};

describe('灵动重组 Mock 服务', () => {
  it('按机构名称模糊过滤且默认申请时间倒序', async () => {
    const response = await getAgilityApplications({ page: 1, pageSize: 50, institutionName: '北京' });
    expect(response.code).toBe(0);
    expect(response.data.list.length).toBeGreaterThan(0);
    expect(response.data.list.every((item) => item.institutionName.includes('北京'))).toBe(true);
    const last = response.data.list[response.data.list.length - 1];
    expect(response.data.list[0].applyTime >= last.applyTime).toBe(true);
  });

  it('试算不在阶段校验最长期限，计划总期数等于已结清期数加正常未还期数', async () => {
    const loan = agilityApplications.find((item) => item.settledPeriods > 0)!;
    const response = await calculateAgilityPlan(loan.id, { ...values, newRemainingTerm: 12 });
    expect(response.code).toBe(0);
    expect(response.data).toHaveLength(loan.settledPeriods + 12);
    expect(response.data.filter((item) => item.status === '结清')).toHaveLength(loan.settledPeriods);
    expect(response.data.filter((item) => item.status === '正常')).toHaveLength(12);
  });

  it('不允许超期的贷款在提交阶段阻断，允许超期的贷款可以提交', async () => {
    const blockedLoan = agilityApplications.find((item) => !item.allowExceedMaxTerm)!;
    const blocked = await submitAgilityApplication(blockedLoan.id, { ...values, newRemainingTerm: blockedLoan.maxTerm });
    expect(blocked.code).toBe(1);
    expect(blocked.message).toContain('超过产品最长贷款期限');

    const allowedLoan = agilityApplications.find((item) => item.allowExceedMaxTerm)!;
    const allowed = await submitAgilityApplication(allowedLoan.id, { ...values, newRemainingTerm: allowedLoan.maxTerm + 1 });
    expect(allowed.code).toBe(0);
  });

  it('有效期数返回对应数量的还款计划并补齐14项字段', async () => {
    const response = await calculateAgilityPlan(1, values);
    expect(response.code).toBe(0);
    expect(response.data).toHaveLength(12);
    expect(response.data[0].period).toBe(1);
    expect(response.data[response.data.length - 1]?.remainingPrincipal).toBe(0);
    expect(response.data[0]).toEqual(expect.objectContaining({
      period: expect.any(Number),
      startDate: expect.any(String),
      dueDate: expect.any(String),
      status: expect.stringMatching(/^(结清|正常)$/),
      initialPrincipal: expect.any(Number),
      initialInterest: expect.any(Number),
      remainingPrincipal: expect.any(Number),
      paidAmount: expect.any(Number),
      paidPrincipal: expect.any(Number),
      paidInterest: expect.any(Number),
      dueAmount: expect.any(Number),
      duePrincipal: expect.any(Number),
      dueInterest: expect.any(Number),
      adjustmentInterest: expect.any(Number),
    }));
    expect(response.data.every((item) => item.adjustmentInterest < 0)).toBe(true);
  });

  it('按机构、客户和借据字段过滤，并支持申请日期范围', async () => {
    const record = agilityApplications[0];
    const response = await getAgilityApplications({
      page: 1,
      pageSize: 50,
      institutionName: record.institutionName,
      customerNo: record.customerNo,
      idCardNo: record.idCardNo,
      mobile: record.mobile,
      loanNo: record.loanNo,
      productName: record.productName,
      applyTime: [dayjs(record.applyTime), dayjs(record.applyTime)],
    });
    expect(response.code).toBe(0);
    expect(response.data.list).toHaveLength(1);
    expect(response.data.list[0]).toMatchObject({
      id: record.id,
      repaymentMethod: record.repaymentMethod,
      maturityDate: record.maturityDate,
      nextRepaymentDate: record.nextRepaymentDate,
    });
  });

  it('贷款记录包含完整借据字段，账户状态正常且借据状态覆盖四类', () => {
    expect(agilityApplications).toHaveLength(36);
    expect(agilityApplications.every((item) => item.loanAmount > item.loanBalance)).toBe(true);
    expect(agilityApplications.every((item) => item.loanAccount && item.currency && item.startDate)).toBe(true);
    expect(new Set(agilityApplications.map((item) => item.loanStatus))).toEqual(new Set(['正常', '逾期', '减值', '核销']));
    expect(agilityApplications.every((item) => item.accountStatus === '正常')).toBe(true);
  });

  it('按组合方式和新剩余期数加载系统方案，并将自定义方案放在最后', async () => {
    const response = await getAgilityRepaymentSchemes('11', 30, 24);
    expect(response.code).toBe(0);
    expect(response.data).toHaveLength(3);
    expect(response.data[0]?.stages).toHaveLength(2);
    expect(response.data[1]?.stages).toHaveLength(3);
    expect(response.data[0]?.stages[0]).toMatchObject({ startPeriod: 1, repaymentMethod: '先息后本（2）', principalRatio: 0 });
    expect(response.data[0]?.stages[1]).toMatchObject({ endPeriod: 24, repaymentMethod: '等额本金（11）', principalRatio: 100 });
    expect(response.data[1]?.stages[0]).toMatchObject({ startPeriod: 1, repaymentMethod: '先息后本（2）', principalRatio: 0 });
    expect(response.data[1]?.stages[1]).toMatchObject({ repaymentMethod: '等额本金（11）', principalRatio: 40 });
    expect(response.data[1]?.stages[2]).toMatchObject({ endPeriod: 24, repaymentMethod: '等额本金（11）', principalRatio: 60 });
    expect(response.data[response.data.length - 1]).toMatchObject({ id: 'custom', name: '其他（自定义还款方案）', custom: true });
    expect(response.data[0]?.stages[response.data[0].stages.length - 1]).toMatchObject({ endPeriod: 24, repaymentMethod: '等额本金（11）' });
    expect(response.data[0]?.id).toContain('30-24');
  });

  it('短期期数下方案阶段仍在新剩余期数范围内', async () => {
    const response = await getAgilityRepaymentSchemes('10', 30, 2);
    expect(response.code).toBe(0);
    expect(response.data[0]?.stages).toHaveLength(2);
    expect(response.data[1]?.stages).toHaveLength(2);
    expect(response.data.slice(0, 2).every((scheme) => scheme.stages.every((stage) => stage.startPeriod >= 1 && stage.endPeriod <= 2))).toBe(true);
  });
  it('一至两期时方案阶段按合法数量降级且保持连续', async () => {
    for (const newTerm of [1, 2]) {
      const response = await getAgilityRepaymentSchemes('12', 30, newTerm);
      expect(response.code).toBe(0);
      response.data.slice(0, 2).forEach((scheme) => {
        expect(scheme.stages.every((stage) => stage.startPeriod >= 1 && stage.endPeriod <= newTerm)).toBe(true);
        expect(scheme.stages.every((stage, index) => stage.sequence === index + 1)).toBe(true);
        expect(scheme.stages.every((stage, index) => index === 0 || stage.startPeriod === scheme.stages[index - 1]!.endPeriod + 1)).toBe(true);
      });
    }
  });

  it('方案摘要去除内部还款方式编码并按阶段拼接', () => {
    expect(formatAgilitySchemeSummary({
      id: 'summary',
      name: '方案',
      stages: [
        { sequence: 1, startPeriod: 1, endPeriod: 12, repaymentMethod: '先息后本（2）', principalRatio: 20 },
        { sequence: 2, startPeriod: 13, endPeriod: 24, repaymentMethod: '等额本息（10）', principalRatio: 80 },
      ],
    })).toBe('1-12期 先息后本 20%  13-24期 等额本息 80%');
  });


  it('按交易阶段联动筛选阶段状态，并支持全局状态筛选', async () => {
    const record = agilityApplications.find((item) => item.transactionStage === '审批阶段')!;
    const response = await getAgilityApplications({
      page: 1,
      pageSize: 50,
      transactionStage: record.transactionStage,
      stageStatus: record.stageStatus,
      globalStatus: record.globalStatus,
    });
    expect(response.data.list).toHaveLength(1);
    expect(response.data.list[0]?.id).toBe(record.id);
  });
});
