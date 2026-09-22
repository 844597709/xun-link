import {
  Button, Card, Descriptions, Drawer, Empty, Form, Input, InputNumber, Select, Space, Table, Tag, Typography, message,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Key } from 'react';
import DataTable from '../../../components/DataTable';
import Filter, { type FilterConfig, type FilterValue } from '../../../components/Filter';
import OperationCell from '../../../components/OperationCell';
import {
  calculateManualRepayment, getManualRepaymentCalculation, getManualRepayments, manualRepaymentAccountStatuses,
  manualRepaymentInstitutions, manualRepaymentLoanStatuses, manualRepaymentProducts, submitManualRepayment,
} from '../../../mock/manualRepayment';
import type {
  ManualRepaymentCalculation, ManualRepaymentMode, ManualRepaymentPlan,
  ManualRepaymentRecord, ManualRepaymentSettings, ManualRepaymentType,
} from '../../../types';

const { Text } = Typography;
const allowPartialRepayment = true;
const allowOverdueEarlyRepayment = false;
const repaymentTypes: ManualRepaymentType[] = ['正常还款', '全部结清', '提前部分还款', '按期还款', '灵活还款'];
const batchRepaymentTypes: ManualRepaymentType[] = ['正常还款', '全部结清', '提前部分还款', '灵活还款'];
const orderText = '期供优先：费用-复息-应收利息-应收欠息-本金';
const money = (value: number) => Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const moneyValue = (value: number) => Math.round(Math.max(0, Number(value) || 0) * 100) / 100;
const options = (values: string[]) => values.map((value) => ({ label: value, value }));

const filterConfigs: FilterConfig[] = [
  { key: 'institutionName', label: '机构', type: 'select', options: options(manualRepaymentInstitutions), showSearch: true },
  { key: 'customerNo', label: '客户号', type: 'input' },
  { key: 'idCardNo', label: '证件号码', type: 'input' },
  { key: 'mobile', label: '手机号', type: 'input' },
  { key: 'customerName', label: '客户名称', type: 'input' },
  { key: 'loanNo', label: '借据号', type: 'input' },
  { key: 'loanStatus', label: '借据状态', type: 'select', options: options(manualRepaymentLoanStatuses) },
  { key: 'accountStatus', label: '账户状态', type: 'select', options: options(manualRepaymentAccountStatuses) },
  { key: 'productName', label: '核心产品', type: 'select', options: options(manualRepaymentProducts), showSearch: true },
];

const baseSettings = (record?: ManualRepaymentRecord): ManualRepaymentSettings => ({
  repaymentType: '正常还款', compensation: '否', accountType: undefined, repaymentOrder: orderText,
  accountNo: '', accountName: '', actualAmount: record?.dueTotal ?? 0, partialPrincipal: 0, exceedProductElement: '否', remark: '',
});

function statusTag(value: ManualRepaymentRecord['loanStatus']) {
  return <Tag color={value === '正常' ? 'green' : value === '逾期' ? 'orange' : value === '减值' ? 'red' : 'default'}>{value}</Tag>;
}

const planColumns: TableColumnsType<ManualRepaymentPlan> = [
  { title: '期数', dataIndex: 'period', width: 62 },
  { title: '初始日期', dataIndex: 'startDate', width: 105 },
  { title: '到期日期', dataIndex: 'dueDate', width: 105 },
  { title: '初始本金', dataIndex: 'initialPrincipal', width: 105, render: money },
  { title: '初始利息', dataIndex: 'initialInterest', width: 105, render: money },
  { title: '应收本息', dataIndex: 'dueAmount', width: 105, render: money },
  { title: '应收本金', dataIndex: 'duePrincipal', width: 105, render: money },
  { title: '应收总息', dataIndex: 'dueTotalInterest', width: 105, render: money },
  { title: '应收利息', dataIndex: 'dueInterest', width: 105, render: money },
  { title: '应收罚息', dataIndex: 'duePenalty', width: 105, render: money },
  { title: '应收费用', dataIndex: 'dueFee', width: 105, render: money },
  { title: '应收费用罚息', dataIndex: 'dueFeePenalty', width: 115, render: money },
  { title: '调整总息', dataIndex: 'adjustmentInterest', width: 105, render: money },
  { title: '本期状态', dataIndex: 'status', width: 85, render: (value: ManualRepaymentPlan['status']) => <Tag color={value === '逾期' ? 'orange' : value === '结清' ? 'green' : 'blue'}>{value}</Tag> },
];

