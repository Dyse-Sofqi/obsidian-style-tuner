import {App, displayTooltip, DropdownComponent} from 'obsidian';
import {getTextInLanguage, LanguageStringKey} from '../../lang/helpers';
import { CustomReplace, FileToIgnore } from "../../settings-data";
import {
  describeYamlAttributeSkeleton,
  fixedPropertyTypeFor,
  isYamlPropertyType,
  validateYamlAttribute,
  YAML_PROPERTY_TYPE_LABEL_KEY,
  YAML_PROPERTY_TYPES,
  type YamlAttributeEntry,
  type YamlPropertyType,
} from '../../utils/yaml-attributes';
import FolderSuggester from '../suggesters/folder-suggester';
import {FormField, FormModal} from './form-modal';

const filesToIgnoreDefaultFlags = 'i';
const customRegexDefaultFlags = 'gm';

export class AddFolderToIgnoreModal extends FormModal {
  private value = '';
  private inputEl: HTMLInputElement | undefined;

  constructor(
      app: App,
      private existing: string[],
      private onAdd: (path: string) => void | Promise<void>,
  ) {
    super(app);
    this.setTitle(getTextInLanguage('tabs.general.folders-to-ignore.add-input-button-text'));

    this.addField((field) => {
      field.setName(getTextInLanguage('tabs.general.folders-to-ignore.folder-search-placeholder-text'));
      field.addText((cb) => {
        new FolderSuggester(app, cb.inputEl, existing);
        cb.setPlaceholder(getTextInLanguage('tabs.general.folders-to-ignore.folder-search-placeholder-text'))
            .onChange((v) => {
              this.value = v;
            });
        cb.inputEl.addEventListener('keydown', (evt) => {
          if (!evt.isComposing && evt.key === 'Enter') {
            evt.preventDefault();
            this.formSubmit();
          }
        });
        this.inputEl = cb.inputEl;
      });
    });
  }

  onOpen() {
    this.inputEl?.focus();
  }

  onSubmit() {
    const value = this.value.trim();
    if (!value) {
      if (this.inputEl) displayTooltip(this.inputEl, getTextInLanguage('required'), {classes: ['mod-error']});
      return;
    }
    if (this.existing.includes(value)) {
      if (this.inputEl) displayTooltip(this.inputEl, getTextInLanguage('already-in-list'), {classes: ['mod-error']});
      return;
    }
    void this.onAdd(value);
    this.close();
  }
}

export class AddFileToIgnoreModal extends FormModal {
  private label = '';
  private match = '';
  private flags = filesToIgnoreDefaultFlags;
  private firstInputEl: HTMLInputElement | undefined;

  constructor(
      app: App,
      private onAdd: (entry: FileToIgnore) => void | Promise<void>,
  ) {
    super(app);
    this.setTitle(getTextInLanguage('tabs.general.files-to-ignore.add-input-button-text'));

    this.addField((field) => {
      field.setName(getTextInLanguage('tabs.general.files-to-ignore.label-placeholder-text'));
      field.addText((cb) => {
        cb.setPlaceholder(getTextInLanguage('tabs.general.files-to-ignore.label-placeholder-text'))
            .onChange((v) => {
              this.label = v;
            });
        this.firstInputEl = cb.inputEl;
      });
    });

    this.addField((field) => {
      field.setName(getTextInLanguage('tabs.general.files-to-ignore.file-search-placeholder-text'));
      field.addText((cb) => {
        cb.setPlaceholder(getTextInLanguage('tabs.general.files-to-ignore.file-search-placeholder-text'))
            .onChange((v) => {
              this.match = v;
            });
      });
    });

    this.addField((field) => {
      field.setName(getTextInLanguage('tabs.general.files-to-ignore.flags-placeholder-text'));
      field.addText((cb) => {
        cb.setPlaceholder(getTextInLanguage('tabs.general.files-to-ignore.flags-placeholder-text'))
            .setValue(filesToIgnoreDefaultFlags)
            .onChange((v) => {
              this.flags = v;
            });
      });
    });
  }

  onOpen() {
    this.firstInputEl?.focus();
  }

