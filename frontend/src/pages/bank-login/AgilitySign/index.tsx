import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button, Empty, Spin, message } from 'antd';
import {
  CheckCircleFilled,
  CheckOutlined,
  CloseOutlined,
  CopyOutlined,
  DownOutlined,
  EyeOutlined,
  FileTextOutlined,
  HourglassOutlined,
  LeftOutlined,
  LockOutlined,
  MoreOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  ScanOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getAgilitySignData } from '../../../mock';
import type { AgilitySignData, SignPlanStatus, SignRepaymentPlan } from '../../../types/agilitySign';
import './index.css';

type Overlay = 'more' | 'plan' | 'contract' | 'password' | 'face' | null;
type FaceStage = 'ready' | 'scanning' | 'verified';

const money = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function MobileHeader({ title, onBack, onClose, onMore }: { title: string; onBack: () => void; onClose: () => void; onMore: () => void }) {
  return <header className="sign-header">
    <button className="header-back" onClick={onBack} type="button"><LeftOutlined /> 返回</button>
    <strong>{title}</strong>
    <div className="header-actions">
      <button aria-label="更多" onClick={onMore} type="button"><MoreOutlined /></button>
      <button aria-label="关闭" onClick={onClose} type="button"><CloseOutlined /></button>
    </div>
  </header>;
}

function PhonePreview({ title, children, className = '', onBack, onClose, onMore }: { title: string; children: ReactNode; className?: string; onBack: () => void; onClose: () => void; onMore: () => void }) {
  return <section className={`preview-phone ${className}`}>
    <MobileHeader title={title} onBack={onBack} onClose={onClose} onMore={onMore} />
    {children}
  </section>;
}

function SectionCard({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`sign-card ${className}`}>
    <div className="sign-card-title"><h2>{title}</h2>{action}</div>
    {children}
  </section>;
}

function AmountHero({ data, onAdjust }: { data: AgilitySignData; onAdjust: () => void }) {
  return <section className="amount-hero">
    <div className="amount-label">使用中金额(元)</div>
    <div className="amount-value">{money(data.usedAmount)}</div>
    <div className="amount-notice"><span>还款日当天 09:00 至 16:00 可进行还款</span><span>还款有难度？</span><button type="button" onClick={onAdjust}>点击申请贷款调整</button></div>
  </section>;
}

function LoanInfo({ data, onMore }: { data: AgilitySignData; onMore: () => void }) {
  return <SectionCard title="借款信息" action={<button type="button" className="text-action" onClick={onMore}>查看更多 <RightOutlined /></button>}>
    <div className="loan-info-grid">
      <div><span>借款金额</span><b>{money(data.loanAmount)}</b></div>
      <div><span>借款期数</span><b>{data.totalPeriods}期</b></div>
      <div><span>上传用款凭证</span><b className="status-success"><CheckCircleFilled /> {data.voucherStatus}</b></div>
    </div>
  </SectionCard>;
}

function PlanItem({ item, compact = false }: { item: SignRepaymentPlan; compact?: boolean }) {
  return <div className={`timeline-item ${item.status === '已还' ? 'is-paid' : ''} ${compact ? 'compact' : ''}`}>
    <div className="timeline-dot" />
    <div className="timeline-content">
      <div className="timeline-meta"><b>第{item.period}期</b><span>{item.date}</span></div>
      <div className="timeline-total">应还 {money(item.total)} 元</div>
      <div className="timeline-detail"><span>本金 {money(item.principal)}</span><span>利息 {money(item.interest)}</span>{item.discount ? <span>优惠 {money(item.discount)}</span> : null}</div>
    </div>
  </div>;
}

