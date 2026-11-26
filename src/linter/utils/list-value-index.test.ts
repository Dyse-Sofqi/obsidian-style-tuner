import { describe, expect, it } from 'vitest';
import { filterListValues, rankListValues } from './list-value-index';

const sample = (value: string, mtime: number) => ({ value, mtime });

describe('rankListValues', () => {
	it('puts the most recently added value first', () => {
		const ranked = rankListValues([
			sample('旧值', 100),
			sample('最新值', 300),
			sample('中间值', 200),
		]);

		expect(ranked).toEqual(['最新值', '中间值', '旧值']);
	});

	it('keeps a value once and takes its newest occurrence', () => {
		// 同一个值散落在多篇笔记里：以最新的那篇为准，且只出现一次
		const ranked = rankListValues([
			sample('项目 A', 100),
			sample('其它', 200),
			sample('项目 A', 300),
		]);

		expect(ranked).toEqual(['项目 A', '其它']);
	});

	it('dedupes case-insensitively and keeps the newest casing', () => {
		const ranked = rankListValues([
			sample('Project', 100),
			sample('project', 300),
		]);

		expect(ranked).toEqual(['project']);
	});

	it('drops blank values and trims the rest', () => {
		const ranked = rankListValues([sample('  ', 100), sample(' 值 ', 200), sample('', 300)]);

		expect(ranked).toEqual(['值']);
	});

	it('falls back to the name when two values share a timestamp', () => {
		const ranked = rankListValues([sample('b', 100), sample('a', 100), sample('c', 100)]);

		expect(ranked).toEqual(['a', 'b', 'c']);
	});

	it('handles an empty list', () => {
		expect(rankListValues([])).toEqual([]);
	});
});

describe('filterListValues', () => {
	const values = ['分类 A', '分类 B', '#hashtag', 'Project'];

	it('excludes the values already in the row, case-insensitively', () => {
		expect(filterListValues(values, ['project'], '')).toEqual(['分类 A', '分类 B', '#hashtag']);
	});

	it('filters by the typed text', () => {
		expect(filterListValues(values, [], '分类')).toEqual(['分类 A', '分类 B']);
	});

	it('ignores a leading # in the query', () => {
		expect(filterListValues(values, [], '#hash')).toEqual(['#hashtag']);
	});

	it('returns nothing when the query matches nothing (so the popover stays shut)', () => {
		expect(filterListValues(values, [], 'zzz')).toEqual([]);
	});

	it('returns nothing when every value is already in the row', () => {
		expect(filterListValues(['a'], ['A'], '')).toEqual([]);
	});
});
