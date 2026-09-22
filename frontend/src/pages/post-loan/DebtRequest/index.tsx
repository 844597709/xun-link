import {
  Alert, Button, Card, Col, DatePicker, Descriptions, Drawer, Form, Input, InputNumber, Modal,
  Radio, Row, Select, Space, Table, Tag, Tooltip, Typography, Upload, message,
} from 'antd';
import type { TableColumnsType, UploadFile, UploadProps } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState, type Key } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataTable from '../../../components/DataTable';
import Filter, { type FilterConfig } from '../../../components/Filter';
import OperationCell from '../../../components/OperationCell';
import {
  calculateDebtRepaymentPlan, debtCombinationSchemes, debtInstitutions, debtLoanStatuses, debtProducts,
  debtRepaymentMethods, getDebtLoan, getDebtLoans, getDebtRepaymentPlan,
} from '../../../mock/debt';
import type {
  DebtCombinationScheme, DebtDrawerMode, DebtFormValues, DebtLoan, DebtLoanStatus, DebtOriginalLoan,
} from '../../../types';

const { Text } = Typography;
const money = (value: number) => value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const option = (values: string[]) => values.map((value) => ({ label: value, value }));
const institutionOptions = option(debtInstitutions);
const productOptions = option(debtProducts);
const statusOptions = option(debtLoanStatuses);

const listFilters: FilterConfig[] = [
  { key: 'institutionName', label: '机构', type: 'select', options: institutionOptions, showSearch: true },
  { key: 'customerNo', label: '客户号', type: 'input' },
  { key: 'idCardNo', label: '证件号码', type: 'input' },
  { key: 'mobile', label: '手机号', type: 'input' },
  { key: 'loanNo', label: '借据号', type: 'input' },
  { key: 'loanStatus', label: '借据状态', type: 'select', options: statusOptions },
  { key: 'productName', label: '核心产品', type: 'select', options: productOptions, showSearch: true },
];

function loanStatusTag(value: DebtLoanStatus) {
  const color = value === '正常' ? 'green' : value === '逾期' ? 'gold' : value === '减值' ? 'red' : 'default';
  return <Tag color={color}>{value}</Tag>;
}

function buildLoanColumns(onOpenDetail: (loan: DebtLoan) => void, onOpenCalculate: (id: number) => void, onOpenRequest: (id: number) => void): TableColumnsType<DebtLoan> {
  return [
    { title: '机构名称', dataIndex: 'institutionName', width: 120 },
    { title: '机构号', dataIndex: 'institutionCode', width: 90 },
    { title: '产品名称', dataIndex: 'productName', width: 120 },
    { title: '产品号', dataIndex: 'productCode', width: 95 },
    { title: '客户名称', dataIndex: 'customerName', width: 100 },
    { title: '客户号', dataIndex: 'customerNo', width: 100 },
    { title: '借据号', dataIndex: 'loanNo', width: 145 },
    { title: '贷款金额（元）', dataIndex: 'loanAmount', width: 135, render: (value: number) => money(value) },
    { title: '贷款余额（元）', dataIndex: 'loanBalance', width: 135, render: (value: number) => money(value) },
    { title: '起始日期', dataIndex: 'startDate', width: 110 },
    { title: '到期日期', dataIndex: 'maturityDate', width: 110 },
    { title: '还款方式', dataIndex: 'repaymentMethod', width: 110 },
    { title: '贷款期限', dataIndex: 'loanTerm', width: 90, render: (value: number) => `${value}期` },
    { title: '借据状态', dataIndex: 'loanStatus', width: 95, render: (value: DebtLoanStatus) => loanStatusTag(value) },
    {
      title: '操作', key: 'actions', fixed: 'right', width: 220,
      render: (_: unknown, record: DebtLoan) => <OperationCell items={[{ key: 'detail', label: '贷款详情' }, { key: 'calculate', label: '贷款试算' }, { key: 'request', label: '调整申请' }]} onAction={(key) => key === 'detail' ? onOpenDetail(record) : key === 'calculate' ? onOpenCalculate(record.id) : onOpenRequest(record.id)} />,
    },
  ];
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return <Form.Item label={label} required><Input value={value} disabled /></Form.Item>;
}

