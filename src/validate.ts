export type Check = {
  id: string;
  ok: boolean;
  message: string;
};

export type Validation = {
  ok: boolean;
  errors: Check[];
  warnings: Check[];
};

function check(id: string, ok: boolean, message: string): Check {
  return { id, ok, message };
}

export function validatePrototypeHtml(html: string): Validation {
  const errors: Check[] = [];
  const warnings: Check[] = [];

  const push = (item: Check, level: 'error' | 'warning' = 'error') => {
    if (item.ok) return;
    (level === 'error' ? errors : warnings).push(item);
  };

  push(check('antd-css', html.includes('antd@4.24.8/dist/antd.min.css'), '必须引用 antd@4.24.8/dist/antd.min.css'));
  push(check('antd-js', html.includes('antd@4.24.8/dist/antd-with-locales'), '必须引用 antd@4.24.8 antd-with-locales'));
  push(check('react17', html.includes('react@17.0.2'), '必须使用 React 17.0.2 UMD'));
  push(check('react-dom17', html.includes('react-dom@17.0.2'), '必须使用 ReactDOM 17.0.2 UMD'));
  push(check('moment', html.includes('moment@2.29.4'), '必须使用 moment@2.29.4，禁止 dayjs'));
  push(check('babel', html.includes('@babel/standalone'), '必须用 Babel standalone 浏览器编译 JSX'));
  push(check('reactdom-render', /ReactDOM\.render\s*\(/.test(html), '必须使用 ReactDOM.render，不要 createRoot'));
  push(check('no-create-root', !html.includes('createRoot'), '禁止 React 18 createRoot'));
  push(check('no-antd5', !/antd@5/.test(html), '禁止 antd 5'));
  push(check('no-dayjs', !/\bdayjs\b/.test(html), '禁止 dayjs 替代 moment'));
  push(check('zh-cn', html.includes('antd.locales') && html.includes('zh_CN'), '必须 ConfigProvider locale={antd.locales.zh_CN}'));
  push(check('popup-container', html.includes('getPopupContainer'), 'ConfigProvider 必须设置 getPopupContainer'));
  push(check('modal-visible', html.includes('visible={') || html.includes('visible = {'), 'Modal 必须用 visible，不要只用 antd 5 的 open'));
  push(check('filter-card', html.includes('op-filter-card'), '筛选必须用 .op-filter-card'));
  push(check('filter-action', html.includes('op-filter-action'), '查询按钮必须放在 .op-filter-action'));
  push(check('table-card', html.includes('op-table-card'), '列表必须用 .op-table-card'));
  push(check('table-toolbar', html.includes('op-table-toolbar'), '新建必须放在表右上 .op-table-toolbar'));
  push(check('pagination', html.includes('op-table-pagination'), '分页必须在表卡内 .op-table-pagination'));
  push(check('show-total', html.includes('共计') && html.includes('showTotal'), '分页 showTotal 必须写共计 n 条'));
  push(check('inline-css', html.includes('--op-color-bg') && html.includes('<style'), 'tokens/theme/layout 必须内联进 <style>'));
  const stripped = html
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/https:\/\/unpkg.com\/antd@4\.24\.8[^"'\s]*/g, '');
  push(check('no-1890ff', !/#1890ff/i.test(stripped), '页面业务代码禁止残留 #1890ff'));
  push(check('no-tailwind', !/\btailwind\b/i.test(html) && !html.includes('cdn.tailwindcss.com'), '禁止 Tailwind'));
  push(check('no-shadcn', !/\bshadcn\b/i.test(html), '禁止 shadcn'));
  push(check('no-fetch', !/\bfetch\s*\(/.test(html) && !html.includes('XMLHttpRequest'), '禁止真实请求'));
  push(
    check(
      'no-inline-form-layout',
      !/Form[^>]*layout\s*=\s*["']inline["']/.test(html) && !html.includes('layout="inline"'),
      '筛选不要用 Form layout="inline"',
    ),
    'warning',
  );
  push(
    check('modal-width', html.includes('width={700}') || html.includes('width: 700'), '弹窗宽应为 700'),
    'warning',
  );
  push(
    check(
      'row-action-default-size',
      !/<Button[^>]*size=["']small["'][^>]*>\s*(编辑|删除)/.test(html),
      '操作列编辑/删除必须用默认按钮尺寸，不要 size="small"',
    ),
    'warning',
  );
  push(
    check(
      'no-preview-chrome',
      !html.includes('id="op-preview-chrome"') && !html.includes('data-op-preview-chrome'),
      '业务 HTML / 导出文件不要包含预览下载按钮，下载条只由预览服务注入',
    ),
  );

  return { ok: errors.length === 0, errors, warnings };
}

export function formatValidation(result: Validation): string {
  const lines: string[] = [];
  if (result.ok) lines.push('校验通过。');
  else lines.push('校验未通过，请按 Skill 硬规则修改后再写入。');
  for (const item of result.errors) lines.push(`- [错误] ${item.id}: ${item.message}`);
  for (const item of result.warnings) lines.push(`- [警告] ${item.id}: ${item.message}`);
  return lines.join('\n');
}
