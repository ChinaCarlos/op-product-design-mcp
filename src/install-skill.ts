import { cpSync, existsSync, lstatSync, mkdirSync, realpathSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SKILL_DIR, defaultSkillInstallDir } from './paths.js';

const SKILL_NAME = 'spark-op-prototype';

const HOME_TOOL_DIRS = [
  ['.agents', 'skills'],
  ['.codex', 'skills'],
  ['.cursor', 'skills'],
  ['.claude', 'skills'],
  ['.trae', 'skills'],
  ['.codebuddy', 'skills'],
  ['.workbuddy', 'skills'],
] as const;

const PROJECT_SKILL_DIRS = [
  '.agents/skills',
  '.cursor/skills',
  '.claude/skills',
  '.trae/skills',
  '.workbuddy/skills',
];

export function resolveSkillDest(raw?: string): string {
  if (!raw) return defaultSkillInstallDir();
  const dest = path.resolve(raw);
  const base = path.basename(dest);
  if (base === 'skills') return path.join(dest, SKILL_NAME);
  if (base.startsWith('.') && base !== SKILL_NAME) {
    return path.join(dest, 'skills', SKILL_NAME);
  }
  if (base !== SKILL_NAME) return path.join(dest, SKILL_NAME);
  return dest;
}

function samePath(a: string, b: string): boolean {
  try {
    if (existsSync(a) && existsSync(b)) return realpathSync(a) === realpathSync(b);
  } catch {
    /* ignore */
  }
  return path.resolve(a) === path.resolve(b);
}

function copySkill(dest: string): string {
  if (!existsSync(path.join(SKILL_DIR, 'SKILL.md'))) {
    throw new Error(`包内找不到 Skill：${SKILL_DIR}`);
  }
  if (samePath(SKILL_DIR, dest)) return dest;
  if (existsSync(dest)) {
    try {
      if (lstatSync(dest).isSymbolicLink() && samePath(dest, SKILL_DIR)) return dest;
    } catch {
      /* ignore */
    }
  }
  mkdirSync(path.dirname(dest), { recursive: true });
  cpSync(SKILL_DIR, dest, { recursive: true });
  return dest;
}

function unique(paths: string[]): string[] {
  return [...new Set(paths.map((item) => path.resolve(item)))];
}

/** Codex 默认目录必装；其它客户端只要用户目录或项目目录已存在就注入。 */
export function discoverSkillDestinations(cwd = process.cwd()): string[] {
  const home = os.homedir();
  const dests: string[] = [defaultSkillInstallDir()];

  for (const [toolDir, skillsDir] of HOME_TOOL_DIRS) {
    const root = path.join(home, toolDir);
    if (!existsSync(root)) continue;
    dests.push(path.join(root, skillsDir, SKILL_NAME));
  }

  for (const rel of PROJECT_SKILL_DIRS) {
    const marker = path.join(cwd, rel.split('/')[0]);
    if (!existsSync(marker)) continue;
    dests.push(path.join(cwd, rel, SKILL_NAME));
  }

  return unique(dests);
}

export function installSkill(destInput?: string): { dests: string[]; source: string } {
  const dests = destInput ? [resolveSkillDest(destInput)] : discoverSkillDestinations();
  for (const dest of dests) copySkill(dest);
  return { dests, source: SKILL_DIR };
}

/** MCP 启动时静默注入。失败不影响协议。禁止写 stdout。 */
export function ensureSkillsInstalled(): string[] {
  if (process.env.OP_PROTOTYPE_SKIP_SKILL_INSTALL === '1') return [];
  try {
    return installSkill().dests;
  } catch (error) {
    process.stderr.write(
      `[op-prototype] Skill 自动安装失败：${error instanceof Error ? error.message : String(error)}\n`,
    );
    return [];
  }
}
