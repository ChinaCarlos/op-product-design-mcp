import { existsSync, readdirSync, readFileSync, watch } from 'node:fs';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { buildExportHtml } from './export.js';
import { OUT_DIR, prototypeFile } from './paths.js';

const SERVICE = 'op-prototype-preview';

const LIVE_SCRIPT = `
<script>
(() => {
  if (window.__opLiveReload) return;
  window.__opLiveReload = true;
  const current = location.pathname.split('/').filter(Boolean)[0] || '';
  const connect = () => {
    const es = new EventSource('/__livereload');
    es.addEventListener('reload', (ev) => {
      const slug = String(ev.data || '').trim();
      if (!slug || slug === '*' || !current || slug === current) location.reload();
    });
    es.onerror = () => {
      es.close();
      setTimeout(connect, 800);
    };
  };
  connect();
})();
</script>
`;

function previewChrome(slug: string): string {
  const href = `/${slug}/download`;
  const filename = `${slug}.html`;
  return `
<div id="op-preview-chrome" data-op-preview-chrome="1">
  <style>
    #op-preview-chrome {
      position: fixed;
      top: 12px;
      right: 16px;
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    #op-preview-chrome a.op-preview-export {
      display: inline-flex;
      align-items: center;
      height: 32px;
      padding: 0 15px;
      border: 1px solid #e5e7eb;
      border-radius: 2px;
      background: #ffffff;
      color: #1f2937;
      font-size: 14px;
      line-height: 32px;
      text-decoration: none;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
      cursor: pointer;
    }
    #op-preview-chrome a.op-preview-export:hover {
      border-color: #6366f1;
      color: #4f46e5;
    }
  </style>
  <a class="op-preview-export" href="${href}" download="${filename}">下载原型交互文件</a>
</div>
${LIVE_SCRIPT}
`;
}

type Client = ServerResponse;

export class PreviewRuntime {
  private server: Server | null = null;
  private clients = new Set<Client>();
  private watcher: ReturnType<typeof watch> | null = null;
  private attached = false;
  port = 0;

  get origin(): string {
    return `http://127.0.0.1:${this.port}`;
  }

  urlFor(slug: string): string {
    return `${this.origin}/${slug}/`;
  }

  preferredPort(): number {
    return Number(process.env.OP_PROTOTYPE_PORT || 5179);
  }

  async ensureStarted(): Promise<number> {
    if (this.port) return this.port;
    const port = this.preferredPort();
    if (await this.isOurPreview(port)) {
      this.port = port;
      this.attached = true;
      return port;
    }
    this.server = createServer((req, res) => this.handle(req, res));
    try {
      this.port = await this.listen(port);
    } catch (error) {
      this.server = null;
      if (isAddrInUse(error) && (await this.isOurPreview(port))) {
        this.port = port;
        this.attached = true;
        return port;
      }
      if (isAddrInUse(error)) {
        throw new Error(
          `预览端口 ${port} 已被其他程序占用。多个原型应共用 http://127.0.0.1:${port}/<slug>/，请关掉占用进程或设置 OP_PROTOTYPE_PORT。`,
        );
      }
      throw error;
    }
    this.attached = false;
    this.watchOut();
    return this.port;
  }

  async stop(): Promise<void> {
    this.watcher?.close();
    this.watcher = null;
    for (const client of this.clients) client.end();
    this.clients.clear();
    await new Promise<void>((resolve) => {
      this.server?.close(() => resolve());
      if (!this.server) resolve();
    });
    this.server = null;
    this.port = 0;
    this.attached = false;
  }

  broadcastReload(slug?: string): void {
    if (this.attached) {
      const target = new URL('/__reload', `http://127.0.0.1:${this.preferredPort()}`);
      if (slug) target.searchParams.set('slug', slug);
      void fetch(target, { method: 'POST' }).catch(() => undefined);
      return;
    }
    const payload = `event: reload\ndata: ${slug || '*'}\n\n`;
    for (const client of this.clients) {
      client.write(payload);
    }
  }

