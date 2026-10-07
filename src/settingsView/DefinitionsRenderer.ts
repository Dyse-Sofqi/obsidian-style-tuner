import {
	ButtonComponent,
	DropdownComponent,
	ExtraButtonComponent,
	Setting,
	TextComponent,
	ToggleComponent,
} from 'obsidian';
import { t } from '../lang/helpers';

/**
 * Obsidian 1.13 声明式设置定义（SettingDefinitionItem）的独立渲染器。
 *
 * linter 的「格式化」设置项以声明式对象描述（原本只能由 Obsidian 的
 * PluginSettingTab 渲染），Style Tuner 面板的「格式化」标签页需要在自己的
 * DOM 里展示它们，因此这里按 Obsidian 原生的 DOM 结构复刻一份渲染：
 * `.setting-group > .setting-items` 卡片、`.setting-item-heading` 小节标题、
 * 行间分隔线全部交给 Obsidian 的原生 CSS。
 *
 * 定义联合类型没有 type 判别字段（control/render/action 靠字段存在性区分），
 * 所以分派统一走鸭子类型；只覆盖迁移部分用到的形态：render/control 行、
 * group、内嵌 page 与 list（增删；排序按钮仅在定义提供 onReorder 时出现）。
 */
export interface DefinitionsHost {
	getControlValue(key: string): unknown;
	setControlValue(key: string, value: unknown): Promise<void>;
}

export class DefinitionsRenderer {
	constructor(
		private container: HTMLElement,
		private host: DefinitionsHost,
		/** 任何会改变定义集合的修改（增删列表项、控件写回）后触发。 */
		private onChanged: () => void = () => {}
	) {}

	render(items: any[]): void {
		// 顶层普通设置行（非 group / page / list）合并进一张卡片，
		// 与分类页的单卡片观感一致；group / page 按原顺序跟随其后。
		const plainItems: any[] = [];
		for (const item of items) {
			if (!item || item.visible?.() === false) continue;
			if (item.type === 'group' || item.type === 'list' || item.type === 'page') {
				continue;
			}
			plainItems.push(item);
		}
		if (plainItems.length > 0) {
			const card = this.container.createDiv({ cls: 'setting-group' });
			const itemsEl = card.createDiv({ cls: 'setting-items' });
			for (const item of plainItems) {
				this.renderItem(itemsEl, item);
			}
		}
		for (const item of items) {
			if (!item || item.visible?.() === false) continue;
			if (item.type === 'group' || item.type === 'list' || item.type === 'page') {
				this.renderItem(this.container, item);
			}
		}
	}

	private renderItem(container: HTMLElement, item: any): void {
		if (item.type === 'group' || item.type === 'list') {
			this.renderGroup(container, item);
		} else if (item.type === 'page') {
			this.renderPage(container, item);
		} else {
			this.renderSettingRow(container, item);
		}
	}

	private renderGroup(container: HTMLElement, item: any): void {
		const groupEl = container.createDiv({
			cls: 'setting-group' + (item.cls ? ` ${item.cls}` : ''),
		});
		if (item.heading || item.desc) {
			const head = new Setting(groupEl).setHeading();
			if (item.heading) head.setName(item.heading);
			if (item.desc) head.setDesc(item.desc);
		}
		const itemsEl = groupEl.createDiv({ cls: 'setting-items' });
		const children: any[] = item.items ?? [];
		if (children.length === 0 && item.emptyState) {
			// 空状态渲染成与设置行同构的行（同内边距、同原生分隔线）
			const emptyEl = itemsEl.createDiv({ cls: 'setting-item linter-list-empty' });
			const descEl = emptyEl.createDiv({ cls: 'setting-item-description' });
			if (typeof item.emptyState === 'string') {
				descEl.setText(item.emptyState);
			} else {
				descEl.appendChild(item.emptyState);
			}
		}
		const isList = item.type === 'list';
		children.forEach((child, index) => {
			if (!child || child.visible?.() === false) return;
			if (child.type === 'group' || child.type === 'list') {
				this.renderGroup(itemsEl, child);
				return;
			}
			if (child.type === 'page') {
				this.renderPage(itemsEl, child);
				return;
			}
			const setting = this.renderSettingRow(itemsEl, child);
			if (isList) {
				this.appendListActions(setting, item, index);
			}
		});
		if (item.addItem) {
			this.renderAddItem(itemsEl, item);
		}
	}

