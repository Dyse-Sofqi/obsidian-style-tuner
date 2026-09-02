import CSSSettingsPlugin from '../main';
import { SettingsMarkup } from './SettingsMarkup';
import { SnippetInfo } from '../AppearanceManager';
import { t } from '../lang/helpers';
import { ItemView, Notice, Setting, WorkspaceLeaf } from 'obsidian';
import { ParsedCSSSettings } from '../SettingHandlers';
import { ErrorList } from '../Utils';

export const viewType = 'style-settings';

type TabKey = 'settings' | 'snippets';

export class SettingsView extends ItemView {
	settingsMarkup: SettingsMarkup | null;
	plugin: CSSSettingsPlugin;
	settings: ParsedCSSSettings[];
	errorList: ErrorList;

	private tabsEl: HTMLElement;
	private tabSettingsEl: HTMLElement;
	private tabSnippetsEl: HTMLElement;
	private navItemEls: Record<TabKey, HTMLElement>;

	constructor(plugin: CSSSettingsPlugin, leaf: WorkspaceLeaf) {
		super(leaf);
		this.plugin = plugin;
	}

	rerender() {
		this.settingsMarkup?.rerender();
	}

	setSettings(settings: ParsedCSSSettings[], errorList: ErrorList) {
		this.settings = settings;
		this.errorList = errorList;
		if (this.settingsMarkup) {
			this.settingsMarkup.setSettings(settings, errorList);
		}
	}

	onload(): void {
		// A lazily mounted restored leaf (e.g. an inactive tab brought back
		// after a restart) never received setSettings; pull current data.
		if (!this.settings && this.plugin.settingsList) {
			this.setSettings(this.plugin.settingsList, this.plugin.errorList);
		}

		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('style-settings-view');

		// ---- 视图级工具栏：搜索框 + 外观控件 + 导入导出（标签栏上方，脱离页面内容）----
		const toolbarEl = contentEl.createDiv({
			cls: 'style-settings-toolbar',
		});

		// ---- 标签页导航 ----
		this.tabsEl = contentEl.createDiv({ cls: 'style-settings-nav' });
		this.navItemEls = {
			settings: this.buildNavItem(t('Style Settings'), 'settings'),
			snippets: this.buildNavItem(t('CSS Snippets'), 'snippets'),
		};

		// ---- 标签页内容 ----
		this.tabSettingsEl = contentEl.createDiv({
			cls: 'style-settings-tab is-active',
			attr: { 'data-tab': 'settings' },
		});
		this.tabSnippetsEl = contentEl.createDiv({
			cls: 'style-settings-tab',
			attr: { 'data-tab': 'snippets' },
		});

		this.settingsMarkup = this.addChild(
			new SettingsMarkup(
				this.plugin.app,
				this.plugin,
				this.tabSettingsEl,
				true,
				toolbarEl
			)
		);
		if (this.settings) {
			this.settingsMarkup.setSettings(this.settings, this.errorList);
		}

		// 外观设置在其他地方被修改（主题 / 片段变化）时同步工具栏与片段列表。
		// 外观下拉（颜色模式 / 主题）由 SettingsMarkup 在搜索框后渲染。
		this.registerEvent(
			(this.app.workspace as any).on('css-change', () => {
				void this.settingsMarkup?.refreshAppearanceControls();
				if (this.tabSnippetsEl.hasClass('is-active')) {
					void this.renderSnippets();
				}
			})
		);
	}

	onunload(): void {
		this.settingsMarkup = null;
	}

	getViewType() {
		return viewType;
	}

	getIcon() {
		return 'gear';
	}

	getDisplayText() {
		return 'Style Tuner';
	}

	// ------------------------------------------------------------------
	// 标签页导航
	// ------------------------------------------------------------------

	private buildNavItem(label: string, key: TabKey): HTMLElement {
		const btn = this.tabsEl.createEl('button', {
			cls: `style-settings-nav-item${key === 'settings' ? ' is-active' : ''}`,
			text: label,
		});
		btn.addEventListener('click', () => this.switchTab(key));
		return btn;
	}

	private switchTab(key: TabKey): void {
		const settingsActive = key === 'settings';
		this.tabSettingsEl.toggleClass('is-active', settingsActive);
		this.tabSnippetsEl.toggleClass('is-active', !settingsActive);
		this.navItemEls.settings.toggleClass('is-active', settingsActive);
		this.navItemEls.snippets.toggleClass('is-active', !settingsActive);

		// 首次切换到片段标签时再加载列表
		if (!settingsActive && !this.tabSnippetsEl.hasChildNodes()) {
			void this.renderSnippets();
		}
	}

	// ------------------------------------------------------------------
	// CSS 片段标签页
	// ------------------------------------------------------------------

	private async renderSnippets(): Promise<void> {
		const { tabSnippetsEl } = this;
		tabSnippetsEl.empty();

		let snippets: SnippetInfo[];
		try {
			snippets = await this.plugin.appearanceManager.getSnippets();
		} catch (e) {
			console.error('Style Tuner | Failed to load CSS snippets', e);
			snippets = [];
		}

		new Setting(tabSnippetsEl)
			.setName(
				t('{{count}} CSS snippets').replace(
					'{{count}}',
					String(snippets.length)
				)
			)
			.addButton((button) =>
				button
					.setButtonText(t('Refresh'))
					.onClick(() => void this.renderSnippets())
			);

		if (snippets.length === 0) {
			tabSnippetsEl.createDiv({ cls: 'style-settings-empty' }, (wrapper) => {
				wrapper.createDiv({
					cls: 'style-settings-empty-name',
					text: t('No CSS snippets found'),
				});
				wrapper.createDiv({
					cls: 'style-settings-empty-desc',
					text: t(
						'Add CSS files to the snippets folder of your vault to manage them here. '
					),
				});
			});
			return;
		}

		for (const snippet of snippets) {
			new Setting(tabSnippetsEl)
				.setName(snippet.name)
				.addToggle((toggle) => {
					toggle.setValue(snippet.enabled);
					toggle.onChange(async (value) => {
						try {
							await this.plugin.appearanceManager.setSnippetEnabled(
								snippet.name,
								value
							);
						} catch (e) {
							console.error(
								'Style Tuner | Failed to toggle CSS snippet',
								e
							);
							new Notice(t('Failed to change appearance'));
							toggle.setValue(!value);
						}
					});
				});
		}
	}
}
