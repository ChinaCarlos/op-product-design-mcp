# 使用说明：接入 MCP、Skill 与各 AI 平台

每人在自己电脑跑。预览地址是本机 `http://127.0.0.1:5179/`，不是云端服务。

npm 包：https://www.npmjs.com/package/op-product-design-mcp  
仓库：https://github.com/ChinaCarlos/op-product-design-mcp

## 1. 先搞清两件套

| 组件 | 干什么 | 不装会怎样 |
|------|--------|------------|
| **MCP `op-prototype`** | 校验、写入 `out/`、起预览、热更新、导出 | AI 只能口头说 HTML，不能打开可预览页 |
| **Skill `spark-op-prototype`** | 告诉模型何时触发、必须先 `get_brief`、禁止改 hop | 模型不一定会走规范，容易自己写 antd 5 / Tailwind |

两者都要装。Skill 不会随 `npx` 自动进编辑器。

工作流：

```text
用户需求 → Skill → MCP get_brief → 写 HTML
        → create_prototype / update_prototype
        → 浏览器打开 http://127.0.0.1:5179/<slug>/
        → 改需求仍走 MCP（热更新）
        → export_prototype 把单文件丢给开发
```

## 2. 前置条件

1. **Node.js ≥ 18**（`node -v`、`npx -v` 能用）
2. 配置里用 **未钉死版本** 的 `npx -y op-product-design-mcp`，始终拉最新包。只有要冻结环境时才写 `op-product-design-mcp@1.0.1`
3. 不要给 MCP 写死 `cwd` 到别人的机器路径。稿会写到**当前工作区**的 `out/`
4. 这条命令是 **stdio 服务**，给编辑器拉起用，不要当普通 CLI 空跑（空跑会卡住等 stdin）

装 Skill：

```bash
npx -y op-product-design-mcp install-skill
```

默认写入 `~/.agents/skills/spark-op-prototype`。装完**新开一轮对话**。

指定目录示例：

```bash
# Cursor 项目级
npx -y op-product-design-mcp install-skill .cursor/skills

# Claude Code 项目级
npx -y op-product-design-mcp install-skill .claude/skills
```

## 3. 通用 MCP JSON（多数编辑器通用）

只要客户端认 `mcpServers` + stdio，都可以用这一段：

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

有的客户端要求显式 `type`：

```json
{
  "mcpServers": {
    "op-prototype": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "op-product-design-mcp"]
    }
  }
}
```

装好后应能看到工具：`get_brief`、`create_prototype`、`get_prototype`、`update_prototype`、`start_preview`、`list_prototypes`、`validate_prototype`、`export_prototype`、`get_bundled_css`。

---

## 4. 各平台怎么接

### Codex（ChatGPT 桌面端 / Codex CLI / IDE 扩展）

官方说明：https://developers.openai.com/codex/mcp

ChatGPT 桌面端、Codex CLI、IDE 扩展**共用**同一份配置。

**推荐 CLI：**

```bash
codex mcp add op-prototype -- npx -y op-product-design-mcp
codex mcp list
```

**全局配置** `~/.codex/config.toml`（任意项目都能用）：

```toml
[mcp_servers.op-prototype]
command = "npx"
args = ["-y", "op-product-design-mcp"]
```

**本仓库开发**可用项目内 `.codex/config.toml`：

```toml
[mcp_servers.op-prototype]
command = "node"
args = ["dist/cli.js"]
```

改完重启 Codex / IDE 扩展。

**Skill：**

```bash
npx -y op-product-design-mcp install-skill
```

Codex 会扫 `~/.agents/skills`。本仓库还通过 `.agents/skills/spark-op-prototype` 在打开本项目时自动带上 Skill。

也可在对话里用 `$skill-installer` 从 GitHub 安装 `ChinaCarlos/op-product-design-mcp` 下的 `skills/spark-op-prototype`。

对话示例：「按火花 OP 规范，做公告管理页原型」。

---

### Cursor

**配置位置**

| 范围 | 路径 |
|------|------|
| 用户级 | `~/.cursor/mcp.json` |
| 项目级 | 项目根 `.cursor/mcp.json` |

把第 3 节的通用 JSON 贴进去，保存后在 **Cursor Settings → MCP** 刷新，确认 `op-prototype` 已连接、工具列表出现。

**Skill：**

```bash
npx -y op-product-design-mcp install-skill .cursor/skills
```

会得到 `.cursor/skills/spark-op-prototype/SKILL.md`。新开 Composer / Agent 对话。

