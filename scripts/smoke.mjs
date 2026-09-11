import { exampleHtml, writePrototype } from '../dist/prototypes.js';
import { preview } from '../dist/preview.js';
import { validatePrototypeHtml } from '../dist/validate.js';

const slug = 'smoke-wall';
const html = exampleHtml();
const validation = validatePrototypeHtml(html);
if (!validation.ok) {
  console.error(validation);
  process.exit(1);
}
const created = await writePrototype(slug, html);
const res = await fetch(created.previewUrl);
const body = await res.text();
if (!body.includes('墙管理') || !body.includes('__opLiveReload')) {
  console.error('preview html missing expected markers');
  process.exit(1);
}

const reloadWait = (async () => {
  const response = await fetch(new URL('/__livereload', created.previewUrl), {
    headers: { Accept: 'text/event-stream' },
  });
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  const timer = setTimeout(() => {
    reader.cancel();
  }, 4000);
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    if (buf.includes('event: reload')) {
      clearTimeout(timer);
      await reader.cancel();
      return true;
    }
  }
  throw new Error('reload timeout');
})();

await new Promise((r) => setTimeout(r, 150));
const updatedHtml = html.replace('墙管理 · OP 原型', '墙管理热更新 · OP 原型');
await writePrototype(slug, updatedHtml);
await reloadWait;
const again = await fetch(created.previewUrl).then((r) => r.text());
if (!again.includes('墙管理热更新')) {
  console.error('hot update did not persist');
  process.exit(1);
}
await preview.stop();
console.log(JSON.stringify({ ok: true, previewUrl: created.previewUrl }, null, 2));
