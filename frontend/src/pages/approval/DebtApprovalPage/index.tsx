import { Button, Card, Descriptions, Drawer, Space, Table, Tag, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { useEffect, useState } from 'react';
import OperationCell from '../../../components/OperationCell';
import { getDebtApprovalRecords, getDebtLoan } from '../../../mock/debt';
import type { DebtApprovalRecord, DebtLoan } from '../../../types';

const money = (value: number) => value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function DebtApprovalContent({ loan }: { loan: DebtLoan }) {
  const originalInterest = loan.originalLoans.reduce((sum, item) => sum + item.repayInterest, 0);
  const relief = loan.originalLoans.reduce((sum, item) => sum + item.interestRelief, 0);
  const principal = loan.originalLoans.reduce((sum, item) => sum + item.duePrincipal, 0);
  const scheme = loan.id % 2 === 0 ? '方案A：1-12期先息后本，13-36期等额本息' : '方案B：1-12期先息后本，13-24期等额本金，25-36期等额本金';
  return <div className="debt-approval-content">
    <Card title="基本信息" size="small" className="debt-approval-card"><Descriptions column={2} size="small"><Descriptions.Item label="机构">{loan.institutionName}（{loan.institutionCode}）</Descriptions.Item><Descriptions.Item label="产品">{loan.productCode}-{loan.productName}</Descriptions.Item><Descriptions.Item label="客户名称">{loan.customerName}</Descriptions.Item><Descriptions.Item label="客户号">{loan.customerNo}</Descriptions.Item><Descriptions.Item label="原借据号">{loan.loanNo}</Descriptions.Item><Descriptions.Item label="借据状态"><Tag color={loan.loanStatus === '正常' ? 'blue' : loan.loanStatus === '逾期' ? 'gold' : loan.loanStatus === '减值' ? 'red' : 'default'}>{loan.loanStatus}</Tag></Descriptions.Item></Descriptions></Card>
    <Card title="还款信息" size="small" className="debt-approval-card"><Descriptions column={2} size="small"><Descriptions.Item label="归还总本">{money(principal)} 元</Descriptions.Item><Descriptions.Item label="归还总息">{money(originalInterest)} 元</Descriptions.Item><Descriptions.Item label="减免总息">{money(relief)} 元</Descriptions.Item><Descriptions.Item label="归还总额">{money(principal + originalInterest - relief)} 元</Descriptions.Item></Descriptions></Card>
    <Card title="新贷款信息" size="small" className="debt-approval-card"><Descriptions column={2} size="small"><Descriptions.Item label="贷款金额">{money(Math.max(0, loan.loanBalance - principal))} 元</Descriptions.Item><Descriptions.Item label="还款方式">10 组合还款</Descriptions.Item><Descriptions.Item label="贷款期数">36期</Descriptions.Item><Descriptions.Item label="首期延迟时间">0个月</Descriptions.Item><Descriptions.Item label="正常利率">{loan.normalRate}%</Descriptions.Item><Descriptions.Item label="罚息利率">{loan.penaltyRate}%</Descriptions.Item><Descriptions.Item label="复息利率">{loan.compoundRate}%</Descriptions.Item></Descriptions></Card>
    <Card title="还款方案" size="small" className="debt-approval-card"><AlertScheme message={scheme} /><Table size="small" pagination={false} dataSource={[{ key: 1, sequence: 1, term: '1-12期', method: '先息后本', ratio: '0%' }, { key: 2, sequence: 2, term: '13-24期', method: '等额本金', ratio: '40%' }, { key: 3, sequence: 3, term: '25-36期', method: '等额本金', ratio: '60%' }]} columns={[{ title: '阶段', dataIndex: 'sequence' }, { title: '起止期数', dataIndex: 'term' }, { title: '还款方式', dataIndex: 'method' }, { title: '本金比例', dataIndex: 'ratio' }]} /></Card>
    <Card title="原借据信息" size="small" className="debt-approval-card"><Table size="small" pagination={false} rowKey="id" dataSource={loan.originalLoans} columns={[{ title: '借据号', dataIndex: 'loanNo' }, { title: '借据状态', dataIndex: 'loanStatus' }, { title: '贷款余额', dataIndex: 'loanBalance', render: (value: number) => money(value) }, { title: '应还本金', dataIndex: 'duePrincipal', render: (value: number) => money(value) }, { title: '归还利息', dataIndex: 'repayInterest', render: (value: number) => money(value) }]} /></Card>
  </div>;
}

function AlertScheme({ message: text }: { message: string }) {
  return <div className="debt-scheme-alert">还款方案：{text}</div>;
}

export default function DebtApprovalPage() {
  const [records, setRecords] = useState<DebtApprovalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DebtApprovalRecord>();
  const [loan, setLoan] = useState<DebtLoan>();
  useEffect(() => { void getDebtApprovalRecords().then((response) => setRecords(response.data)).catch(() => message.error('审批记录加载失败')).finally(() => setLoading(false)); }, []);
  useEffect(() => { if (!selected?.debtLoanId) { setLoan(undefined); return; } void getDebtLoan(selected.debtLoanId).then((response) => setLoan(response.data)); }, [selected]);
  const columns: TableColumnsType<DebtApprovalRecord> = [
    { title: '序号', dataIndex: 'id', width: 70 }, { title: '案件贷后贷', dataIndex: 'caseType', width: 130 }, { title: '案件子类型', dataIndex: 'caseSubtype', width: 180, render: (value: string) => value === '债务重组审批记录' ? <Tag color="blue">{value}</Tag> : value }, { title: '客户名称', dataIndex: 'customerName' }, { title: '客户号', dataIndex: 'customerNo' }, { title: '借据号', dataIndex: 'loanNo' }, { title: '申请日期', dataIndex: 'applyDate' }, { title: '审批状态', dataIndex: 'approvalStatus', render: (value: DebtApprovalRecord['approvalStatus']) => <Tag color={value === '待审批' ? 'orange' : 'green'}>{value}</Tag> }, { title: '操作', key: 'action', fixed: 'right', width: 120, render: (_: unknown, record) => <OperationCell items={[{ key: 'view', label: '查看审批详情' }]} onAction={() => setSelected(record)} /> },
  ];
  const closeDrawer = () => setSelected(undefined);
  const handleApprove = () => { message.success('审批操作已提交'); closeDrawer(); };
  return <div className="page-container"><Card className="table-card" bordered={false}><Table size="small" rowKey="id" bordered loading={loading} columns={columns} dataSource={records} scroll={{ x: 1100 }} pagination={false} /></Card><Drawer title={selected ? `${selected.caseSubtype} - 审批详情` : '审批详情'} open={Boolean(selected)} placement="right" onClose={closeDrawer} footer={<Space><Button onClick={closeDrawer}>关闭</Button>{selected?.approvalStatus === '待审批' && <Button type="primary" onClick={handleApprove}>同意</Button>}</Space>} width="min(1100px, 100vw)" destroyOnClose>{loan ? <DebtApprovalContent loan={loan} /> : <div className="route-loading">审批内容加载中...</div>}</Drawer></div>;
}
