import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import DebtSignPage from './index';

describe('DebtSignPage', () => {
  it('横向平铺四个手机画板并支持单笔主流程', async () => {
    const { container } = render(<MemoryRouter><DebtSignPage /></MemoryRouter>);
    await waitFor(() => expect(container.querySelectorAll('.debt-preview-phone')).toHaveLength(4), { timeout: 2000 });

    expect(container.querySelector('[data-panel="todo"]')).toBeInTheDocument();
    expect(container.querySelector('[data-panel="choose"]')).toBeInTheDocument();
    expect(container.querySelector('[data-panel="confirm"]')).toBeInTheDocument();
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
    fireEvent.click(confirmPanel.querySelector('.debt-bottom-sheet button[aria-label="关闭"]')!);
    expect(confirmPanel.querySelector('.debt-bottom-sheet')).not.toBeInTheDocument();

    fireEvent.click(within(confirmPanel).getByRole('button', { name: '确认提交' }));
    expect(confirmPanel.querySelector('.debt-bottom-sheet')).toBeInTheDocument();
    fireEvent.click(within(confirmPanel).getByRole('button', { name: '暂不提交' }));
    expect(within(confirmPanel).queryByRole('dialog', { name: '' })).not.toBeInTheDocument();
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
