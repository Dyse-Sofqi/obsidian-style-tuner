import { App } from 'obsidian';
import { logWarn } from './logger';
import {
	isReservedPropertyKey,
	YAML_PROPERTY_WIDGET,
	type YamlPropertyType,
} from './yaml-attributes';

/**
 * 把某个 frontmatter 键登记成指定的 Obsidian 属性类型。
 *
 * Obsidian「属性」面板读的类型来自 `<configDir>/types.json`（形如
 * `{"types":{"键":"控件名"}}`），运行时的真源是 `app.metadataTypeManager`。
 * 这两者都不在公开类型定义里，按项目约定用 `as` 收窄 + 能力探测：
 *
 * 1. 优先 `app.metadataTypeManager.setType(key, widget)` —— Obsidian 自己会写文件
 *    并同步内存状态，不会出现「文件改了但界面没变」；
 * 2. 退化到 `vault.readConfigJson / writeConfigJson('types')` 直接改文件，
 *    Obsidian 有文件监听（`configDir + "/types.json"`），会自己重新载入。
 *
 * `aliases` / `tags` / `cssclasses` 是 Obsidian 写死类型的保留键（加载 types.json 后
 * 会用内置表覆盖），对它们直接跳过——写了也只会被忽略。
 *
 * 只负责「写」，不负责「删」：条目被移除时类型登记保留，因为这个登记是库级、
 * 面向所有笔记的，别的笔记可能已经有这个键。
 *
 * @return {boolean} 是否真的写进去了
 */
export async function assignPropertyType(
	app: App,
	key: string,
	type: YamlPropertyType
): Promise<boolean> {
	const trimmedKey = key.trim();
	if (!trimmedKey) return false;
	if (isReservedPropertyKey(trimmedKey)) return false;

	const widget = YAML_PROPERTY_WIDGET[type];

	const manager = (
		app as unknown as { metadataTypeManager?: MetadataTypeManagerLike }
	).metadataTypeManager;
	if (typeof manager?.setType === 'function') {
		try {
			await manager.setType(trimmedKey, widget);
			return true;
		} catch (error) {
			logWarn(
				`could not set the property type of "${trimmedKey}" via metadataTypeManager: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	const vault = app.vault as unknown as ConfigJsonVaultLike;
	if (
		typeof vault?.readConfigJson === 'function' &&
		typeof vault?.writeConfigJson === 'function'
	) {
		try {
			const data = (await vault.readConfigJson('types')) as TypesConfig | null;
			const types = { ...(data?.types ?? {}) };
			types[trimmedKey] = widget;
			await vault.writeConfigJson('types', { ...(data ?? {}), types });
			return true;
		} catch (error) {
			logWarn(
				`could not write the property type of "${trimmedKey}" to types.json: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	return false;
}

interface MetadataTypeManagerLike {
	setType?: (key: string, type: string) => unknown;
}

interface ConfigJsonVaultLike {
	readConfigJson?: (name: string) => Promise<unknown>;
	writeConfigJson?: (name: string, data: unknown) => Promise<unknown>;
}

interface TypesConfig {
	types?: Record<string, unknown>;
}
