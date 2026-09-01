<div align="center">

# Style Tuner

像调音台一样,精细调校你的 Obsidian 外观。

[![GitHub Release](https://img.shields.io/github/v/release/Dyse-Sofqi/obsidian-style-tuner?style=flat-square&logo=github&color=%2342b883)](https://github.com/Dyse-Sofqi/obsidian-style-tuner/releases) [![License](https://img.shields.io/github/license/Dyse-Sofqi/obsidian-style-tuner?style=flat-square&color=%2342b883)](LICENSE) [![Obsidian Min App](https://img.shields.io/badge/Obsidian-%3E%3D1.5.0-%234a7ec1?style=flat-square&logo=obsidian&logoColor=%234a7ec1)](https://obsidian.md) [![GitHub Stars](https://img.shields.io/github/stars/Dyse-Sofqi/obsidian-style-tuner?style=flat-square&logo=github&color=%23e4b341)](https://github.com/Dyse-Sofqi/obsidian-style-tuner)

</div>

---

> 🇬🇧 **English**: 简介与安装说明为中文,下方 `/* @settings` 参考文档为英文。

📜 完整更新记录见 [CHANGELOG](CHANGELOG.md)。

### 简介

Style Tuner 是一款 Obsidian 插件,让主题、CSS 片段与插件 CSS 声明一组可配置项,并把这些可调设置集中在同一个设置面板里:支持在 `body` 上开关类名,以及设置数值、文本、颜色等 CSS 变量——无需手动改 CSS,主题调校所见即所得。

Style Tuner 是 [Style Settings](https://github.com/mgmeyers/obsidian-style-settings)(作者 [mgmeyers](https://github.com/mgmeyers))的独立维护分支,遵循 GPL-3.0 协议。原插件的设计与实现全部归功于上游作者;本分支以 **Style Tuner** 之名继续演进。它解析与原版完全相同的 `/* @settings` 配置块,现有主题与片段无需任何修改即可使用——但它是独立插件,**不要与 Style Settings 同时启用**。

### 关键词

- 主题变量调校 · CSS 片段可视化配置 · 颜色选择器(含亮/暗双模式) · 数值滑块 · 下拉选择 · 类开关 · 标题层级折叠 · 搜索过滤 · `@settings` 生态兼容
- 界面美化(层级强调色条 · 树形缩进线 · 横向布局) · 已修改值高亮 · 按区块导出/导入 · 遗留数据备份 · 中英文界面 · 随 Obsidian 语言切换

### 功能

- **兼容生态** — 完整支持 `/* @settings` 配置块:标题层级、类开关、类下拉、文本/数值/滑块/下拉变量、单色与亮暗双色取色器、信息文本、颜色渐变,以及按语言后缀的多语言标题(`title.zh`、`title.de` 等)。
- **界面美化** — 可折叠标题按层级着色、树形缩进线呈现嵌套关系、设置项横向布局、设置页自动加宽,深浅色主题自适应。
- **已自定义值高亮** — 改过默认值的设置行实时亮起标记,重置后立即熄灭。
- **导出/导入增强** — 「全部设置」导出时可按一级区块勾选,只导出所选区块及其后代;来源已停用但留有自定义数据的区块也会列出,方便备份与迁移。
- **稳定性** — 修复后台标签页恢复后的启动崩溃,懒挂载视图自动补齐数据。

### 安装

#### 1. 通过 BRAT(Beta Reviewer's Auto-update Tool)

1. 安装并启用 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 插件。
2. 执行命令 `BRAT: Add a beta plugin for testing`。
3. 输入 `Dyse-Sofqi/obsidian-style-tuner` 并确认。

#### 2. 手动安装

1. 从本仓库的最新 [Release](https://github.com/Dyse-Sofqi/obsidian-style-tuner/releases) 下载 `main.js`、`manifest.json`、`styles.css`。
2. 在 `<vault>/.obsidian/plugins/style-tuner/` 目录下放入这三个文件。
3. 在 Obsidian 的「第三方插件」设置中启用 **Style Tuner**。

> [!CAUTION]
> 不要同时启用 Style Tuner 与 Style Settings:两者都会渲染 `/* @settings` 配置面板,同一变量被写入两次可能产生冲突。

### 数据存储

你的全部调校值保存在 `<vault>/.obsidian/plugins/style-tuner/data.json`,只存储与默认值不同的覆盖项。**卸载插件会删除该文件**(主题与片段文件本身不受影响)——卸载前请用设置面板的导出功能备份,或直接复制 `data.json`。

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
        default: 鈥?        quotes: true
*/
```

This will output the variable:

```
--icon: '鈥?
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

This will output the variables:

```
body.theme-light.css-settings-manager { --accent: #007AFF; } 
body.theme-dark.css-settings-manager { --accent: #2DB253; }
```

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
zh: 绠€浣撲腑鏂?zh-TW: 绻侀珨涓枃
ru: P褍褋褋泻懈泄
ko: 頃滉淡鞏?it: Italiano
id: Bahasa Indonesia
ro: Rom芒n膬
pt-BR: Portugues do Brasil
cz: 膷e拧tina
de: Deutsch
es: Espa帽ol
fr: Fran莽ais
no: Norsk
pl: j臋zyk polski
pt: Portugu锚s
ja: 鏃ユ湰瑾?da: Dansk
uk: 校泻褉邪褩薪褋褜泻懈泄
sq: Shqip
tr: T眉rk莽e (k谋smi)
hi: 啶灌た啶ㄠ啶︵ (啶嗋啶多た啶?
nl: Nederlands (gedeeltelijk)
ar: 丕賱毓乇亘賷丞 (噩夭卅賷)
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
        title.ko: 雮?韱犼竴
        description: Adds my-css-class to the body element
        description.de: F眉gt my-css-class zum body-Element hinzu
        description.ko: my-css-class毳?body 鞖旍唽鞐?於旉皜頃╇媹雼?
        type: class-toggle

*/
```

## License

Style Tuner is licensed under the [GNU General Public License v3.0](LICENSE), following the license of the upstream Style Settings project. Contributions are welcome under the same license.
