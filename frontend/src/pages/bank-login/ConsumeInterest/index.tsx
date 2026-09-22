import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { Button, Empty, Popconfirm, Spin, message } from 'antd';
import {
  AppstoreOutlined,
  BankOutlined,
  CheckCircleFilled,
  CheckOutlined,
  CloseOutlined,
  CloudUploadOutlined,
  CustomerServiceOutlined,
  FileImageOutlined,
  FileTextOutlined,
  LeftOutlined,
  MoreOutlined,
  QuestionCircleOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  ShopOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  cancelConsumeInterestApplication,
  getConsumeInterestClientData,
  signInterestAgreement,
  submitConsumeInterestApplication,
} from '../../../mock';
import type {
  ApplicationStatus,
  ConsumeInfo,
  ConsumeInterestApplication,
  ConsumeInterestClientData,
  EligibleLoan,
  InterestAgreement,
  InterestRecord,
  Voucher,
} from '../../../types/consumeInterest';
import './index.css';

type Panel = 'profile' | 'homeUnsigned' | 'homeSigned' | 'homeNoLoan' | 'apply' | 'agreements' | 'verifies' | 'verifyDetail' | 'records';
type Overlay = 'agreement' | 'transaction' | 'loans' | 'loanMore' | 'consumeDetail' | 'voucher' | 'more' | null;
type VerifyTab = 'all' | ApplicationStatus;
type DateRange = 'all' | '30' | '90';

type FormState = { account: string; consumeDate: string; transactionNo: string; purpose: string; description: string };
type HomeScenario = 'unsigned' | 'signed' | 'noEligibleLoan';

const money = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const statusLabel: Record<ApplicationStatus, string> = { passed: '已通过', reviewing: '审核中', rejected: '已拒绝', cancelled: '已撤销' };
const statusClass: Record<ApplicationStatus, string> = { passed: 'status-success', reviewing: 'status-reviewing', rejected: 'status-rejected', cancelled: 'status-cancelled' };
const defaultForm: FormState = { account: '', consumeDate: '', transactionNo: '', purpose: '', description: '' };

function MobileHeader({ title, onBack, onClose, onMore }: { title: string; onBack: () => void; onClose: () => void; onMore: () => void }) {
  return <header className="interest-header"><button className="interest-back" type="button" onClick={onBack}><LeftOutlined /> 返回</button><strong>{title}</strong><div className="interest-header-actions"><button type="button" aria-label="更多" onClick={onMore}><MoreOutlined /></button><button type="button" aria-label="关闭" onClick={onClose}><CloseOutlined /></button></div></header>;
}

function PhonePreview({ title, focused, children, onBack, onClose, onMore }: { title: string; focused: boolean; children: ReactNode; onBack: () => void; onClose: () => void; onMore: () => void }) {
  return <section className={`interest-phone ${focused ? 'is-focused' : ''}`}><MobileHeader title={title} onBack={onBack} onClose={onClose} onMore={onMore} />{children}</section>;
}

function SectionCard({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`interest-card ${className}`}><div className="interest-card-title"><h2>{title}</h2>{action}</div>{children}</section>;
}

