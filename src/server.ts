import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { existsSync, readFileSync } from 'node:fs';
import { z } from 'zod';
import { getBrief, WORKFLOW } from './brief.js';
import { bundledCss } from './css.js';
import {
  EXAMPLE_FILE,
  LAYOUT_FILE,
  SKILL_FILE,
  TEMPLATE_FILE,
  THEME_FILE,
  TOKENS_FILE,
  VISUAL_FILE,
  prototypeFile,
} from './paths.js';
import { preview } from './preview.js';
import {
  exampleHtml,
  exportPrototype,
  listPrototypes,
  readPrototype,
  scaffoldHtml,
  writePrototype,
} from './prototypes.js';
import { normalizeSlug } from './slug.js';
import { formatValidation, validatePrototypeHtml } from './validate.js';
import { ensureSkillsInstalled } from './install-skill.js';

function text(data: unknown) {
  const value = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: 'text' as const, text: value }] };
}

function errorText(message: string) {
  return { isError: true as const, content: [{ type: 'text' as const, text: message }] };
}

const server = new McpServer(
  { name: 'op-prototype', version: '1.0.0' },
  { instructions: WORKFLOW },
);

const resources: Array<{ uri: string; name: string; file: string; mimeType: string }> = [
  { uri: 'op-prototype://skill', name: 'SKILL.md', file: SKILL_FILE, mimeType: 'text/markdown' },
  { uri: 'op-prototype://visual', name: 'visual.md', file: VISUAL_FILE, mimeType: 'text/markdown' },
  { uri: 'op-prototype://template', name: 'preview.html 模板', file: TEMPLATE_FILE, mimeType: 'text/html' },
  { uri: 'op-prototype://example', name: '墙管理示例', file: EXAMPLE_FILE, mimeType: 'text/html' },
  { uri: 'op-prototype://tokens.css', name: 'tokens.css', file: TOKENS_FILE, mimeType: 'text/css' },
  { uri: 'op-prototype://theme.css', name: 'theme.css', file: THEME_FILE, mimeType: 'text/css' },
  { uri: 'op-prototype://layout.css', name: 'layout.css', file: LAYOUT_FILE, mimeType: 'text/css' },
];

for (const resource of resources) {
  server.registerResource(
    resource.name,
    resource.uri,
    { title: resource.name, mimeType: resource.mimeType },
    async () => ({
      contents: [
        {
          uri: resource.uri,
          mimeType: resource.mimeType,
          text: readFileSync(resource.file, 'utf8'),
        },
      ],
    }),
  );
}

server.registerTool(
  'get_brief',
  {
    title: '读取 Skill 与规则',
    description: '返回强制工作流、SKILL.md 全文和 visual 规则摘要。生成或修改原型前必须先调用。',
    inputSchema: z.object({}),
  },
  async () => text(getBrief()),
);

server.registerTool(
  'create_prototype',
  {
    title: '创建原型',
    description:
      '按 Skill 创建 out/<slug>/preview.html，内联 CSS，校验硬规则，启动预览并返回内置浏览器 URL。html 省略时用模板脚手架。',
    inputSchema: z.object({
      slug: z.string().describe('短横线英文或拼音，例如 wall-manage'),
      title: z.string().describe('页面中文标题，例如 墙管理'),
      html: z
        .string()
        .optional()
        .describe('完整 preview.html。必须含 antd 4.24.8、筛选卡、表卡、弹窗。省略则从模板脚手架。'),
      from_example: z.boolean().optional().describe('true 时以墙管理示例为起点再改'),
    }),
  },
  async ({ slug, title, html, from_example }) => {
    try {
      const source = html ?? (from_example ? exampleHtml() : scaffoldHtml(title));
      const titled = source.includes('<title>')
        ? source.replace(/<title>[^<]*<\/title>/, `<title>${title} · OP 原型</title>`)
        : source;
      const result = await writePrototype(slug, titled);
      return text({
        ok: true,
        slug: result.slug,
        file: result.file,
        previewUrl: result.previewUrl,
        openIn: 'Codex 内置浏览器',
        note: '把 previewUrl 交给用户，用内置浏览器打开。之后只许 update_prototype 修改。',
        validation: result.report,
      });
    } catch (error) {
      return errorText(error instanceof Error ? error.message : String(error));
    }
  },
);

