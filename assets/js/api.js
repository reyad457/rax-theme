/**
 * api.js — RaxAPI
 * ------------------------------------------------------------------
 * Purpose:        Makes the Public/Internal/Experimental distinction
 *                 (previously documentation-only, in
 *                 docs/api-classification.md) a real, queryable
 *                 runtime registry — plus the deprecation system and
 *                 the API-version compatibility checker that build on
 *                 top of it.
 * Responsibility: Hold the classification table, the deprecation
 *                 registry, and the framework API version. Check a
 *                 plugin manifest's declared `apiVersion` for
 *                 compatibility. Never modifies, wraps, or hides any
 *                 existing export — see "Why this doesn't 'prevent'
 *                 anything at runtime" below.
 * Public API:     RaxAPI.VERSION                    -- e.g. 'v1'
 *                 RaxAPI.MIN_SUPPORTED_VERSION       -- e.g. 'v1'
 *                 RaxAPI.classify(moduleName, exportName, tier)
 *                 RaxAPI.getClassification(moduleName, exportName)
 *                 RaxAPI.getSurface(tier?)           -- list entries
 *                 RaxAPI.deprecate(name, { replacement, removalVersion, message? })
 *                 RaxAPI.warnDeprecated(name)        -- call at the
 *                     point of use; no-op unless RaxDevMode is enabled
 *                 RaxAPI.isDeprecated(name)
 *                 RaxAPI.getDeprecations()
 *                 RaxAPI.checkPluginCompatibility(manifest)
 * Dependencies:   RaxDevMode (soft — deprecation warnings only print
 *                 when RaxDevMode.isEnabled() is true; if RaxDevMode
 *                 isn't loaded at all, warnDeprecated() is a silent
 *                 no-op, never an error)
 * Extension:      docs/public-api.md and docs/internal-api.md are the
 *                 curated, human-facing views of the classification
 *                 table this module holds at runtime.
 *                 docs/versioning.md covers the framework-version vs
 *                 API-version distinction and the deprecation policy
 *                 in full.
 * ------------------------------------------------------------------
 * WHY THIS DOESN'T "PREVENT" ANYTHING AT RUNTIME: every RaxComponents/
 * Rax* module remains a plain global, exactly as before — nothing here
 * hides, freezes, or blocks access to an Internal-tier export, because
 * doing so would be a breaking change for the (hopefully zero, but
 * unknowable) code already relying on one, which the task's own rules
 * forbid ("maintain full backward compatibility"). "Prevent plugins
 * from relying on internal modules" is implemented as strong,
 * consistent documentation (docs/public-api.md /
 * docs/internal-api.md) plus, when Developer Mode is enabled, a loud
 * console warning the moment a deprecated or internal-tier function
 * is used through the one place this module can actually observe it
 * (RaxAPI.warnDeprecated(), called explicitly by a handful of
 * functions — see docs/versioning.md for the exact list). It is a
 * social/tooling contract, enforced by visibility, not a technical
 * sandbox.
 * ------------------------------------------------------------------
 * PRE-POPULATED CLASSIFICATION TABLE: this module ships already
 * knowing the tier of every export documented in
 * docs/api-classification.md, so `RaxAPI.getClassification(...)` is
 * useful immediately without every module needing to call
 * `RaxAPI.classify()` itself at load time (most don't, to avoid a
 * hard load-order dependency on api.js from every other module).
 */
