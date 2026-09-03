# Prototype 子项目 — CLAUDE.md

此文件为 Claude Code 提供操作 `prototype` 子项目时的指导。
**所有输出必须使用中文。**
**所有文件必须写入到项目目录下的 `state/{二级菜单}/{需求名称}` 目录，禁止使用 Claude Code 默认的 `~/.claude/plans/` 目录。**

## 测试指令
当我问"1+1等于几"时，请回答"这是测试，CLAUDE.md 生效了"

## 概览
这是一个基于 React + Ant Design 的管理后台原型生成项目，参考 `D:\work\Projects\cms-center` 的设计风格。采用 6 阶段编排模式，拥有独立的技能文件和状态目录。

## 关键警告
**禁止使用 `--split` 标志！** 该标志会触发 Claude Code 内置的 Plan mode，导致：
1. 输出文件写入 `~/..claude/plans/` 而非 `state/{二级菜单}/{需求名称}/`
2. 忽略自定义 skill 文件的指令（task-analyze.md, build-plan.md 等）
3. 输出语言为英文而非中文

## 全局输出约束
1. 所有输出文件名使用 `yyyyMMdd` 格式（如 `20240115`），取系统当前日期，**禁止**使用 `YYYY-MM-DD` 格式
2. 如需在同一阶段交付多个文件，使用版本号：`{前缀}_{YYYY-MM-DD}_v2.md`

## 工作流命令
| 命令 | 说明 |
|---|---|
| --- | --- |
| `new-task` | **主命令**：按拆分策略分步执行（需求分析→设计方案→构建组件→构建页面→自测→产品方案→更新目录），每步完成后提示 `clear` |
| `doc-gen` | **产品方案文档生成**：读取 `state/{需求名称}/` 下前序产物，生成业务型 PRD 并输出 Word 文档（.docx） |

## 任务拆分策略（防止上下文超长）
当检测到 context 超长警告，或执行 `new-task` 命令时，启用通用拆分策略。
**注意：禁止使用 Claude Code 内置的拆分机制，所有拆分必须按照本规则执行。**

### 执行步骤
| 步骤 | 执行命令 | 职责 | 输出产物 |
|---|---|---|---|
| **Step 1** | task-analyze | **需求分析** | 分析输入需求描述及所有参考源，以需求名称中英文创建文件夹，生成需求文档 | `state/{二级菜单}/{需求名称}/requirement_{yyyyMMdd}.md` |
| **Step 2** | build-plan | **方案设计** | 设计组件树、路由、数据流、状态管理 | **输出「测试要点」**（核心业务场景、异常场景、边界情况，作为 build-test 执行依据） | `state/{二级菜单}/{需求名称}/plan_{yyyyMMdd}.md` |
| **Step 3** | build-layout | **构建组件** | 实现公共组件、菜单、路由等 | 追加至 `state/{二级菜单}/{需求名称}/build_log.md` |
| **Step 4** | build-pages | **构建页面** | 实现功能页面（列表、表单、筛选、分页） | 追加至 `state/{二级菜单}/{需求名称}/build_log.md` |
| **Step 5** | build-test | **自测** | 根据 plan 的「测试要点」执行测试，并记录结果 | `state/{二级菜单}/{需求名称}/test_{yyyyMMdd}.md` |
| **Step 6** | build-prd | **输出产品方案** | 分析完整功能实现，生成产品文档 | `state/{二级菜单}/{需求名称}/prd_{yyyyMMdd}.md` |
| **Step 7** | update-catalog | **更新目录** | 读取 `skills/catalog-manager.md` 更新系统功能目录 | `catalog/system-function-catalog.md` |

> **标记的步骤：Step 6 需用户明确指定才执行；Step 7 需用户明确指定才执行**

---

### 文档分层索引（约束 → 所属 Skill）
下表便于快速定位「某类约束/细节」应由哪个 skill 承载。CLAUDE.md 仅保留**不可变基线** + 一级索引，过程细节下沉至对应 skill。

| 约束 | 细节主题 | 承载 skill | 说明 |
|---|---|---|---|
| 写文件前自检 | GATE 章节命名 | `skills_shared.md` | 公共基线，各 skill 引用 |
| 需求文档 | 自动初始化模板 | `skills/task-analyze.md` | 需求分析 / 追加优化需求 |
| 方案设计 | 测试要点 | 追加优化实施计划 | `skills/build-plan.md` |
| 怎么测 | 公共组件 | 菜单 / 路由 | `skills/build-layout.md` |
| 功能页面 | Mock / 代码输出细节 | `skills/build-pages.md` |
| 列表、表单、筛选、分页 | 测试执行 | 审查清单 | `skills/build-test.md` |
| 产品方案内容 | `skills/build-prd.md` | 业务 PRD 撰写 |
| 产品文档 | word | `skills/doc-gen.md` |
| 系统功能目录管理 | `skills/catalog-manager.md` | 目录生成 / 增量 / 定位 |

