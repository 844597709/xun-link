import { Layout } from 'antd';
import { Link } from 'react-router-dom';
import Menu from './Menu';
import { useAppContext } from '../../context/AppContext';

export default function Sider() {
  const { state } = useAppContext();
  return (
    <Layout.Sider width={200} collapsedWidth={80} collapsed={state.collapsed} theme="dark" className="app-sider">
      <Link to="/welcome" className="brand" aria-label="xun-link 首页">
        <span className="brand-mark">X</span>
        {!state.collapsed && <span className="brand-name">xun-link</span>}
      </Link>
      <div className="sider-menu"><Menu /></div>
    </Layout.Sider>
  );
}
