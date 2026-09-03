# Build & Installation

## How it's published

`quasar_resaas` doesn't go to npm — it's consumed directly from GitHub:

```json
// front/package.json
"quasar_resaas": "github:metanochava/quasar_resaas"
```

Practical consequence: there's no semver. `npm install` pins the default branch's commit (usually `main`) at install time; to pick up new commits from the library you need `npm update quasar_resaas` (or remove `node_modules/quasar_resaas` and reinstall) — running `npm install` again isn't enough.

## ES modules throughout

The library's `package.json` declares:

```json
"type": "module",
"main": "index.js",
"exports": {
  ".": "./index.js",
  "./auto-imports": "./auto-imports.cjs",
  "./core/*": "./core/*"
}
```

This matches what the code actually is: `index.js` and everything it imports use `import`/`export`
syntax throughout, so `"type": "module"` is the honest declaration (it used to say `"commonjs"`,
which was wrong — a plain `require('quasar_resaas')` would have thrown a `SyntaxError`
immediately; it only ever worked because Vite transpiles it regardless of the declared type).
`auto-imports.cjs` needs no special handling: a `.cjs` extension is always treated as CommonJS by
Node regardless of the package's `"type"`, so its own `require`-free, plain `module.exports` style
keeps working unchanged. When adding new code to the library, use `import`/`export` — there's no
CJS `require()` anywhere in this codebase to mirror.

## Auto-imports

The host's `quasar.config.js` imports the library's auto-imports map and registers it alongside `unplugin-auto-import`'s presets:

```js
import RESAAS_AUTO_IMPORTS from 'quasar_resaas/auto-imports'
// ...
imports: [
  'vue', 'vue-router', 'pinia', /* ... */,
  { quasar_resaas: RESAAS_AUTO_IMPORTS }
]
```

`auto-imports.cjs` only exports *names* (`useUserStore`, `HTTPAuth`, `tdc`, …) — the list of stores/API/utils available without an explicit `import` in SFCs. It only covers what's listed there; a new export in the library's `index.js` that isn't also added to `auto-imports.cjs` still requires a manual `import { X } from 'quasar_resaas'`.

## Install steps on a new host

```bash
npm install
# postinstall runs automatically:
quasar prepare
```

`quasar prepare` generates `src/auto-imports.d.ts` (editor declarations) from the configuration above — without this the editor doesn't recognize the library's globals, but the build still works.

## Global components

The `s-*` components (see `components/button.md`, `components/form.md`) only exist after the host explicitly calls the `Components` export from the library inside one of its own boot files — it doesn't happen just by adding the library to `quasar.config.js`'s `boot` array (that array only accepts files inside the host's own `src/boot`):

```js
// front/src/boot/theme_engine.js
import { Components } from 'quasar_resaas'
export default ({ app }) => { Components({ app }) }
```

and that boot file (`theme_engine`) has to be listed in `quasar.config.js`:

```js
boot: ['pinia', 'quasar_saas', 'i18n', 'axios', 'app_ready', 'theme_engine']
```

> [!WARNING]
> Without this, `<s-auto-crud>`/`<s-btn>`/etc. in SFCs fail with "Failed to resolve component" at build/dev time.

Likewise, `setPinia()` (see `stores/base-store.md`) is called in the host's `quasar_saas.js` boot file, not by the library alone.

> [!WARNING]
> Skipping the `setPinia()` step makes `getPinia()` throw `Pinia not initialized` on the first store accessed.
