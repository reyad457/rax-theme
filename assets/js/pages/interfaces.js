/**
 * pages/interfaces.js — Interfaces & VLANs page module
 * ------------------------------------------------------------------
 * Purpose:        Owns interfaces.html's data + component wiring.
 *                 No charts on this page — Chart.js correctly stays
 *                 unloaded here (Phase A/C finding preserved).
 * Responsibility: Register with RaxRegistry; render the summary strip
 *                 via RaxComponents.Card (Phase D); register a real
 *                 search provider over the VLAN cards + isolation
 *                 matrix that already exist in the DOM.
 * Dependencies:   RaxRegistry, RaxUtils, RaxSearch, RaxComponents.Card
 * ------------------------------------------------------------------
 * The VLAN cards and physical port strip are left as hand-authored
 * HTML — RaxComponents.Card's contract (title/value/label/status)
 * doesn't model the VLAN card's extra rows (subnet/gateway/devices +
 * a usage bar), so converting it would mean growing Card into a
 * VLAN-specific shape rather than a generic one (Phase D objective 5:
 * keep framework modules generic). Only the summary strip, which IS
 * a plain StatCard pattern, is converted.
 */
(function (global) {
  'use strict';
  var qsa = global.RaxUtils.qsa;

  var SUMMARY_CARDS = [
    { id: 'card-phys', title: 'Physical Interfaces', value: '2', label: 'dual-port NIC · i3 3rd gen' },
    { id: 'card-vlans', title: 'VLANs Configured', value: '6', label: 'Mgmt · Home · IoT · CCTV · Server · Guest', glow: 'cyan' },
    { id: 'card-ports', title: 'Switch Ports Up', value: '7', valueSuffix: ' / 8', label: 'HPE 1820-8G managed switch', glow: 'green' },
    { id: 'card-devices', title: 'Total Devices', value: '643', label: 'leased across all segments' },
  ];

  function renderSummaryCards() {
    SUMMARY_CARDS.forEach(function (card) {
      var el = document.getElementById(card.id);
      if (el) global.RaxComponents.Card.mount(el, card);
    });
  }

  /** Searches the VLAN cards and the isolation matrix's own existing
   * rows — no fabricated data (Phase D objective 4). */
  function initSearch() {
    global.RaxSearch.registerProvider('interfaces', function (term) {
      var lower = term.toLowerCase();
      var matches = [];

      qsa('.vlan-card').forEach(function (card) {
        var isMatch = term.length === 0 || card.textContent.toLowerCase().indexOf(lower) !== -1;
        card.hidden = !isMatch;
        if (isMatch) matches.push(card);
      });

      qsa('#isolationTable tbody tr').forEach(function (row) {
        var isMatch = term.length === 0 || row.textContent.toLowerCase().indexOf(lower) !== -1;
        row.hidden = !isMatch;
        if (isMatch) matches.push(row);
      });

      return matches;
    });
  }

  function init() {
    renderSummaryCards();
    initSearch();
  }

  function destroy() {}

  global.RaxRegistry.registerPage({ id: 'interfaces', title: 'Interfaces & VLANs', init: init, destroy: destroy });
})(window);
