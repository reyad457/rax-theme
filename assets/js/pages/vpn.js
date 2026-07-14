/**
 * pages/vpn.js — VPN & Tailscale page module
 * ------------------------------------------------------------------
 * Purpose:        Owns vpn.html's data + component wiring. All
 *                 Chart.js access goes through RaxCharts (Phase C
 *                 objective 7).
 * Responsibility: Register with RaxRegistry; render the summary strip
 *                 via RaxComponents.Card (Phase D); enable sortable on
 *                 the peers table via RaxComponents.Table; register a
 *                 real search provider over the peers table's own
 *                 existing rows; initialize the throughput chart.
 * Dependencies:   RaxRegistry, RaxCharts, RaxUtils, RaxSearch,
 *                 RaxComponents.Card, RaxComponents.Table
 */
(function (global) {
  'use strict';
  var qsa = global.RaxUtils.qsa;

  var SUMMARY_CARDS = [
    { id: 'card-tailnet', title: 'Tailnet Status', value: 'chittagong-lab', label: 'tailnet · MagicDNS enabled', status: { type: 'ok', label: 'Connected' }, glow: 'green' },
    { id: 'card-exit', title: 'Exit Node', value: 'opnsense-gw', label: 'advertising 4 subnet routes', status: { type: 'ok', label: 'Active' }, glow: 'cyan' },
    { id: 'card-peers', title: 'Active Peers', value: '6', label: 'devices authorized on tailnet', status: { type: 'info', label: '4 online', dot: false } },
    { id: 'card-keyexpiry', title: 'Key Expiry', value: '18', valueSuffix: ' days', label: 'node key expires · rotate before Jul 30', status: { type: 'warn', label: 'Renew soon' } },
  ];

  function renderSummaryCards() {
    SUMMARY_CARDS.forEach(function (card) {
      var el = document.getElementById(card.id);
      if (el) global.RaxComponents.Card.mount(el, card);
    });
  }

  function initTable() {
    var el = document.getElementById('peersTable');
    if (el) global.RaxComponents.Table.mount(el, { sortable: true });
  }

  function initCharts() {
    var el = document.getElementById('vpnChart');
    if (!el) return;
    global.RaxCharts.create(el, {
      type: 'line',
      data: {
        labels: Array.from({ length: 20 }, function (_, i) { return i * 3 + 'm'; }),
        datasets: [{
          label: 'Throughput',
          data: [2, 3, 2.5, 4, 6, 8, 7, 9, 11, 10, 8, 7, 9, 12, 14, 13, 10, 8, 6, 5],
          borderColor: '#00D9FF', backgroundColor: 'rgba(0,217,255,0.12)',
          fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { maxTicksLimit: 6, font: { size: 10 } } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { callback: function (v) { return v + ' Mb'; }, font: { size: 10 } } },
        },
      },
    }, { seriesVars: ['--chart-series-1'], fillAlpha: 0.12 });
  }

  /** Searches the peers table's own existing rows — no fabricated
   * data (Phase D objective 4). */
  function initSearch() {
    global.RaxSearch.registerProvider('vpn', function (term) {
      var rows = qsa('#peersTable tbody tr');
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

  global.RaxRegistry.registerPage({ id: 'vpn', title: 'VPN & Tailscale', init: init, destroy: destroy });
})(window);
