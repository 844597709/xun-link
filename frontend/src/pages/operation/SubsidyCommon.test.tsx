import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { TableColumnsType } from 'antd';
import { SubsidyListPage, type SubsidyActionHandlers } from './SubsidyCommon';
import LoanInterestDetail from './LoanInterest/Detail';
import { loanSubsidies } from '../../mock/subsidy';
import type { ApiResponse, ListData } from '../../types';

type Row = { id: number; name: string };

const fetchRows = async (): Promise<ApiResponse<ListData<Row>>> => ({
  code: 0,
  message: 'ok',
  data: { list: [{ id: 1, name: '测试记录' }], total: 1, page: 1, pagesize: 10 },
});
const columns = (handlers: SubsidyActionHandlers<Row>): TableColumnsType<Row> => [
  { title: '名称', dataIndex: 'name' },
  { title: '操作', render: (_, record) => <button type="button" onClick={() => handlers.openAction('view', record)}>查看详情</button> },
];

describe('贴息详情抽屉', () => {
  it('查看详情打开右侧抽屉且关闭后不改变列表地址', async () => {
    render(<MemoryRouter initialEntries={['/operation/test']}><SubsidyListPage<Row> title="测试列表" description="" filters={[]} columns={columns} fetcher={fetchRows} detailTitle="测试详情" detailRenderer={(record) => <div data-testid="detail-content">详情：{record.name}</div>} /></MemoryRouter>);
    await screen.findByText('测试记录');
    const pathname = window.location.pathname;
    fireEvent.click(screen.getByRole('button', { name: '查看详情' }));
    expect(await screen.findByTestId('detail-content')).toHaveTextContent('详情：测试记录');
    expect(window.location.pathname).toBe(pathname);
    fireEvent.click(document.querySelector('.subsidy-detail-drawer .ant-drawer-footer button') as HTMLElement);
    await waitFor(() => expect(screen.queryByTestId('detail-content')).not.toBeInTheDocument());
    expect(window.location.pathname).toBe(pathname);
  });

  it('贷款贴息贴息流水明细展示金额汇总和分组信息', async () => {
    render(<MemoryRouter initialEntries={[`/operation/loan-interest/${loanSubsidies[0]!.id}`]}><LoanInterestDetail /></MemoryRouter>);
    await screen.findByText('贷款基础信息');
    fireEvent.click(screen.getByRole('tab', { name: '贴息流水明细' }));
    expect(await screen.findByText('实时贴息总笔数/成功笔数')).toBeInTheDocument();
    expect(screen.getAllByText('补贴息总笔数/成功笔数').length).toBeGreaterThan(0);
    expect(screen.getAllByText('收回贴息总笔数/成功笔数').length).toBeGreaterThan(0);
    expect(screen.getByText('1/1笔')).toBeInTheDocument();
    expect(screen.queryByText('贴息流水汇总')).not.toBeInTheDocument();
    expect(screen.queryByText(/共 \d+ 笔流水/)).not.toBeInTheDocument();
    expect(screen.queryByText('实收回贴息金额')).not.toBeInTheDocument();
    expect(document.querySelector('.loan-interest-flow-summary')).toBeInTheDocument();
  });
});
