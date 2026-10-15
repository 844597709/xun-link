import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import InterestRule from './index';
import InterestRuleDetail from './Detail';

function renderDetail(id: number) {
  return render(<MemoryRouter initialEntries={[`/operation/interest-rule/${id}`]}><InterestRuleDetail recordId={id} /></MemoryRouter>);
}

describe('贴息规则配置详情', () => {
  it('展示动态标题、规则编号、有效期和生效状态，并合并规则信息模块', async () => {
    renderDetail(2);

    expect(await screen.findByRole('heading', { name: '贴息规则配置：CROS-RULE-0002' })).toBeInTheDocument();
    expect(screen.getByText('规则编号：')).toBeInTheDocument();
    expect(screen.getAllByText('CROS-RULE-0002').length).toBeGreaterThan(1);
    expect(screen.getByText('生效状态：生效')).toHaveClass('subsidy-rule-status-active');
    expect(screen.getByText('有效期：2026-02-02 至 2026-07-02')).toBeInTheDocument();
    expect(screen.getByText('规则信息')).toBeInTheDocument();
    expect(screen.queryByText('基础规则信息')).not.toBeInTheDocument();
    expect(screen.queryByText('计贴息规则参数')).not.toBeInTheDocument();
    expect(document.querySelector('.subsidy-detail-field-grid')).toBeInTheDocument();
    expect(document.querySelector('.subsidy-detail-field-grid .ant-descriptions')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '关闭' })).not.toBeInTheDocument();
  });

  it('对失效规则使用红色状态背景并将产品拆分为标签', async () => {
    renderDetail(1);

    expect(await screen.findByText('生效状态：失效')).toHaveClass('subsidy-rule-status-inactive');
    expect(screen.getAllByText('P1001').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.subsidy-detail-field-value .ant-tag').length).toBeGreaterThan(1);
  });

  it('规则列表抽屉使用动态标题且不显示底部关闭按钮', async () => {
    render(<MemoryRouter initialEntries={['/operation/interest-rule']}><InterestRule /></MemoryRouter>);

    await screen.findByText('CROS-RULE-0001');
    fireEvent.click(screen.getAllByRole('button', { name: '查看详情' })[0]!);

    expect(await screen.findByText('贴息规则配置：CROS-RULE-0001')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('button', { name: '关闭' })).not.toBeInTheDocument());
  }, 15000);
});
