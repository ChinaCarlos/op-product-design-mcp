---
name: spark-op-prototype
description: >-
  根据需求材料生成火花 OP 设计规范的可预览 HTML（antd 控件 + 已冻结色板与排版）。
  不写 hop 业务代码、不接接口、不挂路由。
  Triggers: spark-op-prototype、OP 原型、预览 HTML、设计规范原型、给产品看稿、antd 原型。
---

# Spark OP 原型 HTML

对人说明用**简体中文**。

本 Skill 只产出 **预览 HTML**。禁止改 hop 的 `src/`、禁止走 `spark-op-dev` 写页面。

先 Read：

1. [references/visual.md](references/visual.md)
2. [styles/tokens.css](styles/tokens.css)
3. [styles/theme.css](styles/theme.css)（**全局**盖 antd 蓝，不要包在 `.op-proto` 里）
4. [styles/layout.css](styles/layout.css)
5. [templates/preview.html](templates/preview.html)
6. 对照 [examples/wall-manage.preview.html](examples/wall-manage.preview.html)

若当前工作区 Skill 在 `.cursor/skills/spark-op-prototype/`，上述路径改读仓库里的 `op-prototype/` 同名文件。

---

## 步骤

1. 读用户需求（口述 / md / 截图 / pdf）。**不要**为了实现去要 swagger；有字段表可用来填列名。
2. 推断：Tab 或单页、筛选、列、右上主操作、行内操作、弹窗字段。缺口标「推断」。
3. 以 `templates/preview.html` 为壳，填业务文案与假数据。
4. 把 `tokens.css` + `theme.css` + `layout.css` **内联**进 `<style>`（顺序：antd.css → tokens → theme → layout）。
5. **必须**经 MCP `create_prototype` / `update_prototype` 写入 `out/<短横线英文或拼音>/preview.html`。不要直接改磁盘绕开校验。
6. 用 MCP `start_preview` 的 `http://127.0.0.1:<port>/<slug>/` 在 Codex 内置浏览器打开。禁止 `file://`。之后修改走 `update_prototype`，预览会热更新。
7. 定稿后 `export_prototype`，把 `out/<slug>/<slug>.html` 丢给开发。这是单文件、CSS 内联、无热更新脚本。不要发 localhost 预览地址。

---

## 硬规则

严格按 visual.md 第 2～7 节：

- CDN 锁 **antd@4.24.8** + React 17 + moment + `antd-with-locales`；`ConfigProvider locale={antd.locales.zh_CN}`。禁止 antd 5、禁止 `theme` token、禁止 dayjs 替代 moment。
- Modal 用 `visible`（不要只写 antd 5 的 `open`）。`ReactDOM.render`，不要 `createRoot`。
- 筛选：`.op-filter-card` = 字段折行；**查询是最后一项**，落在筛选项最后一行并右对齐（与「新建」同一右缘）。不要 `Form layout="inline"`，筛选里不要放新建。
- 表：左说明（可选，不要共计）；右上新建；列 `ellipsis`；操作列 nowrap；编辑默认尺寸 primary，删除默认尺寸 danger（不要 size="small"）。
- 分页在表卡内靠左，`showTotal` 写共计；弹窗宽 700；只读预览无 bordered 粗表。
- 主按钮靛蓝；焦点/分页/下拉/日历用主题橙。必须用全局 `theme.css`，因为弹层在 body 上。`getPopupContainer` 指到父节点。禁止页面上残留 `#1890ff`。
- **不要**：Tailwind / shadcn / antd 5 / 真实请求 / 路由。
- 预览页右上「下载原型交互文件」由 MCP 预览服务注入，**不要**写进业务 HTML；导出文件里也不能有这个按钮。

---

## 自检

- [ ] 脚本是 antd 4.24.8，按钮 2px 圆角不是胶囊
- [ ] 查询在筛选项最后一行右对齐，新建在表右上右对齐，两者右缘对齐；分页在左
- [ ] 表格左上没有「共计 n 条」（条数只在分页）
- [ ] 筛选输入是完整边框（不要给内部 input 再描一层边）
- [ ] 表头不竖排拆字；操作列编辑/删除同一行、默认尺寸不是 small
- [ ] 内联了 theme.css；Tab / Select 下拉 / Radio 选中不是官方蓝 `#1890ff`
- [ ] 未修改 hop `src/` 与 `spark-op-dev`
- [ ] 业务稿和导出 HTML 都没有预览下载按钮（只在 localhost 预览里出现）
