# OP 原型 MCP

按火花 OP 设计规范生成可预览 HTML，并通过 MCP 强制走：

用户需求 → Skill / 视觉规则 → MCP 落盘校验 → 内置浏览器预览 → 修改 → 热更新

MCP **不自己画页面**。宿主 AI（Codex）读 Skill 写 HTML；MCP 是唯一出口：校验、写入 `out/<slug>/preview.html`、起本地预览、写盘后 SSE reload。

## 流程

1. 先 `get_brief`（以及 resources：skill / visual / template）。
2. `create_prototype` 交完整 HTML（或从模板 / 墙管理示例脚手架）。
3. 打开返回的 `http://127.0.0.1:<port>/<slug>/`（Codex 内置浏览器，不要 `file://`）。
4. 改需求时 `get_prototype` → 按规则改 → `update_prototype`。已打开的页会自动刷新。
5. 定稿可点预览右上「下载原型交互文件」，或 `export_prototype`，把 `out/<slug>/<slug>.html` 丢给开发。导出文件不含该按钮。

禁止绕开 MCP 改 hop `src/`，禁止 antd 5 / Tailwind / 真实接口。

## 开发

```bash
npm install
npm run build
node dist/server.js
```

冒烟（创建 → 预览 → 热更新）：

```bash
npm run smoke
```

## 接入 Codex

项目内已有 `.codex/config.toml`。全局配置可写 `~/.codex/config.toml`：

```toml
[mcp_servers.op-prototype]
command = "node"
args = ["dist/server.js"]
cwd = "/Users/carlos/Desktop/op-product-design-mcp"
```

改路径后执行 `npm run build`。对话里让 Codex「按 OP 原型 MCP 生成预览」即可。

## 工具

| 工具 | 作用 |
|------|------|
| `get_brief` | Skill + 硬规则 + 工作流 |
| `create_prototype` | 创建并打开预览 |
| `get_prototype` | 读当前 HTML，供增量修改 |
| `update_prototype` | 覆盖写入并热更新 |
| `start_preview` | 只启动/返回预览 URL |
| `list_prototypes` | 已有原型 |
| `validate_prototype` | 静态规范检查 |
| `export_prototype` | 导出可转发单文件 HTML 给开发 |
| `get_bundled_css` | 应内联的 tokens/theme/layout |

Resources：`op-prototype://skill`、`visual`、`template`、`example`、CSS。

## 热更新

预览是 `127.0.0.1` HTTP，不是本地文件。默认**只占用 5179 一个端口**，多个原型用路径区分：

- 公告：`http://127.0.0.1:5179/announcement-manage/`
- 敏感词：`http://127.0.0.1:5179/sensitive-word-manage/`

后续 `create` / `update` 发现 5179 已是本预览服务时会复用，不再另起 5180。写盘后按 slug 通知对应页 reload。

## 规范包

- `SKILL.md` 权威步骤与硬规则
- `references/visual.md`
- `styles/tokens.css` `theme.css` `layout.css`
- `templates/preview.html`
- `examples/wall-manage.preview.html`

工作稿：`out/<slug>/preview.html`（给预览热更新）。  
交付给开发：`out/<slug>/<slug>.html`（`export_prototype`，无热更新脚本）。