---

### Claude Code

官方说明：https://code.claude.com/docs/en/mcp-quickstart

**CLI（推荐）：**

```bash
# 用户级，所有项目
claude mcp add --scope user op-prototype -- npx -y op-product-design-mcp

# 项目级，写入仓库 .mcp.json，可随仓库分享
claude mcp add --scope project op-prototype -- npx -y op-product-design-mcp
```

**项目 `.mcp.json`：**

```json
{
  "mcpServers": {
    "op-prototype": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "op-product-design-mcp"]
    }
  }
}
```

用户级也可能写在 `~/.claude.json` 的 `mcpServers`。重启后用 `/mcp` 看是否 connected。项目级配置首次可能要批准。

**Skill：**

```bash
npx -y op-product-design-mcp install-skill .claude/skills
```

或拷到 `~/.claude/skills/spark-op-prototype`。

---

### Trae

官方说明：https://docs.trae.ai/ide/add-mcp-servers · [中文](https://docs.trae.cn/ide/add-mcp-servers)

1. Settings → **MCP**
2. **Add → Add Manually**（或打开 Raw Config）
3. 粘贴第 3 节通用 JSON，保存

**项目级：** 在仓库建 `.trae/mcp.json`，内容同样是 `mcpServers`。若 Trae 有「启用项目级 MCP」开关，打开它。

SOLO / Work 模式下如果工具不稳定，用项目级配置，并在对话里点名 `op-prototype` / `get_brief`。

**Skill：** Trae 若支持 Agent Skills，把 `skills/spark-op-prototype` 拷到其 skills 目录；否则每轮明确说「按 OP 原型 MCP 的 Skill 做，先 get_brief」。

---

### Qoder

官方说明：https://docs.qoder.com/user-guide/chat/model-context-protocol

1. **Qoder Settings**（头像，或 ⌘⇧, / Ctrl+Shift+,）
2. 左侧 **MCP** → **My Servers** → **+ Add**
3. 粘贴通用 JSON（STDIO：`command` = `npx`，`args` 如上）
4. 保存。链接图标表示已连接，展开可看工具

必须在 **Agent 模式** 下对话，模型才能调 MCP（按提示确认）。

**Skill：** 若 Qoder 提供 skills 目录，拷 `skills/spark-op-prototype`；否则口头指定走 MCP。

---

### CodeBuddy

官方说明：https://www.codebuddy.ai/docs/ide/User-guide/MCP

1. 侧边栏对话 → **CodeBuddy Settings**
2. 打开 **MCP**
3. **Add MCP**（或从 MCP Market 装，本包目前需手动）
4. 粘贴：

```json
{
  "mcpServers": {
    "op-prototype": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "op-product-design-mcp"],
      "description": "火花 OP HTML 原型：预览、热更新、导出"
    }
  }
}
```

5. 确认状态变绿，必要时 **Try to Run**，再用 Agent 对话

**Skill：** 拷到 CodeBuddy 的 skills 目录（若有）；否则对话里要求先 `get_brief`。

---

### WorkBuddy

官方说明：https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/MCP-Guide

| 范围 | 路径 |
|------|------|
| 用户级 | `~/.workbuddy/mcp.json` |
| 项目级 | `<项目>/.workbuddy/mcp.json` |

界面：**插件 → MCP 服务器 → 配置 MCP**，或连接器里的自定义连接器。把通用 JSON 合并进去（不要整文件覆盖已有服务器）。

保存后看状态：绿 = 可用，红 = 检查 `npx` 是否在 PATH。自定义 MCP 有时要在连接器列表里点一次「信任 / 启用」，然后完全退出再打开 WorkBuddy。

**Skill：** WorkBuddy 若走 SkillHub / 本地 Skill，把 `skills/spark-op-prototype` 整夹导入；否则在需求里写明使用 `op-prototype` MCP。

---

## 5. 从源码跑（不经过 npm）

```bash
git clone git@github.com:ChinaCarlos/op-product-design-mcp.git
cd op-product-design-mcp
npm install
npm run build
```

JSON 客户端：

```json
{
  "mcpServers": {
    "op-prototype": {
      "command": "node",
      "args": ["dist/cli.js"],
      "cwd": "/绝对路径/op-product-design-mcp"
    }
  }
}
```

这里的 `cwd` 是**包目录**（让 `node dist/cli.js` 找得到文件）。预览稿仍然写到你打开的那个工作区的 `out/`，不是这个 `cwd`。若工作区就是本仓库，则稿也在本仓库 `out/`。

