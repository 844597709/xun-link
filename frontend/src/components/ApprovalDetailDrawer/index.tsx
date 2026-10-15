import { Button, Card, Drawer, Space, Table, Tag, Timeline, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import type { ApprovalRecord, AgileRestructuringDetail, BatchDeductionDetail, DebtRestructuringDetail, ManualRepaymentDetail, ManualRepaymentSummary, ProductMaintenanceDetail } from '../../types';

const money = (value: number) => value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const statusColor: Record<ApprovalRecord['approvalStatus'], string> = { 待审批: 'orange', 已通过: 'green', 已驳回: 'red' };

function InfoGrid({ items, columns = 2 }: { items: Array<{ label: string; value?: ReactNode }>; columns?: 1 | 2 | 5 }) {
  return <div className={`approval-info-grid approval-info-grid-${columns}`}>{items.map((item) => <div className="approval-info-item" key={item.label}><span>{item.label}</span><strong>{item.value === undefined || item.value === '' ? '--' : item.value}</strong></div>)}</div>;
}

function Section({ title, children }: { title?: string; children: ReactNode }) {
  return <Card size="small" className="approval-detail-section" title={title}>{children}</Card>;
}

function Attachments({ items }: { items: string[] }) {
  return <div className="approval-attachments">{items.map((name) => <div className="approval-attachment" key={name}><span>{name}</span><Space size={12}><Button type="link" size="small" icon={<EyeOutlined />}>查看</Button><Button type="link" size="small" icon={<DownloadOutlined />}>下载</Button></Space></div>)}</div>;
}

function ProductMaintenance({ detail }: { detail: ProductMaintenanceDetail }) {
  return <>
    <Section title="基础信息"><InfoGrid items={[{ label: '机构号', value: detail.institutionCode }, { label: '机构名称', value: detail.institutionName }, { label: '产品号', value: detail.productCode }, { label: '产品名称', value: detail.productName }, { label: '贷款类型', value: detail.loanType }, { label: '贷款分类类型', value: detail.loanCategory }, { label: '操作人', value: detail.operator }, { label: '操作人名称', value: detail.operatorName }]} /></Section>
    <Section title="还款方式配置"><div className="approval-single-fields"><div><span>原还款方式及期数</span><strong>{detail.originalRepayment}</strong></div><div><span>新还款方式及期数</span><strong>{detail.newRepayment}</strong></div></div></Section>
    <Section title="还款方案配置"><div className="approval-table-scroll"><Table size="small" bordered pagination={false} rowKey="repaymentMethod" dataSource={detail.schemes} columns={[{ title: '还款方式', dataIndex: 'repaymentMethod', width: 150 }, { title: '支持期数', dataIndex: 'periods', width: 160 }, { title: '方案名称', dataIndex: 'name', width: 120, render: (value?: string) => value || '--' }, { title: '配置详情', dataIndex: 'description', width: 460 }]} /></div></Section>
  </>;
}

function SummaryTable({ title, data }: { title: string; data: ManualRepaymentSummary[] }) {
  const columns: TableColumnsType<ManualRepaymentSummary> = [
    { title: '借据号', dataIndex: 'loanNo', width: 180 },
    { title: '应还本金', dataIndex: 'principal', width: 120, render: money },
    { title: '应还利息', dataIndex: 'interest', width: 120, render: money },
    { title: '罚息', dataIndex: 'penalty', width: 110, render: money },
    { title: '应还总额', dataIndex: 'total', width: 130, render: money },
  ];
  const total = data.reduce((sum, item) => sum + item.total, 0);
  return <div className="approval-summary-block"><Typography.Text strong>{title}</Typography.Text><div className="approval-table-scroll"><Table size="small" bordered pagination={false} rowKey="loanNo" dataSource={data} columns={columns} summary={() => <Table.Summary.Row><Table.Summary.Cell index={0}><strong>合计</strong></Table.Summary.Cell><Table.Summary.Cell index={1} colSpan={3}>--</Table.Summary.Cell><Table.Summary.Cell index={4}><strong>{money(total)}</strong></Table.Summary.Cell></Table.Summary.Row>} /></div></div>;
}

function ManualRepayment({ detail }: { detail: ManualRepaymentDetail }) {
  return <>
    <Section title="基础信息"><InfoGrid items={[{ label: '机构号', value: detail.institutionCode }, { label: '机构名称', value: detail.institutionName }, { label: '产品号', value: detail.productCode }, { label: '产品名称', value: detail.productName }, { label: '客户号', value: detail.customerNo }, { label: '客户名称', value: detail.customerName }, { label: '操作人', value: detail.operator }, { label: '操作人名称', value: detail.operatorName }]} /></Section>
    <Section title="还款设置"><InfoGrid items={[{ label: '还款账户', value: detail.repaymentAccount }, { label: '账户类型', value: detail.accountType }, { label: '放款账号', value: detail.disbursementAccount }, { label: '还款账号', value: detail.repaymentNo }, { label: '附加信息', value: detail.additionalInfo }, { label: '是否代偿', value: detail.compensation }]} /></Section>
    <Section title="试算汇总"><div className="approval-summary-list"><SummaryTable title="应还试算汇总" data={detail.dueSummary} /><SummaryTable title="实还试算汇总" data={detail.actualSummary} /></div></Section>
  </>;
}

function RepaymentScheme({ scheme, showName = true }: { scheme: DebtRestructuringDetail['scheme']; showName?: boolean }) {
  return <>{showName && <div className="approval-scheme-title"><Tag color="blue">{scheme.name}</Tag></div>}<div className="approval-table-scroll"><Table size="small" bordered pagination={false} rowKey="sequence" dataSource={scheme.stages} columns={[{ title: '阶段', dataIndex: 'sequence', width: 90 }, { title: '起止期数', dataIndex: 'term', width: 130 }, { title: '还款方式', dataIndex: 'method', width: 180 }, { title: '本金比例', dataIndex: 'ratio', width: 120 }]} /></div></>;
}

function DebtRestructuring({ detail }: { detail: DebtRestructuringDetail }) {
  return <>
    <Section title="基础信息"><InfoGrid items={[{ label: '机构号', value: detail.institutionCode }, { label: '机构名称', value: detail.institutionName }, { label: '产品号', value: detail.productCode }, { label: '产品名称', value: detail.productName }, { label: '客户号', value: detail.customerNo }, { label: '客户名称', value: detail.customerName }, { label: '字段申请来源', value: detail.applicationSource }, { label: '操作人', value: detail.operator }, { label: '操作人名称', value: detail.operatorName }, { label: '操作人ID', value: detail.operatorId }]} /></Section>
    <Section title="还款信息"><InfoGrid items={detail.repaymentInfo} /></Section>
    <Section title="新贷款信息"><InfoGrid items={detail.newLoanInfo} /></Section>
    <Section title="还款方案"><RepaymentScheme scheme={detail.scheme} /></Section>
    <Section title="原借据信息"><div className="approval-table-scroll"><Table size="small" bordered pagination={false} rowKey="loanNo" dataSource={detail.originalLoans} columns={[{ title: '序号', key: 'index', width: 70, render: (_: unknown, __: unknown, index: number) => index + 1 }, { title: '借据号', dataIndex: 'loanNo', width: 180 }, { title: '借据状态', dataIndex: 'status', width: 100, render: (value: string) => <Tag color={value === '正常' ? 'green' : 'default'}>{value}</Tag> }, { title: '贷款金额', dataIndex: 'amount', width: 130, render: money }, { title: '贷款余额', dataIndex: 'balance', width: 130, render: money }, { title: '应还本息', dataIndex: 'duePrincipalInterest', width: 130, render: money }, { title: '应还本金', dataIndex: 'duePrincipal', width: 130, render: money }, { title: '应还总息', dataIndex: 'totalInterest', width: 130, render: money }, { title: '是否结清', dataIndex: 'settled', width: 100 }]} /></div></Section>
    <Section title="相关材料"><Attachments items={detail.attachments} /></Section>
  </>;
}

function BatchDeduction({ detail }: { detail: BatchDeductionDetail }) {
  const columns: TableColumnsType<BatchDeductionDetail['loans'][number]> = [
    { title: '机构号', dataIndex: 'institutionCode', width: 100 },
    { title: '机构名称', dataIndex: 'institutionName', width: 130 },
    { title: '客户号', dataIndex: 'customerNo', width: 130 },
    { title: '客户名称', dataIndex: 'customerName', width: 110 },
    { title: '借据号', dataIndex: 'loanNo', width: 170 },
    { title: '借据金额', dataIndex: 'amount', width: 120, render: money },
    { title: '借据余额', dataIndex: 'balance', width: 120, render: money },
    { title: '借据状态', dataIndex: 'status', width: 100, render: (value: string) => <Tag color={value === '正常' ? 'green' : 'default'}>{value}</Tag> },
  ];
  return <>
    <Section title="基础信息"><InfoGrid items={[{ label: '操作类型', value: detail.operatorType }, { label: '操作人ID', value: detail.operatorId }, { label: '操作人名称', value: detail.operatorName }]} /></Section>
    {detail.recovery && <Section title="恢复批扣信息"><InfoGrid items={[{ label: '恢复批扣策略', value: detail.recovery.strategy }, { label: '恢复批扣日期', value: detail.recovery.date }, { label: '恢复批扣天数', value: detail.recovery.days }]} /></Section>}
    <Section title="借据列表"><div className="approval-table-scroll"><Table size="small" bordered pagination={false} rowKey="loanNo" dataSource={detail.loans} columns={columns} /></div></Section>
  </>;
}

function AgileRestructuring({ detail }: { detail: AgileRestructuringDetail }) {
  const planColumns: TableColumnsType<AgileRestructuringDetail['plans'][number]> = [
    { title: '期数', dataIndex: 'period', width: 70 }, { title: '开始日期', dataIndex: 'startDate', width: 120 }, { title: '到期日期', dataIndex: 'dueDate', width: 120 }, { title: '本期状态', dataIndex: 'status', width: 100 }, { title: '初始本息', dataIndex: 'initialTotal', width: 120, render: money }, { title: '初始本金', dataIndex: 'initialPrincipal', width: 120, render: money }, { title: '初始利息', dataIndex: 'initialInterest', width: 120, render: money }, { title: '剩余本金', dataIndex: 'remainingPrincipal', width: 120, render: money }, { title: '已还总额', dataIndex: 'paidAmount', width: 120, render: money }, { title: '已还本金', dataIndex: 'paidPrincipal', width: 120, render: money },
  ];
  return <>
    <Section title="基础信息"><InfoGrid items={[{ label: '机构号', value: detail.institutionCode }, { label: '机构名称', value: detail.institutionName }, { label: '产品号', value: detail.productCode }, { label: '产品名称', value: detail.productName }, { label: '客户号', value: detail.customerNo }, { label: '客户名称', value: detail.customerName }, { label: '操作人', value: detail.operator }, { label: '操作人名称', value: detail.operatorName }]} /></Section>
    <Section title="调整信息"><InfoGrid items={[...detail.originalState, ...detail.newState, { label: '申请原因', value: detail.reason }]} /><div className="approval-attachments-block"><Typography.Text strong>附件材料</Typography.Text><Attachments items={detail.attachments} /></div></Section>
    <Section title="还款方案"><RepaymentScheme scheme={detail.scheme} showName={false} /></Section>
    <Section title="新贷款计划"><div className="approval-table-scroll"><Table size="small" bordered rowKey="period" dataSource={detail.plans} columns={planColumns} pagination={{ pageSize: 6, showSizeChanger: false, size: 'small' }} /></div></Section>
  </>;
}

export default function ApprovalDetailDrawer({ record, open, onClose, onClaim }: { record?: ApprovalRecord; open: boolean; onClose: () => void; onClaim: (record: ApprovalRecord) => void }) {
  if (!record) return null;
  const detail = record.detail;
  const body = record.detailType === 'product-maintenance' ? <ProductMaintenance detail={detail as ProductMaintenanceDetail} /> : record.detailType === 'manual-repayment' ? <ManualRepayment detail={detail as ManualRepaymentDetail} /> : record.detailType === 'debt-restructuring' ? <DebtRestructuring detail={detail as DebtRestructuringDetail} /> : record.detailType === 'agile-restructuring' ? <AgileRestructuring detail={detail as AgileRestructuringDetail} /> : <BatchDeduction detail={detail as BatchDeductionDetail} />;
  const drawerWidth = record.detailType === 'product-maintenance' ? 'min(1000px, 82vw)' : record.detailType === 'manual-repayment' ? 'min(1180px, 86vw)' : record.detailType === 'batch-deduction' ? 'min(1120px, 86vw)' : 'min(1280px, 88vw)';
  return <Drawer className="approval-detail-drawer" placement="right" open={open} onClose={onClose} width={drawerWidth} destroyOnClose title={`审批详情 - ${record.id}`} extra={<Button type="primary" onClick={() => onClaim(record)}>认领</Button>}>
    <div className="approval-detail-scroll">
      <Section><InfoGrid columns={5} items={[{ label: '类型', value: record.type }, { label: '案件子类型', value: record.caseSubtype }, { label: '序号', value: record.id }, { label: '审批状态', value: <Tag color={statusColor[record.approvalStatus]}>{record.approvalStatus}</Tag> }, { label: '审批结果', value: record.approvalResult }]} /></Section>
      <Section><InfoGrid items={[{ label: '发起人', value: record.initiator }, { label: '发起时间', value: record.applyTime }]} /></Section>
      <Section><InfoGrid items={[{ label: '业务状态', value: record.businessStatus }, { label: '业务失败原因', value: record.failureReason }]} /></Section>
      <Section title="详情内容">{body}</Section>
      <Section title="审批进程"><Timeline items={record.timeline.map((item) => ({ color: item.status === '待审批' ? 'orange' : 'green', children: <div><div className="approval-timeline-title">{item.title}<Tag color={item.status === '待审批' ? 'orange' : 'green'}>{item.status}</Tag></div><div className="approval-muted">操作人：{item.operator}　{item.time}</div></div> }))} /></Section>
    </div>
  </Drawer>;
}
