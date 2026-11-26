import { AbstractInputSuggest, App } from 'obsidian';
import { filterListValues } from '../../utils/list-value-index';

/**
 * 列表型属性输入框的候选弹层。
 *
 * 用 Obsidian 自己的 `AbstractInputSuggest`：弹层样式、↑↓ 选择、Enter 确认、Esc
 * 关闭都由它提供。候选项 = **全库其它笔记在该属性下已有的值**，顺序由调用方给
 * （`ListValueIndex` 已按最近添加排好），这里只做「排除本行已有值」和按输入过滤。
 *
 * 不在这里排序：排序是业务规则（最近添加优先），放在 `list-value-index.ts` 里
 * 单测覆盖；这里一排序就会把那个顺序打乱。
 *
 * ## 白色小圆点的来源与修复
 *
 * `AbstractInputSuggest` 把弹层的「开」交给内部多条路径：input 输入、聚焦、
 * **点击已聚焦的输入框**都会调 `open()`。其中 input 路径在候选为空时会自己
 * `close()`，但聚焦 / 点击路径不检查，直接 `open()` 挂一个空容器 —— 弹层没条目、
 * 又没文字，看起来就是光标下方一个白色小圆点。
 *
 * 所以不能只在自己的 click 监听里补事件（拦不住它内部那条路径），要在**所有
 * open 路径的汇聚点** `open()` 上统一拦截：没有候选项就一个都不挂。这是唯一
 * 可靠的做法，也不需要去碰 `emptyStateText` 这类未在公开类型里的内部字段。
 */
export class ListValueSuggest extends AbstractInputSuggest<string> {
  constructor(
    app: App,
    input: HTMLInputElement,
    /** 全库候选值，已排好序 */
    private readonly getValues: () => string[],
    /** 当前行已有的值，候选里要排除掉 */
    private readonly getExisting: () => string[],
    private readonly onPick: (value: string) => void,
    /** 候选项的显示文本；`tags` 要加回 `#` 前缀，其余原样 */
    private readonly renderValue: (value: string) => string = (value) => value
  ) {
    super(app, input);
  }

  /**
   * 覆盖所有 open 路径（输入 / 聚焦 / 点击）。没有候选项就不弹；已经弹着则收起。
   *
   * 这里按 `getValue()` 现算一次，而不是信任 `getSuggestions()` 的返回值：
   * 内部是把 `setSuggestions(...)` 和 `open()` 分开调用的，点击路径可能先 open
   * 再算候选，靠它自己的状态判断不可靠。
   */
  open(): void {
    if (this.collect(this.getValue()).length === 0) {
      super.close();
      return;
    }
    super.open();
  }

  protected getSuggestions(query: string): string[] {
    return this.collect(query);
  }

  renderSuggestion(value: string, el: HTMLElement): void {
    el.setText(this.renderValue(value));
  }

  selectSuggestion(value: string): void {
    this.onPick(value);
    this.setValue('');
    this.close();
  }

  private collect(query: string): string[] {
    return filterListValues(this.getValues(), this.getExisting(), query).slice(0, 100);
  }
}
