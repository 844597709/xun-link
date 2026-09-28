import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import DebtSignPage from './index';

describe('DebtSignPage', () => {
  it('横向平铺四个手机画板并支持贷款确认主流程', async () => {
    const { container } = render(<MemoryRouter><DebtSignPage /></MemoryRouter>);
    await waitFor(() => expect(container.querySelectorAll('.debt-preview-phone')).toHaveLength(4), { timeout: 2000 });

    expect(container.querySelector('[data-panel="todo"]')).toBeInTheDocument();
    expect(container.querySelector('[data-panel="choose"]')).toBeInTheDocument();
    expect(container.querySelector('[data-panel="confirm"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-panel="confirm2"]')).toBeInTheDocument();
    expect(container.querySelector('[data-panel="processing"]')).toBeInTheDocument();
    expect(container.querySelector('.debt-flat-host')).not.toBeInTheDocument();
    expect(container.querySelector('.debt-flat-frame')).not.toBeInTheDocument();

    const todoPanel = container.querySelector('[data-panel="todo"]') as HTMLElement;
    fireEvent.click(within(todoPanel).getAllByRole('button', { name: /去完成/ })[0]);
    const choosePanel = container.querySelector('[data-panel="choose"]') as HTMLElement;
    expect(choosePanel).toHaveClass('is-focused');

    fireEvent.click(within(choosePanel).getByRole('button', { name: '下一步' }));
    expect(choosePanel).toHaveClass('is-focused');

    fireEvent.click(within(choosePanel).getAllByRole('checkbox')[1]);
    fireEvent.click(within(choosePanel).getByRole('button', { name: '下一步' }));
    const confirm2Panel = container.querySelector('[data-panel="confirm2"]') as HTMLElement;
    expect(confirm2Panel).toHaveClass('is-focused');
    expect(within(confirm2Panel).getByText('贷款确认')).toBeInTheDocument();
    expect(within(confirm2Panel).queryByRole('button', { name: '关闭' })).not.toBeInTheDocument();
    expect(within(confirm2Panel).queryByText('借新还旧方案确认')).not.toBeInTheDocument();
    expect(within(confirm2Panel).getByText('原借据信息')).toBeInTheDocument();
    expect(within(confirm2Panel).getByText('新借据信息')).toBeInTheDocument();
    expect(confirm2Panel.querySelectorAll('.confirm2-original-card')).toHaveLength(2);
    expect(within(confirm2Panel).getByText('前12期只偿还利息，第13-24期每月偿还30%本金的等额本息+另70%本金的利息，第25-36期每月偿还剩余70%本金的等额本息。')).toBeInTheDocument();
    expect(within(confirm2Panel).queryByText(/第1-18期先息后本/)).not.toBeInTheDocument();
    expect(within(confirm2Panel).queryByRole('button', { name: '返回修改' })).not.toBeInTheDocument();
    expect(confirm2Panel.querySelector('.confirm2-total-value')).toBeInTheDocument();
    const fieldLabels = confirm2Panel.querySelectorAll('.confirm2-field-label');
    expect(fieldLabels.length).toBeGreaterThan(0);
    expect([...fieldLabels].every((label) => label.classList.contains('confirm2-field-label'))).toBe(true);
    expect(within(confirm2Panel).getByRole('button', { name: /还款方式/ })).toBeInTheDocument();
    expect(within(confirm2Panel).getByRole('button', { name: /借款时长/ })).toBeInTheDocument();
    expect(within(confirm2Panel).getByText('借款时长')).toBeInTheDocument();
    expect(within(confirm2Panel).getByText('36期')).toBeInTheDocument();
    expect(within(confirm2Panel).getByText('回收优惠')).toBeInTheDocument();
    expect(within(confirm2Panel).getByText('1,200.00 元')).toBeInTheDocument();
    expect(within(confirm2Panel).getByText('利息减免')).toBeInTheDocument();
    expect(within(confirm2Panel).getByText('-360.00 元')).toBeInTheDocument();
    expect(within(confirm2Panel).getByRole('button', { name: /还款账户/ })).toBeInTheDocument();
    expect(within(confirm2Panel).getByRole('button', { name: /收款账户/ })).toBeInTheDocument();
    expect(within(confirm2Panel).getByText('正常利率')).toBeInTheDocument();
    expect(within(confirm2Panel).getByText('罚息利率')).toBeInTheDocument();
    expect(within(confirm2Panel).getByText('复息利率')).toBeInTheDocument();
    expect(within(confirm2Panel).getByText('首期延迟')).toBeInTheDocument();
    expect(within(confirm2Panel).getByText('2个月')).toBeInTheDocument();
    expect(within(confirm2Panel).getByRole('button', { name: /还款计划.*查看/ })).toHaveClass('confirm2-repayment-action');
    expect(within(confirm2Panel).queryByText(/共30期/)).not.toBeInTheDocument();
    const openDetail = (name: RegExp) => {
      fireEvent.click(within(confirm2Panel).getByRole('button', { name }));
      expect(confirm2Panel.querySelector('.confirm2-detail-sheet')).toBeInTheDocument();
      fireEvent.click(confirm2Panel.querySelector('.confirm2-detail-sheet button[aria-label="关闭"]')!);
    };
    openDetail(/还款方式/);
    openDetail(/借款时长/);
    openDetail(/借款用途/);
    openDetail(/还款账户/);
    openDetail(/收款账户/);
    fireEvent.click(within(confirm2Panel).getByRole('button', { name: /还款计划.*查看/ }));
    expect(confirm2Panel.querySelector('.debt-bottom-sheet')).toBeInTheDocument();
    expect(within(confirm2Panel).getByText('新还款计划')).toBeInTheDocument();
    fireEvent.click(confirm2Panel.querySelector('.debt-bottom-sheet button[aria-label="关闭"]')!);
    fireEvent.click(within(confirm2Panel).getByRole('button', { name: '确认提交' }));
    expect(confirm2Panel.querySelector('.debt-bottom-sheet')).toBeInTheDocument();
    fireEvent.click(within(confirm2Panel).getByRole('button', { name: '暂不提交' }));
    expect(confirm2Panel.querySelector('.debt-bottom-sheet')).not.toBeInTheDocument();
  });

  it('待办 Tab 可切换且提交后进入处理中', async () => {
    const { container } = render(<MemoryRouter><DebtSignPage /></MemoryRouter>);
    await waitFor(() => expect(container.querySelector('[data-panel="todo"]')).toBeInTheDocument(), { timeout: 2000 });

    const todoPanel = container.querySelector('[data-panel="todo"]') as HTMLElement;
    const processedTab = within(todoPanel).getByRole('tab', { name: /已处理/ });
    fireEvent.click(processedTab);
    expect(processedTab).toHaveAttribute('aria-selected', 'true');
    expect(within(todoPanel).getAllByRole('button', { name: /去完成/ })).toHaveLength(1);

    fireEvent.click(within(todoPanel).getByRole('tab', { name: /未处理/ }));
    fireEvent.click(within(todoPanel).getAllByRole('button', { name: /去完成/ })[0]);
    const choosePanel = container.querySelector('[data-panel="choose"]') as HTMLElement;
    fireEvent.click(within(choosePanel).getAllByRole('checkbox')[1]);
    fireEvent.click(within(choosePanel).getByRole('button', { name: '下一步' }));

    const confirm2Panel = container.querySelector('[data-panel="confirm2"]') as HTMLElement;
    fireEvent.click(within(confirm2Panel).getByRole('button', { name: '确认提交' }));
    fireEvent.click(within(confirm2Panel).getByRole('button', { name: '我已知晓' }));
    await waitFor(() => expect(container.querySelector('[data-panel="processing"]')).toHaveClass('is-focused'), { timeout: 2000 });
    expect(within(container.querySelector('[data-panel="processing"]') as HTMLElement).getByText('等待系统处理')).toBeInTheDocument();
  });

  it('批量模式支持新增删除并至少保留一笔借据', async () => {
    const { container } = render(<MemoryRouter><DebtSignPage /></MemoryRouter>);
    await waitFor(() => expect(container.querySelector('[data-panel="todo"]')).toBeInTheDocument(), { timeout: 2000 });
    const todoPanel = container.querySelector('[data-panel="todo"]') as HTMLElement;
    fireEvent.click(within(todoPanel).getAllByRole('button', { name: /去完成/ })[1]);
    const choosePanel = container.querySelector('[data-panel="choose"]') as HTMLElement;

    expect(within(choosePanel).getByRole('button', { name: /新增借据/ })).toBeInTheDocument();
    expect(within(choosePanel).getAllByRole('button', { name: '删除借据' })).toHaveLength(2);
    fireEvent.click(within(choosePanel).getByRole('button', { name: /新增借据/ }));
    expect(within(choosePanel).getAllByRole('button', { name: '删除借据' })).toHaveLength(3);
    fireEvent.click(within(choosePanel).getAllByRole('button', { name: '删除借据' })[0]);
    fireEvent.click(within(choosePanel).getAllByRole('button', { name: '删除借据' })[0]);
    expect(within(choosePanel).getAllByRole('button', { name: '删除借据' })).toHaveLength(1);
  });
});
