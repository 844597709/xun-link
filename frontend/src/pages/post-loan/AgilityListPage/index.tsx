import { Button, Card, Descriptions, Drawer, Space, Tag, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import Filter, { type FilterConfig, type FilterValue } from '../../../components/Filter';
import DataTable from '../../../components/DataTable';
import OperationCell from '../../../components/OperationCell';
import AgilityAdjustment, { type AgilityAdjustmentMode } from '../AgilityAdjustment';
import {
  agilityGlobalStatuses, agilityInstitutions, agilityProducts, agilityStageStatuses,
  agilityTransactionStages, getAgilityApplications, revokeAgilityApplication, type AgilityListParams,
} from '../../../mock/agility';
import type { AgilityApplication } from '../../../types';

const globalStatusOptions = agilityGlobalStatuses.map((value) => ({ label: value, value }));
const stageOptions = agilityTransactionStages.map((value) => ({ label: value, value }));
const stageStatusOptions = agilityStageStatuses.map((value) => ({ label: value, value }));
const institutionOptions = agilityInstitutions.map((value) => ({ label: value, value }));
const productOptions = agilityProducts.map((value) => ({ label: value, value }));
const stageStatusOptionsByStage: Record<string, Array<{ label: string; value: string }>> = {
  初始化阶段: ['初始化成功', '初始化失败', '初始化中'].map((value) => ({ label: value, value })),
  贷中阶段: ['贷中通过', '贷中拒绝', '贷中处理中'].map((value) => ({ label: value, value })),
  审批阶段: ['审批通过', '审批拒绝', '待审批', '待发起审批'].map((value) => ({ label: value, value })),
  核心申请阶段: ['申请成功', '申请失败', '申请处理中'].map((value) => ({ label: value, value })),
  客户签约阶段: ['待签约', '已签约', '签约处理中', '已失效'].map((value) => ({ label: value, value })),
};
const linkedStageStatusOptions = (values: Record<string, FilterValue>) =>
  stageStatusOptionsByStage[String(values.transactionStage ?? '')] ?? stageStatusOptions;

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
  { key: 'globalStatus', label: '全局状态', type: 'select', options: globalStatusOptions },
  { key: 'transactionStage', label: '交易阶段', type: 'select', options: stageOptions },
  { key: 'stageStatus', label: '阶段状态', type: 'select', optionsResolver: linkedStageStatusOptions },
  { key: 'productName', label: '核心产品', type: 'select', options: productOptions, showSearch: true },
];

function statusTag(value: AgilityApplication['globalStatus']) {
  const color = value === '成功' ? 'green' : value === '失败' || value === '过期' ? 'red' : value === '撤销' ? 'default' : 'blue';
  return <Tag color={color}>{value}</Tag>;
}

function loanStatusTag(value: AgilityApplication['loanStatus']) {
  return <Tag color={value === '正常' ? 'green' : value === '逾期' ? 'orange' : 'red'}>{value}</Tag>;
}

function textColumn(title: string, dataIndex: keyof AgilityApplication, width = 130) {
  return { title, dataIndex, width, ellipsis: true };
}

function LoanDetailContent({ loan }: { loan: AgilityApplication }) {
  return <Descriptions column={{ xs: 1, sm: 2 }} size="small">
    <Descriptions.Item label="机构名称">{loan.institutionName}</Descriptions.Item>
    <Descriptions.Item label="机构号">{loan.institutionCode}</Descriptions.Item>
    <Descriptions.Item label="客户号">{loan.customerNo}</Descriptions.Item>
    <Descriptions.Item label="借据号">{loan.loanNo}</Descriptions.Item>
    <Descriptions.Item label="贷款账号">{loan.loanAccount}</Descriptions.Item>
    <Descriptions.Item label="贷款金额">{loan.loanAmount.toLocaleString('zh-CN')} 元</Descriptions.Item>
    <Descriptions.Item label="贷款余额">{loan.loanBalance.toLocaleString('zh-CN')} 元</Descriptions.Item>
    <Descriptions.Item label="币种">{loan.currency}</Descriptions.Item>
    <Descriptions.Item label="起始日期">{loan.startDate}</Descriptions.Item>
    <Descriptions.Item label="到期日期">{loan.maturityDate}</Descriptions.Item>
    <Descriptions.Item label="下一还款日">{loan.nextRepaymentDate}</Descriptions.Item>
    <Descriptions.Item label="还款方式">{loan.repaymentMethod}</Descriptions.Item>
    <Descriptions.Item label="账户状态">{loan.accountStatus}</Descriptions.Item>
    <Descriptions.Item label="借据状态">{loan.loanStatus}</Descriptions.Item>
  </Descriptions>;
}

type AuxAction = 'loan' | 'video' | 'attachment' | 'revoke';

