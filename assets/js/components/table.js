/**
 * components/table.js — RaxComponents.Table
 * ------------------------------------------------------------------
 * Purpose:        Optional sortable-column behavior for existing
 *                 `.data-table` markup. Pages author plain
 *                 table-wrap/data-table HTML (unchanged from Phase
 *                 1); this component progressively enhances it when
 *                 mounted with { sortable: true }.
 * Public API:     mount(el, props) -> instance   props: { sortable }
 *                 update(instance, props)
 *                 destroy(instance)
 * Dependencies:   RaxUtils
 */
(function (global) {
  'use strict';
  var qsa = global.RaxUtils.qsa;

  function enableSort(table) {
    var headers = qsa('thead th', table);
    headers.forEach(function (th, colIndex) {
      th.tabIndex = 0;
      th.setAttribute('role', 'button');
      th.setAttribute('aria-sort', 'none');
      function sort() {
        var tbody = table.querySelector('tbody');
        var rows = qsa('tr', tbody);
        var ascending = th.getAttribute('aria-sort') !== 'ascending';
        rows.sort(function (a, b) {
          var av = a.children[colIndex].textContent.trim();
          var bv = b.children[colIndex].textContent.trim();
          var an = parseFloat(av), bn = parseFloat(bv);
          var cmp = (!isNaN(an) && !isNaN(bn)) ? an - bn : av.localeCompare(bv);
          return ascending ? cmp : -cmp;
        });
        headers.forEach(function (h) { h.setAttribute('aria-sort', 'none'); });
        th.setAttribute('aria-sort', ascending ? 'ascending' : 'descending');
        rows.forEach(function (row) { tbody.appendChild(row); });
      }
      th.addEventListener('click', sort);
      th.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sort(); } });
    });
  }

  function mount(el, props) {
    props = props || {};
    if (props.sortable) qsa('.data-table', el).forEach(enableSort);
    return { el: el, props: props };
  }

  function update(instance, props) {
    instance.props = Object.assign({}, instance.props, props);
    if (instance.props.sortable) qsa('.data-table', instance.el).forEach(enableSort);
  }

  function destroy() { /* click listeners are cheap and scoped to the table's own lifetime with the page */ }

  global.RaxComponents = global.RaxComponents || {};
  global.RaxComponents.Table = { mount: mount, update: update, destroy: destroy };
})(window);
