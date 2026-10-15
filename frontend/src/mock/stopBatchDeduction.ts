import type {
  ApiResponse,
  ListData,
  StopBatchDeductionDetailParams,
  StopBatchDeductionExecutionRecord,
  StopBatchDeductionFiveLevelCategory,
  StopBatchDeductionFlag,
  StopBatchDeductionHistoryRecord,
  StopBatchDeductionListParams,
  StopBatchDeductionLoanStatus,
  StopBatchDeductionOperationType,
  StopBatchDeductionProcessResult,
  StopBatchDeductionProcessStatus,
  StopBatchDeductionRecoveryConfig,
  StopBatchDeductionRecoveryStrategy,
  StopBatchDeductionRestoreParams,
  StopBatchDeductionRestoreResult,
  StopBatchDeductionSubmitParams,
  StopBatchDeductionSubmitResult,
} from '../types';
import { delay } from '../utils';

const respond = <T,>(data: T, message = 'success', code = 0): Promise<ApiResponse<T>> =>
  delay({ code, data, message }, 300, 800);

export const stopBatchDeductionInstitutions = ['北京分行', '上海分行', '广州分行', '深圳分行'];
export const stopBatchDeductionProducts = ['个人经营贷', '个人消费贷', '住房按揭贷', '小微企业贷'];
export const stopBatchDeductionLoanStatuses: StopBatchDeductionLoanStatus[] = ['正常', '逾期', '减值', '核销'];
export const stopBatchDeductionFiveLevelCategories: StopBatchDeductionFiveLevelCategory[] = ['正常', '关注', '次级', '可疑', '损失'];
export const stopBatchDeductionFlags: StopBatchDeductionFlag[] = ['是', '否'];
export const stopBatchDeductionProcessResults: StopBatchDeductionProcessResult[] = ['成功', '失败'];
export const stopBatchDeductionProcessStatuses: StopBatchDeductionProcessStatus[] = ['成功', '失败', '处理中'];
export const stopBatchDeductionOperationTypes: StopBatchDeductionOperationType[] = ['停止批扣', '恢复批扣'];
export const stopBatchDeductionRecoveryStrategies: StopBatchDeductionRecoveryStrategy[] = ['手动恢复', '固定日期恢复', '固定天数恢复', '还款日恢复'];

function todayString() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const defaultRecoveryConfig: StopBatchDeductionRecoveryConfig = { recoveryStrategy: '手动恢复' };

function validateRecoveryConfig(config: StopBatchDeductionRecoveryConfig): string {
  if (!stopBatchDeductionRecoveryStrategies.includes(config.recoveryStrategy)) return '恢复批扣策略无效';
  if (config.recoveryStrategy === '固定日期恢复') {
    if (!config.recoveryDate) return '请选择恢复批扣日期';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(config.recoveryDate) || config.recoveryDate < todayString()) return '恢复批扣日期不可早于当日';
    if (config.recoveryDays !== undefined) return '固定日期恢复不可填写恢复批扣天数';
  }
  if (config.recoveryStrategy === '固定天数恢复') {
    if (!Number.isInteger(config.recoveryDays) || (config.recoveryDays ?? 0) <= 0) return '恢复批扣天数必须为正整数';
    if (config.recoveryDate !== undefined) return '固定天数恢复不可填写恢复批扣日期';
  }
  if (config.recoveryStrategy !== '固定日期恢复' && config.recoveryDate !== undefined) return '当前策略不可填写恢复批扣日期';
  if (config.recoveryStrategy !== '固定天数恢复' && config.recoveryDays !== undefined) return '当前策略不可填写恢复批扣天数';
  return '';
}

function paginate<T>(items: T[], page: number, pageSize: number): ListData<T> {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(1, Number(pageSize) || 10);
  const start = (safePage - 1) * safePageSize;
  return { list: items.slice(start, start + safePageSize), total: items.length, page: safePage, pagesize: safePageSize };
}

function dateFor(index: number) {
  return `2026-${String((index % 8) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`;
}

function dateTimeFor(index: number) {
  return `${dateFor(index)} ${String(9 + (index % 8)).padStart(2, '0')}:${String((index * 7) % 60).padStart(2, '0')}:00`;
}

function institutionFor(index: number) {
  return { code: `20${String((index % stopBatchDeductionInstitutions.length) + 1).padStart(2, '0')}`, name: stopBatchDeductionInstitutions[index % stopBatchDeductionInstitutions.length] };
}

const initiallyRestoredLoanIds = new Set([21, 31]);

