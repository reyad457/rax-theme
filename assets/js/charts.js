/**
 * charts.js — RaxCharts
 * ------------------------------------------------------------------
 * Purpose:        The ONLY module permitted to talk to Chart.js
 *                 (Phase C objective 7). Fixes the Phase A finding of
 *                 Chart.defaults being configured 3× separately —
 *                 configured exactly once here.
 * Responsibility: Global Chart.js defaults, chart factory, lazy
 *                 instantiation via IntersectionObserver, live
 *                 re-color of BOTH axis text AND dataset colors on
 *                 'theme:change' (Phase E fix — see note below).
 * Public API:     RaxCharts.create(canvasEl, config, meta) -> lazily
 *                     creates a Chart.js instance once canvasEl
 *                     scrolls near the viewport; returns a handle
 *                     with .destroy()
 *                 RaxCharts.destroy(handle)
 *                 meta (optional): {
 *                   seriesVars: ['--chart-series-1', ...]   one CSS
 *                     var per dataset — resolves borderColor, and (if
 *                     the dataset already has a string backgroundColor,
 *                     signaling a translucent fill) a matching
 *                     hexToRgba() backgroundColor at the same alpha.
 *                   barColorVars: ['--status-danger', ...]  one CSS
 *                     var per bar/slice — resolves
 *                     datasets[0].backgroundColor as an array. Use
 *                     this instead of seriesVars for single-dataset
 *                     bar/doughnut charts where each segment carries
 *                     its own semantic color.
 *                 }
 * Dependencies:   Chart.js (global `Chart`, loaded only on pages that
 *                     need it — pages without charts must not include
 *                     this script's Chart.js dependency), RaxEvents,
 *                     RaxUtils
 * Extension:      Page modules never call `new Chart(...)` — they call
 *                 RaxCharts.create(). Swapping charting libraries later
 *                 is a one-file change confined to this module.
 * ------------------------------------------------------------------
 * PHASE E FIX: verifying the theme engine (Phase E objective 5) found
 * that accent switching previously only re-colored axis tick text —
 * dataset border/fill colors were hardcoded hex literals set once at
 * chart creation, so line/bar colors didn't actually follow the
 * accent. meta.seriesVars/barColorVars let a page module bind dataset
 * colors to the same CSS custom properties every other component
 * already uses, and this module re-resolves them on every
 * 'theme:change' — no chart hardcodes a color it can't update.
 */
(function (global) {
  'use strict';

  var defaultsConfigured = false;
  var liveInstances = []; // { chart, canvas, config, meta }

  function configureDefaults() {
    if (defaultsConfigured || !global.Chart) return;
    global.Chart.defaults.font.family = "'JetBrains Mono', monospace";
    global.Chart.defaults.color = global.RaxUtils.readCssVar('--gray-500') || '#5A6577';
    defaultsConfigured = true;
  }

  /** Resolves meta.seriesVars/barColorVars into actual colors on the
   * given config, in place. Called both at creation time and again on
   * every 'theme:change'. */
  function applyColorBindings(config, meta) {
    if (!meta || !config.data || !config.data.datasets) return;

    if (meta.seriesVars) {
      config.data.datasets.forEach(function (ds, i) {
        var varName = meta.seriesVars[i];
        if (!varName) return;
        var color = global.RaxUtils.readCssVar(varName);
        if (!color) return;
        if ('borderColor' in ds) ds.borderColor = color;
        if (typeof ds.backgroundColor === 'string' && ds.fill) {
          ds.backgroundColor = global.RaxUtils.hexToRgba(color, meta.fillAlpha != null ? meta.fillAlpha : 0.12);
        }
      });
    }

    if (meta.barColorVars && config.data.datasets[0]) {
      config.data.datasets[0].backgroundColor = meta.barColorVars.map(function (varName) {
        return global.RaxUtils.readCssVar(varName) || varName;
      });
    }
  }

  function instantiate(canvas, config, meta) {
    configureDefaults();
    if (!global.Chart) {
      console.warn('[RaxCharts] Chart.js is not loaded on this page; skipping chart "' + canvas.id + '".');
      return null;
    }
    applyColorBindings(config, meta);
    var chart = new global.Chart(canvas, config);
    liveInstances.push({ chart: chart, canvas: canvas, config: config, meta: meta });
    return chart;
  }

  /** Public factory. Returns a handle immediately; the underlying
   * Chart.js instance is created lazily once the canvas is within
   * 200px of the viewport (Phase B §7 performance strategy). */
  function create(canvas, config, meta) {
    var handle = { chart: null, canvas: canvas };

    if (!('IntersectionObserver' in global)) {
      handle.chart = instantiate(canvas, config, meta);
      return handle;
    }

    canvas.closest('.chart-mount') && (canvas.closest('.chart-mount').dataset.loading = 'true');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        handle.chart = instantiate(canvas, config, meta);
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

  // Re-color every live chart when the accent/mode changes — both the
  // shared axis/tick text color AND each chart's own bound dataset
  // colors (Phase E fix, see module docblock).
  global.RaxEvents.on('theme:change', function () {
    if (!global.Chart) return;
    global.Chart.defaults.color = global.RaxUtils.readCssVar('--gray-500') || '#5A6577';
    liveInstances.forEach(function (i) {
      applyColorBindings(i.config, i.meta);
      i.chart.update();
    });
  });

  global.RaxCharts = { create: create, destroy: destroy };
})(window);
