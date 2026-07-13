/**
 * navigation.js — RaxNavigation
 * ------------------------------------------------------------------
 * Purpose:        Single entry point each page's inline bootstrap
 *                 script calls to stand up the shell (Sidebar +
 *                 Topbar), replacing the old
 *                 `VaryxNav.mount({ active, title, crumb, search })`
 *                 call with a registry-aware equivalent.
 * Responsibility: Orchestrate mounting Sidebar/Topbar into their
 *                 #sidebar-mount/#topbar-mount elements. Contains no
 *                 markup itself — delegates entirely to
 *                 RaxComponents.Sidebar/Topbar.
 * Public API:     RaxNavigation.mount({ active, title, crumb, search })
 * Dependencies:   RaxComponents.Sidebar, RaxComponents.Topbar,
 *                     RaxEvents
 * ------------------------------------------------------------------
 * `active` is the pageId used both to mark the correct sidebar item
 * aria-current and to scope RaxSearch to the right provider — it is
 * the direct successor to Phase 1's `active: 'dashboard'` field.
 */
(function (global) {
  'use strict';

  var instances = { sidebar: null, topbar: null };

  function mount(config) {
    config = config || {};
    document.body.dataset.page = config.active;

    var sidebarEl = document.getElementById('sidebar-mount');
    var topbarEl = document.getElementById('topbar-mount');

    if (sidebarEl) {
      instances.sidebar = global.RaxComponents.Sidebar.mount(sidebarEl, { activePageId: config.active });
    }
    if (topbarEl) {
      instances.topbar = global.RaxComponents.Topbar.mount(topbarEl, {
        title: config.title,
        crumb: config.crumb,
        searchPlaceholder: config.search,
        pageId: config.active,
      });
    }

    global.RaxEvents.emit('nav:change', { pageId: config.active });
  }

  global.RaxNavigation = { mount: mount };
})(window);
