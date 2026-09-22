import type { TableColumnsType } from 'antd';
import { getSystemApprovals } from '../../../mock';
import type { SubsidyListParams, SystemApproval } from '../../../types';
import { dateFilter, institutionFilter, inputFilter, selectFilter, SubsidyListPage, statusTag } from '../SubsidyCommon';

const fetchSystemApprovals = (params: { page: number; pageSize: number; [key: string]: unknown }) => getSystemApprovals(params as SubsidyListParams);
const columns: TableColumnsType<SystemApproval> = [
  { title: '机构号', dataIndex: 'institutionCode', width: 90 }, { title: '机构名称', dataIndex: 'institutionName', width: 110 }, { title: '客户号', dataIndex: 'customerNo', width: 100 }, { title: '客户名称', dataIndex: 'customerName', width: 90 }, { title: '银行消费流水号', dataIndex: 'bankTransactionNo', width: 160 }, { title: '消费日期', dataIndex: 'consumptionDate', width: 110 }, { title: '消费卡号', dataIndex: 'consumptionCardNo', width: 140 }, { title: '交易类型', dataIndex: 'transactionType', width: 90 }, { title: '消费总金额', dataIndex: 'totalAmount', width: 100 }, { title: '可用消费金额', dataIndex: 'availableAmount', width: 110 }, { title: '退款原消费流水号', dataIndex: 'refundOriginalNo', width: 160 }, { title: '消费用途', dataIndex: 'purpose', width: 100 }, { title: '商户名称', dataIndex: 'merchantName', width: 110 }, { title: '核定状态', dataIndex: 'status', render: statusTag, width: 90 }, { title: '状态备注', dataIndex: 'statusRemark', width: 180 },
];
export default function InterestSystemVerify() { return <SubsidyListPage<SystemApproval> title="系统核定" description="查询银行消费流水的系统核定状态" filters={[institutionFilter, inputFilter('customerNo', '客户号'), inputFilter('mobile', '手机号'), inputFilter('idCardNo', '证件号码'), inputFilter('bankTransactionNo', '银行消费流水号'), dateFilter('consumptionDate', '消费日期'), selectFilter('transactionType', '交易类型', ['消费', '退款']), selectFilter('status', '核定状态', ['初始化', '成功', '失败', '处理中'])]} columns={columns} fetcher={fetchSystemApprovals} />; }
