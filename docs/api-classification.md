# RAX Theme — API Classification

Every function exported by every framework module, classified as **Public**
(part of the stable Extension API contract — plugins should use these),
**Internal** (used across framework modules, safe to call but not part of the
plugin-facing contract, may change shape in a future minor version), or
**Private** (not exported at all — implementation detail, listed here only to
show it was reviewed, not forgotten).

Reviewed by reading every `global.Rax* = {...}` export statement in
`assets/js/` and every `RaxComponents.* = {...}` registration.

---

## RaxEvents (`events.js`)

| Export | Classification | Notes |
|---|---|---|
| `on(name, handler)` | **Public** | The mechanism a plugin uses to react to any framework event (see `docs/events.md`). |
| `once(name, handler)` | **Public** | Same as above, single-fire. |
| `off(name, handler)` | **Public** | Required for correct cleanup in any `destroy()` that used `on()`. |
| `emit(name, payload)` | **Public** | A plugin may emit its own custom event names, or the documented framework ones (e.g. `modal:close`). |

No changes — this module's surface was already minimal and fully public by
design (it's the entire communication mechanism).

## RaxRegistry (`registry.js`)

| Export | Classification | Notes |
|---|---|---|
| `registerPage`, `registerMenuItem`, `registerWidget`, `registerCommand`, `registerSearchProvider` | **Public** | The Extension API core — see `docs/plugin-api.md`. |
| `getPage`, `getMenuItems`, `getWidgets`, `getCommands` | **Public** | Read-only accessors; safe for a plugin to introspect current registrations (e.g. to avoid re-registering an id). |

`registerSearchProvider` is an addition (previously only reachable via
`RaxSearch.registerProvider` — both still work, this is additive).

## RaxSearch (`search.js`)

| Export | Classification | Notes |
|---|---|---|
| `registerProvider(pageId, queryFn)` | **Public** | Also reachable as `RaxRegistry.registerSearchProvider` — same function. |
| `query(pageId, term)` | **Internal** | Called by `Topbar`'s search input on every keystroke. A plugin *could* call this to trigger a search programmatically, but it's not part of the documented contract — reclassify to Public only if a real use case shows up. |

## RaxTheme (`theme.js`)

| Export | Classification | Notes |
|---|---|---|
| `getMode`, `setMode`, `toggleMode` | **Public** | |
| `getAccent`, `setAccent` | **Public** | `setAccent` now also accepts any name registered via `registerTheme`. |
| `setCustomAccent(hex)` | **Public** | One-off, unnamed accent override — kept distinct from `registerTheme` (see `docs/theming.md`). |
| `registerTheme(name, def)` | **Public** | The theme Extension API. |
| `getRegisteredThemes()` | **Public** | Lets a plugin (or the palette, in a future release) list available custom themes. |
| `init()` | **Internal** | Called exactly once, by `RaxCore.boot()`. A plugin has no reason to call this itself. |

## RaxCharts (`charts.js`)

| Export | Classification | Notes |
|---|---|---|
| `create(canvas, config, meta)` | **Public** | The only sanctioned way to instantiate a chart — required reading for any widget/plugin that wants a chart (`docs/component-api.md`). |
| `destroy(handle)` | **Public** | Required cleanup counterpart. |

## RaxNotifications (`notifications.js`)

| Export | Classification | Notes |
|---|---|---|
| `toast(message, opts)` | **Public** | |
| `ok`, `warn`, `danger`, `info` | **Public** | Convenience wrappers over `toast()`. |

## RaxCommandPalette (`command-palette.js`)

| Export | Classification | Notes |
|---|---|---|
| `open()`, `close()` | **Public** | A plugin command handler could call `close()` itself if it needs to dismiss the palette before doing something else; `open()` lets any code (e.g. a custom keyboard shortcut) summon it. |

## RaxNavigation (`navigation.js`)

| Export | Classification | Notes |
|---|---|---|
| `mount(config)` | **Public (page-author-facing)** | Every page — built-in or a plugin's own new HTML page — must call this once. Not meant to be called more than once per page load. |

## RaxCore (`core.js`)

| Export | Classification | Notes |
|---|---|---|
| `boot()` | **Public (page-author-facing)** | Every page calls this exactly once, after `RaxPluginLoader.loadAll()` resolves. |

## RaxPluginLoader (`plugin-loader.js`)

| Export | Classification | Notes |
|---|---|---|
| `load(src)` | **Public** | Loads a single script, returns a Promise. |
| `loadAll(list?)` | **Public (page-author-facing)** | What every page's bootstrap actually calls; `list` defaults to `window.RAX_PLUGINS`. |

## RaxUtils (`utils.js`)

| Export | Classification | Notes |
|---|---|---|
| `qs`, `qsa`, `dom`, `debounce` | **Internal** | Convenience helpers used throughout the framework's own components. Usable by plugins, but **not covered by the same compatibility guarantee** as the modules above — `dom()`'s hyperscript-style signature in particular is an implementation convenience, not a designed public contract, and could change shape in a future phase. Plugins are free to use plain DOM APIs instead. |
| `formatNumber`, `formatBytes` | **Internal** | Same reasoning — thin enough that most plugins won't need them, kept internal-but-accessible rather than public-and-frozen. |
| `readCssVar` | **Public** | Explicitly useful and stable for any plugin/widget that wants to read a design token at runtime (e.g. to draw a canvas element in the current accent color). Promoted to Public because `RaxCharts`' own color-binding feature depends on exactly this being a reliable, documented function. |
| `hexToRgba` | **Public** | Extracted from `theme.js` to remove duplication. Genuinely useful for any plugin building translucent fills that match the current accent, same reasoning as `readCssVar`. |

## RaxComponents.* (`components/*.js`)

Every component's `mount`/`update`/`destroy` triad:

| Component | Classification | Notes |
|---|---|---|
| `Card`, `Widget`, `Modal`, `Table`, `Tabs`, `Toast` | **Public** | These are the reusable building blocks plugin authors should use for a consistent look instead of hand-rolling markup. |
| `Sidebar`, `Topbar` | **Internal** | Framework-owned shell singletons, mounted exactly once by `navigation.js`. A plugin should never call `RaxComponents.Sidebar.mount()` itself — it would create a second sidebar. Listed as Internal, not Private, because a plugin author reading the source should understand *why* it exists, even though calling it directly is unsupported. |

---

## Exports reduced or removed

**None removed** — breaking changes to any function/event/component
classified **Public** here are treated as a major-version change once this
project adopts semantic versioning, so removing one is a deliberate, rare
decision, not a routine cleanup — and this audit didn't find any export that
was genuinely dead: every function either has a real call site today or is
an intentional, documented extension point with zero built-in consumers —
e.g. `Modal`'s `modal:close` trigger, `RaxRegistry.getWidgets()`).

What happened instead, in place of removing exports:
- **Consolidated** duplicate hex-parsing logic (`theme.js`'s old private
  `hexToGlow` helper) into one shared, now-Public `RaxUtils.hexToRgba`.
- **Reclassified** `RaxUtils.readCssVar` from an unremarked internal helper to
  documented Public, since `RaxCharts`' new color-binding feature makes it a
  load-bearing part of the public contract now.
- **Added** `RaxRegistry.registerSearchProvider` as a thin alias (§ above),
  additive only.
