# AGENTS.md

## Package manager

Use `bun` (not npm/yarn/pnpm). The lockfile is `bun.lock`. All scripts in `package.json` use `bun run`.

## Build

Four separate esbuild entrypoints, each with different targets:

| Source | Output | Format | Platform |
|---|---|---|---|
| `src/extension.ts` | `dist/extension.js` | CJS | Node |
| `src/my-skills/view/index.ts` | `dist/webview.js` | IIFE | Browser |
| `src/my-skills/screens/create-skill/ui/create.ts` | `dist/create-skill.js` | IIFE | Browser |
| `src/my-skills/screens/create-skill/guide/guide.ts` | `dist/create-skill-guide.js` | IIFE | Browser |

- `dist/` is gitignored — you must build before launch or test.
- `vscode` is marked external in the extension bundle (provided by the host).

### Build commands

```
bun run check-types    # tsc --noEmit only
bun run lint           # eslint src (no auto-fix)
bun run compile        # check-types → lint → esbuild (dev, with sourcemaps)
bun run package        # check-types → lint → esbuild --production (minified, no sourcemaps)
bun run watch          # parallel tsc watch + esbuild watch
bun run test           # vscode-test (runs pretest: compile-tests → compile → lint first)
```

**Build order is enforced in `compile` and `package`**: typecheck first, then lint, then esbuild. If you need a fast change-test cycle use `node esbuild.js` directly.

## Architecture

### Extension host (`dist/extension.js`)

- Entry: `src/extension.ts` — registers a single `WebviewViewProvider` in the activity bar.
- The provider (`src/my-skills/my-skills.ts`) assembles webview HTML at runtime by reading `.html` templates from `src/my-skills/screens/**` via `fs.readFileSync`.
- CSS and JS file URIs are injected via `webview.asWebviewUri()` into the shell template.
- CSP is set: scripts require a nonce, styles/images/fonts use `vscode.cspSource`.

### Webview client (`dist/webview.js`, `dist/create-skill.js`, `dist/create-skill-guide.js`)

- Tab-based SPA with three panels: CREATE, INSTALL, LOCAL.
- INSTALL has sub-panels: All Time, Trending, Official.
- All DOM querying/manipulation is vanilla TS (no framework).
- `create-skill.js` is loaded as a **separate bundle** alongside `webview.js` (both injected via separate `<script>` tags in the shell HTML).
- `create-skill-guide.js` is loaded only by the CREATE guide `WebviewPanel`.

### HTML templates are NOT bundled

`.html`, `.css`, and `.svg` files in `src/my-skills/` are read at runtime. They are **shipped with the extension** (see `.vscodeignore`: TypeScript files are excluded, but HTML/CSS/SVG under `src/my-skills/` are kept). Changes to these assets do not require a rebuild — only a webview reload.

## Extension entrypoint

```jsonc
"main": "./dist/extension.js"
```

The `activate()` function in `src/extension.ts` receives `ExtensionContext` — this is the only entrypoint called by the VSCode host.

## Testing

- Runner: `@vscode/test-electron` (launches a real VSCode instance).
- Test file: `src/__test__/extension.test.ts` (currently a placeholder).
- `pretest` compiles both tests and extension code before running.

## VSCode launch

`.vscode/launch.json` uses `preLaunchTask: "${defaultBuildTask}"` which is the "watch" task in `.vscode/tasks.json` (runs tsc watch + esbuild watch in parallel).

## Linting

ESLint with `typescript-eslint`. Rules enforce `naming-convention` on imports, `curly`, `eqeqeq`, no `throw` literals, and semicolons. No auto-fix available — lint is validation only.

## Versioning

`.vscodeignore` excludes `ARCHITECTURE.md`, `CONTRIBUTING.md`, and `CODE_OF_CONDUCT.md` — those files must not exist at packaging time or will be silently excluded.
