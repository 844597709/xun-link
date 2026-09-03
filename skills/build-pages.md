# 角色

你是资深前端开发者，负责构建所有页面级组件：Welcome 页面、列表页、筛选器、数据表格、分页。

## 硬性约束

1. **禁止创建任何临时脚本文件**：不允许在 `frontend/` 或项目根目录创建 `_tmp*.cjs` / `_tmp*.mjs` / `_tmp*.js` / `_tmp*.ts` 等临时文件。改代码一律用 Edit/Write 工具直接修改目标文件。
2. 若调试中紧急创建过临时文件，收尾阶段必须删除，并确认 `frontend/` 与项目根目录无 `_tmp*` 残留。
3. 验证类操作优先使用只读命令（`npx tsc --noEmit`、`npm run build`）；确需渲染验证时启用 `skills/` 截图脚本，不再新建临时脚本。

---

## 写文件前自检（重点）

遵循 `skills/_shared.md` 写文件前自检：任何已存在 `*.md` 写入前须先真实 Read；对已存在文件做追加/更新须先 Read，同一文件本回合已读可修改。详见 `_shared.md`。

---

## 开发前检查（强制门禁）

在执行本阶段开发之前，必须完成以下检查：若不满足，**禁止开始编码**：
- [ ] `plan_{yyyyMMdd}.md` 已存在且方案完整，**包含本迭代的「测试要点」**（若为追加优化，则需包含「追加优化测试要点」章节）
- [ ] `requirement_{yyyyMMdd}.md` 已包含本轮需求的完整描述与对应的「追加优化需求」章节（如有）
- [ ] `build_log_{yyyyMMdd}.md` 已反映前一阶段（build-layout）的完成情况（Checkpoint 已更新）
> 若检查不通过，先沟通补全文档，再执行开发。

---

## 开发进度记录

- 每完成一个组件/一个功能页/一个关键改动点，**立即**在 `build_log_{yyyyMMdd}.md` 中追加一条记录（使用「追加优化迭代记录」章节，若为首次开发则直接追加到 `## 已完成` 列表）。
- **不允许**合并多条后序记录，以保证记录的可追溯性。

---

## Resume

1. 读取目标 `state/{二级菜单}/{需求名称}/plan_{yyyyMMdd}.md` — 设计文档
2. 读取目标 `state/{二级菜单}/{需求名称}/requirement_{yyyyMMdd}.md` — 获取需求细节
3. 读取目标 `state/{二级菜单}/{需求名称}/build_log_{yyyyMMdd}.md` — 查看前序进度
4. 仅读取文件映射涉及的页面、组件和 Mock；用户未指定视觉参考时不遍历 `refs/`
5. 更新目标 `state/{二级菜单}/{需求名称}/build_log_{yyyyMMdd}.md` Checkpoint

---

## 迭代优化（追加需求）日志

若本次为同一需求的追加优化/修复，构建改动后**在 `build_log_{yyyyMMdd}.md` 追加「追加优化迭代记录」小节**，记录已完成项（与 requirement/plan 的优化编号对齐）。**不重写**既有已完成清单。

---

## 工作流

### Phase 1: Mock 数据扩展

**`frontend/src/mock/index.ts`**：
- **用户列表数据** (20+条)：id, username, email, role, status, createdAt
- **角色列表数据** (10+条)：id, name, description, userId, status
- **文章列表数据** (20+条)：id, title, category, author, status, createdAt
- **分类列表数据** (10+条)：id, name, parentId, sort, status
- 添加 mock API 函数，返回 Promise，模拟延迟 200-500ms
- 支持筛选参数和分页 `{ page, pageSize }`

### Phase 2: 通用组件

1. **`frontend/src/components/Filter/index.tsx`** — 通用筛选表单
   - Props: `configs: FilterConfig[]`（数组 `{ key, label, type: 'input' | 'select' | 'datePicker', options? }`）
   - 渲染内联 Ant Design Form 动态字段
   - "搜索"按钮 (primary) + "重置"按钮
   - 触发 `onSearch(values)` 回调

2. **`frontend/src/components/DataTable/index.tsx`** — 通用数据表格
   - Props: `columns`, dataSource, loading, pagination, onPageChange
   - 渲染 Ant Design Table (bordered 样式)
   - 底部分页，显示总数
   - 右侧操作列（编辑/删除按钮）
   - loading 状态显示 spinning
   - 空数据时显示空状态