function BusinessTypeCards() {
  return <Card title="业务类型" className="form-section-card" bordered={false}>
    <Form.Item name="businessType" rules={[{ required: true, message: '请选择业务类型' }]}>
      <Radio.Group className="debt-business-type-group">
        <Radio value="借新还旧" className="debt-business-type-card">
          <span className="debt-business-type-title">借新还旧</span>
          <span className="debt-business-type-subtitle">通过新发放贷款归还原有贷款，优化客户还款安排</span>
        </Radio>
        <Radio value="无还本续贷" className="debt-business-type-card">
          <span className="debt-business-type-title">无还本续贷</span>
          <span className="debt-business-type-subtitle">无需偿还本金，按照续贷方案延长贷款期限</span>
        </Radio>
      </Radio.Group>
    </Form.Item>
  </Card>;
}

function BasicInfoSection({ loan }: { loan: DebtLoan }) {
  return <Card title="基本信息" className="form-section-card" bordered={false}>
    <Row gutter={20}>
      <Col xs={24} md={12}><ReadonlyField label="机构" value={`${loan.institutionName}（${loan.institutionCode}）`} /></Col>
      <Col xs={24} md={12}><ReadonlyField label="产品" value={`${loan.productCode}-${loan.productName}`} /></Col>
      <Col xs={24} md={12}><ReadonlyField label="客户名称" value={loan.customerName} /></Col>
      <Col xs={24} md={12}><ReadonlyField label="客户号" value={loan.customerNo} /></Col>
    </Row>
  </Card>;
}

function RepaymentInfoSection({ summary }: { summary: { repayPrincipal: number; repayInterest: number; interestRelief: number; totalRepayment: number } }) {
  return <Card title="还款信息" className="form-section-card" bordered={false}>
    <Row gutter={20}>
      <Col xs={24} md={12}>
        <Form.Item name="repayPrincipal" label="归还总本（元）" rules={[{ required: true, message: '请输入归还总本' }]} extra="与客户谈判确定的原贷款归还本金总额">
          <InputNumber min={0} precision={2} addonAfter="元" style={{ width: '100%' }} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}><Form.Item label="归还总息" extra="与客户谈判确定的原贷款归还利息总和"><Input value={money(summary.repayInterest)} addonAfter="元" disabled /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item label="减免总息" extra="与客户谈判确定的原贷款减免总息和"><Input value={money(summary.interestRelief)} addonAfter="元" disabled /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item label="归还总额" extra="业务完成客户本次应归还总额和"><Input value={money(summary.totalRepayment)} addonAfter="元" disabled /></Form.Item></Col>
    </Row>
  </Card>;
}

function combinationCode(value: string | undefined) {
  const match = value?.match(/[（(](10|11|12)[）)]$/);
  return match?.[1] as '10' | '11' | '12' | undefined;
}

const stageMethodOptions: Record<'10' | '11' | '12', Array<{ label: string; value: string }>> = {
  '10': option(['先息后本（2）', '等额本息（3）']),
  '11': option(['先息后本（2）', '等额本金（4）']),
  '12': option(['先息后本（2）', '按月付息按计划还本（12）']),
};

function createCustomStage(sequence: number, term: number, code: '10' | '11' | '12') {
  const startPeriod = sequence === 1 ? 1 : Math.min(term, Math.floor((sequence - 1) * term / 2) + 1);
  return {
    sequence,
    startPeriod,
    endPeriod: term,
    repaymentMethod: stageMethodOptions[code][0]?.value,
    principalRatio: sequence === 1 ? 0 : 100,
  };
}

function CustomSchemeEditor({ code, term }: { code: '10' | '11' | '12'; term: number }) {
  const form = Form.useFormInstance<DebtFormValues>();
  const stages = Form.useWatch('customRepaymentStages', form) ?? [];
  const ratio = stages.reduce((sum, stage) => sum + (Number(stage?.principalRatio) || 0), 0);
  return <Form.List name="customRepaymentStages">
    {(fields, { add, remove }) => {
      const lastStage = stages[stages.length - 1];
      const canAdd = fields.length === 0 || Number(lastStage?.endPeriod) < term;
      return <div className="custom-plan-editor">
        <div className="plan-item-header">
          <Space><strong>其他（自定义还款方案）</strong><Text type={Math.abs(ratio - 100) < 0.0001 ? 'success' : 'danger'}>本金占比：{ratio.toFixed(2)}% {Math.abs(ratio - 100) < 0.0001 ? '✓' : '✕'}</Text></Space>
          <Button type="link" onClick={() => add(createCustomStage(fields.length + 1, term, code))} disabled={!canAdd}>增加阶段</Button>
        </div>
        <div className="stage-table-scroll"><table className="stage-table"><thead><tr><th>阶段</th><th>起止期数</th><th>还款方式</th><th>本金占比（%）</th><th>操作</th></tr></thead><tbody>{fields.map((field, index) => <tr key={field.key}>
          <td>阶段 {index + 1}</td>
          <td><Form.Item className="custom-stage-period-field" {...field} name={[field.name, 'startPeriod']} rules={[{ required: true, message: '请输入起始期数' }]}><InputNumber min={1} max={term} precision={0} /></Form.Item><span className="custom-stage-period-separator"> - </span><Form.Item className="custom-stage-period-field" {...field} name={[field.name, 'endPeriod']} rules={[{ required: true, message: '请输入结束期数' }]}><InputNumber min={1} max={term} precision={0} /></Form.Item></td>
          <td><Form.Item {...field} name={[field.name, 'repaymentMethod']} rules={[{ required: true, message: '请选择还款方式' }]}><Select options={stageMethodOptions[code]} /></Form.Item></td>
          <td><Form.Item {...field} name={[field.name, 'principalRatio']} rules={[{ required: true, message: '请输入本金占比' }]}><InputNumber min={0} max={100} precision={2} addonAfter="%" /></Form.Item></td>
          <td><Button type="link" danger size="small" disabled={fields.length <= 1} onClick={() => remove(field.name)}>删除</Button></td>
        </tr>)}</tbody></table></div>
      </div>;
    }}
  </Form.List>;
}

