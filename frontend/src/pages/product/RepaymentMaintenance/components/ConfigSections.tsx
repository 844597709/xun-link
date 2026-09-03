import { Button, Card, InputNumber, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';
import type {
  AssociatedComponent,
  CombinationConfig,
  CombinationPlan,
  CombinationTermConfig,
  CustomRepaymentConfig,
  InternalRepaymentMode,
  RepaymentMethodSummary,
  RepaymentStage,
} from '../../../../types';
import { modeNames } from '../../../../mock/product';

const cycleOptions = ['按月付息', '按季付息', '按半年付息', '按年付息'].map((value) => ({ label: value, value }));
const principalCycleOptions = ['按月还本', '按季还本', '按半年还本', '按年还本'].map((value) => ({ label: value, value }));
const componentOptions = ['放款组件A', '放款组件B', '放款组件C'].map((value) => ({ label: value, value }));
const repaymentComponentOptions = ['还款组件A', '还款组件B', '还款组件C'].map((value) => ({ label: value, value }));
const interestComponentOptions = ['计息组件A', '计息组件B', '计息组件C'].map((value) => ({ label: value, value }));
const allowedModeMap: Record<'10' | '11' | '12', InternalRepaymentMode[]> = { '10': ['2', '3'], '11': ['2', '4'], '12': ['2'] };
const internalModeOptions: Record<InternalRepaymentMode, { label: string; value: InternalRepaymentMode }> = {
  '2': { label: '先息后本(2)', value: '2' },
  '3': { label: '等额本息(3)', value: '3' },
  '4': { label: '等额本金(4)', value: '4' },
};
let localId = 1;
const nextId = (prefix: string) => `${prefix}-${localId++}`;

interface SupportedProps {
  methods: RepaymentMethodSummary[];
  onAdd: (code: RepaymentMethodSummary['code']) => void;
  onDelete: (code: RepaymentMethodSummary['code']) => void;
  onAddPeriod: (code: RepaymentMethodSummary['code'], period: number) => void;
  onDeletePeriod: (code: RepaymentMethodSummary['code'], period: number) => void;
}

export function SupportedRepaymentMethods({ methods, onAdd, onDelete, onAddPeriod, onDeletePeriod }: SupportedProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<RepaymentMethodSummary['code']>();
  const [drafts, setDrafts] = useState<Record<string, number | null>>({});
  const options = Object.entries(modeNames)
    .filter(([code]) => !methods.some((item) => item.code === code))
    .map(([value, label]) => ({ value, label: `${value}-${label}` }));
  const submitAdd = () => {
    if (!selected) return;
    onAdd(selected);
    setSelected(undefined);
    setOpen(false);
  };
  return (
    <Card className="form-section-card" title="支持的还款方式配置" extra={<Button type="primary" ghost onClick={() => setOpen(true)}>新增还款方式</Button>}>
      <div className="repayment-method-list">
        {methods.map((method) => (
          <div className="repayment-method-row" key={method.code}>
            <div className="repayment-method-name"><strong>{method.name}</strong><span>（{method.code}）</span></div>
            <div className="period-tag-list">
              {method.periods.map((period) => <Tag key={`${method.code}-${period}`} closable onClose={() => onDeletePeriod(method.code, period)}>{period}期</Tag>)}
              <InputNumber min={1} precision={0} size="small" value={drafts[method.code] ?? null} placeholder="新增期数" onChange={(value) => setDrafts((old) => ({ ...old, [method.code]: value }))} onPressEnter={() => {
                const value = drafts[method.code];
                if (value && Number.isInteger(value)) { onAddPeriod(method.code, value); setDrafts((old) => ({ ...old, [method.code]: null })); }
              }} />
            </div>
            <Button type="link" danger size="small" onClick={() => onDelete(method.code)}>删除</Button>
          </div>
        ))}
      </div>
      <Modal title="新增还款方式" open={open} onCancel={() => setOpen(false)} onOk={submitAdd} okButtonProps={{ disabled: !selected }} destroyOnClose>
        <Select showSearch optionFilterProp="label" style={{ width: '100%' }} placeholder="请选择还款方式" options={options} value={selected} onChange={setSelected} />
      </Modal>
    </Card>
  );
}

function SectionHeader({ title, expanded, onToggle, extra }: { title: string; expanded: boolean; onToggle: () => void; extra?: ReactNode }) {
  return <div className="config-section-header" onClick={onToggle} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onToggle(); }}>
    <Space><span>{expanded ? <DownOutlined /> : <RightOutlined />}</span><Typography.Text strong>{title}</Typography.Text></Space>{extra && <span onClick={(event) => event.stopPropagation()}>{extra}</span>}
  </div>;
}

function createPlan(code: CombinationConfig['code'], term: number, seq: number): CombinationPlan {
  const split = Math.max(1, Math.floor(term / 3));
  const mode: InternalRepaymentMode = code === '10' ? '3' : code === '11' ? '4' : '2';
  return { id: nextId(`${code}-${term}-plan`), planSeq: seq, stages: [
    { id: nextId('stage'), startPeriod: 1, endPeriod: split, repaymentMode: '2', principalRatio: 0 },
    { id: nextId('stage'), startPeriod: split + 1, endPeriod: term, repaymentMode: mode, principalRatio: 1 },
  ] };
}

