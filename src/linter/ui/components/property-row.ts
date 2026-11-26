import { Menu, setIcon } from 'obsidian';
import { getTextInLanguage, type LanguageStringKey } from '../../lang/helpers';
import {
  YAML_PROPERTY_TYPE_LABEL_KEY,
  YAML_PROPERTY_TYPES,
  fixedPropertyTypeFor,
  type YamlPropertyType,
} from '../../utils/yaml-attributes';
import {
  formatPropertyValue,
  isBlankValue,
  isDateOnlyFormat,
  parsePropertyInput,
  type PropertyRow,
} from '../../utils/properties-model';
import {
  normalizeTimestampText,
  toNativeDateTimeValue,
  type TimestampKeyInfo,
} from '../../utils/timestamp-format';

/**
 * 侧边栏属性视图里的一行。
 *
 * 交互刻意贴近 Obsidian 原生属性面板：左边是键（点图标换类型），右边是值，
 * 值按类型给不同的控件；行悬停时右侧出现删除按钮。
 *
 * 这个模块只负责「长什么样、点了之后调用谁」，不碰磁盘——写入统一走视图里的
 * `commit()`，保证只有一处实现 `processFrontMatter`。
 */

export interface PropertyRowHandlers {
  /**
   * 值变化；`null` 表示清空，调用方据此把键从 frontmatter 删掉。
   * `immediate` 用于勾选框、日期、列表 pill 这类「一次点击就是一次完整修改」的
   * 控件——不必等防抖，点了就存。
   */
  onValueChange: (key: string, value: unknown, immediate?: boolean) => void;
  /** 删除整行（标准键只会被清空值，文档独有键会被真正删掉） */
  onDelete: (key: string) => void;
  /** 更改属性类型（写 types.json） */
  onTypeChange: (key: string, type: YamlPropertyType) => void;
  /** `tags` 的标签本体被点击：跳去搜索 `tag:xxx`（Obsidian 的默认行为） */
  onTagClick?: (tag: string) => void;
  /** 给 `tags` 的输入框接上候选弹层；`getExisting` 返回当前行已有的标签，用于排除 */
  attachTagSuggest?: (
    input: HTMLInputElement,
    getExisting: () => string[],
    onPick: (tag: string) => void
  ) => void;
}

/**
 * 属性类型 → 图标。
 *
 * 取值来自 Obsidian 自己的属性类型表（app 里那张 `{type, icon, reservedKeys}`
 * 定义），不是随手挑的 lucide 图标：`text` / `list(multitext)` / `number` /
 * `checkbox` / `date` / `datetime` 各自对应一个。
 *
 * 用带 `lucide-` 前缀的完整 id：Obsidian 的图标注册表就是这么存的，短名只是
 * 部分版本才有的别名。
 */
const TYPE_ICON: Record<YamlPropertyType, string> = {
  text: 'lucide-text',
  list: 'lucide-list',
  number: 'lucide-binary',
  checkbox: 'lucide-check-square',
  date: 'lucide-calendar',
  datetime: 'lucide-clock',
};

/**
 * 固定键的专属图标 / 专属类型。
 *
 * Obsidian 给 `aliases`、`tags` 单独定义了属性类型（类型名就叫 aliases / tags，
 * 而不是普通的 multitext），只有 `cssclasses` 仍归到 multitext。所以这三个键的
 * 图标不能按「列表」来画：
 *
 * - `aliases` → `lucide-forward`（指向右边的箭头，表示「别名转发」）
 * - `tags` → `lucide-tags`（标签本标）
 * - `cssclasses` → `lucide-list`（它就是 multitext）
 */
const KEY_ICON: Record<string, string> = {
  aliases: 'lucide-forward',
  tags: 'lucide-tags',
  cssclasses: 'lucide-list',
};

/** 固定键的图标优先，其余按键值类型的默认图标。 */
function iconFor(row: PropertyRow): string {
  return KEY_ICON[row.key.trim().toLowerCase()] ?? TYPE_ICON[row.type];
}

/**
 * 固定键的类型名。
 *
 * Obsidian 的属性类型表里 `aliases` / `tags` 是**独立类型**（就叫 aliases、tags），
 * 菜单里显示的是「别名」「标签」而不是「列表」。这里跟着改，免得同一个键在两处
 * 叫法不一样。
 */
const KEY_TYPE_LABEL: Record<string, LanguageStringKey> = {
  aliases: 'properties-view.type-aliases',
  tags: 'properties-view.type-tags',
};

