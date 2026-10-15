import { Tag } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSubsidyRule, subsidyProducts } from '../../../mock';
import type { SubsidyRule } from '../../../types';
import { DetailSection, DetailShell, objectItems, statusTag } from '../SubsidyCommon';

const signingModeText: Record<SubsidyRule['signingMode'], string> = {
  CROS签署: 'CROS独立签署',
  银行APP签署: '仅银行APP签署',
  自动签署: '双方签署实时同步',
};
const approvalSchemeText: Record<SubsidyRule['approvalScheme'], string> = {
  系统核定: '仅支持系统核定',
  自主申请: '仅支持客户申请',
};

interface InterestRuleDetailProps {
  recordId?: number;
  embedded?: boolean;
}

export default function InterestRuleDetail({ recordId, embedded = false }: InterestRuleDetailProps) {
  const params = useParams();
  const id = recordId ?? Number(params.id);
  const [record, setRecord] = useState<SubsidyRule>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    setRecord(undefined);
    setLoading(true);
    setError('');
    void getSubsidyRule(id).then((response) => setRecord(response.data)).catch(() => setError('规则详情加载失败')).finally(() => setLoading(false));
  }, [id]);
  const title = record ? `贴息规则配置：${record.crosRuleNo}` : '贴息规则配置';
  if (!record) return <DetailShell title={title} loading={loading} error={error} embedded={embedded}>{null}</DetailShell>;
  const products = subsidyProducts.filter((item) => record.products.includes(item.productName) && item.institutionName === record.institutionName).map((item) => item.productCode);
  const productTags = products.length > 0 ? products.map((product) => <Tag key={product} color="blue">{product}</Tag>) : <span>-</span>;
  const basic = objectItems({
    机构号: record.institutionCode, 机构名称: record.institutionName, CROS规则编号: record.crosRuleNo, 银行规则编号: record.bankRuleNo,
    规则描述: record.description, 贴息年利率: `${record.annualRate.toFixed(2)}%`, 起始日期: record.startDate, 结束日期: record.endDate,
    支持产品列表: productTags, 协议签署模式: signingModeText[record.signingMode], 核定方案: approvalSchemeText[record.approvalScheme],
    贴息账户范围: record.accountScope, 贴息期供范围: record.supplyScope, 实时贴息模式: record.realtimeMode, 补贴息模式: record.subsidyMode,
    收回贴息模式: record.recoveryMode, 是否查询银行消费流水: record.queryBankConsumption,
  });
  const rules = objectItems({
    计贴息规则: record.calculationRule, 贷款贴息顺序: record.loanSubsidyOrder, 可贴息贷款规则: record.eligibleLoanRule,
    指定贴息贷款起始日期: record.eligibleLoanRule.includes('指定') ? record.designatedLoanStartDate : '-', 消费追溯期规则: record.consumptionTraceRule,
    消费追溯天数: record.consumptionTraceRule === '政策起始日之后' ? '-' : record.traceDays, 是否允许已结清贷款贴息: record.allowSettledLoan,
    是否允许贷后业务贷款贴息: record.allowBusinessLoan, 是否校验消费账户与收款账户一致: record.checkAccountMatch,
    是否允许宽限期内贴息: record.allowGracePeriod, 是否允许逾期还款中正常本金贴息: record.allowNormalPrincipalAfterOverdue,
    逾期贴息失效规则: record.overdueFailureRule, 最低可贴息消费金额: `¥${record.minConsumptionAmount.toFixed(2)}`,
  });
  const coloredBasic = basic.map((item) => item.label === '规则状态' ? { ...item, value: statusTag(record.status) } : item);
  const items = [...coloredBasic, ...rules];
  return <DetailShell title={title} loading={loading} error={error} embedded={embedded}>
    <div className="subsidy-rule-summary">
      <div className="subsidy-rule-number">规则编号：<strong>{record.crosRuleNo}</strong></div>
      <div className="subsidy-rule-meta">
        <span className={`subsidy-rule-status subsidy-rule-status-${record.status === '生效' ? 'active' : 'inactive'}`}>生效状态：{record.status}</span>
        <span className="subsidy-rule-validity">有效期：{record.startDate} 至 {record.endDate}</span>
      </div>
    </div>
    <DetailSection title="规则信息" items={items} layout="plain-two-column" />
  </DetailShell>;
}
