import { beforeEach, describe, expect, it } from 'vitest';
import {
  getStopBatchDeductionDetails,
  getStopBatchDeductionExecutions,
  resetStopBatchDeductionMock,
  restoreBatchDeduction,
  stopBatchDeduction,
} from './stopBatchDeduction';

describe('停止批扣 Mock', () => {
  beforeEach(() => resetStopBatchDeductionMock());

  it('支持执行列表筛选和分页', async () => {
    const response = await getStopBatchDeductionExecutions({ page: 1, pageSize: 5, institutionName: '北京分行', loanStatus: '正常' });
    expect(response.code).toBe(0);
    expect(response.data.pagesize).toBe(5);
    expect(response.data.list.every((item) => item.institutionName === '北京分行' && item.loanStatus === '正常')).toBe(true);
  });

  it('支持按停扣标志筛选执行列表', async () => {
    const stopped = await getStopBatchDeductionExecutions({ page: 1, pageSize: 50, stopDeductionFlag: '是' });
    const notStopped = await getStopBatchDeductionExecutions({ page: 1, pageSize: 50, stopDeductionFlag: '否' });
    expect(stopped.data.list.length).toBeGreaterThan(0);
    expect(notStopped.data.list.length).toBeGreaterThan(0);
    expect(stopped.data.list.every((item) => item.stopDeductionFlag === '是')).toBe(true);
    expect(notStopped.data.list.every((item) => item.stopDeductionFlag === '否')).toBe(true);
  });

  it('批量停扣成功后更新停扣标志并生成历史', async () => {
    const before = await getStopBatchDeductionExecutions({ page: 1, pageSize: 50, interestStopFlag: '否' });
    const ids = before.data.list.slice(0, 2).map((item) => item.id);
    const response = await stopBatchDeduction(ids);
    expect(response.code).toBe(0);
    expect(response.data?.successIds).toEqual(ids);
    expect(response.data?.recoveryStrategy).toBe('手动恢复');
    const after = await getStopBatchDeductionExecutions({ page: 1, pageSize: 50, interestStopFlag: '是' });
    expect(after.data.list.filter((item) => ids.includes(item.id))).toHaveLength(ids.length);
    expect(after.data.list.filter((item) => ids.includes(item.id)).every((item) => item.stopDeductionFlag === '是')).toBe(true);
    const history = await getStopBatchDeductionDetails({ page: 1, pageSize: 50, processResult: '成功' });
    expect(history.data.list.filter((item) => ids.includes(item.loanId))).toHaveLength(ids.length);
  });

  it('重复停扣返回失败并保留失败历史', async () => {
    const first = await stopBatchDeduction([2]);
    expect(first.data?.successIds).toContain(2);
    const second = await stopBatchDeduction([2]);
    expect(second.data?.failedIds).toContain(2);
    expect(second.data?.results[0]?.message).toContain('已停止批扣');
    const history = await getStopBatchDeductionDetails({ page: 1, pageSize: 50, loanNo: 'DK2024000002', processResult: '失败' });
    expect(history.data.list).toHaveLength(1);
  });

  it('校验恢复策略并记录日期或天数', async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const recoveryDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    const dateResponse = await stopBatchDeduction({ ids: [2], recoveryStrategy: '固定日期恢复', recoveryDate });
    expect(dateResponse.code).toBe(0);
    expect(dateResponse.data?.recoveryDate).toBe(recoveryDate);
    const dateHistory = await getStopBatchDeductionDetails({ page: 1, pageSize: 50, loanNo: 'DK2024000002' });
    expect(dateHistory.data.list[0]?.recoveryStrategy).toBe('固定日期恢复');
    expect(dateHistory.data.list[0]?.recoveryDate).toBe(recoveryDate);
    expect(dateHistory.data.list[0]?.legalEntityCode).toBe('2002法人');
    expect(dateHistory.data.list[0]?.legalEntityName).toBe('上海分行法人机构');

    const daysResponse = await stopBatchDeduction({ ids: [3], recoveryStrategy: '固定天数恢复', recoveryDays: 30 });
    expect(daysResponse.code).toBe(0);
    expect(daysResponse.data?.recoveryDays).toBe(30);
    const daysHistory = await getStopBatchDeductionDetails({ page: 1, pageSize: 50, loanNo: 'DK2024000003' });
    expect(daysHistory.data.list[0]?.recoveryStrategy).toBe('固定天数恢复');
    expect(daysHistory.data.list[0]?.recoveryDays).toBe(30);
  });

  it('拒绝过期日期和非正整数天数且不更新借据', async () => {
    const invalidDate = await stopBatchDeduction({ ids: [2], recoveryStrategy: '固定日期恢复', recoveryDate: '2000-01-01' });
    expect(invalidDate.code).toBe(1);
    const invalidDays = await stopBatchDeduction({ ids: [3], recoveryStrategy: '固定天数恢复', recoveryDays: 0 });
    expect(invalidDays.code).toBe(1);
    const executions = await getStopBatchDeductionExecutions({ page: 1, pageSize: 50, interestStopFlag: '否' });
    expect(executions.data.list.some((item) => item.id === 2 || item.id === 3)).toBe(true);
  });

  it('恢复批扣成功后更新停扣标志并返回逐笔结果', async () => {
    const response = await restoreBatchDeduction([1]);
    expect(response.code).toBe(0);
    expect(response.data?.successIds).toEqual([1]);
    expect(response.data?.results[0]).toMatchObject({ loanId: 1, processResult: '成功' });
    const executions = await getStopBatchDeductionExecutions({ page: 1, pageSize: 50, interestStopFlag: '否' });
    expect(executions.data.list.find((item) => item.id === 1)?.stopDeductionFlag).toBe('否');
    const history = await getStopBatchDeductionDetails({ page: 1, pageSize: 50, loanNo: 'DK2024000001' });
    expect(history.data.list[0]?.interestStopFlag).toBe('否');
  });

  it('未停止或不存在的借据恢复失败且不更新状态', async () => {
    const response = await restoreBatchDeduction([2, 999]);
    expect(response.code).toBe(0);
    expect(response.data?.successIds).toEqual([]);
    expect(response.data?.failedIds).toEqual([2, 999]);
    expect(response.data?.results.map((item) => item.message)).toEqual(['该借据当前未停止批扣', '借据不存在']);
    const executions = await getStopBatchDeductionExecutions({ page: 1, pageSize: 50, interestStopFlag: '否' });
    expect(executions.data.list.find((item) => item.id === 2)?.stopDeductionFlag).toBe('否');
  });

  it('初始明细包含两条恢复批扣记录并使用恢复时间', async () => {
    const response = await getStopBatchDeductionDetails({ page: 1, pageSize: 50, operationType: '恢复批扣' });
    expect(response.code).toBe(0);
    expect(response.data.list).toHaveLength(2);
    expect(response.data.list.every((item) => item.restoreTime && !item.stopTime)).toBe(true);
  });

  it('空提交返回业务错误', async () => {
    const response = await stopBatchDeduction([]);
    expect(response.code).toBe(1);
    expect(response.message).toContain('请选择');
  });
});
