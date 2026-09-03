import { Alert, Button, Card, Descriptions, Modal, Spin, Typography, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type {
  AssociatedComponent,
  CombinationConfig,
  CombinationModeCode,
  CombinationTermConfig,
  CustomModeCode,
  CustomRepaymentConfig,
  ProductModeCode,
  RepaymentMaintenanceData,
  RepaymentMaintenancePayload,
  RepaymentMethodSummary,
} from '../../../types';
import { getProductDetail, modeNames, saveRepaymentConfig } from '../../../mock/product';
import {
  AssociatedComponents,
  CombinationConfigSection,
  CustomRepaymentConfigSection,
  SupportedRepaymentMethods,
} from './components/ConfigSections';
import { validateRepaymentMaintenance } from './validation';

let maintenanceId = 1000;
const nextMaintenanceId = (prefix: string) => `${prefix}-${maintenanceId++}`;

export interface RepaymentMaintenanceProps {
  productId?: number;
  embedded?: boolean;
  onClose?: () => void;
  onSaved?: () => void;
}

function defaultPeriods(code: ProductModeCode) {
  if (code === '10' || code === '11' || code === '12') return [12, 24, 36];
  if (code === '5' || code === '6' || code === '7' || code === '8') return [12, 24];
  return [6, 12, 24, 36];
}

function createDefaultCombination(code: CombinationModeCode, periods: number[]): CombinationConfig {
  const secondMode = code === '10' ? '3' : code === '11' ? '4' : '2';
  return {
    code,
    name: modeNames[code],
    expanded: true,
    terms: periods.map((totalTerm) => {
      const split = Math.max(1, Math.floor(totalTerm / 3));
      return {
        id: nextMaintenanceId(`${code}-term`),
        totalTerm,
        plans: [{
          id: nextMaintenanceId(`${code}-plan`),
          planSeq: 1,
          stages: [
            { id: nextMaintenanceId('stage'), startPeriod: 1, endPeriod: split, repaymentMode: '2', principalRatio: 0 },
            { id: nextMaintenanceId('stage'), startPeriod: split + 1, endPeriod: totalTerm, repaymentMode: secondMode, principalRatio: 1 },
          ],
        }],
      };
    }),
  };
}

function createDefaultCustom(code: CustomModeCode, periods: number[]): CustomRepaymentConfig {
  return { code, name: modeNames[code], expanded: true, interestCycle: '按月付息', principalCycle: '按月还本', ratios: code === '6' ? [{ id: nextMaintenanceId('ratio'), term: periods[0], ratio: 20 }] : [] };
}

function syncAssociatedRows(rows: AssociatedComponent[], methods: RepaymentMethodSummary[], rowNo: 1 | 2 | 3, productId: number) {
  if (rowNo === 1) return [];
  const next = methods.map((method) => rows.find((row) => row.repaymentModeCode === method.code) ?? {
    id: `${productId}-${method.code}`,
    repaymentModeCode: method.code,
    repaymentModeName: method.name,
    releaseComponent: '',
    repaymentComponent: '',
    interestComponent: '',
    editable: rowNo === 2 || rowNo === 3,
  });
  return next;
}

function ProductReadonlyInfo({ data }: { data: RepaymentMaintenanceData }) {
  const { product } = data;
  return <Card className="form-section-card" title="基础信息"><Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
    <Descriptions.Item label="机构号">{product.institutionCode}</Descriptions.Item>
    <Descriptions.Item label="机构名称">{product.institutionName}</Descriptions.Item>
    <Descriptions.Item label="产品号">{product.productCode}</Descriptions.Item>
    <Descriptions.Item label="产品名称">{product.productName}</Descriptions.Item>
    <Descriptions.Item label="贷款类型">{product.loanType}</Descriptions.Item>
    <Descriptions.Item label="贷款分类">{product.loanSubType}</Descriptions.Item>
    <Descriptions.Item label="额度类型">{product.creditType}</Descriptions.Item>
    <Descriptions.Item label="客户最大授信额度">{product.maxCreditLimit.toLocaleString('zh-CN')} 元</Descriptions.Item>
    <Descriptions.Item label="正常利率区间">{product.normalRateMin.toFixed(2)}% - {product.normalRateMax.toFixed(2)}%</Descriptions.Item>
  </Descriptions></Card>;
}

export default function RepaymentMaintenance({ productId: productIdProp, embedded = false, onClose, onSaved }: RepaymentMaintenanceProps) {
  const { productId: routeProductId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const id = productIdProp ?? Number(routeProductId);
  const [data, setData] = useState<RepaymentMaintenanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const response = await getProductDetail(id);
    if (response.code !== 0) setError(response.message);
    else setData(response.data);
    setLoading(false);
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  const updateMethods = (nextMethods: RepaymentMethodSummary[]) => setData((old) => old ? { ...old, supportedMethods: nextMethods } : old);
  const addMethod = (code: ProductModeCode) => setData((old) => {
    if (!old || old.supportedMethods.some((item) => item.code === code)) return old;
    const periods = defaultPeriods(code);
    const methods = [...old.supportedMethods, { code, name: modeNames[code], periods }];
    const combinations = code === '10' || code === '11' || code === '12' ? [...old.combinations, createDefaultCombination(code, periods)] : old.combinations;
    const customConfigs = code === '5' || code === '6' || code === '7' || code === '8' ? [...old.customConfigs, createDefaultCustom(code, periods)] : old.customConfigs;
    return { ...old, supportedMethods: methods, combinations, customConfigs, associatedComponents: syncAssociatedRows(old.associatedComponents, methods, old.product.rowNo, old.product.id) };
  });
  const deleteMethod = (code: ProductModeCode) => {
    if (!data || data.supportedMethods.length <= 1) { message.warning('至少保留一种还款方式'); return; }
    Modal.confirm({ title: '确认删除还款方式', content: `删除${modeNames[code]}后，其详细配置和关联部件也会一并删除，是否继续？`, onOk: () => setData((old) => {
      if (!old) return old;
      const methods = old.supportedMethods.filter((item) => item.code !== code);
      return { ...old, supportedMethods: methods, combinations: old.combinations.filter((item) => item.code !== code), customConfigs: old.customConfigs.filter((item) => item.code !== code), associatedComponents: syncAssociatedRows(old.associatedComponents, methods, old.product.rowNo, old.product.id) };
    }) });
  };
  const addPeriod = (code: ProductModeCode, period: number) => setData((old) => {
    if (!old) return old;
    const method = old.supportedMethods.find((item) => item.code === code);
    if (!method || method.periods.includes(period)) { message.warning('期数已存在或方式不存在'); return old; }
    const periods = [...method.periods, period].sort((a, b) => a - b);
    let combinations = old.combinations;
    if (code === '10' || code === '11' || code === '12') combinations = old.combinations.map((item) => item.code === code ? { ...item, terms: [...item.terms, createDefaultCombination(code, [period]).terms[0]] } : item);
    return { ...old, supportedMethods: old.supportedMethods.map((item) => item.code === code ? { ...item, periods } : item), combinations };
  });
  const deletePeriod = (code: ProductModeCode, period: number) => setData((old) => {
    if (!old) return old;
    const method = old.supportedMethods.find((item) => item.code === code);
    if (!method || method.periods.length <= 1) { message.warning('至少保留一个期数'); return old; }
    const periods = method.periods.filter((item) => item !== period);
    const combinations = old.combinations.map((item) => item.code === code ? { ...item, terms: item.terms.filter((term) => term.totalTerm !== period) } : item);
    return { ...old, supportedMethods: old.supportedMethods.map((item) => item.code === code ? { ...item, periods } : item), combinations };
  });

  const save = async () => {
    if (!data || saving) return;
    const payload: RepaymentMaintenancePayload = { supportedMethods: data.supportedMethods, combinations: data.combinations, customConfigs: data.customConfigs, associatedComponents: data.associatedComponents };
    const result = validateRepaymentMaintenance(payload, data.product);
    if (!result.valid) { setError(result.message ?? '配置校验失败'); message.error(result.message ?? '配置校验失败'); return; }
    setSaving(true); setError('');
    const response = await saveRepaymentConfig(data.product.id, payload);
    setSaving(false);
    if (response.code !== 0) { setError(response.message); message.error(response.message); return; }
    message.success(response.message);
    if (onSaved) onSaved();
    else navigate('/product/list');
  };

  const handleCancel = () => {
    if (onClose) onClose();
    else navigate('/product/list');
  };

  if (loading) return embedded ? <div className="repayment-drawer-loading"><Spin tip="正在加载还款配置..." /></div> : <div className="route-loading"><Spin tip="正在加载还款配置..." /></div>;
  if (!data) return <div className={embedded ? 'repayment-drawer-error' : 'page-container'}><Alert type="error" showIcon message={error || '产品不存在'} action={<Button onClick={() => void load()}>重试</Button>} /></div>;

  const content = <>
    {!embedded && <div className="page-heading"><div><Typography.Title level={3}>还款方式维护</Typography.Title><Typography.Paragraph type="secondary">配置 {data.product.productName}（{data.product.productCode}）的支持方式、还款方案及关联部件</Typography.Paragraph></div><Button onClick={handleCancel}>返回产品列表</Button></div>}
    {error && <Alert type="error" showIcon message={error} closable onClose={() => setError('')} className="page-alert" />}
    <ProductReadonlyInfo data={data} />
    <SupportedRepaymentMethods methods={data.supportedMethods} onAdd={addMethod} onDelete={deleteMethod} onAddPeriod={addPeriod} onDeletePeriod={deletePeriod} />
    {(data.combinations.length > 0 || data.customConfigs.length > 0) && <Card className="form-section-card" title="还款方案详细配置">{data.combinations.map((config) => <CombinationConfigSection key={config.code} config={config} onChange={(next) => setData((old) => old ? { ...old, combinations: old.combinations.map((item) => item.code === next.code ? next : item) } : old)} onReset={() => setData((old) => old ? { ...old, combinations: old.combinations.map((item) => item.code === config.code ? createDefaultCombination(config.code, old.supportedMethods.find((method) => method.code === config.code)?.periods ?? []) : item) } : old)} />)}{data.customConfigs.map((config) => <CustomRepaymentConfigSection key={config.code} config={config} onChange={(next) => setData((old) => old ? { ...old, customConfigs: old.customConfigs.map((item) => item.code === next.code ? next : item) } : old)} />)}</Card>}
    <AssociatedComponents rowNo={data.product.rowNo} methods={data.supportedMethods} rows={data.associatedComponents} onChange={(rows) => setData((old) => old ? { ...old, associatedComponents: rows } : old)} />
  </>;

  const actions = <Card className="form-actions-card repayment-actions"><Button onClick={handleCancel} disabled={saving}>取消</Button><Button type="primary" onClick={() => void save()} loading={saving}>保存配置</Button></Card>;

  if (embedded) return <div className="repayment-maintenance-drawer"><div className="repayment-maintenance-scroll">{content}</div>{actions}</div>;
  return <div className="page-container repayment-maintenance-page">{content}{actions}</div>;
}
