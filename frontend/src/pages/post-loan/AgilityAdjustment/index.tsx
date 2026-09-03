import {
  Alert, Button, Card, Col, DatePicker, Descriptions, Form, Input, InputNumber, Modal,
  Row, Select, Space, Switch, Table, Tag, Typography, Upload, message,
} from 'antd';
import type { TableColumnsType, UploadFile, UploadProps } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  calculateAgilityPlan, getAgilityApplication, submitAgilityApplication,
} from '../../../mock/agility';
import type { AgilityApplication, AgilityFormValues, RepaymentPlan } from '../../../types';

const { Title, Text } = Typography;

export type AgilityAdjustmentMode = 'request' | 'calculate';

export interface AgilityAdjustmentProps {
  mode: AgilityAdjustmentMode;
  embedded?: boolean;
  onClose?: () => void;
  onSubmitted?: () => void;
  loanId?: number;
}

const repaymentMethods = [
  '等额本息', '等额本金', '自定义还本还息', '等额本息气球贷', '等额本金气球贷',
  '自定义还本还息气球贷', '先息后本等额本息组合', '先息后本等额本金组合', '按月付息按计划还本',
];

const planColumns: TableColumnsType<RepaymentPlan> = [
  { title: '期数', dataIndex: 'period', width: 70, fixed: 'left' },
  { title: '开始日期', dataIndex: 'startDate', width: 120 },
  { title: '到期日期', dataIndex: 'dueDate', width: 120 },
  { title: '本期状态', dataIndex: 'status', width: 100, render: (value: RepaymentPlan['status']) => <Tag color={value === '结清' ? 'green' : 'blue'}>{value}</Tag> },
  { title: '初始本息', dataIndex: 'initialTotal', width: 120, render: (value: number) => value.toFixed(2) },
  { title: '初始本金', dataIndex: 'initialPrincipal', width: 120, render: (value: number) => value.toFixed(2) },
  { title: '初始利息', dataIndex: 'initialInterest', width: 120, render: (value: number) => value.toFixed(2) },
  { title: '剩余本金', dataIndex: 'remainingPrincipal', width: 120, render: (value: number) => value.toFixed(2) },
  { title: '已还金额', dataIndex: 'paidAmount', width: 120, render: (value: number) => value.toFixed(2) },
];

