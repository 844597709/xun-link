import type { TableColumnsType } from 'antd';
import OperationCell from '../../../components/OperationCell';
import InterestVerifyDetail from './Detail';
import { getSubsidyApprovals } from '../../../mock';
import type { SubsidyApproval, SubsidyListParams } from '../../../types';
import { dateFilter, institutionFilter, inputFilter, selectFilter, SubsidyListPage, type SubsidyActionHandlers, statusTag } from '../SubsidyCommon';

const fetchApprovals = (params: { page: number; pageSize: number; [key: string]: unknown }) => getSubsidyApprovals(params as SubsidyListParams);
const columns = (handlers: SubsidyActionHandlers<SubsidyApproval>): TableColumnsType<SubsidyApproval> => [
  { title: '机构号', dataIndex: 'institutionCode', width: 90 }, { title: '机构名称', dataIndex: 'institutionName', width: 110 }, { title: '客户号', dataIndex: 'customerNo', width: 100 }, { title: '客户名称', dataIndex: 'customerName', width: 90 }, { title: '核定申请号', dataIndex: 'applicationNo', width: 160 }, { title: '申请时间', dataIndex: 'appliedAt', width: 150 }, { title: '申请核定金额', dataIndex: 'appliedAmount', render: (value: number) => `¥${value.toFixed(2)}`, width: 110 }, { title: '申请消费笔数', dataIndex: 'consumptionCount', width: 110 }, { title: '核定来源', dataIndex: 'source', width: 100 }, { title: '核定日期', dataIndex: 'approvedAt', render: (value: string, record) => record.status === '已通过' ? value : '-', width: 110 }, { title: '核定金额', dataIndex: 'approvedAmount', render: (value: number, record) => record.status === '已通过' ? `¥${value.toFixed(2)}` : '-', width: 100 }, { title: '状态备注', dataIndex: 'statusRemark', width: 180 }, { title: '详细原因', dataIndex: 'reason', width: 180 }, { title: '核定状态', dataIndex: 'status', render: statusTag, fixed: 'right', width: 90 },
  { title: '操作', key: 'actions', fixed: 'right', width: 100, render: (_, record) => <OperationCell items={[{ key: 'view', label: '查看详情' }]} onAction={() => handlers.openAction('view', record)} /> },
];
export default function InterestVerify() {
  return <SubsidyListPage<SubsidyApproval> title="贴息核定" description="查询系统核定和自主申请的贴息核定记录" filters={[institutionFilter, inputFilter('customerNo', '客户号'), inputFilter('idCardNo', '证件号码'), inputFilter('mobile', '手机号'), dateFilter('appliedAt', '申请时间'), selectFilter('source', '核定来源', ['系统核定', '自主申请']), selectFilter('status', '核定状态', ['审核中', '已通过', '已拒绝', '已撤销'])]} columns={columns} fetcher={fetchApprovals} detailTitle={(record) => record.source === '系统核定' ? `贴息核定详情：${record.applicationNo}` : '自主申请详情'} detailWidth="min(1180px, 100vw)" detailRenderer={(record) => <InterestVerifyDetail recordId={record.id} source={record.source === '自主申请' ? 'self' : 'system'} embedded />} hideDetailFooter />;
}
