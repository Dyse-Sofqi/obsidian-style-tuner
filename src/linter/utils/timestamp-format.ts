import { moment } from 'obsidian';
import type { LinterSettings } from '../settings-data';
import { isDateOnlyFormat } from './properties-model';
import type { YamlPropertyType } from './yaml-attributes';

/**
 * 让「属性」视图跟着「YAML 时间戳」规则的格式走。
 *
 * 时间戳规则会按 `<configDir>/data-linter.json` 里 `yaml-timestamp.format`
 * 指定的格式写 `created` / `modified`（例如 `YYYYMMDDHHmmss` → `20261125185900`）。
 * 视图如果按 ISO 去理解这些值，就会既认不出类型、也显示不出可读的时间，所以这里
 * 把规则的那份配置读出来，作为该键的「类型 + 读写格式」。
 *
 * 解析策略与规则自身保持一致：先用配置的 format 严格解析，解析不了再退到 ISO。
 * 写回时统一格式化成配置的 format，避免视图写一个格式、规则写另一个格式。
 */

export interface TimestampKeyInfo {
  key: string;
  /** moment 格式串，来自 yaml-timestamp 规则 */
  format: string;
  utc: boolean;
}

export type TimestampKeys = Map<string, TimestampKeyInfo>;

/** 规则里与时间戳格式相关的配置项（`ruleConfigs['yaml-timestamp']`）。 */
type TimestampRuleConfig = {
  enabled?: boolean;
  format?: unknown;
  'convert-to-utc'?: unknown;
  'date-created'?: unknown;
  'date-created-key'?: unknown;
  'date-modified'?: unknown;
  'date-modified-key'?: unknown;
};

/** 格式串含时间部分就是 datetime，只有日期就是 date。 */
export function timestampTypeFor(format: string): YamlPropertyType {
  return isDateOnlyFormat(format) ? 'date' : 'datetime';
}

/**
 * 编辑时额外接受的写法。
 *
 * 单 token（`M` / `D` / `H`）在 moment 的严格模式下既接受补零也接受不补零，所以
 * 这一组同时覆盖了 `2026/07/16 19:05:51`（原生控件回填的写法）和用户手敲的
 * `2026/7/16 9:05`。只在配置格式解析失败后才试，不影响主判定。
 */
const LENIENT_FORMATS = [
  'YYYY/M/D H:m:s',
  'YYYY/M/D H:m',
  'YYYY/M/D',
  'YYYY-M-D H:m:s',
  'YYYY-M-D H:m',
  'YYYY-M-D',
];

/**
 * 读取需要特殊处理的时间戳键。
 *
 * 规则关掉、或格式为空时返回空表——此时这些键退化成普通文本/数字属性，不再特殊对待。
 * `date-created` / `date-modified` 显式关掉的键也不收。
 */
export function readTimestampKeys(settings: LinterSettings | null | undefined): TimestampKeys {
  const keys: TimestampKeys = new Map();

  const config = settings?.ruleConfigs?.['yaml-timestamp'] as TimestampRuleConfig | undefined;
  if (!config || config.enabled === false) return keys;

  const format = typeof config.format === 'string' ? config.format.trim() : '';
  if (!format) return keys;

  const utc = config['convert-to-utc'] === true;

  const add = (toggle: keyof TimestampRuleConfig, keyOption: keyof TimestampRuleConfig, fallbackKey: string) => {
    // 缺省视为开启：规则的默认值就是 created/modified 都写
    if (config[toggle] === false) return;

    const raw = config[keyOption];
    const key = typeof raw === 'string' && raw.trim() ? raw.trim() : fallbackKey;
    keys.set(key, { key, format, utc });
  };

  add('date-created', 'date-created-key', 'date created');
  add('date-modified', 'date-modified-key', 'date modified');

  return keys;
}

function parseTimestamp(text: string, info: TimestampKeyInfo): moment.Moment | null {
  const raw = text.trim();
  if (!raw) return null;

  const parseWith = (format: string): moment.Moment =>
    info.utc ? moment.utc(raw, format, true) : moment(raw, format, true);

  // 1. 存储格式（文档里真实存的写法，如 `20260716190551`）
  // 2. 人类可读写法 / 不补零写法（`2026/07/16 19:05:51`、`2026/7/16 9:05`）
  for (const format of [info.format, ...LENIENT_FORMATS]) {
    const parsed = parseWith(format);
    if (parsed.isValid()) return parsed;
  }

  // 3. 只在看起来像 ISO 时才做宽松解析：对任意字符串调用 moment(string) 会走弃用的
  // 兜底解析并向控制台刷警告，而 YYYYMMDDHHmmss 这类纯数字串应当只认严格解析。
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const loose = info.utc ? moment.utc(raw) : moment(raw);
    if (loose.isValid()) return loose;
  }

  return null;
}

/**
 * 存储值 → 原生日期控件能吃的 `value`。
 *
 * 面板上用原生 `<input type="date|datetime-local">`：观感就是 Obsidian 里那种
 * 「日历图标 + 2026/07/16 19:05:51」，但原生控件的 value 只认 ISO。所以这里把
 * 配置格式的值翻成 ISO 给控件显示，控件改完再由 `normalizeTimestampText` 翻回
 * 配置格式落盘——显示走原生，存储走配置。
 *
 * 解析不了时返回空串（控件显示为未填），不会把整串乱码塞进 value。
 */
export function toNativeDateTimeValue(value: unknown, info: TimestampKeyInfo): string {
  if (value === null || value === undefined) return '';

  const text = String(value).trim();
  if (!text) return '';

  const parsed = parseTimestamp(text, info);
  if (!parsed) return '';

  // 不做时区换算：utc 模式下解析出的 moment 本来就带 utc 标记，format 出来就是
  // 存进去那串墙上时间，换算反而会平白偏移几个小时
  return isDateOnlyFormat(info.format)
    ? parsed.format('YYYY-MM-DD')
    : parsed.format('YYYY-MM-DDTHH:mm:ss');
}

/**
 * 用户输入的文本 → **存储格式**（配置的 `format`），用于写回 frontmatter。
 *
 * 原生控件返回的 ISO 串也走这里，保证落盘的永远是同一种写法。
 * 返回 `null` 表示「按字面量存」：解析不了的输入不能被悄悄改写或丢弃。
 */
export function normalizeTimestampText(text: string, info: TimestampKeyInfo): string | null {
  const parsed = parseTimestamp(text, info);
  if (!parsed) return null;

  return info.utc ? parsed.utc().format(info.format) : parsed.format(info.format);
}
