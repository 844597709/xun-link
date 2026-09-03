import { Button, Modal, Space, Tag, message } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Article, BusinessRecord, Category, Role, User } from '../types';
import type { FilterConfig } from '../components/Filter';
import { getArticles, getBusinessList, getCategories, getRoles, getUsers, type BusinessModuleKey } from '../mock';

const statuses = [{ label: '启用', value: '启用' }, { label: '停用', value: '停用' }];
const businessStatuses = ['待处理', '处理中', '已完成', '已驳回'].map((value) => ({ label: value, value }));

function actionButtons(id: number, canView = false) {
  return <Space size="small">
    {canView && <Button type="link" size="small" onClick={() => message.info(`查看记录 ${id}`)}>查看</Button>}
    <Button type="link" size="small" onClick={() => message.info(`编辑记录 ${id}`)}>编辑</Button>
    <Button type="link" danger size="small" onClick={() => Modal.confirm({ title: '确认删除', content: `确定删除记录 ${id} 吗？`, onOk: () => message.success('原型已接收删除操作') })}>删除</Button>
  </Space>;
}

export const userFilters: FilterConfig[] = [
  { key: 'username', label: '用户名', type: 'input' },
  { key: 'role', label: '角色', type: 'select', options: ['管理员', '运营专员', '审核专员', '客服专员'].map((value) => ({ label: value, value })) },
  { key: 'status', label: '状态', type: 'select', options: statuses },
];

export const userColumns: TableColumnsType<User> = [
  { title: 'ID', dataIndex: 'id', width: 80 }, { title: '用户名', dataIndex: 'username' }, { title: '邮箱', dataIndex: 'email' },
  { title: '角色', dataIndex: 'role' }, { title: '状态', dataIndex: 'status', render: (value: User['status']) => <Tag color={value === '启用' ? 'green' : 'default'}>{value}</Tag> },
  { title: '创建时间', dataIndex: 'createdAt' }, { title: '操作', key: 'actions', fixed: 'right', render: (_, record) => actionButtons(record.id) },
];

export const roleFilters: FilterConfig[] = [
  { key: 'name', label: '角色名称', type: 'input' }, { key: 'status', label: '状态', type: 'select', options: statuses },
];
export const roleColumns: TableColumnsType<Role> = [
  { title: 'ID', dataIndex: 'id', width: 80 }, { title: '名称', dataIndex: 'name' }, { title: '描述', dataIndex: 'description' },
  { title: '用户数', dataIndex: 'userCount' }, { title: '状态', dataIndex: 'status', render: (value: Role['status']) => <Tag color={value === '启用' ? 'green' : 'default'}>{value}</Tag> },
  { title: '操作', key: 'actions', fixed: 'right', render: (_, record) => actionButtons(record.id) },
];

export const articleFilters: FilterConfig[] = [
  { key: 'title', label: '文章标题', type: 'input' },
  { key: 'category', label: '分类', type: 'select', options: ['业务公告', '产品动态', '帮助中心'].map((value) => ({ label: value, value })) },
  { key: 'status', label: '状态', type: 'select', options: [{ label: '已发布', value: '已发布' }, { label: '草稿', value: '草稿' }] },
  { key: 'createdAt', label: '创建时间', type: 'datePicker' },
];
export const articleColumns: TableColumnsType<Article> = [
  { title: 'ID', dataIndex: 'id', width: 80 }, { title: '标题', dataIndex: 'title', width: 280 }, { title: '分类', dataIndex: 'category' },
  { title: '作者', dataIndex: 'author' }, { title: '状态', dataIndex: 'status', render: (value: Article['status']) => <Tag color={value === '已发布' ? 'blue' : 'orange'}>{value}</Tag> },
  { title: '创建时间', dataIndex: 'createdAt' }, { title: '操作', key: 'actions', fixed: 'right', render: (_, record) => actionButtons(record.id, true) },
];

