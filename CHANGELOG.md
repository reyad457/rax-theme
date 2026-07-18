# Changelog

All notable changes to this project are documented in this file. Format
loosely follows [Keep a Changelog](https://keepachangelog.com/); this project
is pre-1.0, so early entries are grouped by development stage rather than by
semantic version until the `v1.0.0` tag.

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
