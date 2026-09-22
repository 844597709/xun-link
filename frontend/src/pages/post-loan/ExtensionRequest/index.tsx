import {
  Button, Card, Descriptions, Drawer, Form, InputNumber, Modal, Radio, Space, Spin, Switch, Table, Tag, Typography, message,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import Filter, { type FilterConfig, type FilterValue } from '../../../components/Filter';
import DataTable from '../../../components/DataTable';
import OperationCell from '../../../components/OperationCell';
import {
  calculateExtensionPlan, extensionInstitutions, extensionProducts, getExtensionDetails, getExtensionHistory, getExtensionLoan, getExtensionLoans,
  submitExtensionApplication, type ExtensionListParams,
} from '../../../mock/extension';
import type { ExtensionApplication, ExtensionDetail, ExtensionHistory, ExtensionLoan, ExtensionRepaymentPlan } from '../../../types';

const loanFilters: FilterConfig[] = [
  { key: 'institutionName', label: '机构名称', type: 'select', options: extensionInstitutions.map((value) => ({ label: value, value })), showSearch: true },
  { key: 'customerNo', label: '客户号', type: 'input', placeholder: '请输入客户号' },
  { key: 'idCardNo', label: '证件号码', type: 'input' },
  { key: 'mobile', label: '手机号', type: 'input' },
  { key: 'loanNo', label: '借据号', type: 'input' },
  { key: 'productName', label: '核心产品', type: 'select', options: extensionProducts.map((value) => ({ label: value, value })), showSearch: true },
];

function money(value: number) {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function loanStatusTag(value: ExtensionLoan['loanStatus']) {
  return <Tag color={value === '正常' || value === '结清' ? 'green' : 'red'}>{value}</Tag>;
}

function textColumn(title: string, dataIndex: keyof ExtensionLoan, width = 125) {
  return { title, dataIndex, width, ellipsis: true };
}

const planColumns: TableColumnsType<ExtensionRepaymentPlan> = [
  { title: '期数', dataIndex: 'period', width: 70, fixed: 'left' },
  { title: '开始日期', dataIndex: 'startDate', width: 110 },
  { title: '到期日期', dataIndex: 'dueDate', width: 110 },
  { title: '本期状态', dataIndex: 'status', width: 90, render: (value: ExtensionRepaymentPlan['status']) => <Tag color={value === '结清' ? 'default' : 'blue'}>{value}</Tag> },
  { title: '初始本息', dataIndex: 'initialTotal', width: 115, render: (value: number) => money(value) },
  { title: '初始本金', dataIndex: 'initialPrincipal', width: 115, render: (value: number) => money(value) },
  { title: '初始利息', dataIndex: 'initialInterest', width: 115, render: (value: number) => money(value) },
  { title: '剩余本金', dataIndex: 'remainingPrincipal', width: 115, render: (value: number) => money(value) },
];

function LoanDetail({ loan }: { loan: ExtensionLoan }) {
  return <Descriptions column={{ xs: 1, sm: 2 }} size="small">
    <Descriptions.Item label="机构名称">{loan.institutionName}</Descriptions.Item>
    <Descriptions.Item label="机构号">{loan.institutionCode}</Descriptions.Item>
    <Descriptions.Item label="客户名称">{loan.customerName}</Descriptions.Item>
    <Descriptions.Item label="客户号">{loan.customerNo}</Descriptions.Item>
    <Descriptions.Item label="证件号码">{loan.idCardNo}</Descriptions.Item>
    <Descriptions.Item label="手机号">{loan.mobile}</Descriptions.Item>
    <Descriptions.Item label="借据号">{loan.loanNo}</Descriptions.Item>
    <Descriptions.Item label="核心产品">{loan.productName}</Descriptions.Item>
    <Descriptions.Item label="借款金额">{money(loan.loanAmount)}</Descriptions.Item>
    <Descriptions.Item label="借款余额">{money(loan.loanBalance)}</Descriptions.Item>
    <Descriptions.Item label="起始日期">{loan.startDate}</Descriptions.Item>
    <Descriptions.Item label="到期日期">{loan.maturityDate}</Descriptions.Item>
    <Descriptions.Item label="还款方式">{loan.repaymentMethod}</Descriptions.Item>
    <Descriptions.Item label="贷款期限">{loan.loanTerm}期</Descriptions.Item>
    <Descriptions.Item label="产品最长贷款期限">{loan.maxTerm}期</Descriptions.Item>
  </Descriptions>;
}

function ExtensionDetailContent({ detail }: { detail: ExtensionDetail }) {
  return <Descriptions column={{ xs: 1, sm: 2 }} size="small">
    <Descriptions.Item label="全局流水号">{detail.globalSerialNo}</Descriptions.Item>
    <Descriptions.Item label="全局状态">{detail.globalStatus}</Descriptions.Item>
    <Descriptions.Item label="交易阶段">{detail.transactionStage}</Descriptions.Item>
    <Descriptions.Item label="阶段状态">{detail.stageStatus}</Descriptions.Item>
    <Descriptions.Item label="申请日期">{detail.applicationDate}</Descriptions.Item>
    <Descriptions.Item label="原还款方式">{detail.originalRepaymentMethod}</Descriptions.Item>
    <Descriptions.Item label="新还款方式">{detail.newRepaymentMethod}</Descriptions.Item>
    <Descriptions.Item label="原剩余期数">{detail.originalRemainingTerm}期</Descriptions.Item>
    <Descriptions.Item label="新剩余期数">{detail.newRemainingTerm}期</Descriptions.Item>
    <Descriptions.Item label="原总期数">{detail.originalTotalTerm}期</Descriptions.Item>
    <Descriptions.Item label="新总期数">{detail.newTotalTerm}期</Descriptions.Item>
    <Descriptions.Item label="失效日期">{detail.expiryDate}</Descriptions.Item>
    <Descriptions.Item label="签约时间">{detail.signingTime ?? '-'}</Descriptions.Item>
    <Descriptions.Item label="撤销时间">{detail.revokeTime ?? '-'}</Descriptions.Item>
    <Descriptions.Item label="申请渠道">{detail.applicationChannel}</Descriptions.Item>
    <Descriptions.Item label="申请人">{detail.applicantName}</Descriptions.Item>
    <Descriptions.Item label="申请 ID">{detail.applicationId}</Descriptions.Item>
    <Descriptions.Item label="状态备注" span={2}>{detail.statusRemark}</Descriptions.Item>
  </Descriptions>;
}

function ExtensionDetailDrawer({ loanNo }: { loanNo: string }) {
  const [detail, setDetail] = useState<ExtensionDetail>();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    void getExtensionDetails({ page: 1, pageSize: 1, loanNo }).then((response) => {
      if (active) setDetail(response.data.list[0]);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loanNo]);
  if (loading) return <div className="extension-drawer-loading"><Spin tip="调整明细加载中..." /></div>;
  return detail ? <ExtensionDetailContent detail={detail} /> : <div className="extension-drawer-loading">暂无调整明细</div>;
}

function HistorySection({ records, historyRef, highlighted }: { records: ExtensionHistory[]; historyRef: React.RefObject<HTMLDivElement>; highlighted: boolean }) {
  return <div ref={historyRef} className={`extension-history-section${highlighted ? ' extension-history-highlight' : ''}`}>
    <Typography.Title level={5}>历史签约记录</Typography.Title>
    <Table<ExtensionHistory>
      rowKey="id"
      size="small"
      bordered
      dataSource={records}
      pagination={false}
      locale={{ emptyText: '暂无历史成功记录' }}
      scroll={{ x: 1160 }}
      columns={[
        { title: '申请日期', dataIndex: 'applicationDate', width: 105 },
        { title: '签约时间', dataIndex: 'signingTime', width: 105 },
        { title: '失效日期', dataIndex: 'expiryDate', width: 105 },
        { title: '调整申请', dataIndex: 'applicationId', width: 130, render: (value: string) => <Button type="link" size="small">{value}</Button> },
        { title: '延展/摊薄方式', dataIndex: 'adjustmentType', width: 110, render: (value: string) => <Tag color={value === '延展' ? 'blue' : 'purple'}>{value}</Tag> },
        { title: '调整月数', dataIndex: 'adjustmentMonths', width: 90, render: (value: number) => `${value}个月` },
        { title: '原总期数', dataIndex: 'originalTotalTerm', width: 90, render: (value: number) => `${value}期` },
        { title: '新总期数', dataIndex: 'newTotalTerm', width: 90, render: (value: number) => `${value}期` },
        { title: '原到期日', dataIndex: 'originalMaturityDate', width: 105 },
        { title: '新到期日', dataIndex: 'newMaturityDate', width: 105 },
      ]}
    />
  </div>;
}

type DrawerMode = 'request' | 'trial';

function ExtensionRequestDrawer({ loanId, mode, onClose, onSubmitted }: { loanId: number; mode: DrawerMode; onClose: () => void; onSubmitted: () => void }) {
  const [form] = Form.useForm<ExtensionApplication>();
  const [loan, setLoan] = useState<ExtensionLoan>();
  const [history, setHistory] = useState<ExtensionHistory[]>([]);
  const [plan, setPlan] = useState<ExtensionRepaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [highlighted, setHighlighted] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);
  const adjustmentType = Form.useWatch('adjustmentType', form);
  const adjustmentMonths = Form.useWatch('adjustmentMonths', form);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void Promise.all([getExtensionLoan(loanId), getExtensionHistory(loanId)]).then(([loanResponse, historyResponse]) => {
      if (!active) return;
      setLoan(loanResponse.data);
      setHistory(historyResponse.data);
      form.setFieldsValue({ adjustmentType: '延展', adjustmentMonths: 1, allowExceedMaxTerm: loanResponse.data.allowExceedMaxTerm });
      setLoading(false);
    });
    return () => { active = false; };
  }, [form, loanId]);

  useEffect(() => {
    if (!loan || !adjustmentType || !Number.isInteger(adjustmentMonths) || adjustmentMonths < 1 || (adjustmentType === '摊薄' && adjustmentMonths > loan.maxThinningMonths)) {
      setPlan([]);
      return;
    }
    let active = true;
    setCalculating(true);
    void calculateExtensionPlan(loan.id, adjustmentType, adjustmentMonths).then((response) => {
      if (active) setPlan(response.code === 0 ? response.data : []);
    }).finally(() => { if (active) setCalculating(false); });
    return () => { active = false; };
  }, [adjustmentMonths, adjustmentType, loan]);

  const showHistory = () => {
    historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlighted(true);
    window.setTimeout(() => setHighlighted(false), 1600);
  };

  const submit = async (values: ExtensionApplication) => {
    setSubmitting(true);
    try {
      const response = await submitExtensionApplication({ ...values, loanId });
      if (response.code !== 0) { message.error(response.message); return; }
      message.success(response.message);
      onSubmitted();
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = (values: ExtensionApplication) => {
    if (!loan || plan.length <= loan.maxTerm || mode === 'trial') return;
    const content = `借款调整计划总期数（${plan.length}期）已超过产品最长的贷款期限（${loan.maxTerm}期）`;
    if (values.allowExceedMaxTerm) {
      Modal.confirm({ title: '确认继续提交', content: `${content}，是否确认继续提交？`, okText: '确认继续', cancelText: '取消', onOk: () => submit(values) });
    } else {
      Modal.warning({ title: '无法提交调整申请', content: `${content}，调整后重新提交`, okText: '确定' });
    }
  };

  if (loading || !loan) return <div className="extension-drawer-loading"><Spin tip="贷款信息加载中..." /></div>;
  return <div className="extension-drawer-content">
    <div className="extension-drawer-scroll">
      <Card title="基础信息" className="extension-section-card" size="small">
        <Descriptions column={{ xs: 1, sm: 2 }} size="small">
          <Descriptions.Item label="客户名称">{loan.customerName}</Descriptions.Item>
          <Descriptions.Item label="客户号">{loan.customerNo}</Descriptions.Item>
          <Descriptions.Item label="借款金额">{money(loan.loanAmount)}</Descriptions.Item>
          <Descriptions.Item label="借款余额">{money(loan.loanBalance)}</Descriptions.Item>
          <Descriptions.Item label="借款状态">{loanStatusTag(loan.loanStatus)}</Descriptions.Item>
          <Descriptions.Item label="账户状态"><Tag color={loan.accountStatus === '正常' ? 'green' : 'orange'}>{loan.accountStatus}</Tag></Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title={mode === 'trial' ? '贷款试算' : '申请信息'} className="extension-section-card" size="small">
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="adjustmentType" label="调整方式" rules={[{ required: true, message: '请选择调整方式' }]}>
            <Radio.Group options={['延展', '摊薄'].map((value) => ({ label: value, value }))} optionType="button" buttonStyle="solid" />
          </Form.Item>
          <Form.Item
            name="adjustmentMonths"
            label={adjustmentType === '摊薄' ? '摊薄月数' : '延展月数'}
            extra={adjustmentType === '摊薄' ? `至多${loan.maxThinningMonths}个月` : '至少1个月'}
            rules={[{ required: true, message: '请输入调整月数' }, { validator: (_, value) => {
              if (!Number.isInteger(value) || value < 1) return Promise.reject(new Error('调整月数必须为大于等于1的整数'));
              if (adjustmentType === '摊薄' && value > loan.maxThinningMonths) return Promise.reject(new Error(`摊薄月数不能超过${loan.maxThinningMonths}个月`));
              return Promise.resolve();
            } }]}
          >
            <InputNumber min={1} max={adjustmentType === '摊薄' ? loan.maxThinningMonths : undefined} precision={0} addonAfter="个月" style={{ width: '100%' }} />
          </Form.Item>
          {mode === 'request' && <Form.Item name="allowExceedMaxTerm" label="是否允许超过产品最长贷款期限" valuePropName="checked" extra={`产品最长贷款期限：${loan.maxTerm}期`}>
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>}
          <Button type="link" onClick={showHistory} className="extension-history-link">查看历史延展期成功记录</Button>
          <div className="extension-plan-heading"><Typography.Title level={5}>还款计划预览</Typography.Title>{calculating && <Typography.Text type="secondary">计划计算中...</Typography.Text>}</div>
          <div className="extension-plan-table"><Table<ExtensionRepaymentPlan> rowKey="period" size="small" bordered columns={planColumns} dataSource={plan} loading={calculating} pagination={false} locale={{ emptyText: '填写合法调整月数后生成还款计划' }} rowClassName={(record) => record.status === '结清' ? 'extension-settled-row' : ''} scroll={{ x: 900, y: 330 }} /></div>
        </Form>
      </Card>
      <HistorySection records={history} historyRef={historyRef} highlighted={highlighted} />
    </div>
    <Card className="extension-drawer-actions"><Space><Button onClick={onClose}>取消</Button>{mode === 'request' && <Button type="primary" loading={submitting} disabled={!plan.length} onClick={() => void form.submit()}>确定</Button>}</Space></Card>
  </div>;
}

type AuxAction = 'loan' | 'trial' | 'detail';
type RequestState = { loanId: number; mode: DrawerMode };
type AuxDrawerState = { action: AuxAction; loan?: ExtensionLoan; loanNo?: string };

function buildColumns(openRequest: (state: RequestState) => void, openAuxDrawer: (action: AuxAction, loan: ExtensionLoan) => void): TableColumnsType<ExtensionLoan> {
  return [
    textColumn('机构名称', 'institutionName', 120), textColumn('机构号', 'institutionCode', 90),
    textColumn('客户名称', 'customerName', 110), textColumn('客户号', 'customerNo', 105), textColumn('借据号', 'loanNo', 145),
    { title: '贷款金额', dataIndex: 'loanAmount', width: 135, render: (value: number) => money(value) },
    { title: '贷款余额', dataIndex: 'loanBalance', width: 135, render: (value: number) => money(value) },
    textColumn('起始日期', 'startDate', 110), textColumn('到期日期', 'maturityDate', 110), textColumn('下次还款日', 'nextRepaymentDate', 120),
    textColumn('还款方式', 'repaymentMethod', 105), { title: '贷款期数', dataIndex: 'loanTerm', width: 90, render: (value: number) => `${value}期` },
    { title: '借据状态', dataIndex: 'loanStatus', width: 95, render: (value: ExtensionLoan['loanStatus']) => loanStatusTag(value) },
    { title: '账户状态', dataIndex: 'accountStatus', width: 95, render: (value: ExtensionLoan['accountStatus']) => <Tag color={value === '正常' ? 'green' : 'orange'}>{value}</Tag> },
    {
      title: '操作', key: 'actions', fixed: 'right', width: 250,
      render: (_, record) => <Space className="loan-list-actions operation-cell" size={0} wrap={false}>
        <Button type="link" size="small" onClick={() => openAuxDrawer('loan', record)}>贷款详情</Button>
        <Button type="link" size="small" onClick={() => openRequest({ loanId: record.id, mode: 'trial' })}>贷款试算</Button>
        <Button type="link" size="small" onClick={() => openRequest({ loanId: record.id, mode: 'request' })}>调整申请</Button>
      </Space>,
    },
  ];
}

export default function ExtensionRequest() {
  const [data, setData] = useState<ExtensionLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState<Record<string, unknown>>({});
  const [requestState, setRequestState] = useState<RequestState>();
  const [auxDrawer, setAuxDrawer] = useState<AuxDrawerState>();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const requestId = useRef(0);

  const loadData = useCallback(async (page: number, pageSize: number, nextQuery: Record<string, unknown>) => {
    const id = ++requestId.current;
    setLoading(true); setError('');
    try {
      const response = await getExtensionLoans({ page, pageSize, ...nextQuery } as ExtensionListParams);
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
  const openAuxDrawer = (action: AuxAction, loan: ExtensionLoan) => {
    if (action === 'loan') setAuxDrawer({ action, loan });
    else setAuxDrawer({ action, loanNo: loan.loanNo });
  };

  return <div className="page-container extension-page">
    <Card className="filter-card"><Filter configs={loanFilters} onSearch={handleSearch} /></Card>
    {error && <div className="page-alert error-alert">{error}<Button size="small" onClick={reload}>重试</Button></div>}
    <Card className="table-card"><DataTable columns={buildColumns(setRequestState, openAuxDrawer)} dataSource={data} loading={loading} pagination={pagination} onPageChange={(page, pageSize) => { setPagination((current) => ({ ...current, current: page, pageSize })); void loadData(page, pageSize, query); }} /></Card>
    <Drawer title={requestState?.mode === 'trial' ? '贷款试算' : '调整申请'} open={requestState !== undefined} onClose={() => setRequestState(undefined)} destroyOnClose width="min(1200px, 100vw)" className="extension-drawer">
      {requestState && <ExtensionRequestDrawer loanId={requestState.loanId} mode={requestState.mode} onClose={() => setRequestState(undefined)} onSubmitted={() => { setRequestState(undefined); reload(); }} />}
    </Drawer>
    <Drawer
      title={auxDrawer?.action === 'loan' ? `${auxDrawer.loan?.loanNo ?? ''} 贷款详情` : '调整明细'}
      open={auxDrawer !== undefined}
      onClose={() => setAuxDrawer(undefined)}
      destroyOnClose
      width="min(760px, 100vw)"
      className="extension-drawer"
    >
      {auxDrawer?.action === 'loan' && auxDrawer.loan && <LoanDetail loan={auxDrawer.loan} />}
      {auxDrawer?.action === 'detail' && auxDrawer.loanNo && <ExtensionDetailDrawer loanNo={auxDrawer.loanNo} />}
    </Drawer>
  </div>;
}
