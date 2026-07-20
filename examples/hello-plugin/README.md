# Hello Plugin (example)

A minimal, runnable example of the RAX Theme Extension API **and** the
plugin platform (manifest, lifecycle hooks, dependency validation).

## Files

- **`manifest.json`** — the canonical, documented plugin manifest. See
  `docs/plugin-manifest.md` for every field.
- **`index.js`** — the plugin itself: registers the manifest (with all 5
  lifecycle hooks), then registers a widget, a command, and a page —
  exactly `RaxPlugins.registerManifest()` +
  `RaxRegistry.registerWidget()`/`registerCommand()`/`registerPage()`, no
  other registration function, no private framework API.
- **`hello-plugin.html`** — a standalone page that loads it via
  `window.RAX_PLUGINS` and `RaxPluginLoader`, identical bootstrap pattern to
  every built-in page.

## Run it

Serve the repository root as described in the main
[`README.md`](../../README.md#installation), then open:

```
http://localhost:8080/examples/hello-plugin/hello-plugin.html
```

**Open the browser console before you load the page** — this is where the
plugin platform features are visible:

- `[RaxPlugins] Plugin "hello-plugin" ...` style messages are the framework;
  `[hello-plugin] onInstall/onEnable/...` messages are this plugin's own
  lifecycle hooks firing.
- On your **first** visit, you'll see `onInstall` then `onEnable`.
- **Reload the page** — this time you'll only see `onEnable` (already
  installed, nothing changed).
- You'll also see a **warning**, not an error: `hello-plugin` declares an
  *optional* dependency on a plugin id (`core-vpn-api`) that doesn't exist
  anywhere in this repository, on purpose — this demonstrates
  `RaxPlugins`'s dependency validation reporting a missing dependency
  **without installing anything or blocking the plugin**. See "Dependency
  declarations" below.

In the app itself you should see:

- A "Hello Plugin" card, rendered by this plugin's own `init()` from the
  widget it registered (via `RaxComponents.Card`).
- A working command: press `Ctrl/Cmd+K`, type "hello", and run **Say Hello**
  — it shows a toast via `RaxNotifications`.

## Lifecycle hooks

`index.js` implements all 5:

```js
RaxPlugins.registerManifest(manifest, {
  onInstall: function (m) { /* first time seen in this browser */ },
  onEnable: function (m) { /* fires every load while enabled */ },
  onDisable: function (m) { /* fires only if RaxPlugins.disablePlugin() is called */ },
  onUpdate: function (m, { from, to }) { /* fires when the manifest version changes */ },
  onUninstall: function (m) { /* fires only if RaxPlugins.uninstallPlugin() is called */ },
});
```

Try it yourself in the browser console, on the `hello-plugin.html` page:

```js
RaxPlugins.disablePlugin('hello-plugin');   // logs onDisable
RaxPlugins.enablePlugin('hello-plugin');    // logs onEnable again
RaxPlugins.getPlugin('hello-plugin');       // inspect the full record
RaxPlugins.isPluginEnabled('hello-plugin'); // true
```

## Dependency declarations

`manifest.json` declares zero required `dependencies` (this example doesn't
need any other plugin to function) but one **optional** dependency:

```json
"optionalDependencies": [
  { "id": "core-vpn-api", "version": ">=1.0.0" }
]
```

Since no plugin with id `core-vpn-api` exists in this repository,
`RaxPlugins.validateAll()` (called automatically after all plugins load)
logs a warning — visible in the console, never blocking, and RAX Theme
never attempts to fetch or install anything to satisfy it. This mirrors the
task's own examples (a "WireGuard" plugin depending on a "Core VPN API"
plugin, a "Grafana" plugin depending on a "Notification API" plugin) —
`RaxPlugins` validates and reports; it never resolves or installs.

## What this example deliberately does NOT show

- `registerMenuItem()` — this plugin has no sidebar entry; you reach it by
  URL directly, on purpose, to keep this example focused. See
  `docs/plugin-api.md` for `registerMenuItem()`.
- `registerSearchProvider()` / `registerTheme()` / `RaxAuth.registerProvider()`
  — same reasoning; see `docs/plugin-api.md` and `docs/auth-api.md`.
- A **required** dependency that's actually missing — this example only
  demonstrates the optional-dependency warning path, not the
  required-dependency error path, to avoid the example itself logging a
  scary-looking error on every load. Both paths use the same validation
  logic; see `docs/plugin-api.md`'s Dependency Resolution section for the
  required-dependency error message format.
- Any private/internal framework API. Everything this plugin calls is
  classified **Public** in `docs/api-classification.md`.
