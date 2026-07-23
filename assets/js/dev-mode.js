/**
 * dev-mode.js — RaxDevMode
 * ------------------------------------------------------------------
 * Purpose:        Optional, opt-in development instrumentation layer.
 *                 Disabled by default on every page in this
 *                 repository — enabling it changes nothing about how
 *                 the app behaves, only what gets logged.
 * Responsibility: Hold the enabled/disabled flag; collect and report
 *                 deprecated-API-usage warnings (fed by
 *                 RaxAPI.warnDeprecated()), plugin script load timing
 *                 (fed by plugin-loader.js), and plugin lifecycle hook
 *                 timing (fed by plugins.js) — but only when enabled.
 *                 Duplicate-registration reporting is NOT owned here
 *                 (RaxPlugins already reports those unconditionally,
 *                 exactly as before this stage — see "Why duplicate
 *                 registrations aren't gated by dev mode" below);
 *                 RaxDevMode.report() just also surfaces them for a
 *                 single combined summary.
 * Public API:     RaxDevMode.isEnabled() -> boolean
 *                 RaxDevMode.enable() / disable()
 *                 RaxDevMode.reportDeprecatedUsage(name, message)
 *                 RaxDevMode.recordPluginLoadTiming(src, durationMs)
 *                 RaxDevMode.recordLifecycleTiming(pluginId, hook, durationMs)
 *                 RaxDevMode.getDeprecatedUsage() -> entries
 *                 RaxDevMode.getPluginLoadTimings() -> entries
 *                 RaxDevMode.getLifecycleTimings() -> entries
 *                 RaxDevMode.report() -> prints a console summary
 * Dependencies:   none required (RaxPlugins is read softly, only
 *                 inside report(), only if present)
 * ------------------------------------------------------------------
 * HOW IT'S ENABLED: set `window.RAX_DEV_MODE = true` before this
 * script runs (same pattern as `window.RAX_PLUGINS`), or call
 * `RaxDevMode.enable()` at any time (persists via localStorage under
 * `rax-dev-mode`, so it survives a reload without needing the global
 * set again). Disabled by default on every page in this repository.
 * ------------------------------------------------------------------
 * "NO PRODUCTION OVERHEAD WHEN DISABLED" — how this is actually true,
 * not just claimed: every public function here starts with
 * `if (!enabled) return;` (or, for isEnabled() itself, is the check).
 * Every CALLER of this module (api.js, plugins.js, plugin-loader.js)
 * checks `RaxDevMode.isEnabled()` BEFORE doing any timing-related work
 * (e.g. before calling `Date.now()` twice to measure a duration), so
 * a disabled page does zero extra Date.now() calls, zero extra array
 * pushes, and zero extra console output — not "reduced," zero.
 * ------------------------------------------------------------------
 * WHY DUPLICATE REGISTRATIONS AREN'T GATED BY DEV MODE: RaxPlugins'
 * duplicate plugin/page/widget/command ID detection already logs
 * unconditionally, added in the Plugin Platform stage before this
 * module existed. Gating that behind dev mode now would be a
 * backward-incompatible behavior change (existing setups that rely on
 * seeing those errors in production console output would go silent).
 * Instead, `RaxDevMode.report()` reads `RaxPlugins.getValidationErrors()`/
 * `getValidationWarnings()` (if `RaxPlugins` is loaded) to include them
 * in one combined, formatted summary — additive, not a replacement.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'rax-dev-mode';
  var deprecatedUsage = [];
  var pluginLoadTimings = [];
  var lifecycleTimings = [];

  function readPersisted() {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }
  function writePersisted(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
    } catch (e) { /* storage unavailable — flag just won't persist across reloads */ }
  }

  var enabled = global.RAX_DEV_MODE === true || readPersisted();

  function isEnabled() {
    return enabled;
  }

  function enable() {
    enabled = true;
    writePersisted(true);
    console.info('[RaxDevMode] Enabled. Deprecated-API warnings, plugin load timing, and lifecycle timing will now be reported.');
  }

  function disable() {
    enabled = false;
    writePersisted(false);
  }

  function reportDeprecatedUsage(name, message) {
    if (!enabled) return;
    deprecatedUsage.push({ name: name, message: message, timestamp: Date.now() });
    console.warn('[RaxDevMode] Deprecated API used:', message);
  }

  function recordPluginLoadTiming(src, durationMs) {
    if (!enabled) return;
    pluginLoadTimings.push({ src: src, durationMs: durationMs });
  }

  function recordLifecycleTiming(pluginId, hook, durationMs) {
    if (!enabled) return;
    lifecycleTimings.push({ pluginId: pluginId, hook: hook, durationMs: durationMs });
  }

  function getDeprecatedUsage() { return deprecatedUsage.slice(); }
  function getPluginLoadTimings() { return pluginLoadTimings.slice(); }
  function getLifecycleTimings() { return lifecycleTimings.slice(); }

  function report() {
    if (!enabled) {
      console.info('[RaxDevMode] Not enabled — call RaxDevMode.enable() first, or set window.RAX_DEV_MODE = true before the framework scripts load.');
      return;
    }
    console.group('[RaxDevMode] Report');

    console.group('Deprecated API usage (' + deprecatedUsage.length + ')');
    if (!deprecatedUsage.length) console.log('None.');
    deprecatedUsage.forEach(function (d) { console.warn(d.message); });
    console.groupEnd();

    console.group('Plugin load timing (' + pluginLoadTimings.length + ')');
    if (!pluginLoadTimings.length) console.log('None recorded.');
    pluginLoadTimings.forEach(function (t) { console.log(t.src + ': ' + t.durationMs.toFixed(1) + 'ms'); });
    console.groupEnd();

    console.group('Plugin lifecycle timing (' + lifecycleTimings.length + ')');
    if (!lifecycleTimings.length) console.log('None recorded.');
    lifecycleTimings.forEach(function (t) { console.log(t.pluginId + '.' + t.hook + '(): ' + t.durationMs.toFixed(2) + 'ms'); });
    console.groupEnd();

    if (global.RaxPlugins) {
      var errors = global.RaxPlugins.getValidationErrors();
      var warnings = global.RaxPlugins.getValidationWarnings();
      console.group('Plugin validation (from RaxPlugins) — ' + errors.length + ' error(s), ' + warnings.length + ' warning(s)');
      errors.forEach(function (e) { console.error(e); });
      warnings.forEach(function (w) { console.warn(w); });
      console.groupEnd();
    }

    console.groupEnd();
  }

  global.RaxDevMode = {
    isEnabled: isEnabled,
    enable: enable,
    disable: disable,
    reportDeprecatedUsage: reportDeprecatedUsage,
    recordPluginLoadTiming: recordPluginLoadTiming,
    recordLifecycleTiming: recordLifecycleTiming,
    getDeprecatedUsage: getDeprecatedUsage,
    getPluginLoadTimings: getPluginLoadTimings,
    getLifecycleTimings: getLifecycleTimings,
    report: report,
  };
})(window);