  onSubmit() {
    const match = this.match.trim();
    if (!match) {
      if (this.firstInputEl) displayTooltip(this.firstInputEl, getTextInLanguage('tabs.general.files-to-ignore.pattern-required'), {classes: ['mod-error']});
      return;
    }
    void this.onAdd({label: this.label.trim(), match, flags: this.flags.trim()});
    this.close();
  }
}

export class AddFileExtensionModal extends FormModal {
  private value = '';
  private inputEl: HTMLInputElement | undefined;

  constructor(
      app: App,
      private existing: string[],
      private onAdd: (extension: string) => void | Promise<void>,
  ) {
    super(app);
    this.setTitle(getTextInLanguage('tabs.general.additional-file-extensions.add-input-button-text'));

    this.addField((field) => {
      field.setName(getTextInLanguage('tabs.general.additional-file-extensions.extension-placeholder'));
      field.addText((cb) => {
        cb.setPlaceholder(getTextInLanguage('tabs.general.additional-file-extensions.extension-placeholder'))
            .onChange((v) => {
              this.value = v;
            });
        cb.inputEl.addEventListener('keydown', (evt) => {
          if (!evt.isComposing && evt.key === 'Enter') {
            evt.preventDefault();
            this.formSubmit();
          }
        });
        this.inputEl = cb.inputEl;
      });
    });
  }

  onOpen() {
    this.inputEl?.focus();
  }

  onSubmit() {
    const value = this.value.trim().toLowerCase().replace(/^\./, '');
    if (!value) {
      if (this.inputEl) displayTooltip(this.inputEl, getTextInLanguage('required'), {classes: ['mod-error']});
      return;
    }
    if (this.existing.includes(value)) {
      if (this.inputEl) displayTooltip(this.inputEl, getTextInLanguage('already-in-list'), {classes: ['mod-error']});
      return;
    }
    void this.onAdd(value);
    this.close();
  }
}

// Add or edit a custom regex replacement. When `initial` is provided, the
// modal pre-populates each field and the submit callback returns the updated
// entry
export class CustomRegexModal extends FormModal {
  private label: string;
  private find: string;
  private flags: string;
  private replace: string;
  private enabled: boolean;
  private findInputEl: HTMLInputElement | undefined;
  private flagsInputEl: HTMLInputElement | undefined;

  constructor(
      app: App,
      initial: CustomReplace | null,
      private onSubmitEntry: (entry: CustomReplace) => void | Promise<void>,
  ) {
    super(app);
    this.label = initial?.label ?? '';
    this.find = initial?.find ?? '';
    this.flags = initial?.flags ?? customRegexDefaultFlags;
    this.replace = initial?.replace ?? '';
    this.enabled = initial?.enabled ?? true;

    this.setTitle(getTextInLanguage(initial ? 'options.custom-replace.edit-tooltip' : 'options.custom-replace.add-input-button-text'));

    this.addField((field) => {
      field.setName(getTextInLanguage('options.custom-replace.label-placeholder-text'));
      field.addText((cb) => {
        cb.setPlaceholder(getTextInLanguage('options.custom-replace.label-placeholder-text'))
            .setValue(this.label)
            .onChange((v) => {
              this.label = v;
            });
      });
    });

    this.addField((field) => {
      field.setName(getTextInLanguage('options.custom-replace.regex-to-find-placeholder-text'));
      field.addText((cb) => {
        cb.setPlaceholder(getTextInLanguage('options.custom-replace.regex-to-find-placeholder-text'))
            .setValue(this.find)
            .onChange((v) => {
              this.find = v;
            });
        this.findInputEl = cb.inputEl;
      });
    });

    this.addField((field) => {
      field.setName(getTextInLanguage('options.custom-replace.flags-placeholder-text'));
      field.addText((cb) => {
        cb.setPlaceholder(getTextInLanguage('options.custom-replace.flags-placeholder-text'))
            .setValue(this.flags)
            .onChange((v) => {
              this.flags = v;
            });
        this.flagsInputEl = cb.inputEl;
      });
    });

    this.addField((field) => {
      field.setName(getTextInLanguage('options.custom-replace.regex-to-replace-placeholder-text'));
      field.addText((cb) => {
        cb.setPlaceholder(getTextInLanguage('options.custom-replace.regex-to-replace-placeholder-text'))
            .setValue(this.replace)
            .onChange((v) => {
              this.replace = v;
            });
      });
    });

    this.addField((field) => {
      field.setName(getTextInLanguage('options.custom-replace.enabled'));
      field.addToggle((cb) => {
        cb.setValue(this.enabled)
            .onChange((b) => {
              this.enabled = b;
            });
      });
    });
  }

