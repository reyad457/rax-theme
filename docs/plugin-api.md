# RAX Theme — Plugin / Extension API

This is the complete, stable surface a plugin is expected to use. Everything
here is classified **Public** in `docs/api-classification.md` — anything not
listed here (or listed as Internal/Private there) is not part of the
compatibility contract, even if technically reachable.

A plugin **never** edits a framework file (`core.js`, `registry.js`,
`navigation.js`, any `components/*.js`, any `components/*.css`). Everything a
plugin needs is reachable through the six `register*` functions below, plus
the shared UI components documented in `docs/component-api.md`.

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
1. Framework scripts load (events, registry, utils, theme, components, services)
2. RaxNavigation.mount({...}) — reserves the sidebar/topbar DOM, page id is now known
3. RaxPluginLoader.loadAll()
     → each plugins/*/index.js runs, calling registerPage/registerMenuItem/
       registerCommand/registerSearchProvider/registerWidget/registerTheme
4. RaxCore.boot()
     → RaxTheme.init()            (sees any registerTheme() calls from step 3)
     → mounts ToastStack/ModalHost
     → wires button ripple
     → RaxRegistry.getPage(pageId).init()   (the ACTIVE page's own module — built-in
       or a plugin's, whichever matches document.body.dataset.page)
     → wires card entrance animation
     → lucide.createIcons()
```

A plugin registering a *page* only has its `init()` called if that plugin's
own HTML page is the one currently loaded (`document.body.dataset.page`
matches). A plugin registering a *menu item*, *command*, or *theme* has that
registration take effect on every page that loads the plugin — which is why a
plugin's menu item / command registration should typically happen on every
page (declare the plugin in every page's `RAX_PLUGINS`), while a plugin's page
module logic only runs on its own page.

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
