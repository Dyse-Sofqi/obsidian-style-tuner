import { describe, expect, it } from 'vitest';
import {
  applyPendingValues,
  buildPropertyRows,
  formatPropertyValue,
  inferPropertyType,
  isBlankValue,
  isDateOnlyFormat,
  parsePropertyInput,
  type PropertyRow,
} from './properties-model';
import type { YamlAttributeEntry } from './yaml-attributes';

const entry = (key: string, type: YamlAttributeEntry['type'] = 'text', value = ''): YamlAttributeEntry => ({
  key,
  type,
  value,
});

const keys = (rows: PropertyRow[]) => rows.map((row) => row.key);

describe('buildPropertyRows', () => {
  it('puts configured keys first in settings order, then document-only keys', () => {
    const rows = buildPropertyRows({
      frontmatter: { memo: 'hi', author: 'me' },
      entries: [entry('aliases', 'list'), entry('memo'), entry('sort', 'list')],
    });

    expect(keys(rows)).toEqual(['aliases', 'memo', 'sort', 'author']);
  });

  it('keeps a configured key even when the document does not have it', () => {
    const rows = buildPropertyRows({
      frontmatter: null,
      entries: [entry('memo'), entry('sort', 'list')],
    });

    expect(keys(rows)).toEqual(['memo', 'sort']);
    expect(rows[0]).toMatchObject({ present: false, configured: true, value: undefined });
  });

  it('marks a key that exists in both sources as present and configured', () => {
    const rows = buildPropertyRows({
      frontmatter: { memo: 'hi' },
      entries: [entry('memo')],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ present: true, configured: true, value: 'hi' });
  });

  it('ignores the metadata cache `position` pseudo key', () => {
    const rows = buildPropertyRows({
      frontmatter: { position: {}, memo: 'hi' },
      entries: [],
    });

    expect(keys(rows)).toEqual(['memo']);
  });

  it('does not duplicate a key that is configured and listed twice', () => {
    const rows = buildPropertyRows({
      frontmatter: {},
      entries: [entry('memo'), entry('memo', 'number')],
    });

    expect(keys(rows)).toEqual(['memo']);
  });

  it('appends extra keys that are not in the document yet', () => {
    const rows = buildPropertyRows({
      frontmatter: { memo: 'hi' },
      entries: [],
      extraKeys: ['rating'],
    });

    // 临时键排在标准键之后、文档独有键之前
    expect(keys(rows)).toEqual(['rating', 'memo']);
    expect(rows[0]).toMatchObject({ key: 'rating', present: false });
  });

  it('resolves the type: fixed > configured > registered > inferred', () => {
    const registered = (key: string) =>
      key === 'registered' ? ('datetime' as const) : key === 'tags' ? ('text' as const) : null;

    const rows = buildPropertyRows({
      frontmatter: { registered: '2026-01-02', tags: ['a'], count: 3, flag: true },
      entries: [entry('count', 'text')],
      registeredType: registered,
    });

    const byKey = Object.fromEntries(rows.map((row) => [row.key, row.type]));
    expect(byKey.count).toBe('text');
    expect(byKey.registered).toBe('datetime');
    expect(byKey.tags).toBe('list');
    expect(byKey.flag).toBe('checkbox');
  });

  it('marks nested objects as read-only', () => {
    const rows = buildPropertyRows({
      frontmatter: { nested: { a: 1 } },
      entries: [],
    });

    expect(rows[0].readOnly).toBe(true);
  });

  it('lets a type hint from another rule win over the configured and registered types', () => {
    const rows = buildPropertyRows({
      frontmatter: { created: 20261125185900 },
      entries: [entry('created', 'text')],
      typeHints: { created: 'datetime' },
      registeredType: () => 'text',
    });

    expect(rows[0].type).toBe('datetime');
  });

  it('keeps the Obsidian-fixed type even when a hint disagrees', () => {
    const rows = buildPropertyRows({
      frontmatter: { tags: ['a'] },
      entries: [],
      typeHints: { tags: 'text' },
    });

    expect(rows[0].type).toBe('list');
  });
});

describe('isDateOnlyFormat', () => {
  it('treats formats without time tokens as date-only', () => {
    expect(isDateOnlyFormat('YYYY-MM-DD')).toBe(true);
    expect(isDateOnlyFormat('YYYYMMDD')).toBe(true);
    expect(isDateOnlyFormat('YYYY-MM-DD [at] MM')).toBe(true);
  });

  it('detects time tokens', () => {
    expect(isDateOnlyFormat('YYYYMMDDHHmmss')).toBe(false);
    expect(isDateOnlyFormat('YYYY-MM-DD HH:mm')).toBe(false);
    expect(isDateOnlyFormat('dddd, MMMM Do YYYY, h:mm:ss a')).toBe(false);
    expect(isDateOnlyFormat('YYYY-MM-DD [at] HH:mm')).toBe(false);
  });
});