  onOpen() {
    this.findInputEl?.focus();
  }

  onSubmit() {
    const find = this.find; // find can be whitespace, so triming the value is not valid (see https://github.com/platers/obsidian-linter/issues/1591)
    if (!find) {
      if (this.findInputEl) displayTooltip(this.findInputEl, getTextInLanguage('required'), {classes: ['mod-error']});
      return;
    }
    try {
      new RegExp(find, this.flags);
    } catch (e) {
      const target = e instanceof SyntaxError && /flags/i.test(e.message) ? this.flagsInputEl : this.findInputEl;
      if (target) displayTooltip(target, getTextInLanguage('options.custom-replace.invalid-regex'), {classes: ['mod-error']});
      return;
    }

    void this.onSubmitEntry({
      label: this.label.trim(),
      find,
      flags: this.flags.trim(),
      replace: this.replace,
      enabled: this.enabled,
    });
    this.close();
  }
}

export type ListItemValidation = (entry: string) => [boolean, string];

/**
 * 「插入 YAML 属性」的条目表单：键名 + 属性类型 + 默认值。
 *
 * 值留空时按类型插入骨架（文本 `键:`、列表 `键: []`、数字 `键: 0`、
 * 复选框 `键: false`、日期 / 日期时间取当天），帮助文案里实时显示会插入什么。
 *
 * `aliases` / `tags` / `cssclasses` 的类型被 Obsidian 写死（都是多值属性），
 * 键名一改成这三个，类型下拉就会锁到「列表」并禁用——不然用户选「数字」会得到
 * `tags: 0` 这种与 Obsidian 固定类型打架的值。
 */
export class YamlAttributeModal extends FormModal {
  private key: string;
  private type: YamlPropertyType;
  private value: string;
  private keyInputEl: HTMLInputElement | undefined;
  private valueInputEl: HTMLInputElement | undefined;
  private valueField: FormField | undefined;
  private typeDropdown: DropdownComponent | undefined;

  constructor(
      app: App,
      initial: YamlAttributeEntry | null,
      private onSubmitEntry: (entry: YamlAttributeEntry) => void | Promise<void>,
  ) {
    super(app);
    this.key = initial?.key ?? '';
    this.type = initial?.type ?? 'text';
    this.value = initial?.value ?? '';

    this.setTitle(getTextInLanguage(initial ? 'edit-tooltip' : 'add-tooltip'));

    this.addField((field) => {
      field.setName(getTextInLanguage('rules.insert-yaml-attributes.key.name'));
      field.addText((cb) => {
        cb.setPlaceholder(getTextInLanguage('rules.insert-yaml-attributes.key.placeholder'))
            .setValue(this.key)
            .onChange((v) => {
              this.key = v;
              this.refreshHints();
            });
        this.keyInputEl = cb.inputEl;
      });
    });

    this.addField((field) => {
      field.setName(getTextInLanguage('rules.insert-yaml-attributes.property-type.name'));
      field.addDropdown((cb) => {
        for (const type of YAML_PROPERTY_TYPES) {
          cb.addOption(type, getTextInLanguage(YAML_PROPERTY_TYPE_LABEL_KEY[type]));
        }
        cb.setValue(this.type).onChange((v) => {
          this.type = isYamlPropertyType(v) ? v : 'text';
          this.refreshHints();
        });
        this.typeDropdown = cb;
      });
    });

    this.valueField = this.addField((field) => {
      field.setName(getTextInLanguage('rules.insert-yaml-attributes.value.name'));
      field.addText((cb) => {
        cb.setValue(this.value).onChange((v) => {
          this.value = v;
        });
        this.valueInputEl = cb.inputEl;
      });
    });

    this.refreshHints();
  }

