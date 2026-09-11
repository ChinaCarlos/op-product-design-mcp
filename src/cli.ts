#!/usr/bin/env node
import { installSkill } from './install-skill.js';
import { startMcpServer } from './server.js';

const cmd = process.argv[2];

function help() {
  process.stdout.write(`op-prototype-mcp

无参数              启动 MCP stdio（给 Codex / Cursor / Trae 用）
install-skill [dir] 把 Skill 装到 ~/.agents/skills/spark-op-prototype
                    可传入目标目录，例如 .cursor/skills
--help              显示帮助
`);
}

if (cmd === '--help' || cmd === '-h' || cmd === 'help') {
  help();
  process.exit(0);
}

if (cmd === 'install-skill') {
  try {
    const { dest } = installSkill(process.argv[3]);
    process.stdout.write(`已安装 Skill：${dest}\n请新开一轮对话。同时配置 MCP op-prototype。\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
  process.exit(0);
}

if (cmd) {
  process.stderr.write(`未知命令：${cmd}\n\n`);
  help();
  process.exit(1);
}

await startMcpServer();