describe('inferPropertyType', () => {
  it('infers from the value shape', () => {
    expect(inferPropertyType(['a'])).toBe('list');
    expect(inferPropertyType(false)).toBe('checkbox');
    expect(inferPropertyType(12)).toBe('number');
    expect(inferPropertyType('plain')).toBe('text');
    expect(inferPropertyType('2026-01-02')).toBe('date');
    expect(inferPropertyType('2026-01-02T03:04')).toBe('datetime');
  });
});

describe('isBlankValue', () => {
  it('treats missing, empty text and empty lists as blank', () => {
    expect(isBlankValue(undefined)).toBe(true);
    expect(isBlankValue(null)).toBe(true);
    expect(isBlankValue('  ')).toBe(true);
    expect(isBlankValue([])).toBe(true);
  });

  it('keeps 0 and false as real values', () => {
    expect(isBlankValue(0)).toBe(false);
    expect(isBlankValue(false)).toBe(false);
  });
});

describe('formatPropertyValue', () => {
  it('joins lists with commas and leaves text alone', () => {
    expect(formatPropertyValue(['a', 'b'])).toBe('a, b');
    expect(formatPropertyValue('hi')).toBe('hi');
    expect(formatPropertyValue(undefined)).toBe('');
    expect(formatPropertyValue({ a: 1 })).toBe('{"a":1}');
  });
});

describe('parsePropertyInput', () => {
  it('splits list text and returns null when emptied', () => {
    expect(parsePropertyInput('a, b', 'list')).toEqual(['a', 'b']);
    expect(parsePropertyInput('   ', 'list')).toBeNull();
  });

  it('parses numbers but keeps unparseable text as-is', () => {
    expect(parsePropertyInput('42', 'number')).toBe(42);
    expect(parsePropertyInput('abc', 'number')).toBe('abc');
  });

  it('clears on empty input for scalar types', () => {
    expect(parsePropertyInput('', 'text')).toBeNull();
    expect(parsePropertyInput('hi', 'text')).toBe('hi');
  });
});

describe('display names', () => {
  const labelled: YamlAttributeEntry = { key: 'memo', type: 'text', value: '', label: '备注' };

  it('uses the entry label only when labels are enabled', () => {
    const withLabels = buildPropertyRows({
      frontmatter: { memo: 'hi' },
      entries: [labelled],
      useLabels: true,
    });
    expect(withLabels[0]).toMatchObject({ key: 'memo', displayName: '备注' });

    const withoutLabels = buildPropertyRows({
      frontmatter: { memo: 'hi' },
      entries: [labelled],
    });
    expect(withoutLabels[0].displayName).toBeUndefined();
  });

  it('leaves document-only keys without a display name', () => {
    const rows = buildPropertyRows({
      frontmatter: { author: 'me' },
      entries: [labelled],
      useLabels: true,
    });
    expect(rows[1]).toMatchObject({ key: 'author', configured: false });
    expect(rows[1].displayName).toBeUndefined();
  });

  it('falls back to the key when the entry has no label', () => {
    const rows = buildPropertyRows({ frontmatter: null, entries: [entry('memo')], useLabels: true });
    expect(rows[0].displayName).toBeUndefined();
  });
});

describe('applyPendingValues', () => {
  it('overlays a just-written list value over a stale cache', () => {
    // 缓存还是旧的（含被删项），乐观值是删后的新数组 → 重画应显示新值，pill 不复活
    const stale = { tags: ['a', 'b', 'c'], title: 'x' };
    const merged = applyPendingValues(stale, new Map([['tags', ['a', 'c']]]));
    expect(merged).toEqual({ tags: ['a', 'c'], title: 'x' });
    // 不改动入参
    expect(stale.tags).toEqual(['a', 'b', 'c']);
  });

  it('deletes a key when the optimistic value is blank', () => {
    expect(applyPendingValues({ tags: ['a'], title: 'x' }, new Map([['tags', null]]))).toEqual({
      title: 'x',
    });
    expect(applyPendingValues({ tags: ['a'] }, new Map([['tags', []]]))).toEqual({});
    expect(applyPendingValues({ tags: ['a'] }, new Map([['tags', '']]))).toEqual({});
  });

  it('adds a key that is not in the cache yet', () => {
    expect(applyPendingValues({ title: 'x' }, new Map([['status', 'done']]))).toEqual({
      title: 'x',
      status: 'done',
    });
  });

  it('works when the cache has no frontmatter at all', () => {
    expect(applyPendingValues(null, new Map([['status', 'done']]))).toEqual({ status: 'done' });
  });

  it('returns the original object untouched when there is nothing pending', () => {
    const fm = { tags: ['a'] };
    expect(applyPendingValues(fm, new Map())).toBe(fm);
  });
});