function RepaymentPlan({ data }: { data: AgilitySignData }) {
  const [tab, setTab] = useState<SignPlanStatus>('未还');
  const [expanded, setExpanded] = useState(false);
  const plans = useMemo(() => data.repaymentPlans.filter((item) => item.status === tab), [data.repaymentPlans, tab]);
  const paidPlans = data.repaymentPlans.filter((item) => item.status === '已还');
  const items = tab === '已还' ? paidPlans : plans;
  const canExpand = items.length > 2;
  useEffect(() => setExpanded(false), [tab]);
  return <SectionCard title="还款计划" className="repayment-card">
    <div className="plan-tabs" role="tablist">
      {(['未还', '已还'] as SignPlanStatus[]).map((item) => <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)} type="button">{item}</button>)}
    </div>
    {items.length ? <div className={`timeline-list ${expanded ? 'expanded' : ''}`}>
      {items.map((item) => <PlanItem item={item} key={`${item.status}-${item.period}`} />)}
    </div> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无还款计划" />}
    {canExpand ? <button type="button" className="expand-plan" onClick={() => setExpanded((value) => !value)}>{expanded ? <>收起 <UpOutlined /></> : <>查看更多 <DownOutlined /></>}</button> : null}
  </SectionCard>;
}

function DetailPage({ data, onAdjust, onMore }: { data: AgilitySignData; onAdjust: () => void; onMore: () => void }) {
  return <div className="sign-scroll">
    <AmountHero data={data} onAdjust={onAdjust} />
    <LoanInfo data={data} onMore={onMore} />
    <RepaymentPlan data={data} />
    <button className="early-repay-button" type="button" onClick={() => message.info('提前还款功能将在下一步为您开放')}>提前还款</button>
    <button className="detail-adjust-link" type="button" onClick={onAdjust}>还款有难度？申请贷款调整 <RightOutlined /></button>
  </div>;
}

function CompareValue({ label, oldValue, newValue, emphasize = false }: { label: string; oldValue?: string | number; newValue: string | number; emphasize?: boolean }) {
  const changed = oldValue !== undefined && String(oldValue) !== String(newValue);
  return <div className={`compare-row ${emphasize ? 'emphasize' : ''}`}>
    <span className="compare-label">{label}</span>
    <div className="compare-values">{changed ? <span className="old-value">{oldValue}</span> : null}<b>{newValue}</b></div>
  </div>;
}

function AdjustmentDetail({ data }: { data: AgilitySignData }) {
  const { adjustment: item } = data;
  return <SectionCard title="贷款调整详情" className="adjustment-detail-card">
    <div className="loan-number-row"><span>贷款编号</span><b>{data.loanNo}</b><button type="button" aria-label="复制贷款编号" onClick={() => { void navigator.clipboard?.writeText(data.loanNo); message.success('贷款编号已复制'); }}><CopyOutlined /></button></div>
    <div className="loan-amount-highlight"><span>贷款金额</span><strong>{money(data.loanAmount)}<small> 元</small></strong></div>
    <div className="compare-list">
      <CompareValue label="总期数" oldValue={item.originalTotalPeriods + '期'} newValue={item.newTotalPeriods + '期'} />
      <CompareValue label="新还款期数" oldValue={item.originalRemainingPeriods + '期'} newValue={item.newRemainingPeriods + '期'} />
      <CompareValue label="还款方式" oldValue={item.originalRepaymentMethod} newValue={item.newRepaymentMethod} />
      <CompareValue label="正常利率" oldValue={item.originalNormalRate} newValue={item.newNormalRate} />
      <CompareValue label="罚息利率" oldValue={item.originalPenaltyRate} newValue={item.newPenaltyRate} />
      <CompareValue label="复息利率" oldValue={item.originalCompoundRate} newValue={item.newCompoundRate} />
      <CompareValue label="利息减免" newValue={item.interestRelief} />
      <CompareValue label="首期延迟" newValue={item.firstPaymentDelay} />
    </div>
  </SectionCard>;
}

function CombinationScheme({ data }: { data: AgilitySignData }) {
  const [showDescription, setShowDescription] = useState(false);
  return <SectionCard title="组合还款方案" className="scheme-card">
    <div className="scheme-list">
      {data.schemes.map((stage, index) => <div className="scheme-stage" key={stage.period}>
        <div className="scheme-stage-heading"><b>第{index + 1}阶段</b><span>{stage.period} · {stage.method} · {stage.principalRatio}</span></div>
        {showDescription ? <p>{stage.description}</p> : null}
      </div>)}
    </div>
    <button type="button" className="scheme-toggle" onClick={() => setShowDescription((value) => !value)}>{showDescription ? '收起还款方式描述' : '展开还款方式描述'} <DownOutlined /></button>
    <div className="scheme-mini-timeline"><span><i />首期：第1期</span><em /><span><i />末期：第{data.remainingPeriods}期</span></div>
  </SectionCard>;
}

