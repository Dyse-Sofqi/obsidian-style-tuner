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
	/** 返回 Obsidian 内部的控件名（`multitext` / `number` / …） */
	getAssignedType?: (key: string) => unknown;
	getTypeInfo?: (key: string) => {expected?: {type?: unknown}; widget?: unknown} | null;
	getAllPropertyInfos?: () => Map<string, {widget?: unknown}> | Record<string, {widget?: unknown}>;
}

/** 反查表：Obsidian 控件名 → 本插件的属性类型（`multitext` 就是「列表」）。 */
const WIDGET_TO_PROPERTY_TYPE: Record<string, YamlPropertyType> = Object.fromEntries(
	Object.entries(YAML_PROPERTY_WIDGET).map(([type, widget]) => [widget, type as YamlPropertyType])
);

function firstWidgetName(manager: MetadataTypeManagerLike, key: string): string | null {
	// 三个入口都是内部 API，不同版本留的不一样，按可用性依次试。
	// 每一步单独 try：某一版把返回值改成对象也不至于让整条读取链断掉。
	try {
		const assigned = manager.getAssignedType?.(key);
		if (typeof assigned === 'string' && assigned) return assigned;
	} catch {
		// 忽略，继续试下一个入口
	}

	try {
		const info = manager.getTypeInfo?.(key);
		const type = info?.expected?.type ?? info?.widget;
		if (typeof type === 'string' && type) return type;
	} catch {
		// 同上
	}

	try {
		const infos = manager.getAllPropertyInfos?.();
		const lower = key.toLowerCase();
		const info = infos instanceof Map ? infos.get(lower) : infos?.[lower];
		const widget = info?.widget;
		if (typeof widget === 'string' && widget) return widget;
	} catch {
		// 同上
	}

	return null;
}

/**
 * 读取某个键在 `types.json` 里登记过的属性类型。
 *
 * 侧边栏属性视图用它来决定控件：登记过的键按登记的类型渲染，没登记的才回落到
 * 「按值推断」。读不到（版本差异、键从没登记过）时返回 `null`，调用方继续用
 * 下一级推断，不会因此报错。
 */
export function readPropertyType(app: App, key: string): YamlPropertyType | null {
	const trimmedKey = key.trim();
	if (!trimmedKey) return null;

	const manager = (app as unknown as {metadataTypeManager?: MetadataTypeManagerLike})
		.metadataTypeManager;
	if (!manager) return null;

	const widget = firstWidgetName(manager, trimmedKey);
	if (!widget) return null;

	return WIDGET_TO_PROPERTY_TYPE[widget] ?? null;
}


interface ConfigJsonVaultLike {
	readConfigJson?: (name: string) => Promise<unknown>;
	writeConfigJson?: (name: string, data: unknown) => Promise<unknown>;
}

interface TypesConfig {
	types?: Record<string, unknown>;
}
