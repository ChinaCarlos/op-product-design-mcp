import { cpSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { SKILL_DIR, defaultSkillInstallDir } from './paths.js';

export function resolveSkillDest(raw?: string): string {
  if (!raw) return defaultSkillInstallDir();
  const dest = path.resolve(raw);
  const base = path.basename(dest);
  if (base === 'skills' || base === '.agents' || base === '.cursor' || base === '.codex') {
    return path.join(dest, base === 'skills' ? 'spark-op-prototype' : 'skills/spark-op-prototype');
  }
  if (base !== 'spark-op-prototype') {
    return path.join(dest, 'spark-op-prototype');
  }
  return dest;
}

export function installSkill(destInput?: string): { dest: string; source: string } {
  if (!existsSync(path.join(SKILL_DIR, 'SKILL.md'))) {
    throw new Error(`包内找不到 Skill：${SKILL_DIR}`);
  }
  const dest = resolveSkillDest(destInput);
  mkdirSync(path.dirname(dest), { recursive: true });
  cpSync(SKILL_DIR, dest, { recursive: true });
  return { dest, source: SKILL_DIR };
}