function NewPlanCard({ data, onView }: { data: AgilitySignData; onView: () => void }) {
  const total = data.adjustmentPlans.reduce((sum, item) => sum + item.total, 0);
  return <SectionCard title="新还款计划" action={<button type="button" className="text-action" onClick={onView}><EyeOutlined /> 查看</button>}>
    <div className="new-plan-summary"><div><span>还款总额</span><b>{money(total)}<small> 元</small></b></div><div><span>利息总额</span><strong>{money(total - data.loanAmount)} 元</strong></div><div><span>借款期间</span><strong>{data.loanPeriod}</strong></div></div>
    <div className="mini-plan-preview"><PlanItem item={data.adjustmentPlans[0]} compact /><PlanItem item={data.adjustmentPlans[data.adjustmentPlans.length - 1]} compact /></div>
  </SectionCard>;
}

function Agreement({ checked, onChange, onContract }: { checked: boolean; onChange: () => void; onContract: () => void }) {
  return <div className="agreement-row">
    <button type="button" className={`agreement-check ${checked ? 'checked' : ''}`} onClick={onChange} aria-label="同意合同">{checked ? <CheckOutlined /> : null}</button>
    <span>本人已阅读并同意签署</span><button type="button" className="contract-link" onClick={onContract}>《个人借款变更合同》</button>
  </div>;
}

function ConfirmPage({ data, onBack, onPlan, onContract, onConfirm }: { data: AgilitySignData; onBack: () => void; onPlan: () => void; onContract: () => void; onConfirm: () => void }) {
  const [checked, setChecked] = useState(false);
  const handleConfirm = () => {
    if (!checked) { message.warning('请先阅读并同意个人借款变更合同'); return; }
    onConfirm();
  };
  return <div className="sign-scroll confirm-scroll">
    <div className="confirm-tip"><SafetyCertificateOutlined /><span>请确认以下贷款调整信息，确认后将进入签约流程</span></div>
    <AdjustmentDetail data={data} />
    <CombinationScheme data={data} />
    <NewPlanCard data={data} onView={onPlan} />
    <Agreement checked={checked} onChange={() => setChecked((value) => !value)} onContract={onContract} />
    <button className="confirm-button" type="button" onClick={handleConfirm}>确认</button>
    <button className="cancel-confirm" type="button" onClick={onBack}>返回修改</button>
  </div>;
}

function Sheet({ title, onClose, children, className = '' }: { title: string; onClose: () => void; children: ReactNode; className?: string }) {
  return <div className="sheet-mask" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={`bottom-sheet ${className}`} role="dialog" aria-modal="true">
      <div className="sheet-handle" />
      <div className="sheet-header"><h2>{title}</h2><button type="button" aria-label="关闭" onClick={onClose}><CloseOutlined /></button></div>
      <div className="sheet-body">{children}</div>
    </section>
  </div>;
}

function PlanSheet({ data, onClose }: { data: AgilitySignData; onClose: () => void }) {
  const total = data.adjustmentPlans.reduce((sum, item) => sum + item.total, 0);
  const interest = data.adjustmentPlans.reduce((sum, item) => sum + item.interest, 0);
  return <Sheet title="新还款计划" onClose={onClose} className="plan-sheet">
    <div className="sheet-plan-stats"><div><span>还款总额</span><b>{money(total)}<small>元</small></b></div><div><span>利息总额</span><strong>{money(interest)} 元</strong></div><div><span>借款期间</span><strong>{data.loanPeriod}</strong></div></div>
    <div className="sheet-timeline">{data.adjustmentPlans.map((item) => <PlanItem item={item} key={item.period} />)}</div>
  </Sheet>;
}

