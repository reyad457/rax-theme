/**
 * theme.js — RaxTheme
 * ------------------------------------------------------------------
 * Purpose:        Accent + dark/light mode manager. The ONLY module
 *                 permitted to write data-mode / data-accent
 *                 attributes on <html> (Phase B §3.6, §9). Contains
 *                 zero hardcoded color values itself — theme.css owns
 *                 every built-in color; registered custom themes carry
 *                 their own.
 * Responsibility: Persist + apply the user's mode/accent choice;
 *                 notify the rest of the app when it changes; hold
 *                 the registry of plugin-defined named themes.
 * Public API:     RaxTheme.getMode() / setMode('dark'|'light') / toggleMode()
 *                 RaxTheme.getAccent() / setAccent(name)
 *                 RaxTheme.setCustomAccent(hexColor)  — one-off, unnamed
 *                 RaxTheme.registerTheme(name, def)   — named, reusable (Phase E)
 *                 RaxTheme.getRegisteredThemes()
 * Dependencies:   events.js (emits 'theme:change'), utils.js (hexToRgba)
 * Extension:      A 6th *built-in* named accent is a pure CSS addition
 *                 in theme.css. A *plugin*-provided theme uses
 *                 registerTheme() instead — see docs/theming.md for
 *                 the difference and the lifecycle requirement below.
 * ------------------------------------------------------------------
 * LIFECYCLE REQUIREMENT for registerTheme(): the theme must be
 * registered BEFORE RaxCore.boot() calls RaxTheme.init() — i.e. from
 * a plugin script loaded via RaxPluginLoader before boot(), never
 * from a page module's init() (which runs AFTER RaxTheme.init() has
 * already applied whatever was persisted). If a person has a
 * registered-theme name persisted from a previous visit but the
 * plugin that registered it isn't loaded this time, apply() falls
 * back to the built-in 'cyan' accent rather than rendering unstyled.
 * ------------------------------------------------------------------
 * NOTE ON FLASH-OF-WRONG-THEME: applying the persisted preference
 * happens as early as possible via the inline snippet in each page's
 * <head> (see any page's <head> — a ~6 line inline script sets
 * data-mode/data-accent from storage before first paint). That
 * snippet can only apply BUILT-IN accents (it runs before any JS
 * module, including plugin themes, has loaded) — a persisted
 * plugin-theme choice is corrected to its real colors once init()
 * runs later in the same frame, same as any other custom accent.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'rax-theme';
  var DEFAULT_MODE = 'dark';
  var DEFAULT_ACCENT = 'cyan';
  var BUILTIN_ACCENTS = ['cyan', 'emerald', 'purple', 'red', 'orange'];

  var registeredThemes = Object.create(null); // name -> { accent, accentGlow?, chartSeries? }

  function readStored() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function writeStored(prefs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      /* storage unavailable (private browsing, quota) — theme still
         works for the current page load, just doesn't persist. */
    }
  }

  var state = Object.assign({ mode: DEFAULT_MODE, accent: DEFAULT_ACCENT }, readStored());

  function clearInlineAccentOverrides() {
    document.documentElement.style.removeProperty('--accent');
    document.documentElement.style.removeProperty('--accent-glow');
    for (var i = 1; i <= 4; i++) document.documentElement.style.removeProperty('--chart-series-' + i);
  }

  function applyRegisteredTheme(name) {
    var def = registeredThemes[name];
    document.documentElement.setAttribute('data-accent', 'custom');
    document.documentElement.style.setProperty('--accent', def.accent);
    document.documentElement.style.setProperty('--accent-glow', def.accentGlow || global.RaxUtils.hexToRgba(def.accent, 0.35));
    if (def.chartSeries) {
      def.chartSeries.forEach(function (color, i) {
        document.documentElement.style.setProperty('--chart-series-' + (i + 1), color);
      });
    }
  }

  function apply() {
    document.documentElement.setAttribute('data-mode', state.mode);

    if (registeredThemes[state.accent]) {
      applyRegisteredTheme(state.accent);
      return;
    }
    if (BUILTIN_ACCENTS.indexOf(state.accent) === -1 && state.accent !== 'custom') {
      // Persisted accent isn't built-in and isn't (yet) registered by a
      // plugin this session — fail safe to the default rather than
      // rendering with an unresolved [data-accent] block (Phase E fix).
      console.warn('[RaxTheme] Unknown accent "' + state.accent + '" — falling back to "' + DEFAULT_ACCENT + '". If this is a plugin theme, make sure the plugin is loaded before RaxCore.boot().');
      state.accent = DEFAULT_ACCENT;
    }
    clearInlineAccentOverrides();
    document.documentElement.setAttribute('data-accent', state.accent);
  }

  function emitChange() {
    global.RaxEvents && global.RaxEvents.emit('theme:change', { mode: state.mode, accent: state.accent });
  }

  function init() {
    apply();
  }

  function getMode() { return state.mode; }
  function setMode(mode) {
    state.mode = mode === 'light' ? 'light' : 'dark';
    apply();
    writeStored(state);
    emitChange();
  }
  function toggleMode() { setMode(state.mode === 'dark' ? 'light' : 'dark'); }

  function getAccent() { return state.accent; }
  function setAccent(accent) {
    state.accent = accent;
    apply();
    writeStored(state);
    emitChange();
  }

  /** One-off custom accent, not persisted under a reusable name — the
   * hex color itself is what gets stored. See registerTheme() for the
   * named/reusable alternative. */
  function setCustomAccent(hex) {
    state.accent = 'custom';
    document.documentElement.setAttribute('data-accent', 'custom');
    document.documentElement.style.setProperty('--accent', hex);
    document.documentElement.style.setProperty('--accent-glow', global.RaxUtils.hexToRgba(hex, 0.35));
    writeStored(state);
    emitChange();
  }

  /** Extension API (Phase E): register a named, reusable theme a
   * plugin can offer alongside the 5 built-in accents.
   * def: { accent: '#RRGGBB', accentGlow?: 'rgba(...)',
   *        chartSeries?: [4 hex colors] } */
  function registerTheme(name, def) {
    if (!name || !def || !def.accent) {
      console.error('[RaxTheme] registerTheme requires a name and a { accent } definition.');
      return;
    }
    if (BUILTIN_ACCENTS.indexOf(name) !== -1) {
      console.error('[RaxTheme] "' + name + '" is a built-in accent name and cannot be overridden by registerTheme().');
      return;
    }
    registeredThemes[name] = def;
    // If this is exactly the theme the person already had persisted
    // (registered late, or on a slower-loading plugin), correct the
    // render now instead of waiting for the next setAccent() call.
    if (state.accent === name) apply();
  }

  function getRegisteredThemes() {
    return Object.keys(registeredThemes);
  }

  global.RaxTheme = {
    init: init,
    getMode: getMode, setMode: setMode, toggleMode: toggleMode,
    getAccent: getAccent, setAccent: setAccent, setCustomAccent: setCustomAccent,
    registerTheme: registerTheme, getRegisteredThemes: getRegisteredThemes,
  };
})(window);
