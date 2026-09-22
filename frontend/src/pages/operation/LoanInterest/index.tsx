import { Button } from 'antd';
import type { TableColumnsType } from 'antd';
import OperationCell from '../../../components/OperationCell';
import LoanInterestDetail from './Detail';
import { getLoanSubsidies } from '../../../mock';
import type { LoanSubsidy, SubsidyListParams } from '../../../types';
import { dateFilter, institutionFilter, inputFilter, productFilter, selectFilter, SubsidyListPage, type SubsidyActionHandlers, statusTag } from '../SubsidyCommon';

const fetchLoans = (params: { page: number; pageSize: number; [key: string]: unknown }) => getLoanSubsidies(params as SubsidyListParams);
const columns = (handlers: SubsidyActionHandlers<LoanSubsidy>): TableColumnsType<LoanSubsidy> => [
  { title: '机构号', dataIndex: 'institutionCode', width: 90 }, { title: '机构名称', dataIndex: 'institutionName', width: 110 }, { title: '客户号', dataIndex: 'customerNo', width: 100 }, { title: '客户名称', dataIndex: 'customerName', width: 90 }, { title: '产品号', dataIndex: 'productCode', width: 100 }, { title: '贷款编号', dataIndex: 'loanNo', width: 140 }, { title: '放款日期', dataIndex: 'startDate', width: 110 }, { title: '到期日期', dataIndex: 'maturityDate', width: 110 }, { title: '贷款期限', dataIndex: 'loanTerm', width: 90 }, { title: '贷款金额', dataIndex: 'loanAmount', render: (value: number) => `¥${value.toLocaleString('zh-CN')}`, width: 110 }, { title: '已占用本金', dataIndex: 'occupiedPrincipal', width: 110 }, { title: '剩余可占用本金', dataIndex: 'remainingPrincipal', width: 130 }, { title: '关联消费笔数', dataIndex: 'consumptionCount', width: 110 }, { title: '应贴息总额', dataIndex: 'dueTotal', width: 100 }, { title: '实时贴息总额', dataIndex: 'realtimeTotal', width: 110 }, { title: '应补贴息总额', dataIndex: 'dueSubsidyTotal', width: 110 }, { title: '实补贴息总额', dataIndex: 'actualSubsidyTotal', width: 110 }, { title: '应收回贴息总额', dataIndex: 'dueRecoveryTotal', width: 120 }, { title: '实收回贴息总额', dataIndex: 'actualRecoveryTotal', width: 120 }, { title: '是否结清', dataIndex: 'settled', width: 80 }, { title: '贷款状态', dataIndex: 'loanStatus', render: statusTag, width: 90 },
  { title: '操作', key: 'actions', fixed: 'right', width: 100, render: (_, record) => <OperationCell items={[{ key: 'view', label: '查看详情' }]} onAction={() => handlers.openAction('view', record)} /> },
];
export default function LoanInterest() {
  return <SubsidyListPage<LoanSubsidy> title="贷款贴息" description="查询贷款关联消费及各类贴息金额明细" filters={[institutionFilter, inputFilter('customerNo', '客户号'), inputFilter('mobile', '手机号'), inputFilter('idCardNo', '证件号码'), productFilter, inputFilter('loanNo', '贷款编号'), dateFilter('startDate', '放款日期'), selectFilter('settled', '是否结清', ['是', '否']), selectFilter('loanStatus', '贷款状态', ['正常', '逾期', '减值', '核销'], { multiple: true })]} columns={columns} fetcher={fetchLoans} detailTitle="贷款贴息详情" detailWidth="min(1280px, 100vw)" detailRenderer={(record) => <LoanInterestDetail recordId={record.id} embedded />} />;
}
