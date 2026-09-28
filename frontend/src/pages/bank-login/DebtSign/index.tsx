import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button, Card, Checkbox, Empty, Spin, Tag, message } from 'antd';
import { CloseOutlined, DeleteOutlined, FilterFilled, LeftOutlined, PlusOutlined, RightOutlined, WarningFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getDebtSignData, submitDebtSign } from '../../../mock';
import type { DebtSignData, DebtSignLoanNote, DebtSignRepaymentItem, DebtSignStep, DebtSignTodoStatus } from '../../../types';
import './index.css';

type SheetType = 'plan' | 'notice' | 'method' | 'term' | 'purpose' | 'repaymentAccount' | 'receivingAccount' | null;

const money = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const sum = (items: DebtSignLoanNote[], key: keyof Pick<DebtSignLoanNote, 'remainingPrincipal' | 'totalInterest' | 'totalPenalty' | 'recoveryDiscount'>) => items.reduce((total, item) => total + Number(item[key]), 0);

function MobileHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return <header className="debt-sign-header">
    <button type="button" className="debt-header-back" onClick={onBack}><LeftOutlined /> 返回</button>
    <strong>{title}</strong>
  </header>;
}

function DebtPhonePreview({ panel, title, children, className = '', onBack }: { panel: DebtSignStep; title: string; children: ReactNode; className?: string; onBack: () => void }) {
  return <section className={`debt-preview-phone ${className}`} data-panel={panel}>
    <MobileHeader title={title} onBack={onBack} />
    {children}
  </section>;
}

function SignCard({ title, action, children, className = '' }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <Card className={`debt-card ${className}`} bordered={false}>
    {title ? <div className="debt-card-title"><h2>{title}</h2>{action}</div> : null}
    {children}
  </Card>;
}

function TodoCard({ item, onComplete }: { item: DebtSignData['todos'][number]; onComplete: () => void }) {
  return <SignCard className="todo-card">
    <div className="todo-first-row"><strong>{item.title}</strong><Button type="primary" size="small" onClick={onComplete}>去完成 <RightOutlined /></Button></div>
    <div className="todo-line"><span>借款产品</span><b>{item.productName}</b></div>
    <div className="todo-line"><span>截止时间</span><b className="deadline">{item.deadline}</b></div>
    <p className="todo-tip"><WarningFilled /> {item.tip}</p>
    <div className="todo-created">创建时间：{item.createdAt}</div>
  </SignCard>;
}