function formatDebtSchemeSummary(scheme: DebtCombinationScheme) {
  return scheme.stages.map((stage) => `${stage.startPeriod}-${stage.endPeriod}期${stage.repaymentMethod}，本金${stage.principalRatio}%`).join('；');
}

function buildDebtSchemeStages(scheme: DebtCombinationScheme, term: number) {
  const stageCount = scheme.id === 'debt-scheme-a' ? 2 : scheme.id === 'debt-scheme-b' ? 3 : scheme.stages.length;
  if (stageCount <= 0 || term <= 0) return [];
  return Array.from({ length: stageCount }, (_, index) => {
    const source = scheme.stages[index] ?? scheme.stages[scheme.stages.length - 1];
    const startPeriod = index === 0 ? 1 : Math.floor(term * index / stageCount) + 1;
    const endPeriod = index === stageCount - 1 ? term : Math.floor(term * (index + 1) / stageCount);
    return {
      ...source,
      sequence: index + 1,
      startPeriod,
      endPeriod,
    };
  });
}

function CombinationScheme({ method, term }: { method?: string; term?: number }) {
  const form = Form.useFormInstance<DebtFormValues>();
  const code = combinationCode(method);
  const selected = Form.useWatch('repaymentSchemeId', form);
  const safeTerm = Number(term) || 0;
  const [expandedSchemeId, setExpandedSchemeId] = useState<string>();

  useEffect(() => {
    if (!code || !safeTerm) {
      setExpandedSchemeId(undefined);
      form.setFieldsValue({ repaymentSchemeId: undefined, customRepaymentStages: undefined });
      return;
    }
    const current = form.getFieldValue('repaymentSchemeId');
    if (!current) {
      const firstSystemScheme = debtCombinationSchemes[0];
      form.setFieldsValue({ repaymentSchemeId: firstSystemScheme?.id, customRepaymentStages: undefined });
      setExpandedSchemeId(firstSystemScheme?.id);
    } else if (current !== 'custom') {
      setExpandedSchemeId(current);
    }
  }, [code, form, safeTerm]);

  if (!code || !safeTerm) return null;
  const schemes: DebtCombinationScheme[] = debtCombinationSchemes.map((scheme) => ({
    ...scheme,
    stages: buildDebtSchemeStages(scheme, safeTerm),
  })).concat({ id: 'custom', name: '其他（自定义还款方案）', stages: [], custom: true });

  return <Card title="选择还款方案" size="small" className="repayment-plan-selector">
    <Form.Item name="repaymentSchemeId" rules={[{ required: true, message: '请选择还款方案' }]}>
      <Radio.Group style={{ width: '100%' }} onChange={(event) => {
        const value = String(event.target.value);
        setExpandedSchemeId(value === 'custom' ? undefined : value);
        form.setFieldsValue({ customRepaymentStages: value === 'custom' ? [createCustomStage(1, safeTerm, code)] : undefined });
      }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {schemes.map((scheme) => {
            if (scheme.custom) return <Radio key={scheme.id} value={scheme.id}>其他（自定义还款方案）</Radio>;
            const expanded = expandedSchemeId === scheme.id;
            return <Radio key={scheme.id} value={scheme.id}>
              <Card size="small" title={scheme.name} className="repayment-plan-option" onClick={() => setExpandedSchemeId(scheme.id)}>
                {expanded ? <Table rowKey="sequence" columns={[{ title: '阶段', dataIndex: 'sequence', width: 70 }, { title: '起止期数', key: 'period', render: (_: unknown, record: DebtCombinationScheme['stages'][number]) => `${record.startPeriod}-${record.endPeriod}` }, { title: '还款方式', dataIndex: 'repaymentMethod' }, { title: '本金比例', key: 'ratio', render: (_: unknown, record: DebtCombinationScheme['stages'][number]) => `${record.principalRatio}%` }]} dataSource={scheme.stages} pagination={false} size="small" /> : <Text className="scheme-summary">{formatDebtSchemeSummary(scheme)}</Text>}
              </Card>
            </Radio>;
          })}
        </Space>
      </Radio.Group>
    </Form.Item>
    {selected === 'custom' && <CustomSchemeEditor code={code} term={safeTerm} />}
  </Card>;
}


function OriginalLoanSection({ loans, setLoans, onAdd, canEdit }: { loans: DebtOriginalLoan[]; setLoans: (loans: DebtOriginalLoan[]) => void; onAdd?: () => void; canEdit: boolean }) {
  const columns: TableColumnsType<DebtOriginalLoan> = [
    { title: '序号', key: 'index', width: 60, render: (_: unknown, __: DebtOriginalLoan, index: number) => index + 1 },
    { title: '借据号', dataIndex: 'loanNo', width: 145 },
    { title: '借据状态', dataIndex: 'loanStatus', width: 95, render: (value: DebtLoanStatus) => loanStatusTag(value) },
    { title: '贷款金额（元）', dataIndex: 'loanAmount', width: 125, render: (value: number) => money(value) },
    { title: '贷款余额（元）', dataIndex: 'loanBalance', width: 125, render: (value: number) => money(value) },
    { title: '应还本金（元）', dataIndex: 'duePrincipal', width: 125, render: (value: number) => money(value) },
    { title: '应还总息（元）', dataIndex: 'dueInterest', width: 125, render: (value: number) => money(value) },
    { title: '是否足额还息', dataIndex: 'isFullInterest', width: 115, render: (value: '是' | '否', record) => <Select value={value} options={option(['是', '否'])} onChange={(next) => setLoans(loans.map((item) => item.id === record.id ? { ...item, isFullInterest: next, repayInterest: next === '是' ? item.dueInterest : Math.min(item.repayInterest, item.dueInterest), ledgerInterest: next === '是' ? 0 : item.ledgerInterest } : item))} /> },
    { title: '归还利息（元）', dataIndex: 'repayInterest', width: 135, render: (value: number, record) => <InputNumber min={0} max={record.dueInterest} precision={2} value={value} disabled={record.isFullInterest === '是'} onChange={(next) => setLoans(loans.map((item) => item.id === record.id ? { ...item, repayInterest: next ?? 0, ledgerInterest: Math.max(0, Math.round((item.dueInterest - (next ?? 0)) * 100) / 100) } : item))} /> },
    { title: '挂账利息（元）', dataIndex: 'ledgerInterest', width: 125, render: (value: number) => money(value) },
    { title: '逾期天数', dataIndex: 'overdueDays', width: 90, render: (value: number) => <span className={value > 0 ? 'debt-overdue-days' : ''}>{value}</span> },
    { title: '利息减免（元）', dataIndex: 'interestRelief', width: 135, render: (value: number, record) => <InputNumber min={0} max={record.dueInterest} precision={2} value={value} onChange={(next) => setLoans(loans.map((item) => item.id === record.id ? { ...item, interestRelief: next ?? 0 } : item))} /> },
    {
      title: '操作', key: 'actions', fixed: 'right', width: canEdit ? 195 : 130,
      render: (_: unknown, record: DebtOriginalLoan) => <Space size={0} wrap>
        <Button type="link" size="small" onClick={() => Modal.info({ title: `${record.loanNo} 借据信息`, width: 720, content: <Descriptions column={2} size="small"><Descriptions.Item label="借据号">{record.loanNo}</Descriptions.Item><Descriptions.Item label="借据状态">{loanStatusTag(record.loanStatus)}</Descriptions.Item><Descriptions.Item label="贷款金额">{money(record.loanAmount)} 元</Descriptions.Item><Descriptions.Item label="贷款余额">{money(record.loanBalance)} 元</Descriptions.Item><Descriptions.Item label="应还本金">{money(record.duePrincipal)} 元</Descriptions.Item><Descriptions.Item label="应还总息">{money(record.dueInterest)} 元</Descriptions.Item><Descriptions.Item label="起始日期">{record.startDate}</Descriptions.Item><Descriptions.Item label="到期日期">{record.maturityDate}</Descriptions.Item></Descriptions> })}>详情</Button>
        <Button type="link" size="small" onClick={() => { void getDebtRepaymentPlan(record.id).then((response) => Modal.info({ title: `${record.loanNo} 还款计划`, width: 800, content: <Table size="small" pagination={{ pageSize: 5 }} dataSource={response.data} rowKey="period" columns={[{ title: '期数', dataIndex: 'period' }, { title: '到期日期', dataIndex: 'dueDate' }, { title: '还款方式', dataIndex: 'repaymentMethod' }, { title: '应还本金', dataIndex: 'principal', render: (value: number) => money(value) }, { title: '应还利息', dataIndex: 'interest', render: (value: number) => money(value) }, { title: '应还金额', dataIndex: 'amount', render: (value: number) => money(value) }]} /> })) }}>还款计划</Button>
        {canEdit && <Button type="link" danger size="small" onClick={() => Modal.confirm({ title: '确认删除', content: `确定从申请中移除借据 ${record.loanNo} 吗？`, onOk: () => setLoans(loans.filter((item) => item.id !== record.id)) })}>删除</Button>}
      </Space>,
    },
  ];
  const summary = loans.reduce((acc, item) => ({ loanAmount: acc.loanAmount + item.loanAmount, loanBalance: acc.loanBalance + item.loanBalance, duePrincipal: acc.duePrincipal + item.duePrincipal, dueInterest: acc.dueInterest + item.dueInterest, repayInterest: acc.repayInterest + item.repayInterest, ledgerInterest: acc.ledgerInterest + item.ledgerInterest, interestRelief: acc.interestRelief + item.interestRelief }), { loanAmount: 0, loanBalance: 0, duePrincipal: 0, dueInterest: 0, repayInterest: 0, ledgerInterest: 0, interestRelief: 0 });
  return <Card title={<div className="debt-section-title"><span>原借据信息</span>{canEdit && <Button type="primary" ghost icon={<PlusOutlined />} onClick={onAdd}>新增借据</Button>}</div>} className="form-section-card" bordered={false}>
    <Alert type="info" showIcon message="请添加所有需要归还的原借据，系统将自动计算汇总金额。点击“详情”可查看完整借据信息。" />
    <Alert className="debt-notice-alert" type="info" showIcon message={<span>签约操作须知：<br />① 足额还息时，归还利息以系统结算金额为准全额支付，不产生挂账；<br />② 非足额还息时，仅需支付申请时输入的归还利息金额，差额利息系统自动挂账；<br />③ 挂账利息将自动计入还款计划中，并影响分期还款进度。</span>} />
    <Table rowKey="id" size="small" bordered scroll={{ x: canEdit ? 2020 : 1950 }} columns={columns} dataSource={loans} pagination={false} summary={() => <Table.Summary fixed><Table.Summary.Row>
      <Table.Summary.Cell index={0}>合计</Table.Summary.Cell><Table.Summary.Cell index={1}>共{loans.length}笔</Table.Summary.Cell><Table.Summary.Cell index={2}>-</Table.Summary.Cell><Table.Summary.Cell index={3}>{money(summary.loanAmount)}</Table.Summary.Cell><Table.Summary.Cell index={4}>{money(summary.loanBalance)}</Table.Summary.Cell><Table.Summary.Cell index={5}>{money(summary.duePrincipal)}</Table.Summary.Cell><Table.Summary.Cell index={6}>{money(summary.dueInterest)}</Table.Summary.Cell><Table.Summary.Cell index={7}>-</Table.Summary.Cell><Table.Summary.Cell index={8}>{money(summary.repayInterest)}</Table.Summary.Cell><Table.Summary.Cell index={9}>{money(summary.ledgerInterest)}</Table.Summary.Cell><Table.Summary.Cell index={10}>-</Table.Summary.Cell><Table.Summary.Cell index={11}>{money(summary.interestRelief)}</Table.Summary.Cell><Table.Summary.Cell index={12}>-</Table.Summary.Cell>
    </Table.Summary.Row></Table.Summary>} />
  </Card>;
}

function modeLabel(mode: DebtDrawerMode) {
  return mode === 'single-calculate' ? '贷款试算' : mode === 'single-request' ? '调整申请' : mode === 'batch-calculate' ? '批量试算' : '批量申请';
}

function DebtRequestDrawer({ mode, loanIds, onClose }: { mode: DebtDrawerMode; loanIds: number[]; onClose: () => void }) {
  const [form] = Form.useForm<DebtFormValues>();
  const [loan, setLoan] = useState<DebtLoan>();
  const [loans, setLoans] = useState<DebtOriginalLoan[]>([]);
  const [addVisible, setAddVisible] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<number>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [version, setVersion] = useState(0);
  const method = Form.useWatch('repaymentMethod', form);
  const term = Form.useWatch('loanTerm', form);
  const isBatch = mode.startsWith('batch');
  const isRequest = mode.endsWith('request');

  useEffect(() => {
    let active = true;
    setLoan(undefined);
    void Promise.all(loanIds.map((id) => getDebtLoan(id))).then((responses) => {
      if (!active || !responses.length) return;
      const records = responses.map((response) => response.data);
      const first = records[0];
      const originalLoans = records.flatMap((record, recordIndex) => record.originalLoans.map((item) => ({ ...item, id: recordIndex * 100000 + item.id })));
      const aggregate: DebtLoan = isBatch ? {
        ...first,
        loanAmount: records.reduce((sum, record) => sum + record.loanAmount, 0),
        loanBalance: records.reduce((sum, record) => sum + record.loanBalance, 0),
        originalLoans,
      } : { ...first, originalLoans: first.originalLoans };
      setLoan(aggregate);
      setLoans(aggregate.originalLoans);
      form.setFieldsValue({ businessType: '借新还旧', repayPrincipal: 0, repaymentMethod: '等额本息（3）', loanTerm: aggregate.termOptions[0], delayMonths: 0, normalRate: aggregate.normalRate, penaltyRate: aggregate.penaltyRate, compoundRate: aggregate.compoundRate, repaymentSchemeId: undefined, customRepaymentStages: undefined });
      setFileList([]);
      setVersion((value) => value + 1);
    });
    return () => { active = false; };
  }, [form, isBatch, loanIds]);

  const summary = useMemo(() => {
    const repayInterest = loans.reduce((sum, item) => sum + item.repayInterest, 0);
    const interestRelief = loans.reduce((sum, item) => sum + item.interestRelief, 0);
    const repayPrincipal = Number(form.getFieldValue('repayPrincipal') ?? 0);
    return { repayPrincipal, repayInterest, interestRelief, totalRepayment: Math.max(0, repayPrincipal + repayInterest - interestRelief) };
  }, [form, loans, version]);
  const newLoanAmount = Math.max(0, (loan?.loanBalance ?? 0) - summary.repayPrincipal);
  const availableLoans = loan ? [...loan.originalLoans, { ...loan.originalLoans[0], id: loan.id * 10000, loanNo: `${loan.loanNo}-关联借据` }].filter((item) => item.id && !loans.some((selected) => selected.id === item.id)) : [];

  const updateLoans = (next: DebtOriginalLoan[]) => { setLoans(next); setVersion((value) => value + 1); };
  const handleTrial = async () => {
    try {
      const fields = ['businessType', 'repaymentMethod', 'loanTerm', 'delayMonths', 'normalRate', 'penaltyRate', 'compoundRate'];
      if (combinationCode(form.getFieldValue('repaymentMethod'))) fields.push('repaymentSchemeId');
      const values = await form.validateFields(fields);
      if (!loan) return;
      const response = await calculateDebtRepaymentPlan(loan.id, values);
      if (response.code !== 0) { message.error(response.message); return; }
      Modal.info({ title: '新还款计划试算', width: 900, content: <Table size="small" pagination={{ pageSize: 8 }} rowKey="period" dataSource={response.data} columns={[{ title: '期数', dataIndex: 'period' }, { title: '到期日期', dataIndex: 'dueDate' }, { title: '还款方式', dataIndex: 'repaymentMethod' }, { title: '应还本金', dataIndex: 'principal', render: (value: number) => money(value) }, { title: '应还利息', dataIndex: 'interest', render: (value: number) => money(value) }, { title: '应还金额', dataIndex: 'amount', render: (value: number) => money(value) }]} /> });
    } catch { /* Ant Design Form 已展示字段错误 */ }
  };
  const handleSubmit = async () => {
    try {
      await form.validateFields();
      message.success(`${isBatch ? '批量' : ''}调整申请已提交，等待审批处理`);
      onClose();
    } catch { /* Ant Design Form 已展示字段错误 */ }
  };
  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    if (!file.name.toLowerCase().endsWith('.zip')) { message.error('附件仅支持 .zip 压缩包格式'); return Upload.LIST_IGNORE; }
    setFileList([file]);
    return false;
  };

  return <Drawer className="debt-request-drawer" title={<Space><span>{modeLabel(mode)}</span><Tag color={isRequest ? 'blue' : 'cyan'}>{isRequest ? '申请模式' : '试算模式'}</Tag></Space>} open width={960} onClose={onClose} destroyOnClose>
    {!loan ? <div className="route-loading">贷款信息加载中...</div> : <Form form={form} layout="vertical" onValuesChange={(changedValues) => {
      if (Object.keys(changedValues).some((key) => ['repaymentMethod', 'loanTerm'].includes(key))) form.setFieldsValue({ repaymentSchemeId: undefined, customRepaymentStages: undefined });
      setVersion((value) => value + 1);
    }}>
      <div className="debt-drawer-scroll">
        <BusinessTypeCards />
        <BasicInfoSection loan={loan} />
        <RepaymentInfoSection summary={summary} />
        <Card title="新贷款信息" className="form-section-card" bordered={false}>
          <Form.Item label="贷款金额" required><Input value={money(newLoanAmount)} addonAfter="元" disabled /></Form.Item>
          <Row gutter={20}>
            <Col xs={24} md={12}><Form.Item name="repaymentMethod" label="还款方式" rules={[{ required: true, message: '请选择还款方式' }]}><Select options={option(debtRepaymentMethods)} placeholder="请选择还款方式" /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="loanTerm" label="贷款期数" rules={[{ required: true, message: '请选择贷款期数' }]}><Select options={loan.termOptions.map((value) => ({ label: `${value}期`, value }))} placeholder="请选择贷款期数" /></Form.Item></Col>
          </Row>
          <CombinationScheme method={method} term={term} />
          <Row gutter={20}>
            <Col xs={24} md={12}><Form.Item name="delayMonths" label="首期延迟时间" rules={[{ required: true, message: '请输入首期延迟时间' }]}><InputNumber min={0} precision={0} addonAfter="月" style={{ width: '100%' }} /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="normalRate" label="正常利率" rules={[{ required: true, message: '请输入正常利率' }]}><InputNumber min={0} precision={4} addonAfter="%" style={{ width: '100%' }} /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="penaltyRate" label="罚息利率" rules={[{ required: true, message: '请输入罚息利率' }]}><InputNumber min={0} precision={4} addonAfter="%" style={{ width: '100%' }} /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="compoundRate" label="复息利率" rules={[{ required: true, message: '请输入复息利率' }]}><InputNumber min={0} precision={4} addonAfter="%" style={{ width: '100%' }} /></Form.Item></Col>
            {isRequest && <>
              <Col xs={24} md={12}><Form.Item name="expiryDate" label="失效日期" rules={[{ required: true, message: '请选择失效日期' }]}><DatePicker placeholder="请选择失效日期" style={{ width: '100%' }} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="remark" label="备注说明" rules={[{ required: true, message: '请输入备注说明' }]}><Input.TextArea rows={1} placeholder="请输入备注说明" /></Form.Item></Col>
            </>}
          </Row>
        </Card>
        <OriginalLoanSection loans={loans} setLoans={updateLoans} canEdit={isBatch} onAdd={() => { setSelectedLoanId(availableLoans[0]?.id); setAddVisible(true); }} />
        {isRequest && <Card title="相关材料上传" className="form-section-card" bordered={false}><Form.Item name="attachments" extra="仅支持 ZIP 格式压缩包，最多上传 1 个文件"><Upload accept=".zip" maxCount={1} fileList={fileList} beforeUpload={beforeUpload} onRemove={() => { setFileList([]); return true; }}><Button>选择 ZIP 附件</Button></Upload></Form.Item></Card>}
      </div>
      <Card className="debt-drawer-actions"><Space><Button onClick={onClose}>取消</Button><Button type="primary" ghost onClick={() => void handleTrial()}>新还款计划试算</Button>{isRequest && <Button type="primary" onClick={() => void handleSubmit()}>确定</Button>}</Space></Card>
    </Form>}
    <Modal title="新增借据" open={addVisible} onCancel={() => setAddVisible(false)} onOk={() => { const selected = availableLoans.find((item) => item.id === selectedLoanId); if (!selected) { message.warning('请选择借据'); return; } updateLoans([...loans, selected]); setAddVisible(false); }}><Select style={{ width: '100%' }} value={selectedLoanId} onChange={setSelectedLoanId} options={availableLoans.map((item) => ({ label: `${item.loanNo}（余额 ${money(item.loanBalance)} 元）`, value: item.id }))} placeholder="请选择需要归还的原借据" /></Modal>
  </Drawer>;
}

