import { readFileSync } from 'node:fs';
import { LAYOUT_FILE, THEME_FILE, TOKENS_FILE } from './paths.js';

export function bundledCss(): string {
  return [TOKENS_FILE, THEME_FILE, LAYOUT_FILE]
    .map((file) => readFileSync(file, 'utf8').trim())
    .join('\n\n');
}

const STYLE_LINKS = /(?:\s*<!-- 交付时把 tokens\.css \+ theme\.css \+ layout\.css 内联到 style -->)?\s*<link rel="stylesheet" href="\.\.\/styles\/tokens\.css" \/>\s*<link rel="stylesheet" href="\.\.\/styles\/theme\.css" \/>\s*<link rel="stylesheet" href="\.\.\/styles\/layout\.css" \/>/m;

export function inlinePrototypeCss(html: string): string {
  const css = bundledCss();
  const block = `\n    <style>\n${css}\n    </style>`;
  if (STYLE_LINKS.test(html)) {
    return html.replace(STYLE_LINKS, block);
  }
  if (/<style>[\s\S]*?--op-color-bg[\s\S]*?<\/style>/.test(html)) {
    return html.replace(/<style>[\s\S]*?<\/style>/, `<style>\n${css}\n    </style>`);
  }
  if (html.includes('</head>')) {
    return html.replace('</head>', `${block}\n  </head>`);
  }
  return html;
}
