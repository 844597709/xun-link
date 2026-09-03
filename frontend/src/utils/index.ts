import type { MenuItem, MenuNode } from '../types';

export function arrayToTree(items: MenuItem[]): MenuNode[] {
  const nodes = new Map<number, MenuNode>();
  const roots: MenuNode[] = [];

  items.forEach((item) => nodes.set(item.id, { ...item }));
  items.forEach((item) => {
    const node = nodes.get(item.id);
    if (!node) return;
    if (item.mpid === '-1') {
      roots.push(node);
      return;
    }
    const parent = nodes.get(Number(item.mpid));
    if (!parent) {
      roots.push(node);
      return;
    }
    parent.children = parent.children ? [...parent.children, node] : [node];
  });
  return roots;
}

export function findMenuPath(items: MenuItem[], pathname: string): MenuItem[] {
  const current = items
    .filter((item) => item.route)
    .sort((a, b) => (b.route?.length ?? 0) - (a.route?.length ?? 0))
    .find((item) => pathname === item.route || pathname.startsWith(`${item.route}/`));
  if (!current) return [];

  const path: MenuItem[] = [current];
  let parentId = current.mpid;
  while (parentId !== '-1') {
    const parent = items.find((item) => String(item.id) === parentId);
    if (!parent) break;
    path.unshift(parent);
    parentId = parent.mpid;
  }
  return path;
}

export function delay<T>(value: T, min = 300, max = 800): Promise<T> {
  const duration = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => window.setTimeout(() => resolve(value), duration));
}
