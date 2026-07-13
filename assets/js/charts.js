/**
 * charts.js — RaxCharts
 * ------------------------------------------------------------------
 * Purpose:        The ONLY module permitted to talk to Chart.js
 *                 (Phase C objective 7). Fixes the Phase A finding of
 *                 Chart.defaults being configured 3× separately —
 *                 configured exactly once here.
 * Responsibility: Global Chart.js defaults, chart factory, lazy
 *                 instantiation via IntersectionObserver, live
 *                 re-color on 'theme:change'.
 * Public API:     RaxCharts.create(canvasEl, config) -> lazily creates
 *                     a Chart.js instance once canvasEl scrolls near
 *                     the viewport; returns a handle with .destroy()
 *                 RaxCharts.destroy(handle)
 * Dependencies:   Chart.js (global `Chart`, loaded only on pages that
 *                     need it — pages without charts must not include
 *                     this script's Chart.js dependency), RaxEvents,
 *                     RaxUtils
 * Extension:      Page modules never call `new Chart(...)` — they call
 *                 RaxCharts.create(). Swapping charting libraries later
 *                 is a one-file change confined to this module.
 */
(function (global) {
  'use strict';

  var defaultsConfigured = false;
  var liveInstances = []; // { chart, canvas, config } — for theme.js re-color

  function configureDefaults() {
    if (defaultsConfigured || !global.Chart) return;
    global.Chart.defaults.font.family = "'JetBrains Mono', monospace";
    global.Chart.defaults.color = global.RaxUtils.readCssVar('--gray-500') || '#5A6577';
    defaultsConfigured = true;
  }

  function instantiate(canvas, config) {
    configureDefaults();
    if (!global.Chart) {
      console.warn('[RaxCharts] Chart.js is not loaded on this page; skipping chart "' + canvas.id + '".');
      return null;
    }
    var chart = new global.Chart(canvas, config);
    liveInstances.push({ chart: chart, canvas: canvas, config: config });
    return chart;
  }

  /** Public factory. Returns a handle immediately; the underlying
   * Chart.js instance is created lazily once the canvas is within
   * 200px of the viewport (Phase B §7 performance strategy). */
  function create(canvas, config) {
    var handle = { chart: null, canvas: canvas };

    if (!('IntersectionObserver' in global)) {
      handle.chart = instantiate(canvas, config);
      return handle;
    }

    canvas.closest('.chart-mount') && (canvas.closest('.chart-mount').dataset.loading = 'true');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        handle.chart = instantiate(canvas, config);
        var mount = canvas.closest('.chart-mount');
        if (mount) mount.dataset.loading = 'false';
        observer.disconnect();
      });
    }, { rootMargin: '200px' });
    observer.observe(canvas);

    handle.destroy = function () {
      observer.disconnect();
      destroy(handle);
    };
    return handle;
  }

  function destroy(handle) {
    if (!handle || !handle.chart) return;
    handle.chart.destroy();
    liveInstances = liveInstances.filter(function (i) { return i.chart !== handle.chart; });
    handle.chart = null;
  }

  // Re-color every live chart when the accent/mode changes, instead of
  // requiring a page reload (Phase B §4.8).
  global.RaxEvents.on('theme:change', function () {
    if (!global.Chart) return;
    global.Chart.defaults.color = global.RaxUtils.readCssVar('--gray-500') || '#5A6577';
    liveInstances.forEach(function (i) { i.chart.update(); });
  });

  global.RaxCharts = { create: create, destroy: destroy };
})(window);
