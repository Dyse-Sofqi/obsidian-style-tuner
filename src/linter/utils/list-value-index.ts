/**
 * 列表属性候选值的排序规则（纯逻辑，不 import obsidian，单测直接覆盖）。
 *
 * 「最近添加的排前面」——扫描全库时能拿到的只有**文件修改时间**，所以每个候选值
 * 的「新旧」取它出现过的文件里最新的那个 mtime：刚给某篇笔记加过这个值，那篇笔记
 * 的 mtime 就是最新的，这个值自然浮到第一位；再加一个，新的在它上面。这和用户
 * 在属性面板里「上次加过的排第一、上上次的排第二」的预期一致。
 *
 * 副作用：改一篇笔记的其它内容也会抬高它所有列表值的排序。作为没有写入日志时的
 * 近似，这个代价可以接受——真要精确，就得给每个值记一份写入时间并持久化。
 */

export interface ListValueSample {
  /** 出现过的值（已 trim 或交给本模块处理） */
  value: string;
  /** 这个值出现在哪个文件里、那个文件的 mtime（毫秒） */
  mtime: number;
}

/**
 * 汇总 + 排序：按最新出现时间从近到远，同一时间按名称排。
 *
 * 值按**忽略大小写**去重（`Project` 与 `project` 只留一个，保留更近那次的大小写）——
 * 标签与属性值在 Obsidian 里通常大小写不敏感，重复显示两行反而让人以为是两个值。
 */
export function rankListValues(samples: readonly ListValueSample[]): string[] {
  const newest = new Map<string, ListValueSample>();

  for (const sample of samples) {
    const value = typeof sample.value === 'string' ? sample.value.trim() : '';
    if (!value) continue;

    const key = value.toLowerCase();
    const previous = newest.get(key);
    if (!previous || sample.mtime > previous.mtime) {
      newest.set(key, { value, mtime: sample.mtime });
    }
  }

  return [...newest.values()]
    .sort((a, b) => b.mtime - a.mtime || a.value.localeCompare(b.value))
    .map((sample) => sample.value);
}

/**
 * 候选的过滤：排除本行已有的值，再按输入筛选。
 *
 * 单独抽出来是为了能被单测覆盖——「过滤完还剩几个」直接决定弹层要不要出现
 * （一个都不剩就不该弹空壳），这条判断写错就会在界面上留下白色小方块。
 *
 * @param {readonly string[]} values 已排好序的全库候选
 * @param {readonly string[]} existing 本行已有的值
 * @param {string} query 输入框内容；开头的 `#` 会被忽略（`tags` 的习惯）
 * @return {string[]} 可选项，顺序沿用入参
 */
export function filterListValues(
  values: readonly string[],
  existing: readonly string[],
  query: string
): string[] {
  const needle = query.trim().replace(/^#+/, '').toLowerCase();
  const taken = new Set(existing.map((value) => value.toLowerCase()));

  return values
    .filter((value) => !taken.has(value.toLowerCase()))
    .filter((value) => needle === '' || value.toLowerCase().includes(needle));
}
