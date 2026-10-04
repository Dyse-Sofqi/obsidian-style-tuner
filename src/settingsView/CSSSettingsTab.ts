import CSSSettingsPlugin from '../main';
import { SettingsPanel } from './SettingsPanel';
import { App, PluginSettingTab } from 'obsidian';
import { ParsedCSSSettings } from 'src/SettingHandlers';
import { ErrorList } from 'src/Utils';

/**
 * 插件设置标签页（设置 → 第三方插件 → Style Tuner）。
 * 与独立视图共用 SettingsPanel，因此工具栏（搜索 / 颜色模式 / 主题 /
 * 导入导出）与「样式设置 / CSS 片段」标签页两处完全一致。
 */
export class CSSSettingsTab extends PluginSettingTab {
	plugin: CSSSettingsPlugin;
	panel: SettingsPanel | null = null;
	settings: ParsedCSSSettings[];
	errorList: ErrorList;

	constructor(app: App, plugin: CSSSettingsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	rerender() {
		this.panel?.rerender();
	}

	setSettings(settings: ParsedCSSSettings[], errorList: ErrorList) {
		this.settings = settings;
		this.errorList = errorList;
		this.panel?.setSettings(settings, errorList);
	}

	display(): void {
		// display 可能在未配对 hide 的情况下被再次调用，先清掉旧面板
		this.hide();

		this.panel = this.plugin.addChild(
			new SettingsPanel(this.app, this.plugin, this.containerEl, false)
		);

		if (this.settings) {
			this.panel.setSettings(this.settings, this.errorList);
		}
	}

	hide(): void {
		if (this.panel) {
			this.plugin.removeChild(this.panel);
			this.panel = null;
		}
	}
}
