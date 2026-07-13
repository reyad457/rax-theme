/**
 * components/topbar.js — RaxComponents.Topbar
 * ------------------------------------------------------------------
 * Purpose:        Page title/breadcrumb + search box + theme toggle +
 *                 command-palette trigger. Direct replacement for the
 *                 title/crumb/search fields previously passed inline
 *                 to VaryxNav.mount({...}).
 * Public API:     mount(el, props) -> instance
 *                 update(instance, props)
 *                 destroy(instance)
 *                 props: { title, crumb, searchPlaceholder, pageId }
 * Dependencies:   RaxUtils, RaxEvents, RaxTheme, RaxSearch (optional),
 *                 RaxCommandPalette (optional)
 * ------------------------------------------------------------------
 * Phase D: subscribes to 'search:results' (emitted by RaxSearch.query)
 * and announces the match count via a visually-hidden aria-live region,
 * so screen reader users get feedback now that every page has a real
 * search provider wired up.
 */
(function (global) {
  'use strict';
  var dom = global.RaxUtils.dom;

  function render(el, props) {
    el.innerHTML = '';

    el.appendChild(dom('div', { class: 'topbar-heading' }, [
      dom('div', { class: 'topbar-title' }, [props.title || '']),
      dom('div', { class: 'topbar-crumb' }, [props.crumb || '']),
    ]));

    var searchInput = dom('input', {
      type: 'text',
      placeholder: props.searchPlaceholder || 'Search…',
      'aria-label': props.searchPlaceholder || 'Search',
      onInput: global.RaxUtils.debounce(function (e) {
        if (global.RaxSearch) global.RaxSearch.query(props.pageId, e.target.value);
      }, 150),
    });

    var statusEl = dom('span', { class: 'sr-only', 'aria-live': 'polite', role: 'status' });

    var searchBox = dom('div', { class: 'topbar-search' }, [
      dom('i', { 'data-lucide': 'search', 'aria-hidden': 'true' }),
      searchInput,
      dom('kbd', { 'aria-hidden': 'true' }, ['/']),
      statusEl,
    ]);
    searchBox.addEventListener('click', function () { searchInput.focus(); });
    el.appendChild(searchBox);

    var themeToggle = dom('button', {
      class: 'topbar-icon-btn',
      type: 'button',
      'aria-label': 'Toggle light/dark mode',
      onClick: function () { global.RaxTheme.toggleMode(); },
    }, [dom('i', { 'data-lucide': 'sun-moon', 'aria-hidden': 'true' })]);

    var paletteBtn = dom('button', {
      class: 'topbar-icon-btn',
      type: 'button',
      'aria-label': 'Open command palette',
      onClick: function () { if (global.RaxCommandPalette) global.RaxCommandPalette.open(); },
    }, [dom('i', { 'data-lucide': 'command', 'aria-hidden': 'true' })]);

    el.appendChild(dom('div', { class: 'topbar-actions' }, [paletteBtn, themeToggle]));

    if (global.lucide) global.lucide.createIcons();
  }

  function mount(el, props) {
    props = props || {};
    render(el, props);
    var unsubscribe = global.RaxEvents.on('search:results', function (evt) {
      if (evt.pageId !== props.pageId) return;
      var statusEl = el.querySelector('.topbar-search [role="status"]');
      if (!statusEl) return;
      statusEl.textContent = evt.term
        ? evt.results.length + (evt.results.length === 1 ? ' result' : ' results') + ' found for "' + evt.term + '"'
        : '';
    });
    return { el: el, props: props, unsubscribe: unsubscribe };
  }

  function update(instance, props) {
    instance.props = Object.assign({}, instance.props, props);
    render(instance.el, instance.props);
  }

  function destroy(instance) {
    if (instance.unsubscribe) instance.unsubscribe();
    instance.el.innerHTML = '';
  }

  global.RaxComponents = global.RaxComponents || {};
  global.RaxComponents.Topbar = { mount: mount, update: update, destroy: destroy };
})(window);
