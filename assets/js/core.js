/**
 * core.js — RaxCore
 * ------------------------------------------------------------------
 * Purpose:        The framework's bootstrap sequence. Thin on purpose:
 *                 it knows nothing about what a "dashboard" or "VLAN"
 *                 is — that knowledge lives entirely in pages/*.js.
 *                 RaxCore would boot a community plugin page exactly
 *                 the same way it boots a built-in one.
 * Responsibility: Apply theme before paint-relevant work, mount
 *                 ToastStack + ModalHost, wire button ripple, consult
 *                 RaxAuth.beforeRoute() (see note below), hand off to
 *                 the page module registered for
 *                 document.body.dataset.page (which may render its own
 *                 Card/Widget markup), THEN wire the card entrance
 *                 animation — order matters so dynamically-rendered
 *                 cards get the stagger too, not just static markup.
 * Public API:     RaxCore.boot() -- called once, at the bottom of
 *                     every page, after all framework scripts and the
 *                     page's own pages/*.js have loaded.
 * Dependencies:   RaxEvents, RaxRegistry, RaxTheme, RaxAuth,
 *                     RaxComponents.Toast, RaxComponents.Modal, RaxUtils
 * ------------------------------------------------------------------
 * Load order contract for every page's <head>/<body>:
 *   events.js, registry.js, utils.js, theme.js, auth.js,
 *     plugin-loader.js                                            (core)
 *   components/*.js                                            (shell + content components)
 *   charts.js, notifications.js, search.js, command-palette.js  (services)
 *   navigation.js                                               (mounts sidebar/topbar)
 *   pages/<page>.js                                             (registers this page)
 *   core.js, called last via RaxCore.boot()
 * ------------------------------------------------------------------
 * WHY boot() CALLS RaxAuth.beforeRoute(): a route guard that's never
 * consulted isn't an extension point, it's just an idea documented
 * somewhere no code reads — see docs/auth-api.md. This is the single
 * line that makes it real. It is provably backward compatible: with
 * no provider registered (true of every page in this repository),
 * RaxAuth.beforeRoute() resolves `true` immediately and this behaves
 * exactly as calling bootPageModule() synchronously always did. If a
 * host application registers a provider whose beforeRoute() returns
 * false, RaxCore skips the page module's init() and logs why — it
 * does NOT redirect, show a lock screen, or render any auth UI of its
 * own. That's the registered provider's responsibility (e.g. redirect
 * via window.location from within its own beforeRoute()) — see
 * docs/auth-api.md.
 */
(function (global) {
  'use strict';

  function mountShellSingletons() {
    var toastEl = document.getElementById('toast-stack-mount');
    var modalEl = document.getElementById('modal-host-mount');
    if (toastEl) global.RaxComponents.Toast.mount(toastEl);
    if (modalEl) global.RaxComponents.Modal.mount(modalEl);
  }

  /** Ripple + entrance are app-wide "chrome" behaviors, not stateful
   * components with their own lifecycle — kept here rather than given
   * a full mount/update/destroy component file each. */
  function wireButtonRipple() {
    document.addEventListener('pointerdown', function (e) {
      var btn = e.target.closest('.btn');
      if (!btn) return;
      var rect = btn.getBoundingClientRect();
      var ripple = document.createElement('span');
      ripple.style.position = 'absolute';
      ripple.style.left = (e.clientX - rect.left) + 'px';
      ripple.style.top = (e.clientY - rect.top) + 'px';
      ripple.style.width = ripple.style.height = '8px';
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'currentColor';
      ripple.style.opacity = '0.35';
      ripple.style.pointerEvents = 'none';
      ripple.style.transform = 'translate(-50%, -50%) scale(1)';
      ripple.style.transition = 'transform 420ms ease-out, opacity 420ms ease-out';
      if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(ripple);
      requestAnimationFrame(function () {
        ripple.style.transform = 'translate(-50%, -50%) scale(14)';
        ripple.style.opacity = '0';
      });
      setTimeout(function () { ripple.remove(); }, 420);
    });
  }

  function wireEntranceAnimation() {
    var cards = global.RaxUtils.qsa('.card, .vlan-card');
    cards.forEach(function (card, i) {
      card.style.setProperty('--i', i % 12);
      card.classList.add('anim-entrance');
    });
    var page = document.querySelector('.page');
    if (page) page.classList.add('anim-page-transition');
  }

  function bootPageModule() {
    var pageId = document.body.dataset.page;
    if (!pageId) return;
    var page = global.RaxRegistry.getPage(pageId);
    if (!page) {
      console.warn('[RaxCore] No page module registered for "' + pageId + '".');
      return;
    }
    page.init();
  }

  function boot() {
    global.RaxTheme.init();
    mountShellSingletons();
    wireButtonRipple();

    var pageId = document.body.dataset.page;
    var routeCheck = global.RaxAuth ? global.RaxAuth.beforeRoute(pageId) : Promise.resolve(true);

    routeCheck.then(function (allowed) {
      if (allowed) {
        bootPageModule();
      } else {
        console.warn('[RaxCore] Route to "' + pageId + '" was blocked by the registered RaxAuth provider\'s beforeRoute(). RaxCore does not redirect or render access-denied UI itself — see docs/auth-api.md.');
      }
      wireEntranceAnimation();
      if (global.lucide) global.lucide.createIcons();
    });
  }

  global.RaxCore = { boot: boot };
})(window);
