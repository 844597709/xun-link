import {
  Button, Card, Col, DatePicker, Descriptions, Form, Input, InputNumber, Modal,
  Radio, Row, Select, Space, Table, Tag, Typography, Upload, message,
} from 'antd';
import type { TableColumnsType, UploadFile, UploadProps } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  calculateAgilityPlan, formatAgilitySchemeSummary, getAgilityApplication, getAgilityRepaymentSchemes, submitAgilityApplication,
} from '../../../mock/agility';
import type { AgilityApplication, AgilityFormValues, AgilityRepaymentScheme, RepaymentPlan } from '../../../types';

const { Title } = Typography;

export type AgilityAdjustmentMode = 'request' | 'calculate';

export interface AgilityAdjustmentProps {
  mode: AgilityAdjustmentMode;
  embedded?: boolean;
  onClose?: () => void;
  onSubmitted?: () => void;
  loanId?: number;
}

const repaymentMethods = [
  { label: '等额本息', value: '等额本息' },
  { label: '等额本金', value: '等额本金' },
  { label: '自定义还本还息', value: '自定义还本还息' },
  { label: '等额本息气球贷', value: '等额本息气球贷' },
  { label: '等额本金气球贷', value: '等额本金气球贷' },
  { label: '自定义还本还息气球贷', value: '自定义还本还息气球贷' },
  { label: '先息后本等额本息组合（10）', value: '先息后本等额本息组合（10）' },
  { label: '先息后本等额本金组合（11）', value: '先息后本等额本金组合（11）' },
  { label: '按月付息按计划还本（12）', value: '按月付息按计划还本（12）' },
];
const planColumns: TableColumnsType<RepaymentPlan> = [
  { title: '期数', dataIndex: 'period', width: 85, fixed: 'left' },
  { title: '开始日期', dataIndex: 'startDate', width: 115 },
  { title: '到期日期', dataIndex: 'dueDate', width: 115 },
  { title: '本期状态', dataIndex: 'status', width: 95, render: (value: RepaymentPlan['status']) => <Tag color={value === '结清' ? 'green' : 'blue'}>{value}</Tag> },
  { title: '初始本金', dataIndex: 'initialPrincipal', width: 120, render: (value: number) => value.toFixed(2) },
  { title: '初始利息', dataIndex: 'initialInterest', width: 120, render: (value: number) => value.toFixed(2) },
  { title: '剩余本金', dataIndex: 'remainingPrincipal', width: 120, render: (value: number) => value.toFixed(2) },
  { title: '已还金额', dataIndex: 'paidAmount', width: 120, render: (value: number) => value.toFixed(2) },
  { title: '已还本金', dataIndex: 'paidPrincipal', width: 120, render: (value: number) => value.toFixed(2) },
  { title: '已还总息', dataIndex: 'paidInterest', width: 120, render: (value: number) => value.toFixed(2) },
  { title: '应还金额', dataIndex: 'dueAmount', width: 120, render: (value: number) => value.toFixed(2) },
  { title: '应还本金', dataIndex: 'duePrincipal', width: 120, render: (value: number) => value.toFixed(2) },
  { title: '应还利息', dataIndex: 'dueInterest', width: 120, render: (value: number) => value.toFixed(2) },
  { title: '调整总息', dataIndex: 'adjustmentInterest', width: 120, render: (value: number) => value.toFixed(2) },
];

function isCombinationMethod(value: string | undefined) {
  return Boolean(value && ['先息后本等额本息组合（10）', '先息后本等额本金组合（11）', '按月付息按计划还本（12）'].includes(value));
}

function combinationCode(value: string | undefined): '10' | '11' | '12' | undefined {
  if (value?.endsWith('（10）')) return '10';
  if (value?.endsWith('（11）')) return '11';
  if (value?.endsWith('（12）')) return '12';
  return undefined;
}

const stageMethodOptionsByCode: Record<'10' | '11' | '12', Array<{ label: string; value: string }>> = {
  '10': ['先息后本（2）', '等额本息（10）'].map((value) => ({ label: value, value })),
  '11': ['先息后本（2）', '等额本金（11）'].map((value) => ({ label: value, value })),
  '12': ['先息后本（2）'].map((value) => ({ label: value, value })),
};

function createCustomStage(sequence: number, term: number, code: '10' | '11' | '12'): NonNullable<AgilityFormValues['customRepaymentStages']>[number] {
  return {
    sequence,
    startPeriod: sequence === 1 ? 1 : Math.min(term, (sequence - 1) * Math.floor(term / 2) + 1),
    endPeriod: term,
    repaymentMethod: stageMethodOptionsByCode[code][0]?.value,
    principalRatio: 0,
  };
}

