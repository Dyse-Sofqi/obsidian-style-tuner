import { App } from 'obsidian';

/**
 * 颜色模式：与 Obsidian 外观设置中的"颜色模式"一一对应。
 *   system → 跟随系统；light → 亮色（配置值 moonstone）；dark → 深色（配置值 obsidian）。
 */
export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeInfo {
	/** Obsidian 主题标识（themes 目录名 / css 文件名），用于切换主题 */
	name: string;
	/** 显示名（manifest.json 的 name，缺失时回退为 name） */
	displayName: string;
	/** 是否是当前启用的主题 */
	enabled: boolean;
	/** 是否存在于 themes 目录（无论是否被加载） */
	installed: boolean;
}

export interface SnippetInfo {
	/** 片段名（不含 .css 扩展名） */
	name: string;
	/** 是否启用 */
	enabled: boolean;
}

/**
 * Obsidian 外观设置的配置（appearance.json，旧版本为 config.json 中的对应字段）。
 * theme 字段值：moonstone（亮）/ obsidian（暗）/ system（跟随系统）。
 */
interface AppearanceConfig {
	theme?: string;
	cssTheme?: string;
	enabledCssSnippets?: string[];
}

/**
 * 管理 Obsidian 的默认外观设置：颜色模式、CSS 主题、CSS 片段启停。
 *
 * 优先使用运行时内部 API（app.customCss / app.changeTheme），
 * 这些 API 未被 obsidian.d.ts 声明，因此统一走 any 访问；
 * 缺失时回退为直接读写 appearance.json 配置文件。
 */
export class AppearanceManager {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	// ------------------------------------------------------------------
	// 配置文件读写
	// ------------------------------------------------------------------

	private get customCss(): any {
		return (this.app as any).customCss;
	}

	private configFilePath(): string {
		return `${this.app.vault.configDir}/appearance.json`;
	}

	private async readAppearanceConfig(): Promise<AppearanceConfig> {
		try {
			const raw = await this.app.vault.adapter.read(this.configFilePath());
			return JSON.parse(raw) as AppearanceConfig;
		} catch {
			// 旧版本（外观还未迁移到 appearance.json）回退 config.json
			try {
				const raw = await this.app.vault.adapter.read(
					`${this.app.vault.configDir}/config.json`
				);
				return JSON.parse(raw) as AppearanceConfig;
			} catch {
				return {};
			}
		}
	}

	private async writeAppearanceConfig(
		conf: AppearanceConfig
	): Promise<void> {
		await this.app.vault.adapter.write(
			this.configFilePath(),
			JSON.stringify(conf, null, 2)
		);
	}

	private static basename(path: string): string {
		const p = path.replace(/\/+$/, '');
		const i = p.lastIndexOf('/');
		return i >= 0 ? p.slice(i + 1) : p;
	}

	// ------------------------------------------------------------------
	// 颜色模式（明暗 / 跟随系统）
	// ------------------------------------------------------------------

	/** 当前配置的颜色模式 */
	async getThemeMode(): Promise<ThemeMode> {
		// 优先读运行时配置（与官方 appearance 设置页相同来源）
		const runtime = (this.app.vault as any)?.getConfig?.('theme');
		if (runtime === 'obsidian') return 'dark';
		if (runtime === 'moonstone') return 'light';
		if (runtime === 'system') return 'system';

		const value = (await this.readAppearanceConfig()).theme;
		if (value === 'obsidian') return 'dark';
		if (value === 'moonstone') return 'light';
		if (value === 'system') return 'system';
		// 配置缺失（异常情况）时按当前实际生效值推断
		return document.body.hasClass('theme-dark') ? 'dark' : 'light';
	}

	async setThemeMode(mode: ThemeMode): Promise<void> {
		const value =
			mode === 'dark' ? 'obsidian' : mode === 'light' ? 'moonstone' : 'system';
		const app = this.app as any;

		if (typeof app.changeTheme === 'function') {
			// 运行时切换（即时生效并持久化）
			app.changeTheme(value);
			return;
		}

		// 回退：只写配置文件（部分版本需要重启后生效）
		const conf = await this.readAppearanceConfig();
		conf.theme = value;
		await this.writeAppearanceConfig(conf);
		this.customCss?.requestLoadSnippets?.();
	}

	// ------------------------------------------------------------------
	// CSS 主题
	// ------------------------------------------------------------------

