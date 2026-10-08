import { App, ToggleComponent } from 'obsidian';
import type { SettingDefinition, SettingDefinitionItem, SettingDefinitionList, SettingDefinitionPage } from 'obsidian';
import { getTextInLanguage, LanguageStringKey } from './lang/helpers';
import LinterPlugin from './main';
import { richDescription } from './ui/helpers';
import { LinterSettings } from './settings-data';
import { ListItemsModal, ListItemValidation, YamlAttributeModal } from './ui/modals/add-list-entry-modals'
import { LinterSettingsKeys } from './settings-data';
import { assignPropertyType } from './utils/property-types';
import {
  inheritYamlKeys,
  isReservedPropertyKey,
  normalizeYamlAttributeEntries,
  renderYamlAttributeLine,
  YAML_PROPERTY_TYPE_FIXED_SUFFIX_KEY,
  YAML_PROPERTY_TYPE_LABEL_KEY,
  type YamlAttributeEntry,
} from './utils/yaml-attributes';

/** Class representing an option of a rule */

export abstract class Option {
  public ruleAlias: string;

  /**
   * Create an option
   * @param {LanguageStringKey} nameKey - The name key of the option
   * @param {LanguageStringKey} descriptionKey - The description key of the option
   * @param {any} defaultValue - The default value of the option
   * @param {string?} ruleAlias - The alias of the rule this option belongs to
   */
  constructor(public configKey: string, public nameKey: LanguageStringKey, public descriptionKey: LanguageStringKey, public defaultValue: unknown, ruleAlias?: string | null) {
    if (ruleAlias) {
      this.ruleAlias = ruleAlias;
    }
  }

  public getName(): string {
    return getTextInLanguage(this.nameKey) ?? '';
  }

  public getDescription(): string {
    return getTextInLanguage(this.descriptionKey) ?? '';
  }

  public abstract getSettingDefinition(plugin: LinterPlugin, update: () => void): SettingDefinitionItem;

  protected setOption(value: unknown, settings: LinterSettings): void {
    // Same guard as writeAndSave: a rule entry can be missing when the saved
    // settings predate the rule, and writing through it must not throw.
    settings.ruleConfigs[this.ruleAlias] ??= {};
    settings.ruleConfigs[this.ruleAlias][this.configKey] = value;
  }

  // Dot-path into ruleConfigs for the declarative control binding. Resolved by
  // SettingTab's getControlValue/setControlValue. Aliases and configKeys are
  // slug-shaped (no dots), so splitting on '.' is safe.
  protected controlKey(): string {
    return `ruleConfigs.${this.ruleAlias}.${this.configKey}`;
  }

  protected getCurrentValue(plugin: LinterPlugin): unknown {
    return plugin.settings.ruleConfigs[this.ruleAlias]?.[this.configKey] ?? this.defaultValue;
  }

  protected async writeAndSave(value: unknown, plugin: LinterPlugin): Promise<void> {
    plugin.settings.ruleConfigs[this.ruleAlias] ??= {};
    plugin.settings.ruleConfigs[this.ruleAlias][this.configKey] = value;
    await plugin.saveSettings();
  }
}

export class BooleanOption extends Option {
  public defaultValue: boolean;
  private toggleComponent: ToggleComponent | null = null;

  constructor(configKey: string, nameKey: LanguageStringKey, descriptionKey: LanguageStringKey, defaultValue: unknown, ruleAlias?: string | null, public onChange?: (value: boolean, app: App, plugin: LinterPlugin) => void) {
    super(configKey, nameKey, descriptionKey, defaultValue, ruleAlias);
  }

  public getSettingDefinition(plugin: LinterPlugin, _update: () => void): SettingDefinitionItem {
    // An onChange side effect can't be expressed through a control binding, so
    // those (rare) options stay render-based.
    if (this.onChange) {
      return {
        name: this.getName(),
        desc: richDescription(this.getDescription()),
        render: (setting) => {
          setting.addToggle((toggle) => {
            this.toggleComponent = toggle;
            toggle
              .setValue(this.getCurrentValue(plugin) as boolean)
              .onChange(async (value) => {
                await this.writeAndSave(value, plugin);
                this.onChange?.(value, plugin.app, plugin);
              })
          });
        },
      };
    }

    return {
      name: this.getName(),
      desc: richDescription(this.getDescription()),
      control: { type: 'toggle', key: this.controlKey(), defaultValue: this.defaultValue },
    };
  }

