# AGENTS.md

## What this is

VS Code extension ("MySKILLS" / internal name "My-Skills"). A clean, blank canvas webview panel in the Activity Bar sidebar.

## Build & verify

```
bun install                  # dependencies (bun.lock present)
bun run compile              # check-types + lint + esbuild build
bun run package              # production build (minified, no sourcemaps)
bun run lint                 # eslint src
bun run check-types          # tsc --noEmit
bun test                     # vscode-test (downloads VS Code, runs in extension host)
```

`compile` is the main verification step — runs typecheck, lint, and build in sequence.

## Architecture

The build produces **one bundle** (`esbuild.js`):

1. **Extension host** — `src/extension.ts` → `dist/extension.js` (Node, CJS). Externalizes `vscode`.

## Source layout

- `src/extension.ts` — activation entry, registers webview provider
- `src/myskills/myskills.ts` — webview provider and HTML shell
- `src/assets/svg/myskills.svg` — extension icons

## Test setup

Only a placeholder test exists (`src/__test__/extension.test.ts`). Tests run via `@vscode/test-cli` which downloads a real VS Code instance. The `pretest` script compiles tests to `out/` then runs lint.

## Prettier

`.prettierignore` excludes `package.json` and `tsconfig.json`. Prettier is not configured as a devDependency or script — it's a no-op unless run manually.
