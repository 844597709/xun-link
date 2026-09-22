import { Button, Card, Descriptions, Drawer, Space, Tag, Tooltip, Typography, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import Filter, { type FilterConfig, type FilterValue } from '../../../components/Filter';
import DataTable from '../../../components/DataTable';
import OperationCell from '../../../components/OperationCell';
import {
  extensionGlobalStatuses, extensionInstitutions, extensionProducts, getExtensionDetails, revokeExtensionDetail,
  type ExtensionListParams,
} from '../../../mock/extension';
import type { ExtensionDetail, ExtensionGlobalStatus } from '../../../types';

const detailFilters: FilterConfig[] = [
  { key: 'institutionName', label: '机构名称', type: 'select', options: extensionInstitutions.map((value) => ({ label: value, value })), showSearch: true },
  { key: 'customerNo', label: '客户号', type: 'input' },
  { key: 'idCardNo', label: '证件号码', type: 'input' },
  { key: 'mobile', label: '手机号', type: 'input' },
  { key: 'loanNo', label: '借据号', type: 'input' },
  { key: 'productName', label: '核心产品', type: 'select', options: extensionProducts.map((value) => ({ label: value, value })), showSearch: true },
  { key: 'globalStatus', label: '全局状态', type: 'select', options: extensionGlobalStatuses.map((value) => ({ label: value, value })) },
];

function statusTag(value: ExtensionGlobalStatus) {
  const color = value === '成功' ? 'green' : value === '失败' ? 'red' : value === '已撤销' ? 'default' : 'blue';
  return <Tag color={color}>{value}</Tag>;
}

function detailContent(record: ExtensionDetail) {
  return <Descriptions column={{ xs: 1, sm: 2 }} size="small">
    <Descriptions.Item label="机构名称">{record.institutionName}</Descriptions.Item>
    <Descriptions.Item label="机构号">{record.institutionCode}</Descriptions.Item>
    <Descriptions.Item label="客户名称">{record.customerName}</Descriptions.Item>
    <Descriptions.Item label="客户号">{record.customerNo}</Descriptions.Item>
    <Descriptions.Item label="借据号">{record.loanNo}</Descriptions.Item>
    <Descriptions.Item label="全局流水号">{record.globalSerialNo}</Descriptions.Item>
    <Descriptions.Item label="全局状态">{statusTag(record.globalStatus)}</Descriptions.Item>
    <Descriptions.Item label="交易阶段">{record.transactionStage}</Descriptions.Item>
    <Descriptions.Item label="阶段状态">{record.stageStatus}</Descriptions.Item>
    <Descriptions.Item label="申请日期">{record.applicationDate}</Descriptions.Item>
    <Descriptions.Item label="原还款方式">{record.originalRepaymentMethod}</Descriptions.Item>
    <Descriptions.Item label="新还款方式">{record.newRepaymentMethod}</Descriptions.Item>
    <Descriptions.Item label="原剩余期数">{record.originalRemainingTerm}期</Descriptions.Item>
    <Descriptions.Item label="新剩余期数">{record.newRemainingTerm}期</Descriptions.Item>
    <Descriptions.Item label="原总期数">{record.originalTotalTerm}期</Descriptions.Item>
    <Descriptions.Item label="新总期数">{record.newTotalTerm}期</Descriptions.Item>
    <Descriptions.Item label="失效日期">{record.expiryDate}</Descriptions.Item>
    <Descriptions.Item label="签约时间">{record.signingTime ?? '-'}</Descriptions.Item>
    <Descriptions.Item label="撤销时间">{record.revokeTime ?? '-'}</Descriptions.Item>
    <Descriptions.Item label="申请渠道">{record.applicationChannel}</Descriptions.Item>
    <Descriptions.Item label="申请人">{record.applicantName}</Descriptions.Item>
    <Descriptions.Item label="申请 ID">{record.applicationId}</Descriptions.Item>
    <Descriptions.Item label="申请原因" span={2}>{record.reason}</Descriptions.Item>
    <Descriptions.Item label="状态备注" span={2}>{record.statusRemark}</Descriptions.Item>
  </Descriptions>;
}

type DetailAction = 'view' | 'video' | 'attachment' | 'revoke';

function actionContent(record: ExtensionDetail, action: DetailAction) {
  if (action === 'view') return detailContent(record);
  if (action === 'video') return <Descriptions column={1} size="small"><Descriptions.Item label="借据号">{record.loanNo}</Descriptions.Item><Descriptions.Item label="视频面签状态"><Tag color="green">已归档</Tag></Descriptions.Item><Descriptions.Item label="查看说明">原型展示：视频面签记录已归档，可由行方系统跳转查看。</Descriptions.Item></Descriptions>;
  if (action === 'attachment') return <Descriptions column={1} size="small"><Descriptions.Item label="借据号">{record.loanNo}</Descriptions.Item><Descriptions.Item label="附件名称">{record.attachmentName}</Descriptions.Item><Descriptions.Item label="操作说明"><Button type="link" size="small" onClick={() => message.success(`已准备下载${record.attachmentName}`)}>下载查看</Button></Descriptions.Item></Descriptions>;
  return <Descriptions column={1} size="small"><Descriptions.Item label="借据号">{record.loanNo}</Descriptions.Item><Descriptions.Item label="当前状态">{statusTag(record.globalStatus)}</Descriptions.Item><Descriptions.Item label="确认信息">确定撤销该笔调整单据吗？</Descriptions.Item></Descriptions>;
}

function columns(openAction: (action: DetailAction, record: ExtensionDetail) => void): TableColumnsType<ExtensionDetail> {
  return [
    { title: '机构名称', dataIndex: 'institutionName', width: 115, ellipsis: true },
    { title: '机构号', dataIndex: 'institutionCode', width: 90 },
    { title: '客户名称', dataIndex: 'customerName', width: 105 },
    { title: '客户号', dataIndex: 'customerNo', width: 105 },
    { title: '借据号', dataIndex: 'loanNo', width: 145 },
    { title: '全局流水号', dataIndex: 'globalSerialNo', width: 155 },
    { title: '全局状态', dataIndex: 'globalStatus', width: 95, render: (value: ExtensionGlobalStatus) => statusTag(value) },
    { title: '交易阶段', dataIndex: 'transactionStage', width: 120 },
    { title: '阶段状态', dataIndex: 'stageStatus', width: 105 },
    { title: '申请日期', dataIndex: 'applicationDate', width: 110 },
    { title: '原还款方式', dataIndex: 'originalRepaymentMethod', width: 110 },
    { title: '新还款方式', dataIndex: 'newRepaymentMethod', width: 110 },
    { title: '原剩余期数', dataIndex: 'originalRemainingTerm', width: 105, render: (value: number) => `${value}期` },
    { title: '新剩余期数', dataIndex: 'newRemainingTerm', width: 105, render: (value: number) => `${value}期` },
    { title: '原总期数', dataIndex: 'originalTotalTerm', width: 95, render: (value: number) => `${value}期` },
    { title: '新总期数', dataIndex: 'newTotalTerm', width: 95, render: (value: number) => `${value}期` },
    { title: '失效日期', dataIndex: 'expiryDate', width: 110 },
    { title: '签约时间', dataIndex: 'signingTime', width: 110, render: (value?: string) => value ?? '-' },
    { title: '撤销时间', dataIndex: 'revokeTime', width: 110, render: (value?: string) => value ?? '-' },
    { title: '申请原因', dataIndex: 'reason', width: 190, ellipsis: true, render: (value: string) => <Tooltip title={value}>{value}</Tooltip> },
    { title: '状态备注', dataIndex: 'statusRemark', width: 145, ellipsis: true },
    { title: '申请渠道', dataIndex: 'applicationChannel', width: 105 },
    { title: '申请人', dataIndex: 'applicantName', width: 100 },
    { title: '申请 ID', dataIndex: 'applicationId', width: 130 },
    { title: '视频面签', dataIndex: 'videoSignAvailable', fixed: 'right', width: 105, render: (value: boolean, record: ExtensionDetail) => value ? <OperationCell items={[{ key: 'video', label: '查看' }]} onAction={() => openAction('video', record)} /> : <Typography.Text type="secondary">-</Typography.Text> },
    { title: '附件材料', dataIndex: 'attachmentName', fixed: 'right', width: 115, render: (value: string | undefined, record: ExtensionDetail) => value ? <OperationCell items={[{ key: 'attachment', label: '下载查看' }]} onAction={() => openAction('attachment', record)} /> : <Typography.Text type="secondary">-</Typography.Text> },
    { title: '操作', key: 'actions', fixed: 'right', width: 90, render: (_, record) => record.globalStatus !== '成功' && record.globalStatus !== '失败' ? <OperationCell items={[{ key: 'revoke', label: '撤销', danger: true }]} onAction={() => openAction('revoke', record)} /> : <Typography.Text type="secondary">-</Typography.Text> },
  ];
}

export default function ExtensionDetail() {
  const [data, setData] = useState<ExtensionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState<Record<string, unknown>>({});
  const [actionState, setActionState] = useState<{ action: DetailAction; record: ExtensionDetail }>();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const requestId = useRef(0);

  const loadData = useCallback(async (page: number, pageSize: number, nextQuery: Record<string, unknown>) => {
    const id = ++requestId.current;
    setLoading(true); setError('');
    try {
      const response = await getExtensionDetails({ page, pageSize, ...nextQuery } as ExtensionListParams);
      if (id !== requestId.current) return;
      setData(response.data.list); setPagination({ current: response.data.page, pageSize: response.data.pagesize, total: response.data.total });
    } catch { if (id === requestId.current) { setError('数据加载失败，请重试'); message.error('数据加载失败'); } } finally { if (id === requestId.current) setLoading(false); }
  }, []);
  useEffect(() => { void loadData(1, 10, {}); }, [loadData]);
  const handleSearch = (values: Record<string, FilterValue>) => {
    const normalized = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== ''));
    setQuery(normalized); setPagination((current) => ({ ...current, current: 1 })); void loadData(1, pagination.pageSize, normalized);
  };
  const reload = () => { void loadData(pagination.current, pagination.pageSize, query); };
  const handleAction = async () => {
    if (!actionState || actionState.action !== 'revoke') return;
    const response = await revokeExtensionDetail(actionState.record.id);
    if (response.code !== 0) { message.error(response.message); return; }
    message.success(response.message);
    setActionState(undefined);
    reload();
  };

  return <div className="page-container extension-page">
    <Card className="filter-card"><Filter configs={detailFilters} onSearch={handleSearch} /></Card>
    {error && <div className="page-alert error-alert">{error}<Button size="small" onClick={reload}>重试</Button></div>}
    <Card className="table-card"><DataTable columns={columns((action, record) => setActionState({ action, record }))} dataSource={data} loading={loading} pagination={pagination} onPageChange={(page, pageSize) => { setPagination((current) => ({ ...current, current: page, pageSize })); void loadData(page, pageSize, query); }} /></Card>
    <Drawer
      title={actionState?.action === 'video' ? '视频面签' : actionState?.action === 'attachment' ? '附件材料' : actionState?.action === 'revoke' ? '撤销调整单据' : actionState ? `${actionState.record.loanNo} 调整明细` : '调整明细'}
      open={actionState !== undefined}
      onClose={() => setActionState(undefined)}
      destroyOnClose
      width="min(800px, 100vw)"
      footer={actionState?.action === 'revoke' ? <Space><Button onClick={() => setActionState(undefined)}>取消</Button><Button danger type="primary" onClick={() => void handleAction()}>确认撤销</Button></Space> : undefined}
    >
      {actionState && actionContent(actionState.record, actionState.action)}
    </Drawer>
  </div>;
}
