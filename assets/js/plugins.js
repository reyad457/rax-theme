/**
 * plugins.js — RaxPlugins
 * ------------------------------------------------------------------
 * Purpose:        Turns RAX Theme's plugin *loading* mechanism
 *                 (RaxPluginLoader, which only fetches/executes
 *                 scripts) into a plugin *platform*: every plugin
 *                 declares a manifest, gets lifecycle hooks called
 *                 through the existing loader, has its declared
 *                 dependencies validated (never auto-installed), and
 *                 is discoverable through a metadata API.
 * Responsibility: Store manifests, dispatch onInstall/onEnable/
 *                 onDisable/onUpdate/onUninstall, detect duplicate
 *                 plugin/page/widget/command IDs, validate declared
 *                 dependencies exist, and expose getPlugin()/
 *                 getPlugins()/isPluginEnabled()/getPluginVersion().
 * Public API:     RaxPlugins.registerManifest(manifest, hooks?) -> boolean
 *                 RaxPlugins.enablePlugin(id) -> boolean
 *                 RaxPlugins.disablePlugin(id) -> boolean
 *                 RaxPlugins.uninstallPlugin(id) -> boolean
 *                 RaxPlugins.getPlugin(id) -> PluginRecord | null
 *                 RaxPlugins.getPlugins() -> PluginRecord[]
 *                 RaxPlugins.isPluginEnabled(id) -> boolean
 *                 RaxPlugins.getPluginVersion(id) -> string | null
 *                 RaxPlugins.validateAll() -> void (called automatically
 *                     by RaxPluginLoader.loadAll(), see plugin-loader.js)
 *                 RaxPlugins.getValidationErrors() -> string[]
 *                 RaxPlugins.getValidationWarnings() -> string[]
 * Dependencies:   events.js, registry.js (listens to 'registry:change'
 *                 to attribute page/widget/command IDs to the plugin
 *                 that registered them), RaxCore.VERSION (for
 *                 minimumRaxVersion checks). Soft dependencies (used
 *                 if present, never required): RaxAPI (for
 *                 apiVersion compatibility checks, folded into this
 *                 module's own validation log — see
 *                 docs/versioning.md) and RaxDevMode (lifecycle hook
 *                 timing, zero cost when disabled or absent).
 * Extension:      This IS the plugin platform layer — see
 *                 docs/plugin-manifest.md (the manifest schema) and
 *                 docs/plugin-api.md (lifecycle + dependency
 *                 resolution + metadata API reference).
 * ------------------------------------------------------------------
 * WHAT THIS MODULE DELIBERATELY DOES NOT DO (see the task this was
 * built against): no UI for installing/managing plugins, no
 * installer, no package downloads, no networking of any kind. All
 * validation is report-only — nothing here ever blocks a plugin
 * script from having already executed (by the time registerManifest()
 * is called, the plugin's own script already ran) or prevents a
 * page from booting. Dependencies are checked for presence, never
 * fetched or installed.
 * ------------------------------------------------------------------
 * WHY manifest.json ALONE ISN'T READ AT RUNTIME: RAX Theme
 * deliberately never calls fetch()/XHR anywhere (see README's Browser
 * Support section) specifically so every page keeps working when
 * opened directly via file://, where fetching a local JSON file is
 * blocked by the browser in many configurations. manifest.json is
 * still the canonical, documented, tooling-readable manifest file for
 * a plugin — humans and any future build/registry tooling should read
 * it directly — but at runtime, a plugin's own index.js passes the
 * identical data to registerManifest() as a plain JS object. This is
 * stated plainly here rather than silently diverging from what
 * "manifest.json" implies.
 * ------------------------------------------------------------------
 * LIFECYCLE SEMANTICS (framework-only, no package manager exists):
 *   onInstall(manifest)              — fires the first time this
 *     plugin's id has ever been seen in this browser (tracked via
 *     localStorage). There is no real "install" step — this is the
 *     closest framework-only equivalent.
 *   onUpdate(manifest, {from, to})   — fires when the persisted
 *     version for this id differs from the version just registered.
 *   onEnable(manifest)               — fires every time the plugin
 *     loads and registers while enabled (default enabled). Unlike
 *     onInstall/onUpdate this is NOT a one-time transition — there is
 *     no persistent "session" in a buildless static app beyond a
 *     single page load, so "enabled" is re-affirmed on every load.
 *   onDisable(manifest)              — fires only when
 *     RaxPlugins.disablePlugin(id) is called explicitly. Nothing
 *     calls this automatically.
 *   onUninstall(manifest)            — fires only when
 *     RaxPlugins.uninstallPlugin(id) is called explicitly. Clears the
 *     persisted install/version record so a future registerManifest()
 *     call is treated as a fresh install. Does NOT remove any files
 *     or stop the plugin's script from being loaded again if it's
 *     still declared in RAX_PLUGINS — there is no package manager to
 *     do that.
 */