function Sheet({ title, children, onClose, className = '', inline = false }: { title: string; children: ReactNode; onClose: () => void; className?: string; inline?: boolean }) {
  return <div className={`interest-sheet-mask ${inline ? 'interest-sheet-mask-inline' : ''}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={`interest-sheet ${className}`} role="dialog" aria-modal="true"><div className="sheet-handle" /><div className="sheet-title"><h2>{title}</h2><button type="button" onClick={onClose} aria-label="关闭"><CloseOutlined /></button></div><div className="sheet-content">{children}</div></section></div>;
}

function StatusTag({ status }: { status: ApplicationStatus }) { return <span className={`interest-status ${statusClass[status]}`}>{statusLabel[status]}</span>; }
function Amount({ value }: { value: number }) { return <span className="interest-amount">¥{money(value)}</span>; }

function ProfilePanel({ data, onInterest }: { data: ConsumeInterestClientData; onInterest: () => void }) {
  const shortcuts = [{ icon: <WalletOutlined />, label: '借还记录' }, { icon: <BankOutlined />, label: '我的账户' }, { icon: <ShopOutlined />, label: '我的礼券' }, { icon: <AppstoreOutlined />, label: '活动专区' }, { icon: <ShopOutlined />, label: '特惠商城' }, { icon: <AppstoreOutlined />, label: '积分商城' }];
  const services = [{ icon: <SearchOutlined />, label: '借款计算器' }, { icon: <WalletOutlined />, label: '额度中心' }, { icon: <FileTextOutlined />, label: '我的消息' }, { icon: <CheckCircleFilled />, label: '待办事项' }, { icon: <CustomerServiceOutlined />, label: '专属客户经理' }, { icon: <SafetyCertificateOutlined />, label: '财政贴息专区', special: true }, { icon: <CustomerServiceOutlined />, label: '专属客服' }, { icon: <QuestionCircleOutlined />, label: '帮助中心' }];
  return <div className="interest-scroll"><div className="customer-hero"><div className="customer-avatar">{data.customer.avatarText}</div><div><b>{data.customer.nickname}</b><span>{data.customer.mobile}</span></div><RightOutlined /></div><SectionCard title="常用功能" className="shortcut-card"><div className="shortcut-grid">{shortcuts.map((item, index) => <button type="button" key={`${item.label}-${index}`} onClick={() => message.info(`${item.label}为原型入口`)}><i>{item.icon}</i><span>{item.label}</span></button>)}</div></SectionCard><SectionCard title="更多服务" className="service-card"><div className="service-list">{services.map((item) => <button type="button" className={item.special ? 'service-special' : ''} key={item.label} onClick={item.special ? onInterest : () => message.info(`${item.label}为原型入口`)}><i>{item.icon}</i><span>{item.label}</span>{item.special ? <em>入口</em> : null}<RightOutlined /></button>)}</div></SectionCard><SectionCard title="账户与设置" className="service-card"><div className="service-list">{['账户安全', '银行卡管理', '我的合同', '设置'].map((item) => <button type="button" key={item} onClick={() => message.info(`${item}为原型入口`)}><i><SafetyCertificateOutlined /></i><span>{item}</span><RightOutlined /></button>)}</div></SectionCard><div className="bottom-nav"><button type="button" onClick={() => message.info('借款首页为原型入口')}><WalletOutlined /><span>借款</span></button><button type="button" onClick={() => message.info('还款首页为原型入口')}><BankOutlined /><span>还款</span></button><button type="button" className="active"><CustomerServiceOutlined /><span>个人中心</span></button></div></div>;
}

const homeFeatures = [{ key: 'apply', label: '自主申请', icon: <FileTextOutlined />, color: 'blue' }, { key: 'agreements', label: '我的协议', icon: <SafetyCertificateOutlined />, color: 'green' }, { key: 'verifies', label: '核对记录', icon: <CheckCircleFilled />, color: 'orange' }, { key: 'records', label: '贴息记录', icon: <WalletOutlined />, color: 'purple' }] as const;

function HomePanel({ data, scenario, onSign, onOpen }: { data: ConsumeInterestClientData; scenario: HomeScenario; onSign: () => void; onOpen: (panel: Panel) => void }) {
  const noLoan = scenario === 'noEligibleLoan';
  const signed = scenario === 'signed';
  return <div className="interest-scroll"><div className="interest-banner"><div><span>财政贴息</span><b>适用客户可享受贴息服务</b></div><div className="period-pill">贴息时间 {data.home.interestPeriod.start} - {data.home.interestPeriod.end}</div></div>{noLoan ? <div className="empty-eligibility"><div className="empty-search"><SearchOutlined /></div><h2>暂无符合条件的贴息贷款</h2><p>经查询，您在我行暂无符合财政贴息政策的贷款，点击下方按钮可办理新贷款。</p><button type="button" className="primary-action" onClick={() => message.info('去申请贷款为原型入口')}>去申请</button></div> : <><div className="home-agreement">{signed ? <><div className="signed-banner"><CheckCircleFilled /><div><strong>贴息协议已生效</strong><span>您可以开始申请消费贷款贴息</span></div></div><span className="signed-badge">已签约</span></> : <><div><strong>签署协议，开启贴息服务</strong><span>完成协议签署后，即可申请消费贷款贴息</span></div><button type="button" onClick={onSign}>去签署贴息协议 <RightOutlined /></button></>}</div><div className="feature-grid">{homeFeatures.map((item) => <button type="button" key={item.key} className={`feature-item feature-${item.color}`} onClick={() => onOpen(item.key)}><i>{item.icon}</i><b>{item.label}</b>{item.key === 'agreements' && signed ? <em>已签约</em> : null}<RightOutlined /></button>)}</div><SectionCard title="温馨提示" className="warm-tips"><p>贴息申请需提交真实有效的消费凭证，系统将根据政策和贷款状态进行核定。</p><button type="button" onClick={() => message.info('常见问题为原型入口')}>常见问题 <RightOutlined /></button></SectionCard></>}</div>;
}

function ApplyPanel({ data, form, setForm, selectedLoans, transactions, onOpenTransactions, onOpenLoans, vouchers, onFiles, onSubmit, submitting }: { data: ConsumeInterestClientData; form: FormState; setForm: (next: FormState) => void; selectedLoans: string[]; transactions: ConsumeInfo[]; onOpenTransactions: () => void; onOpenLoans: () => void; vouchers: Voucher[]; onFiles: (event: ChangeEvent<HTMLInputElement>, type: 'invoice' | 'proof') => void; onSubmit: () => void; submitting: boolean }) {
  const update = (key: keyof FormState, value: string) => setForm({ ...form, [key]: value });
  const invoice = vouchers.filter((item) => item.type === 'invoice');
  const proofs = vouchers.filter((item) => item.type === 'proof');
  const transactionLabel = form.transactionNo || (transactions.length ? '请选择交易流水号' : '暂无可选交易流水');
  return <div className="interest-scroll apply-scroll"><SectionCard title="消费信息"><label>消费账户 <b className="required">*</b><select value={form.account} onChange={(event) => update('account', event.target.value)}><option value="">请选择消费账户</option><option>招商银行（尾号 6688）</option><option>中国银行（尾号 1122）</option></select></label><label>消费日期 <b className="required">*</b><input type="date" value={form.consumeDate} onChange={(event) => update('consumeDate', event.target.value)} /></label>{data.config.showTransactionNo ? <label>交易流水号 <b className="required">*</b><button type="button" className="transaction-select-field" onClick={onOpenTransactions}>{transactionLabel}<RightOutlined /></button></label> : null}<label>消费用途 <b className="required">*</b><select value={form.purpose} onChange={(event) => update('purpose', event.target.value)}><option value="">请选择消费用途</option><option>家用电器</option><option>家装消费</option><option>教育培训</option><option>家具消费</option><option>其他日常消费</option></select></label><label>关联贷款 <b className="required">*</b><button type="button" className="loan-select-field" onClick={onOpenLoans}>{selectedLoans.length ? `已选择 ${selectedLoans.length} 笔贷款` : '请选择关联贷款'} <RightOutlined /></button>{selectedLoans.length ? <div className="selected-loans">{selectedLoans.map((id) => data.loans.find((item) => item.id === id)?.loanNo).filter(Boolean).join('、')}</div> : null}</label><label>消费描述 <span className="optional">选填</span><textarea rows={3} placeholder="请描述消费用途" value={form.description} onChange={(event) => update('description', event.target.value)} /></label></SectionCard><SectionCard title="消费凭证"><div className="upload-block"><div className="upload-heading">发票 <b className="required">*</b><small>支持 jpg/png，最多 1 张</small></div><VoucherUpload type="invoice" items={invoice} max={1} onFiles={onFiles} /></div><div className="upload-block"><div className="upload-heading">消费凭证 <b className="required">*</b><small>如购物小票、消费合同，最多 {data.config.maxProofCount} 张</small></div><VoucherUpload type="proof" items={proofs} max={data.config.maxProofCount} onFiles={onFiles} /></div></SectionCard><button type="button" className="primary-action submit-action" onClick={onSubmit} disabled={submitting}>{submitting ? '提交中...' : '提交申请'}</button></div>;
}

function VoucherUpload({ type, items, max, onFiles }: { type: 'invoice' | 'proof'; items: Voucher[]; max: number; onFiles: (event: ChangeEvent<HTMLInputElement>, type: 'invoice' | 'proof') => void }) {
  return <div className="voucher-upload"><label className="upload-trigger"><CloudUploadOutlined /><span>点击上传</span><input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" multiple={type === 'proof'} onChange={(event) => onFiles(event, type)} disabled={items.length >= max} /></label>{items.map((item) => <div className="voucher-chip" key={item.id}><FileImageOutlined /><span>{item.fileName}</span></div>)}</div>;
}

function AgreementPanel({ agreements, onPreview, onDownload }: { agreements: InterestAgreement[]; onPreview: (agreement: InterestAgreement) => void; onDownload: () => void }) {
  return <div className="interest-scroll">{agreements.length ? agreements.map((item) => <SectionCard title={item.title} key={item.id} className="agreement-card"><span className="effective-tag">{item.status === 'effective' ? '生效' : '已失效'}</span><p>{item.summary}</p><div className="agreement-meta">签署时间：{item.signedAt ?? '待签署'}</div><div className="card-actions"><button type="button" onClick={onDownload}>下载合同</button><button type="button" onClick={() => onPreview(item)}>预览合同</button></div></SectionCard>) : <Empty description="暂无协议" />}</div>;
}

function VerifyPanel({ applications, tab, setTab, range, setRange, onDetail, onCancel, onReapply }: { applications: ConsumeInterestApplication[]; tab: VerifyTab; setTab: (tab: VerifyTab) => void; range: DateRange; setRange: (range: DateRange) => void; onDetail: (application: ConsumeInterestApplication) => void; onCancel: (application: ConsumeInterestApplication) => void; onReapply: () => void }) {
  const tabs: Array<{ key: VerifyTab; label: string }> = [{ key: 'all', label: '全部' }, { key: 'passed', label: '已通过' }, { key: 'reviewing', label: '审核中' }, { key: 'rejected', label: '已拒绝' }, { key: 'cancelled', label: '已撤销' }];
  const list = useMemo(() => applications.filter((item) => tab === 'all' || item.status === tab).filter((item) => range === 'all' || Date.now() - new Date(item.applyTime).getTime() <= Number(range) * 86400000), [applications, range, tab]);
  return <div className="interest-scroll"><div className="verify-tabs">{tabs.map((item) => <button type="button" key={item.key} className={tab === item.key ? 'active' : ''} onClick={() => setTab(item.key)}>{item.label}</button>)}</div><div className="list-filter"><span>按时间筛选</span><select value={range} onChange={(event) => setRange(event.target.value as DateRange)}><option value="all">全部时间</option><option value="30">近30天</option><option value="90">近90天</option></select></div>{list.length ? list.map((item) => <ApplicationCard application={item} key={item.id} onDetail={onDetail} onCancel={onCancel} onReapply={onReapply} />) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无核对记录" />}</div>;
}

function ApplicationCard({ application, onDetail, onCancel, onReapply }: { application: ConsumeInterestApplication; onDetail: (application: ConsumeInterestApplication) => void; onCancel: (application: ConsumeInterestApplication) => void; onReapply: () => void }) {
  return <article className="interest-application-card"><div className="application-heading"><strong>申请贴息 <Amount value={application.interestAmount} /></strong><StatusTag status={application.status} /></div><div className="application-info"><div><span>申请时间</span><b>{application.applyTime}</b></div><div><span>核定来源</span><b>{application.source === 'system' ? '系统核定' : '客户自主申请'}</b></div><div><span>消费日期</span><b>{application.consumeDate}</b></div><div><span>核定日期</span><b>{application.approvedAt ?? '审核中'}</b></div></div><p className={`application-remark ${statusClass[application.status]}`}>{application.statusRemark}</p><div className="application-actions">{application.status === 'rejected' ? <button type="button" onClick={onReapply}>重新申请</button> : null}{application.status === 'reviewing' ? <Popconfirm title="确定取消申请吗？" onConfirm={() => onCancel(application)}><button type="button">取消申请</button></Popconfirm> : null}<button type="button" className="detail-button" onClick={() => onDetail(application)}>详情 <RightOutlined /></button></div></article>;
}

function DetailPanel({ application, data, onLoans, onConsume, onVoucher }: { application?: ConsumeInterestApplication; data: ConsumeInterestClientData; onLoans: () => void; onConsume: (consume: ConsumeInfo) => void; onVoucher: (voucher: Voucher) => void }) {
  if (!application) return <div className="interest-scroll"><Empty description="请选择核对记录" /></div>;
  const loans = application.loanIds.map((id) => data.loans.find((item) => item.id === id)).filter(Boolean) as EligibleLoan[];
  return <div className="interest-scroll"><SectionCard title="申请信息"><div className="detail-grid"><span>申请时间</span><b>{application.applyTime}</b><span>核定来源</span><b>{application.source === 'system' ? '系统核定' : '客户自主申请'}</b><span>核定状态</span><b><StatusTag status={application.status} /></b><span>状态备注</span><b>{application.statusRemark}</b><span>消费日期</span><b>{application.consumeDate}</b><span>剩余可贴本金</span><b><Amount value={application.remainingSubsidyPrincipal} /></b></div><div className="loan-summary-row"><span>关联贷款</span><div>{loans.slice(0, 3).map((item) => <span key={item.id}>{item.loanNo}</span>)}{loans.length > 3 ? <button type="button" onClick={onLoans}>查看全部</button> : null}</div></div><p className="description-text">{application.consumeDescription}</p></SectionCard>{application.source === 'system' ? <SectionCard title="消费信息">{application.systemConsumes?.map((consume) => <button type="button" className="system-consume-card" key={consume.id} onClick={() => onConsume(consume)}><span>{consume.consumeDate}</span><strong><Amount value={consume.amount} /></strong><small>{consume.purpose} · 贴息 {money(consume.interestAmount)} 元</small><RightOutlined /></button>)}</SectionCard> : <><SectionCard title="消费信息">{application.consumeInfo ? <button type="button" className="consume-info-entry" onClick={() => onConsume(application.consumeInfo as ConsumeInfo)}><ConsumeInfoRows consume={application.consumeInfo} /><RightOutlined /></button> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无消费信息" />}</SectionCard><SectionCard title="凭证信息"><div className="voucher-list">{application.vouchers.length ? application.vouchers.map((voucher) => <button type="button" key={voucher.id} onClick={() => onVoucher(voucher)}><img src={voucher.imageUrl} alt={voucher.fileName} /><span>{voucher.fileName}</span><RightOutlined /></button>) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无凭证" />}</div></SectionCard></>}</div>;
}

function ConsumeInfoRows({ consume }: { consume: ConsumeInfo }) { return <div className="detail-grid"><span>消费账户</span><b>{consume.account}</b><span>消费日期</span><b>{consume.consumeDate}</b><span>交易流水号</span><b>{consume.transactionNo ?? '—'}</b><span>消费金额</span><b><Amount value={consume.amount} /></b><span>消费用途</span><b>{consume.purpose}</b><span>贴息金额</span><b><Amount value={consume.interestAmount} /></b></div>; }

function RecordsPanel({ records, range, setRange }: { records: InterestRecord[]; range: DateRange; setRange: (range: DateRange) => void }) {
  const list = records.filter((item) => range === 'all' || Date.now() - new Date(item.date).getTime() <= Number(range) * 86400000);
  const total = list.reduce((sum, item) => sum + item.amount, 0);
  return <div className="interest-scroll"><div className="records-summary"><div><span>累计贴息金额</span><strong>¥{money(total)}</strong></div><div><span>累计笔数</span><strong>{list.length}<small>笔</small></strong></div></div><div className="list-filter"><span>按时间筛选</span><select value={range} onChange={(event) => setRange(event.target.value as DateRange)}><option value="all">全部时间</option><option value="30">近30天</option><option value="90">近90天</option></select></div>{list.length ? list.map((item) => <article className="interest-record" key={item.id}><div><strong>{item.date}</strong><span>{item.loanNo}</span><small>贴息卡号 {item.cardNo} · {item.interestTime}</small></div><Amount value={item.amount} /></article>) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无贴息记录" />}</div>;
}

function AgreementSheet({ agreement, loading, onSign, onClose }: { agreement?: InterestAgreement; loading: boolean; onSign: () => void; onClose: () => void }) {
  return <Sheet title={agreement?.title ?? '消费贷款财政贴息服务协议'} onClose={onClose} className="agreement-sheet"><div className="contract-preview"><p>甲方（服务方）：银行宝</p><p>乙方（借款人）：张先生</p>{(agreement?.content ?? []).slice(2).map((text) => <p key={text}>{text}</p>)}</div><div className="sheet-buttons"><button type="button" onClick={onClose}>暂不签署</button><button type="button" className="primary-action" disabled={loading} onClick={onSign}>{loading ? '签署中...' : '确认签署'}</button></div></Sheet>;
}

function TransactionSheet({ transactions, selected, onSelect, onConfirm, onClose, inline = false }: { transactions: ConsumeInfo[]; selected: string; onSelect: (transactionNo: string) => void; onConfirm: () => void; onClose: () => void; inline?: boolean }) {
  return <Sheet title="选择交易流水号" onClose={onClose} className="transaction-sheet" inline={inline}><div className="transaction-option-list">{transactions.length ? transactions.map((transaction) => <button type="button" key={transaction.id} className={`transaction-option ${selected === transaction.transactionNo ? 'selected' : ''}`} onClick={() => onSelect(transaction.transactionNo ?? '')}><i>{selected === transaction.transactionNo ? <CheckOutlined /> : null}</i><div><b>{transaction.transactionNo}</b><span>{transaction.consumeDate} · {transaction.purpose}</span><strong><Amount value={transaction.amount} /></strong></div><RightOutlined /></button>) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无可选交易流水" />}</div><button type="button" className="primary-action" disabled={!selected} onClick={onConfirm}>确定</button></Sheet>;
}

function LoanSheet({ loans, selected, setSelected, onConfirm, onClose, inline = false }: { loans: EligibleLoan[]; selected: string[]; setSelected: (ids: string[]) => void; onConfirm: () => void; onClose: () => void; inline?: boolean }) {
  const toggle = (loan: EligibleLoan) => { if (!loan.selectable) return; setSelected(selected.includes(loan.id) ? selected.filter((id) => id !== loan.id) : [...selected, loan.id]); };
  return <Sheet title="选择关联贷款" onClose={onClose} className="loan-sheet" inline={inline}><div className="loan-option-list">{loans.map((loan) => <button type="button" key={loan.id} disabled={!loan.selectable} className={`loan-option ${selected.includes(loan.id) ? 'selected' : ''} ${!loan.selectable ? 'disabled' : ''}`} onClick={() => toggle(loan)}><i>{selected.includes(loan.id) ? <CheckOutlined /> : null}</i><div><b>{loan.loanNo}</b><span>{loan.loanDate} · {loan.term}</span><strong>¥{money(loan.loanAmount)}</strong></div>{loan.reason ? <em>{loan.reason}</em> : null}</button>)}</div><button type="button" className="primary-action" disabled={!selected.length} onClick={onConfirm}>确定（已选 {selected.length} 笔）</button></Sheet>;
}

function MoreSheet({ onClose }: { onClose: () => void }) { return <Sheet title="更多" onClose={onClose} className="more-sheet"><button type="button" onClick={() => message.info('常见问题为原型入口')}><QuestionCircleOutlined /> 常见问题 <RightOutlined /></button><button type="button" onClick={() => message.info('专属客服工作时间：09:00-18:00')}><CustomerServiceOutlined /> 专属客服 <RightOutlined /></button></Sheet>; }

function ConsumeDetailSheet({ consume, onClose, inline = false }: { consume: ConsumeInfo; onClose: () => void; inline?: boolean }) { return <Sheet title="消费详情" onClose={onClose} inline={inline}><ConsumeInfoRows consume={consume} /></Sheet>; }
function LoanMoreSheet({ loans, onClose }: { loans: EligibleLoan[]; onClose: () => void }) { return <Sheet title="关联贷款" onClose={onClose}><div className="all-loans">{loans.map((loan) => <div key={loan.id}><b>{loan.loanNo}</b><span>{loan.loanDate} · {loan.term}</span><strong>¥{money(loan.loanAmount)}</strong></div>)}</div></Sheet>; }
function VoucherSheet({ voucher, onClose }: { voucher: Voucher; onClose: () => void }) { return <Sheet title="凭证预览" onClose={onClose}><div className="voucher-preview"><img src={voucher.imageUrl} alt={voucher.fileName} /><b>{voucher.fileName}</b>{voucher.invoiceNo ? <span>发票号码：{voucher.invoiceNo}</span> : null}{voucher.amount !== undefined ? <span>发票金额：¥{money(voucher.amount)}</span> : null}{voucher.invoiceDate ? <span>发票日期：{voucher.invoiceDate}</span> : null}</div></Sheet>; }

export default function ConsumeInterestPage() {
  const navigate = useNavigate();
  const [api, contextHolder] = message.useMessage();
  const [data, setData] = useState<ConsumeInterestClientData>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [focusedPanel, setFocusedPanel] = useState<Panel>('profile');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [applications, setApplications] = useState<ConsumeInterestApplication[]>([]);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [selectedLoans, setSelectedLoans] = useState<string[]>([]);
  const [loanSheetSelection, setLoanSheetSelection] = useState<string[]>([]);
  const [transactionSheetSelection, setTransactionSheetSelection] = useState('');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<ConsumeInterestApplication>();
  const [selectedConsume, setSelectedConsume] = useState<ConsumeInfo>();
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher>();
  const [verifyTab, setVerifyTab] = useState<VerifyTab>('all');
  const [verifyRange, setVerifyRange] = useState<DateRange>('all');
  const [recordRange, setRecordRange] = useState<DateRange>('all');
  const [signing, setSigning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const transactionOptions = useMemo(() => {
    if (!data) return [];
    const seen = new Set<string>();
    return applications.flatMap((application) => [application.consumeInfo, ...(application.systemConsumes ?? [])]).filter((consume): consume is ConsumeInfo => Boolean(consume?.transactionNo && !seen.has(consume.transactionNo) && seen.add(consume.transactionNo)));
  }, [applications, data]);

  const loadData = () => { setLoading(true); setError(false); getConsumeInterestClientData().then((response) => { setData(response.data); setApplications(response.data.applications); }).catch(() => setError(true)).finally(() => setLoading(false)); };
  useEffect(() => { loadData(); }, []);
  if (loading) return <div className="interest-loading"><Spin tip="正在加载贴息客户端..." /></div>;
  if (error || !data) return <div className="interest-loading"><Empty description="贴息客户端加载失败"><Button onClick={loadData}>重新加载</Button></Empty></div>;

  const close = () => navigate('/welcome');
  const more = () => setOverlay('more');
  const openPanel = (panel: Panel) => { setFocusedPanel(panel); setOverlay(null); };
  const back = (panel: Panel) => () => setFocusedPanel(panel);
  const sign = async () => { setSigning(true); try { await signInterestAgreement(); setOverlay(null); setFocusedPanel('homeSigned'); api.success('贴息协议签署成功'); } catch { api.error('签署失败，请重试'); } finally { setSigning(false); } };
  const submit = async () => { if (!form.account || !form.consumeDate || !form.purpose || !selectedLoans.length || (data.config.showTransactionNo && !form.transactionNo)) { api.warning('请完善消费信息和关联贷款'); return; } if (!vouchers.some((item) => item.type === 'invoice')) { api.warning('请上传发票'); return; } if (!vouchers.some((item) => item.type === 'proof')) { api.warning('请上传消费凭证'); return; } setSubmitting(true); try { const response = await submitConsumeInterestApplication({ ...form, loanIds: selectedLoans, vouchers }); setApplications((items) => [response.data.application, ...items]); setSelectedApplication(response.data.application); setFocusedPanel('verifies'); api.success('申请已提交，正在进行资质认定'); } catch { api.error('提交失败，请稍后重试'); } finally { setSubmitting(false); } };
  const files = (event: ChangeEvent<HTMLInputElement>, type: 'invoice' | 'proof') => { const selected = Array.from(event.target.files ?? []); if (!selected.length) return; const current = vouchers.filter((item) => item.type === type); const max = type === 'invoice' ? 1 : data.config.maxProofCount; if (current.length + selected.length > max) { api.warning(type === 'invoice' ? '发票最多上传1张' : `消费凭证最多上传${max}张`); event.target.value = ''; return; } const invalid = selected.find((file) => !['image/jpeg', 'image/png'].includes(file.type)); if (invalid) { api.error('仅支持 jpg/png 格式图片'); event.target.value = ''; return; } Promise.all(selected.map((file) => new Promise<Voucher>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve({ id: `${type}-${Date.now()}-${file.name}`, type, imageUrl: String(reader.result), fileName: file.name }); reader.readAsDataURL(file); }))).then((items) => setVouchers((value) => [...value, ...items])); event.target.value = ''; };
  const cancel = async (application: ConsumeInterestApplication) => { try { await cancelConsumeInterestApplication(application.id); setApplications((items) => items.map((item) => item.id === application.id ? { ...item, status: 'cancelled', statusRemark: '用户主动撤销申请' } : item)); api.success('申请已撤销'); } catch { api.error('撤销失败，请重试'); } };
  const panelBack = focusedPanel === 'profile' ? () => navigate(-1) : back(focusedPanel === 'verifyDetail' ? 'verifies' : focusedPanel.startsWith('home') ? 'profile' : 'homeUnsigned');

  return <div className="interest-host">{contextHolder}<div className="interest-heading"><div><strong>财政贴息专区</strong><span>银行宝签约 · 消费贷款贴息客户端原型</span></div><span className="canvas-size">370 × 844</span></div><div className="interest-canvas-scroll"><main className="interest-canvas"><PhonePreview title="个人中心" focused={focusedPanel === 'profile'} onBack={panelBack} onClose={close} onMore={more}><ProfilePanel data={data} onInterest={() => openPanel('homeUnsigned')} /></PhonePreview><PhonePreview title="财政贴息 · 未签约" focused={focusedPanel === 'homeUnsigned'} onBack={back('profile')} onClose={close} onMore={more}><HomePanel data={data} scenario="unsigned" onSign={() => setOverlay('agreement')} onOpen={openPanel} /></PhonePreview><PhonePreview title="财政贴息 · 已签约" focused={focusedPanel === 'homeSigned'} onBack={back('profile')} onClose={close} onMore={more}><HomePanel data={data} scenario="signed" onSign={() => setOverlay('agreement')} onOpen={openPanel} /></PhonePreview><PhonePreview title="财政贴息 · 无符合条件" focused={focusedPanel === 'homeNoLoan'} onBack={back('profile')} onClose={close} onMore={more}><HomePanel data={data} scenario="noEligibleLoan" onSign={() => setOverlay('agreement')} onOpen={openPanel} /></PhonePreview><PhonePreview title="自主申请" focused={focusedPanel === 'apply'} onBack={back('homeUnsigned')} onClose={close} onMore={more}><ApplyPanel data={data} form={form} setForm={setForm} selectedLoans={selectedLoans} transactions={transactionOptions} onOpenTransactions={() => { setTransactionSheetSelection(form.transactionNo); setOverlay('transaction'); }} onOpenLoans={() => { setLoanSheetSelection(selectedLoans); setOverlay('loans'); }} vouchers={vouchers} onFiles={files} onSubmit={submit} submitting={submitting} />{overlay === 'transaction' ? <TransactionSheet transactions={transactionOptions} selected={transactionSheetSelection} onSelect={setTransactionSheetSelection} onConfirm={() => { setForm({ ...form, transactionNo: transactionSheetSelection }); setOverlay(null); }} onClose={() => setOverlay(null)} inline /> : null}{overlay === 'loans' ? <LoanSheet loans={data.loans} selected={loanSheetSelection} setSelected={setLoanSheetSelection} onConfirm={() => { setSelectedLoans(loanSheetSelection); setOverlay(null); }} onClose={() => setOverlay(null)} inline /> : null}</PhonePreview><PhonePreview title="我的协议" focused={focusedPanel === 'agreements'} onBack={back('homeUnsigned')} onClose={close} onMore={more}><AgreementPanel agreements={data.agreements} onPreview={() => setOverlay('agreement')} onDownload={() => api.info('合同下载为 Mock 反馈')} /></PhonePreview><PhonePreview title="核对记录" focused={focusedPanel === 'verifies'} onBack={back('homeUnsigned')} onClose={close} onMore={more}><VerifyPanel applications={applications} tab={verifyTab} setTab={setVerifyTab} range={verifyRange} setRange={setVerifyRange} onDetail={(application) => { setSelectedApplication(application); setFocusedPanel('verifyDetail'); }} onCancel={cancel} onReapply={() => { setSelectedApplication(undefined); setFocusedPanel('apply'); api.info('已定位到自主申请，请补充资料后重新提交'); }} /></PhonePreview><PhonePreview title="核对记录详情" focused={focusedPanel === 'verifyDetail'} onBack={back('verifies')} onClose={close} onMore={more}><DetailPanel application={selectedApplication} data={data} onLoans={() => setOverlay('loanMore')} onConsume={(consume) => { setSelectedConsume(consume); setOverlay('consumeDetail'); }} onVoucher={(voucher) => { setSelectedVoucher(voucher); setOverlay('voucher'); }} />{overlay === 'consumeDetail' && selectedConsume ? <ConsumeDetailSheet consume={selectedConsume} onClose={() => setOverlay(null)} inline /> : null}</PhonePreview><PhonePreview title="贴息记录" focused={focusedPanel === 'records'} onBack={back('homeUnsigned')} onClose={close} onMore={more}><RecordsPanel records={data.interestRecords} range={recordRange} setRange={setRecordRange} /></PhonePreview></main></div>{overlay === 'agreement' ? <AgreementSheet agreement={data.agreements[0]} loading={signing} onSign={sign} onClose={() => setOverlay(null)} /> : null}{overlay === 'loanMore' ? <LoanMoreSheet loans={(selectedApplication?.loanIds ?? []).map((id) => data.loans.find((item) => item.id === id)).filter(Boolean) as EligibleLoan[]} onClose={() => setOverlay(null)} /> : null}{overlay === 'voucher' && selectedVoucher ? <VoucherSheet voucher={selectedVoucher} onClose={() => setOverlay(null)} /> : null}{overlay === 'more' ? <MoreSheet onClose={() => setOverlay(null)} /> : null}</div>;
}
