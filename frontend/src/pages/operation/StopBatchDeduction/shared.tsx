import type { FilterConfig, FilterValue } from '../../../components/Filter';
import {
  stopBatchDeductionFiveLevelCategories,
  stopBatchDeductionFlags,
  stopBatchDeductionInstitutions,
  stopBatchDeductionLoanStatuses,
  stopBatchDeductionOperationTypes,
  stopBatchDeductionProducts,
} from '../../../mock';
import type { StopBatchDeductionFlag, StopBatchDeductionProcessResult } from '../../../types';

const options = (values: string[]) => values.map((value) => ({ label: value, value }));

export const executionFilterConfigs: FilterConfig[] = [
  { key: 'institutionName', label: '机构', type: 'select', options: options(stopBatchDeductionInstitutions), showSearch: true },
  { key: 'customerNo', label: '客户号', type: 'input' },
  { key: 'loanNo', label: '借据号', type: 'input' },
  { key: 'loanStatus', label: '借据状态', type: 'select', options: options(stopBatchDeductionLoanStatuses) },
  { key: 'fiveLevelCategory', label: '五级分类', type: 'select', options: options(stopBatchDeductionFiveLevelCategories) },
  { key: 'impairmentFlag', label: '减值标志', type: 'select', options: options(stopBatchDeductionFlags) },
  { key: 'writeOffFlag', label: '核销标志', type: 'select', options: options(stopBatchDeductionFlags) },
  { key: 'interestStopFlag', label: '停息标志', type: 'select', options: options(stopBatchDeductionFlags) },
  { key: 'stopDeductionFlag', label: '停扣标志', type: 'select', options: options(stopBatchDeductionFlags) },
  { key: 'coreProduct', label: '核心产品', type: 'select', options: options(stopBatchDeductionProducts), showSearch: true },
];

export const detailFilterConfigs: FilterConfig[] = [
  { key: 'institutionName', label: '机构', type: 'select', options: options(stopBatchDeductionInstitutions), showSearch: true },
  { key: 'customerNo', label: '客户号', type: 'input' },
  { key: 'loanNo', label: '借据号', type: 'input' },
  { key: 'operationType', label: '操作类型', type: 'select', options: options(stopBatchDeductionOperationTypes) },
];

export function normalizeFilters(values: Record<string, FilterValue>) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)));
}

export function money(value: number) {
  return `¥${Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function tagColor(value: string) {
  if (value === '成功' || value === '正常' || value === '否') return 'green';
  if (value === '失败' || value === '逾期' || value === '核销' || value === '是') return 'red';
  if (value === '处理中' || value === '关注') return 'blue';
  if (value === '减值' || value === '次级' || value === '可疑') return 'orange';
  return 'default';
}

export function flagValue(value: StopBatchDeductionFlag | StopBatchDeductionProcessResult) {
  return value;
}
