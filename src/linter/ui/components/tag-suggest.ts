import { AbstractInputSuggest, App } from 'obsidian';

/**
 * `tags` 输入框的候选弹层。
 *
 * 用 Obsidian 自己的 `AbstractInputSuggest`：弹层的样式、↑↓ 选择、Enter 确认、Esc 关闭
 * 全都由 Obsidian 提供，不用自己造一套。候选项取自全库已有标签。
 */

interface MetadataCacheWithTags {
  /** 公开类型里没有，运行时存在；拿不到就退回扫缓存 */
  getTags?: () => Record<string, number>;
}

export interface VaultTag {
  tag: string;
  count: number;
}

/** frontmatter / 缓存里的标签可能带 `#`，统一去掉。 */
function normalizeTag(raw: string): string {
  return raw.replace(/^#+/, '').trim();
}

/** 全库标签清单（按使用次数从多到少）。 */
export function collectVaultTags(app: App): VaultTag[] {
  const cache = app.metadataCache as unknown as MetadataCacheWithTags;
  const counts = cache.getTags?.();

  if (counts) {
    return Object.entries(counts)
      .map(([tag, count]) => ({ tag: normalizeTag(tag), count }))
      .filter((entry) => entry.tag !== '');
  }

  const scanned = new Map<string, number>();
  for (const file of app.vault.getMarkdownFiles()) {
    for (const cached of app.metadataCache.getFileCache(file)?.tags ?? []) {
      const tag = normalizeTag(cached.tag);
      if (!tag) continue;
      scanned.set(tag, (scanned.get(tag) ?? 0) + 1);
    }
  }

  return [...scanned].map(([tag, count]) => ({ tag, count }));
}

export class TagInputSuggest extends AbstractInputSuggest<string> {
  constructor(
    app: App,
    input: HTMLInputElement,
    /** 当前行已有的标签，候选里要排除掉 */
    private readonly getExisting: () => string[],
    private readonly onPick: (tag: string) => void
  ) {
    super(app, input);
  }

  protected getSuggestions(query: string): string[] {
    const needle = normalizeTag(query).toLowerCase();
    const existing = new Set(this.getExisting().map((tag) => tag.toLowerCase()));

    return collectVaultTags(this.app)
      .filter((entry) => !existing.has(entry.tag.toLowerCase()))
      .filter((entry) => needle === '' || entry.tag.toLowerCase().includes(needle))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
      .map((entry) => entry.tag)
      .slice(0, 100);
  }

  renderSuggestion(value: string, el: HTMLElement): void {
    el.setText(`#${value}`);
  }

  selectSuggestion(value: string): void {
    this.onPick(value);
    this.setValue('');
    this.close();
  }
}
