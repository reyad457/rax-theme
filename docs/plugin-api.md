# RAX Theme — Plugin / Extension API

This is the complete, stable surface a plugin is expected to use. Everything
here is classified **Public** in [`api-classification.md`](api-classification.md)
(curated views: [`public-api.md`](public-api.md) /
[`internal-api.md`](internal-api.md)) — anything not listed there as Public
is not part of the compatibility contract, even if technically reachable.
See [`versioning.md`](versioning.md) for what that contract actually
guarantees, the deprecation system, and the difference between the
framework version and the API version.

A plugin **never** edits a framework file (`core.js`, `registry.js`,
`navigation.js`, any `components/*.js`, any `components/*.css`). Everything a
plugin needs is reachable through the `register*` functions below, the
plugin manifest/lifecycle/dependency system documented in
[`plugin-manifest.md`](plugin-manifest.md) and this file's own Plugin
Manifest/Lifecycle/Validation sections, the shared UI components documented
in `docs/component-api.md`, and — if the host application needs real access
control — the auth provider API documented in `docs/auth-api.md`.

---

## Loading a plugin

Add a plugin's entry-point script to a page:

```html
<script>window.RAX_PLUGINS = ['plugins/my-plugin/index.js'];</script>
```

This must appear **before** `assets/js/plugin-loader.js` runs. Every built-in
page already calls:

```js
RaxPluginLoader.loadAll().then(function () { RaxCore.boot(); });
```

instead of calling `RaxCore.boot()` directly — so `loadAll()` fetches and
executes every URL in `RAX_PLUGINS`, in order, and only then does `RaxCore.boot()`
read the registry to mount the sidebar, boot the active page module, and apply
the theme. See `plugins/README.md` for the plugin file convention itself.

### Lifecycle diagram

```
1. Framework scripts load (events, registry, utils, theme, auth, dev-mode,
   api, plugins, plugin-loader, components, services)
2. RaxNavigation.mount({...}) — reserves the sidebar/topbar DOM, page id is now known
3. RaxPluginLoader.loadAll()
     → each plugins/*/index.js runs, typically calling
       RaxPlugins.registerManifest() FIRST (see docs/plugin-manifest.md),
       then registerPage/registerMenuItem/registerCommand/
       registerSearchProvider/registerWidget/registerTheme/
       registerSettingsPage/registerNotification/registerPermission/
       RaxAuth.registerProvider
     → once every script has settled, RaxPluginLoader automatically calls
       RaxPlugins.validateAll() — checks every registered manifest's
       dependencies exist (see "Dependency Resolution" below)
4. RaxCore.boot()
     → RaxTheme.init()            (sees any registerTheme() calls from step 3)
     → mounts ToastStack/ModalHost
     → wires button ripple
     → RaxAuth.beforeRoute(pageId)   (sees any registerProvider() call from
       step 3 — resolves true immediately if no provider is registered)
     → if allowed: RaxRegistry.getPage(pageId).init()   (the ACTIVE page's own
       module — built-in or a plugin's, whichever matches
       document.body.dataset.page)
     → wires card entrance animation
     → lucide.createIcons()
```

