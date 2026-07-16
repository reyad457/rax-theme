# RAX Theme — Project Structure

An annotated, file-by-file guide. For *why* the structure looks like this,
see [`architecture.md`](architecture.md); this file is a reference for
"where do I put/find X."

```
rax-theme/
│
├── README.md                    Public-facing overview — start here
├── LICENSE                      MIT
├── CONTRIBUTING.md              Setup, coding conventions, PR process
├── CHANGELOG.md                 Phase-by-phase history (pre-1.0 versioning)
├── ROADMAP.md                   What's done, what's next, what's exploratory
├── CODE_OF_CONDUCT.md           Contributor Covenant v2.1
├── SECURITY.md                  Vulnerability reporting process
├── RELEASE_NOTES_v1.md          What v1.0.0 will contain
├── FIRST_RELEASE_CHECKLIST.md   Gate checklist before tagging v1.0.0
│
├── PHASE-*-*.md                 Historical phase reports (audit, architecture,
│                                 migration, technical debt, readiness) — kept
│                                 for provenance; CHANGELOG.md is the
│                                 human-readable summary of the same history
│
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── DISCUSSION_TEMPLATE/
│   │   └── ideas.md
│   └── PULL_REQUEST_TEMPLATE.md
│
├── docs/
│   ├── architecture.md           System design: layered CSS, module list, boot sequence
│   ├── architecture-diagram.md   Mermaid diagram of the same
│   ├── project-structure.md      This file
│   ├── component-api.md          Every RaxComponents.* contract + props shape
│   ├── plugin-api.md             Extension API reference + lifecycle diagram
│   ├── theming.md                Accent/mode system, registerTheme(), verification results
│   ├── events.md                 Every framework event: emitter, payload, consumer
│   └── api-classification.md     Every export classified Public/Internal/Private
│
├── plugins/
│   └── README.md                 Plugin folder convention — intentionally no example yet
│
├── dashboard.html                5 built-in console pages. Each is self-contained:
├── interfaces.html                own <head> (fonts, Lucide, Chart.js only if charted),
├── vpn.html                        own script load order, own inline bootstrap calling
├── suricata.html                    RaxNavigation.mount() + RaxPluginLoader.loadAll()
├── logs.html                         .then(RaxCore.boot)
│
└── assets/
    ├── css/
    │   ├── variables.css          Tier 1: raw primitives (color scales, spacing, radius,
    │   │                          shadow, motion, type, z-index) — no semantic meaning
    │   ├── theme.css                Tier 2: semantic tokens + 5 accents + dark/light —
    │   │                            the ONLY file that may reference a Tier 1 primitive
    │   ├── base.css                   Reset + global typography
    │   ├── layout.css                  App-shell, grid system, responsive breakpoints
    │   ├── utilities.css                Spacing/type/display helper classes
    │   ├── animations.css                Named keyframes (transform/opacity only)
    │   └── components/
    │       ├── card.css                   Card, StatCard, VlanCard, FeedCard, PortStrip, NetworkMap
    │       ├── badge.css                   Status pill (.pill-ok/warn/danger/info)
    │       ├── gauge.css                    Ring gauge (GaugeWidget)
    │       ├── button.css                    .btn / .btn-primary / .btn-ghost
    │       ├── table.css                      DataTable + sortable-column affordance
    │       ├── form.css                        Toggle switch
    │       ├── sidebar.css                      Primary navigation
    │       ├── topbar.css                        Title/breadcrumb/search/palette-trigger/theme-toggle
    │       ├── charts.css                         Chart canvas mount + bar-fill/severity-row primitives
    │       ├── toast.css                           ToastStack
    │       ├── modal.css                            ModalHost
    │       ├── tabs.css                              Tabbed views
    │       └── command-palette.css                    ⌘K overlay
    │
    └── js/
        ├── events.js               RaxEvents — pub/sub bus (load 1st)
        ├── registry.js              RaxRegistry — Extension API core (load 2nd)
        ├── utils.js                  RaxUtils — shared helpers incl. hexToRgba/readCssVar
        ├── theme.js                    RaxTheme — mode/accent manager + registerTheme()
        ├── plugin-loader.js              RaxPluginLoader — loads plugins/*/index.js
        ├── charts.js                      RaxCharts — sole Chart.js caller
        ├── notifications.js                RaxNotifications — toast() API
        ├── search.js                        RaxSearch — per-page search provider registry
        ├── command-palette.js                RaxCommandPalette — ⌘K overlay logic
        ├── navigation.js                      RaxNavigation — mounts Sidebar+Topbar
        ├── menu-config.js                      Registers all 5 built-in pages' sidebar entries
        ├── commands-config.js                   Registers built-in palette commands
        ├── core.js                               RaxCore — boot orchestrator (load & call last)
        ├── components/
        │   ├── sidebar.js, topbar.js               Framework-owned singletons
        │   ├── card.js, widget.js                    Public, reusable
        │   ├── modal.js, toast.js                      Framework-owned singletons
        │   └── table.js, tabs.js                         Public, progressive enhancement
        └── pages/
            ├── dashboard.js         Gauges, 3 charts, Top Clients table+search
            ├── interfaces.js         VLAN/port summary cards + search
            ├── vpn.js                  Peers table+search, throughput chart
            ├── suricata.js              Alerts table+search, category chart
            └── logs.js                   Tabs + all 4 tab tables sortable+searchable
```

## Where do I add a new...

| I want to add | Where |
|---|---|
| A new page, menu item, command, search behavior, widget, or theme | A plugin in `plugins/<name>/` — see `docs/plugin-api.md`. Not a framework file. |
| A new reusable UI component | `assets/js/components/<name>.js` + `assets/css/components/<name>.css`, following the `mount/update/destroy` contract — see `docs/component-api.md`. |
| A new design token | `assets/css/variables.css` (if it's a genuinely new primitive) or `assets/css/theme.css` (if it's a new semantic role built from existing primitives). Never invent a raw value inside a component file. |
| A new framework event | Document it in `docs/events.md` first, following the `noun:verb` convention, then implement the emit/listen pair. |
