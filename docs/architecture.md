# RAX Theme — Architecture

*RAX Theme — Modern OPNsense-inspired Dashboard Framework*

This document describes the system as it currently stands: the layered CSS
token system, the framework's core JavaScript modules, the boot sequence,
and the design decisions behind each. For deep dives on specific subsystems,
see the companion docs in this folder: `component-api.md`, `plugin-api.md`,
`theming.md`, `events.md`, `api-classification.md`, `project-structure.md`
(file-by-file guide), and `architecture-diagram.md` (the same architecture as
Mermaid diagrams). Start with `docs/README.md` if this is your first time in
this folder.

---

## Folder structure

```
rax-theme/
├── README.md, LICENSE, CONTRIBUTING.md, CHANGELOG.md, ROADMAP.md
├── docs/
│   ├── README.md                (start here)
│   ├── architecture.md          (this file)
│   ├── component-api.md
│   ├── plugin-api.md
│   ├── theming.md
│   ├── events.md
│   └── api-classification.md
├── plugins/
│   └── README.md                 (convention doc)
├── examples/
│   └── hello-plugin/              (worked Extension API example)
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
        ├── utils.js                  RaxUtils — shared helpers, incl. hexToRgba/readCssVar
        ├── theme.js                    RaxTheme — mode/accent manager + registerTheme()
        ├── plugin-loader.js              RaxPluginLoader — loads plugins/*/index.js before boot()
        ├── charts.js                      RaxCharts — sole Chart.js caller, with live dataset re-coloring
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

### Notable design decisions worth knowing up front

- **`menu-config.js` and `commands-config.js`** exist as single, dedicated
  files so navigation and command-palette entries are each driven from one
  configuration point rather than duplicated per page.
- **`plugin-loader.js`** loads plugin scripts declared via `window.RAX_PLUGINS`
  before `RaxCore.boot()` runs, so a plugin's registrations are always in
  place before the sidebar renders and the active page module boots — see
  `docs/plugin-api.md` for the full lifecycle.
- **`login.html`/`login.css`/`particles.js` do not exist yet.** RAX Theme
  currently assumes it renders inside an already-authenticated context (e.g.
  OPNsense's own login). Tracked in `ROADMAP.md` as an open scope decision,
  not an oversight.

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

**Hard rule, enforced by the project's own validation checks (see
`CONTRIBUTING.md`):** no file below `theme.css` may declare a raw hex color
or an un-derived pixel/shadow value. The one category of exception: genuinely
per-instance data values expressed as CSS custom properties set via inline
`style` (`--fill`, `--gauge-percent`, and hand-authored diagram-node
coordinates) — these are data, not design decisions, and setting them via
`style="--fill:38"` is the same pattern the framework uses everywhere for
JS-driven visual state (this avoids repeated `style.width` writes, which
would otherwise trigger a style recalculation on every update).

## JavaScript architecture

Plain classic scripts (no bundler, no ES module resolution — works from a
static file server or `file://` with zero build step), each module attaching
exactly one global (`RaxEvents`, `RaxRegistry`, etc.) or, for components, one
property on the shared `RaxComponents` namespace. This is a deliberate
trade-off: it keeps the project buildless and trivially easy to fork/deploy,
at the cost of not getting tree-shaking or minification for free. See
`README.md`'s Browser Support section for what this does and doesn't support.

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
that concern rather than centralized into one god-object registry:

| Function | Lives in |
|---|---|
| `registerPage` | `RaxRegistry` |
| `registerMenuItem` | `RaxRegistry` |
| `registerWidget` | `RaxRegistry` |
| `registerCommand` | `RaxRegistry` |
| `registerSearchProvider` | `RaxSearch` (aliased on `RaxRegistry` for discoverability) |
| `registerTheme` | `RaxTheme` |

A worked example using the first three of these is in
[`examples/hello-plugin/`](../examples/hello-plugin/).

## Event system (summary — full catalog in `docs/events.md`)

9 distinct event names: `theme:change`, `toast:show`, `modal:open`/
`modal:close`/`modal:closed`, `search:results`, `registry:change`,
`nav:change`, `sidebar:toggle`. Zero duplicates. Every `registry:change` emit
consistently includes an `id` field regardless of which kind of registration
triggered it.

## Theme engine (summary — full detail + verification in `docs/theming.md`)

Two orthogonal axes (`data-mode`, `data-accent`) resolved entirely in CSS.
`RaxTheme.registerTheme()` lets a plugin register a named, reusable accent.
Chart.js dataset colors (line/bar/doughnut fill and border colors) follow
accent switching via `RaxCharts.create()`'s CSS-variable color bindings,
re-resolved on every `theme:change` — not just the shared axis/tick text
color.

## Component contract (summary — full reference in `docs/component-api.md`)

Every `RaxComponents.*` module exports `mount(el, props)` / `update(instance,
props)` / `destroy(instance)`. All 8 components have real call sites in the
shipped app (Card: 13, Widget: 4, Table: 6, Tabs: 1, Modal/Toast/Sidebar/
Topbar: framework singletons, one each) — none are dormant.

---

## Design principles

1. **No raw values below the token layer.** Enforced by the validation
   checks in `CONTRIBUTING.md`, not just asserted.
2. **Framework modules stay page-agnostic.** `core.js`, `registry.js`,
   `navigation.js`, `events.js`, `theme.js`, `charts.js` contain zero
   references to `dashboard`/`interfaces`/`vpn`/`suricata`/`logs` outside
   docblock examples.
3. **Technical debt gets a name, not a silent drop.** See `ROADMAP.md` for
   the current list of known gaps and what's planned to close them.
4. **No fabricated verification.** Where something can't be verified in a
   given environment (e.g. SRI hash generation requires network access to
   the CDN origins), that limitation is stated plainly rather than papered
   over — see `ROADMAP.md` and `SECURITY.md`.
