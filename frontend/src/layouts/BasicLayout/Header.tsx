import { Avatar, Dropdown, Layout, Space, Typography, message } from 'antd';
import { LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const { Header: AntHeader } = Layout;

export default function Header() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const username = state.currentUser?.username ?? '演示用户';

  const logout = () => {
    dispatch({ type: 'CLEAR_USER' });
    message.success('已退出原型登录');
    navigate('/login');
  };

  return (
    <AntHeader className="app-header">
      <button className="collapse-button" aria-label={state.collapsed ? '展开侧栏' : '收起侧栏'} onClick={() => dispatch({ type: 'TOGGLE_SIDER' })}>
        {state.collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </button>
      <Dropdown menu={{ items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: logout }] }} placement="bottomRight">
        <button className="user-button" aria-label="打开用户菜单">
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <Typography.Text>{username}</Typography.Text>
          </Space>
        </button>
      </Dropdown>
    </AntHeader>
  );
}