function StageTableEditor({ code, term, plan, onChange }: { code: CombinationConfig['code']; term: number; plan: CombinationPlan; onChange: (next: CombinationPlan) => void }) {
  const allowed = allowedModeMap[code];
  const updateStage = (id: string, patch: Partial<RepaymentStage>) => onChange({ ...plan, stages: plan.stages.map((item) => item.id === id ? { ...item, ...patch } : item) });
  const addStage = () => {
    const last = plan.stages[plan.stages.length - 1];
    const start = (last?.endPeriod ?? 0) + 1;
    if (start > term) return;
    const end = Math.min(term, start + Math.max(0, Math.ceil((term - start + 1) / 2) - 1));
    onChange({ ...plan, stages: [...plan.stages, { id: nextId('stage'), startPeriod: start, endPeriod: end, repaymentMode: allowed[0], principalRatio: 0 }] });
  };
  const removeStage = (id: string) => {
    if (plan.stages.length <= 1) return;
    onChange({ ...plan, stages: plan.stages.filter((item) => item.id !== id) });
  };
  const ratio = plan.stages.reduce((sum, item) => sum + (Number(item.principalRatio) || 0), 0);
  return <div className={`plan-item ${Math.abs(ratio - 1) < 0.0001 ? 'ratio-pass' : 'ratio-fail'}`}>
    <div className="plan-item-header"><Space><strong>方案 {String.fromCharCode(64 + plan.planSeq)}</strong><Typography.Text type="secondary">planSeq: {plan.planSeq}</Typography.Text><Typography.Text type={Math.abs(ratio - 1) < 0.0001 ? 'success' : 'danger'}>本金占比：{(ratio * 100).toFixed(2)}% {Math.abs(ratio - 1) < 0.0001 ? '✓' : '✕'}</Typography.Text></Space><Button type="link" onClick={addStage} disabled={plan.stages[plan.stages.length - 1]?.endPeriod >= term}>新增阶段</Button></div>
    <div className="stage-table-scroll"><table className="stage-table"><thead><tr><th>阶段</th><th>起止期数</th><th>还款方式</th><th>本金占比（%）</th><th>操作</th></tr></thead><tbody>{plan.stages.map((item, index) => <tr key={item.id}><td>阶段 {index + 1}</td><td><InputNumber min={1} precision={0} value={item.startPeriod} onChange={(value) => updateStage(item.id, { startPeriod: value ?? 0 })} /> <span>-</span> <InputNumber min={1} precision={0} value={item.endPeriod} onChange={(value) => updateStage(item.id, { endPeriod: value ?? 0 })} /></td><td><Select value={item.repaymentMode} options={allowed.map((mode) => internalModeOptions[mode])} onChange={(value) => updateStage(item.id, { repaymentMode: value })} /></td><td><InputNumber min={0} max={100} precision={2} value={item.principalRatio * 100} onChange={(value) => updateStage(item.id, { principalRatio: (value ?? 0) / 100 })} addonAfter="%" /></td><td><Button type="link" danger size="small" disabled={plan.stages.length <= 1} onClick={() => removeStage(item.id)}>删除</Button></td></tr>)}</tbody></table></div>
  </div>;
}

function TermConfigEditor({ code, term, onChange }: { code: CombinationConfig['code']; term: CombinationTermConfig; onChange: (next: CombinationTermConfig) => void }) {
  const addPlan = () => onChange({ ...term, plans: [...term.plans, createPlan(code, term.totalTerm, term.plans.length + 1)] });
  const updatePlan = (id: string, next: CombinationPlan) => onChange({ ...term, plans: term.plans.map((item) => item.id === id ? next : item) });
  return <div className="term-config-block"><div className="term-config-title"><strong>{term.totalTerm}期还款计划</strong><Button type="link" onClick={addPlan}>新增备选方案</Button></div>{term.plans.map((item) => <StageTableEditor key={item.id} code={code} term={term.totalTerm} plan={item} onChange={(next) => updatePlan(item.id, next)} />)}</div>;
}

export function CombinationConfigSection({ config, onChange, onReset }: { config: CombinationConfig; onChange: (next: CombinationConfig) => void; onReset: () => void }) {
  return <Card className="config-sub-card" bordered={false}>
    <SectionHeader title={`${config.name}（${config.code}）`} expanded={config.expanded} onToggle={() => onChange({ ...config, expanded: !config.expanded })} extra={<Button type="link" danger size="small" onClick={onReset}>重置本组合</Button>} />
    {config.expanded && <div className="config-section-content"><Typography.Text type="secondary">内部方式：{allowedModeMap[config.code].map((mode) => internalModeOptions[mode].label).join('、')}</Typography.Text>{config.terms.map((term) => <TermConfigEditor key={term.id} code={config.code} term={term} onChange={(next) => onChange({ ...config, terms: config.terms.map((item) => item.id === term.id ? next : item) })} />)}</div>}
  </Card>;
}

