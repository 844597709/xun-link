import { Col, Row, Statistic, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getConsumeSubsidy } from '../../../mock';
import type { ConsumeSubsidyAllocation, ConsumeSubsidyRecord, ConsumeSubsidyRefund } from '../../../types';
import { DetailSection, DetailShell, objectItems, statusTag } from '../SubsidyCommon';

const money = (value: number) => `¥${value.toFixed(2)}`;
const allocationColumns: TableColumnsType<ConsumeSubsidyAllocation> = [
  { title: '贷款编号', dataIndex: 'loanNo', width: 140 }, { title: '产品号', dataIndex: 'productCode', width: 100 }, { title: '产品名称', dataIndex: 'productName', width: 110 }, { title: '贷款金额', dataIndex: 'loanAmount', render: money, width: 100 }, { title: '分摊核定金额', dataIndex: 'allocatedAmount', render: money, width: 110 }, { title: '预计贴息金额', dataIndex: 'expectedSubsidyAmount', render: money, width: 110 }, { title: '应贴息总金额', dataIndex: 'dueSubsidyAmount', render: money, width: 110 }, { title: '已贴息总金额', dataIndex: 'actualSubsidyAmount', render: money, width: 110 }, { title: '应收回贴息总金额', dataIndex: 'dueRecoveryAmount', render: money, width: 130 }, { title: '已收回贴息总金额', dataIndex: 'actualRecoveryAmount', render: money, width: 130 },
];
const refundColumns: TableColumnsType<ConsumeSubsidyRefund> = [
  { title: '序号', dataIndex: 'id', width: 70 }, { title: 'CROS退款流水号', dataIndex: 'crosRefundNo', width: 150 }, { title: '银行消费流水号', dataIndex: 'bankConsumptionNo', render: (value: string) => value || '-', width: 150 }, { title: '银行原消费流水号', dataIndex: 'bankOriginalConsumptionNo', render: (value: string) => value || '-', width: 160 }, { title: '退款日期', dataIndex: 'refundDate', width: 110 }, { title: '退款金额', dataIndex: 'refundAmount', render: money, width: 100 }, { title: '应收回贴息总额', dataIndex: 'dueRecoveryAmount', render: money, width: 120 }, { title: '已收回贴息总额', dataIndex: 'actualRecoveryAmount', render: money, width: 120 },
];

interface ConsumeInterestDetailProps {
  recordId?: number;
  embedded?: boolean;
}

export default function ConsumeInterestDetail({ recordId, embedded = false }: ConsumeInterestDetailProps) {
  const params = useParams();
  const id = recordId ?? Number(params.id);
  const [record, setRecord] = useState<ConsumeSubsidyRecord>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    setRecord(undefined);
    setLoading(true);
    setError('');
    void getConsumeSubsidy(id).then((response) => setRecord(response.data)).catch(() => setError('消费贴息详情加载失败')).finally(() => setLoading(false));
  }, [id]);
  if (!record) return <DetailShell title="消费贴息详情" loading={loading} error={error} embedded={embedded}>{null}</DetailShell>;
  const info = objectItems({
    CROS消费流水号: record.crosConsumptionNo, 银行交易流水号: record.bankConsumptionNo || '-', 发票编号: record.invoiceNo || '-', 机构号: record.institutionCode, 机构名称: record.institutionName,
    客户号: record.customerNo, 客户名称: record.customerName, 消费日期: record.consumptionDate, 消费金额: money(record.consumptionAmount), 申请消费贴息金额: money(record.appliedSubsidyAmount),
    消费用途: record.purpose, 商户名称: record.merchantName, 核定总金额: money(record.approvedAmount), 核定日期: record.approvedAt, 预计贴息总金额: money(record.expectedSubsidyAmount),
    应贴息总金额: money(record.dueSubsidyAmount), 已贴息总金额: money(record.actualSubsidyAmount), 退款总金额: money(record.refundAmount), 应收回贴息总金额: money(record.dueRecoveryAmount), 已收回贴息总金额: money(record.actualRecoveryAmount), 消费状态: record.status,
  }).map((item) => item.label === '消费状态' ? { ...item, value: statusTag(record.status) } : item);
  return <DetailShell title="消费贴息详情" loading={loading} error={error} embedded={embedded}>
    <DetailSection title="消费基本信息" items={info} />
    <DetailSection title="消费统计指标"><Row gutter={[16, 16]}><Col xs={12} sm={8}><Statistic title="核定总金额 / 退款总金额" value={`${money(record.approvedAmount)} / ${money(record.refundAmount)}`} /></Col><Col xs={12} sm={8}><Statistic title="预计贴息总金额" value={money(record.expectedSubsidyAmount)} /></Col><Col xs={12} sm={8}><Statistic title="应贴息总金额 / 已贴息总金额" value={`${money(record.dueSubsidyAmount)} / ${money(record.actualSubsidyAmount)}`} /></Col><Col xs={12} sm={8}><Statistic title="分摊贷款笔数" value={record.allocations.length} /></Col></Row></DetailSection>
    <DetailSection title="贷款分摊明细"><div className="detail-table-scroll"><Table rowKey="id" columns={allocationColumns} dataSource={record.allocations} pagination={{ pageSize: 5, showSizeChanger: false }} scroll={{ x: 'max-content' }} /></div></DetailSection>
    {record.refundAmount > 0 && <DetailSection title="消费退款明细"><div className="detail-table-scroll"><Table rowKey="id" columns={refundColumns} dataSource={record.refunds} pagination={{ pageSize: 5, showSizeChanger: false }} scroll={{ x: 'max-content' }} /></div></DetailSection>}
  </DetailShell>;
}
