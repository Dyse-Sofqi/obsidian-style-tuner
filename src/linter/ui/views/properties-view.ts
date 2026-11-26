import { ItemView, TFile, WorkspaceLeaf, getLanguage, setIcon } from 'obsidian';
import type LinterPlugin from '../../main';
import { getTextInLanguage } from '../../lang/helpers';
import { logWarn } from '../../utils/logger';
import { assignPropertyType, readPropertyType } from '../../utils/property-types';
import {
  applyPendingValues,
  buildPropertyRows,
  isBlankValue,
  type PropertyRow,
} from '../../utils/properties-model';
import {
  readTimestampKeys,
  timestampTypeFor,
} from '../../utils/timestamp-format';
import { normalizeYamlAttributeEntries, type YamlAttributeEntry } from '../../utils/yaml-attributes';
import { createPropertyRow, type PropertyRowHandlers } from '../components/property-row';
import { ListValueSuggest } from '../components/list-value-suggest';
import { ListValueIndex } from '../../utils/list-values';

/**
 * 侧边栏「属性」视图。
 *
 * 复刻 Obsidian 核心「属性列表」的用法（列属性、就地改值、加属性、删属性），
 * 但把两个来源并到一张表里：
 *
 * - **标准属性**：设置里「插入 YAML 属性」配置的键，文档没有也占一行；
 * - **文档属性**：当前笔记 frontmatter 里真实存在的键，含文档独有的那些。
 *
 * 于是每篇笔记都有一份共同的属性骨架（求同），又保留各自的额外属性（存异）。
 * 在视图里给「没有的键」填上值，等于一并完成「建键 + 赋值 + 落盘」——不用再去
 * 文档头部手写 YAML。
 *
 * 写入只走 `processFrontMatter`（视图里唯一的写入口），让 Obsidian 负责转义、
 * 排序与写盘，顺带把编辑器里的属性面板一起刷新。
 *
 * 为什么放在 linter 模块下：标准属性的来源（「要插入的键」）是 linter 的设置，
 * 视图类型与命令也经 linter 的宿主门面注册，放在一起可以避免跨模块传状态。
 */

export const propertiesViewType = 'style-tuner-properties';

/** 值改动后的落盘延迟：连续敲字时只写最后一次。 */
const WRITE_DELAY = 400;
/** 元数据变化引起的重画延迟：Obsidian 一次改动常常连发多个 changed。 */
const RENDER_DELAY = 60;
/** 自己写盘后的一小段时间内忽略元数据变更，避免把自己刚画好的行又重画掉。 */
const WRITE_SUPPRESS = 800;

/**
 * 当前界面语言是不是英文。
 *
 * `getLanguage()` 给的是 Obsidian 自己的界面语言（`en` / `zh` / `zh-TW`…）。
 * 「属性译名」只在非英文界面下生效：英文界面里键名本身就是用户看得懂的名字，
 * 再套一层译名只会让人对不上 frontmatter。
 */
function isEnglishUi(): boolean {
  return getLanguage().toLowerCase().startsWith('en');
}

export class PropertiesView extends ItemView {
  private readonly plugin: LinterPlugin;

  private rowsEl: HTMLElement | null = null;
  private fileEl: HTMLElement | null = null;
  private emptyEl: HTMLElement | null = null;
  private addInputEl: HTMLInputElement | null = null;

  private currentFile: TFile | null = null;
  private extraKeys: string[] = [];

  private writeTimers = new Map<string, number>();
  private renderTimer: number | null = null;
  private suppressUntil = 0;
  private needsRefresh = false;

  /**
   * 列表属性的全库候选值索引（按最近添加排序），元数据一变就失效。
   *
   * 延迟创建：`this.app` 要等 `View` 挂载完成才可靠，构造期取值有风险。
   */
  private listValues: ListValueIndex | null = null;

  private get listValueIndex(): ListValueIndex {
    this.listValues ??= new ListValueIndex(this.app);
    return this.listValues;
  }

