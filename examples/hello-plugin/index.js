/**
 * examples/hello-plugin/index.js — Hello Plugin
 * ------------------------------------------------------------------
 * A minimal, runnable example of the RAX Theme Extension API AND the
 * plugin platform (manifest, lifecycle hooks, dependency validation).
 * Demonstrates exactly:
 *   - RaxPlugins.registerManifest() + all 5 lifecycle hooks
 *   - RaxRegistry.registerWidget()
 *   - RaxRegistry.registerCommand()
 *   - RaxRegistry.registerPage()
 * plus RaxComponents.Card and RaxNotifications (both Public, see
 * docs/api-classification.md) to actually render/react to them. No
 * framework file was edited to make this work.
 * ------------------------------------------------------------------
 * IMPORTANT ORDERING: registerManifest() is called FIRST, before any
 * registerWidget/registerCommand/registerPage call. RaxPlugins
 * attributes every registerPage/Widget/Command call that happens
 * during THIS script's execution to whichever manifest id was most
 * recently registered — calling registerManifest() first is what
 * lets RaxPlugins correctly detect if, say, another plugin later
 * tries to register a page or widget with the same id as this one's.
 * See docs/plugin-manifest.md.
 * ------------------------------------------------------------------
 * Try it: open examples/hello-plugin/hello-plugin.html, then press
 * Ctrl/Cmd+K and run "Say Hello". Open the browser console to see the
 * lifecycle hooks and the (deliberately unresolved) optional
 * dependency warning fire.
 */
(function (global) {
  'use strict';

  // This object is kept identical in shape and content to
  // manifest.json in this same folder. manifest.json is the
  // canonical, documented, tooling-readable file; this object is
  // what the framework actually reads at runtime, since RAX Theme
  // never calls fetch() (see docs/plugin-manifest.md for why).
  var manifest = {
    id: 'hello-plugin',
    name: 'Hello Plugin',
    description: 'A minimal, runnable example of the RAX Theme Extension API and plugin platform.',
    version: '1.0.0',
    author: 'RAX Theme Contributors',
    license: 'MIT',
    homepage: 'https://github.com/<org>/rax-theme/tree/main/examples/hello-plugin',
    icon: 'puzzle',
    category: 'example',
    keywords: ['example', 'extension-api', 'starter'],
    minimumRaxVersion: '1.0.0',
    permissions: [],
    dependencies: [],
    // Deliberately references a plugin that is NOT registered anywhere
    // in this repository, so opening hello-plugin.html visibly
    // demonstrates RaxPlugins reporting a missing dependency in the
    // console WITHOUT installing anything or blocking this plugin from
    // working — see docs/plugin-api.md's Dependency Resolution section.
    optionalDependencies: [
      { id: 'core-vpn-api', version: '>=1.0.0' },
    ],
  };

  global.RaxPlugins.registerManifest(manifest, {
    onInstall: function (m) {
      console.log('[hello-plugin] onInstall — first time this plugin has been seen in this browser (v' + m.version + ').');
    },
    onEnable: function (m) {
      console.log('[hello-plugin] onEnable — active this load (v' + m.version + ').');
    },
    onDisable: function (m) {
      console.log('[hello-plugin] onDisable — RaxPlugins.disablePlugin("hello-plugin") was called.');
    },
    onUpdate: function (m, versions) {
      console.log('[hello-plugin] onUpdate — version changed from ' + versions.from + ' to ' + versions.to + '.');
    },
    onUninstall: function (m) {
      console.log('[hello-plugin] onUninstall — RaxPlugins.uninstallPlugin("hello-plugin") was called.');
    },
  });

  // 1. registerWidget() — declare one widget for a named mount point.
  //    RaxRegistry only stores this registration; it does not render
  //    anything by itself. "component: 'Card'" here is this plugin's
  //    own convention for which RaxComponents.* factory to use when
  //    it renders its widgets in init() below.
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
