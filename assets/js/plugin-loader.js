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
 *                 zero-build-step constraint).
 * Public API:     RaxPluginLoader.load(src) -> Promise
 *                 RaxPluginLoader.loadAll(list?) -> Promise
 *                     list defaults to window.RAX_PLUGINS (an array of
 *                     script URLs a page may declare before this
 *                     script runs; defaults to [] if undeclared).
 * Dependencies:   none — deliberately has zero dependency on registry.js/
 *                 theme.js/etc. so it can load early and doesn't care
 *                 what a plugin does once loaded.
 * ------------------------------------------------------------------
 * LIFECYCLE CONTRACT: every page's bootstrap script calls
 *   RaxPluginLoader.loadAll().then(function () { RaxCore.boot(); });
 * instead of calling RaxCore.boot() directly. This guarantees every
 * plugin's registerPage/registerMenuItem/registerCommand/
 * registerSearchProvider/registerTheme call has already run BEFORE
 * RaxCore.boot() reads the registry to render the sidebar, boot the
 * page module, and apply the theme — see docs/plugin-api.md for the
 * full lifecycle diagram. window.RAX_PLUGINS defaults to an empty
 * array on every built-in RAX Theme page, so this adds an async tick
 * but changes no visible behavior when no plugins are declared
 * (Phase E objective 9: preserve compatibility).
 */
(function (global) {
  'use strict';

  function load(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.onload = function () { resolve(src); };
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
    }, Promise.resolve());
  }

  global.RaxPluginLoader = { load: load, loadAll: loadAll };
})(window);