function RatioEditor({ config, onChange, withTerm }: { config: CustomRepaymentConfig; onChange: (next: CustomRepaymentConfig) => void; withTerm: boolean }) {
  const [ratioDraft, setRatioDraft] = useState<number | null>(null);
  const [termDraft, setTermDraft] = useState<number | null>(null);
  const add = () => {
    if (ratioDraft === null || ratioDraft < 0 || ratioDraft > 100 || (withTerm && (!termDraft || termDraft < 1))) return;
    onChange({ ...config, ratios: [...config.ratios, { id: nextId(`${config.code}-ratio`), ratio: ratioDraft, ...(withTerm ? { term: termDraft! } : {}) }] });
    setRatioDraft(null); setTermDraft(null);
  };
  return <div className="custom-ratio-editor"><div className="ratio-entry-inputs">{withTerm && <InputNumber min={1} precision={0} value={termDraft} placeholder="贷款参考期数" onChange={setTermDraft} onPressEnter={add} />}<InputNumber min={0} max={100} precision={2} value={ratioDraft} placeholder="比例" addonAfter="%" onChange={setRatioDraft} onPressEnter={add} />{withTerm && <Button type="primary" ghost onClick={add}>新增比例</Button>}</div><div className="ratio-tag-list">{config.ratios.map((item) => <Tag key={item.id} closable onClose={() => onChange({ ...config, ratios: config.ratios.filter((entry) => entry.id !== item.id) })}>{withTerm ? `${item.term}期：${item.ratio}%` : `${item.ratio}%`}</Tag>)}</div></div>;
}

export function CustomRepaymentConfigSection({ config, onChange }: { config: CustomRepaymentConfig; onChange: (next: CustomRepaymentConfig) => void }) {
  const hasCycles = config.code === '5' || config.code === '8';
  const hasTerm = config.code === '6';
  const hasRatio = config.code === '6' || config.code === '7' || config.code === '8';
  return <Card className="config-sub-card" bordered={false}><SectionHeader title={`${config.name}（${config.code}）`} expanded={config.expanded} onToggle={() => onChange({ ...config, expanded: !config.expanded })} />{config.expanded && <div className="config-section-content">{hasCycles && <div className="custom-cycle-grid"><label>还款周期（付息）<Select value={config.interestCycle} options={cycleOptions} onChange={(value) => onChange({ ...config, interestCycle: value })} /></label><label>还款周期（还本）<Select value={config.principalCycle} options={principalCycleOptions} onChange={(value) => onChange({ ...config, principalCycle: value })} /></label></div>}{hasRatio && <><Typography.Text strong>{hasTerm ? '期末还款比例' : '未期末还比例'}</Typography.Text><RatioEditor config={config} onChange={onChange} withTerm={hasTerm} /></>}</div>}</Card>;
}

export function AssociatedComponents({ rowNo, methods, rows, onChange }: { rowNo: 1 | 2 | 3; methods: RepaymentMethodSummary[]; rows: AssociatedComponent[]; onChange: (next: AssociatedComponent[]) => void }) {
  if (rowNo === 1) return null;
  const update = (id: string, patch: Partial<AssociatedComponent>) => onChange(rows.map((row) => row.id === id ? { ...row, ...patch } : row));
  const renderSelect = (row: AssociatedComponent, key: 'releaseComponent' | 'repaymentComponent' | 'interestComponent', options: { label: string; value: string }[]) => <Select style={{ width: 150 }} value={row[key] || undefined} placeholder="请选择" options={options} onChange={(value) => update(row.id, { [key]: value })} disabled={rowNo === 3 && !row.editable} />;
  const columns = [
    { title: '还款方式', dataIndex: 'repaymentModeName', width: 180 },
    { title: '放款部件', key: 'release', render: (_: unknown, row: AssociatedComponent) => renderSelect(row, 'releaseComponent', componentOptions) },
    { title: '还款部件', key: 'repayment', render: (_: unknown, row: AssociatedComponent) => renderSelect(row, 'repaymentComponent', repaymentComponentOptions) },
    { title: '计息部件', key: 'interest', render: (_: unknown, row: AssociatedComponent) => renderSelect(row, 'interestComponent', interestComponentOptions) },
    ...(rowNo === 3 ? [{ title: '操作', key: 'action', render: (_: unknown, row: AssociatedComponent) => row.editable ? <Button type="link" onClick={() => update(row.id, { editable: false })}>保存</Button> : <Button type="link" onClick={() => update(row.id, { editable: true })}>编辑</Button> }] : []),
  ];
  return <Card className="form-section-card" title="还款方式关联部件"><Typography.Paragraph type="secondary">{rowNo === 2 ? '新增还款方式后请补充三类部件，保存时必填。' : '已有方式默认只读，点击编辑后可逐行维护。'}</Typography.Paragraph><div className="stage-table-scroll"><Table<AssociatedComponent> rowKey="id" bordered pagination={false} columns={columns} dataSource={rows.filter((row) => methods.some((method) => method.code === row.repaymentModeCode))} locale={{ emptyText: '暂无关联部件' }} /></div></Card>;
}
