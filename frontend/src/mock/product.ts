import type {
  ApiResponse,
  AssociatedComponent,
  CombinationConfig,
  CombinationModeCode,
  CombinationTermConfig,
  CombinationPlan,
  CustomRepaymentConfig,
  ProductEditValues,
  ProductModeCode,
  ProductRecord,
  RepaymentMaintenanceData,
  RepaymentMaintenancePayload,
  RepaymentMethodSummary,
  RepaymentStage,
} from '../types';
import { delay } from '../utils';

export interface ProductListParams {
  page: number;
  pageSize: number;
  institutionName?: string;
  loanType?: string;
  productCode?: string;
}

const respond = <T,>(data: T, message = 'success', code = 0): Promise<ApiResponse<T>> =>
  delay({ code, data, message }, 300, 700);

export const modeNames: Record<ProductModeCode, string> = {
  '2': '先息后本',
  '3': '等额本息',
  '4': '等额本金',
  '5': '自定义还款方式',
  '6': '等额本息或等额本金',
  '7': '等额本金或等额本金',
  '8': '自定义还款方式',
  '10': '先息后本等额本息组合',
  '11': '先息后本等额本金组合',
  '12': '按月付息按计划还款',
};

export const productModeOptions = (Object.entries(modeNames) as [ProductModeCode, string][])
  .map(([value, label]) => ({ value, label: `${value}-${label}` }));

export const loanTypeOptions = ['信用类', '抵押类', '经营类', '消费类'].map((value) => ({ label: value, value }));
export const institutionOptions = ['华北分行', '华东分行', '华南分行', '西南分行'].map((value) => ({ label: value, value }));
export const creditTypeOptions = ['循环额度', '一次性额度'].map((value) => ({ label: value, value }));

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return { list: items.slice(start, start + pageSize), total: items.length, page: safePage, pagesize: pageSize };
}

function stage(id: string, startPeriod: number, endPeriod: number, repaymentMode: '2' | '3' | '4', principalRatio: number): RepaymentStage {
  return { id, startPeriod, endPeriod, repaymentMode, principalRatio };
}

function plan(id: string, planSeq: number, stages: RepaymentStage[]): CombinationPlan {
  return { id, planSeq, stages };
}

function termConfig(code: CombinationModeCode, totalTerm: number): CombinationTermConfig {
  const split = Math.max(1, Math.floor(totalTerm / 3));
  const secondMode = code === '10' ? '3' : code === '11' ? '4' : '2';
  return {
    id: `${code}-${totalTerm}`,
    totalTerm,
    plans: [plan(`${code}-${totalTerm}-A`, 1, [
      stage(`${code}-${totalTerm}-A-1`, 1, split, '2', 0),
      stage(`${code}-${totalTerm}-A-2`, split + 1, totalTerm, secondMode, 1),
    ])],
  };
}

function combination(code: CombinationModeCode, periods: number[]): CombinationConfig {
  return {
    code,
    name: modeNames[code],
    expanded: true,
    terms: periods.map((period) => termConfig(code, period)),
  };
}

function customConfig(code: '5' | '6' | '7' | '8', periods: number[]): CustomRepaymentConfig {
  return {
    code,
    name: modeNames[code],
    expanded: true,
    interestCycle: '按月付息',
    principalCycle: '按月还本',
    ratios: code === '6'
      ? [{ id: `${code}-1`, term: periods[0] ?? 12, ratio: 20 }, { id: `${code}-2`, term: periods[1] ?? 24, ratio: 80 }]
      : code === '7' || code === '8'
        ? [{ id: `${code}-1`, ratio: 30 }, { id: `${code}-2`, ratio: 70 }]
        : [],
  };
}

function associatedComponents(product: ProductRecord): AssociatedComponent[] {
  return product.repaymentMethods.map((method, index) => ({
    id: `${product.id}-${method.code}`,
    repaymentModeCode: method.code,
    repaymentModeName: method.name,
    releaseComponent: index % 2 === 0 ? '放款组件A' : '放款组件B',
    repaymentComponent: index % 2 === 0 ? '还款组件A' : '还款组件B',
    interestComponent: index % 2 === 0 ? '计息组件A' : '计息组件B',
    editable: product.rowNo === 3 && index === 0 ? false : product.rowNo === 2,
  }));
}

function methods(entries: Array<[ProductModeCode, number[]]>): RepaymentMethodSummary[] {
  return entries.map(([code, periods]) => ({ code, name: modeNames[code], periods }));
}