function PlanTable({ plans }: { plans: ManualRepaymentPlan[] }) {
  return <Table className="manual-plan-table" size="small" bordered rowKey="period" columns={planColumns} dataSource={plans} pagination={false} scroll={{ x: 1400 }} />;
}

function CalculationTable({ calculation, actual = false, partialPrincipal, onPartialPrincipalChange }: {
  calculation: ManualRepaymentCalculation;
  actual?: boolean;
  partialPrincipal?: number;
  onPartialPrincipalChange?: (value: number) => void;
}) {
  const columns: TableColumnsType<ManualRepaymentCalculation & { key: string }> = [
    { title: actual ? '实际还款金额' : '应还总额', dataIndex: 'total', width: 130, render: (value: number) => actual ? money(value) : money(value) },
    ...(actual && onPartialPrincipalChange ? [{ title: '提前部分还款本金', key: 'partialPrincipal', width: 160, render: () => <InputNumber min={0} precision={2} value={partialPrincipal} onChange={(value) => onPartialPrincipalChange(Number(value || 0))} /> }] : []),
    { title: actual ? '实际还款本金' : '应还本金', dataIndex: 'principal', width: 125, render: money },
    { title: actual ? '实际还款总息' : '应还总息', dataIndex: 'totalInterest', width: 125, render: money },
    { title: actual ? '实际还款利息' : '应收利息', dataIndex: 'interest', width: 120, render: money },
    { title: actual ? '实际还款罚息' : '应收罚息', dataIndex: 'penalty', width: 120, render: money },
    { title: actual ? '实际还款费用' : '应收费用', dataIndex: 'fee', width: 120, render: money },
    { title: actual ? '实际还款费用明细' : '应收费用明细', dataIndex: 'feeDetail', width: 170 },
    { title: '调整总息', dataIndex: 'adjustmentInterest', width: 110, render: money },
  ];
  return <Table size="small" bordered rowKey={() => actual ? 'actual' : 'due'} columns={columns} dataSource={[{ ...calculation, key: actual ? 'actual' : 'due' }]} pagination={false} scroll={{ x: 1050 }} />;
}

function BasicInfo({ record, batch = false }: { record: ManualRepaymentRecord; batch?: boolean }) {
  return <Descriptions className="manual-basic-info" size="small" column={{ xs: 1, sm: 2, md: 3 }}>
    {!batch && <Descriptions.Item label="借款金额">{money(record.loanAmount)} 元</Descriptions.Item>}
    <Descriptions.Item label="客户名称">{record.customerName}</Descriptions.Item>
    <Descriptions.Item label="客户号">{record.customerNo}</Descriptions.Item>
    <Descriptions.Item label="机构号">{record.institutionCode}</Descriptions.Item>
    <Descriptions.Item label="机构名称">{record.institutionName}</Descriptions.Item>
    {batch && <Descriptions.Item label="借据数量">批量选择 {record.id} 笔</Descriptions.Item>}
  </Descriptions>;
}

