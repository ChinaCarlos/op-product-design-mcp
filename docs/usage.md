# 使用说明：接入 MCP、Skill 与各 AI 平台

## 环境要求（先看这里）

本工具跑在你自己的电脑上，预览地址是 `http://127.0.0.1:5179/`，**不是云端**。

**必须先安装 Node.js 18 或更高版本**（会自带 `npm` / `npx`）。没装 Node 时，后面的 `npx`、MCP、Skill 安装命令都跑不起来。

1. 打开官网下载并安装 LTS 版本：
   - 中文下载页：https://nodejs.org/zh-cn/download
   - 英文官网：https://nodejs.org/
   - macOS 也可用 Homebrew：`brew install node`
2. 新开一个终端，检查：

```bash
node -v    # 应 ≥ v18
npx -v
```

| 谁 | 电脑上要有什么 | 不需要 |
|----|----------------|--------|
| **用这个出原型的人**（Codex / Cursor / Trae 等） | Node.js ≥ 18；对应的 AI 客户端 | 不必装 pnpm、不必 clone 仓库、不必全局安装本包 |
| **改这个仓库的人** | Node.js ≥ 18 + **pnpm** | 发 npm 仍用 `npm publish` |

npm 包：https://www.npmjs.com/package/op-product-design-mcp  
仓库：https://github.com/ChinaCarlos/op-product-design-mcp

---

## 1. 先搞清两件套

| 组件 | 干什么 | 不装会怎样 |
|------|--------|------------|
| **MCP `op-prototype`** | 校验、写入 `out/`、起预览、热更新、导出 | AI 只能口头说 HTML，不能打开可预览页 |
| **Skill `spark-op-prototype`** | 告诉模型何时触发、必须先 `get_brief`、禁止改 hop | 模型不一定会走规范，容易自己写 antd 5 / Tailwind |

两者都要装。下面 **Skill 的两种安装方式都支持**，选一种即可。

工作流：

```text
用户需求 → Skill → MCP get_brief → 写 HTML
        → create_prototype / update_prototype
        → 浏览器打开 http://127.0.0.1:5179/<slug>/
        → 改需求仍走 MCP（热更新）
        → export_prototype 把单文件丢给开发
```

使用者配置里写的是编辑器拉起的 stdio 服务，不要当普通 CLI 空跑：

```bash
npx -y op-product-design-mcp
```

- 没装 Node：`npx` 不存在，MCP 显示 0 个工具 / failed
- Node 低于 18：进程可能直接挂
- 公司网络拦 npm 源：第一次 `npx` 会失败，需要能访问 `registry.npmjs.org`
- 不需要 Python、Java、Docker
- 配置不要钉死版本，始终用最新包；不要给 MCP 写死别人的机器 `cwd`。稿写到**当前工作区** `out/`

本仓库开发才用 pnpm。使用者配置里继续写 `npx`，不要改成 `pnpm exec`。

---

## 2. 安装 Skill（两种方式都支持）

两种效果相同：把 `spark-op-prototype` 拷到本机已检测到的 skills 目录。任选一种。装之前请确认已装 Node.js（见文档最上方）。

### 方式一：npx（推荐，类似直接调包）

```bash
npx -y op-product-design-mcp install
```

### 方式二：curl 脚本（类似 brew / oh-my-zsh）

```bash
curl -fsSL https://raw.githubusercontent.com/ChinaCarlos/op-product-design-mcp/main/scripts/install.sh | bash
```

脚本内部仍会调用方式一，适合复制给同事「一条命令装好」。

不传目录时会自动注入到：

- 一定写入 `~/.agents/skills/spark-op-prototype`（Codex）
- 若本机已有 `~/.cursor` / `~/.claude` / `~/.trae` / `~/.codebuddy` / `~/.workbuddy` / `~/.codex`，也写入对应 `skills/`
- 当前项目若已有 `.cursor` / `.claude` 等目录，一并写入项目级 skills

只配 MCP、忘了跑上面两条也行：MCP 进程启动时会静默再注入一次（`OP_PROTOTYPE_SKIP_SKILL_INSTALL=1` 可关）。装完**新开一轮对话**。

指定单一目录（两种方式装完后也可以再跑）：

```bash
npx -y op-product-design-mcp install .cursor/skills
npx -y op-product-design-mcp install .claude/skills
```

兼容旧命令：`npx -y op-product-design-mcp install-skill` 与方式一相同。

## 4. 通用 MCP JSON（多数编辑器通用）

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

## 5. 各平台怎么接

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

**Skill（两种方式都支持）：**

```bash
npx -y op-product-design-mcp install
```

```bash
curl -fsSL https://raw.githubusercontent.com/ChinaCarlos/op-product-design-mcp/main/scripts/install.sh | bash
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
npx -y op-product-design-mcp install .cursor/skills
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
npx -y op-product-design-mcp install .claude/skills
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

## 6. 从源码跑（不经过 npm）

```bash
git clone git@github.com:ChinaCarlos/op-product-design-mcp.git
cd op-product-design-mcp
pnpm install
pnpm build
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

## 7. Skill 对照表

| 平台 | 推荐安装命令或路径 |
|------|-------------------|
| 方式一 npx | `npx -y op-product-design-mcp install` |
| 方式二 curl | 见第 2 节方式二：`scripts/install.sh` |
| Codex | 自动写入 `~/.agents/skills/spark-op-prototype` |
| Cursor | 检测到 `~/.cursor` 或项目 `.cursor` 时自动写入 |
| Claude Code | 检测到 `~/.claude` 或项目 `.claude` 时自动写入 |
| Trae / CodeBuddy / WorkBuddy | 检测到对应用户目录时自动写入；没有目录就靠 MCP `get_brief`，或指定路径再跑一次 install |

Skill 源文件：仓库 [`skills/spark-op-prototype/SKILL.md`](../skills/spark-op-prototype/SKILL.md)。

规范、模板、CSS **不要**按仓库相对路径去读，一律 MCP：`get_brief`、`get_bundled_css`、resources。

---

## 8. 装完怎么用

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

## 9. 工具与产物

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
| `OP_PROTOTYPE_SKIP_SKILL_INSTALL` | 设为 `1` 时 MCP 启动不自动注入 Skill |

---

## 10. 故障排除

| 现象 | 处理 |
|------|------|
| 客户端 0 个工具 / failed | 先确认已装 [Node.js ≥ 18](https://nodejs.org/zh-cn/download)；`node -v`、`npx -v` 能用；重启客户端 |
| `npx` 卡住没输出 | 正常，它在等 MCP stdio。应写在配置里由编辑器拉起 |
| 预览打不开 | 是否走了 MCP `create_prototype`；看返回的 `http://127.0.0.1:5179/...`，不要用 `file://` |
| 稿写进奇怪目录 / 找不到 out | 不要给 MCP 配别人的绝对 `cwd`；确认当前打开的是目标项目 |
| Skill 不触发 | 是否跑过 `install` 或 MCP 已自动注入，且**新开对话**；对话里直接说「按 OP 原型 Skill」或 `@spark-op-prototype` |
| 端口被占用 | 本服务只复用 5179。若 5179 被别的程序占用，先停掉那个程序 |
| 校验失败 | 按返回信息改 HTML 后再 `update_prototype`，不要绕开 MCP 写盘 |
| 1.0.0 的 npx 行为异常 | 用未钉死的 `npx -y op-product-design-mcp`，会落到带正确 `bin` 的最新版 |

本仓库开发自检：

```bash
pnpm smoke
```