function TodoPage({ data, onStart }: { data: DebtSignData; onStart: (mode: 'single' | 'batch') => void }) {
  const [status, setStatus] = useState<DebtSignTodoStatus>('未处理');
  const todos = data.todos.filter((item) => item.status === status);
  return <div className="debt-sign-scroll">
    <div className="todo-tabs" role="tablist">{(['未处理', '已处理'] as DebtSignTodoStatus[]).map((item) => <button key={item} type="button" role="tab" aria-selected={status === item} className={status === item ? 'active' : ''} onClick={() => setStatus(item)}>{item}<small>{data.todos.filter((todo) => todo.status === item).length}</small></button>)}</div>
    <div className="todo-list">{todos.length ? todos.map((item) => <TodoCard key={item.id} item={item} onComplete={() => onStart(item.mode)} />) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无待办事项" />}</div>
  </div>;
}

function NoticeCard({ children }: { children: ReactNode }) {
  return <div className="debt-notice"><WarningFilled /><div>{children}</div></div>;
}

function NoteMetrics({ note }: { note: DebtSignLoanNote }) {
  return <div className="note-metrics"><div><span>总利息</span><b>{money(note.totalInterest)}</b></div><div><span>总违约金</span><b>{money(note.totalPenalty)}</b></div><div><span>回收优惠</span><b className="discount">-{money(note.recoveryDiscount)}</b></div></div>;
}

function NoteCard({ note, selected, canManage, onToggle, onRemove }: { note: DebtSignLoanNote; selected: boolean; canManage: boolean; onToggle: () => void; onRemove: () => void }) {
  return <SignCard className={`note-card ${selected ? 'selected' : ''}`}>
    <div className="note-heading"><Checkbox checked={selected} onChange={onToggle} /><strong>{note.title}</strong>{note.overdue ? <Tag color="error">逾期</Tag> : null}{canManage ? <button type="button" className="delete-note" onClick={onRemove} aria-label="删除借据"><DeleteOutlined /></button> : null}</div>
    <div className="note-principal"><span>剩余本金（元）</span><b>{money(note.remainingPrincipal)}</b></div>
    <NoteMetrics note={note} />
    <div className="period-pill">当前第 {note.currentPeriod} 期 / 共 {note.totalPeriods} 期</div>
    <div className="note-detail-grid"><div><span>应还利息</span><b>{money(note.dueInterest)}</b></div><div><span>违约金</span><b>{money(note.penalty)}</b></div><div><span>借款期限</span><b>{note.term}</b></div><div><span>剩余期数</span><b>{note.remainingPeriods}期</b></div><div><span>借款本金</span><b>{money(note.principal)}</b></div><div><span>利率</span><b>{note.rate}</b></div></div>
  </SignCard>;
}

function Agreement({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return <div className="agreement-line"><Checkbox checked={checked} onChange={onChange}>本人已阅读并同意签署 <button type="button" className="contract-link" onClick={(event) => event.stopPropagation()}>《个人借款合同》</button>、<button type="button" className="contract-link" onClick={(event) => event.stopPropagation()}>《征信查询授权书》</button></Checkbox></div>;
}

function ChoosePage({ data, mode, selectedIds, agreed, onChange, onAgreementChange, onNext, onBack }: { data: DebtSignData; mode: 'single' | 'batch'; selectedIds: number[]; agreed: boolean; onChange: (ids: number[]) => void; onAgreementChange: () => void; onNext: () => void; onBack: () => void }) {
  const selected = data.notes.filter((note) => selectedIds.includes(note.id));
  const totalDue = sum(selected, 'remainingPrincipal') + sum(selected, 'totalInterest') + sum(selected, 'totalPenalty') - sum(selected, 'recoveryDiscount');
  const addNote = () => {
    const next = data.notes.find((note) => !selectedIds.includes(note.id));
    if (next) onChange([...selectedIds, next.id]);
    else message.info('暂无更多可添加借据');
  };
  const toggleNote = (id: number) => {
    if (selectedIds.includes(id) && selectedIds.length <= 1) { message.warning('至少保留一笔借据'); return; }
    onChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  };
  const removeNote = (id: number) => {
    if (selectedIds.length <= 1) { message.warning('至少保留一笔借据'); return; }
    onChange(selectedIds.filter((item) => item !== id));
  };
  return <div className="debt-sign-scroll choose-scroll">
    <NoticeCard><strong>第一步：请选择需要借新还旧的借据</strong><span>确认后无法修改选择的借据，请慎重选额！</span></NoticeCard>
    <NoticeCard><strong>申请借新还旧的过程中将无法再次提现</strong></NoticeCard>
    <div className="choose-summary"><span>已选 {selected.length} 笔借据，应还总额</span><b>{money(totalDue)} 元</b></div>
    {selected.map((note) => <NoteCard key={note.id} note={note} selected canManage={mode === 'batch'} onToggle={() => toggleNote(note.id)} onRemove={() => removeNote(note.id)} />)}
    {mode === 'batch' ? <button type="button" className="add-note-button" onClick={addNote}><PlusOutlined /> 新增借据</button> : null}
    <Agreement checked={agreed} onChange={onAgreementChange} />
    <button type="button" className="debt-primary" onClick={() => { if (!selected.length) { message.warning('请至少选择一笔借据'); return; } if (!agreed) { message.warning('请先阅读并同意相关协议'); return; } onNext(); }}>下一步</button>
    <button type="button" className="debt-secondary" onClick={onBack}>返回待办</button>
  </div>;
}

function PlanConfirmPage2({ selected, plan, repaymentPlan, onPlan, onSubmit, onMethod, onTerm, onPurpose, onRepaymentAccount, onReceivingAccount }: { selected: DebtSignLoanNote[]; plan: DebtSignData['plan']; repaymentPlan: DebtSignRepaymentItem[]; onPlan: () => void; onSubmit: () => void; onMethod: () => void; onTerm: () => void; onPurpose: () => void; onRepaymentAccount: () => void; onReceivingAccount: () => void }) {
  const principal = sum(selected, 'remainingPrincipal');
  const interest = sum(selected, 'totalInterest');
  const penalty = sum(selected, 'totalPenalty');
  const discount = sum(selected, 'recoveryDiscount');
  const interestRelief = plan.interestReliefAmount ?? 0;
  const total = principal + interest + penalty - discount + (interestRelief < 0 ? interestRelief : 0);
  const currentPlan = { ...plan, principal, term: '36期' };
  const normalRate = currentPlan.normalRate ?? currentPlan.annualRate;
  const penaltyRate = currentPlan.penaltyRate ?? normalRate;
  const compoundRate = currentPlan.compoundRate ?? penaltyRate;
  const schemeDescription = '前12期只偿还利息，第13-24期每月偿还30%本金的等额本息+另70%本金的利息，第25-36期每月偿还剩余70%本金的等额本息。';
  return <div className="debt-sign-scroll confirm2-scroll">
    <div className="confirm2-original-card">
      <h2>原借据信息</h2>
      <div className="confirm2-field-list">
        <Confirm2Row label="应还本金" value={`${money(principal)} 元`} />
        <Confirm2Row label="应还利息" value={`${money(interest)} 元`} />
        <Confirm2Row label="违约金" value={`${money(penalty)} 元`} />
        <Confirm2Row label="回收优惠" value={`${money(discount)} 元`} className="confirm2-positive" />
        {typeof currentPlan.interestReliefAmount === 'number' && currentPlan.interestReliefAmount < 0 ? <Confirm2Row label="利息减免" value={`${money(currentPlan.interestReliefAmount)} 元`} /> : null}
        <div className="confirm2-total-row"><span className="confirm2-field-label">应还总额</span><b className="confirm2-total-value">{money(total)} 元</b></div>
      </div>
    </div>
    <div className="confirm2-original-card confirm2-new-card">
      <h2>新借据信息</h2>
      <div className="confirm2-field-list">
        <Confirm2Row label="借款本金" value={`${money(currentPlan.principal)} 元`} className="confirm2-principal-row" />
        <Confirm2Row label="正常利率" value={normalRate} />
        <Confirm2Row label="罚息利率" value={penaltyRate} />
        <Confirm2Row label="复息利率" value={compoundRate} />
        <Confirm2ActionRow label="还款方式" value={currentPlan.repaymentMethod} onClick={onMethod} />
        <Confirm2ActionRow label="借款时长" value={currentPlan.term} onClick={onTerm} />
      </div>
      <div className="confirm2-scheme"><p>{schemeDescription}</p></div>
      <div className="confirm2-field-list">
        {currentPlan.firstPaymentDelayMonths !== undefined && currentPlan.firstPaymentDelayMonths > 0 ? <Confirm2Row label="首期延迟" value={`${currentPlan.firstPaymentDelayMonths}个月`} /> : null}
        <Confirm2ActionRow label="借款用途" value={currentPlan.purpose} onClick={onPurpose} />
        <Confirm2ActionRow label="还款计划" value="查看" onClick={onPlan} className="confirm2-repayment-action" />
        <Confirm2ActionRow label="还款账户" value={currentPlan.repaymentAccount} onClick={onRepaymentAccount} />
        <Confirm2ActionRow label="收款账户" value={currentPlan.receivingAccount} onClick={onReceivingAccount} />
      </div>
    </div>
    <button type="button" className="debt-primary confirm2-submit" onClick={onSubmit}>确认提交</button>
  </div>;
}

function Confirm2Row({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return <div className={`confirm2-field-row ${className}`}><span className="confirm2-field-label">{label}</span><b>{value}</b></div>;
}

function Confirm2ActionRow({ label, value, onClick, className = '' }: { label: string; value: string; onClick: () => void; className?: string }) {
  return <button type="button" className={`confirm2-field-row confirm2-field-action ${className}`} onClick={onClick}><span className="confirm2-field-label">{label}</span><b>{value} <RightOutlined /></b></button>;
}

function Sheet({ title, onClose, children, className = '' }: { title: string; onClose: () => void; children: ReactNode; className?: string }) {
  return <div className="debt-sheet-mask" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={`debt-bottom-sheet ${className}`} role="dialog" aria-modal="true"><div className="sheet-handle" /><div className="sheet-title"><h2>{title}</h2><button type="button" onClick={onClose} aria-label="关闭"><CloseOutlined /></button></div><div className="sheet-content">{children}</div></section></div>;
}

function PlanSheet({ items, onClose, title = '还款计划' }: { items: DebtSignRepaymentItem[]; onClose: () => void; title?: string }) {
  const total = items.reduce((value, item) => value + item.amount, 0);
  const interest = items.reduce((value, item) => value + item.interest, 0);
  return <Sheet title={title} onClose={onClose} className="repayment-sheet"><div className="sheet-hero"><span>还款总额</span><strong>{money(total)}<small> 元</small></strong><p>利息总额 {money(interest)} 元 · 借款周期 {items.length} 个月</p></div><div className="repayment-list">{items.map((item) => <div className="repayment-item" key={item.period}><div><b>第{item.period}期</b><span>{item.dueDate}</span></div><strong>{money(item.amount)} 元</strong><p>本金 {money(item.principal)} 元　利息 {money(item.interest)} 元</p></div>)}</div></Sheet>;
}

function NoticeSheet({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  return <Sheet title="还款提示" onClose={onClose} className="notice-sheet"><div className="notice-sheet-icon"><WarningFilled /></div><p className="notice-copy">本次借新还旧需先行还清旧借据的利息、违约金等费用。还款成功后，旧借据本金将生成一笔新借据。请确保账户余额充足，以免影响申请进度。</p><div className="sheet-actions"><button type="button" className="sheet-cancel" onClick={onClose}>暂不提交</button><button type="button" className="sheet-submit" onClick={onSubmit}>我已知晓</button></div></Sheet>;
}

function DetailSheet({ title, value, onClose }: { title: string; value: string; onClose: () => void }) {
  return <Sheet title={title} onClose={onClose} className="confirm2-detail-sheet"><div className="confirm2-detail-copy">{value}</div></Sheet>;
}

function ProcessingPage({ onTodo }: { onTodo: () => void }) {
  return <div className="processing-page"><div className="funnel-icon"><FilterFilled /></div><h1>等待系统处理</h1><Tag color="gold">处理中</Tag><p>您的贷款调整处理中，请耐心等待，结束我们将以短信形式通知您。</p><button type="button" className="debt-primary" onClick={onTodo}>返回我的待办</button></div>;
}

export default function DebtSignPage() {
  const navigate = useNavigate();
  const [api, contextHolder] = message.useMessage();
  const [data, setData] = useState<DebtSignData>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [focusedPanel, setFocusedPanel] = useState<DebtSignStep>('todo');
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [selectedIds, setSelectedIds] = useState<number[]>([1]);
  const [agreed, setAgreed] = useState(false);
  const [confirm2Sheet, setConfirm2Sheet] = useState<SheetType>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => { setLoading(true); setError(false); getDebtSignData().then((response) => setData(response.data)).catch(() => setError(true)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const selected = useMemo(() => data?.notes.filter((note) => selectedIds.includes(note.id)) ?? [], [data, selectedIds]);
  const repaymentPlan = useMemo(() => {
    const principal = sum(selected, 'remainingPrincipal');
    const totalInterest = principal * 0.248;
    return Array.from({ length: 30 }, (_, index) => ({ period: index + 1, dueDate: `${2026 + Math.floor((8 + index) / 12)}-${String(((8 + index) % 12) + 1).padStart(2, '0')}-20`, principal: principal / 30, interest: totalInterest / 30, amount: (principal + totalInterest) / 30 }));
  }, [selected]);

  if (loading) return <div className="debt-mobile-frame loading-state"><Spin tip="正在加载签约信息..." /></div>;
  if (error || !data) return <div className="debt-mobile-frame loading-state"><Empty description="签约信息加载失败"><Button onClick={load}>重新加载</Button></Empty></div>;

  const focus = (panel: DebtSignStep) => setFocusedPanel(panel);
  const start = (nextMode: 'single' | 'batch') => { setMode(nextMode); setSelectedIds(nextMode === 'batch' ? [1, 2] : [1]); setAgreed(false); setConfirm2Sheet(null); focus('choose'); };
  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const response = await submitDebtSign(selectedIds);
      api.success(response.message);
      setConfirm2Sheet(null);
      focus('processing');
    } catch {
      api.error('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="debt-sign-host">
    {contextHolder}
    <div className="debt-canvas-heading"><div><strong>债务重组签约</strong><span>四个画板流程预览</span></div><span className="canvas-size">370 × 844</span></div>
    <div className="debt-sign-canvas-scroll">
      <main className="debt-sign-canvas">
        <DebtPhonePreview panel="todo" title="我的待办" className={focusedPanel === 'todo' ? 'is-focused' : ''} onBack={() => navigate(-1)}>
          <TodoPage data={data} onStart={start} />
        </DebtPhonePreview>
        <DebtPhonePreview panel="choose" title="借据选择" className={focusedPanel === 'choose' ? 'is-focused' : ''} onBack={() => focus('todo')}>
          <ChoosePage data={data} mode={mode} selectedIds={selectedIds} agreed={agreed} onChange={setSelectedIds} onAgreementChange={() => setAgreed((value) => !value)} onNext={() => focus('confirm2')} onBack={() => focus('todo')} />
        </DebtPhonePreview>
        <DebtPhonePreview panel="confirm2" title="贷款确认" className={focusedPanel === 'confirm2' ? 'is-focused' : ''} onBack={() => focus('choose')}>
          <PlanConfirmPage2 selected={selected} plan={data.plan} repaymentPlan={repaymentPlan} onPlan={() => setConfirm2Sheet('plan')} onSubmit={() => setConfirm2Sheet('notice')} onMethod={() => setConfirm2Sheet('method')} onTerm={() => setConfirm2Sheet('term')} onPurpose={() => setConfirm2Sheet('purpose')} onRepaymentAccount={() => setConfirm2Sheet('repaymentAccount')} onReceivingAccount={() => setConfirm2Sheet('receivingAccount')} />
          {confirm2Sheet === 'plan' ? <PlanSheet items={repaymentPlan} title="新还款计划" onClose={() => setConfirm2Sheet(null)} /> : null}
          {confirm2Sheet === 'notice' ? <NoticeSheet onClose={() => setConfirm2Sheet(null)} onSubmit={submit} /> : null}
          {confirm2Sheet === 'method' ? <DetailSheet title="还款方式" value={`${data.plan.repaymentMethod}。${data.plan.repaymentStages.map((stage) => stage.description).join('；')}。`} onClose={() => setConfirm2Sheet(null)} /> : null}
          {confirm2Sheet === 'term' ? <DetailSheet title="借款时长" value={`本方案借款时长为${data.plan.term || '36期'}。`} onClose={() => setConfirm2Sheet(null)} /> : null}
          {confirm2Sheet === 'purpose' ? <DetailSheet title="借款用途" value={data.plan.purpose} onClose={() => setConfirm2Sheet(null)} /> : null}
          {confirm2Sheet === 'repaymentAccount' ? <DetailSheet title="还款账户" value={`还款账户：${data.plan.repaymentAccount}`} onClose={() => setConfirm2Sheet(null)} /> : null}
          {confirm2Sheet === 'receivingAccount' ? <DetailSheet title="收款账户" value={`收款账户：${data.plan.receivingAccount}`} onClose={() => setConfirm2Sheet(null)} /> : null}
          {submitting ? <div className="submit-loading"><Spin tip="正在提交..." /></div> : null}
        </DebtPhonePreview>
        <DebtPhonePreview panel="processing" title="处理结果" className={focusedPanel === 'processing' ? 'is-focused' : ''} onBack={() => focus('todo')}>
          <ProcessingPage onTodo={() => focus('todo')} />
        </DebtPhonePreview>
      </main>
    </div>
  </div>;
}