function CustomSchemeEditor({ code, term }: { code: '10' | '11' | '12'; term: number }) {
  const form = Form.useFormInstance<AgilityFormValues>();
  const stages = Form.useWatch('customRepaymentStages', form) ?? [];
  const ratio = stages.reduce((sum, stage) => sum + (Number(stage?.principalRatio) || 0), 0);
  return <Form.List name="customRepaymentStages">
    {(fields, { add, remove }) => {
      const lastStage = stages[stages.length - 1];
      const canAdd = fields.length === 0 || Number(lastStage?.endPeriod) < term;
      return <div className="custom-plan-editor">
        <div className="plan-item-header">
          <Space><strong>其他（自定义还款方案）</strong><Typography.Text type={Math.abs(ratio - 100) < 0.0001 ? 'success' : 'danger'}>本金占比：{ratio.toFixed(2)}% {Math.abs(ratio - 100) < 0.0001 ? '✓' : '✕'}</Typography.Text></Space>
          <Button type="link" onClick={() => add(createCustomStage(fields.length + 1, term, code))} disabled={!canAdd}>增加阶段</Button>
        </div>
        <div className="stage-table-scroll"><table className="stage-table"><thead><tr><th>阶段</th><th>起止期数</th><th>还款方式</th><th>本金占比（%）</th><th>操作</th></tr></thead><tbody>{fields.map((field, index) => <tr key={field.key}>
          <td>阶段 {index + 1}</td>
          <td><Form.Item {...field} name={[field.name, 'startPeriod']} rules={[{ required: true, message: '请输入起始期数' }]}><InputNumber min={1} max={term} precision={0} /></Form.Item><span> - </span><Form.Item {...field} name={[field.name, 'endPeriod']} rules={[{ required: true, message: '请输入结束期数' }]}><InputNumber min={1} max={term} precision={0} /></Form.Item></td>
          <td><Form.Item {...field} name={[field.name, 'repaymentMethod']} rules={[{ required: true, message: '请选择还款方式' }]}><Select options={stageMethodOptionsByCode[code]} /></Form.Item></td>
          <td><Form.Item {...field} name={[field.name, 'principalRatio']} rules={[{ required: true, message: '请输入本金占比' }]}><InputNumber min={0} max={100} precision={2} addonAfter="%" /></Form.Item></td>
          <td><Button type="link" danger size="small" disabled={fields.length <= 1} onClick={() => remove(field.name)}>删除</Button></td>
        </tr>)}</tbody></table></div>
      </div>;
    }}
  </Form.List>;
}

