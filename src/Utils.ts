import { Meta, WithDescription, WithTitle } from './SettingHandlers';
import { SettingType } from './settingsView/SettingComponents/types';
import { lang, t } from './lang/helpers';
import Pickr from '@simonwep/pickr';
import { App } from 'obsidian';
import { EditorView } from '@codemirror/view';
import fuzzysort from 'fuzzysort';

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

/**
 * 设置项对应的 CSS 变量名（`--<id>`）。变量类设置（`variable-*`）在 CSS 里
 * 就是自定义属性，其它类型（heading / info-text / class-toggle …）没有变量名。
 * 设置项 id 不保证是合法 CSS 标识符（解析阶段不校验），这里只负责拼名字，
 * 不负责校验。
 */
export function getVariableName(setting: Meta): string | undefined {
	if (!setting.type.startsWith('variable')) {
		return undefined;
	}

	return `--${setting.id}`;
}

/**
 * 搜索栏的候选串：本地化标题、描述，以及 id / CSS 变量名形式的别名。
 *
 * 变量设置的标题通常是自然语言（如「Ribbon 内边距」），变量名
 * （`--ribbon-padding`）只出现在设置项 id 里；class-toggle 的 id 则是对应的
 * 类名。只比对标题与描述时，按变量名搜索会一条都搜不到，因此把 id 一并纳入：
 * 变量设置同时接受裸 id 与 `--id` 两种写法，类开关类设置接受裸 id。
 */
export function getSettingSearchTargets(setting: Meta): string[] {
	const targets: string[] = [];

	const title = getTitle(setting);
	if (title) {
		targets.push(title);
	}

	const description = getDescription(setting);
	if (description) {
		targets.push(description);
	}

	const variableName = getVariableName(setting);
	if (variableName) {
		targets.push(setting.id, variableName);
	} else if (
		setting.type === SettingType.CLASS_TOGGLE ||
		setting.type === SettingType.CLASS_SELECT
	) {
		targets.push(setting.id);
	}

	return targets;
}

/**
 * 在候选串中做 fuzzy 匹配，返回最高分；全部未命中返回 -Infinity
 * （与 `AbstractSettingComponent.decisiveMatch` 的阈值约定一致）。
 */
export function bestFuzzyMatch(
	query: string,
	targets: readonly string[]
): number {
	let best = Number.NEGATIVE_INFINITY;

	for (const target of targets) {
		if (!target) {
			continue;
		}

		const score = fuzzysort.single(query, target)?.score;
		if (score !== undefined && score > best) {
			best = score;
		}
	}

	return best;
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

const HTML_ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;',
};

/** 转义 HTML 特殊字符（用于拼进按 innerHTML 渲染的字符串）。 */
export function escapeHtml(str: string): string {
	return str.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

/**
 * 设置元素上的 CSS 自定义属性。优先用 Obsidian 的 `setCssProps()`（插件审核
 * 规范要求不要直接写 `element.style`；`style.setProperty` 这类调用也一并
 * 收敛到这里），旧版 Obsidian 没有该扩展方法时退回 `style.setProperty`。
 */
export function setCssProps(
	el: HTMLElement,
	props: Record<string, string>
): void {
	if (typeof el.setCssProps === 'function') {
		el.setCssProps(props);
		return;
	}

	for (const prop of Object.keys(props)) {
		el.style.setProperty(prop, props[prop]);
	}
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

		const div = createDiv();

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
		window.clearTimeout(remeasureTimer);
	}
	remeasureTimer = window.setTimeout(() => {
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
/**
 * Copies text to the clipboard, preferring the async Clipboard API and
 * falling back to a hidden-textarea execCommand hack. Returns whether the
 * copy actually succeeded. Shared by the export modal and the per-setting
 * variable-name copy chip.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
	try {
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(text);
			return true;
		}
	} catch (e) {
		console.error('Style Tuner: Clipboard API copy failed', e);
	}

	// Fallback for when the Clipboard API is unavailable or denied.
	const hiddenTextarea = createEl('textarea');
	hiddenTextarea.value = text;
	hiddenTextarea.setAttribute('readonly', '');
	hiddenTextarea.addClass('style-settings-clipboard-helper');
	document.body.appendChild(hiddenTextarea);
	try {
		hiddenTextarea.select();
		hiddenTextarea.setSelectionRange(0, text.length);
		return document.execCommand('copy');
	} catch (e) {
		console.error('Style Tuner: execCommand copy failed', e);
		return false;
	} finally {
		hiddenTextarea.remove();
	}
}
