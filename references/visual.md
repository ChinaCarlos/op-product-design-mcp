# 视觉与排版（原型专用 · 细化）

生成 HTML **只遵守本文件**。控件库锁 **antd 4.24.8**（与 OP 一致）：CDN + React 17 + moment。不要 antd 5/6，不要 `ConfigProvider.theme`。

---

## 1. 令牌

| 用途 | 值 |
|------|-----|
| 页面底 | `#f5f7fa` |
| 卡片（筛选 / 表 / Tab） | `#ffffff` |
| Tab / 链接 / 分页选中 / 焦点 | `#f85515` |
| **实心主按钮** | `#6366f1` hover `#818cf8` active `#4f46e5` |
| Radio 选中 | `#ff8f45` |
| 正文 / 次要 | `#1f2937` / `#6b7280` |
| 边框 / 浅边框 | `#e5e7eb` / `#f0f2f5` |
| 表头底 | `#fafafa` |
| 页面边距 / 区块 | `24px` / `16px` |
| **卡片圆角** | `8px`（仅页面壳、筛选卡、表卡、Tab 栏） |
| **控件圆角** | `2px`（按钮、输入、Select、DatePicker、分页格子） |
| 控件高度 | 默认 `32px`（筛选、主操作、操作列按钮都用默认尺寸，不要 `size="small"`） |
| 字号 | 正文 `14px`；筛选 label `13px`；字重 400 / 600 |

间距只用 4 / 8 / 16 / 24 / 32。

## 主题为什么必须单独、且不能写在 `.op-proto` 里

CDN 的 `antd.min.css` 把 `@primary-color` 编译成了 **`#1890ff`**。OP 线上是 less 变量 + 全局覆盖；原型如果只在 `.op-proto .ant-xxx` 里改色：

1. **Select / DatePicker / Popconfirm / Modal / message 会挂到 `document.body`**，不在 `.op-proto` 子树，下拉选中、日历选中、焦点环仍是官方蓝。
2. 只改了主按钮，输入焦点、分页 hover、Spin 仍走默认蓝。

因此生成 HTML 必须按顺序引入：`antd.min.css` → `tokens.css` → **`theme.css`（全局）** → `layout.css`。  
`theme.css` **不要**加 `.op-proto` 前缀。`ConfigProvider` 加 `getPopupContainer` 作为双保险。

映射：

| 角色 | 色 | 覆盖组件 |
|------|-----|----------|
| 主题橙 `#f85515` | Tab / Menu / 链接 / 焦点 / 分页 / Select 选中 / 日历选中 / Steps / Slider |
| 实心主按钮 `#6366f1` | 仅 `type="primary"` |
| 暖橙 `#ff8f45` | Radio（含 Button/solid）/ Checkbox / Switch |

---

## 2. 按钮（必须做成「OP 直角感」，不要胶囊圆角）

antd 4 按钮默认约 2px 圆角，不要再加大。若样式被覆盖，仍以 2px 为准。

| 场景 | type | size | 颜色 |
|------|------|------|------|
| 筛选「查询」、表右上「新建」、弹窗「确定」 | `primary` | 默认 32px | 靛蓝 |
| 弹窗「取消」 | `default` | 默认 | 白底灰边 |
| 行内「编辑」 | `primary` | 默认 32px，不要 `size="small"` | 靛蓝 |
| 行内「删除」 | `default` + `danger` | 默认 32px，不要 `size="small"` | 红字红边，**不要** `type="primary" danger` |
| 同一操作区最多一个大号 primary；操作列编辑/删除与查询、新建同高 |

- 无投影、无渐变、无 pill
- 文字左右 padding：默认 15px
- 可点击 `cursor: pointer`

---

## 3. 搜索 / 筛选区

结构（不要用 `Form layout="inline"` 把查询按钮挤进字段流）：

```text
.op-filter-card（白底、1px 浅边、8px 圆角、轻阴影、padding 14px 16px；flex wrap）
  .op-filter-fields（display:contents，字段参与卡片同一行流）
    .op-filter-item × N
      .op-filter-label + 控件
  .op-filter-action（筛选项之后最后一项，margin-left: auto）
    [查询] primary
```

细则：

- 筛选卡与下方表卡间距 `16px`（表卡自己 `margin-top: 16px`）
- label：`13px`、深色字、控件左侧，label 与控件间距 `6px`，不换行
- 控件宽：短输入 `140px`，名称 `160px`，Select `160px`，日期范围自适应
- 控件高 32px、圆角 2px。带清除按钮的输入**只给外层** `.ant-input-affix-wrapper` 画边框，内层 `.ant-input` 不要再描边、不要再设死高度（否则会出现缺边、双边框）。
- 「查询」是筛选项流里的**最后一项**：跟字段一起折行，落在**最后一行**，`margin-left: auto` 右对齐（末行有空位就跟字段同一行靠右；没空位就独占一行靠右）
- 「查询」右缘贴筛选卡右内边距 16px，与表卡「新建」同一条右对齐线（两张卡水平 padding 都是 16px）
- 「查询」**不**放在筛选第一行最左，也**不**放在表格工具栏，不要单独做成贴右上的第二列
- 不要在筛选区放「新建」

