import { isMap, isScalar, parseDocument } from 'yaml';

/**
 * frontmatter「空值属性」清理。
 *
 * 打开笔记时把 YAML 里**没有任何值**的属性删掉（`key:`、`key:   ` 这类由
 * Obsidian 属性面板留下的空壳），让 frontmatter 保持简洁。
 *
 * 判定完全交给 YAML 解析器，而不是按行做正则，原因只有一个：**看起来没值的
 * 行往往是有值的**。
 *
 *   aliases:          ← 看着是空的，实际值是「列表」，列表项在下面的缩进行里
 *     - 笔记一
 *   tags: []          ← 空列表，值是列表类型而不是空
 *   tags:             ← 这才是真的没有值（YAML 里是 null）
 *     -             ← 注意：这一行让上面的 tags 变成「只含一个空串的列表」
 *   note: |           ← 值是空字符串，但它是块标量，删掉等于删掉一个值
 *   memo: null        ← 显式写出的 null，属于用户的选择，保留
 *
 * 因此本模块只删「值节点的源码区间为空」的键：值节点本身必须存在、是标量、
 * 解析结果为 null，且它在原文里不占任何字符。任何一个条件不满足都原样保留。
 * 删完之后还会重新解析一遍，确认 frontmatter 仍然合法，否则整份放弃——
 * 宁可不清理，也不能把用户的 frontmatter 改坏。
 */

export interface EmptyYamlPropertyCleanup {
  /** 处理后的全文；没有可删的键时与入参**完全相同**（调用方可据此跳过落盘）。 */
  text: string;
  /** 被删掉的键名，按其在 frontmatter 里出现的顺序。 */
  removedKeys: string[];
}

type RangedNode = { range?: [number, number, number] };

interface FrontmatterBounds {
  /** 起始分隔线之后、正文第一行的起点 */
  bodyStart: number;
  /** 结束分隔线所在行的起点 */
  bodyEnd: number;
}

/**
 * 找出文档开头的 frontmatter 正文区间（不含两条 `---` 分隔线）。
 *
 * 不用正则一把梭是因为要拿到**偏移量**去做行级删除，而且结束分隔线必须按
 * 「整行只有 `---`」来认——否则块标量里缩进的 `---` 会被误当成分隔线。
 */
export function getFrontmatterBounds(text: string): FrontmatterBounds | null {
  const opening = /^---[ \t]*\r?\n/.exec(text);
  if (!opening) {
    return null;
  }

  const bodyStart = opening[0].length;
  let cursor = bodyStart;

  while (cursor <= text.length) {
    const newline = text.indexOf('\n', cursor);
    const lineEnd = newline === -1 ? text.length : newline;
    const line = text.slice(cursor, lineEnd).replace(/\r$/, '');

    if (line === '---') {
      return { bodyStart, bodyEnd: cursor };
    }

    if (newline === -1) {
      break;
    }

    cursor = newline + 1;
  }

  return null;
}

/** 某偏移量所在行的行首 / 行尾（不含换行符）/ 下一行行首。 */
function getLineBounds(text: string, offset: number): { start: number; end: number; after: number } {
  const start = text.lastIndexOf('\n', offset - 1) + 1;
  const newline = text.indexOf('\n', offset);

  if (newline === -1) {
    return { start, end: text.length, after: text.length };
  }

  const end = newline > start && text[newline - 1] === '\r' ? newline - 1 : newline;
  return { start, end, after: newline + 1 };
}

/**
 * 这个值节点是不是「源码里什么都没有」。
 *
 * `key:` 解析出来的值节点是存在的（`Scalar`，值是 null），区间为 [x, x, x]
 * ——起点与值终点重合，说明原文那个位置一个字符也没有。`key: null` 的区间
 * 有宽度，`key: |` 的值是空字符串，两者都会因为条件不成立而被保留。
 */
function isEmptyValueNode(node: unknown): boolean {
  if (!isScalar(node) || node.value !== null) {
    return false;
  }

  const range = (node as RangedNode).range;
  return range != null && range[0] === range[1];
}

/**
 * 删除 frontmatter 里没有值的属性。
 *
 * @param {string} text 整篇文档
 * @return {EmptyYamlPropertyCleanup} 处理后的全文与被删掉的键名
 */
export function removeEmptyYamlProperties(text: string): EmptyYamlPropertyCleanup {
  const unchanged: EmptyYamlPropertyCleanup = { text, removedKeys: [] };

  const bounds = getFrontmatterBounds(text);
  if (!bounds) {
    return unchanged;
  }

  const yamlText = text.slice(bounds.bodyStart, bounds.bodyEnd);
  const document = parseDocument(yamlText);

  // 解析出错的 frontmatter 一律不动：可能只是写坏了，我们也可能没读懂
  if (document.errors.length > 0 || !isMap(document.contents)) {
    return unchanged;
  }

  const removals: { start: number; end: number }[] = [];
  const removedKeys: string[] = [];

  for (const item of document.contents.items) {
    const pair = item as { key?: unknown; value?: unknown };

    // 只处理普通标量键；复杂键（`? xxx`）保持原样
    if (!isScalar(pair.key) || typeof pair.key.value !== 'string') {
      continue;
    }

    if (!isEmptyValueNode(pair.value)) {
      continue;
    }

    const keyRange = (pair.key as RangedNode).range;
    if (!keyRange) {
      continue;
    }

    // 键的结束位置 → 在同一行里找那个映射冒号。不自己扫引号是因为 key 的
    // range 已经把 `"a:b"` 这类带冒号的引号键整体圈进去了，其后的第一个
    // 冒号必然是分隔符。
    const keyEnd = bounds.bodyStart + keyRange[1];
    const keyLine = getLineBounds(text, keyEnd);
    const colon = text.indexOf(':', keyEnd);

    if (colon === -1 || colon > keyLine.end) {
      continue;
    }

    // 冒号后面必须只剩空白。`key: # 说明` 这种带行内注释的行因此被保留——
    // 删掉它等于顺手删掉用户写的注释。
    if (text.slice(colon + 1, keyLine.end).trim() !== '') {
      continue;
    }

    const start = getLineBounds(text, bounds.bodyStart + keyRange[0]).start;
    const end = getLineBounds(text, colon).after;

    removals.push({ start, end });
    removedKeys.push(pair.key.value);
  }

  if (removals.length === 0) {
    return unchanged;
  }

  // 从后往前删，前面的偏移量才不会失效
  removals.sort((a, b) => b.start - a.start);
  let result = text;
  for (const removal of removals) {
    result = result.slice(0, removal.start) + result.slice(removal.end);
  }

  if (!isStillValidFrontmatter(result)) {
    return unchanged;
  }

  return { text: result, removedKeys };
}

/**
 * 删除后重新解析一遍 frontmatter，确认它仍然合法（且仍然是映射）。
 *
 * 正常情况下这一步不会失败——删掉的都是没有值、没有子行的键。留着它是因为
 * 这行代码的代价远小于「写坏用户笔记」的代价。
 *
 * 全部键都被删掉时正文为空，解析出的 `contents` 是 null，那是合法结果
 * （`---\n---`），不能当成解析失败。
 */
function isStillValidFrontmatter(text: string): boolean {
  const bounds = getFrontmatterBounds(text);
  if (!bounds) {
    return false;
  }

  const document = parseDocument(text.slice(bounds.bodyStart, bounds.bodyEnd));
  if (document.errors.length > 0) {
    return false;
  }

  return document.contents == null || isMap(document.contents);
}
