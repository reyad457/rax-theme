/**
 * pages/suricata.js — Suricata IDS/IPS page module
 * ------------------------------------------------------------------
 * Purpose:        Owns suricata.html's data + component wiring. All
 *                 Chart.js access goes through RaxCharts (Phase C
 *                 objective 7).
 * Responsibility: Register with RaxRegistry; render 3 of the 4
 *                 summary cards via RaxComponents.Card (Phase D);
 *                 enable sortable on the alerts table via
 *                 RaxComponents.Table; register a real search
 *                 provider over the alerts table's own existing rows;
 *                 initialize the category chart.
 * Dependencies:   RaxRegistry, RaxCharts, RaxUtils, RaxSearch,
 *                 RaxComponents.Card, RaxComponents.Table
 * ------------------------------------------------------------------
 * The "Engine Mode" card is intentionally NOT converted to
 * RaxComponents.Card — its header contains a live toggle switch
 * instead of a status pill, which Card's generic contract
 * (title/value/label/status) doesn't model. Growing Card to support
 * arbitrary header content would make it less generic for every other
 * page that uses it correctly as a plain StatCard (Phase D objective
 * 5). It stays hand-authored HTML, same as Phase C.
 */
(function (global) {
  'use strict';
  var qsa = global.RaxUtils.qsa;

  var SUMMARY_CARDS = [
    { id: 'card-signatures', title: 'Signatures Loaded', value: '1,204', label: 'ET Open + custom local.rules' },
    { id: 'card-alerts-today', title: 'Alerts Today', value: '27', label: 'across all monitored interfaces', status: { type: 'warn', label: '3 unresolved' }, glow: 'green' },
    { id: 'card-blocked-week', title: 'Blocked This Week', value: '312', label: 'unique source IPs dropped' },
  ];

  function renderSummaryCards() {
    SUMMARY_CARDS.forEach(function (card) {
      var el = document.getElementById(card.id);
      if (el) global.RaxComponents.Card.mount(el, card);
    });
  }

  function initTable() {
    var el = document.getElementById('alertsTable');
    if (el) global.RaxComponents.Table.mount(el, { sortable: true });
  }

  function initCharts() {
    var el = document.getElementById('categoryChart');
    if (!el) return;
    global.RaxCharts.create(el, {
      type: 'bar',
      data: {
        labels: ['Malware', 'Recon', 'Policy', 'Anonymization', 'Local rules', 'Info'],
        datasets: [{
          data: [6, 41, 22, 12, 9, 15],
          backgroundColor: ['#FF3B5C', '#FFC857', '#00D9FF', '#FFC857', '#00FF9D', '#5A6577'],
          borderRadius: 6, maxBarThickness: 26,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10.5 } } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { font: { size: 10 } } },
        },
      },
    });
  }

  /** Searches the alerts table's own existing rows — no fabricated
   * data (Phase D objective 4). */
  function initSearch() {
    global.RaxSearch.registerProvider('suricata', function (term) {
      var rows = qsa('#alertsTable tbody tr');
      var lower = term.toLowerCase();
      var matches = [];
      rows.forEach(function (row) {
        var isMatch = term.length === 0 || row.textContent.toLowerCase().indexOf(lower) !== -1;
        row.hidden = !isMatch;
        if (isMatch) matches.push(row);
      });
      return matches;
    });
  }

  function init() {
    renderSummaryCards();
    initTable();
    initCharts();
    initSearch();
  }

  function destroy() {}

  global.RaxRegistry.registerPage({ id: 'suricata', title: 'Suricata IDS/IPS', init: init, destroy: destroy });
})(window);
