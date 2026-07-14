# RAX Theme plugins/

This folder is where third-party plugins live. It is intentionally empty —
Phase E (framework stabilization) explicitly does not ship an example plugin.
See `docs/plugin-api.md` for the full guide; this file is just the folder-level
convention.

## Convention

Each plugin gets its own subfolder:

```
plugins/
└── <plugin-name>/
    └── index.js      (entry point — see below)
```

A plugin's `index.js` is a plain classic script (no bundler, no ES module
imports) that calls the public Extension API at load time:

```js
(function (global) {
  'use strict';
  global.RaxRegistry.registerPage({ id: 'my-plugin', title: 'My Plugin', init: init, destroy: destroy });
  global.RaxRegistry.registerMenuItem({ pageId: 'my-plugin', href: 'my-plugin.html', icon: 'puzzle', label: 'My Plugin', section: 'Plugins' });
  function init() { /* ... */ }
  function destroy() { /* ... */ }
})(window);
```

## Loading a plugin

A page declares which plugins to load, before any framework script runs:

```html
<script>window.RAX_PLUGINS = ['plugins/my-plugin/index.js'];</script>
```

Every built-in RAX Theme page already calls
`RaxPluginLoader.loadAll().then(function () { RaxCore.boot(); })` instead of
calling `RaxCore.boot()` directly — so once a page declares `RAX_PLUGINS`,
plugins load and register themselves before the sidebar renders and the page
module boots. No core file needs to change.

Full lifecycle details, the complete Extension API reference, and the six
`register*` functions available to a plugin are documented in
`docs/plugin-api.md`.
