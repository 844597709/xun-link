import { Card, Descriptions, Image, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSubsidyApproval } from '../../../mock';
import type { SubsidyApproval } from '../../../types';
import { DetailSection, DetailShell, objectItems, statusTag } from '../SubsidyCommon';

const money = (value: number | undefined, visible: boolean) => visible && value !== undefined ? `¥${value.toFixed(2)}` : '-';
const explainableLabel = (label: string, description: string) => <span className="subsidy-detail-label-with-help">{label}<Tooltip title={description}><span role="img" aria-label={`${label}说明`} className="subsidy-detail-help-icon"><InfoCircleOutlined /></span></Tooltip></span>;
const totalSubsidyHelp = '为申请核定通过时所有消费初始预计贴息金额汇总';
const consumptionSubsidyHelp = '为申请核定通过时消费初始预计贴息金额';

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
  const isSelf = record ? routeSource === 'self' || record.source === '自主申请' : false;
  const title = record ? (isSelf ? '自主申请详情' : `贴息核定详情：${record.applicationNo}`) : '贴息核定详情';
  if (!record) return <DetailShell title={title} loading={loading} error={error} embedded={embedded}>{null}</DetailShell>;
  const approved = record.status === '已通过';
  const statusTone = record.status === '已通过' ? 'active' : record.status === '已拒绝' ? 'inactive' : 'neutral';
  const info = objectItems({ 申请时间: record.appliedAt, 核定来源: isSelf ? '自主申请' : '系统核定', 申请状态: record.status, 状态备注: record.statusRemark, 核定日期: approved ? record.approvedAt : '-', 核定总金额: approved ? record.approvedAmount.toFixed(2) : '-', 预计贴息总金额: approved ? record.estimatedTotal.toFixed(2) : '-' }).map((item) => {
    if (item.label === '申请状态') return { ...item, value: statusTag(record.status) };
    if (item.label === '预计贴息总金额') return { ...item, label: explainableLabel(item.label, totalSubsidyHelp) };
    return item;
  });
  const consumptions = isSelf ? record.consumptions.slice(0, 1) : record.consumptions;
  return <DetailShell title={title} loading={loading} error={error} embedded={embedded}>
    <div className="subsidy-approval-summary">
      <div className="subsidy-approval-number">申请编号：<strong>{record.applicationNo}</strong></div>
      <div className="subsidy-approval-meta">
        <span className={`subsidy-approval-status subsidy-approval-status-${statusTone}`}>申请状态：{record.status}</span>
        <span className="subsidy-approval-time">申请时间：{record.appliedAt}</span>
      </div>
    </div>
    <DetailSection title="申请信息" items={info} layout="plain-three-column" />
    {consumptions.map((consumption, index) => {
      const consumptionItems = objectItems({
        消费账户: consumption.account,
        账户类型: consumption.accountType,
        消费日期: consumption.consumptionDate,
        交易流水号: consumption.bankConsumptionNo,
        消费金额: money(consumption.consumptionAmount, true),
        申请贴息消费金额: money(consumption.appliedAmount, true),
        消费用途: consumption.purpose,
        关联贷款编号: consumption.loanNo,
        申请时可贴贷款本金总额: money(consumption.availablePrincipal, true),
        消费描述: consumption.description,
        消费核定金额: money(consumption.approvedAmount, approved),
        消费预计贴息金额: money(consumption.subsidyAmount, approved),
        ...(isSelf ? {} : { 消费核定状态: consumption.approvalStatus || '未核定' }),
      }).map((item) => item.label === '消费预计贴息金额' ? { ...item, label: explainableLabel(item.label, consumptionSubsidyHelp) } : item);
      return <DetailSection key={`${consumption.id}-${index}`} title="消费信息" items={consumptionItems} layout="plain-three-column">
        {isSelf && index === 0 && <div className="subsidy-voucher-in-card">
          <div className="subsidy-voucher-title">凭证信息</div>
          <div className="subsidy-voucher-list">
            {record.vouchers.map((voucher) => <Card key={voucher.id} size="small" title={voucher.kind}>
              {voucher.kind === '发票' && <div className="subsidy-voucher-invoice-fields">
                <div className="subsidy-voucher-invoice-field"><span>发票号码</span><strong>{voucher.invoiceNo || '-'}</strong></div>
                <div className="subsidy-voucher-invoice-field"><span>发票代码</span><strong>{voucher.invoiceCode || '-'}</strong></div>
                <div className="subsidy-voucher-invoice-field"><span>发票日期</span><strong>{voucher.invoiceDate || '-'}</strong></div>
                <div className="subsidy-voucher-invoice-field"><span>发票金额</span><strong>{voucher.invoiceAmount === undefined ? '-' : `¥${voucher.invoiceAmount.toFixed(2)}`}</strong></div>
              </div>}
              <Image width={160} height={110} src={voucher.url} alt={voucher.name} />
              <Descriptions size="small" column={1} items={[{ key: 'name', label: '文件', children: voucher.name }]} />
            </Card>)}
          </div>
        </div>}
      </DetailSection>;
    })}
  </DetailShell>;
}
