import { Alert, Button, Card, Descriptions, Space, Typography, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Filter, { type FilterConfig, type FilterValue } from '../Filter';
import DataTable from '../DataTable';
import ListActionDrawer from '../ListActionDrawer';
import type { ApiResponse, ListData } from '../../types';

const { Title, Paragraph } = Typography;

type Fetcher<T> = (params: { page: number; pageSize: number; [key: string]: unknown }) => Promise<ApiResponse<ListData<T>>>;
export type ModuleListAction = 'view' | 'edit' | 'delete';
export interface ModuleListActionHandlers<T extends object> {
  openAction: (action: ModuleListAction, record: T) => void;
}
export type ModuleListColumns<T extends object> = TableColumnsType<T> | ((handlers: ModuleListActionHandlers<T>) => TableColumnsType<T>);

export interface ModuleListPageProps<T extends object> {
  title: string;
  description: string;
  filters: FilterConfig[];
  columns: ModuleListColumns<T>;
  fetcher: Fetcher<T>;
  initialFilters?: Record<string, FilterValue>;
  showHeading?: boolean;
}

function formatValue(value: unknown): ReactNode {
  if (value === undefined || value === null || value === '') return '-';
  if (Array.isArray(value)) return value.map((item) => formatValue(item)).join('、');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function recordContent<T extends object>(record: T) {
  return <Descriptions bordered column={1} size="small">{Object.entries(record as Record<string, unknown>).map(([key, value]) => (
    <Descriptions.Item key={key} label={key}>{formatValue(value)}</Descriptions.Item>
  ))}</Descriptions>;
}

function actionLabel(action: ModuleListAction) {
  return action === 'view' ? '查看记录' : action === 'edit' ? '编辑记录' : '删除记录';
}

export default function ModuleListPage<T extends object>({
  title,
  description,
  filters,
  columns,
  fetcher,
  initialFilters = {},
  showHeading = false,
}: ModuleListPageProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState<Record<string, unknown>>(initialFilters);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [actionState, setActionState] = useState<{ action: ModuleListAction; record: T } | null>(null);
  const requestId = useRef(0);

  const loadData = useCallback(async (page: number, pageSize: number, nextQuery: Record<string, unknown>) => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const response = await fetcher({ page, pageSize, ...nextQuery });
      if (currentRequest !== requestId.current) return;
      setData(response.data.list);
      setPagination({ current: response.data.page, pageSize: response.data.pagesize, total: response.data.total });
    } catch {
      if (currentRequest !== requestId.current) return;
      setError('数据加载失败，请重试');
      message.error('数据加载失败');
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => { void loadData(1, pagination.pageSize, query); }, [loadData]);

  const handleSearch = (values: Record<string, FilterValue>) => {
    const normalized = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== ''));
    setQuery(normalized);
    setPagination((current) => ({ ...current, current: 1 }));
    void loadData(1, pagination.pageSize, normalized);
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setPagination((current) => ({ ...current, current: page, pageSize }));
    void loadData(page, pageSize, query);
  };

  const openAction = useCallback((action: ModuleListAction, record: T) => setActionState({ action, record }), []);
  const resolvedColumns = useMemo(() => typeof columns === 'function' ? columns({ openAction }) : columns, [columns, openAction]);
  const closeAction = () => setActionState(null);
  const confirmAction = () => {
    if (!actionState) return;
    message.success(actionState.action === 'delete' ? '原型已接收删除操作' : `原型已接收${actionLabel(actionState.action)}操作`);
    closeAction();
    if (actionState.action === 'delete') void loadData(pagination.current, pagination.pageSize, query);
  };

  return (
    <div className="page-container">
      {showHeading && <div className="page-heading"><div><Title level={3}>{title}</Title><Paragraph type="secondary">{description}</Paragraph></div></div>}
      <Card className="filter-card"><Filter configs={filters} onSearch={handleSearch} /></Card>
      {error && <Alert type="error" showIcon message={error} action={<Button size="small" onClick={() => void loadData(pagination.current, pagination.pageSize, query)}>重试</Button>} className="page-alert" />}
      <Card className="table-card">
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <DataTable columns={resolvedColumns} dataSource={data} loading={loading} pagination={pagination} onPageChange={handlePageChange} />
        </Space>
      </Card>
      <ListActionDrawer
        open={actionState !== null}
        title={actionState ? `${title} - ${actionLabel(actionState.action)}` : title}
        onClose={closeAction}
        width="min(720px, 100vw)"
        footer={<Space><Button onClick={closeAction}>取消</Button><Button type="primary" danger={actionState?.action === 'delete'} onClick={confirmAction}>{actionState?.action === 'delete' ? '确认删除' : actionState?.action === 'edit' ? '保存' : '关闭'}</Button></Space>}
      >
        {actionState && <>
          {actionState.action === 'delete' ? <Typography.Paragraph>确定对当前记录执行删除操作吗？</Typography.Paragraph> : recordContent(actionState.record)}
        </>}
      </ListActionDrawer>
    </div>
  );
}
