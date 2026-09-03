import { Button, Card, Descriptions, Drawer, Modal, Space, Tag, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import Filter, { type FilterConfig, type FilterValue } from '../../../components/Filter';
import DataTable from '../../../components/DataTable';
import AgilityAdjustment, { type AgilityAdjustmentMode } from '../AgilityAdjustment';
import { getAgilityApplications, revokeAgilityApplication, type AgilityListParams } from '../../../mock/agility';
import type { AgilityApplication } from '../../../types';

const globalStatusOptions = ['初始化', '待处理', '成功', '失败'].map((value) => ({ label: value, value }));
const stageOptions = ['初始化成功', '贷中拒绝', '审批通过', '核心申请阶段'].map((value) => ({ label: value, value }));
const stageStatusOptions = ['初始化失败', '贷中拒绝', '审批通过', '申请成功'].map((value) => ({ label: value, value }));
const institutionOptions = ['北京分行', '上海分行', '广州分行', '深圳分行'].map((value) => ({ label: value, value }));
const loanStatusOptions = ['正常', '逾期', '结清'].map((value) => ({ label: value, value }));
const accountStatusOptions = ['正常', '关注', '冻结'].map((value) => ({ label: value, value }));

const applicationFilters: FilterConfig[] = [
  { key: 'institutionName', label: '机构名称', type: 'select', options: institutionOptions },
  { key: 'institutionCode', label: '机构号', type: 'input' },
  { key: 'customerNo', label: '客户号', type: 'input' },
  { key: 'mobile', label: '手机号', type: 'input' },
  { key: 'idCardNo', label: '证件号码', type: 'input' },
  { key: 'loanNo', label: '借款编号', type: 'input' },
  { key: 'loanStatus', label: '借款状态', type: 'select', options: loanStatusOptions },
  { key: 'accountStatus', label: '账户状态', type: 'select', options: accountStatusOptions },
  { key: 'maturityDate', label: '到期日期范围', type: 'datePicker' },
];

const detailFilters: FilterConfig[] = [
  { key: 'institutionName', label: '机构名称', type: 'input' },
  { key: 'customerNo', label: '客户号', type: 'input' },
  { key: 'idCardNo', label: '证件号码', type: 'input' },
  { key: 'mobile', label: '手机号', type: 'input' },
  { key: 'loanNo', label: '借据号', type: 'input' },
  { key: 'applyTime', label: '申请日期', type: 'datePicker' },
  { key: 'globalStatus', label: '全局状态', type: 'select', options: globalStatusOptions },
  { key: 'transactionStage', label: '交易阶段', type: 'select', options: stageOptions },
  { key: 'stageStatus', label: '阶段状态', type: 'select', options: stageStatusOptions },
  { key: 'productName', label: '核心产品', type: 'input' },
];

function statusTag(value: AgilityApplication['globalStatus']) {
  const color = value === '成功' ? 'green' : value === '失败' ? 'red' : value === '待处理' ? 'blue' : 'default';
  return <Tag color={color}>{value}</Tag>;
}

function loanStatusTag(value: AgilityApplication['loanStatus']) {
  const color = value === '正常' ? 'green' : value === '逾期' ? 'red' : 'default';
  return <Tag color={color}>{value}</Tag>;
}

function accountStatusTag(value: AgilityApplication['accountStatus']) {
  const color = value === '正常' ? 'green' : value === '冻结' ? 'red' : 'orange';
  return <Tag color={color}>{value}</Tag>;
}

function textColumn(title: string, dataIndex: keyof AgilityApplication, width = 130) {
  return { title, dataIndex, width, ellipsis: true };
}

function showLoanDetail(loan: AgilityApplication) {
  Modal.info({
    title: `${loan.loanNo} 贷款详情`,
    width: 720,
    content: <Descriptions column={{ xs: 1, sm: 2 }} size="small">
      <Descriptions.Item label="机构名称">{loan.institutionName}</Descriptions.Item>
      <Descriptions.Item label="机构号">{loan.institutionCode}</Descriptions.Item>
      <Descriptions.Item label="客户名称">{loan.customerName}</Descriptions.Item>
      <Descriptions.Item label="客户号">{loan.customerNo}</Descriptions.Item>
      <Descriptions.Item label="手机号">{loan.mobile}</Descriptions.Item>
      <Descriptions.Item label="证件号码">{loan.idCardNo}</Descriptions.Item>
      <Descriptions.Item label="贷款金额">{loan.loanAmount.toLocaleString('zh-CN')} 元</Descriptions.Item>
      <Descriptions.Item label="贷款余额">{loan.loanBalance.toLocaleString('zh-CN')} 元</Descriptions.Item>
      <Descriptions.Item label="到期日期">{loan.maturityDate}</Descriptions.Item>
      <Descriptions.Item label="下次还款日">{loan.nextRepaymentDate}</Descriptions.Item>
      <Descriptions.Item label="还款方式">{loan.repaymentMethod}</Descriptions.Item>
      <Descriptions.Item label="贷款期数">{loan.loanTerm}期</Descriptions.Item>
      <Descriptions.Item label="借款状态">{loan.loanStatus}</Descriptions.Item>
      <Descriptions.Item label="账户状态">{loan.accountStatus}</Descriptions.Item>
    </Descriptions>,
  });
}

function buildApplicationColumns(
  openDrawer: (mode: AgilityAdjustmentMode, loanId: number) => void,
): TableColumnsType<AgilityApplication> {
  return [
    textColumn('机构名称', 'institutionName', 120),
    textColumn('机构号', 'institutionCode', 90),
    textColumn('客户名称', 'customerName', 100),
    textColumn('客户号', 'customerNo', 95),
    textColumn('手机号', 'mobile', 125),
    textColumn('证件号码', 'idCardNo', 180),
    textColumn('借款编号', 'loanNo', 135),
    { title: '贷款金额', dataIndex: 'loanAmount', width: 125, render: (value: number) => `${value.toLocaleString('zh-CN')} 元` },
    { title: '贷款余额', dataIndex: 'loanBalance', width: 125, render: (value: number) => `${value.toLocaleString('zh-CN')} 元` },
    textColumn('到期日期', 'maturityDate', 110),
    textColumn('下次还款日', 'nextRepaymentDate', 120),
    textColumn('还款方式', 'repaymentMethod', 150),
    { title: '贷款期数', dataIndex: 'loanTerm', width: 95, render: (value: number) => `${value}期` },
    { title: '借款状态', dataIndex: 'loanStatus', width: 100, render: (value: AgilityApplication['loanStatus']) => loanStatusTag(value) },
    { title: '账户状态', dataIndex: 'accountStatus', width: 100, render: (value: AgilityApplication['accountStatus']) => accountStatusTag(value) },
    {
      title: '操作', key: 'actions', fixed: 'right', width: 250,
      render: (_, record) => <Space size="small" wrap>
        <Button type="link" size="small" onClick={() => showLoanDetail(record)}>贷款详情</Button>
        <Button type="link" size="small" onClick={() => openDrawer('calculate', record.id)}>贷款试算</Button>
        <Button type="link" size="small" onClick={() => openDrawer('request', record.id)}>调整申请</Button>
      </Space>,
    },
  ];
}

function buildDetailColumns(reload: () => void): TableColumnsType<AgilityApplication> {
  return [
    textColumn('机构名称', 'institutionName', 120),
    textColumn('机构号', 'institutionCode', 90),
    textColumn('产品名称', 'productName', 130),
    textColumn('产品号', 'productCode', 100),
    textColumn('客户名称', 'customerName', 100),
    textColumn('客户号', 'customerNo', 95),
    textColumn('借据号', 'loanNo', 125),
    { title: '全息状态', dataIndex: 'globalStatus', width: 100, render: (value: AgilityApplication['globalStatus']) => statusTag(value) },
    textColumn('全息流水号', 'holoSerialNo', 125),
    textColumn('申请时间', 'applyTime', 110),
    textColumn('交易阶段', 'transactionStage', 125),
    textColumn('阶段状态', 'stageStatus', 110),
    textColumn('原还款方式', 'originalRepaymentMethod', 150),
    textColumn('新还款方式', 'newRepaymentMethod', 170),
    { title: '原总期数（期）', dataIndex: 'originalTotalTerm', width: 115 },
    { title: '新总期数（期）', dataIndex: 'newTotalTerm', width: 115 },
    { title: '原剩余期数（期）', dataIndex: 'originalRemainingTerm', width: 120 },
    { title: '新剩余期数（期）', dataIndex: 'newRemainingTerm', width: 120 },
    { title: '原正常利率（%）', dataIndex: 'originalNormalRate', width: 120 },
    { title: '新正常利率（%）', dataIndex: 'newNormalRate', width: 120 },
    { title: '原罚息利率（%）', dataIndex: 'originalPenaltyRate', width: 120 },
    { title: '新罚息利率（%）', dataIndex: 'newPenaltyRate', width: 120 },
    { title: '原复息利率（%）', dataIndex: 'originalCompoundRate', width: 120 },
    { title: '新复息利率（%）', dataIndex: 'newCompoundRate', width: 120 },
    { title: '利息减免', dataIndex: 'interestRelief', width: 90 },
    { title: '首期延迟时间', dataIndex: 'firstPaymentDelayMonths', width: 105, render: (value: number) => `${value} 月` },
    { title: '组合还款方案', dataIndex: 'repaymentCombination', width: 220, render: (value: string) => <div className="combo-plan">{value}</div> },
    textColumn('新借据支持的还款方式和期数', 'supportedRepayment', 220),
    textColumn('失效日期', 'expiryDate', 110),
    textColumn('签约', 'signing', 90),
    { title: '视频面签', key: 'video', fixed: 'right', width: 100, render: (_, record) => <Button type="link" size="small" onClick={() => message.info(`查看 ${record.loanNo} 视频面签记录`)}>查看</Button> },
    { title: '附件材料', key: 'attachment', fixed: 'right', width: 110, render: (_, record) => record.attachmentName ? <Button type="link" size="small" onClick={() => message.success(`已准备下载 ${record.attachmentName}`)}>下载</Button> : '-' },
    {
      title: '操作', key: 'actions', fixed: 'right', width: 120,
      render: (_, record) => (record.globalStatus === '初始化' || record.globalStatus === '待处理')
        ? <Button type="link" danger size="small" onClick={() => Modal.confirm({
          title: '确认撤销',
          content: `确定撤销借据 ${record.loanNo} 的调整申请吗？`,
          onOk: async () => { const response = await revokeAgilityApplication(record.id); message.success(response.message); reload(); },
        })}>撤销</Button>
        : null,
    },
  ];
}

export default function AgilityListPage({ isDetail = false }: { isDetail?: boolean }) {
  const [data, setData] = useState<AgilityApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState<Record<string, unknown>>({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [drawer, setDrawer] = useState<{ mode: AgilityAdjustmentMode; loanId: number } | null>(null);
  const requestId = useRef(0);

  const loadData = useCallback(async (page: number, pageSize: number, nextQuery: Record<string, unknown>) => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const response = await getAgilityApplications({ page, pageSize, ...nextQuery } as AgilityListParams);
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
  }, []);

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
  const openDrawer = (mode: AgilityAdjustmentMode, loanId: number) => setDrawer({ mode, loanId });
  const closeDrawer = () => setDrawer(null);

  return (
    <div className="page-container">
      <div className="page-heading">
        <div>
          <TypographyTitle>{isDetail ? '调整明细' : '调整申请'}</TypographyTitle>
          <p className="page-description">{isDetail ? '查询和跟踪已提交的灵动重组调整申请' : '查看可发起灵动重组调整申请的贷款记录'}</p>
        </div>
      </div>
      <Card className="filter-card"><Filter configs={isDetail ? detailFilters : applicationFilters} onSearch={handleSearch} /></Card>
      {error && <div className="page-alert error-alert">{error} <Button size="small" onClick={reload}>重试</Button></div>}
      <Card className="table-card">
        <DataTable columns={isDetail ? buildDetailColumns(reload) : buildApplicationColumns(openDrawer)} dataSource={data} loading={loading} pagination={pagination} onPageChange={handlePageChange} />
      </Card>
      <Drawer
        title={drawer?.mode === 'request' ? '调整申请' : '贷款试算'}
        open={drawer !== null}
        onClose={closeDrawer}
        destroyOnClose
        width="min(760px, 100vw)"
        className="agility-drawer"
      >
        {drawer && <AgilityAdjustment
          mode={drawer.mode}
          loanId={drawer.loanId}
          embedded
          onClose={closeDrawer}
          onSubmitted={() => { closeDrawer(); reload(); }}
        />}
      </Drawer>
    </div>
  );
}

function TypographyTitle({ children }: { children: string }) {
  return <h3 className="page-title">{children}</h3>;
}