interface DrawerState { mode: DebtDrawerMode; loanIds: number[] }

export default function DebtRequest() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialLoanId = Number(searchParams.get('loanId'));
  const [drawer, setDrawer] = useState<DrawerState | null>(() => searchParams.get('loanId') && initialLoanId > 0 && ['request', 'calculate'].includes(searchParams.get('mode') ?? '') ? { mode: searchParams.get('mode') === 'request' ? 'single-request' : 'single-calculate', loanIds: [initialLoanId] } : null);
  const [detailLoan, setDetailLoan] = useState<DebtLoan | null>(null);
  const [data, setData] = useState<DebtLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<Record<string, unknown>>({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const load = (page: number, pageSize: number, nextQuery: Record<string, unknown>) => { setLoading(true); void getDebtLoans({ page, pageSize, ...nextQuery } as never).then((response) => { setData(response.data.list); setPagination({ current: response.data.page, pageSize: response.data.pagesize, total: response.data.total }); }).catch(() => message.error('借据列表加载失败')).finally(() => setLoading(false)); };
  useEffect(() => { load(1, 10, {}); }, []);
  const closeDrawer = () => { setDrawer(null); setSearchParams({}); };
  const openDrawer = (mode: DebtDrawerMode, ids: number[]) => { setDrawer({ mode, loanIds: ids }); if (ids.length === 1) setSearchParams({ mode: mode.endsWith('request') ? 'request' : 'calculate', loanId: String(ids[0]) }); else setSearchParams({}); };
  const handleBatch = (mode: DebtDrawerMode) => { const ids = selectedRowKeys.map(Number); if (!ids.length) { message.warning(`请先选择需要${mode.endsWith('request') ? '申请' : '试算'}的借据`); return; } openDrawer(mode, ids); };
  return <div className="page-container">
    <Card className="filter-card" bordered={false}><Filter configs={listFilters} onSearch={(values) => { const next = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== '')); setQuery(next); setPagination((current) => ({ ...current, current: 1 })); load(1, pagination.pageSize, next); }} /></Card>
    <Card className="table-card" bordered={false}><div className="table-toolbar"><Space><Button onClick={() => handleBatch('batch-calculate')}>批量试算</Button><Button type="primary" onClick={() => handleBatch('batch-request')}>批量申请</Button>{selectedRowKeys.length > 0 && <Text type="secondary">已选择 {selectedRowKeys.length} 笔</Text>}</Space></div><DataTable rowKey="id" rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }} columns={buildLoanColumns((loan) => setDetailLoan(loan), (id) => openDrawer('single-calculate', [id]), (id) => openDrawer('single-request', [id]))} dataSource={data} loading={loading} pagination={pagination} onPageChange={(page, pageSize) => { setPagination((current) => ({ ...current, current: page, pageSize })); load(page, pageSize, query); }} /></Card>
    <Drawer title={detailLoan ? `${detailLoan.loanNo} 贷款详情` : '贷款详情'} open={detailLoan !== null} onClose={() => setDetailLoan(null)} width="min(760px, 100vw)" destroyOnClose>
      {detailLoan && <Descriptions column={{ xs: 1, sm: 2 }} size="small">
        <Descriptions.Item label="机构">{detailLoan.institutionName}（{detailLoan.institutionCode}）</Descriptions.Item><Descriptions.Item label="产品">{detailLoan.productCode}-{detailLoan.productName}</Descriptions.Item>
        <Descriptions.Item label="客户名称">{detailLoan.customerName}</Descriptions.Item><Descriptions.Item label="客户号">{detailLoan.customerNo}</Descriptions.Item><Descriptions.Item label="证件号码">{detailLoan.idCardNo}</Descriptions.Item><Descriptions.Item label="手机号">{detailLoan.mobile}</Descriptions.Item>
        <Descriptions.Item label="贷款金额">{money(detailLoan.loanAmount)} 元</Descriptions.Item><Descriptions.Item label="贷款余额">{money(detailLoan.loanBalance)} 元</Descriptions.Item><Descriptions.Item label="还款方式">{detailLoan.repaymentMethod}</Descriptions.Item><Descriptions.Item label="贷款期限">{detailLoan.loanTerm}期</Descriptions.Item><Descriptions.Item label="借据状态">{loanStatusTag(detailLoan.loanStatus)}</Descriptions.Item>
      </Descriptions>}
    </Drawer>
    {drawer && <DebtRequestDrawer mode={drawer.mode} loanIds={drawer.loanIds} onClose={closeDrawer} />}
  </div>;
}
