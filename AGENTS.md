# AGENTS.md

## What this is

VS Code extension ("My Skills" / internal name "My-Skills"). A webview panel in the Activity Bar sidebar with three tabs: VIEW, INSTALL, CREATE.

## Build & verify

```
bun install                  # dependencies (bun.lock present)
bun run compile              # check-types -> lint -> esbuild build
bun run package              # production build (minified, no sourcemaps)
bun run lint                 # eslint src
bun run check-types          # tsc --noEmit
bun test                     # vscode-test (downloads real VS Code, runs in extension host)
bun run watch                # dev mode (parallel tsc --watch + esbuild --watch)
```

`compile` is the main verification step — runs typecheck, lint, and build in sequence.

## Architecture

The build produces **two bundles** (see `esbuild.js`):

1. **Extension host** — `src/extension.ts` → `dist/extension.js` (Node, CJS, externalizes `vscode`)
2. **Webview** — `src/my-skills/view/index.ts` → `dist/webview.js` (Browser, IIFE)

## Source layout

- `src/extension.ts` — activation entry, registers webview provider
- `src/my-skills/my-skills.ts` — `WebviewViewProvider` implementation; reads HTML templates from `screens/` at resolve time via `fs.readFileSync`, injects them into the `index.html` shell via `<!-- VIEW_PANEL -->`, `<!-- INSTALL_PANEL -->`, `<!-- CREATE_PANEL -->` comment markers, and wires CSS/JS URIs
- `src/my-skills/view/index.html` — HTML shell with comment-marker slots for styles, panels, and scripts
- `src/my-skills/view/index.ts` — webview-side JS entry; tab switching logic, listens for `switch-tab` messages from extension host via `acquireVsCodeApi()`
- `src/my-skills/screens/my-skill/` — VIEW tab (HTML, CSS, TS)
- `src/my-skills/screens/install-skill/` — INSTALL tab
- `src/my-skills/screens/create-skill/` — CREATE tab
- `src/my-skills/view/styles/global.css` — shared stylesheet loaded in webview

## Test setup

Only a placeholder test exists (`src/__test__/extension.test.ts`). Tests run via `@vscode/test-cli` which downloads a real VS Code instance. The `pretest` script compiles tests to `out/` first.

## Dev workflow

F5 (or `.vscode/launch.json`) runs the extension in a new Extension Development Host window. The default build task runs `watch` (esbuild + tsc watch in parallel). The webview loads `dist/webview.js` as a webview URI.

## Gotchas

- The `.vscodeignore` whitelists `!src/assets/svg/myskills.svg` but the actual icon path in `package.json` is `src/my-skills/assets/svg/logo.svg` — these paths may not match when packaging.
- Prettier is not a devDependency or npm script; `.prettierignore` exists but Prettier is a no-op unless installed/run manually.
- `public/` directory exists but is empty and unused.