function typeLabel(row: PropertyRow, type: YamlPropertyType): string {
  if (type === 'list') {
    const override = KEY_TYPE_LABEL[row.key.trim().toLowerCase()];
    if (override) return getTextInLanguage(override);
  }

  return getTextInLanguage(YAML_PROPERTY_TYPE_LABEL_KEY[type]);
}

function applyInputValue(input: HTMLInputElement, row: PropertyRow): void {
  input.value = formatPropertyValue(row.value);
}

/** 值能不能塞进原生日期控件：塞不进就退回文本框，免得把已有内容显示成空白。 */
function fitsDateInput(row: PropertyRow): boolean {
  const text = formatPropertyValue(row.value).trim();
  if (text === '') return true;
  if (row.type === 'date') return /^\d{4}-\d{2}-\d{2}$/.test(text);
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text);
}

function buildTextInput(row: PropertyRow, handlers: PropertyRowHandlers): HTMLInputElement {
  const input = document.createElement('input');
  input.className = 'style-tuner-property-input';
  input.type = 'text';
  input.spellcheck = false;
  if (row.type === 'number') input.inputMode = 'numeric';
  applyInputValue(input, row);
  input.placeholder =
    row.type === 'date'
      ? 'YYYY-MM-DD'
      : row.type === 'datetime'
        ? 'YYYY-MM-DDTHH:mm'
        : getTextInLanguage('properties-view.pending');

  input.addEventListener('input', () => {
    // 解析交给模型（`42` → 42、清空 → null、日期 → 原样字符串）
    handlers.onValueChange(row.key, parsePropertyInput(input.value, row.type));
  });

  return input;
}

function buildDateInput(row: PropertyRow, handlers: PropertyRowHandlers): HTMLElement {
  // 值不是 ISO 形式（例如惰性写的 `20261125185900`）时用文本框：原生日期控件的
  // value 只认 ISO，硬塞会静默变空，等于把用户已有的值藏起来
  if (!fitsDateInput(row)) {
    const fallback = buildTextInput(row, handlers);
    fallback.classList.add('style-tuner-property-input-date');
    return fallback;
  }

  const input = document.createElement('input');
  input.className = 'style-tuner-property-input style-tuner-property-input-date';
  input.type = row.type === 'date' ? 'date' : 'datetime-local';
  applyInputValue(input, row);
  input.addEventListener('change', () => {
    handlers.onValueChange(row.key, input.value === '' ? null : input.value, true);
  });

  return input;
}

function buildCheckbox(row: PropertyRow, handlers: PropertyRowHandlers): HTMLElement {
  const wrap = document.createElement('label');
  wrap.className = 'style-tuner-property-checkbox';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = row.value === true || row.value === 'true';
  input.addEventListener('change', () => {
    handlers.onValueChange(row.key, input.checked, true);
  });

  wrap.appendChild(input);
  return wrap;
}

/**
 * 一枚列表值。
 *
 * `onActivate` 用于 `tags`：Obsidian 里点标签本体是跳去搜索，不是编辑。
 * 视觉上不额外加下划线——悬停时胶囊底色变深已经够提示，光标保持默认箭头。
 * `×` 仍然是删除。
 */
function pill(text: string, onRemove: () => void, onActivate?: () => void): HTMLElement {
  const el = document.createElement('span');
  el.className = 'style-tuner-property-pill';

  const label = document.createElement('span');
  label.className = 'style-tuner-property-pill-label';
  label.textContent = text;
  if (onActivate) {
    label.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      onActivate();
    });
  }
  el.appendChild(label);

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'style-tuner-property-pill-remove';
  remove.setAttribute('aria-label', getTextInLanguage('properties-view.pill-remove'));
  // 和核心属性面板一致：删除用图标（lucide-x），尺寸跟 --icon-xs 走，而不是一个字号很小的字符
  setIcon(remove, 'lucide-x');
  remove.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onRemove();
  });
  el.appendChild(remove);

  return el;
}