  getValue(plugin: LinterPlugin): boolean {
    if (this.toggleComponent != null) {
      return this.toggleComponent.getValue();
    }

    return this.getCurrentValue(plugin) as boolean;
  }

  async setValue(value: boolean, plugin: LinterPlugin) {
    if (this.toggleComponent != null) {
      this.toggleComponent.setValue(value);
    }

    await this.writeAndSave(value, plugin);
  }
}

export class TextOption extends Option {
  public defaultValue: string;

  public getSettingDefinition(_plugin: LinterPlugin, _update: () => void): SettingDefinitionItem {
    return {
      name: this.getName(),
      desc: richDescription(this.getDescription()),
      control: { type: 'text', key: this.controlKey(), defaultValue: this.defaultValue ?? '' },
    };
  }
}

/**
 * 列表卡片底部的额外动作按钮（渲染在「添加」的 + 按钮左侧）。
 *
 * 与「添加」不同，这类动作不新增条目，而是对整份列表做一次操作——目前用于
 * 「YAML 键排序」从「要插入的键」继承顺序。用带文字的按钮而不是图标按钮：
 * 它是整份列表级别的操作，比行内的编辑 / 删除更值得被看见。
 */
export interface ListExtraAction {
  label: string;
  tooltip: string;
  action: () => void | Promise<void>;
}

/**
 * 列表「继承」动作：把别处的一份键清单并进本列表，之后继续在本列表上编辑。
 *
 * 之所以做成一次性导入而不是「来源」模式：模式是互斥的——选了跟随就不能改，
 * 想改就得把键重输一遍。导入则把源当成起点，列表始终是唯一可编辑的基准。
 */
export interface ListItemInheritAction {
  /** 按钮文字 */
  labelKey: LanguageStringKey;
  /** 按钮提示，文案里应说明是**并入**而不是覆盖 */
  tooltipKey: LanguageStringKey;
  /** 取源键清单；返回空数组时不动本列表 */
  getKeys: (plugin: LinterPlugin) => string[];
}

export class ListItemOption extends Option {
  public defaultValue: string[];

  constructor(configKey: string, nameKey: LanguageStringKey, descriptionKey: LanguageStringKey, defaultValue: unknown, ruleAlias: string | null, private validator: ListItemValidation | undefined, private emptyStateKey: LanguageStringKey, private fieldPlaceholderKey: LanguageStringKey, private allowReorder: boolean, private trimItemWhitespace: boolean, private inheritAction?: ListItemInheritAction) {
    super(configKey, nameKey, descriptionKey, defaultValue, ruleAlias);
  }

  protected async writeValue(value: unknown, plugin: LinterPlugin): Promise<void> {
    plugin.settings.ruleConfigs[this.ruleAlias] ??= {};
    plugin.settings.ruleConfigs[this.ruleAlias][this.configKey] = value;
  }

  /**
   * 「继承」按钮：把源清单**并入**本列表（就地改，保住数组引用）。
   *
   * 源键按源顺序排前面、本列表多出来的键跟在后面，所以不会冲掉用户自己加的键；
   * 已经一致时逐项相同，直接返回不写盘——点第二次不会有事。
   */
  private buildExtraActions(plugin: LinterPlugin, values: string[], update: () => void): ListExtraAction[] {
    if (!this.inheritAction) return [];

    return [{
      label: getTextInLanguage(this.inheritAction.labelKey),
      tooltip: getTextInLanguage(this.inheritAction.tooltipKey),
      action: async () => {
        const keys = this.inheritAction.getKeys(plugin);
        if (keys.length === 0) return;

        const merged = inheritYamlKeys(values, keys);
        const unchanged = merged.length === values.length
          && merged.every((key, index) => key === values[index]);
        if (unchanged) return;

        values.splice(0, values.length, ...merged);
        await this.writeAndSave(values, plugin);
        update();
      },
    }];
  }

