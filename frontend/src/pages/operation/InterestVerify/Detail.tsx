import { Card, Descriptions, Image, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSubsidyApproval } from '../../../mock';
import type { SubsidyApproval, SubsidyConsumptionDetail } from '../../../types';
import { DetailSection, DetailShell, objectItems, statusTag } from '../SubsidyCommon';

const money = (value: number | undefined, visible: boolean) => visible && value !== undefined ? `¥${value.toFixed(2)}` : '-';
const columns = (approved: boolean, system: boolean): TableColumnsType<SubsidyConsumptionDetail> => [
  { title: '消费账户', dataIndex: 'account', render: (value: string) => value || '-', width: 140 }, { title: '账户类型', dataIndex: 'accountType', render: (value: string) => value || '-', width: 90 }, { title: '消费日期', dataIndex: 'consumptionDate', width: 110 }, { title: '交易流水号', dataIndex: 'bankConsumptionNo', render: (value: string) => value || '-', width: 150 }, { title: '消费金额', dataIndex: 'consumptionAmount', render: (value: number) => money(value, true), width: 100 }, { title: '申请贴息消费金额', dataIndex: 'appliedAmount', render: (value: number) => money(value, true), width: 120 }, { title: '消费用途', dataIndex: 'purpose', width: 100 }, { title: '关联贷款编号', dataIndex: 'loanNo', render: (value: string) => value || '-', width: 140 }, { title: '申请时可贴贷款本金总额', dataIndex: 'availablePrincipal', render: (value: number) => money(value, true), width: 150 }, { title: '消费描述', dataIndex: 'description', render: (value: string) => value || '-', width: 160 }, { title: '消费核定金额', dataIndex: 'approvedAmount', render: (value: number) => money(value, approved), width: 110 }, { title: '消费预计贴息金额', dataIndex: 'subsidyAmount', render: (value: number) => money(value, approved), width: 120 }, ...(system ? [{ title: '消费核定状态', dataIndex: 'approvalStatus', render: (value: string) => value || '未核定', width: 110 }] : []),
];

interface InterestVerifyDetailProps {
  recordId?: number;
  source?: 'self' | 'system';
  embedded?: boolean;
}

export default function InterestVerifyDetail({ recordId, source, embedded = false }: InterestVerifyDetailProps) {
  const params = useParams();
  const id = recordId ?? Number(params.id);
  const routeSource = source ?? params.source;
  const [record, setRecord] = useState<SubsidyApproval>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    setRecord(undefined);
    setLoading(true);
    setError('');
    void getSubsidyApproval(id).then((response) => setRecord(response.data)).catch(() => setError('核定详情加载失败')).finally(() => setLoading(false));
  }, [id]);
  if (!record) return <DetailShell title="贴息核定详情" loading={loading} error={error} embedded={embedded}>{null}</DetailShell>;
  const isSelf = routeSource === 'self' || record.source === '自主申请';
  const approved = record.status === '已通过';
  const info = objectItems({ 申请时间: record.appliedAt, 核定来源: isSelf ? '自主申请' : '系统核定', 核定状态: record.status, 状态备注: record.statusRemark, 核定日期: approved ? record.approvedAt : '-', 核定总金额: approved ? record.approvedAmount.toFixed(2) : '-', 预计贴息总金额: approved ? record.estimatedTotal.toFixed(2) : '-' }).map((item) => item.label === '核定状态' ? { ...item, value: statusTag(record.status) } : item);
  const consumptions = isSelf ? record.consumptions.slice(0, 1) : record.consumptions;
  return <DetailShell title={`${isSelf ? '自主申请' : '系统核定'}详情`} loading={loading} error={error} embedded={embedded}>
    <DetailSection title="申请信息" items={info} />
    <DetailSection title="消费信息"><div className="detail-table-scroll"><Table rowKey="id" columns={columns(approved, !isSelf)} dataSource={consumptions} pagination={false} scroll={{ x: 'max-content' }} /></div></DetailSection>
    {isSelf && <DetailSection title="凭证信息"><div className="voucher-grid">{record.vouchers.map((voucher) => <Card key={voucher.id} size="small" title={voucher.kind}><Image width={160} height={110} src={voucher.url} alt={voucher.name} /><Descriptions size="small" column={1} items={[{ key: 'name', label: '文件', children: voucher.name }, ...(voucher.invoiceNo ? [{ key: 'invoiceNo', label: '发票编号', children: voucher.invoiceNo }, { key: 'invoiceDate', label: '发票日期', children: voucher.invoiceDate }, { key: 'invoiceAmount', label: '发票金额', children: `¥${voucher.invoiceAmount?.toFixed(2)}` }] : [])]} /></Card>)}</div></DetailSection>}
  </DetailShell>;
}
