import type { App, CachedMetadata } from 'obsidian';
import { rankListValues, type ListValueSample } from './list-value-index';
import { splitListValues } from './yaml-attributes';

/**
 * 全库「某个列表属性都有哪些值」的索引。
 *
 * 属性视图里，列表型属性的输入框要给出**库里其它笔记在该属性下已有的值**供快速
 * 选择，并按最近添加排序（排序规则见 `list-value-index.ts`）。
 *
 * 数据来源：
 * - `tags` / `tag`：`CachedMetadata.tags`，这样**行内 `#标签`** 也算候选（只看
 *   frontmatter 会漏掉它们）；
 * - 其余键：各文件 frontmatter 里同名的键。
 *
 * 扫描一次要遍历全库的缓存，所以结果按 key 缓存，由调用方在元数据变化时
 * `invalidate()`。缓存的是**排好序的数组**，输入时只是过滤，不再重排。
 */

/** 值来自数组（常规情况）或逗号 / 换行分隔的字符串（`tags: a, b` 这种手写形式）。 */
function valuesFromFrontmatter(raw: unknown): string[] {
  if (raw === null || raw === undefined) return [];

  if (Array.isArray(raw)) {
    return raw.map((item) => {
      if (item === null || item === undefined) return '';
      if (typeof item === 'object') return ''; // 嵌套结构不是可选值
      return String(item).trim();
    }).filter((item) => item !== '');
  }

  if (typeof raw === 'string') {
    return splitListValues(raw);
  }

  return [];
}

/** frontmatter 的键名大小写不敏感地取值（Obsidian 的属性面板也不区分大小写）。 */
function frontmatterValue(cache: CachedMetadata, key: string): unknown {
  const frontmatter = cache.frontmatter as Record<string, unknown> | undefined;
  if (!frontmatter) return undefined;

  if (Object.prototype.hasOwnProperty.call(frontmatter, key)) {
    return frontmatter[key];
  }

  const lower = key.toLowerCase();
  for (const candidate of Object.keys(frontmatter)) {
    if (candidate.toLowerCase() === lower) return frontmatter[candidate];
  }

  return undefined;
}

/** `tags` / `tag`：行内标签与 frontmatter 里的标签都算，`#` 去掉。 */
function tagValuesFor(cache: CachedMetadata, key: string): string[] {
  const values: string[] = [];

  for (const cached of cache.tags ?? []) {
    const tag = cached.tag?.replace(/^#+/, '').trim();
    if (tag) values.push(tag);
  }

  // `cache.tags` 一般已含 frontmatter 的标签，这里再补一次只是为了兼容缓存差异
  for (const tag of valuesFromFrontmatter(frontmatterValue(cache, key))) {
    values.push(tag.replace(/^#+/, '').trim());
  }

  return values.filter((tag) => tag !== '');
}

export class ListValueIndex {
  private cache = new Map<string, string[]>();

  constructor(private readonly app: App) {}

  /** 元数据变化后调用；下次取值时重建。 */
  invalidate(): void {
    this.cache.clear();
  }

  /**
   * 某个列表属性的全部候选值，**已按最近添加排序**。
   *
   * @param {string} key frontmatter 键名
   * @return {string[]} 去重后的候选值，最近的在前
   */
  get(key: string): string[] {
    const trimmed = key.trim();
    if (!trimmed) return [];

    const cacheKey = trimmed.toLowerCase();
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const values = this.build(trimmed);
    this.cache.set(cacheKey, values);
    return values;
  }

  private build(key: string): string[] {
    const isTagKey = key.toLowerCase() === 'tags' || key.toLowerCase() === 'tag';
    const samples: ListValueSample[] = [];

    for (const file of this.app.vault.getMarkdownFiles()) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (!cache) continue;

      const values = isTagKey
        ? tagValuesFor(cache, key)
        : valuesFromFrontmatter(frontmatterValue(cache, key));

      if (values.length === 0) continue;

      const mtime = file.stat?.mtime ?? 0;
      for (const value of values) {
        samples.push({ value, mtime });
      }
    }

    return rankListValues(samples);
  }
}
