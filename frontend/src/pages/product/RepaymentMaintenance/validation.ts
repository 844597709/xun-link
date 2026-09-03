import type {
  CombinationConfig,
  CombinationModeCode,
  ProductRecord,
  RepaymentMaintenancePayload,
  RepaymentStage,
} from '../../../types';

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

const combinationModes: Record<CombinationModeCode, string[]> = {
  '10': ['2', '3'],
  '11': ['2', '4'],
  '12': ['2'],
};

const pass = (): ValidationResult => ({ valid: true });
const fail = (message: string): ValidationResult => ({ valid: false, message });

export function validatePeriods(periods: number[]): ValidationResult {
  if (!periods.length) return fail('至少配置一个贷款期数');
  if (periods.some((period) => !Number.isInteger(period) || period <= 0)) return fail('贷款期数必须为正整数');
  if (new Set(periods).size !== periods.length) return fail('同一还款方式的期数不能重复');
  return pass();
}

export function validateStageRanges(totalTerm: number, stages: RepaymentStage[]): ValidationResult {
  if (!stages.length) return fail(`${totalTerm}期方案至少需要一个阶段`);
  let expectedStart = 1;
  for (const [index, item] of stages.entries()) {
    if (!Number.isInteger(item.startPeriod) || !Number.isInteger(item.endPeriod)) return fail(`阶段${index + 1}的期数必须为整数`);
    if (item.startPeriod !== expectedStart) return fail(`阶段${index + 1}区间断裂，应从第${expectedStart}期开始`);
    if (item.startPeriod > item.endPeriod) return fail(`阶段${index + 1}的起始期数不能大于结束期数`);
    if (item.endPeriod > totalTerm) return fail(`阶段${index + 1}不能超过总期数${totalTerm}期`);
    expectedStart = item.endPeriod + 1;
  }
  if (expectedStart - 1 !== totalTerm) return fail(`阶段区间必须连续覆盖1-${totalTerm}期`);
  return pass();
}

export function validatePlanRatios(stages: RepaymentStage[]): ValidationResult {
  if (stages.some((item) => !Number.isFinite(item.principalRatio) || item.principalRatio < 0 || item.principalRatio > 1)) {
    return fail('本金占比必须在0%至100%之间');
  }
  const total = stages.reduce((sum, item) => sum + item.principalRatio, 0);
  return Math.abs(total - 1) < 0.0001 ? pass() : fail(`本金占比合计为${(total * 100).toFixed(2)}%，必须等于100%`);
}

export function validateCombination(config: CombinationConfig): ValidationResult {
  const allowedModes = combinationModes[config.code];
  for (const term of config.terms) {
    if (!term.plans.length) return fail(`${config.name} ${term.totalTerm}期至少需要一个还款方案`);
    for (const [planIndex, plan] of term.plans.entries()) {
      const rangeResult = validateStageRanges(term.totalTerm, plan.stages);
      if (!rangeResult.valid) return fail(`${config.name} 方案${String.fromCharCode(65 + planIndex)}：${rangeResult.message}`);
      const ratioResult = validatePlanRatios(plan.stages);
      if (!ratioResult.valid) return fail(`${config.name} 方案${String.fromCharCode(65 + planIndex)}：${ratioResult.message}`);
      if (plan.stages.some((stage) => !allowedModes.includes(stage.repaymentMode))) {
        return fail(`${config.name}阶段还款方式超出该组合允许范围`);
      }
    }
  }
  return pass();
}

export function validateRepaymentMaintenance(
  payload: RepaymentMaintenancePayload,
  product?: Pick<ProductRecord, 'rowNo'>,
): ValidationResult {
  if (!payload.supportedMethods.length) return fail('至少保留一种还款方式');
  for (const method of payload.supportedMethods) {
    const periodResult = validatePeriods(method.periods);
    if (!periodResult.valid) return fail(`${method.name}：${periodResult.message}`);
  }
  const codes = new Set(payload.supportedMethods.map((item) => item.code));
  if (new Set(payload.supportedMethods.map((item) => item.code)).size !== payload.supportedMethods.length) return fail('还款方式不能重复');
  for (const combination of payload.combinations) {
    if (!codes.has(combination.code)) return fail(`组合方式${combination.code}未在支持的还款方式中配置`);
    const result = validateCombination(combination);
    if (!result.valid) return result;
  }
  for (const custom of payload.customConfigs) {
    if (!codes.has(custom.code)) return fail(`自定义方式${custom.code}未在支持的还款方式中配置`);
    if (custom.code === '6' && custom.ratios.some((item) => !Number.isInteger(item.term) || (item.term ?? 0) <= 0)) return fail('方式6的贷款参考期数必须为正整数');
    if (custom.ratios.some((item) => !Number.isFinite(item.ratio) || item.ratio < 0 || item.ratio > 100)) return fail(`方式${custom.code}的比例必须在0%至100%之间`);
  }
  if (product && product.rowNo > 1) {
    if (payload.associatedComponents.length !== payload.supportedMethods.length) return fail('每个还款方式都必须配置关联部件');
    if (payload.associatedComponents.some((item) => !item.releaseComponent || !item.repaymentComponent || !item.interestComponent)) return fail('关联部件不能为空');
  }
  return pass();
}
