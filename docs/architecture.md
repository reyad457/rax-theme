# RAX Theme — Architecture (as of Phase E)

*RAX Theme — Modern OPNsense-inspired Dashboard Framework*

This document reflects what actually shipped, not the original plan — where
Phase B's blueprint and reality diverged, this document explains why. For deep
dives on specific subsystems, see the companion docs in this folder:
`component-api.md`, `plugin-api.md`, `theming.md`, `events.md`,
`api-classification.md`, `project-structure.md` (file-by-file guide), and
`architecture-diagram.md` (the same architecture as Mermaid diagrams).

---

## Folder structure

```
rax-theme/
├── README.md, LICENSE, CONTRIBUTING.md, CHANGELOG.md, ROADMAP.md   (Phase F)
├── docs/
│   ├── architecture.md          (this file)
│   ├── component-api.md
│   ├── plugin-api.md
│   ├── theming.md
│   ├── events.md
│   └── api-classification.md
├── plugins/
│   └── README.md                 (convention doc — folder intentionally empty, no example plugin yet)
├── dashboard.html, interfaces.html, vpn.html, suricata.html, logs.html
└── assets/
    ├── css/
    │   ├── variables.css          Tier 1 — primitives (color scales, spacing, radius, shadow, motion, type, z-index)
    │   ├── theme.css                Tier 2 — semantic tokens + 5 accents + dark/light mode resolution
    │   ├── base.css                   Reset + global typography
    │   ├── layout.css                  App-shell, grid system, responsive breakpoints
    │   ├── utilities.css                Spacing/type/display helpers (absorbs what would otherwise be inline styles)
    │   ├── animations.css                Named, reusable keyframes (transform/opacity only)
    │   └── components/                    One file per component — card, badge, gauge, button,
    │                                        table, form, sidebar, topbar, charts, toast, modal,
    │                                        tabs, command-palette
    └── js/
        ├── events.js               RaxEvents — pub/sub bus, the only inter-component channel
        ├── registry.js              RaxRegistry — the Extension API core (pages/menu/widgets/commands/search)
        ├── utils.js                  RaxUtils — shared helpers, incl. hexToRgba/readCssVar (Public, Phase E)
        ├── theme.js                    RaxTheme — mode/accent manager + registerTheme() (Phase E)
        ├── plugin-loader.js              RaxPluginLoader — loads plugins/*/index.js before boot() (Phase E)
        ├── charts.js                      RaxCharts — sole Chart.js caller, now with live dataset re-coloring (Phase E)
        ├── notifications.js                RaxNotifications — toast() API
        ├── search.js                        RaxSearch — per-page search provider registry
        ├── command-palette.js                RaxCommandPalette — ⌘K overlay, registry-driven
        ├── navigation.js                      RaxNavigation — mounts Sidebar+Topbar from one config call
        ├── menu-config.js                      Registers all 5 built-in pages' sidebar entries
        ├── commands-config.js                   Registers built-in palette commands (theme/accent)
        ├── core.js                               RaxCore — boot orchestrator, called last on every page
        ├── components/                            Sidebar, Topbar, Card, Widget, Modal, Table, Tabs, Toast
        └── pages/                                  dashboard.js, interfaces.js, vpn.js, suricata.js, logs.js
```

### What changed since Phase B's original plan

- **`menu-config.js` and `commands-config.js`** weren't in Phase B's file tree.
  Both exist to satisfy "one configuration drives navigation/commands" without
  duplicating registration logic per page — see Phase C/D reports for the
  reasoning.
- **`plugin-loader.js`** is new in Phase E — Phase B anticipated a plugin
  system (§6 Extension API) but hadn't designed the loading mechanism yet.
- **`login.html`/`login.css`/`particles.js`** still don't exist. Referenced by
  the original Phase 1 README, flagged as a gap in every phase since, still
  out of scope — no phase's objective list has included building them yet.

---

## Layered CSS architecture

```
1. variables.css   → raw tokens, no semantic meaning
2. theme.css        → resolves tokens into --surface-*/--text-*/--accent/--status-*
                       via two orthogonal attributes: data-mode, data-accent
3. layout.css         → app-shell, grid — semantic roles only, no raw values
4. components/*.css    → one file per component, semantic roles + Tier 3 component tokens only
5. utilities.css        → single-purpose helpers, last so they can override
6. animations.css        → transform/opacity-only keyframes
```