function ContractSheet({ onClose }: { onClose: () => void }) {
  return <Sheet title="个人借款变更合同" onClose={onClose} className="contract-sheet">
    <div className="contract-preview"><div className="contract-title">个人借款变更合同</div><p>甲方（贷款人）：银行宝</p><p>乙方（借款人）：张三</p><p>鉴于乙方当前贷款存在还款困难，双方经协商一致，对原借款合同中的还款安排进行变更。</p><h3>第一条 变更内容</h3><p>本次变更后的还款方式、还款期数及利息减免，以贷款调整详情页面展示内容为准。</p><h3>第二条 双方权利义务</h3><p>乙方应按照变更后的还款计划按时足额还款。甲方将依约提供贷款服务并发送处理结果通知。</p><h3>第三条 其他</h3><p>本合同自双方完成电子签署之日起生效。本页面为合同预览，实际合同内容以签署时生成的电子合同为准。</p></div>
    <button type="button" className="sheet-primary" onClick={onClose}>我已阅读</button>
  </Sheet>;
}

function MoreSheet({ onClose, onHelp }: { onClose: () => void; onHelp: () => void }) {
  return <Sheet title="更多" onClose={onClose} className="more-sheet"><button type="button" onClick={onHelp}><FileTextOutlined /> 查看办理说明 <RightOutlined /></button><button type="button" onClick={() => message.info('客服工作时间：09:00-18:00')}><SafetyCertificateOutlined /> 联系客服 <RightOutlined /></button></Sheet>;
}

function PasswordSheet({ value, onChange, onSubmit, onClose }: { value: string; onChange: (value: string) => void; onSubmit: () => void; onClose: () => void }) {
  const [error, setError] = useState('');
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
  const enter = (key: string) => {
    setError('');
    if (key === '⌫') { onChange(value.slice(0, -1)); return; }
    if (!key || value.length >= 6) return;
    onChange(`${value}${key}`);
  };
  const submit = () => {
    if (value.length !== 6) { setError('请输入6位交易密码'); return; }
    if (value !== '123456') { setError('交易密码错误，请重新输入'); onChange(''); return; }
    onSubmit();
  };
  return <Sheet title="请输入交易密码" onClose={onClose} className="password-sheet">
    <div className="password-lock"><LockOutlined /><span>请输入6位数字密码</span></div>
    <div className="password-dots">{Array.from({ length: 6 }, (_, index) => <i key={index} className={index < value.length ? 'filled' : ''} />)}</div>
    <div className="password-error">{error}</div>
    <div className="number-keyboard">{keys.map((key, index) => key ? <button type="button" key={key} onClick={() => enter(key)}>{key}</button> : <span key={`empty-${index}`} />)}</div>
    <button type="button" className="sheet-primary" disabled={value.length !== 6} onClick={submit}>确认签署</button>
  </Sheet>;
}

function FaceSheet({ stage, onStart, onClose }: { stage: FaceStage; onStart: () => void; onClose: () => void }) {
  return <Sheet title="人脸识别" onClose={onClose} className="face-sheet">
    {stage === 'verified' ? <div className="face-result"><CheckCircleFilled /><h3>识别成功</h3><p>正在提交贷款调整申请</p></div> : <div className="face-content"><div className={`face-ring ${stage === 'scanning' ? 'scanning' : ''}`}><ScanOutlined /></div><h3>{stage === 'scanning' ? '识别中，请保持正脸' : '请进行人脸识别'}</h3><p>{stage === 'scanning' ? '请保持光线充足并保持不动' : '用于确认您的身份信息，保障签约安全'}</p>{stage === 'ready' ? <button type="button" className="sheet-primary" onClick={onStart}>开始识别</button> : <div className="face-progress">正在验证身份...</div>}</div>}
  </Sheet>;
}

function ProcessingPage({ onHome }: { onHome: () => void }) {
  return <div className="processing-page"><div className="processing-icon"><HourglassOutlined /></div><h1>贷款调整确认</h1><h2>等待系统处理</h2><p>您的贷款调整处理中，请耐心等待，结束我们将以短信形式通知您。</p><button type="button" className="confirm-button" onClick={onHome}>返回首页</button></div>;
}

