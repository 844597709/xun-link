import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import DebtSignPage from './index';

describe('DebtSignPage', () => {
  it('横向平铺五个手机画板并支持单笔主流程', async () => {
    const { container } = render(<MemoryRouter><DebtSignPage /></MemoryRouter>);
    await waitFor(() => expect(container.querySelectorAll('.debt-preview-phone')).toHaveLength(5), { timeout: 2000 });

    expect(container.querySelector('[data-panel="todo"]')).toBeInTheDocument();
    expect(container.querySelector('[data-panel="choose"]')).toBeInTheDocument();
    expect(container.querySelector('[data-panel="confirm"]')).toBeInTheDocument();
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
    const confirmPanel = container.querySelector('[data-panel="confirm"]') as HTMLElement;
    expect(confirmPanel).toHaveClass('is-focused');

    fireEvent.click(within(confirmPanel).getByRole('button', { name: /还款计划/ }));
    expect(confirmPanel.querySelector('.debt-bottom-sheet')).toBeInTheDocument();
    expect(container.querySelector('[data-panel="confirm2"] .debt-bottom-sheet')).not.toBeInTheDocument();
    fireEvent.click(confirmPanel.querySelector('.debt-bottom-sheet button[aria-label="关闭"]')!);
    expect(confirmPanel.querySelector('.debt-bottom-sheet')).not.toBeInTheDocument();

    const confirm2Panel = container.querySelector('[data-panel="confirm2"]') as HTMLElement;
    expect(within(confirm2Panel).getByText('借新还旧方案确认')).toBeInTheDocument();
    expect(within(confirm2Panel).getByText('原借据信息')).toBeInTheDocument();
    expect(within(confirm2Panel).getByText('还款方案')).toBeInTheDocument();
    expect(within(confirm2Panel).getByText('还款账户')).toBeInTheDocument();
    expect(within(confirm2Panel).getByText('收款账户')).toBeInTheDocument();
    fireEvent.click(within(confirm2Panel).getByRole('button', { name: /还款计划/ }));
    expect(confirm2Panel.querySelector('.debt-bottom-sheet')).toBeInTheDocument();
    expect(confirmPanel.querySelector('.debt-bottom-sheet')).not.toBeInTheDocument();
    fireEvent.click(confirm2Panel.querySelector('.debt-bottom-sheet button[aria-label="关闭"]')!);
    fireEvent.click(within(confirm2Panel).getByRole('button', { name: '确认提交' }));
    expect(confirm2Panel.querySelector('.debt-bottom-sheet')).toBeInTheDocument();
    fireEvent.click(within(confirm2Panel).getByRole('button', { name: '暂不提交' }));
    expect(confirm2Panel.querySelector('.debt-bottom-sheet')).not.toBeInTheDocument();

    fireEvent.click(within(confirmPanel).getByRole('button', { name: '确认提交' }));
    expect(confirmPanel.querySelector('.debt-bottom-sheet')).toBeInTheDocument();
    fireEvent.click(within(confirmPanel).getByRole('button', { name: '暂不提交' }));
    expect(within(confirmPanel).queryByRole('dialog', { name: '' })).not.toBeInTheDocument();
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

    const confirmPanel = container.querySelector('[data-panel="confirm"]') as HTMLElement;
    fireEvent.click(within(confirmPanel).getByRole('button', { name: '确认提交' }));
    fireEvent.click(within(confirmPanel).getByRole('button', { name: '我已知晓' }));
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