function buildListEditor(row: PropertyRow, handlers: PropertyRowHandlers): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'style-tuner-property-list';

  const pillsEl = document.createElement('div');
  pillsEl.className = 'style-tuner-property-pills';
  wrap.appendChild(pillsEl);

  const input = document.createElement('input');
  input.className = 'style-tuner-property-pill-input';
  input.type = 'text';
  input.spellcheck = false;
  wrap.appendChild(input);

  // 列表值也可能是标量（`tags: a, b`）：照样拆成 pill 显示，否则这一行会
  // 看起来是空的，等于把已有内容藏起来。写回时统一变成真正的 YAML 数组。
  let items: string[] = Array.isArray(row.value)
    ? row.value.map((item) => String(item))
    : row.value === null || row.value === undefined || row.value === ''
      ? []
      : String(row.value)
          .split(/[,\n]/)
          .map((item) => item.trim())
          .filter((item) => item !== '');

  const isTagList = row.key.trim().toLowerCase() === 'tags';
  // 用退格选中的那一枚（-1 表示没有选中），对应原生多值属性的行为
  let selectedIndex = -1;

  const commit = () => {
    handlers.onValueChange(row.key, items.length > 0 ? [...items] : null, true);
  };

  const clearSelection = () => {
    if (selectedIndex === -1) return;
    selectedIndex = -1;
    for (const el of Array.from(pillsEl.children)) el.classList.remove('is-selected');
  };

  const paint = () => {
    pillsEl.empty();

    const nodes = items.map((item, index) => {
      return pill(
        item,
        () => {
          items = items.filter((_, i) => i !== index);
          selectedIndex = -1;
          paint();
          commit();
        },
        // 只有 tags 的标签本体是「跳去搜索」
        isTagList && handlers.onTagClick ? () => handlers.onTagClick(item) : undefined
      );
    });

    nodes.forEach((el, index) => {
      if (index === selectedIndex) el.classList.add('is-selected');
      pillsEl.appendChild(el);
    });

    pillsEl.toggleClass('is-empty', items.length === 0);
    // 已经有条目的行，尾部那一格只是「继续追加」的输入位，不必再挂着「添加」字样
    input.placeholder =
      items.length === 0 ? getTextInLanguage('properties-view.list-add') : '';
  };

  // 失焦提交的待定定时器：点候选项时会把它取消，否则「半截输入 + 选中项」会被加两次
  let blurCommitTimer: number | null = null;
  const cancelBlurCommit = () => {
    if (blurCommitTimer === null) return;
    window.clearTimeout(blurCommitTimer);
    blurCommitTimer = null;
  };

  const addItem = (raw: string) => {
    cancelBlurCommit();

    const value = raw.trim();
    if (!value) return;

    items = [...items, value];
    input.value = '';
    selectedIndex = -1;
    paint();
    commit();
  };

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addItem(input.value);
      return;
    }

    // 复刻原生多值属性：输入框为空时按退格先选中最后一枚，再按一次才删掉
    if (event.key === 'Backspace' && input.value === '') {
      if (selectedIndex >= 0 && selectedIndex < items.length) {
        event.preventDefault();
        items = items.filter((_, i) => i !== selectedIndex);
        selectedIndex = items.length > 0 ? Math.min(selectedIndex, items.length - 1) : -1;
        paint();
        commit();
        return;
      }

      if (items.length > 0) {
        event.preventDefault();
        selectedIndex = items.length - 1;
        paint();
        return;
      }
    }

    if (event.key !== 'Backspace') clearSelection();
  });

  input.addEventListener('input', () => clearSelection());

  // 失焦时把输入框里没回车确认的内容也收下（延后一拍，点候选时可以取消）
  input.addEventListener('blur', () => {
    clearSelection();

    const value = input.value.trim();
    if (!value) return;

    cancelBlurCommit();
    blurCommitTimer = window.setTimeout(() => {
      blurCommitTimer = null;
      addItem(value);
    }, 150);
  });

  // tags 的候选：点进输入框就能看到全库已有标签，键入时按输入过滤
  if (isTagList && handlers.attachTagSuggest) {
    handlers.attachTagSuggest(input, () => items, (tag) => addItem(tag));
  }

  paint();
  return wrap;
}

/**
 * 时间戳属性（`created` / `modified`）。
 *
 * 直接把 Obsidian 用的那个原生日期控件当值用，不额外加图标、也不做「显示态 / 编辑态」
 * 切换——看到的和点下去的永远是同一个控件，不存在显示与交互不一致的问题。
 *
 * 需要转换的只有值本身：文档里存的是「YAML 时间戳」规则配置的格式
 * （`20260716190551`），而原生控件的 `value` 只认 ISO，所以显示前转 ISO、
 * 改完再转回配置格式落盘。**显示走原生，存储走配置。**
 */
