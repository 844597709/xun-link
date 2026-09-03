import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sider from './Sider';
import Breadcrumb from './Breadcrumb';

export default function BasicLayout() {
  return (
    <Layout className="app-layout">
      <Sider />
      <Layout className="app-content-layout">
        <Header />
        <main className="content-shell">
          <Breadcrumb />
          <Outlet />
        </main>
      </Layout>
    </Layout>
  );
}