function CombinationPlanSelector({ loan }: { loan: AgilityApplication }) {
  const form = Form.useFormInstance<AgilityFormValues>();
  const method = Form.useWatch('newRepaymentMethod', form);
  const newTerm = Form.useWatch('newRemainingTerm', form);
  const code = combinationCode(method);
  const selectedPlan = Form.useWatch('repaymentPlanId', form);
  const [schemes, setSchemes] = useState<AgilityRepaymentScheme[]>([]);
  const [expandedSchemeId, setExpandedSchemeId] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!code) {
      setSchemes([]);
      setExpandedSchemeId(undefined);
      form.setFieldsValue({ repaymentPlanId: undefined, customRepaymentStages: undefined });
      return () => { active = false; };
    }
    const term = Number(newTerm) || loan.originalRemainingTerm;
    setLoading(true);
    void getAgilityRepaymentSchemes(code, loan.originalRemainingTerm, term).then((response) => {
      if (!active) return;
      const nextSchemes = response.code === 0 && response.data.length > 0
        ? response.data
        : [{ id: 'custom', name: '其他（自定义还款方案）', stages: [], custom: true }];
      setSchemes(nextSchemes);
      const current = form.getFieldValue('repaymentPlanId');
      const defaultId = nextSchemes.some((item) => item.id === current) ? current : nextSchemes[0]?.id;
      const firstSystemScheme = nextSchemes.find((item) => !item.custom);
      setExpandedSchemeId(firstSystemScheme?.id);
      form.setFieldsValue({
        repaymentPlanId: defaultId,
        customRepaymentStages: defaultId === 'custom' ? [createCustomStage(1, term, code)] : undefined,
      });
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [code, form, loan.originalRemainingTerm, newTerm]);

  useEffect(() => {
    if (selectedPlan !== 'custom' || !code) return;
    const currentStages = form.getFieldValue('customRepaymentStages');
    if (!Array.isArray(currentStages) || currentStages.length === 0) {
      form.setFieldsValue({ customRepaymentStages: [createCustomStage(1, Number(newTerm) || loan.originalRemainingTerm, code)] });
    }
  }, [code, form, loan.originalRemainingTerm, newTerm, selectedPlan]);

  if (!code) return null;
  const term = Number(newTerm) || loan.originalRemainingTerm;
  return <Card title="选择还款方案" size="small" className="repayment-plan-selector">
    {loading ? <div className="scheme-loading">正在加载系统还款方案...</div> : <Form.Item name="repaymentPlanId" rules={[{ required: true, message: '请选择还款方案' }]}>
      <Radio.Group style={{ width: '100%' }} onChange={(event) => {
        if (event.target.value !== 'custom') {
          setExpandedSchemeId(event.target.value);
        } else {
          setExpandedSchemeId(undefined);
        }
        form.setFieldsValue({ customRepaymentStages: event.target.value === 'custom' ? [createCustomStage(1, term, code)] : undefined });
      }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {schemes.map((scheme) => {
            if (scheme.custom) {
              return <Radio key={scheme.id} value={scheme.id}>其他（自定义还款方案）</Radio>;
            }

            const expanded = expandedSchemeId === scheme.id;
            return <Radio key={scheme.id} value={scheme.id}>
              <Card
                size="small"
                title={scheme.name}
                className="repayment-plan-option"
                onClick={() => setExpandedSchemeId(scheme.id)}
              >
                {expanded ? <Table rowKey="sequence" columns={[
                  { title: '阶段', dataIndex: 'sequence', width: 70 },
                  { title: '起止期数', key: 'period', render: (_: unknown, record: AgilityRepaymentScheme['stages'][number]) => `${record.startPeriod}-${record.endPeriod}` },
                  { title: '还款方式', dataIndex: 'repaymentMethod' },
                  { title: '本金比例', key: 'ratio', render: (_: unknown, record: AgilityRepaymentScheme['stages'][number]) => `${record.principalRatio}%` },
                ]} dataSource={scheme.stages} pagination={false} size="small" /> : <Typography.Text className="scheme-summary">{formatAgilitySchemeSummary(scheme)}</Typography.Text>}
              </Card>
            </Radio>;
          })}
        </Space>
      </Radio.Group>
    </Form.Item>}
    {!loading && selectedPlan === 'custom' && <CustomSchemeEditor code={code} term={term} />}
  </Card>;
}

function BasicInfo({ loan }: { loan: AgilityApplication }) {
  return <Card title="基础信息" className="form-section-card">
    <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="small">
      <Descriptions.Item label="机构名称">{loan.institutionName}</Descriptions.Item>
      <Descriptions.Item label="机构号">{loan.institutionCode}</Descriptions.Item>
      <Descriptions.Item label="客户名称">{loan.customerName}</Descriptions.Item>
      <Descriptions.Item label="客户号">{loan.customerNo}</Descriptions.Item>
      <Descriptions.Item label="借据号">{loan.loanNo}</Descriptions.Item>
      <Descriptions.Item label="贷款余额">{loan.loanBalance.toLocaleString('zh-CN')} 元</Descriptions.Item>
    </Descriptions>
  </Card>;
}

function RichTextEditor({ value = '', onChange }: { value?: string; onChange?: (value: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value;
  }, [value]);
  return <div className="rich-text-editor">
    <div ref={editorRef} className="rich-text-content" contentEditable suppressContentEditableWarning onInput={(event) => onChange?.(event.currentTarget.innerHTML)} />
  </div>;
}

function AdjustmentInfo({ loan, mode, fileList, beforeUpload, onRemove }: {
  loan: AgilityApplication;
  mode: AgilityAdjustmentMode;
  fileList: UploadFile[];
  beforeUpload: UploadProps['beforeUpload'];
  onRemove: () => void;
}) {
  return <Card title="调整信息" className="form-section-card">
    <Row gutter={[20, 0]}>
      <Col xs={24} md={12}><Form.Item label="原还款方式"><Input value={loan.originalRepaymentMethod || loan.repaymentMethod} disabled /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item name="newRepaymentMethod" label="新还款方式" rules={[{ required: true, message: '请选择新还款方式' }]}><Select options={repaymentMethods} placeholder="请选择新还款方式" /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item label="原剩余期数(期)"><InputNumber value={loan.originalRemainingTerm} disabled style={{ width: '100%' }} /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item name="newRemainingTerm" label="新剩余期数(期)" rules={[{ required: true, message: '请选择新剩余期数' }]}><Select options={Array.from({ length: 60 }, (_, index) => ({ label: `${index + 1}期`, value: index + 1 }))} placeholder="请选择新剩余期数" /></Form.Item></Col>
      <Col xs={24}><CombinationPlanSelector loan={loan} /></Col>
      <Col xs={24} md={12}><Form.Item name="interestReliefAmount" label="利息减免" rules={[{ required: true, message: '请输入利息减免金额' }]}><InputNumber min={0} precision={2} addonAfter="元" disabled={!loan.interestReliefEnabled} style={{ width: '100%' }} /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item name="extensionPeriods" label="首期延迟时间(月)" rules={[{ required: true, message: '请输入首期延迟时间' }]}><InputNumber min={0} precision={0} addonAfter="月" disabled={!loan.firstPaymentDelayAllowed} style={{ width: '100%' }} /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item label="原正常利率"><InputNumber value={loan.originalNormalRate} addonAfter="%" disabled style={{ width: '100%' }} /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item name="newNormalRate" label="新正常利率" rules={[{ required: true, message: '请输入新正常利率' }, { type: 'number', min: 0, message: '利率不能为负数' }]}><InputNumber min={0} precision={4} addonAfter="%" style={{ width: '100%' }} /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item label="原罚息利率"><InputNumber value={loan.originalPenaltyRate} addonAfter="%" disabled style={{ width: '100%' }} /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item name="newPenaltyRate" label="新罚息利率" rules={[{ required: true, message: '请输入新罚息利率' }, { type: 'number', min: 0, message: '利率不能为负数' }]}><InputNumber min={0} precision={4} addonAfter="%" style={{ width: '100%' }} /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item label="原复息利率"><InputNumber value={loan.originalCompoundRate} addonAfter="%" disabled style={{ width: '100%' }} /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item name="newCompoundRate" label="新复息利率" rules={[{ required: true, message: '请输入新复息利率' }, { type: 'number', min: 0, message: '利率不能为负数' }]}><InputNumber min={0} precision={4} addonAfter="%" style={{ width: '100%' }} /></Form.Item></Col>
      {mode === 'request' && <>
        <Col xs={24} md={12}><Form.Item name="expiryDate" label="失效日期" rules={[{ required: true, message: '请选择失效日期' }]}><DatePicker placeholder="请选择日期" style={{ width: '100%' }} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="reason" label="申请原因" rules={[{ required: true, validator: (_, value) => typeof value === 'string' && value.replace(/<[^>]*>/g, '').trim() ? Promise.resolve() : Promise.reject(new Error('请输入申请原因')) }]}><RichTextEditor /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item label="资料上传" extra="仅支持 .zip 压缩包文件">
          <Upload accept=".zip" maxCount={1} fileList={fileList} beforeUpload={beforeUpload} onRemove={onRemove}><Button>选择 ZIP 附件</Button></Upload>
        </Form.Item></Col>
      </>}
    </Row>
  </Card>;
}


export default function AgilityAdjustment({ mode, embedded = false, onClose, onSubmitted, loanId: loanIdProp }: AgilityAdjustmentProps) {
  const [form] = Form.useForm<AgilityFormValues>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState<AgilityApplication>();
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const [plan, setPlan] = useState<RepaymentPlan[]>([]);
  const [planPage, setPlanPage] = useState(1);
  const [planPageSize, setPlanPageSize] = useState(10);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const loanId = loanIdProp ?? (Number(searchParams.get('loanId')) || 1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void getAgilityApplication(loanId).then((response) => {
      if (!active) return;
      setLoan(response.data);
      form.setFieldsValue({
        newRepaymentMethod: response.data.newRepaymentMethod,
        newRemainingTerm: response.data.newRemainingTerm,
        interestReliefAmount: 0,
        extensionPeriods: 0,
        newNormalRate: response.data.originalNormalRate,
        newPenaltyRate: response.data.originalPenaltyRate,
        newCompoundRate: response.data.originalCompoundRate,
        repaymentPlanId: undefined,
      });
      setLoading(false);
    });
    return () => { active = false; };
  }, [form, loanId]);

  const handleCalculate = async () => {
    try {
      const calculateFields = ['newRepaymentMethod', 'newRemainingTerm', 'interestReliefAmount', 'extensionPeriods', 'newNormalRate', 'newPenaltyRate', 'newCompoundRate'];
      if (isCombinationMethod(form.getFieldValue('newRepaymentMethod'))) calculateFields.push('repaymentPlanId');
      const values = await form.validateFields(calculateFields);
      if (!loan) return;
      setCalculating(true);
      const response = await calculateAgilityPlan(loan.id, values);
      if (response.code !== 0) {
        setCalculated(false);
        setPlan([]);
        Modal.error({ title: '贷款试算校验失败', content: response.message });
        return;
      }
      setPlan(response.data);
      setPlanPage(1);
      setCalculated(true);
      message.success('贷款试算完成，已生成新还款计划');
    } catch {
      // Ant Design Form 已在字段下方展示校验信息。
    } finally {
      setCalculating(false);
    }
  };

  const submitValues = async (values: AgilityFormValues) => {
    if (!loan) return;
    setSubmitting(true);
    try {
      const response = await submitAgilityApplication(loan.id, values);
      if (response.code !== 0) {
        message.error(response.message);
        return;
      }
      message.success(response.message);
      if (onSubmitted) onSubmitted();
      else navigate('/post-loan/agility-request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!calculated) {
      message.warning('请先进行贷款试算');
      return;
    }
    try {
      const values = await form.validateFields();
      if (!loan) return;
      if (plan.length > loan.maxTerm) {
        if (!loan.allowExceedMaxTerm) {
          Modal.error({ title: '无法提交调整申请', content: `新还款计划总期数（${plan.length}期）超过产品最长贷款期限（${loan.maxTerm}期），请调整后再提交。` });
          return;
        }
        Modal.confirm({
          title: '确认提交超期计划',
          content: `试算后的新还款计划总期数为${plan.length}期，已超过产品最长贷款期限${loan.maxTerm}期，确认继续提交吗？`,
          onOk: () => submitValues(values),
        });
        return;
      }
      await submitValues(values);
    } catch {
      // 表单校验信息已由 Form 展示。
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
  const visiblePlan = plan.slice((planPage - 1) * planPageSize, planPage * planPageSize);

  return <div className={`page-container adjustment-page${embedded ? ' embedded-adjustment-page' : ''}`}>
    {!embedded && <div className="page-heading">
      <div>
        <Title level={3}>{mode === 'request' ? '调整申请' : '贷款试算'}</Title>
        <Typography.Paragraph type="secondary">{mode === 'request' ? '填写灵动重组调整信息并提交审批' : '预览调整后的贷款还款计划，不会提交审批'}</Typography.Paragraph>
      </div>
      <Tag color={mode === 'request' ? 'blue' : 'cyan'}>{mode === 'request' ? '申请模式' : '试算模式'}</Tag>
    </div>}
    <Form
      form={form}
      layout="vertical"
      onValuesChange={(changedValues) => {
        const calculationKeys = ['newRepaymentMethod', 'newRemainingTerm', 'interestReliefAmount', 'extensionPeriods', 'newNormalRate', 'newPenaltyRate', 'newCompoundRate', 'repaymentPlanId', 'customRepaymentStages'];
        if (Object.keys(changedValues).some((key) => calculationKeys.includes(key))) {
          setCalculated(false);
          setPlan([]);
        }
      }}
    >
      <div className="adjustment-form-scroll">
        <BasicInfo loan={loan} />
        <AdjustmentInfo loan={loan} mode={mode} fileList={fileList} beforeUpload={beforeUpload} onRemove={() => setFileList([])} />
        {calculated && <Card title="新还款计划" className="form-section-card plan-card">
          <Table<RepaymentPlan>
            rowKey="period"
            columns={planColumns}
            dataSource={visiblePlan}
            pagination={{
              current: planPage,
              pageSize: planPageSize,
              total: plan.length,
              showSizeChanger: { options: [10, 20, 50].map((value) => ({ value, label: `${value}条/页` })) },
              showTotal: (total) => `共${total}期`,
              onChange: (page, size) => { setPlanPage(page); setPlanPageSize(size); },
            }}
            bordered
            size="small"
            scroll={{ x: 1700, y: 420 }}
          />
        </Card>}
      </div>
      <Card className="form-actions-card">
        <Space>
          <Button onClick={() => onClose ? onClose() : navigate('/post-loan/agility-request')}>取消</Button>
          <Button type="primary" ghost loading={calculating} onClick={() => void handleCalculate()}>贷款试算</Button>
          {mode === 'request' && <Button type="primary" disabled={!calculated} loading={submitting} onClick={() => void handleSubmit()}>确定</Button>}
        </Space>
      </Card>
    </Form>
  </div>;
}
