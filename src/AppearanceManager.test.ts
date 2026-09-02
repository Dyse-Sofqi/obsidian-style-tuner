import { describe, expect, it, vi } from 'vitest';

const { AppearanceManager } = await import('./AppearanceManager');

interface Listing {
	files: string[];
	folders: string[];
}

/**
 * 构造最小化 App mock。
 * Obsidian 的 FileSystemAdapter.list 对传入目录返回带前缀的条目
 * （例如 list('.obsidian/snippets') → ['.obsidian/snippets/Custom.css', ...]）。
 */
function makeMockApp(
	listing: Listing,
	options: {
		getConfig?: Record<string, unknown>;
		appearanceJson?: Record<string, unknown>;
		customCss?: Record<string, unknown>;
	} = {}
): any {
	const adapter = {
		list: vi.fn(async () => listing),
		read: vi.fn(async (path: string) => {
			if (path.endsWith('appearance.json')) {
				return JSON.stringify(
					options.appearanceJson ?? {
						theme: 'moonstone',
						cssTheme: 'Ethereal',
						enabledCssSnippets: ['Custom', 'Callout'],
					}
				);
			}
			throw new Error(`ENOENT: ${path}`);
		}),
		write: vi.fn(async () => undefined),
	};
	const vault = {
		configDir: '.obsidian',
		adapter,
		getConfig: vi.fn((key: string) => options.getConfig?.[key]),
		setConfig: vi.fn(),
	};
	const customCss = {
		setTheme: vi.fn(),
		setCssEnabledStatus: vi.fn(),
		requestLoadSnippets: vi.fn(),
		themes: {},
		...options.customCss,
	};
	return { vault, customCss };
}

const prefixedListing: Listing = {
	// Obsidian list() 返回路径带 `.obsidian/snippets/` 前缀（必然含 "/"）
	files: [
		'.obsidian/snippets/Custom.css',
		'.obsidian/snippets/List.css',
		'.obsidian/snippets/Blank-line-hide.css',
	],
	folders: [],
};

describe('AppearanceManager.getSnippets', () => {
	it('finds top-level snippets when list() returns prefixed paths', async () => {
		const app = makeMockApp(prefixedListing, { getConfig: {} });
		const manager = new AppearanceManager(app);

		const snippets = await manager.getSnippets();

		expect(snippets.map((s) => s.name).sort()).toEqual([
			'Blank-line-hide',
			'Custom',
			'List',
		]);
		expect(snippets.find((s) => s.name === 'Custom')?.enabled).toBe(true);
		expect(snippets.find((s) => s.name === 'List')?.enabled).toBe(false);
	});

	it('excludes hidden files, non-css files and files without css suffix', async () => {
		const listing: Listing = {
			files: [
				'.obsidian/snippets/.hidden.css',
				'.obsidian/snippets/notes.md',
				'.obsidian/snippets/readme.txt',
				'.obsidian/snippets/Custom.CSS', // 大小写不敏感 .css
				'.obsidian/snippets/name.css', // 名字以点开头才是隐藏——这里不隐藏
			],
			folders: ['.obsidian/snippets/sub'],
		};
		const app = makeMockApp(listing, {
			getConfig: {},
			appearanceJson: { enabledCssSnippets: [] },
		});
		const manager = new AppearanceManager(app);

		const snippets = await manager.getSnippets();

		expect(snippets.map((s) => s.name).sort()).toEqual(['Custom', 'name']);
	});

	it('strips the extension on the last dot (uppercase .CSS)', async () => {
		const listing: Listing = {
			files: [
				'.obsidian/snippets/Uppercase.CSS',
				'.obsidian/snippets/Mixed.Css',
			],
			folders: [],
		};
		const app = makeMockApp(listing, {
			getConfig: {},
			appearanceJson: { enabledCssSnippets: [] },
		});
		const manager = new AppearanceManager(app);

		const snippets = await manager.getSnippets();

		expect(snippets.map((s) => s.name).sort()).toEqual(['Mixed', 'Uppercase']);
	});

	it('returns [] when the snippets folder does not exist', async () => {
		const app = makeMockApp({ files: [], folders: [] }, { getConfig: {} });
		app.vault.adapter.list = vi.fn(async () => {
			throw new Error('ENOENT');
		});
		const manager = new AppearanceManager(app);

		const snippets = await manager.getSnippets();

		expect(snippets).toEqual([]);
	});
});

describe('AppearanceManager.getEnabledSnippets', () => {
	it('prefers runtime config (vault.getConfig)', async () => {
		const app = makeMockApp({ files: [], folders: [] }, {
			getConfig: { enabledCssSnippets: ['Runtime'] },
			appearanceJson: { enabledCssSnippets: ['File'] },
		});
		const manager = new AppearanceManager(app);

		const enabled = await (manager as any).getEnabledSnippets();

		expect(enabled).toEqual(['Runtime']);
	});

	it('falls back to appearance.json when runtime config is missing', async () => {
		const app = makeMockApp({ files: [], folders: [] }, {
			getConfig: {},
			appearanceJson: { enabledCssSnippets: ['Callout'] },
		});
		const manager = new AppearanceManager(app);

		const enabled = await (manager as any).getEnabledSnippets();

		expect(enabled).toEqual(['Callout']);
	});
});

describe('AppearanceManager.setSnippetEnabled', () => {
	it('uses customCss.setCssEnabledStatus when available', async () => {
		const app = makeMockApp({ files: [], folders: [] }, { getConfig: {} });
		const manager = new AppearanceManager(app);

		await manager.setSnippetEnabled('Callout', true);

		expect(app.customCss.setCssEnabledStatus).toHaveBeenCalledWith(
			'Callout',
			true
		);
	});

	it('falls back to writing appearance.json when unavailable', async () => {
		const app = makeMockApp(
			{ files: [], folders: [] },
			{
				getConfig: {},
				appearanceJson: { enabledCssSnippets: ['Old'] },
				customCss: { setCssEnabledStatus: undefined },
			}
		);
		const manager = new AppearanceManager(app);

		await manager.setSnippetEnabled('New', true);

		expect(app.vault.adapter.write).toHaveBeenCalledWith(
			'.obsidian/appearance.json',
			expect.stringContaining('"enabledCssSnippets"')
		);
	});
});

describe('AppearanceManager.getThemes', () => {
	it('extracts theme names from prefixed folder paths', async () => {
		const listing: Listing = {
			files: [],
			folders: [
				'.obsidian/themes/Ethereal',
				'.obsidian/themes/Blue Topaz',
			],
		};
		const app = makeMockApp(listing, { getConfig: {} });
		const manager = new AppearanceManager(app);

		const themes = await manager.getThemes();

		expect(themes.map((th) => th.name).sort()).toEqual([
			'Blue Topaz',
			'Ethereal',
		]);
	});
});

describe('AppearanceManager.getThemeMode', () => {
	it('reads runtime config when available', async () => {
		const app = makeMockApp({ files: [], folders: [] }, {
			getConfig: { theme: 'system' },
			appearanceJson: { theme: 'moonstone' },
		});
		const manager = new AppearanceManager(app);

		expect(await manager.getThemeMode()).toBe('system');
	});

	it('falls back to appearance.json', async () => {
		const app = makeMockApp({ files: [], folders: [] }, {
			getConfig: {},
			appearanceJson: { theme: 'obsidian' },
		});
		const manager = new AppearanceManager(app);

		expect(await manager.getThemeMode()).toBe('dark');
	});
});
