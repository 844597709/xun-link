import { Alert, Card, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSubsidyAgreement } from '../../../mock';
import type { SubsidyAgreement } from '../../../types';
import { DetailSection, DetailShell, objectItems, statusTag } from '../SubsidyCommon';

const channelText: Record<SubsidyAgreement['channel'], string> = {
  CROS签署: 'CROS小程序', 银行APP签署: '银行APP', 自动签署: '自动续签',
};

interface InterestAgreementDetailProps {
  recordId?: number;
  embedded?: boolean;
}

export default function InterestAgreementDetail({ recordId, embedded = false }: InterestAgreementDetailProps) {
  const params = useParams();
  const id = recordId ?? Number(params.id);
  const [record, setRecord] = useState<SubsidyAgreement>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    setRecord(undefined);
    setLoading(true);
    setError('');
    void getSubsidyAgreement(id).then((response) => setRecord(response.data)).catch(() => setError('协议详情加载失败')).finally(() => setLoading(false));
  }, [id]);
  if (!record) return <DetailShell title="协议查看" loading={loading} error={error} embedded={embedded}>{null}</DetailShell>;
  const canViewContent = record.channel !== '银行APP签署';
  return <DetailShell title="协议查看" loading={loading} error={error} embedded={embedded}>
    <DetailSection title="协议基础信息" items={objectItems({
      机构号: record.institutionCode, 机构名称: record.institutionName, 客户号: record.customerNo, 客户名称: record.customerName,
      贴息规则编号: record.ruleNo, 贴息合同编号: record.channel === '银行APP签署' ? '-' : record.contractNo, 签署时间: record.signedAt,
      签署渠道: channelText[record.channel], 签署状态: record.status,
    }).map((item) => item.label === '签署状态' ? { ...item, value: statusTag(record.status) } : item)} />
    <Card title="协议内容" className="subsidy-detail-card">
      {canViewContent ? <Typography.Paragraph>{record.content}</Typography.Paragraph> : <Alert type="info" showIcon message="银行 APP 签署协议不支持在此查看合同详情" description="请前往对应银行 APP 查看协议内容。" />}
    </Card>
  </DetailShell>;
}