  onOpen() {
    this.keyInputEl?.focus();
  }

  /** 值留空时插入的骨架 + 保留键说明，实时跟着键名 / 类型更新。 */
  private refreshHints() {
    const key = this.key.trim();
    const fixedType = fixedPropertyTypeFor(key);
    if (fixedType) {
      // 保留键：类型锁定到 Obsidian 固定的那个，下拉禁用
      this.type = fixedType;
      this.typeDropdown?.setValue(fixedType).setDisabled(true);
    } else {
      this.typeDropdown?.setDisabled(false);
    }

    const skeleton = describeYamlAttributeSkeleton({
      key: key || getTextInLanguage('rules.insert-yaml-attributes.key.placeholder'),
      type: this.type,
      value: '',
    });

    const hints = [
      getTextInLanguage('rules.insert-yaml-attributes.value.description').replace('{YAML}', skeleton),
    ];
    if (this.type === 'list') {
      hints.push(getTextInLanguage('rules.insert-yaml-attributes.value.list-hint'));
    }
    if (fixedType) {
      hints.push(getTextInLanguage('rules.insert-yaml-attributes.property-type.reserved'));
    }

    this.valueField?.setHelp(hints.join(' '));
    this.valueInputEl?.setAttribute('placeholder', skeleton);
  }

  onSubmit() {
    // 键名统一去掉首尾空白后再校验，避免用户多打一个空格就报错；
    // 保留键的类型再兜一次底，防止有人绕过界面直接改 data-linter.json
    const key = this.key.trim();
    const entry: YamlAttributeEntry = {
      key,
      type: fixedPropertyTypeFor(key) ?? this.type,
      value: this.value.trim(),
    };

    const result = validateYamlAttribute(entry);
    if (!result.ok) {
      const isValueError = result.params?.VALUE !== undefined;
      const target = isValueError ? this.valueInputEl : this.keyInputEl;
      let message = getTextInLanguage(result.messageKey);
      for (const [name, value] of Object.entries(result.params ?? {})) {
        message = message.replace(`{${name}}`, value);
      }
      if (target) displayTooltip(target, message, {classes: ['mod-error']});
      return;
    }

    void this.onSubmitEntry(entry);
    this.close();
  }
}

export class ListItemsModal extends FormModal {
  private value: string;
  private inputEl: HTMLInputElement | undefined;

  constructor(
      app: App,
      initial: string | null,
      fieldNameKey: LanguageStringKey,
      private trimItemWhitespace: boolean,
      private onSubmitEntry: (entry: string) => void | Promise<void>,
      private isValidInput: ListItemValidation | undefined = undefined,
  ) {
    super(app);
    this.value = initial ?? '';

    this.setTitle(getTextInLanguage(initial ? 'edit-tooltip' : 'add-tooltip'));

    this.addField((field) => {
      field.setName(getTextInLanguage(fieldNameKey));
      field.addText((cb) => {
        cb.setPlaceholder(getTextInLanguage(fieldNameKey))
            .setValue(this.value)
            .onChange((v) => {
              this.value = v;
            });

        this.inputEl = cb.inputEl;
      });
    });
  }

  onOpen() {
    this.inputEl?.focus();
  }

  onSubmit() {
    const value = this.trimItemWhitespace ? this.value.trim() : this.value;
    const trimmedValue = this.value.trim();
    if (!trimmedValue) {
      if (this.inputEl) displayTooltip(this.inputEl, getTextInLanguage('required'), {classes: ['mod-error']});
      return;
    }

    if (this.isValidInput) {
      const [isValid, validationMsg] = this.isValidInput(value);
      if (!isValid) {
        if (this.inputEl) displayTooltip(this.inputEl, validationMsg, {classes: ['mod-error']});
        return;
      }
    }

    void this.onSubmitEntry(value);
    this.close();
  }
}
