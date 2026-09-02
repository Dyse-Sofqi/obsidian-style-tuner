import { CSSSetting, ParsedCSSSettings } from '../SettingHandlers';
import { ErrorList } from '../Utils';
import { t } from '../lang/helpers';
import { ExportSectionOption } from '../ExportModal';
import { ThemeInfo, ThemeMode } from '../AppearanceManager';
import CSSSettingsPlugin from '../main';
import {
	buildSettingComponentTree,
	HeadingSettingComponent,
} from './SettingComponents/HeadingSettingComponent';
import {
	App,
	Component,
	DropdownComponent,
	Notice,
	Setting,
	debounce,
	setIcon,
} from 'obsidian';

export class SettingsMarkup extends Component {
	app: App;
	plugin: CSSSettingsPlugin;
	settingsComponentTrees: HeadingSettingComponent[] = [];
	filterString: string = '';
	settings: ParsedCSSSettings[] = [];
	errorList: ErrorList = [];
	containerEl: HTMLElement;
	settingsContainerEl: HTMLElement;
	isView: boolean;
	/**
	 * 视图级工具栏容器（搜索框 + 外观控件 + 导入导出）：
	 * 独立视图模式下由 SettingsView 提供（标签栏上方、脱离页面内容区）；
	 * 插件设置标签页模式为 null，工具栏渲染到内容区顶部。
	 */
	toolbarEl: HTMLElement | null = null;
	/** 工具栏中的外观控件挂载点（颜色模式 / 主题下拉），仅视图模式存在 */
	appearanceControlsEl: HTMLElement | null = null;
	/** 刷新序号：并发刷新时丢弃过期结果 */
	private controlsGeneration = 0;

	constructor(
		app: App,
		plugin: CSSSettingsPlugin,
		containerEl: HTMLElement,
		isView?: boolean,
		toolbarEl?: HTMLElement | null
	) {
		super();
		this.app = app;
		this.plugin = plugin;
		this.containerEl = containerEl;
		this.isView = !!isView;
		this.toolbarEl = toolbarEl ?? null;
	}

	onload(): void {
		this.display();
	}

	onunload(): void {
		this.settingsComponentTrees = [];
	}

	display(): void {
		this.generate(this.settings);
	}

	/**
	 * Builds the export section list: every currently parsed section plus
	 * sections that only exist as stored data (their theme/snippet/plugin
	 * is disabled) and carry meaningful customizations, so leftover
	 * customizations stay exportable. Orphaned sections are only listed
	 * when they actually hold stored keys; empty orphans never appear.
	 */
	private getExportSections(): ExportSectionOption[] {
		const stored = this.plugin.settingsManager.settings;
		const counts: Record<string, number> = {};

		for (const key of Object.keys(stored)) {
			const sectionId = key.split('@@')[0];
			if (!sectionId) continue;
			counts[sectionId] = (counts[sectionId] ?? 0) + 1;
		}

		const parsedIds = new Set(this.settings.map((s) => s.id));
		const sections: ExportSectionOption[] = this.settings.map((s) => ({
			id: s.id,
			name: s.name,
			count: counts[s.id] ?? 0,
		}));

		for (const sectionId of Object.keys(counts).sort()) {
			// Only orphaned sections with at least one stored key are
			// worth offering for export; empty leftovers are skipped.
			if (!parsedIds.has(sectionId) && (counts[sectionId] ?? 0) > 0) {
				sections.push({
					id: sectionId,
					name: sectionId,
					orphaned: true,
					count: counts[sectionId],
				});
			}
		}

		return sections;
	}

	removeChildren() {
		for (const settingsComponentTree of this.settingsComponentTrees) {
			this.removeChild(settingsComponentTree);
		}
	}

	// ------------------------------------------------------------------
	// Appearance controls (standalone view toolbar)
	// ------------------------------------------------------------------

