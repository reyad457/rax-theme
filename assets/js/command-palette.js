/**
 * command-palette.js — RaxCommandPalette
 * ------------------------------------------------------------------
 * Purpose:        ⌘K overlay listing every registered page + command
 *                 from RaxRegistry (Phase B §4.7). This is also the
 *                 accessibility-first path to every action in the
 *                 app, not just a power-user shortcut.
 * Responsibility: Build its own overlay on demand (it's a singleton,
 *                 not tied to a specific per-page mount element).
 *                 Fuzzy-filter, keyboard nav, Enter to execute, Esc
 *                 to close, focus trap + restore.
 * Public API:     RaxCommandPalette.open()
 *                 RaxCommandPalette.close()
 * Dependencies:   RaxUtils, RaxRegistry, RaxEvents
 */
(function (global) {
  'use strict';
  var dom = global.RaxUtils.dom;

  var state = { backdrop: null, activeIndex: 0, items: [], lastFocused: null };

  function buildItems() {
    var pages = global.RaxRegistry.getMenuItems().map(function (m) {
      return { type: 'page', icon: m.icon || 'file', label: 'Go to ' + m.label, action: function () { window.location.href = m.href || (m.pageId + '.html'); } };
    });
    var commands = global.RaxRegistry.getCommands().map(function (c) {
      return { type: 'command', icon: c.icon || 'zap', label: c.label, action: c.handler };
    });
    return pages.concat(commands);
  }

  function filter(term) {
    if (!term) return state.items;
    var t = term.toLowerCase();
    return state.items.filter(function (i) { return i.label.toLowerCase().indexOf(t) !== -1; });
  }

  function renderList(listEl, filtered) {
    listEl.innerHTML = '';
    filtered.forEach(function (item, i) {
      var row = dom('div', {
        class: 'cmdk-item', role: 'option', 'data-active': String(i === state.activeIndex),
        onClick: function () { item.action(); close(); },
      }, [dom('i', { 'data-lucide': item.icon, 'aria-hidden': 'true' }), item.label]);
      listEl.appendChild(row);
    });
    if (global.lucide) global.lucide.createIcons();
  }

  function open() {
    if (state.backdrop) return;
    state.lastFocused = document.activeElement;
    state.items = buildItems();
    state.activeIndex = 0;

    var input = dom('input', { class: 'cmdk-input', placeholder: 'Search pages and commands…', 'aria-label': 'Command palette search', role: 'combobox', 'aria-expanded': 'true' });
    var list = dom('div', { class: 'cmdk-list', role: 'listbox' });
    var palette = dom('div', { class: 'cmdk anim-slide-up', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Command palette' }, [input, list]);
    var backdrop = dom('div', { class: 'cmdk-backdrop', onClick: function (e) { if (e.target === backdrop) close(); } }, [palette]);

    document.body.appendChild(backdrop);
    state.backdrop = backdrop;
    renderList(list, state.items);
    input.focus();

    input.addEventListener('input', function () {
      state.activeIndex = 0;
      renderList(list, filter(input.value));
    });

    document.addEventListener('keydown', keyHandler);

    function keyHandler(e) {
      var filtered = filter(input.value);
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); state.activeIndex = Math.min(state.activeIndex + 1, filtered.length - 1); renderList(list, filtered); }
      if (e.key === 'ArrowUp') { e.preventDefault(); state.activeIndex = Math.max(state.activeIndex - 1, 0); renderList(list, filtered); }
      if (e.key === 'Enter' && filtered[state.activeIndex]) { filtered[state.activeIndex].action(); close(); }
    }
    state._keyHandler = keyHandler;
  }

  function close() {
    if (!state.backdrop) return;
    document.removeEventListener('keydown', state._keyHandler);
    state.backdrop.remove();
    state.backdrop = null;
    if (state.lastFocused && state.lastFocused.focus) state.lastFocused.focus();
  }

  // Global Ctrl/Cmd+K trigger, available on every page once this script loads.
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      state.backdrop ? close() : open();
    }
  });

  global.RaxCommandPalette = { open: open, close: close };
})(window);
