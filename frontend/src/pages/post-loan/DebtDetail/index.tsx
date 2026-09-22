import { Button, Card, DatePicker, Descriptions, Drawer, Form, Input, Select, Space, Table, Tag, Tooltip, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import OperationCell from '../../../components/OperationCell';
import {
  debtApplicationChannels, debtDetailBusinessTypes, debtGlobalStatuses, debtInstitutions, debtProducts,
  debtStageStatuses, debtTransactionStages, getDebtDetails, type DebtDetailParams,
} from '../../../mock/debt';
import type { DebtDetailRecord, DebtGlobalStatus, DebtTransactionStage } from '../../../types';

const selectOptions = (values: string[]) => values.map((value) => ({ label: value, value }));
const institutionOptions = selectOptions(debtInstitutions);
const productOptions = selectOptions(debtProducts);
const globalStatusOptions = selectOptions(debtGlobalStatuses);
const stageOptions = selectOptions(debtTransactionStages);
const channelOptions = selectOptions(debtApplicationChannels);

function globalStatusTag(value: DebtGlobalStatus) {
  const color = value === '成功' ? 'green' : value === '失败' || value === '过期' ? 'red' : value === '撤销' ? 'default' : 'blue';
  return <Tag color={color}>{value}</Tag>;
}

function textColumn(title: string, dataIndex: keyof DebtDetailRecord, width = 120) {
  return { title, dataIndex, width, ellipsis: true };
}

type DebtDetailAction = 'video' | 'attachment' | 'revoke';

function buildColumns(openAction: (action: DebtDetailAction, record: DebtDetailRecord) => void): TableColumnsType<DebtDetailRecord> {
  return [
    textColumn('机构名称', 'institutionName'), textColumn('机构号', 'institutionCode', 90), textColumn('产品名称', 'productName'), textColumn('产品号', 'productCode', 95),
    textColumn('客户号', 'customerNo', 100), textColumn('客户名称', 'customerName', 100), textColumn('全流水号', 'holoSerialNo', 145), textColumn('原借据号', 'originalLoanNo', 145), textColumn('申请日期', 'applyDate', 110), textColumn('合同状态', 'contractStatus', 95), textColumn('交易阶段', 'transactionStage', 125),
    { title: '新增借款', dataIndex: 'newLoan', width: 120, render: (value: number) => value.toLocaleString('zh-CN') }, { title: '贷款金额', dataIndex: 'loanAmount', width: 120, render: (value: number) => value.toLocaleString('zh-CN') }, { title: '归还总本', dataIndex: 'repayPrincipal', width: 120, render: (value: number) => value.toLocaleString('zh-CN') }, { title: '归还总息', dataIndex: 'repayInterest', width: 120, render: (value: number) => value.toLocaleString('zh-CN') }, { title: '挂账总息', dataIndex: 'ledgerInterest', width: 120, render: (value: number) => value.toLocaleString('zh-CN') },
    textColumn('还款方式', 'repaymentMethod', 120), { title: '未还还款比例', dataIndex: 'unpaidRatio', width: 115, render: (value: number) => `${value * 100}%` }, { title: '贷款期数', dataIndex: 'loanTerm', width: 90, render: (value: number) => `${value}期` }, { title: '延迟时间（月）', dataIndex: 'delayMonths', width: 115 }, textColumn('还息周期', 'interestCycle', 100), textColumn('还本周期', 'principalCycle', 100), { title: '正常利率', dataIndex: 'normalRate', width: 100, render: (value: number) => `${value}%` }, { title: '罚息利率', dataIndex: 'penaltyRate', width: 100, render: (value: number) => `${value}%` }, { title: '复息利率', dataIndex: 'compoundRate', width: 100, render: (value: number) => `${value}%` }, textColumn('失效日期', 'expiryDate', 110), textColumn('签约日期', 'signingDate', 110), textColumn('撤销日期', 'revokeDate', 110),
    textColumn('申请渠道', 'applicationChannel', 130), textColumn('申请原因', 'reason', 200), textColumn('状态备注', 'statusRemark', 160), textColumn('申请人名称', 'applicantName', 110), textColumn('申请人ID', 'applicantId', 110),
    { title: '全局状态', dataIndex: 'globalStatus', width: 100, render: (value: DebtGlobalStatus) => globalStatusTag(value) },
    { title: '视频面签', key: 'videoSign', fixed: 'right', width: 100, render: (_: unknown, record) => record.videoSign ? <OperationCell items={[{ key: 'video', label: '查看' }]} onAction={() => openAction('video', record)} /> : '-' },
    { title: '附件材料', key: 'attachmentName', fixed: 'right', width: 110, render: (_: unknown, record) => record.attachmentName ? <OperationCell items={[{ key: 'attachment', label: '下载' }]} onAction={() => openAction('attachment', record)} /> : '-' },
    { title: '操作', key: 'actions', fixed: 'right', width: 90, render: (_: unknown, record) => record.transactionStage === '客户签约阶段' && record.stageStatus === '待签约' ? <OperationCell items={[{ key: 'revoke', label: '撤销', danger: true }]} onAction={() => openAction('revoke', record)} /> : null },
  ];
}

function FilterPanel({ onSearch }: { onSearch: (values: Record<string, unknown>) => void }) {
  const [form] = Form.useForm();
  const globalStatus = Form.useWatch('globalStatus', form);
  const transactionStage = Form.useWatch('transactionStage', form) as DebtTransactionStage | undefined;
  const stageStatuses = transactionStage ? debtStageStatuses[transactionStage] : [];
  return <Card className="filter-card" bordered={false}><Form form={form} layout="inline" onFinish={onSearch} onValuesChange={(changed) => { if ('transactionStage' in changed) form.setFieldValue('stageStatus', undefined); }} className="filter-form">
    <Space wrap size={[16, 12]}>
      <Form.Item name="institutionName" label="机构"><Select allowClear showSearch optionFilterProp="label" options={institutionOptions} placeholder="请选择机构" /></Form.Item>
      <Form.Item name="customerNo" label="客户号"><Input allowClear placeholder="请输入客户号" /></Form.Item>
      <Form.Item name="idCardNo" label="证件号码"><Input allowClear placeholder="请输入证件号码" /></Form.Item>
      <Form.Item name="mobile" label="手机号"><Input allowClear placeholder="请输入手机号" /></Form.Item>
      <Form.Item name="originalLoanNo" label="原借据号"><Input allowClear placeholder="请输入原借据号" /></Form.Item>
      <Form.Item name="businessType" label="业务类型"><Select allowClear options={selectOptions(debtDetailBusinessTypes)} placeholder="请选择业务类型" /></Form.Item>
      <Form.Item name="applyDate" label="申请日期"><DatePicker.RangePicker placeholder={['开始日期', '结束日期']} /></Form.Item>
      <Form.Item name="globalStatus" label={<span>全局状态 <Tooltip title="如需了解业务流程的整体进展，请使用“全局状态”字段进行筛选，以获取流程的整体状态"><InfoCircleOutlined /></Tooltip></span>}><Select allowClear options={globalStatusOptions} placeholder="请选择全局状态" /></Form.Item>
      <Form.Item name="transactionStage" label="交易阶段"><Select allowClear disabled={Boolean(globalStatus)} options={stageOptions} placeholder="请选择交易阶段" /></Form.Item>
      <Form.Item name="stageStatus" label="阶段状态"><Select allowClear disabled={Boolean(globalStatus) || !transactionStage} options={selectOptions(stageStatuses)} placeholder="请选择阶段状态" /></Form.Item>
      <Form.Item name="applicationChannel" label="申请渠道"><Select allowClear options={channelOptions} placeholder="请选择申请渠道" /></Form.Item>
      <Form.Item name="productName" label="核心产品"><Select allowClear showSearch optionFilterProp="label" options={productOptions} placeholder="请选择核心产品" /></Form.Item>
      <Form.Item><Space><Button type="primary" htmlType="submit">搜索</Button><Button onClick={() => { form.resetFields(); onSearch({}); }}>重置</Button></Space></Form.Item>
    </Space>
  </Form></Card>;
}

export default function DebtDetail() {
  const [data, setData] = useState<DebtDetailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<Record<string, unknown>>({});
  const [actionState, setActionState] = useState<{ action: DebtDetailAction; record: DebtDetailRecord } | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const load = (page: number, pageSize: number, nextQuery: Record<string, unknown>) => { setLoading(true); void getDebtDetails({ page, pageSize, ...nextQuery } as DebtDetailParams).then((response) => { setData(response.data.list); setPagination({ current: response.data.page, pageSize: response.data.pagesize, total: response.data.total }); }).catch(() => message.error('明细加载失败')).finally(() => setLoading(false)); };
  useEffect(() => { load(1, 10, {}); }, []);
  const reload = () => load(pagination.current, pagination.pageSize, query);
  const openAction = (action: DebtDetailAction, record: DebtDetailRecord) => setActionState({ action, record });
  const closeAction = () => setActionState(null);
  const columns = buildColumns(openAction);
  return <div className="page-container"><FilterPanel onSearch={(values) => { const next = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== '')); setQuery(next); setPagination((current) => ({ ...current, current: 1 })); load(1, pagination.pageSize, next); }} /><Card className="table-card" bordered={false}><Table rowKey="id" bordered size="small" loading={loading} columns={columns} dataSource={data} scroll={{ x: 3900 }} pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true, showTotal: (total) => `共 ${total} 条`, onChange: (page, pageSize) => { setPagination((current) => ({ ...current, current: page, pageSize })); load(page, pageSize, query); } }} /></Card>
    <Drawer title={actionState?.action === 'video' ? '视频面签' : actionState?.action === 'attachment' ? '附件材料' : '撤销调整申请'} open={actionState !== null} onClose={closeAction} destroyOnClose width="min(640px, 100vw)">
      {actionState?.action === 'video' && <Descriptions column={1} size="small"><Descriptions.Item label="原借据号">{actionState.record.originalLoanNo}</Descriptions.Item><Descriptions.Item label="面签状态"><Tag color="green">已完成</Tag></Descriptions.Item><Descriptions.Item label="查看说明">原型展示：视频面签记录已归档，可由行方系统跳转查看。</Descriptions.Item></Descriptions>}
      {actionState?.action === 'attachment' && <Descriptions column={1} size="small"><Descriptions.Item label="原借据号">{actionState.record.originalLoanNo}</Descriptions.Item><Descriptions.Item label="附件名称">{actionState.record.attachmentName}</Descriptions.Item><Descriptions.Item label="操作说明"><Button type="link" size="small" onClick={() => message.success(`已准备下载 ${actionState.record.attachmentName}`)}>下载附件</Button></Descriptions.Item></Descriptions>}
      {actionState?.action === 'revoke' && <Descriptions column={1} size="small"><Descriptions.Item label="原借据号">{actionState.record.originalLoanNo}</Descriptions.Item><Descriptions.Item label="当前状态">{globalStatusTag(actionState.record.globalStatus)}</Descriptions.Item><Descriptions.Item label="确认信息">确定撤销该笔债务重组调整申请吗？</Descriptions.Item><Button danger type="primary" onClick={() => { message.success('撤销成功'); closeAction(); reload(); }}>确认撤销</Button></Descriptions>}
    </Drawer>
  </div>;
}