---

## 4. 列表展示区

```text
.op-table-card（白底、浅边、8px 圆角、卡片阴影、padding 12px 16px 16px）
  .op-table-toolbar
    左：可选提示/说明（如「*导出为全部数据」）；**禁止**「共计 n 条」
    右：新建 primary
    无左侧文案时：工具栏只保留右侧按钮（extra-only）
  Table（无内部分页）
  空态 / loading
  .op-table-pagination（含「共计 n 条」）
```

细则：

- 工具栏 `margin-bottom: 12px`，左右分布，主操作永远在右上；「新建」作为工具栏最后一个操作右对齐，右缘贴表卡右内边距 16px（与筛选「查询」同一右缘）
- 表头：底 `#fafafa`，字 14px / 600，深色，不要斑马纹
- 单元格：上下约 12px，左右 16px；长文 `word-break: break-word`，空值 `—`
- 表头允许单行，列设 `ellipsis` 或最小宽，**禁止**把「礼物名称」竖着拆成一字一行（给列 `width` + `ellipsis`，表设 `scroll.x`）
- 最后一行 `td` **去掉底边**，避免和分页顶线叠成双线
- loading：居中 Spin，高至少 200px；空态：`Empty` 文案「暂无数据」

---

## 5. 操作列

- 列宽至少 `180px`，`nowrap`
- `.op-row-actions`：`display:flex; gap:8px; align-items:center; flex-wrap:nowrap`
- 顺序：编辑 → 删除（若有更多，确认类靠后）
- 编辑：`primary`，默认尺寸（不要 `size="small"`）
- 删除：`danger`，默认尺寸（不要 `size="small"`），点出「确认删除？」；确定键 danger

---

## 6. 分页区

- 在表卡**内部**底部，不单独再套一张卡
- `justify-content: flex-start`（靠左）
- `margin-top: 16px; padding-top: 16px; border-top: 1px solid #f0f2f5`
- `showSizeChanger={false}`，文案 `共计 ${total} 条`
- 分页数字格子圆角 2px；当前页用主题橙边/字，不要靛蓝
- 不要 `flex-end` 到右边

---

## 7. 新增 / 编辑弹窗

- 宽 **700px**（OP ModalForm 默认）
- 标题：新建 / 编辑
- 底栏右对齐：取消（default）→ 确定（primary 靛蓝）
- 表单一列：`labelCol span=8`，`wrapperCol span=12`，label 右对齐习惯随 antd
- 控件 `width: 100%`，间距 `16px`
- 必填用 `required` 标记，不要只用红字
- 弹窗外壳圆角可 8px；内部输入仍 2px
- 只读预览（如礼物信息）：
  - 放在对应 ID 字段下方
  - `Form.Item` + 轻 Card + `Descriptions` **不要** `bordered`
  - 标签 96px、次要色；名称字重 600
  - 浅分割线，不要粗黑表

---

## 8. 页面壳（Tab）

- 无模块大标题（文档头「墙管理」是预览说明，不算业务页标题）
- Tab 白卡片、项 `padding: 0 20px`、首项左 `12px`、高 46px、选中橙底边 2px
- 内容距 Tab `16px`

---

## 9. 禁止

- 按钮 / 输入做成 6px+ 大圆角或胶囊
- 主按钮、分页、Tab 都变成同一蓝色
- 查询按钮混在表格工具栏；新建放进筛选行
- 分页靠右；表末行 + 分页双线
- 操作列换行挤成两行或名称竖排
- Tailwind / shadcn / Google Fonts / 官方蓝 `#1677FF`

---

## 10. 预览下载（只存在于 MCP 预览，不进交付 HTML）

本地预览页（`http://127.0.0.1:5179/<slug>/`）右上角由**预览服务注入**「下载原型交互文件」：

- 固定在页面视口右上（`position: fixed; top: 12px; right: 16px`）
- 白底灰边、2px 圆角、高 32px，不要做成业务主按钮靛蓝
- 点击下载当前原型的导出文件 `out/<slug>/<slug>.html`

硬规则：

- **不要**把下载按钮写进业务原型 HTML / 模板 / 示例
- `export_prototype` 和 `/<slug>/download` 产出的文件**必须去掉**该按钮和热更新脚本
- 丢给开发的交互 HTML 打开后，右上角不应再有「下载原型交互文件」
