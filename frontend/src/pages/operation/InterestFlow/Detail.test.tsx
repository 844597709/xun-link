import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import InterestFlow from './index';
import InterestFlowDetail from './Detail';

describe('贴息流水页面', () => {
  it('列表仅展示贴息金额和收回贴息金额，不展示实际金额列', async () => {
    render(<MemoryRouter initialEntries={['/operation/interest-flow']}><InterestFlow /></MemoryRouter>);

    expect(await screen.findByRole('columnheader', { name: '贴息金额' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '收回贴息金额' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: '预计贴息金额' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: '实贴息金额' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: '预计收回贴息金额' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: '实收回贴息金额' })).not.toBeInTheDocument();
  }, 15000);

  it('消费详情展示新字段、支持分页且不展示退款详情', async () => {
    render(<MemoryRouter initialEntries={['/operation/interest-flow/1']}><InterestFlowDetail recordId={1} /></MemoryRouter>);

    expect(await screen.findByText('消费详情')).toBeInTheDocument();
    expect(document.querySelector('.subsidy-detail-card-three')).toBeInTheDocument();
    expect(document.querySelector('.subsidy-detail-field-grid-three')).toBeInTheDocument();
    expect(document.querySelector('.subsidy-detail-card-three .ant-descriptions')).not.toBeInTheDocument();
    expect(screen.getByText('机构号')).toBeInTheDocument();
    expect(screen.getByText('机构名称')).toBeInTheDocument();
    expect(screen.getByText('消费详情')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '银行交易流水号' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '预计贴息总金额' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: '银行消费流水号' })).not.toBeInTheDocument();
    expect(screen.queryByText('退款详情')).not.toBeInTheDocument();
    expect(document.querySelector('.ant-pagination')).toBeInTheDocument();
  }, 15000);

  it('贴息流水详情抽屉不显示底部关闭按钮', async () => {
    render(<MemoryRouter initialEntries={['/operation/interest-flow']}><InterestFlow /></MemoryRouter>);

    await screen.findByText('CROS-T-000001');
    fireEvent.click(screen.getAllByRole('button', { name: '查看详情' })[0]!);

    expect(await screen.findByText('贴息流水详情')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '关闭' })).not.toBeInTheDocument();
  }, 15000);
});
