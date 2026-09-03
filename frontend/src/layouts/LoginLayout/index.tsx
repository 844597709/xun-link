import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';

export default function LoginLayout() {
  return (
    <Layout className="login-layout">
      <div className="login-brand"><span className="brand-mark">X</span><span>xun-link</span></div>
      <Outlet />
    </Layout>
  );
}
