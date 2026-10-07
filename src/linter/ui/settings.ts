import {App, Plugin, PluginSettingTab} from 'obsidian';
import type {SettingDefinition, SettingDefinitionGroup, SettingDefinitionItem, SettingDefinitionList, SettingDefinitionPage, SettingGroupItem} from 'obsidian';
import log from 'loglevel';
import LinterPlugin from '../main';
import {Rule, RuleType, ruleTypeToRules} from '../rules';
import {richDescription} from './helpers';
import {getTextInLanguage, LanguageStringKey} from '../lang/helpers';
import {LinterSettingsKeys} from '../settings-data';
import {NormalArrayFormats, SpecialArrayFormats, TagSpecificArrayFormats} from '../utils/yaml';
import {logsFromLastRun, setLogLevel} from '../utils/logger';
import {getPath, setPath} from '../utils/nested-keyof';
import {AddFileExtensionModal, AddFileToIgnoreModal, AddFolderToIgnoreModal, CustomRegexModal} from './modals/add-list-entry-modals';
import { createListManagementPage } from '../option';

const tabNameKeys: Record<RuleType | 'Custom' | 'Debug', LanguageStringKey> = {
  [RuleType.YAML]: 'tabs.names.yaml',
  [RuleType.HEADING]: 'tabs.names.heading',
  [RuleType.FOOTNOTE]: 'tabs.names.footnote',
  [RuleType.CONTENT]: 'tabs.names.content',
  [RuleType.SPACING]: 'tabs.names.spacing',
  [RuleType.PASTE]: 'tabs.names.paste',
  Custom: 'tabs.names.custom',
  Debug: 'tabs.names.debug',
};

const logLevels = Object.keys(log.levels);

export class SettingTab extends PluginSettingTab {
  // 格式化设置（「规则」之前的部分）由 Style Tuner 面板的「格式化」标签页
  // 渲染；定义变化（列表增删等）通过这些监听者通知面板重渲染。
  private formatChangeListeners = new Set<() => void>();

  constructor(app: App, public plugin: LinterPlugin) {
    super(app, plugin as unknown as Plugin);
  }

  /** 订阅定义变化；返回解绑函数。 */
  onFormatChange(listener: () => void): () => void {
    this.formatChangeListeners.add(listener);
    return () => {
      this.formatChangeListeners.delete(listener);
    };
  }

  update(): void {
    // 本设置页已由 Style Tuner 面板的各标签页承接，不再注册到 Obsidian
    // 设置弹窗（基类 update 会访问未挂载的弹窗引用），这里只负责把定义
    // 变化通知给面板。快照遍历：监听者在响应中可能解绑并重新注册，而
    // JS Set 的 for-of 会访问遍历期间新增的元素——直接遍历会造成无限循环。
    for (const listener of [...this.formatChangeListeners]) {
      listener();
    }
  }

  refreshDomState(): void {
    // 同 update()：可见性联动（如「格式化后显示消息」跟随保存开关）
    // 的重渲染交给面板监听者，而不是基类面向 Obsidian 渲染 DOM 的实现。
    for (const listener of [...this.formatChangeListeners]) {
      listener();
    }
  }

  getControlValue(key: string): unknown {
    return getPath(this.plugin.settings, key);
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    setPath(this.plugin.settings, key, value);
    await this.plugin.saveSettings();
  }

  /**
   * 「格式化」标签页：常规开关、YAML 通用样式、忽略文件夹 / 忽略文件 /
   * 额外文件扩展名三张独立列表卡片，以及从独立 Debug 页合并进来的调试设置。
   */
  getFormatDefinitions(): SettingDefinitionItem<LinterSettingsKeys>[] {
    return [
      ...this.generalDefinitions(),
      this.commonStylesGroup(),
      this.pageAsCard(this.foldersToIgnorePage()),
      this.pageAsCard(this.filesToIgnorePage()),
      this.pageAsCard(this.additionalFileExtensionsPage()),
      {
        type: 'group',
        heading: getTextInLanguage(tabNameKeys.Debug),
        items: this.debugItems(),
      },
    ];
  }

