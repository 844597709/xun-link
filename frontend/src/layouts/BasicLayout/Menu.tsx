import { useEffect, useRef, type ReactNode } from 'react';
import { Menu as AntMenu } from 'antd';
import type { MenuProps } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { arrayToTree, findMenuPath } from '../../utils';
import { menuItems } from '../../config/menus';
import { iconMap } from '../../config/icons';
import { useAppContext } from '../../context/AppContext';
import type { MenuNode } from '../../types';

function renderIcon(name?: string) {
  const Icon = name ? iconMap[name] : undefined;
  return Icon ? <Icon /> : null;
}

function LongPressLabel({ children }: { children: ReactNode }) {
  const timer = useRef<number>();
  const clearTimer = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = undefined;
  };
  useEffect(() => clearTimer, []);
  return <span
    onPointerDown={() => { clearTimer(); timer.current = window.setTimeout(() => { window.dispatchEvent(new Event('clear')); clearTimer(); }, 650); }}
    onPointerUp={clearTimer}
    onPointerLeave={clearTimer}
    onContextMenu={(event) => event.preventDefault()}
  >{children}</span>;
}

function renderItems(nodes: MenuNode[]): MenuProps['items'] {
  return nodes.map((node) => {
    const label = node.children?.length ? node.name : <Link to={node.route ?? '/welcome'}>{node.name}</Link>;
    if (node.children?.length) {
      return { key: String(node.id), icon: renderIcon(node.icon), label: <LongPressLabel>{label}</LongPressLabel>, children: renderItems(node.children) };
    }
    return { key: String(node.id), icon: renderIcon(node.icon), label: <LongPressLabel>{label}</LongPressLabel> };
  });
}

export default function Menu() {
  const location = useLocation();
  const { state, dispatch } = useAppContext();
  const tree = arrayToTree(menuItems);
  const path = findMenuPath(menuItems, location.pathname);
  const selectedKeys = path.length ? [String(path[path.length - 1].id)] : [];
  const autoOpenKeys = path.slice(0, -1).map((item) => String(item.id));

  useEffect(() => {
    if (state.collapsed || autoOpenKeys.length === 0) return;
    const missingKeys = autoOpenKeys.filter((key) => !state.openKeys.includes(key));
    if (missingKeys.length > 0) {
      dispatch({ type: 'SET_OPEN_KEYS', payload: Array.from(new Set([...state.openKeys, ...missingKeys])) });
    }
  }, [location.pathname, state.collapsed, dispatch]);

  const openKeys = state.collapsed ? [] : state.openKeys;

  const onOpenChange: MenuProps['onOpenChange'] = (keys) => {
    dispatch({ type: 'SET_OPEN_KEYS', payload: keys.map(String) });
  };

  return <AntMenu theme="dark" mode="inline" inlineCollapsed={state.collapsed} items={renderItems(tree)} selectedKeys={selectedKeys} openKeys={openKeys} onOpenChange={onOpenChange} />;
}
