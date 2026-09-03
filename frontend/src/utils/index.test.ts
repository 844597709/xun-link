import { describe, expect, it } from 'vitest';
import { arrayToTree, findMenuPath } from './index';

const items = [
  { id: 1, mpid: '-1', name: '一级' },
  { id: 2, mpid: '1', name: '二级' },
  { id: 3, mpid: '2', name: '三级', route: '/three' },
];

describe('menu utilities', () => {
  it('converts flat menu items to a nested tree without mutating input', () => {
    const tree = arrayToTree(items);
    expect(tree[0].children?.[0].children?.[0].name).toBe('三级');
    expect(items[0]).not.toHaveProperty('children');
  });

  it('finds the selected route and ancestors', () => {
    expect(findMenuPath(items, '/three').map((item) => item.name)).toEqual(['一级', '二级', '三级']);
  });
});
