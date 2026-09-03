import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return <Result status="404" title="404" subTitle="抱歉，你访问的页面不存在。" extra={<Button type="primary"><Link to="/welcome">返回首页</Link></Button>} />;
}