function SettingsFields({ form, record, batch = false }: { form: ReturnType<typeof Form.useForm<ManualRepaymentSettings>>[0]; record?: ManualRepaymentRecord; batch?: boolean }) {
  const repaymentType = Form.useWatch('repaymentType', form);
  const actualAmount = Form.useWatch('actualAmount', form);
  return <div className="manual-settings-grid">
    <Form.Item name="repaymentType" label="还款类型" rules={[{ required: true, message: '请选择还款类型' }]}>
      <Select options={options(batch ? batchRepaymentTypes : repaymentTypes)} />
    </Form.Item>
    <Form.Item name="compensation" label="是否代偿" rules={[{ required: true, message: '请选择是否代偿' }]}><Select options={options(['是', '否'])} /></Form.Item>
    <Form.Item name="accountType" label="账户类型" rules={[{ required: true, message: '请选择账户类型' }]}><Select allowClear options={options(batch ? ['卡系列', '内部户', '对公户', '代还虚账户'] : ['绑定卡列表', '内部户', '对公户', '代还账户'])} /></Form.Item>
    <Form.Item label="还款顺序"><Input value={orderText} disabled /></Form.Item>
    <Form.Item name="accountNo" label={batch ? '还款账号' : '账号'} rules={[{ required: true, message: batch ? '请输入还款账号' : '请输入账号' }]}><Input placeholder="请输入" /></Form.Item>
    <Form.Item name="accountName" label={batch ? '还款户名' : '户名'} rules={[{ required: true, message: batch ? '请输入还款户名' : '请输入户名' }]}><Input placeholder="请输入" /></Form.Item>
    {!batch && <Form.Item name="actualAmount" label="实际金额" rules={[{ required: true, message: '请输入实际金额' }]}><InputNumber min={0} precision={2} disabled={!allowPartialRepayment} style={{ width: '100%' }} addonAfter="元" /></Form.Item>}
    {batch && (repaymentType === '全部结清' || repaymentType === '提前部分还款') && <Form.Item name="exceedProductElement" label="是否突破产品要素" rules={[{ required: true }]}><Select options={options(['是', '否'])} /></Form.Item>}
    {!batch && <div className="manual-amount-tip">{allowPartialRepayment ? '系统允许部分还款，实际金额可编辑' : `实际金额：${money(Number(actualAmount || record?.dueTotal || 0))} 元（系统控制不可编辑）`}</div>}
  </div>;
}

function SingleRepaymentDrawer({ record, mode, onClose, onSubmitted }: { record: ManualRepaymentRecord; mode: ManualRepaymentMode; onClose: () => void; onSubmitted: () => void }) {
  const [form] = Form.useForm<ManualRepaymentSettings>();
  const [calculating, setCalculating] = useState(false);
  const values = Form.useWatch([], form) as Partial<ManualRepaymentSettings> | undefined;
  const settings = { ...baseSettings(record), ...(values ?? {}) };
  const calculation = useMemo(() => calculateManualRepayment(record, settings), [record, settings.repaymentType, settings.actualAmount, settings.partialPrincipal]);
  useEffect(() => { form.setFieldsValue(baseSettings(record)); }, [form, record]);
  const runCalculation = async () => { setCalculating(true); await getManualRepaymentCalculation(record.id, settings); setCalculating(false); message.success('还款试算完成'); };
  const handleSubmit = async () => {
    try {
      await form.validateFields();
      if (settings.repaymentType === '提前部分还款' && Number(settings.partialPrincipal || 0) > record.loanBalance) { message.error('提前部分还款本金不能超过贷款余额'); return; }
      setCalculating(true);
      const response = await submitManualRepayment([record.id], settings);
      if (response.code !== 0) { message.error(response.message); return; }
      message.success(response.message); onSubmitted();
    } finally { setCalculating(false); }
  };
  return <div className="manual-drawer-content"><div className="manual-drawer-scroll">
    <Card title="基础信息" size="small" className="manual-section-card"><BasicInfo record={record} /></Card>
    <Card title="还款设置" size="small" className="manual-section-card"><Form form={form} layout="vertical"><SettingsFields form={form} record={record} /></Form></Card>
    {settings.repaymentType && <>
      <Card title="应还试算结果" size="small" className="manual-section-card"><CalculationTable calculation={calculation.due} /></Card>
      <Card title="实还试算结果" size="small" className="manual-section-card"><CalculationTable calculation={calculation.actual} actual partialPrincipal={settings.partialPrincipal} onPartialPrincipalChange={settings.repaymentType === '提前部分还款' ? (value) => form.setFieldValue('partialPrincipal', value) : undefined} /></Card>
    </>}
    <Card className="manual-drawer-actions"><Space><Button onClick={onClose}>取消</Button>{mode === 'calculate' ? <Button type="primary" loading={calculating} onClick={runCalculation}>试算</Button> : <Button type="primary" loading={calculating} onClick={() => void handleSubmit()}>确定</Button>}</Space></Card>
  </div></div>;
}

