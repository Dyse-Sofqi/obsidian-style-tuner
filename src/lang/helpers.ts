import { ar } from './locale/ar';
import { cz } from './locale/cz';
import { da } from './locale/da';
import { de } from './locale/de';
import { en } from './locale/en';
import { es } from './locale/es';
import { fr } from './locale/fr';
import { hi } from './locale/hi';
import { id } from './locale/id';
import { it } from './locale/it';
import { ja } from './locale/ja';
import { ko } from './locale/ko';
import { nl } from './locale/nl';
import { no } from './locale/no';
import { pl } from './locale/pl';
import { pt } from './locale/pt';
import { ptBr } from './locale/ptBr';
import { ro } from './locale/ro';
import { ru } from './locale/ru';
import { sq } from './locale/sq';
import { tr } from './locale/tr';
import { uk } from './locale/uk';
import { zh } from './locale/zh';
import { zhTw } from './locale/zhTw';

/**
 * 界面语言（Obsidian 自己写进 localStorage 的 `language` 键）。
 *
 * 审核规则 obsidianmd/prefer-get-language 建议改用 Obsidian 的
 * `getLanguage()`，这里**故意不采用**：本插件 minAppVersion 为 1.5.0，
 * 而 getLanguage 是较新的 API（当前依赖的 obsidian 类型定义里还没有它），
 * 静态 import 会让老版本 Obsidian 直接报错；而且它会让本模块在运行时
 * 依赖 obsidian 包，单测（vitest 里没有 obsidian 运行时）会因此解析失败。
 * 两者取到的值一致，localStorage 这条路对 1.5.0 起的所有版本都安全。
 */
export const lang: string | null = window.localStorage.getItem('language');

const localeMap: { [k: string]: Partial<typeof en> } = {
	ar,
	cz,
	da,
	de,
	en,
	es,
	fr,
	hi,
	id,
	it,
	ja,
	ko,
	nl,
	no,
	pl,
	'pt-BR': ptBr,
	pt,
	ro,
	ru,
	sq,
	tr,
	uk,
	'zh-TW': zhTw,
	zh,
};

const locale = localeMap[lang || 'en'];

export function t(str: keyof typeof en): string {
	if (!locale) {
		console.error('Error: Style Tuner locale not found', lang);
	}

	return (locale && locale[str]) || en[str];
}
