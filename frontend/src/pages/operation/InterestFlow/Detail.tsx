import { Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSubsidyFlow } from '../../../mock';
import type { SubsidyConsumptionDetail, SubsidyFlow, SubsidyRefundDetail } from '../../../types';
import { DetailSection, DetailShell, objectItems, statusTag } from '../SubsidyCommon';

const money = (value: number) => `¥${value.toFixed(2)}`;
const consumptionColumns: TableColumnsType<SubsidyConsumptionDetail> = [
  { title: '序号', dataIndex: 'id', width: 70 }, { title: 'CROS消费流水号', dataIndex: 'crosConsumptionNo', width: 150 }, { title: '银行消费流水号', dataIndex: 'bankConsumptionNo', render: (value: string) => value || '-', width: 150 }, { title: '发票编号', dataIndex: 'invoiceNo', render: (value: string) => value || '-', width: 130 }, { title: '消费日期', dataIndex: 'consumptionDate', width: 110 }, { title: '消费金额', dataIndex: 'consumptionAmount', render: money, width: 100 }, { title: '申请贴息消费金额', dataIndex: 'appliedAmount', render: money, width: 120 }, { title: '消费用途', dataIndex: 'purpose', render: (value: string) => value || '-', width: 100 }, { title: '商户名称', dataIndex: 'merchantName', render: (value: string) => value || '-', width: 110 }, { title: '核定来源', dataIndex: 'approvalSource', width: 100 }, { title: '核定金额', dataIndex: 'approvedAmount', render: money, width: 100 }, { title: '核定日期', dataIndex: 'approvedAt', width: 110 }, { title: '本次贴息金额', dataIndex: 'subsidyAmount', render: money, width: 110 }, { title: '本次收回贴息金额', dataIndex: 'recoveryAmount', render: money, width: 130 },
];
const refundColumns: TableColumnsType<SubsidyRefundDetail> = [
  { title: '序号', dataIndex: 'id', width: 70 }, { title: 'CROS退款流水号', dataIndex: 'crosRefundNo', width: 150 }, { title: '银行交易流水号', dataIndex: 'bankTransactionNo', render: (value: string) => value || '-', width: 150 }, { title: '银行原交易流水号', dataIndex: 'bankOriginalTransactionNo', render: (value: string) => value || '-', width: 160 }, { title: '消费日期', dataIndex: 'consumptionDate', width: 110 }, { title: '消费金额', dataIndex: 'consumptionAmount', render: money, width: 100 }, { title: '消费核定金额', dataIndex: 'approvedAmount', render: money, width: 110 }, { title: '退款金额', dataIndex: 'refundAmount', render: money, width: 100 }, { title: '预计收回贴息总金额', dataIndex: 'expectedRecoveryAmount', render: money, width: 140 }, { title: '本次收回贴息金额', dataIndex: 'recoveryAmount', render: money, width: 130 },
];

interface InterestFlowDetailProps {
  recordId?: number;
  embedded?: boolean;
}

export default function InterestFlowDetail({ recordId, embedded = false }: InterestFlowDetailProps) {
  const params = useParams();
  const id = recordId ?? Number(params.id);
  const [record, setRecord] = useState<SubsidyFlow>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    setRecord(undefined);
    setLoading(true);
    setError('');
    void getSubsidyFlow(id).then((response) => setRecord(response.data)).catch(() => setError('流水详情加载失败')).finally(() => setLoading(false));
  }, [id]);
  if (!record) return <DetailShell title="贴息流水详情" loading={loading} error={error} embedded={embedded}>{null}</DetailShell>;
  const info = objectItems({ 机构号: record.institutionCode, 机构名称: record.institutionName, 客户号: record.customerNo, 客户名称: record.customerName, 产品号: record.productCode, 产品名称: record.productName, 贷款编号: record.loanNo, CROS交易流水号: record.crosTransactionNo, 贴息类型: record.type, 贴息金额: money(record.type === '收回贴息' ? record.expectedRecoveryAmount : record.expectedSubsidyAmount), 补贴息卡号: record.type === '补贴息' ? record.subsidyCardNo : '-', 收回贴息金额: record.type === '收回贴息' ? money(record.actualRecoveryAmount) : '-', 收回贴息卡号: record.type === '收回贴息' ? record.recoveryCardNo : '-', 贴息时间: record.subsidyAt, 贴息状态: record.status }).map((item) => item.label === '贴息状态' ? { ...item, value: statusTag(record.status) } : item);
  return <DetailShell title="贴息流水详情" loading={loading} error={error} embedded={embedded}>
    <DetailSection title="基本信息" items={info} />
    <DetailSection title="消费详情"><div className="detail-table-scroll"><Table rowKey="id" columns={consumptionColumns} dataSource={record.consumptionDetails} pagination={false} scroll={{ x: 'max-content' }} /></div></DetailSection>
    {record.refundDetails.length > 0 && <DetailSection title="退款详情"><div className="detail-table-scroll"><Table rowKey="id" columns={refundColumns} dataSource={record.refundDetails} pagination={false} scroll={{ x: 'max-content' }} /></div></DetailSection>}
  </DetailShell>;
}
