import { Button, Card, Modal, Pagination, Space, Table, Tabs, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Filter, { type FilterConfig, type FilterValue } from '../../../components/Filter';
import { getLoanSubsidy } from '../../../mock';
import type { LoanSubsidy } from '../../../types';
import { DetailSection, DetailShell, objectItems, statusTag } from '../SubsidyCommon';

type Row = Record<string, string | number>;
type FilterValues = Record<string, FilterValue>;

const money = (value: number | string | undefined) => typeof value === 'number' ? `¥${value.toFixed(2)}` : value === undefined || value === '' ? '-' : String(value);
const cell = (value: unknown) => value === undefined || value === null || value === '' ? '-' : String(value);

const tabTableWidths: Record<string, number> = {
  '关联消费明细': 1700,
  '历史期供贴息明细': 1450,
  '还款流水明细': 1750,
};
const adaptiveTabTitles = new Set(['未还期供贴息计划', '贴息流水明细']);
const pageSize = 5;
const tabColumns: Record<string, TableColumnsType<Row>> = {
  '关联消费明细': [
    { title: 'CROS消费流水号', dataIndex: 'crosConsumptionNo', width: 150 }, { title: '银行消费流水号', dataIndex: 'bankConsumptionNo', render: cell, width: 150 }, { title: '发票编号', dataIndex: 'invoiceNo', render: cell, width: 130 }, { title: '消费日期', dataIndex: 'consumptionDate', width: 110 }, { title: '消费金额', dataIndex: 'consumptionAmount', render: money, width: 100 }, { title: '申请贴息消费金额', dataIndex: 'appliedAmount', render: money, width: 120 }, { title: '消费用途', dataIndex: 'purpose', width: 100 }, { title: '商户名称', dataIndex: 'merchantName', width: 110 }, { title: '核定日期', dataIndex: 'approvedAt', width: 110 }, { title: '核定金额', dataIndex: 'approvedAmount', render: money, width: 100 }, { title: '预计贴息金额', dataIndex: 'expectedSubsidyAmount', render: money, width: 110 }, { title: '已贴息金额', dataIndex: 'actualSubsidyAmount', render: money, width: 100 }, { title: '应收回贴息金额', dataIndex: 'dueRecoveryAmount', render: money, width: 120 }, { title: '消费状态', dataIndex: 'status', render: statusTag, width: 90 },
  ],
  '历史期供贴息明细': [
    { title: '期数', dataIndex: 'period', width: 70 }, { title: '开始日期', dataIndex: 'startDate', width: 110 }, { title: '到期日期', dataIndex: 'dueDate', width: 110 }, { title: '还款日期', dataIndex: 'repaidAt', width: 110 }, { title: '还款总额', dataIndex: 'totalAmount', render: money, width: 100 }, { title: '还款本金', dataIndex: 'principal', render: money, width: 100 }, { title: '还款总利息', dataIndex: 'interest', render: money, width: 100 }, { title: '客户实还利息', dataIndex: 'customerInterest', render: money, width: 110 }, { title: '应贴息金额', dataIndex: 'dueSubsidyAmount', render: money, width: 110 }, { title: '实贴息金额', dataIndex: 'actualSubsidyAmount', render: money, width: 100 }, { title: '期供状态', dataIndex: 'status', render: statusTag, width: 90 }, { title: '操作', key: 'actions', fixed: 'right', width: 160, render: (_, row) => <Space><Button type="link" size="small" onClick={() => window.dispatchEvent(new CustomEvent('loan-repayment-detail', { detail: row }))}>还款流水</Button><Button type="link" size="small" onClick={() => window.dispatchEvent(new CustomEvent('loan-flow-detail', { detail: row }))}>贴息流水</Button></Space> },
  ],
  '未还期供贴息计划': [
    { title: '期数', dataIndex: 'period', width: 70 }, { title: '开始日期', dataIndex: 'startDate', width: 110 }, { title: '到期日期', dataIndex: 'dueDate', width: 110 }, { title: '应还总额', dataIndex: 'dueTotal', render: money, width: 100 }, { title: '应还本金', dataIndex: 'duePrincipal', render: money, width: 100 }, { title: '应还总利息', dataIndex: 'dueInterest', render: money, width: 110 }, { title: '优惠金额', dataIndex: 'discountAmount', render: money, width: 100 }, { title: '预计贴息金额', dataIndex: 'expectedSubsidyAmount', render: money, width: 110 }, { title: '期供状态', dataIndex: 'status', render: statusTag, width: 90 },
  ],
  '贴息流水明细': [
    { title: 'CROS交易流水号', dataIndex: 'crosTransactionNo', width: 155 }, { title: '贴息类型', dataIndex: 'type', width: 90, render: statusTag }, { title: '贴息金额', dataIndex: 'expectedSubsidyAmount', render: money, width: 110 }, { title: '补贴息客户卡号', dataIndex: 'subsidyCardNo', render: cell, width: 150 }, { title: '收回贴息金额', dataIndex: 'expectedRecoveryAmount', render: money, width: 120 }, { title: '收回贴息客户卡号', dataIndex: 'recoveryCardNo', render: cell, width: 150 }, { title: '贴息时间', dataIndex: 'subsidyAt', width: 155 }, { title: '贴息状态', dataIndex: 'status', render: statusTag, width: 90 },
  ],
  '还款流水明细': [
    { title: 'CROS还款流水号', dataIndex: 'crosRepaymentNo', width: 150 }, { title: '还款日期', dataIndex: 'repaymentDate', width: 110 }, { title: '还款时间', dataIndex: 'repaymentTime', width: 100 }, { title: '还款类型', dataIndex: 'repaymentType', width: 110 }, { title: '还款来源', dataIndex: 'source', width: 110 }, { title: '还款时借据状态', dataIndex: 'loanStatus', render: statusTag, width: 120 }, { title: '还款总额', dataIndex: 'totalAmount', render: money, width: 100 }, { title: '还款本金', dataIndex: 'principal', render: money, width: 100 }, { title: '还款总利息', dataIndex: 'interest', render: money, width: 110 }, { title: '还款账号', dataIndex: 'account', width: 140 }, { title: '贴息金额', dataIndex: 'dueSubsidyAmount', render: money, width: 110 }, { title: '还款状态', dataIndex: 'status', render: statusTag, width: 90 }, { title: '还款备注', dataIndex: 'remark', render: cell, width: 140 },
  ],
};

const filterOptions = (values: string[]) => values.map((value) => ({ label: value, value }));
const tabFilters: Record<string, FilterConfig[]> = {
  '关联消费明细': [
    { key: 'bankConsumptionNo', label: '银行消费流水号', type: 'input' },
    { key: 'invoiceNo', label: '发票编号', type: 'input' },
    { key: 'consumptionDate', label: '消费日期', type: 'datePicker' },
    { key: 'status', label: '消费状态', type: 'select', options: filterOptions(['正常', '异常', '已核定']) },
  ],
  '历史期供贴息明细': [],
  '未还期供贴息计划': [],
  '贴息流水明细': [
    { key: 'type', label: '贴息类型', type: 'select', options: filterOptions(['实时贴息', '补贴息', '收回贴息']) },
    { key: 'status', label: '贴息状态', type: 'select', options: filterOptions(['成功', '失败', '处理中']) },
  ],
  '还款流水明细': [
    { key: 'repaymentType', label: '还款类型', type: 'select', options: filterOptions(['正常还款', '提前还款', '逾期还款']) },
    { key: 'source', label: '还款来源', type: 'select', options: filterOptions(['批扣还款', '柜面还款', '自主还款']) },
    { key: 'status', label: '还款状态', type: 'select', options: filterOptions(['成功', '失败', '处理中']) },
  ],
};

function sum(rows: Row[], key: string) {
  return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
}

function dateValue(value: unknown): string {
  return value && typeof value === 'object' && 'format' in value ? String((value as { format: (format: string) => string }).format('YYYY-MM-DD')) : '';
}

function matchesFilter(row: Row, values: FilterValues) {
  return Object.entries(values).every(([key, value]) => {
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return true;
    if (Array.isArray(value)) {
      const date = String(row[key] ?? '');
      return (!value[0] || date >= dateValue(value[0])) && (!value[1] || date <= dateValue(value[1]));
    }
    return String(row[key] ?? '').toLowerCase().includes(String(value).toLowerCase());
  });
}

function SummaryCards({ title, rows }: { title: string; rows: Row[] }) {
  const cards = title === '关联消费明细'
    ? [
      ['关联消费总笔数', String(rows.length)],
      ['消费总金额', money(sum(rows, 'consumptionAmount'))],
      ['核定总金额', money(sum(rows, 'approvedAmount'))],
      ['预计贴息总金额', money(sum(rows, 'expectedSubsidyAmount'))],
      ['已贴息总金额', money(sum(rows, 'actualSubsidyAmount'))],
    ]
    : title === '历史期供贴息明细'
      ? [
        ['已还期数', String(rows.length)],
        ['累计已还总本金', money(sum(rows, 'principal'))],
        ['累计应贴息总金额', money(sum(rows, 'dueSubsidyAmount'))],
        ['累计实贴息总金额', money(sum(rows, 'actualSubsidyAmount'))],
      ]
      : [
        ['未还期数', String(rows.length)],
        ['剩余未还总本金', money(sum(rows, 'duePrincipal'))],
        ['预计剩余利息总金额', money(sum(rows, 'dueInterest'))],
        ['预计贴息总金额', money(sum(rows, 'expectedSubsidyAmount'))],
      ];

  return <div className="loan-interest-summary-cards">{cards.map(([label, value], index) => <div className={`loan-interest-summary-card loan-interest-summary-card-${index % 4}`} key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>;
}

function InterestFlowSummary({ rows }: { rows: Row[] }) {
  const flowKinds = [
    { key: '实时贴息', tone: 'primary' },
    { key: '补贴息', tone: 'success' },
    { key: '收回贴息', tone: 'warning' },
  ];
  return <div className="loan-interest-flow-summary"><div className="loan-interest-flow-summary-cards">{flowKinds.map(({ key, tone }) => {
    const kindRows = rows.filter((row) => row.type === key);
    const successCount = kindRows.filter((row) => row.status === '成功').length;
    return <div className={`loan-interest-flow-summary-item loan-interest-summary-card-${tone}`} key={key}><span>{key}总笔数/成功笔数</span><strong>{kindRows.length}/{successCount}笔</strong></div>;
  })}</div></div>;
}

function RepaymentSummary({ rows }: { rows: Row[] }) {
  const normalRows = rows.filter((row) => row.repaymentType === '正常还款');
  const earlyRows = rows.filter((row) => row.repaymentType === '提前还款');
  const cards = [
    ['累计还款成功次数', normalRows.filter((row) => row.status === '成功').length.toString()],
    ['累计还款本金', money(sum(normalRows, 'principal'))],
    ['累计提前还款成功次数', earlyRows.filter((row) => row.status === '成功').length.toString()],
    ['累计提前还款本金', money(sum(earlyRows, 'principal'))],
  ];
  return <div className="loan-interest-summary-cards">{cards.map(([label, value], index) => <div className={`loan-interest-summary-card loan-interest-summary-card-${index}`} key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>;
}

function baseInfoItems(baseInfo: LoanSubsidy['baseInfo']) {
  return objectItems(baseInfo).map((item) => {
    if (item.label === '应贴息总额') {
      return {
        label: <span className="subsidy-detail-label-with-help">预计贴息总额<Tooltip title="为贷款扣减收回贴息总额后的预估贴息总额"><span role="img" aria-label="预计贴息总额说明" className="subsidy-detail-help-icon"><InfoCircleOutlined /></span></Tooltip></span>,
        value: item.value,
      };
    }
    return item.label === '贷款状态' ? { ...item, value: statusTag(String(item.value)) } : item;
  });
}

interface LoanInterestDetailProps {
  recordId?: number;
  embedded?: boolean;
}

export default function LoanInterestDetail({ recordId, embedded = false }: LoanInterestDetailProps) {
  const params = useParams();
  const id = recordId ?? Number(params.id);
  const [record, setRecord] = useState<LoanSubsidy>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<{ title: string; row: Row }>();
  const [activeTab, setActiveTab] = useState('关联消费明细');
  const [filterValues, setFilterValues] = useState<Record<string, FilterValues>>({});
  const [pageState, setPageState] = useState<Record<string, number>>({});

  useEffect(() => {
    setRecord(undefined);
    setLoading(true);
    setError('');
    void getLoanSubsidy(id).then((response) => setRecord(response.data)).catch(() => setError('贷款贴息详情加载失败')).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const onRepayment = (event: Event) => setModal({ title: '还款流水', row: (event as CustomEvent<Row>).detail });
    const onFlow = (event: Event) => setModal({ title: '贴息流水', row: (event as CustomEvent<Row>).detail });
    window.addEventListener('loan-repayment-detail', onRepayment); window.addEventListener('loan-flow-detail', onFlow);
    return () => { window.removeEventListener('loan-repayment-detail', onRepayment); window.removeEventListener('loan-flow-detail', onFlow); };
  }, []);

  const tabs = useMemo(() => record ? Object.entries(record.tabs).map(([title, rows]) => {
    const filteredRows = rows.filter((row) => matchesFilter(row, filterValues[title] ?? {}));
    const currentPage = Math.min(pageState[title] ?? 1, Math.max(1, Math.ceil(filteredRows.length / pageSize)));
    const pageRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const flowTab = title === '贴息流水明细';
    const adaptiveTable = adaptiveTabTitles.has(title);
    const configs = tabFilters[title] ?? [];
    return {
      key: title,
      label: title,
      children: <div className={`loan-interest-tab-content${flowTab ? ' loan-interest-flow-tab' : ''}`}>
        {flowTab ? <InterestFlowSummary rows={filteredRows} /> : title === '还款流水明细' ? <RepaymentSummary rows={filteredRows} /> : <SummaryCards title={title} rows={filteredRows} />}
        {configs.length > 0 && <div className="loan-interest-filter"><Filter configs={configs} onSearch={(values) => {
          setFilterValues((current) => ({ ...current, [title]: values }));
          setPageState((current) => ({ ...current, [title]: 1 }));
        }} /></div>}
        <div className={`loan-interest-table-scroll${adaptiveTable ? ' loan-interest-table-scroll-adaptive' : ''}`}>
          <div className={`loan-interest-table-scroll-inner${adaptiveTable ? ' loan-interest-table-scroll-inner-adaptive' : ''}`} style={adaptiveTable ? undefined : { minWidth: tabTableWidths[title] ?? 1200 }}>
            <Table rowKey={(_, index) => `${title}-${currentPage}-${index}`} columns={tabColumns[title] ?? []} dataSource={pageRows} pagination={false} scroll={adaptiveTable ? undefined : { x: 'max-content' }} />
          </div>
        </div>
        <div className="loan-interest-pagination"><Pagination current={currentPage} pageSize={pageSize} total={filteredRows.length} showSizeChanger={false} onChange={(page) => setPageState((current) => ({ ...current, [title]: page }))} /></div>
      </div>,
    };
  }) : [], [filterValues, pageState, record]);

  if (!record) return <DetailShell title="贷款贴息详情" loading={loading} error={error} embedded={embedded}>{null}</DetailShell>;
  return <DetailShell title="贷款贴息详情" loading={loading} error={error} embedded={embedded}>
    <DetailSection title="贷款基础信息" items={baseInfoItems(record.baseInfo)} layout="plain-two-column" />
    <Card className="subsidy-detail-card loan-interest-detail-card"><Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} /></Card>
    <Modal title={`${modal?.title ?? ''}详情`} open={Boolean(modal)} onCancel={() => setModal(undefined)} footer={null} width={900}>{modal && <div className="loan-interest-table-scroll"><Table rowKey="id" columns={modal.title === '还款流水' ? tabColumns['还款流水明细'] : tabColumns['贴息流水明细']} dataSource={[modal.row]} pagination={false} scroll={{ x: 'max-content' }} /></div>}</Modal>
  </DetailShell>;
}