server.registerTool(
  'update_prototype',
  {
    title: '更新原型并热更新',
    description: '覆盖已有原型 HTML。校验通过后写入并通知已打开的预览页 reload。',
    inputSchema: z.object({
      slug: z.string(),
      html: z.string().describe('完整 preview.html，不要只交片段'),
    }),
  },
  async ({ slug, html }) => {
    try {
      normalizeSlug(slug);
      if (!existsSync(prototypeFile(slug)) && !existsSync(prototypeFile(normalizeSlug(slug)))) {
        return errorText(`原型不存在：${slug}。请先 create_prototype。`);
      }
      const result = await writePrototype(slug, html);
      return text({
        ok: true,
        slug: result.slug,
        file: result.file,
        previewUrl: result.previewUrl,
        hotReload: true,
        validation: result.report,
      });
    } catch (error) {
      return errorText(error instanceof Error ? error.message : String(error));
    }
  },
);

server.registerTool(
  'get_prototype',
  {
    title: '读取当前原型 HTML',
    description: '修改前读取 out/<slug>/preview.html，基于当前稿增量改，不要每次从空白重写。',
    inputSchema: z.object({ slug: z.string() }),
  },
  async ({ slug }) => {
    try {
      return text(readPrototype(slug));
    } catch (error) {
      return errorText(error instanceof Error ? error.message : String(error));
    }
  },
);

server.registerTool(
  'start_preview',
  {
    title: '打开预览服务',
    description: '启动 127.0.0.1 热更新 HTTP 服务，返回给 Codex 内置浏览器打开的 URL。',
    inputSchema: z.object({
      slug: z.string().optional().describe('指定原型；省略则返回列表页'),
    }),
  },
  async ({ slug }) => {
    try {
      const port = await preview.ensureStarted();
      const previewUrl = slug ? preview.urlFor(normalizeSlug(slug)) : `${preview.origin}/`;
      if (slug && !existsSync(prototypeFile(normalizeSlug(slug)))) {
        return errorText(`原型不存在：${slug}。请先 create_prototype。`);
      }
      return text({
        ok: true,
        port,
        previewUrl,
        openIn: 'Codex 内置浏览器',
        list: listPrototypes(),
      });
    } catch (error) {
      return errorText(error instanceof Error ? error.message : String(error));
    }
  },
);

server.registerTool(
  'list_prototypes',
  {
    title: '列出原型',
    description: '列出 out/ 下已生成的原型及预览 URL。',
    inputSchema: z.object({}),
  },
  async () => {
    await preview.ensureStarted();
    return text(listPrototypes());
  },
);

server.registerTool(
  'validate_prototype',
  {
    title: '校验规范',
    description: '按 Skill 硬规则静态检查 HTML 或已有 slug，不写盘。',
    inputSchema: z.object({
      slug: z.string().optional(),
      html: z.string().optional(),
    }),
  },
  async ({ slug, html }) => {
    try {
      const source = html ?? (slug ? readPrototype(slug) : null);
      if (!source) return errorText('请提供 slug 或 html');
      const result = validatePrototypeHtml(source);
      return text({ ok: result.ok, report: formatValidation(result), errors: result.errors, warnings: result.warnings });
    } catch (error) {
      return errorText(error instanceof Error ? error.message : String(error));
    }
  },
);

server.registerTool(
  'export_prototype',
  {
    title: '导出给开发',
    description:
      '把已生成的原型导出为可转发的单文件 HTML：CSS 内联、去掉热更新脚本。写入 out/<slug>/<slug>.html，给开发打开即可，不依赖 MCP 预览服务。',
    inputSchema: z.object({
      slug: z.string().describe('要导出的原型，例如 announcement-manage'),
    }),
  },
  async ({ slug }) => {
    try {
      const result = exportPrototype(slug);
      const downloadUrl = preview.port
        ? `${preview.origin}/${result.slug}/download`
        : `http://127.0.0.1:${preview.preferredPort()}/${result.slug}/download`;
      return text({
        ok: true,
        slug: result.slug,
        file: result.file,
        bytes: result.bytes,
        downloadUrl,
        note: '把 file 丢给开发即可，双击或浏览器打开。不要发 localhost 预览地址。',
        validation: result.validation,
      });
    } catch (error) {
      return errorText(error instanceof Error ? error.message : String(error));
    }
  },
);

server.registerTool(
  'get_bundled_css',
  {
    title: '读取应内联的 CSS',
    description: '返回 tokens + theme + layout 拼接结果，生成 HTML 时必须按此顺序内联进 style。',
    inputSchema: z.object({}),
  },
  async () => text(bundledCss()),
);

export async function startMcpServer() {
  ensureSkillsInstalled();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
