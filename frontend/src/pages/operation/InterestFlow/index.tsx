import { Alert, Button, Card, Checkbox, Drawer, Form, Input, Select, Space, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { useState } from 'react';
import OperationCell from '../../../components/OperationCell';
import InterestFlowDetail from './Detail';
import { getSubsidyFlows, subsidyRetryCards, submitManualRecovery, submitManualSubsidy } from '../../../mock';
import type { SubsidyFlow, SubsidyListParams } from '../../../types';
import { institutionFilter, inputFilter, productFilter, selectFilter, SubsidyListPage, type SubsidyActionHandlers, statusTag } from '../SubsidyCommon';

const fetchFlows = (params: { page: number; pageSize: number; [key: string]: unknown }) => getSubsidyFlows(params as SubsidyListParams);
type ManualAction = 'subsidy' | 'recovery';

const money = (value: number, visible = true) => visible ? `¥${value.toFixed(2)}` : '-';

export default function InterestFlow() {
  const [manual, setManual] = useState<{ record: SubsidyFlow; action: ManualAction }>();
  const [form] = Form.useForm<{ remark: string; retryCards: string[]; risk: boolean }>();
  const [submitting, setSubmitting] = useState(false);
  const columns = (handlers: SubsidyActionHandlers<SubsidyFlow>): TableColumnsType<SubsidyFlow> => [
    { title: '机构号', dataIndex: 'institutionCode', width: 90 }, { title: '机构名称', dataIndex: 'institutionName', width: 110 }, { title: '客户号', dataIndex: 'customerNo', width: 100 }, { title: '客户名称', dataIndex: 'customerName', width: 90 },
    { title: '产品号', dataIndex: 'productCode', width: 100 }, { title: '产品名称', dataIndex: 'productName', width: 110 }, { title: '贷款编号', dataIndex: 'loanNo', width: 140 }, { title: 'CROS交易流水号', dataIndex: 'crosTransactionNo', width: 160 },
    { title: '贴息类型', dataIndex: 'type', width: 90 }, { title: '贴息金额', dataIndex: 'expectedSubsidyAmount', render: (value: number, record) => money(value, record.type !== '收回贴息'), width: 110 },
    { title: '补贴息客户卡号', dataIndex: 'subsidyCardNo', render: (value: string, record) => record.type === '补贴息' ? value : '-', width: 140 }, { title: '收回贴息金额', dataIndex: 'expectedRecoveryAmount', render: (value: number, record) => money(value, record.type === '收回贴息'), width: 120 }, { title: '收回贴息客户卡号', dataIndex: 'recoveryCardNo', render: (value: string, record) => record.type === '收回贴息' ? value : '-', width: 140 },
    { title: '贴息时间', dataIndex: 'subsidyAt', width: 155 }, { title: '贴息状态', dataIndex: 'status', render: statusTag, width: 90 },
    { title: '操作', key: 'actions', fixed: 'right', width: 230, render: (_, record) => <OperationCell items={[
      { key: 'view', label: '查看详情' },
      ...(record.type === '补贴息' && record.status === '失败' ? [{ key: 'manualSubsidy', label: '手动补贴息' }] : []),
      ...(record.type === '收回贴息' && record.status === '失败' ? [{ key: 'manualRecovery', label: '手动收回贴息' }] : []),
    ]} onAction={(key) => {
      if (key === 'view') handlers.openAction('view', record);
      else { form.resetFields(); setManual({ record, action: key === 'manualRecovery' ? 'recovery' : 'subsidy' }); }
    }} /> },
  ];
  const handleSubmit = async () => {
    if (!manual) return;
    try {
      const values = await form.validateFields();
      if (!values.risk) { form.setFields([{ name: 'risk', errors: ['请确认资金划扣风险'] }]); return; }
      setSubmitting(true);
      if (manual.action === 'recovery') await submitManualRecovery(manual.record.id, values);
      else await submitManualSubsidy(manual.record.id, values);
      message.success(`${manual.action === 'recovery' ? '手动收回贴息' : '手动补贴息'}已提交至审批流`);
      setManual(undefined);
    } catch { /* 表单校验失败时保留弹窗 */ } finally { setSubmitting(false); }
  };
  const actionTitle = manual?.action === 'recovery' ? '手动收回贴息' : '手动补贴息';
  return <>
    <SubsidyListPage<SubsidyFlow> title="贴息流水" description="查询实时贴息、补贴息和收回贴息流水" filters={[institutionFilter, inputFilter('customerNo', '客户号'), inputFilter('mobile', '手机号'), inputFilter('idCardNo', '证件号码'), productFilter, selectFilter('type', '贴息类型', ['实时贴息', '补贴息', '收回贴息']), selectFilter('status', '贴息状态', ['待处理', '成功', '失败', '处理中', '已冲正', '冲正中'])]} columns={columns} fetcher={fetchFlows} detailTitle="贴息流水详情" detailWidth="min(1180px, 100vw)" hideDetailFooter detailRenderer={(record) => <InterestFlowDetail recordId={record.id} embedded />} />
    <Drawer title={actionTitle} open={Boolean(manual)} onClose={() => setManual(undefined)} width="min(680px, 100vw)" destroyOnClose footer={<Space><Button onClick={() => setManual(undefined)}>取消</Button><Button type="primary" loading={submitting} onClick={() => void handleSubmit()}>确定</Button></Space>}>
      {manual && <Form form={form} layout="vertical"><Card size="small" title="客户信息" className="subsidy-modal-section"><DescriptionsInModal record={manual.record} /></Card><Card size="small" title="贴息信息" className="subsidy-modal-section"><DescriptionsInModal record={manual.record} info action={manual.action} /></Card><Form.Item name="remark" label="操作备注" rules={[{ required: true, message: '请输入操作备注' }]}><Input.TextArea rows={4} placeholder="请输入操作原因" /></Form.Item><Form.Item name="retryCards" label="选择重试银行卡" initialValue={manual.record.retryCards.slice(0, 1)} rules={[{ required: true, type: 'array', min: 1, message: '请选择重试银行卡' }]}><Select mode="multiple" options={subsidyRetryCards.map((value) => ({ label: value, value }))} placeholder="请选择银行卡" /></Form.Item><Form.Item name="risk" valuePropName="checked" rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('请确认资金划扣风险')) }]}><Checkbox>我已确认客户卡号和贴息金额无误，并知晓该操作将直接触发资金划扣</Checkbox></Form.Item><Alert type="warning" showIcon message="重要提醒：该操作将直接触发资金划扣，请确认客户卡号、贴息金额及操作原因正确无误后再提交。" /></Form>}
    </Drawer>
  </>;
}
function DescriptionsInModal({ record, info = false, action = 'subsidy' }: { record: SubsidyFlow; info?: boolean; action?: ManualAction }) {
  const items: Array<[string, string]> = info
    ? action === 'recovery' ? [['预计收回贴息金额', `¥${record.expectedRecoveryAmount.toFixed(2)}`], ['收回贴息客户卡号', record.recoveryCardNo], ['失败原因', record.failureReason]]
      : [['预计贴息金额', `¥${record.expectedSubsidyAmount.toFixed(2)}`], ['补贴息客户卡号', record.subsidyCardNo], ['失败原因', record.failureReason]]
    : [['客户号', record.customerNo], ['客户名称', record.customerName], ['贷款编号', record.loanNo], ['CROS交易流水号', record.crosTransactionNo]];
  return <div className="modal-info-grid">{items.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || '-'}</strong></div>)}</div>;
}
