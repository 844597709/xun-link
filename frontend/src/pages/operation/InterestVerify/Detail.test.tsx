import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import InterestVerify from './index';
import InterestVerifyDetail from './Detail';

describe('贴息核定页面', () => {
  it('将核定状态固定在操作列左侧', async () => {
    render(<MemoryRouter initialEntries={['/operation/interest-verify']}><InterestVerify /></MemoryRouter>);

    const statusHeader = await screen.findByRole('columnheader', { name: '核定状态' });
    const actionHeader = screen.getByRole('columnheader', { name: '操作' });
    expect(statusHeader).toHaveClass('ant-table-cell-fix-right');
    expect(actionHeader).toHaveClass('ant-table-cell-fix-right');
    expect(statusHeader.compareDocumentPosition(actionHeader) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  }, 15000);

  it('贴息核定详情抽屉不显示底部关闭按钮', async () => {
    render(<MemoryRouter initialEntries={['/operation/interest-verify']}><InterestVerify /></MemoryRouter>);

    const institutionSelect = screen.getByRole('combobox', { name: '机构' });
    fireEvent.mouseDown(institutionSelect);
    fireEvent.click(await screen.findByText('北京分行', { selector: '.ant-select-item-option-content' }));
    fireEvent.click((await screen.findAllByRole('button', { name: '查看详情' }))[0]!);
    expect(await screen.findByText(/贴息核定详情：|自主申请详情/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '关闭' })).not.toBeInTheDocument();
  }, 15000);

  it('系统核定详情展示动态标题、申请摘要和三列字段布局', async () => {
    render(<MemoryRouter initialEntries={['/operation/interest-verify/1/system']}><InterestVerifyDetail recordId={1} source="system" /></MemoryRouter>);

    expect(await screen.findByRole('heading', { name: '贴息核定详情：APP-2026-00001' })).toBeInTheDocument();
    expect(screen.getByText('申请编号：')).toBeInTheDocument();
    expect(screen.getByText('申请状态：审核中')).toHaveClass('subsidy-approval-status-neutral');
    expect(screen.getByText('申请时间：2026-01-01 09:30:00')).toBeInTheDocument();
    expect(document.querySelector('.subsidy-detail-field-grid-three')).toBeInTheDocument();
    expect(screen.getByLabelText('预计贴息总金额说明')).toBeInTheDocument();
    expect(screen.getAllByLabelText('消费预计贴息金额说明').length).toBeGreaterThan(0);
    expect(screen.getAllByText('消费信息').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('消费核定状态').length).toBeGreaterThan(0);
  }, 15000);

  it('已通过和已拒绝申请分别使用绿色和红色状态背景', async () => {
    const { unmount } = render(<MemoryRouter initialEntries={['/operation/interest-verify/2/self']}><InterestVerifyDetail recordId={2} source="self" /></MemoryRouter>);
    expect(await screen.findByText('申请状态：已通过')).toHaveClass('subsidy-approval-status-active');
    unmount();

    render(<MemoryRouter initialEntries={['/operation/interest-verify/3/system']}><InterestVerifyDetail recordId={3} source="system" /></MemoryRouter>);
    expect(await screen.findByText('申请状态：已拒绝')).toHaveClass('subsidy-approval-status-inactive');
  }, 15000);

  it('自主申请详情保留凭证并复用三列消费信息模块', async () => {
    render(<MemoryRouter initialEntries={['/operation/interest-verify/2/self']}><InterestVerifyDetail recordId={2} source="self" /></MemoryRouter>);

    expect(await screen.findByText('自主申请详情')).toBeInTheDocument();
    expect(screen.getByText('凭证信息')).toBeInTheDocument();
    expect(screen.getByText('消费信息')).toBeInTheDocument();
    expect(screen.getByText('发票号码')).toBeInTheDocument();
    expect(screen.getByText('发票代码')).toBeInTheDocument();
    expect(screen.getByText('发票日期')).toBeInTheDocument();
    expect(screen.getByText('发票金额')).toBeInTheDocument();
    const detailCard = screen.getByText('凭证信息').closest('.subsidy-detail-card-three');
    expect(detailCard).toContainElement(screen.getByText('发票号码'));
    expect(detailCard).toContainElement(screen.getByText('消费信息'));
    expect(screen.getByLabelText('预计贴息总金额说明')).toBeInTheDocument();
    expect(screen.getAllByLabelText('消费预计贴息金额说明').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.subsidy-detail-field-grid-three').length).toBeGreaterThanOrEqual(2);
    const voucherList = document.querySelector('.subsidy-voucher-list');
    expect(voucherList).toBeInTheDocument();
    expect(voucherList?.querySelectorAll('.ant-card')).toHaveLength(2);
    expect(voucherList).not.toHaveClass('voucher-grid');
    expect(document.querySelectorAll('.subsidy-voucher-invoice-fields > div')).toHaveLength(4);
    expect(document.querySelector('.subsidy-voucher-invoice-field')).toHaveClass('subsidy-voucher-invoice-field');
    expect(document.querySelector('.subsidy-voucher-invoice-field')?.querySelector('span')).toHaveTextContent('发票号码');
    expect(document.querySelector('.subsidy-voucher-invoice-field')?.querySelector('strong')).toHaveTextContent('INV-2');
    expect(document.querySelector('.subsidy-voucher-list')?.querySelector('.ant-card:last-child')).toHaveTextContent('消费凭证');
  }, 15000);
});
