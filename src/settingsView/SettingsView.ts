import CSSSettingsPlugin from '../main';
import { SettingsPanel } from './SettingsPanel';
import { ItemView, WorkspaceLeaf } from 'obsidian';
import { ParsedCSSSettings } from '../SettingHandlers';
import { ErrorList } from '../Utils';

export const viewType = 'style-settings';

/**
 * Style Tuner 独立标签页视图。
 * 界面本身由 SettingsPanel 提供（与插件设置标签页共用），此处只负责
 * ItemView 的生命周期与对外接口（setSettings / rerender）。
 */
export class SettingsView extends ItemView {
	plugin: CSSSettingsPlugin;
	panel: SettingsPanel | null = null;
	settings: ParsedCSSSettings[];
	errorList: ErrorList;

	constructor(plugin: CSSSettingsPlugin, leaf: WorkspaceLeaf) {
		super(leaf);
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

	onload(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('style-settings-view');

		this.panel = this.addChild(
			new SettingsPanel(this.plugin.app, this.plugin, contentEl, true)
		);

		if (this.settings) {
			this.panel.setSettings(this.settings, this.errorList);
		}
	}

	onunload(): void {
		this.panel = null;
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
}
