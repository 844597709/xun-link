/**
 * 方案一冻结备份（迭代 15 定稿基线；迭代 22 起核定/贴息筛选对齐主方案一高级筛选）。
 * 非筛选类主方案一改版仍优先勿动本文件，除非产品明确要求同步。
 */
import { useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import {
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  CheckOutlined,
  ClockCircleOutlined,
  CloudUploadOutlined,
  FileImageOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { consumeApplications, crossYearBusinessEntries, crossYearYears, eligibleLoans, findCrossYearYear, interestAgreements, interestRecords } from '../../../mock';
import type { ConsumeInfo, ConsumeInterestApplication, InterestAgreement, InterestRecord, InterestType, Voucher } from '../../../types/consumeInterest';
import type { CrossYearBusinessEntry, CrossYearPolicyYearState } from '../../../types/crossYearInterest';
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
const interestTypeLabel: Record<InterestType, string> = { realtime: '实时贴息', subsidy: '补贴息', reclaim: '收回贴息' };
const schemeOneAgreements: YearAgreement[] = ([2027, 2026] as PolicyYear[]).map((year) => ({ ...interestAgreements[0], id: `scheme-one-agreement-${year}`, year, signedAt: `${year}-01-08 10:22:18`, effectiveDate: `${year}-01-08`, content: interestAgreements[0].content.map((text) => replaceYear(text, year)) }));
const schemeOneApplications: YearApplication[] = ([2027, 2026] as PolicyYear[]).flatMap((year) => consumeApplications.map((item) => ({ ...item, id: replaceYear(item.id, year), year, applyTime: replaceYear(item.applyTime, year), consumeDate: replaceYear(item.consumeDate, year), approvedAt: item.approvedAt ? replaceYear(item.approvedAt, year) : undefined, consumeDescription: `${year} 年${item.consumeDescription}`, consumeInfo: item.consumeInfo ? { ...item.consumeInfo, id: replaceYear(item.consumeInfo.id, year), consumeDate: replaceYear(item.consumeInfo.consumeDate, year) } : undefined, systemConsumes: item.systemConsumes?.map((consume) => ({ ...consume, id: replaceYear(consume.id, year), consumeDate: replaceYear(consume.consumeDate, year) })), vouchers: item.vouchers })));
const schemeOneRecords: YearRecord[] = ([2027, 2026] as PolicyYear[]).flatMap((year) => interestRecords.map((item) => ({ ...item, id: replaceYear(item.id, year), year, date: replaceYear(item.date, year), interestTime: replaceYear(item.interestTime, year) })));
const schemeOneTransactions: ConsumeInfo[] = schemeOneApplications.flatMap((item) => [item.consumeInfo, ...(item.systemConsumes ?? [])]).filter((item): item is ConsumeInfo => Boolean(item?.transactionNo));


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

function YearTabs({ selectedYear, onChange }: { selectedYear: PolicyYear; onChange: (year: PolicyYear) => void }) {
  return <div className="cross-year-tabs">{years.map((item) => <button type="button" key={item.year} className={selectedYear === item.year ? 'active' : ''} onClick={() => onChange(item.year as PolicyYear)}>{item.year} 年</button>)}</div>;
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
  const [selectedYear, setSelectedYear] = useState<PolicyYear>(config.defaultYear);
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const baseState = getSchemeOneState(selectedYear, config);
  const signed = agreementSigned && selectedYear === 2027 ? true : baseState.agreementStatus === '已生效';
  const state = signed ? { ...baseState, agreementStatus: '已生效' as const, agreementDate: `${selectedYear}-01-08`, canApply: true, todoCount: 1, statusRemark: '协议已生效，本年度可申请' } : baseState;
  const ended = config.endedYears?.includes(selectedYear) ?? false;
  const sign = () => { setAgreementSigned(true); setAgreementOpen(false); onFeedback('贴息协议签署成功'); };
  return <PhoneFrame title="财政贴息专区" className="scheme-one-reference" onClose={onClose}><PhoneScroll><YearTabs selectedYear={selectedYear} onChange={setSelectedYear} /><section className={`scheme-one-banner ${signed ? '' : 'scheme-one-banner-muted'}`}><div><span>财政贴息</span><b>适用客户可享受贴息服务</b></div><em>贴息时间 {state.validPeriod}</em></section><section className={`scheme-one-agreement home-agreement ${signed ? 'is-signed' : 'is-unsigned'}`}>{signed ? <><div className="scheme-one-agreement-main"><CheckCircleFilled /><div><strong>贴息协议已生效</strong><span>您可以开始申请消费贷款贴息</span></div></div><b className="scheme-one-signed-badge">已签约</b></> : <><div><strong>协议未签署</strong><span>{ended ? '当前年度贴息已结束，暂不支持申请。' : '当前年度未完成协议签署，暂不支持新增贴息业务。'}</span></div>{selectedYear === 2027 && !ended ? <button type="button" onClick={() => setAgreementOpen(true)}>去签署贴息协议 <RightOutlined /></button> : null}</>}</section>{config.showDeadlineTip ? <DeadlineTip /> : null}{signed ? <><div className="phone-section-label">业务服务</div><EntryGrid className="scheme-one-entry-grid" onEntry={(_text, entry) => onOpenBusiness(entry, selectedYear)} /></> : <section className="scheme-one-ended-card"><InfoCircleOutlined /><b>{ended ? '本年度贴息已结束' : '协议未签署，暂不可办理'}</b><p>{ended ? '当前年度无法办理新的贴息申请及查询业务，请关注最新政策年度。' : '完成贴息协议签署后才可办理相关业务。'}</p></section>}<div className="policy-tip"><InfoCircleOutlined /><span>{signed ? '贴息申请需提交真实有效的消费凭证，系统将根据政策和贷款状态进行核定。' : ended ? '历史年度不支持协议补签。' : '当前年度暂未开放贴息业务，请先完成协议签署。'}</span></div>{agreementOpen ? <SchemeOneAgreementSheet year={selectedYear} onSign={sign} onClose={() => setAgreementOpen(false)} /> : null}</PhoneScroll></PhoneFrame>;
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
  return <div className="scheme-one-apply-content"><div className="scheme-one-locked-year"><CalendarOutlined /><span>申请年度：<b>{year} 年</b></span><em>办理年度已锁定</em></div><div className="scheme-one-apply-heading-label">{year} 年自主申请</div><section className="scheme-one-form-card"><h3>消费信息</h3><label>消费账户 <b className="scheme-one-required">*</b><select value={form.account} onChange={(event) => update('account', event.target.value)}><option value="">请选择消费账户</option><option>招商银行（尾号 6688）</option><option>中国银行（尾号 1122）</option></select></label><label>消费日期 <b className="scheme-one-required">*</b><input type="date" value={form.consumeDate} onChange={(event) => update('consumeDate', event.target.value)} /></label><label>交易流水号 <b className="scheme-one-required">*</b><button type="button" className="scheme-one-field" onClick={() => onFeedback('请选择对应年度消费交易流水')}>{form.transactionNo || '请选择交易流水号'}<RightOutlined /></button></label><label>消费用途 <b className="scheme-one-required">*</b><select value={form.purpose} onChange={(event) => update('purpose', event.target.value)}><option value="">请选择消费用途</option><option>家用电器</option><option>家装消费</option><option>教育培训</option><option>家具消费</option><option>其他日常消费</option></select></label><label>关联贷款 <b className="scheme-one-required">*</b><button type="button" className="scheme-one-field" onClick={() => onFeedback('请选择符合条件的关联贷款')}>请选择关联贷款 <RightOutlined /></button></label><label>消费描述 <span className="scheme-one-optional">选填</span><textarea rows={3} value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="请描述消费用途" /></label></section><section className="scheme-one-form-card"><h3>消费凭证</h3><div className="scheme-one-upload-block"><div className="scheme-one-upload-heading">发票 <b className="scheme-one-required">*</b><small>支持 jpg/png，最多 1 张</small></div><div className="scheme-one-upload-list"><label className="scheme-one-upload-trigger"><CloudUploadOutlined /><span>点击上传</span><input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={(event) => addFiles(event, 'invoice')} disabled={invoice.length >= 1} /></label>{invoice.map((item) => <div className="scheme-one-voucher-chip" key={item.id}><FileImageOutlined /><span>{item.fileName}</span></div>)}</div></div><div className="scheme-one-upload-block"><div className="scheme-one-upload-heading">消费凭证 <b className="scheme-one-required">*</b><small>如购物小票、消费合同，最多 6 张</small></div><div className="scheme-one-upload-list"><label className="scheme-one-upload-trigger"><CloudUploadOutlined /><span>点击上传</span><input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" multiple onChange={(event) => addFiles(event, 'proof')} disabled={proofs.length >= 6} /></label>{proofs.map((item) => <div className="scheme-one-voucher-chip" key={item.id}><FileImageOutlined /><span>{item.fileName}</span></div>)}</div></div></section><button type="button" className="scheme-one-submit" onClick={() => onFeedback(`${year} 年申请信息已提交`)}>提交申请</button></div>;
}

function SchemeOneAgreementPage({ defaultYear, fixedYear, onFeedback }: { defaultYear: PolicyYear; fixedYear?: PolicyYear; onFeedback: Feedback }) {
  const [yearFilter, setYearFilter] = useState<YearFilter>(fixedYear ?? defaultYear);
  const [previewYear, setPreviewYear] = useState<PolicyYear>();
  const agreements = schemeOneAgreements.filter((item) => (fixedYear ?? yearFilter) === 'all' || item.year === (fixedYear ?? yearFilter));
  return <div className="scheme-one-record-content"><div className="scheme-one-page-intro"><div><b>我的协议</b><span>查看各政策年度签署的贴息服务协议</span></div>{fixedYear ? <span className="fixed-year-label">当前年度：{fixedYear} 年</span> : <SchemeOneYearFilter value={yearFilter} onChange={setYearFilter} />}</div>{agreements.map((agreement) => <article className="scheme-one-agreement-card" key={agreement.id}><span className="scheme-one-effective-tag">{agreement.status === 'effective' ? '生效' : '已失效'}</span><h3>{agreement.title}</h3><p>{agreement.summary}</p><div className="scheme-one-agreement-meta"><span>协议年度</span><b>{agreement.year} 年</b><span>签署时间</span><b>{agreement.signedAt ?? '待签署'}</b><span>生效日期</span><b>{agreement.effectiveDate ?? '—'}</b></div><div className="scheme-one-card-actions"><button type="button" onClick={() => onFeedback(`${agreement.year} 年合同下载为 Mock 反馈`)}>下载合同</button><button type="button" onClick={() => setPreviewYear(agreement.year)}>预览合同</button></div></article>)}{!agreements.length ? <div className="scheme-one-empty">暂无协议</div> : null}{previewYear ? <SchemeOneAgreementSheet year={previewYear} onSign={() => { onFeedback(`${previewYear} 年协议预览`); setPreviewYear(undefined); }} onClose={() => setPreviewYear(undefined)} /> : null}</div>;
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

function SchemeOneVerifyPage({ defaultYear, fixedYear, onFeedback }: { defaultYear: PolicyYear; fixedYear?: PolicyYear; onFeedback: Feedback }) {
  const [yearFilter, setYearFilter] = useState<YearFilter>(fixedYear ?? defaultYear);
  const [tab, setTab] = useState<VerifyTab>('all');
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
      if (channel !== 'all' && item.source !== channel) return false;
      return isWithinVerifyTime(item.applyTime, quickRange, customFrom, customTo, dates);
    });
  }, [channel, customFrom, customTo, quickRange, tab, yearFilter, fixedYear]);
  const activeFilterCount = (quickRange !== 'all' ? 1 : 0) + (channel !== 'all' ? 1 : 0) + ((customFrom || customTo) && quickRange === 'custom' ? 1 : 0);
  const filterSummary = (() => {
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
  return <div className="scheme-one-record-content">
    <div className="scheme-one-filter-row">{fixedYear ? <span className="fixed-year-label">当前年度：{fixedYear} 年</span> : <SchemeOneYearFilter value={yearFilter} onChange={setYearFilter} />}<button type="button" className={`scheme-one-advanced-filter-trigger${filterOpen || activeFilterCount ? ' is-active' : ''}`} aria-expanded={filterOpen} aria-label="高级筛选" onClick={() => setFilterOpen((open) => !open)}><span>高级筛选</span>{activeFilterCount ? <em>{activeFilterCount}</em> : null}<small>{filterOpen ? '收起' : '展开'}</small></button></div>
    {filterOpen ? <section className="scheme-one-advanced-filter-panel" aria-label="核定记录高级筛选面板">
      <div className="scheme-one-advanced-filter-block"><div className="scheme-one-advanced-filter-label">快捷时间</div><div className="scheme-one-advanced-filter-chips" role="group" aria-label="快捷时间筛选">{quickOptions.map((item) => <button type="button" key={item.key} className={quickRange === item.key ? 'active' : ''} onClick={() => setQuickRange(item.key)}>{item.label}</button>)}</div></div>
      <div className="scheme-one-advanced-filter-block"><div className="scheme-one-advanced-filter-label">自定义时间段</div><div className="scheme-one-advanced-filter-dates"><label><span>开始日期</span><input aria-label="自定义开始日期" type="date" value={customFrom} onChange={(event) => { setCustomFrom(event.target.value); setQuickRange('custom'); }} /></label><span className="scheme-one-advanced-filter-sep">至</span><label><span>结束日期</span><input aria-label="自定义结束日期" type="date" value={customTo} onChange={(event) => { setCustomTo(event.target.value); setQuickRange('custom'); }} /></label></div></div>
      <div className="scheme-one-advanced-filter-block"><div className="scheme-one-advanced-filter-label">申请渠道</div><div className="scheme-one-advanced-filter-chips" role="group" aria-label="申请渠道筛选">{channelOptions.map((item) => <button type="button" key={item.key} className={channel === item.key ? 'active' : ''} onClick={() => setChannel(item.key)}>{item.label}</button>)}</div></div>
      <div className="scheme-one-advanced-filter-actions"><span className="scheme-one-advanced-filter-summary">{filterSummary}</span><button type="button" className="scheme-one-advanced-filter-reset" onClick={resetAdvanced}>重置</button></div>
    </section> : null}
    <div className="scheme-one-verify-tabs">{tabs.map((item) => <button type="button" key={item.key} className={tab === item.key ? 'active' : ''} onClick={() => setTab(item.key)}>{item.label}</button>)}</div>
    {list.map((item) => <SchemeOneApplicationCard application={item} key={item.id} onDetail={() => setDetail(item)} onFeedback={onFeedback} />)}
    {!list.length ? <div className="scheme-one-empty">暂无核定记录</div> : null}
  </div>;
}

function SchemeOneRecordsPage({ defaultYear, fixedYear }: { defaultYear: PolicyYear; fixedYear?: PolicyYear }) {
  const [yearFilter, setYearFilter] = useState<YearFilter>(fixedYear ?? defaultYear);
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
      if (interestType !== 'all' && item.interestType !== interestType) return false;
      return isWithinVerifyTime(item.date, quickRange, customFrom, customTo, dates);
    });
  }, [customFrom, customTo, interestType, quickRange, yearFilter, fixedYear]);
  const total = list.reduce((sum, item) => sum + item.amount, 0);
  const activeFilterCount = (quickRange !== 'all' ? 1 : 0) + (interestType !== 'all' ? 1 : 0) + ((customFrom || customTo) && quickRange === 'custom' ? 1 : 0);
  const filterSummary = (() => {
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
  return <div className="scheme-one-record-content">
    <div className="scheme-one-filter-row">{fixedYear ? <span className="fixed-year-label">当前年度：{fixedYear} 年</span> : <SchemeOneYearFilter value={yearFilter} onChange={setYearFilter} />}<button type="button" className={`scheme-one-advanced-filter-trigger${filterOpen || activeFilterCount ? ' is-active' : ''}`} aria-expanded={filterOpen} aria-label="高级筛选" onClick={() => setFilterOpen((open) => !open)}><span>高级筛选</span>{activeFilterCount ? <em>{activeFilterCount}</em> : null}<small>{filterOpen ? '收起' : '展开'}</small></button></div>
    {filterOpen ? <section className="scheme-one-advanced-filter-panel" aria-label="贴息记录高级筛选面板">
      <div className="scheme-one-advanced-filter-block"><div className="scheme-one-advanced-filter-label">快捷时间</div><div className="scheme-one-advanced-filter-chips" role="group" aria-label="快捷时间筛选">{quickOptions.map((item) => <button type="button" key={item.key} className={quickRange === item.key ? 'active' : ''} onClick={() => setQuickRange(item.key)}>{item.label}</button>)}</div></div>
      <div className="scheme-one-advanced-filter-block"><div className="scheme-one-advanced-filter-label">自定义时间段</div><div className="scheme-one-advanced-filter-dates"><label><span>开始日期</span><input aria-label="自定义开始日期" type="date" value={customFrom} onChange={(event) => { setCustomFrom(event.target.value); setQuickRange('custom'); }} /></label><span className="scheme-one-advanced-filter-sep">至</span><label><span>结束日期</span><input aria-label="自定义结束日期" type="date" value={customTo} onChange={(event) => { setCustomTo(event.target.value); setQuickRange('custom'); }} /></label></div></div>
      <div className="scheme-one-advanced-filter-block"><div className="scheme-one-advanced-filter-label">贴息类型</div><div className="scheme-one-advanced-filter-chips" role="group" aria-label="贴息类型筛选">{typeOptions.map((item) => <button type="button" key={item.key} className={interestType === item.key ? 'active' : ''} onClick={() => setInterestType(item.key)}>{item.label}</button>)}</div></div>
      <div className="scheme-one-advanced-filter-actions"><span className="scheme-one-advanced-filter-summary">{filterSummary}</span><button type="button" className="scheme-one-advanced-filter-reset" onClick={resetAdvanced}>重置</button></div>
    </section> : null}
    <section className="scheme-one-records-summary"><div><span>累计贴息金额</span><strong>¥{money(total)}</strong></div><div><span>累计笔数</span><strong>{list.length}<small>笔</small></strong></div></section>
    {list.map((item) => <article className="scheme-one-interest-record" key={item.id}><div><strong>{item.date}</strong><span>{item.loanNo}</span><em className="scheme-one-interest-type">{interestTypeLabel[item.interestType]}</em><small>贴息卡号 {item.cardNo} · 贴息时间 {item.interestTime}</small></div><b>¥{money(item.amount)}</b></article>)}
    {!list.length ? <div className="scheme-one-empty">暂无贴息记录</div> : null}
  </div>;
}

function ReferenceBusinessPhone({ entryKey, year, fixedYear, referenceClass, businessClass, onFeedback, onClose }: { entryKey: CrossYearBusinessEntry['key']; year: PolicyYear; fixedYear?: PolicyYear; referenceClass: string; businessClass: string; onFeedback: Feedback; onClose: () => void }) {
  const className = `${referenceClass} scheme-one-reference scheme-one-business-page ${businessClass}`;
  const agreementTip = fixedYear
    ? `协议按政策年度独立维护，当前仅可查看 ${fixedYear} 年协议。`
    : '协议按政策年度独立维护，可查看全部年份协议。';
  const verifyTip = fixedYear
    ? `核定状态、消费信息与凭证信息仅可查看 ${fixedYear} 年数据。`
    : '支持高级筛选：快捷时间、自定义日期与申请渠道，结果按年度独立查询。';
  const recordTip = fixedYear
    ? `贴息金额按记录明细统计，当前仅可查看 ${fixedYear} 年贴息记录。`
    : '支持高级筛选：快捷时间、自定义日期与贴息类型，结果按年度独立统计。';
  if (entryKey === 'apply') return <PhoneFrame className={className} title="自主申请" onClose={onClose}><PhoneScroll><SchemeOneApplyPage year={year} onFeedback={onFeedback} /><div className="policy-tip"><InfoCircleOutlined /><span>申请年度一经确定不可跨年度提交，所有消费凭证需真实有效。</span></div></PhoneScroll></PhoneFrame>;
  if (entryKey === 'agreement') return <PhoneFrame className={className} title="我的协议" onClose={onClose}><PhoneScroll><SchemeOneAgreementPage defaultYear={year} fixedYear={fixedYear} onFeedback={onFeedback} /><div className="policy-tip"><InfoCircleOutlined /><span>{agreementTip}</span></div></PhoneScroll></PhoneFrame>;
  if (entryKey === 'verify') return <PhoneFrame className={className} title="核定记录" onClose={onClose}><PhoneScroll><SchemeOneVerifyPage defaultYear={year} fixedYear={fixedYear} onFeedback={onFeedback} /><div className="policy-tip"><InfoCircleOutlined /><span>{verifyTip}</span></div></PhoneScroll></PhoneFrame>;
  return <PhoneFrame className={className} title="贴息记录" onClose={onClose}><PhoneScroll><SchemeOneRecordsPage defaultYear={year} fixedYear={fixedYear} /><div className="policy-tip"><InfoCircleOutlined /><span>{recordTip}</span></div></PhoneScroll></PhoneFrame>;
}

function SchemeOneBusinessPhone({ entryKey, year, onFeedback, onClose }: { entryKey: CrossYearBusinessEntry['key']; year: PolicyYear; onFeedback: Feedback; onClose: () => void }) {
  return <ReferenceBusinessPhone entryKey={entryKey} year={year} referenceClass="scheme-one-reference" businessClass="scheme-one-business-page" onFeedback={onFeedback} onClose={onClose} />;
}

function SchemeOneScenarioPreview({ config, onFeedback, onOpenBusiness, onClose }: { config: SchemeOneScenarioConfig; onFeedback: Feedback; onOpenBusiness: (entry: CrossYearBusinessEntry, year: PolicyYear) => void; onClose: () => void }) {
  return <PhoneScene title={config.title} subtitle={config.subtitle}><SchemeOneScenarioPhone config={config} onFeedback={onFeedback} onOpenBusiness={onOpenBusiness} onClose={onClose} /></PhoneScene>;
}


export function SchemeOneBackupPreview({ onFeedback, onClose }: { onFeedback: Feedback; onClose: () => void }) {
  const [activeEntries, setActiveEntries] = useState<Array<{ key: CrossYearBusinessEntry['key']; year: PolicyYear }>>([]);
  const openBusiness = (entry: CrossYearBusinessEntry, year: PolicyYear) => {
    setActiveEntries((items) => items.some((item) => item.key === entry.key && item.year === year) ? items : [...items, { key: entry.key, year }]);
  };
  const entryLabel: Record<CrossYearBusinessEntry['key'], string> = { apply: '自主申请', agreement: '我的协议', verify: '核定记录', record: '贴息记录' };
  return (
    <div className="scheme-phone-list scheme-one-phone-list scheme-one-backup-phone-list" data-testid="scheme-one-backup-list">
      <SchemeOneScenarioPreview config={{ title: '方案一备份 · 未签协议首页', subtitle: '冻结基线 · 27 年未签协议场景', defaultYear: 2027, signedYears: [], endedYears: [2026] }} onFeedback={onFeedback} onOpenBusiness={openBusiness} onClose={onClose} />
      <SchemeOneScenarioPreview config={{ title: '方案一备份 · 已签协议首页', subtitle: '冻结基线 · 现有年度协议状态', defaultYear: 2027, signedYears: [2027], endedYears: [2026] }} onFeedback={onFeedback} onOpenBusiness={openBusiness} onClose={onClose} />
      <SchemeOneScenarioPreview config={{ title: '方案一备份 · 跨年度切换首页', subtitle: '冻结基线 · 27 年未签 / 26 年已签场景', defaultYear: 2027, signedYears: [2026], showDeadlineTip: true }} onFeedback={onFeedback} onOpenBusiness={openBusiness} onClose={onClose} />
      {activeEntries.map((item) => (
        <PhoneScene key={`${item.key}-${item.year}`} title={`方案一备份 · ${item.year} 年${entryLabel[item.key]}`} subtitle="冻结基线 · 点击入口后平铺展示">
          <SchemeOneBusinessPhone entryKey={item.key} year={item.year} onFeedback={onFeedback} onClose={onClose} />
        </PhoneScene>
      ))}
    </div>
  );
}

export function SchemeOneBackupRow({ onFeedback, onClose }: { onFeedback: Feedback; onClose: () => void }) {
  return (
    <section className="cross-scheme-row scheme-one-backup-row" data-testid="scheme-one-backup-row">
      <div className="scheme-summary">
        <div className="scheme-index">01B</div>
        <div className="scheme-summary-heading"><span>冻结备份</span><em>迭代 15 基线</em></div>
        <h2>方案一备份</h2>
        <p>当前方案一定稿快照，位于方案一下方供对比与回退参照。修改上方方案一时不会改动本备份。</p>
        <div className="scheme-meta">
          <div><span>用途</span><b>修改方案一前的对照与恢复基准</b></div>
          <div><span>说明</span><b>独立状态与独立源码副本，勿与主方案一混淆</b></div>
        </div>
      </div>
      <div className="scheme-preview">
        <div className="preview-caption"><span>小程序页面预览 · 冻结基线</span><small>勿直接改本副本</small></div>
        <SchemeOneBackupPreview onFeedback={onFeedback} onClose={onClose} />
      </div>
    </section>
  );
}
