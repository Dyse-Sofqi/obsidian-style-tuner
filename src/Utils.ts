import { Meta, WithDescription, WithTitle } from './SettingHandlers';
import { lang, t } from './lang/helpers';
import Pickr from '@simonwep/pickr';
import { App } from 'obsidian';
import { EditorView } from '@codemirror/view';

export const settingRegExp = /\/\*!?\s*@settings[\r\n]+?([\s\S]+?)\*\//g;
export const nameRegExp = /^name:\s*(.+)$/m;
export type ErrorList = Array<{ name: string; error: string }>;

export function getTitle<T extends Meta>(config: T): string {
	if (lang) {
		return config[`title.${lang}` as keyof WithTitle] || config.title;
	}

	return config.title;
}

export function getDescription<T extends Meta>(config: T): string | undefined {
	if (lang) {
		return (
			config[`description.${lang}` as keyof WithDescription] ||
			config.description
		);
	}

	return config.description;
}

export function isValidDefaultColor(color: string) {
	return /^(#|rgb|hsl)/.test(color);
}

/**
 * Validates a saved color value before persisting or applying it.
 * Stricter than isValidDefaultColor: rejects obviously corrupt values
 * such as strings containing "NaN" that can result from a broken color picker.
 */
export function isValidSavedColor(color: string): boolean {
	if (!isValidDefaultColor(color)) return false;
	if (/NaN/i.test(color)) return false;
	return true;
}

export function getPickrSettings(opts: {
	isView: boolean;
	el: HTMLElement;
	containerEl: HTMLElement;
	swatches: string[];
	opacity: boolean | undefined;
	defaultColor: string;
}): Pickr.Options {
	const { el, isView, containerEl, swatches, opacity, defaultColor } = opts;

	return {
		el,
		container: isView ? document.body : containerEl,
		theme: 'nano',
		swatches,
		lockOpacity: !opacity,
		default: defaultColor,
		position: 'left-middle',
		components: {
			preview: true,
			hue: true,
			opacity: !!opacity,
			interaction: {
				hex: true,
				rgba: true,
				hsla: true,
				input: true,
				cancel: true,
				save: true,
			},
		},
	};
}

export function onPickrCancel(instance: Pickr) {
	instance.hide();
}

export function sanitizeText(str: string): string {
	if (str === '') {
		return `""`;
	}

	return str.replace(/[;<>]/g, '');
}

export function createDescription(
	description: string | undefined,
	def: string,
	defLabel?: string
): DocumentFragment {
	const fragment = createFragment();

	if (description) {
		fragment.appendChild(document.createTextNode(description));
	}

	if (def) {
		const small = createEl('small');
		small.appendChild(createEl('strong', { text: `${t('Default:')} ` }));
		small.appendChild(document.createTextNode(defLabel || def));

		const div = createEl('div');

		div.appendChild(small);

		fragment.appendChild(div);
	}

	return fragment;
}

/*
 * compatability with Settings Search Plugin
 */
export interface SettingsSeachResource {
	//Id of your settings tab. This is usually the ID of your plugin as defined in the manifest.
	tab: string;
	//Name of your settings tab. This is usually the name of your plugin as defined in the manifest. This is used to organize the settings under headers when searching.
	name: string;
	//The name of the setting to add.
	text: string;
	//An optional description string to add to the setting.
	desc: string;
}

let remeasureTimer: number | undefined;
const REMEASURE_DEBOUNCE_MS = 50;

/**
 * CM6 编辑器的行高度表（height map）只在自身发起的测量时刷新。
 * 本插件把 CSS 变量直接写入 <body> 内联样式（社区插件审核禁止动态
 * <style> 元素），而 body 内联样式变更不会触发 CM6 重测；若编辑器
 * 创建后变量才被应用（重启时首轮 parseCSS 的 100ms 防抖、明暗主题
 * 切换、设置变更、片段重新解析等），行高表会保持陈旧 —— 常见表现为
 * 点击光标所在行的上一行下半部分时光标无法跳到上一行（posAtCoords
 * 按陈旧高度表把点击位置映射到了错误的行）。
 *
 * 因此每次把变量/类名应用到 <body> 后，主动请求所有已打开的
 * Markdown 编辑器重新测量（防抖合并批量突变）。这样无论应用与
 * 编辑器首次测量的先后顺序如何，都会在应用后立即刷新高度表。
 *
 * EditorView.findFromDOM 为 @codemirror/view 的公开静态 API，
 * 经 esbuild external + Obsidian 运行时解析，与宿主 CM6 实例
 * 兼容，插件无需持有编辑器引用。
 */
export function scheduleEditorRemeasure(app: App): void {
	if (remeasureTimer !== undefined) {
		activeWindow.clearTimeout(remeasureTimer);
	}
	remeasureTimer = activeWindow.setTimeout(() => {
		remeasureTimer = undefined;
		try {
			for (const leaf of app.workspace.getLeavesOfType('markdown')) {
				const cmEditor = leaf.view.containerEl?.querySelector<HTMLElement>(
					'.cm-editor'
				);
				if (!cmEditor) {
					continue;
				}
				const view = EditorView.findFromDOM(cmEditor);
				if (view) {
					view.requestMeasure();
				}
			}
		} catch {
			// 布局尚未就绪时忽略本轮
		}
	}, REMEASURE_DEBOUNCE_MS);
}