  /**
   * 单个规则分类的设置项（该分类全部规则合并成的单张卡片）。
   * 由 Style Tuner 面板的「YAML规范」「空行规范」标签页展示；
   * 粘贴类已并入「内容规范」标签页（getContentRulesDefinitions）。
   */
  getRuleCategoryDefinitions(ruleType: RuleType): SettingDefinitionItem<LinterSettingsKeys>[] {
    return [
      {
        type: 'group',
        items: this.ruleCategoryItems(ruleType),
      },
    ];
  }

  /**
   * 「内容规范」标签页：内容、标题、脚注、粘贴四个分组，各自带标题与卡片。
   */
  getContentRulesDefinitions(): SettingDefinitionItem<LinterSettingsKeys>[] {
    return [
      {
        type: 'group',
        heading: getTextInLanguage(tabNameKeys.Content),
        items: this.ruleCategoryItems(RuleType.CONTENT),
      },
      {
        type: 'group',
        heading: getTextInLanguage(tabNameKeys.Heading),
        items: this.ruleCategoryItems(RuleType.HEADING),
      },
      {
        type: 'group',
        heading: getTextInLanguage(tabNameKeys.Footnote),
        items: this.ruleCategoryItems(RuleType.FOOTNOTE),
      },
      {
        type: 'group',
        heading: getTextInLanguage(tabNameKeys.Paste),
        items: this.ruleCategoryItems(RuleType.PASTE),
      },
    ];
  }

  /**
   * 把列表管理 page 的首个 list 定义提升为独立卡片（附加 heading/desc）。
   * SettingDefinitionList 类型本身没有这两个字段，渲染按鸭子类型读取。
   */
  private pageAsCard(page: SettingDefinitionPage<LinterSettingsKeys>): SettingDefinitionItem<LinterSettingsKeys> {
    return {
      ...(page.items[0] as SettingDefinitionList),
      heading: page.name,
      desc: page.desc,
    } as unknown as SettingDefinitionItem<LinterSettingsKeys>;
  }

  /**
   * 「自定义规范」标签页：自定义正则替换分组。
   */
  getCustomRulesDefinitions(): SettingDefinitionItem<LinterSettingsKeys>[] {
    return [this.pageAsCard(this.customRegexesPage())];
  }

  private ruleCategoryItems(ruleType: RuleType): SettingGroupItem<LinterSettingsKeys>[] {
    const rules = ruleTypeToRules.get(ruleType) ?? [];
    const items: SettingGroupItem<LinterSettingsKeys>[] = [];
    for (const rule of rules) {
      items.push(...this.ruleToItems(rule));
    }
    return items;
  }

  private generalDefinitions(): SettingDefinitionItem<LinterSettingsKeys>[] {
    const settings = this.plugin.settings;
    const items: SettingDefinitionItem<LinterSettingsKeys>[] = [];

    items.push({
      name: getTextInLanguage('tabs.general.lint-on-save.name'),
      desc: richDescription(getTextInLanguage('tabs.general.lint-on-save.description')),
      render: (setting) => {
        setting.addToggle((tg) => tg
            .setValue(settings.lintOnSave)
            .onChange(async (value) => {
              settings.lintOnSave = value;
              await this.plugin.saveSettings();
              this.refreshDomState();
            }));
      },
    });

    items.push({
      name: getTextInLanguage('tabs.general.display-message.name'),
      desc: richDescription(getTextInLanguage('tabs.general.display-message.description')),
      visible: () => settings.lintOnSave,
      control: {type: 'toggle', key: 'displayChanged'},
    });

    items.push({
      name: getTextInLanguage('tabs.general.lint-on-file-change.name'),
      desc: richDescription(getTextInLanguage('tabs.general.lint-on-file-change.description')),
      render: (setting) => {
        setting.addToggle((tg) => tg
            .setValue(settings.lintOnFileChange)
            .onChange(async (value) => {
              settings.lintOnFileChange = value;
              await this.plugin.saveSettings();
              this.refreshDomState();
            }));
      },
    });

    items.push({
      name: getTextInLanguage('tabs.general.display-lint-on-file-change-message.name'),
      desc: richDescription(getTextInLanguage('tabs.general.display-lint-on-file-change-message.description')),
      visible: () => settings.lintOnFileChange,
      control: {type: 'toggle', key: 'displayLintOnFileChangeNotice'},
    });


    items.push({
      name: getTextInLanguage('tabs.general.enable-diff-preview-view.name'),
      desc: richDescription(getTextInLanguage('tabs.general.enable-diff-preview-view.description')),
      control: {type: 'toggle', key: 'enableDiffPreviewView'},
    });

    return items;
  }

