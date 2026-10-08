import { describe, expect, it } from 'vitest';
import {
	fixedPropertyTypeFor,
	inheritYamlKeys,
	isReservedPropertyKey,
	normalizeYamlAttributeEntries,
	parseLegacyYamlAttributeLine,
	renderYamlAttributeLine,
	splitListValues,
	validateYamlAttribute,
	YAML_PROPERTY_WIDGET,
	yamlAttributeKeys,
	type YamlAttributeEntry,
} from './yaml-attributes';

const entry = (
	key: string,
	type: YamlAttributeEntry['type'] = 'text',
	value = ''
): YamlAttributeEntry => ({ key, type, value });

describe('parseLegacyYamlAttributeLine', () => {
	it('splits a legacy line into key and value', () => {
		expect(parseLegacyYamlAttributeLine('aliases: ')).toEqual(entry('aliases'));
		expect(parseLegacyYamlAttributeLine('tags: doc')).toEqual(entry('tags', 'text', 'doc'));
	});

	it('treats a bare key as an empty text entry', () => {
		expect(parseLegacyYamlAttributeLine('memo')).toEqual(entry('memo'));
		expect(parseLegacyYamlAttributeLine('  memo  ')).toEqual(entry('memo'));
	});

	it('only splits on the first colon so colons inside the value survive', () => {
		expect(parseLegacyYamlAttributeLine("key: 'a: b'")).toEqual(
			entry('key', 'text', "'a: b'")
		);
	});

	it('drops blank input', () => {
		expect(parseLegacyYamlAttributeLine('   ')).toBeNull();
	});
});

describe('normalizeYamlAttributeEntries', () => {
	it('migrates legacy strings to entries', () => {
		expect(normalizeYamlAttributeEntries(['aliases: ', 'tags: doc', 'memo'])).toEqual([
			entry('aliases', 'list'),
			entry('tags', 'list', 'doc'),
			entry('memo'),
		]);
	});

	it('forces the Obsidian-fixed type on the reserved keys', () => {
		expect(normalizeYamlAttributeEntries([{ key: 'tags', type: 'number', value: '1' }])).toEqual([
			entry('tags', 'list', '1'),
		]);
		expect(normalizeYamlAttributeEntries([{ key: 'CSSClasses', type: 'text', value: 'x' }])).toEqual([
			entry('CSSClasses', 'list', 'x'),
		]);
	});

	it('keeps the same array reference when nothing has to change', () => {
		const current = [entry('aliases', 'list'), entry('tags', 'list', 'a, b'), entry('memo')];
		expect(normalizeYamlAttributeEntries(current)).toBe(current);
	});

	it('returns a new array once a migration is needed', () => {
		const legacy = ['aliases: '];
		expect(normalizeYamlAttributeEntries(legacy)).not.toBe(legacy);
	});

	it('falls back to text for an unknown type and drops entries without a key', () => {
		expect(
			normalizeYamlAttributeEntries([
				{ key: 'k', type: 'nonsense', value: 1 },
				{ key: '  ' },
				{ type: 'number' },
			])
		).toEqual([entry('k', 'text', '')]);
	});

	it('returns an empty array for non-array input', () => {
		expect(normalizeYamlAttributeEntries(undefined)).toEqual([]);
		expect(normalizeYamlAttributeEntries({ key: 'a' })).toEqual([]);
	});
});

describe('renderYamlAttributeLine', () => {
	const now = new Date(2026, 9, 8, 19, 40);

	it('inserts a bare key for an empty text value (matches the old behaviour)', () => {
		expect(renderYamlAttributeLine(entry('note'), now)).toBe('note:');
	});

	it('quotes a text value that would otherwise change meaning', () => {
		expect(renderYamlAttributeLine(entry('memo', 'text', 'a: b'), now)).toBe('memo: "a: b"');
		expect(renderYamlAttributeLine(entry('memo', 'text', '1'), now)).toBe('memo: "1"');
	});

	it('renders an empty list as [] and a filled list as a block sequence', () => {
		expect(renderYamlAttributeLine(entry('tags', 'list'), now)).toBe('tags: []');
		expect(renderYamlAttributeLine(entry('tags', 'list', 'a, b'), now)).toBe(
			'tags:\n  - a\n  - b'
		);
	});

	it('renders numbers and checkboxes unquoted', () => {
		expect(renderYamlAttributeLine(entry('n', 'number'), now)).toBe('n: 0');
		expect(renderYamlAttributeLine(entry('n', 'number', '42'), now)).toBe('n: 42');
		expect(renderYamlAttributeLine(entry('b', 'checkbox'), now)).toBe('b: false');
		expect(renderYamlAttributeLine(entry('b', 'checkbox', 'true'), now)).toBe('b: true');
	});

	it('falls back to today for an empty date / datetime value', () => {
		expect(renderYamlAttributeLine(entry('d', 'date'), now)).toBe('d: 2026-10-08');
		expect(renderYamlAttributeLine(entry('dt', 'datetime'), now)).toBe('dt: 2026-10-08T19:40');
	});

	it('keeps a provided date / datetime value as-is', () => {
		expect(renderYamlAttributeLine(entry('d', 'date', '2000-01-02'), now)).toBe('d: 2000-01-02');
		expect(renderYamlAttributeLine(entry('dt', 'datetime', '2000-01-02T03:04'), now)).toBe(
			'dt: 2000-01-02T03:04'
		);
	});
});