	/**
	 * Rebuild the toolbar dropdowns: color mode (system / light / dark) and
	 * CSS theme (default + installed themes). Current values are re-read
	 * asynchronously then applied, with a generation guard against races.
	 */
	async refreshAppearanceControls(): Promise<void> {
		const el = this.appearanceControlsEl;
		if (!el) return;
		const generation = ++this.controlsGeneration;
		const manager = this.plugin.appearanceManager;

		const [mode, themes, currentTheme] = await Promise.all([
			manager.getThemeMode(),
			manager.getThemes(),
			manager.getCurrentTheme(),
		]);
		if (generation !== this.controlsGeneration) return;
		// 容器可能已被下一次 generate 清空并替换（重渲染），丢弃过期渲染
		if (!el.isConnected) return;

		el.empty();
		this.renderModeDropdown(el, mode);
		this.renderThemeDropdown(el, themes, currentTheme);
	}

	private renderModeDropdown(el: HTMLElement, mode: ThemeMode): void {
		const item = el.createDiv({ cls: 'style-settings-appearance-item' });
		item.createSpan({
			cls: 'style-settings-appearance-label',
			text: t('Color mode'),
		});
		new DropdownComponent(item.createDiv())
			.addOption('system', t('System'))
			.addOption('light', t('Light'))
			.addOption('dark', t('Dark'))
			.setValue(mode)
			.onChange((value) => {
				void this.changeThemeMode(value as ThemeMode);
			});
	}

	private renderThemeDropdown(
		el: HTMLElement,
		themes: ThemeInfo[],
		currentTheme: string
	): void {
		const item = el.createDiv({ cls: 'style-settings-appearance-item' });
		item.createSpan({
			cls: 'style-settings-appearance-label',
			text: t('Theme'),
		});
		const dropdown = new DropdownComponent(item.createDiv());
		dropdown.addOption('', t('Default theme'));
		for (const theme of themes) {
			dropdown.addOption(theme.name, theme.displayName);
		}
		dropdown.setValue(currentTheme).onChange((value) => {
			void this.changeTheme(value);
		});
	}

	private async changeThemeMode(mode: ThemeMode): Promise<void> {
		try {
			await this.plugin.appearanceManager.setThemeMode(mode);
		} catch (e) {
			console.error('Style Tuner | Failed to change color mode', e);
			new Notice(t('Failed to change appearance'));
		}
		void this.refreshAppearanceControls();
	}

	private async changeTheme(theme: string): Promise<void> {
		try {
			await this.plugin.appearanceManager.setTheme(theme);
			// 主题启用/停用了不同的 CSS 定义，立即重新解析样式设置
			this.plugin.parseCSS();
		} catch (e) {
			console.error('Style Tuner | Failed to change theme', e);
			new Notice(t('Failed to change appearance'));
		}
		void this.refreshAppearanceControls();
	}

	/**
	 * Recursively destroys all setting elements.
	 */
	cleanup() {
		this.removeChildren();
		this.settingsContainerEl?.empty();
	}

	setSettings(settings: ParsedCSSSettings[], errorList: ErrorList) {
		this.settings = settings;
		this.errorList = errorList;

		if (this.containerEl.parentNode) {
			this.generate(settings);
		}
	}

	displayErrors() {
		const { containerEl, errorList } = this;

		errorList.forEach((err) => {
			containerEl.createDiv({ cls: 'style-settings-error' }, (wrapper) => {
				wrapper.createDiv({
					cls: 'style-settings-error-name',
					text: `${t('Error:')} ${err.name}`,
				});
				wrapper.createDiv({
					cls: 'style-settings-error-desc',
					text: err.error,
				});
			});
		});
	}

	displayEmpty() {
		const { containerEl } = this;

		containerEl.createDiv({ cls: 'style-settings-empty' }, (wrapper) => {
			wrapper.createDiv({
				cls: 'style-settings-empty-name',
				text: t('No style settings found'),
			});
			wrapper.createDiv({ cls: 'style-settings-empty-desc' }).appendChild(
				createFragment((frag) => {
					frag.appendText(
						t(
							'Style settings configured by theme and plugin authors will show up here. You can also create your own configuration by creating a CSS snippet in your vault. '
						)
					);
					frag.createEl('a', {
						text: t('Click here for details and examples.'),
						href: 'https://github.com/mgmeyers/obsidian-style-settings#obsidian-style-settings-plugin',
					});
				})
			);
		});
	}