export default function AgilitySignPage() {
  const navigate = useNavigate();
  const [api, contextHolder] = message.useMessage();
  const [data, setData] = useState<AgilitySignData>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [password, setPassword] = useState('');
  const [faceStage, setFaceStage] = useState<FaceStage>('ready');
  const [focusedPanel, setFocusedPanel] = useState<'detail' | 'adjustment' | 'result'>('detail');

  const loadData = () => {
    setError(false);
    setLoading(true);
    getAgilitySignData().then((response) => setData(response.data)).catch(() => setError(true)).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    if (faceStage !== 'scanning') return undefined;
    const timer = window.setTimeout(() => setFaceStage('verified'), 1400);
    return () => window.clearTimeout(timer);
  }, [faceStage]);
  useEffect(() => {
    if (faceStage !== 'verified') return undefined;
    const timer = window.setTimeout(() => { setOverlay(null); setFocusedPanel('result'); setFaceStage('ready'); }, 900);
    return () => window.clearTimeout(timer);
  }, [faceStage]);

  if (loading) return <div className="mobile-frame sign-loading"><Spin tip="正在加载签约信息..." /></div>;
  if (error || !data) return <div className="mobile-frame sign-loading"><Empty description="签约信息加载失败"><Button onClick={loadData}>重新加载</Button></Empty></div>;

  const close = () => navigate('/welcome');
  const goDetail = () => { setFocusedPanel('detail'); if (overlay) setOverlay(null); };
  const goAdjustment = () => { setFocusedPanel('adjustment'); api.info('已定位到中间的贷款调整画板'); };
  const goResult = () => { setFocusedPanel('result'); api.info('已定位到右侧的确认结果画板'); };
  const openPassword = () => { setPassword(''); setFocusedPanel('adjustment'); setOverlay('password'); };

  return <div className="sign-host">
    {contextHolder}
    <div className="canvas-heading"><div><strong>灵动重组签约</strong><span>三步签约流程预览</span></div><span className="canvas-size">370 × 844</span></div>
    <div className="sign-canvas-scroll">
      <main className="sign-canvas">
        <PhonePreview title="灵动重组签约" className={focusedPanel === 'detail' ? 'is-focused' : ''} onBack={() => navigate(-1)} onClose={close} onMore={() => setOverlay('more')}>
          <DetailPage data={data} onAdjust={goAdjustment} onMore={() => api.info('借款凭证已上传')} />
        </PhonePreview>
        <PhonePreview title="贷款调整" className={focusedPanel === 'adjustment' ? 'is-focused' : ''} onBack={goDetail} onClose={close} onMore={() => setOverlay('more')}>
          <ConfirmPage data={data} onBack={goDetail} onPlan={() => setOverlay('plan')} onContract={() => setOverlay('contract')} onConfirm={openPassword} />
          {overlay === 'more' ? <MoreSheet onClose={() => setOverlay(null)} onHelp={() => { setOverlay(null); api.info('请确认贷款调整详情后完成签约'); }} /> : null}
          {overlay === 'plan' ? <PlanSheet data={data} onClose={() => setOverlay(null)} /> : null}
          {overlay === 'contract' ? <ContractSheet onClose={() => setOverlay(null)} /> : null}
          {overlay === 'password' ? <PasswordSheet value={password} onChange={setPassword} onSubmit={() => { setOverlay('face'); setFaceStage('ready'); }} onClose={() => setOverlay(null)} /> : null}
          {overlay === 'face' ? <FaceSheet stage={faceStage} onStart={() => setFaceStage('scanning')} onClose={() => setOverlay(null)} /> : null}
        </PhonePreview>
        <PhonePreview title="贷款调整确认结果" className={focusedPanel === 'result' ? 'is-focused' : ''} onBack={goAdjustment} onClose={close} onMore={goResult}>
          <ProcessingPage onHome={() => navigate('/welcome')} />
        </PhonePreview>
      </main>
    </div>
  </div>;
}
