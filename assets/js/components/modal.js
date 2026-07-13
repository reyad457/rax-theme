/**
 * components/modal.js — RaxComponents.Modal (ModalHost)
 * ------------------------------------------------------------------
 * Purpose:        Single mount point, one modal active at a time.
 *                 Listens for 'modal:open' / 'modal:close' (Phase B
 *                 §4.4). Not used by any Phase 1 page, but required
 *                 shell infrastructure per Phase B §2.
 * Responsibility: Focus trap while open, restore focus to the
 *                 triggering element on close, Esc to dismiss
 *                 (Phase B §8).
 * Public API:     mount(el) -> instance
 *                 update() -- no-op, driven by events
 *                 destroy(instance)
 * Dependencies:   RaxUtils, RaxEvents
 */
(function (global) {
  'use strict';
  var dom = global.RaxUtils.dom;

  function open(el, opts) {
    var lastFocused = document.activeElement;

    var backdrop = dom('div', { class: 'modal-backdrop', onClick: function (e) { if (e.target === backdrop) close(); } });
    var modal = dom('div', { class: 'modal anim-slide-up', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'modal-title' }, [
      dom('div', { class: 'modal-head' }, [
        dom('div', { class: 'modal-title', id: 'modal-title' }, [opts.title || '']),
        dom('div', { class: 'modal-close', role: 'button', tabIndex: '0', 'aria-label': 'Close dialog', onClick: function () { close(); } }, [
          dom('i', { 'data-lucide': 'x', 'aria-hidden': 'true' }),
        ]),
      ]),
      dom('div', { class: 'modal-body' }, [opts.body || '']),
    ]);
    backdrop.appendChild(modal);
    el.appendChild(backdrop);
    if (global.lucide) global.lucide.createIcons();

    function keyHandler(e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      var focusable = global.RaxUtils.qsa('button, [href], [tabindex]:not([tabindex="-1"])', modal);
      if (!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', keyHandler);
    modal.focus();

    function close() {
      document.removeEventListener('keydown', keyHandler);
      backdrop.remove();
      if (lastFocused && lastFocused.focus) lastFocused.focus();
      global.RaxEvents.emit('modal:closed', {});
    }

    global.RaxEvents.once('modal:close', close);
  }

  function mount(el) {
    var unsubscribe = global.RaxEvents.on('modal:open', function (opts) { open(el, opts || {}); });
    return { el: el, unsubscribe: unsubscribe };
  }

  function update() { /* driven entirely by modal:open/modal:close events */ }

  function destroy(instance) {
    if (instance.unsubscribe) instance.unsubscribe();
    instance.el.innerHTML = '';
  }

  global.RaxComponents = global.RaxComponents || {};
  global.RaxComponents.Modal = { mount: mount, update: update, destroy: destroy };
})(window);