(function (global) {
  'use strict';

  var INSTALLED_KEY = 'rax-plugins-installed'; // id -> version
  var ENABLED_KEY = 'rax-plugins-enabled'; // id -> boolean (absent = enabled)

  var manifests = Object.create(null); // id -> manifest
  var hookRegistry = Object.create(null); // id -> hooks object
  var idOwnership = { page: {}, widget: {}, command: {} }; // type -> (regId -> pluginId | '(built-in)')
  var currentPluginId = null;
  var validationLog = []; // { level: 'error'|'warning', message }

  var ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

  function readMap(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || {};
    } catch (e) {
      return {};
    }
  }
  function writeMap(key, map) {
    try {
      localStorage.setItem(key, JSON.stringify(map));
    } catch (e) {
      /* storage unavailable — lifecycle transitions just won't persist
         across reloads; onInstall/onUpdate would re-fire, which is a
         safe direction to fail in. */
    }
  }

  function log(level, message) {
    validationLog.push({ level: level, message: message });
    var prefix = '[RaxPlugins]';
    if (level === 'error') console.error(prefix, message);
    else console.warn(prefix, message);
  }

  function emit(name, payload) {
    global.RaxEvents && global.RaxEvents.emit(name, payload);
  }

  // ---- Minimal semver-lite: supports exact "1.2.3", ">=1.2.3", and
  // "^1.2.3" (same major, >= minor.patch). Not full semver range syntax —
  // documented as a stated limitation in docs/plugin-manifest.md.
  function parseVersion(v) {
    var m = /^(\d+)\.(\d+)\.(\d+)/.exec(String(v || '').trim());
    if (!m) return null;
    return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
  }
  function compareVersions(a, b) {
    for (var i = 0; i < 3; i++) {
      if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
    }
    return 0;
  }
  function satisfies(actualVersion, constraint) {
    if (!constraint) return true;
    var op = '=';
    var raw = constraint;
    if (constraint.indexOf('>=') === 0) { op = '>='; raw = constraint.slice(2); }
    else if (constraint.indexOf('^') === 0) { op = '^'; raw = constraint.slice(1); }
    var actual = parseVersion(actualVersion);
    var wanted = parseVersion(raw);
    if (!actual || !wanted) return true; // can't parse — don't block on it, just skip the check
    if (op === '=') return compareVersions(actual, wanted) === 0;
    if (op === '>=') return compareVersions(actual, wanted) >= 0;
    if (op === '^') return actual[0] === wanted[0] && compareVersions(actual, wanted) >= 0;
    return true;
  }

  function normalizeDependency(dep) {
    if (typeof dep === 'string') return { id: dep, version: null };
    if (dep && typeof dep === 'object' && dep.id) return { id: dep.id, version: dep.version || null };
    return null;
  }

  // ---- Manifest schema validation ------------------------------------
  function validateManifestSchema(manifest) {
    var errors = [];
    if (!manifest || typeof manifest !== 'object') {
      return ['manifest must be an object'];
    }
    if (!manifest.id || typeof manifest.id !== 'string') {
      errors.push('"id" is required and must be a string');
    } else if (!ID_PATTERN.test(manifest.id)) {
      errors.push('"id" must be lowercase kebab-case (e.g. "hello-plugin"), got "' + manifest.id + '"');
    }
    if (!manifest.name || typeof manifest.name !== 'string') {
      errors.push('"name" is required and must be a string');
    }
    if (!manifest.version || typeof manifest.version !== 'string' || !parseVersion(manifest.version)) {
      errors.push('"version" is required and must be a semver-like string (e.g. "1.0.0")');
    }
    if (manifest.minimumRaxVersion != null && !parseVersion(manifest.minimumRaxVersion)) {
      errors.push('"minimumRaxVersion" must be a semver-like string if present');
    }
    if (manifest.keywords != null && !Array.isArray(manifest.keywords)) {
      errors.push('"keywords" must be an array of strings if present');
    }
    if (manifest.permissions != null && !Array.isArray(manifest.permissions)) {
      errors.push('"permissions" must be an array of permission id strings if present');
    }
    ['dependencies', 'optionalDependencies'].forEach(function (field) {
      if (manifest[field] == null) return;
      if (!Array.isArray(manifest[field])) {
        errors.push('"' + field + '" must be an array if present');
        return;
      }
      manifest[field].forEach(function (dep, i) {
        if (!normalizeDependency(dep)) {
          errors.push('"' + field + '[' + i + ']" must be a plugin id string or { id, version? }');
        }
      });
    });
    return errors;
  }

  function describeOwner(owner) {
    return owner === '(built-in)' ? 'a built-in RAX Theme page' : 'plugin "' + owner + '"';
  }

  // Attribute page/widget/command registrations to whichever plugin is
  // currently registering (or '(built-in)' if none) — this is what makes
  // cross-plugin AND plugin-vs-built-in duplicate ID detection possible
  // without registry.js needing to know plugins exist at all.
  global.RaxEvents && global.RaxEvents.on('registry:change', function (evt) {
    if (['page', 'widget', 'command'].indexOf(evt.type) === -1) return;
    var newOwner = currentPluginId || '(built-in)';
    var existingOwner = idOwnership[evt.type][evt.id];
    if (existingOwner && existingOwner !== newOwner) {
      log('error', 'Duplicate ' + evt.type + ' id "' + evt.id + '" — already registered by ' +
        describeOwner(existingOwner) + ', now also registered by ' + describeOwner(newOwner) + '.');
    }
    idOwnership[evt.type][evt.id] = newOwner;
  });

  function devModeOn() {
    return !!(global.RaxDevMode && global.RaxDevMode.isEnabled());
  }

  /** Calls hooks[hookName](...) if defined, timing it via RaxDevMode when
   * dev mode is enabled. Checks devModeOn() before touching Date.now() at
   * all, so a disabled page pays zero cost for this wrapper. */
  function runHook(id, hookName, hooks, args) {
    if (!hooks || typeof hooks[hookName] !== 'function') return;
    if (!devModeOn()) {
      hooks[hookName].apply(null, args);
      return;
    }
    var start = Date.now();
    hooks[hookName].apply(null, args);
    global.RaxDevMode.recordLifecycleTiming(id, hookName, Date.now() - start);
  }

  function registerManifest(manifest, hooks) {
    var schemaErrors = validateManifestSchema(manifest);
    if (schemaErrors.length) {
      schemaErrors.forEach(function (e) { log('error', 'Invalid manifest: ' + e); });
      return false;
    }

    var id = manifest.id;

    if (manifests[id]) {
      log('error', 'Duplicate plugin id "' + id + '" — a manifest with this id is already registered. The most recent registration wins, but this should be fixed.');
    }

    if (manifest.minimumRaxVersion && global.RaxCore && global.RaxCore.VERSION) {
      if (!satisfies(global.RaxCore.VERSION, '>=' + manifest.minimumRaxVersion)) {
        log('error', 'Plugin "' + id + '" requires RAX Theme >= ' + manifest.minimumRaxVersion +
          ', but this is running ' + global.RaxCore.VERSION + '. The plugin will still load — this is a compatibility warning, not an enforced block.');
      }
    }

    // API-version compatibility check (see docs/versioning.md) — soft
    // dependency on RaxAPI, same pattern as the RaxCore.VERSION check
    // above. Issues are folded into this module's own validation log so
    // getValidationErrors()/getValidationWarnings() stay the one place a
    // developer checks, rather than fragmenting across two query APIs.
    if (global.RaxAPI) {
      var compat = global.RaxAPI.checkPluginCompatibility(manifest);
      compat.issues.forEach(function (issue) {
        if (issue.level === 'error') log('error', issue.message);
        else if (issue.level === 'warning') log('warning', issue.message);
        // 'info' level issues (e.g. "no apiVersion declared") are not
        // logged as errors/warnings — see docs/versioning.md for why an
        // undeclared apiVersion is treated as informational, not a problem.
      });
    }

    manifests[id] = manifest;
    hookRegistry[id] = hooks || {};
    currentPluginId = id;

    var installed = readMap(INSTALLED_KEY);
    var enabledMap = readMap(ENABLED_KEY);
    var wasInstalled = Object.prototype.hasOwnProperty.call(installed, id);
    var isEnabled = enabledMap[id] !== false;

    if (!wasInstalled) {
      runHook(id, 'onInstall', hooks, [manifest]);
      installed[id] = manifest.version;
      writeMap(INSTALLED_KEY, installed);
      emit('plugin:installed', { id: id, manifest: manifest });
    } else if (installed[id] !== manifest.version) {
      var from = installed[id];
      runHook(id, 'onUpdate', hooks, [manifest, { from: from, to: manifest.version }]);
      installed[id] = manifest.version;
      writeMap(INSTALLED_KEY, installed);
      emit('plugin:updated', { id: id, manifest: manifest, from: from, to: manifest.version });
    }

    if (isEnabled) {
      runHook(id, 'onEnable', hooks, [manifest]);
      emit('plugin:enabled', { id: id, manifest: manifest });
    }

    return true;
  }

  function disablePlugin(id) {
    if (!manifests[id]) {
      log('warning', 'disablePlugin("' + id + '") called, but no plugin with that id is registered.');
      return false;
    }
    var enabledMap = readMap(ENABLED_KEY);
    enabledMap[id] = false;
    writeMap(ENABLED_KEY, enabledMap);
    var hooks = hookRegistry[id] || {};
    runHook(id, 'onDisable', hooks, [manifests[id]]);
    emit('plugin:disabled', { id: id, manifest: manifests[id] });
    return true;
  }

  function enablePlugin(id) {
    if (!manifests[id]) {
      log('warning', 'enablePlugin("' + id + '") called, but no plugin with that id is registered.');
      return false;
    }
    var enabledMap = readMap(ENABLED_KEY);
    enabledMap[id] = true;
    writeMap(ENABLED_KEY, enabledMap);
    var hooks = hookRegistry[id] || {};
    runHook(id, 'onEnable', hooks, [manifests[id]]);
    emit('plugin:enabled', { id: id, manifest: manifests[id] });
    return true;
  }

  function uninstallPlugin(id) {
    if (!manifests[id]) {
      log('warning', 'uninstallPlugin("' + id + '") called, but no plugin with that id is registered.');
      return false;
    }
    var manifest = manifests[id];
    var hooks = hookRegistry[id] || {};
    runHook(id, 'onUninstall', hooks, [manifest]);

    var installed = readMap(INSTALLED_KEY);
    delete installed[id];
    writeMap(INSTALLED_KEY, installed);

    delete manifests[id];
    delete hookRegistry[id];

    emit('plugin:uninstalled', { id: id, manifest: manifest });
    return true;
    // Note: this does not stop the plugin's script from running again on
    // the next page load if it's still declared in RAX_PLUGINS — there is
    // no package manager to remove it. It only resets tracked state so
    // the next load is treated as a fresh install.
  }

  function toRecord(id) {
    var manifest = manifests[id];
    if (!manifest) return null;
    var enabledMap = readMap(ENABLED_KEY);
    var installed = readMap(INSTALLED_KEY);
    return Object.assign({}, manifest, {
      enabled: enabledMap[id] !== false,
      installedVersion: installed[id] || null,
    });
  }

  function getPlugin(id) {
    return toRecord(id);
  }

  function getPlugins() {
    return Object.keys(manifests).map(toRecord);
  }

  function isPluginEnabled(id) {
    if (!manifests[id]) return false;
    var enabledMap = readMap(ENABLED_KEY);
    return enabledMap[id] !== false;
  }

  function getPluginVersion(id) {
    return manifests[id] ? manifests[id].version : null;
  }

  // ---- Dependency validation — report only, never installs anything ---
  function validateDependencies() {
    Object.keys(manifests).forEach(function (id) {
      var manifest = manifests[id];
      (manifest.dependencies || []).forEach(function (dep) {
        var d = normalizeDependency(dep);
        if (!d) return;
        var target = manifests[d.id];
        if (!target) {
          log('error', 'Plugin "' + id + '" depends on "' + d.id + '", which is not registered. ' +
            'RAX Theme does not install dependencies automatically — make sure "' + d.id + '" is ' +
            'loaded (declared earlier in RAX_PLUGINS) before "' + id + '".');
        } else if (d.version && !satisfies(target.version, d.version)) {
          log('error', 'Plugin "' + id + '" requires "' + d.id + '" ' + d.version +
            ', but the registered version is ' + target.version + '.');
        }
      });
      (manifest.optionalDependencies || []).forEach(function (dep) {
        var d = normalizeDependency(dep);
        if (!d) return;
        var target = manifests[d.id];
        if (!target) {
          log('warning', 'Plugin "' + id + '" has an optional dependency on "' + d.id + '", which is not registered. This is not an error — the optional integration will simply be unavailable.');
        } else if (d.version && !satisfies(target.version, d.version)) {
          log('warning', 'Plugin "' + id + '" optionally wants "' + d.id + '" ' + d.version +
            ', but the registered version is ' + target.version + '.');
        }
      });
    });
  }

  function validateAll() {
    validateDependencies();
  }

  function getValidationErrors() {
    return validationLog.filter(function (e) { return e.level === 'error'; }).map(function (e) { return e.message; });
  }
  function getValidationWarnings() {
    return validationLog.filter(function (e) { return e.level === 'warning'; }).map(function (e) { return e.message; });
  }

  global.RaxPlugins = {
    registerManifest: registerManifest,
    enablePlugin: enablePlugin,
    disablePlugin: disablePlugin,
    uninstallPlugin: uninstallPlugin,
    getPlugin: getPlugin,
    getPlugins: getPlugins,
    isPluginEnabled: isPluginEnabled,
    getPluginVersion: getPluginVersion,
    validateAll: validateAll,
    getValidationErrors: getValidationErrors,
    getValidationWarnings: getValidationWarnings,
  };
})(window);
