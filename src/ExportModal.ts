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
	 * Sections whose source is disabled are grouped and badged.
	 */
	private displaySectionPicker(contentEl: HTMLElement) {
		const sections = this.sections ?? [];
		const listSetting = new Setting(contentEl)
			.setName(t('Sections'))
			.setDesc(
				t('Only checked sections are included in the exported configuration.')
			);

		const wrapperEl = listSetting.controlEl.createDiv(
			'style-settings-export-sections'
		);

		const checkboxInputs: HTMLInputElement[] = [];
		let allChecked = true;

		const addRow = (section: ExportSectionOption) => {
			const row = wrapperEl.createDiv('style-settings-export-section');
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

		// Toolbar: check/uncheck-all toggle plus a live selection summary.
		const toggleAll = wrapperEl.createDiv('style-settings-export-toggle');
		const toggleAllLink = toggleAll.createEl('a', {
			cls: 'style-settings-export-toggle-all',
			text: t('Uncheck all'),
			href: '#',
		});
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
			toggleAllLink.setText(allChecked ? t('Uncheck all') : t('Check all'));
		};

		toggleAllLink.addEventListener('click', (e) => {
			e.preventDefault();
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