describe('validateYamlAttribute', () => {
	it('accepts an empty value for every type', () => {
		for (const type of ['text', 'list', 'number', 'checkbox', 'date', 'datetime'] as const) {
			expect(validateYamlAttribute(entry('k', type))).toEqual({ ok: true });
		}
	});

	it('rejects an empty or colon-carrying key', () => {
		expect(validateYamlAttribute(entry(''))).toEqual({ ok: false, messageKey: 'required' });
		expect(validateYamlAttribute(entry('a:b')).ok).toBe(false);
		expect(validateYamlAttribute(entry(' a')).ok).toBe(false);
	});

	it('rejects a key that is not a plain YAML scalar', () => {
		expect(validateYamlAttribute(entry('*star')).ok).toBe(false);
	});

	it('type-checks a provided value', () => {
		expect(validateYamlAttribute(entry('n', 'number', 'abc')).ok).toBe(false);
		expect(validateYamlAttribute(entry('n', 'number', '1.5')).ok).toBe(true);
		expect(validateYamlAttribute(entry('b', 'checkbox', 'yes')).ok).toBe(false);
		expect(validateYamlAttribute(entry('d', 'date', '2026/10/08')).ok).toBe(false);
		expect(validateYamlAttribute(entry('d', 'date', '2026-10-08')).ok).toBe(true);
		expect(validateYamlAttribute(entry('dt', 'datetime', '2026-10-08')).ok).toBe(false);
		expect(validateYamlAttribute(entry('dt', 'datetime', '2026-10-08T19:40')).ok).toBe(true);
		expect(validateYamlAttribute(entry('dt', 'datetime', '2026-10-08T19:40:00')).ok).toBe(true);
	});

	it('lets a list hold free-form values', () => {
		expect(validateYamlAttribute(entry('tags', 'list', 'a: b, c')).ok).toBe(true);
	});
});

describe('helpers', () => {
	it('splits list values on commas and newlines', () => {
		expect(splitListValues('a, b\nc ,, d')).toEqual(['a', 'b', 'c', 'd']);
	});

	it('knows the Obsidian-reserved property keys', () => {
		expect(isReservedPropertyKey('aliases')).toBe(true);
		expect(isReservedPropertyKey('Tags')).toBe(true);
		expect(isReservedPropertyKey('cssclasses')).toBe(true);
		expect(isReservedPropertyKey('memo')).toBe(false);
	});

	it('locks the reserved keys to the list type Obsidian fixes them to', () => {
		expect(fixedPropertyTypeFor('aliases')).toBe('list');
		expect(fixedPropertyTypeFor('Tags')).toBe('list');
		expect(fixedPropertyTypeFor('cssclasses')).toBe('list');
		expect(fixedPropertyTypeFor('memo')).toBeNull();
	});

	it('maps list to the multitext widget Obsidian stores in types.json', () => {
		expect(YAML_PROPERTY_WIDGET.list).toBe('multitext');
		expect(YAML_PROPERTY_WIDGET.checkbox).toBe('checkbox');
	});

	it('exposes just the keys, in order, for the sort rule to reuse', () => {
		expect(
			yamlAttributeKeys([
				{ key: 'title', type: 'text', value: '' },
				{ key: 'tags', type: 'list', value: '' },
				{ key: 'created', type: 'date', value: '' },
			])
		).toEqual(['title', 'tags', 'created']);
	});

	it('reuses the keys of legacy and malformed entries too', () => {
		expect(yamlAttributeKeys(['aliases: ', 'memo', { key: ' ' }])).toEqual(['aliases', 'memo']);
		expect(yamlAttributeKeys(undefined)).toEqual([]);
	});

	it('merges an inherited key list in front of the existing one', () => {
		expect(inheritYamlKeys(['memo', 'zzz'], ['title', 'tags'])).toEqual([
			'title',
			'tags',
			'memo',
			'zzz',
		]);
	});

	it('leaves an already-consistent list untouched (so the caller can skip the write)', () => {
		const current = ['title', 'tags', 'memo'];
		expect(inheritYamlKeys(current, ['title', 'tags'])).toEqual(current);
	});

	it('reorders the inherited keys and drops duplicates', () => {
		expect(inheritYamlKeys(['tags', 'title', 'tags'], ['title', 'tags'])).toEqual([
			'title',
			'tags',
		]);
	});

	it('starts from the inherited list when the current one is empty', () => {
		expect(inheritYamlKeys([], ['a', 'b'])).toEqual(['a', 'b']);
	});
});
