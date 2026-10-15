import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import LoanInterest from './index';
import LoanInterestDetail from './Detail';

describe('贷款贴息页面', () => {
  it('列表展示提示文案、预计贴息总额及右侧固定状态列', async () => {
    render(<MemoryRouter initialEntries={['/operation/loan-interest']}><LoanInterest /></MemoryRouter>);

    expect(await screen.findByRole('columnheader', { name: /剩余可占用本金/ })).toBeInTheDocument();
    expect(screen.getAllByLabelText('剩余可占用本金说明').length).toBeGreaterThan(0);
    expect(screen.getByRole('columnheader', { name: '预计贴息总额' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: '应贴息总额' })).not.toBeInTheDocument();
    expect(document.querySelector('.ant-select[style*="220px"]')).toBeInTheDocument();
    expect(document.querySelectorAll('.ant-table-cell-fix-right').length).toBeGreaterThanOrEqual(3);
  }, 15000);

  it('详情使用基础信息双列布局、业务提示和五类明细 Tab', async () => {
    render(<MemoryRouter initialEntries={['/operation/loan-interest/1']}><LoanInterestDetail recordId={1} /></MemoryRouter>);

    expect(await screen.findByText('贷款基础信息')).toBeInTheDocument();
    expect(document.querySelector('.subsidy-detail-card-plain')).toBeInTheDocument();
    expect(document.querySelector('.subsidy-detail-card-plain .ant-descriptions')).not.toBeInTheDocument();
    expect(screen.getByText('预计贴息总额')).toBeInTheDocument();
    expect(screen.getByLabelText('预计贴息总额说明')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('输入流水号、发票编号或商户名称筛选当前明细')).not.toBeInTheDocument();
    for (const title of ['关联消费明细', '历史期供贴息明细', '未还期供贴息计划', '贴息流水明细', '还款流水明细']) {
      expect(screen.getByRole('tab', { name: title })).toBeInTheDocument();
    }
  }, 15000);

  it('各明细 Tab 展示对应筛选条件，贴息流水汇总上下排列且表格自适应', async () => {
    render(<MemoryRouter initialEntries={['/operation/loan-interest/1']}><LoanInterestDetail recordId={1} /></MemoryRouter>);
    await screen.findByText('贷款基础信息');

    expect(screen.getAllByText('银行消费流水号').length).toBeGreaterThan(0);
    expect(screen.getAllByText('发票编号').length).toBeGreaterThan(0);
    expect(screen.getAllByText('消费日期').length).toBeGreaterThan(0);
    expect(screen.getAllByText('消费状态').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('tab', { name: '贴息流水明细' }));
    expect(screen.getByText('实时贴息总笔数/成功笔数')).toBeInTheDocument();
    expect(screen.getByText('补贴息总笔数/成功笔数')).toBeInTheDocument();
    expect(screen.getByText('收回贴息总笔数/成功笔数')).toBeInTheDocument();
    expect(screen.getByText('1/1笔')).toBeInTheDocument();
    expect(screen.queryByText('贴息流水汇总')).not.toBeInTheDocument();
    expect(document.querySelector('.loan-interest-table-scroll-adaptive')).toBeInTheDocument();
    expect(document.querySelector('.loan-interest-table-scroll-adaptive .loan-interest-pagination')).not.toBeInTheDocument();
    expect(document.querySelector('.loan-interest-pagination')).toBeInTheDocument();
    for (const title of ['CROS交易流水号', '贴息类型', '贴息金额', '补贴息客户卡号', '收回贴息金额', '收回贴息客户卡号', '贴息时间', '贴息状态']) {
      expect(screen.getByRole('columnheader', { name: title })).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole('tab', { name: '还款流水明细' }));
    expect(screen.getByText('累计还款成功次数')).toBeInTheDocument();
    expect(screen.getByText('累计还款本金')).toBeInTheDocument();
    expect(screen.getByText('累计提前还款成功次数')).toBeInTheDocument();
    expect(screen.getByText('累计提前还款本金')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '贴息金额' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: '应贴息金额' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: '实贴息金额' })).not.toBeInTheDocument();
    expect(document.querySelector('.loan-interest-table-scroll:not(.loan-interest-table-scroll-adaptive)')).toBeInTheDocument();
    expect(document.querySelector('.loan-interest-pagination')).toBeInTheDocument();
  }, 15000);

  it('明细列表滚动条只位于表格，分页独立右对齐', async () => {
    render(<MemoryRouter initialEntries={['/operation/loan-interest/1']}><LoanInterestDetail recordId={1} /></MemoryRouter>);
    await screen.findByText('贷款基础信息');

    expect(screen.getByText('消费总金额')).toBeInTheDocument();
    expect(screen.getByText('核定总金额')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '应收回贴息金额' })).toBeInTheDocument();
    expect(screen.queryByText('预计剩余利息总金额')).not.toBeInTheDocument();

    const scroll = document.querySelector('.loan-interest-table-scroll');
    expect(scroll).toBeInTheDocument();
    expect(scroll?.querySelector('.loan-interest-table-scroll-inner')).toBeInTheDocument();
    expect(scroll?.querySelector('.loan-interest-pagination')).not.toBeInTheDocument();
    expect(document.querySelector('.loan-interest-pagination')).toBeInTheDocument();
    expect((scroll?.querySelector('.loan-interest-table-scroll-inner') as HTMLElement).style.minWidth).toBe('1700px');

    fireEvent.click(screen.getByRole('tab', { name: '未还期供贴息计划' }));
    expect(screen.getByText('预计剩余利息总金额')).toBeInTheDocument();
    expect(document.querySelector('.loan-interest-table-scroll-adaptive')).toBeInTheDocument();
    expect((document.querySelector('.loan-interest-table-scroll-inner-adaptive') as HTMLElement).style.minWidth).toBe('');
  }, 15000);
});
