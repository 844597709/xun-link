import { Button, Card, Input, Modal, Space, Table, Tabs } from 'antd';
import type { TableColumnsType } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getLoanSubsidy } from '../../../mock';
import type { LoanSubsidy } from '../../../types';
import { DetailSection, DetailShell, objectItems, statusTag } from '../SubsidyCommon';

type Row = Record<string, string | number>;
const money = (value: number | string | undefined) => typeof value === 'number' ? `¥${value.toFixed(2)}` : value === undefined || value === '' ? '-' : String(value);
const cell = (value: unknown) => value === undefined || value === null || value === '' ? '-' : String(value);

const flowAmountColumn = (title: string, dataIndex: string, width: number): TableColumnsType<Row>[number] => ({ title, dataIndex, render: money, width });
const tabColumns: Record<string, TableColumnsType<Row>> = {
  '关联消费明细': [
    { title: 'CROS消费流水号', dataIndex: 'crosConsumptionNo', width: 150 }, { title: '银行消费流水号', dataIndex: 'bankConsumptionNo', render: cell, width: 150 }, { title: '发票编号', dataIndex: 'invoiceNo', render: cell, width: 130 }, { title: '消费日期', dataIndex: 'consumptionDate', width: 110 }, { title: '消费金额', dataIndex: 'consumptionAmount', render: money, width: 100 }, { title: '申请贴息消费金额', dataIndex: 'appliedAmount', render: money, width: 120 }, { title: '消费用途', dataIndex: 'purpose', width: 100 }, { title: '商户名称', dataIndex: 'merchantName', width: 110 }, { title: '核定日期', dataIndex: 'approvedAt', width: 110 }, { title: '核定金额', dataIndex: 'approvedAmount', render: money, width: 100 }, { title: '预计贴息金额', dataIndex: 'expectedSubsidyAmount', render: money, width: 110 }, { title: '已贴息金额', dataIndex: 'actualSubsidyAmount', render: money, width: 100 }, { title: '消费状态', dataIndex: 'status', render: statusTag, width: 90 },
  ],
  '历史期供贴息明细': [
    { title: '期数', dataIndex: 'period', width: 70 }, { title: '开始日期', dataIndex: 'startDate', width: 110 }, { title: '到期日期', dataIndex: 'dueDate', width: 110 }, { title: '还款日期', dataIndex: 'repaidAt', width: 110 }, { title: '还款总额', dataIndex: 'totalAmount', render: money, width: 100 }, { title: '还款本金', dataIndex: 'principal', render: money, width: 100 }, { title: '还款总利息', dataIndex: 'interest', render: money, width: 100 }, { title: '客户实还利息', dataIndex: 'customerInterest', render: money, width: 110 }, { title: '应贴息金额', dataIndex: 'dueSubsidyAmount', render: money, width: 110 }, { title: '实贴息金额', dataIndex: 'actualSubsidyAmount', render: money, width: 100 }, { title: '期供状态', dataIndex: 'status', render: statusTag, width: 90 }, { title: '操作', key: 'actions', fixed: 'right', width: 160, render: (_, row) => <Space><Button type="link" size="small" onClick={() => window.dispatchEvent(new CustomEvent('loan-repayment-detail', { detail: row }))}>还款流水</Button><Button type="link" size="small" onClick={() => window.dispatchEvent(new CustomEvent('loan-flow-detail', { detail: row }))}>贴息流水</Button></Space> },
  ],
  '未来期供贴息计划': [
    { title: '期数', dataIndex: 'period', width: 70 }, { title: '开始日期', dataIndex: 'startDate', width: 110 }, { title: '到期日期', dataIndex: 'dueDate', width: 110 }, { title: '应还总额', dataIndex: 'dueTotal', render: money, width: 100 }, { title: '应还本金', dataIndex: 'duePrincipal', render: money, width: 100 }, { title: '应还总利息', dataIndex: 'dueInterest', render: money, width: 110 }, { title: '优惠金额', dataIndex: 'discountAmount', render: money, width: 100 }, { title: '预计贴息金额', dataIndex: 'expectedSubsidyAmount', render: money, width: 110 }, { title: '期供状态', dataIndex: 'status', render: statusTag, width: 90 },
  ],
  '贴息流水明细': [
    { title: '流水信息', children: [{ title: 'CROS交易流水号', dataIndex: 'crosTransactionNo', width: 155 }, { title: '贴息类型', dataIndex: 'type', width: 90, render: statusTag }, { title: '贴息时间', dataIndex: 'subsidyAt', width: 155 }] },
    { title: '贴息金额', children: [flowAmountColumn('预计贴息', 'expectedSubsidyAmount', 110), flowAmountColumn('实贴息', 'actualSubsidyAmount', 100)] },
    { title: '补贴息信息', children: [{ title: '客户卡号', dataIndex: 'subsidyCardNo', render: cell, width: 150 }] },
    { title: '收回贴息金额', children: [flowAmountColumn('预计收回', 'expectedRecoveryAmount', 120), flowAmountColumn('实收回', 'actualRecoveryAmount', 110)] },
    { title: '收回贴息信息', children: [{ title: '客户卡号', dataIndex: 'recoveryCardNo', render: cell, width: 150 }] },
    { title: '处理状态', dataIndex: 'status', render: statusTag, width: 90 },
  ],
  '还款流水明细': [
    { title: 'CROS还款流水号', dataIndex: 'crosRepaymentNo', width: 150 }, { title: '还款日期', dataIndex: 'repaymentDate', width: 110 }, { title: '还款时间', dataIndex: 'repaymentTime', width: 100 }, { title: '还款类型', dataIndex: 'repaymentType', width: 110 }, { title: '还款来源', dataIndex: 'source', width: 110 }, { title: '还款时借据状态', dataIndex: 'loanStatus', render: statusTag, width: 120 }, { title: '还款总额', dataIndex: 'totalAmount', render: money, width: 100 }, { title: '还款本金', dataIndex: 'principal', render: money, width: 100 }, { title: '还款总利息', dataIndex: 'interest', render: money, width: 110 }, { title: '还款账号', dataIndex: 'account', width: 140 }, { title: '应贴息金额', dataIndex: 'dueSubsidyAmount', render: money, width: 110 }, { title: '实贴息金额', dataIndex: 'actualSubsidyAmount', render: money, width: 100 }, { title: '还款状态', dataIndex: 'status', render: statusTag, width: 90 }, { title: '还款备注', dataIndex: 'remark', render: cell, width: 140 },
  ],
};

