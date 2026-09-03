import { Alert, Button, Card, Space, Typography, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import Filter, { type FilterConfig, type FilterValue } from '../Filter';
import DataTable from '../DataTable';
import type { ApiResponse, ListData } from '../../types';

const { Title, Paragraph } = Typography;

type Fetcher<T> = (params: { page: number; pageSize: number; [key: string]: unknown }) => Promise<ApiResponse<ListData<T>>>;

export interface ModuleListPageProps<T extends object> {
  title: string;
  description: string;
  filters: FilterConfig[];
  columns: TableColumnsType<T>;
  fetcher: Fetcher<T>;
  initialFilters?: Record<string, FilterValue>;
}

export default function ModuleListPage<T extends object>({
  title,
  description,
  filters,
  columns,
  fetcher,
  initialFilters = {},
}: ModuleListPageProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState<Record<string, unknown>>(initialFilters);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
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

  return (
    <div className="page-container">
      <div className="page-heading">
        <div>
          <Title level={3}>{title}</Title>
          <Paragraph type="secondary">{description}</Paragraph>
        </div>
      </div>
      <Card className="filter-card"><Filter configs={filters} onSearch={handleSearch} /></Card>
      {error && <Alert type="error" showIcon message={error} action={<Button size="small" onClick={() => void loadData(pagination.current, pagination.pageSize, query)}>重试</Button>} className="page-alert" />}
      <Card className="table-card">
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <DataTable columns={columns} dataSource={data} loading={loading} pagination={pagination} onPageChange={handlePageChange} />
        </Space>
      </Card>
    </div>
  );
}
