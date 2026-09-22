import { Empty, Table } from 'antd';
import type { TableColumnsType, TablePaginationConfig, TableProps } from 'antd';

interface DataTableProps<T extends object> {
  columns: TableColumnsType<T>;
  dataSource: T[];
  loading?: boolean;
  pagination: { current: number; pageSize: number; total: number };
  onPageChange: (page: number, pageSize: number) => void;
  rowKey?: string | ((record: T) => string);
  rowSelection?: TableProps<T>['rowSelection'];
}

export default function DataTable<T extends object>({
  columns,
  dataSource,
  loading = false,
  pagination,
  onPageChange,
  rowKey = 'id',
  rowSelection,
}: DataTableProps<T>) {
  const tablePagination: TablePaginationConfig = {
    current: pagination.current,
    pageSize: pagination.pageSize,
    total: pagination.total,
    showSizeChanger: true,
    showTotal: (total) => `共 ${total} 条`,
    onChange: onPageChange,
  };

  return (
    <Table<T>
      bordered
      rowKey={rowKey}
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      rowSelection={rowSelection}
      pagination={tablePagination}
      locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" /> }}
      scroll={{ x: 'max-content' }}
    />
  );
}
