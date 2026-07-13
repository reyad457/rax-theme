/**
 * components/toast.js — RaxComponents.Toast (ToastStack)
 * ------------------------------------------------------------------
 * Purpose:        Render + auto-dismiss the notification queue driven
 *                 by RaxNotifications. This is the sole listener for
 *                 the 'toast:show' channel (Phase B §4.5).
 * Public API:     mount(el) -> instance   (props not used — data
 *                     arrives entirely via the 'toast:show' event)
 *                 update() -- no-op
 *                 destroy(instance)
 * Dependencies:   RaxUtils, RaxEvents
 */
(function (global) {
  'use strict';
  var dom = global.RaxUtils.dom;

  var ICONS = { ok: 'check-circle', warn: 'alert-triangle', danger: 'shield-x', info: 'info' };

  function addToast(el, toast) {
    var type = toast.type || 'info';
    var node = dom('div', { class: 'toast', 'data-type': type, role: 'status', 'aria-live': 'polite' }, [
      dom('div', { class: 'toast-icon' }, [dom('i', { 'data-lucide': ICONS[type] || 'info', 'aria-hidden': 'true' })]),
      dom('div', { class: 'toast-body' }, [toast.message]),
      dom('div', {
        class: 'toast-close', role: 'button', tabIndex: '0', 'aria-label': 'Dismiss notification',
        onClick: function () { node.remove(); },
        onKeydown: function (e) { if (e.key === 'Enter' || e.key === ' ') node.remove(); },
      }, [dom('i', { 'data-lucide': 'x', 'aria-hidden': 'true' })]),
    ]);
    node.classList.add('anim-slide-up');
    el.appendChild(node);
    if (global.lucide) global.lucide.createIcons();

    var duration = toast.duration || 4200;
    setTimeout(function () { node.remove(); }, duration);
  }

  function mount(el) {
    el.setAttribute('aria-label', 'Notifications');
    var unsubscribe = global.RaxEvents.on('toast:show', function (toast) { addToast(el, toast); });
    return { el: el, unsubscribe: unsubscribe };
  }

  function update() { /* stack renders reactively off events, nothing to patch */ }

  function destroy(instance) {
    if (instance.unsubscribe) instance.unsubscribe();
    instance.el.innerHTML = '';
  }

  global.RaxComponents = global.RaxComponents || {};
  global.RaxComponents.Toast = { mount: mount, update: update, destroy: destroy };
})(window);
