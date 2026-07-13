/**
 * notifications.js — RaxNotifications
 * ------------------------------------------------------------------
 * Purpose:        Public API for showing toasts, per Phase B §4.5.
 *                 Any module — including a future plugin — can call
 *                 RaxNotifications.toast(...) without importing the
 *                 ToastStack component directly.
 * Responsibility: Emit 'toast:show'. Owns no rendering — that's
 *                 components/toast.js's job as the sole listener.
 * Public API:     RaxNotifications.toast(message, { type, duration })
 *                 RaxNotifications.ok/warn/danger/info(message, duration)
 * Dependencies:   RaxEvents
 */
(function (global) {
  'use strict';

  function toast(message, opts) {
    opts = opts || {};
    global.RaxEvents.emit('toast:show', {
      message: message,
      type: opts.type || 'info',
      duration: opts.duration,
    });
  }

  global.RaxNotifications = {
    toast: toast,
    ok: function (m, d) { toast(m, { type: 'ok', duration: d }); },
    warn: function (m, d) { toast(m, { type: 'warn', duration: d }); },
    danger: function (m, d) { toast(m, { type: 'danger', duration: d }); },
    info: function (m, d) { toast(m, { type: 'info', duration: d }); },
  };
})(window);