A plugin registering a *page* only has its `init()` called if that plugin's
own HTML page is the one currently loaded (`document.body.dataset.page`
matches). A plugin registering a *menu item*, *command*, *theme*, *settings
page*, *notification*, *permission*, or an *auth provider* has that
registration take effect on every page that loads the plugin — which is why
those registrations should typically happen on every page (declare the
plugin in every page's `RAX_PLUGINS`), while a plugin's page module logic
only runs on its own page.

---

## `RaxRegistry.registerPage({ id, title, init, destroy })`

Registers a page module. `init()` runs once, when `document.body.dataset.page`
matches `id` (set by that page's own `RaxNavigation.mount({ active: id, ... })`
call). `destroy()` exists for contract completeness (no built-in page calls it
today — single-page-load lifetime) but should be implemented by any plugin
that sets up something needing cleanup (event listeners, timers).

```js
RaxRegistry.registerPage({
  id: 'backups',
  title: 'Backups',
  init: function () { /* mount your UI, wire your data */ },
  destroy: function () { /* teardown */ },
});
```

## `RaxRegistry.registerMenuItem({ pageId, href, icon, label, section, order })`

Adds a sidebar entry. `icon` is any [Lucide](https://lucide.dev) icon name.
`section` groups entries under a heading (existing sections: `Overview`,
`Network`, `Protection`, `Firewall` — a plugin can introduce a new section name
freely, e.g. `'Plugins'`). `order` controls position within its section
(lower = higher, default `100`).

```js
RaxRegistry.registerMenuItem({
  pageId: 'backups', href: 'backups.html', icon: 'archive',
  label: 'Backups', section: 'Plugins', order: 10,
});
```

## `RaxRegistry.registerWidget({ id, mountPoint, component, props })`

Registers a dashboard widget for a named mount point. `RaxRegistry.getWidgets(mountPoint)`
returns everything registered for that point — a future dashboard-customization
feature (see `ROADMAP.md`, not yet built) reads from here. No built-in page
calls `getWidgets()` yet, so this is a forward-declared extension point, documented so it's ready when that feature ships.

```js
RaxRegistry.registerWidget({
  id: 'backup-status-widget',
  mountPoint: 'dashboard-summary',
  component: 'Card', // one of the Public RaxComponents (docs/component-api.md)
  props: { title: 'Last Backup', value: '2h ago', status: { type: 'ok', label: 'Healthy' } },
});
```

## `RaxRegistry.registerCommand({ id, label, handler, icon, keywords })`

Adds an entry to the command palette (`Ctrl/Cmd+K`).

```js
RaxRegistry.registerCommand({
  id: 'run-backup-now',
  label: 'Run Backup Now',
  icon: 'play',
  handler: function () { /* ... */ RaxNotifications.ok('Backup started'); },
});
```

## `RaxRegistry.registerSearchProvider(pageId, queryFn)`

Wires the topbar search box for a specific page. `queryFn(term)` runs on every
keystroke (debounced 150ms by `Topbar`); it should filter the page's own
**existing, real** DOM content (never fabricate data to search over) and
**return an array of the matched elements**, which drives the topbar's
`aria-live` results announcement.

```js
RaxRegistry.registerSearchProvider('backups', function (term) {
  var rows = RaxUtils.qsa('#backupsTable tbody tr');
  var lower = term.toLowerCase();
  var matches = [];
  rows.forEach(function (row) {
    var isMatch = term.length === 0 || row.textContent.toLowerCase().indexOf(lower) !== -1;
    row.hidden = !isMatch;
    if (isMatch) matches.push(row);
  });
  return matches;
});
```

This is a thin alias for `RaxSearch.registerProvider` — see
`docs/api-classification.md` for why it lives in `search.js` rather than being
duplicated here.

## `RaxTheme.registerTheme(name, { accent, accentGlow?, chartSeries? })`

Registers a named, reusable accent theme. Full detail, including the boot
lifecycle requirement (must run before `RaxCore.boot()`), is in
`docs/theming.md`.

## `RaxRegistry.registerSettingsPage({ id, label, icon, section, order, render })`

Declares a settings page. `render` is a function your plugin defines and is
responsible for calling yourself (e.g. from your own page's `init()`) —
`registerSettingsPage()` only stores the registration; RAX Theme does not
ship a settings hub UI that consumes it automatically today. This is the
same "storage now, consuming UI later" pattern as `registerWidget()`.

```js
RaxRegistry.registerSettingsPage({
  id: 'backup-schedule',
  label: 'Backup Schedule',
  icon: 'clock',
  section: 'Plugins',
  order: 10,
  render: function (container) { /* render your settings form into container */ },
});
```

## `RaxRegistry.registerNotification({ id, type, message, icon, timestamp })`

Registers a persistent notification (distinct from the transient toasts
`RaxNotifications.toast()` shows — see `docs/component-api.md`'s Toast
section). `RaxRegistry.getNotifications()` returns everything registered,
newest first. Like `registerSettingsPage()`, this is storage only — no
notification-center UI exists in the built-in app yet to display these.

```js
RaxRegistry.registerNotification({
  id: 'backup-failed-' + Date.now(),
  type: 'danger',
  message: 'Nightly backup failed — disk full',
  icon: 'alert-triangle',
});
```

## `RaxRegistry.registerPermission({ id, label, description })`

Declares a permission your plugin defines or checks. This is metadata only —
it doesn't grant or enforce anything by itself. The actual runtime check
always goes through `RaxAuth.hasPermission(permissionId)`, documented in
full in [`docs/auth-api.md`](auth-api.md).

```js
RaxRegistry.registerPermission({
  id: 'backups.run',
  label: 'Run Backups',
  description: 'Allows manually triggering an on-demand backup.',
});
```

---

## Plugin manifest — `RaxPlugins.registerManifest(manifest, hooks?)`

Every plugin should register a manifest describing what it is. The complete
field-by-field schema reference, with a full worked example, is in
[`plugin-manifest.md`](plugin-manifest.md) — this section covers how
registration fits into the plugin lifecycle.

```js
RaxPlugins.registerManifest({
  id: 'backups', name: 'Backups', version: '1.0.0',
  dependencies: [{ id: 'core-vpn-api', version: '>=1.0.0' }],
}, {
  onInstall: function (m) { /* ... */ },
  onEnable: function (m) { /* ... */ },
});
```

Call this **before** any `registerPage`/`registerWidget`/`registerCommand`
call in your plugin's script — see `plugin-manifest.md`'s "How the manifest
is loaded" section for why the ordering matters.

## Plugin lifecycle

`registerManifest()`'s second argument is an optional hooks object. All 5
hooks are optional; a plugin can implement none, some, or all of them:

| Hook | Fires when |
|---|---|
| `onInstall(manifest)` | The first time this plugin's `id` has ever been seen in this browser (tracked via `localStorage`) |
| `onUpdate(manifest, { from, to })` | The persisted version for this `id` differs from the version just registered |
| `onEnable(manifest)` | Every time the plugin loads and registers while enabled (the default) — **not** a one-time transition, since a buildless static app has no persistent "session" beyond a single page load |
| `onDisable(manifest)` | Only when `RaxPlugins.disablePlugin(id)` is called explicitly — nothing calls this automatically |
| `onUninstall(manifest)` | Only when `RaxPlugins.uninstallPlugin(id)` is called explicitly |

**There is no installer and no plugin-manager UI.** These hooks are called
through the existing `RaxPluginLoader` — "installing" a plugin in RAX Theme
today means adding its script to `RAX_PLUGINS`; "uninstalling" means removing
it (calling `RaxPlugins.uninstallPlugin()` only resets tracked lifecycle
state, it doesn't stop a still-declared script from loading again). Each
hook call is also paired with a `plugin:*` event (`plugin:installed`,
`plugin:updated`, `plugin:enabled`, `plugin:disabled`, `plugin:uninstalled`)
— see `docs/events.md` — so code that isn't the plugin itself can react too.

## Dependency resolution

A plugin declares `dependencies`/`optionalDependencies` in its manifest (see
`plugin-manifest.md`). **RAX Theme validates that a dependency's plugin id
has been registered — it never installs, downloads, or fetches anything.**
There is no package manager here; ordering `RAX_PLUGINS` so dependencies load
before the plugins that need them is the host application's responsibility.

**Worked example — a plugin requiring another:**

```js
// plugins/wireguard-plugin/index.js
RaxPlugins.registerManifest({
  id: 'wireguard-plugin', name: 'WireGuard', version: '2.1.0',
  dependencies: [{ id: 'core-vpn-api', version: '>=1.0.0' }],
});
```

If `RAX_PLUGINS` is `['plugins/wireguard-plugin/index.js']` — i.e.
`core-vpn-api` was never declared at all — `RaxPluginLoader.loadAll()`'s
automatic `RaxPlugins.validateAll()` call logs:

```
[RaxPlugins] Plugin "wireguard-plugin" depends on "core-vpn-api", which is
not registered. RAX Theme does not install dependencies automatically —
make sure "core-vpn-api" is loaded (declared earlier in RAX_PLUGINS) before
"wireguard-plugin".
```

**Worked example — an optional dependency:**

```js
// plugins/grafana-plugin/index.js
RaxPlugins.registerManifest({
  id: 'grafana-plugin', name: 'Grafana', version: '1.0.0',
  optionalDependencies: [{ id: 'notification-api', version: '>=1.0.0' }],
});
```

Same situation, but logged as a **warning**, not an error, since the
dependency is optional — the Grafana plugin is expected to still function,
just without whatever richer notification integration it would have used.

Both examples are the exact scenarios named in this platform's own design
brief; `examples/hello-plugin/` demonstrates the optional-dependency warning
path end to end (open its console — see `examples/hello-plugin/README.md`).

## Plugin validation

`RaxPlugins` checks, and reports on (never blocks on):

- **Manifest schema** — `id`/`name`/`version` required and correctly typed;
  `dependencies`/`optionalDependencies`/`keywords`/`permissions` must be
  arrays if present. A schema-invalid manifest is refused (`registerManifest()`
  returns `false`) since there's nothing coherent to register.
- **Duplicate plugin IDs** — two `registerManifest()` calls with the same
  `id`.
- **Duplicate page/widget/command IDs** — detected by listening to
  `registry:change` (see `docs/events.md`) and attributing every
  `registerPage`/`registerWidget`/`registerCommand` call to whichever
  manifest was most recently registered (or `(built-in)` if none was). If a
  second plugin — or a plugin and a built-in page — registers the same id,
  both are named in the error.
- **Unsupported framework version** — a manifest's `minimumRaxVersion`
  checked against `RaxCore.VERSION`.
- **Unsupported/future API version** — a manifest's `apiVersion` checked
  against `RaxAPI.VERSION`/`RaxAPI.MIN_SUPPORTED_VERSION`, folded into this
  same log. Full detail: [`docs/versioning.md`](versioning.md).
- **Missing dependencies** — see "Dependency resolution" above.

All errors/warnings are human-readable strings, logged to the console with a
`[RaxPlugins]` prefix, and queryable after the fact:

```js
RaxPlugins.getValidationErrors();   // string[]
RaxPlugins.getValidationWarnings(); // string[]
```

## Plugin metadata API

```js
RaxPlugins.getPlugin('wireguard-plugin');
// -> { id, name, version, ...every manifest field, enabled: true, installedVersion: '2.1.0' } | null

RaxPlugins.getPlugins();
// -> array of the same shape, for every registered plugin

RaxPlugins.isPluginEnabled('wireguard-plugin'); // -> boolean
RaxPlugins.getPluginVersion('wireguard-plugin'); // -> '2.1.0' | null

RaxPlugins.enablePlugin('wireguard-plugin');   // fires onEnable, emits plugin:enabled
RaxPlugins.disablePlugin('wireguard-plugin');  // fires onDisable, emits plugin:disabled
RaxPlugins.uninstallPlugin('wireguard-plugin'); // fires onUninstall, emits plugin:uninstalled
```

No UI in RAX Theme calls any of the above today — same "storage/dispatch is
real, consuming UI is later work" pattern as `registerWidget()` before
dashboard customization existed. A host application can build its own
plugin-management surface on top of this API; RAX Theme deliberately ships
none itself.

## Developer mode

Opt-in, disabled by default, zero overhead when off. Enable it to see
deprecated-API-usage warnings, plugin load timing, and plugin lifecycle hook
timing:

```js
window.RAX_DEV_MODE = true; // before framework scripts load, OR:
RaxDevMode.enable();         // at any time
RaxDevMode.report();          // prints a combined summary
```

Full reference: [`docs/versioning.md`](versioning.md#developer-mode).

## Authentication — `RaxAuth`

RAX Theme has no built-in login page or auth backend. If your host
application needs real access control, register an auth provider — a
complete, dedicated guide (interface contract, lifecycle, an illustrative
example, and the exact backward-compatible default behavior when no
provider is registered) is in [`docs/auth-api.md`](auth-api.md).

---

## Shared UI components available to plugins

`RaxComponents.Card`, `.Widget`, `.Modal`, `.Table`, `.Tabs`, `.Toast` are all
Public and safe to use for a consistent look — see `docs/component-api.md`
for each one's exact `props` shape. `RaxComponents.Sidebar`/`.Topbar` are
framework-owned singletons; do not mount these yourself.

---

## What plugins must NOT do

- Edit any file under `assets/` that isn't their own `plugins/<name>/` folder.
- Call `RaxComponents.Sidebar.mount()` / `.Topbar.mount()` — these are mounted
  exactly once by `navigation.js`.
- Assume another plugin's registration exists — registries don't guarantee
  load order between unrelated plugins, only that all of `RAX_PLUGINS` finish
  loading before `RaxCore.boot()` runs (see the lifecycle diagram above).
- Reach into another component's returned `instance` object — the only
  supported interaction is through a component's own `mount`/`update`/`destroy`
  and the shared event bus (`docs/events.md`).
- Assume your auth provider is the only one that will ever be registered —
  `RaxAuth` supports exactly one active provider; registering a second
  replaces the first (see `docs/auth-api.md`).
- Assume a declared `dependencies`/`optionalDependencies` entry will be
  fetched or installed for you — `RaxPlugins` only validates and reports;
  see "Dependency resolution" above.
