/**
 * registry.js — RaxRegistry
 * ------------------------------------------------------------------
 * Purpose:        The entire Extension API surface (Phase B §6). Any
 *                 developer — core contributor or third-party plugin
 *                 author — registers pages/menu items/widgets/commands
 *                 here, and never touches core.js, navigation.js, or
 *                 any shipped component to do it.
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
 *                 RaxRegistry.getPage(id)
 *                 RaxRegistry.getMenuItems()
 *                 RaxRegistry.getWidgets(mountPoint)
 *                 RaxRegistry.getCommands()
 * Dependencies:   events.js (emits 'registry:change' so Sidebar/
 *                 CommandPalette can re-render if a plugin registers
 *                 late)
 * Extension:      This IS the extension point — see docs/extension-
 *                 api.md. Non-goal by design: no API here lets a
 *                 plugin alter another plugin's registration or reach
 *                 into shell component internals (Phase B §6).
 */
(function (global) {
  'use strict';

  var pages = Object.create(null);
  var menuItems = [];
  var widgets = Object.create(null); // mountPoint -> [widget]
  var commands = [];

  function registerPage(page) {
    if (!page || !page.id) {
      console.error('[RaxRegistry] registerPage requires an { id } field.');
      return;
    }
    if (pages[page.id]) {
      console.warn('[RaxRegistry] page "' + page.id + '" is already registered — overwriting.');
    }
    pages[page.id] = page;
    global.RaxEvents && global.RaxEvents.emit('registry:change', { type: 'page', id: page.id });
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
    global.RaxEvents && global.RaxEvents.emit('registry:change', { type: 'menuItem', pageId: item.pageId });
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
    global.RaxEvents && global.RaxEvents.emit('registry:change', { type: 'widget', id: widget.id });
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
    global.RaxEvents && global.RaxEvents.emit('registry:change', { type: 'command', id: command.id });
  }

  function getCommands() {
    return commands.slice();
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
  };
})(window);