type AuxDrawerState = { action: AuxAction; record: AgilityApplication };

function buildApplicationColumns(
  openDrawer: (mode: AgilityAdjustmentMode, loanId: number) => void,
  openAuxDrawer: (action: AuxAction, record: AgilityApplication) => void,
): TableColumnsType<AgilityApplication> {
  return [
    textColumn('机构名称', 'institutionName', 120),
    textColumn('机构号', 'institutionCode', 90),
    textColumn('客户号', 'customerNo', 100),
    textColumn('借据号', 'loanNo', 140),
    { title: '贷款金额', dataIndex: 'loanAmount', width: 125, render: (value: number) => `${value.toLocaleString('zh-CN')} 元` },
    { title: '贷款余额', dataIndex: 'loanBalance', width: 125, render: (value: number) => `${value.toLocaleString('zh-CN')} 元` },
    textColumn('币种', 'currency', 80),
    textColumn('起始日期', 'startDate', 110),
    textColumn('到期日期', 'maturityDate', 110),
    textColumn('下一还款日', 'nextRepaymentDate', 120),
    textColumn('还款方式', 'repaymentMethod', 170),
    { title: '贷款期数', dataIndex: 'loanTerm', width: 100, render: (value: number) => `${value}期` },
    { title: '账户状态', dataIndex: 'accountStatus', width: 100, render: () => <Tag color="green">正常</Tag> },
    { title: '借据状态', dataIndex: 'loanStatus', width: 100, render: (value: AgilityApplication['loanStatus']) => loanStatusTag(value) },
    {
      title: '操作', key: 'actions', fixed: 'right', width: 220,
      render: (_, record) => <OperationCell items={[{ key: 'loan', label: '贷款详情' }, { key: 'calculate', label: '贷款试算' }, { key: 'request', label: '调整申请' }]} onAction={(key) => key === 'loan' ? openAuxDrawer('loan', record) : openDrawer(key as AgilityAdjustmentMode, record.id)} />,
    },
  ];
}

