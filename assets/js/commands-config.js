/**
 * commands-config.js — Built-in Command Palette commands
 * ------------------------------------------------------------------
 * Purpose:        Registers the framework-level commands that aren't
 *                 already derivable from RaxRegistry's menu items.
 *                 Loaded on every page, same pattern as menu-config.js
 *                 (Phase D objective 3).
 * Responsibility: Command registration ONLY.
 * Dependencies:   RaxRegistry, RaxTheme, RaxNotifications
 * ------------------------------------------------------------------
 * DESIGN NOTE — why "Navigate to X" isn't registered here:
 * RaxCommandPalette already builds a "Go to <label>" entry for every
 * RaxRegistry.getMenuItems() result (see command-palette.js
 * buildItems()). Registering "Navigate to Dashboard" etc. again here
 * via registerCommand() would produce two near-identical rows per
 * page in the palette. The existing registry (menu items) already
 * satisfies the navigation requirement, so this file only adds
 * commands that are genuinely NOT derivable from another registry
 * list: theme + accent switching.
 */
(function (global) {
  'use strict';

  var ACCENTS = ['cyan', 'emerald', 'purple', 'red', 'orange'];

  global.RaxRegistry.registerCommand({
    id: 'toggle-theme',
    label: 'Toggle Theme (Dark / Light)',
    icon: 'sun-moon',
    handler: function () {
      global.RaxTheme.toggleMode();
      global.RaxNotifications.info('Switched to ' + global.RaxTheme.getMode() + ' mode');
    },
  });

  global.RaxRegistry.registerCommand({
    id: 'cycle-accent',
    label: 'Cycle Accent Color',
    icon: 'palette',
    handler: function () {
      var current = global.RaxTheme.getAccent();
      var idx = ACCENTS.indexOf(current);
      var next = ACCENTS[(idx + 1) % ACCENTS.length];
      global.RaxTheme.setAccent(next);
      global.RaxNotifications.info('Accent switched to ' + next.charAt(0).toUpperCase() + next.slice(1));
    },
  });
})(window);
