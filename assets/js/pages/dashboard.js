/**
 * pages/dashboard.js — Dashboard page module
 * ------------------------------------------------------------------
 * Purpose:        Owns dashboard.html's data + component wiring. Never
 *                 calls `new Chart(...)` directly (Phase C objective
 *                 7) — all charting goes through RaxCharts.
 * Responsibility: Register with RaxRegistry; render the summary strip
 *                 via RaxComponents.Card and the 4 vitals gauges via
 *                 RaxComponents.Widget (Phase D — exercises components
 *                 that were dormant after Phase C); register the 3
 *                 dashboard charts; enable sortable on Top Clients via
 *                 RaxComponents.Table; register a real search
 *                 provider over Top Clients' existing rows.
 * Dependencies:   RaxRegistry, RaxCharts, RaxUtils, RaxSearch,
 *                 RaxComponents.Card, RaxComponents.Widget,
 *                 RaxComponents.Table
 * ------------------------------------------------------------------
 * All data below (summary values, gauge percentages, table rows) is
 * the exact same mock data dashboard.html hand-authored in Phase 1/C
 * — moved here so the framework's own components render it, not
 * invented new content.
 */
(function (global) {
  'use strict';
  var qsa = global.RaxUtils.qsa;

  var SUMMARY_CARDS = [
    { id: 'card-firewall', title: 'Firewall Status', value: '3,412', label: 'rules active · 0 conflicts', status: { type: 'ok', label: 'Protected' }, glow: 'green' },
    { id: 'card-wan', title: 'Internet / WAN', value: '184', valueSuffix: ' Mbps', label: 'Chittagong Focus Online · 12 ms latency', status: { type: 'ok', label: 'Up · PPPoE' }, glow: 'cyan' },
    { id: 'card-lan', title: 'LAN / VLANs', value: '643', label: 'devices online across all VLANs', status: { type: 'ok', label: '6 segments' } },
    { id: 'card-vpn', title: 'VPN / Tailscale', value: '4', label: 'peers · exit node active', status: { type: 'ok', label: 'Connected' }, glow: 'cyan' },
  ];

  var GAUGES = [
    { id: 'gauge-cpu', label: 'CPU Load', value: 34, unit: '%', ariaLabel: 'CPU load: 34 percent', sublabel1: 'Intel i3 3rd gen', sublabel2: '4 threads · 1.2 GHz avg' },
    { id: 'gauge-mem', label: 'Memory', value: 58, unit: '%', ariaLabel: 'Memory usage: 58 percent', sublabel1: '4.6 / 8 GB used', sublabel2: 'Suricata + CrowdSec resident' },
    { id: 'gauge-disk', label: 'Disk', value: 22, unit: '%', ariaLabel: 'Disk usage: 22 percent', sublabel1: '44 / 200 GB used', sublabel2: 'Log retention: 30 days' },
    { id: 'gauge-temp', label: 'Temperature', value: 47, unit: '°C', ariaLabel: 'CPU temperature: 47 degrees Celsius', sublabel1: 'CPU package', sublabel2: 'Fans nominal' },
  ];

  function renderSummaryCards() {
    SUMMARY_CARDS.forEach(function (card) {
      var el = document.getElementById(card.id);
      if (el) global.RaxComponents.Card.mount(el, card);
    });
  }

  function renderGauges() {
    GAUGES.forEach(function (gauge) {
      var el = document.getElementById(gauge.id);
      if (el) global.RaxComponents.Widget.mount(el, gauge);
    });
  }

  function initTable() {
    var el = document.getElementById('topClientsTable');
    if (el) global.RaxComponents.Table.mount(el, { sortable: true });
  }

  function initCharts() {
    var traffic = document.getElementById('trafficChart');
    if (traffic) {
      global.RaxCharts.create(traffic, {
        type: 'line',
        data: {
          labels: Array.from({ length: 24 }, function (_, i) { return i + ':00'; }),
          datasets: [
            {
              label: 'Down',
              data: [12, 10, 8, 9, 14, 22, 38, 55, 62, 58, 60, 64, 70, 68, 72, 80, 92, 104, 98, 84, 66, 48, 30, 18],
              borderColor: '#00D9FF', backgroundColor: 'rgba(0,217,255,0.12)',
              fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2,
            },
            {
              label: 'Up',
              data: [3, 3, 2, 3, 4, 6, 10, 14, 16, 15, 16, 18, 20, 19, 21, 24, 27, 31, 29, 24, 18, 12, 8, 5],
              borderColor: '#00FF9D', backgroundColor: 'rgba(0,255,157,0.10)',
              fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { size: 10 } } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { callback: function (v) { return v + ' Mb'; }, font: { size: 10 } } },
          },
        },
      });
    }

    var dns = document.getElementById('dnsChart');
    if (dns) {
      global.RaxCharts.create(dns, {
        type: 'doughnut',
        data: {
          labels: ['Allowed', 'Blocked', 'Cached'],
          datasets: [{ data: [68, 19, 13], backgroundColor: ['#00D9FF', '#FF3B5C', '#00FF9D'], borderWidth: 0 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '68%',
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 10 } } } },
        },
      });
    }

    var sessions = document.getElementById('sessionsChart');
    if (sessions) {
      global.RaxCharts.create(sessions, {
        type: 'bar',
        data: {
          labels: ['Mgmt', 'Home', 'IoT', 'CCTV', 'Server', 'Guest'],
          datasets: [{
            data: [3, 412, 138, 26, 54, 9],
            backgroundColor: ['#00D9FF', '#00FF9D', '#FFC857', '#00D9FF', '#00FF9D', '#5A6577'],
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
  }

  /** Searches only the Top Clients table's own existing rows — no
   * fabricated data (Phase D objective 4). Returns the matched row
   * elements so the topbar's live region can announce an accurate
   * count. */
  function initSearch() {
    global.RaxSearch.registerProvider('dashboard', function (term) {
      var rows = qsa('#topClientsTable tbody tr');
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
    renderGauges();
    initTable();
    initCharts();
    initSearch();
  }

  function destroy() { /* single-page-load lifetime today; no teardown required yet */ }

  global.RaxRegistry.registerPage({ id: 'dashboard', title: 'Dashboard', init: init, destroy: destroy });
})(window);