  /**
   * 自己刚写下去、缓存可能还没跟上的值：键 → 值（空值表示该键已删）。
   *
   * 重画时叠在缓存之上，避免「删掉的列表项先复活再消失」的闪烁。
   */
  private pendingValues = new Map<string, unknown>();
  private pendingTimers = new Map<string, number>();

  constructor(leaf: WorkspaceLeaf, plugin: LinterPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.navigation = false;
    // 与命令面板里「打开属性视图」用同一个图标：lucide `tags`
    this.icon = 'tags';
  }

  getViewType(): string {
    return propertiesViewType;
  }

  getDisplayText(): string {
    return getTextInLanguage('properties-view.title');
  }

  async onOpen(): Promise<void> {
    this.contentEl.empty();
    this.contentEl.addClass('style-tuner-properties-view');

    const header = this.contentEl.createDiv('style-tuner-properties-header');
    header.createDiv({
      cls: 'style-tuner-properties-title',
      text: getTextInLanguage('properties-view.title'),
    });
    this.fileEl = header.createDiv('style-tuner-properties-file');

    this.emptyEl = this.contentEl.createDiv('style-tuner-properties-empty');
    this.emptyEl.hide();

    this.rowsEl = this.contentEl.createDiv('style-tuner-properties-rows');

    const addRow = this.contentEl.createDiv('style-tuner-property-add');
    const addIcon = addRow.createSpan('style-tuner-property-add-icon');
    setIcon(addIcon, 'plus');
    this.addInputEl = addRow.createEl('input', {
      type: 'text',
      cls: 'style-tuner-property-add-input',
      attr: { placeholder: getTextInLanguage('properties-view.add-placeholder'), spellcheck: 'false' },
    });
    this.addInputEl.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      this.addProperty(this.addInputEl?.value ?? '');
    });

    // 焦点离开视图时补一次延迟的重画（打字期间被抑制的刷新在这里生效）
    this.contentEl.addEventListener('focusout', () => {
      window.setTimeout(() => {
        if (this.needsRefresh && !this.hasFocus()) {
          this.needsRefresh = false;
          this.render();
        }
      }, 0);
    });

    this.registerViewEvents();
    this.syncFile();
    this.render();
  }

  async onClose(): Promise<void> {
    for (const timer of this.writeTimers.values()) window.clearTimeout(timer);
    this.writeTimers.clear();
    if (this.renderTimer !== null) window.clearTimeout(this.renderTimer);
    this.renderTimer = null;
  }

  /** 设置里改了「要插入的键」之后由 linter 调用。 */
  refreshConfig(): void {
    this.scheduleRender(0);
  }

  private registerViewEvents(): void {
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.syncFile()));
    this.registerEvent(this.app.workspace.on('file-open', () => this.syncFile()));
    this.registerEvent(
      this.app.metadataCache.on('changed', (file) => {
        // 任何一篇笔记变了都可能带来新的列表值 → 候选索引整体作废（下次取时重建）
        this.listValueIndex.invalidate();

        if (file !== this.currentFile) return;
        // 缓存跟上自己写下去的值后就撤掉那份乐观值；即使这次 changed 落在抑制
        // 窗口里也要先对账，否则乐观值会一直盖住缓存、拖到超时才失效。
        this.settlePendingValues(file);
        if (Date.now() < this.suppressUntil) return;
        // 正在这个视图里打字时不要整体重画，否则光标会被抽走
        if (this.hasFocus()) {
          this.needsRefresh = true;
          return;
        }
        this.scheduleRender(RENDER_DELAY);
      })
    );

    // 删文件 / 改名会让候选里的值消失或出现，同样作废。
    // 这两类事件在 `vault` 上（`metadataCache` 的类型定义里没有 rename）。
    this.registerEvent(this.app.vault.on('delete', () => this.listValueIndex.invalidate()));
    this.registerEvent(this.app.vault.on('rename', () => this.listValueIndex.invalidate()));
  }

  /**
   * 跟随当前活动笔记。
   *
   * 侧边栏获得焦点时 `getActiveFile()` 仍指向原来那篇笔记；只有它变成 `null`
   * 或非 Markdown 时才保持不动，避免点一下侧边栏就清空整张表。
   */
  private syncFile(): void {
    const active = this.app.workspace.getActiveFile();
    if (!active || active.extension !== 'md') return;
    if (active === this.currentFile) return;

    this.currentFile = active;
    this.extraKeys = [];
    // 乐观值是「这一篇」的，换文档就作废
    this.clearPendingValues();
    this.render();
  }

  /**
   * 记下「我刚写下去、缓存还没跟上」的值。
   *
   * 写盘后 `metadataCache` 会滞后几十到几百毫秒，这期间任何重画都会读到旧值，
   * 把刚删掉的列表项「复活」一下再消失——就是胶囊删除时那一闪。
   * @param {string} key 属性键名
   * @param {unknown} value 刚写下去的值；空值表示这个键已经删掉
   */
  private rememberPending(key: string, value: unknown): void {
    this.pendingValues.set(key, value);

    const previous = this.pendingTimers.get(key);
    if (previous !== undefined) window.clearTimeout(previous);

    // 兜底：缓存一直没更新时，也别让这份乐观值长期盖住磁盘真值
    this.pendingTimers.set(
      key,
      window.setTimeout(() => {
        this.pendingTimers.delete(key);
        this.pendingValues.delete(key);
      }, WRITE_SUPPRESS * 2),
    );
  }

  /** 缓存已经跟上自己写入的值 → 撤掉该条乐观值（继续留着会盖住后续的其它修改）。 */
  private settlePendingValues(file: TFile): void {
    if (this.pendingValues.size === 0) return;

    const cached = this.app.metadataCache.getFileCache(file)?.frontmatter as
      | Record<string, unknown>
      | undefined;

    for (const [key, value] of [...this.pendingValues]) {
      const matches = isBlankValue(value)
        ? !cached || !Object.prototype.hasOwnProperty.call(cached, key)
        : !!cached && JSON.stringify(cached[key]) === JSON.stringify(value);

      if (!matches) continue;

      this.pendingValues.delete(key);
      const timer = this.pendingTimers.get(key);
      if (timer !== undefined) {
        window.clearTimeout(timer);
        this.pendingTimers.delete(key);
      }
    }
  }

  /** 撤掉单个键的乐观值（写盘失败时用）。 */
  private forgetPending(key: string): void {
    this.pendingValues.delete(key);
    const timer = this.pendingTimers.get(key);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      this.pendingTimers.delete(key);
    }
  }

  private clearPendingValues(): void {
    for (const timer of this.pendingTimers.values()) window.clearTimeout(timer);
    this.pendingTimers.clear();
    this.pendingValues.clear();
  }

  private hasFocus(): boolean {
    const active = document.activeElement;
    return !!active && this.contentEl.contains(active);
  }

  private scheduleRender(delay = RENDER_DELAY): void {
    if (this.renderTimer !== null) window.clearTimeout(this.renderTimer);
    this.renderTimer = window.setTimeout(() => {
      this.renderTimer = null;
      this.render();
    }, delay);
  }

  private getEntries(): YamlAttributeEntry[] {
    const config = this.plugin.settings?.ruleConfigs?.['insert-yaml-attributes'] as
      | { 'text-to-insert'?: unknown }
      | undefined;

    return normalizeYamlAttributeEntries(config?.['text-to-insert']);
  }

  private readFrontmatter(file: TFile): Record<string, unknown> | null {
    const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
    if (!frontmatter && this.pendingValues.size === 0) return null;

    // `position` 是元数据缓存塞进去的定位信息，不是用户的属性
    const { position, ...rest } = (frontmatter ?? {}) as Record<string, unknown> & {
      position?: unknown;
    };
    void position;

    // 叠加「自己刚写下去」的值：缓存滞后时重画会看到旧值，删掉的列表项会先复活
    // 再消失（胶囊删除的那一闪就是它）
    return applyPendingValues(rest, this.pendingValues);
  }

  private render(): void {
    if (!this.rowsEl || !this.emptyEl) return;

    this.rowsEl.empty();
    this.emptyEl.hide();

    const file = this.currentFile;
    this.fileEl?.setText(file ? file.path : '');

    if (!file) {
      this.emptyEl.setText(getTextInLanguage('properties-view.empty'));
      this.emptyEl.show();
      return;
    }

    // 「YAML 时间戳」规则配置的 created / modified：类型与读写格式都以它为准
    const timestamps = readTimestampKeys(this.plugin.settings);
    const typeHints: Record<string, PropertyRow['type']> = {};
    for (const info of timestamps.values()) {
      typeHints[info.key] = timestampTypeFor(info.format);
    }

    const rows = buildPropertyRows({
      frontmatter: this.readFrontmatter(file),
      entries: this.getEntries(),
      registeredType: (key) => readPropertyType(this.app, key),
      extraKeys: this.extraKeys,
      typeHints,
      // 英文界面不翻译：键名本身就是英文，译名只会多一层隔阂。
      // 语言在会话内不会变，所以每次渲染现算一次即可。
      useLabels: !isEnglishUi(),
    });

    if (rows.length === 0) {
      this.emptyEl.setText(getTextInLanguage('properties-view.no-properties'));
      this.emptyEl.show();
    }

    const handlers = this.rowHandlers();
    for (const row of rows) {
      this.rowsEl.appendChild(createPropertyRow(row, handlers, timestamps.get(row.key)));
    }
  }

  private rowHandlers(): PropertyRowHandlers {
    return {
      onValueChange: (key, value, immediate) => {
        if (immediate) {
          void this.writeProperty(key, value);
          return;
        }
        this.scheduleWrite(key, value);
      },
      onDelete: (key) => void this.deleteProperty(key),
      onTypeChange: (key, type) => void this.changeType(key, type),
      onTagClick: (tag) => this.openTagSearch(tag),
      attachValueSuggest: (key, input, getExisting, onPick) => {
        // `tags` 的候选显示带 `#`（和 Obsidian 的标签观感一致），其它属性原样显示
        const isTagKey = key.trim().toLowerCase() === 'tags';
        // 实例由 `AbstractInputSuggest` 内部的事件监听持有，无需自己留引用。
        // 弹层的打开/关闭交给它自己：聚焦、输入、点击内部都已绑定；`ListValueSuggest`
        // 覆盖了 `open()`，候选为空时一律不挂容器（也收起已弹的），所以这里不必
        // 再补 click 事件——补了反而会重复触发候选计算。
        new ListValueSuggest(
          this.app,
          input,
          () => this.listValueIndex.get(key),
          getExisting,
          onPick,
          isTagKey ? (value) => `#${value}` : undefined
        );
      },
    };
  }

  /**
   * 点 `tags` 的标签跳去搜索，复刻 Obsidian 的默认行为。
   *
   * 搜索是核心插件（id `global-search`），没有公开 API，按项目约定用能力探测：
   * 拿不到就只记一条告警，不弹错误、不影响其它功能。
   */
  private openTagSearch(tag: string): void {
    const query = tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`;

    const internal = (this.app as unknown as {
      internalPlugins?: {
        getPluginById?: (id: string) => unknown;
        plugins?: Record<string, unknown>;
      };
    }).internalPlugins;

    const plugin =
      (internal?.getPluginById?.('global-search') as { instance?: unknown } | null | undefined) ??
      (internal?.plugins?.['global-search'] as { instance?: unknown } | undefined);

    const instance = plugin?.instance as { openGlobalSearch?: (query: string) => void } | undefined;
    const open = instance?.openGlobalSearch;

    if (typeof open !== 'function') {
      logWarn('could not open the search view: the global search core plugin is not available');
      return;
    }

    open.call(instance, `tag:${query}`);
  }

  private addProperty(rawKey: string): void {
    const key = rawKey.trim();
    if (!key || !this.currentFile) return;

    const frontmatter = this.readFrontmatter(this.currentFile);
    const known =
      this.getEntries().some((entry) => entry.key === key) ||
      this.extraKeys.includes(key) ||
      Object.prototype.hasOwnProperty.call(frontmatter ?? {}, key);

    if (!known) this.extraKeys.push(key);

    if (this.addInputEl) this.addInputEl.value = '';
    this.render();
    this.focusRowInput(key);
  }

  private focusRowInput(key: string): void {
    const selector = `.style-tuner-property[data-key="${CSS.escape(key)}"] input`;
    const input = this.rowsEl?.querySelector<HTMLInputElement>(selector);
    input?.focus();
  }

  private scheduleWrite(key: string, value: unknown): void {
    const existing = this.writeTimers.get(key);
    if (existing !== undefined) window.clearTimeout(existing);

    this.writeTimers.set(
      key,
      window.setTimeout(() => {
        this.writeTimers.delete(key);
        void this.writeProperty(key, value);
      }, WRITE_DELAY)
    );
  }

  private async writeProperty(key: string, value: unknown): Promise<void> {
    const file = this.currentFile;
    if (!file) return;

    this.suppressUntil = Date.now() + WRITE_SUPPRESS;
    // 先记下乐观值，再落盘：写盘到缓存更新之间若发生重画，读到的是这份新值，
    // 删掉的列表项不会先复活再消失。缓存跟上后由 settlePendingValues 撤掉。
    this.rememberPending(key, value);

    try {
      await this.app.fileManager.processFrontMatter(
        file,
        (frontmatter: Record<string, unknown>) => {
          if (isBlankValue(value)) {
            // 清空 = 回到未登记状态：键不该以空值留在 frontmatter 里
            delete frontmatter[key];
            return;
          }
          frontmatter[key] = value;
        }
      );
    } catch (error) {
      // 写盘失败：撤掉乐观值并重画，让行回到磁盘的真实状态（否则 pill 已被
      // 本地移除，和磁盘不一致）
      this.forgetPending(key);
      this.scheduleRender(0);
      logWarn(
        `could not save the property "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return;
    }

    // 临时键一旦落盘，就已经是文档属性了，不再需要临时占位
    this.extraKeys = this.extraKeys.filter((extra) => extra !== key);

    // 自己写盘触发的那次 `changed` 被抑制窗口吞掉了，这里补一次对账：等窗口
    // 结束后按磁盘上的最终形态重画（用户还在输入时推迟到失焦，别把光标抽走）。
    if (this.hasFocus()) {
      this.needsRefresh = true;
    } else {
      this.scheduleRender(WRITE_SUPPRESS + 50);
    }
  }

  private async deleteProperty(key: string): Promise<void> {
    const pending = this.writeTimers.get(key);
    if (pending !== undefined) {
      window.clearTimeout(pending);
      this.writeTimers.delete(key);
    }

    const file = this.currentFile;
    const present = !!file && Object.prototype.hasOwnProperty.call(this.readFrontmatter(file) ?? {}, key);

    this.extraKeys = this.extraKeys.filter((extra) => extra !== key);

    // 只有文档里真的有这个键才需要写盘：否则会为一篇本来没有 frontmatter 的
    // 笔记凭空造出一个空的 `--- / ---` 块
    if (present) await this.writeProperty(key, null);

    // 标准键会被清空值后继续留在表里，文档独有键则整行消失，两种情况都要重画
    this.scheduleRender(0);
  }

  private async changeType(key: string, type: PropertyRow['type']): Promise<void> {
    await assignPropertyType(this.app, key, type);
    this.scheduleRender(0);
  }
}
