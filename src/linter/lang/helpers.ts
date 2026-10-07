// based on https://github.com/mgmeyers/obsidian-kanban/blob/main/src/lang/helpers.ts
import {getString, NestedKeyOf} from '../utils/nested-keyof';
import {logWarn} from '../utils/logger';
import en from './locale/en';
import zhCN from './locale/zh-cn';
import zhTW from './locale/zh-tw';

type LanguageStrings = typeof en;

// Locales lag behind `en` and miss strings added in newer releases; the runtime
// falls back to English for missing keys (see getTextInLanguage), so locales
// are typed as deep partials instead of requiring the full shape.
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

export type LanguageLocale = DeepPartial<LanguageStrings>;

export const localeMap: { [k: string]: LanguageLocale } = {
  en,
  'zh-TW': zhTW,
  'zh': zhCN,
};

export const localeToFileName: { [k: string]: string} = {
  'en': 'en',
  'zh-TW': 'zh-tw',
  'zh': 'zh-cn',
};

export type LanguageStringKey = NestedKeyOf<LanguageStrings>

const defaultLang = 'en';
let lang = defaultLang;
let locale = localeMap[lang];

export function setLanguage(newLang: string) {
  lang = newLang;
  locale = localeMap[lang];
  if (!locale) {
    logWarn(`locale not found for '${lang}'`);
    locale = localeMap[defaultLang];
  }
}

export function getTextInLanguage(str: LanguageStringKey): string {
  const text: unknown = (locale && getString<LanguageStrings>(locale as LanguageStrings, str)) || getString<LanguageStrings>(en, str);

  return text as string;
}

export function localeHasKey(locale: LanguageLocale, key: LanguageStringKey): boolean {
  return !!getString<LanguageStrings>(locale as LanguageStrings, key);
}

export function getLanguageSourceFile(language: string) {
  return `./src/lang/locale/${localeToFileName[language]}.ts`;
}