  private async isOurPreview(port: number): Promise<boolean> {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/__health`);
      if (!res.ok) return false;
      const data = (await res.json()) as { service?: string };
      return data.service === SERVICE;
    } catch {
      return false;
    }
  }

  private listen(port: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const server = this.server!;
      const onError = (error: NodeJS.ErrnoException) => {
        server.off('error', onError);
        reject(error);
      };
      server.on('error', onError);
      server.listen(port, '127.0.0.1', () => {
        server.off('error', onError);
        const address = server.address();
        resolve(typeof address === 'object' && address ? address.port : port);
      });
    });
  }

  private watchOut(): void {
    if (this.watcher || this.attached || !existsSync(OUT_DIR)) return;
    this.watcher = watch(OUT_DIR, { recursive: true }, (_event, filename) => {
      if (!filename || !String(filename).endsWith('preview.html')) return;
      const slug = String(filename).split(/[\\/]/)[0];
      this.broadcastReload(slug);
    });
  }

  private handle(req: IncomingMessage, res: ServerResponse): void {
    const url = new URL(req.url || '/', this.origin || `http://127.0.0.1:${this.preferredPort()}`);
    if (url.pathname === '/__health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, service: SERVICE, port: this.port }));
      return;
    }

    if (url.pathname === '/__reload') {
      const slug = url.searchParams.get('slug') || undefined;
      const payload = `event: reload\ndata: ${slug || '*'}\n\n`;
      for (const client of this.clients) client.write(payload);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, slug: slug || '*' }));
      return;
    }

    if (url.pathname === '/__livereload') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write('event: ping\ndata: ok\n\n');
      this.clients.add(res);
      req.on('close', () => {
        this.clients.delete(res);
      });
      return;
    }

    if (url.pathname === '/' || url.pathname === '/index.html') {
      this.sendIndex(res);
      return;
    }

    const parts = url.pathname.replace(/^\//, '').split('/').filter(Boolean);
    const slug = parts[0];
    if (!slug) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    if (parts.length === 1 || parts[1] === 'index.html' || parts[1] === 'preview.html') {
      this.sendHtml(slug, res);
      return;
    }
    if (parts[1] === 'download') {
      this.sendDownload(slug, res);
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  }

  private sendIndex(res: ServerResponse): void {
    const items = existsSync(OUT_DIR)
      ? readdirSync(OUT_DIR).filter((name) => existsSync(prototypeFile(name)))
      : [];
    const body = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>OP 原型</title><body>
      <h1>OP 原型预览</h1>
      <ul>${items.map((slug) => `<li><a href="/${slug}/">${slug}</a></li>`).join('')}</ul>
      ${LIVE_SCRIPT}
    </body></html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(body);
  }

  private sendHtml(slug: string, res: ServerResponse): void {
    const file = prototypeFile(slug);
    if (!existsSync(file)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`未找到原型 ${slug}`);
      return;
    }
    const html = injectPreviewChrome(readFileSync(file, 'utf8'), slug);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }

  private sendDownload(slug: string, res: ServerResponse): void {
    const file = prototypeFile(slug);
    if (!existsSync(file)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`未找到原型 ${slug}`);
      return;
    }
    const html = buildExportHtml(readFileSync(file, 'utf8'));
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.html"`,
    });
    res.end(html);
  }
}

function isAddrInUse(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'EADDRINUSE');
}

export function injectLiveReload(html: string): string {
  return injectPreviewChrome(html, '');
}

export function injectPreviewChrome(html: string, slug: string): string {
  const chrome = slug ? previewChrome(slug) : LIVE_SCRIPT;
  if (html.includes('data-op-preview-chrome') && html.includes('__opLiveReload')) return html;
  if (html.includes('</body>')) return html.replace('</body>', `${chrome}\n  </body>`);
  return html + chrome;
}

export const preview = new PreviewRuntime();
