import { Alert, Button, Card, Form, Input, Modal, Space, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { useState } from 'react';
import OperationCell from '../../../components/OperationCell';
import ConsumeInterestDetail from './Detail';
import { getConsumeSubsidies, terminateConsumeSubsidy } from '../../../mock';
import type { ConsumeSubsidyRecord, SubsidyListParams } from '../../../types';
import { dateFilter, institutionFilter, inputFilter, SubsidyListPage, type SubsidyActionHandlers, statusTag } from '../SubsidyCommon';

const fetchConsumeSubsidies = (params: { page: number; pageSize: number; [key: string]: unknown }) => getConsumeSubsidies(params as SubsidyListParams);
const money = (value: number) => `¥${value.toFixed(2)}`;

export default function ConsumeInterest() {
  const [record, setRecord] = useState<ConsumeSubsidyRecord>();
  const [form] = Form.useForm<{ reason: string }>();
  const [submitting, setSubmitting] = useState(false);
  const columns = (handlers: SubsidyActionHandlers<ConsumeSubsidyRecord>): TableColumnsType<ConsumeSubsidyRecord> => [
    { title: 'CROS消费流水号', dataIndex: 'crosConsumptionNo', width: 155 }, { title: '银行消费流水号', dataIndex: 'bankConsumptionNo', render: (value: string) => value || '-', width: 155 }, { title: '发票编号', dataIndex: 'invoiceNo', render: (value: string) => value || '-', width: 130 }, { title: '客户号', dataIndex: 'customerNo', width: 100 }, { title: '客户名称', dataIndex: 'customerName', width: 90 }, { title: '消费日期', dataIndex: 'consumptionDate', width: 110 }, { title: '消费金额', dataIndex: 'consumptionAmount', render: money, width: 100 }, { title: '申请贴息消费金额', dataIndex: 'appliedSubsidyAmount', render: money, width: 120 }, { title: '消费用途', dataIndex: 'purpose', width: 100 }, { title: '商户名称', dataIndex: 'merchantName', width: 110 }, { title: '核定总金额', dataIndex: 'approvedAmount', render: money, width: 100 }, { title: '核定日期', dataIndex: 'approvedAt', width: 110 }, { title: '预计贴息总金额', dataIndex: 'expectedSubsidyAmount', render: money, width: 120 }, { title: '应贴息总金额', dataIndex: 'dueSubsidyAmount', render: money, width: 110 }, { title: '已贴息总金额', dataIndex: 'actualSubsidyAmount', render: money, width: 110 }, { title: '退款总金额', dataIndex: 'refundAmount', render: money, width: 100 }, { title: '应收回贴息总金额', dataIndex: 'dueRecoveryAmount', render: money, width: 130 }, { title: '已收回贴息总金额', dataIndex: 'actualRecoveryAmount', render: money, width: 130 }, { title: '消费状态', dataIndex: 'status', render: statusTag, width: 90 },
    { title: '操作', key: 'actions', fixed: 'right', width: 170, render: (_, current) => <OperationCell items={[{ key: 'view', label: '查看详情' }, ...(current.status === '成功' ? [{ key: 'terminate', label: '终止贴息' }] : [])]} onAction={(key) => key === 'view' ? handlers.openAction('view', current) : (() => { form.resetFields(); setRecord(current); })()} /> },
  ];
  const handleTerminate = async () => {
    if (!record) return;
    try {
      const { reason } = await form.validateFields();
      setSubmitting(true);
      const response = await terminateConsumeSubsidy(record.id, reason);
      if (response.code !== 0) { message.error(response.message); return; }
      message.success('终止贴息已提交旁路审批'); setRecord(undefined);
    } catch { /* 表单校验失败时保留弹窗 */ } finally { setSubmitting(false); }
  };
  return <>
    <SubsidyListPage<ConsumeSubsidyRecord> title="消费贴息" description="查询每笔消费的贴息情况、关联贷款消费分配及占用情况" filters={[institutionFilter, inputFilter('customerNo', '客户号'), inputFilter('idCardNo', '身份证号'), inputFilter('mobile', '手机号'), inputFilter('crosConsumptionNo', 'CROS消费流水号'), inputFilter('bankConsumptionNo', '银行交易流水号'), inputFilter('invoiceNo', '发票编号'), dateFilter('consumptionDate', '消费日期')]} columns={columns} fetcher={fetchConsumeSubsidies} detailTitle="消费贴息详情" detailWidth="min(1180px, 100vw)" detailRenderer={(record) => <ConsumeInterestDetail recordId={record.id} embedded />} />
    <Modal title="终止贴息" open={Boolean(record)} onCancel={() => setRecord(undefined)} confirmLoading={submitting} onOk={() => void handleTerminate()} okText="提交审批" cancelText="取消" destroyOnClose>
      <Alert type="warning" showIcon message="终止贴息将触发旁路审批，并可能影响后续贴息及资金收回，请确认操作风险。" />
      <Card size="small" title="消费信息" className="subsidy-modal-section"><div className="modal-info-grid"><div><span>CROS消费流水号</span><strong>{record?.crosConsumptionNo}</strong></div><div><span>客户名称</span><strong>{record?.customerName}</strong></div><div><span>消费金额</span><strong>{record && money(record.consumptionAmount)}</strong></div><div><span>已贴息总金额</span><strong>{record && money(record.actualSubsidyAmount)}</strong></div></div></Card>
      <Form form={form} layout="vertical"><Form.Item name="reason" label="终止原因" rules={[{ required: true, whitespace: true, message: '请输入终止原因' }]}><Input.TextArea rows={4} placeholder="请输入终止贴息原因" /></Form.Item></Form>
    </Modal>
  </>;
}
