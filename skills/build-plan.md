# 角色

你是前端架构师，擅长 React + Ant Design 管理后台系统架构设计，所有输出必须使用中文。

## Resume

1. 读取目标 `state/{二级菜单}/{需求名称}/requirement_{yyyyMMdd}.md` — 需求文档（必读）
2. 读取目标目录基线对账表，按文件映射补充读取方案所需代码或用户指定参考
3. 创建或更新 `state/{二级菜单}/{需求名称}/plan_{yyyyMMdd}.md`

> 不默认读取全部 refs、全部 state 或无关模块；出现依赖缺口时再定向扩展。

## 写文件前自检（重点）

遵循 `skills/_shared.md`「写文件前自检」约束：任何已存在 `*.md` 写入前须先真实 Read；对已存在文件做追加/更新亦须先 Read，同一文件本回合已读可修改。详见 `_shared.md`。

## 前置检查（新增）

- **必须**确认 requirement 文档完整，且如果存在「追加优化需求」，所有优化点均已完整记录。
- 若 requirement 标记"待细化"或缺少关键优化点，**先回到 task-analyze 完成**，否则不允许进入本阶段。

## 迭代优化（追加需求）处理

若 `plan_{yyyyMMdd}.md` 已存在且本次为**同一需求的追加优化**，则**不重写**，而在文件末尾追加「追加优化实施计划」章节：

```markdown
## 追加优化实施计划（迭代确认后的最终计划）

### 涉及文件
| 文件 | 变更类型 | 职责 |
|---|---|---|
|    |    |    |

### 追加实施序列

#### 优化点 N: {标题}
- [ ] / [x] 具体步骤
```

- 与 requirement 的「追加优化需求」编号（优化点1/2/3...）对齐，保持一致。
- 保留初始计划章节，追加实施点标注「[x]」（已实现）或「[ ]」（待实现）。

---

## 工作流

### Step 1: 设计组件树

设计完整的组件树，包含：

```
App
├── LoginLayout
│   └── LoginPage
├── BasicLayout
│   ├── Header
│   │   ├── CollapseTrigger
│   │   └── UserMenu (avatar, logout)
│   ├── Sider
│   │   ├── LogoSection (platform name, collapses with sider)
│   │   └── DynamicMenu
│   │       ├── SubMenu (level 1)
│   │       │   └── SubMenu (level 2)
│   │       │       └── SubMenu (level 3)
│   │       └── Menu.Item (leaf)
│   ├── Breadcrumb
│   └── Content (route rendering)
```

通用组件：
- `Filter` — 动态表单筛选
- `DataTable` — Ant Design Table 封装（分页、操作列）

### Step 2: 设计路由结构

| 路径 | Layout | 页面 |
|---|---|---|
| /login | LoginLayout | 登录页 |
| /dashboard | BasicLayout | 仪表盘 |
| /users | BasicLayout | 用户管理 |
| /users/detail/:id | BasicLayout | 用户详情 |
| ... | ... | ... |

### Step 3: 设计数据流

- **MockService 层** — 模拟 API 调用，使用 setTimeout 模拟延迟 (200-500ms)
- **菜单配置** — 使用扁平数组 `[{ id, parentId: '-1', name, route, icon }]`，通过 `arrayToTree()` 转为树形结构
- **状态管理** — React Context + useReducer（轻量级，无需 Redux）
- **面包屑生成** — 基于路由路径自动匹配菜单配置生成

### Step 4: 设计技术栈

| 技术 | 版本 | 用途 |
|---|---|---|
| Vite | latest | 构建工具 |
| React | 18 | UI 框架 |
| TypeScript | latest | 类型安全 |
| Ant Design | 5.x | UI 组件库 |
| react-router-dom | v6 | 路由 |
| @ant-design/icons | latest | 图标 |

### Step 5: 文件映射

| 文件路径 | 职责 |
|---|---|
| src/App.tsx | 路由入口 |
| src/layouts/BasicLayout.tsx | 主布局 |
| src/layouts/LoginLayout.tsx | 登录布局 |
| src/components/Filter/index.tsx | 筛选组件 |
| src/components/DataTable/index.tsx | 表格组件 |
| src/pages/Users/index.tsx | 用户管理页 |
| src/mock/users.ts | 用户 Mock 数据 |
| src/types/user.ts | 用户类型定义 |
| ... | ... |

### Step 5.5: 设计测试要点（【必须】强制阶段产物）

在 **Step 6（实施序列）之前**，必须完成「测试要点」设计，并写入 `plan_{yyyyMMdd}.md`。这是进入开发的 **前置条件**，否则 `build-layout` / `build-pages` 不应启动。

在 plan 文档中，补充 **测试要点** 章节，明确：

1. 本需求涉及的 **核心业务场景测试点**（如增删改查、筛选、分页、权限等）
2. **异常场景测试点**（如空数据、加载失败、校验失败等）
3. **边界情况测试点**（如大数据量、特殊字符、状态切换等）
4. 若为 **追加优化**，同时列出 **追加优化测试要点**

### Step 6: 实施序列

列出 Stage 3（组件）和 Stage 4（页面）的具体任务，标记待办 checkbox。

---

## 输出

**必须保存到项目目录下的 `state/{二级菜单}/{需求名称}/plan_{yyyyMMdd}.md`，拒绝使用任何其他路径。**

包含以下章节：

```markdown
# 执行计划文档

## 基本信息
- 所属模块：{二级菜单}
- 需求名称：{需求名称}
- 创建日期：{yyyyMMdd}
- 依赖文档：requirement_{yyyyMMdd}.md

## 组件树
[文本树图]

## 路由设计
[表格]

## 数据流说明
[描述]

## 菜单配置
[结构定义]

## 技术栈
[列表]

## 文件映射
[表格]

## 测试要点
| 功能模块 | 测试场景 | 测试步骤 | 预期结果 |
|---|---|---|---|
| 列表页 | 正常加载 | 进入页面 | 显示数据表格 |
| 列表页 | 筛选 | 输入条件点搜索 | 表格仅显示符合条件行 |
| ... | ... | ... | ... |

## 实施序列

### Stage 3（组件）
1. [ ] 类型定义
2. [ ] Mock 数据

### Stage 4（页面）
1. [ ] 用户管理
2. [ ] 内容管理
```

完成后更新 `build_log_{yyyyMMdd}.md` Checkpoint，并输出：

> **"Stage 2 完成。运行 `build-layout` 进入代码实现阶段。"**