  private commonStylesGroup(): SettingDefinitionGroup<LinterSettingsKeys> {
    const enumOptions = (values: string[]): Record<string, string> => {
      const options: Record<string, string> = {};
      for (const v of values) {
        options[v] = getTextInLanguage(('enums.' + v) as LanguageStringKey);
      }
      return options;
    };

    return {
      type: 'group',
      heading: getTextInLanguage('tabs.general.yaml'),
      items: [
        {
          name: getTextInLanguage('tabs.general.yaml-aliases-section-style.name'),
          desc: richDescription(getTextInLanguage('tabs.general.yaml-aliases-section-style.description')),
          control: {
            type: 'dropdown',
            key: 'commonStyles.aliasArrayStyle',
            options: enumOptions([
              NormalArrayFormats.MultiLine,
              NormalArrayFormats.SingleLine,
              SpecialArrayFormats.SingleStringCommaDelimited,
              SpecialArrayFormats.SingleStringToSingleLine,
              SpecialArrayFormats.SingleStringToMultiLine,
            ]),
          },
        },
        {
          name: getTextInLanguage('tabs.general.yaml-tags-section-style.name'),
          desc: richDescription(getTextInLanguage('tabs.general.yaml-tags-section-style.description')),
          control: {
            type: 'dropdown',
            key: 'commonStyles.tagArrayStyle',
            options: enumOptions([
              NormalArrayFormats.MultiLine,
              NormalArrayFormats.SingleLine,
              SpecialArrayFormats.SingleStringToSingleLine,
              SpecialArrayFormats.SingleStringToMultiLine,
              TagSpecificArrayFormats.SingleLineSpaceDelimited,
              TagSpecificArrayFormats.SingleStringSpaceDelimited,
              SpecialArrayFormats.SingleStringCommaDelimited,
            ]),
          },
        },
        {
          name: getTextInLanguage('tabs.general.default-array-style.name'),
          desc: richDescription(getTextInLanguage('tabs.general.default-array-style.description')),
          control: {
            type: 'dropdown',
            key: 'commonStyles.defaultArrayStyle',
            options: enumOptions([
              NormalArrayFormats.MultiLine,
              NormalArrayFormats.SingleLine,
            ]),
          },
        },
        {
          name: getTextInLanguage('tabs.general.default-escape-character.name'),
          desc: richDescription(getTextInLanguage('tabs.general.default-escape-character.description')),
          control: {
            type: 'dropdown',
            key: 'commonStyles.escapeCharacter',
            options: {'"': '"', '\'': '\''},
          },
        },
        {
          name: getTextInLanguage('tabs.general.remove-unnecessary-escape-chars-in-multi-line-arrays.name'),
          desc: richDescription(getTextInLanguage('tabs.general.remove-unnecessary-escape-chars-in-multi-line-arrays.description')),
          control: {type: 'toggle', key: 'commonStyles.removeUnnecessaryEscapeCharsForMultiLineArrays'},
        },
        {
          name: getTextInLanguage('tabs.general.number-of-dollar-signs-to-indicate-math-block.name'),
          desc: richDescription(getTextInLanguage('tabs.general.number-of-dollar-signs-to-indicate-math-block.description')),
          control: {
            type: 'number',
            key: 'commonStyles.minimumNumberOfDollarSignsToBeAMathBlock',
            min: 1,
            validate: (value) => Number.isInteger(value) && value >= 1 ? undefined : getTextInLanguage('tabs.general.number-of-dollar-signs-to-indicate-math-block.invalid'),
          },
        },
      ],
    };
  }

