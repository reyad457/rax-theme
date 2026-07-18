/**
 * examples/hello-plugin/index.js — Hello Plugin
 * ------------------------------------------------------------------
 * A minimal, runnable example of the RAX Theme Extension API. Uses
 * ONLY three registration functions:
 *   - RaxRegistry.registerWidget()
 *   - RaxRegistry.registerCommand()
 *   - RaxRegistry.registerPage()
 * plus RaxComponents.Card (a Public component, see
 * docs/api-classification.md) to actually render the widget it
 * registers, and RaxNotifications (also Public) to react to the
 * command. No framework file was edited to make this work — this
 * script is loaded exactly the way any third-party plugin would be,
 * via window.RAX_PLUGINS (see hello-plugin.html).
 * ------------------------------------------------------------------
 * Try it: open examples/hello-plugin/hello-plugin.html, then press
 * Ctrl/Cmd+K and run "Say Hello".
 */
(function (global) {
  'use strict';

  // 1. registerWidget() — declare one widget for a named mount point.
  //    RaxRegistry only stores this registration; it does not render
  //    anything by itself. "component: 'Card'" here is this plugin's
  //    own convention for which RaxComponents.* factory to use when
  //    it renders its widgets in init() below — the Extension API
  //    doesn't prescribe a shape for `props`, that's up to the plugin.
  global.RaxRegistry.registerWidget({
    id: 'hello-widget',
    mountPoint: 'hello-plugin-widgets',
    component: 'Card',
    props: {
      title: 'Hello Plugin',
      value: '👋',
      label: 'Rendered from RaxRegistry.registerWidget() + RaxComponents.Card',
      status: { type: 'ok', label: 'Active' },
      glow: 'cyan',
    },
  });

  // 2. registerCommand() — adds one entry to the command palette
  //    (Ctrl/Cmd+K), available on every page that loads this plugin.
  global.RaxRegistry.registerCommand({
    id: 'hello-plugin-say-hello',
    label: 'Say Hello',
    icon: 'hand',
    handler: function () {
      global.RaxNotifications.info('Hello from the example plugin!');
    },
  });

  // 3. registerPage() — registers this plugin's own page module.
  //    init() runs only when hello-plugin.html is the active page
  //    (document.body.dataset.page === 'hello-plugin'), same as any
  //    built-in RAX Theme page.
  function init() {
    var mount = document.getElementById('hello-plugin-widgets');
    if (!mount) return;

    global.RaxRegistry.getWidgets('hello-plugin-widgets').forEach(function (widget) {
      var el = document.createElement('div');
      mount.appendChild(el);
      global.RaxComponents[widget.component].mount(el, widget.props);
    });
  }

  function destroy() {
    /* nothing to tear down in this example */
  }

  global.RaxRegistry.registerPage({
    id: 'hello-plugin',
    title: 'Hello Plugin',
    init: init,
    destroy: destroy,
  });
})(window);
