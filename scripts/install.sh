#!/usr/bin/env bash
# 一条命令安装 Skill（类似 oh-my-zsh）：
#   curl -fsSL https://raw.githubusercontent.com/ChinaCarlos/op-product-design-mcp/main/scripts/install.sh | bash
set -euo pipefail

if ! command -v npx >/dev/null 2>&1; then
  echo "需要 Node.js ≥ 18（会自带 npx）。请先安装 Node：https://nodejs.org/" >&2
  exit 1
fi

npx -y op-product-design-mcp install

echo
echo "MCP 配置示例（Codex ~/.codex/config.toml）："
echo
echo '[mcp_servers.op-prototype]'
echo 'command = "npx"'
echo 'args = ["-y", "op-product-design-mcp"]'
echo
echo "其它编辑器把 command/args 写进 mcp.json 即可。配好后新开一轮对话。"
