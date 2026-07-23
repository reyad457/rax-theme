/**
 * plugin-loader.js — RaxPluginLoader
 * ------------------------------------------------------------------
 * Purpose:        Loads plugin scripts without any core module (core.js,
 *                 registry.js, navigation.js, etc.) needing to know
 *                 plugins exist. This file is the entire "loading"
 *                 mechanism referenced in docs/plugin-api.md.
 * Responsibility: Given a list of plugin entry-point URLs, inject and
 *                 load them in order, each as a plain classic <script>
 *                 (same loading model as every framework module — no
 *                 bundler, no module resolution, works from a plain
 *                 file:// or static host, matching this project's
 *                 zero-build-step constraint). Once every declared
 *                 plugin has finished loading (and, in the process,
 *                 called RaxPlugins.registerManifest() if it has a
 *                 manifest), automatically runs dependency validation
 *                 — see "Automatic validation" below.
 * Public API:     RaxPluginLoader.load(src) -> Promise
 *                 RaxPluginLoader.loadAll(list?) -> Promise
 *                     list defaults to window.RAX_PLUGINS (an array of
 *                     script URLs a page may declare before this
 *                     script runs; defaults to [] if undeclared).
 * Dependencies:   none required — deliberately has zero hard dependency
 *                 on registry.js/theme.js/etc. so it can load early and
 *                 doesn't care what a plugin does once loaded.
 *                 RaxPlugins is used if present (see below) but its
 *                 absence is handled gracefully.
 * ------------------------------------------------------------------
 * LIFECYCLE CONTRACT: every page's bootstrap script calls
 *   RaxPluginLoader.loadAll().then(function () { RaxCore.boot(); });
 * instead of calling RaxCore.boot() directly. This guarantees every
 * plugin's registerPage/registerMenuItem/registerCommand/
 * registerSearchProvider/registerTheme/registerManifest call has
 * already run BEFORE RaxCore.boot() reads the registry to render the
 * sidebar, boot the page module, and apply the theme — see
 * docs/plugin-api.md for the full lifecycle diagram. window.RAX_PLUGINS
 * defaults to an empty array on every built-in RAX Theme page, so this
 * adds an async tick but changes no visible behavior when no plugins
 * are declared.
 * ------------------------------------------------------------------
 * AUTOMATIC VALIDATION: after every script in the list has resolved
 * (loaded or failed — a failed plugin never blocks the others), this
 * module calls `RaxPlugins.validateAll()` if `RaxPlugins` is loaded,
 * which checks every registered manifest's declared dependencies exist
 * and logs any problems (see docs/plugin-manifest.md and
 * docs/plugin-api.md). This is deliberately wired here rather than in
 * each page's own bootstrap script, so a page author never needs to
 * remember to call it — same reasoning as RaxAuth.beforeRoute() being
 * wired into RaxCore.boot() rather than left for each page to call.
 * If RaxPlugins isn't loaded on a given page (e.g. a minimal custom
 * page that doesn't need the plugin platform), this is a silent no-op
 * — backward compatible with any page that predates plugins.js.
 * ------------------------------------------------------------------
 * DEV-MODE TIMING (zero cost when disabled): if `RaxDevMode` is loaded
 * AND enabled, each script's load duration is measured and recorded
 * via `RaxDevMode.recordPluginLoadTiming()`, and a full
 * `RaxDevMode.report()` prints automatically once everything settles.
 * Every one of these checks `RaxDevMode.isEnabled()` FIRST — a
 * disabled (the default) or absent RaxDevMode means not even a single
 * `Date.now()` call happens here.
 */
(function (global) {
  'use strict';

  function devModeOn() {
    return !!(global.RaxDevMode && global.RaxDevMode.isEnabled());
  }

  function load(src) {
    var timed = devModeOn();
    var start = timed ? Date.now() : 0;
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.onload = function () {
        if (timed) global.RaxDevMode.recordPluginLoadTiming(src, Date.now() - start);
        resolve(src);
      };
      script.onerror = function () {
        var err = new Error('[RaxPluginLoader] Failed to load plugin script: ' + src);
        console.error(err.message);
        reject(err);
      };
      document.head.appendChild(script);
    });
  }

  function loadAll(list) {
    var plugins = list || global.RAX_PLUGINS || [];
    // Sequential, not parallel: plugins may depend on load order
    // (e.g. one plugin's theme must register before another plugin's
    // page tries to use it). A failed plugin is logged and skipped —
    // it must never block the rest of the app from booting.
    return plugins.reduce(function (chain, src) {
      return chain.then(function () { return load(src); }).catch(function (err) {
        console.error(err);
      });
    }, Promise.resolve()).then(function () {
      if (global.RaxPlugins) global.RaxPlugins.validateAll();
      if (devModeOn()) global.RaxDevMode.report();
    });
  }

  global.RaxPluginLoader = { load: load, loadAll: loadAll };
})(window);