export const products: ProductRecord[] = Array.from({ length: 24 }, (_, index) => {
  const rowNo = (index % 3) + 1 as 1 | 2 | 3;
  const defaultMethods: Array<[ProductModeCode, number[]]> = rowNo === 1
    ? [['2', [6, 12, 24, 36]]]
    : rowNo === 2
      ? [['2', [6, 12, 24, 36]], ['10', [12, 24, 36]], ['5', [12, 24]]]
      : [['3', [12, 24, 36]], ['11', [12, 24, 36]], ['12', [12, 24, 48]], ['7', [12, 24]]];
  return {
    id: index + 1,
    rowNo,
    institutionCode: `ORG${String((index % 4) + 1).padStart(3, '0')}`,
    institutionName: ['华北分行', '华东分行', '华南分行', '西南分行'][index % 4],
    productCode: `PRD${String(2026001 + index)}`,
    productName: ['普惠经营贷', '安心消费贷', '小微周转贷', '安居抵押贷'][index % 4],
    loanType: ['信用类', '经营类', '消费类', '抵押类'][index % 4],
    loanSubType: ['个人经营贷款', '小微企业贷款', '个人消费贷款', '住房抵押贷款'][index % 4],
    creditType: index % 2 === 0 ? '循环额度' : '一次性额度',
    maxCreditLimit: 300000 + (index % 6) * 100000,
    normalRateMin: 3.6 + (index % 3) * 0.2,
    normalRateMax: 5.8 + (index % 4) * 0.3,
    repaymentMethods: methods(defaultMethods),
  };
});

const maintenanceMap = new Map<number, RepaymentMaintenanceData>();

function buildMaintenance(product: ProductRecord): RepaymentMaintenanceData {
  const periodsByCode = new Map(product.repaymentMethods.map((item) => [item.code, item.periods]));
  const combinations = (['10', '11', '12'] as CombinationModeCode[])
    .filter((code) => periodsByCode.has(code))
    .map((code) => combination(code, periodsByCode.get(code) ?? []));
  const customConfigs = (['5', '6', '7', '8'] as const)
    .filter((code) => periodsByCode.has(code))
    .map((code) => customConfig(code, periodsByCode.get(code) ?? []));
  return {
    product: clone(product),
    supportedMethods: clone(product.repaymentMethods),
    combinations,
    customConfigs,
    associatedComponents: product.rowNo === 1 ? [] : associatedComponents(product),
  };
}

products.forEach((product) => maintenanceMap.set(product.id, buildMaintenance(product)));

export async function getProducts(params: ProductListParams) {
  const institutionName = String(params.institutionName ?? '').trim().toLowerCase();
  const loanType = String(params.loanType ?? '');
  const productCode = String(params.productCode ?? '').trim().toLowerCase();
  const filtered = products.filter((item) =>
    (!institutionName || item.institutionName.toLowerCase().includes(institutionName)) &&
    (!loanType || item.loanType === loanType) &&
    (!productCode || item.productCode.toLowerCase().includes(productCode)),
  );
  return respond(paginate(filtered.map(clone), Number(params.page), Number(params.pageSize)));
}

export async function getProductDetail(id: number): Promise<ApiResponse<RepaymentMaintenanceData>> {
  const data = maintenanceMap.get(id);
  if (!data) return respond({} as RepaymentMaintenanceData, '产品不存在', 1);
  return respond(clone(data));
}

export async function updateProduct(id: number, values: ProductEditValues): Promise<ApiResponse<ProductRecord>> {
  const product = products.find((item) => item.id === id);
  if (!product) return respond({} as ProductRecord, '产品不存在', 1);
  if (!values.productName.trim()) return respond({} as ProductRecord, '产品名称不能为空', 1);
  if (!Number.isFinite(values.maxCreditLimit) || values.maxCreditLimit <= 0) return respond({} as ProductRecord, '客户最大授信额度必须大于0', 1);
  Object.assign(product, { ...values, productName: values.productName.trim() });
  const existing = maintenanceMap.get(id);
  if (existing) existing.product = clone(product);
  return respond(clone(product), '产品信息保存成功');
}

function validPayload(payload: RepaymentMaintenancePayload) {
  return payload.supportedMethods.length > 0 &&
    payload.combinations.every((config) => config.terms.every((term) => term.plans.every((item) => item.stages.every((item) => ['2', '3', '4'].includes(item.repaymentMode)))));
}

export async function saveRepaymentConfig(id: number, payload: RepaymentMaintenancePayload): Promise<ApiResponse<null>> {
  if (!maintenanceMap.has(id)) return respond(null, '产品不存在', 1);
  if (!validPayload(payload)) return respond(null, '还款方式配置不合法', 1);
  const data = maintenanceMap.get(id)!;
  data.supportedMethods = clone(payload.supportedMethods);
  data.combinations = clone(payload.combinations);
  data.customConfigs = clone(payload.customConfigs);
  data.associatedComponents = clone(payload.associatedComponents);
  const product = products.find((item) => item.id === id);
  if (product) product.repaymentMethods = clone(payload.supportedMethods);
  return respond(null, '还款方式配置保存成功');
}
