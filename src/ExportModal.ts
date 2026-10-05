import { SettingValue } from './SettingsManager';
import CSSSettingsPlugin from './main';
import { t } from './lang/helpers';
import { copyTextToClipboard } from './Utils';
import {
	App,
	ButtonComponent,
	Modal,
	Notice,
	TextAreaComponent,
} from 'obsidian';

export interface ExportSectionOption {
	/** Section id (data key prefix, e.g. `theme-blue-topaz`). */
	id: string;
	/** Display name shown in the checkbox list. */
	name: string;
	/** True when the section only exists as stored data (its source is disabled). */
	orphaned?: boolean;
	/** Number of stored keys in this section. */
	count?: number;
}

export class ExportModal extends Modal {
	plugin: CSSSettingsPlugin;
	section: string;
	config: Record<string, SettingValue>;
	/** Present only for the "All settings" export: per-section checkboxes. */
	sections: ExportSectionOption[] | null;
	private selectedSections: Set<string> = new Set();
	private outputTextarea: TextAreaComponent | null = null;

	constructor(
		app: App,
		plugin: CSSSettingsPlugin,
		section: string,
		config: Record<string, SettingValue>,
		sections: ExportSectionOption[] | null = null
	) {
		super(app);
		this.plugin = plugin;
		this.config = config;
		this.section = section;
		this.sections = sections;

		if (sections) {
			// 默认只勾选「当前启用」的区块：来源未启用的区块往往是早就停用的
			// 主题 / 片段留下的残留配置，默认勾上会让人误以为这些值还在生效。
			// 若一个启用中的区块都没有，则退回全选，避免一打开就是空导出。
			const active = sections.filter((s) => !s.orphaned);
			const initial = active.length > 0 ? active : sections;
			this.selectedSections = new Set(initial.map((s) => s.id));
		}
	}

	/** Builds the export payload, restricted to the checked sections. */
	private buildOutput(): string {
		let data = this.config;

		if (this.sections) {
			const selected = this.selectedSections;
			data = Object.fromEntries(
				Object.entries(this.config).filter(([key]) =>
					selected.has(key.split('@@')[0])
				)
			);
		}

		return JSON.stringify(data, null, 2);
	}

	/** Rewrites the copy textarea with the current (filtered) payload. */
	private refreshOutput() {
		this.outputTextarea?.setValue(this.buildOutput());
	}

	/** `data:` URL holding the current export payload. */
	private buildDownloadHref(): string {
		return `data:application/json;charset=utf-8,${encodeURIComponent(
			this.buildOutput()
		)}`;
	}

	/** 触发一次下载：临时挂一个 `a[download]` 点一下就移除。 */
	private downloadConfig() {
		const link = createEl('a');
		link.setAttribute('href', this.buildDownloadHref());
		link.setAttribute('download', 'style-settings.json');
		document.body.appendChild(link);
		link.click();
		link.remove();
	}

	/**
	 * 右栏标题：「导出设置：全部设置」。
	 * 中文等语言的标签以全角冒号结尾，此时不再补半角空格。
	 */
	private rangeLabel(): string {
		const label = t('Export settings for:');
		return `${label}${label.endsWith(':') ? ' ' : ''}${this.section}`;
	}

	/**
	 * 弹窗主体：左栏区块勾选、右栏导出内容（「全部设置」导出时并排；
	 * 单区块导出没有可勾选项，输出栏独占整宽）。
	 */
	onOpen() {
		const { contentEl, modalEl } = this;

		modalEl.addClass('modal-style-settings');

		const hasSections = !!this.sections && this.sections.length > 0;

		const bodyEl = contentEl.createDiv({
			cls: `style-settings-export-body${
				hasSections ? '' : ' is-output-only'
			}`,
		});

		if (hasSections) {
			this.displaySectionPicker(
				bodyEl.createDiv('style-settings-export-pane is-sections')
			);
		}

		this.displayOutput(
			bodyEl.createDiv('style-settings-export-pane is-output')
		);
	}

