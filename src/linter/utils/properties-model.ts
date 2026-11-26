import {
  fixedPropertyTypeFor,
  splitListValues,
  type YamlAttributeEntry,
  type YamlPropertyType,
} from './yaml-attributes';

/**
 * 侧边栏「属性」视图的数据模型。
 *
 * 视图要同时容纳两个来源，并让它们像一张表那样工作：
 *
 * 1. **文档自己的 frontmatter** —— 每个键都是真实存在的数据；
 * 2. **设置里「要插入的键」** —— 是这套笔记的**标准**，文档里可能还没有。
 *
 * 合并规则（对应「求同存异」）：
 * - 标准键按设置里的顺序排在前面，文档里没有该键就显示为空行（值待登记）；
 * - 文档独有的键排在后面，顺序沿用 frontmatter 里的书写顺序；
 * - 同名键只出现一次，值以文档为准。
 *
 * 这样一份视图既是「这篇笔记有哪些属性」，也是「这套笔记应该有哪些属性」。
 * 本模块是纯逻辑（不 import obsidian），视图只负责把它画出来。
 */

export interface PropertyRow {
  /** frontmatter 键名 */
  key: string;
  /**
   * 界面上显示的名字。
   *
   * 只有「标准属性」在非英文界面下、且条目配了译名时才有值；其余情况为
   * `undefined`，视图直接用 `key`。**任何写入仍以 `key` 为准**——这个字段只影响
   * 标签页里的显示。
   */
  displayName?: string;
  /** 用哪种控件编辑（固定类型 > 配置类型 > types.json 登记 > 按值推断） */
  type: YamlPropertyType;
  /** 当前值；`undefined` 表示文档里还没有这个键 */
  value: unknown;
  /** 文档里是否已有该键 */
  present: boolean;
  /** 是否在「要插入的键」里（标准属性） */
  configured: boolean;
  /** 值是嵌套结构（对象），这一版只读展示，避免写出损坏的 YAML */
  readOnly: boolean;
}

