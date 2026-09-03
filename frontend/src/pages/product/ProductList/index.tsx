import { Alert, Button, Card, Drawer, Space, Tag, Typography, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import DataTable from '../../../components/DataTable';
import Filter, { type FilterConfig, type FilterValue } from '../../../components/Filter';
import {
  getProducts,
  institutionOptions,
  loanTypeOptions,
  type ProductListParams,
} from '../../../mock/product';
import type { ProductRecord } from '../../../types';
import ProductInfoModal from './components/ProductInfoModal';
import RepaymentMaintenance from '../RepaymentMaintenance';

const productFilters: FilterConfig[] = [
  { key: 'institutionName', label: '机构', type: 'select', options: institutionOptions, showSearch: true, placeholder: '请选择或检索机构' },
  { key: 'loanType', label: '贷款类型', type: 'select', options: loanTypeOptions },
  { key: 'productCode', label: '产品号', type: 'input', placeholder: '请输入产品号' },
];

function repaymentTags(methods: ProductRecord['repaymentMethods']) {
  return <Space size={[0, 4]} wrap>{methods.map((method) => <Tag key={method.code}>{method.name}（{method.code}）</Tag>)}</Space>;
}

export const productColumns = (
  onView: (product: ProductRecord) => void,
  onEdit: (product: ProductRecord) => void,
  onMaintain: (product: ProductRecord) => void,
): TableColumnsType<ProductRecord> => [
  { title: '机构号', dataIndex: 'institutionCode', width: 100 },
  { title: '机构名称', dataIndex: 'institutionName', width: 120 },
  { title: '产品号', dataIndex: 'productCode', width: 120 },
  { title: '产品名称', dataIndex: 'productName', width: 140, ellipsis: true },
  { title: '贷款类型', dataIndex: 'loanType', width: 100 },
  { title: '贷款细分类型', dataIndex: 'loanSubType', width: 140, ellipsis: true },
  { title: '额度类型', dataIndex: 'creditType', width: 110 },
  { title: '客户最大授信额度', dataIndex: 'maxCreditLimit', width: 150, render: (value: number) => `${value.toLocaleString('zh-CN')} 元` },
  { title: '正常利率区间', key: 'normalRate', width: 140, render: (_, record) => `${record.normalRateMin.toFixed(2)}% - ${record.normalRateMax.toFixed(2)}%` },
  { title: '还款方式', key: 'repaymentMethods', width: 260, render: (_, record) => repaymentTags(record.repaymentMethods) },
  {
    title: '操作', key: 'actions', fixed: 'right', width: 220,
    render: (_, record) => <Space size="small" wrap>
      <Button type="link" size="small" onClick={() => onView(record)}>查看</Button>
      <Button type="link" size="small" onClick={() => onEdit(record)}>编辑</Button>
      <Button type="link" size="small" onClick={() => onMaintain(record)}>还款方式维护</Button>
    </Space>,
  },
];

export default function ProductList() {
  const [data, setData] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState<Record<string, unknown>>({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [modal, setModal] = useState<{ mode: 'view' | 'edit'; product: ProductRecord } | null>(null);
  const [maintenanceProduct, setMaintenanceProduct] = useState<ProductRecord | null>(null);
  const requestId = useRef(0);

  const loadData = useCallback(async (page: number, pageSize: number, nextQuery: Record<string, unknown>) => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const response = await getProducts({ page, pageSize, ...nextQuery } as ProductListParams);
      if (currentRequest !== requestId.current) return;
      if (response.code !== 0) throw new Error(response.message);
      setData(response.data.list);
      setPagination({ current: response.data.page, pageSize: response.data.pagesize, total: response.data.total });
    } catch {
      if (currentRequest !== requestId.current) return;
      setError('产品数据加载失败，请重试');
      message.error('产品数据加载失败');
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, []);

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

  const reload = () => { void loadData(pagination.current, pagination.pageSize, query); };
  const closeModal = () => setModal(null);
  const afterSaved = () => {
    closeModal();
    message.success('产品信息保存成功');
    reload();
  };

  return (
    <div className="page-container">
      <div className="page-heading"><div><Typography.Title level={3}>产品信息列表</Typography.Title><Typography.Paragraph type="secondary">维护产品基础信息及还款方式配置</Typography.Paragraph></div></div>
      <Card className="filter-card"><Filter configs={productFilters} onSearch={handleSearch} /></Card>
      {error && <Alert type="error" showIcon message={error} action={<Button size="small" onClick={reload}>重试</Button>} className="page-alert" />}
      <Card className="table-card"><DataTable columns={productColumns((product) => setModal({ mode: 'view', product }), (product) => setModal({ mode: 'edit', product }), (product) => setMaintenanceProduct(product))} dataSource={data} loading={loading} pagination={pagination} onPageChange={handlePageChange} /></Card>
      {modal && <ProductInfoModal open mode={modal.mode} product={modal.product} onClose={closeModal} onSaved={afterSaved} />}
      <Drawer
        title="还款方式维护"
        open={maintenanceProduct !== null}
        onClose={() => setMaintenanceProduct(null)}
        destroyOnClose
        width="min(1080px, 100vw)"
        className="repayment-maintenance-drawer"
      >
        {maintenanceProduct && <RepaymentMaintenance
          productId={maintenanceProduct.id}
          embedded
          onClose={() => setMaintenanceProduct(null)}
          onSaved={() => { setMaintenanceProduct(null); reload(); }}
        />}
      </Drawer>
    </div>
  );
}
