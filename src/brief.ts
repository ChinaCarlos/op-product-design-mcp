import { readFileSync } from 'node:fs';
import { OUT_DIR, PACKAGE_ROOT, SKILL_FILE, VISUAL_FILE } from './paths.js';

export const WORKFLOW = `用户需求 → Skill/规则 → MCP 落盘校验 → 预览 URL → 修改仍走 MCP → 热更新。

强制闭环：
1. 先 get_brief，读 skill 与 visual 资源。
2. 按 templates/preview.html 写完整 HTML（antd 4.24.8 + React 17 + moment + Babel standalone）。
3. 只能通过 create_prototype / update_prototype 交稿，禁止直接改 hop src/，禁止绕开 MCP 写磁盘。
4. start_preview 返回的 http://127.0.0.1:port/<slug>/ 用 Codex 内置浏览器打开，不要 file://。
5. 用户要改时：get_prototype 读当前 HTML → 按规则改 → update_prototype。写盘后已打开的预览会自动 reload。
6. 校验失败必须先修，不要跳过。
7. 预览页右上「下载原型交互文件」由服务注入，不要写进业务 HTML。定稿后点它或 export_prototype，把 out/<slug>/<slug>.html 丢给开发；导出文件不含该按钮，也不要把 localhost URL 当交付物。

规范与模板在 MCP 包内（get_brief / get_bundled_css / resources），不要去仓库相对路径找 css。
预览稿写在当前工作区 out/，不是 node_modules。`;

export function getBrief(): string {
  const skill = readFileSync(SKILL_FILE, 'utf8');
  const visualHead = readFileSync(VISUAL_FILE, 'utf8').split('\n').slice(0, 80).join('\n');
  return [
    WORKFLOW,
    '',
    '--- 路径 ---',
    `PACKAGE_ROOT=${PACKAGE_ROOT}`,
    `OUT_DIR=${OUT_DIR}`,
    '',
    '--- SKILL.md ---',
    skill,
    '',
    '--- visual.md 前 80 行，完整内容见 resource op-prototype://visual ---',
    visualHead,
  ].join('\n');
}
