# Changelog

All notable changes to this project are documented in this file. Format
loosely follows [Keep a Changelog](https://keepachangelog.com/); this project
is pre-1.0, so early entries are grouped by development stage rather than by
semantic version until the `v1.0.0` tag.

## [Unreleased] — Framework API Stabilization

### Added
- `RaxAPI` (`assets/js/api.js`) — the Public/Internal/Experimental API
  surface made a real, queryable runtime registry (previously
  documentation-only in `docs/api-classification.md`):
  - `classify()`/`getClassification()`/`getSurface()` — pre-populated with
    every export's tier at load time.
  - `deprecate()`/`warnDeprecated()`/`isDeprecated()`/`getDeprecations()` —
    a deprecation system with `replacement` + `removalVersion` metadata.
    `warnDeprecated()` is development-mode-only by design: zero cost if
    `RaxDevMode` isn't enabled.
  - `checkPluginCompatibility(manifest)` — validates a manifest's new
    `apiVersion` field against `RaxAPI.VERSION`/`MIN_SUPPORTED_VERSION`;
    called automatically by `RaxPlugins.registerManifest()` and folded into
    its existing validation log.
  - `RaxAPI.VERSION` (`'v1'`) — a framework **API** version, independent of
    `RaxCore.VERSION` (the framework **release** version). See
    `docs/versioning.md` for the full distinction.
- `RaxDevMode` (`assets/js/dev-mode.js`) — opt-in, disabled-by-default
  developer instrumentation: deprecated-API-usage reporting, plugin load
  timing, plugin lifecycle hook timing, and a combined `report()` summary
  that also surfaces `RaxPlugins`' existing (unconditional, unchanged)
  duplicate-registration reporting. Every function checks
  `isEnabled()`/an equivalent guard before doing any work — zero overhead
  claim verified by code inspection, not just asserted.
- New optional manifest field: `apiVersion` (e.g. `"v1"`) — report-only,
  same policy as every other `RaxPlugins` validation check.
- `docs/versioning.md`, `docs/public-api.md`, `docs/internal-api.md` — new.

### Fixed
- `docs/plugin-api.md` had an accidental duplicate "Authentication —
  `RaxAuth`" section (introduced when the Auth Extension API stage's
  content was inserted) — removed the misplaced duplicate, kept the one in
  its correct position.
- `docs/project-structure.md`'s `assets/js/` folder tree had been stale
  since the Auth Extension API stage — missing `auth.js` and `plugins.js`
  entirely. Rebuilt to match the actual folder contents, including this
  stage's `dev-mode.js` and `api.js`.

### Changed
- `assets/js/plugins.js`: `registerManifest()` now also runs
  `RaxAPI.checkPluginCompatibility()` (if `RaxAPI` is loaded) and times each
  lifecycle hook call via `RaxDevMode` (if enabled). Both are soft,
  guarded dependencies — confirmed by test that `registerManifest()` still
  works identically with neither loaded.
- `assets/js/plugin-loader.js`: records per-script load timing and calls
  `RaxDevMode.report()` automatically at the end of `loadAll()`, but only
  when `RaxDevMode` is loaded and enabled.
- `docs/plugin-api.md`, `docs/architecture.md`, `docs/api-classification.md`,
  `docs/README.md`, `README.md` updated throughout.

