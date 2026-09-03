import { Breadcrumb as AntBreadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { findMenuPath } from '../../utils';
import { menuItems } from '../../config/menus';

const routeTitles: Record<string, string> = {
  '/content/articles': '文章管理',
  '/content/categories': '分类管理',
  '/post-loan/agility-request-form': '调整申请',
  '/post-loan/agility-calculate': '贷款试算',
};

export default function Breadcrumb() {
  const { pathname } = useLocation();
  const items = findMenuPath(menuItems, pathname);
  const fallbackTitle = routeTitles[pathname];
  const breadcrumbItems = items.length ? items.map((item, index) => ({ title: index === items.length - 1 ? item.name : <span>{item.name}</span> })) : fallbackTitle ? [{ title: fallbackTitle }] : [];
  return (
    <AntBreadcrumb className="app-breadcrumb" items={[
      { title: <Link to="/welcome"><HomeOutlined /> 首页</Link> },
      ...breadcrumbItems,
    ]} />
  );
}
