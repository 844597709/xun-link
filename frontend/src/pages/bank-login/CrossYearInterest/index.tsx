import { useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { message } from 'antd';
import {
  ArrowRightOutlined,
  BankOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  CheckOutlined,
  ClockCircleOutlined,
  CloudUploadOutlined,
  FileImageOutlined,
  FileTextOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { consumeApplications, crossYearBusinessEntries, crossYearSchemes, crossYearYears, eligibleLoans, findCrossYearYear, interestAgreements, interestRecords } from '../../../mock';
import type { ConsumeInfo, ConsumeInterestApplication, InterestAgreement, InterestRecord, InterestType, Voucher } from '../../../types/consumeInterest';
import type { CrossYearBusinessEntry, CrossYearPolicyYearState, CrossYearScheme } from '../../../types/crossYearInterest';
import { SchemeOneBackupRow } from './SchemeOneBackup';
import './index.css';

type Feedback = (text: string) => void;
type PolicyYear = 2027 | 2026;
type YearFilter = 'all' | PolicyYear;
type DateRange = 'all' | '30' | '90';
type VerifyQuickRange = 'all' | '3m' | '6m' | '1y' | 'custom';
type VerifyChannel = 'all' | 'self' | 'system';
type InterestTypeFilter = 'all' | InterestType;
type VerifyTab = 'all' | ConsumeInterestApplication['status'];
type FormState = { account: string; consumeDate: string; transactionNo: string; purpose: string; description: string };

type YearAgreement = InterestAgreement & { year: PolicyYear };
type YearApplication = ConsumeInterestApplication & { year: PolicyYear };
type YearRecord = InterestRecord & { year: PolicyYear };

const defaultForm: FormState = { account: '', consumeDate: '', transactionNo: '', purpose: '', description: '' };
const years = crossYearYears.filter((item) => item.year !== 2025);
const money = (value: number) => value.toLocaleString('zh-CN');
const replaceYear = (value: string, year: PolicyYear) => value.replace(/2026/g, String(year));
const isWithinDateRange = (value: string, range: DateRange, values: string[]) => {
  if (range === 'all') return true;
  const current = Date.parse(value);
  const latest = Math.max(...values.map((item) => Date.parse(item)));
  return latest - current <= Number(range) * 24 * 60 * 60 * 1000;
};
const dayStart = (value: string) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};
const dayEnd = (value: string) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
};
const isWithinVerifyTime = (value: string, quick: VerifyQuickRange, customFrom: string, customTo: string, values: string[]) => {
  if (quick === 'all') return true;
  const current = Date.parse(value);
  if (Number.isNaN(current)) return false;
  if (quick === 'custom') {
    if (!customFrom && !customTo) return true;
    if (customFrom && current < dayStart(customFrom)) return false;
    if (customTo && current > dayEnd(customTo)) return false;
    return true;
  }
  const latest = Math.max(...values.map((item) => Date.parse(item)).filter((item) => !Number.isNaN(item)));
  const days = quick === '3m' ? 90 : quick === '6m' ? 180 : 365;
  return latest - current <= days * 24 * 60 * 60 * 1000;
};
const schemeOneAgreements: YearAgreement[] = ([2027, 2026] as PolicyYear[]).map((year) => ({ ...interestAgreements[0], id: `scheme-one-agreement-${year}`, year, signedAt: `${year}-01-08 10:22:18`, effectiveDate: `${year}-01-08`, status: year === 2027 ? 'effective' as const : 'expired' as const, summary: year === 2027 ? interestAgreements[0].summary : '历史政策年度协议，当前已过期，仅支持查阅与下载。', content: interestAgreements[0].content.map((text) => replaceYear(text, year)) }));
const schemeOneApplications: YearApplication[] = ([2027, 2026] as PolicyYear[]).flatMap((year) => consumeApplications.map((item) => ({ ...item, id: replaceYear(item.id, year), year, applyTime: replaceYear(item.applyTime, year), consumeDate: replaceYear(item.consumeDate, year), approvedAt: item.approvedAt ? replaceYear(item.approvedAt, year) : undefined, consumeDescription: `${year} 年${item.consumeDescription}`, consumeInfo: item.consumeInfo ? { ...item.consumeInfo, id: replaceYear(item.consumeInfo.id, year), consumeDate: replaceYear(item.consumeInfo.consumeDate, year) } : undefined, systemConsumes: item.systemConsumes?.map((consume) => ({ ...consume, id: replaceYear(consume.id, year), consumeDate: replaceYear(consume.consumeDate, year) })), vouchers: item.vouchers })));
const schemeOneRecords: YearRecord[] = ([2027, 2026] as PolicyYear[]).flatMap((year) => interestRecords.map((item) => ({ ...item, id: replaceYear(item.id, year), year, date: replaceYear(item.date, year), interestTime: replaceYear(item.interestTime, year) })));
const schemeOneTransactions: ConsumeInfo[] = schemeOneApplications.flatMap((item) => [item.consumeInfo, ...(item.systemConsumes ?? [])]).filter((item): item is ConsumeInfo => Boolean(item?.transactionNo));
const interestTypeLabel: Record<InterestType, string> = { realtime: '实时贴息', subsidy: '补贴息', reclaim: '收回贴息' };


function MobileHeader({ title, onBack, onClose }: { title: string; onBack?: () => void; onClose: () => void }) {
  return <header className="cross-phone-header">
    <button type="button" className="cross-header-back" onClick={onBack} disabled={!onBack}><LeftOutlined /> 返回</button>
    <strong>{title}</strong>
    <button type="button" className="cross-header-close" aria-label="关闭" onClick={onClose}>×</button>
  </header>;
}

function PhoneFrame({ title, children, onBack, onClose, className = '' }: { title: string; children: ReactNode; onBack?: () => void; onClose: () => void; className?: string }) {
  return <div className={`cross-phone ${className}`}><MobileHeader title={title} onBack={onBack} onClose={onClose} />{children}</div>;
}

function PhoneScroll({ children }: { children: ReactNode }) {
  return <div className="cross-phone-scroll">{children}</div>;
}

