<div align="center">

# Style Tuner

像调音台一样,精细调校你的 Obsidian 外观。

[![GitHub Release](https://img.shields.io/github/v/release/Dyse-Sofqi/obsidian-style-tuner?style=flat-square&logo=github&color=%2342b883)](https://github.com/Dyse-Sofqi/obsidian-style-tuner/releases) [![License](https://img.shields.io/github/license/Dyse-Sofqi/obsidian-style-tuner?style=flat-square&color=%2342b883)](LICENSE) [![Obsidian Min App](https://img.shields.io/badge/Obsidian-%3E%3D1.13.0-%234a7ec1?style=flat-square&logo=obsidian&logoColor=%234a7ec1)](https://obsidian.md) [![GitHub Stars](https://img.shields.io/github/stars/Dyse-Sofqi/obsidian-style-tuner?style=flat-square&logo=github&color=%23e4b341)](https://github.com/Dyse-Sofqi/obsidian-style-tuner)

</div>

---

> 中文为主文档语言，关键章节附英文对照；`/* @settings` 参考文档见文末（英文）。
> Chinese is the primary language, with English alongside in key sections; the `/* @settings` reference is at the bottom of this document.

📜 完整更新记录见 [CHANGELOG](CHANGELOG.md) · Full changelog: [CHANGELOG](CHANGELOG.md)

### 关键词 / Keywords

**中文**：主题变量调校 · CSS 片段可视化配置 · 独立标签页视图 · 外观面板（颜色模式 / 主题切换）· CSS 片段启停管理 · 打开片段文件夹 · 颜色选择器（亮/暗双模式）· 数值滑块 · 下拉选择 · 类开关 · 标题层级折叠 · 搜索过滤 · **按变量名搜索** · 变量名一键复制 · `@settings` 生态兼容 · 界面美化 · 已修改值高亮 · 两栏导出弹窗 · 按区块导出 / 导入 · 24 种界面语言 · **Markdown 美化与 Lint（Obsidian Linter 引擎集成）** · **列表设置项拖拽排序** · **YAML 键属性类型（文本 / 列表 / 数字 / 复选框 / 日期 / 日期时间）** · **YAML 键顺序一键继承** · **与 obsidian-linter 插件共存**

**English**: theme variable fine-tuning · visual CSS snippet configuration · standalone tabbed view · appearance panel (color mode / theme switching) · CSS snippet enable-disable management · open snippets folder · dual-mode color pickers (light/dark) · number sliders · dropdown selects · class toggles · collapsible heading groups · search filter · **search by variable name** · one-click variable-name copy · `@settings` ecosystem compatibility · beautified UI · modified-value highlighting · two-column export dialog · per-section export/import · 24 UI languages · **markdown linting & formatting (Obsidian Linter engine, ported)** · **drag-to-reorder list settings** · **YAML property types (text / list / number / checkbox / date / datetime)** · **one-click inherit of a YAML key order** · **coexists with the obsidian-linter plugin**

### 简介 / Introduction

**中文**：Style Tuner 是一款 Obsidian 插件，让主题、CSS 片段与插件 CSS 声明一组可配置项，并把这些可调设置集中在同一个设置面板里：支持在 `body` 上开关类名，以及设置数值、文本、颜色等 CSS 变量——无需手动改 CSS，主题调校所见即所得。除了样式变量，面板还接管了 Obsidian 原生外观设置中的三件事：颜色模式（跟随系统 / 亮色 / 深色）、主题切换，以及 CSS 片段的启停管理——既可以作为插件设置页打开，也可以作为独立标签页打开，边调边看。它是 [Style Settings](https://github.com/mgmeyers/obsidian-style-settings)（作者 [mgmeyers](https://github.com/mgmeyers)）的独立维护分支，遵循 GPL-3.0 协议，解析与原版完全相同的 `/* @settings` 配置块，现有主题与片段无需任何修改即可使用。自 1.2.0 起，它还内置了 [Obsidian Linter](https://github.com/platers/obsidian-linter)（作者 [platers / Victor Tao](https://github.com/platers)，MIT 协议）的 Markdown 美化与格式化引擎，其全部设置项集成在面板标签组（格式化 / YAML规范 / 内容规范 / 空行规范 / 自定义规范）中，并附一组命令使用。内置 Linter 占用的全局命名空间已全部收窄到本插件前缀下（视图类型、CSS 类、图标 id），**因此可以与 obsidian-linter 插件同时启用，不再互相顶掉**。YAML 相关设置也做了增强：「插入 YAML 属性」的键可以指定属性类型（并登记进 Obsidian 的属性面板），「YAML 键排序」能一键继承它的键顺序，所有列表设置项都支持拖拽排序。**它是独立插件，不要与 Style Settings 同时启用。**

**English**: Style Tuner is an Obsidian plugin that lets themes, CSS snippets, and plugin CSS declare a set of configurable options, and collects them into a single settings panel: toggle classes on `body`, and set numeric, text, or color CSS variables — no hand-editing CSS, WYSIWYG theme tuning. Beyond style variables, the panel also takes over three native Obsidian appearance settings: color mode (system / light / dark), theme switching, and CSS snippet management — usable either as a plugin settings tab or as a standalone view, so you can tune and preview side by side. It is an independently maintained fork of [Style Settings](https://github.com/mgmeyers/obsidian-style-settings) by [mgmeyers](https://github.com/mgmeyers), licensed under GPL-3.0. It parses the exact same `/* @settings` blocks, so existing themes and snippets work unchanged. Since 1.2.0, it also bundles the markdown styling & formatting engine of [Obsidian Linter](https://github.com/platers/obsidian-linter) by [platers / Victor Tao](https://github.com/platers) (MIT licensed), with all of its settings integrated into the panel tabs (Format / YAML Rules / Content Rules / Blank-line Rules / Custom Rules) plus a set of commands. Every global namespace the bundled linter used to occupy (view types, CSS classes, icon ids) is now namespaced under this plugin, **so it can be enabled alongside the obsidian-linter plugin without the two knocking each other out**. The YAML settings got extra work too: keys added by "Insert YAML attributes" can carry a property type (registered with Obsidian's property panel), "YAML key sort" can inherit that key order in one click, and every list setting supports drag-to-reorder. **It is a separate plugin — do not enable it together with Style Settings.**

### 功能 / Features

**中文**：
- **生态兼容** — 完整支持 `/* @settings` 配置块：标题层级、类开关、类下拉、文本/数值/滑块/下拉变量、单色与亮暗双色取色器、信息文本、颜色渐变，以及按语言后缀的多语言标题（`title.zh`、`title.de` 等）。`parse-style-settings` 事件与 `style-settings-*` 类名沿用原版，主题与插件无需改动。
- **两处入口，界面一致** — 命令「打开 Style Tuner 视图」把面板作为标签页打开；「设置 → 第三方插件 → Style Tuner」的设置页与它完全相同：顶部是搜索框、颜色模式（跟随系统 / 亮色 / 深色）与主题下拉、导入导出按钮，下方分「样式设置」与「CSS 片段」两个标签页；在侧栏这种窄宽度下也能用。
- **外观设置接管** — 颜色模式与主题（默认主题 + 已安装主题）可直接在视图或插件设置页里切换，切换后样式设置面板会自动重新解析，无需来回跳 Obsidian 外观设置。
- **CSS 片段管理** — 「CSS 片段」标签页列出库 `snippets` 目录中的全部片段并显示数量，逐项开关启停、可手动刷新列表，并能在系统文件管理器中直接打开片段文件夹（刷新与打开文件夹是列表标题行的图标按钮，悬停有提示；目录不存在时自动创建；桌面端专属的打开文件夹，移动端隐藏）。
- **变量名一键复制** — 每个变量设置项标题旁显示等宽 `--变量名` chip，单击即复制到剪贴板（成功/失败均有通知）；变量名直接取设置项 id，不依赖本地化标题文本。
- **按变量名搜索** — 搜索框除标题与描述外还匹配设置项 id：变量设置输入 `--ribbon-padding` 或 `ribbon-padding` 都能搜到，类开关可输入类名（如 `wide-tables`）；命中后计数与自动展开行为与按标题搜索一致。装过 Settings Search 插件的话，它的全局设置搜索里也能按变量名命中。
- **窄宽度也排得整齐** — 工具栏为垂直滚动条预留宽度，CSS 片段列表变长不会把「颜色模式 / 主题」两个下拉挤到第二行；空间实在不够时整行换行（搜索框独占一行、控件落到第二行），极窄容器（侧栏 / 移动端）下两个控件各占一行。
- **界面美化** — 可折叠标题按层级着色、树形缩进线呈现嵌套关系、设置项横向布局、设置页自动加宽，深浅色主题自适应。
- **已自定义值高亮** — 改过默认值的设置行实时亮起标记，重置后立即熄灭。
- **导出/导入增强** — 「全部设置」导出时可按一级区块勾选（默认只勾选来源仍启用的区块，来源已停用的残留配置默认不导出，但会列出来供手动勾选），只导出所选区块及其后代；导出弹窗为左右两栏（左侧勾选区块、右侧看配置文本），窗口更大、区块列表可滚动，底部按钮均为 Obsidian 原生按钮。
- **内置 Markdown 美化引擎** — 集成 Obsidian Linter（MIT）的 66 条格式化规则与 lint 命令，全部设置项收纳进面板标签组，细节见下文「Linter 集成」。
- **列表设置项可拖拽排序** — 所有可增删的列表（要插入的键、各类忽略列表、自定义正则替换、优先级排序……）每行左侧都有拖拽手柄，拖到目标位置即可重排，落点会画一条强调色指示线；拖拽只从手柄发起，行内选中文本或点击按钮都不会误触发。
- **YAML 键管理增强** — 「插入 YAML 属性」的每个键可选**属性类型**（文本 / 列表 / 数字 / 复选框 / 日期 / 日期时间，与 Obsidian 属性面板一致）：插入的值按类型生成合法 YAML（列表展开成块序列、数字与布尔不加引号、含冒号的值自动加引号），类型同时登记进 `<configDir>/types.json` 让属性面板直接按该类型显示（`aliases` / `tags` / `cssclasses` 的类型被 Obsidian 写死，界面里锁定为「列表」并跳过登记）；「YAML 键排序」的优先级顺序可用「继承『要插入的键』」按钮一键并入，之后照常增删调序。YAML 标签页里「插入 YAML 属性 / YAML 键排序 / YAML 标题」三条固定排在最前。
- **与 obsidian-linter 插件共存** — 内置 Linter 原先照抄了上游写入 Obsidian **全局命名空间**的标识（视图类型、CSS 类、图标 id），两者同时启用时后加载的那个会整个 onload 中断（`Attempting to register an existing view type`）。现在全部收窄到 `style-tuner-` 前缀下，两个插件可以同时启用。
- **合规** — 不创建动态 `<style>` 元素，也不直接给元素写内联样式：动态样式一律走 Obsidian 的 `setCssProps`（CSS 变量写在 `body` 的内联自定义属性上，取色器的 `--pcr-color` 同理），无法用类名表达的少数场景才由 CSS 类兜底。每次发版都用官方 `eslint-plugin-obsidianmd@0.4.2` 的 `recommended` 配置对 `src/**`（含移植的 Linter 代码）重跑一遍复查：**error 级规则全部通过**，其中审核要点「Sets styles directly instead of using CSS classes, `setCssProps`, or `setCssStyles`」（`obsidianmd/no-static-styles-assignment`）零命中。
- **稳定性** — 修复后台标签页恢复后的启动崩溃，懒挂载视图自动补齐数据；外观/片段变化引发的并发刷新不再重复渲染片段列表；修掉几处「就地改写 settings 数组」的老问题（每次 lint 会把列表顺序翻一遍、优先级键被回写等）。

**English**:
- **Ecosystem compatible** — Full support for `/* @settings` blocks: heading levels, class toggles and selects, text/number/slider/select variables, single and light/dark themed color pickers, info text, color gradients, and language-suffixed titles (`title.zh`, `title.de`, …). The `parse-style-settings` event and `style-settings-*` class names are kept from the original, so themes and plugins need no changes.
- **Two identical entry points** — The "Show Style Tuner view" command opens the panel as a tab, and the plugin settings tab (Settings → Style Tuner) is exactly the same: search bar, color mode (system / light / dark) and theme dropdowns, and import/export buttons on top, with "Style Settings" and "CSS Snippets" tabs below — comfortable even in a narrow sidebar.
- **Appearance settings built in** — Switch color mode and theme (default theme + installed themes) right from the view or the plugin settings tab; the settings panel re-parses automatically after a theme change, so there is no back-and-forth with Obsidian's own settings.
- **CSS snippet management** — The "CSS Snippets" tab lists every snippet in your vault's `snippets` folder with a live count, toggles each one on/off, refreshes the list on demand, and opens the snippets folder in your system file manager (refresh and open-folder are icon buttons in the list header with tooltips; the folder is created automatically if missing; opening it is desktop only, hidden on mobile).
- **One-click variable-name copy** — Each variable setting shows a monospace `--var` chip next to its title; a single click copies the variable name to the clipboard (with success/failure notices). The name is taken from the setting `id`, independent of the localized title.
- **Search by variable name** — Besides titles and descriptions, the search bar matches setting ids: searching `--ribbon-padding` or `ribbon-padding` finds the variable setting, and class toggles can be found by their class name (e.g. `wide-tables`); result counts and auto-expansion behave exactly as with title search. With the Settings Search plugin installed, its global settings search finds variables by name too.
- **Tidy at any width** — The toolbar reserves room for the vertical scrollbar, so a growing snippet list never pushes the color-mode / theme dropdowns onto a second row; when space does run out the whole row wraps (search bar on its own line, controls below), and in very narrow containers (sidebar / mobile) each control takes its own row.
- **Beautified UI** — Collapsible headings with per-level accent bars and tree guide lines, horizontal setting rows, auto-widened panel; adapts to light/dark themes.
- **Modified-value highlighting** — Rows whose saved values differ from defaults light up in real time and reset immediately clears the marker.
- **Enhanced export/import** — Exports can be filtered by first-level sections (only sections whose source is still enabled are checked by default; leftover customizations from disabled sources are listed but not exported unless you check them). The export dialog is split into two columns (sections on the left, config text on the right) with a larger, scrollable section list and native Obsidian buttons.
- **Bundled markdown formatting engine** — Integrates 66 formatting rules and lint commands from Obsidian Linter (MIT), with every option folded into the panel tabs; see "Linter integration" below for details.
- **Drag-to-reorder list settings** — Every add/remove list (keys to insert, the various ignore lists, custom regex replacements, the priority order, …) has a drag handle on the left of each row: drag it to the target position to reorder, with an accent-coloured insertion line showing where it will land. Dragging only starts from the handle, so selecting text or clicking a button inside a row never triggers it by accident.
- **Better YAML key management** — Each key of "Insert YAML attributes" can carry a **property type** (text / list / number / checkbox / date / datetime, matching Obsidian's property panel): the inserted value is generated as valid YAML for that type (lists expand to block sequences, numbers and booleans stay unquoted, values containing a colon get quoted), and the type is registered in `<configDir>/types.json` so Obsidian's property panel shows it as that type straight away (`aliases` / `tags` / `cssclasses` have their types hard-coded by Obsidian, so they are locked to "list" and skipped when writing). The priority order of "YAML key sort" can be filled in with one click from that key list and then edited freely. In the YAML tab, "Insert YAML attributes", "YAML key sort" and "YAML title" are pinned to the top.
- **Coexists with the obsidian-linter plugin** — The bundled linter used to copy the identifiers upstream writes into Obsidian's **global namespace** (view type, CSS classes, icon ids), so enabling both plugins made whichever loaded second abort its whole onload (`Attempting to register an existing view type`). All of them are now namespaced under `style-tuner-`, and the two plugins can run side by side.
- **Review compliant** — No dynamic `<style>` elements and no inline styles written onto elements: dynamic styles always go through Obsidian's `setCssProps` (CSS variables land on `body`'s inline custom properties, same for the picker's `--pcr-color`), with CSS classes covering the few cases a class name expresses better. Every release re-runs the official `eslint-plugin-obsidianmd@0.4.2` `recommended` rule set over `src/**` (including the ported linter sources): **every error-level rule passes**, and the review item "Sets styles directly instead of using CSS classes, `setCssProps`, or `setCssStyles`" (`obsidianmd/no-static-styles-assignment`) reports zero hits.
- **Stability** — Fixes the startup crash after restoring a background tab and lazily hydrates the view; concurrent refreshes triggered by appearance/snippet changes no longer render the snippet list twice; several long-standing "mutating the settings array in place" bugs are gone (the list order used to flip on every lint, priority keys were rewritten, …).

### 安装 / Installation

#### 1. 通过 BRAT（Beta Reviewer's Auto-update Tool）

1. 安装并启用 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 插件。
2. 执行命令 `BRAT: Add a beta plugin for testing`。
3. 输入 `Dyse-Sofqi/obsidian-style-tuner` 并确认。

*English*: Install and enable [BRAT](https://github.com/TfTHacker/obsidian42-brat), run the command `BRAT: Add a beta plugin for testing`, then enter `Dyse-Sofqi/obsidian-style-tuner`.

#### 2. 手动安装 / Manual installation

1. 从本仓库的最新 [Release](https://github.com/Dyse-Sofqi/obsidian-style-tuner/releases) 下载 `main.js`、`manifest.json`、`styles.css`。
2. 在 `<vault>/.obsidian/plugins/style-tuner/` 目录下放入这三个文件。
3. 在 Obsidian 的「第三方插件」设置中启用 **Style Tuner**。

*English*: Download `main.js`, `manifest.json` and `styles.css` from the latest [release](https://github.com/Dyse-Sofqi/obsidian-style-tuner/releases), put the three files into `<vault>/.obsidian/plugins/style-tuner/`, then enable **Style Tuner** under Settings → Community plugins.

> [!CAUTION]
> 不要同时启用 Style Tuner 与 Style Settings：两者都会渲染 `/* @settings` 配置面板，同一变量被写入两次可能产生冲突。
> Do not enable Style Tuner and Style Settings at the same time: both render `/* @settings` panels, and the same variable may be written twice with conflicting results.

### Linter 集成 / Linter integration

**中文**：自 1.2.0 起，Style Tuner 内置了 [Obsidian Linter](https://github.com/platers/obsidian-linter)（MIT 协议，Copyright (c) 2021-2022 Victor Tao，完整许可文本见 [`src/linter/LICENSE`](src/linter/LICENSE)）的 Markdown 美化引擎，其设置集成在面板标签组中（格式化 / YAML规范 / 内容规范 / 空行规范 / 自定义规范），并附一组命令运行：

- **66 条规则**，全部集成在 Style Tuner 面板的标签组中：「格式化」（常规开关、YAML 通用样式、忽略文件夹 / 忽略文件 / 额外文件扩展名三张独立卡片、调试）、「YAML规范」、「内容规范」（内容 + 标题 + 脚注 + 粘贴）、「空行规范」、「自定义规范」（自定义正则替换）；语言仅保留中英文（随 Obsidian 界面语言自动适配，其余语言回退英文）。linter 不再注册独立的设置页。
- **触发方式**：手动命令（当前文件 / 全库 / 指定文件夹）、保存时自动 lint、切换文件时 lint、粘贴拦截（启用粘贴规则后接管粘贴）、以及「预览 Lint」差异视图；
- **忽略机制**：按文件夹忽略、按文件名正则忽略；YAML、代码块、数学块、行内代码、链接等区域在规则处理时自动保护；
- **自定义**：自定义正则替换（可排序、可启停）；上游的「lint 后执行自定义命令」功能已移除；
- **列表设置项**：规则里所有可增删的列表（要插入的键、各类忽略列表、自定义正则替换、优先级排序）都支持拖拽排序，条目行有悬停底色与拖拽手柄；
- **YAML 键管理**：「插入 YAML 属性」的每个键可选属性类型，插入的值按类型生成合法 YAML，并把类型登记进 `<configDir>/types.json`（`aliases` / `tags` / `cssclasses` 的类型由 Obsidian 写死，界面里锁定为「列表」）；「YAML 键排序」的优先级顺序可一键继承这份键清单。YAML 标签页里「插入 YAML 属性 / YAML 键排序 / YAML 标题」固定排在最前；
- **与 obsidian-linter 共存**：内置 Linter 写入 Obsidian 全局命名空间的标识（视图类型 / CSS 类 / 图标 id）已全部收窄到 `style-tuner-` 前缀，两个插件可以同时启用；
- **数据独立**：Linter 设置存放于 `data-linter.json`，与样式设置（`data.json`）互不影响。

*English*: Since 1.2.0, Style Tuner bundles the markdown styling engine of [Obsidian Linter](https://github.com/platers/obsidian-linter) (MIT licensed, Copyright (c) 2021-2022 Victor Tao; full license text in [`src/linter/LICENSE`](src/linter/LICENSE)). Its settings live in the panel tabs (Format / YAML Rules / Content Rules / Blank-line Rules / Custom Rules) and it ships with a set of commands:

- **66 rules**, all integrated into the panel tabs: "Format" (general switches, YAML common styles, three separate cards for ignored folders / ignored files / extra file extensions, debug), "YAML Rules", "Content Rules" (content + headings + footnotes + paste), "Blank-line Rules", and "Custom Rules" (custom regex replacements). UI text ships in English and Chinese only, following the Obsidian interface language with English fallback elsewhere; the linter no longer registers a standalone settings tab.
- **Triggers**: manual commands (current file / entire vault / a folder), lint on save, lint on file switch, paste interception (takes over pasting when paste rules are enabled), and a "Preview lint" diff view;
- **Ignore mechanisms**: ignore by folder and by file-name regex; YAML, code blocks, math blocks, inline code, links and similar regions are automatically protected while rules run;
- **Custom**: custom regex replacements (sortable, individually toggleable); the upstream "run custom commands after lint" feature has been removed;
- **List settings**: every add/remove list a rule exposes (keys to insert, the various ignore lists, custom regex replacements, the priority order) supports drag-to-reorder, with hover highlighting and a drag handle on each row;
- **YAML key management**: each key of "Insert YAML attributes" carries a property type; the inserted value is generated as valid YAML for that type and the type is registered in `<configDir>/types.json` (`aliases` / `tags` / `cssclasses` have their types hard-coded by Obsidian, so they are locked to "list"). The priority order of "YAML key sort" can be inherited from that key list in one click, and "Insert YAML attributes" / "YAML key sort" / "YAML title" are pinned to the top of the YAML tab;
- **Coexists with obsidian-linter**: every identifier the bundled linter used to write into Obsidian's global namespace (view type / CSS classes / icon ids) is now namespaced under `style-tuner-`, so both plugins can run at the same time;
- **Independent data**: linter settings live in `data-linter.json` and never mix with the style settings in `data.json`.

### 数据存储 / Data storage

你的全部调校值保存在 `<vault>/.obsidian/plugins/style-tuner/data.json`，只存储与默认值不同的覆盖项。**卸载插件会删除该文件**（主题与片段文件本身不受影响）——卸载前请用设置面板的导出功能备份，或直接复制 `data.json`。Linter（1.2.0 起内置）的设置保存在同目录的 `data-linter.json`，卸载时同样会被删除。

*English*: All of your tweaks are stored in `<vault>/.obsidian/plugins/style-tuner/data.json`, and only values differing from the defaults are written. **Uninstalling the plugin deletes that file** (your theme and snippet files are not affected) — export a backup from the panel, or copy `data.json`, before removing the plugin. Linter settings (bundled since 1.2.0) live in `data-linter.json` in the same directory and are deleted as well.

### 供作者使用:`/* @settings` 参考文档(英文)

在 vault 的 snippets 目录(`%yourVault%/.obsidian/snippets`)中的 CSS 片段加入如下注释:

```css
/* @settings

name: Your Section Name Here
id: a-unique-id
settings:
    - 
        id: my-title
        title: My Settings
        type: heading
        level: 3
    - 
        id: accent
        title: Accent Color
        type: variable-color
        format: hsl-split
        default: '#007AFF'

*/
```

将得到:

<img src="https://raw.githubusercontent.com/Dyse-Sofqi/obsidian-style-tuner/main/screenshots/example01.png" alt="Example output of plugin" />

---

Each setting definition must be separated by a dash (`-`). There are 7 setting types.

All settings definitions must have these parameters:

- `id`: A unique id for the setting parameter
- `title`: The name of the setting
- `description` (optional): a description of the setting
- `type`: The type of setting. Can be one of:
  - `heading`: a heading element for organizing settings
  - `class-toggle`: a switch to toggle classes on the `body` element
  - `class-select`: a dropdown menu of predefined options to add classes on the `body` element
  - `variable-text`: a text-based CSS variable
  - `variable-number`: a numeric CSS variable
  - `variable-number-slider`: a numeric CSS variable represented by a slider
  - `variable-select`: a text-based CSS variable displayed as a dropdown menu of predefined options
  - `variable-color`: a color CSS variable with corresponding color picker


## `heading`

`heading`s can be used to organize and group settings into collapsable nested sections. Along with the required attributes, `heading`s must contain a `level` attribute between `1` and `6`, and can optionally contain a `collapsed` attribute:

```css
/* @settings

name: Your Section Name Here
id: a-unique-id
settings:
    - 
        id: this-is-a-heading
        title: My Heading
        type: heading
        level: 2
        collapsed: true

*/
```

## `info-text`

`info-text` displays arbitrary informational text to users. The `description` may contain markdown if `markdown` is set to `true`.

```css
/* @settings

name: Your Section Name Here
id: a-unique-id
settings:
    - 
        id: my-info-text
        title: Information
        description: "This is *informational* text"
        type: info-text
        markdown: true

*/
```

## `class-toggle`

`class-toggle`s will toggle a css class on and off of the `body` element, allowing CSS themes and snippets to toggle features on and off. The `id` of the setting will be used as the class name. The `default` parameter can optionally be set to `true`. `class-toggle` also supports the `addCommand` property. When set to `true` a command will be added to obsidian to toggle the class via a hotkey or the command palette.

```css
/* @settings

name: Your Section Name Here
id: a-unique-id
settings:
    - 
        id: my-css-class
        title: My Toggle
        description: Adds my-css-class to the body element
        type: class-toggle

*/
```

## `class-select`

`class-select` creates a dropdown of predefined options for a CSS variable. The `id` of the setting will be used as the variable name.

- When `allowEmpty` is `false`, a `default` option **must** be specified.
- When `allowEmpty` is `true`, the `default` attribute is optional, and may be set to `none`.

```css
/* @settings

name: Your Section Name Here
id: a-unique-id
settings:
    - 
        id: theme-variant
        title: Theme variant
        description: Variations on a theme
        type: class-select
        allowEmpty: false
        default: my-class
        options:
            - my-class
            - my-other-class
            - and-yet-another

*/
```

Options may also be given a label:

```css
/* @settings

name: Your Section Name Here
id: a-unique-id
settings:
    - 
        id: theme-variant
        title: Theme variant
        description: Variations on a theme
        type: class-select
        allowEmpty: false
        default: my-class
        options:
            - 
                label: My Class
                value: my-class
            - 
                label: My Other Class
                value: my-other-class
*/
```

## `variable-text`

`variable-text` represents any text based CSS value. The `id` of the setting will be used as the variable name. The output will be wrapped in quotes if `quotes` is set to true. `variable-text` settings require a `default` attribute.

```css
/* @settings

name: Your Section Name Here
id: a-unique-id
settings:
    - 
        id: text
        title: UI font
        description: Font used for the user interface
        type: variable-text
        default: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif

*/
```

This will output the variable:

```
--text: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
```

Using `quotes`:

```css
/* @settings

name: Your Section Name Here
id: a-unique-id
settings:
    -
        id: icon
        title: Bullet Icon
        description: Text used in bullet points
        type: variable-text
        default: •
        quotes: true
*/
```

This will output the variable:

```
--icon: '•'
```

## `variable-number`

`variable-number` represents any numeric CSS value. The `id` of the setting will be used as the variable name. `variable-number` settings require a `default` attribute. Optionally, a `format` attribute can be set. This value will be appended to the number. Eg `format: px` will result in `42px`

```css
/* @settings

name: Your Section Name Here
id: a-unique-id
settings:
    - 
        id: line-width
        title: Line width
        description: The maximum line width in rem units
        type: variable-number
        default: 42
        format: rem

*/
```

This will output the variable:

```
--line-width: 42rem;
```

## `variable-number-slider`

`variable-number-slider` represents any numeric CSS value. The `id` of the setting will be used as the variable name. `variable-number-slider` settings require a `default` attribute, as well as these three attributes:

- `min`: The minimum possible value of the slider
- `max`: The maximum possible value of the slider
- `step`: The size of each "tick" of the slider. For example, a step of 100 will only allow the slider to move in increments of 100.

Optionally, a `format` attribute can be set. This value will be appended to the number. Eg `format: px` will result in `42px`

```css
/* @settings

name: Your Section Name Here
id: a-unique-id
settings:
    - 
        id: line-width
        title: Line width
        description: The maximum line width in rem units
        type: variable-number-slider
        default: 42
        min: 10
        max: 100
        step: 1

*/
```

This will output the variable:

```
--line-width: 42;
```

## `variable-select`

`variable-select` creates a dropdown of predefined options for a CSS variable. The `id` of the setting will be used as the variable name. `variable-select` settings require a `default` attribute as well as a list of `options`.

```css
/* @settings

name: Your Section Name Here
id: a-unique-id
settings:
    - 
        id: text
        title: UI font
        description: Font used for the user interface
        type: variable-select
        default: Roboto
        options:
            - Roboto
            - Helvetica Neue
            - sans-serif
            - Segoe UI

*/
```

Options can optionally be given a label:

```css
/* @settings

name: Your Section Name Here
id: a-unique-id
settings:
    - 
        id: text
        title: UI font
        description: Font used for the user interface
        type: variable-select
        default: Roboto
        options:
            - 
                label: The best font
                value: Roboto
            - 
                label: The next best font
                value: Helvetica Neue
*/
```

This will output the variable:

```
--text: Roboto;
```

## `variable-color`

`variable-color` creates a color picker with a variety of output format options. A `default` attribute is required in `hex` or `rgb` format. **Note: hex color values must be wrapped in quotes.** A `format` attribute is also required. 

Optional parameters:
-  Setting `opacity` to `true` will enable opacity support in all output formats.
-  A list of alternate output formats can be supplied via the `alt-format` setting

```css
/* @settings

name: Your Section Name Here
id: a-unique-id
settings:
    - 
        id: accent
        title: Accent Color
        type: variable-color
        opacity: false
        format: hex
        alt-format:
            -
                id: accent-rgb
                format: rgb
        default: '#007AFF'

*/
```

This will output the variable:

```
--accent: #007AFF;
--accent-rgb: rgb(0, 123, 255);
```

## `variable-themed-color`

`variable-themed-color` is identical to `variable-color` except that it generates two color pickers for a light and dark variant.

```css
/* @settings

name: Your Section Name Here
id: a-unique-id
settings:
    - 
        id: accent
        title: Accent Color
        type: variable-themed-color
        format: hex
        opacity: false
        default-light: '#007AFF'
        default-dark: '#2DB253'

*/
```

This will apply the variables to the current theme:

```
// light theme active
--accent: #007AFF;
// dark theme active
--accent: #2DB253;
```

The variables are set inline on `<body>` (`body` keeps the `css-settings-manager`
class, so themes that scope overrides with `body.css-settings-manager` keep
working), and the light/dark variants follow the active theme automatically.

### `variable-color` formatting options

There are 8 formatting options:

- `hex`

```
--accent: #007AFF;
```

When `opacity` is set to `true`:

```
--accent: #007AFFFF;
```

- `rgb`

```
--accent: rgb(0, 122, 255);
```

When `opacity` is set to `true`:

```
--accent: rgba(0, 122, 255, 1);
```

- `rgb-values`

```
--accent: 0, 122, 255;
```

When `opacity` is set to `true`:

```
--accent: 0, 122, 255, 1;
```

- `rgb-split`

```
--accent-r: 0;
--accent-g: 122;
--accent-b: 255;
```

When `opacity` is set to `true`:

```
--accent-r: 0;
--accent-g: 122;
--accent-b: 255;
--accent-a: 1;
```

- `hsl`

```
--accent: hsl(211, 100%, 50%);
```

When `opacity` is set to `true`:

```
--accent: hsla(211, 100%, 50%, 1);
```

- `hsl-values`

```
--accent: 211, 100%, 50%;
```

When `opacity` is set to `true`:

```
--accent: 211, 100%, 50%, 1;
```

- `hsl-split`

```
--accent-h: 211;
--accent-s: 100%;
--accent-l: 50%;
```

When `opacity` is set to `true`:

```
--accent-h: 211;
--accent-s: 100%;
--accent-l: 50%;
--accent-a: 1;
```

- `hsl-split-decimal`

```
--accent-h: 211;
--accent-s: 1;
--accent-l: 0.5;
```

When `opacity` is set to `true`:

```
--accent-h: 211;
--accent-s: 1;
--accent-l: 0.5;
--accent-a: 1;
```

## `color-gradient`

`color-gradient` outputs a fixed number of colors along a gradient between two existing color variables. A `format` attribute is also required. *Note: The `to` variable must be set in style settings for the gradient to be generated. Also, gradients will only be generated using colors defined under the current style settings `id`.*

Parameters:
- `from`: The starting color, or color that will be at step 0
- `to`: The ending color, or color that will be at step 100
- `step`: The increment at which to output a CSS variable. For example, setting `step` to `10` will output `--var-0`, `--var-10`, `--var-20`, etc...
- `format`: Can be one of: `hsl`, `rgb`, or `hex`;
- `pad`?: When set, the number section of the variable will be padded with `0`'s until it contains this number of digits. For example, setting `pad` to `3` and `step` to `10` will output `--var-000`, `--var-010`, `--var-020`

```css
/* @settings

name: Your Section Name Here
id: a-unique-id
settings:
    -
        id: color-base
        type: color-gradient
        from: color-base-00
        to: color-base-100
        step: 5
        pad: 2
        format: hex

*/
```

## Plugin Support

Plugins can specify a style setting config in the plugin's CSS. Plugins must call `app.workspace.trigger("parse-style-settings")` when the plugin loads in order for Style Tuner to be notified of CSS changes. This event name is kept for compatibility with the original Style Settings plugin interface.

## Localization Support

Translations for titles and descriptions can be supplied for each language Obsidian supports by using one of the following postfixes:

```
en: English
zh: 简体中文
zh-TW: 繁體中文
ru: Русский
ko: 한국어
it: Italiano
id: Bahasa Indonesia
ro: Română
pt-BR: Português do Brasil
cz: čeština
de: Deutsch
es: Español
fr: Français
no: Norsk
pl: język polski
pt: Português
ja: 日本語
da: Dansk
uk: український
sq: Shqip
tr: Türkçe (kısmi)
hi: हिन्दी (आंशिक)
nl: Nederlands (gedeeltelijk)
ar: العربية (جزئي)
```

For example:

```css
/* @settings

name: Your Section Name Here
id: a-unique-id
settings:
    - 
        id: my-css-class
        title: My Toggle
        title.de: Mein Toggle
        title.ko: 내 토글
        description: Adds my-css-class to the body element
        description.de: Fügt my-css-class zum body-Element hinzu
        description.ko: my-css-class를 body 요소에 추가합니다
        type: class-toggle

*/
```

## License

Style Tuner is licensed under the [GNU General Public License v3.0](LICENSE), following the license of the upstream Style Settings project. Contributions are welcome under the same license.

本插件包含移植自 [Obsidian Linter](https://github.com/platers/obsidian-linter) 的代码，该项目由 Victor Tao 以 [MIT 协议](src/linter/LICENSE)发布（Copyright (c) 2021-2022 Victor Tao）。依照 MIT 协议要求，其版权与许可声明随源码一并保留（见 `src/linter/LICENSE`）；合并后的作品整体以 GPL-3.0 发布，移植部分继续遵循其原 MIT 许可。

This repository contains code ported from [Obsidian Linter](https://github.com/platers/obsidian-linter) by Victor Tao, released under the [MIT License](src/linter/LICENSE) (Copyright (c) 2021-2022 Victor Tao). As required by the MIT license, its copyright and permission notice is preserved with the sources (see `src/linter/LICENSE`); the combined work is distributed under GPL-3.0, while the ported linter sources remain under their original MIT license.

**致谢 / Credits**: 感谢 [mgmeyers](https://github.com/mgmeyers) 的 Style Settings 与 [platers / Victor Tao](https://github.com/platers) 及 Obsidian Linter 的所有贡献者。Thanks to [mgmeyers](https://github.com/mgmeyers) for Style Settings, and to [platers / Victor Tao](https://github.com/platers) and all Obsidian Linter contributors.
