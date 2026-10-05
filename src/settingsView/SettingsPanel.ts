import CSSSettingsPlugin from '../main';
import { SettingsMarkup } from './SettingsMarkup';
import { SnippetInfo } from '../AppearanceManager';
import { t } from '../lang/helpers';
import { ParsedCSSSettings } from '../SettingHandlers';
import { ErrorList } from '../Utils';
import { App, Component, Notice, Platform, Setting } from 'obsidian';

type TabKey = 'settings' | 'snippets';

/**
 * Style Tuner 的完整界面：工具栏（搜索 / 外观控件 / 导入导出）+ 标签页
 * （样式设置 / CSS 片段）+ 标签内容。
 *
 * 独立视图（SettingsView，独立标签页）与插件设置标签页（CSSSettingsTab，
 * 设置 → 第三方插件 → Style Tuner）共用这一份实现，两处的组件与功能因此
 * 始终保持一致；差异只在于 `isView`（颜色选择器的挂载容器）。
 */
export class SettingsPanel extends Component {
	app: App;
	plugin: CSSSettingsPlugin;
	containerEl: HTMLElement;
	/**
	 * 是否为独立视图模式。仅影响颜色选择器的挂载容器
	 * （独立视图挂到 body，避免被视图内容区裁剪；见 getPickrSettings）。
	 */
	isView: boolean;

	settingsMarkup: SettingsMarkup | null = null;
	settings: ParsedCSSSettings[];
	errorList: ErrorList;

	private toolbarEl: HTMLElement;
	private tabsEl: HTMLElement;
	private tabSettingsEl: HTMLElement;
	private tabSnippetsEl: HTMLElement;
	private navItemEls: Record<TabKey, HTMLElement>;
	/** 片段列表刷新序号：并发刷新时丢弃过期结果（见 renderSnippets） */
	private snippetsGeneration = 0;

	constructor(
		app: App,
		plugin: CSSSettingsPlugin,
		containerEl: HTMLElement,
		isView: boolean
	) {
		super();
		this.app = app;
		this.plugin = plugin;
		this.containerEl = containerEl;
		this.isView = isView;
	}

	onload(): void {
		const { containerEl } = this;
		containerEl.empty();

		// 供 CSS 定位用（设置页里为滚动条预留 gutter 的 :has() 钩子）
		containerEl.addClass('style-settings-panel');

		// ---- 工具栏：搜索框 + 外观控件 + 导入导出（标签栏上方，脱离页面内容）----
		this.toolbarEl = containerEl.createDiv({
			cls: 'style-settings-toolbar',
		});

		// ---- 标签页导航 ----
		this.tabsEl = containerEl.createDiv({ cls: 'style-settings-nav' });
		this.navItemEls = {
			settings: this.buildNavItem(t('Style Settings'), 'settings'),
			snippets: this.buildNavItem(t('CSS Snippets'), 'snippets'),
		};

		// ---- 标签页内容 ----
		this.tabSettingsEl = containerEl.createDiv({
			cls: 'style-settings-tab is-active',
			attr: { 'data-tab': 'settings' },
		});
		this.tabSnippetsEl = containerEl.createDiv({
			cls: 'style-settings-tab',
			attr: { 'data-tab': 'snippets' },
		});

		this.settingsMarkup = this.addChild(
			new SettingsMarkup(
				this.app,
				this.plugin,
				this.tabSettingsEl,
				this.isView,
				this.toolbarEl
			)
		);

		// 惰性挂载（例如重启后恢复的非活动标签页、或设置页在数据到达前打开）
		// 时没有收到 setSettings，主动拉取一次当前数据。
		if (!this.settings && this.plugin.settingsList) {
			this.settings = this.plugin.settingsList;
			this.errorList = this.plugin.errorList;
		}
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

	rerender(): void {
		this.settingsMarkup?.rerender();
	}

	setSettings(settings: ParsedCSSSettings[], errorList: ErrorList): void {
		this.settings = settings;
		this.errorList = errorList;
		if (this.settingsMarkup) {
			this.settingsMarkup.setSettings(settings, errorList);
		}
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
		const generation = ++this.snippetsGeneration;

		let snippets: SnippetInfo[];
		try {
			snippets = await this.plugin.appearanceManager.getSnippets();
		} catch (e) {
			console.error('Style Tuner | Failed to load CSS snippets', e);
			snippets = [];
		}

		// 读取期间可能又被刷新了一次（切换标签页 / css-change）。
		// 过期的这次不能再写 DOM：两次渲染会先后往同一个容器里追加，
		// 片段列表就会被重复渲染出来。只让最新一次刷新提交。
		if (generation !== this.snippetsGeneration) return;

		// 数据到手后再整体替换，容器不会在等待期间处于空状态
		// （空容器会让 switchTab 的 hasChildNodes() 误判为「尚未渲染」而再刷新一次）。
		tabSnippetsEl.empty();

		const header = new Setting(tabSnippetsEl).setName(
			t('{{count}} CSS snippets').replace('{{count}}', String(snippets.length))
		);

		// 打开片段文件夹 / 刷新：lucide 图标按钮（与工具栏的导入导出按钮同款
		// clickable-icon），动作说明放 tooltip。
		// 移动端没有系统文件管理器可打开，打开文件夹仅在桌面端提供。
		if (Platform.isDesktopApp) {
			header.addExtraButton((button) =>
				button
					.setIcon('folder-open')
					.setTooltip(t('Open snippets folder'))
					.onClick(() => void this.openSnippetsFolder())
			);
		}

		header.addExtraButton((button) =>
			button
				.setIcon('refresh-cw')
				.setTooltip(t('Refresh'))
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
			new Setting(tabSnippetsEl).setName(snippet.name).addToggle((toggle) => {
				toggle.setValue(snippet.enabled);
				toggle.onChange(async (value) => {
					try {
						await this.plugin.appearanceManager.setSnippetEnabled(
							snippet.name,
							value
						);
					} catch (e) {
						console.error('Style Tuner | Failed to toggle CSS snippet', e);
						new Notice(t('Failed to change appearance'));
						toggle.setValue(!value);
					}
				});
			});
		}
	}

	/** 在系统文件管理器中打开 snippets 目录 */
	private async openSnippetsFolder(): Promise<void> {
		try {
			await this.plugin.appearanceManager.openSnippetsFolder();
		} catch (e) {
			console.error('Style Tuner | Failed to open the snippets folder', e);
			new Notice(t('Failed to open the snippets folder'));
		}
	}
}