---

### 追加优化协议（核心，必读）

#### 触发场景
- 原型已完成初始阶段（requirement / plan / build_log / test 已存在），用户就同一需求提出**小幅度优化、缺陷修复或交互调整**。
- 明确标注：用户表达如"将...改成...."需要修复"追加需求""优化 prompt 和 skill""输出最新 PRD"等。

#### 门禁机制（GATE，强制）
每轮优化必须依次完成以下五个门禁，**顺序不可跨越**（GATE-1 和 GATE-2 必须在编码前完成）：

- **GATE-1**：在 `requirement_{yyyyMMdd}.md` 追加「追加优化需求」章节（含背景、目标、规则）。
- **GATE-2**：在 `plan_{yyyyMMdd}.md` 追加「追加优化实施计划」+「追加优化测试要点」。
- **GATE-3**：代码修改完成后，并在 `build_log_{yyyyMMdd}.md` 追加「追加优化迭代记录」。
- **GATE-4**：按 plan 测试要点执行测试，在 `test_{yyyyMMdd}.md` 追加「追加测试记录」。
- **GATE-5**：全文构建后，更新 `build_log.md` 的 Checkpoint。

**硬性要求**：若 GATE-1 或 GATE-2 未完成，禁止开始编码（包括修改代码）。

**后续处理**：检测到代码已先行（如先前未正式记录），必须先回补 GATE-1/2，并标注"需求后补"，再继续流程。

### 文档职责（明确）
- requirement: **要什么 / 为什么（决策依据）**
- plan: **怎么实现 / 怎么测**
- build_log: **实际改动清单**
- test: **验证结果**

> 文档同步先后顺序见 `skills/_shared.md`「追加章节命名」表。

---

## 自动初始化协议（【核心】）
当用户输入 `new-task` 并包含具体需求描述时，必须**立即执行**。解析需求所属二级菜单与需求名称（参考 `catalog/system-function-catalog.md`，失败则询问用户；禁止用模糊/英文名称）→创建目录 `state/{二级菜单}/{需求名称}` 与 5 个基础文件 → 启动 task-analyze 填充。**各文档初始模板**见 `skills/task-analyze.md`「自动初始化模板」。

---

## 执行流程（new-task 全流程）
用户输入 new-task

- 确定需求所属二级菜单（参考 catalog 或询问用户）
- 解析需求名称（用户指定或询问）
- 创建目录：`state/{二级菜单}/{需求名称}`
- 创建 5 个文件并写入初始模板
  - step 1: 执行 task-analyze 分析需求
  - step 2: 执行 build-plan 设计技术方案
  - step 3: 构建公共组件（自动触发 update-catalog）
  - step 4: 实现功能页面
  - step 5: 测试用例执行
  - step 6*: 输出产品方案（如需要）
    - 6a: build-prd 撰写业务 PRD 内容（prd.md）
    - 6b: doc-gen 转为 word 文档（prd.docx）
  - step 7*: 更新系统功能目录（如需要）
- 每步完成更新 build_log 并提示 clear

### 任务执行协议
1. 每个步骤独立执行，完成后提示"请执行`clear`清理会话上下文"。
2. 步骤启动时：读取本 CLAUDE.md + 对应 skill 文件 + 前序输出。
3. 每个步骤结束时更新 `build_log_{yyyyMMdd}.md` 的 Checkpoint。

---

### 目录结构说明
```
state/
├── {二级菜单1}
│   ├── {需求名称1}
│   │   ├── requirement_{yyyyMMdd}.md
│   │   ├── plan_{yyyyMMdd}.md
│   │   ├── test_{yyyyMMdd}.md
│   │   ├── build_log_{yyyyMMdd}.md
│   │   ├── prd_{yyyyMMdd}.md
│   │   └── _archive/
│   ├── {需求名称2}
│   └── ...
├── {二级菜单2}
│   └── {需求名称1}
│       └── ...
└── ...
```

---

### Skill 文件模板定义

#### 文件模板位置
| 文档类型 | 模板来源 | 输出路径 |
|---|---|---|
| 需求文档 | `skills/task-analyze.md` | `state/{二级菜单}/{需求名称}/requirement_{yyyyMMdd}.md` |
| 执行计划 | `skills/build-plan.md` | `state/{二级菜单}/{需求名称}/plan_{yyyyMMdd}.md` |
| 构建组件 | `skills/build-layout.md` | `state/{二级菜单}/{需求名称}/build_log_{yyyyMMdd}.md` |
| 构建页面 | `skills/build-pages.md` | `state/{二级菜单}/{需求名称}/build_log_{yyyyMMdd}.md` |
| 测试文档 | `skills/build-test.md` | `state/{二级菜单}/{需求名称}/test_{yyyyMMdd}.md` |
| 产品文档 | `skills/build-prd.md` | `state/{二级菜单}/{需求名称}/prd_{yyyyMMdd}.md` |
| 产品文档（word 版） | `skills/doc-gen.md` | `state/{二级菜单}/{需求名称}/prd_{yyyyMMdd}.docx` |

