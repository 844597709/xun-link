import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import StopBatchDeductionExecution from './index';
import { executionFilterConfigs } from '../shared';
import { resetStopBatchDeductionMock } from '../../../../mock';

describe('批扣操作执行页', () => {
  it('加载指定列并支持查看借据', async () => {
    resetStopBatchDeductionMock();
    render(<MemoryRouter><StopBatchDeductionExecution /></MemoryRouter>);
    await screen.findByRole('columnheader', { name: '借据号' });
    expect(executionFilterConfigs.map(({ key }) => key)).toEqual([
      'institutionName', 'customerNo', 'loanNo', 'loanStatus', 'fiveLevelCategory',
      'impairmentFlag', 'writeOffFlag', 'interestStopFlag', 'stopDeductionFlag', 'coreProduct',
    ]);
    expect(screen.getByRole('columnheader', { name: '机构号' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '停息标志' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '停扣标志' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '批量停扣' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '批量恢复' })).toBeDisabled();
    await screen.findAllByRole('button', { name: '查看' });
    fireEvent.click(screen.getAllByRole('button', { name: '查看' })[0]!);
    expect(await screen.findByText('批扣操作执行 - 查看')).toBeInTheDocument();
    expect(screen.getAllByText('核心产品').length).toBeGreaterThan(0);
  });

  it('停扣标志为否时单笔停扣并打开确认弹窗', async () => {
    resetStopBatchDeductionMock();
    render(<MemoryRouter><StopBatchDeductionExecution /></MemoryRouter>);
    await screen.findByRole('columnheader', { name: '借据号' });
    await screen.findAllByRole('button', { name: '查看' });
    fireEvent.click(screen.getAllByRole('button', { name: '停扣' })[0]!);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/本次将对已选中的/)).toBeInTheDocument();
    expect(within(dialog).getByText('DK2024000002')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '确认停扣' })).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: /取\s*消/ }));
  });

  it('停扣标志为是时单笔恢复并打开恢复确认弹窗', async () => {
    resetStopBatchDeductionMock();
    render(<MemoryRouter><StopBatchDeductionExecution /></MemoryRouter>);
    await screen.findByRole('columnheader', { name: '借据号' });
    await screen.findAllByRole('button', { name: '查看' });
    fireEvent.click(screen.getAllByRole('button', { name: '恢复' })[0]!);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('确认批量恢复')).toBeInTheDocument();
    expect(within(dialog).getByText('DK2024000001')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '确认恢复' })).toBeInTheDocument();
    expect(within(dialog).queryByRole('combobox', { name: '恢复批扣策略' })).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: /取\s*消/ }));
  });

  it('勾选未停扣借据后支持批量停扣，取消保留选择', async () => {
    resetStopBatchDeductionMock();
    render(<MemoryRouter><StopBatchDeductionExecution /></MemoryRouter>);
    await screen.findByRole('columnheader', { name: '借据号' });
    await screen.findAllByRole('button', { name: '查看' });
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes.slice(1)[1]!);
    expect(screen.getByRole('button', { name: '批量停扣' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: '批量恢复' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '批量停扣' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('确认批量停扣')).toBeInTheDocument();
    expect(within(dialog).getByText('DK2024000002')).toBeInTheDocument();
    const confirmHeaders = within(dialog).getAllByRole('columnheader').map((header) => header.textContent?.trim());
    expect(confirmHeaders.indexOf('借据金额')).toBeLessThan(confirmHeaders.indexOf('借据余额'));
    expect(within(dialog).getByText('手动恢复')).toBeInTheDocument();
    expect(within(dialog).queryByRole('columnheader', { name: '停息标志' })).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: /取\s*消/ }));
    expect(screen.getByRole('button', { name: '批量停扣' })).not.toBeDisabled();
  });

  it('勾选已停扣借据后支持批量恢复', async () => {
    resetStopBatchDeductionMock();
    render(<MemoryRouter><StopBatchDeductionExecution /></MemoryRouter>);
    await screen.findByRole('columnheader', { name: '借据号' });
    await screen.findAllByRole('button', { name: '查看' });
    fireEvent.click(screen.getAllByRole('checkbox').slice(1)[0]!);
    const batchButton = screen.getByRole('button', { name: '批量恢复' });
    expect(batchButton).toBeEnabled();
    expect(screen.getByRole('button', { name: '批量停扣' })).toBeDisabled();
    fireEvent.click(batchButton);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('确认批量恢复')).toBeInTheDocument();
    expect(within(dialog).getByText('DK2024000001')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: /取\s*消/ }));
    expect(screen.getByRole('button', { name: '批量恢复' })).toBeEnabled();
  });

  it('混合停扣状态时批量按钮仅提示且不打开确认弹窗', async () => {
    resetStopBatchDeductionMock();
    render(<MemoryRouter><StopBatchDeductionExecution /></MemoryRouter>);
    await screen.findByRole('columnheader', { name: '借据号' });
    await screen.findAllByRole('button', { name: '查看' });
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]!);
    fireEvent.click(checkboxes[2]!);
    expect(screen.getByRole('button', { name: '批量停扣' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '批量恢复' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: '批量停扣' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('选择固定天数恢复时展示正整数输入', async () => {
    resetStopBatchDeductionMock();
    render(<MemoryRouter><StopBatchDeductionExecution /></MemoryRouter>);
    await screen.findByRole('columnheader', { name: '借据号' });
    await screen.findAllByRole('button', { name: '查看' });
    fireEvent.click(screen.getAllByRole('checkbox').slice(1)[1]!);
    fireEvent.click(screen.getByRole('button', { name: '批量停扣' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: '恢复批扣策略' }));
    fireEvent.click(await screen.findByText('固定天数恢复'));
    const daysInput = within(dialog).getByRole('textbox', { name: '恢复批扣天数' });
    expect(daysInput).toBeInTheDocument();
    fireEvent.change(daysInput, { target: { value: '0.5' } });
    expect(daysInput).toHaveValue('');
    fireEvent.change(daysInput, { target: { value: '30' } });
    expect(daysInput).toHaveValue('30');
  });
});