Codex：

```toml
[mcp_servers.op-prototype]
command = "node"
args = ["dist/cli.js"]
```

在本仓库作为工作区打开时不必写 `cwd`。

---

## 6. Skill 对照表

| 平台 | 推荐安装命令或路径 |
|------|-------------------|
| Codex | `npx -y op-product-design-mcp install-skill` → `~/.agents/skills/spark-op-prototype` |
| Cursor | `npx -y op-product-design-mcp install-skill .cursor/skills` |
| Claude Code | `npx -y op-product-design-mcp install-skill .claude/skills` |
| Trae / Qoder / CodeBuddy / WorkBuddy | 把仓库里 `skills/spark-op-prototype` 拷到该产品的 skills 目录；没有 skills 就靠 MCP `get_brief` |

Skill 源文件：仓库 [`skills/spark-op-prototype/SKILL.md`](../skills/spark-op-prototype/SKILL.md)。

规范、模板、CSS **不要**按仓库相对路径去读，一律 MCP：`get_brief`、`get_bundled_css`、resources。

---

## 7. 装完怎么用

对 AI 说：

> 按火花 OP 规范，做「公告管理」原型，要筛选、表格、新建/编辑弹窗。

预期：

1. Skill 被选中（或你 `@` / `$spark-op-prototype`）
2. 先 `get_brief`
3. `create_prototype` 返回 `http://127.0.0.1:5179/<slug>/`
4. 用 Codex / 编辑器**内置浏览器**打开，不要 `file://`
5. 改需求：`get_prototype` → 改 HTML → `update_prototype`（已打开的页会 reload）
6. 定稿：预览右上「下载原型交互文件」，或 `export_prototype`。把 `out/<slug>/<slug>.html` 丢给开发。导出文件没有下载按钮，也不要把 localhost URL 当交付物

禁止：改 hop `src/`、antd 5、Tailwind、真实接口、路由。

---

## 8. 工具与产物

| 工具 | 作用 |
|------|------|
| `get_brief` | Skill + 硬规则 + 工作流 |
| `create_prototype` | 创建并打开预览 |
| `get_prototype` | 读当前 HTML，供增量改 |
| `update_prototype` | 覆盖写入并热更新 |
| `start_preview` | 只启动/返回预览 URL |
| `list_prototypes` | 已有原型 |
| `validate_prototype` | 静态规范检查 |
| `export_prototype` | 导出给开发的单文件 HTML |
| `get_bundled_css` | 应内联的 tokens / theme / layout |

Resources：`op-prototype://skill`、`visual`、`template`、`example`、CSS。

预览只占 **5179** 一个端口，多页面用路径区分，例如 `/announcement-manage/`、`/banner-manage/`。

| 文件 | 给谁 |
|------|------|
| `out/<slug>/preview.html` | 预览热更新工作稿 |
| `out/<slug>/<slug>.html` | 给开发的交付件 |

环境变量：

| 变量 | 作用 |
|------|------|
| `OP_PROTOTYPE_OUT` | 覆盖工作区根目录（稿写到 `<该目录>/out`） |
| `OP_PROTOTYPE_ROOT` | 覆盖包根目录（一般不用） |

---

## 9. 故障排除

| 现象 | 处理 |
|------|------|
| 客户端 0 个工具 / failed | `node`、`npx` 在 PATH 里；重启客户端；不要钉死旧版本 |
| `npx` 卡住没输出 | 正常，它在等 MCP stdio。应写在配置里由编辑器拉起 |
| 预览打不开 | 是否走了 MCP `create_prototype`；看返回的 `http://127.0.0.1:5179/...`，不要用 `file://` |
| 稿写进奇怪目录 / 找不到 out | 不要给 MCP 配别人的绝对 `cwd`；确认当前打开的是目标项目 |
| Skill 不触发 | 是否 `install-skill` 且**新开对话**；对话里直接说「按 OP 原型 Skill」或 `@spark-op-prototype` |
| 端口被占用 | 本服务只复用 5179。若 5179 被别的程序占用，先停掉那个程序 |
| 校验失败 | 按返回信息改 HTML 后再 `update_prototype`，不要绕开 MCP 写盘 |
| 1.0.0 的 npx 行为异常 | 用未钉死的 `npx -y op-product-design-mcp`，会落到带正确 `bin` 的最新版 |

本仓库开发自检：

```bash
npm run smoke
```