function ReadonlyLoanInfo({ loan }: { loan: AgilityApplication }) {
  return (
    <Card title="基础信息" className="form-section-card">
      <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="small">
        <Descriptions.Item label="机构名称">{loan.institutionName}</Descriptions.Item>
        <Descriptions.Item label="机构号">{loan.institutionCode}</Descriptions.Item>
        <Descriptions.Item label="客户名称">{loan.customerName}</Descriptions.Item>
        <Descriptions.Item label="客户号">{loan.customerNo}</Descriptions.Item>
        <Descriptions.Item label="借据号">{loan.loanNo}</Descriptions.Item>
        <Descriptions.Item label="贷款余额"><Text strong>{loan.loanBalance.toLocaleString('zh-CN')} 元</Text></Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

function AdjustmentFields({ loan }: { loan: AgilityApplication }) {
  const form = Form.useFormInstance<AgilityFormValues>();
  const reliefEnabled = Form.useWatch('interestReliefEnabled', form);
  const delayAllowed = Form.useWatch('firstPaymentDelayAllowed', form);
  const collectCompound = Form.useWatch('collectCompoundInterest', form);
  return (
    <Card title="调整信息" className="form-section-card">
      <Typography.Title level={5} className="form-subtitle">还款方式与期数</Typography.Title>
      <Row gutter={[20, 0]}>
        <Col xs={24} md={12}>
          <Form.Item label="原还款方式"><Input value={loan.originalRepaymentMethod} disabled /></Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="newRepaymentMethod" label="新还款方式" rules={[{ required: true, message: '请选择新还款方式' }]}>
            <SelectRepaymentMethod />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="原剩余期数"><Input value={`${loan.originalRemainingTerm} 期`} disabled /></Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="newRemainingTerm" label="新剩余期数" rules={[{ required: true, message: '请输入新剩余期数' }, { type: 'number', min: 1, message: '请输入正整数' }, { validator: (_, value) => value == null || Number.isInteger(value) ? Promise.resolve() : Promise.reject(new Error('请输入正整数')) }]}>
            <InputNumber min={1} precision={0} addonAfter="期" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Typography.Title level={5} className="form-subtitle">利息减免</Typography.Title>
      <Row gutter={[20, 0]}>
        <Col xs={24} md={8}>
          <Form.Item name="interestReliefEnabled" label="是否开通利息减免" valuePropName="checked">
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="firstPaymentDelayAllowed" label="是否允许首期延期" valuePropName="checked">
            <Switch checkedChildren="是" unCheckedChildren="否" disabled={!reliefEnabled} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="firstPaymentDelayMonths" label="首期延迟时间" rules={[{ type: 'number', min: 0, message: '延迟时间不能小于0' }]}>
            <InputNumber min={0} precision={0} addonAfter="月" disabled={!reliefEnabled || !delayAllowed} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Typography.Title level={5} className="form-subtitle">利率调整</Typography.Title>
      <Row gutter={[20, 0]}>
        <Col xs={24} md={12}>
          <Form.Item label="原正常利率"><Input value={`${loan.originalNormalRate}%`} disabled /></Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="newNormalRate" label="新正常利率" rules={[{ required: true, message: '请输入新正常利率' }, { type: 'number', min: 0, message: '利率不能为负数' }]}>
            <InputNumber min={0} precision={4} addonAfter="%" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="原罚息利率"><Input value={`${loan.originalPenaltyRate}%`} disabled /></Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="newPenaltyRate" label="新罚息利率" rules={[{ required: true, message: '请输入新罚息利率' }, { type: 'number', min: 0, message: '利率不能为负数' }]}>
            <InputNumber min={0} precision={4} addonAfter="%" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item name="collectCompoundInterest" label="是否收取复息" valuePropName="checked">
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
        </Col>
        {collectCompound && <>
          <Col xs={24} md={12}>
            <Form.Item label="原复息利率"><Input value={`${loan.originalCompoundRate}%`} disabled /></Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="newCompoundRate" label="新复息利率" rules={[{ required: true, message: '请输入新复息利率' }, { type: 'number', min: 0, message: '利率不能为负数' }]}>
              <InputNumber min={0} precision={4} addonAfter="%" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </>}
      </Row>
    </Card>
  );
}

function SelectRepaymentMethod() {
  return <Select style={{ width: '100%' }} options={repaymentMethods.map((value) => ({ label: value, value }))} placeholder="请选择新还款方式" />;
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
        interestReliefEnabled: response.data.interestRelief === '是',
        firstPaymentDelayAllowed: response.data.firstPaymentDelayMonths > 0,
        firstPaymentDelayMonths: response.data.firstPaymentDelayMonths,
        newNormalRate: response.data.newNormalRate,
        newPenaltyRate: response.data.newPenaltyRate,
        collectCompoundInterest: true,
        newCompoundRate: response.data.newCompoundRate,
      });
      setLoading(false);
    });
    return () => { active = false; };
  }, [form, loanId]);

  const handleCalculate = async () => {
    try {
      const calculateFields = ['newRepaymentMethod', 'newRemainingTerm', 'newNormalRate', 'newPenaltyRate'];
      if (form.getFieldValue('collectCompoundInterest')) calculateFields.push('newCompoundRate');
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
      setCalculated(true);
      message.success('贷款试算完成，已生成新还款计划');
    } catch {
      // Ant Design Form 已在字段下方展示校验信息。
    } finally {
      setCalculating(false);
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
      setSubmitting(true);
      const response = await submitAgilityApplication(loan.id, values);
      if (response.code === 0) {
        message.success(response.message);
        if (onSubmitted) onSubmitted();
        else navigate('/post-loan/agility-request');
      }
    } catch {
      // 表单校验信息已由 Form 展示。
    } finally {
      setSubmitting(false);
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

  return (
    <div className={`page-container adjustment-page${embedded ? ' embedded-adjustment-page' : ''}`}>
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
          const calculationKeys = ['newRepaymentMethod', 'newRemainingTerm', 'interestReliefEnabled', 'firstPaymentDelayAllowed', 'firstPaymentDelayMonths', 'newNormalRate', 'newPenaltyRate', 'collectCompoundInterest', 'newCompoundRate'];
          if (Object.keys(changedValues).some((key) => calculationKeys.includes(key))) {
            setCalculated(false);
            setPlan([]);
          }
        }}
      >
        <ReadonlyLoanInfo loan={loan} />
        <AdjustmentFields loan={loan} />
        {mode === 'request' && <Card title="其他信息与资料" className="form-section-card">
          <Row gutter={[20, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="expiryDate" label="失效日期" rules={[{ required: true, message: '请选择失效日期' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="reason" label="申请原因" rules={[{ required: true, whitespace: true, message: '请输入申请原因' }]}>
                <Input.TextArea rows={3} maxLength={500} showCount placeholder="请输入调整申请原因" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="附件上传" extra="仅支持 .zip 压缩包文件">
                <Upload accept=".zip" maxCount={1} fileList={fileList} beforeUpload={beforeUpload} onRemove={() => setFileList([])}>
                  <Button>选择 ZIP 附件</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </Card>}
        {calculated && <Card title="新还款计划" className="form-section-card plan-card">
          <Alert type="success" showIcon message={`试算成功，共 ${plan.length} 期`} className="plan-alert" />
          <Table<RepaymentPlan> rowKey="period" columns={planColumns} dataSource={plan} pagination={false} bordered size="small" scroll={{ x: 1050, y: 420 }} />
        </Card>}
        <Card className="form-actions-card">
          <Space>
            <Button onClick={() => onClose ? onClose() : navigate('/post-loan/agility-request')}>关闭</Button>
            <Button type="primary" ghost loading={calculating} onClick={() => void handleCalculate()}>贷款试算</Button>
            {mode === 'request' && <Button type="primary" disabled={!calculated} loading={submitting} onClick={() => void handleSubmit()}>确定</Button>}
          </Space>
        </Card>
      </Form>
    </div>
  );
}
