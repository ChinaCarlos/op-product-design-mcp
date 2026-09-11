import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { EXAMPLE_FILE, OUT_DIR, TEMPLATE_FILE, exportFile, prototypeDir, prototypeFile } from './paths.js';
import { inlinePrototypeCss } from './css.js';
import { buildExportHtml } from './export.js';
import { preview } from './preview.js';
import { normalizeSlug } from './slug.js';
import { formatValidation, validatePrototypeHtml, type Validation } from './validate.js';

export type PrototypeRecord = {
  slug: string;
  title: string;
  file: string;
  previewUrl: string;
};

function extractTitle(html: string, fallback: string): string {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  if (!match) return fallback;
  return match[1].replace(/\s*·\s*OP 原型$/, '').trim() || fallback;
}

export function listPrototypes(): PrototypeRecord[] {
  if (!existsSync(OUT_DIR)) return [];
  return readdirSync(OUT_DIR)
    .filter((name) => existsSync(prototypeFile(name)))
    .map((slug) => {
      const html = readFileSync(prototypeFile(slug), 'utf8');
      return {
        slug,
        title: extractTitle(html, slug),
        file: prototypeFile(slug),
        previewUrl: `http://127.0.0.1:${preview.port || preview.preferredPort()}/${slug}/`,
      };
    });
}

export function readPrototype(slug: string): string {
  const file = prototypeFile(normalizeSlug(slug));
  if (!existsSync(file)) {
    throw new Error(`原型不存在：${slug}。请先 create_prototype。`);
  }
  return readFileSync(file, 'utf8');
}

export async function writePrototype(slugInput: string, html: string, opts?: { skipValidate?: boolean }): Promise<{
  slug: string;
  file: string;
  previewUrl: string;
  validation: Validation;
  report: string;
}> {
  const slug = normalizeSlug(slugInput);
  const inlined = inlinePrototypeCss(html);
  const validation = validatePrototypeHtml(inlined);
  if (!opts?.skipValidate && !validation.ok) {
    const error = new Error(formatValidation(validation));
    (error as Error & { validation: Validation }).validation = validation;
    throw error;
  }
  mkdirSync(OUT_DIR, { recursive: true });
  const file = prototypeFile(slug);
  mkdirSync(file.slice(0, file.lastIndexOf('/')), { recursive: true });
  writeFileSync(file, inlined, 'utf8');
  const port = await preview.ensureStarted();
  preview.broadcastReload(slug);
  return {
    slug,
    file,
    previewUrl: `http://127.0.0.1:${port}/${slug}/`,
    validation,
    report: formatValidation(validation),
  };
}

export function scaffoldHtml(title: string): string {
  const template = readFileSync(TEMPLATE_FILE, 'utf8');
  return inlinePrototypeCss(
    template
      .replaceAll('<!-- PAGE_TITLE -->', escapeHtml(title))
      .replace('{/* PAGE_TITLE */}', `{${JSON.stringify(title)}}`),
  );
}

export function exampleHtml(): string {
  return inlinePrototypeCss(readFileSync(EXAMPLE_FILE, 'utf8'));
}

export function exportPrototype(slugInput: string): {
  slug: string;
  file: string;
  bytes: number;
  validation: string;
} {
  const slug = normalizeSlug(slugInput);
  const html = buildExportHtml(readPrototype(slug));
  const validation = validatePrototypeHtml(html);
  if (!validation.ok) {
    throw new Error(formatValidation(validation));
  }
  const dir = prototypeDir(slug);
  mkdirSync(dir, { recursive: true });
  const file = exportFile(slug);
  writeFileSync(file, html, 'utf8');
  return {
    slug,
    file,
    bytes: Buffer.byteLength(html, 'utf8'),
    validation: formatValidation(validation),
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
