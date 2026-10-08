# 更新日志

本文件记录 Style Tuner 的版本演进。Style Tuner 基于 [mgmeyers/obsidian-style-settings](https://github.com/mgmeyers/obsidian-style-settings) 独立维护,保留原插件全部生态兼容能力,更新记录仅覆盖 fork 自身的变更。

---

## 1.2.6 (2026-10-08)

把全部列表型设置项（要插入的键、各类忽略列表、自定义正则等）统一整理了外观、支持拖拽排序；「插入 YAML 属性」的键可以指定属性类型；「YAML 键排序」可以从它继承键顺序。同时把内置 Linter 占用的全局命名空间（视图类型、CSS 类、图标 id）全部收窄到本插件自己的前缀下，与 obsidian-linter 可以同时启用而不再互相顶掉。

> **版本说明**：上一版公开发布的是 `1.2.2`；其后的 `1.2.3` / `1.2.4` / `1.2.5` 都没有发布过，内容一并并入本版本（其中「规则卡片拆分」与「启动崩溃修复」开发过程中一度被误回滚，已恢复并复核）。

### 新增功能

- **「插入 YAML 属性」的键可编辑属性类型** — 该规则的条目此前是**一整行自由文本**（`'aliases: '`、`'memo:'`），插入时原样写进 frontmatter；现在每条是 `{键名, 属性类型, 默认值}`：

  - 表单三项：**属性键名**、**属性类型**（文本 / 列表 / 数字 / 复选框 / 日期 / 日期时间，与 Obsidian「属性」面板的选项一致）、**值（可留空）**。值留空时按类型插入骨架——文本 `键:`、列表 `键: []`、数字 `键: 0`、复选框 `键: false`、日期 / 日期时间取当天；表单里实时显示这一步会插入什么。
  - 插入的值按类型生成合法 YAML：列表展开成块序列（`键:` 换行后 `  - a`），数字与布尔不加引号，含冒号等特殊字符的文本自动加引号（`memo: "a: b"`）。列表的多个值用逗号分隔。
  - 在设置里新增 / 编辑条目时，同时把类型登记进 Obsidian 的 `<configDir>/types.json`，让属性面板直接按该类型显示。优先走 `app.metadataTypeManager.setType()`（Obsidian 自己写文件并同步内存状态），不可用时退回 `vault.readConfigJson / writeConfigJson('types')`——两者都不在公开类型定义里，按项目约定 `as` 收窄 + 能力探测。
  - **`aliases` / `tags` / `cssclasses` 的类型锁死为「列表」** — 这三个键的类型被 Obsidian 写死（`aliases` → 别名列表、`tags` → 标签列表、`cssclasses` → `multitext`；载入 types.json 后会被内置表 `Object.assign(assignedWidgets, UR)` 覆盖回来，属性面板里也是禁改的）。所以键名一改成这三个，**类型下拉立刻锁到「列表」并禁用**，列表行内也标注「列表（Obsidian 固定）」，写入 types.json 的步骤对它们直接跳过。不锁的话，用户把 `tags` 选成「数字」会得到 `tags: 0` 这种与 Obsidian 固定类型直接打架的值。`normalizeYamlAttributeEntries()` 同时把这三个键的声明类型强制成列表，旧数据（`aliases` / `tags` 原先是「文本」）在加载时一并纠正——插入结果由 `aliases:` 变为 `aliases: []`，与 Obsidian 自己写出的形状一致。
  - 删除条目**不会**撤销 types.json 里的类型登记——该登记是库级、面向所有笔记的，别的笔记可能已经有这个键。
  - **旧数据自动迁移**：`LinterPlugin.loadSettings()` 里把 `'aliases: '` 这类整行文本解析成 `{键名, 类型, 值}`（保留键直接取 Obsidian 固定的「列表」）并**就地**替换 settings 里那份数组（`migrateYamlAttributeEntries()`），界面与 lint 读到的始终是同一份新格式数据；迁移结果并入既有的「需要写回」标志，随下一次保存落盘。
  - 值按类型做合法性校验（数字可解析、复选框是 `true` / `false`、日期是 `YYYY-MM-DD`、日期时间是 `YYYY-MM-DDTHH:mm[:ss]`），键名用 `yaml` 解析器实测是否可作键。

- **「YAML 键排序」可以「继承」要插入的键** — 这两条规则都要一份「有序的 YAML 键清单」（一条用来插入缺失的键、一条用来排序），此前得把同一批键输两遍。现在「YAML 键优先级排序顺序」列表底部新增 **「继承『要插入的键』」按钮**：点一下把插入清单的键并进本列表，之后照常增删、拖拽调序。

  - **是并入，不是覆盖**：源键按源的顺序排在前面，本列表里多出来的键（你自己加的）保持原有先后跟在后面，重复的只留第一次出现。直接整体替换会把用户自己加的键冲掉。
  - **已经一致时什么都不做**：并入是并集，两边逐项相同时结果与原列表相同，此时直接返回、不写盘——点第二次不会发生任何事，也不会无谓重排。
  - 源清单为空时同样不动本列表。

  > 曾用「优先级顺序来源」下拉（自定义列表 / 要插入的键 自动跟随）来实现「只维护一份」，但那**天生是互斥的**：选了跟随就没法改，想在此基础上调整还得把键重输一遍。导入按钮把源当成**起点**、列表始终是唯一可编辑的基准，灵活性更好，所以下拉已移除。

  > 为什么不是把两条规则合并成一条：两者的执行时机互斥。`yaml-key-sort` 是全管线的**最后一条**（`rules-runner.ts` 里排在 `yaml-timestamp` 之后），必须看到最终键集合；而插入走常规批次（管线中间），必须让后面的规则在同一轮看到新插入的键。`hasSpecialExecutionOrder` 的规则会被排除出常规批次，一个规则只能占一个位置——合并必然牺牲其中一头。共用键清单拿到了「只维护一份」的好处，又不碰执行时机。

  > 实现上：列表定义多了 `extraActions`（渲染在「添加」的 + 左侧的动作按钮），`ListItemOption` 多了 `inheritAction`（按钮文字 / 提示 + 取源键清单的回调），合并规则是纯函数 `inheritYamlKeys()`（有单测）。这类「整份列表级别」的操作给带文字的按钮，比行内的编辑 / 删除更值得被看见。

- **列表型设置项支持拖拽排序** — 此前只有「YAML 键排序」的「优先级排序」一个列表开了排序（且是上移 / 下移箭头按钮），其余列表（插入 YAML 属性的「要插入的键」、忽略文件夹 / 忽略文件 / 额外文件扩展名、各规则的忽略键列表、自定义正则替换）都只能增删。现在所有列表统一改为**拖拽手柄 + 拖放排序**：

  - 每行左侧渲染一个 `lucide-grip-vertical` 手柄（`aria-label`「拖拽排序」）。只让手柄 `draggable`、行本身不设，这样在行内选中文本或点击编辑 / 删除按钮都不会误触发拖拽；拖拽影像用整行（`setDragImage`），不是小小的手柄。
  - 落点由指针位于目标行的上半 / 下半决定，实时画一条强调色指示线（`is-drop-above` / `is-drop-below`）；被拖的行降到 40% 不透明度。
  - 下标换算对齐 `onReorder(oldIndex, newIndex)` 的语义（先 `splice` 掉旧位置、再插到新位置）：先把落点化成「0..n 的插入缝隙」，若插入位在被拖项之后则减一，得到移除后的目标下标——否则向后拖会少一格。
  - `ListItemOptionBuilder.allowReorder` 与 `createListManagementPage` 的 `allowReorder` 默认值改为 `true`（显式传 `false` 仍可关掉）。顺序对规则本身无意义的列表（忽略列表等）也一并开放，避免同一套界面出现两种交互。
  - 原来的上移 / 下移箭头按钮已移除（`Move up` / `Move down` 两个文案键保留未删）。

- **列表外观整理**（`src/css/linter.css`）— 条目行加悬停底色与圆角、手柄常态 `--text-faint` 悬停 `--text-muted`（与 Obsidian 原生 `grip-handle` 的取值一致）、拖拽落点指示线、正在拖拽的行淡化；「添加」行与条目行留出间距、按钮悬停染强调色。全部用主题变量，深浅色自适应；未引入任何内联样式。

  > 经 `.verify` 验证台回归：模拟拖拽事件，`['aliases: ', 'tags: ']` → 把第 0 项拖到第 1 项下半得 `['tags: ', 'aliases: ']` → 再把第 1 项拖回第 0 项上半复原，落点指示线类名与「拖拽中」类的清除均符合预期。属性类型部分另有 `src/linter/utils/yaml-attributes.test.ts`（23 条单测）覆盖旧格式解析、归一化的数组引用约定、各类型的渲染与校验。

### 变更

- **YAML 标签页把「插入 YAML 属性 / YAML 键排序 / YAML 标题」提到最前** — 这三条是一条工作流：先决定「有哪些键」（插入 YAML 属性），再决定「键的顺序」（YAML 键排序），标题键由 YAML 标题补上；此前它们散落在 15 条规则的中间（第 7 / 12 / 14 位）。现在固定排在最前面，其余规则保持原有注册顺序。只调整**展示顺序**（`SettingTab.rulesOfType()` 里按别名前置），不动 `rules-registry` 的注册顺序与规则执行顺序。

- **与 obsidian-linter 共存** — 内置 Linter 的代码移植自 obsidian-linter，连它写入 Obsidian **全局命名空间**的标识也一并照抄了，于是两个插件同时启用时必然相撞：

  | 共享项 | 上游 obsidian-linter | 原值 | 现值 |
  |---|---|---|---|
  | 视图类型 | `linter-diff-preview` | `linter-diff-preview` | `style-tuner-linter-diff-preview` |
  | CSS 类（16 个） | `.linter-diff-preview-view` / `.linter-diff-*` / `.linter-list-empty` / `.disabled-list-entry` / `.modal-heading` / `.confirm-modal-checkbox-container` / `.custom-row-description` / `.linter-border-bottom` 等 | 同名 | `style-tuner-linter-*` |
  | 图标 id（5 个） | `lint-folder` / `lint-ignore-folder` / `lint-file` / `lint-ignored-file` / `lint-vault` | 同名 | `style-tuner-lint-*` |

  - **视图类型是硬冲突**：`registerView` 对已存在的类型直接抛错，`Attempting to register an existing view type "linter-diff-preview"`，后加载的那个插件整个 onload 中断。这是用户报的故障，改为 `style-tuner-linter-diff-preview` 后两边各注册各的。
  - **CSS 类与图标 id 是软冲突**：不报错，但两个插件的 styles.css 会用同一批选择子互相修饰对方的界面，图标表也会互相覆盖。现在全部加 `style-tuner-` 前缀，样式表与代码同步改名（`src/css/linter.css` 的选择器与 `diff-preview-view.ts` 等处的挂类一一对应，已用脚本核对 15 个视图类在源码样式表与构建产物里都在）。
  - 视图类型常量处加了注释说明「不要改回上游名」，避免以后又被顺手简化。

- **规则标签页的卡片拆分**（原 1.2.3）— 1.2.0 把每个规则分类下的全部规则合并成一张卡片，规则开启后它的子设置项与后一条规则的父级开关落在同一张卡片里，只有一条行分隔线相隔，分不清哪些行属于哪条规则。现在改为按**规则有没有子设置项**拆卡：`SettingTab.getRuleCategoryDefinitions()` 按 `rule.options.length > 1`（`options[0]` 是 Rule 构造时注入的 enabled 开关）判定——有的各自独立成卡片，没有的（纯开关）按原有顺序合并进相邻的卡片。按定义拆而不是按当前展开状态拆，卡片结构不会在开关切换时重排，开启规则只是让它那张卡片的行数变多；规则顺序保持不变。「内容规范」标签页的内容 / 标题 / 脚注 / 粘贴四个分组内部改用同一套拆分逻辑（经 `DefinitionsRenderer` 既有的嵌套 group 支持渲染成卡片内嵌卡片）。

  > 说明：`SettingDefinitionGroup.items` 的公开类型只接受 `SettingDefinition` / `SettingDefinitionPage`，不含嵌套 group；`DefinitionsRenderer.renderGroup` 运行时本就支持 `child.type === 'group'`，这里按鸭子类型传入，类型上做一次收窄（`rulesToNestedGroups()`）。

> 已核对无需改动的部分：命令 id（Obsidian 会自动加插件 id 前缀，本插件是 `style-tuner:*`，与 obsidian-linter 的 `obsidian-linter:*` 不撞）、设置页（内置 Linter 不注册独立设置页，设置项在 Style Tuner 面板内）、数据文件（`data-linter.json` 与 obsidian-linter 的 `data.json` 各自独立）。

> 遗留说明：`src/linter/styles.css` 是从上游带过来的重复样式表副本，未被构建读取（`esbuild.config.mjs` 只聚合 `src/css/*.css`），本次未改动；如确认无用可另行删除。

### 错误修复

- **`ruleConfigs` 缺条目时 editor-change 崩溃**（原 1.2.4）— 报错栈为 CM6 `updateListener → editor-change`，指向 `LinterPlugin` 里 `ruleConfigs['yaml-timestamp']['update-on-file-contents-updated']` 的未防护读取。根因是 `loadSettings()` 用 `Object.assign` **浅合并** `data-linter.json`：保存该文件时还没有的规则（或选项）键会整个缺失，而补齐缺失规则默认值的逻辑只挂在 `app.workspace.onLayoutReady` 的 `makeSureSettingsFilledInAndCleanupSettings()` 里——`editor-change` 监听却在 `onload()` 的 `registerEventsAndSaveCallback()` 阶段就已注册，CodeMirror 建编辑器时派发的事务会落进这段窗口，读到 `undefined` 上的属性即抛错。这也解释了「出现一次、重启就好」：首次启动后补齐逻辑把键写进了 `data-linter.json`，之后再启动就不再缺。

  三层修复：

  1. **提前补齐**（根因）— 把补齐逻辑提取为 `fillInMissingRuleDefaults()`，改在 `loadSettings()` 里调用，`onload()` 注册任何监听器之前 `ruleConfigs` 就是完整的。补齐结果记在 `ruleDefaultsFilledOnLoad` 字段里，由 `makeSureSettingsFilledInAndCleanupSettings()` 用 `||=` 并进去决定是否落盘（不覆盖冲突规则修复已有的 `updateMade`）。
  2. **读取收敛** — 两处重复的 `yaml-timestamp` 读取合并为 `getYamlTimestampUpdateTiming()`，用 `?.` 防护，缺失时按「不触发」（`Never`）处理。
  3. **兜底** — `Rule.getOptions()` 在条目缺失时返回 `{}` 而不是 `undefined`，堵住 `applyIfEnabledBase()` 与 `RulesRunner` 里同型的直接解引用；`Option.setOption()` 补上与 `writeAndSave()` 一致的 `??=` 保护。

  经 `.verify` 验证台复现：旧写法在补齐前稳定抛出与线上一致的报错；`loadSettings()` 后 `yaml-timestamp` 条目就位（`update-on-file-contents-updated: "never"`），其它已保存规则不受影响，全新安装可补齐全部 66 条规则。

- **修复 diff 预览命令无法注销** — `LinterPlugin.removeCommand()` 用 `this.manifest.id`（门面类的 `style-tuner-linter`）拼命令 id，而命令是经 `host.addCommand()` 注册的，Obsidian 按**注册方**的 id（`style-tuner`）加前缀，于是拼出来的是个从不存在的 id，`removeDiffPreviewCommands()` 实际什么都没删掉——关掉「启用工作区差异预览」后命令仍留在命令面板里。改为直接走 `this.host.removeCommand()`，与 `addCommand` 走 `host` 保持一致。

- **修掉三处顺带发现的老问题**：

  - `apply()` 里 `options.textToInsert.reverse()` 是**就地反转**，而 `options.textToInsert` 与 settings 里那份是同一个数组——于是每次 lint 都会把列表顺序翻一遍，界面上的排序也跟着跳。改为 `[...entries].reverse()`。
  - `yaml-key-sort` 的 `apply()` 同样在就地改写 `options.yamlKeyPrioritySortOrder`（把带冒号的键回写去掉冒号），改的是 settings 里那份数组。改为先 `[...source]` 复制再规整。
  - `Rule.getDefaultOptions()` 对数组默认值改做**浅拷贝**：调用方（补齐缺失规则、启用规则）会把结果直接放进 `ruleConfigs`，而列表界面的增删与拖拽排序是就地改数组，共用同一份默认数组会把 option 自身的 `defaultValue` 改坏。

### 插件审核复查（obsidianmd/eslint-plugin@0.4.2 `recommended`）

对 `src/**` 重跑官方审核规则：**`obsidianmd/*` error 级 0 命中**，其中审核要点「Sets styles directly instead of using CSS classes, `setCssProps`, or `setCssStyles`」（`no-static-styles-assignment`）依旧零命中——本轮的列表外观 / 拖拽排序只新增 CSS 类与样式表规则，属性类型部分只读写配置文件，「继承」按钮只是读取另一条规则的配置，都没有引入任何内联样式写入。保留的 36 条 warn 与 1.2.1 复查时一致（`hardcoded-config-path` 20 条、`prefer-window-timers` 6 条、`no-global-this` 3 条、`settings-tab/prefer-setting-definitions` 2 条、`ui/sentence-case` 2 条，以及 `editor-drop-paste` / `object-assign` / `prefer-get-language` 各 1 条），均为有意为之，未新增。

---

## 1.2.2 (2026-10-08)

修复社区插件审核的驳回项：`manifest.json` 的插件描述含审核禁用词，并顺带修掉描述里不合规的字符。

### 错误修复

- **插件描述含审核禁用词，社区插件审核被驳回** — `manifest.json` 的 `description` 原文是 `Fine-tune theme, plugin, and snippet CSS variables with configurable controls, plus markdown linting/formatting ported from obsidian-linter.`，踩了两个坑：
  1. 官方 `eslint-plugin-obsidianmd` 的 `validate-manifest` 规则把 `obsidian`、`plugin` 两个词列为**大小写不敏感**的禁用词，`name` / `description` / `id` 三处都不允许出现——原文里 `plugin` 和 `obsidian-linter` 各命中一次（审核只报了 Obsidian 那条，但 `plugin` 同样不合规）；
  2. `description` 的字符集限定为 ASCII 字母、数字、空白与 `. , ! ? ' " -`，原文 `linting/formatting` 里的 `/` 不合规（`validate-manifest` 用 `else if` 串联判定，禁用词命中时不会再报格式问题，所以这条本来会在**下一轮**审核才暴露）。

  现改为：`Fine-tune theme, snippet, and third-party CSS variables with configurable controls, plus a built-in markdown linter with 66 formatting rules.`（141 字符，以大写字母开头、以句号结尾，无禁用词、无非法字符）。`package.json` 里的同一段描述一并同步。

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