function summaryColumns(actual: boolean, amounts: Record<number, number>, onAmountChange?: (id: number, value: number) => void): TableColumnsType<ManualRepaymentRecord> {
  return [
    { title: '借据号', dataIndex: 'loanNo', width: 145, fixed: 'left', render: (value: string, record) => <Space size={4}><span>{value}</span>{record.loanStatus === '逾期' && <Tag color="orange">逾期</Tag>}</Space> },
    { title: actual ? '实际总额' : '应还总额', dataIndex: actual ? 'id' : 'dueTotal', width: 125, render: (value: number, record) => actual ? <InputNumber min={0} precision={2} value={amounts[record.id]} onChange={(next) => onAmountChange?.(record.id, Number(next || 0))} onBlur={() => onAmountChange?.(record.id, moneyValue(amounts[record.id]))} /> : money(value) },
    { title: actual ? '实际本金' : '应还本金', key: 'principal', width: 120, render: (_, record) => money(actual ? calculateManualRepayment(record, { actualAmount: amounts[record.id] }).actual.principal : calculateManualRepayment(record, {}).due.principal) },
    { title: actual ? '实际总息' : '应还总息', key: 'totalInterest', width: 120, render: (_, record) => money(actual ? calculateManualRepayment(record, { actualAmount: amounts[record.id] }).actual.totalInterest : calculateManualRepayment(record, {}).due.totalInterest) },
    { title: actual ? '实际利息' : '应收利息', key: 'interest', width: 115, render: (_, record) => money(actual ? calculateManualRepayment(record, { actualAmount: amounts[record.id] }).actual.interest : calculateManualRepayment(record, {}).due.interest) },
    { title: actual ? '实际罚息' : '应收罚息', key: 'penalty', width: 115, render: (_, record) => money(actual ? calculateManualRepayment(record, { actualAmount: amounts[record.id] }).actual.penalty : calculateManualRepayment(record, {}).due.penalty) },
    { title: actual ? '实际费用' : '应收费用', key: 'fee', width: 115, render: (_, record) => money(actual ? calculateManualRepayment(record, { actualAmount: amounts[record.id] }).actual.fee : calculateManualRepayment(record, {}).due.fee) },
    { title: actual ? '实际费用明细' : '应收费用明细', key: 'feeDetail', width: 150, render: (_, record) => (actual ? calculateManualRepayment(record, { actualAmount: amounts[record.id] }).actual.feeDetail : calculateManualRepayment(record, {}).due.feeDetail) },
    { title: '调整总息', key: 'adjustmentInterest', width: 110, render: (_, record) => money(calculateManualRepayment(record, actual ? { actualAmount: amounts[record.id] } : {}).due.adjustmentInterest) },
    { title: '还款顺序', key: 'repaymentOrder', width: 220, render: () => <Text type="secondary">{orderText}</Text> },
  ];
}

