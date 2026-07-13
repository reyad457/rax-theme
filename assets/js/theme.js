/**
 * theme.js — RaxTheme
 * ------------------------------------------------------------------
 * Purpose:        Accent + dark/light mode manager. The ONLY module
 *                 permitted to write data-mode / data-accent
 *                 attributes on <html> (Phase B §3.6, §9). Contains
 *                 zero color values itself — theme.css owns every
 *                 color.
 * Responsibility: Persist + apply the user's mode/accent choice;
 *                 notify the rest of the app when it changes.
 * Public API:     RaxTheme.getMode() / setMode('dark'|'light') / toggleMode()
 *                 RaxTheme.getAccent() / setAccent('cyan'|'emerald'|
 *                     'purple'|'red'|'orange')
 *                 RaxTheme.setCustomAccent(hexColor)
 * Dependencies:   events.js (emits 'theme:change')
 * Extension:      A 6th named accent is a pure CSS addition in
 *                 theme.css — this module doesn't need to change to
 *                 support it, callers just pass the new name string.
 * ------------------------------------------------------------------
 * NOTE ON FLASH-OF-WRONG-THEME: applying the persisted preference
 * happens as early as possible via the inline snippet in each page's
 * <head> (see any page's <head> — a ~6 line inline script sets
 * data-mode/data-accent from storage before first paint). This
 * module's init() re-applies the same values once loaded so both
 * paths stay in sync — the inline snippet avoids flash, this module
 * is what code should call for reads/writes after boot.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'rax-theme';
  var DEFAULT_MODE = 'dark';
  var DEFAULT_ACCENT = 'cyan';

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

  function apply() {
    document.documentElement.setAttribute('data-mode', state.mode);
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
    document.documentElement.style.removeProperty('--accent');
    document.documentElement.style.removeProperty('--accent-glow');
    apply();
    writeStored(state);
    emitChange();
  }

  function setCustomAccent(hex) {
    state.accent = 'custom';
    document.documentElement.setAttribute('data-accent', 'custom');
    document.documentElement.style.setProperty('--accent', hex);
    document.documentElement.style.setProperty('--accent-glow', hexToGlow(hex));
    writeStored(state);
    emitChange();
  }

  function hexToGlow(hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return 'rgba(0,217,255,0.35)';
    var r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',0.35)';
  }

  global.RaxTheme = {
    init: init,
    getMode: getMode, setMode: setMode, toggleMode: toggleMode,
    getAccent: getAccent, setAccent: setAccent, setCustomAccent: setCustomAccent,
  };
})(window);
