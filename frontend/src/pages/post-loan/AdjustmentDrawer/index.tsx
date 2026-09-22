import {
  Button, Card, Col, DatePicker, Descriptions, Form, Input, InputNumber, Modal,
  Row, Select, Space, Switch, Table, Tag, Typography, Upload, message,
} from 'antd';
import type { TableColumnsType, UploadFile, UploadProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import {
  adjustmentElementOptions,
  calculateInLoanPlan,
  cycleOptions,
  getInLoanLoan,
  principalRatioOptions,
  repaymentMethodOptions,
  submitInLoanAdjustment,
} from '../../../mock/inLoanAdjustment';
import type { InLoanAdjustmentValues, InLoanLoan, InLoanRepaymentPlan } from '../../../types';

export type InLoanAdjustmentMode = 'request' | 'calculate';

interface AdjustmentDrawerProps {
  mode: InLoanAdjustmentMode;
  loanId: number;
  embedded?: boolean;
  onClose?: () => void;
  onSubmitted?: () => void;
}

const planColumns: TableColumnsType<InLoanRepaymentPlan> = [
  { title: '期数', dataIndex: 'period', width: 70, fixed: 'left' },
  { title: '开始日期', dataIndex: 'startDate', width: 110 },
  { title: '到期日期', dataIndex: 'dueDate', width: 110 },
  { title: '本期状态', dataIndex: 'status', width: 90, render: (value: InLoanRepaymentPlan['status']) => <Tag color={value === '结清' ? 'green' : 'blue'}>{value}</Tag> },
  { title: '初始本息', dataIndex: 'initialTotal', width: 110, render: (value: number) => value.toFixed(2) },
  { title: '初始本金', dataIndex: 'initialPrincipal', width: 110, render: (value: number) => value.toFixed(2) },
  { title: '初始利息', dataIndex: 'initialInterest', width: 110, render: (value: number) => <Typography.Text type="danger">{value.toFixed(2)}</Typography.Text> },
  { title: '剩余本金', dataIndex: 'remainingPrincipal', width: 110, render: (value: number) => value.toFixed(2) },
  { title: '已还总额', dataIndex: 'paidAmount', width: 110, render: (value: number) => value.toFixed(2) },
  { title: '已还本金', dataIndex: 'paidPrincipal', width: 110, render: (value: number) => value.toFixed(2) },
  { title: '已还利息', dataIndex: 'paidInterest', width: 110, render: (value: number) => value.toFixed(2) },
  { title: '应还总额', dataIndex: 'dueAmount', width: 110, render: (value: number) => value.toFixed(2) },
  { title: '应还本金', dataIndex: 'duePrincipal', width: 110, render: (value: number) => value.toFixed(2) },
  { title: '应还利息', dataIndex: 'dueInterest', width: 110, render: (value: number) => <Typography.Text type="danger">{value.toFixed(2)}</Typography.Text> },
];

function BasicInfo({ loan }: { loan: InLoanLoan }) {
  return <Card title="基础信息" className="form-section-card">
    <Descriptions column={{ xs: 1, sm: 2, lg: 2 }} size="small">
      <Descriptions.Item label="机构名称">{loan.institutionName}</Descriptions.Item>
      <Descriptions.Item label="机构号">{loan.institutionCode}</Descriptions.Item>
      <Descriptions.Item label="客户名称">{loan.customerName}</Descriptions.Item>
      <Descriptions.Item label="客户号">{loan.customerNo}</Descriptions.Item>
      <Descriptions.Item label="借据号">{loan.loanNo}</Descriptions.Item>
      <Descriptions.Item label="贷款余额">{loan.loanBalance.toLocaleString('zh-CN')} 元</Descriptions.Item>
    </Descriptions>
  </Card>;
}

function RateFields({ loan }: { loan: InLoanLoan }) {
  return <Card title="贷款利率变更" size="small" className="in-loan-sub-card">
    <Row gutter={[20, 0]}>
      <Col xs={24} md={12}><Form.Item label="原正常利率"><InputNumber value={loan.normalRate} disabled addonAfter="%" style={{ width: '100%' }} /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item name="newNormalRate" label="正常利率(%)" rules={[{ required: true, message: '请输入正常利率' }, { type: 'number', min: 0, message: '利率不能为负数' }]}><InputNumber min={0} precision={4} addonAfter="%" style={{ width: '100%' }} /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item label="原逾期利率"><InputNumber value={loan.penaltyRate} disabled addonAfter="%" style={{ width: '100%' }} /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item name="newPenaltyRate" label="逾期利率(%)" rules={[{ required: true, message: '请输入逾期利率' }, { type: 'number', min: 0, message: '利率不能为负数' }]}><InputNumber min={0} precision={4} addonAfter="%" style={{ width: '100%' }} /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item label="原复息利率"><InputNumber value={loan.compoundRate} disabled addonAfter="%" style={{ width: '100%' }} /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item name="newCompoundRate" label="复息利率(%)" rules={[{ required: true, message: '请输入复息利率' }, { type: 'number', min: 0, message: '利率不能为负数' }]}><InputNumber min={0} precision={4} addonAfter="%" style={{ width: '100%' }} /></Form.Item></Col>
    </Row>
  </Card>;
}

function RepaymentFields({ loan }: { loan: InLoanLoan }) {
  const form = Form.useFormInstance<InLoanAdjustmentValues>();
  const method = Form.useWatch('newRepaymentMethod', form);
  const showRatio = method === '6' || method === '7' || method === '8';
  return <Card title="还款方式变更" size="small" className="in-loan-sub-card">
    <Row gutter={[20, 0]}>
      <Col xs={24} md={12}><Form.Item label="原还款方式"><Input value={loan.repaymentMethod} disabled /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item name="newRepaymentMethod" label="新还款方式" rules={[{ required: true, message: '请选择新还款方式' }]}><Select options={repaymentMethodOptions} placeholder="请选择新还款方式" /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item name="interestCycle" label="还息周期" rules={[{ required: true, message: '请选择还息周期' }]}><Select options={cycleOptions} placeholder="请选择还息周期" /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item name="principalCycle" label="还本周期" rules={[{ required: true, message: '请选择还本周期' }]}><Select options={cycleOptions} placeholder="请选择还本周期" /></Form.Item></Col>
      {showRatio && <Col xs={24} md={12}><Form.Item name="finalPrincipalRatio" label="末期还本比例" rules={[{ required: true, message: '请选择末期还本比例' }]}><Select options={principalRatioOptions} placeholder="请选择末期还本比例" /></Form.Item></Col>}
    </Row>
  </Card>;
}

function TermFields({ loan }: { loan: InLoanLoan }) {
  const form = Form.useFormInstance<InLoanAdjustmentValues>();
  const newTotalTerm = Form.useWatch('newTotalTerm', form);
  const newRemainingTerm = Number(newTotalTerm) - (loan.loanTerm - loan.remainingTerm);
  return <Card title="贷款期数变更" size="small" className="in-loan-sub-card">
    <Row gutter={[20, 0]}>
      <Col xs={24} md={12}><Form.Item label="原总期数"><InputNumber value={loan.loanTerm} disabled addonAfter="期" style={{ width: '100%' }} /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item label="原剩余期数"><InputNumber value={loan.remainingTerm} disabled addonAfter="期" style={{ width: '100%' }} /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item name="newTotalTerm" label="新总期数" rules={[{ required: true, message: '请输入新总期数' }, { type: 'number', min: 1, message: '新总期数必须为正整数' }]}><InputNumber min={1} precision={0} addonAfter="期" style={{ width: '100%' }} /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item label="新剩余期数"><InputNumber value={newRemainingTerm > 0 ? newRemainingTerm : undefined} disabled addonAfter="期" style={{ width: '100%' }} /></Form.Item></Col>
    </Row>
  </Card>;
}

function ReasonEditor({ value = '', onChange }: { value?: string; onChange?: (value: string) => void }) {
  return <div className="rich-text-editor"><div className="rich-text-content" contentEditable suppressContentEditableWarning onInput={(event) => onChange?.(event.currentTarget.textContent ?? '')}>{value}</div></div>;
}

function AdjustmentInfo({ loan, mode, fileList, beforeUpload, onRemove }: {
  loan: InLoanLoan;
  mode: InLoanAdjustmentMode;
  fileList: UploadFile[];
  beforeUpload: UploadProps['beforeUpload'];
  onRemove: () => void;
}) {
  const form = Form.useFormInstance<InLoanAdjustmentValues>();
  const elements = Form.useWatch('adjustmentElements', form) ?? [];
  return <Card title="调整信息" className="form-section-card">
    <Form.Item name="adjustmentElements" label="要素调整" rules={[{ required: true, message: '请选择要素调整项' }]}>
      <Select mode="multiple" options={adjustmentElementOptions} placeholder="请选择要素调整项" />
    </Form.Item>
    {elements.includes('rate') && <RateFields loan={loan} />}
    {elements.includes('repayment') && <RepaymentFields loan={loan} />}
    {elements.includes('term') && <TermFields loan={loan} />}
    {mode === 'request' && <Row gutter={[20, 0]} className="in-loan-common-fields">
      <Col xs={24} md={12}><Form.Item name="expiryDate" label="失效日期" rules={[{ required: true, message: '请选择失效日期' }]}><DatePicker format="YYYY-MM-DD" placeholder="请选择失效日期" style={{ width: '100%' }} /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item name="reason" label="申请原因" rules={[{ required: true, validator: (_, value) => typeof value === 'string' && value.trim() ? Promise.resolve() : Promise.reject(new Error('请输入申请原因')) }]}><ReasonEditor /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item label="资料上传" extra="仅支持 .zip 压缩包文件"><Upload accept=".zip" maxCount={1} fileList={fileList} beforeUpload={beforeUpload} onRemove={onRemove}><Button>选择 ZIP 附件</Button></Upload></Form.Item></Col>
      {elements.includes('term') && <Col xs={24} md={12}><Form.Item name="allowExceedMaxTerm" label="是否允许超过产品最长贷款期限" valuePropName="checked"><Switch checkedChildren="是" unCheckedChildren="否" /></Form.Item></Col>}
    </Row>}
  </Card>;
}

function validateKeys(values: InLoanAdjustmentValues, mode: InLoanAdjustmentMode) {
  const keys: string[] = ['adjustmentElements'];
  if (values.adjustmentElements?.includes('rate')) keys.push('newNormalRate', 'newPenaltyRate', 'newCompoundRate');
  if (values.adjustmentElements?.includes('repayment')) {
    keys.push('newRepaymentMethod', 'interestCycle', 'principalCycle');
    if (['6', '7', '8'].includes(values.newRepaymentMethod ?? '')) keys.push('finalPrincipalRatio');
  }
  if (values.adjustmentElements?.includes('term')) keys.push('newTotalTerm');
  if (mode === 'request') keys.push('expiryDate', 'reason');
  return keys;
}

export default function AdjustmentDrawer({ mode, loanId, embedded = true, onClose, onSubmitted }: AdjustmentDrawerProps) {
  const [form] = Form.useForm<InLoanAdjustmentValues>();
  const [loan, setLoan] = useState<InLoanLoan>();
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [plan, setPlan] = useState<InLoanRepaymentPlan[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void getInLoanLoan(loanId).then((response) => {
      if (!active) return;
      setLoan(response.data);
      form.setFieldsValue({
        adjustmentElements: ['rate', 'repayment', 'term'],
        newNormalRate: response.data.normalRate,
        newPenaltyRate: response.data.penaltyRate,
        newCompoundRate: response.data.compoundRate,
        newRepaymentMethod: response.data.repaymentMethod === '6气球贷' ? '6' : response.data.repaymentMethod,
        interestCycle: '按月',
        principalCycle: '按月',
        finalPrincipalRatio: '50%',
        newTotalTerm: response.data.loanTerm,
        allowExceedMaxTerm: false,
      });
      setPlan([]);
      setFileList([]);
      setLoading(false);
    });
    return () => { active = false; };
  }, [form, loanId]);

  const totalInterest = useMemo(() => plan.reduce((sum, item) => sum + item.dueInterest, 0), [plan]);

  const handleCalculate = async () => {
    try {
      const values = await form.validateFields(validateKeys(form.getFieldsValue(), mode));
      if (!loan) return;
      setCalculating(true);
      const response = await calculateInLoanPlan(loan.id, values);
      if (response.code !== 0) {
        setPlan([]);
        Modal.error({ title: '贷款试算校验失败', content: response.message });
        return;
      }
      setPlan(response.data);
      message.success('贷款试算完成，已生成新还款计划');
    } catch {
      // 表单校验信息已在字段下方展示。
    } finally {
      setCalculating(false);
    }
  };

  const submitValues = async (values: InLoanAdjustmentValues) => {
    if (!loan) return;
    setSubmitting(true);
    try {
      const response = await submitInLoanAdjustment(loan.id, { ...values, attachmentName: fileList[0]?.name });
      if (response.code !== 0) {
        message.error(response.message);
        return;
      }
      message.success(response.message);
      onSubmitted?.();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!plan.length) {
      message.warning('请先进行贷款试算');
      return;
    }
    try {
      const values = await form.validateFields(validateKeys(form.getFieldsValue(), 'request'));
      if (!loan) return;
      const totalTerm = values.adjustmentElements.includes('term') ? Number(values.newTotalTerm) : loan.loanTerm;
      if (totalTerm > loan.maxTerm) {
        const warning = `借据新还款计划总期数(${totalTerm}期)已超过产品要素的最长贷款期限(${loan.maxTerm}期)`;
        if (!values.allowExceedMaxTerm) {
          Modal.error({ title: '无法提交调整申请', content: `${warning}，请调整后重新提交` });
          return;
        }
        Modal.confirm({
          title: '确认提交超期计划',
          content: `${warning}，是否确认继续提交？`,
          onOk: () => submitValues(values),
        });
        return;
      }
      await submitValues(values);
    } catch {
      // 表单校验信息已在字段下方展示。
    }
  };

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      message.error('附件仅支持 .zip 压缩包格式');
      return Upload.LIST_IGNORE;
    }
    setFileList([file]);
    return false;
  };

  if (loading || !loan) return <div className="route-loading">贷款信息加载中...</div>;
  return <div className={`page-container adjustment-page${embedded ? ' embedded-adjustment-page' : ''}`}>
    {!embedded && <div className="page-heading"><div><Typography.Title level={3}>{mode === 'request' ? '调整申请' : '贷款试算'}</Typography.Title><Typography.Paragraph type="secondary">{mode === 'request' ? '填写在贷要素调整信息并提交' : '预览调整后的贷款还款计划'}</Typography.Paragraph></div></div>}
    <Form form={form} layout="vertical" onValuesChange={(changedValues, allValues) => {
      if (Object.prototype.hasOwnProperty.call(changedValues, 'newTotalTerm')) {
        setPlan([]);
      }
      if (Object.prototype.hasOwnProperty.call(changedValues, 'adjustmentElements')) {
        const next = allValues.adjustmentElements ?? [];
        if (!next.includes('rate')) form.resetFields(['newNormalRate', 'newPenaltyRate', 'newCompoundRate']);
        if (!next.includes('repayment')) form.resetFields(['newRepaymentMethod', 'interestCycle', 'principalCycle', 'finalPrincipalRatio']);
        if (!next.includes('term')) form.resetFields(['newTotalTerm', 'allowExceedMaxTerm']);
        setPlan([]);
      }
      if (Object.keys(changedValues).some((key) => ['newNormalRate', 'newPenaltyRate', 'newCompoundRate', 'newRepaymentMethod', 'interestCycle', 'principalCycle', 'finalPrincipalRatio'].includes(key))) setPlan([]);
    }}>
      <div className="adjustment-form-scroll">
        <BasicInfo loan={loan} />
        <AdjustmentInfo loan={loan} mode={mode} fileList={fileList} beforeUpload={beforeUpload} onRemove={() => setFileList([])} />
        {plan.length > 0 && <Card title={<Space><span>新还款计划</span><Typography.Text type="danger">总利息：{totalInterest.toFixed(2)} 元</Typography.Text></Space>} className="form-section-card plan-card">
          <div className="in-loan-plan-table"><Table<InLoanRepaymentPlan> rowKey="period" columns={planColumns} dataSource={plan} pagination={false} bordered size="small" scroll={{ x: 1680 }} /></div>
        </Card>}
      </div>
      <Card className="form-actions-card in-loan-drawer-actions"><Space>
        <Button onClick={onClose}>取消</Button>
        <Button type="primary" ghost loading={calculating} onClick={() => void handleCalculate()}>贷款试算</Button>
        {mode === 'request' && <Button type="primary" loading={submitting} disabled={!plan.length} onClick={() => void handleSubmit()}>确定</Button>}
      </Space></Card>
    </Form>
  </div>;
}