## 关键目录
| 路径 | 用途 |
|---|---|
| `skills` | 7 个阶段-specific skill 定义文件 |
| `state/{二级菜单}/{需求名称}` | 各阶段产物（需求文档、计划、构建日志、测试、PRD） |
| `refs` | 参考截图 |
| `catalog/system-function-catalog.md` | 系统功能目录（用于二级菜单定位） |
| `frontend` | 生成的 React 项目源码 |

## 关键技术栈与规范
- Vite + React 18 + TypeScript
- Ant Design 5.x
- react-router-dom v6
- React Context + useReducer（轻量状态管理）
- Mock 数据（setTimeout 模拟 API）

## 模拟数据使用规范
- 统一放在 `frontend/src/mock/` 下，每功能模块独立一个 mock 文件；`setTimeout` 模拟 300ms-800ms 延迟；列表 20-50 条，详情单条。
- 通用响应 `ApiResponse<T>{code, data, message}`（code=0 成功）与列表 `ListData<T>{list, total, page, pagesize}`。
- 完整规范与实现见 `skills/build-pages.md`。

## 代码输出规范
- 类型 `.ts/.tsx`；样式 CSS-in-JS（Ant Design `createStyles`）或 `.less`；路由加载 `React.lazy()` + `suspense`；组件名 PascalCase、文件名 camelCase。
- 文件创建顺序：类型 → Mock → 子组件（从内到外）→ 主页面 → 路由 → 样式。
- 最小输出原则：每次只输出 1-2 个文件完整内容，其余输出 diff，未改只给路径。
- 完整规范见 `skills/build-layout.md` 与 `skills/build-pages.md`。

## 全局排除规则
以下目录在任何任务中都不应被读取：
- `node_modules/`、`dist/`、`build/`、`.git/`、`__pycache__/`

## 智能加载规则
1. **最小加载规则**：只加载完成任务所必需的绝对最小文件集合
2. **按需加载规则**：先了解目录结构，再选择加载具体文件
3. **延迟加载规则**：直到需要时才加载文件内容

### 目录结构获取规则
- 列出目录时，单层级不超过 30 个条目
- 获取目录结构时，深度不超过 2 层

### 图片处理策略
- **不读取图片的二进制内容**
- 仅获取图片的文件名、路径和基础元信息
- 需要视觉参考时，输出结构化占位描述模板提示用户补充

### 文档流程减肥协议（【核心】归档 + 基线对账）
- 本规则用于控制文档膨胀，降低每次任务文档读写量。
- **不破坏既有 GATE 顺序与文档职责。**

#### 触发归档条件（文档追加+归档）
- 任一需求文档 `requirement / plan / test`（及长期累积的 `build_log`）超 **250 行**时，触发归档。
- 归档方式：将「历史/已完成章节」原样搬运到同需求目录下的 `_archive/` 子目录（命名 `[文件基名]_full.md`），主文档收敛为「**本次最新基线 + 增量汇总表**」，顶部加醒目标注指向归档位置。
- 归档原则：**纯搬运、不删改业务内容、零信息丢失**；完整历史可从 `_archive/` 还原。
- `_archive/` 子目录**默认不纳入 git 常规提交**（仅作历史保留，经用户确认后可调整）。

#### 增量汇总表维护（归档后主文档必备）
- requirement / plan / test 归档后，必须在主文档维护一张「增量汇总表」（轮次 | 核心需求 | 关键落地 / 验证要点），保证只读主文档即可回溯全部历史。
- 后续任务启动**只读「基线 + 增量汇总表」**即可，不翻历史全文。

#### 基线对账表（文档-代码制品基线对账）
- 每个需求目录的 `build_log_{yyyyMMdd}.md` 末尾维护一张「基线对账表」：
  - **代码制品**：文件路径 | 职责 | 最近改动轮次
  - **文档制品**：文件路径 | 职责 | 归档位置
- 任务启动**先读对账表定位涉事文件**，不翻阅历史迭代记录。

#### 归档执行顺序（强制）
1. 判定文档超 250 行 → 建 `_archive/` → 复制完整版到 `_archive/[文件基名]_full.md`。
2. 重写主文档为「基线 + 增量汇总表」瘦身版（保留基本信息、最新轮次章节）。
3. 向 `build_log` 末尾新增/更新「基线对账表」。
4. （试点需求验证通过后）后续需求自动按本规则执行。

### 禁止创建临时文件（【核心】）
任何情况下禁止在 `frontend/` 或项目根目录创建以 `_tmp/`、`_temp/` 开头的临时脚本文件；改代码优先用 Edit/Write。验证优先 `npx tsc --noEmit`、`npm run build` 等只读命令，不得建脚本绕开编辑限制；确需临时文件须在收尾删除。详见 `skills/build-pages.md`。