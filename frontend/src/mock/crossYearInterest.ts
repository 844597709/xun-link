import type { CrossYearBusinessEntry, CrossYearPolicyYearState, CrossYearScheme } from '../types/crossYearInterest';

export const crossYearSchemes: CrossYearScheme[] = [
  {
    id: 'scheme1',
    name: '方案一：年度切换 + 当前年度工作台 + 历史年度入口',
    shortName: '年度切换工作台',
    positioning: '统一工作台首选',
    recommended: true,
    suitableFor: '政策年度持续增加，用户经常同时查看当前年度和历史年度。',
    risk: '首页信息量略高，需要持续强调当前办理年度。',
  },
  {
    id: 'scheme2',
    name: '方案二：首页不选择年度 + 申请时选择年度',
    shortName: '申请时选择年度',
    positioning: '年度仅控制申请时推荐',
    suitableFor: '当前年度办理为主，历史年度以查询为主。',
    risk: '自主申请比方案一多一步年度选择。',
  },
  {
    id: 'scheme3',
    name: '方案三：多年度卡片工作台',
    shortName: '多年度卡片',
    positioning: '适合 2 至 3 个年度的过渡期',
    suitableFor: '用户高度关注各年度状态对比，且年度数量较少。',
    risk: '年度增多后首页变长，信息密度较高。',
  },
  {
    id: 'scheme4',
    name: '方案四：当前年度极简首页 + 历史业务中心',
    shortName: '历史业务中心',
    positioning: '历史低频场景首选',
    suitableFor: '绝大多数用户只办理当前年度，历史访问频率低。',
    risk: '历史申请入口相对隐蔽，合同状态不在同一屏对照。',
  },
];

export const crossYearYears: CrossYearPolicyYearState[] = [
  { year: 2027, agreementStatus: '已生效', agreementDate: '2027-01-08', validPeriod: '2027-01-01 至 2027-12-31', canApply: true, todoCount: 1, subsidyTotal: 2680, statusRemark: '协议已生效，本年度可申请' },
  { year: 2026, agreementStatus: '未签署', validPeriod: '2026-01-01 至 2026-12-31', canApply: false, todoCount: 1, subsidyTotal: 1540, statusRemark: '协议未签署，历史业务是否可补办以页面提示为准' },
  { year: 2025, agreementStatus: '已过期', agreementDate: '2025-02-03', validPeriod: '2025-01-01 至 2025-12-31', canApply: false, todoCount: 0, subsidyTotal: 860, statusRemark: '历史年度仅支持查看记录' },
];

export const crossYearBusinessEntries: CrossYearBusinessEntry[] = [
  { key: 'apply', label: '自主申请', description: '新建一笔指定年度申请' },
  { key: 'agreement', label: '我的协议', description: '查看年度独立协议' },
  { key: 'verify', label: '核定记录', description: '查看申请状态与材料' },
  { key: 'record', label: '贴息记录', description: '查看年度贴息明细' },
];

export const findCrossYearYear = (year: number) => crossYearYears.find((item) => item.year === year) ?? crossYearYears[0];
