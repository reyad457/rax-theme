/**
 * utils.js — RaxUtils
 * ------------------------------------------------------------------
 * Purpose:        Small pure helpers used by multiple modules, so
 *                 formatting/DOM logic isn't duplicated per-component
 *                 (the Phase A failure mode, just for JS).
 * Responsibility: Stateless utility functions only. No DOM
 *                 side-effects beyond the explicit dom()/qs()/qsa()
 *                 helpers, no framework state.
 * Public API:     RaxUtils.qs, RaxUtils.qsa, RaxUtils.dom,
 *                 RaxUtils.debounce, RaxUtils.formatNumber,
 *                 RaxUtils.formatBytes, RaxUtils.readCssVar
 * Dependencies:   none
 */
(function (global) {
  'use strict';

  function qs(selector, root) { return (root || document).querySelector(selector); }
  function qsa(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }

  /** Minimal hyperscript-style element builder — avoids innerHTML string
   *  concatenation scattered across component files. */
  function dom(tag, props, children) {
    var el = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (key) {
      if (key === 'class') el.className = props[key];
      else if (key === 'dataset') Object.assign(el.dataset, props[key]);
      else if (key.indexOf('on') === 0 && typeof props[key] === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), props[key]);
      } else if (key === 'html') {
        el.innerHTML = props[key];
      } else {
        el.setAttribute(key, props[key]);
      }
    });
    (children || []).forEach(function (child) {
      if (child == null) return;
      el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return el;
  }

  function debounce(fn, wait) {
    var timer = null;
    return function debounced() {
      var args = arguments, ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  function formatNumber(n) {
    return Number(n).toLocaleString('en-US');
  }

  function formatBytes(gb) {
    return gb + ' GB';
  }

  function readCssVar(name, el) {
    return getComputedStyle(el || document.documentElement).getPropertyValue(name).trim();
  }

  /** Shared hex->rgba parser. Used by theme.js (glow colors) and
   * charts.js (translucent chart fills derived from the current
   * accent) so this parsing logic exists exactly once (Phase E). */
  function hexToRgba(hex, alpha) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    var a = alpha != null ? alpha : 1;
    if (!m) return 'rgba(0,217,255,' + a + ')';
    var r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  global.RaxUtils = {
    qs: qs, qsa: qsa, dom: dom, debounce: debounce,
    formatNumber: formatNumber, formatBytes: formatBytes, readCssVar: readCssVar,
    hexToRgba: hexToRgba,
  };
})(window);
