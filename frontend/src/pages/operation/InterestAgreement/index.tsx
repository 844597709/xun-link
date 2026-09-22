import type { TableColumnsType } from 'antd';
import OperationCell from '../../../components/OperationCell';
import InterestAgreementDetail from './Detail';
import { getSubsidyAgreements } from '../../../mock';
import type { SubsidyAgreement, SubsidyListParams } from '../../../types';
import { dateFilter, institutionFilter, inputFilter, selectFilter, SubsidyListPage, type SubsidyActionHandlers, statusTag } from '../SubsidyCommon';

const fetchAgreements = (params: { page: number; pageSize: number; [key: string]: unknown }) => getSubsidyAgreements(params as SubsidyListParams);
const columns = (handlers: SubsidyActionHandlers<SubsidyAgreement>): TableColumnsType<SubsidyAgreement> => [
  { title: '机构号', dataIndex: 'institutionCode', width: 90 }, { title: '机构名称', dataIndex: 'institutionName', width: 110 },
  { title: '客户号', dataIndex: 'customerNo', width: 110 }, { title: '客户名称', dataIndex: 'customerName', width: 100 },
  { title: '贴息规则编号', dataIndex: 'ruleNo', width: 160 }, { title: '贴息合同编号', dataIndex: 'contractNo', width: 170 },
  { title: '签署时间', dataIndex: 'signedAt', width: 160 }, { title: '签署渠道', dataIndex: 'channel', width: 110 },
  { title: '签署状态', dataIndex: 'status', render: statusTag, width: 90 },
  { title: '操作', key: 'actions', fixed: 'right', width: 100, render: (_, record) => <OperationCell items={[{ key: 'view', label: '查看协议' }]} onAction={() => handlers.openAction('view', record)} /> },
];
export default function InterestAgreement() {
  return <SubsidyListPage<SubsidyAgreement> title="协议签署" description="查询客户贴息协议签署记录和签署状态" filters={[institutionFilter, inputFilter('customerNo', '客户号'), inputFilter('idCardNo', '证件号码'), inputFilter('mobile', '手机号'), dateFilter('signedAt', '签署时间'), selectFilter('signingChannel', '签署渠道', ['CROS签署', '银行APP签署', '自动签署'])]} columns={columns} fetcher={fetchAgreements} detailTitle="协议查看" detailRenderer={(record) => <InterestAgreementDetail recordId={record.id} embedded />} />;
}
