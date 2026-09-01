import { SettingValue } from './SettingsManager';
import CSSSettingsPlugin from './main';
import { t } from './lang/helpers';
import { App, Modal, Setting, TextAreaComponent } from 'obsidian';

export interface ExportSectionOption {
	/** Section id (data key prefix, e.g. `theme-blue-topaz`). */
	id: string;
	/** Display name shown in the checkbox list. */
	name: string;
}

export class ExportModal extends Modal {
	plugin: CSSSettingsPlugin;
	section: string;
	config: Record<string, SettingValue>;
	/** Present only for the "All settings" export: per-section checkboxes. */
	sections: ExportSectionOption[] | null;
	private selectedSections: Set<string> = new Set();
	private outputTextarea: TextAreaComponent | null = null;
	private downloadLink: HTMLAnchorElement | null = null;

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
			this.selectedSections = new Set(sections.map((s) => s.id));
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

	/** Rewrites the copy textarea and the download link href. */
	private refreshOutput() {
		const output = this.buildOutput();
		this.outputTextarea?.setValue(output);
		if (this.downloadLink) {
			this.downloadLink.href = `data:application/json;charset=utf-8,${encodeURIComponent(
				output
			)}`;
		}
	}

	onOpen() {
		const { contentEl, modalEl } = this;

		modalEl.addClass('modal-style-settings');

		if (this.sections && this.sections.length > 0) {
			this.displaySectionPicker(contentEl);
		}

		new Setting(contentEl)
			.setName(`${t('Export settings for:')} ${this.section}`)
			.then((setting) => {
				// Build a copy to clipboard link
				setting.controlEl.createEl(
					'a',
					{
						cls: 'style-settings-copy',
						text: t('Copy to clipboard'),
						href: '#',
					},
					(copyButton) => {
						this.outputTextarea = new TextAreaComponent(contentEl)
							.setValue(this.buildOutput())
							.then((textarea) => {
								copyButton.addEventListener('click', (e) => {
									e.preventDefault();

									// Select the textarea contents and copy them to the clipboard
									textarea.inputEl.select();
									textarea.inputEl.setSelectionRange(0, 99999);
									document.execCommand('copy');

									copyButton.addClass('success');

									setTimeout(() => {
										// If the button is still in the dom, remove the success class
										if (copyButton.parentNode) {
											copyButton.removeClass('success');
										}
									}, 2000);
								});
							});
					}
				);

				// Build a download link
				this.downloadLink = setting.controlEl.createEl('a', {
					cls: 'style-settings-download',
					text: t('Download'),
					attr: {
						download: 'style-settings.json',
						href: `data:application/json;charset=utf-8,${encodeURIComponent(
							this.buildOutput()
						)}`,
					},
				});
			});
	}

	/**
	 * Renders the section checkbox list (all checked by default) plus a
	 * check/uncheck-all toggle; changes refresh the export payload.
	 */
	private displaySectionPicker(contentEl: HTMLElement) {
		const listSetting = new Setting(contentEl).setName(t('Sections'));

		const listEl = listSetting.controlEl.createDiv(
			'style-settings-export-sections'
		);
		const checkboxInputs: HTMLInputElement[] = [];

		for (const section of this.sections ?? []) {
			const row = listEl.createDiv('style-settings-export-section');
			const label = row.createEl('label');
			const checkbox = label.createEl('input', { type: 'checkbox' });
			checkbox.checked = true;
			checkbox.addEventListener('change', () => {
				if (checkbox.checked) {
					this.selectedSections.add(section.id);
				} else {
					this.selectedSections.delete(section.id);
				}
				this.refreshOutput();
			});
			label.createSpan({ text: section.name });
			checkboxInputs.push(checkbox);
		}

		// Check/uncheck-all convenience toggle
		const toggleAll = listSetting.controlEl.createEl('a', {
			cls: 'style-settings-export-toggle-all',
			text: t('Uncheck all'),
			href: '#',
		});
		let allChecked = true;
		toggleAll.addEventListener('click', (e) => {
			e.preventDefault();
			allChecked = !allChecked;
			for (const input of checkboxInputs) {
				input.checked = allChecked;
			}
			this.selectedSections = allChecked
				? new Set((this.sections ?? []).map((s) => s.id))
				: new Set();
			this.refreshOutput();
			toggleAll.setText(allChecked ? t('Uncheck all') : t('Check all'));
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
