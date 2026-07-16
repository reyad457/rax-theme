# Changelog

All notable changes to this project are documented in this file. Format
loosely follows [Keep a Changelog](https://keepachangelog.com/); this project
is pre-1.0, so changes are grouped by development phase rather than by
semantic version until the `v1.0.0` tag.

## [Unreleased] — Phase F: Open Source Release Preparation

### Added
- Full repository documentation set: `CONTRIBUTING.md`, `CHANGELOG.md`,
  `ROADMAP.md`, `LICENSE` (MIT), `CODE_OF_CONDUCT.md`, `SECURITY.md`.
- `.github/` community health files: issue templates, PR template, discussion
  template.
- `docs/project-structure.md` and an architecture diagram
  (`docs/architecture-diagram.md`, Mermaid).
- `RELEASE_NOTES_v1.md` and `FIRST_RELEASE_CHECKLIST.md`.

### Changed
- README rewritten from scratch for public release (was still describing the
  Phase 1 file layout).
- Branding standardized to "RAX Theme — Modern OPNsense-inspired Dashboard
  Framework" across every document.

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
