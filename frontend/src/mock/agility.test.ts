import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import { agilityApplications, calculateAgilityPlan, getAgilityApplications } from './agility';
import type { AgilityFormValues } from '../types';

const values: AgilityFormValues = {
  newRepaymentMethod: '等额本息',
  newRemainingTerm: 12,
  interestReliefEnabled: false,
  firstPaymentDelayAllowed: false,
  firstPaymentDelayMonths: 0,
  newNormalRate: 4.1,
  newPenaltyRate: 6.1,
  collectCompoundInterest: false,
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

  it('超过产品最长期限时阻断试算并返回提示', async () => {
    const response = await calculateAgilityPlan(1, { ...values, newRemainingTerm: 37 });
    expect(response.code).toBe(1);
    expect(response.message).toContain('37期');
    expect(response.message).toContain('36期');
  });

  it('有效期数返回对应数量的还款计划', async () => {
    const response = await calculateAgilityPlan(1, values);
    expect(response.code).toBe(0);
    expect(response.data).toHaveLength(12);
    expect(response.data[0].period).toBe(1);
    expect(response.data[response.data.length - 1]?.remainingPrincipal).toBe(0);
  });

  it('按贷款基础字段精确过滤并支持到期日期范围', async () => {
    const record = agilityApplications[0];
    const response = await getAgilityApplications({
      page: 1,
      pageSize: 50,
      institutionCode: record.institutionCode,
      customerNo: record.customerNo,
      mobile: record.mobile,
      idCardNo: record.idCardNo,
      loanNo: record.loanNo,
      loanStatus: record.loanStatus,
      accountStatus: record.accountStatus,
      maturityDate: [dayjs(record.maturityDate), dayjs(record.maturityDate)],
    });
    expect(response.code).toBe(0);
    expect(response.data.list).toHaveLength(1);
    expect(response.data.list[0]).toMatchObject({
      id: record.id,
      repaymentMethod: record.repaymentMethod,
      loanTerm: record.loanTerm,
      maturityDate: record.maturityDate,
      nextRepaymentDate: record.nextRepaymentDate,
    });
  });

  it('贷款记录包含申请列表所需的独立字段', () => {
    expect(agilityApplications).toHaveLength(36);
    expect(agilityApplications.every((item) => item.loanAmount > item.loanBalance)).toBe(true);
    expect(agilityApplications.every((item) => item.repaymentMethod && item.loanTerm > 0)).toBe(true);
  });
});