function PhoneScene({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <div className="phone-scene"><div className="phone-scene-caption"><b>{title}</b><span>{subtitle}</span></div>{children}</div>;
}

function StatusPill({ state }: { state: CrossYearPolicyYearState }) {
  const tone = state.agreementStatus === '已生效' ? 'success' : state.agreementStatus === '未签署' ? 'warning' : 'muted';
  return <span className={`cross-status ${tone}`}><i />{state.agreementStatus}</span>;
}

function YearTabs({ selectedYear, onChange, availableYears }: { selectedYear: PolicyYear; onChange: (year: PolicyYear) => void; availableYears?: PolicyYear[] }) {
  const tabYears = availableYears?.length ? years.filter((item) => availableYears.includes(item.year as PolicyYear)) : years;
  return <div className="cross-year-tabs">{tabYears.map((item) => <button type="button" key={item.year} className={selectedYear === item.year ? 'active' : ''} onClick={() => onChange(item.year as PolicyYear)}>{item.year} 年</button>)}</div>;
}

function EntryIcon({ entryKey }: { entryKey: string }) {
  if (entryKey === 'apply') return <FileTextOutlined />;
  if (entryKey === 'agreement') return <SafetyCertificateOutlined />;
  if (entryKey === 'verify') return <CheckCircleFilled />;
  return <WalletOutlined />;
}

function EntryGrid({ onEntry, compact = false, className = '' }: { onEntry: (text: string, entry: CrossYearBusinessEntry) => void; compact?: boolean; className?: string }) {
  return <div className={`cross-entry-grid ${compact ? 'compact' : ''} ${className}`}>{crossYearBusinessEntries.map((entry) => <button type="button" key={entry.key} onClick={() => onEntry(`${entry.label}为原型入口`, entry)}><i><EntryIcon entryKey={entry.key} /></i><span>{entry.label}</span><RightOutlined /></button>)}</div>;
}

function DeadlineTip({ className = '' }: { className?: string }) {
  return <div className={`scheme-two-deadline-tip ${className}`.trim()}><ClockCircleOutlined /><span>2026 年消费需在 2027 年 3 月 31 日前完成申请，逾期将无法申请。</span></div>;
}

function YearStateCard({ state, onApply, onOpen, showTotal = true }: { state: CrossYearPolicyYearState; onApply?: () => void; onOpen?: () => void; showTotal?: boolean }) {
  return <section className="year-state-card"><div className="state-card-heading"><div><span className="eyebrow">{state.year} 年消费贷款贴息</span><strong><StatusPill state={state} /></strong></div><CalendarOutlined /></div><p>{state.validPeriod}</p><div className="state-card-note">{state.statusRemark}</div><div className="state-card-footer">{showTotal ? <span>本年度累计贴息 <b>¥{money(state.subsidyTotal)}</b></span> : <span>政策时间 · {state.validPeriod}</span>}{state.canApply && onApply ? <button type="button" onClick={onApply}>自主申请 <ArrowRightOutlined /></button> : onOpen ? <button type="button" onClick={onOpen}>查看年度业务 <ArrowRightOutlined /></button> : null}</div></section>;
}

function BusinessPhone({ title, year, icon, description, children, onClose, className = '' }: { title: string; year: PolicyYear; icon: ReactNode; description: string; children?: ReactNode; onClose: () => void; className?: string }) {
  return <PhoneFrame title={title} className={className} onClose={onClose}><PhoneScroll><div className="business-page-heading"><span className="business-page-icon">{icon}</span><div><b>{title}</b><span>{description}</span></div><em>{year} 年</em></div>{children || <section className="business-data-card"><div className="data-card-caption">政策年度上下文</div><strong>{year} 年业务数据</strong><p>该页面仅展示 {year} 年独立协议与业务记录，不与其他年度合并。</p><button type="button" onClick={() => undefined}>查看详情 <ArrowRightOutlined /></button></section>}<div className="policy-tip"><InfoCircleOutlined /><span>所有数据均按政策年度独立记录。</span></div></PhoneScroll></PhoneFrame>;
}

type SchemeOneScenarioConfig = {
  title: string;
  subtitle: string;
  defaultYear: PolicyYear;
  signedYears: PolicyYear[];
  endedYears?: PolicyYear[];
  showDeadlineTip?: boolean;
  availableYears?: PolicyYear[];
};

function getSchemeOneState(year: PolicyYear, config: SchemeOneScenarioConfig): CrossYearPolicyYearState {
  const base = findCrossYearYear(year);
  const signed = config.signedYears.includes(year);
  const ended = config.endedYears?.includes(year) ?? false;
  return {
    ...base,
    agreementStatus: signed ? '已生效' : '未签署',
    agreementDate: signed ? `${year}-01-08` : undefined,
    canApply: signed,
    todoCount: signed ? 1 : 0,
    statusRemark: signed ? '协议已生效，本年度可申请' : ended ? '协议未签署，本年度贴息已结束' : '协议未签署，暂不可办理',
  };
}

function SchemeOneAgreementSheet({ year, onSign, onClose }: { year: PolicyYear; onSign: () => void; onClose: () => void }) {
  const agreement = schemeOneAgreements.find((item) => item.year === year) ?? schemeOneAgreements[0];
  return <div className="scheme-one-sheet-mask" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="scheme-one-sheet" role="dialog" aria-modal="true"><div className="scheme-one-sheet-handle" /><div className="scheme-one-sheet-title"><h2>{agreement.title}</h2><button type="button" aria-label="关闭协议" onClick={onClose}>×</button></div><div className="scheme-one-sheet-content"><div className="scheme-one-contract-meta"><span>甲方（服务方）</span><b>银行宝</b><span>乙方（借款人）</span><b>张先生</b></div><div className="scheme-one-contract-preview">{agreement.content.slice(2).map((text) => <p key={text}>{text}</p>)}</div></div><div className="scheme-one-sheet-buttons"><button type="button" onClick={onClose}>暂不签署</button><button type="button" className="scheme-one-primary" onClick={onSign}>确认签署</button></div></section></div>;
}

function SchemeOneScenarioPhone({ config, onFeedback, onOpenBusiness, onClose }: { config: SchemeOneScenarioConfig; onFeedback: Feedback; onOpenBusiness: (entry: CrossYearBusinessEntry, year: PolicyYear) => void; onClose: () => void }) {
  const availableYears = config.availableYears ?? (years.map((item) => item.year as PolicyYear));
  const [selectedYear, setSelectedYear] = useState<PolicyYear>(config.defaultYear);
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const baseState = getSchemeOneState(selectedYear, config);
  const canSignYear = availableYears.includes(selectedYear) && !(config.endedYears?.includes(selectedYear) ?? false) && selectedYear === 2027;
  const signed = (agreementSigned && canSignYear) || baseState.agreementStatus === '已生效';
  const state = signed ? { ...baseState, agreementStatus: '已生效' as const, agreementDate: `${selectedYear}-01-08`, canApply: true, todoCount: 1, statusRemark: '协议已生效，本年度可申请' } : baseState;
  const ended = config.endedYears?.includes(selectedYear) ?? false;
  const sign = () => { setAgreementSigned(true); setAgreementOpen(false); onFeedback('贴息协议签署成功'); };
  const unsignedCopy = ended
    ? '当前年度贴息已结束，暂不支持申请。'
    : '同意并签署《贴息服务协议》，签署后本年度默认生效。';
  const signedBlock = <><div className="scheme-one-agreement-main"><div className="scheme-one-agreement-copy"><strong>贴息协议已生效</strong><span>您可以开始申请消费贷款贴息</span></div></div><b className="scheme-one-signed-badge">已签约</b></>;
  const unsignedBlock = <><div className="scheme-one-agreement-copy"><span>{unsignedCopy}</span></div>{!ended && canSignYear ? <button type="button" onClick={() => setAgreementOpen(true)}>去签署 <RightOutlined /></button> : null}</>;
  return <PhoneFrame title="财政贴息专区" className="scheme-one-reference" onClose={onClose}><PhoneScroll><YearTabs selectedYear={selectedYear} onChange={setSelectedYear} availableYears={availableYears} /><section className={`scheme-one-banner ${signed ? '' : 'scheme-one-banner-muted'}`}><div><span>财政贴息</span><b>适用客户可享受贴息服务</b></div><em>贴息时间 {state.validPeriod}</em></section><section className={`scheme-one-agreement home-agreement ${signed ? 'is-signed' : 'is-unsigned'}`}>{signed ? signedBlock : unsignedBlock}</section>{config.showDeadlineTip ? <DeadlineTip /> : null}{signed ? <><div className="phone-section-label">业务服务</div><EntryGrid className="scheme-one-entry-grid" onEntry={(_text, entry) => onOpenBusiness(entry, selectedYear)} /></> : <section className="scheme-one-ended-card"><InfoCircleOutlined /><b>{ended ? '本年度贴息已结束' : '协议未签署，暂不可办理'}</b><p>{ended ? '当前年度无法办理新的贴息申请及查询业务，请关注最新政策年度。' : '完成贴息协议签署后才可办理相关业务。'}</p></section>}<div className="policy-tip"><InfoCircleOutlined /><span>{signed ? '贴息申请需提交真实有效的消费凭证，系统将根据政策和贷款状态进行核定。' : ended ? '历史年度不支持协议补签。' : '当前年度暂未开放贴息业务，请先完成协议签署。'}</span></div>{agreementOpen ? <SchemeOneAgreementSheet year={selectedYear} onSign={sign} onClose={() => setAgreementOpen(false)} /> : null}</PhoneScroll></PhoneFrame>;
}

function getSchemeTwoState(year: PolicyYear, signed: boolean): CrossYearPolicyYearState {
  const base = findCrossYearYear(year);
  return { ...base, agreementStatus: signed ? '已生效' : '未签署', agreementDate: signed ? `${year}-01-08` : undefined, canApply: signed, todoCount: signed ? 1 : 0, statusRemark: signed ? '协议已生效，本年度可申请' : '协议未签署，暂不可办理' };
}

function SchemeTwoYearCard({ year, signed, onAction }: { year: PolicyYear; signed: boolean; onAction: () => void }) {
  const state = getSchemeTwoState(year, signed);
  return signed
    ? <section className="simple-agreement scheme-two-year-card"><StatusPill state={state} /><b>{year} 年协议已生效</b><span>可办理 {year} 年消费贷款贴息申请</span>{year === 2026 ? <DeadlineTip /> : null}<button type="button" className="year-scene-action" onClick={onAction}>进入 {year} 年申请 <RightOutlined /></button></section>
    : <section className="unsigned-state-card prominent scheme-two-year-card"><StatusPill state={state} /><b>{year} 年协议未签署</b><p>{year === 2026 ? '本年度贴息已结束，暂不支持申请。' : `完成协议签署后才可办理 ${year} 年消费贷款贴息。`}</p><button type="button" className="year-scene-action" onClick={onAction}>{year === 2027 ? '去签署并申请' : '查看结束说明'} <RightOutlined /></button></section>;
}

function SchemeTwoHome({ signed2027, agreementOpen, onSign, onOpenSign, onCloseAgreement, onApply, onOpen, onClose }: { signed2027: boolean; agreementOpen: boolean; onSign: () => void; onOpenSign: () => void; onCloseAgreement: () => void; onApply: () => void; onOpen: (entry: CrossYearBusinessEntry) => void; onClose: () => void }) {
  return <PhoneScene title="方案二 · 2027 年首页" subtitle={signed2027 ? '协议已签署，可办理业务' : '未签协议首页'}><PhoneFrame title="财政贴息专区" className="scheme-two-reference scheme-one-reference" onClose={onClose}><PhoneScroll><div className={`scheme-one-banner ${signed2027 ? '' : 'scheme-one-banner-muted'}`}><div><span>财政贴息</span><b>适用客户可享受贴息服务</b></div><em>贴息时间 2027-01-01 至 2027-12-31</em></div><section className={`scheme-one-agreement home-agreement ${signed2027 ? 'is-signed' : 'is-unsigned'}`}>{signed2027 ? <><div className="scheme-one-agreement-main"><CheckCircleFilled /><div><strong>贴息协议已生效</strong><span>您可以开始申请消费贷款贴息</span></div></div><b className="scheme-one-signed-badge">已签约</b></> : <><div><strong>协议未签署</strong><span>当前年度未完成协议签署，暂不支持新增贴息业务。</span></div><button type="button" onClick={onOpenSign}>去签署贴息协议 <RightOutlined /></button></>}</section><div className="phone-section-label">业务服务</div><DeadlineTip /><EntryGrid className="scheme-one-entry-grid" onEntry={(_text, entry) => entry.key === 'apply' ? onApply() : onOpen(entry)} /><div className="policy-tip"><InfoCircleOutlined /><span>查询业务点击入口后平铺展示；自主申请先选择政策年度。</span></div>{agreementOpen ? <SchemeOneAgreementSheet year={2027} onSign={onSign} onClose={onCloseAgreement} /> : null}</PhoneScroll></PhoneFrame></PhoneScene>;
}

function SchemeTwoApplicationPhone({ page, applicationYear, canApply2027, yearEnded, onChooseYear, onBackToYears, onSign2027, onFeedback, onClose }: { page: 'years' | 'application'; applicationYear: PolicyYear; canApply2027: boolean; yearEnded: boolean; onChooseYear: (year: PolicyYear, signedScene: boolean) => void; onBackToYears: () => void; onSign2027: () => void; onFeedback: Feedback; onClose: () => void }) {
  if (page === 'years') {
    return <>
      <PhoneScene title="方案二 · 27 未签 + 26 已签" subtitle="两套状态整合在同一页面"><PhoneFrame title="选择申请年度" className="scheme-two-reference" onClose={onClose}><PhoneScroll><div className="phone-intro"><b>组合场景 A</b><span>27 年未签署与 26 年已签署并排查看</span></div><SchemeTwoYearCard year={2027} signed={false} onAction={() => onChooseYear(2027, false)} /><SchemeTwoYearCard year={2026} signed={true} onAction={() => onChooseYear(2026, true)} /><div className="policy-tip"><InfoCircleOutlined /><span>本页整合 27 未签与 26 已签两种状态。</span></div></PhoneScroll></PhoneFrame></PhoneScene>
      <PhoneScene title="方案二 · 27 已签 + 26 未签" subtitle="两套状态整合在同一页面"><PhoneFrame title="选择申请年度" className="scheme-two-reference" onClose={onClose}><PhoneScroll><div className="phone-intro"><b>组合场景 B</b><span>27 年已签署与 26 年未签署并排查看</span></div><SchemeTwoYearCard year={2027} signed={true} onAction={() => onChooseYear(2027, true)} /><SchemeTwoYearCard year={2026} signed={false} onAction={() => onChooseYear(2026, false)} /><div className="policy-tip"><InfoCircleOutlined /><span>本页整合 27 已签与 26 未签两种状态。</span></div></PhoneScroll></PhoneFrame></PhoneScene>
      <PhoneScene title="方案二 · 27 已签 + 26 已签" subtitle="两套状态整合在同一页面"><PhoneFrame title="选择申请年度" className="scheme-two-reference" onClose={onClose}><PhoneScroll><div className="phone-intro"><b>组合场景 C</b><span>27 年已签署与 26 年已签署并排查看</span></div><SchemeTwoYearCard year={2027} signed={true} onAction={() => onChooseYear(2027, true)} /><SchemeTwoYearCard year={2026} signed={true} onAction={() => onChooseYear(2026, true)} /><div className="policy-tip"><InfoCircleOutlined /><span>本页整合 27 已签与 26 已签两种状态。</span></div></PhoneScroll></PhoneFrame></PhoneScene>
    </>;
  }
  if (yearEnded && applicationYear === 2026) {
    return <PhoneScene title="方案二 · 2026 年贴息结束" subtitle="本年度贴息已结束提示"><PhoneFrame title="自主申请" className="scheme-two-reference scheme-one-reference" onBack={onBackToYears} onClose={onClose}><PhoneScroll><div className="locked-year"><CalendarOutlined /><span>申请年度：<b>2026 年</b></span><em>已结束</em></div><section className="scheme-one-ended-card"><InfoCircleOutlined /><b>本年度贴息已结束</b><p>2026 年协议未签署且贴息政策窗口已关闭，暂不支持申请及补签。请关注最新政策年度。</p></section><div className="policy-tip warning"><InfoCircleOutlined /><span>历史年度不支持协议补签，仅可返回重新选择其他年度。</span></div></PhoneScroll></PhoneFrame></PhoneScene>;
  }
  if (applicationYear === 2027 && !canApply2027) {
    return <PhoneScene title="方案二 · 2027 年申请" subtitle="协议未签署，暂不可申请"><PhoneFrame title="自主申请" className="scheme-two-reference" onBack={onBackToYears} onClose={onClose}><PhoneScroll><div className="locked-year"><CalendarOutlined /><span>申请年度：<b>{applicationYear} 年</b></span><em>已锁定</em></div><section className="unsigned-state-card prominent"><StatusPill state={getSchemeTwoState(2027, false)} /><b>2027 年申请表单预览</b><strong>当前年度协议未签署，暂不可申请</strong><p>请返回首页完成贴息协议签署后，再提交该年度申请。</p></section></PhoneScroll></PhoneFrame></PhoneScene>;
  }
  return <PhoneScene title={`方案二 · ${applicationYear} 年申请表单`} subtitle="锁定年度提交申请"><PhoneFrame title="自主申请" className="scheme-two-reference scheme-one-reference scheme-one-business-page scheme-two-business-page" onBack={onBackToYears} onClose={onClose}><PhoneScroll><SchemeOneApplyPage year={applicationYear} onFeedback={onFeedback} /><div className="policy-tip"><InfoCircleOutlined /><span>申请年度一经确定不可跨年度提交，所有消费凭证需真实有效。</span></div></PhoneScroll></PhoneFrame></PhoneScene>;
}

function SchemeTwoPhone({ onFeedback, onClose }: { onFeedback: Feedback; onClose: () => void }) {
  const [signed2027, setSigned2027] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [applicationPage, setApplicationPage] = useState<'years' | 'application' | null>(null);
  const [applicationYear, setApplicationYear] = useState<PolicyYear>(2026);
  const [sceneAllows2027Apply, setSceneAllows2027Apply] = useState(false);
  const [yearEnded, setYearEnded] = useState(false);
  const [activeEntries, setActiveEntries] = useState<CrossYearBusinessEntry['key'][]>([]);
  const chooseYear = (year: PolicyYear, signedScene: boolean) => {
    setApplicationYear(year);
    setYearEnded(year === 2026 && !signedScene);
    setSceneAllows2027Apply(year === 2027 ? (signedScene || signed2027) : false);
    setApplicationPage('application');
    onFeedback(year === 2026 && !signedScene ? '2026年贴息已结束' : `已锁定${year}年申请年度`);
  };
  const openEntry = (entry: CrossYearBusinessEntry) => {
    if (entry.key === 'apply') setApplicationPage('years');
    else setActiveEntries((items) => items.includes(entry.key) ? items : [...items, entry.key]);
  };
  const sign2027 = () => {
    setSigned2027(true);
    setSceneAllows2027Apply(true);
    setAgreementOpen(false);
    onFeedback('贴息协议签署成功');
  };
  const entryLabel: Record<CrossYearBusinessEntry['key'], string> = { apply: '自主申请', agreement: '我的协议', verify: '核定记录', record: '贴息记录' };
  return <div className="scheme-phone-list scheme-two-phone-list">
    <SchemeTwoHome signed2027={signed2027} agreementOpen={agreementOpen} onSign={sign2027} onOpenSign={() => setAgreementOpen(true)} onCloseAgreement={() => setAgreementOpen(false)} onApply={() => setApplicationPage('years')} onOpen={openEntry} onClose={onClose} />
    {applicationPage ? <SchemeTwoApplicationPhone page={applicationPage} applicationYear={applicationYear} canApply2027={applicationYear !== 2027 || sceneAllows2027Apply || signed2027} yearEnded={yearEnded} onChooseYear={chooseYear} onBackToYears={() => setApplicationPage('years')} onSign2027={() => setAgreementOpen(true)} onFeedback={onFeedback} onClose={onClose} /> : null}
    {activeEntries.map((key) => <PhoneScene key={key} title={`方案二 · ${entryLabel[key]}`} subtitle="查询业务按入口平铺"><ReferenceBusinessPhone entryKey={key} year={2026} referenceClass="scheme-two-reference" businessClass="scheme-two-business-page" onFeedback={onFeedback} onClose={onClose} /></PhoneScene>)}
  </div>;
}

function SchemeThreePhone({ onFeedback, onClose }: { onFeedback: Feedback; onClose: () => void }) {
  const [openedYears, setOpenedYears] = useState<Array<{ year: PolicyYear; signed: boolean }>>([]);
  const [signed2027, setSigned2027] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [activeEntries, setActiveEntries] = useState<Array<{ key: CrossYearBusinessEntry['key']; year: PolicyYear }>>([]);
  const openYear = (year: PolicyYear, signed: boolean) => {
    setOpenedYears((items) => items.some((item) => item.year === year && item.signed === signed) ? items : [...items, { year, signed }]);
    onFeedback(`已打开${year}年财政贴息专区`);
  };
  const openBusiness = (entry: CrossYearBusinessEntry, year: PolicyYear) => {
    setActiveEntries((items) => items.some((item) => item.key === entry.key && item.year === year) ? items : [...items, { key: entry.key, year }]);
  };
  const unsigned2027 = getSchemeTwoState(2027, signed2027);
  const signed2026 = getSchemeTwoState(2026, true);
  const unsigned2026 = getSchemeTwoState(2026, false);
  const entryLabel: Record<CrossYearBusinessEntry['key'], string> = { apply: '自主申请', agreement: '我的协议', verify: '核定记录', record: '贴息记录' };
  const sign2027 = () => {
    setSigned2027(true);
    setAgreementOpen(false);
    onFeedback('贴息协议签署成功');
  };
  const hasZone = (year: PolicyYear, signed: boolean) => openedYears.some((item) => item.year === year && item.signed === signed);
  const workbenchA = <PhoneScene title="方案三 · 多年度工作台" subtitle="27 未签 + 26 已签，先选年份再进专区"><PhoneFrame title="年度工作台" className="scheme-three-reference" onClose={onClose}><PhoneScroll><div className="phone-intro"><b>选择政策年度</b><span>进入对应年度财政贴息专区</span></div><div className="multi-year-list scheme-three-year-list"><button type="button" className="multi-year-card scheme-three-year-card" onClick={() => openYear(2027, false)}><div className="multi-year-heading"><b>2027 年</b><StatusPill state={unsigned2027} /></div><div className="policy-window">贴息政策窗口：{unsigned2027.validPeriod}</div><div className="multi-year-foot">{signed2027 ? '协议已生效，可办理业务' : '协议未签署，可进入专区补签'} <RightOutlined /></div></button><button type="button" className="multi-year-card scheme-three-year-card" onClick={() => openYear(2026, true)}><div className="multi-year-heading"><b>2026 年</b><StatusPill state={signed2026} /></div><div className="policy-window">贴息政策窗口：{signed2026.validPeriod}</div><div className="multi-year-foot">协议已生效，可办理业务 <RightOutlined /></div></button></div><div className="policy-tip"><InfoCircleOutlined /><span>选择工作台年份后，对应财政贴息专区将横向平铺展示。</span></div></PhoneScroll></PhoneFrame></PhoneScene>;
  const workbenchB = <PhoneScene title="方案三 · 多年度工作台（双未签）" subtitle="27 未签 + 26 未签，26 年已结束不支持补签"><PhoneFrame title="年度工作台" className="scheme-three-reference" onClose={onClose}><PhoneScroll><div className="phone-intro"><b>选择政策年度</b><span>进入对应年度财政贴息专区</span></div><div className="multi-year-list scheme-three-year-list"><button type="button" className="multi-year-card scheme-three-year-card" onClick={() => openYear(2027, false)}><div className="multi-year-heading"><b>2027 年</b><StatusPill state={unsigned2027} /></div><div className="policy-window">贴息政策窗口：{unsigned2027.validPeriod}</div><div className="multi-year-foot">{signed2027 ? '协议已生效，可办理业务' : '协议未签署，可进入专区补签'} <RightOutlined /></div></button><button type="button" className="multi-year-card scheme-three-year-card" onClick={() => openYear(2026, false)}><div className="multi-year-heading"><b>2026 年</b><StatusPill state={unsigned2026} /></div><div className="policy-window">贴息政策窗口：{unsigned2026.validPeriod}</div><div className="multi-year-foot">已结束，不支持协议补签 <RightOutlined /></div></button></div><div className="policy-tip warning"><InfoCircleOutlined /><span>2026 年未签署且贴息已结束，进入专区仅展示结束说明，不支持补签。</span></div></PhoneScroll></PhoneFrame></PhoneScene>;
  const zone2027 = hasZone(2027, false) ? <PhoneScene title="方案三 · 27 年未签专区" subtitle="对齐方案一未签风格，可补签"><PhoneFrame title="财政贴息专区" className="scheme-three-reference scheme-one-reference" onClose={onClose}><PhoneScroll><div className={`scheme-one-banner ${signed2027 ? '' : 'scheme-one-banner-muted'}`}><div><span>财政贴息</span><b>适用客户可享受贴息服务</b></div><em>贴息时间 {unsigned2027.validPeriod}</em></div><section className={`scheme-one-agreement home-agreement ${signed2027 ? 'is-signed' : 'is-unsigned'}`}>{signed2027 ? <><div className="scheme-one-agreement-main"><CheckCircleFilled /><div><strong>贴息协议已生效</strong><span>您可以开始申请消费贷款贴息</span></div></div><b className="scheme-one-signed-badge">已签约</b></> : <><div><strong>协议未签署</strong><span>当前年度未完成协议签署，暂不支持新增贴息业务。</span></div><button type="button" onClick={() => setAgreementOpen(true)}>去签署贴息协议 <RightOutlined /></button></>}</section>{signed2027 ? <><div className="phone-section-label">业务服务</div><EntryGrid className="scheme-one-entry-grid" onEntry={(_text, entry) => openBusiness(entry, 2027)} /></> : <section className="scheme-one-ended-card"><InfoCircleOutlined /><b>协议未签署，暂不可办理</b><p>完成贴息协议签署后才可办理相关业务。</p></section>}<div className="policy-tip"><InfoCircleOutlined /><span>{signed2027 ? '签署后可办理 2027 年业务。' : '未签专区可在当前页完成协议签署。'}</span></div>{agreementOpen ? <SchemeOneAgreementSheet year={2027} onSign={sign2027} onClose={() => setAgreementOpen(false)} /> : null}</PhoneScroll></PhoneFrame></PhoneScene> : null;
  const zone2026Signed = hasZone(2026, true) ? <PhoneScene title="方案三 · 26 年已签专区" subtitle="对齐方案一已签风格，含截止提示"><PhoneFrame title="财政贴息专区" className="scheme-three-reference scheme-one-reference" onClose={onClose}><PhoneScroll><div className="scheme-one-banner"><div><span>财政贴息</span><b>适用客户可享受贴息服务</b></div><em>贴息时间 {signed2026.validPeriod}</em></div><section className="scheme-one-agreement home-agreement is-signed"><div className="scheme-one-agreement-main"><CheckCircleFilled /><div><strong>贴息协议已生效</strong><span>您可以开始申请消费贷款贴息</span></div></div><b className="scheme-one-signed-badge">已签约</b></section><div className="phone-section-label">业务服务</div><DeadlineTip /><EntryGrid className="scheme-one-entry-grid" onEntry={(_text, entry) => openBusiness(entry, 2026)} /><div className="policy-tip"><InfoCircleOutlined /><span>业务页点击后平铺展示，仅查看 2026 年数据。</span></div></PhoneScroll></PhoneFrame></PhoneScene> : null;
  const zone2026Unsigned = hasZone(2026, false) ? <PhoneScene title="方案三 · 26 年未签专区" subtitle="贴息已结束，不支持协议补签"><PhoneFrame title="财政贴息专区" className="scheme-three-reference scheme-one-reference" onClose={onClose}><PhoneScroll><div className="scheme-one-banner scheme-one-banner-muted"><div><span>财政贴息</span><b>适用客户可享受贴息服务</b></div><em>贴息时间 {unsigned2026.validPeriod}</em></div><section className="scheme-one-agreement home-agreement is-unsigned"><div><strong>协议未签署</strong><span>当前年度贴息已结束，暂不支持申请。</span></div></section><section className="scheme-one-ended-card"><InfoCircleOutlined /><b>本年度贴息已结束</b><p>2026 年协议未签署且贴息政策窗口已关闭，暂不支持申请及协议补签。请关注最新政策年度。</p></section><div className="policy-tip warning"><InfoCircleOutlined /><span>历史年度不支持协议补签。</span></div></PhoneScroll></PhoneFrame></PhoneScene> : null;
  return <div className="scheme-phone-list scheme-three-phone-list">
    {workbenchA}
    {workbenchB}
    {zone2027}
    {zone2026Signed}
    {zone2026Unsigned}
    {activeEntries.map((item) => <PhoneScene key={`${item.key}-${item.year}`} title={`方案三 · ${item.year} 年${entryLabel[item.key]}`} subtitle="固定当前年度查询"><ReferenceBusinessPhone entryKey={item.key} year={item.year} fixedYear={item.year} referenceClass="scheme-three-reference" businessClass="scheme-three-business-page" onFeedback={onFeedback} onClose={onClose} /></PhoneScene>)}
  </div>;
}

function SchemeFourPhone({ onFeedback, onClose }: { onFeedback: Feedback; onClose: () => void }) {
  const [page, setPage] = useState<'home' | 'history-years' | 'history-workbench'>('home');
  const [historyYear, setHistoryYear] = useState<2026 | 2025>(2026);
  const [signed2027, setSigned2027] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [activeEntries, setActiveEntries] = useState<Array<{ key: CrossYearBusinessEntry['key']; year: PolicyYear; source: 'home' | 'history' }>>([]);
  const historyExpiredState: CrossYearPolicyYearState = { ...findCrossYearYear(2026), year: 2026, agreementStatus: '已过期', validPeriod: '2026-01-01 至 2026-12-31', canApply: false, statusRemark: '历史年度仅支持查看记录' };
  const historyUnsignedState: CrossYearPolicyYearState = { ...findCrossYearYear(2026), year: 2025, agreementStatus: '未签署', agreementDate: undefined, validPeriod: '2025-01-01 至 2025-12-31', canApply: false, todoCount: 0, statusRemark: '协议未签署，历史年度不支持补签' };
  const openHomeBusiness = (entry: CrossYearBusinessEntry) => {
    setActiveEntries((items) => items.some((item) => item.key === entry.key && item.source === 'home') ? items : [...items, { key: entry.key, year: 2027, source: 'home' }]);
  };
  const openHistoryBusiness = (entry: CrossYearBusinessEntry) => {
    setActiveEntries((items) => items.some((item) => item.key === entry.key && item.source === 'history' && item.year === 2026) ? items : [...items, { key: entry.key, year: 2026, source: 'history' }]);
  };
  const sign2027 = () => {
    setSigned2027(true);
    setAgreementOpen(false);
    onFeedback('贴息协议签署成功');
  };
  const entryLabel: Record<CrossYearBusinessEntry['key'], string> = { apply: '自主申请', agreement: '我的协议', verify: '核定记录', record: '贴息记录' };
  const historyWorkbench = page === 'history-workbench' ? <PhoneScene title={`方案四 · ${historyYear} 年历史专区`} subtitle={historyYear === 2026 ? '参照方案三 26 年已签专区' : '历史年度财政贴息专区'}><PhoneFrame title={`${historyYear} 年历史业务`} className={`scheme-four-reference scheme-one-reference ${historyYear === 2026 ? 'scheme-four-history-expired' : 'scheme-four-history-unsigned'}`} onBack={() => { setPage('history-years'); }} onClose={onClose}><PhoneScroll>{historyYear === 2026 ? <><div className="scheme-one-banner"><div><span>财政贴息</span><b>适用客户可享受贴息服务</b></div><em>贴息时间 2026-01-01 至 2026-12-31</em></div><section className="scheme-one-agreement home-agreement is-signed"><div className="scheme-one-agreement-main"><CheckCircleFilled /><div><strong>贴息协议已生效</strong><span>您可以开始申请消费贷款贴息</span></div></div><b className="scheme-one-signed-badge">已签约</b></section><div className="phone-section-label">业务服务</div><DeadlineTip /><EntryGrid className="scheme-one-entry-grid" onEntry={(_text, entry) => openHistoryBusiness(entry)} /><div className="policy-tip"><InfoCircleOutlined /><span>历史年度 · 2026 年业务页点击后平铺展示，风格对齐方案三 26 已签专区。</span></div></> : <><div className="history-workbench-tag"><HistoryOutlined /> 历史年度 · {historyYear} 年</div><section className="unsigned-state-card prominent"><StatusPill state={historyUnsignedState} /><b>协议未签署，暂不可办理</b><p>2025 年协议未签署，历史年度不支持补签及新增业务。</p></section><div className="policy-tip warning"><InfoCircleOutlined /><span>该历史年度仅展示未签署状态，不提供业务入口。</span></div></>}</PhoneScroll></PhoneFrame></PhoneScene> : null;
  const historyYears = page === 'history-years' || page === 'history-workbench' ? <PhoneScene title="方案四 · 选择历史年份" subtitle="先选年份再进历史专区"><PhoneFrame title="历史业务" className="scheme-four-reference" onBack={() => setPage('home')} onClose={onClose}><PhoneScroll><div className="phone-intro"><b>选择历史年份</b><span>进入对应年度财政贴息专区</span></div><div className="scheme-four-history-year-list"><button type="button" className="multi-year-card scheme-four-history-year-card" onClick={() => { setHistoryYear(2026); setPage('history-workbench'); }}><div className="multi-year-heading"><b>2026 年</b><StatusPill state={historyExpiredState} /></div><div className="policy-window">贴息政策窗口：2026-01-01 至 2026-12-31</div><DeadlineTip /><div className="multi-year-foot">已过期，进入已签风格专区 <RightOutlined /></div></button><button type="button" className="multi-year-card scheme-four-history-year-card" onClick={() => { setHistoryYear(2025); setPage('history-workbench'); }}><div className="multi-year-heading"><b>2025 年</b><StatusPill state={historyUnsignedState} /></div><div className="policy-window">贴息政策窗口：2025-01-01 至 2025-12-31</div><div className="multi-year-foot">未签署，不支持补签 <RightOutlined /></div></button></div><div className="policy-tip"><InfoCircleOutlined /><span>选择年份后进入该年度历史专区。</span></div></PhoneScroll></PhoneFrame></PhoneScene> : null;
  return <div className="scheme-phone-list scheme-four-phone-list">
    <PhoneScene title="方案四 · 已签首页" subtitle="对齐方案一已签，含历史业务"><PhoneFrame title="财政贴息专区" className="scheme-four-reference scheme-one-reference" onClose={onClose}><PhoneScroll><div className="scheme-one-banner"><div><span>财政贴息</span><b>适用客户可享受贴息服务</b></div><em>贴息时间 2027-01-01 至 2027-12-31</em></div><section className="scheme-one-agreement home-agreement is-signed"><div className="scheme-one-agreement-main"><CheckCircleFilled /><div><strong>贴息协议已生效</strong><span>您可以开始申请消费贷款贴息</span></div></div><b className="scheme-one-signed-badge">已签约</b></section><div className="phone-section-label">业务服务</div><EntryGrid className="scheme-one-entry-grid" onEntry={(_text, entry) => openHomeBusiness(entry)} /><button type="button" className="history-center-entry" onClick={() => setPage('history-years')}><span><HistoryOutlined /><b>历史业务</b><small>2026 年及更早年度</small></span><RightOutlined /></button><div className="policy-tip"><InfoCircleOutlined /><span>历史业务先选择年份，再进入对应专区。</span></div></PhoneScroll></PhoneFrame></PhoneScene>
    <PhoneScene title="方案四 · 未签首页" subtitle="对齐方案一未签，可补签并保留历史业务"><PhoneFrame title="财政贴息专区" className="scheme-four-reference scheme-one-reference" onClose={onClose}><PhoneScroll><div className={`scheme-one-banner ${signed2027 ? '' : 'scheme-one-banner-muted'}`}><div><span>财政贴息</span><b>适用客户可享受贴息服务</b></div><em>贴息时间 2027-01-01 至 2027-12-31</em></div><section className={`scheme-one-agreement home-agreement ${signed2027 ? 'is-signed' : 'is-unsigned'}`}>{signed2027 ? <><div className="scheme-one-agreement-main"><CheckCircleFilled /><div><strong>贴息协议已生效</strong><span>您可以开始申请消费贷款贴息</span></div></div><b className="scheme-one-signed-badge">已签约</b></> : <><div><strong>协议未签署</strong><span>当前年度未完成协议签署，暂不支持新增贴息业务。</span></div><button type="button" onClick={() => setAgreementOpen(true)}>去签署贴息协议 <RightOutlined /></button></>}</section>{signed2027 ? <><div className="phone-section-label">业务服务</div><EntryGrid className="scheme-one-entry-grid" onEntry={(_text, entry) => openHomeBusiness(entry)} /></> : <section className="scheme-one-ended-card"><InfoCircleOutlined /><b>协议未签署，暂不可办理</b><p>完成贴息协议签署后才可办理相关业务。</p></section>}<button type="button" className="history-center-entry" onClick={() => setPage('history-years')}><span><HistoryOutlined /><b>历史业务</b><small>查看历史年度记录</small></span><RightOutlined /></button><div className="policy-tip"><InfoCircleOutlined /><span>未签首页可补签协议，并仍可进入历史业务中心。</span></div>{agreementOpen ? <SchemeOneAgreementSheet year={2027} onSign={sign2027} onClose={() => setAgreementOpen(false)} /> : null}</PhoneScroll></PhoneFrame></PhoneScene>
    {historyYears}
    {historyWorkbench}
    {activeEntries.map((item) => <PhoneScene key={`${item.source}-${item.key}-${item.year}`} title={`方案四 · ${item.year} 年${entryLabel[item.key]}`} subtitle={item.source === 'home' ? '当前年度业务' : '历史年度业务'}><ReferenceBusinessPhone entryKey={item.key} year={item.year} fixedYear={item.source === 'history' ? item.year : undefined} referenceClass="scheme-four-reference" businessClass="scheme-four-business-page" onFeedback={onFeedback} onClose={onClose} /></PhoneScene>)}
  </div>;
}


function SchemeOneYearFilter({ value, onChange }: { value: YearFilter; onChange: (value: YearFilter) => void }) {
  return <label className="scheme-one-year-filter"><span>查看年度</span><select aria-label="查看年度" value={value} onChange={(event) => onChange(event.target.value === 'all' ? 'all' : Number(event.target.value) as PolicyYear)}><option value="all">全部年份</option><option value="2027">2027 年</option><option value="2026">2026 年</option></select></label>;
}

function SchemeOneApplyPage({ year, onFeedback }: { year: PolicyYear; onFeedback: Feedback }) {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const addFiles = (event: ChangeEvent<HTMLInputElement>, type: Voucher['type']) => {
    const files = Array.from(event.target.files ?? []);
    const max = type === 'invoice' ? 1 : 6;
    const current = vouchers.filter((item) => item.type === type);
    if (current.length + files.length > max) { onFeedback(type === 'invoice' ? '发票最多上传1张' : '消费凭证最多上传6张'); event.target.value = ''; return; }
    setVouchers((items) => [...items, ...files.map((file, index) => ({ id: `${type}-${Date.now()}-${index}`, type, imageUrl: '', fileName: file.name }))]);
    event.target.value = '';
  };
  const invoice = vouchers.filter((item) => item.type === 'invoice');
  const proofs = vouchers.filter((item) => item.type === 'proof');
  return <div className="scheme-one-apply-content"><div className="scheme-one-locked-year"><CalendarOutlined /><span>申请年度：<b>{year} 年</b></span><em>办理年度已锁定</em></div><section className="scheme-one-form-card"><h3>消费信息</h3><label>消费账户 <b className="scheme-one-required">*</b><select value={form.account} onChange={(event) => update('account', event.target.value)}><option value="">请选择消费账户</option><option>招商银行（尾号 6688）</option><option>中国银行（尾号 1122）</option></select></label><label>消费日期 <b className="scheme-one-required">*</b><input type="date" value={form.consumeDate} onChange={(event) => update('consumeDate', event.target.value)} /></label><label>交易流水号 <b className="scheme-one-required">*</b><button type="button" className="scheme-one-field" onClick={() => onFeedback('请选择对应年度消费交易流水')}>{form.transactionNo || '请选择交易流水号'}<RightOutlined /></button></label><label>消费用途 <b className="scheme-one-required">*</b><select value={form.purpose} onChange={(event) => update('purpose', event.target.value)}><option value="">请选择消费用途</option><option>家用电器</option><option>家装消费</option><option>教育培训</option><option>家具消费</option><option>其他日常消费</option></select></label><label>关联贷款 <b className="scheme-one-required">*</b><button type="button" className="scheme-one-field" onClick={() => onFeedback('请选择符合条件的关联贷款')}>请选择关联贷款 <RightOutlined /></button></label><label>消费描述 <span className="scheme-one-optional">选填</span><textarea rows={3} value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="请描述消费用途" /></label></section><section className="scheme-one-form-card"><h3>消费凭证</h3><div className="scheme-one-upload-block"><div className="scheme-one-upload-heading">发票 <b className="scheme-one-required">*</b><small>支持 jpg/png，最多 1 张</small></div><div className="scheme-one-upload-list"><label className="scheme-one-upload-trigger"><CloudUploadOutlined /><span>点击上传</span><input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={(event) => addFiles(event, 'invoice')} disabled={invoice.length >= 1} /></label>{invoice.map((item) => <div className="scheme-one-voucher-chip" key={item.id}><FileImageOutlined /><span>{item.fileName}</span></div>)}</div></div><div className="scheme-one-upload-block"><div className="scheme-one-upload-heading">消费凭证 <b className="scheme-one-required">*</b><small>如购物小票、消费合同，最多 6 张</small></div><div className="scheme-one-upload-list"><label className="scheme-one-upload-trigger"><CloudUploadOutlined /><span>点击上传</span><input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" multiple onChange={(event) => addFiles(event, 'proof')} disabled={proofs.length >= 6} /></label>{proofs.map((item) => <div className="scheme-one-voucher-chip" key={item.id}><FileImageOutlined /><span>{item.fileName}</span></div>)}</div></div></section><button type="button" className="scheme-one-submit" onClick={() => onFeedback(`${year} 年申请信息已提交`)}>提交申请</button></div>;
}

function SchemeOneAgreementPage({ defaultYear, fixedYear, onFeedback, compactHeader = false, forceAllYears = false }: { defaultYear: PolicyYear; fixedYear?: PolicyYear; onFeedback: Feedback; compactHeader?: boolean; forceAllYears?: boolean }) {
  const [yearFilter, setYearFilter] = useState<YearFilter>(forceAllYears ? 'all' : (fixedYear ?? defaultYear));
  const [previewYear, setPreviewYear] = useState<PolicyYear>();
  const activeFilter: YearFilter = fixedYear ?? yearFilter;
  const agreements = schemeOneAgreements
    .filter((item) => activeFilter === 'all' || item.year === activeFilter)
    .slice()
    .sort((a, b) => b.year - a.year);
  const statusLabel = (status: YearAgreement['status']) => (status === 'effective' ? '生效' : '已过期');
  const header = compactHeader
    ? (fixedYear
      ? <div className="scheme-one-page-toolbar"><span className="fixed-year-label">当前年度：{fixedYear} 年</span></div>
      : <div className="scheme-one-page-toolbar"><SchemeOneYearFilter value={yearFilter} onChange={setYearFilter} /></div>)
    : <div className="scheme-one-page-intro"><div><b>我的协议</b><span>查看各政策年度签署的贴息服务协议</span></div>{fixedYear ? <span className="fixed-year-label">当前年度：{fixedYear} 年</span> : <SchemeOneYearFilter value={yearFilter} onChange={setYearFilter} />}</div>;
  return <div className="scheme-one-record-content">{header}{agreements.map((agreement) => <article className="scheme-one-agreement-card" key={agreement.id}><span className={`scheme-one-effective-tag ${agreement.status === 'expired' ? 'is-expired' : ''}`}>{statusLabel(agreement.status)}</span><h3>{agreement.title}</h3><p>{agreement.summary}</p><div className="scheme-one-agreement-meta"><span>协议年度</span><b>{agreement.year} 年</b><span>签署时间</span><b>{agreement.signedAt ?? '待签署'}</b><span>生效日期</span><b>{agreement.effectiveDate ?? '—'}</b><span>协议状态</span><b>{statusLabel(agreement.status)}</b></div><div className="scheme-one-card-actions"><button type="button" onClick={() => onFeedback(`${agreement.year} 年合同下载为 Mock 反馈`)}>下载合同</button><button type="button" onClick={() => setPreviewYear(agreement.year)}>预览合同</button></div></article>)}{!agreements.length ? <div className="scheme-one-empty">暂无协议</div> : null}{previewYear ? <SchemeOneAgreementSheet year={previewYear} onSign={() => { onFeedback(`${previewYear} 年协议预览`); setPreviewYear(undefined); }} onClose={() => setPreviewYear(undefined)} /> : null}</div>;
}

const schemeOneStatusLabel: Record<ConsumeInterestApplication['status'], string> = { passed: '已通过', reviewing: '审核中', rejected: '已拒绝', cancelled: '已撤销' };
const schemeOneStatusClass: Record<ConsumeInterestApplication['status'], string> = { passed: 'scheme-one-status-success', reviewing: 'scheme-one-status-reviewing', rejected: 'scheme-one-status-rejected', cancelled: 'scheme-one-status-cancelled' };

function SchemeOneApplicationCard({ application, onDetail, onFeedback }: { application: YearApplication; onDetail: () => void; onFeedback: Feedback }) {
  return <article className="scheme-one-application-record"><div className="scheme-one-application-heading"><strong>申请贴息 <em>¥{money(application.interestAmount)}</em></strong><span className={schemeOneStatusClass[application.status]}>{schemeOneStatusLabel[application.status]}</span></div><div className="scheme-one-application-info"><div><span>申请时间</span><b>{application.applyTime}</b></div><div><span>核定来源</span><b>{application.source === 'system' ? '系统核定' : '客户自主申请'}</b></div><div><span>消费日期</span><b>{application.consumeDate}</b></div><div><span>核定日期</span><b>{application.approvedAt ?? '审核中'}</b></div></div><p className={schemeOneStatusClass[application.status]}>{application.statusRemark}</p><div className="scheme-one-application-actions">{application.status === 'rejected' ? <button type="button" onClick={() => onFeedback('已定位到自主申请，请补充资料后重新提交')}>重新申请</button> : null}{application.status === 'reviewing' ? <button type="button" onClick={() => onFeedback('取消申请为原型反馈')}>取消申请</button> : null}<button type="button" className="scheme-one-detail-button" onClick={onDetail}>详情 <RightOutlined /></button></div></article>;
}

function SchemeOneVerifyDetail({ application, onFeedback }: { application: YearApplication; onFeedback: Feedback }) {
  const loans = application.loanIds.map((id) => eligibleLoans.find((item) => item.id === id)).filter(Boolean);
  const consumes = application.systemConsumes ?? (application.consumeInfo ? [application.consumeInfo] : []);
  return <div className="scheme-one-detail-content"><section className="scheme-one-form-card"><h3>申请信息</h3><div className="scheme-one-detail-grid"><span>申请年度</span><b>{application.year} 年</b><span>申请时间</span><b>{application.applyTime}</b><span>核定来源</span><b>{application.source === 'system' ? '系统核定' : '客户自主申请'}</b><span>核定状态</span><b className={schemeOneStatusClass[application.status]}>{schemeOneStatusLabel[application.status]}</b><span>状态备注</span><b>{application.statusRemark}</b><span>消费日期</span><b>{application.consumeDate}</b><span>剩余可贴本金</span><b>¥{money(application.remainingSubsidyPrincipal)}</b></div><div className="scheme-one-loan-summary"><span>关联贷款</span><div>{loans.slice(0, 3).map((loan) => <span key={loan?.id}>{loan?.loanNo}</span>)}{loans.length > 3 ? <button type="button" onClick={() => onFeedback('关联贷款全部信息为原型反馈')}>查看全部</button> : null}</div></div><p className="scheme-one-description">{application.consumeDescription}</p></section><section className="scheme-one-form-card"><h3>消费信息</h3>{consumes.map((consume) => <button type="button" className="scheme-one-consume-card" key={consume.id} onClick={() => onFeedback(`${application.year} 年消费详情`)}><span>{consume.consumeDate}</span><strong>¥{money(consume.amount)}</strong><small>{consume.purpose} · 贴息 {money(consume.interestAmount)} 元</small><RightOutlined /></button>)}</section><section className="scheme-one-form-card"><h3>凭证信息</h3><div className="scheme-one-voucher-list">{application.vouchers.length ? application.vouchers.map((voucher) => <button type="button" key={voucher.id} onClick={() => onFeedback(`${voucher.fileName}凭证预览`)}><FileImageOutlined /><span>{voucher.fileName}</span><RightOutlined /></button>) : <div className="scheme-one-empty">暂无凭证</div>}</div></section></div>;
}

function SchemeOneVerifyPage({ defaultYear, fixedYear, onFeedback, advancedFilter = false }: { defaultYear: PolicyYear; fixedYear?: PolicyYear; onFeedback: Feedback; advancedFilter?: boolean }) {
  const [yearFilter, setYearFilter] = useState<YearFilter>(fixedYear ?? defaultYear);
  const [tab, setTab] = useState<VerifyTab>('all');
  const [range, setRange] = useState<DateRange>('all');
  const [quickRange, setQuickRange] = useState<VerifyQuickRange>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [channel, setChannel] = useState<VerifyChannel>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [detail, setDetail] = useState<YearApplication>();
  const tabs: Array<{ key: VerifyTab; label: string }> = [{ key: 'all', label: '全部' }, { key: 'passed', label: '已通过' }, { key: 'reviewing', label: '审核中' }, { key: 'rejected', label: '已拒绝' }, { key: 'cancelled', label: '已撤销' }];
  const quickOptions: Array<{ key: VerifyQuickRange; label: string }> = [
    { key: 'all', label: '全部时间' },
    { key: '3m', label: '近三个月' },
    { key: '6m', label: '近半年' },
    { key: '1y', label: '近一年' },
  ];
  const channelOptions: Array<{ key: VerifyChannel; label: string }> = [
    { key: 'all', label: '全部渠道' },
    { key: 'self', label: '自主申请' },
    { key: 'system', label: '系统核定' },
  ];
  const list = useMemo(() => {
    const yearList = schemeOneApplications.filter((item) => (fixedYear ?? yearFilter) === 'all' || item.year === (fixedYear ?? yearFilter));
    const dates = yearList.map((item) => item.applyTime);
    return yearList.filter((item) => {
      if (tab !== 'all' && item.status !== tab) return false;
      if (advancedFilter) {
        if (channel !== 'all' && item.source !== channel) return false;
        return isWithinVerifyTime(item.applyTime, quickRange, customFrom, customTo, dates);
      }
      return isWithinDateRange(item.applyTime, range, dates);
    });
  }, [advancedFilter, channel, customFrom, customTo, quickRange, range, tab, yearFilter, fixedYear]);
  const activeFilterCount = advancedFilter
    ? (quickRange !== 'all' ? 1 : 0) + (channel !== 'all' ? 1 : 0) + ((customFrom || customTo) && quickRange === 'custom' ? 1 : 0)
    : 0;
  const filterSummary = (() => {
    if (!advancedFilter) return '';
    const parts: string[] = [];
    if (quickRange === 'custom' && (customFrom || customTo)) parts.push(`${customFrom || '…'} 至 ${customTo || '…'}`);
    else if (quickRange !== 'all') parts.push(quickOptions.find((item) => item.key === quickRange)?.label ?? '');
    if (channel !== 'all') parts.push(channelOptions.find((item) => item.key === channel)?.label ?? '');
    return parts.filter(Boolean).join(' · ') || '未设置条件';
  })();
  const resetAdvanced = () => {
    setQuickRange('all');
    setCustomFrom('');
    setCustomTo('');
    setChannel('all');
  };
  if (detail) return <div className="scheme-one-record-content"><div className="scheme-one-subpage-bar"><button type="button" onClick={() => setDetail(undefined)}><LeftOutlined /> 返回核定记录</button><span>{detail.year} 年核定记录详情</span></div><SchemeOneVerifyDetail application={detail} onFeedback={onFeedback} /></div>;
  const basicTimeFilter = <label className="scheme-one-list-filter"><span>按时间筛选</span><select aria-label="核定记录时间筛选" value={range} onChange={(event) => setRange(event.target.value as DateRange)}><option value="all">全部时间</option><option value="30">近30天</option><option value="90">近90天</option></select></label>;
  const advancedTrigger = <button type="button" className={`scheme-one-advanced-filter-trigger${filterOpen || activeFilterCount ? ' is-active' : ''}`} aria-expanded={filterOpen} aria-label="高级筛选" onClick={() => setFilterOpen((open) => !open)}><span>高级筛选</span>{activeFilterCount ? <em>{activeFilterCount}</em> : null}<small>{filterOpen ? '收起' : '展开'}</small></button>;
  const advancedPanel = filterOpen ? <section className="scheme-one-advanced-filter-panel" aria-label="核定记录高级筛选面板">
    <div className="scheme-one-advanced-filter-block">
      <div className="scheme-one-advanced-filter-label">快捷时间</div>
      <div className="scheme-one-advanced-filter-chips" role="group" aria-label="快捷时间筛选">
        {quickOptions.map((item) => <button type="button" key={item.key} className={quickRange === item.key ? 'active' : ''} onClick={() => setQuickRange(item.key)}>{item.label}</button>)}
      </div>
    </div>
    <div className="scheme-one-advanced-filter-block">
      <div className="scheme-one-advanced-filter-label">自定义时间段</div>
      <div className="scheme-one-advanced-filter-dates">
        <label><span>开始日期</span><input aria-label="自定义开始日期" type="date" value={customFrom} onChange={(event) => { setCustomFrom(event.target.value); setQuickRange('custom'); }} /></label>
        <span className="scheme-one-advanced-filter-sep">至</span>
        <label><span>结束日期</span><input aria-label="自定义结束日期" type="date" value={customTo} onChange={(event) => { setCustomTo(event.target.value); setQuickRange('custom'); }} /></label>
      </div>
    </div>
    <div className="scheme-one-advanced-filter-block">
      <div className="scheme-one-advanced-filter-label">申请渠道</div>
      <div className="scheme-one-advanced-filter-chips" role="group" aria-label="申请渠道筛选">
        {channelOptions.map((item) => <button type="button" key={item.key} className={channel === item.key ? 'active' : ''} onClick={() => setChannel(item.key)}>{item.label}</button>)}
      </div>
    </div>
    <div className="scheme-one-advanced-filter-actions">
      <span className="scheme-one-advanced-filter-summary">{filterSummary}</span>
      <button type="button" className="scheme-one-advanced-filter-reset" onClick={resetAdvanced}>重置</button>
    </div>
  </section> : null;
  return <div className="scheme-one-record-content">
    <div className="scheme-one-filter-row">{fixedYear ? <span className="fixed-year-label">当前年度：{fixedYear} 年</span> : <SchemeOneYearFilter value={yearFilter} onChange={setYearFilter} />}{advancedFilter ? advancedTrigger : basicTimeFilter}</div>
    {advancedFilter ? advancedPanel : null}
    <div className="scheme-one-verify-tabs">{tabs.map((item) => <button type="button" key={item.key} className={tab === item.key ? 'active' : ''} onClick={() => setTab(item.key)}>{item.label}</button>)}</div>
    {list.map((item) => <SchemeOneApplicationCard application={item} key={item.id} onDetail={() => setDetail(item)} onFeedback={onFeedback} />)}
    {!list.length ? <div className="scheme-one-empty">暂无核定记录</div> : null}
  </div>;
}

function SchemeOneRecordsPage({ defaultYear, fixedYear, advancedFilter = false }: { defaultYear: PolicyYear; fixedYear?: PolicyYear; advancedFilter?: boolean }) {
  const [yearFilter, setYearFilter] = useState<YearFilter>(fixedYear ?? defaultYear);
  const [range, setRange] = useState<DateRange>('all');
  const [quickRange, setQuickRange] = useState<VerifyQuickRange>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [interestType, setInterestType] = useState<InterestTypeFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const quickOptions: Array<{ key: VerifyQuickRange; label: string }> = [
    { key: 'all', label: '全部时间' },
    { key: '3m', label: '近三个月' },
    { key: '6m', label: '近半年' },
    { key: '1y', label: '近一年' },
  ];
  const typeOptions: Array<{ key: InterestTypeFilter; label: string }> = [
    { key: 'all', label: '全部类型' },
    { key: 'realtime', label: '实时贴息' },
    { key: 'subsidy', label: '补贴息' },
    { key: 'reclaim', label: '收回贴息' },
  ];
  const list = useMemo(() => {
    const yearList = schemeOneRecords.filter((item) => (fixedYear ?? yearFilter) === 'all' || item.year === (fixedYear ?? yearFilter));
    const dates = yearList.map((item) => item.date);
    return yearList.filter((item) => {
      if (advancedFilter) {
        if (interestType !== 'all' && item.interestType !== interestType) return false;
        return isWithinVerifyTime(item.date, quickRange, customFrom, customTo, dates);
      }
      return isWithinDateRange(item.date, range, dates);
    });
  }, [advancedFilter, customFrom, customTo, interestType, quickRange, range, yearFilter, fixedYear]);
  const total = list.reduce((sum, item) => sum + item.amount, 0);
  const activeFilterCount = advancedFilter
    ? (quickRange !== 'all' ? 1 : 0) + (interestType !== 'all' ? 1 : 0) + ((customFrom || customTo) && quickRange === 'custom' ? 1 : 0)
    : 0;
  const filterSummary = (() => {
    if (!advancedFilter) return '';
    const parts: string[] = [];
    if (quickRange === 'custom' && (customFrom || customTo)) parts.push(`${customFrom || '…'} 至 ${customTo || '…'}`);
    else if (quickRange !== 'all') parts.push(quickOptions.find((item) => item.key === quickRange)?.label ?? '');
    if (interestType !== 'all') parts.push(typeOptions.find((item) => item.key === interestType)?.label ?? '');
    return parts.filter(Boolean).join(' · ') || '未设置条件';
  })();
  const resetAdvanced = () => {
    setQuickRange('all');
    setCustomFrom('');
    setCustomTo('');
    setInterestType('all');
  };
  const basicTimeFilter = <label className="scheme-one-list-filter"><span>按时间筛选</span><select aria-label="贴息记录时间筛选" value={range} onChange={(event) => setRange(event.target.value as DateRange)}><option value="all">全部时间</option><option value="30">近30天</option><option value="90">近90天</option></select></label>;
  const advancedTrigger = <button type="button" className={`scheme-one-advanced-filter-trigger${filterOpen || activeFilterCount ? ' is-active' : ''}`} aria-expanded={filterOpen} aria-label="高级筛选" onClick={() => setFilterOpen((open) => !open)}><span>高级筛选</span>{activeFilterCount ? <em>{activeFilterCount}</em> : null}<small>{filterOpen ? '收起' : '展开'}</small></button>;
  const advancedPanel = filterOpen ? <section className="scheme-one-advanced-filter-panel" aria-label="贴息记录高级筛选面板">
    <div className="scheme-one-advanced-filter-block">
      <div className="scheme-one-advanced-filter-label">快捷时间</div>
      <div className="scheme-one-advanced-filter-chips" role="group" aria-label="快捷时间筛选">
        {quickOptions.map((item) => <button type="button" key={item.key} className={quickRange === item.key ? 'active' : ''} onClick={() => setQuickRange(item.key)}>{item.label}</button>)}
      </div>
    </div>
    <div className="scheme-one-advanced-filter-block">
      <div className="scheme-one-advanced-filter-label">自定义时间段</div>
      <div className="scheme-one-advanced-filter-dates">
        <label><span>开始日期</span><input aria-label="自定义开始日期" type="date" value={customFrom} onChange={(event) => { setCustomFrom(event.target.value); setQuickRange('custom'); }} /></label>
        <span className="scheme-one-advanced-filter-sep">至</span>
        <label><span>结束日期</span><input aria-label="自定义结束日期" type="date" value={customTo} onChange={(event) => { setCustomTo(event.target.value); setQuickRange('custom'); }} /></label>
      </div>
    </div>
    <div className="scheme-one-advanced-filter-block">
      <div className="scheme-one-advanced-filter-label">贴息类型</div>
      <div className="scheme-one-advanced-filter-chips" role="group" aria-label="贴息类型筛选">
        {typeOptions.map((item) => <button type="button" key={item.key} className={interestType === item.key ? 'active' : ''} onClick={() => setInterestType(item.key)}>{item.label}</button>)}
      </div>
    </div>
    <div className="scheme-one-advanced-filter-actions">
      <span className="scheme-one-advanced-filter-summary">{filterSummary}</span>
      <button type="button" className="scheme-one-advanced-filter-reset" onClick={resetAdvanced}>重置</button>
    </div>
  </section> : null;
  return <div className="scheme-one-record-content">
    <div className="scheme-one-filter-row">{fixedYear ? <span className="fixed-year-label">当前年度：{fixedYear} 年</span> : <SchemeOneYearFilter value={yearFilter} onChange={setYearFilter} />}{advancedFilter ? advancedTrigger : basicTimeFilter}</div>
    {advancedFilter ? advancedPanel : null}
    <section className="scheme-one-records-summary"><div><span>累计贴息金额</span><strong>¥{money(total)}</strong></div><div><span>累计笔数</span><strong>{list.length}<small>笔</small></strong></div></section>
    {list.map((item) => <article className="scheme-one-interest-record" key={item.id}><div><strong>{item.date}</strong><span>{item.loanNo}</span><em className="scheme-one-interest-type">{interestTypeLabel[item.interestType]}</em><small>贴息卡号 {item.cardNo} · 贴息时间 {item.interestTime}</small></div><b>¥{money(item.amount)}</b></article>)}
    {!list.length ? <div className="scheme-one-empty">暂无贴息记录</div> : null}
  </div>;
}

function ReferenceBusinessPhone({ entryKey, year, fixedYear, referenceClass, businessClass, onFeedback, onClose, compactAgreementHeader = false, advancedVerifyFilter = true, advancedRecordsFilter = true }: { entryKey: CrossYearBusinessEntry['key']; year: PolicyYear; fixedYear?: PolicyYear; referenceClass: string; businessClass: string; onFeedback: Feedback; onClose: () => void; compactAgreementHeader?: boolean; advancedVerifyFilter?: boolean; advancedRecordsFilter?: boolean }) {
  const className = `${referenceClass} scheme-one-reference scheme-one-business-page ${businessClass}`;
  const agreementTip = fixedYear
    ? `协议按政策年度独立维护，当前仅可查看 ${fixedYear} 年协议。`
    : '协议按政策年度独立维护，可查看全部年份协议。';
  const verifyTip = fixedYear
    ? `核定状态、消费信息与凭证信息仅可查看 ${fixedYear} 年数据。`
    : advancedVerifyFilter
      ? '支持高级筛选：快捷时间、自定义日期与申请渠道，结果按年度独立查询。'
      : '核定状态、消费信息与凭证信息均按年度独立查询。';
  const recordTip = fixedYear
    ? `贴息金额按记录明细统计，当前仅可查看 ${fixedYear} 年贴息记录。`
    : advancedRecordsFilter
      ? '支持高级筛选：快捷时间、自定义日期与贴息类型，结果按年度独立统计。'
      : '贴息金额按记录明细统计，支持全部年份与单年度查看。';
  if (entryKey === 'apply') return <PhoneFrame className={className} title="自主申请" onClose={onClose}><PhoneScroll><SchemeOneApplyPage year={year} onFeedback={onFeedback} /><div className="policy-tip"><InfoCircleOutlined /><span>申请年度一经确定不可跨年度提交，所有消费凭证需真实有效。</span></div></PhoneScroll></PhoneFrame>;
  if (entryKey === 'agreement') return <PhoneFrame className={className} title="我的协议" onClose={onClose}><PhoneScroll><SchemeOneAgreementPage defaultYear={year} fixedYear={fixedYear} onFeedback={onFeedback} compactHeader={compactAgreementHeader} /><div className="policy-tip"><InfoCircleOutlined /><span>{agreementTip}</span></div></PhoneScroll></PhoneFrame>;
  if (entryKey === 'verify') return <PhoneFrame className={className} title="核定记录" onClose={onClose}><PhoneScroll><SchemeOneVerifyPage defaultYear={year} fixedYear={fixedYear} onFeedback={onFeedback} advancedFilter={advancedVerifyFilter} /><div className="policy-tip"><InfoCircleOutlined /><span>{verifyTip}</span></div></PhoneScroll></PhoneFrame>;
  return <PhoneFrame className={className} title="贴息记录" onClose={onClose}><PhoneScroll><SchemeOneRecordsPage defaultYear={year} fixedYear={fixedYear} advancedFilter={advancedRecordsFilter} /><div className="policy-tip"><InfoCircleOutlined /><span>{recordTip}</span></div></PhoneScroll></PhoneFrame>;
}

function SchemeOneBusinessPhone({ entryKey, year, onFeedback, onClose }: { entryKey: CrossYearBusinessEntry['key']; year: PolicyYear; onFeedback: Feedback; onClose: () => void }) {
  return <ReferenceBusinessPhone entryKey={entryKey} year={year} referenceClass="scheme-one-reference" businessClass="scheme-one-business-page" onFeedback={onFeedback} onClose={onClose} compactAgreementHeader advancedVerifyFilter advancedRecordsFilter />;
}

function SchemeOneScenarioPreview({ config, onFeedback, onOpenBusiness, onClose }: { config: SchemeOneScenarioConfig; onFeedback: Feedback; onOpenBusiness: (entry: CrossYearBusinessEntry, year: PolicyYear) => void; onClose: () => void }) {
  return <PhoneScene title={config.title} subtitle={config.subtitle}><SchemeOneScenarioPhone config={config} onFeedback={onFeedback} onOpenBusiness={onOpenBusiness} onClose={onClose} /></PhoneScene>;
}

function SchemeOnePreview({ onFeedback, onClose }: { onFeedback: Feedback; onClose: () => void }) {
  const [activeEntries, setActiveEntries] = useState<Array<{ key: CrossYearBusinessEntry['key']; year: PolicyYear }>>([]);
  const openBusiness = (entry: CrossYearBusinessEntry, year: PolicyYear) => {
    setActiveEntries((items) => items.some((item) => item.key === entry.key && item.year === year) ? items : [...items, { key: entry.key, year }]);
  };
  const entryLabel: Record<CrossYearBusinessEntry['key'], string> = { apply: '自主申请', agreement: '我的协议', verify: '核定记录', record: '贴息记录' };
  return <div className="scheme-phone-list scheme-one-phone-list">
    <SchemeOneScenarioPreview config={{ title: '方案一 · 未签协议首页', subtitle: '27 年未签协议场景', defaultYear: 2027, signedYears: [], endedYears: [2026] }} onFeedback={onFeedback} onOpenBusiness={openBusiness} onClose={onClose} />
    <SchemeOneScenarioPreview config={{ title: '方案一 · 已签协议首页', subtitle: '现有年度协议状态', defaultYear: 2027, signedYears: [2027], endedYears: [2026] }} onFeedback={onFeedback} onOpenBusiness={openBusiness} onClose={onClose} />
    <SchemeOneScenarioPreview config={{ title: '方案一 · 跨年度切换首页', subtitle: '27 年未签 / 26 年已签场景', defaultYear: 2027, signedYears: [2026], showDeadlineTip: true }} onFeedback={onFeedback} onOpenBusiness={openBusiness} onClose={onClose} />
    <SchemeOneScenarioPreview config={{ title: '方案一 · 仅 26 年已签首页', subtitle: '首页仅 2026 年 Tab，且已签约可办业务', defaultYear: 2026, signedYears: [2026], availableYears: [2026], showDeadlineTip: true }} onFeedback={onFeedback} onOpenBusiness={openBusiness} onClose={onClose} />
    {activeEntries.map((item) => <PhoneScene key={`${item.key}-${item.year}`} title={`方案一 · ${item.year} 年${entryLabel[item.key]}`} subtitle="点击入口后平铺展示"><SchemeOneBusinessPhone entryKey={item.key} year={item.year} onFeedback={onFeedback} onClose={onClose} /></PhoneScene>)}
  </div>;
}

function SchemePreview({ scheme, onFeedback, onClose }: { scheme: CrossYearScheme; onFeedback: Feedback; onClose: () => void }) {
  if (scheme.id === 'scheme1') return <SchemeOnePreview onFeedback={onFeedback} onClose={onClose} />;
  if (scheme.id === 'scheme2') return <SchemeTwoPhone onFeedback={onFeedback} onClose={onClose} />;
  if (scheme.id === 'scheme3') return <SchemeThreePhone onFeedback={onFeedback} onClose={onClose} />;
  return <SchemeFourPhone onFeedback={onFeedback} onClose={onClose} />;
}

function SchemeRow({ scheme, onFeedback, onClose }: { scheme: CrossYearScheme; onFeedback: Feedback; onClose: () => void }) {
  return <section className={`cross-scheme-row ${scheme.recommended ? 'is-recommended' : ''}`}><div className="scheme-summary"><div className="scheme-index">{scheme.id.replace('scheme', '0')}</div><div className="scheme-summary-heading"><span>{scheme.positioning}</span>{scheme.recommended ? <em>推荐</em> : null}</div><h2>{scheme.name}</h2><p>{scheme.suitableFor}</p><div className="scheme-meta"><div><span>优势</span><b>{scheme.positioning}</b></div><div><span>风险提示</span><b>{scheme.risk}</b></div></div></div><div className="scheme-preview"><div className="preview-caption"><span>小程序页面预览 · 页面平铺</span><small>370 × 844 / 页</small></div><SchemePreview scheme={scheme} onFeedback={onFeedback} onClose={onClose} /></div></section>;
}

export default function CrossYearInterestPage() {
  const navigate = useNavigate();
  const [api, contextHolder] = message.useMessage();
  const feedback = (text: string) => api.info(text);
  const close = () => navigate('/welcome');
  return <div className="cross-year-host">{contextHolder}<div className="cross-year-heading"><div><div className="cross-heading-kicker"><BankOutlined /> 银行宝签约 · 方案评审原型</div><h1>跨年财政贴息</h1><p>同一专区承载多个政策年度，四种小程序信息架构方案逐行对比。方案一下方保留冻结备份，便于改版对照与回退。</p></div><div className="cross-heading-note"><CalendarOutlined /><span>政策年度<br /><b>2027 / 2026</b></span></div></div><div className="cross-scheme-list">{crossYearSchemes.map((scheme) => <div key={scheme.id} className="cross-scheme-block">{scheme.id === 'scheme1' ? <><SchemeRow scheme={scheme} onFeedback={feedback} onClose={close} /><SchemeOneBackupRow onFeedback={feedback} onClose={close} /></> : <SchemeRow scheme={scheme} onFeedback={feedback} onClose={close} />}</div>)}</div></div>;
}
