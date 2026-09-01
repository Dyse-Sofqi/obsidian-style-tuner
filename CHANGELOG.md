# 更新日志

本文件记录 Style Tuner 的版本演进。Style Tuner 基于 [mgmeyers/obsidian-style-settings](https://github.com/mgmeyers/obsidian-style-settings) 独立维护,保留原插件全部生态兼容能力,更新记录仅覆盖 fork 自身的变更。

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
