# Style Tuner — handover notes

This repository is the independent maintenance fork of
[mgmeyers/obsidian-style-settings](https://github.com/mgmeyers/obsidian-style-settings),
renamed to **Style Tuner** (`style-tuner`).

## What was changed during handover

### Identity (branding surface)

- `manifest.json`: plugin id `obsidian-style-settings` → `style-tuner`,
  display name "Style Settings" → "Style Tuner", author set to Sofqi
  (`Dyse-Sofqi`), funding URL carried over from the maintainer's other plugin,
  version reset to `1.0.0`.
- `package.json`: package name, author, and license field fixed to `GPL-3.0`
  (upstream `LICENSE.md` is GPL-3.0 while the upstream package.json said `MIT`
  — that was an upstream metadata mistake; GPL-3.0 is authoritative).
  Duplicate `test` script entry removed. Version reset to `1.0.0`.
- `versions.json`: reset to `{ "1.0.0": "0.11.5" }` so the new plugin starts a
  clean version history.
- `README.md`: rewritten for Style Tuner with fork attribution, installation
  instructions (BRAT + manual), and the full `/* @settings` documentation
  carried over from upstream.
- `CONTRIBUTING.md`: expanded with dev setup and GPL-3.0 contribution terms.

### Code (user-visible strings only)

- Command `show-style-settings-leaf` → `show-style-tuner-leaf`,
  display name "Show style settings view" → "Show Style Tuner view".
- Item view `getDisplayText()` → "Style Tuner".
- Settings-search integration: registers under tab id `style-tuner`
  and name "Style Tuner"; also unregisters the legacy
  `obsidian-style-settings` and `obsidian-style-tuner` tab resources to
  clean up stale entries.
- Log/warning prefixes: "Style Settings: ..." → "Style Tuner: ...".
- Console locale error message updated.

### Deliberately kept for ecosystem compatibility

- `/* @settings` comment format — the YAML schema is a de-facto standard used
  by themes and snippets.
- Workspace event `parse-style-settings` (and the `css-change` source filter
  value `style-settings`) — documented plugin interface; third-party plugins
  already trigger it by that name.
- `body.css-settings-manager`, `body.theme-light.css-settings-manager`,
  `body.theme-dark.css-settings-manager` classes — themes reference them in
  CSS (see the README themed-color example).
- Internal `style-settings-*` CSS class names and `.modal-style-settings` —
  plugin-internal styling hooks; renaming them would only churn CSS.
- Settings storage still uses section/setting ids parsed from `@settings`
  blocks, so existing user configurations remain valid.

## Release process

1. Update `manifest.json` + `package.json` versions (`npm version patch|minor|major`,
   then `yarn bump`).
2. Commit, tag, and push tags; the GitHub Action
   (`.github/workflows/release.yml`) builds and creates a draft release with
   `main.js`, `manifest.json`, and `styles.css`.
3. After the first community-plugin submission is accepted, keep the
   `versions.json` ↔ `manifest.json` mapping consistent for every release.

## Local development

```bash
yarn install
npm run dev      # esbuild watch
npm run test     # vitest
npm run build    # typecheck + production bundle
npm run lint
```
