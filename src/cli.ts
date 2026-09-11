#!/usr/bin/env node
import { installSkill } from './install-skill.js';
import { startMcpServer } from './server.js';

const cmd = process.argv[2];

function help() {
  process.stdout.write(`op-product-design-mcp

无参数                 启动 MCP stdio，并自动把 Skill 注入到已检测到的客户端目录
install / install-skill [dir]
                       一条命令安装 Skill。不传 dir 时自动拷到：
                       ~/.agents/skills（Codex）以及本机已有的
                       Cursor / Claude / Trae / CodeBuddy / WorkBuddy 目录
                       传 dir 则只装到该目录
--help                 显示帮助
`);
}

if (cmd === '--help' || cmd === '-h' || cmd === 'help') {
  help();
  process.exit(0);
}

if (cmd === 'install' || cmd === 'install-skill') {
  try {
    const { dests } = installSkill(process.argv[3]);
    process.stdout.write(`已安装 Skill（${dests.length} 处）：\n`);
    for (const dest of dests) process.stdout.write(`  ${dest}\n`);
    process.stdout.write(
      '\n请新开一轮对话。若尚未接入 MCP，把下面配进客户端：\n\n  npx -y op-product-design-mcp\n\n',
    );
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
