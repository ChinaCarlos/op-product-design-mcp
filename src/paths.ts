import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

function hasPackageAssets(dir: string): boolean {
  return (
    existsSync(path.join(dir, 'templates/preview.html')) &&
    existsSync(path.join(dir, 'styles/tokens.css')) &&
    existsSync(path.join(dir, 'skills/spark-op-prototype/SKILL.md'))
  );
}

/** 包内规范、模板、Skill。npx / 全局安装时指向软件包，不指向用户项目。 */
export function findPackageRoot(): string {
  if (process.env.OP_PROTOTYPE_ROOT) {
    return path.resolve(process.env.OP_PROTOTYPE_ROOT);
  }
  const candidates = [path.resolve(here, '..'), path.resolve(here, '../..'), process.cwd()];
  for (const dir of candidates) {
    if (hasPackageAssets(dir)) return dir;
  }
  return path.resolve(here, '..');
}

/** 用户当前工作区。预览稿写入这里的 out/，避免写进 npx 缓存。 */
export function findWorkspaceRoot(): string {
  if (process.env.OP_PROTOTYPE_OUT) {
    return path.resolve(process.env.OP_PROTOTYPE_OUT);
  }
  return process.cwd();
}

export const PACKAGE_ROOT = findPackageRoot();
export const WORKSPACE_ROOT = findWorkspaceRoot();
export const OUT_DIR = path.join(WORKSPACE_ROOT, 'out');
export const STYLES_DIR = path.join(PACKAGE_ROOT, 'styles');
export const TEMPLATE_FILE = path.join(PACKAGE_ROOT, 'templates/preview.html');
export const SKILL_DIR = path.join(PACKAGE_ROOT, 'skills/spark-op-prototype');
export const SKILL_FILE = path.join(SKILL_DIR, 'SKILL.md');
export const VISUAL_FILE = path.join(PACKAGE_ROOT, 'references/visual.md');
export const EXAMPLE_FILE = path.join(PACKAGE_ROOT, 'examples/wall-manage.preview.html');
export const TOKENS_FILE = path.join(STYLES_DIR, 'tokens.css');
export const THEME_FILE = path.join(STYLES_DIR, 'theme.css');
export const LAYOUT_FILE = path.join(STYLES_DIR, 'layout.css');

export function defaultSkillInstallDir(): string {
  return path.join(os.homedir(), '.agents', 'skills', 'spark-op-prototype');
}

export function prototypeDir(slug: string): string {
  return path.join(OUT_DIR, slug);
}

export function prototypeFile(slug: string): string {
  return path.join(OUT_DIR, slug, 'preview.html');
}

export function exportFile(slug: string): string {
  return path.join(OUT_DIR, slug, `${slug}.html`);
}
