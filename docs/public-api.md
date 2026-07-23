# RAX Theme — Public API Reference

*RAX Theme — Modern OPNsense-inspired Dashboard Framework*

Everything on this page is classified **Public** — covered by the API
version guarantee described in [`versioning.md`](versioning.md). Build
plugins against these exports. For the reasoning behind each
classification and the full per-export ledger (including Internal-tier
entries), see [`api-classification.md`](api-classification.md). For
what's *not* here and why, see [`internal-api.md`](internal-api.md).

This list matches `RaxAPI`'s runtime classification table
(`assets/js/api.js`) exactly — `RaxAPI.getSurface('public')` returns the
same data programmatically.

---

## RaxEvents

`on(name, handler)`, `once(name, handler)`, `off(name, handler)`,
`emit(name, payload)` — the pub/sub bus. Full event catalog:
[`events.md`](events.md).

## RaxRegistry

`registerPage`, `registerMenuItem`, `registerWidget`, `registerCommand`,
`registerSearchProvider`, `registerSettingsPage`, `registerNotification`,
`registerPermission`, and their `get*` read accessors
(`getPage`, `getMenuItems`, `getWidgets`, `getCommands`, `getSettingsPages`,
`getNotifications`, `getPermissions`). The Extension API core — full
reference: [`plugin-api.md`](plugin-api.md).

## RaxSearch

`registerProvider(pageId, queryFn)` — also reachable as
`RaxRegistry.registerSearchProvider`.

## RaxTheme

`getMode`, `setMode`, `toggleMode`, `getAccent`, `setAccent`,
`setCustomAccent`, `registerTheme`, `getRegisteredThemes`. Full reference:
[`theming.md`](theming.md).

## RaxAuth

`registerProvider`, `currentUser`, `login`, `logout`, `hasPermission`,
`beforeRoute`, `isProviderRegistered`. Full reference:
[`auth-api.md`](auth-api.md).

## RaxPlugins

`registerManifest`, `enablePlugin`, `disablePlugin`, `uninstallPlugin`,
`getPlugin`, `getPlugins`, `isPluginEnabled`, `getPluginVersion`,
`validateAll`, `getValidationErrors`, `getValidationWarnings`. Full
reference: [`plugin-manifest.md`](plugin-manifest.md) and
[`plugin-api.md`](plugin-api.md).

## RaxAPI

`classify`, `getClassification`, `getSurface`, `deprecate`,
`warnDeprecated`, `isDeprecated`, `getDeprecations`,
`checkPluginCompatibility`, plus the `VERSION` and `MIN_SUPPORTED_VERSION`
constants. Full reference: [`versioning.md`](versioning.md).

## RaxDevMode

`isEnabled`, `enable`, `disable`, `report`. (`reportDeprecatedUsage`,
`recordPluginLoadTiming`, `recordLifecycleTiming`, and the corresponding
`get*` accessors exist too, but are normally called by the framework
itself, not by a plugin — see [`versioning.md`](versioning.md).)

## RaxCharts

`create(canvas, config, meta)`, `destroy(handle)` — the only sanctioned way
to use Chart.js. Full reference: [`component-api.md`](component-api.md).

## RaxNotifications

`toast(message, opts)`, `ok`, `warn`, `danger`, `info`.

## RaxCommandPalette

`open()`, `close()`.

## RaxNavigation

`mount(config)` — every page (built-in or a plugin's own) calls this once.

## RaxCore

`boot()` — every page calls this once. `VERSION` — the framework version
string (see [`versioning.md`](versioning.md) for how this differs from
`RaxAPI.VERSION`).

## RaxPluginLoader

`load(src)`, `loadAll(list?)` — what every page's bootstrap calls instead
of `RaxCore.boot()` directly.

## RaxUtils (partial)

Only two of this module's exports are Public: `readCssVar(name, el?)` and
`hexToRgba(hex, alpha)` — both promoted specifically because `RaxCharts`'
color-binding feature depends on them being reliable. Everything else on
`RaxUtils` (`qs`, `qsa`, `dom`, `debounce`, `formatNumber`, `formatBytes`)
is Internal — see [`internal-api.md`](internal-api.md) for why.

## RaxComponents (partial)

`Card`, `Widget`, `Modal`, `Table`, `Tabs`, `Toast` — each with
`mount(el, props)` / `update(instance, props)` / `destroy(instance)`. Full
`props` shape for each: [`component-api.md`](component-api.md).

`Sidebar` and `Topbar` are **not** on this list — they're framework-owned
singletons, classified Internal. See
[`internal-api.md`](internal-api.md).
