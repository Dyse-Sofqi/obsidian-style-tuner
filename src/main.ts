import { ClassToggle, CSSSetting, ParsedCSSSettings } from './SettingHandlers';
import { CSSSettingsManager } from './SettingsManager';
import {
	ErrorList,
	escapeHtml,
	getDescription,
	getTitle,
	getVariableName,
	nameRegExp,
	settingRegExp,
	SettingsSeachResource,
} from './Utils';
import {
	validateAndNormalizeSetting,
	ValidationWarning,
} from './SettingsValidation';
import './css/pickerOverrides.css';
import './css/settings.css';
import './css/beautify.css';
import { t } from './lang/helpers';
import { CSSSettingsTab } from './settingsView/CSSSettingsTab';
import { SettingType } from './settingsView/SettingComponents/types';
import { SettingsView, viewType } from './settingsView/SettingsView';
import '@simonwep/pickr/dist/themes/nano.min.css';
import detectIndent from 'detect-indent';
import yaml from 'js-yaml';
import { AppearanceManager } from './AppearanceManager';
import LinterPlugin from './linter/main';
import { Command, Plugin } from 'obsidian';

export default class CSSSettingsPlugin extends Plugin {
	settingsManager: CSSSettingsManager;
	appearanceManager: AppearanceManager;
	settingsTab: CSSSettingsTab;
	// obsidian-linter (MIT, see src/linter/LICENSE) hosted inside this plugin
	linter: LinterPlugin;
	settingsList: ParsedCSSSettings[] = [];
	errorList: ErrorList = [];
	commandList: Command[] = [];
	lightEl: HTMLElement;
	darkEl: HTMLElement;

	async onload() {
		this.settingsManager = new CSSSettingsManager(this);
		this.appearanceManager = new AppearanceManager(this.app);

		await this.settingsManager.load();

		this.settingsTab = new CSSSettingsTab(this.app, this);

		this.addSettingTab(this.settingsTab);

		this.registerView(viewType, (leaf) => new SettingsView(this, leaf));

		this.addCommand({
			// 命令 id 不带插件 id：Obsidian 已经用插件 id 做命名空间
			// （插件审核规范 obsidianmd/commands/no-plugin-id-in-command-id）
			id: 'show-view',
			name: t('Show Style Tuner view'),
			callback: () => {
				this.activateView();
			},
		});

		// 左功能区按钮。左功能区是**按注册先后**自上而下追加的，所以这里的调用
		// 顺序就是图标从上到下的顺序：重新加载 → 切换深浅色 → 打开 Style Tuner 视图。
		// 三个按钮都经命令系统派发（而不是各自直接实现一遍），与命令保持同一份行为。
		this.addRibbonIcon('refresh-ccw', t('Reload Obsidian'), () => {
			// Obsidian 内置命令，id 自带 `app:` 命名空间
			this.dispatchCommand('app:reload');
		});

		this.addRibbonIcon('eclipse', t('Toggle light/dark mode'), () => {
			// 内置命令的 id 是 `theme:toggle-light-dark`（不是 toggle-theme）
			this.dispatchCommand('theme:toggle-light-dark');
		});

		this.addRibbonIcon('paintbrush', t('Show Style Tuner view'), () => {
			// 本插件自己注册的命令：`show-view` 由 Obsidian 在前面补插件 id；
			// 派发不出去（拿不到命令系统）时退回直接打开视图，功能不受影响。
			if (!this.dispatchCommand(`${this.manifest.id}:show-view`)) {
				this.activateView();
			}
		});

		this.registerEvent(
			(this.app.workspace as any).on(
				'css-change',
				(data?: { source: string }) => {
					if (data?.source !== 'style-settings') {
						this.parseCSS();
					}
				}
			)
		);

		this.registerEvent(
			(this.app.workspace as any).on('parse-style-settings', () => {
				this.parseCSS();
			})
		);

		this.lightEl = document.body.createDiv('theme-light style-settings-ref');
		this.darkEl = document.body.createDiv('theme-dark style-settings-ref');

		document.body.classList.add('css-settings-manager');

		this.parseCSS();

		// obsidian-linter core (MIT by Victor Tao, see src/linter/LICENSE) is
		// hosted inside this plugin: commands, events, its settings tab and the
		// diff preview view are all registered through this plugin instance.
		this.linter = new LinterPlugin(this);
		await this.linter.onload();

		this.app.workspace.onLayoutReady(() => {
			if (this.settingsList) {
				this.app.workspace.getLeavesOfType(viewType).forEach((leaf) => {
					// Restored leaves may still hold a placeholder view until
					// they are mounted; only push data to real views.
					if (leaf.view instanceof SettingsView) {
						leaf.view.setSettings(this.settingsList, this.errorList);
					}
				});
			}
		});
	}

