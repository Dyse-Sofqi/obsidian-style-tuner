# 更新日志

本文件记录 Style Tuner 的版本演进。Style Tuner 基于 [mgmeyers/obsidian-style-settings](https://github.com/mgmeyers/obsidian-style-settings) 独立维护,保留原插件全部生态兼容能力,更新记录仅覆盖 fork 自身的变更。

---

## 1.2.1 (2026-10-07)

对 1.2.0 内置 Linter 的整理与界面优化，无规则行为变化；并补做了一轮插件审核复查。

### 新增功能

- 无。

### 变更

- **「文件与文件夹」拆分为三张独立卡片**：忽略文件夹、忽略文件、额外文件扩展名各占一张带标题的卡片，层级更直观（「文件与文件夹」汇总卡片移除）。
- **「粘贴规范」标签页并入「内容规范」**：粘贴类 6 条规则作为带「粘贴」标题的独立卡片移入「内容规范」标签页末尾，标签组从六页减为五页（格式化 / YAML规范 / 内容规范 / 空行规范 / 自定义规范）。

### 移除

- **移除 Linter 的「自定义命令」功能**（上游 obsidian-linter 的「lint 完成后自动执行 Obsidian 命令」）：该功能仅用于串联其他插件的命令，使用面窄且带执行副作用（批量 lint 时会对每个文件静默执行命令），故整体裁剪。「自定义规范」标签页仅保留自定义正则替换；全库/文件夹 lint 确认弹窗不再出现自定义命令警告。旧 `data-linter.json` 里残留的 `lintCommands` 字段会在加载时自动清除，无需手动迁移；同时移除不再使用的 `async-lock` 依赖与命令搜索建议组件。

### 错误修复

- 修正调试分组中「Linter 配置」的描述文案：数据文件名由过时的 `data.json` 更正为 `data-linter.json`（1.2.0 起 Linter 设置独立存放于该文件，描述未同步）。

### 文档

- **README 最低版本徽章修正** — 徽章一直写着 Obsidian ≥ 1.5.0，而 1.2.0 起 `manifest.json` 的 `minAppVersion` 已是 1.13.0（Linter 设置依赖 1.13 的声明式设置 API），徽章与实现不符，现更正为 1.13.0。
- **CHANGELOG 1.2.0 章节标题结构修正** — 该节里一个空的「### 变更」后紧跟重复的「### 新增功能」，把迁移类条目错误地并进了「新增功能」；现合并为单处「变更」，条目归属与语义一致。

### 插件审核复查（obsidianmd/eslint-plugin@0.4.2 `recommended`）

1.2.0 引入了 `src/linter/` 下约 2.3 万行移植代码，故对 `src/**`（含 `src/linter/**`）重跑了一轮官方审核规则复查：**error 级规则全部通过**。其中审核要点「Sets styles directly instead of using CSS classes, `setCssProps`, or `setCssStyles`」（`obsidianmd/no-static-styles-assignment`）**零命中**——

- 全部 9 处动态样式写入都收敛在 `src/Utils.ts` 的 `setCssProps()` 辅助函数里（`body` 上的 CSS 变量、取色器的 `--pcr-color`），它优先调用 Obsidian 的 `element.setCssProps()`，仅当老版本没有该扩展方法时才退回 `style.setProperty`。函数内那唯一一处 `style.setProperty` 位于能力探测后的回退分支，规则不判为违规（已用探针文件实测：`el.style.color = 'red'` 会报 error，`el.setCssProps()` 不会）。
- 其余 error 级规则（`no-forbidden-elements`、`platform`、`detach-leaves`、`no-sample-code`、`regex-lookbehind`、`sample-names`、`settings-tab/no-manual-html-headings`、`no-problematic-settings-headings`、`rule-custom-message`）同样零命中。

复查后保留的 warn 级告警（均为有意为之或移植代码的既有权衡）：

- `obsidianmd/hardcoded-config-path`（20 处）、`obsidianmd/no-global-this`（3 处）——全部落在测试文件（`AppearanceManager.test.ts` 的 `.obsidian` fixture、三个测试的 `window` mock），不进打包产物；
- `obsidianmd/prefer-window-timers`（6 处）——取色器 `show` 时那段 `activeWindow.requestAnimationFrame` 双击是为 popout 窗口里的选择框定位服务的，改用 `window` 会取到主窗口的帧回调；
- `obsidianmd/prefer-get-language`（1 处）——`src/lang/helpers.ts` 继续读 localStorage 的 `language` 键：静态引入 `getLanguage()` 会让单测里的 `obsidian` 解析失败，两者取值一致，代码里已注明原因；
- `obsidianmd/settings-tab/prefer-setting-definitions`（2 处）——`SettingsPanel` 用的是自定义渲染（同一份实现要同时服务独立视图与插件设置页），未走 1.13 的声明式设置定义；
- `obsidianmd/ui/sentence-case`（2 处）——品牌名「Style Tuner」与 moment 日期占位符 `dddd, MMMM Do YYYY, h:mm:ss a`，都不是待改写的界面句子；
- `obsidianmd/editor-drop-paste`（1 处，`src/linter/main.ts`）——规则只看事件回调本身，实际的 `evt.preventDefault()` 写在同一文件的 `modifyPasteEvent()` 里（`stopPropagation()` 之后），行为正确；
- `obsidianmd/object-assign`（1 处，`src/linter/rules/rule-builder.ts`）——`Object.assign(new this.OptionsClass(), options)` 的目标是刚构造的空实例，不存在覆盖共享对象的问题。

> 说明：官方 `recommended` 里还带一组 `@typescript-eslint` 类型安全规则（`no-unsafe-*` 等）。移植的 Linter 上游代码按 `strictNullChecks: false` 的宽松风格编写，这组规则会报出约 300 条告警；它们不属于 Obsidian 插件审核的判定项，本轮不做收敛。

---

## 1.2.0 (2026-10-06)

本版本把 [Obsidian Linter](https://github.com/platers/obsidian-linter)（MIT，作者 Victor Tao / platers）的 Markdown 美化引擎整体移植进插件，以 Style Tuner 为宿主运行。**最低 Obsidian 版本从 1.5.0 提升到 1.13.0**（Linter 设置页依赖 1.13 的声明式设置 API）。

### 新增功能

- **内置 Markdown Linter 引擎（源码位于 `src/linter/`）** — 66 条规则，分 YAML / 标题 / 脚注 / 内容 / 间距 / 粘贴六大类；命令：lint 当前文件（可选跳过忽略项）、lint 全库、lint 指定文件夹、忽略当前文件 / 文件夹、粘贴为纯文本、预览 Lint（差异视图）；触发：保存时、切换文件时、粘贴拦截（启用粘贴规则后）；设置页新增独立「Linter」标签页（常规 / 规则分类 / 忽略列表 / 自定义正则 / 自定义命令 / 调试）。Linter 设置独立存放于 `data-linter.json`，与样式设置的 `data.json` 互不影响。README 的「Linter 集成」与 License 节有详细说明与致谢。
- **架构：Linter 以组件形式宿主** — `src/linter/main.ts` 的 `LinterPlugin` 不再继承 Obsidian `Plugin`，而是门面类：命令、事件、视图、编辑器建议、设置页全部委托宿主插件注册，数据读写经 `loadData`/`saveData` 门面落到独立文件。规则注册表 `rules-registry.ts` 由 glob 导入改为显式逐条导入，方便后续按条精简。

### 变更

- **Linter 设置项全面迁入 Style Tuner 面板，独立「Linter」设置页删除** — 标签组最终为「样式设置 / CSS 片段 / 格式化 / YAML规范 / 内容规范 / 空行规范 / 粘贴规范 / 自定义规范」：
  - 「格式化」：常规开关、YAML 通用样式、文件与文件夹，原独立 Debug 页合并为其中一张独立卡片（日志级别 / Linter 配置 / 日志收集）；
  - 「YAML规范」：YAML 类 15 条规则（单卡片）；「内容规范」：内容 + 标题 + 脚注三个分组，各自带标题与卡片；「空行规范」：空行 / Spacing 类 20 条规则；「粘贴规范」：粘贴类 6 条规则；「自定义规范」：自定义命令、自定义正则替换两个分组（含增删排序）。
  - linter 的 `settingsTab` 不再 `addSettingTab`，仅作为定义与控件绑定的宿主；`update()` / `refreshDomState()` 相应脱离基类（基类实现面向已删除的 Obsidian 渲染页），定义变化通知改走面板监听。
- **Style Tuner 面板新增「格式化」标签页** — 标签组变为「样式设置 / CSS 片段 / 格式化」，格式化页顶部的常规开关合并为一张卡片（开关联动的隐藏项出现时仍在同一卡片内）。linter 设置页里「规则」之前的设置项（常规开关：保存时格式化、文件修改时格式化、差异预览；YAML 通用样式；文件与文件夹：忽略文件夹 / 忽略文件 / 额外文件扩展名）迁移到此标签页展示，并**从「Linter」设置页移除**（该页现在只有规则 / 自定义 / Debug）。为此新增 `DefinitionsRenderer`：按 Obsidian 原生 DOM 结构渲染 1.13 声明式设置定义（`.setting-group > .setting-items` 卡片、原生内缩分隔线、toggle / 下拉 / 数字 / 文本控件绑定、内嵌 page 小节、列表增删与上移下移），列表增删经 `settingsTab.update()` → `onFormatChange` 通知面板重渲染。「文件与文件夹」卡片内的小节做了排版对齐：空状态行复用设置行样式（同内边距与分隔线），相邻小节标题上方补原生同款分隔线。修复添加忽略项后应用卡死：`update()` 的监听通知改为快照遍历，且格式化页的变更监听只注册一次——此前每次渲染都解绑重绑监听器，而 JS Set 的 for-of 会访问遍历期间新增的元素，监听器在同一轮遍历中被反复执行，造成无限重渲染。

- **构建链升级** — esbuild 0.17.3 → 0.28.0（标准装饰器支持）、TypeScript 4.7 → 5.9、obsidian 类型 1.6.6 → 1.13.1、tslib → 2.8.1；`target` 提升到 es2020；`styles.css` 聚合新增 `linter` 段（Linter 设置页样式）。
- **tsconfig** — `lib` 升到 esnext；`strictNullChecks` 暂时关闭（移植的 Linter 上游代码按 null 宽松风格编写，且上游本身不跑 tsc；后续精简时可按文件逐步恢复）。
- **eslint** — `no-unused-vars` 豁免 `_` 前缀参数（Linter 的既有约定）、`no-constant-condition` 允许 `while` 循环、`prefer-const` 采用 `destructuring: 'all'`；新增依赖与升级后全量 lint 通过。

### 精简（按需求裁剪）

- **删除 auto-correct 拼写更正模块** — 移除 `auto-correct-common-misspellings` 规则及其全部支撑代码：联网下载错拼词表（`utils/auto-correct-misspellings.ts`、`default-misspellings.md`）、MD 文件选择器（`MdFilePickerOption` / `MdFilePickerOptionBuilder`、md-file-suggester、parse-results-modal、auto-correct-files-picker-option）、`RulesRunner` 中的错拼词注入与跳过逻辑、设置迁移项。`createRunLinterRulesOptions` 相应去掉 `defaultMisspellings` 参数。插件从「唯一联网的规则」变为完全离线。
- **语言包只保留中英文** — 删除 21 个语言包（ar/cz/da/de/es/fr/hi/id/it/ja/ko/nl/no/pl/pt/pt-BR/ro/ru/sq/tr/uk），保留 `en`、`zh-cn`、`zh-tw`；Obsidian 界面语言为其他语言时自动回退英文。同步清理三个保留语言包中的 auto-correct 死键与 `lang/validation.ts`（仅上游测试使用）。`main.js` 体积 1.30MB → 0.91MB（约 -30%）。
- **删除「覆盖默认地区语言」（linterLocale）设置项** — Linter 的界面语言与日期格式化区域完全跟随 Obsidian 界面语言（简/繁体中文各自适配，其余回退英文），不再提供手动覆盖；`LinterSettings.linterLocale` 字段与相应设置页下拉一并移除。
- **删除「无修改时不显示消息」（suppressMessageWhenNoChange）设置项** — 格式化动作发生后始终给出反馈：lint 有改动时通知「+n / -m 字符」，无改动时通知「+0 / -0」，让用户确认命令确实触发过；是否显示通知仍由「显示已更改消息」（displayChanged）总开关控制。
- **CSS 片段页卡片合并** — 「CSS 片段」标签页里的片段列表同样合并为一张卡片（原生 `setting-group` 结构：标题行「N 个 CSS 片段」与打开文件夹/刷新按钮留在卡片外，片段开关行进 `.setting-items`），行间分隔线为 Obsidian 原生内缩样式。
- **规则页卡片合并** — 每个规则分类页（YAML / 标题 / 脚注 / 内容 / 间距 / 粘贴）下的规则不再各自一张卡片，合并为**一张卡片**（规则定义由每规则一个 group 改为每分类一个 group）。行间分隔完全交给 Obsidian 原生的组内分隔线（`.setting-group .setting-item::before`，两侧随卡片内边距内缩），不额外绘制线条。规则行内的文档图标、启用开关与选项布局不变，搜索索引不受影响。
- **补齐中英文文案，界面语言完整适配** — 系统比对 en 与 zh-cn / zh-tw 的文案键：zh-cn 补齐 99 个、zh-tw 补齐 97 个缺失键（现均为 561/561 全覆盖），包括 diff 预览全套文案（命令「预览当前文件的 Lint 更改」、「Lint 预览」视图标题、应用/关闭按钮、差异摘要等）、忽略文件/文件夹命令、行内字段移入 YAML 规则整块、表格列对齐（繁体）、各列表编辑器的空状态与占位文案、枚举下拉显示值与校验消息。此前缺失的键一律回退英文，现已随 Obsidian 界面语言完整显示。

### 修复（移植自上游时的顺手修复）

- 全新安装时 `moveTextAreaSettingsToListItemSettings` 在空 `ruleConfigs` 上解引用崩溃（上游在存量数据下未触发）；
- 「附加文件扩展名」列表页漏传 `plugin`，删除条目会抛错；
- YAML key sort 规则的 `empty-state` / `placeholder-text` 文案在 en 语言包挂在了错误的键下（运行时显示为空）；
- `ListItemOption` 构造参数错位（`defaultValue` 落到 `ruleAlias` 槽位，靠后续覆写才未出错）。

---

## 1.1.1 (2026-10-05)

本轮把 1.0.8 之后的全部工作（变量名搜索、导出弹窗重做、工具栏布局、审核合规）合并为一个版本发布。

### 新增功能

- **搜索栏支持按 CSS 变量名 / 设置项 id 搜索** — 此前只拿标题与描述做模糊匹配，而变量名只存在于设置项 `id` 里（标题是「功能区内边距」这类自然语言，不含 `--ribbon-padding`），所以输入 `--ribbon-padding` 一条结果都搜不到。现在把 id 纳入搜索候选：
  - 变量设置（`variable-*`）同时接受 `ribbon-padding` 与 `--ribbon-padding` 两种写法；
  - 类开关 / 类下拉（`class-toggle` / `class-select`）接受其类名 id（如 `wide-tables`）；
  - 标题、描述照旧参与匹配，命中后的结果计数与自动展开行为不变；候选串在组件里缓存一次，输入时不重复构造；
  - 变量名同时追加进 Settings Search 插件的注册描述（该插件的模糊匹配同时比对 `text` 与 `desc`），在它的全局设置搜索里也能按变量名命中。
- **导出弹窗重做：左右两栏 + 更大尺寸 + 更合理的默认勾选** — 此前区块列表与导出内容上下堆叠，弹窗沿用 Obsidian 默认的 560px 对话框宽度、高度只有 70vh，稍长一点的配置只能看到几行。现在：
  - 弹窗宽度跟随设置面板的 `--ss-modal-width`（`min(1180px, 96vw)`，见 `beautify.css`），高度 `min(760px, 88vh)`；导入弹窗共用这套尺寸，粘贴框同样受益。
  - **左栏 = 区块**：标题与说明、可滚动的区块列表（分组标题吸顶、已勾选区块带一层极淡强调色、来源未启用的区块保留徽标与计数），底部为「全部勾选 / 全部取消勾选 + 已选 n / m」。
  - **右栏 = 导出内容**：标题与说明、撑满剩余高度的等宽配置框，底部右侧为「复制到剪贴板 / 下载」。
  - **默认只勾选「当前启用」的区块**：来源未启用的主题 / 片段留下的残留配置不再默认导出（一个启用中的区块都没有时退回全选，避免一打开就是空导出）。
  - 单区块导出没有可勾选的区块，输出栏独占整宽；窄容器下两栏自动改为上下堆叠、区块列表限高。

### 变更

- **弹窗里的「文字按钮」改成 Obsidian 原生按钮** — 导出弹窗底部的「全部勾选」「复制到剪贴板」「下载」以及导入弹窗的「从文件导入」此前是蓝色下划线文字链接（看着像按钮的纯文本），现在统一改用 `ButtonComponent`（样式来自 `app.css` 的原生按钮）；下载改为点击时才生成数据链接，复制成功时按钮闪一下绿色。
- **CSS 片段页的两个操作改成图标按钮** — 「打开样式代码片段文件夹」与「刷新」改为 lucide 图标按钮（`folder-open` / `refresh-cw`，与工具栏的导入 / 导出同款 `clickable-icon`），动作说明移到 tooltip，标题行只剩「N 个 CSS 片段」。
- **工具栏自适应重排** — 外观控件的间隙收紧（列间距 24px → 14px、「标签 + 下拉」6px → 4px、与图标按钮 8px → 6px）；两个下拉不再被拆到两行；空间不足时整行换行（搜索框独占一行）；容器窄到 Obsidian 把设置行改成纵向时，两个控件各占一行。
- **界面文案** — 新增「已勾选区块的全部自定义值。」（`All customized values of the checked sections.`，其余语言回退英文）；导出范围标题不再多一个空格（中文等以全角冒号结尾的标签此前会拼成「导出设置： 全部设置」）。
- **命令 id 规范化** — `show-style-tuner-leaf` → `show-view`（Obsidian 已用插件 id 做命名空间，命令显示名不变）。**如果你为该命令绑过快捷键，需要在「快捷键」里重新绑一次。**
- **README 完善中英双语功能说明** — 中文与英文条目一一对应，补齐变量名搜索、导出弹窗布局、图标按钮、窄容器适配、审核合规等本轮能力。

### 修复

- **搜索栏按变量名搜不到设置项** — 见上方「新增功能」第一条。
- **搜索结果计数文案未本地化** — 过滤时固定输出英文 `N Results`，而首次渲染走的是 `t('{{count}} Results')`；现统一走本地化字符串（中文界面显示「1 项结果」）。
- **CSS 片段变多后工具栏被挤成两行** — 根因是设置页内容区出现垂直滚动条时窄了十几像素，正好把「颜色模式 / 主题」两个下拉拆开换行。修法是给两个入口都预留滚动条宽度（`scrollbar-gutter: stable`；设置页用 `:has(.style-settings-panel)` 只作用于 Style Tuner 标签页，独立视图只作用于自身 `.view-content`），再配合上面的间隙收紧与整行换行，列表长短变化不再影响工具栏排版。

### 插件审核复查（obsidianmd/eslint-plugin `recommended`）

用官方 `eslint-plugin-obsidianmd@0.4.2` 的 `recommended` 配置（39 条 Obsidian 专项规则 + 类型检查规则）对本仓库 `src/**` 做了一轮复查：**error 级规则全部通过**，并修掉以下问题：

- **直接设置元素样式**（`no-static-styles-assignment` 指向的那类写法）— `<body>` 上应用 CSS 变量、取色器的 `--pcr-color` 共 8 处 `style.setProperty(...)`，统一收敛到新的 `setCssProps()` 辅助函数：优先调用 Obsidian 的 `element.setCssProps()`，老版本没有该扩展方法时才退回 `style.setProperty`，同时把 N 次样式写入合并成一次。变量的**移除**仍用 `removeProperty`——`setCssProps` 只能“设置”，把值设成空串会留下空的 `--x:` 内联声明，反过来盖住主题自己的同名变量。
- **`onunload` 里 `detachLeavesOfType`**（`detach-leaves`，error 级）— 已移除：插件卸载时 Obsidian 会自行清理本插件注册的视图叶子，手动摘叶子会把用户的工作区布局一起重置；视图重开路径（`activateView`）里的清理保持不变。
- **`document.createElement`**（`prefer-create-el`）— 剪贴板回退用的隐藏 `textarea`、导出下载用的临时 `a`、以及 `createEl('div')` 共 3 处改为 Obsidian 的 `createEl` / `createDiv`。
- **定时器作用域**（`prefer-window-timers`）— `parseCSS` 的防抖、编辑器重测防抖、复制按钮的成功态复位共 3 处改用 `window.setTimeout` / `window.clearTimeout`。
- **命令 id 带插件 id**（`commands/no-plugin-id-in-command-id`）— 见上「变更」。

复查后仍保留的告警（均为 warn，且已确认是有意为之）：

- `prefer-window-timers`：取色器 `show` 时那段 `activeWindow.requestAnimationFrame` 双击是为 popout 窗口里的选择框定位服务的，改用 `window` 会取到主窗口的帧回调，故保留。
- `prefer-get-language`：`lang/helpers.ts` 继续读 localStorage 的 `language` 键——本插件 `minAppVersion` 为 1.5.0，而 `getLanguage()` 是较新的 API（当前 `obsidian@1.6.6` 类型定义里还没有它），静态引入会让老版本直接报错，也会让单测里的 `obsidian` 解析失败；两者取值一致，代码里已注明原因。
- `settings-tab/prefer-setting-definitions`：Obsidian 1.13 起的新声明式设置 API，需要把 `minAppVersion` 抬到 1.13 才能用，本轮不动。
- `ui/sentence-case`：`getDisplayText()` 返回品牌名「Style Tuner」，不改成「Style tuner」。
- `hardcoded-config-path` / `no-global-this`：全部落在测试文件（`AppearanceManager.test.ts` 的 `.obsidian` fixture、三个测试的 `window` mock），不进打包产物。

---

## 1.0.8 (2026-10-05)

### 新增功能

- **插件设置页与独立视图功能对齐** — 「设置 → 第三方插件 → Style Tuner」此前只有搜索框与导入 / 导出按钮，缺少独立标签页视图里的其余控件，现在两处完全一致：
  - 工具栏新增「颜色模式」（跟随系统 / 亮色 / 深色）与「主题」（默认主题 + 全部已安装主题）下拉，排在搜索框之后、导入导出按钮之前；切换后同样触发样式设置重新解析，并随 `css-change` 与别处（Obsidian 外观设置、片段变化）的改动自动同步。
  - 新增「样式设置 / CSS 片段」标签页导航：设置页里也能直接启停库中的 CSS 片段、手动刷新列表、在系统文件管理器中打开片段文件夹（桌面端）。

### 变更

- **标签组与标签页样式重做** — 「样式设置 / CSS 片段」标签组改为分段式外观（参考 MDRazor 的设置标签组）：选中项是坐在基线上的圆顶卡片（描边 + 次级底色 + 加粗），未选中项为纯文字、悬停才亮起，切换时标签本身不位移；同时去掉工具栏下方那条多余的分割线（标签组自带基线，两条线上下叠在一起显得脏），并给标签页内容补上顶部间距，首张区块卡片不再紧贴基线。
- **界面实现合并为一份** — 新增 `SettingsPanel`（工具栏 + 标签页导航 + 两个标签页内容），独立视图（`SettingsView`）与插件设置页（`CSSSettingsTab`）共用同一份实现，只由 `isView` 区分颜色选择器的挂载容器（视图挂到 `body`，避免被内容区裁剪）。此前两处各写一套 DOM，功能因此逐渐分叉——本次补齐的缺口正是分叉的结果。

---

## 1.0.7 (2026-09-14)

### 新增功能

- **「打开样式代码片段文件夹」按钮** — CSS 片段标签页标题行新增按钮，一键在系统文件管理器中打开库的 `snippets` 目录；目录不存在时自动创建，与官方「外观 → CSS 片段」的打开文件夹按钮行为一致。仅在桌面端显示（移动端没有可打开的文件管理器），打开失败时弹出通知。

### 修复

- **开关 CSS 片段时片段列表被重复渲染** — 列表刷新改为「先取数据、再整体替换 DOM」。此前是先清空容器再异步读取：等待期间容器为空，既造成闪烁，又会让「切回片段标签页」时的空容器判断（`hasChildNodes()`）误以为尚未渲染而再触发一次刷新，两次异步渲染先后往同一个容器追加，片段列表就会重复出现。现在额外用刷新序号丢弃过期结果，只允许最新一次刷新写入 DOM。

### 文档

- **README 功能与关键词重写** — 中英双语「关键词」「简介」「功能」章节补齐本轮能力：独立标签页视图、外观设置接管（颜色模式 / 主题切换）、CSS 片段启停管理、打开片段文件夹、搜索与导入导出；「安装」与「数据存储」补充英文对照。
- **修复 README 历史编码乱码** — 「Localization Support」的语言列表、韩文 / 德文示例，以及 `variable-text` 引号示例中的 `•` 字符，此前是 GBK 与 UTF-8 双重编码后的乱码（部分字节已丢失），现已按原意重建。

---
## 1.0.6 (2026-09-12)

### 修复

- **变量名复制 chip 光标恢复默认** — 悬停/常态指针由 `copy` 改为默认指针：点击复制本就由程序完成并有通知反馈，无需复制光标暗示，避免与「可拖拽/可选取」等语义混淆。

---
## 1.0.5 (2026-09-12)

### 修复

- **通过 Obsidian 社区插件审核（复审）** — 剪贴板回退用的隐藏 textarea 不再直接给元素内联样式赋值（`obsidianmd/no-static-styles-assignment`），改为附加离屏定位的 CSS 类 `style-settings-clipboard-helper`（`position: fixed; top: -9999px; opacity: 0`）；同时清理变量名复制 chip 中未使用的变量。

---
## 1.0.4 (2026-09-12)

### 新增功能

- **变量名一键复制** — 每个变量类设置项（文本 / 数值 / 滑块 / 下拉 / 单色 / 亮暗双色）标题旁新增等宽 `--变量名` code chip：单击即复制该 CSS 变量名到剪贴板。变量名直接由设置项 `id` 拼出 `--` 前缀，不依赖本地化标题或 `◉` 前缀文本，中文标题下同样可靠；复制成功与失败均有通知（「已复制到剪贴板」/「复制到剪贴板失败」），反馈即时无动画，点击不产生文本选中，悬停有轻微底色提示。
- **剪贴板工具抽取** — 导出弹窗的剪贴板写入逻辑（Clipboard API + `execCommand` 回退）抽为公用 `copyTextToClipboard`，导出与变量名复制共用同一实现。

### 修复

- **变量名 chip 底部边框被行距截断** — chip 改为自包含行内块渲染（内部 `line-height` 自持、`vertical-align: middle`），边框不再被设置行行距裁切。
- **点击 chip 产生文本选中** — 移除 `user-select: all`，改为禁用选中（复制由程序完成，无需手动选择）。

---

## 1.0.3 (2026-09-04)

### 修复

- **应用样式后编辑器行高表未刷新（点击错行）** — 本插件把 CSS 变量直接写入 `<body>` 内联样式（社区插件审核禁止动态 `<style>` 元素），而 body 内联样式变更不会触发 CM6 重新测量：若编辑器创建后变量才被应用（重启时首轮 `parseCSS` 的 100ms 防抖、明暗主题切换、设置变更、CSS 片段触发 `css-change` 重新解析等），行高表保持陈旧，`posAtCoords` 会把点击位置映射到错误的行——典型症状为「点击光标所在行的上一行下半部分，光标无法跳到上一行」，且重启后高频复现（如 `--line-height-main` 这类行高变量会被主题作用于 `.markdown-source-view.mod-cm6 .cm-scroller`）。现在每次把变量/类名应用到 `<body>` 后（`applyVariables`/`clearAppliedVariables`/`initClasses`/`removeClasses` 四处），通过 `EditorView.findFromDOM` 对全部打开的 Markdown 编辑器调用 `requestMeasure()`（50ms 防抖合并批量突变），无论应用与编辑器首次测量的先后顺序如何，都会在应用后立即刷新行高表。
- 新增 `@codemirror/view` 开发依赖（仅类型用途；esbuild 已标记 external，运行时经 Obsidian 解析，不增大插件包体）。

---

## 1.0.2 (2026-09-03)

### 新增功能

- **外观设置接入视图** — Style Tuner 独立视图中新增 Obsidian 默认外观设置接口:页面头部提供「颜色模式」(跟随系统 / 亮色 / 深色)与「主题」下拉(默认主题 + 全部已安装主题);原有样式设置内容归入第一个标签页「样式设置」,新增第二个标签页「CSS 片段」,可启用 / 停用库中的 CSS 片段并刷新列表。主题、片段在别处被修改(如 Obsidian 外观设置)后,视图通过 `css-change` 事件自动同步。
- **顶栏布局调整** — 「颜色模式 / 主题」下拉从视图顶部独立行移入「样式设置」顶栏,排在搜索框之后、导入导出按钮之前(插件设置标签页同步生效);导入 / 导出由文本链接改为 Obsidian 原生图标按钮(`clickable-icon`,上传 / 下载图标,带 `aria-label`)。
- **工具栏脱离页面内容** — 搜索框、外观控件(颜色模式 / 主题)与导入导出按钮组成视图级工具栏,整体上移至标签栏上方(与标签页同级、常驻显示,切换「CSS 片段」标签页不消失;无样式设置时的空状态也保留工具栏);插件设置标签页保持原位置。

### 修复

- **CSS 片段列表检索失败** — `src/AppearanceManager.ts` 曾按 `!f.includes('/')` 过滤 `vault.adapter.list()` 的返回值,而 Obsidian 的 `FileSystemAdapter.list` 返回的路径带 `.obsidian/snippets/` 前缀(必然含 `/`),导致全部顶层片段被误过滤、列表恒为空。现与官方 `CustomCss.readSnippets` 语义对齐:取 basename → 丢弃以点开头的隐藏文件 → 保留 `.css`(大小写不敏感)→ 按最后一个小数点截断扩展名。
- **片段启停后头部下拉重复加载** — 启用 / 停用片段会触发 `css-change` 事件进而调用 `refreshAppearanceControls`,而该方法每次都在头部容器直接追加新的「颜色模式 / 主题」下拉;现重建前先清空旧控件(`headerControlsEl.empty()`)。
- **片段启停改走官方 API** — 此前回退分支检查不存在的 `customCss.addSnippet/removeSnippet`;现优先使用 `customCss.setCssEnabledStatus(name, enabled)`(官方唯一入口:更新 `enabledSnippets` + `vault.setConfig` + 重载),缺失时再回退维护 appearance.json。
- **外观状态读运行时配置** — `getThemeMode`/`getCurrentTheme`/`getEnabledSnippets` 优先读 `vault.getConfig(...)`(与官方 `CustomCss.loadData` 同源、无磁盘写入延迟),回退 appearance.json;去除不存在的 `app.getTheme` 兜底(改按 `body.theme-dark` 推断);`setTheme('')` 与官方一致用空字符串而非 null 表示默认主题。
- **工具栏搜索框聚焦包边** — 光标进入搜索框时,Obsidian 原生 `input[type=search]:focus-visible` 会在输入框外叠一圈 2px 灰色实心方环(与 1px 边框同色,视觉上像一圈 3px 的粗包边),且环的普通圆角与 `corner-shape: superellipse` 绘制的边框形状错位,在紧凑工具栏中尤其突兀。现按用户偏好让工具栏搜索框聚焦时完全保持原样(无焦点环、无边框变色、无阴影),聚焦状态仍由光标体现;

---

## 1.0.1 (2026-09-02)

### 修复

- **通过 Obsidian 社区插件审核** — 移除运行时创建的 `<style>` 元素(审核明确禁止,报错定位在 `src/SettingsManager.ts`)。CSS 变量改为直接写入 `body` 内联样式:明暗主题变量通过 `MutationObserver` 监听 `body` class 变化,在主题切换时自动重新应用;卸载时清除全部应用过的变量。
- **取色器终于有主题样式** — Pickr nano 主题 CSS 此前只被 esbuild 打进 `main.css`,而 Obsidian 只加载 `styles.css`,发布包里取色器实际未带样式;现纳入 `styles.css` 生产构建(nano 主题与既有增强样式一并输出)。

---

## 1.0.0 (2026-09-01)

首个公开发布版本。基于上游 Style Settings `1.0.8`(提交 `f26cfa0`)。

### 新增功能

- **界面美化** — 设置面板全面美化:可折叠标题按层级显示强调色条与树形缩进线,设置项横向布局充分利用页面宽度,设置页/独立视图自动加宽,窄屏自适应;样式随主题变量自适应深浅色。
- **已自定义值高亮** — 凡是被修改过默认值的设置行都会亮起 `is-modified` 标记(含亮/暗双模式取色器),一眼区分「改过的」与「默认的」;保存与重置时实时刷新。
- **按区块导出** — 「全部设置」导出弹窗新增一级区块勾选列表:默认全选,仅勾选区块及其后代项进入导出 JSON;已停用主题/片段/插件留下的自定义数据也会以「来源未启用」徽标列出(仅当其仍有存储数据时),让遗留调校可备份、可迁移。
- **界面中文化(i18n)** — 全部界面文案接入 Obsidian 语言体系:简体中文完整翻译,其余语言回退英文;界面语言随 Obsidian「语言设置」自动切换。

### 修复

- **后台标签页恢复崩溃** — 打开插件视图后切至后台标签页再重启 Obsidian,懒挂载的占位视图会触发 `view.setSettings is not a function` 崩溃;现已对占位视图安全跳过,并在视图真正挂载时自动补齐数据。

### 变更

- **品牌重置** — 插件 id `obsidian-style-settings` → `style-tuner`,名称 "Style Settings" → "Style Tuner",作者 Sofqi,独立版本历史自 `1.0.0` 起。
- **最低版本要求** — 提升至 Obsidian `1.5.0`(界面美化使用 `:has()`、`color-mix()` 等现代 CSS 特性)。
- **发布合规** — 仓库不再跟踪 `main.js`/`main.css` 等构建产物,发布版本由 CI 构建并附加;`styles.css` 由 `esbuild` 构建时自动从 `src/css/*` 按导入级联顺序生成,release notes 由 GitHub 自动生成。
- **生态兼容保持不变** — `/* @settings` 格式、`parse-style-settings` 工作区事件、`css-settings-manager` body 类、`style-settings-*` 内部 CSS 类,以及全部 24 种界面语言回退,均与上游一致。