### Explicitly not built (per this stage's own scope)
- No UI redesign, no application features, no networking.
- No existing Public API changed — every addition is new, optional surface.
- Nothing was actually deprecated — the deprecation system is real and
  tested, but no genuine deprecation candidate exists yet (see the
  migration report for why one wasn't invented just to demonstrate it).

## [Unreleased] — Plugin Platform

### Added
- `RaxPlugins` (`assets/js/plugins.js`) — the plugin manifest, lifecycle,
  and dependency layer:
  - `registerManifest(manifest, hooks?)` — validates a manifest's schema
    (`id`/`name`/`version` required; typed checks on the rest), tracks
    duplicate plugin IDs, checks `minimumRaxVersion` against the new
    `RaxCore.VERSION`, and dispatches `onInstall`/`onEnable`/`onUpdate`
    lifecycle hooks based on state persisted in `localStorage`.
  - `enablePlugin(id)`/`disablePlugin(id)`/`uninstallPlugin(id)` — the only
    way `onDisable`/`onUninstall` (and a re-fired `onEnable`) trigger, since
    there's no automatic UI-driven trigger for "the user disabled this."
  - `getPlugin(id)`/`getPlugins()`/`isPluginEnabled(id)`/`getPluginVersion(id)`
    — the Plugin Metadata API.
  - Duplicate page/widget/command ID detection across plugins (and against
    built-in pages), via a `registry:change` listener that attributes every
    registration to whichever manifest was most recently registered.
  - `validateAll()` — checks every registered manifest's
    `dependencies`/`optionalDependencies` exist; missing required
    dependencies log as errors, missing optional ones as warnings. Never
    installs, downloads, or fetches anything. Called automatically by
    `RaxPluginLoader.loadAll()` once every declared plugin script has
    settled.
  - `getValidationErrors()`/`getValidationWarnings()` — the accumulated,
    human-readable validation log.
- `RaxCore.VERSION` — a small additive constant (`'1.0.0-rc'`), read by
  `RaxPlugins` for `minimumRaxVersion` checks.
- `RaxRegistry.registerSettingsPage()`/`registerNotification()`/
  `registerPermission()` — extended alongside the plugin platform work (see
  the Auth Extension API entry below for when these were first added).
- 5 new `plugin:*` events (`installed`/`updated`/`enabled`/`disabled`/
  `uninstalled`), paired 1:1 with the lifecycle hooks — see `docs/events.md`.
- `docs/plugin-manifest.md` — the complete manifest schema reference.
- `examples/hello-plugin/manifest.json` and updated `index.js` — now
  demonstrates `registerManifest()`, all 5 lifecycle hooks, and an optional
  dependency declaration (on a deliberately-unregistered plugin id, to show
  the missing-dependency warning path without installing anything).

### Changed
- `assets/js/plugin-loader.js`: `loadAll()` now calls
  `RaxPlugins.validateAll()` automatically once every plugin script has
  settled, if `RaxPlugins` is loaded. No-op and fully backward compatible
  if it isn't.
- `docs/plugin-api.md`, `docs/api-classification.md`, `docs/events.md`,
  `docs/architecture.md`, `docs/README.md`, `README.md` all updated.

### Explicitly not built (per this stage's own scope)
- No plugin-manager UI, no installer, no package downloads, no networking
  anywhere in this layer. Dependency resolution is report-only.

## [Unreleased] — Auth Extension API & Expanded Plugin Registry

### Added
- `RaxAuth` (`assets/js/auth.js`) — a provider-based authentication
  extension point supporting `currentUser()`, `login()`, `logout()`,
  `hasPermission()`, `beforeRoute()`, `afterLogin()`, `afterLogout()`. RAX
  Theme itself implements no real authentication — no login page, no
  credential storage, no session handling. Default behavior with no
  provider registered is fully permissive (`hasPermission()` → `true`,
  `beforeRoute()` → never blocks), which is what keeps this addition
  backward compatible with every existing page. Full reference:
  `docs/auth-api.md`.
- `RaxRegistry.registerSettingsPage()`, `registerNotification()`, and
  `registerPermission()` — three new storage-only registrations (plus their
  `get*` accessors), extending the plugin system alongside the existing
  `registerWidget()` (dashboard widgets) and `registerMenuItem()` (sidebar
  items). No consuming UI exists for settings pages or notifications yet,
  same situation `registerWidget()` was in before dashboard customization
  was built — see `ROADMAP.md`.
- `RaxCore.boot()` now calls `RaxAuth.beforeRoute()` before booting the
  active page module, making `beforeRoute()` a real, exercised hook rather
  than a documented-only function. Provably backward compatible: with no
  provider registered, this resolves `true` immediately and behaves exactly
  as the previous synchronous `bootPageModule()` call always did.

### Changed
- `docs/plugin-api.md`, `docs/api-classification.md`, `docs/events.md`
  (3 new `auth:*` events), `docs/architecture.md`, `docs/README.md`, and
  `README.md` all updated to document the above. No existing documented
  behavior changed — these are additive sections throughout.

## [Unreleased] — Release Candidate 1

### Added
- `docs/README.md` — documentation index with a "where to start" table and a
  recommended reading order (the docs folder previously had no landing page).
- `examples/hello-plugin/` — a minimal, runnable example of the Extension
  API using `registerPage()`, `registerWidget()`, and `registerCommand()`
  only, plus the `RaxComponents.Card` and `RaxNotifications` Public APIs to
  actually render/react to them.
- Explicit, self-contained validation checklist in `CONTRIBUTING.md`
  ("Validating your change") — runnable directly, no other document needed.

### Changed
- Development-history and phase-report documents removed from the public
  repository root; `CHANGELOG.md` remains the single human-readable history.
- Every reference to a now-removed phase report, across `CONTRIBUTING.md`,
  `SECURITY.md`, `ROADMAP.md`, `.github/PULL_REQUEST_TEMPLATE.md`, and
  `docs/project-structure.md`, replaced with self-contained content (the
  actual checklist, the actual command, etc.) instead of a pointer to a
  document that no longer exists in the repo.
- `docs/architecture.md` retitled from "Architecture (as of Phase E)" to
  "Architecture" and rewritten to describe the current system as current
  fact rather than framing everything relative to a development phase.
- `README.md`: Installation and Quick Start no longer give ambiguous
  instructions — Installation is now the single definitive "how to run
  this" section, including an explicit, honest answer on `file://` support
  (works, with one `localStorage`-persistence caveat under some browsers).
  Placeholder GitHub URL replaced with an explicit `TODO` comment. Added a
  "A note on naming" section explaining the `Rax`/`RaxComponents` prefix
  convention before it's used in any code sample. Added direct links to
  `docs/api-classification.md`, `docs/plugin-api.md`, and
  `docs/component-api.md`.
- `ROADMAP.md` rewritten without phase-number labels; example plugin and
  open-source release prep moved from "planned" to "Completed."

## Phase F — Open Source Release Preparation

Produced the repository's first full documentation set (README, CONTRIBUTING,
this file, ROADMAP, LICENSE, CODE_OF_CONDUCT, SECURITY), GitHub community
health files, an expanded `docs/` folder, and a release-readiness audit.
Full detail was captured in that phase's own reports at the time; see
Release Candidate 1 above for what changed once those reports were reviewed
by an external-perspective audit and retired from the public repo.

