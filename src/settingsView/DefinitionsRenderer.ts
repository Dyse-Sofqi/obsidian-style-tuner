import {
	ButtonComponent,
	DropdownComponent,
	ExtraButtonComponent,
	setIcon,
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
 * group、内嵌 page 与 list（增删；定义提供 onReorder 时，条目左侧渲染拖拽
 * 手柄并启用 HTML5 拖拽排序）。
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
		const isList = item.type === 'list';
		const groupEl = container.createDiv({
			cls:
				'setting-group' +
				(isList ? ' style-tuner-linter-list' : '') +
				(item.cls ? ` ${item.cls}` : ''),
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
			const emptyEl = itemsEl.createDiv({ cls: 'setting-item style-tuner-linter-list-empty' });
			const descEl = emptyEl.createDiv({ cls: 'setting-item-description' });
			if (typeof item.emptyState === 'string') {
				descEl.setText(item.emptyState);
			} else {
				descEl.appendChild(item.emptyState);
			}
		}
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
				this.decorateListRow(setting, item, index, itemsEl);
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
		const extraActions: {
			label: string;
			tooltip: string;
			action: () => void | Promise<void>;
		}[] = list.extraActions ?? [];
		if (!add && extraActions.length === 0) return;

		const setting = new Setting(itemsEl);

		// 额外动作排在「+」左边：整份列表级别的操作给带文字的按钮，
		// 主操作（添加条目）仍是右边的 + 图标按钮
		for (const extra of extraActions) {
			setting.addButton((button: ButtonComponent) =>
				button.setButtonText(extra.label).setTooltip(extra.tooltip).onClick(() => {
					void extra.action();
					this.onChanged();
				})
			);
		}

		if (add) {
			setting.setName(add.name).addButton((button: ButtonComponent) =>
				button.setIcon('plus').setTooltip(add.name).onClick(() => {
					add.action(button.buttonEl);
					// 打开的是模态框；提交后的列表变化经 settingsTab.update()
					// → onFormatChange 通知本面板重渲染。
				})
			);
		}

		setting.settingEl.addClass('style-tuner-linter-list-add-row');
	}

	// ------------------------------------------------------------------
	// 列表条目：拖拽手柄 + 删除按钮 + HTML5 拖拽排序
	// ------------------------------------------------------------------

	/** 当前正在拖拽的条目（跨行事件共享；同一时刻只有一次拖拽）。 */
	private dragSource: { itemsEl: HTMLElement; index: number } | null = null;

	/** 列表条目行：左侧拖拽手柄、删除按钮，以及拖拽排序的事件绑定。 */
	private decorateListRow(
		setting: Setting,
		list: any,
		index: number,
		itemsEl: HTMLElement
	): void {
		setting.settingEl.addClass('style-tuner-linter-list-row');

		if (list.onReorder) {
			// 手柄插到行首（.setting-item-info 之前）。行本身不设 draggable，
			// 只让手柄可拖，避免选中文本或点击行内控件时误触发拖拽。
			const handle = setting.settingEl.createDiv({
				cls: 'style-tuner-linter-list-drag-handle',
			});
			setting.settingEl.prepend(handle);
			setIcon(handle, 'grip-vertical');
			handle.setAttribute('draggable', 'true');
			handle.setAttribute('aria-label', t('Drag to reorder'));
			this.wireListDrag(handle, setting.settingEl, itemsEl, index, list);
		}

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
	}

	/**
	 * 绑定一行的拖拽事件。
	 *
	 * `onReorder(oldIndex, newIndex)` 的语义是「先 splice 掉 oldIndex，
	 * 再插到 newIndex」，所以落点要按「移除后再算下标」换算：先由指针位于
	 * 行的上半 / 下半求出插入位（0..n 的缝隙编号），若插入位在被拖项之后
	 * 则减一，得到移除后的目标下标。
	 */
	private wireListDrag(
		handle: HTMLElement,
		rowEl: HTMLElement,
		itemsEl: HTMLElement,
		index: number,
		list: any
	): void {
		handle.addEventListener('dragstart', (evt: DragEvent) => {
			this.dragSource = { itemsEl, index };
			rowEl.addClass('is-dragging');
			evt.dataTransfer?.setData('text/plain', String(index));
			if (evt.dataTransfer) {
				evt.dataTransfer.effectAllowed = 'move';
				// 用整行作为拖拽影像，而不是小小的手柄
				evt.dataTransfer.setDragImage(rowEl, 16, 16);
			}
		});
		handle.addEventListener('dragend', () => {
			this.dragSource = null;
			this.clearDragState(itemsEl);
		});

		rowEl.addEventListener('dragover', (evt: DragEvent) => {
			if (!this.dragSource || this.dragSource.itemsEl !== itemsEl) return;
			evt.preventDefault();
			if (evt.dataTransfer) evt.dataTransfer.dropEffect = 'move';
			const after = this.isPointerInLowerHalf(evt, rowEl);
			rowEl.toggleClass('is-drop-below', after);
			rowEl.toggleClass('is-drop-above', !after);
		});
		rowEl.addEventListener('dragleave', (evt: DragEvent) => {
			// 在行内子元素之间移动也会触发 dragleave，relatedTarget 仍在行内时忽略
			if (rowEl.contains(evt.relatedTarget as Node | null)) return;
			rowEl.removeClass('is-drop-above');
			rowEl.removeClass('is-drop-below');
		});
		rowEl.addEventListener('drop', (evt: DragEvent) => {
			const source = this.dragSource;
			if (!source || source.itemsEl !== itemsEl) return;
			evt.preventDefault();
			const insertBefore = this.isPointerInLowerHalf(evt, rowEl)
				? index + 1
				: index;
			const newIndex =
				insertBefore > source.index ? insertBefore - 1 : insertBefore;
			const oldIndex = source.index;
			this.dragSource = null;
			this.clearDragState(itemsEl);
			if (newIndex !== oldIndex) {
				list.onReorder?.(oldIndex, newIndex);
				this.onChanged();
			}
		});
	}

	private isPointerInLowerHalf(evt: DragEvent, rowEl: HTMLElement): boolean {
		const rect = rowEl.getBoundingClientRect();
		return evt.clientY > rect.top + rect.height / 2;
	}

	/** 清掉一次拖拽留下的所有视觉状态（拖拽中 / 落点指示线）。 */
	private clearDragState(itemsEl: HTMLElement): void {
		for (const child of Array.from(itemsEl.children)) {
			child.removeClass('is-dragging');
			child.removeClass('is-drop-above');
			child.removeClass('is-drop-below');
		}
	}
}