	getCSSVar(id: string) {
		const light = getComputedStyle(this.lightEl).getPropertyValue(`--${id}`);
		const dark = getComputedStyle(this.darkEl).getPropertyValue(`--${id}`);
		const current = getComputedStyle(document.body).getPropertyValue(`--${id}`);
		return { light, dark, current };
	}

	debounceTimer = 0;

	parseCSS() {
		window.clearTimeout(this.debounceTimer);
		this.debounceTimer = window.setTimeout(() => {
			this.settingsList = [];
			this.errorList = [];

			// remove registered theme commands (sadly undocumented API)
			for (const command of this.commandList) {
				// @ts-ignore
				this.app.commands.removeCommand(command.id);
			}

			this.commandList = [];
			this.settingsManager.removeClasses();

			const styleSheets = document.styleSheets;

			for (let i = 0, len = styleSheets.length; i < len; i++) {
				const sheet = styleSheets.item(i);
				if (!sheet) continue;
				this.parseCSSStyleSheet(sheet);
			}

			// compatability with Settings Search Plugin
			this.registerSettingsToSettingsSearch();

			this.settingsTab.setSettings(this.settingsList, this.errorList);
			this.app.workspace.getLeavesOfType(viewType).forEach((leaf) => {
				if (leaf.view instanceof SettingsView) {
					leaf.view.setSettings(this.settingsList, this.errorList);
				}
			});
			this.settingsManager.setConfig(this.settingsList);
			this.settingsManager.initClasses();
			this.registerSettingCommands();
		}, 100);
	}

	/**
	 * Registers the current settings to the settings search plugin.
	 * It also unregisters the old settings.
	 *
	 * @private
	 */
	private registerSettingsToSettingsSearch() {
		const onSettingsSearchLoaded = () => {
			if ((window as any).SettingsSearch) {
				const settingsSearch: any = (window as any).SettingsSearch;

				settingsSearch.removeTabResources('obsidian-style-settings');
				settingsSearch.removeTabResources('obsidian-style-tuner');
				settingsSearch.removeTabResources('style-tuner');

				for (const parsedCSSSetting of this.settingsList) {
					settingsSearch.addResources(
						...parsedCSSSetting.settings.map((x) => {
							// Settings Search 的 fuzzy 匹配同时比对 text 与
							// desc，把 CSS 变量名追加到描述里，按
							// `--ribbon-padding` 搜索也能命中。该插件把
							// desc 按 innerHTML 渲染，故变量名做 HTML 转义。
							const variableName = getVariableName(x);
							const description = getDescription(x) ?? '';
							const variableHint = variableName
								? `<code>${escapeHtml(variableName)}</code>`
								: '';

							const settingsSearchResource: SettingsSeachResource =
								{
									tab: 'style-tuner',
									name: 'Style Tuner',
									text: getTitle(x) ?? '',
									desc:
										description +
										(description && variableHint ? ' ' : '') +
										variableHint,
								};
							return settingsSearchResource;
						})
					);
				}
			}
		};

		// @ts-ignore TODO: expand obsidian types, so that the ts-ignore is not needed
		if (this.app.plugins.plugins['settings-search']?.loaded) {
			onSettingsSearchLoaded();
		} else {
			// @ts-ignore
			this.app.workspace.on('settings-search-loaded', () => {
				onSettingsSearchLoaded();
			});
		}
	}

	/**
	 * Remove any settings from settings search if settings search is loaded.
	 *
	 * @private
	 */
	private unregisterSettingsFromSettingsSearch() {
		// @ts-ignore TODO: expand obsidian types, so that the ts-ignore is not needed
		if (this.app.plugins.plugins['settings-search']?.loaded) {
			// @ts-ignore
			window.SettingsSearch.removeTabResources('obsidian-style-settings');
			// @ts-ignore
			window.SettingsSearch.removeTabResources('obsidian-style-tuner');
			// @ts-ignore
			window.SettingsSearch.removeTabResources('style-tuner');
		}
	}