	/** 列出 themes 目录中的全部主题（含运行时已加载的主题） */
	async getThemes(): Promise<ThemeInfo[]> {
		const map = new Map<string, ThemeInfo>();
		const dir = `${this.app.vault.configDir}/themes`;

		// 1) 扫描 themes 目录：每个子目录是一个主题；兼容直接放置的 .css 文件（旧格式）
		try {
			const listing = await this.app.vault.adapter.list(dir);
			for (const folder of listing.folders) {
				const name = AppearanceManager.basename(folder);
				if (name) {
					map.set(name, {
						name,
						displayName: name,
						enabled: false,
						installed: true,
					});
				}
			}
			for (const file of listing.files) {
				if (!file.toLowerCase().endsWith('.css')) continue;
				const name = AppearanceManager.basename(file).replace(
					/\.css$/i,
					''
				);
				if (!map.has(name)) {
					map.set(name, {
						name,
						displayName: name,
						enabled: false,
						installed: true,
					});
				}
			}

			// 读取 manifest.json 获取主题的显示名；缺失时用目录名
			for (const name of [...map.keys()]) {
				try {
					const raw = await this.app.vault.adapter.read(
						`${dir}/${name}/manifest.json`
					);
					const manifest = JSON.parse(raw);
					const entry = map.get(name);
					if (manifest?.name && entry) {
						entry.displayName = manifest.name;
					}
				} catch {
					// 无 manifest.json（手动放置的主题），保持目录名
				}
			}
		} catch {
			// themes 目录不存在
		}

		// 2) 合并运行时已加载主题（可能包含 v1.5+ 不能通过目录扫描识别的格式）
		const runtime = this.customCss?.themes;
		if (runtime && typeof runtime === 'object') {
			for (const key of Object.keys(runtime)) {
				if (!map.has(key)) {
					map.set(key, {
						name: key,
						displayName: key,
						enabled: false,
						installed: true,
					});
				}
			}
		}

		return [...map.values()].sort((a, b) =>
			a.displayName.localeCompare(b.displayName)
		);
	}

	/** 当前启用的主题名（'' 表示默认主题） */
	async getCurrentTheme(): Promise<string> {
		// 优先读运行时配置（与官方 CustomCss 的 theme 字段同源）
		const runtime = (this.app.vault as any)?.getConfig?.('cssTheme');
		if (typeof runtime === 'string') return runtime;
		return (await this.readAppearanceConfig()).cssTheme ?? '';
	}

	/** 切换主题；name 为空字符串表示恢复默认主题 */
	async setTheme(name: string): Promise<void> {
		const cc = this.customCss;

		if (cc && typeof cc.setTheme === 'function') {
			// 官方默认主题表示为空字符串（removeTheme 中即用 setTheme("")）
			await cc.setTheme(name || '');
			return;
		}

		// 回退：只写配置文件 + 触发片段重载
		const conf = await this.readAppearanceConfig();
		conf.cssTheme = name || '';
		await this.writeAppearanceConfig(conf);
		cc?.requestLoadSnippets?.();
	}

	// ------------------------------------------------------------------
	// CSS 片段
	// ------------------------------------------------------------------

	/** 列出 snippets 目录中的全部片段与启停状态 */
	async getSnippets(): Promise<SnippetInfo[]> {
		const enabled = new Set(await this.getEnabledSnippets());
		const dir = `${this.app.vault.configDir}/snippets`;

		let names: string[] = [];
		try {
			const listing = await this.app.vault.adapter.list(dir);
			// Obsidian 的 adapter.list 对传入路径返回带前缀的条目
			// （如 `.obsidian/snippets/Custom.css`，路径中必然含 "/"），
			// 因此不能按 "/" 过滤。与官方 CustomCss.readSnippets 语义一致：
			// 取 basename → 丢弃以点开头的隐藏文件 → 保留 .css（大小写不敏感）
			// 的顶层文件 → 去掉扩展名得到片段名。
			names = listing.files
				.map((f) => AppearanceManager.basename(f))
				.filter(
					(name) =>
						!name.startsWith('.') &&
						name.toLowerCase().endsWith('.css')
				)
				// 与官方 Ll() 一致：按最后一个小数点截断（兼容 .CSS 等大小写）
				.map((name) => name.slice(0, name.lastIndexOf('.')));
		} catch {
			// snippets 目录不存在
		}

		return names
			.map((name) => ({ name, enabled: enabled.has(name) }))
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	private async getEnabledSnippets(): Promise<string[]> {
		// 优先读运行时配置（内存值，实时；与官方 CustomCss.loadData 同源）
		const runtime = (this.app.vault as any)?.getConfig?.(
			'enabledCssSnippets'
		);
		if (Array.isArray(runtime)) return runtime;

		const conf = await this.readAppearanceConfig();
		return Array.isArray(conf.enabledCssSnippets)
			? conf.enabledCssSnippets
			: [];
	}

	/** 启用 / 停用 CSS 片段 */
	async setSnippetEnabled(name: string, enabled: boolean): Promise<void> {
		const cc = this.customCss;

		// Obsidian 运行时唯一的片段启停入口：
		// 更新 enabledSnippets Set + vault.setConfig("enabledCssSnippets") + 重载片段
		if (cc && typeof cc.setCssEnabledStatus === 'function') {
			cc.setCssEnabledStatus(name, enabled);
			return;
		}

		// 回退：维护配置文件中的启用列表
		const conf = await this.readAppearanceConfig();
		const set = new Set(
			Array.isArray(conf.enabledCssSnippets)
				? conf.enabledCssSnippets
				: []
		);
		if (enabled) {
			set.add(name);
		} else {
			set.delete(name);
		}
		conf.enabledCssSnippets = [...set];
		await this.writeAppearanceConfig(conf);
		cc?.requestLoadSnippets?.();
	}
}
