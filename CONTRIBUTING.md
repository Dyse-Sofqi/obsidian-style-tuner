# Contributing to Style Tuner

Style Tuner is an independently maintained fork of
[Style Settings](https://github.com/mgmeyers/obsidian-style-settings) and is
licensed under GPL-3.0. Any contribution you submit is licensed under the same
license.

## Development setup

```bash
yarn install
npm run dev      # esbuild watch, outputs main.js
```

Point a test vault at this folder (or use the hot-reload plugin) to see changes.

## Checks before opening a PR

```bash
npm run test     # vitest unit tests
npm run build    # typecheck + production bundle
npm run lint
```

## Guidelines

- Keep `/* @settings` parsing behavior backward compatible; themes and
  snippets in the wild depend on it.
- Keep the `parse-style-settings` workspace event and `css-settings-manager`
  body classes intact — they are part of the plugin ecosystem interface.
- Add or update tests when changing validation or variable generation logic.
- Small, focused PRs are easier to review and merge.