	/**
	 * Parses the settings from a css style sheet.
	 * Adds the parsed settings to `settingsList` and any errors to `errorList`.
	 *
	 * @param sheet the stylesheet to parse
	 * @private
	 */
	private parseCSSStyleSheet(sheet: CSSStyleSheet): void {
		const text = sheet?.ownerNode?.textContent?.trim();
		if (!text) return;

		let match = settingRegExp.exec(text);

		if (match?.length) {
			do {
				const nameMatch = text.match(nameRegExp);
				if (!nameMatch) continue;

				const name = nameMatch[1];

				try {
					const str = match[1].trim();
				const result = this.parseCSSSettings(str, name);

				if (result && result.parsed) {
					const { parsed, warnings } = result;
					if (
						parsed.name &&
						parsed.id &&
						parsed.settings &&
						parsed.settings.length
					) {
						this.settingsList.push(parsed);
						for (const warning of warnings) {
							this.errorList.push({
								name,
								error: `[${warning.code}] ${warning.message}`,
							});
						}
					}
				}
			} catch (e) {
				this.errorList.push({ name, error: `${e}` });
			}
			} while ((match = settingRegExp.exec(text)) !== null);
		}
	}

	/**
	 * Parse css settings from a string.
	 *
	 * @param str the stringified settings to parse
	 * @param name the name of the file
	 * @private
	 */
	private parseCSSSettings(
		str: string,
		name: string
	): { parsed: ParsedCSSSettings; warnings: ValidationWarning[] } | undefined {
		const indent = detectIndent(str);

		const settings: ParsedCSSSettings = yaml.load(
			str.replace(/\t/g, indent.type === 'space' ? indent.indent : '    '),
			{
				filename: name,
			}
		) as ParsedCSSSettings;

		if (!settings.settings) return undefined;

		settings.settings = settings.settings.filter((setting) => setting);

		const validatedSettings: CSSSetting[] = [];
		const warnings: ValidationWarning[] = [];

		for (const setting of settings.settings) {
			const result = validateAndNormalizeSetting(setting);
			validatedSettings.push(result.setting);
			warnings.push(...result.warnings);
		}

		settings.settings = validatedSettings;
		return { parsed: settings, warnings };
	}

	private registerSettingCommands(): void {
		for (const section of this.settingsList) {
			for (const setting of section.settings) {
				if (
					setting.type === SettingType.CLASS_TOGGLE &&
					(setting as ClassToggle).addCommand
				) {
					this.addClassToggleCommand(section, setting as ClassToggle);
				}
			}
		}
	}

	private addClassToggleCommand(
		section: ParsedCSSSettings,
		setting: ClassToggle
	): void {
		this.commandList.push(
			this.addCommand({
				id: `style-settings-class-toggle-${section.id}-${setting.id}`,
				name: `Toggle ${setting.title}`,
				callback: () => {
					const value = !(this.settingsManager.getSetting(
						section.id,
						setting.id
					) as boolean);
					this.settingsManager.setSetting(section.id, setting.id, value);
					this.settingsTab.rerender();
					for (const leaf of this.app.workspace.getLeavesOfType(viewType)) {
						if (leaf.view instanceof SettingsView) {
							leaf.view.rerender();
						}
					}
				},
			})
		);
	}

	onunload() {
		this.linter?.onunload();

		this.lightEl.remove();
		this.darkEl.remove();

		document.body.classList.remove('css-settings-manager');

		this.settingsManager.cleanup();
		// 不在这里 detachLeavesOfType：onunload 里摘叶子会把用户的工作区布局
		// 一起重置（插件审核规范 obsidianmd/detach-leaves），插件卸载时
		// Obsidian 会自行清理本插件注册的视图叶子。
		this.unregisterSettingsFromSettingsSearch();
	}

	/**
	 * 通过 Obsidian 的命令系统派发一条命令，返回是否真的派发出去。
	 * `id` 必须是**带命名空间的完整 id**（`app:reload`、`theme:toggle-light-dark`、
	 * `style-tuner:show-view`）——Obsidian 只给插件自己 `addCommand` 注册的命令补前缀。
	 *
	 * `app.commands` 与 `executeCommandById` 都不在公开的 `obsidian.d.ts` 里
	 * → 按项目约定 `as` 收窄 + 能力探测，调用方据此决定回退。
	 */
	private dispatchCommand(id: string): boolean {
		const commands = (this.app as any).commands;
		if (typeof commands?.executeCommandById !== 'function') {
			return false;
		}
		commands.executeCommandById(id);
		return true;
	}

	deactivateView() {
		this.app.workspace.detachLeavesOfType(viewType);
	}

	async activateView() {
		this.deactivateView();
		const leaf = this.app.workspace.getLeaf('tab');

		await leaf.setViewState({
			type: viewType,
			active: true,
		});

		(leaf.view as SettingsView).setSettings(this.settingsList, this.errorList);
	}
}
