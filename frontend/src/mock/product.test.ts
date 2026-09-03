import { describe, expect, it } from 'vitest';
import { getProductDetail, getProducts, products, saveRepaymentConfig } from './product';

describe('产品 Mock 服务', () => {
  it('支持分页和机构模糊检索', async () => {
    const response = await getProducts({ page: 1, pageSize: 5, institutionName: '华北' });
    expect(response.code).toBe(0);
    expect(response.data.list.length).toBeLessThanOrEqual(5);
    expect(response.data.list.every((item) => item.institutionName.includes('华北'))).toBe(true);
  });

  it('支持贷款类型和产品号组合筛选', async () => {
    const source = products[0];
    const response = await getProducts({ page: 1, pageSize: 10, loanType: source.loanType, productCode: source.productCode.slice(-3) });
    expect(response.data.list.length).toBeGreaterThan(0);
    expect(response.data.list.every((item) => item.loanType === source.loanType && item.productCode.includes(source.productCode.slice(-3)))).toBe(true);
  });

  it('详情返回独立副本且包含行差异配置', async () => {
    const first = await getProductDetail(1);
    const second = await getProductDetail(2);
    const third = await getProductDetail(3);
    expect(first.data.associatedComponents).toHaveLength(0);
    expect(second.data.associatedComponents.length).toBeGreaterThan(0);
    expect(third.data.associatedComponents.length).toBeGreaterThan(0);
    expect(first.data).not.toBe((await getProductDetail(1)).data);
  });

  it('保存维护配置后可以重新读取', async () => {
    const current = await getProductDetail(1);
    const methods = [...current.data.supportedMethods, { code: '3' as const, name: '等额本息', periods: [12] }];
    const response = await saveRepaymentConfig(1, {
      supportedMethods: methods,
      combinations: current.data.combinations,
      customConfigs: current.data.customConfigs,
      associatedComponents: [],
    });
    expect(response.code).toBe(0);
    const next = await getProductDetail(1);
    expect(next.data.supportedMethods.some((item) => item.code === '3')).toBe(true);
  });
});
