import { useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { Button, Empty, Spin, message } from 'antd';
import { CheckCircleFilled, CheckOutlined, CloseOutlined, DownOutlined, EyeOutlined, FileTextOutlined, LeftOutlined, LockOutlined, MoreOutlined, RightOutlined, ScanOutlined, UpOutlined, WalletOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { getComboRepaymentData, getComboRepaymentPlan, submitComboRepayment } from '../../../mock';
import type { ComboBankCard, ComboCoupon, ComboFaceStage, ComboPanel, ComboRepaymentData, ComboRepaymentItem, ComboRepaymentScheme, ComboOverlay } from '../../../types';
import './index.css';

const money = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const initialAmount = 10000;

type Action =
  | { type: 'init'; data: ComboRepaymentData }
  | { type: 'panel'; value: ComboPanel }
  | { type: 'overlay'; value: ComboOverlay }
  | { type: 'amount'; value: string }
  | { type: 'term'; value: number }
  | { type: 'scheme'; value: string }
  | { type: 'coupon'; value?: string }
  | { type: 'purpose'; value: string }
  | { type: 'card'; value: string }
  | { type: 'plan'; value: ComboRepaymentItem[] }
  | { type: 'stage'; value: string }
  | { type: 'planExpanded'; value: boolean }
  | { type: 'password'; value: string }
  | { type: 'passwordError'; value: string }
  | { type: 'face'; value: ComboFaceStage }
  | { type: 'submitting'; value: boolean }
  | { type: 'result'; value: { applicationNo: string; submittedAt: string; amount: number; bankCard: string } };

interface State {
  data?: ComboRepaymentData;
  panel: ComboPanel;
  overlay: ComboOverlay;
  amount: string;
  term: number;
  schemeId: string;
  couponId?: string;
  purpose: string;
  bankCardId: string;
  plan: ComboRepaymentItem[];
  expandedStages: string[];
  planExpanded: boolean;
  password: string;
  passwordError: string;
  faceStage: ComboFaceStage;
  submitting: boolean;
  result?: { applicationNo: string; submittedAt: string; amount: number; bankCard: string };
}

const panelForPath = (path: string): { panel: ComboPanel; overlay: ComboOverlay } => {
  if (path.endsWith('/loan-term')) return { panel: 'loan', overlay: 'term' };
  if (path.endsWith('/coupons')) return { panel: 'loan', overlay: 'coupon' };
  if (path.endsWith('/repayment-plan')) return { panel: 'loan', overlay: 'repaymentPlan' };
  if (path.endsWith('/detail')) return { panel: 'detail', overlay: null };
  if (path.endsWith('/result')) return { panel: 'result', overlay: null };
  if (path.endsWith('/repayment-records')) return { panel: 'records', overlay: null };
  if (path.endsWith('/loan')) return { panel: 'loan', overlay: null };
  return { panel: 'home', overlay: null };
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'init': {
      const firstTerm = action.data.terms.find((item) => item.term === 24) ?? action.data.terms[0];
      return { ...state, data: action.data, term: firstTerm?.term ?? 0, schemeId: firstTerm?.schemes[0]?.id ?? '', purpose: '个人消费', bankCardId: action.data.bankCards.find((item) => item.enabled)?.id ?? '' };
    }
    case 'panel': return { ...state, panel: action.value, overlay: null };
    case 'overlay': return { ...state, overlay: action.value };
    case 'amount': return { ...state, amount: action.value };
    case 'term': {
      const term = state.data?.terms.find((item) => item.term === action.value);
      return { ...state, term: action.value, schemeId: term?.schemes[0]?.id ?? '', overlay: null };
    }
    case 'scheme': return { ...state, schemeId: action.value };
    case 'coupon': return { ...state, couponId: action.value };
    case 'purpose': return { ...state, purpose: action.value };
    case 'card': return { ...state, bankCardId: action.value };
    case 'plan': return { ...state, plan: action.value };
    case 'stage': return { ...state, expandedStages: state.expandedStages.includes(action.value) ? state.expandedStages.filter((item) => item !== action.value) : [...state.expandedStages, action.value] };
    case 'planExpanded': return { ...state, planExpanded: action.value };
    case 'password': return { ...state, password: action.value, passwordError: '' };
    case 'passwordError': return { ...state, passwordError: action.value };
    case 'face': return { ...state, faceStage: action.value };
    case 'submitting': return { ...state, submitting: action.value };
    case 'result': return { ...state, result: action.value, panel: 'result', overlay: null, submitting: false, faceStage: 'ready', password: '' };
    default: return state;
  }
}

function MobileHeader({ title, onBack, onClose, onMore }: { title: string; onBack: () => void; onClose: () => void; onMore: () => void }) {
  return <header className="combo-header"><button type="button" className="combo-back" onClick={onBack}><LeftOutlined /> 返回</button><strong>{title}</strong><div className="combo-header-actions"><button type="button" aria-label="更多" onClick={onMore}><MoreOutlined /></button><button type="button" aria-label="关闭" onClick={onClose}><CloseOutlined /></button></div></header>;
}

function Frame({ title, flat = false, focused, onBack, onClose, onMore, children }: { title: string; flat?: boolean; focused: boolean; onBack: () => void; onClose: () => void; onMore: () => void; children: ReactNode }) {
  return <section className={`combo-frame ${flat ? 'combo-flat-frame' : ''} ${focused ? 'is-focused' : ''}`}><MobileHeader title={title} onBack={onBack} onClose={onClose} onMore={onMore} />{children}</section>;
}

function CardSection({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`combo-card ${className}`}><div className="combo-card-title"><h2>{title}</h2>{action}</div>{children}</section>;
}

function SummaryCard({ data }: { data: ComboRepaymentData }) {
  return <section className="credit-hero"><span>授信总额度（元）</span><strong>{money(data.credit.total)}</strong><div className="credit-grid"><div><small>已用额度</small><b>{money(data.credit.used)}</b></div><div><small>可借额度</small><b>{money(data.credit.available)}</b></div></div><div className="credit-foot"><span>日利率 {data.credit.dailyRateRange}</span><span>{data.credit.repaymentMethod}</span></div></section>;
}

function HomePanel({ data, onLoan }: { data: ComboRepaymentData; onLoan: () => void }) {
  return <div className="combo-scroll"><SummaryCard data={data} /><div className="combo-home-copy"><WalletOutlined /><div><b>灵活借款，按需使用</b><span>额度循环使用，借款成功后按计划还款</span></div></div><button type="button" className="combo-primary" onClick={onLoan}>去借款 <RightOutlined /></button></div>;
}

function StageDetails({ scheme, expanded, onToggle }: { scheme: ComboRepaymentScheme; expanded: string[]; onToggle: (id: string) => void }) {
  return <div className="scheme-list">{scheme.stages.map((stage) => { const open = expanded.includes(stage.id); return <div className="scheme-stage" key={stage.id}><button type="button" className="stage-heading" onClick={() => onToggle(stage.id)}><span>第{stage.startPeriod}-{stage.endPeriod}期</span><b>{stage.repaymentLabel}·本金{stage.principalRatio}% <DownOutlined className={open ? 'rotate' : ''} /></b></button>{open ? <div className="stage-items">{stage.items.map((item) => <div className="stage-item" key={item.period}><span>第{item.period}期</span><b>{money(item.totalAmount)} 元 {item.discount ? <em>优惠 {money(item.discount)}</em> : null}</b></div>)}</div> : null}</div>; })}</div>;
}

function SchemeCard({ scheme, selected, expanded, onSelect, onToggle }: { scheme: ComboRepaymentScheme; selected: boolean; expanded: string[]; onSelect: () => void; onToggle: (id: string) => void }) {
  return <div className={`scheme-option ${selected ? 'selected' : ''}`}><button type="button" className={`scheme-radio ${selected ? 'checked' : ''}`} onClick={onSelect} aria-label={`选择${scheme.name}`}>{selected ? <CheckOutlined /> : null}</button><div className="scheme-option-body"><div className="scheme-title"><b>{scheme.name}</b><span>年利率 {scheme.annualRate.toFixed(2)}%</span></div><StageDetails scheme={scheme} expanded={expanded} onToggle={onToggle} /></div></div>;
}

function PlanRows({ items, expanded, onToggle }: { items: ComboRepaymentItem[]; expanded: boolean; onToggle: () => void }) {
  const visible = expanded ? items : items.slice(0, 2);
  return <><div className={`plan-rows ${expanded ? 'expanded' : ''}`}>{visible.map((item) => <div className="plan-row" key={item.period}><span>第{item.period}期 <small>{item.date}</small></span><b>{money(item.totalAmount)} 元 {item.discount ? <em>优惠 {money(item.discount)}</em> : null}</b></div>)}</div>{items.length > 2 ? <button type="button" className="expand-link" onClick={onToggle}>{expanded ? <>收起 <UpOutlined /></> : <>展开全部{items.length}期 <DownOutlined /></>}</button> : null}</>;
}

function LoanPanel({ state, dispatch, onNext, onOverlay }: { state: State; dispatch: React.Dispatch<Action>; onNext: () => void; onOverlay: (overlay: ComboOverlay) => void }) {
  const data = state.data!;
  const termConfig = data.terms.find((item) => item.term === state.term);
  const coupon = data.coupons.find((item) => item.id === state.couponId);
  return <div className="combo-scroll loan-scroll"><CardSection title="借款金额"><div className="amount-input"><span>¥</span><input value={state.amount} inputMode="decimal" placeholder="请输入借款金额" onChange={(event) => dispatch({ type: 'amount', value: event.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1').replace(/^(\d+\.\d{0,2}).*$/, '$1') })} /><small>最多可借 {money(data.credit.available)} 元</small></div></CardSection><CardSection title="借款配置"><ConfigRow label="还款方式"><b>{data.credit.repaymentMethod}</b></ConfigRow><ConfigRow label="借款时长" onClick={() => onOverlay('term')}><b>{state.term ? `${state.term}个月` : '请选择'} <RightOutlined /></b></ConfigRow><div className="config-block"><div className="config-row-title"><span>还款方案</span><button type="button" onClick={() => onOverlay('term')}>更换方案 <RightOutlined /></button></div>{termConfig?.schemes.map((scheme) => <SchemeCard key={scheme.id} scheme={scheme} selected={scheme.id === state.schemeId} expanded={state.expandedStages} onSelect={() => dispatch({ type: 'scheme', value: scheme.id })} onToggle={(id) => dispatch({ type: 'stage', value: id })} />)}</div><ConfigRow label="日利率"><b className="rate-value">{termConfig?.schemes.find((item) => item.id === state.schemeId)?.dailyRate.toFixed(3)}%</b></ConfigRow><ConfigRow label="优惠券" onClick={() => onOverlay('coupon')}><b className={coupon ? 'discount-value' : ''}>{coupon ? `${coupon.name} -${coupon.discount}元` : '暂无优惠券'} <RightOutlined /></b></ConfigRow><ConfigRow label="还款计划" onClick={() => onOverlay('repaymentPlan')}><b>查看详情 <EyeOutlined /></b></ConfigRow><ConfigRow label="借款用途"><select value={state.purpose} onChange={(event) => dispatch({ type: 'purpose', value: event.target.value })}><option value="">请选择借款用途</option><option value="个人消费">个人消费</option><option value="装修家居">装修家居</option><option value="教育培训">教育培训</option></select></ConfigRow><ConfigRow label="收款账户"><select value={state.bankCardId} onChange={(event) => dispatch({ type: 'card', value: event.target.value })}><option value="">请选择收款账户</option>{data.bankCards.filter((item) => item.enabled).map((card) => <option value={card.id} key={card.id}>{card.bankName}（{card.maskedNo}）</option>)}</select></ConfigRow></CardSection><button type="button" className="combo-primary" onClick={onNext}>下一步 <RightOutlined /></button>{state.overlay === 'term' ? <TermSheet state={state} dispatch={dispatch} onClose={() => onOverlay(null)} /> : null}{state.overlay === 'coupon' ? <CouponSheet coupons={data.coupons} selected={state.couponId} onSelect={(id) => dispatch({ type: 'coupon', value: id })} onClose={() => onOverlay(null)} /> : null}{state.overlay === 'repaymentPlan' ? <PlanSheet items={state.plan} expanded={state.planExpanded} onToggle={() => dispatch({ type: 'planExpanded', value: !state.planExpanded })} onClose={() => onOverlay(null)} /> : null}</div>;
}

function ConfigRow({ label, onClick, children }: { label: string; onClick?: () => void; children: ReactNode }) {
  return <div className={`config-row ${onClick ? 'clickable' : ''}`} onClick={onClick}><span>{label}</span><div>{children}</div></div>;
}

function Sheet({ title, onClose, children, className = '' }: { title: string; onClose: () => void; children: ReactNode; className?: string }) {
  return <div className="combo-mask" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={`combo-sheet ${className}`} role="dialog" aria-modal="true"><div className="sheet-handle" /><div className="sheet-title"><h2>{title}</h2><button type="button" aria-label="关闭" onClick={onClose}><CloseOutlined /></button></div><div className="sheet-content">{children}</div></section></div>;
}

function TermSheet({ state, dispatch, onClose }: { state: State; dispatch: React.Dispatch<Action>; onClose: () => void }) {
  const terms = state.data?.terms ?? [];
  const selected = terms.find((item) => item.term === state.term);
  return <Sheet title="选择借款时长" onClose={onClose} className="term-sheet"><div className="term-list">{terms.map((item) => <button type="button" className={item.term === state.term ? 'active' : ''} key={item.term} onClick={() => dispatch({ type: 'term', value: item.term })}><span>{item.term}个月</span>{item.term === state.term ? <CheckOutlined /> : null}</button>)}</div>{selected ? <div className="sheet-schemes"><h3>可选还款方案</h3>{selected.schemes.map((scheme) => <div className={`sheet-scheme ${scheme.id === state.schemeId ? 'active' : ''}`} key={scheme.id} onClick={() => dispatch({ type: 'scheme', value: scheme.id })}><span className="scheme-radio small">{scheme.id === state.schemeId ? <CheckOutlined /> : null}</span><b>{scheme.name}</b><span>年利率 {scheme.annualRate.toFixed(2)}%</span></div>)}</div> : null}<button type="button" className="sheet-primary" onClick={onClose}>确认选择</button></Sheet>;
}

function CouponSheet({ coupons, selected, onSelect, onClose }: { coupons: ComboCoupon[]; selected?: string; onSelect: (id?: string) => void; onClose: () => void }) {
  return <Sheet title="选择优惠券" onClose={onClose} className="coupon-sheet"><div className="coupon-list">{coupons.map((coupon) => <button type="button" className={coupon.id === selected ? 'active' : ''} key={coupon.id} onClick={() => onSelect(coupon.id)}><span className="coupon-amount">¥<b>{coupon.discount}</b></span><span className="coupon-copy"><b>{coupon.name}</b><small>满{money(coupon.threshold)}元可用 · 有效期至 {coupon.expiresAt}</small></span>{coupon.id === selected ? <CheckOutlined /> : null}</button>)}</div><button type="button" className="sheet-primary" onClick={onClose}>确认使用</button></Sheet>;
}

function PlanSheet({ items, expanded, onToggle, onClose }: { items: ComboRepaymentItem[]; expanded: boolean; onToggle: () => void; onClose: () => void }) {
  return <Sheet title="还款计划" onClose={onClose} className="plan-sheet"><div className="plan-summary"><span>预计还款总额</span><b>{money(items.reduce((total, item) => total + item.totalAmount, 0))} 元</b></div>{items.length ? <PlanRows items={items} expanded={expanded} onToggle={onToggle} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请输入金额后查看还款计划" />}</Sheet>;
}

function DetailPanel({ state, onConfirm, onPlan }: { state: State; onConfirm: () => void; onPlan: () => void }) {
  const data = state.data!;
  const scheme = data.terms.flatMap((item) => item.schemes).find((item) => item.id === state.schemeId);
  const card = data.bankCards.find((item) => item.id === state.bankCardId);
  const coupon = data.coupons.find((item) => item.id === state.couponId);
  return <div className="combo-scroll detail-scroll"><div className="confirm-tip">请确认以下借款信息，确认后将进入安全验证流程</div><CardSection title="借款信息" className="detail-card"><InfoRow label="借款金额" value={`${money(Number(state.amount))} 元`} /><InfoRow label="还款方式" value={data.credit.repaymentMethod} /><InfoRow label="年利率" value={`${scheme?.annualRate.toFixed(2) ?? '--'}%`} danger /><InfoRow label="优惠金额" value={coupon ? `-${money(coupon.discount)} 元` : '无'} highlight /><InfoRow label="还款日" value="每月18日" /><InfoRow label="借款用途" value={state.purpose} /><InfoRow label="收款账户" value={card ? `${card.bankName}（${card.maskedNo}）` : '--'} /><InfoRow label="借款时长" value={`${state.term}个月`} /><InfoRow label="起止日期" value={`2026-09-18 ~ 2028-09-18`} /></CardSection><CardSection title="还款计划" className="detail-card" action={<button type="button" className="text-button" onClick={onPlan}>查看完整计划 <RightOutlined /></button>}><PlanRows items={state.plan} expanded={state.planExpanded} onToggle={() => onPlan()} /></CardSection><p className="no-early">本次借款不支持提前还款</p><button type="button" className="combo-primary" onClick={onConfirm}>确认借款 <RightOutlined /></button></div>;
}

function InfoRow({ label, value, danger = false, highlight = false }: { label: string; value: string; danger?: boolean; highlight?: boolean }) {
  return <div className="info-row"><span>{label}</span><b className={`${danger ? 'danger-value' : ''} ${highlight ? 'highlight-value' : ''}`}>{value}</b></div>;
}

function PasswordSheet({ state, dispatch, onSuccess, onClose }: { state: State; dispatch: React.Dispatch<Action>; onSuccess: () => void; onClose: () => void }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
  const enter = (key: string) => { if (key === '⌫') { dispatch({ type: 'password', value: state.password.slice(0, -1) }); return; } if (key && state.password.length < 6) dispatch({ type: 'password', value: `${state.password}${key}` }); };
  const submit = () => { if (state.password.length !== 6) { dispatch({ type: 'passwordError', value: '请输入6位交易密码' }); return; } if (state.password !== '123456') { dispatch({ type: 'passwordError', value: '交易密码错误，请重新输入' }); dispatch({ type: 'password', value: '' }); return; } onSuccess(); };
  return <Sheet title="请输入交易密码" onClose={onClose} className="password-sheet"><div className="password-lock"><LockOutlined /> 请输入6位数字密码</div><div className="password-dots">{Array.from({ length: 6 }, (_, index) => <i key={index} className={index < state.password.length ? 'filled' : ''} />)}</div><div className="password-error">{state.passwordError}</div><div className="number-keyboard">{keys.map((key, index) => key ? <button type="button" key={`${key}-${index}`} onClick={() => enter(key)}>{key}</button> : <span key={`empty-${index}`} />)}</div><button type="button" className="sheet-primary" disabled={state.password.length !== 6} onClick={submit}>确认借款</button></Sheet>;
}

function FaceSheet({ stage, onStart, onClose }: { stage: ComboFaceStage; onStart: () => void; onClose: () => void }) {
  return <Sheet title="人脸识别" onClose={onClose} className="face-sheet">{stage === 'verified' ? <div className="face-result"><CheckCircleFilled /><h3>识别成功</h3><p>正在提交借款申请</p></div> : <div className="face-content"><div className={`face-ring ${stage === 'scanning' ? 'scanning' : ''}`}><ScanOutlined /></div><h3>{stage === 'scanning' ? '识别中，请保持正脸' : '请进行人脸识别'}</h3><p>{stage === 'scanning' ? '请保持光线充足并保持不动' : '用于确认您的身份信息，保障借款安全'}</p>{stage === 'ready' ? <button type="button" className="sheet-primary" onClick={onStart}>开始识别</button> : <div className="face-progress">正在验证身份...</div>}</div>}</Sheet>;
}

function ResultPanel({ state, onRecords }: { state: State; onRecords: () => void }) {
  const result = state.result ?? { applicationNo: 'CR202609070001', submittedAt: '2026-09-07 10:00', amount: Number(state.amount) || initialAmount, bankCard: '招商银行（尾号 2866）' };
  return <div className="combo-scroll result-scroll"><div className="result-icon"><CheckCircleFilled /></div><h1>借款申请已提交</h1><p className="result-subtitle">预计 5 分钟内完成放款</p><div className="result-timeline"><div className="timeline-item active"><i /><div><b>提交成功</b><span>{result.submittedAt}</span><p>等待放款 ¥{money(result.amount)}，将通过微信/短信通知您</p></div></div><div className="timeline-item"><i /><div><b>放款成功</b><span>待处理</span></div></div></div><CardSection title="借款信息"><InfoRow label="借款金额" value={`${money(result.amount)} 元`} /><InfoRow label="收款账户" value={result.bankCard} /><InfoRow label="申请编号" value={result.applicationNo} /></CardSection><div className="invite-card"><div><b>邀请好友领红包</b><span>每邀请1位好友可得最高38元红包</span></div><button type="button" onClick={() => message.info('邀请链接已准备，分享功能为原型模拟')}>去邀请</button></div><p className="records-tip">可在【个人中心】-【借还记录】查看</p><button type="button" className="combo-primary" onClick={onRecords}>完成</button></div>;
}

function RecordsPanel({ state, onResult }: { state: State; onResult: () => void }) {
  const records = state.data?.records ?? [];
  const current = state.result ? [{ id: state.result.applicationNo, applicationNo: state.result.applicationNo, amount: state.result.amount, bankName: state.result.bankCard, maskedNo: '', status: '处理中' as const, createdAt: state.result.submittedAt }, ...records] : records;
  return <div className="combo-scroll records-scroll"><div className="records-heading"><div className="records-avatar">借</div><div><h1>个人中心</h1><span>借还记录</span></div></div><CardSection title="借还记录">{current.map((item) => <div className="record-item" key={item.id}><div><b>{item.applicationNo}</b><span>{item.createdAt}</span></div><div className="record-right"><strong>¥{money(item.amount)}</strong><em>{item.status}</em></div></div>)}</CardSection><button type="button" className="text-button back-result" onClick={onResult}>返回借款结果</button></div>;
}

function MoreSheet({ onClose }: { onClose: () => void }) {
  return <Sheet title="更多" onClose={onClose} className="more-sheet"><button type="button" onClick={() => message.info('办理说明：选择金额、方案和账户后提交借款')}><FileTextOutlined /> 查看办理说明 <RightOutlined /></button><button type="button" onClick={() => message.info('客服工作时间：09:00-18:00')}><WalletOutlined /> 联系客服 <RightOutlined /></button></Sheet>;
}

export default function ComboRepaymentWithdrawalPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [api, contextHolder] = message.useMessage();
  const initial = panelForPath(location.pathname);
  const [state, dispatch] = useReducer(reducer, { panel: initial.panel, overlay: initial.overlay, amount: '', term: 24, schemeId: '', purpose: '', bankCardId: '', plan: [], expandedStages: [], planExpanded: false, password: '', passwordError: '', faceStage: 'ready', submitting: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => { setLoading(true); setError(false); getComboRepaymentData().then((response) => dispatch({ type: 'init', data: response.data })).catch(() => setError(true)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (!state.data || !Number(state.amount) || !state.term || !state.schemeId) return; const coupon = state.data.coupons.find((item) => item.id === state.couponId); getComboRepaymentPlan({ amount: Number(state.amount), term: state.term, schemeId: state.schemeId, couponDiscount: coupon?.discount }).then((response) => dispatch({ type: 'plan', value: response.data })).catch(() => api.error('还款计划加载失败，请稍后重试')); }, [state.data, state.amount, state.term, state.schemeId, state.couponId, api]);
  useEffect(() => { if (state.faceStage !== 'scanning') return undefined; const timer = window.setTimeout(() => dispatch({ type: 'face', value: 'verified' }), 1200); return () => window.clearTimeout(timer); }, [state.faceStage]);
  useEffect(() => { if (state.faceStage !== 'verified') return undefined; const timer = window.setTimeout(() => { void submit(); }, 700); return () => window.clearTimeout(timer); }, [state.faceStage]);

  const selectedCard = useMemo(() => state.data?.bankCards.find((item) => item.id === state.bankCardId), [state.data, state.bankCardId]);
  const submit = async () => { if (state.submitting || !state.data) return; dispatch({ type: 'submitting', value: true }); try { const response = await submitComboRepayment({ amount: Number(state.amount), term: state.term, schemeId: state.schemeId, couponDiscount: 0, bankCard: selectedCard ? `${selectedCard.bankName}（${selectedCard.maskedNo}）` : '' }); dispatch({ type: 'result', value: { applicationNo: response.data.applicationNo, submittedAt: response.data.submittedAt, amount: response.data.loanAmount, bankCard: response.data.bankCard } }); api.success(response.message); } catch { dispatch({ type: 'submitting', value: false }); api.error('借款提交失败，请稍后重试'); } };
  const next = () => { const amount = Number(state.amount); if (!state.amount || !Number.isFinite(amount) || amount <= 0 || amount > (state.data?.credit.available ?? 0)) { api.warning('请输入有效的借款金额，且不能超过可借额度'); return; } if (!state.term || !state.schemeId || !state.purpose || !state.bankCardId) { api.warning('请完成借款时长、还款方案、用途和收款账户选择'); return; } dispatch({ type: 'panel', value: 'detail' }); };
  const close = () => navigate('/welcome');
  const back = (panel: ComboPanel) => dispatch({ type: 'panel', value: panel });
  if (loading) return <div className="combo-mobile-frame combo-loading"><Spin tip="正在加载组合还款提现信息..." /></div>;
  if (error || !state.data) return <div className="combo-mobile-frame combo-loading"><Empty description="组合还款提现信息加载失败"><Button onClick={load}>重新加载</Button></Empty></div>;

  return <div className="combo-host">{contextHolder}<div className="combo-canvas-heading"><div><strong>组合还款提现</strong><span>银行宝签约 · 小程序流程预览</span></div><span className="canvas-size">370 × 844</span></div><div className="combo-canvas-scroll"><main className="combo-canvas"><Frame title="首页" focused={state.panel === 'home'} onBack={() => navigate(-1)} onClose={close} onMore={() => dispatch({ type: 'overlay', value: 'more' })}><HomePanel data={state.data} onLoan={() => back('loan')} /></Frame><Frame title="借款" focused={state.panel === 'loan'} onBack={() => back('home')} onClose={close} onMore={() => dispatch({ type: 'overlay', value: 'more' })}><LoanPanel state={state} dispatch={dispatch} onNext={next} onOverlay={(overlay) => dispatch({ type: 'overlay', value: overlay })} />{state.overlay === 'more' ? <MoreSheet onClose={() => dispatch({ type: 'overlay', value: null })} /> : null}{state.overlay === 'password' ? <PasswordSheet state={state} dispatch={dispatch} onSuccess={() => { dispatch({ type: 'overlay', value: 'face' }); dispatch({ type: 'face', value: 'ready' }); }} onClose={() => dispatch({ type: 'overlay', value: null })} /> : null}{state.overlay === 'face' ? <FaceSheet stage={state.faceStage} onStart={() => dispatch({ type: 'face', value: 'scanning' })} onClose={() => dispatch({ type: 'overlay', value: null })} /> : null}{state.submitting ? <div className="combo-submit-loading"><Spin tip="正在提交借款..." /></div> : null}</Frame><Frame title="详细信息" focused={state.panel === 'detail'} onBack={() => back('loan')} onClose={close} onMore={() => dispatch({ type: 'overlay', value: 'more' })}><DetailPanel state={state} onConfirm={() => dispatch({ type: 'overlay', value: 'password' })} onPlan={() => dispatch({ type: 'overlay', value: 'repaymentPlan' })} />{state.overlay === 'password' ? <PasswordSheet state={state} dispatch={dispatch} onSuccess={() => { dispatch({ type: 'overlay', value: 'face' }); dispatch({ type: 'face', value: 'ready' }); }} onClose={() => dispatch({ type: 'overlay', value: null })} /> : null}{state.overlay === 'face' ? <FaceSheet stage={state.faceStage} onStart={() => dispatch({ type: 'face', value: 'scanning' })} onClose={() => dispatch({ type: 'overlay', value: null })} /> : null}</Frame><Frame title="借款结果" focused={state.panel === 'result'} onBack={() => back('detail')} onClose={close} onMore={() => dispatch({ type: 'overlay', value: 'more' })}><ResultPanel state={state} onRecords={() => back('records')} /></Frame><Frame title="借还记录" focused={state.panel === 'records'} onBack={() => back('result')} onClose={close} onMore={() => dispatch({ type: 'overlay', value: 'more' })}><RecordsPanel state={state} onResult={() => back('result')} /></Frame></main></div></div>;
}
