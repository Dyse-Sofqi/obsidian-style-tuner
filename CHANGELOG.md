# 更新日志

本文件记录 Style Tuner 的版本演进。Style Tuner 基于 [mgmeyers/obsidian-style-settings](https://github.com/mgmeyers/obsidian-style-settings) 独立维护,保留原插件全部生态兼容能力,更新记录仅覆盖 fork 自身的变更。

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