const initialExecutions: StopBatchDeductionExecutionRecord[] = Array.from({ length: 36 }, (_, index) => {
  const institution = institutionFor(index);
  const loanAmount = 60000 + index * 8500;
  const initiallyRestored = initiallyRestoredLoanIds.has(index + 1);
  return {
    id: index + 1,
    institutionCode: institution.code,
    institutionName: institution.name,
    legalEntityCode: `${institution.code}法人`,
    legalEntityName: `${institution.name}法人机构`,
    customerNo: `C${String(index + 1).padStart(5, '0')}`,
    customerName: ['张三', '李四', '王五', '赵六', '陈晓'][index % 5],
    loanNo: `DK2024${String(index + 1).padStart(6, '0')}`,
    loanAmount,
    loanBalance: Math.round(loanAmount * (0.35 + (index % 5) * 0.08) * 100) / 100,
    loanStatus: stopBatchDeductionLoanStatuses[index % stopBatchDeductionLoanStatuses.length],
    fiveLevelCategory: stopBatchDeductionFiveLevelCategories[index % stopBatchDeductionFiveLevelCategories.length],
    impairmentFlag: index % 4 === 0 ? '是' : '否',
    writeOffFlag: index % 9 === 0 ? '是' : '否',
    interestStopFlag: !initiallyRestored && index % 10 === 0 ? '是' : '否',
    stopDeductionFlag: !initiallyRestored && index % 10 === 0 ? '是' : '否',
    coreProduct: stopBatchDeductionProducts[index % stopBatchDeductionProducts.length],
  };
});

export const stopBatchDeductionExecutions = initialExecutions.map((record) => ({ ...record }));
let historyIdSeed = 1000;
export const stopBatchDeductionHistories: StopBatchDeductionHistoryRecord[] = [];

function createHistory(
  record: StopBatchDeductionExecutionRecord,
  batchNo: string,
  operationType: StopBatchDeductionOperationType,
  processResult: StopBatchDeductionProcessResult,
  statusRemark: string,
  index: number,
  recovery: StopBatchDeductionRecoveryConfig = defaultRecoveryConfig,
): StopBatchDeductionHistoryRecord {
  const processStatus: StopBatchDeductionProcessStatus = processResult;
  return {
    ...record,
    historyId: historyIdSeed++,
    loanId: record.id,
    batchNo,
    operationType,
    ...(operationType === '停止批扣' ? { stopTime: dateTimeFor(index) } : { restoreTime: dateTimeFor(index) }),
    operator: '运营专员',
    processStatus,
    statusRemark,
    processResult,
    resultMessage: statusRemark,
    recoveryStrategy: recovery.recoveryStrategy,
    ...(recovery.recoveryDate ? { recoveryDate: recovery.recoveryDate } : {}),
    ...(recovery.recoveryDays !== undefined ? { recoveryDays: recovery.recoveryDays } : {}),
  };
}

function addInitialHistory(record: StopBatchDeductionExecutionRecord, index: number) {
  if (record.interestStopFlag === '是') {
    stopBatchDeductionHistories.push(createHistory(record, `STOP-20261013-${String(index + 1).padStart(4, '0')}`, '停止批扣', '成功', '停扣成功', index));
  } else if (initiallyRestoredLoanIds.has(record.id)) {
    stopBatchDeductionHistories.push(createHistory(record, `RESTORE-20261013-${String(index + 1).padStart(4, '0')}`, '恢复批扣', '成功', '恢复批扣成功', index));
  }
}

stopBatchDeductionExecutions.forEach(addInitialHistory);

const contains = (value: unknown, source: string) => !String(value ?? '').trim() || source.toLowerCase().includes(String(value).trim().toLowerCase());
const equals = (value: unknown, source: string) => !String(value ?? '').trim() || source.toLowerCase() === String(value).trim().toLowerCase();
function matchesExecution(item: StopBatchDeductionExecutionRecord | StopBatchDeductionHistoryRecord, params: StopBatchDeductionListParams) {
  return contains(params.institutionName, item.institutionName) &&
    equals(params.customerNo, item.customerNo) && contains(params.loanNo, item.loanNo) &&
    (!params.loanStatus || item.loanStatus === params.loanStatus) &&
    (!params.fiveLevelCategory || item.fiveLevelCategory === params.fiveLevelCategory) &&
    (!params.impairmentFlag || item.impairmentFlag === params.impairmentFlag) &&
    (!params.writeOffFlag || item.writeOffFlag === params.writeOffFlag) &&
    (!params.interestStopFlag || item.interestStopFlag === params.interestStopFlag) &&
    (!params.stopDeductionFlag || item.stopDeductionFlag === params.stopDeductionFlag) &&
    contains(params.coreProduct, item.coreProduct);
}

function matchesDetail(item: StopBatchDeductionHistoryRecord, params: StopBatchDeductionDetailParams) {
  return contains(params.institutionName, item.institutionName) &&
    equals(params.customerNo, item.customerNo) &&
    contains(params.loanNo, item.loanNo) &&
    (!params.operationType || item.operationType === params.operationType);
}

export async function getStopBatchDeductionExecutions(params: StopBatchDeductionListParams): Promise<ApiResponse<ListData<StopBatchDeductionExecutionRecord>>> {
  return respond(paginate(stopBatchDeductionExecutions.filter((item) => matchesExecution(item, params)), params.page, params.pageSize));
}

