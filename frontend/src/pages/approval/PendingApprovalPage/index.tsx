import { useEffect, useState } from 'react';
import { Card, Pagination, Table, Tag, message } from 'antd';
import type { TableColumnsType } from 'antd';
import type { FilterValue } from '../../../components/Filter';
import Filter from '../../../components/Filter';
import OperationCell from '../../../components/OperationCell';
import ApprovalDetailDrawer from '../../../components/ApprovalDetailDrawer';
import { claimApproval, getApprovalRecords } from '../../../mock/approval';
import type { ApprovalListParams, ApprovalRecord, ApprovalStatus } from '../../../types';

const filterConfigs = [
  { key: 'type', label: '类型', type: 'select' as const, options: [{ label: '产品维护', value: '产品维护' }, { label: '营运管理', value: '营运管理' }, { label: '贷后纾困', value: '贷后纾困' }, { label: '内管审批', value: '内管审批' }] },
  { key: 'caseSubtype', label: '案件子类型', type: 'select' as const, options: [{ label: '还款方式维护审批', value: '还款方式维护审批' }, { label: '手动还款审批', value: '手动还款审批' }, { label: '债务重组', value: '债务重组' }, { label: '灵动重组', value: '灵动重组' }, { label: '批扣操作', value: '批扣操作' }] },
  { key: 'initiator', label: '发起人', type: 'input' as const, placeholder: '请输入发起人' },
  { key: 'applyTime', label: '发起时间', type: 'datePicker' as const },
  { key: 'approvalStatus', label: '审批状态', type: 'select' as const, options: [{ label: '待审批', value: '待审批' }, { label: '已通过', value: '已通过' }, { label: '已驳回', value: '已驳回' }] },
];

const statusColor: Record<ApprovalStatus, string> = { 待审批: 'orange', 已通过: 'green', 已驳回: 'red' };

export default function PendingApprovalPage() {
  const [records, setRecords] = useState<ApprovalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, FilterValue>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<ApprovalRecord>();

  const loadRecords = (nextFilters: Record<string, FilterValue>, nextPage = page, nextPageSize = pageSize) => {
    setLoading(true);
    void getApprovalRecords({ ...nextFilters, page: nextPage, pageSize: nextPageSize } as ApprovalListParams)
      .then((response) => { setRecords(response.data.list); setTotal(response.data.total); })
      .catch(() => message.error('待审列表加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadRecords({}, 1, pageSize); }, []);

  const handleSearch = (values: Record<string, FilterValue>) => { setFilters(values); setPage(1); loadRecords(values, 1, pageSize); };
  const handlePageChange = (nextPage: number, nextPageSize: number) => { setPage(nextPage); setPageSize(nextPageSize); loadRecords(filters, nextPage, nextPageSize); };
  const handleClaim = (record: ApprovalRecord) => {
    void claimApproval(record.id).then((response) => {
      setRecords((current) => current.map((item) => item.id === response.data.id ? response.data : item));
      setSelected((current) => current?.id === response.data.id ? response.data : current);
      message.success('认领成功');
    });
  };

  const columns: TableColumnsType<ApprovalRecord> = [
    { title: '序号', dataIndex: 'id', width: 70, fixed: 'left' },
    { title: '机构', dataIndex: 'institution', width: 130 },
    { title: '产品', dataIndex: 'product', width: 150 },
    { title: '类型', dataIndex: 'type', width: 110 },
    { title: '案件子类型', dataIndex: 'caseSubtype', width: 190 },
    { title: '发起人', dataIndex: 'initiator', width: 100 },
    { title: '发起时间', dataIndex: 'applyTime', width: 170 },
    { title: '审批人', dataIndex: 'approver', width: 150 },
    { title: '审批状态', dataIndex: 'approvalStatus', width: 100, render: (value: ApprovalStatus) => <Tag color={statusColor[value]}>{value}</Tag> },
    { title: '操作', key: 'action', fixed: 'right', width: 150, render: (_value, record) => <OperationCell items={[{ key: 'claim', label: '认领' }, { key: 'view', label: '查看详情' }]} onAction={(key) => key === 'claim' ? handleClaim(record) : setSelected(record)} /> },
  ];

  return <div className="page-container approval-pending-page">
    <div className="approval-watermark" aria-hidden="true">机构代码：2001</div>
    <div className="page-heading"><div><h1 className="page-title">待审列表</h1><p className="page-description">集中查看并处理各业务模块提交的审批申请</p></div></div>
    <Card className="filter-card" bordered={false}><Filter configs={filterConfigs} onSearch={handleSearch} /></Card>
    <Card className="table-card" bordered={false}><Table size="middle" rowKey="id" bordered loading={loading} columns={columns} dataSource={records} scroll={{ x: 1320 }} pagination={false} /><div className="approval-pagination"><span>共 {total} 条</span><Pagination current={page} pageSize={pageSize} total={total} showSizeChanger pageSizeOptions={[10, 20, 50]} onChange={handlePageChange} showTotal={() => ''} /></div></Card>
    <ApprovalDetailDrawer record={selected} open={Boolean(selected)} onClose={() => setSelected(undefined)} onClaim={handleClaim} />
  </div>;
}
