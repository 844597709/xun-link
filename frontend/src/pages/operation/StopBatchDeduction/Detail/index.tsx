import { Alert, Button, Card, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import DataTable from '../../../../components/DataTable';
import Filter, { type FilterValue } from '../../../../components/Filter';
import { getStopBatchDeductionDetails } from '../../../../mock';
import type { StopBatchDeductionDetailParams, StopBatchDeductionHistoryRecord } from '../../../../types';
import { detailFilterConfigs, normalizeFilters, tagColor } from '../shared';

function tag(value: string) {
  return <Tag color={tagColor(value)}>{value}</Tag>;
}

function optionalValue(value: string | number | undefined) {
  return value === undefined || value === '' ? '—' : value;
}

const columns: TableColumnsType<StopBatchDeductionHistoryRecord> = [
  { title: '机构号', dataIndex: 'institutionCode', width: 90 },
  { title: '机构名称', dataIndex: 'institutionName', width: 110 },
  { title: '法人机构号', dataIndex: 'legalEntityCode', width: 110 },
  { title: '法人机构名称', dataIndex: 'legalEntityName', width: 130 },
  { title: '客户号', dataIndex: 'customerNo', width: 105 },
  { title: '客户名称', dataIndex: 'customerName', width: 95 },
  { title: '借据号', dataIndex: 'loanNo', width: 145 },
  { title: '操作类型', dataIndex: 'operationType', width: 105, render: tag },
  { title: '停止时间', dataIndex: 'stopTime', width: 155, render: optionalValue },
  { title: '恢复时间', dataIndex: 'restoreTime', width: 155, render: optionalValue },
  { title: '操作人', dataIndex: 'operator', width: 100 },
  { title: '处理状态', dataIndex: 'processStatus', width: 90, render: tag },
  { title: '状态备注', dataIndex: 'statusRemark', width: 160 },
  { title: '恢复批扣策略', dataIndex: 'recoveryStrategy', width: 120 },
  { title: '恢复批扣日期', dataIndex: 'recoveryDate', width: 120, render: optionalValue },
  { title: '恢复批扣天数', dataIndex: 'recoveryDays', width: 110, render: optionalValue },
];

export default function StopBatchDeductionDetail() {
  const [data, setData] = useState<StopBatchDeductionHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState<Record<string, unknown>>({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const requestId = useRef(0);

  const loadData = useCallback(async (page: number, pageSize: number, nextQuery: Record<string, unknown>) => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const response = await getStopBatchDeductionDetails({ page, pageSize, ...nextQuery } as StopBatchDeductionDetailParams);
      if (currentRequest !== requestId.current) return;
      setData(response.data.list);
      setPagination({ current: response.data.page, pageSize: response.data.pagesize, total: response.data.total });
    } catch {
      if (currentRequest === requestId.current) {
        setError('数据加载失败，请重试');
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(1, pagination.pageSize, {}); }, [loadData]);

  const handleSearch = (values: Record<string, FilterValue>) => {
    const normalized = normalizeFilters(values);
    setQuery(normalized);
    setPagination((current) => ({ ...current, current: 1 }));
    void loadData(1, pagination.pageSize, normalized);
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setPagination((current) => ({ ...current, current: page, pageSize }));
    void loadData(page, pageSize, query);
  };

  return <div className="page-container stop-batch-deduction-page">
    <Card className="filter-card"><Filter configs={detailFilterConfigs} onSearch={handleSearch} /></Card>
    {error && <Alert type="error" showIcon message={error} action={<Button size="small" onClick={() => void loadData(pagination.current, pagination.pageSize, query)}>重试</Button>} className="page-alert" />}
    <Card className="table-card" title="批扣操作明细">
      <DataTable
        columns={columns}
        dataSource={data}
        rowKey="historyId"
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </Card>
  </div>;
}
