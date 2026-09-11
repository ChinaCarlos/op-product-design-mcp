# OP 原型 MCP

按火花 OP 设计规范生成可预览 HTML。Skill 负责触发和工作流，MCP 负责校验、落盘、预览和导出。

```text
用户需求 → Skill → MCP → http://127.0.0.1:5179/<slug>/ → 修改仍走 MCP → 热更新 → 导出给开发
```

MCP **不自己画页面**。宿主 AI 读 Skill 写 HTML；MCP 是唯一出口。

- npm：https://www.npmjs.com/package/op-product-design-mcp
- 仓库：https://github.com/ChinaCarlos/op-product-design-mcp
- **完整接入说明（Codex / Cursor / Claude Code / Trae / Qoder / CodeBuddy / WorkBuddy）：** [docs/usage.md](docs/usage.md)

每人在自己电脑跑。预览是本机 `127.0.0.1:5179`，不是云端。先装 MCP，再装 Skill。

## 快速开始

需要 Node.js ≥ 18。配置里不要钉死版本，始终用最新包。

**1. 接入 MCP（任选一）**

Codex `~/.codex/config.toml`：

```toml
[mcp_servers.op-prototype]
command = "npx"
args = ["-y", "op-product-design-mcp"]
```

```bash
codex mcp add op-prototype -- npx -y op-product-design-mcp
```

Cursor / Trae / WorkBuddy / 多数编辑器，用户级或项目级 `mcp.json`：

```json
{
  "mcpServers": {
    "op-prototype": {
      "command": "npx",
      "args": ["-y", "op-product-design-mcp"]
    }
  }
}
```

| 平台 | 配置位置 |
|------|----------|
| Codex | `~/.codex/config.toml` 或项目 `.codex/config.toml` |
| Cursor | `~/.cursor/mcp.json` 或 `.cursor/mcp.json` |
| Claude Code | `claude mcp add`；`~/.claude.json` 或项目 `.mcp.json` |
| Trae | Settings → MCP；或 `.trae/mcp.json` |
| Qoder | Settings → MCP → Add |
| CodeBuddy | Settings → MCP |
| WorkBuddy | `~/.workbuddy/mcp.json` 或 `.workbuddy/mcp.json` |

逐步截图级说明见 [docs/usage.md](docs/usage.md)。

**2. 安装 Skill**

```bash
npx -y op-product-design-mcp install-skill
```

默认：`~/.agents/skills/spark-op-prototype`（Codex 会扫这里）。

```bash
npx -y op-product-design-mcp install-skill .cursor/skills
npx -y op-product-design-mcp install-skill .claude/skills
```

装完请新开一轮对话。

**3. 使用**

对 AI 说：「按火花 OP 规范，做/改 xxx 管理页原型」。

1. Skill 被选中，先 `get_brief`
2. `create_prototype` / `update_prototype`
3. 内置浏览器打开 `http://127.0.0.1:5179/<slug>/`（不要 `file://`）
4. 定稿 `export_prototype`，把 `out/<slug>/<slug>.html` 丢给开发

禁止绕开 MCP 改 hop `src/`，禁止 antd 5 / Tailwind / 真实接口。

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

预览默认只占 **5179** 一个端口，多页面用路径区分。写盘后按 slug 热更新。

工作稿：当前工作区 `out/<slug>/preview.html`。  
交付件：`out/<slug>/<slug>.html`（无热更新脚本、无下载按钮）。

## 本仓库开发

```bash
npm install
npm run build
node dist/cli.js          # MCP stdio
npx -y op-product-design-mcp install-skill
npm run smoke
```

规范包：`skills/spark-op-prototype/SKILL.md`、`references/visual.md`、`styles/`、`templates/preview.html`、`examples/wall-manage.preview.html`。

环境变量：`OP_PROTOTYPE_OUT` 覆盖工作区根目录；`OP_PROTOTYPE_ROOT` 覆盖包根（一般不用）。

## License

MIT
