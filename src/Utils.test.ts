import { describe, expect, it } from 'vitest';
import type { Meta } from './SettingHandlers';

const localStorageMock: Storage = {
	length: 0,
	clear: () => undefined,
	getItem: () => null,
	key: () => null,
	removeItem: () => undefined,
	setItem: () => undefined,
};

Object.defineProperty(globalThis, 'window', {
	value: {
		localStorage: localStorageMock,
	},
	writable: true,
});

const {
	isValidDefaultColor,
	isValidSavedColor,
	bestFuzzyMatch,
	escapeHtml,
	getSettingSearchTargets,
	getVariableName,
} = await import('./Utils');

describe('isValidDefaultColor', () => {
	it('accepts valid color prefixes', () => {
		expect(isValidDefaultColor('#ff00ff')).toBe(true);
		expect(isValidDefaultColor('rgb(0, 0, 0)')).toBe(true);
		expect(isValidDefaultColor('hsl(0, 100%, 50%)')).toBe(true);
	});

	it('rejects non-color strings', () => {
		expect(isValidDefaultColor('banana')).toBe(false);
	});
});

describe('isValidSavedColor', () => {
	it('accepts valid colors', () => {
		expect(isValidSavedColor('#00ff00')).toBe(true);
		expect(isValidSavedColor('rgb(10, 20, 30)')).toBe(true);
	});

	it('rejects NaN-containing strings', () => {
		expect(isValidSavedColor('#NANNANNAN')).toBe(false);
		expect(isValidSavedColor('rgb(NaN, NaN, NaN)')).toBe(false);
	});

	it('rejects non-color strings', () => {
		expect(isValidSavedColor('not-a-color')).toBe(false);
	});
});

/** 与 AbstractSettingComponent.decisiveMatch 的阈值保持一致 */
const decisive = (query: string, setting: Meta): boolean =>
	bestFuzzyMatch(query, getSettingSearchTargets(setting)) > -100000;

const ribbonPadding: Meta = {
	id: 'ribbon-padding',
	type: 'variable-number',
	title: '侧边栏内边距',
	description: '调整左侧功能区的内边距',
};

describe('getVariableName', () => {
	it('returns --<id> for variable settings', () => {
		expect(getVariableName(ribbonPadding)).toBe('--ribbon-padding');
		expect(
			getVariableName({ id: 'accent', type: 'variable-color', title: 'A' })
		).toBe('--accent');
	});

	it('returns undefined for non-variable settings', () => {
		expect(
			getVariableName({ id: 'my-heading', type: 'heading', title: 'H' })
		).toBeUndefined();
		expect(
			getVariableName({
				id: 'wide-tables',
				type: 'class-toggle',
				title: 'Wide tables',
			})
		).toBeUndefined();
	});
});

describe('getSettingSearchTargets', () => {
	it('adds both the raw id and the CSS variable name', () => {
		const targets = getSettingSearchTargets(ribbonPadding);
		expect(targets).toContain('侧边栏内边距');
		expect(targets).toContain('调整左侧功能区的内边距');
		expect(targets).toContain('ribbon-padding');
		expect(targets).toContain('--ribbon-padding');
	});

	it('adds the class name for class toggles but no variable name', () => {
		const targets = getSettingSearchTargets({
			id: 'wide-tables',
			type: 'class-toggle',
			title: '宽表格',
		});
		expect(targets).toContain('wide-tables');
		expect(targets).not.toContain('--wide-tables');
	});

	it('omits ids for headings and info text', () => {
		expect(
			getSettingSearchTargets({
				id: 'my-section',
				type: 'heading',
				title: '我的分区',
			})
		).toEqual(['我的分区']);
	});
});

describe('searching settings by CSS variable name', () => {
	it('finds a setting by its full variable name', () => {
		expect(decisive('--ribbon-padding', ribbonPadding)).toBe(true);
	});

	it('finds a setting by its bare id', () => {
		expect(decisive('ribbon-padding', ribbonPadding)).toBe(true);
	});

	it('still finds a setting by its title and description', () => {
		expect(decisive('侧边栏内边距', ribbonPadding)).toBe(true);
		expect(decisive('功能区', ribbonPadding)).toBe(true);
	});

	it('does not match unrelated settings', () => {
		expect(decisive('--ribbon-padding', {
			id: 'accent-color',
			type: 'variable-color',
			title: '强调色',
		})).toBe(false);
		expect(decisive('', ribbonPadding)).toBe(false);
	});
});

describe('escapeHtml', () => {
	it('escapes HTML special characters', () => {
		expect(escapeHtml('--a&b<c>"d\'e')).toBe(
			'--a&amp;b&lt;c&gt;&quot;d&#39;e'
		);
	});

	it('leaves valid CSS variable names untouched', () => {
		expect(escapeHtml('--ribbon-padding')).toBe('--ribbon-padding');
	});
});
