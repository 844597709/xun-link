import { ArrowRightOutlined, AppstoreOutlined, FileTextOutlined, SettingOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Card, Col, Row, Space, Statistic, Typography } from 'antd';
import { Link } from 'react-router-dom';

const cards = [
  { title: '用户管理', description: '维护平台用户信息与状态', icon: <UserOutlined />, route: '/admin/user-list' },
  { title: '内容管理', description: '管理文章与内容分类', icon: <FileTextOutlined />, route: '/content/articles' },
  { title: '贷后管理', description: '处理贷后业务申请与明细', icon: <TeamOutlined />, route: '/post-loan/adjust-request' },
  { title: '产品管理', description: '查看平台产品配置', icon: <AppstoreOutlined />, route: '/product/list' },
];

export default function Welcome() {
  return <div className="page-container welcome-page">
    <div className="welcome-hero"><Typography.Title level={2}>欢迎使用 xun-link</Typography.Title><Typography.Paragraph>聚焦信贷业务全流程，让管理更简单、更高效。</Typography.Paragraph></div>
    <Row gutter={[16, 16]} className="stats-row">
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="平台用户" value={24} suffix="人" /></Card></Col>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="业务产品" value={8} suffix="个" /></Card></Col>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="待处理事项" value={18} suffix="项" /></Card></Col>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="内容文章" value={24} suffix="篇" /></Card></Col>
    </Row>
    <Typography.Title level={4} className="section-title">快捷入口</Typography.Title>
    <Row gutter={[16, 16]}>
      {cards.map((card) => <Col xs={24} sm={12} lg={6} key={card.route}><Card hoverable className="feature-card"><div className="feature-icon">{card.icon}</div><Typography.Title level={5}>{card.title}</Typography.Title><Typography.Paragraph type="secondary">{card.description}</Typography.Paragraph><Link to={card.route}><Space>前往管理 <ArrowRightOutlined /></Space></Link></Card></Col>)}
    </Row>
    <Card className="welcome-tip"><Space><SettingOutlined /><span>这是一个可交互的前端原型，页面操作会通过消息和确认弹窗反馈。</span></Space></Card>
  </div>;
}