function buildTimestampInput(
  row: PropertyRow,
  handlers: PropertyRowHandlers,
  info: TimestampKeyInfo
): HTMLElement {
  const nativeValue = toNativeDateTimeValue(row.value, info);
  const hasStoredValue =
    row.value !== null && row.value !== undefined && String(row.value).trim() !== '';

  // 值解析不了（被手改坏了）：退回文本框直接编辑原文，否则原生控件会显示成空白
  if (hasStoredValue && nativeValue === '') {
    return buildTextInput(row, handlers);
  }

  const input = document.createElement('input');
  input.className = 'style-tuner-property-input style-tuner-property-input-date';
  input.type = isDateOnlyFormat(info.format) ? 'date' : 'datetime-local';
  input.value = nativeValue;

  input.addEventListener('change', () => {
    if (input.value === '') {
      handlers.onValueChange(row.key, null, true);
      return;
    }

    const storage = normalizeTimestampText(input.value, info);
    handlers.onValueChange(row.key, storage ?? input.value, true);
  });

  return input;
}

function buildReadOnlyValue(row: PropertyRow): HTMLElement {
  const el = document.createElement('div');
  el.className = 'style-tuner-property-value-readonly';
  el.textContent = formatPropertyValue(row.value);
  el.title = el.textContent;
  return el;
}

/**
 * 类型菜单，复刻核心「属性」插件的类型下拉：每项带类型图标，按当前语言的名字排序。
 *
 * 图标与行首那个是同一套映射（`TYPE_ICON`），所以菜单里看到的图标和选完之后行上
 * 显示的图标不会打架。
 */
function openTypeMenu(event: MouseEvent, row: PropertyRow, handlers: PropertyRowHandlers): void {
  const fixedType = fixedPropertyTypeFor(row.key);
  const menu = new Menu();

  // 顺序按类型标识排（checkbox / date / datetime / list / number / text），
  // 这个排列与核心插件的下拉完全一致；按中文名排会得到另一套顺序
  const types = [...YAML_PROPERTY_TYPES].sort();

  for (const type of types) {
    menu.addItem((item) => {
      item
        .setTitle(typeLabel(row, type))
        .setIcon(TYPE_ICON[type])
        .setChecked(row.type === type)
        .setDisabled(!!fixedType && fixedType !== type)
        .onClick(() => {
          if (type === row.type) return;
          handlers.onTypeChange(row.key, type);
        });
    });
  }

  menu.showAtMouseEvent(event);
}

export function createPropertyRow(
  row: PropertyRow,
  handlers: PropertyRowHandlers,
  timestamp?: TimestampKeyInfo
): HTMLElement {
  const rowEl = document.createElement('div');
  rowEl.className = 'style-tuner-property';
  rowEl.dataset.key = row.key;
  if (row.configured) rowEl.addClass('is-standard');
  if (!row.present) rowEl.addClass('is-pending');
  // 真正有值的行：键名用正文色，和空值 / 未登记的行拉开对比
  if (!isBlankValue(row.value)) rowEl.addClass('is-filled');

  const keyEl = document.createElement('div');
  keyEl.className = 'style-tuner-property-key';

  const iconEl = document.createElement('button');
  iconEl.type = 'button';
  iconEl.className = 'style-tuner-property-icon';
  iconEl.title = getTextInLanguage('properties-view.change-type');
  setIcon(iconEl, iconFor(row));
  iconEl.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    openTypeMenu(event, row, handlers);
  });
  keyEl.appendChild(iconEl);

  const nameEl = document.createElement('span');
  nameEl.className = 'style-tuner-property-name';
  nameEl.textContent = row.key;
  keyEl.appendChild(nameEl);

  rowEl.appendChild(keyEl);

  const valueEl = document.createElement('div');
  valueEl.className = 'style-tuner-property-value';

  if (row.readOnly) {
    valueEl.appendChild(buildReadOnlyValue(row));
  } else if (timestamp && (row.type === 'date' || row.type === 'datetime')) {
    // 时间戳键：值不是 ISO，走按格式编辑的文本框 + 日历按钮
    valueEl.appendChild(buildTimestampInput(row, handlers, timestamp));
  } else if (row.type === 'list') {
    valueEl.appendChild(buildListEditor(row, handlers));
  } else if (row.type === 'checkbox') {
    valueEl.appendChild(buildCheckbox(row, handlers));
  } else if (row.type === 'date' || row.type === 'datetime') {
    valueEl.appendChild(buildDateInput(row, handlers));
  } else {
    valueEl.appendChild(buildTextInput(row, handlers));
  }

  rowEl.appendChild(valueEl);

  const removeEl = document.createElement('button');
  removeEl.type = 'button';
  removeEl.className = 'style-tuner-property-remove';
  removeEl.title = getTextInLanguage('properties-view.remove');
  removeEl.setAttribute('aria-label', getTextInLanguage('properties-view.remove'));
  setIcon(removeEl, 'x');
  removeEl.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    handlers.onDelete(row.key);
  });
  rowEl.appendChild(removeEl);

  return rowEl;
}
