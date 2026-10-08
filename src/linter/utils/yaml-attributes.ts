import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import type { LanguageStringKey } from '../lang/helpers';

/**
 * 「插入 YAML 属性」规则的条目模型。
 *
 * 早期版本把每条存成**一整行文本**（`'aliases: '`、`'memo:'`），插入时原样写进
 * frontmatter；现在改成 `{键, 属性类型, 默认值}`，插入时按类型生成合法 YAML。
 * 旧数据由 `normalizeYamlAttributeEntries()` 在加载时迁移（见 `LinterPlugin.loadSettings`）。
 *
 * 本模块是纯逻辑（不 import obsidian），单测直接覆盖。
 */

/**
 * 属性类型。与 Obsidian「属性」面板的选项一致（`text|list|number|checkbox|date|datetime`）。
 * 注意 `list` 在 Obsidian 内部叫 `multitext`（types.json 里存的就是后者），界面上仍叫「列表」。
 */
export type YamlPropertyType = 'text' | 'list' | 'number' | 'checkbox' | 'date' | 'datetime';

export const YAML_PROPERTY_TYPES: readonly YamlPropertyType[] = [
  'text',
  'list',
  'number',
  'checkbox',
  'date',
  'datetime',
];

/** 本插件的类型名 → Obsidian `types.json` 里登记的控件名。 */
export const YAML_PROPERTY_WIDGET: Record<YamlPropertyType, string> = {
  text: 'text',
  list: 'multitext',
  number: 'number',
  checkbox: 'checkbox',
  date: 'date',
  datetime: 'datetime',
};

/**
 * Obsidian 写死了类型的保留键（见 app.js 的 `UR` 常量）：载入 types.json 后会用
 * `Object.assign(assignedWidgets, UR)` 覆盖回来，属性面板里这三个键的「更改类型」
 * 也是禁用的。
 *
 * 它们在 Obsidian 里都是**多值**属性（`aliases` → 别名列表、`tags` → 标签列表、
 * `cssclasses` → `multitext`），所以插件这边统一锁成「列表」：值按块序列生成，
 * 界面上不给改类型，也不写 types.json。不锁的话，用户把它们选成「数字」会插入
 * `tags: 0` 这种与 Obsidian 固定类型直接打架的值。
 */
export const OBSIDIAN_FIXED_PROPERTY_TYPES: Record<string, YamlPropertyType> = {
  aliases: 'list',
  tags: 'list',
  cssclasses: 'list',
};

export function isReservedPropertyKey(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(
    OBSIDIAN_FIXED_PROPERTY_TYPES,
    key.trim().toLowerCase()
  );
}

/** 保留键被 Obsidian 固定的类型；普通键返回 null。 */
export function fixedPropertyTypeFor(key: string): YamlPropertyType | null {
  return OBSIDIAN_FIXED_PROPERTY_TYPES[key.trim().toLowerCase()] ?? null;
}

export const YAML_PROPERTY_TYPE_LABEL_KEY: Record<YamlPropertyType, LanguageStringKey> = {
  text: 'rules.insert-yaml-attributes.property-types.text',
  list: 'rules.insert-yaml-attributes.property-types.list',
  number: 'rules.insert-yaml-attributes.property-types.number',
  checkbox: 'rules.insert-yaml-attributes.property-types.checkbox',
  date: 'rules.insert-yaml-attributes.property-types.date',
  datetime: 'rules.insert-yaml-attributes.property-types.datetime',
};

/** 保留键的类型名后缀，如「列表（Obsidian 固定）」。 */
export const YAML_PROPERTY_TYPE_FIXED_SUFFIX_KEY: LanguageStringKey =
  'rules.insert-yaml-attributes.property-type.fixed-suffix';

/** 「要插入的键」列表里的一条。 */
export interface YamlAttributeEntry {
  /** frontmatter 的键名（不含冒号） */
  key: string;
  /** 属性类型 */
  type: YamlPropertyType;
  /** 默认值；留空则按类型插入骨架（见 `renderYamlAttributeLine`） */
  value: string;
}

export function isYamlPropertyType(value: unknown): value is YamlPropertyType {
  return (
    typeof value === 'string' && (YAML_PROPERTY_TYPES as readonly string[]).includes(value)
  );
}

/** 全新安装时的默认条目（与上游 `InsertYamlAttributesOptions` 保持一致）。 */
export function defaultYamlAttributes(): YamlAttributeEntry[] {
  return [
    { key: 'aliases', type: 'list', value: '' },
    { key: 'tags', type: 'list', value: '' },
  ];
}

