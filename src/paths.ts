import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

function findRoot(): string {
  if (process.env.OP_PROTOTYPE_ROOT) {
    return path.resolve(process.env.OP_PROTOTYPE_ROOT);
  }
  const candidates = [path.resolve(here, '..'), path.resolve(here, '../..'), process.cwd()];
  for (const dir of candidates) {
    if (existsSync(path.join(dir, 'SKILL.md')) && existsSync(path.join(dir, 'templates/preview.html'))) {
      return dir;
    }
  }
  return path.resolve(here, '..');
}

export const ROOT = findRoot();
export const OUT_DIR = path.join(ROOT, 'out');
export const STYLES_DIR = path.join(ROOT, 'styles');
export const TEMPLATE_FILE = path.join(ROOT, 'templates/preview.html');
export const SKILL_FILE = path.join(ROOT, 'SKILL.md');
export const VISUAL_FILE = path.join(ROOT, 'references/visual.md');
export const EXAMPLE_FILE = path.join(ROOT, 'examples/wall-manage.preview.html');
export const TOKENS_FILE = path.join(STYLES_DIR, 'tokens.css');
export const THEME_FILE = path.join(STYLES_DIR, 'theme.css');
export const LAYOUT_FILE = path.join(STYLES_DIR, 'layout.css');

export function prototypeDir(slug: string): string {
  return path.join(OUT_DIR, slug);
}

export function prototypeFile(slug: string): string {
  return path.join(OUT_DIR, slug, 'preview.html');
}

export function exportFile(slug: string): string {
  return path.join(OUT_DIR, slug, `${slug}.html`);
}