export const categoryFilters: FilterConfig[] = [
  { key: 'name', label: '分类名称', type: 'input' }, { key: 'status', label: '状态', type: 'select', options: statuses },
];
export const categoryColumns: TableColumnsType<Category> = [
  { title: 'ID', dataIndex: 'id', width: 80 }, { title: '名称', dataIndex: 'name' }, { title: '上级分类', dataIndex: 'parentName' },
  { title: '排序', dataIndex: 'sort' }, { title: '状态', dataIndex: 'status', render: (value: Category['status']) => <Tag color={value === '启用' ? 'green' : 'default'}>{value}</Tag> },
  { title: '操作', key: 'actions', fixed: 'right', render: (_, record) => actionButtons(record.id) },
];

const businessColumns: TableColumnsType<BusinessRecord> = [
  { title: '编号', dataIndex: 'referenceNo', width: 180 }, { title: '客户名称', dataIndex: 'customer', width: 180 },
  { title: '金额（元）', dataIndex: 'amount', render: (value: number) => value.toLocaleString('zh-CN') },
  { title: '状态', dataIndex: 'status', render: (value: BusinessRecord['status']) => <Tag color={value === '已完成' ? 'green' : value === '已驳回' ? 'red' : 'blue'}>{value}</Tag> },
  { title: '更新时间', dataIndex: 'updatedAt' }, { title: '备注', dataIndex: 'remark' },
  { title: '操作', key: 'actions', fixed: 'right', render: (_, record) => actionButtons(record.id, true) },
];

export const businessFilters: FilterConfig[] = [
  { key: 'keyword', label: '关键字', type: 'input', placeholder: '编号或客户名称' }, { key: 'status', label: '状态', type: 'select', options: businessStatuses },
];

export interface BusinessPageConfig {
  title: string;
  description: string;
  filters: FilterConfig[];
  columns: TableColumnsType<BusinessRecord>;
  fetcher: (params: { page: number; pageSize: number; [key: string]: unknown }) => ReturnType<typeof getBusinessList>;
}

const businessTitles: Record<BusinessModuleKey, string> = {
  adjustRequest: '调整申请', adjustDetail: '调整明细', agilityRequest: '调整申请', agilityDetail: '调整明细',
  debtRequest: '调整申请', debtDetail: '调整明细', extensionRequest: '调整申请', extensionDetail: '调整明细',
  litigationRequest: '诉讼申请', litigationExecution: '诉讼回款执行', litigationDetail: '诉讼回款明细',
  interestRule: '贴息规则配置', interestAgreement: '协议签署', interestFlow: '贴息流水',
  interestSystemVerify: '系统核定', interestVerify: '贴息核定', loanInterest: '贷款贴息', consumeInterest: '消费贴息',
  productList: '产品信息列表', repayment: '手动还款', approvalPending: '待审列表',
  agilitySign: '灵活重组签约', debtSign: '债务重组签约', repaymentWithdraw: '组合还款提现',
  bankConsumeInterest: '消费贷款贴息',
};

export const businessPageConfigs = Object.fromEntries(
  (Object.keys(businessTitles) as BusinessModuleKey[]).map((key) => [key, {
    title: businessTitles[key],
    description: `查看和处理${businessTitles[key]}相关业务记录`,
    filters: businessFilters,
    columns: businessColumns,
    fetcher: (params: { page: number; pageSize: number; [key: string]: unknown }) => getBusinessList(key, params),
  }]),
) as Record<BusinessModuleKey, BusinessPageConfig>;

export const adminPageConfigs = {
  users: { title: '用户管理', description: '维护后台用户及其角色状态', filters: userFilters, columns: userColumns, fetcher: getUsers },
  roles: { title: '角色管理', description: '维护角色权限组和关联用户数量', filters: roleFilters, columns: roleColumns, fetcher: getRoles },
  articles: { title: '文章管理', description: '管理运营资讯、公告与帮助内容', filters: articleFilters, columns: articleColumns, fetcher: getArticles },
  categories: { title: '分类管理', description: '维护内容分类与展示顺序', filters: categoryFilters, columns: categoryColumns, fetcher: getCategories },
};
