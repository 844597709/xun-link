# 共享约束（Skills 公共基线）

> 本文件定义所有 skill 共用的 **写文件自检** 与 **追加章节命名（GATE 对齐）** 的约束。各 skill 通过「见 _shared.md」引用，避免多份重复表达导致维护漂移。**不新增/删除任何既有业务约束，仅做数据重定义。**

## 写文件前自检（重点，所有 skill 强制）

Write/Edit 任何 **已存在** 的 `*` .md （如 `test_{yyyyMMdd}.md` / `build_log_{yyyyMMdd}.md` / `plan_{yyyyMMdd}.md` / `requirement_{yyyyMMdd}.md` / `prod*.md` / `catalog/system-function-catalog.md`），必须先在本回合内用 `Read` 工具 **真实读取该文件一次**（历史读取、系统注入读取不算）。未读直接写入触发 "File has not been read yet" 报错，导致反复重试卡死。

- 对 **已存在文件** 做追加/更新，同样必须先真实 Read。
- 同一文件 **本回合已读过** 可继续改，无需重复读取。
- 全新文件（首次创建）不受此限，可直接 Write。

## 追加章节命名（统一 GATE 对齐）

各阶段文档的追加章节名与 GATE 强制对齐，**不允许换名**：

| GATE | 文档 | 追加章节（须原样使用） |
|---|---|---|
| --- | --- | --- |
| GATE-1 | `requirement_{yyyyMMdd}.md` | `追加优化需求` |
| GATE-2 | `plan_{yyyyMMdd}.md` | `追加优化实施计划` + `追加优化测试要点` |
| GATE-3 | `build_log_{yyyyMMdd}.md` | `追加优化迭代记录` |
| GATE-4 | `test_{yyyyMMdd}.md` | `追加测试记录` |

- 章节编号用「优化点 N」与 requirement/plan 对齐。
- 对已存在文档 **只追加、不重写** 既有内容；首次开发追加到「## 已完成」列表。