  public getSettingDefinition(plugin: LinterPlugin, update: () => void): SettingDefinitionItem {
    const values = this.getCurrentValue(plugin) as string[] | undefined ?? [];

    return createListManagementPage({
      name: this.getName(),
      desc: richDescription(this.getDescription()),
      addButtonText: getTextInLanguage('add-tooltip'),
      emptyState: getTextInLanguage(this.emptyStateKey),
      values: values,
      allowReorder: this.allowReorder,
      extraActions: this.buildExtraActions(plugin, values, update),
      openAddForm: () => new ListItemsModal(plugin.app, null, this.fieldPlaceholderKey, this.trimItemWhitespace, async (entry) => {
        values.push(entry);
        await this.writeAndSave(values, plugin);
        update();
      },
        this.validator).open(),
      openEditForm: (entry, index) => new ListItemsModal(plugin.app, entry, this.fieldPlaceholderKey, this.trimItemWhitespace, async (updated) => {
        values[index] = updated;
        await this.writeAndSave(values, plugin);
        update();
      },
        this.validator).open(),
      editTooltip: getTextInLanguage('edit-tooltip'),
      onDelete: (index) => {
        values.splice(index, 1);
        this.writeValue(values, plugin);
      },
      itemName: (entry) => entry, // we may want to add a default place holder here if we start allowing empty entries
      plugin: plugin,
    });
  }
}

/**
 * 「插入 YAML 属性」的条目列表：`{键名, 属性类型, 默认值}`。
 *
 * 与 `ListItemOption`（纯字符串列表）分开，因为这条规则的值不只是文本：
 * 插入时要按类型生成合法 YAML，编辑时还要把类型登记进 Obsidian 的
 * `<configDir>/types.json`（见 `assignPropertyType`）。
 */
export class YamlAttributeOption extends Option {
  public defaultValue: YamlAttributeEntry[];
  private emptyStateKey: LanguageStringKey;

  constructor(configKey: string, nameKey: LanguageStringKey, descriptionKey: LanguageStringKey, defaultValue: unknown, ruleAlias?: string | null, emptyStateKey?: LanguageStringKey) {
    super(configKey, nameKey, descriptionKey, defaultValue, ruleAlias);
    this.emptyStateKey = emptyStateKey;
  }

  protected async writeValue(value: unknown, plugin: LinterPlugin): Promise<void> {
    plugin.settings.ruleConfigs[this.ruleAlias] ??= {};
    plugin.settings.ruleConfigs[this.ruleAlias][this.configKey] = value;
  }

  public getSettingDefinition(plugin: LinterPlugin, update: () => void): SettingDefinitionItem {
    // 规整后必须是 settings 里那份数组本身：增删与拖拽排序都是就地改，
    // 只有引用相同才落得进磁盘（见 normalizeYamlAttributeEntries 的说明）。
    const values = normalizeYamlAttributeEntries(this.getCurrentValue(plugin));

    return createListManagementPage<YamlAttributeEntry>({
      name: this.getName(),
      desc: richDescription(this.getDescription()),
      addButtonText: getTextInLanguage('add-tooltip'),
      emptyState: getTextInLanguage(this.emptyStateKey),
      values: values,
      openAddForm: () => new YamlAttributeModal(plugin.app, null, async (entry) => {
        values.push(entry);
        await this.writeAndSave(values, plugin);
        await assignPropertyType(plugin.app, entry.key, entry.type);
        update();
      }).open(),
      openEditForm: (entry, index) => new YamlAttributeModal(plugin.app, entry, async (updated) => {
        values[index] = updated;
        await this.writeAndSave(values, plugin);
        await assignPropertyType(plugin.app, updated.key, updated.type);
        update();
      }).open(),
      editTooltip: getTextInLanguage('edit-tooltip'),
      onDelete: (index) => {
        values.splice(index, 1);
      },
      itemName: (entry) => entry.key,
      itemDesc: (entry) => this.describeEntry(entry),
      plugin: plugin,
    });
  }

  /** 行内说明：`类型 · 值`；值留空时显示该类型会插入的骨架。保留键在类型后加「Obsidian 固定」。 */
  private describeEntry(entry: YamlAttributeEntry): string {
    const label =
      getTextInLanguage(YAML_PROPERTY_TYPE_LABEL_KEY[entry.type]) +
      (isReservedPropertyKey(entry.key)
        ? getTextInLanguage(YAML_PROPERTY_TYPE_FIXED_SUFFIX_KEY)
        : '');
    const value = entry.value.trim();
    const preview = value !== ''
      ? value
      : renderYamlAttributeLine({ ...entry, value: '' }).replace(/\n\s*/g, ' ');
    return `${label} · ${preview}`;
  }
}

export class MomentFormatOption extends Option {
  public defaultValue: boolean;

