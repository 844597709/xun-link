export type StopBatchDeductionFlag = '是' | '否';
export type StopBatchDeductionLoanStatus = '正常' | '逾期' | '减值' | '核销';
export type StopBatchDeductionFiveLevelCategory = '正常' | '关注' | '次级' | '可疑' | '损失';
export type StopBatchDeductionProcessResult = '成功' | '失败';
export type StopBatchDeductionProcessStatus = '成功' | '失败' | '处理中';
export type StopBatchDeductionOperationType = '停止批扣' | '恢复批扣';
export type StopBatchDeductionRecoveryStrategy = '手动恢复' | '固定日期恢复' | '固定天数恢复' | '还款日恢复';

export interface StopBatchDeductionRecoveryConfig {
  recoveryStrategy: StopBatchDeductionRecoveryStrategy;
  recoveryDate?: string;
  recoveryDays?: number;
}

export interface StopBatchDeductionSubmitParams extends StopBatchDeductionRecoveryConfig {
  ids: number[];
}

export interface StopBatchDeductionExecutionRecord {
  id: number;
  institutionCode: string;
  institutionName: string;
  legalEntityCode: string;
  legalEntityName: string;
  customerNo: string;
  customerName: string;
  loanNo: string;
  loanAmount: number;
  loanBalance: number;
  loanStatus: StopBatchDeductionLoanStatus;
  fiveLevelCategory: StopBatchDeductionFiveLevelCategory;
  impairmentFlag: StopBatchDeductionFlag;
  writeOffFlag: StopBatchDeductionFlag;
  interestStopFlag: StopBatchDeductionFlag;
  stopDeductionFlag: StopBatchDeductionFlag;
  coreProduct: string;
}

export interface StopBatchDeductionListParams {
  page: number;
  pageSize: number;
  institutionName?: string;
  customerNo?: string;
  loanNo?: string;
  loanStatus?: StopBatchDeductionLoanStatus;
  fiveLevelCategory?: StopBatchDeductionFiveLevelCategory;
  impairmentFlag?: StopBatchDeductionFlag;
  writeOffFlag?: StopBatchDeductionFlag;
  interestStopFlag?: StopBatchDeductionFlag;
  stopDeductionFlag?: StopBatchDeductionFlag;
  coreProduct?: string;
}

export interface StopBatchDeductionHistoryRecord extends Omit<StopBatchDeductionExecutionRecord, 'id'> {
  historyId: number;
  loanId: number;
  batchNo: string;
  operationType: StopBatchDeductionOperationType;
  stopTime?: string;
  restoreTime?: string;
  operator: string;
  processStatus: StopBatchDeductionProcessStatus;
  statusRemark: string;
  /** 兼容既有提交结果和筛选调用。 */
  processResult: StopBatchDeductionProcessResult;
  resultMessage: string;
  recoveryStrategy: StopBatchDeductionRecoveryStrategy;
  recoveryDate?: string;
  recoveryDays?: number;
}

export interface StopBatchDeductionDetailParams {
  page: number;
  pageSize: number;
  institutionName?: string;
  customerNo?: string;
  loanNo?: string;
  operationType?: StopBatchDeductionOperationType;
  /** @deprecated 明细页面已不再提供停止时间筛选，保留参数兼容旧调用。 */
  stopTime?: unknown;
  operator?: string;
  processResult?: StopBatchDeductionProcessResult;
}

export interface StopBatchDeductionSubmitItem {
  loanId: number;
  processResult: StopBatchDeductionProcessResult;
  message: string;
  historyId?: number;
}

export interface StopBatchDeductionSubmitResult {
  batchNo: string;
  successIds: number[];
  failedIds: number[];
  results: StopBatchDeductionSubmitItem[];
  recoveryStrategy: StopBatchDeductionRecoveryStrategy;
  recoveryDate?: string;
  recoveryDays?: number;
}

export interface StopBatchDeductionRestoreParams {
  ids: number[];
}

export interface StopBatchDeductionRestoreResult {
  successIds: number[];
  failedIds: number[];
  results: StopBatchDeductionSubmitItem[];
}