  private foldersToIgnorePage(): SettingDefinitionPage<LinterSettingsKeys> {
    const folders = this.plugin.settings.foldersToIgnore;
    return createListManagementPage({
      name: getTextInLanguage('tabs.general.folders-to-ignore.name'),
      desc: richDescription(getTextInLanguage('tabs.general.folders-to-ignore.description')),
      addButtonText: getTextInLanguage('tabs.general.folders-to-ignore.add-input-button-text'),
      emptyState: getTextInLanguage('tabs.general.folders-to-ignore.empty-state'),
      values: folders,
      openAddForm: () => new AddFolderToIgnoreModal(this.app, folders, async (path) => {
        folders.push(path);
        await this.plugin.saveSettings();
        this.update();
      }).open(),
      onDelete: (index) => folders.splice(index, 1),
      itemName: (folder) => folder || getTextInLanguage('tabs.general.folders-to-ignore.folder-search-placeholder-text'),
      plugin: this.plugin,
    });
  }

  private filesToIgnorePage(): SettingDefinitionPage<LinterSettingsKeys> {
    const filesToIgnore = this.plugin.settings.filesToIgnore;
    return createListManagementPage({
      name: getTextInLanguage('tabs.general.files-to-ignore.name'),
      desc: richDescription(getTextInLanguage('tabs.general.files-to-ignore.description')),
      addButtonText: getTextInLanguage('tabs.general.files-to-ignore.add-input-button-text'),
      emptyState: getTextInLanguage('tabs.general.files-to-ignore.empty-state'),
      values: filesToIgnore,
      openAddForm: () => new AddFileToIgnoreModal(this.app, async (entry) => {
        filesToIgnore.push(entry);
        await this.plugin.saveSettings();
        this.update();
      }).open(),
      onDelete: (index) => filesToIgnore.splice(index, 1),
      itemName: (entry) => entry.label || entry.match || getTextInLanguage('tabs.general.files-to-ignore.label-placeholder-text'),
      itemDesc: (entry) => entry.label && entry.match ? this.buildRegexDisplay(entry.match, entry.flags) : undefined,
      plugin: this.plugin,
    });
  }

  private buildRegexDisplay(match: string, flags: string, replace?: string): string {
    return `/${match}/${replace != undefined ? replace + '/' : ''}${flags}`;
  }

  private additionalFileExtensionsPage(): SettingDefinitionPage<LinterSettingsKeys> {
    const extensions = this.plugin.settings.additionalFileExtensions;
    return createListManagementPage({
      name: getTextInLanguage('tabs.general.additional-file-extensions.name'),
      desc: richDescription(getTextInLanguage('tabs.general.additional-file-extensions.description')),
      addButtonText: getTextInLanguage('tabs.general.additional-file-extensions.add-input-button-text'),
      emptyState: getTextInLanguage('tabs.general.additional-file-extensions.empty-state'),
      values: extensions,
      openAddForm: () => new AddFileExtensionModal(this.app, extensions, async (ext) => {
        extensions.push(ext);
        await this.plugin.saveSettings();
        this.update();
      }).open(),
      onDelete: (index) => { extensions.splice(index, 1); },
      itemName: (ext) => ext || getTextInLanguage('tabs.general.additional-file-extensions.extension-placeholder'),
      plugin: this.plugin,
    });
  }

  private ruleToItems(rule: Rule): SettingGroupItem<LinterSettingsKeys>[] {
    const settings = this.plugin.settings;
    const enabled = !!settings.ruleConfigs[rule.alias]?.enabled;

    const enabledItem: SettingGroupItem<LinterSettingsKeys> = {
      name: rule.getName(),
      aliases: [rule.alias],
      render: (setting) => {
        setting
            .setDesc(richDescription(rule.getDescription()))
            .addExtraButton((component) => component
                .setIcon('book-open')
                .onClick(() => {
                  window.open(rule.getURL(), '_blank');
                }))
            .addToggle((tg) => tg
                .setValue(enabled)
                .onChange(async (value) => {
                  if (!settings.ruleConfigs[rule.alias]) {
                    settings.ruleConfigs[rule.alias] = rule.getDefaultOptions();
                  }
                  settings.ruleConfigs[rule.alias].enabled = value;
                  rule.runEnabledSideEffect(value, this.app, this.plugin);
                  await this.plugin.saveSettings();
                  this.update();
                }));
      },
    };

    const items: SettingGroupItem<LinterSettingsKeys>[] = [enabledItem];
    if (enabled) {
      for (let i = 1; i < rule.options.length; i++) {
        items.push(rule.options[i].getSettingDefinition(this.plugin, () => this.update()) as SettingGroupItem<LinterSettingsKeys>);
      }
    }

    return items;
  }