  public getSettingDefinition(plugin: LinterPlugin, _update: () => void): SettingDefinitionItem {
    return {
      name: this.getName(),
      desc: richDescription(this.getDescription()),
      render: (setting) => {
        setting.addMomentFormat((format) => format
          .setPlaceholder('dddd, MMMM Do YYYY, h:mm:ss a')
          .setValue((this.getCurrentValue(plugin) as string | undefined) ?? '')
          .onChange(async (value) => {
            await this.writeAndSave(value, plugin);
          }));
      },
    };
  }
}

export class DropdownRecord {
  public value: LanguageStringKey;
  public description: string;

  constructor(value: LanguageStringKey, description: string) {
    this.value = value;
    this.description = description;
  }

  getDisplayValue(): string {
    return getTextInLanguage(this.value) ?? '';
  }
}

export class DropdownOption extends Option {
  public defaultValue: string;
  public options: DropdownRecord[];

  constructor(configKey: string, nameKey: LanguageStringKey, descriptionKey: LanguageStringKey, defaultValue: string, options: DropdownRecord[], ruleAlias?: string | null) {
    super(configKey, nameKey, descriptionKey, defaultValue, ruleAlias);
    this.options = options;
  }

  public getSettingDefinition(_plugin: LinterPlugin, _update: () => void): SettingDefinitionItem {
    const options: Record<string, string> = {};
    for (const option of this.options) {
      options[option.value.replace('enums.', '')] = option.getDisplayValue();
    }
    return {
      name: this.getName(),
      desc: richDescription(this.getDescription()),
      control: { type: 'dropdown', key: this.controlKey(), defaultValue: this.defaultValue, options },
    };
  }
}

export function createListManagementPage<T>(opts: {
  name: string;
  desc: string | DocumentFragment;
  addButtonText: string;
  emptyState: string;
  values: T[];
  openAddForm: () => void;
  onDelete: (index: number) => unknown;
  itemName: (entry: T) => string;
  itemDesc?: (entry: T) => string | undefined;
  itemIsDisabled?: (entry: T) => boolean;
  allowReorder?: boolean | undefined;
  openEditForm?: (entry: T, index: number) => void;
  editTooltip?: string;
  /** 列表底部「添加」旁边的额外动作按钮。 */
  extraActions?: ListExtraAction[];
  plugin: LinterPlugin;
}): SettingDefinitionPage<LinterSettingsKeys> {
  // extraActions 是本插件渲染器认的附加字段，不在 Obsidian 的
  // SettingDefinitionList 类型里，故收窄后挂上去。
  const list: SettingDefinitionList<LinterSettingsKeys> & {
    extraActions?: ListExtraAction[];
  } = {
    type: 'list',
    emptyState: opts.emptyState,
    addItem: {
      name: opts.addButtonText,
      action: opts.openAddForm,
    },
    extraActions: opts.extraActions,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- I don't have control over this, so we may as well ignore the promise mismatch
    onDelete: async (index: number) => {
      opts.onDelete(index);
      await opts.plugin.saveSettings();
      opts.plugin.settingsTab.update();
    },
    // 列表条目默认支持拖拽排序（allowReorder 显式传 false 时才关闭），
    // 与 ListItemOptionBuilder 的默认值保持一致。
    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- I don't have control over this, so we may as well ignore the promise mismatch
    onReorder: opts.allowReorder === false ? undefined : async (oldIndex: number, newIndex: number) => {
      const [moved] = opts.values.splice(oldIndex, 1);
      opts.values.splice(newIndex, 0, moved);
      await opts.plugin.saveSettings();
    },
    items: opts.values.map((entry): SettingDefinition<LinterSettingsKeys> => {
      const base = {
        name: opts.itemName(entry),
        desc: opts.itemDesc?.(entry),
        searchable: false,
      } as const;
      if (!opts.openEditForm) return base;
      return {
        ...base,
        render: (setting) => {
          setting.setName(base.name);
          if (base.desc !== undefined) setting.setDesc(base.desc);
          if (opts.itemIsDisabled && opts.itemIsDisabled(entry)) {
            setting.nameEl.addClass('style-tuner-linter-disabled-list-entry');
            setting.descEl.addClass('style-tuner-linter-disabled-list-entry');
          }
          setting.addExtraButton((cb) => cb
            .setIcon('lucide-pencil')
            .setTooltip(opts.editTooltip ?? 'Edit')
            // Resolve the live index at click time — a captured map index
            // goes stale after a reorder or delete.
            .onClick(() => opts.openEditForm(entry, opts.values.indexOf(entry))));
        },
      };
    }),
  };

  return {
    type: 'page',
    name: opts.name,
    desc: opts.desc,
    items: [list],
  };
}
