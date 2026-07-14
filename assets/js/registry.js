/**
 * registry.js — RaxRegistry
 * ------------------------------------------------------------------
 * Purpose:        The core of the Extension API (Phase B §6, formalized
 *                 in docs/plugin-api.md). Any developer — core
 *                 contributor or third-party plugin author — registers
 *                 pages/menu items/widgets/commands here, and never
 *                 touches core.js, navigation.js, or any shipped
 *                 component to do it.
 * Responsibility: Store registrations, expose read accessors used by
 *                 RaxCore (page boot), Sidebar (menu), CommandPalette
 *                 (commands), and dashboard widget mounts.
 * Public API:     RaxRegistry.registerPage({ id, title, init, destroy })
 *                 RaxRegistry.registerMenuItem({ pageId, icon, label,
 *                     section, order, href })
 *                 RaxRegistry.registerWidget({ id, mountPoint,
 *                     component, props })
 *                 RaxRegistry.registerCommand({ id, label, handler,
 *                     keywords })
 *                 RaxRegistry.registerSearchProvider(pageId, queryFn)
 *                     — thin alias to RaxSearch.registerProvider (see
 *                     "Why registerSearchProvider is an alias" below)
 *                 RaxRegistry.getPage(id)
 *                 RaxRegistry.getMenuItems()
 *                 RaxRegistry.getWidgets(mountPoint)
 *                 RaxRegistry.getCommands()
 * Dependencies:   events.js (emits 'registry:change' so Sidebar/
 *                 CommandPalette can re-render if a plugin registers
 *                 late)
 * Extension:      This IS the extension point — see docs/plugin-api.md.
 *                 Non-goal by design: no API here lets a plugin alter
 *                 another plugin's registration or reach into shell
 *                 component internals (Phase B §6).
 * ------------------------------------------------------------------
 * WHY registerSearchProvider IS AN ALIAS, NOT OWNED HERE: search
 * provider storage/lookup already lives in search.js (RaxSearch),
 * keyed by pageId, same shape as this file's own registrations. Rather
 * than duplicate that storage here (which Phase E's "no duplicate JS"
 * objective explicitly rules out), this function forwards to RaxSearch
 * at CALL time (not load time — registry.js loads before search.js,
 * so the lookup must be lazy). registerTheme() is intentionally NOT
 * aliased here — theme definitions are an ongoing responsibility of
 * RaxTheme, not a one-time registration list, and centralizing every
 * plugin concern into this one file was flagged as a risk in Phase B
 * §11 ("registry API scope creep") — see docs/plugin-api.md for the
 * full reasoning.
 * ------------------------------------------------------------------
 * EVENT PAYLOAD CONSISTENCY (Phase E): every 'registry:change' emit
 * now includes both `type` and `id` — for menu items, `id` is the
 * item's pageId (menu items don't have their own separate id concept).
 * Phase C/D code only ever read `type`, so this is additive, not a
 * breaking change.
 */
(function (global) {
  'use strict';

  var pages = Object.create(null);
  var menuItems = [];
  var widgets = Object.create(null); // mountPoint -> [widget]
  var commands = [];

  function emitChange(type, id) {
    global.RaxEvents && global.RaxEvents.emit('registry:change', { type: type, id: id });
  }

  function registerPage(page) {
    if (!page || !page.id) {
      console.error('[RaxRegistry] registerPage requires an { id } field.');
      return;
    }
    if (pages[page.id]) {
      console.warn('[RaxRegistry] page "' + page.id + '" is already registered — overwriting.');
    }
    pages[page.id] = page;
    emitChange('page', page.id);
  }

  function getPage(id) {
    return pages[id] || null;
  }

  function registerMenuItem(item) {
    if (!item || !item.pageId || !item.label) {
      console.error('[RaxRegistry] registerMenuItem requires { pageId, label }.');
      return;
    }
    menuItems.push(Object.assign({ order: 100, section: 'General' }, item));
    emitChange('menuItem', item.pageId);
  }

  function getMenuItems() {
    return menuItems.slice().sort(function (a, b) { return a.order - b.order; });
  }

  function registerWidget(widget) {
    if (!widget || !widget.id || !widget.mountPoint) {
      console.error('[RaxRegistry] registerWidget requires { id, mountPoint }.');
      return;
    }
    if (!widgets[widget.mountPoint]) widgets[widget.mountPoint] = [];
    widgets[widget.mountPoint].push(widget);
    emitChange('widget', widget.id);
  }

  function getWidgets(mountPoint) {
    return (widgets[mountPoint] || []).slice();
  }

  function registerCommand(command) {
    if (!command || !command.id || !command.handler) {
      console.error('[RaxRegistry] registerCommand requires { id, handler }.');
      return;
    }
    commands.push(command);
    emitChange('command', command.id);
  }

  function getCommands() {
    return commands.slice();
  }

  function registerSearchProvider(pageId, queryFn) {
    if (!global.RaxSearch) {
      console.error('[RaxRegistry] registerSearchProvider was called before search.js loaded. Load order must be: registry.js ... search.js ... your plugin script.');
      return;
    }
    global.RaxSearch.registerProvider(pageId, queryFn);
  }

  global.RaxRegistry = {
    registerPage: registerPage,
    getPage: getPage,
    registerMenuItem: registerMenuItem,
    getMenuItems: getMenuItems,
    registerWidget: registerWidget,
    getWidgets: getWidgets,
    registerCommand: registerCommand,
    getCommands: getCommands,
    registerSearchProvider: registerSearchProvider,
  };
})(window);
