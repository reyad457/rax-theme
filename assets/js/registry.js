/**
 * registry.js — RaxRegistry
 * ------------------------------------------------------------------
 * Purpose:        The core of the Extension API, formalized in
 *                 docs/plugin-api.md. Any developer — core contributor
 *                 or third-party plugin author — registers pages/menu
 *                 items/widgets/commands/settings pages/notifications/
 *                 permissions here, and never touches core.js,
 *                 navigation.js, or any shipped component to do it.
 * Responsibility: Store registrations, expose read accessors used by
 *                 RaxCore (page boot), Sidebar (menu), CommandPalette
 *                 (commands), dashboard widget mounts, and — once a
 *                 host application builds them — a settings hub and a
 *                 notification center (both are storage-only here
 *                 today; see the note on each below).
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
 *                 RaxRegistry.registerSettingsPage({ id, label, icon,
 *                     section, order, render })
 *                 RaxRegistry.registerNotification({ id, type, message,
 *                     icon, timestamp })
 *                 RaxRegistry.registerPermission({ id, label,
 *                     description })
 *                 RaxRegistry.getPage(id)
 *                 RaxRegistry.getMenuItems()
 *                 RaxRegistry.getWidgets(mountPoint)
 *                 RaxRegistry.getCommands()
 *                 RaxRegistry.getSettingsPages()
 *                 RaxRegistry.getNotifications()
 *                 RaxRegistry.getPermissions()
 * Dependencies:   events.js (emits 'registry:change' so Sidebar/
 *                 CommandPalette can re-render if a plugin registers
 *                 late)
 * Extension:      This IS the extension point — see docs/plugin-api.md.
 *                 Non-goal by design: no API here lets a plugin alter
 *                 another plugin's registration or reach into shell
 *                 component internals.
 * ------------------------------------------------------------------
 * WHY registerSearchProvider IS AN ALIAS, NOT OWNED HERE: search
 * provider storage/lookup already lives in search.js (RaxSearch),
 * keyed by pageId, same shape as this file's own registrations. Rather
 * than duplicate that storage here, this function forwards to
 * RaxSearch at CALL time (not load time — registry.js loads before
 * search.js, so the lookup must be lazy). registerTheme() is
 * intentionally NOT aliased here either — see docs/plugin-api.md.
 * registerAuthProvider() is likewise NOT here — see docs/auth-api.md;
 * same reasoning as theming: it's an ongoing responsibility of its own
 * module (auth.js / RaxAuth), not a one-time registration list.
 * ------------------------------------------------------------------
 * SETTINGS PAGES AND NOTIFICATIONS ARE STORAGE-ONLY TODAY, BY DESIGN:
 * neither a settings hub UI nor a notification center exists in the
 * shipped app — building either would be a UI addition, which is
 * explicitly out of scope for this registry extension. This mirrors
 * exactly how `registerWidget()` shipped before anything consumed
 * `getWidgets()`: the registration and storage are real, tested, and
 * documented; the consuming UI is a separate, later piece of work.
 * A plugin can still use `getSettingsPages()`/`getNotifications()`
 * itself today to build its own presentation if it wants one now.
 * ------------------------------------------------------------------
 * EVENT PAYLOAD CONSISTENCY: every 'registry:change' emit includes
 * both `type` and `id` — for menu items, `id` is the item's pageId
 * (menu items don't have their own separate id concept).
 */
(function (global) {
  'use strict';

  var pages = Object.create(null);
  var menuItems = [];
  var widgets = Object.create(null); // mountPoint -> [widget]
  var commands = [];
  var settingsPages = [];
  var notifications = [];
  var permissions = [];

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

  function registerSettingsPage(page) {
    if (!page || !page.id || !page.label) {
      console.error('[RaxRegistry] registerSettingsPage requires { id, label }.');
      return;
    }
    settingsPages.push(Object.assign({ order: 100, section: 'General' }, page));
    emitChange('settingsPage', page.id);
  }

  function getSettingsPages() {
    return settingsPages.slice().sort(function (a, b) { return a.order - b.order; });
  }

  function registerNotification(notification) {
    if (!notification || !notification.id || !notification.message) {
      console.error('[RaxRegistry] registerNotification requires { id, message }.');
      return;
    }
    notifications.push(Object.assign({
      type: 'info',
      timestamp: Date.now(),
    }, notification));
    emitChange('notification', notification.id);
  }

  function getNotifications() {
    return notifications.slice().sort(function (a, b) { return b.timestamp - a.timestamp; });
  }

  function registerPermission(permission) {
    if (!permission || !permission.id || !permission.label) {
      console.error('[RaxRegistry] registerPermission requires { id, label }.');
      return;
    }
    if (permissions.some(function (p) { return p.id === permission.id; })) {
      console.warn('[RaxRegistry] permission "' + permission.id + '" is already registered — skipping duplicate.');
      return;
    }
    permissions.push(permission);
    emitChange('permission', permission.id);
  }

  function getPermissions() {
    return permissions.slice();
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
    registerSettingsPage: registerSettingsPage,
    getSettingsPages: getSettingsPages,
    registerNotification: registerNotification,
    getNotifications: getNotifications,
    registerPermission: registerPermission,
    getPermissions: getPermissions,
  };
})(window);
