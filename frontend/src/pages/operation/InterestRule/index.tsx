import type { TableColumnsType } from 'antd';
import OperationCell from '../../../components/OperationCell';
import InterestRuleDetail from './Detail';
import { getSubsidyRules } from '../../../mock';
import type { SubsidyListParams, SubsidyRule } from '../../../types';
import { institutionFilter, productFilter, selectFilter, SubsidyListPage, type SubsidyActionHandlers, statusTag } from '../SubsidyCommon';

const fetchRules = (params: { page: number; pageSize: number; [key: string]: unknown }) => getSubsidyRules(params as SubsidyListParams);
const columns = (handlers: SubsidyActionHandlers<SubsidyRule>): TableColumnsType<SubsidyRule> => [
  { title: '机构号', dataIndex: 'institutionCode', width: 90 }, { title: '机构名称', dataIndex: 'institutionName', width: 110 },
  { title: 'CROS规则编号', dataIndex: 'crosRuleNo', width: 150 }, { title: '银行规则编号', dataIndex: 'bankRuleNo', width: 150 },
  { title: '规则描述', dataIndex: 'description', width: 200 }, { title: '规则状态', dataIndex: 'status', render: statusTag, width: 90 },
  { title: '贴息年利率', dataIndex: 'annualRate', render: (value: number) => `${value.toFixed(2)}%`, width: 100 },
  { title: '起始日期', dataIndex: 'startDate', width: 110 }, { title: '结束日期', dataIndex: 'endDate', width: 110 },
  { title: '支持产品列表', dataIndex: 'products', render: (value: string[]) => value.join('、'), width: 180 },
  { title: '协议签署模式', dataIndex: 'signingMode', width: 110 }, { title: '核定方案', dataIndex: 'approvalScheme', width: 90 },
  { title: '贴息账户范围', dataIndex: 'accountScope', width: 110 }, { title: '贴息期供范围', dataIndex: 'supplyScope', width: 110 },
  { title: '实时贴息模式', dataIndex: 'realtimeMode', width: 110 }, { title: '补贴息模式', dataIndex: 'subsidyMode', width: 100 },
  { title: '收回贴息模式', dataIndex: 'recoveryMode', width: 110 }, { title: '查询银行消费流水', dataIndex: 'queryBankConsumption', width: 130 },
  { title: '操作', key: 'actions', fixed: 'right', width: 100, render: (_, record) => <OperationCell items={[{ key: 'view', label: '查看详情' }]} onAction={() => handlers.openAction('view', record)} /> },
];
export default function InterestRule() {
  return <SubsidyListPage<SubsidyRule> title="贴息规则配置" description="维护机构消费贷款贴息规则及计贴息参数" filters={[institutionFilter, productFilter, selectFilter('status', '规则状态', ['生效', '失效']), selectFilter('signingChannel', '协议签署模式', ['CROS签署', '银行APP签署', '自动签署']), selectFilter('approvalScheme', '核定方案', ['系统核定', '自主申请'])]} columns={columns} fetcher={fetchRules} detailTitle="贴息规则详情" detailRenderer={(record) => <InterestRuleDetail recordId={record.id} embedded />} />;
}
