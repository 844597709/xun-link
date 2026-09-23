import { fireEvent, render, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import AgilitySignPage from './index';

describe('AgilitySignPage 贷款调整详情页2', () => {
  it('展示三类签约画板并保留详情页2', async () => {
    const { container } = render(<MemoryRouter><AgilitySignPage /></MemoryRouter>);

    await waitFor(() => expect(container.querySelectorAll('.preview-phone')).toHaveLength(3), { timeout: 2000 });

    const detail2Panel = container.querySelector('[data-panel="adjustment-detail-2"]') as HTMLElement;
    expect(container.querySelector('[data-panel="adjustment"]')).not.toBeInTheDocument();
    expect(detail2Panel).toBeInTheDocument();
    expect(within(detail2Panel).getByText('贷款调整确认')).toBeInTheDocument();
    expect(within(detail2Panel).queryByText('贷款调整详情页2')).not.toBeInTheDocument();
    expect(within(detail2Panel).getByText('贷款编号')).toBeInTheDocument();
    expect(within(detail2Panel).getByText('请确认以下贷款调整信息，确认后将进入签约流程')).toBeInTheDocument();
    expect(within(detail2Panel).queryByText('贷款调整详情页2：请核对新的还款安排')).not.toBeInTheDocument();
    expect(within(detail2Panel).getByText('贷款用途')).toBeInTheDocument();
    expect(within(detail2Panel).getByRole('button', { name: /新还款方式/ })).toBeInTheDocument();
    expect(within(detail2Panel).getByRole('button', { name: /新剩余期数/ })).toBeInTheDocument();
    expect(within(detail2Panel).getByRole('button', { name: /贷款用途/ })).toBeInTheDocument();
    expect(within(detail2Panel).getByText('工商银行（尾号 2688）')).toBeInTheDocument();
    expect(within(detail2Panel).queryByText('还款信息')).not.toBeInTheDocument();
    expect(within(detail2Panel).queryByText('新还款计划')).not.toBeInTheDocument();
  });

  it('展示组合还款方案、利率对比和条件字段', async () => {
    const { container } = render(<MemoryRouter><AgilitySignPage /></MemoryRouter>);
    await waitFor(() => expect(container.querySelector('[data-panel="adjustment-detail-2"]')).toBeInTheDocument(), { timeout: 2000 });

    const detail2Panel = container.querySelector('[data-panel="adjustment-detail-2"]') as HTMLElement;
    expect(within(detail2Panel).queryByText('组合还款方案（方式11）')).not.toBeInTheDocument();
    expect(within(detail2Panel).getByText('前12期只偿还利息，第13-24期每月偿还30%本金的等额本息+另70%本金的利息，第25-36期每月偿还剩余70%本金的等额本息。')).toBeInTheDocument();
    expect(within(detail2Panel).getByText('-2,800.00 元')).toBeInTheDocument();
    expect(within(detail2Panel).getByText('1个月')).toBeInTheDocument();
    expect(within(detail2Panel).getAllByText('4.35%')).toHaveLength(2);
    expect(within(detail2Panel).getByText('8.70%')).toBeInTheDocument();
    expect(detail2Panel.querySelectorAll('.detail2-rate-values del')).toHaveLength(3);
    const detailRows = Array.from(detail2Panel.querySelectorAll('.detail2-field-list > *'));
    const remainingPeriodIndex = detailRows.findIndex((row) => row.textContent?.includes('新剩余期数'));
    const schemeIndex = detailRows.findIndex((row) => row.classList.contains('detail2-scheme-notice'));
    expect(schemeIndex).toBe(remainingPeriodIndex + 1);
    expect(detail2Panel.querySelector('.loan-number-row')).not.toHaveStyle({ fontSize: '21px' });
    expect(detail2Panel.querySelector('.loan-amount-highlight strong')).not.toHaveStyle({ fontSize: '21px' });
  });

  it('计划查看只打开详情页2所属的半屏并校验协议', async () => {
    const { container } = render(<MemoryRouter><AgilitySignPage /></MemoryRouter>);
    await waitFor(() => expect(container.querySelector('[data-panel="adjustment-detail-2"]')).toBeInTheDocument(), { timeout: 2000 });

    const detail2Panel = container.querySelector('[data-panel="adjustment-detail-2"]') as HTMLElement;
    fireEvent.click(within(detail2Panel).getByRole('button', { name: /查看/ }));
    const dialog = within(detail2Panel).getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog.closest('[data-panel="adjustment-detail-2"]')).toBe(detail2Panel);
    fireEvent.click(within(dialog).getByRole('button', { name: '关闭' }));
    expect(within(detail2Panel).queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(within(detail2Panel).getByRole('button', { name: /新剩余期数.*30期/ }));
    const remainingPlanDialog = within(detail2Panel).getByRole('dialog');
    expect(remainingPlanDialog).toHaveTextContent('请选择组合还款方案');
    expect(remainingPlanDialog.querySelectorAll('.combination-choice')).toHaveLength(2);
    expect(remainingPlanDialog.querySelector('.combination-choice.is-selected')).toBeInTheDocument();
    const period24Option = Array.from(
      remainingPlanDialog.querySelectorAll<HTMLButtonElement>('.choice-option'),
    ).find((option) => option.textContent?.includes('24期'));
    expect(period24Option).toBeDefined();
    fireEvent.click(period24Option!);

    fireEvent.click(within(detail2Panel).getByRole('button', { name: /还款账户.*工商银行/ }));
    const accountDialog = within(detail2Panel).getByRole('dialog');
    expect(accountDialog).toHaveTextContent('选择还款账户');
    expect(within(accountDialog).getByRole('button', { name: /招商银行.*尾号 5276/ })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(within(accountDialog).getByRole('button', { name: /招商银行.*尾号 5276/ }));
    expect(within(detail2Panel).queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(detail2Panel).getByRole('button', { name: /还款账户.*招商银行/ })).toBeInTheDocument();

    fireEvent.click(within(detail2Panel).getByRole('button', { name: /新还款方式.*先息后本/ }));
    const methodDialog = within(detail2Panel).getByRole('dialog');
    expect(methodDialog).toHaveTextContent('选择新还款方式');
    fireEvent.click(within(methodDialog).getByRole('button', { name: /等额本息/ }));
    expect(within(detail2Panel).getByRole('button', { name: /新还款方式.*等额本息/ })).toBeInTheDocument();
    expect(within(detail2Panel).queryByText(/组合还款方案/)).not.toBeInTheDocument();

    fireEvent.click(within(detail2Panel).getByRole('button', { name: /新剩余期数.*24期/ }));
    const remainingDialog = within(detail2Panel).getByRole('dialog');
    expect(remainingDialog).toHaveTextContent('选择新剩余期数');
    fireEvent.click(within(remainingDialog).getByRole('button', { name: /24期/ }));
    expect(within(detail2Panel).getByRole('button', { name: /新剩余期数.*24期/ })).toBeInTheDocument();

    fireEvent.click(within(detail2Panel).getByRole('button', { name: /贷款用途.*个人消费/ }));
    const purposeDialog = within(detail2Panel).getByRole('dialog');
    expect(purposeDialog).toHaveTextContent('选择贷款用途');
    fireEvent.click(within(purposeDialog).getByRole('button', { name: /生产经营/ }));
    expect(within(detail2Panel).getByRole('button', { name: /贷款用途.*生产经营/ })).toBeInTheDocument();
    expect(within(detail2Panel).queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(within(detail2Panel).getByRole('button', { name: '确定' }));
    expect(within(detail2Panel).queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(within(detail2Panel).getByRole('button', { name: '同意合同' }));
    expect(within(detail2Panel).getByRole('button', { name: '同意合同' })).toHaveClass('checked');
    fireEvent.click(within(detail2Panel).getByRole('button', { name: '确定' }));
    expect(within(detail2Panel).queryByRole('dialog')).not.toBeInTheDocument();
  });
});