## Phase E — Framework Stabilization & Extension API

### Added
- `RaxTheme.registerTheme()` — plugin-defined named accent themes.
- `RaxRegistry.registerSearchProvider()` — alias over `RaxSearch.registerProvider`
  for Extension API discoverability.
- `RaxPluginLoader` (`assets/js/plugin-loader.js`) and the `plugins/` folder
  convention — plugin loading with zero changes to any core module.
- `RaxUtils.hexToRgba()` — extracted from a private helper duplicated in
  `theme.js`, now shared.
- `docs/api-classification.md`, `docs/plugin-api.md`, `docs/theming.md`,
  `docs/events.md`, `docs/component-api.md`, `docs/architecture.md`.

### Fixed
- Chart.js dataset colors (line/bar/doughnut) now follow accent switching —
  previously only axis/tick text color updated on theme change.
- `registry:change` event payload standardized to always include `id`
  (menu-item registrations previously used `pageId` inconsistently).

## Phase D — Component Maturation

### Added
- `RaxComponents.Card`/`Widget`/`Table` exercised in the shipped app for the
  first time (13, 4, and 6 live instances respectively).
- Real per-page search providers on all 5 pages (previously only dashboard).
- Command palette commands: Toggle Theme, Cycle Accent Color.

### Fixed
- `core.js` boot-order bug: page module now renders before the card entrance
  animation is wired, so dynamically-rendered cards get the stagger too.

## Phase C — Architecture Refactor

### Added
- Complete token-driven CSS system (`variables.css` → `theme.css` →
  `layout.css`/`utilities.css`/`animations.css` → `components/*.css`).
- Framework core modules: `RaxCore`, `RaxRegistry`, `RaxEvents`, `RaxTheme`,
  `RaxNavigation`, `RaxCharts`, `RaxNotifications`, plus `RaxSearch` and
  `RaxCommandPalette`.
- 8 reusable components with a uniform `mount/update/destroy` contract.
- `menu-config.js` as the single source of truth for sidebar navigation.

### Fixed
- All 117 inline styles found in the Phase A audit replaced with tokens or
  utility classes (a small number of genuinely per-instance data values
  remain, by design).
- CDN dependencies (Lucide, Chart.js) pinned to exact versions (were `@latest`).
- The CCTV/Server VLAN ID/subnet swap data bug found during the Phase A audit.

## Phase B — Architecture Blueprint

Design-only phase — no code shipped. Produced the full architectural
blueprint (folder structure, component hierarchy, CSS/JS architecture, data
flow, Extension API design, performance/accessibility/theming strategy,
roadmap, risk assessment) that Phases C–E were built against.

## Phase A — Project Audit

Design-only phase — no code shipped. Audited the original VARYX Security
Console prototype (renamed to RAX Theme at the start of this phase) and
produced the findings that drove every subsequent phase's priorities.

## Phase 1 — Original Prototype (pre-RAX Theme)

The starting point: a static HTML/CSS/JS prototype ("VARYX Security Console")
with 5 console pages and a shared visual language, but no component system,
no design tokens, and significant inline-style/JS duplication. Not part of
this repository's own history as RAX Theme, but the visual and functional
baseline every later phase preserved.
