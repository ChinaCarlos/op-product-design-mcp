import { inlinePrototypeCss } from './css.js';

const LIVE_RE = /\s*<script>\s*\(\(\) => \{\s*if \(window\.__opLiveReload\)[\s\S]*?<\/script>/g;
const CHROME_RE = /\s*<div id="op-preview-chrome"[\s\S]*?<\/div>/g;

export function stripPreviewChrome(html: string): string {
  return html.replace(CHROME_RE, '').replace(LIVE_RE, '');
}

export function buildExportHtml(html: string): string {
  return stripPreviewChrome(inlinePrototypeCss(html)).trim() + '\n';
}
