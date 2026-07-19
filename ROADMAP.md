# Roadmap

## Completed

- ✅ **Architecture** — token-driven CSS, framework core modules, component
  library, all 5 built-in pages sharing one architecture.
- ✅ **Component library** — every component (`Card`, `Widget`, `Table`,
  `Tabs`, `Modal`, `Toast`, `Sidebar`, `Topbar`) exercised in the shipped app;
  search, command palette, and sortable tables all functional on every page.
- ✅ **Theme engine** — 5 built-in accents + dark/light mode,
  `registerTheme()` extension point, Chart.js dataset colors follow accent
  switching.
- ✅ **Plugin / Extension API** — all `register*` functions (pages, menu
  items, widgets, commands, search providers, themes, settings pages,
  notifications, permissions) documented and implemented;
  `RaxPluginLoader` loads plugin scripts with zero changes required to any
  framework file.
- ✅ **Auth extension API** — `RaxAuth`, a provider-based extension point
  for `currentUser`/`login`/`logout`/`hasPermission`/`beforeRoute`/
  `afterLogin`/`afterLogout`. RAX Theme itself ships no login page, no auth
  backend, and no default access control (permissive by design — see
  `docs/auth-api.md`).
- ✅ **Example plugin** — [`examples/hello-plugin/`](examples/hello-plugin/)
  demonstrates `registerPage`, `registerWidget`, and `registerCommand` end to
  end.
- ✅ **Open source release preparation** — full repository documentation
  (`README`, `CONTRIBUTING`, `CHANGELOG`, this file, `LICENSE`,
  `CODE_OF_CONDUCT`, `SECURITY`), GitHub community health files
  (`.github/`), and a documentation index (`docs/README.md`).

## Next — planned, not yet started

- **CI pipeline.** The validation checks documented in `CONTRIBUTING.md`
  (duplicate-CSS grep, `new Chart(` isolation check, accessibility marker
  checks, asset-reference resolution, JS syntax check) are currently run
  manually. These should become an actual CI job that runs on every PR.
- **Automated visual regression testing.** This project's "no visual
  regression" claims have been verified by identical class names + identical
  token values + manual review, never a real screenshot diff.
- **Subresource Integrity (SRI) hashes** on the Lucide/Chart.js CDN
  `<script>` tags. Versions are pinned; hashes are not yet added — see
  `SECURITY.md` for the exact command to generate one.
- **Dashboard widget customization** (drag-to-reorder / show-hide), building
  on `RaxRegistry.registerWidget()`, which is fully implemented and
  demonstrated by the example plugin but has no consumer in the built-in app
  today — intentionally deferred until a real feature needs it.
- **Settings hub and notification center UI**, building on
  `RaxRegistry.registerSettingsPage()`/`registerNotification()` — both are
  fully implemented storage layers with no consuming UI yet, same situation
  `registerWidget()` was in before dashboard customization above.
- **A real, runnable example auth provider** (distinct from the illustrative
  snippet in `docs/auth-api.md`) — e.g. a mock session-based provider under
  `examples/`, demonstrating `beforeRoute()` actually blocking navigation.
- **`login.html`.** Referenced by the original prototype this project was
  built from, never built. Needs a scoping decision: does RAX Theme ship its
  own login screen, or assume OPNsense's own auth wraps every themed page?
  Now that `RaxAuth` exists, this would be built as a `RaxAuth` provider's
  own page, not a framework-level login screen.

## Exploratory — not scheduled

- **Widget Marketplace.** A curated listing of community
  `registerWidget()`-based plugins. Out of scope until Dashboard
  Customization above is stable and there are real-world plugins proving the
  shape is right.
- **Optional build step.** The project deliberately has none today (see
  `README.md`'s Browser Support section for the reasoning). If the
  component/module count grows significantly, an *optional* bundler pass for
  production deployments (not required for development) may be worth
  revisiting — no decision made either way.

## Versioning

This project is pre-1.0. Once tagged, it will follow semantic versioning
against the Public API surface defined in `docs/api-classification.md`:
patch releases for fixes with no API change, minor releases for new
backward-compatible Public API, major releases for any breaking change to a
function/event/component classified **Public** in that document.
