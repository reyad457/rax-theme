/**
 * pages/logs.js — Logs & Tables page module
 * ------------------------------------------------------------------
 * Purpose:        Owns logs.html's tab wiring (RaxComponents.Tabs,
 *                 unchanged from Phase C) plus, new in Phase D,
 *                 sortable columns on all 4 tables via
 *                 RaxComponents.Table and a real search provider.
 * Responsibility: No Card usage here — logs.html has no StatCard-shaped
 *                 summary strip in Phase 1/C, so there's nothing of
 *                 that shape to convert (Phase D objective 6: no
 *                 layout changes).
 * Dependencies:   RaxRegistry, RaxComponents.Tabs, RaxComponents.Table,
 *                 RaxUtils, RaxSearch
 */
(function (global) {
  'use strict';
  var qsa = global.RaxUtils.qsa;

  var HASH_MAP = { rules: 'fwlogs', dhcp: 'dhcp', aliases: 'aliases', nat: 'nat' };

  function initTabs() {
    var container = document.querySelector('main.page');
    if (container) global.RaxComponents.Tabs.mount(container, { hashMap: HASH_MAP });
  }

  function initTables() {
    // One call wires every .data-table on the page (all 4 tab panels) —
    // sorting an inactive panel's table is harmless since it's hidden.
    var container = document.querySelector('main.page');
    if (container) global.RaxComponents.Table.mount(container, { sortable: true });
  }

  /** Searches every existing table row on the page — no fabricated
   * data (Phase D objective 4). Only the active tab's rows are ever
   * visible regardless, so filtering all tables in one pass is safe. */
  function initSearch() {
    global.RaxSearch.registerProvider('logs', function (term) {
      var rows = qsa('.data-table tbody tr');
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
    initTabs();
    initTables();
    initSearch();
  }

  function destroy() {}

  global.RaxRegistry.registerPage({ id: 'logs', title: 'Logs & Tables', init: init, destroy: destroy });
})(window);
