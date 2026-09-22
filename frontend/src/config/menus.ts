import type { MenuItem } from '../types';

export const menuItems: MenuItem[] = [
  // ===== 一级菜单 =====
  { id: 1, mpid: '-1', name: '欢迎页', route: '/welcome', icon: 'HomeOutlined' },

  // 贷后纾困
  { id: 2, mpid: '-1', name: '贷后纾困', icon: 'FolderOutlined' },
  { id: 3, mpid: '2', name: '灵动重组', icon: 'RocketOutlined' },
  { id: 4, mpid: '3', name: '调整申请', route: '/post-loan/agility-request', icon: 'EditOutlined' },
  { id: 5, mpid: '3', name: '调整明细', route: '/post-loan/agility-detail', icon: 'TableOutlined' },
  { id: 6, mpid: '2', name: '债务重组', icon: 'FileTextOutlined' },
  { id: 7, mpid: '6', name: '调整申请', route: '/post-loan/debt-request', icon: 'EditOutlined' },
  { id: 8, mpid: '6', name: '调整明细', route: '/post-loan/debt-detail', icon: 'TableOutlined' },
  { id: 9, mpid: '2', name: '诉讼回款', icon: 'GavelOutlined' },
  { id: 10, mpid: '9', name: '诉讼回款执行', route: '/post-loan/litigation-execution', icon: 'PlayCircleOutlined' },
  { id: 11, mpid: '9', name: '诉讼回款明细', route: '/post-loan/litigation-detail', icon: 'FileDoneOutlined' },
  { id: 12, mpid: '2', name: '延展期', icon: 'ClockCircleOutlined' },
  { id: 13, mpid: '12', name: '调整申请', route: '/post-loan/extension-request', icon: 'EditOutlined' },
  { id: 14, mpid: '12', name: '调整明细', route: '/post-loan/extension-detail', icon: 'TableOutlined' },

  // 在贷要素调整
  { id: 15, mpid: '2', name: '在贷要素调整', icon: 'SettingOutlined' },
  { id: 16, mpid: '15', name: '调整申请', route: '/post-loan/adjust-request', icon: 'EditOutlined' },
  { id: 17, mpid: '15', name: '调整明细', route: '/post-loan/adjust-detail', icon: 'TableOutlined' },

  // 运营管理
  { id: 18, mpid: '-1', name: '运营管理', icon: 'ShopOutlined' },
  { id: 19, mpid: '18', name: '手动还款', route: '/operation/manual-repayment', icon: 'PayCircleOutlined' },
  { id: 20, mpid: '18', name: '产品管理', icon: 'AppstoreOutlined' },
  { id: 21, mpid: '20', name: '产品信息列表', route: '/product/list', icon: 'UnorderedListOutlined' },
  { id: 22, mpid: '18', name: '贴息管理', icon: 'MoneyCollectOutlined' },
  { id: 23, mpid: '22', name: '贴息规则配置', route: '/operation/interest-rule', icon: 'SettingOutlined' },
  { id: 24, mpid: '22', name: '协议签署', route: '/operation/interest-agreement', icon: 'FileProtectOutlined' },
  { id: 25, mpid: '22', name: '贴息流水', route: '/operation/interest-flow', icon: 'SwapOutlined' },
  { id: 26, mpid: '22', name: '系统核定', route: '/operation/interest-system-verify', icon: 'CheckCircleOutlined' },
  { id: 27, mpid: '22', name: '贴息核定', route: '/operation/interest-verify', icon: 'VerifiedOutlined' },
  { id: 28, mpid: '22', name: '贷款贴息', route: '/operation/loan-interest', icon: 'DollarOutlined' },
  { id: 29, mpid: '22', name: '消费贴息', route: '/operation/consume-interest', icon: 'ShoppingOutlined' },

  // 审批管理
  { id: 30, mpid: '-1', name: '审批管理', icon: 'AuditOutlined' },
  { id: 31, mpid: '30', name: '待审列表', route: '/approval/pending', icon: 'FileSearchOutlined' },

  // 银行宝签约
  { id: 32, mpid: '-1', name: '银行宝签约', icon: 'BankOutlined' },
  { id: 33, mpid: '32', name: '灵动重组签约', route: '/bank-login/agility-sign', icon: 'RocketOutlined' },
  { id: 34, mpid: '32', name: '债务重组签约', route: '/bank-login/debt-sign', icon: 'FileTextOutlined' },
  { id: 35, mpid: '32', name: '组合还款提现', route: '/bank-login/combo-repayment-withdrawal', icon: 'WalletOutlined' },
  { id: 36, mpid: '32', name: '消费贷款贴息', route: '/bank-login/consume-interest', icon: 'ShoppingOutlined' },
  { id: 37, mpid: '32', name: '跨年财政贴息', route: '/bank-login/cross-year-interest', icon: 'CalendarOutlined' },
];