function buildDetailColumns(openAuxDrawer: (action: AuxAction, record: AgilityApplication) => void): TableColumnsType<AgilityApplication> {
  return [
    textColumn('机构名称', 'institutionName', 120),
    textColumn('机构号', 'institutionCode', 90),
    textColumn('产品名称', 'productName', 130),
    textColumn('产品号', 'productCode', 100),
    textColumn('客户号', 'customerNo', 95),
    textColumn('借据号', 'loanNo', 125),
    textColumn('全局流水号', 'holoSerialNo', 125),
    { title: '全局状态', dataIndex: 'globalStatus', width: 100, render: (value: AgilityApplication['globalStatus']) => statusTag(value) },
    textColumn('交易阶段', 'transactionStage', 125),
    textColumn('阶段状态', 'stageStatus', 120),
    textColumn('申请日期', 'applyTime', 110),
    textColumn('原还款方式', 'originalRepaymentMethod', 150),
    textColumn('新还款方式', 'newRepaymentMethod', 180),
    { title: '原剩余期数（期）', dataIndex: 'originalRemainingTerm', width: 120 },
    { title: '新剩余期数（期）', dataIndex: 'newRemainingTerm', width: 120 },
    { title: '原总期数（期）', dataIndex: 'originalTotalTerm', width: 115 },
    { title: '新总期数（期）', dataIndex: 'newTotalTerm', width: 115 },
    { title: '原正常利率（%）', dataIndex: 'originalNormalRate', width: 120 },
    { title: '新正常利率（%）', dataIndex: 'newNormalRate', width: 120 },
    { title: '原罚息利率（%）', dataIndex: 'originalPenaltyRate', width: 120 },
    { title: '新罚息利率（%）', dataIndex: 'newPenaltyRate', width: 120 },
    { title: '原复息利率（%）', dataIndex: 'originalCompoundRate', width: 120 },
    { title: '新复息利率（%）', dataIndex: 'newCompoundRate', width: 120 },
    { title: '利息减免', dataIndex: 'interestRelief', width: 90 },
    { title: '首期延迟时间', dataIndex: 'firstPaymentDelayMonths', width: 105, render: (value: number) => `${value} 月` },
    { title: '组合还款方案', dataIndex: 'repaymentCombination', width: 220, render: (value: string) => <div className="combo-plan">{value}</div> },
    textColumn('新增支持的还款方式和期数', 'supportedRepayment', 220),
    textColumn('失效日期', 'expiryDate', 110),
    textColumn('签约时间', 'signingTime', 120),
    textColumn('撤销时间', 'revokeTime', 120),
    textColumn('申请原因', 'reason', 200),
    textColumn('状态备注', 'statusRemark', 160),
    textColumn('申请渠道', 'applicationChannel', 150),
    textColumn('申请人名称', 'applicantName', 110),
    textColumn('申请人ID', 'applicantId', 110),
    { title: '视频面签', key: 'video', fixed: 'right', width: 100, render: (_, record) => <OperationCell items={[{ key: 'video', label: '查看' }]} onAction={() => openAuxDrawer('video', record)} /> },
    { title: '附件材料', key: 'attachment', fixed: 'right', width: 110, render: (_, record) => record.attachmentName ? <OperationCell items={[{ key: 'attachment', label: '下载' }]} onAction={() => openAuxDrawer('attachment', record)} /> : '-' },
    {
      title: '操作', key: 'actions', fixed: 'right', width: 100,
      render: (_, record) => (record.globalStatus === '初始化' || record.globalStatus === '待处理')
        ? <OperationCell items={[{ key: 'revoke', label: '撤销', danger: true }]} onAction={() => openAuxDrawer('revoke', record)} />
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
  const [auxDrawer, setAuxDrawer] = useState<AuxDrawerState | null>(null);
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
  const openAuxDrawer = (action: AuxAction, record: AgilityApplication) => setAuxDrawer({ action, record });
  const closeAuxDrawer = () => setAuxDrawer(null);
  const handleRevoke = async () => {
    if (!auxDrawer || auxDrawer.action !== 'revoke') return;
    const response = await revokeAgilityApplication(auxDrawer.record.id);
    if (response.code !== 0) {
      message.error(response.message);
      return;
    }
    message.success(response.message);
    closeAuxDrawer();
    reload();
  };

  return (
    <div className="page-container">
      <Card className="filter-card"><Filter configs={isDetail ? detailFilters : applicationFilters} onSearch={handleSearch} /></Card>
      {error && <div className="page-alert error-alert">{error} <Button size="small" onClick={reload}>重试</Button></div>}
      <Card className="table-card">
        <DataTable columns={isDetail ? buildDetailColumns(openAuxDrawer) : buildApplicationColumns(openDrawer, openAuxDrawer)} dataSource={data} loading={loading} pagination={pagination} onPageChange={handlePageChange} />
      </Card>
      <Drawer
        title={drawer?.mode === 'request' ? '调整申请' : '贷款试算'}
        open={drawer !== null}
        onClose={closeDrawer}
        destroyOnClose
        width="min(1200px, 100vw)"
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
      <Drawer
        title={auxDrawer?.action === 'loan' ? '贷款详情' : auxDrawer?.action === 'video' ? '视频面签' : auxDrawer?.action === 'attachment' ? '附件材料' : '撤销调整申请'}
        open={auxDrawer !== null}
        onClose={closeAuxDrawer}
        destroyOnClose
        width="min(760px, 100vw)"
        className="agility-drawer"
        footer={auxDrawer?.action === 'revoke' ? <Space><Button onClick={closeAuxDrawer}>取消</Button><Button danger type="primary" onClick={() => void handleRevoke()}>确认撤销</Button></Space> : undefined}
      >
        {auxDrawer?.action === 'loan' && <LoanDetailContent loan={auxDrawer.record} />}
        {auxDrawer?.action === 'video' && <Descriptions column={1} size="small">
          <Descriptions.Item label="借据号">{auxDrawer.record.loanNo}</Descriptions.Item>
          <Descriptions.Item label="申请人">{auxDrawer.record.applicantName}（{auxDrawer.record.applicantId}）</Descriptions.Item>
          <Descriptions.Item label="面签状态"><Tag color="green">已完成</Tag></Descriptions.Item>
          <Descriptions.Item label="查看说明">原型展示：视频面签记录已归档，可由行方系统跳转查看。</Descriptions.Item>
        </Descriptions>}
        {auxDrawer?.action === 'attachment' && <Descriptions column={1} size="small">
          <Descriptions.Item label="借据号">{auxDrawer.record.loanNo}</Descriptions.Item>
          <Descriptions.Item label="附件名称">{auxDrawer.record.attachmentName}</Descriptions.Item>
          <Descriptions.Item label="操作说明"><Button type="link" size="small" onClick={() => message.success(`已准备下载 ${auxDrawer.record.attachmentName}`)}>下载附件</Button></Descriptions.Item>
        </Descriptions>}
        {auxDrawer?.action === 'revoke' && <Descriptions column={1} size="small">
          <Descriptions.Item label="借据号">{auxDrawer.record.loanNo}</Descriptions.Item>
          <Descriptions.Item label="当前状态">{statusTag(auxDrawer.record.globalStatus)}</Descriptions.Item>
          <Descriptions.Item label="确认信息">确定撤销该笔灵动重组调整申请吗？</Descriptions.Item>
        </Descriptions>}
      </Drawer>
    </div>
  );
}
