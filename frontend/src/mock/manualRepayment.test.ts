import { describe, expect, it } from 'vitest';
import {
  calculateManualRepayment, getManualRepayments, manualRepaymentRecords, submitManualRepayment,
} from './manualRepayment';

describe('手动还款 Mock 服务', () => {
  it('返回列表并支持机构、客户名称和借据状态筛选', async () => {
    const response = await getManualRepayments({ page: 1, pageSize: 10, institutionName: '北京', customerName: '张三', loanStatus: '正常' });
    expect(response.code).toBe(0);
    expect(response.data.list.length).toBeGreaterThan(0);
    expect(response.data.list.every((item) => item.institutionName.includes('北京') && item.customerName === '张三' && item.loanStatus === '正常')).toBe(true);
  });

  it('分页数据包含还款计划和应还总额', async () => {
    const response = await getManualRepayments({ page: 2, pageSize: 5 });
    expect(response.data.total).toBe(manualRepaymentRecords.length);
    expect(response.data.list).toHaveLength(5);
    expect(response.data.list[0].plans.length).toBeGreaterThan(0);
    expect(response.data.list[0].dueTotal).toBeGreaterThan(0);
  });

  it('按费用、罚息、利息、本金顺序分配实际还款金额', () => {
    const record = manualRepaymentRecords[1];
    const calculation = calculateManualRepayment(record, { actualAmount: 100 });
    expect(calculation.actual.total).toBe(100);
    expect(calculation.actual.fee).toBeGreaterThan(0);
    expect(calculation.actual.principal).toBe(0);
    expect(calculation.actual.totalInterest).toBe(0);
  });

  it('提前部分还款使用输入本金计算实还结果', () => {
    const record = manualRepaymentRecords[0];
    const calculation = calculateManualRepayment(record, { repaymentType: '提前部分还款', partialPrincipal: 2000 });
    expect(calculation.actual.total).toBeGreaterThanOrEqual(2000);
    expect(calculation.actual.principal).toBeGreaterThan(0);
    expect(calculation.actual.total).toBeLessThanOrEqual(record.loanBalance + calculation.due.totalInterest + calculation.due.fee);
  });

  it('提交时校验借据和必填设置', async () => {
    const invalid = await submitManualRepayment([], {});
    expect(invalid.code).toBe(1);
    const valid = await submitManualRepayment([manualRepaymentRecords[0].id], {
      repaymentType: '正常还款', accountType: '内部户', accountNo: '1001', accountName: '测试客户',
    });
    expect(valid.code).toBe(0);
  });
});
