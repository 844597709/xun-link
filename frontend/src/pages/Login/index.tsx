import { Form, Input, Button, Card, Typography, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

export default function Login() {
  const navigate = useNavigate();
  const { dispatch } = useAppContext();
  const onFinish = (values: { username: string }) => {
    dispatch({ type: 'SET_USER', payload: { id: 0, username: values.username, email: '', role: '演示用户', status: '启用', createdAt: '' } });
    message.success('欢迎进入 xun-link');
    navigate('/welcome');
  };
  return <div className="login-card-wrap"><Card className="login-card">
    <Typography.Title level={2}>欢迎登录</Typography.Title><Typography.Paragraph type="secondary">xun-link 运营管理平台</Typography.Paragraph>
    <Form layout="vertical" size="large" onFinish={onFinish}>
      <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}><Input prefix={<UserOutlined />} placeholder="请输入用户名" /></Form.Item>
      <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}><Input.Password prefix={<LockOutlined />} placeholder="请输入密码" /></Form.Item>
      <Button type="primary" htmlType="submit" block>登录</Button>
    </Form>
  </Card></div>;
}