function SummaryTable({ records, actual, amounts, onAmountChange, overdue, expanded, onExpandedChange, allExpanded, onAllExpanded }: {
  records: ManualRepaymentRecord[]; actual: boolean; amounts: Record<number, number>; onAmountChange?: (id: number, value: number) => void; overdue?: (record: ManualRepaymentRecord) => boolean;
  expanded: Key[]; onExpandedChange: (keys: readonly Key[]) => void; allExpanded: boolean; onAllExpanded: () => void;
}) {
  const columns = summaryColumns(actual, amounts, onAmountChange);
  const totals = records.reduce((result, record) => {
    const calc = calculateManualRepayment(record, actual ? { actualAmount: amounts[record.id] } : {}).due;
    const actualCalc = actual ? calculateManualRepayment(record, { actualAmount: amounts[record.id] }).actual : calc;
    return { total: result.total + (actual ? amounts[record.id] : record.dueTotal), principal: result.principal + actualCalc.principal, interest: result.interest + actualCalc.interest, penalty: result.penalty + actualCalc.penalty, fee: result.fee + actualCalc.fee };
  }, { total: 0, principal: 0, interest: 0, penalty: 0, fee: 0 });
  return <>
    <div className="manual-summary-header"><Text strong>{actual ? '实还试算汇总' : '应还试算汇总'}</Text><Button type="link" size="small" onClick={onAllExpanded}>{allExpanded ? '全部收起' : '全部展开'}</Button></div>
    {records.length ? <Table className="manual-summary-table" bordered size="small" rowKey="id" columns={columns} dataSource={records} scroll={{ x: 1350 }} expandable={{ expandedRowKeys: expanded, onExpandedRowsChange: onExpandedChange, expandedRowRender: (record) => <PlanTable plans={record.plans} /> }} rowClassName={(record) => overdue?.(record) ? 'manual-overdue-row' : ''} summary={() => <Table.Summary.Row><Table.Summary.Cell index={0} colSpan={1}><b>合计</b></Table.Summary.Cell><Table.Summary.Cell index={1}><b>{money(totals.total)}</b></Table.Summary.Cell><Table.Summary.Cell index={2}><b>{money(totals.principal)}</b></Table.Summary.Cell><Table.Summary.Cell index={3}><b>{money(totals.interest + totals.penalty)}</b></Table.Summary.Cell><Table.Summary.Cell index={4}><b>{money(totals.interest)}</b></Table.Summary.Cell><Table.Summary.Cell index={5}><b>{money(totals.penalty)}</b></Table.Summary.Cell><Table.Summary.Cell index={6}><b>{money(totals.fee)}</b></Table.Summary.Cell></Table.Summary.Row>} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无试算结果" />}
  </>;
}

function BatchRepaymentDrawer({ records, mode, onClose, onSubmitted }: { records: ManualRepaymentRecord[]; mode: ManualRepaymentMode; onClose: () => void; onSubmitted: () => void }) {
  const [form] = Form.useForm<ManualRepaymentSettings>();
  const [amounts, setAmounts] = useState<Record<number, number>>(() => Object.fromEntries(records.map((record) => [record.id, moneyValue(record.dueTotal)])));
  const [expandedDue, setExpandedDue] = useState<Key[]>([]);
  const [expandedActual, setExpandedActual] = useState<Key[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const values = Form.useWatch([], form) as Partial<ManualRepaymentSettings> | undefined;
  const settings = { ...baseSettings(records[0]), ...(values ?? {}) };
  const hasActual = settings.repaymentType === '正常还款' || settings.repaymentType === '灵活还款';
  const overdueRecords = settings.repaymentType === '全部结清' || settings.repaymentType === '提前部分还款';
  const allExpandedDue = expandedDue.length === records.length && records.length > 0;
  const allExpandedActual = expandedActual.length === records.length && records.length > 0;
  useEffect(() => { form.setFieldsValue({ ...baseSettings(records[0]), repaymentType: '正常还款', actualAmount: undefined }); }, [form, records]);
  useEffect(() => { setAmounts(Object.fromEntries(records.map((record) => [record.id, moneyValue(record.dueTotal)]))); setExpandedDue([]); setExpandedActual([]); }, [records]);
  const handleAmountChange = (id: number, value: number) => setAmounts((current) => ({ ...current, [id]: moneyValue(value) }));
  const handleSubmit = async () => {
    try {
      await form.validateFields();
      if (overdueRecords && settings.exceedProductElement === '否' && allowOverdueEarlyRepayment === false && records.some((record) => record.loanStatus === '逾期')) { message.error('存在逾期借据，不允许提前还款'); return; }
      setSubmitting(true);
      const response = await submitManualRepayment(records.map((record) => record.id), settings);
      if (response.code !== 0) { message.error(response.message); return; }
      message.success(response.message); onSubmitted();
    } finally { setSubmitting(false); }
  };
  return <div className="manual-drawer-content"><div className="manual-drawer-scroll">
    <Card title="基础信息" size="small" className="manual-section-card"><BasicInfo record={records.length === 1 ? records[0] : { ...records[0], customerName: '批量客户', id: records.length } as ManualRepaymentRecord} batch /></Card>
    <Card title="批量还款设置" size="small" className="manual-section-card"><Form form={form} layout="vertical"><SettingsFields form={form} batch /></Form></Card>
    {settings.repaymentType && <Card className="manual-section-card"><SummaryTable records={records} actual={false} amounts={amounts} expanded={expandedDue} onExpandedChange={(keys) => setExpandedDue([...keys])} allExpanded={allExpandedDue} onAllExpanded={() => setExpandedDue(allExpandedDue ? [] : records.map((record) => record.id))} overdue={(record) => overdueRecords && settings.exceedProductElement === '否' && record.loanStatus === '逾期'} /></Card>}
    {hasActual && <Card className="manual-section-card"><SummaryTable records={records} actual amounts={amounts} onAmountChange={handleAmountChange} expanded={expandedActual} onExpandedChange={(keys) => setExpandedActual([...keys])} allExpanded={allExpandedActual} onAllExpanded={() => setExpandedActual(allExpandedActual ? [] : records.map((record) => record.id))} /></Card>}
    <Card title="附加信息" size="small" className="manual-section-card"><Form form={form}><Form.Item name="remark" noStyle><Input.TextArea rows={4} placeholder="请输入附加信息" /></Form.Item></Form></Card>
    <Card className="manual-drawer-actions"><Space><Button onClick={onClose}>取消</Button>{mode === 'request' && <Button type="primary" loading={submitting} onClick={() => void handleSubmit()}>确定</Button>}</Space></Card>
  </div></div>;
}

export default function ManualRepaymentPage() {
  const [data, setData] = useState<ManualRepaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState<Record<string, unknown>>({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [drawer, setDrawer] = useState<{ mode: ManualRepaymentMode; ids: number[] } | null>(null);
  const requestId = useRef(0);
  const loadData = useCallback(async (page: number, pageSize: number, nextQuery: Record<string, unknown>) => {
    const currentRequest = ++requestId.current; setLoading(true); setError('');
    try {
      const response = await getManualRepayments({ page, pageSize, ...nextQuery } as never);
      if (currentRequest !== requestId.current) return;
      setData(response.data.list); setPagination({ current: response.data.page, pageSize: response.data.pagesize, total: response.data.total });
    } catch { if (currentRequest === requestId.current) { setError('数据加载失败，请重试'); message.error('数据加载失败'); } } finally { if (currentRequest === requestId.current) setLoading(false); }
  }, []);
  useEffect(() => { void loadData(1, 10, {}); }, [loadData]);
  const handleSearch = (values: Record<string, FilterValue>) => { const normalized = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== '')); setQuery(normalized); setSelectedRowKeys([]); setPagination((current) => ({ ...current, current: 1 })); void loadData(1, pagination.pageSize, normalized); };
  const handlePageChange = (page: number, pageSize: number) => { setPagination((current) => ({ ...current, current: page, pageSize })); setSelectedRowKeys([]); void loadData(page, pageSize, query); };
  const selectedRecords = data.filter((record) => selectedRowKeys.includes(record.id));
  const openSingle = (mode: ManualRepaymentMode, record: ManualRepaymentRecord) => setDrawer({ mode, ids: [record.id] });
  const openBatch = (mode: ManualRepaymentMode) => { if (!selectedRecords.length) return; setDrawer({ mode, ids: selectedRecords.map((record) => record.id) }); };
  const drawerRecords = drawer ? drawer.ids.map((id) => data.find((record) => record.id === id)).filter((record): record is ManualRepaymentRecord => Boolean(record)) : [];
  const columns: TableColumnsType<ManualRepaymentRecord> = [
    { title: '机构名称', dataIndex: 'institutionName', width: 120 }, { title: '机构号', dataIndex: 'institutionCode', width: 90 }, { title: '客户名称', dataIndex: 'customerName', width: 100 }, { title: '客户号', dataIndex: 'customerNo', width: 105 }, { title: '产品名称', dataIndex: 'productName', width: 120 }, { title: '产品编号', dataIndex: 'productCode', width: 100 }, { title: '借款金额（元）', dataIndex: 'loanAmount', width: 125, render: money }, { title: '贷款余额（元）', dataIndex: 'loanBalance', width: 125, render: money }, { title: '起始日期', dataIndex: 'startDate', width: 110 }, { title: '到期日期', dataIndex: 'maturityDate', width: 110 }, { title: '下一还款日', dataIndex: 'nextRepaymentDate', width: 120 }, { title: '还款方式', dataIndex: 'repaymentMethod', width: 110 }, { title: '贷款期限', dataIndex: 'loanTerm', width: 90, render: (value: number) => `${value}期` }, { title: '借据状态', dataIndex: 'loanStatus', width: 90, render: statusTag }, { title: '账户状态', dataIndex: 'accountStatus', width: 90, render: (value: ManualRepaymentRecord['accountStatus']) => <Tag color={value === '正常' ? 'green' : 'red'}>{value}</Tag> }, { title: '操作员', dataIndex: 'operator', width: 100 }, { title: '操作', key: 'actions', fixed: 'right', width: 160, render: (_, record) => <OperationCell items={[{ key: 'calculate', label: '还款计算' }, { key: 'request', label: '手动还款' }]} onAction={(key) => openSingle(key as ManualRepaymentMode, record)} /> },
  ];
  return <div className="page-container manual-repayment-page">
    <Card className="filter-card manual-filter-card"><Filter configs={filterConfigs} onSearch={handleSearch} /></Card>
    {error && <div className="page-alert error-alert">{error}<Button size="small" onClick={() => void loadData(pagination.current, pagination.pageSize, query)}>重试</Button></div>}
    <Card className="table-card"><div className="manual-table-toolbar"><Button disabled={!selectedRecords.length} onClick={() => openBatch('calculate')}>批量还款计算</Button><Button type="primary" disabled={!selectedRecords.length} onClick={() => openBatch('request')}>批量手动还款</Button></div><DataTable columns={columns} dataSource={data} loading={loading} pagination={pagination} onPageChange={handlePageChange} rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }} /></Card>
    <Drawer title={drawer ? (drawer.mode === 'request' ? (drawer.ids.length > 1 ? '批量手动还款' : '手动还款') : (drawer.ids.length > 1 ? '批量还款计算' : '还款计算')) : ''} open={Boolean(drawer)} onClose={() => setDrawer(null)} destroyOnClose width="min(1200px, 100vw)" className="manual-repayment-drawer">
      {drawer && drawerRecords.length ? drawerRecords.length > 1 ? <BatchRepaymentDrawer records={drawerRecords} mode={drawer.mode} onClose={() => setDrawer(null)} onSubmitted={() => { setDrawer(null); setSelectedRowKeys([]); void loadData(pagination.current, pagination.pageSize, query); }} /> : <SingleRepaymentDrawer record={drawerRecords[0]} mode={drawer.mode} onClose={() => setDrawer(null)} onSubmitted={() => { setDrawer(null); setSelectedRowKeys([]); void loadData(pagination.current, pagination.pageSize, query); }} /> : null}
    </Drawer>
  </div>;
}
