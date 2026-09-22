import { Button, Card, Descriptions, Drawer, Space, Tag, Typography, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import Filter, { type FilterConfig, type FilterValue } from '../../../components/Filter';
import DataTable from '../../../components/DataTable';
import OperationCell from '../../../components/OperationCell';
import {
  getInLoanAdjustmentDetails,
  getInLoanLoans,
  inLoanChannels,
  inLoanInstitutions,
  inLoanProducts,
  inLoanStatuses,
  revokeInLoanAdjustment,
} from '../../../mock/inLoanAdjustment';
import type { InLoanAdjustmentApplication, InLoanListParams, InLoanLoan } from '../../../types';
import AdjustmentDrawer, { type InLoanAdjustmentMode } from '../AdjustmentDrawer';

const institutionOptions = inLoanInstitutions.map((value) => ({ label: value, value }));
const productOptions = inLoanProducts.map((value) => ({ label: value, value }));
const statusOptions = inLoanStatuses.map((value) => ({ label: value, value }));
const channelOptions = inLoanChannels.map((value) => ({ label: value, value }));

const applicationFilters: FilterConfig[] = [
  { key: 'institutionName', label: '机构', type: 'select', options: institutionOptions, showSearch: true },
  { key: 'customerNo', label: '客户号', type: 'input' },
  { key: 'idCardNo', label: '证件号码', type: 'input' },
  { key: 'mobile', label: '手机号', type: 'input' },
  { key: 'loanNo', label: '借据号', type: 'input' },
  { key: 'productName', label: '核心产品', type: 'select', options: productOptions, showSearch: true },
];

const detailFilters: FilterConfig[] = [
  { key: 'institutionName', label: '机构', type: 'select', options: institutionOptions, showSearch: true },
  { key: 'customerNo', label: '客户号', type: 'input' },
  { key: 'idCardNo', label: '证件号码', type: 'input' },
  { key: 'mobile', label: '手机号', type: 'input' },
  { key: 'loanNo', label: '借据号', type: 'input' },
  { key: 'applyTime', label: '申请日期', type: 'datePicker', placeholder: '请选择申请日期范围' },
  { key: 'status', label: '申请状态', type: 'select', options: statusOptions },
  { key: 'applicationChannel', label: '申请渠道', type: 'select', options: channelOptions },
];

function textColumn<T extends object>(title: string, dataIndex: keyof T, width = 120) {
  return { title, dataIndex, width, ellipsis: true };
}

function loanStatusTag(value: InLoanLoan['loanStatus']) {
  return <Tag color={value === '正常' ? 'green' : value === '逾期' ? 'orange' : 'red'}>{value}</Tag>;
}

function accountStatusTag(value: InLoanLoan['accountStatus']) {
  return <Tag color={value === '正常' ? 'green' : 'orange'}>{value}</Tag>;
}

function applicationStatusTag(value: InLoanAdjustmentApplication['status']) {
  return <Tag color={value === '待签约' ? 'blue' : value === '已签约' ? 'green' : 'default'}>{value}</Tag>;
}

function channelTag(value: InLoanAdjustmentApplication['applicationChannel']) {
  return <Tag color={value === '单笔发起' ? 'blue' : value === '系统批量' ? 'purple' : 'cyan'}>{value}</Tag>;
}

function money(value: number) {
  return `${value.toLocaleString('zh-CN')} 元`;
}

function LoanDetail({ loan }: { loan: InLoanLoan }) {
  return <Descriptions column={{ xs: 1, sm: 2 }} size="small">
    <Descriptions.Item label="机构名称">{loan.institutionName}</Descriptions.Item>
    <Descriptions.Item label="机构号">{loan.institutionCode}</Descriptions.Item>
    <Descriptions.Item label="核心产品">{loan.productName}</Descriptions.Item>
    <Descriptions.Item label="产品号">{loan.productCode}</Descriptions.Item>
    <Descriptions.Item label="客户名称">{loan.customerName}</Descriptions.Item>
    <Descriptions.Item label="客户号">{loan.customerNo}</Descriptions.Item>
    <Descriptions.Item label="证件号码">{loan.idCardNo}</Descriptions.Item>
    <Descriptions.Item label="手机号">{loan.mobile}</Descriptions.Item>
    <Descriptions.Item label="借据号">{loan.loanNo}</Descriptions.Item>
    <Descriptions.Item label="贷款金额">{money(loan.loanAmount)}</Descriptions.Item>
    <Descriptions.Item label="贷款余额">{money(loan.loanBalance)}</Descriptions.Item>
    <Descriptions.Item label="起始日期">{loan.startDate}</Descriptions.Item>
    <Descriptions.Item label="到期日期">{loan.maturityDate}</Descriptions.Item>
    <Descriptions.Item label="下次还款日">{loan.nextRepaymentDate}</Descriptions.Item>
    <Descriptions.Item label="还款方式">{loan.repaymentMethod}</Descriptions.Item>
    <Descriptions.Item label="贷款期数">{loan.loanTerm} 期（剩余 {loan.remainingTerm} 期）</Descriptions.Item>
    <Descriptions.Item label="借据状态">{loanStatusTag(loan.loanStatus)}</Descriptions.Item>
    <Descriptions.Item label="账户状态">{accountStatusTag(loan.accountStatus)}</Descriptions.Item>
  </Descriptions>;
}

function applicationColumns(openDrawer: (mode: InLoanAdjustmentMode, loanId: number) => void, openDetail: (loanId: number) => void): TableColumnsType<InLoanLoan> {
  return [
    textColumn<InLoanLoan>('机构名称', 'institutionName', 120),
    textColumn<InLoanLoan>('机构号', 'institutionCode', 90),
    textColumn<InLoanLoan>('客户名称', 'customerName', 100),
    textColumn<InLoanLoan>('客户号', 'customerNo', 110),
    textColumn<InLoanLoan>('借据号', 'loanNo', 140),
    { title: '贷款金额', dataIndex: 'loanAmount', width: 125, render: money },
    { title: '贷款余额', dataIndex: 'loanBalance', width: 125, render: money },
    textColumn<InLoanLoan>('起始日期', 'startDate', 110),
    textColumn<InLoanLoan>('到期日期', 'maturityDate', 110),
    textColumn<InLoanLoan>('下次还款日', 'nextRepaymentDate', 120),
    textColumn<InLoanLoan>('还款方式', 'repaymentMethod', 120),
    { title: '贷款期数', dataIndex: 'loanTerm', width: 90, render: (value: number) => `${value}期` },
    { title: '借据状态', dataIndex: 'loanStatus', width: 100, render: loanStatusTag },
    { title: '账户状态', dataIndex: 'accountStatus', width: 100, render: accountStatusTag },
    { title: '操作', key: 'actions', fixed: 'right', width: 230, render: (_, record) => <OperationCell items={[{ key: 'detail', label: '贷款详情' }, { key: 'calculate', label: '贷款试算' }, { key: 'request', label: '调整申请' }]} onAction={(key) => key === 'detail' ? openDetail(record.id) : openDrawer(key as InLoanAdjustmentMode, record.id)} /> },
  ];
}

function detailColumns(
  openVideo: (record: InLoanAdjustmentApplication) => void,
  openAttachment: (record: InLoanAdjustmentApplication) => void,
  openRevoke: (record: InLoanAdjustmentApplication) => void,
): TableColumnsType<InLoanAdjustmentApplication> {
  return [
    textColumn<InLoanAdjustmentApplication>('机构名称', 'institutionName', 120),
    textColumn<InLoanAdjustmentApplication>('机构号', 'institutionCode', 90),
    textColumn<InLoanAdjustmentApplication>('客户名称', 'customerName', 100),
    textColumn<InLoanAdjustmentApplication>('客户号', 'customerNo', 110),
    textColumn<InLoanAdjustmentApplication>('借据号', 'loanNo', 140),
    textColumn<InLoanAdjustmentApplication>('申请时间', 'applyTime', 145),
    { title: '申请状态', dataIndex: 'status', width: 100, render: applicationStatusTag },
    textColumn<InLoanAdjustmentApplication>('原还款方式', 'originalRepaymentMethod', 120),
    textColumn<InLoanAdjustmentApplication>('新还款方式', 'newRepaymentMethod', 120),
    { title: '原总期数', dataIndex: 'originalTotalTerm', width: 95, render: (value: number) => `${value}期` },
    { title: '新总期数', dataIndex: 'newTotalTerm', width: 95, render: (value: number) => `${value}期` },
    { title: '原剩余期数(期)', dataIndex: 'originalRemainingTerm', width: 115 },
    { title: '新剩余期数(期)', dataIndex: 'newRemainingTerm', width: 115 },
    { title: '原正常利率', dataIndex: 'originalNormalRate', width: 105, render: (value: number) => `${value}%` },
    { title: '正常利率', dataIndex: 'newNormalRate', width: 105, render: (value: number) => `${value}%` },
    { title: '原逾期利率', dataIndex: 'originalPenaltyRate', width: 105, render: (value: number) => `${value}%` },
    { title: '逾期利率', dataIndex: 'newPenaltyRate', width: 105, render: (value: number) => `${value}%` },
    { title: '原复息利率', dataIndex: 'originalCompoundRate', width: 105, render: (value: number) => `${value}%` },
    { title: '复息利率', dataIndex: 'newCompoundRate', width: 105, render: (value: number) => `${value}%` },
    textColumn<InLoanAdjustmentApplication>('失效日期', 'expiryDate', 110),
    textColumn<InLoanAdjustmentApplication>('签约时间', 'signingTime', 130),
    textColumn<InLoanAdjustmentApplication>('撤销时间', 'revokeTime', 130),
    textColumn<InLoanAdjustmentApplication>('申请原因', 'reason', 220),
    textColumn<InLoanAdjustmentApplication>('撤销原因', 'revokeReason', 180),
    { title: '申请渠道', dataIndex: 'applicationChannel', width: 105, render: channelTag },
    textColumn<InLoanAdjustmentApplication>('申请人名称', 'applicantName', 110),
    textColumn<InLoanAdjustmentApplication>('申请人ID', 'applicantId', 110),
    { title: '视频面签', key: 'video', fixed: 'right', width: 100, render: (_, record) => <OperationCell items={[{ key: 'view', label: '查看', disabled: !record.videoSignAvailable }]} onAction={() => openVideo(record)} /> },
    { title: '附件材料', key: 'attachment', fixed: 'right', width: 110, render: (_, record) => record.attachmentName ? <OperationCell items={[{ key: 'download', label: '下载' }]} onAction={() => openAttachment(record)} /> : '-' },
    { title: '操作', key: 'actions', fixed: 'right', width: 90, render: (_, record) => record.status === '待签约' ? <OperationCell items={[{ key: 'revoke', label: '撤销', danger: true }]} onAction={() => openRevoke(record)} /> : null },
  ];
}

export default function AdjustmentListPage({ isDetail = false }: { isDetail?: boolean }) {
  const [data, setData] = useState<Array<InLoanLoan | InLoanAdjustmentApplication>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState<Record<string, unknown>>({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [drawer, setDrawer] = useState<{ mode: InLoanAdjustmentMode; loanId: number } | null>(null);
  const [detailLoan, setDetailLoan] = useState<InLoanLoan | null>(null);
  const [videoRecord, setVideoRecord] = useState<InLoanAdjustmentApplication | null>(null);
  const [attachmentRecord, setAttachmentRecord] = useState<InLoanAdjustmentApplication | null>(null);
  const [revokeRecord, setRevokeRecord] = useState<InLoanAdjustmentApplication | null>(null);
  const requestId = useRef(0);

  const loadData = useCallback(async (page: number, pageSize: number, nextQuery: Record<string, unknown>) => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const response = isDetail
        ? await getInLoanAdjustmentDetails({ page, pageSize, ...nextQuery } as InLoanListParams)
        : await getInLoanLoans({ page, pageSize, ...nextQuery } as InLoanListParams);
      if (currentRequest !== requestId.current) return;
      setData(response.data.list);
      setPagination({ current: response.data.page, pageSize: response.data.pagesize, total: response.data.total });
    } catch {
      if (currentRequest !== requestId.current) return;
      setError('数据加载失败，请重试');
      message.error('数据加载失败');
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [isDetail]);

  useEffect(() => { void loadData(1, 10, {}); }, [loadData]);

  const handleSearch = (values: Record<string, FilterValue>) => {
    const normalized = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== ''));
    setQuery(normalized);
    setPagination((current) => ({ ...current, current: 1 }));
    void loadData(1, pagination.pageSize, normalized);
  };
  const handlePageChange = (page: number, pageSize: number) => {
    setPagination((current) => ({ ...current, current: page, pageSize }));
    void loadData(page, pageSize, query);
  };
  const reload = () => { void loadData(pagination.current, pagination.pageSize, query); };
  const handleRevoke = async () => {
    if (!revokeRecord) return;
    const response = await revokeInLoanAdjustment(revokeRecord.applicationId);
    if (response.code !== 0) { message.error(response.message); return; }
    message.success(response.message);
    setRevokeRecord(null);
    reload();
  };

  const rows = isDetail ? data as InLoanAdjustmentApplication[] : data as InLoanLoan[];
  const table = isDetail
    ? <DataTable<InLoanAdjustmentApplication> columns={detailColumns(setVideoRecord, setAttachmentRecord, setRevokeRecord)} dataSource={rows as InLoanAdjustmentApplication[]} loading={loading} pagination={pagination} onPageChange={handlePageChange} />
    : <DataTable<InLoanLoan> columns={applicationColumns((mode, loanId) => setDrawer({ mode, loanId }), (loanId) => {
      const loan = (rows as InLoanLoan[]).find((item) => item.id === loanId);
      if (loan) setDetailLoan(loan);
    })} dataSource={rows as InLoanLoan[]} loading={loading} pagination={pagination} onPageChange={handlePageChange} />;
  return <div className="page-container in-loan-adjustment-page">
    <Card className="filter-card"><Filter configs={isDetail ? detailFilters : applicationFilters} onSearch={handleSearch} /></Card>
    {error && <div className="page-alert error-alert">{error}<Button size="small" onClick={reload}>重试</Button></div>}
    <Card className="table-card">{table}</Card>
    <Drawer title={drawer?.mode === 'request' ? '调整申请' : '贷款试算'} open={drawer !== null} onClose={() => setDrawer(null)} destroyOnClose width="min(1200px, 100vw)" className="in-loan-drawer">
      {drawer && <AdjustmentDrawer mode={drawer.mode} loanId={drawer.loanId} embedded onClose={() => setDrawer(null)} onSubmitted={() => { setDrawer(null); reload(); }} />}
    </Drawer>
    <Drawer title={detailLoan ? `${detailLoan.loanNo} 贷款详情` : '贷款详情'} open={detailLoan !== null} onClose={() => setDetailLoan(null)} width="min(760px, 100vw)" destroyOnClose>
      {detailLoan && <LoanDetail loan={detailLoan} />}
    </Drawer>
    <Drawer title={videoRecord ? `${videoRecord.loanNo} 视频面签` : '视频面签'} open={videoRecord !== null} onClose={() => setVideoRecord(null)} width="min(560px, 100vw)" destroyOnClose>
      {videoRecord && <Descriptions column={1} size="small"><Descriptions.Item label="借据号">{videoRecord.loanNo}</Descriptions.Item><Descriptions.Item label="申请人">{videoRecord.applicantName}（{videoRecord.applicantId}）</Descriptions.Item><Descriptions.Item label="面签状态"><Tag color="green">已完成</Tag></Descriptions.Item><Descriptions.Item label="查看说明">原型展示：视频面签记录已归档，可由行方系统跳转查看。</Descriptions.Item></Descriptions>}
    </Drawer>
    <Drawer title={attachmentRecord ? `${attachmentRecord.loanNo} 附件材料` : '附件材料'} open={attachmentRecord !== null} onClose={() => setAttachmentRecord(null)} width="min(560px, 100vw)" destroyOnClose>
      {attachmentRecord && <Descriptions column={1} size="small"><Descriptions.Item label="借据号">{attachmentRecord.loanNo}</Descriptions.Item><Descriptions.Item label="附件名称">{attachmentRecord.attachmentName}</Descriptions.Item><Descriptions.Item label="文件状态"><Tag color="blue">已生成</Tag></Descriptions.Item><Descriptions.Item label="操作说明"><Button type="link" size="small" onClick={() => message.success(`已准备下载 ${attachmentRecord.attachmentName}`)}>下载附件</Button></Descriptions.Item></Descriptions>}
    </Drawer>
    <Drawer title="撤销调整申请" open={revokeRecord !== null} onClose={() => setRevokeRecord(null)} width="min(560px, 100vw)" destroyOnClose footer={<Space><Button onClick={() => setRevokeRecord(null)}>取消</Button><Button danger type="primary" onClick={() => void handleRevoke()}>确认撤销</Button></Space>}>
      {revokeRecord && <Descriptions column={1} size="small"><Descriptions.Item label="借据号">{revokeRecord.loanNo}</Descriptions.Item><Descriptions.Item label="申请状态">{applicationStatusTag(revokeRecord.status)}</Descriptions.Item><Descriptions.Item label="确认信息">确定撤销该笔调整申请吗？</Descriptions.Item></Descriptions>}
    </Drawer>
  </div>;
}