	private renderPage(container: HTMLElement, item: any): void {
		const pageEl = container.createDiv({ cls: 'style-settings-inline-page' });
		if (item.name) {
			const head = new Setting(pageEl).setName(item.name).setHeading();
			if (item.desc) head.setDesc(item.desc);
		} else if (item.desc) {
			pageEl.createDiv({ cls: 'setting-item-description', text: item.desc });
		}
		for (const child of item.items ?? []) {
			if (!child || child.visible?.() === false) continue;
			this.renderItem(pageEl, child);
		}
	}

	private renderSettingRow(container: HTMLElement, item: any): Setting {
		const setting = new Setting(container);
		if (item.name != null) setting.setName(item.name);
		if (item.desc != null) setting.setDesc(item.desc as string | DocumentFragment);
		if (item.render) {
			item.render(setting);
		} else if (item.control) {
			this.renderControl(setting, item.control);
		} else if (item.action) {
			item.action(setting.controlEl);
		}
		return setting;
	}

	private renderControl(setting: Setting, control: any): void {
		const raw = this.host.getControlValue(control.key) ?? control.defaultValue;
		const writeBack = async (value: unknown): Promise<void> => {
			await this.host.setControlValue(control.key, value);
			this.onChanged();
		};

		switch (control.type) {
			case 'toggle':
				new ToggleComponent(setting.controlEl)
					.setValue(!!raw)
					.onChange((value: boolean) => void writeBack(value));
				break;
			case 'dropdown': {
				const dd = new DropdownComponent(setting.controlEl);
				for (const [value, label] of Object.entries(control.options ?? {})) {
					dd.addOption(value, String(label));
				}
				dd.setValue(String(raw ?? ''))
					.onChange((value: string) => void writeBack(value));
				break;
			}
			case 'number': {
				const input = new TextComponent(setting.controlEl)
					.setValue(raw == null ? '' : String(raw))
					.onChange((text: string) => {
						const parsed = Number(text);
						if (text.trim() !== '' && Number.isFinite(parsed)) {
							void writeBack(parsed);
						}
					});
				input.inputEl.type = 'number';
				break;
			}
			case 'text': {
				new TextComponent(setting.controlEl)
					.setValue(raw == null ? '' : String(raw))
					.onChange((value: string) => void writeBack(value));
				break;
			}
			default:
				setting.controlEl.createDiv({
					cls: 'setting-item-description',
					text: `[${control.type}]`,
				});
		}
	}

	private renderAddItem(itemsEl: HTMLElement, list: any): void {
		const add = list.addItem;
		if (!add) return;
		new Setting(itemsEl)
			.setName(add.name)
			.addButton((button: ButtonComponent) =>
				button.setIcon('plus').setTooltip(add.name).onClick(() => {
					add.action(button.buttonEl);
					// 打开的是模态框；提交后的列表变化经 settingsTab.update()
					// → onFormatChange 通知本面板重渲染。
				})
			);
	}

	/** 列表条目行的删除 / 排序按钮（追加到条目自身渲染的控件之后）。 */
	private appendListActions(setting: Setting, list: any, index: number): void {
		if (list.onDelete) {
			setting.addExtraButton((button: ExtraButtonComponent) =>
				button
					.setIcon('trash')
					.setTooltip(t('Delete'))
					.onClick(() => {
						list.onDelete?.(index);
						this.onChanged();
					})
			);
		}
		if (list.onReorder) {
			setting.addExtraButton((button: ExtraButtonComponent) =>
				button
					.setIcon('arrow-up')
					.setTooltip(t('Move up'))
					.onClick(() => {
						if (index > 0) {
							list.onReorder?.(index, index - 1);
							this.onChanged();
						}
					})
			);
			setting.addExtraButton((button: ExtraButtonComponent) =>
				button
					.setIcon('arrow-down')
					.setTooltip(t('Move down'))
					.onClick(() => {
						list.onReorder?.(index, index + 1);
						this.onChanged();
					})
			);
		}
	}
}
