import { Alert, Button, Card, Descriptions, Spin, Tag, Typography, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Filter, { type FilterConfig, type FilterValue } from '../../components/Filter';
import DataTable from '../../components/DataTable';
import ListActionDrawer from '../../components/ListActionDrawer';
import type { ApiResponse, ListData } from '../../types';
import { subsidyInstitutions, subsidyProducts } from '../../mock/subsidy';

const { Title, Paragraph } = Typography;
export type SubsidyFetcher<T> = (params: { page: number; pageSize: number; [key: string]: unknown }) => Promise<ApiResponse<ListData<T>>>;
export interface SubsidyActionHandlers<T extends object> { openAction: (action: string, record: T) => void; }
export type SubsidyColumns<T extends object> = TableColumnsType<T> | ((handlers: SubsidyActionHandlers<T>) => TableColumnsType<T>);
export type SubsidyDetailRenderer<T extends object> = (record: T) => ReactNode;

export const institutionFilter: FilterConfig = {
  key: 'institutionName', label: '机构', type: 'select', required: true, showSearch: true,
  options: subsidyInstitutions.map((value) => ({ label: value, value })),
};
export const productFilter: FilterConfig = {
  key: 'productCode', label: '产品', type: 'select', showSearch: true,
  optionsResolver: (values) => subsidyProducts.filter((item) => !values.institutionName || item.institutionName === values.institutionName).map((item) => ({ label: `${item.productCode} ${item.productName}`, value: item.productCode })),
};
export const selectFilter = (key: string, label: string, options: string[], extra: Partial<FilterConfig> = {}): FilterConfig => ({ key, label, type: 'select', options: options.map((value) => ({ label: value, value })), ...extra });
export const inputFilter = (key: string, label: string, placeholder?: string): FilterConfig => ({ key, label, type: 'input', placeholder });
export const dateFilter = (key: string, label: string): FilterConfig => ({ key, label, type: 'datePicker', placeholder: `请选择${label}` });

export function statusTag(value: string) {
  const color = ['成功', '已通过', '已签署', '生效', '正常'].includes(value) ? 'green' : ['失败', '已拒绝', '失效', '逾期', '核销'].includes(value) ? 'red' : ['处理中', '审核中', '待处理', '冲正中'].includes(value) ? 'blue' : ['已冲正', '已撤销'].includes(value) ? 'default' : 'default';
  return <Tag color={color}>{value}</Tag>;
}

function displayValue(value: unknown): ReactNode {
  if (value === undefined || value === null || value === '') return '-';
  if (Array.isArray(value)) return value.map(displayValue).join('、');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function defaultActionContent<T extends object>(record: T) {
  return <Descriptions bordered column={1} size="small">{Object.entries(record as Record<string, unknown>).map(([key, value]) => <Descriptions.Item key={key} label={key}>{displayValue(value)}</Descriptions.Item>)}</Descriptions>;
}

export function SubsidyListPage<T extends object>({ title, description, filters, columns, fetcher, showHeading = false, renderActionContent, detailRenderer, detailTitle = `${title} - 详情`, detailWidth = 'min(960px, 100vw)', hideDetailFooter = false }: {
  title: string;
  description: string;
  filters: FilterConfig[];
  columns: SubsidyColumns<T>;
  fetcher: SubsidyFetcher<T>;
  showHeading?: boolean;
  renderActionContent?: (action: string, record: T) => ReactNode;
  detailRenderer?: SubsidyDetailRenderer<T>;
  detailTitle?: ReactNode | ((record: T) => ReactNode);
  detailWidth?: number | string;
  hideDetailFooter?: boolean;
}) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState<Record<string, unknown>>({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [actionState, setActionState] = useState<{ action: string; record: T } | null>(null);
  const [detailState, setDetailState] = useState<T | null>(null);
  const requestId = useRef(0);
  const loadData = useCallback(async (page: number, pageSize: number, nextQuery: Record<string, unknown>) => {
    const currentRequest = ++requestId.current;
    setLoading(true); setError('');
    try {
      const response = await fetcher({ page, pageSize, ...nextQuery });
      if (currentRequest !== requestId.current) return;
      setData(response.data.list); setPagination({ current: response.data.page, pageSize: response.data.pagesize, total: response.data.total });
    } catch {
      if (currentRequest !== requestId.current) return;
      setError('数据加载失败，请重试'); message.error('数据加载失败');
    } finally { if (currentRequest === requestId.current) setLoading(false); }
  }, [fetcher]);
  useEffect(() => { void loadData(1, pagination.pageSize, query); }, [loadData]);
  const handleSearch = (values: Record<string, FilterValue>) => {
    const normalized = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)));
    setQuery(normalized); setPagination((current) => ({ ...current, current: 1 })); void loadData(1, pagination.pageSize, normalized);
  };
  const handlePageChange = (page: number, pageSize: number) => { setPagination((current) => ({ ...current, current: page, pageSize })); void loadData(page, pageSize, query); };
  const openAction = useCallback((action: string, record: T) => {
    if (action === 'view' && detailRenderer) {
      setDetailState(record);
      return;
    }
    setActionState({ action, record });
  }, [detailRenderer]);
  const resolvedColumns = useMemo(() => typeof columns === 'function' ? columns({ openAction }) : columns, [columns, openAction]);
  const detailHeading: ReactNode = typeof detailTitle === 'function' ? (detailState ? detailTitle(detailState) : title) : detailTitle;
  return <div className="page-container subsidy-list-page">
    {showHeading && <div className="page-heading"><div><Title level={3}>{title}</Title><Paragraph type="secondary">{description}</Paragraph></div></div>}
    <Card className="filter-card"><Filter configs={filters} onSearch={handleSearch} /></Card>
    {error && <Alert type="error" showIcon message={error} action={<Button size="small" onClick={() => void loadData(pagination.current, pagination.pageSize, query)}>重试</Button>} className="page-alert" />}
    <Card className="table-card"><DataTable columns={resolvedColumns} dataSource={data} loading={loading} pagination={pagination} onPageChange={handlePageChange} /></Card>
    <ListActionDrawer open={detailState !== null} title={detailHeading} width={detailWidth} className="subsidy-detail-drawer" onClose={() => setDetailState(null)} footer={hideDetailFooter ? null : <Button type="primary" onClick={() => setDetailState(null)}>关闭</Button>}>
      {detailState && detailRenderer?.(detailState)}
    </ListActionDrawer>
    <ListActionDrawer open={actionState !== null} title={actionState ? `${title} - ${actionState.action}` : title} onClose={() => setActionState(null)} footer={<Button type="primary" onClick={() => setActionState(null)}>关闭</Button>}>
      {actionState && (renderActionContent?.(actionState.action, actionState.record) ?? defaultActionContent(actionState.record))}
    </ListActionDrawer>
  </div>;
}

