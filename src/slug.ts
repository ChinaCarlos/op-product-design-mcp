export function normalizeSlug(input: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (!slug) {
    throw new Error('slug 不能为空，请用短横线英文或拼音，例如 wall-manage');
  }
  if (slug.length > 64) {
    throw new Error('slug 过长，请控制在 64 个字符内');
  }
  return slug;
}
