import { describe, expect, it } from 'vitest';
import { iconMap } from './icons';
import { menuItems } from './menus';
import { arrayToTree, findMenuPath } from '../utils';

const requestedRoutes = [
  '/welcome',
  '/post-loan/agility-request', '/post-loan/agility-detail',
  '/post-loan/debt-request', '/post-loan/debt-detail',
  '/post-loan/litigation-execution', '/post-loan/litigation-detail',
  '/post-loan/extension-request', '/post-loan/extension-detail',
  '/post-loan/adjust-request', '/post-loan/adjust-detail',
  '/operation/manual-repayment', '/product/list',
  '/operation/interest-rule', '/operation/interest-agreement', '/operation/interest-flow',
  '/operation/interest-system-verify', '/operation/interest-verify',
  '/operation/loan-interest', '/operation/consume-interest',
  '/operation/stop-batch-deduction/execution', '/operation/stop-batch-deduction/detail',
  '/approval/pending', '/bank-login/agility-sign', '/bank-login/debt-sign',
  '/bank-login/combo-repayment-withdrawal', '/bank-login/consume-interest', '/bank-login/cross-year-interest',
];

describe('application menu configuration', () => {
  it('contains the requested three-level hierarchy', () => {
    const tree = arrayToTree(menuItems);
    expect(tree.map((item) => item.name)).toEqual([
      '欢迎页', '贷后纾困', '运营管理', '审批管理', '银行宝签约',
    ]);
    expect(tree[1].children?.map((item) => item.name)).toEqual(['灵动重组', '债务重组', '诉讼回款', '延展期', '在贷要素调整']);
    expect(tree[1].children?.[0].children?.map((item) => item.name)).toEqual(['调整申请', '调整明细']);
    expect(tree[1].children?.[4].children?.map((item) => item.name)).toEqual(['调整申请', '调整明细']);
    expect(tree[2].children?.[1].children?.[0].name).toBe('产品信息列表');
    expect(tree[2].children?.[2].children?.map((item) => item.name)).toEqual([
      '贴息规则配置', '协议签署', '贴息流水', '系统核定', '贴息核定', '贷款贴息', '消费贴息',
    ]);
    expect(tree[2].children?.[3].name).toBe('批扣操作');
    expect(tree[2].children?.[3].children?.map((item) => item.name)).toEqual(['批扣操作执行', '批扣操作明细']);
    expect(tree[4].children?.map((item) => item.name)).toEqual([
      '灵动重组签约', '债务重组签约', '组合还款提现', '消费贷款贴息', '跨年财政贴息',
    ]);
  });

  it('has unique routes and complete icon coverage', () => {
    const routes = menuItems.flatMap((item) => item.route ? [item.route] : []);
    expect(routes).toEqual(requestedRoutes);
    expect(new Set(routes).size).toBe(routes.length);
    expect(menuItems.every((item) => item.icon && iconMap[item.icon])).toBe(true);
  });

  it('returns all ancestors for a third-level page', () => {
    expect(findMenuPath(menuItems, '/operation/interest-system-verify').map((item) => item.name)).toEqual([
      '运营管理', '贴息管理', '系统核定',
    ]);
    expect(findMenuPath(menuItems, '/operation/stop-batch-deduction/execution').map((item) => item.name)).toEqual([
      '运营管理', '批扣操作', '批扣操作执行',
    ]);
  });
});