export interface BuildPropertyRowsArgs {
  frontmatter: Record<string, unknown> | null;
  entries: YamlAttributeEntry[];
  /** Obsidian 在 `types.json` 里登记过的类型（读不到就返回 null） */
  registeredType?: (key: string) => YamlPropertyType | null;
  /** 视图底部临时添加、还没落盘的键（只对当前文档生效） */
  extraKeys?: string[];
  /**
   * 由**其它规则**决定类型的键，例如「YAML 时间戳」里配置的 `created` / `modified`。
   *
   * 优先级排在配置类型之前：这两个键的写法由时间戳规则全权决定（每次 lint 都会
   * 按它自己的 format 重写），视图必须跟着它走，否则会出现「视图认为是文本、
   * 规则却按 YYYYMMDDHHmmss 写」的分裂。
   */
  typeHints?: Record<string, YamlPropertyType>;
  /**
   * 是否用条目的「译名」当显示名。
   *
   * 由视图按 Obsidian 当前界面语言决定（英文界面下不译，键名本身就是最自然的
   * 名字）。模型只认这个布尔值，不 import obsidian，单测才好写。
   */
  useLabels?: boolean;
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

/** 元数据缓存会往 frontmatter 里塞一个 `position`，它不是用户的属性。 */
const CACHE_ONLY_KEYS = new Set(['position']);

export function isComplexValue(value: unknown): boolean {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function isBlankValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function inferPropertyType(value: unknown): YamlPropertyType {
  if (Array.isArray(value)) return 'list';
  if (typeof value === 'boolean') return 'checkbox';
  if (typeof value === 'number') return 'number';

  if (typeof value === 'string') {
    // 先判日期时间：日期正则不会匹配带 T 的字符串，但顺序写清楚更好读
    if (DATE_TIME_RE.test(value)) return 'datetime';
    if (DATE_ONLY_RE.test(value)) return 'date';
  }

  return 'text';
}

/**
 * moment 格式串里是否**只有日期**（据此决定用 date 还是 datetime 控件）。
 *
 * `[..]` 里是转义的字面量（`[at] GMT` 这种），要先剥掉，否则里面的字母会被误判。
 * 时间相关的 token：H/h/K/k（时）、m/s/S（分秒）、A/a（上下午）、Z/ZZ（时区）、X/x（时间戳）。
 */
export function isDateOnlyFormat(format: string): boolean {
  const withoutLiterals = format.replace(/\[[^\]]*\]/g, '');
  return !/[HhKkmsSxXZAa]/.test(withoutLiterals);
}

function resolvePropertyType(
  key: string,
  configType: YamlPropertyType | null,
  hintType: YamlPropertyType | null,
  value: unknown,
  registeredType?: (key: string) => YamlPropertyType | null
): YamlPropertyType {
  // aliases / tags / cssclasses 的类型由 Obsidian 写死，任何来源都不该覆盖它
  const fixed = fixedPropertyTypeFor(key);
  if (fixed) return fixed;

  // 时间戳这类由别的规则掌管的键，优先级高于「要插入的键」里的类型
  if (hintType) return hintType;

  if (configType) return configType;

  const registered = registeredType?.(key);
  if (registered) return registered;

  return inferPropertyType(value);
}

function makeRow(
  key: string,
  value: unknown,
  present: boolean,
  configured: boolean,
  configType: YamlPropertyType | null,
  registeredType?: (key: string) => YamlPropertyType | null,
  hintType: YamlPropertyType | null = null,
  displayName?: string
): PropertyRow {
  return {
    key,
    displayName,
    type: resolvePropertyType(key, configType, hintType, value, registeredType),
    value,
    present,
    configured,
    readOnly: isComplexValue(value),
  };
}

export function buildPropertyRows({
  frontmatter,
  entries,
  registeredType,
  extraKeys = [],
  typeHints,
  useLabels = false,
}: BuildPropertyRowsArgs): PropertyRow[] {
  const fm = frontmatter ?? {};
  const rows: PropertyRow[] = [];
  const seen = new Set<string>();

  const hintFor = (key: string): YamlPropertyType | null => typeHints?.[key] ?? null;

  // 1. 标准属性：按设置里的顺序，文档里没有也占一行
  for (const entry of entries) {
    const key = entry.key;
    if (seen.has(key)) continue;
    seen.add(key);

    const present = Object.prototype.hasOwnProperty.call(fm, key);
    const label = useLabels ? entry.label?.trim() : undefined;
    rows.push(
      makeRow(
        key,
        present ? fm[key] : undefined,
        present,
        true,
        entry.type,
        registeredType,
        hintFor(key),
        label || undefined
      )
    );
  }

  // 2. 临时添加、尚未落盘的键（底部输入框刚敲进来的）
  for (const key of extraKeys) {
    if (seen.has(key)) continue;
    seen.add(key);

    const present = Object.prototype.hasOwnProperty.call(fm, key);
    rows.push(
      makeRow(key, present ? fm[key] : undefined, present, false, null, registeredType, hintFor(key))
    );
  }

  // 3. 文档独有的属性：保持 frontmatter 的书写顺序
  for (const key of Object.keys(fm)) {
    if (seen.has(key) || CACHE_ONLY_KEYS.has(key)) continue;
    seen.add(key);
    rows.push(makeRow(key, fm[key], true, false, null, registeredType, hintFor(key)));
  }

  return rows;
}

/**
 * 把「刚写下去、但元数据缓存还没跟上」的值叠加到 frontmatter 上。
 *
 * 场景：在视图里删掉一枚列表项后，`processFrontMatter` 已经落盘，但
 * `metadataCache.getFileCache()` 要过几十到几百毫秒才更新。这期间任何一次重画
 * 都会读到旧值，把刚删掉的那一项「复活」——肉眼看到的就是「闪一下、过一会儿才
 * 消失」。调用方在写盘时记下这份乐观值，重画时叠在缓存之上，缓存跟上后再撤掉。
 *
 * 空值（`null` / `''` / `[]`）按「删掉这个键」处理，与写盘时的语义保持一致。
 *
 * @param {Record<string, unknown> | null} frontmatter 缓存里的 frontmatter
 * @param {ReadonlyMap<string, unknown>} pending 键 → 自己刚写下去的值
 * @return {Record<string, unknown> | null} 叠加后的 frontmatter
 */
export function applyPendingValues(
  frontmatter: Record<string, unknown> | null,
  pending: ReadonlyMap<string, unknown>
): Record<string, unknown> | null {
  if (pending.size === 0) return frontmatter;

  const merged: Record<string, unknown> = { ...(frontmatter ?? {}) };
  for (const [key, value] of pending) {
    if (isBlankValue(value)) {
      delete merged[key];
    } else {
      merged[key] = value;
    }
  }

  return merged;
}

/** 值 → 输入框里的文本（列表按逗号连接）。 */
export function formatPropertyValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map((item) => String(item)).join(', ');
  if (isComplexValue(value)) return JSON.stringify(value);
  return String(value);
}

/**
 * 输入框文本 → 要写进 frontmatter 的值。
 *
 * 返回 `null` 表示「清空」——调用方据此把键从 frontmatter 里删掉，回到未登记
 * 状态。数字写不成数字时保留原始文本（与 Obsidian 自己处理非法输入的做法一致：
 * 宁可留个字符串，也不要静默丢内容）。
 */
export function parsePropertyInput(text: string, type: YamlPropertyType): unknown {
  const trimmed = text.trim();
  if (trimmed === '') return null;

  switch (type) {
    case 'list': {
      const items = splitListValues(trimmed);
      return items.length > 0 ? items : null;
    }
    case 'number': {
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : trimmed;
    }
    case 'checkbox':
      return trimmed === 'true';
    default:
      return trimmed;
  }
}
