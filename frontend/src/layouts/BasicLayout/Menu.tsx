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

function renderItems(nodes: MenuNode[]): MenuProps['items'] {
  return nodes.map((node) => {
    if (node.children?.length) {
      return { key: String(node.id), icon: renderIcon(node.icon), label: node.name, children: renderItems(node.children) };
    }
    return { key: String(node.id), icon: renderIcon(node.icon), label: <Link to={node.route ?? '/welcome'}>{node.name}</Link> };
  });
}

export default function Menu() {
  const location = useLocation();
  const { state, dispatch } = useAppContext();
  const tree = arrayToTree(menuItems);
  const path = findMenuPath(menuItems, location.pathname);
  const selectedKeys = path.length ? [String(path[path.length - 1].id)] : [];
  const autoOpenKeys = path.slice(0, -1).map((item) => String(item.id));
  const openKeys = state.collapsed ? [] : Array.from(new Set([...autoOpenKeys, ...state.openKeys]));

  const onOpenChange: MenuProps['onOpenChange'] = (keys) => {
    dispatch({ type: 'SET_OPEN_KEYS', payload: keys.map(String) });
  };

  return <AntMenu theme="dark" mode="inline" inlineCollapsed={state.collapsed} items={renderItems(tree)} selectedKeys={selectedKeys} openKeys={openKeys} onOpenChange={onOpenChange} />;
}