/** 保留键的声明类型一律让位给 Obsidian 固定的那个。 */
function withFixedPropertyType(entry: YamlAttributeEntry): YamlAttributeEntry {
  const fixed = fixedPropertyTypeFor(entry.key);
  return fixed && fixed !== entry.type ? { ...entry, type: fixed } : entry;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;
const NUMBER_RE = /^-?\d+(\.\d+)?$/;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function toDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toDateTimeString(date: Date): string {
  return `${toDateString(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * 把旧格式的一整行（`'aliases: '`、`'tags: doc'`、`'memo'`）拆成条目。
 * 只在第一个冒号处切分，值里再出现冒号（`key: 'a: b'`）不受影响。
 */
export function parseLegacyYamlAttributeLine(line: string): YamlAttributeEntry | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const colon = trimmed.indexOf(':');
  if (colon < 0) return { key: trimmed, type: 'text', value: '' };

  const key = trimmed.slice(0, colon).trim();
  if (!key) return null;

  return { key, type: 'text', value: trimmed.slice(colon + 1).trim() };
}

/** 单条任意输入 → 条目；无法解析时返回 null。 */
export function toYamlAttributeEntry(raw: unknown): YamlAttributeEntry | null {
  if (typeof raw === 'string') {
    const entry = parseLegacyYamlAttributeLine(raw);
    return entry ? withFixedPropertyType(entry) : null;
  }
  if (!raw || typeof raw !== 'object') return null;

  const record = raw as Record<string, unknown>;
  const key = typeof record.key === 'string' ? record.key.trim() : '';
  if (!key) return null;

  return withFixedPropertyType({
    key,
    type: isYamlPropertyType(record.type) ? record.type : 'text',
    value: typeof record.value === 'string' ? record.value : '',
  });
}

/**
 * 规整存下来的列表。
 *
 * 内容本来就是新格式时**原样返回同一个数组引用**——`createListManagementPage`
 * 的增删与拖拽排序都是就地改数组，靠这个引用落盘；一旦返回新数组，排序就会丢。
 * 发生迁移（旧字符串、空条目、类型非法）时才返回新数组，调用方据此写回磁盘。
 */
export function normalizeYamlAttributeEntries(raw: unknown): YamlAttributeEntry[] {
  if (!Array.isArray(raw)) return [];

  let changed = false;
  const entries: YamlAttributeEntry[] = [];
  for (const item of raw) {
    const entry = toYamlAttributeEntry(item);
    if (!entry) {
      changed = true;
      continue;
    }
    if (
      typeof item === 'string' ||
      item.key !== entry.key ||
      item.type !== entry.type ||
      item.value !== entry.value
    ) {
      changed = true;
    }
    entries.push(entry);
  }

  return changed ? entries : (raw as YamlAttributeEntry[]);
}

/** 把单个标量序列化成 YAML 安全形式（`'1'` → `"1"`、`'a: b'` → `"a: b"`）。 */
function yamlScalar(value: string): string {
  return stringifyYaml(value).trimEnd();
}

/** 键名是否是合法的 YAML 键（用 yaml 解析器实测，能挡住 `[`、`*` 这类特殊开头）。 */
export function isValidYamlAttributeKey(key: string): boolean {
  const trimmed = key.trim();
  if (!trimmed || trimmed !== key || trimmed.includes(':')) return false;

  try {
    // logLevel: silent —— 键名非法时 yaml 会往控制台吐警告，这里只是探测
    const parsed = parseYaml(`${trimmed}: 1`, { logLevel: 'silent' }) as Record<
      string,
      unknown
    > | null;
    return !!parsed && Object.prototype.hasOwnProperty.call(parsed, trimmed);
  } catch {
    return false;
  }
}

// 不用「可辨识联合」：本仓库 `strictNullChecks: false`，布尔字面量判别在
// 关闭严格空值检查后不会收窄，`if (!result.ok)` 之后拿不到 messageKey。
export interface YamlAttributeValidation {
  ok: boolean;
  /** 校验失败时的文案键（调用方用 getTextInLanguage 取文案） */
  messageKey?: LanguageStringKey;
  /** 文案里的占位符，如 `{KEY}` / `{VALUE}` */
  params?: Record<string, string>;
}

/** 校验一条条目；值留空是合法的（插入该类型的骨架）。 */
export function validateYamlAttribute(entry: YamlAttributeEntry): YamlAttributeValidation {
  if (!entry.key.trim()) return { ok: false, messageKey: 'required' };

  if (entry.key.includes(':')) {
    return {
      ok: false,
      messageKey: 'validation.yaml-key-no-colon',
      params: { KEY: entry.key },
    };
  }
  if (entry.key !== entry.key.trim()) {
    return {
      ok: false,
      messageKey: 'validation.yaml-key-no-whitespace',
      params: { KEY: entry.key },
    };
  }
  if (!isValidYamlAttributeKey(entry.key)) {
    return {
      ok: false,
      messageKey: 'validation.invalid-property-key',
      params: { KEY: entry.key },
    };
  }

  const value = entry.value.trim();
  if (value === '') return { ok: true };

  switch (entry.type) {
    case 'number':
      if (!NUMBER_RE.test(value)) {
        return { ok: false, messageKey: 'validation.invalid-number', params: { VALUE: value } };
      }
      break;
    case 'checkbox':
      if (value !== 'true' && value !== 'false') {
        return { ok: false, messageKey: 'validation.invalid-checkbox', params: { VALUE: value } };
      }
      break;
    case 'date':
      if (!DATE_RE.test(value)) {
        return { ok: false, messageKey: 'validation.invalid-date', params: { VALUE: value } };
      }
      break;
    case 'datetime':
      if (!DATETIME_RE.test(value)) {
        return {
          ok: false,
          messageKey: 'validation.invalid-datetime',
          params: { VALUE: value },
        };
      }
      break;
    default:
      break;
  }

  return { ok: true };
}

/** 列表型条目把值按逗号 / 换行拆成多项。 */
export function splitListValues(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item !== '');
}

/**
 * 生成要插入 frontmatter 的 YAML 文本（可能多行）。
 *
 * 值为空时按类型给骨架：文本 → `键:`、列表 → `键: []`、数字 → `键: 0`、
 * 复选框 → `键: false`、日期 / 日期时间 → 当前日期（时间）。这样插入的键在
 * Obsidian 里能直接落到对应类型的控件上，而不是一律当成文本。
 */
export function renderYamlAttributeLine(
  entry: YamlAttributeEntry,
  now: Date = new Date()
): string {
  const key = entry.key.trim();
  const value = entry.value.trim();

  if (entry.type === 'list') {
    const items = splitListValues(value);
    if (items.length === 0) return `${key}: []`;
    return `${key}:\n${items.map((item) => `  - ${yamlScalar(item)}`).join('\n')}`;
  }

  if (value === '') {
    switch (entry.type) {
      case 'number':
        return `${key}: 0`;
      case 'checkbox':
        return `${key}: false`;
      case 'date':
        return `${key}: ${toDateString(now)}`;
      case 'datetime':
        return `${key}: ${toDateTimeString(now)}`;
      default:
        return `${key}:`;
    }
  }

  switch (entry.type) {
    case 'number':
      return `${key}: ${NUMBER_RE.test(value) ? value : yamlScalar(value)}`;
    case 'checkbox':
      return `${key}: ${value === 'true' || value === 'false' ? value : yamlScalar(value)}`;
    case 'date':
    case 'datetime':
      return `${key}: ${value}`;
    default:
      return `${key}: ${yamlScalar(value)}`;
  }
}

/** 值留空时该类型会插入什么——用于在表单里做占位提示。 */
export function describeYamlAttributeSkeleton(
  entry: YamlAttributeEntry,
  now: Date = new Date()
): string {
  return renderYamlAttributeLine({ ...entry, value: '' }, now);
}

/**
 * 只取键名、按当前顺序——供「YAML 键排序」的「优先级顺序」沿用。
 *
 * 这样插入与排序共用同一份有序键清单，用户不用把同一批键输两遍。
 */
export function yamlAttributeKeys(raw: unknown): string[] {
  return normalizeYamlAttributeEntries(raw).map((entry) => entry.key);
}

/**
 * 把源键清单「继承」进现有列表：**源的键按源的顺序排前面，本列表里多出来的键
 * 保持原有先后跟在后面**（重复的只留第一次出现）。
 *
 * 不做整体覆盖——用户可能在本列表上加过自己的键，直接替换会把它们冲掉。
 * 也正因为是并集，当两边已经一致时结果与原列表逐项相同，调用方据此跳过写入：
 * 点第二次不会发生任何事。
 */
export function inheritYamlKeys(current: string[], source: string[]): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();

  for (const key of [...source, ...current]) {
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(key);
  }

  return merged;
}