(function (global) {
  'use strict';

  var API_VERSION = 'v1';
  var MIN_SUPPORTED_VERSION = 'v1';

  var classifications = Object.create(null); // "Module.export" -> tier
  var deprecations = Object.create(null); // name -> { replacement, removalVersion, message }

  function key(moduleName, exportName) {
    return moduleName + '.' + exportName;
  }

  function classify(moduleName, exportName, tier) {
    if (['public', 'internal', 'experimental'].indexOf(tier) === -1) {
      console.error('[RaxAPI] classify() tier must be "public", "internal", or "experimental", got "' + tier + '".');
      return;
    }
    classifications[key(moduleName, exportName)] = tier;
  }

  function getClassification(moduleName, exportName) {
    return classifications[key(moduleName, exportName)] || null;
  }

  function getSurface(tier) {
    return Object.keys(classifications)
      .filter(function (k) { return !tier || classifications[k] === tier; })
      .map(function (k) { return { name: k, tier: classifications[k] }; });
  }

  // ---- Pre-populated from docs/api-classification.md — kept in sync by
  // hand; this table and that document should never disagree. ----
  [
    // RaxEvents
    ['RaxEvents', 'on', 'public'], ['RaxEvents', 'once', 'public'],
    ['RaxEvents', 'off', 'public'], ['RaxEvents', 'emit', 'public'],
    // RaxRegistry
    ['RaxRegistry', 'registerPage', 'public'], ['RaxRegistry', 'registerMenuItem', 'public'],
    ['RaxRegistry', 'registerWidget', 'public'], ['RaxRegistry', 'registerCommand', 'public'],
    ['RaxRegistry', 'registerSearchProvider', 'public'], ['RaxRegistry', 'registerSettingsPage', 'public'],
    ['RaxRegistry', 'registerNotification', 'public'], ['RaxRegistry', 'registerPermission', 'public'],
    ['RaxRegistry', 'getPage', 'public'], ['RaxRegistry', 'getMenuItems', 'public'],
    ['RaxRegistry', 'getWidgets', 'public'], ['RaxRegistry', 'getCommands', 'public'],
    ['RaxRegistry', 'getSettingsPages', 'public'], ['RaxRegistry', 'getNotifications', 'public'],
    ['RaxRegistry', 'getPermissions', 'public'],
    // RaxSearch
    ['RaxSearch', 'registerProvider', 'public'], ['RaxSearch', 'query', 'internal'],
    // RaxTheme
    ['RaxTheme', 'getMode', 'public'], ['RaxTheme', 'setMode', 'public'], ['RaxTheme', 'toggleMode', 'public'],
    ['RaxTheme', 'getAccent', 'public'], ['RaxTheme', 'setAccent', 'public'], ['RaxTheme', 'setCustomAccent', 'public'],
    ['RaxTheme', 'registerTheme', 'public'], ['RaxTheme', 'getRegisteredThemes', 'public'], ['RaxTheme', 'init', 'internal'],
    // RaxAuth
    ['RaxAuth', 'registerProvider', 'public'], ['RaxAuth', 'currentUser', 'public'], ['RaxAuth', 'login', 'public'],
    ['RaxAuth', 'logout', 'public'], ['RaxAuth', 'hasPermission', 'public'], ['RaxAuth', 'beforeRoute', 'public'],
    ['RaxAuth', 'isProviderRegistered', 'public'],
    // RaxPlugins
    ['RaxPlugins', 'registerManifest', 'public'], ['RaxPlugins', 'enablePlugin', 'public'],
    ['RaxPlugins', 'disablePlugin', 'public'], ['RaxPlugins', 'uninstallPlugin', 'public'],
    ['RaxPlugins', 'getPlugin', 'public'], ['RaxPlugins', 'getPlugins', 'public'],
    ['RaxPlugins', 'isPluginEnabled', 'public'], ['RaxPlugins', 'getPluginVersion', 'public'],
    ['RaxPlugins', 'validateAll', 'public'], ['RaxPlugins', 'getValidationErrors', 'public'],
    ['RaxPlugins', 'getValidationWarnings', 'public'],
    // RaxCharts
    ['RaxCharts', 'create', 'public'], ['RaxCharts', 'destroy', 'public'],
    // RaxNotifications
    ['RaxNotifications', 'toast', 'public'], ['RaxNotifications', 'ok', 'public'],
    ['RaxNotifications', 'warn', 'public'], ['RaxNotifications', 'danger', 'public'], ['RaxNotifications', 'info', 'public'],
    // RaxCommandPalette
    ['RaxCommandPalette', 'open', 'public'], ['RaxCommandPalette', 'close', 'public'],
    // RaxNavigation / RaxCore / RaxPluginLoader
    ['RaxNavigation', 'mount', 'public'], ['RaxCore', 'boot', 'public'], ['RaxCore', 'VERSION', 'public'],
    ['RaxPluginLoader', 'load', 'public'], ['RaxPluginLoader', 'loadAll', 'public'],
    // RaxAPI itself + RaxDevMode
    ['RaxAPI', 'classify', 'public'], ['RaxAPI', 'getClassification', 'public'], ['RaxAPI', 'getSurface', 'public'],
    ['RaxAPI', 'deprecate', 'public'], ['RaxAPI', 'warnDeprecated', 'public'], ['RaxAPI', 'isDeprecated', 'public'],
    ['RaxAPI', 'getDeprecations', 'public'], ['RaxAPI', 'checkPluginCompatibility', 'public'],
    ['RaxDevMode', 'isEnabled', 'public'], ['RaxDevMode', 'enable', 'public'], ['RaxDevMode', 'disable', 'public'],
    ['RaxDevMode', 'report', 'public'],
    // RaxUtils — Internal except the two promoted to Public in the auth/theme stage
    ['RaxUtils', 'qs', 'internal'], ['RaxUtils', 'qsa', 'internal'], ['RaxUtils', 'dom', 'internal'],
    ['RaxUtils', 'debounce', 'internal'], ['RaxUtils', 'formatNumber', 'internal'], ['RaxUtils', 'formatBytes', 'internal'],
    ['RaxUtils', 'readCssVar', 'public'], ['RaxUtils', 'hexToRgba', 'public'],
    // RaxComponents — Sidebar/Topbar are framework singletons (internal); the rest are Public
    ['RaxComponents.Sidebar', 'mount', 'internal'], ['RaxComponents.Topbar', 'mount', 'internal'],
    ['RaxComponents.Card', 'mount', 'public'], ['RaxComponents.Widget', 'mount', 'public'],
    ['RaxComponents.Modal', 'mount', 'public'], ['RaxComponents.Table', 'mount', 'public'],
    ['RaxComponents.Tabs', 'mount', 'public'], ['RaxComponents.Toast', 'mount', 'public'],
  ].forEach(function (row) { classify(row[0], row[1], row[2]); });

  // ---- Deprecation system --------------------------------------------
  function deprecate(name, info) {
    if (!name || !info || !info.replacement || !info.removalVersion) {
      console.error('[RaxAPI] deprecate() requires (name, { replacement, removalVersion }).');
      return;
    }
    deprecations[name] = {
      replacement: info.replacement,
      removalVersion: info.removalVersion,
      message: info.message || null,
    };
  }

  function isDeprecated(name) {
    return Object.prototype.hasOwnProperty.call(deprecations, name);
  }

  function getDeprecations() {
    return Object.keys(deprecations).map(function (name) {
      return Object.assign({ name: name }, deprecations[name]);
    });
  }

  /** Call this at the point where a deprecated API is actually used.
   * Deliberately "development only" per the task: if RaxDevMode isn't
   * loaded, or is loaded but disabled, this does nothing at all — not
   * even a lookup into `deprecations` — so there is zero cost in a
   * production page that never enables dev mode. */
  function warnDeprecated(name) {
    if (!global.RaxDevMode || !global.RaxDevMode.isEnabled()) return;
    var info = deprecations[name];
    if (!info) return;
    var msg = '"' + name + '" is deprecated' +
      (info.removalVersion ? ' and will be removed in ' + info.removalVersion : '') +
      '. Use "' + info.replacement + '" instead.' +
      (info.message ? ' ' + info.message : '');
    global.RaxDevMode.reportDeprecatedUsage(name, msg);
  }

  // ---- API-version compatibility checker ------------------------------
  function parseApiVersion(v) {
    var m = /^v(\d+)$/.exec(String(v || '').trim());
    return m ? parseInt(m[1], 10) : null;
  }

  function checkPluginCompatibility(manifest) {
    var issues = [];
    if (!manifest) return { compatible: true, issues: issues };

    var declared = manifest.apiVersion;
    if (declared == null) {
      issues.push({
        level: 'info',
        message: 'Plugin "' + manifest.id + '" does not declare an apiVersion; assuming compatibility with the current API (' + API_VERSION + '). Declaring apiVersion is recommended — see docs/versioning.md.',
      });
      return { compatible: true, issues: issues };
    }

    var declaredNum = parseApiVersion(declared);
    var currentNum = parseApiVersion(API_VERSION);
    var minNum = parseApiVersion(MIN_SUPPORTED_VERSION);

    if (declaredNum == null) {
      issues.push({
        level: 'warning',
        message: 'Plugin "' + manifest.id + '" declares an unrecognized apiVersion "' + declared + '" — expected a format like "v1". Skipping the compatibility check.',
      });
      return { compatible: true, issues: issues };
    }

    if (declaredNum < minNum) {
      issues.push({
        level: 'error',
        message: 'Plugin "' + manifest.id + '" targets API ' + declared + ', which is no longer supported (minimum supported is ' + MIN_SUPPORTED_VERSION + '). It may not work correctly.',
      });
      return { compatible: false, issues: issues };
    }

    if (declaredNum > currentNum) {
      issues.push({
        level: 'warning',
        message: 'Plugin "' + manifest.id + '" targets API ' + declared + ', which is newer than this framework provides (' + API_VERSION + '). It may rely on functionality that does not exist yet.',
      });
      return { compatible: true, issues: issues };
    }

    if (isDeprecated('api-' + declared)) {
      var dep = deprecations['api-' + declared];
      issues.push({
        level: 'warning',
        message: 'Plugin "' + manifest.id + '" targets API ' + declared + ', which is deprecated' +
          (dep.removalVersion ? ' and will be removed in ' + dep.removalVersion : '') +
          '. Consider targeting ' + dep.replacement + '.',
      });
    }

    return { compatible: true, issues: issues };
  }

  global.RaxAPI = {
    VERSION: API_VERSION,
    MIN_SUPPORTED_VERSION: MIN_SUPPORTED_VERSION,
    classify: classify,
    getClassification: getClassification,
    getSurface: getSurface,
    deprecate: deprecate,
    warnDeprecated: warnDeprecated,
    isDeprecated: isDeprecated,
    getDeprecations: getDeprecations,
    checkPluginCompatibility: checkPluginCompatibility,
  };
})(window);