	generate(settings: ParsedCSSSettings[]) {
		const { containerEl, plugin } = this;

		containerEl.empty();

		this.cleanup();
		this.displayErrors();

		// 工具栏（搜索框 + 外观控件 + 导入导出）先渲染：
		// 独立视图模式挂到标签栏上方的视图级容器；设置标签页模式保持内容区顶部。
		// 注意在空状态检查之前渲染，保证无样式设置时工具栏仍可见。
		this.renderToolbar();

		if (settings.length === 0) {
			return this.displayEmpty();
		}

		this.settingsContainerEl = containerEl.createDiv();
		this.settingsComponentTrees = [];

		for (const s of settings) {
			const options: CSSSetting[] = [
				{
					id: s.id,
					type: 'heading',
					title: s.name,
					level: 0,
					collapsed: s.collapsed ?? true,
					resetFn: () => {
						plugin.settingsManager.clearSection(s.id);
						this.rerender();
					},
				},
				...s.settings,
			];

			try {
				const settingsComponentTree = buildSettingComponentTree({
					containerEl: this.settingsContainerEl,
					isView: this.isView,
					sectionId: s.id,
					sectionName: s.name,
					settings: options,
					settingsManager: plugin.settingsManager,
				});

				this.addChild(settingsComponentTree);
				this.settingsComponentTrees.push(settingsComponentTree);
			} catch (e) {
				console.error('Style Tuner | Failed to render section', e);
			}
		}
	}

	/**
	 * Renders the toolbar row: search bar, appearance controls (color mode /
	 * theme dropdowns) and the import/export buttons, in that order.
	 * Standalone view: the toolbar lives above the tab bar (view-level);
	 * plugin settings tab: the toolbar renders at the top of the content area.
	 */
	private renderToolbar(): void {
		const container = this.toolbarEl ?? this.containerEl;
		container.empty();

		new Setting(container).then((setting) => {
			// Appearance controls mount point (color mode / theme dropdowns),
			// rendered between the search bar and the import/export buttons.
			// Standalone view only: the plugin settings tab keeps the original layout.
			if (this.isView) {
				this.appearanceControlsEl = setting.controlEl.createDiv({
					cls: 'style-settings-appearance-controls',
				});
			}

			// Import: Obsidian-native icon button opening the import modal
			setting.controlEl.createEl(
				'button',
				{
					cls: 'clickable-icon style-settings-import',
					attr: { 'aria-label': t('Import') },
				},
				(el) => {
					setIcon(el, 'upload');
					el.addEventListener('click', () => {
						this.plugin.settingsManager.import();
					});
				}
			);

			// Export: Obsidian-native icon button opening the export modal
			setting.controlEl.createEl(
				'button',
				{
					cls: 'clickable-icon style-settings-export',
					attr: { 'aria-label': t('Export') },
				},
				(el) => {
					setIcon(el, 'download');
					el.addEventListener('click', () => {
						this.plugin.settingsManager.export(
							t('All settings'),
							this.plugin.settingsManager.settings,
							// Per-section picker: export only checked sections
							this.getExportSections()
						);
					});
				}
			);

			// Searchbar
			setting.addSearch((searchComponent) => {
				searchComponent.setValue(this.filterString);
				searchComponent.onChange(
					debounce(
						(value) => {
							this.filterString = value;
							if (value) {
								this.filter();
							} else {
								this.clearFilter();
							}
						},
						250,
						true
					)
				);
				searchComponent.setPlaceholder(t('Search Style Tuner...'));
				// move the search component from the back to the front
				if (setting.controlEl.lastChild) {
					setting.nameEl.appendChild(setting.controlEl.lastChild);
				}
			});

			// Mount point is ready now: first render of the appearance dropdowns
			if (this.isView) {
				void this.refreshAppearanceControls();
			}
		});
	}

	/**
	 * Recursively filter all setting elements based on `filterString` and then re-renders.
	 */
	filter() {
		for (const settingsComponentTree of this.settingsComponentTrees) {
			settingsComponentTree.filter(this.filterString);
		}
	}

	/**
	 * Recursively clears the filter and then re-renders.
	 */
	clearFilter() {
		for (const settingsComponentTree of this.settingsComponentTrees) {
			settingsComponentTree.clearFilter();
		}
	}

	rerender() {
		this.cleanup();
		this.display();
	}
}
