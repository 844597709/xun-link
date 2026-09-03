import { describe, expect, it } from 'vitest';
import type { CombinationConfig, RepaymentStage } from '../../../types';
import { validateCombination, validatePlanRatios, validateStageRanges } from './validation';

const stage = (startPeriod: number, endPeriod: number, principalRatio: number, repaymentMode: '2' | '3' | '4' = '2'): RepaymentStage => ({ id: `${startPeriod}-${endPeriod}`, startPeriod, endPeriod, repaymentMode, principalRatio });
const combination = (code: CombinationConfig['code'], stages: RepaymentStage[]): CombinationConfig => ({ code, name: '测试组合', expanded: true, terms: [{ id: 'term', totalTerm: 12, plans: [{ id: 'plan', planSeq: 1, stages }] }] });

describe('还款方案校验', () => {
  it('接受连续覆盖总期数的阶段', () => expect(validateStageRanges(12, [stage(1, 4, 0), stage(5, 12, 1)]).valid).toBe(true));
  it('拒绝断裂、重叠和越界的区间', () => {
    expect(validateStageRanges(12, [stage(1, 4, 0), stage(6, 12, 1)]).valid).toBe(false);
    expect(validateStageRanges(12, [stage(1, 7, 0), stage(6, 12, 1)]).valid).toBe(false);
    expect(validateStageRanges(12, [stage(1, 4, 0), stage(5, 13, 1)]).valid).toBe(false);
  });
  it('校验本金占比总和及上下限', () => {
    expect(validatePlanRatios([stage(1, 12, 1)]).valid).toBe(true);
    expect(validatePlanRatios([stage(1, 12, 0.6)]).valid).toBe(false);
    expect(validatePlanRatios([stage(1, 12, 1.2)]).valid).toBe(false);
  });
  it('按组合限制内部还款方式', () => {
    expect(validateCombination(combination('10', [stage(1, 6, 0), stage(7, 12, 1, '3')])).valid).toBe(true);
    expect(validateCombination(combination('12', [stage(1, 12, 1, '3')])).valid).toBe(false);
  });
});