function sum(rows: Row[], key: string) {
  return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
}

function summaryFor(title: string, rows: Row[]) {
  if (title === '关联消费明细') return `关联消费笔数：${rows.length}　消费总金额：${money(sum(rows, 'consumptionAmount'))}　核定总金额：${money(sum(rows, 'approvedAmount'))}　预计贴息总金额：${money(sum(rows, 'expectedSubsidyAmount'))}　已贴总金额：${money(sum(rows, 'actualSubsidyAmount'))}`;
  if (title === '历史期供贴息明细') return `已还期数：${rows.length}　累计已还总本金：${money(sum(rows, 'principal'))}　累计应贴息总金额：${money(sum(rows, 'dueSubsidyAmount'))}　累计实贴息总金额：${money(sum(rows, 'actualSubsidyAmount'))}`;
  if (title === '未来期供贴息计划') return `未还期数：${rows.length}　剩余未还总本金：${money(sum(rows, 'duePrincipal'))}　预计贴息总金额：${money(sum(rows, 'expectedSubsidyAmount'))}`;
  return '';
}

function InterestFlowSummary({ rows }: { rows: Row[] }) {
  const cards = [
    { label: '预计贴息金额', value: money(sum(rows, 'expectedSubsidyAmount')), tone: 'primary' },
    { label: '实贴息金额', value: money(sum(rows, 'actualSubsidyAmount')), tone: 'success' },
    { label: '预计收回贴息金额', value: money(sum(rows, 'expectedRecoveryAmount')), tone: 'warning' },
    { label: '实收回贴息金额', value: money(sum(rows, 'actualRecoveryAmount')), tone: 'danger' },
  ];
  const subsidyCards = [...new Set(rows.map((row) => cell(row.subsidyCardNo)).filter((value) => value !== '-'))];
  const recoveryCards = [...new Set(rows.map((row) => cell(row.recoveryCardNo)).filter((value) => value !== '-'))];
  const successCount = rows.filter((row) => row.status === '成功').length;
  return <div className="loan-interest-flow-summary">
    <div className="loan-interest-flow-summary-header"><div><strong>贴息流水汇总</strong><span>共 {rows.length} 笔流水</span></div><span className="loan-interest-flow-success">成功 {successCount} 笔</span></div>
    <div className="loan-interest-flow-amount-grid">{cards.map((item) => <div className={`loan-interest-flow-amount loan-interest-flow-amount-${item.tone}`} key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
    <div className="loan-interest-flow-meta">
      <div><span>补贴息客户卡号</span><strong>{subsidyCards.length ? subsidyCards.join('、') : '-'}</strong></div>
      <div><span>收回贴息客户卡号</span><strong>{recoveryCards.length ? recoveryCards.join('、') : '-'}</strong></div>
    </div>
  </div>;
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
  const [keyword, setKeyword] = useState('');
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
    const filteredRows = rows.filter((row) => !keyword || Object.values(row).some((value) => String(value).toLowerCase().includes(keyword.toLowerCase())));
    const flowTab = title === '贴息流水明细';
    return { key: title, label: title, children: <div className={`loan-interest-tab-content${flowTab ? ' loan-interest-flow-tab' : ''}`}>
      {flowTab ? <InterestFlowSummary rows={filteredRows} /> : <div className="detail-summary">{summaryFor(title, filteredRows)}</div>}
      <div className="loan-interest-table-scroll"><Table rowKey={(_, index) => `${title}-${index}`} columns={tabColumns[title] ?? []} dataSource={filteredRows} pagination={{ pageSize: 5, showSizeChanger: false }} scroll={{ x: 'max-content' }} /></div>
    </div> };
  }) : [], [keyword, record]);
  if (!record) return <DetailShell title="贷款贴息详情" loading={loading} error={error} embedded={embedded}>{null}</DetailShell>;
  return <DetailShell title="贷款贴息详情" loading={loading} error={error} embedded={embedded}>
    <DetailSection title="贷款基础信息" items={objectItems(record.baseInfo).map((item) => item.label === '贷款状态' ? { ...item, value: statusTag(String(item.value)) } : item)} />
    <Card title="贴息明细" className="subsidy-detail-card loan-interest-detail-card"><div className="detail-tab-toolbar"><Input.Search allowClear placeholder="输入流水号、发票编号或商户名称筛选当前明细" onChange={(event) => setKeyword(event.target.value)} style={{ maxWidth: 360 }} /></div><Tabs items={tabs} /></Card>
    <Modal title={`${modal?.title ?? ''}详情`} open={Boolean(modal)} onCancel={() => setModal(undefined)} footer={null} width={900}>{modal && <div className="loan-interest-table-scroll"><Table rowKey="id" columns={modal.title === '还款流水' ? tabColumns['还款流水明细'] : tabColumns['贴息流水明细']} dataSource={[modal.row]} pagination={false} scroll={{ x: 'max-content' }} /></div>}</Modal>
  </DetailShell>;
}
