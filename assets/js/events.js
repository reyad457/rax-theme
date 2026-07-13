/**
 * events.js — RaxEvents
 * ------------------------------------------------------------------
 * Purpose:        The only channel components/pages are allowed to use
 *                 to talk to each other. No component holds a direct
 *                 reference to another component's instance.
 * Responsibility: Synchronous pub/sub. Nothing else.
 * Public API:     RaxEvents.on(name, handler) -> unsubscribe fn
 *                 RaxEvents.off(name, handler)
 *                 RaxEvents.emit(name, payload)
 *                 RaxEvents.once(name, handler)
 * Dependencies:   none — this is the lowest-level framework module and
 *                 must load before everything else that uses it.
 * Extension:      Known channel names are documented in
 *                 docs/architecture.md §5.2 (nav:change, theme:change,
 *                 toast:show, modal:open, modal:close, data:refresh).
 *                 New channels are just string names — no registration
 *                 required, but document any new one you introduce.
 * ------------------------------------------------------------------
 * Load this script before registry.js, theme.js, charts.js,
 * notifications.js, navigation.js, and core.js.
 */
(function (global) {
  'use strict';

  var listeners = Object.create(null);

  function on(name, handler) {
    if (!listeners[name]) listeners[name] = [];
    listeners[name].push(handler);
    return function unsubscribe() { off(name, handler); };
  }

  function once(name, handler) {
    var unsubscribe = on(name, function wrapped(payload) {
      unsubscribe();
      handler(payload);
    });
    return unsubscribe;
  }

  function off(name, handler) {
    if (!listeners[name]) return;
    listeners[name] = listeners[name].filter(function (h) { return h !== handler; });
  }

  function emit(name, payload) {
    if (!listeners[name]) return;
    // Copy before iterating so a handler unsubscribing mid-emit is safe.
    listeners[name].slice().forEach(function (handler) {
      try {
        handler(payload);
      } catch (err) {
        // A single bad listener (framework or plugin) must never break
        // the emit chain for every other subscriber.
        console.error('[RaxEvents] listener for "' + name + '" threw:', err);
      }
    });
  }

  global.RaxEvents = { on: on, once: once, off: off, emit: emit };
})(window);