### Phase 3: 欢迎页

**`frontend/src/pages/Welcome/index.tsx`** — 仪表盘：
- 页面标题"欢迎"及简介文字
- 功能卡片网格（3-4张）：用户管理、内容管理、角色管理、系统设置
- 每张卡片：图标、标题、描述、"前往"链接
- 快捷导航区域，直接到关键页面
- 可选：模拟统计行（总用户数、文章数等）

### Phase 4: 列表页面

每个列表页遵循统一模式：
1. 面包屑导航（根据路由自动生成或硬编码）
2. Filter 组件（含搜索字段）
3. DataTable（含操作列）
4. 分页由页面 state 控制
5. 数据加载时显示 loading
6. 筛选无结果时显示空状态

#### 用户列表 `frontend/src/pages/admin/UserList/index.tsx`
- 筛选：用户名（input）、角色（select）、状态（select）
- 列：ID、用户名、邮箱、角色、状态（tag）、创建时间、操作
- 操作：编辑（消息提示）、删除（确认对话框）

#### 角色列表 `frontend/src/pages/admin/RoleList/index.tsx`
- 筛选：名称（input）、状态（select）
- 列：ID、名称、描述、用户数、状态、操作
- 操作：编辑、删除

#### 文章列表 `frontend/src/pages/content/ArticleList/index.tsx`
- 筛选：标题（input）、分类（select）、状态（select）、时间范围（datePicker）
- 列：ID、标题、分类、作者、状态、创建时间、操作
- 操作：查看、编辑、删除

#### 分类列表 `frontend/src/pages/content/CategoryList/index.tsx`
- 筛选：名称（input）、状态（select）
- 列：ID、名称、上级分类、排序、状态、操作
- 操作：编辑、删除

### Phase 5: 路由更新

更新 `frontend/src/router/index.tsx`，添加所有页面路由指向真实组件。

### Phase 6: 状态管理

- 每个列表页使用 useState 管理本地 state：`data`, `loading`, `pagination`, `filters`
- 挂载时：获取第一页数据
- 筛选提交时：重置到第 1 页，用筛选条件获取数据
- 翻页时：用当前筛选 + 新页码获取数据
- 操作（编辑/删除）：显示消息或确认提示，不做真实修改

### Phase 7: 验证与日志

1. 确认本轮目标页面、组件和 Mock 文件已创建或更新
2. 确认受影响页面的筛选/搜索/分页/交互逻辑已实现
3. 仅在路由发生变化或用户指定时验证目标页面导航；不遍历全部页面
4. 仅在用户指定视觉参考或样式发生变化时执行渲染验证
5. **记录主要调整至 `state/{二级菜单}/{需求名称}/build_log_{yyyyMMdd}.md`**：
   - 新增页面清单
   - 修改的现有组件
   - 遇到的问题及解决方案
6. **执行 `clear` 清理上下文**

---

## 输出

- 所有页面源文件在 `frontend/src/pages/`
- 通用组件在 `frontend/src/components/`
- 更新的 mock 数据和路由
- 更新 `state/{二级菜单}/{需求名称}/build_log_{yyyyMMdd}.md`：

```markdown
## Checkpoint
- 当前步骤：Stage 4 - 构建页面
- 最后完成：{yyyyMMdd HH:mm} - 完成所有页面构建
- 任务状态：进行中

## 已完成
- [x] {yyyyMMdd HH:mm} 扩展 Mock 数据（用户/角色/文章/分类）
- [x] {yyyyMMdd HH:mm} 创建 Filter 通用组件
- [x] {yyyyMMdd HH:mm} 创建 DataTable 通用组件
- [x] {yyyyMMdd HH:mm} 创建 Welcome 欢迎页
- [x] {yyyyMMdd HH:mm} 创建 UserList 用户列表页
- [x] {yyyyMMdd HH:mm} 创建 RoleList 角色列表页
- [x] {yyyyMMdd HH:mm} 创建 ArticleList 文章列表页
- [x] {yyyyMMdd HH:mm} 创建 CategoryList 分类列表页
- [x] {yyyyMMdd HH:mm} 更新路由配置

## 验证结果
- [x] 所有列表页正常加载数据
- [x] 筛选功能正常
- [x] 分页功能正常
- [x] 操作按钮触发提示

## 已知问题
[如有列出]
```

完成后输出：

> **"Stage 4 完成。运行 `build-test` 进入审查阶段。"**