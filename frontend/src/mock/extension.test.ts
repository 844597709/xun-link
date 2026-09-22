import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import {
  calculateExtensionPlan,
  extensionDetails,
  extensionLoans,
  getExtensionDetails,
  getExtensionHistory,
  getExtensionLoans,
  revokeExtensionDetail,
  submitExtensionApplication,
} from './extension';

describe('延展期 Mock 服务', () => {
  it('生成32条贷款并按机构模糊、客户号精确筛选', async () => {
    expect(extensionLoans).toHaveLength(32);
    const loan = extensionLoans[0];
    const response = await getExtensionLoans({
      page: 1,
      pageSize: 50,
      institutionName: loan.institutionName.slice(0, 2),
      customerNo: loan.customerNo,
      idCardNo: loan.idCardNo,
      mobile: loan.mobile,
      loanNo: loan.loanNo,
      productName: loan.productName,
    });
    expect(response.code).toBe(0);
    expect(response.data.list).toHaveLength(1);
    expect(response.data.list[0]?.id).toBe(loan.id);
  });

  it('延展增加未来期数，且保留历史结清期次', async () => {
    const loan = extensionLoans.find((item) => item.settledPeriods > 0)!;
    const response = await calculateExtensionPlan(loan.id, '延展', 3);
    expect(response.code).toBe(0);
    expect(response.data).toHaveLength(loan.settledPeriods + loan.remainingTerm + 3);
    expect(response.data.filter((item) => item.status === '结清')).toHaveLength(loan.settledPeriods);
    expect(response.data.filter((item) => item.status === '待还')).toHaveLength(loan.remainingTerm + 3);
    expect(response.data[response.data.length - 1]?.remainingPrincipal).toBe(0);
  });

  it('摊薄月数最多12个月并缩短未来还款期数', async () => {
    const loan = extensionLoans[0];
    const response = await calculateExtensionPlan(loan.id, '摊薄', 12);
    expect(response.code).toBe(0);
    expect(response.data).toHaveLength(loan.settledPeriods + Math.max(1, loan.remainingTerm - 12));
    const invalid = await calculateExtensionPlan(loan.id, '摊薄', 13);
    expect(invalid.code).toBe(1);
    expect(invalid.message).toContain('不能超过12');
  });

  it('校验调整月数、超期开关和成功提交', async () => {
    const loan = extensionLoans[0];
    expect((await calculateExtensionPlan(loan.id, '延展', 0)).code).toBe(1);
    expect((await submitExtensionApplication({ loanId: loan.id, adjustmentType: '延展', adjustmentMonths: 1, allowExceedMaxTerm: false })).code).toBe(1);
    expect((await submitExtensionApplication({ loanId: loan.id, adjustmentType: '延展', adjustmentMonths: 1, allowExceedMaxTerm: true })).code).toBe(0);
    const normalLoan = extensionLoans[1];
    const success = await submitExtensionApplication({ loanId: normalLoan.id, adjustmentType: '延展', adjustmentMonths: 1, allowExceedMaxTerm: false });
    expect(success.code).toBe(0);
  });

  it('历史记录包含调整申请编号，明细覆盖全局状态及日期', async () => {
    const history = await getExtensionHistory(extensionLoans[2]!.id);
    expect(history.code).toBe(0);
    expect(history.data[0]).toEqual(expect.objectContaining({ applicationId: expect.stringMatching(/^EXT-/), adjustmentType: expect.stringMatching(/^(延展|摊薄)$/), newTotalTerm: expect.any(Number) }));
    const success = await getExtensionDetails({ page: 1, pageSize: 50, globalStatus: '成功' });
    expect(success.data.list.length).toBeGreaterThan(0);
    expect(success.data.list.every((item) => item.globalStatus === '成功')).toBe(true);
    expect(dayjs(success.data.list[0]?.expiryDate).isValid()).toBe(true);
  });

  it('成功和失败状态不可撤销，中间状态可以撤销', async () => {
    const success = extensionDetails.find((item) => item.globalStatus === '成功')!;
    const failure = extensionDetails.find((item) => item.globalStatus === '失败')!;
    const processing = extensionDetails.find((item) => item.globalStatus === '处理中')!;
    expect((await revokeExtensionDetail(success.id)).code).toBe(1);
    expect((await revokeExtensionDetail(failure.id)).code).toBe(1);
    expect((await revokeExtensionDetail(processing.id)).code).toBe(0);
    expect(extensionDetails.find((item) => item.id === processing.id)?.globalStatus).toBe('已撤销');
  });
});