export async function getStopBatchDeductionDetails(params: StopBatchDeductionDetailParams): Promise<ApiResponse<ListData<StopBatchDeductionHistoryRecord>>> {
  const filtered = stopBatchDeductionHistories.filter((item) => matchesDetail(item, params) &&
    contains(params.operator, item.operator) &&
    (!params.processResult || item.processResult === params.processResult));
  return respond(paginate(filtered, params.page, params.pageSize));
}

export async function stopBatchDeduction(input: number[] | StopBatchDeductionSubmitParams): Promise<ApiResponse<StopBatchDeductionSubmitResult | null>> {
  await delay(null, 400, 700);
  const params: StopBatchDeductionSubmitParams = Array.isArray(input) ? { ids: input, ...defaultRecoveryConfig } : input;
  if (!params.ids.length) return { code: 1, data: null, message: '请选择至少一笔借据' };
  const recoveryError = validateRecoveryConfig(params);
  if (recoveryError) return { code: 1, data: null, message: recoveryError };
  const batchNo = `STOP-${Date.now()}`;
  const successIds: number[] = [];
  const failedIds: number[] = [];
  const results: StopBatchDeductionSubmitResult['results'] = [];
  params.ids.forEach((id, index) => {
    const record = stopBatchDeductionExecutions.find((item) => item.id === id);
    if (!record) {
      failedIds.push(id);
      results.push({ loanId: id, processResult: '失败', message: '借据不存在' });
      return;
    }
    if (record.stopDeductionFlag === '是') {
      failedIds.push(id);
      const history = createHistory(record, batchNo, '停止批扣', '失败', '该借据已停止批扣', index, params);
      stopBatchDeductionHistories.push(history);
      results.push({ loanId: id, processResult: '失败', message: history.resultMessage, historyId: history.historyId });
      return;
    }
    record.interestStopFlag = '是';
    record.stopDeductionFlag = '是';
    successIds.push(id);
    const history = createHistory(record, batchNo, '停止批扣', '成功', '停扣成功', index, params);
    stopBatchDeductionHistories.push(history);
    results.push({ loanId: id, processResult: '成功', message: history.resultMessage, historyId: history.historyId });
  });
  return {
    code: 0,
    data: {
      batchNo,
      successIds,
      failedIds,
      results,
      recoveryStrategy: params.recoveryStrategy,
      ...(params.recoveryDate ? { recoveryDate: params.recoveryDate } : {}),
      ...(params.recoveryDays !== undefined ? { recoveryDays: params.recoveryDays } : {}),
    },
    message: failedIds.length ? '部分借据停扣失败' : `已成功停止 ${successIds.length} 笔批扣`,
  };
}

export async function restoreBatchDeduction(input: number[] | StopBatchDeductionRestoreParams): Promise<ApiResponse<StopBatchDeductionRestoreResult | null>> {
  await delay(null, 400, 700);
  const ids = Array.isArray(input) ? input : input.ids;
  if (!ids.length) return { code: 1, data: null, message: '请选择至少一笔借据' };
  const batchNo = `RESTORE-${Date.now()}`;
  const successIds: number[] = [];
  const failedIds: number[] = [];
  const results: StopBatchDeductionRestoreResult['results'] = [];
  ids.forEach((id, index) => {
    const record = stopBatchDeductionExecutions.find((item) => item.id === id);
    if (!record) {
      failedIds.push(id);
      results.push({ loanId: id, processResult: '失败', message: '借据不存在' });
      return;
    }
    if (record.stopDeductionFlag !== '是') {
      failedIds.push(id);
      const history = createHistory(record, batchNo, '恢复批扣', '失败', '该借据当前未停止批扣', index);
      stopBatchDeductionHistories.push(history);
      results.push({ loanId: id, processResult: '失败', message: history.resultMessage, historyId: history.historyId });
      return;
    }
    record.interestStopFlag = '否';
    record.stopDeductionFlag = '否';
    stopBatchDeductionHistories.forEach((history) => {
      if (history.loanId === id) {
        history.interestStopFlag = '否';
        history.stopDeductionFlag = '否';
      }
    });
    const history = createHistory(record, batchNo, '恢复批扣', '成功', '恢复批扣成功', index);
    stopBatchDeductionHistories.push(history);
    successIds.push(id);
    results.push({ loanId: id, processResult: '成功', message: history.resultMessage, historyId: history.historyId });
  });
  return {
    code: 0,
    data: { successIds, failedIds, results },
    message: failedIds.length ? '部分借据恢复批扣失败' : `已成功恢复 ${successIds.length} 笔批扣`,
  };
}

export function resetStopBatchDeductionMock() {
  stopBatchDeductionExecutions.splice(0, stopBatchDeductionExecutions.length, ...initialExecutions.map((record) => ({ ...record })));
  stopBatchDeductionHistories.splice(0, stopBatchDeductionHistories.length);
  historyIdSeed = 1000;
  stopBatchDeductionExecutions.forEach(addInitialHistory);
}