	/**
	 * 右栏：标题（导出范围）+ 配置文本域 + 复制 / 下载。文本域撑满剩余高度，
	 * 操作放在右栏底部——弹窗右上角是 Obsidian 的关闭按钮，链接放那里会打架。
	 */
	private displayOutput(paneEl: HTMLElement) {
		const headerEl = paneEl.createDiv('style-settings-pane-header');

		headerEl.createDiv({
			cls: 'style-settings-pane-title',
			text: this.rangeLabel(),
		});

		if (this.sections?.length) {
			headerEl.createDiv({
				cls: 'style-settings-pane-desc',
				text: t('All customized values of the checked sections.'),
			});
		}

		const textareaEl = paneEl.createDiv('style-settings-export-textarea');
		this.outputTextarea = new TextAreaComponent(textareaEl);
		this.outputTextarea.setValue(this.buildOutput());

		const actionsEl = paneEl.createDiv('style-settings-output-actions');

		// Copy to clipboard（Obsidian 原生按钮）
		const copyButton = new ButtonComponent(actionsEl);
		copyButton.setButtonText(t('Copy to clipboard'));
		copyButton.buttonEl.addClass('style-settings-copy');
		copyButton.onClick(() => {
			copyTextToClipboard(this.outputTextarea?.inputEl.value ?? '')
				.then((success) => {
					if (success) {
						new Notice(t('Copied to clipboard'));
					} else {
						new Notice(t('Copy to clipboard failed'));
						// Last resort: leave the text selected so the
						// user can copy it manually with Ctrl+C.
						this.outputTextarea?.inputEl.focus();
						this.outputTextarea?.inputEl.select();
					}
				})
				.finally(() => {
					copyButton.buttonEl.addClass('success');

					window.setTimeout(() => {
						// If the button is still in the dom, clear the success state
						if (copyButton.buttonEl.parentNode) {
							copyButton.buttonEl.removeClass('success');
						}
					}, 2000);
				});
		});

		// Download（Obsidian 原生按钮，点击时才生成数据链接）
		const downloadButton = new ButtonComponent(actionsEl);
		downloadButton.setButtonText(t('Download'));
		downloadButton.buttonEl.addClass('style-settings-download');
		downloadButton.onClick(() => this.downloadConfig());
	}

	/**
	 * 左栏：区块勾选列表加全选 / 全不选与实时计数；勾选变化即时刷新右侧
	 * 导出内容（默认只勾选来源仍启用的区块）。来源已停用的区块单独分组并加徽标。
	 */
	private displaySectionPicker(paneEl: HTMLElement) {
		const sections = this.sections ?? [];

		const headerEl = paneEl.createDiv('style-settings-pane-header');
		headerEl.createDiv({
			cls: 'style-settings-pane-title',
			text: t('Sections'),
		});
		headerEl.createDiv({
			cls: 'style-settings-pane-desc',
			text: t(
				'Only checked sections are included in the exported configuration.'
			),
		});

		const wrapperEl = paneEl.createDiv('style-settings-export-sections');

		const checkboxInputs: HTMLInputElement[] = [];
		let allChecked = true;

		const addRow = (section: ExportSectionOption) => {
			const row = wrapperEl.createDiv('style-settings-export-section');
			const label = row.createEl('label');
			const checkbox = label.createEl('input', { type: 'checkbox' });
			checkbox.checked = this.selectedSections.has(section.id);
			checkbox.addEventListener('change', () => {
				if (checkbox.checked) {
					this.selectedSections.add(section.id);
				} else {
					this.selectedSections.delete(section.id);
				}
				this.refreshOutput();
				updateSummary();
			});
			label.createSpan({
				text: section.name,
				cls: 'style-settings-export-section-name',
			});
			if (section.orphaned) {
				label.createSpan({
					text: t('Source disabled'),
					cls: 'style-settings-export-badge',
				});
			}
			if (section.count !== undefined) {
				label.createSpan({
					text: String(section.count),
					cls: 'style-settings-export-count',
				});
			}
			checkboxInputs.push(checkbox);
		};

		const active = sections.filter((s) => !s.orphaned);
		const orphaned = sections.filter((s) => s.orphaned);
		const showGroups = active.length > 0 && orphaned.length > 0;

		if (showGroups) {
			wrapperEl
				.createDiv('style-settings-export-group-heading')
				.setText(t('Active'));
			for (const section of active) {
				addRow(section);
			}
			wrapperEl
				.createDiv('style-settings-export-group-heading')
				.setText(t('Source disabled'));
			for (const section of orphaned) {
				addRow(section);
			}
		} else {
			for (const section of sections) {
				addRow(section);
			}
		}

		// Footer: check/uncheck-all toggle plus a live selection summary.
		const toggleAll = paneEl.createDiv('style-settings-export-toggle');
		const toggleButton = new ButtonComponent(toggleAll);
		toggleButton.setButtonText(t('Check all'));
		const summaryEl = toggleAll.createSpan({
			cls: 'style-settings-export-summary',
		});

		const updateSummary = () => {
			const checked = checkboxInputs.filter((c) => c.checked).length;
			summaryEl.setText(
				t('{{checked}} of {{total}} selected')
					.replace('{{checked}}', String(checked))
					.replace('{{total}}', String(sections.length))
			);
			allChecked = checked === sections.length;
			toggleButton.setButtonText(
				allChecked ? t('Uncheck all') : t('Check all')
			);
		};

		toggleButton.onClick(() => {
			const nextChecked = !allChecked;
			for (const input of checkboxInputs) {
				input.checked = nextChecked;
			}
			this.selectedSections = nextChecked
				? new Set(sections.map((s) => s.id))
				: new Set();
			this.refreshOutput();
			updateSummary();
		});

		updateSummary();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
