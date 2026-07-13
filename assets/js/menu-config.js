/**
 * menu-config.js — Shared navigation configuration
 * ------------------------------------------------------------------
 * Purpose:        Satisfies Phase C objective 8 ("navigation driven
 *                 from one configuration"). Registers every built-in
 *                 page's sidebar entry, in one place, loaded on every
 *                 page — so the sidebar is identical regardless of
 *                 which page.js happens to also be loaded.
 * Responsibility: Menu item registration ONLY. Page behavior
 *                 (chart init, data) lives in pages/*.js, not here.
 * Dependencies:   RaxRegistry
 * Extension:      A plugin adds its own menu item via
 *                 RaxRegistry.registerMenuItem({...}) from its own
 *                 script — it does not edit this file. This file only
 *                 owns the 5 built-in RAX Theme pages.
 */
(function (global) {
  'use strict';
  var registerMenuItem = global.RaxRegistry.registerMenuItem;

  registerMenuItem({ pageId: 'dashboard', href: 'dashboard.html', icon: 'layout-dashboard', label: 'Dashboard', section: 'Overview', order: 10 });
  registerMenuItem({ pageId: 'interfaces', href: 'interfaces.html', icon: 'network', label: 'Interfaces & VLANs', section: 'Network', order: 20 });
  registerMenuItem({ pageId: 'vpn', href: 'vpn.html', icon: 'shield', label: 'VPN & Tailscale', section: 'Network', order: 21 });
  registerMenuItem({ pageId: 'suricata', href: 'suricata.html', icon: 'siren', label: 'Suricata IDS/IPS', section: 'Protection', order: 30 });
  registerMenuItem({ pageId: 'logs', href: 'logs.html', icon: 'scroll-text', label: 'Logs & Tables', section: 'Firewall', order: 40 });
})(window);