  private customRegexesPage(): SettingDefinitionPage<LinterSettingsKeys> {
    const regexes = this.plugin.settings.customRegexes;
    return createListManagementPage({
      name: getTextInLanguage('options.custom-replace.name'),
      desc: richDescription(getTextInLanguage('options.custom-replace.description')),
      addButtonText: getTextInLanguage('options.custom-replace.add-input-button-text'),
      emptyState: getTextInLanguage('options.custom-replace.empty-state'),
      values: regexes,
      allowReorder: true,
      openAddForm: () => new CustomRegexModal(this.app, null, async (entry) => {
        regexes.push(entry);
        await this.plugin.saveSettings();
        this.update();
      }).open(),
      openEditForm: (entry, index) => new CustomRegexModal(this.app, entry, async (updated) => {
        regexes[index] = updated;
        await this.plugin.saveSettings();
        this.update();
      }).open(),
      editTooltip: getTextInLanguage('options.custom-replace.edit-tooltip'),
      onDelete: (index) => regexes.splice(index, 1),
      itemName: (entry) => entry.label || entry.find || getTextInLanguage('options.custom-replace.label-placeholder-text'),
      itemDesc: (entry) => entry.find && entry.label ? entry.find : undefined,
      itemIsDisabled: (entry) => !entry.enabled,
      plugin: this.plugin,
    });
  }

  private debugItems(): SettingDefinition<LinterSettingsKeys>[] {
    const settings = this.plugin.settings;
    const items: SettingDefinition<LinterSettingsKeys>[] = [
      {
        name: getTextInLanguage('tabs.debug.log-level.name'),
        desc: richDescription(getTextInLanguage('tabs.debug.log-level.description')),
        render: (setting) => {
          setting.addDropdown((dd) => {
            for (const v of logLevels) {
              dd.addOption(v, getTextInLanguage(('enums.' + v) as LanguageStringKey) ?? v);
            }
            dd.setValue(settings.logLevel);
            dd.onChange(async (value) => {
              settings.logLevel = value;
              await this.plugin.saveSettings();
              setLogLevel(settings.logLevel);
            });
          });
        },
      },
      {
        name: getTextInLanguage('tabs.debug.linter-config.name'),
        desc: richDescription(getTextInLanguage('tabs.debug.linter-config.description')),
        render: (setting) => {
          setting.addTextArea((cb) => {
            cb.inputEl.readOnly = true;
            cb.setValue(JSON.stringify(settings, null, 2));
            cb.inputEl.addClass('linter-debug-readonly');
          });
        },
      },
      {
        name: getTextInLanguage('tabs.debug.log-collection.name'),
        desc: richDescription(getTextInLanguage('tabs.debug.log-collection.description')),
        render: (setting) => {
          setting.addToggle((tg) => tg
              .setValue(settings.recordLintOnSaveLogs)
              .onChange(async (value) => {
                settings.recordLintOnSaveLogs = value;
                await this.plugin.saveSettings();
                this.refreshDomState();
              }));
        },
      },
      {
        name: getTextInLanguage('tabs.debug.linter-logs.name'),
        desc: richDescription(getTextInLanguage('tabs.debug.linter-logs.description')),
        visible: () => settings.recordLintOnSaveLogs,
        render: (setting) => {
          setting.addTextArea((cb) => {
            cb.inputEl.readOnly = true;
            cb.setValue(logsFromLastRun.join('\n'));
            cb.inputEl.addClass('linter-debug-readonly');
          });
        },
      },
    ];

    return items;
  }

}
