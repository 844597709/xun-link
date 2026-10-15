import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import StopBatchDeductionDetail from './index';
import { detailFilterConfigs } from '../shared';
import { resetStopBatchDeductionMock, restoreBatchDeduction } from '../../../../mock';

describe('批扣操作明细页', () => {
  it('展示操作审计字段并保持只读', async () => {
    resetStopBatchDeductionMock();
    render(<MemoryRouter><StopBatchDeductionDetail /></MemoryRouter>);
    await screen.findByRole('columnheader', { name: '操作类型' });
    const headers = screen.getAllByRole('columnheader').map((header) => header.textContent?.trim());
    expect(headers).toEqual([
      '机构号', '机构名称', '法人机构号', '法人机构名称', '客户号', '客户名称', '借据号',
      '操作类型', '停止时间', '恢复时间', '操作人', '处理状态', '状态备注',
      '恢复批扣策略', '恢复批扣日期', '恢复批扣天数',
    ]);
    expect((await screen.findAllByText('停止批扣')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('停扣成功')).length).toBeGreaterThan(0);
    expect(screen.queryByRole('columnheader', { name: '操作' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '批量恢复' })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(detailFilterConfigs.map(({ key }) => key)).toEqual(['institutionName', 'customerNo', 'loanNo', 'operationType']);
  });

  it('展示恢复操作类型和恢复时间', async () => {
    resetStopBatchDeductionMock();
    await restoreBatchDeduction([1]);
    render(<MemoryRouter><StopBatchDeductionDetail /></MemoryRouter>);
    await screen.findByRole('columnheader', { name: '恢复时间' });
    expect((await screen.findAllByText(/恢复批扣/)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/恢复批扣成功/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });
});
