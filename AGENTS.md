# AGENTS.md

## What this is

VS Code extension ("MySKILLS" / internal name "RENE"). A webview panel in the Explorer sidebar with three screens: Music (NetEase Cloud Music), Pomodoro timer, and a mini-game.

## Build & verify

```
bun install                  # dependencies (bun.lock present)
npm run compile              # check-types + lint + esbuild build
npm run package              # production build (minified, no sourcemaps)
npm run lint                 # eslint src
npm run check-types          # tsc --noEmit
npm test                     # vscode-test (downloads VS Code, runs in extension host)
```

`compile` is the main verification step — runs typecheck, lint, and build in sequence.

## Architecture — two esbuild bundles

The build produces **two separate bundles** (`esbuild.js`):

1. **Extension host** — `src/extension.ts` → `dist/extension.js` (Node, CJS). Externalizes `vscode` and `NeteaseCloudMusicApi`.
2. **Webview** — `src/focus/view/ui/index.ts` → `dist/webview.js` (browser, IIFE). No externals.

Both share TypeScript source under `src/` but compile to different targets.

## Critical: HTML/CSS are NOT bundled

`view.ts:30-63` reads `src/focus/view/ui/index.html` from disk at runtime and injects CSS files as `<link>` tags. The HTML references CSS from `src/focus/shared/skeletons/` and `src/focus/screens/atm-music/ui/`. These paths are resolved relative to `extensionUri` (the installed extension folder), **not** `dist/`.

This means: if you move or rename CSS/HTML files, update the `styles` array in `view.ts:32-37` and the CSP in `view.ts:42-50`.

## Audio streaming proxy

`src/focus/screens/atm-music/core/handler.ts` starts a local HTTP server on a random port (`127.0.0.1:0`) that proxies NetEase audio streams. The port is sent to the webview via `config` message. The proxy forwards Range headers for seeking support.

## Source layout

- `src/extension.ts` — activation entry, registers webview provider
- `src/focus/focus.ts` — barrel re-export of `YouTubeMusicViewProvider`
- `src/focus/view/view.ts` — webview provider, HTML assembly, CSP
- `src/focus/view/ui/index.ts` — webview entry (browser-side JS), screen routing
- `src/focus/view/ui/index.html` — webview HTML shell
- `src/focus/screens/atm-music/` — music feature (search, player, API, handler)
- `src/focus/screens/atm-time/` — Pomodoro timer screen
- `src/focus/screens/atm-game/` — mini-game screen
- `src/focus/shared/types.ts` — `Track`, `WebviewMessage`, `MusicProvider` types
- `src/focus/shared/utils.ts` — shared utilities

## Test setup

Only a placeholder test exists (`src/__test__/extension.test.ts`). Tests run via `@vscode/test-cli` which downloads a real VS Code instance. The `pretest` script compiles tests to `out/` then runs lint.

## CSP / image sources

The webview CSP (`view.ts:47`) allows images from `ytimg.com`, `googleusercontent.com`, `dzcdn.net`, `fastly.net`, and `data:` URIs. Media sources include `dzcdn.net` and `127.0.0.1` (the stream proxy).

## Prettier

`.prettierignore` excludes `package.json`, `tsconfig.json`, `src/extensions/` (typo — doesn't exist), and `src/focus/view/`. Prettier is not configured as a devDependency or script — it's a no-op unless run manually.