**Hard rule, verified in every phase's audit:** no file below `theme.css` may
declare a raw hex color or an un-derived pixel/shadow value. The one category
of exception, disclosed consistently since the Phase C review: genuinely
per-instance data values expressed as CSS custom properties set via inline
`style` (`--fill`, `--gauge-percent`, and hand-authored diagram-node
coordinates) — these are data, not design decisions, and setting them via
`style="--fill:38"` is the same pattern the framework uses everywhere for
JS-driven visual state (avoids repeated `style.width` writes — see Phase B §7).

## JavaScript architecture

Plain classic scripts (no bundler, no ES module resolution — works from a
static file server or `file://` with zero build step), each module attaching
exactly one global (`RaxEvents`, `RaxRegistry`, etc.) or, for components, one
property on the shared `RaxComponents` namespace. This was a deliberate
Phase B decision (documented in Phase B's risk table) traded off against
Phase E's option to introduce a bundler — revisited and still correct as of
Phase E, since the project still has no build step and no reason to need one
yet.

**Boot sequence** (identical on all 5 pages, verified by diffing script load
order across every HTML file):

```
events → registry → utils → theme → plugin-loader → components/*
  → charts → notifications → search → command-palette
  → navigation → menu-config → commands-config → core
  → pages/<this-page>.js
  → inline: RaxNavigation.mount({...})
  → inline: RaxPluginLoader.loadAll().then(() => RaxCore.boot())
```

Full lifecycle detail — including exactly when a plugin's registrations take
effect relative to page-module boot — is in `docs/plugin-api.md`.

## Extension API (summary — full reference in `docs/plugin-api.md`)

Six registration functions, deliberately spread across the module that owns
that concern rather than centralized into one god-object registry (a risk
Phase B's own risk table flagged in advance):

| Function | Lives in |
|---|---|
| `registerPage` | `RaxRegistry` |
| `registerMenuItem` | `RaxRegistry` |
| `registerWidget` | `RaxRegistry` |
| `registerCommand` | `RaxRegistry` |
| `registerSearchProvider` | `RaxSearch` (aliased on `RaxRegistry` for discoverability) |
| `registerTheme` | `RaxTheme` |

## Event system (summary — full catalog in `docs/events.md`)

9 distinct event names, all reviewed in Phase E: `theme:change`, `toast:show`,
`modal:open`/`modal:close`/`modal:closed`, `search:results`, `registry:change`,
`nav:change`, `sidebar:toggle`. Zero duplicates. Payload shapes standardized
in Phase E (`registry:change` previously had an inconsistent key across its 4
emit sites — fixed additively, no consumer broke).

## Theme engine (summary — full detail + verification in `docs/theming.md`)

Two orthogonal axes (`data-mode`, `data-accent`) resolved entirely in CSS.
Phase E added `RaxTheme.registerTheme()` as a plugin extension point, and
fixed a real gap found during verification: Chart.js dataset colors weren't
following accent changes (only axis text was) — `RaxCharts.create()` now
accepts CSS-variable color bindings that get re-resolved on every
`theme:change`.

## Component contract (summary — full reference in `docs/component-api.md`)

Every `RaxComponents.*` module exports `mount(el, props)` / `update(instance,
props)` / `destroy(instance)`. As of Phase E, all 8 components have real call
sites in the shipped app (Card: 13, Widget: 4, Table: 6, Tabs: 1, Modal/Toast/
Sidebar/Topbar: framework singletons, one each) — none are dormant.

---

## Design principles that held across every phase

1. **No raw values below the token layer.** Enforced by grep in every phase's
   validation pass, not just asserted.
2. **Framework modules stay page-agnostic.** `core.js`, `registry.js`,
   `navigation.js`, `events.js`, `theme.js`, `charts.js` contain zero
   references to `dashboard`/`interfaces`/`vpn`/`suricata`/`logs` outside
   docblock examples — verified by grep every phase since Phase D.
2. **Every debt item gets a name, not a silent drop.** Phases C/D/E each
   produced a technical-debt table; nothing "goes missing" between phases.
3. **No fabricated verification.** Where something couldn't be safely
   verified in this sandboxed environment (SRI hashes, real visual-regression
   screenshots), that limitation is stated plainly rather than papered over.
