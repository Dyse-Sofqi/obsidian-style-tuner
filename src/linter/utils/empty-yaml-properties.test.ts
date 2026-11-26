import { describe, expect, it } from 'vitest';
import { removeEmptyYamlProperties } from './empty-yaml-properties';

const doc = (frontmatter: string, body = '# 标题\n\n正文\n') => `---\n${frontmatter}---\n${body}`;

describe('removeEmptyYamlProperties', () => {
	it('removes keys whose value is absent', () => {
		const before = doc('title: 笔记\nempty:\nemptyWithSpaces:   \n');
		const result = removeEmptyYamlProperties(before);

		expect(result.text).toBe(doc('title: 笔记\n'));
		expect(result.removedKeys).toEqual(['empty', 'emptyWithSpaces']);
	});

	it('keeps keys that actually have a value', () => {
		const before = doc('title: 笔记\ncount: 0\nflag: false\n');
		expect(removeEmptyYamlProperties(before).text).toBe(before);
	});

	it('keeps an explicit null value', () => {
		const before = doc('memo: null\nother: ~\n');
		expect(removeEmptyYamlProperties(before).text).toBe(before);
	});

	it('keeps a block list even when the list looks empty', () => {
		// 这是最危险的一类：键下面没有同一行的值，但值是下面的列表
		const before = doc('aliases:\n  - 笔记一\n  - 笔记二\nempty:\n');
		const result = removeEmptyYamlProperties(before);

		expect(result.text).toBe(doc('aliases:\n  - 笔记一\n  - 笔记二\n'));
		expect(result.removedKeys).toEqual(['empty']);
	});

	it('keeps a block list whose only item is blank', () => {
		// `tags:` + 一个空列表项 = 只含一个空串的列表，值仍然存在
		const before = doc('tags:\n  - \n');
		expect(removeEmptyYamlProperties(before).text).toBe(before);
	});

	it('removes empty flow collections', () => {
		// `[]` / `{}` 没有内容，和 `key:` 一样属于空属性；类型记在 types.json，不会丢
		const before = doc('tags: []\nmeta: {}\nspaced: [ ]\ntitle: 笔记\n');
		const result = removeEmptyYamlProperties(before);

		expect(result.text).toBe(doc('title: 笔记\n'));
		expect(result.removedKeys).toEqual(['tags', 'meta', 'spaced']);
	});

	it('keeps non-empty flow collections', () => {
		const before = doc('tags: [a, b]\nmeta: {a: 1}\n');
		expect(removeEmptyYamlProperties(before).text).toBe(before);
	});

	it('keeps empty strings and block scalars', () => {
		// 空字符串是用户显式写出的标量值，块标量同理——都不是「没填」
		const before = doc('quote: ""\nsingle: \'\'\nnote: |\n  \n');
		expect(removeEmptyYamlProperties(before).text).toBe(before);
	});

	it('keeps an empty collection that carries an inline comment', () => {
		const before = doc('tags: [] # 待补\n');
		expect(removeEmptyYamlProperties(before).text).toBe(before);
	});

	it('keeps an empty collection written across lines', () => {
		// 只认冒号后同一行里那对括号，跨行的写法保持原样
		const before = doc('tags: [\n]\n');
		expect(removeEmptyYamlProperties(before).text).toBe(before);
	});

	it('keeps nested maps', () => {
		const before = doc('meta:\n  created:\n  author: me\n');
		expect(removeEmptyYamlProperties(before).text).toBe(before);
	});

	it('keeps a key that only carries an inline comment', () => {
		const before = doc('memo: # 待补\n');
		expect(removeEmptyYamlProperties(before).text).toBe(before);
	});

	it('removes a quoted key holding a colon', () => {
		const before = doc('"a:b":\ntitle: 笔记\n');
		const result = removeEmptyYamlProperties(before);

		expect(result.text).toBe(doc('title: 笔记\n'));
		expect(result.removedKeys).toEqual(['a:b']);
	});

	it('keeps everything else byte for byte', () => {
		const frontmatter = 'title: "含: 冒号的标题"\ntags:\n  - 一\nempty:\nlist: [a, b]\n';
		const before = doc(frontmatter);

		expect(removeEmptyYamlProperties(before).text).toBe(doc('title: "含: 冒号的标题"\ntags:\n  - 一\nlist: [a, b]\n'));
	});

	it('empties the frontmatter when every key is empty', () => {
		const before = doc('one:\ntwo:\n');
		expect(removeEmptyYamlProperties(before).text).toBe(doc(''));
	});

	it('leaves documents without frontmatter untouched', () => {
		const before = '# 只有正文\n\nempty:\n';
		expect(removeEmptyYamlProperties(before).text).toBe(before);
	});

	it('leaves unterminated frontmatter untouched', () => {
		const before = '---\nempty:\n\n# 标题\n';
		expect(removeEmptyYamlProperties(before).text).toBe(before);
	});

	it('leaves malformed yaml untouched', () => {
		const before = doc('title: 笔记\n  bad indent: x\nempty:\n');
		const result = removeEmptyYamlProperties(before);

		expect(result.text).toBe(before);
		expect(result.removedKeys).toEqual([]);
	});

	it('handles crlf line endings', () => {
		const before = '---\r\ntitle: 笔记\r\nempty:\r\n---\r\n\r\n正文\r\n';
		const result = removeEmptyYamlProperties(before);

		expect(result.text).toBe('---\r\ntitle: 笔记\r\n---\r\n\r\n正文\r\n');
		expect(result.removedKeys).toEqual(['empty']);
	});

	it('ignores a frontmatter-less separator inside the body', () => {
		const before = '# 标题\n\n---\nempty:\n---\n';
		expect(removeEmptyYamlProperties(before).text).toBe(before);
	});

	it('cleans a key that another rule would re-insert', () => {
		// 「插入 YAML 属性」里配置的键不做例外：清理就是在打开时把残留清掉，
		// 要不要它一直存在，由那条规则自己决定
		const before = doc('memo:\ntitle: 笔记\n');
		const result = removeEmptyYamlProperties(before);

		expect(result.text).toBe(doc('title: 笔记\n'));
		expect(result.removedKeys).toEqual(['memo']);
	});
});