export function DetailShell({ title, loading, error, children, embedded = false }: { title: string; loading: boolean; error: string; children: React.ReactNode; embedded?: boolean }) {
  const navigate = useNavigate();
  if (loading) return <div className={`detail-state${embedded ? ' detail-state-embedded' : ''}`}><Spin tip="详情加载中..." /></div>;
  if (error) return embedded ? <div className="detail-state detail-state-embedded"><Alert type="error" showIcon message={error} /></div> : <div className="page-container"><Alert type="error" showIcon message={error} action={<Button onClick={() => navigate(-1)}>返回列表</Button>} /></div>;
  if (embedded) return <div className="subsidy-detail-page subsidy-detail-embedded">{children}</div>;
  return <div className="page-container subsidy-detail-page"><div className="page-heading"><div><Title level={3}>{title}</Title><Paragraph type="secondary">贴息运营详情</Paragraph></div><Button onClick={() => navigate(-1)}>返回列表</Button></div>{children}</div>;
}

export function DetailSection({ title, items, children, layout = 'descriptions' }: { title: string; items?: Array<{ label: React.ReactNode; value: React.ReactNode }>; children?: React.ReactNode; layout?: 'descriptions' | 'plain-two-column' | 'plain-three-column' }) {
  return <Card title={title} className={`subsidy-detail-card${layout === 'plain-two-column' ? ' subsidy-detail-card-plain' : ''}${layout === 'plain-three-column' ? ' subsidy-detail-card-three' : ''}`}>
    {items && (layout === 'plain-two-column' || layout === 'plain-three-column') && <div className={`subsidy-detail-field-grid${layout === 'plain-three-column' ? ' subsidy-detail-field-grid-three' : ''}`}>{items.map((item, index) => <div className={`subsidy-detail-field${layout === 'plain-three-column' ? ' subsidy-detail-field-three' : ''}`} key={index}><span className="subsidy-detail-field-label">{item.label}</span><div className="subsidy-detail-field-value">{item.value}</div></div>)}</div>}
    {items && layout === 'descriptions' && <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} bordered size="small" items={items.map((item, index) => ({ key: index, label: item.label, children: item.value }))} />}
    {children}
  </Card>;
}

export function objectItems(record: Record<string, React.ReactNode>, labels?: string[]) {
  return Object.entries(record).filter(([label]) => !labels || labels.includes(label)).map(([label, value]) => ({ label, value: typeof value === 'number' ? value.toLocaleString('zh-CN') : value }));
}
