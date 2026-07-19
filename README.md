<div align="center">

# RAX Theme

**Modern OPNsense-inspired Dashboard Framework**

A production-quality, enterprise-grade Security Operations Center (SOC) theme and
component framework for OPNsense — no build step, no bundler, no framework
dependency.

</div>

---

## Overview

RAX Theme is a self-contained frontend framework for building OPNsense-style
network dashboards. It ships with 5 complete console pages (Dashboard,
Interfaces & VLANs, VPN & Tailscale, Suricata IDS/IPS, and Logs & Tables), a
token-driven design system with 5 built-in accent themes plus dark/light mode,
a small reusable component library, and a documented Extension API so other
developers can add pages, widgets, commands, and search behavior without
touching the framework's own source.

The visual language is inspired by next-generation firewall and XDR
interfaces — Palo Alto, Cisco Secure, Fortinet, CrowdStrike Falcon, Microsoft
Defender XDR — deliberately **professional and minimal**, not a "movie
hacker" theme.

### A note on naming

Every framework module attaches exactly one global, prefixed `Rax`:
`RaxTheme`, `RaxRegistry`, `RaxCharts`, `RaxEvents`, and so on — you'll see
this convention throughout the code samples below and across `docs/`.
Reusable UI pieces (`Card`, `Widget`, `Table`...) are properties on a shared
`RaxComponents` namespace instead of their own globals, e.g.
`RaxComponents.Card.mount(...)`.

## Features

- **5 built-in console pages** — Dashboard, Interfaces & VLANs, VPN & Tailscale,
  Suricata IDS/IPS, Logs & Tables (firewall logs, DHCP leases, aliases, NAT rules)
- **Zero build step** — plain HTML + classic `<script>` tags, runs from any
  static file server with no bundler, no `npm install` (see Installation
  below for the one caveat around opening files directly via `file://`)
- **Token-driven design system** — a 3-tier CSS custom property architecture
  (primitive → semantic → component) means every color, spacing value, radius,
  shadow, and timing curve lives in exactly one place
- **5 built-in accent themes** (cyan, emerald, purple, red, orange) + dark/light
  mode, switchable at runtime with zero page reload, plus a plugin API for
  registering additional named themes
- **Reusable component library** — Card, Widget (ring gauges), Table (sortable),
  Tabs, Modal, Toast, Sidebar, Topbar — each with a uniform `mount/update/destroy`
  contract
- **Command palette** (`Ctrl/Cmd+K`) and per-page search, both driven by the
  same registry a plugin uses
- **Documented Extension API** — register pages, menu items, widgets,
  commands, search providers, themes, settings pages, notifications, and
  permissions, without editing a single framework file
- **Provider-based auth extension point** — plug in any authentication
  system (or none); RAX Theme ships no login page, no backend, and no
  access control until a host application registers a provider
- **Accessibility-first** — every icon labeled, every control keyboard-operable,
  focus-trapped modals/palette, `prefers-reduced-motion` and `prefers-contrast`
  both respected
- **Chart.js integration isolated behind one module** (`RaxCharts`) — no page
  or plugin ever calls `new Chart()` directly, and dataset colors follow the
  active accent automatically

## Screenshots

> _Screenshots pending — add rendered captures of each of the 5 pages here
> before the v1.0.0 tag. Suggested set:_
> - `docs/screenshots/dashboard.png`
> - `docs/screenshots/interfaces.png`
> - `docs/screenshots/vpn.png`
> - `docs/screenshots/suricata.png`
> - `docs/screenshots/logs.png`
> - `docs/screenshots/dark-vs-light.png` (mode comparison)
> - `docs/screenshots/accents.png` (all 5 accent themes side by side)

## Architecture overview

RAX Theme is built as a set of small, single-responsibility JavaScript
modules (no bundler — each attaches one global, e.g. `RaxRegistry`,
`RaxTheme`, `RaxCharts`) plus a layered CSS token system. Full details,
including a diagram, are in [`docs/architecture.md`](docs/architecture.md).

```
Design tokens (CSS)          Framework core (JS)             Components
─────────────────────        ───────────────────────         ─────────────────
variables.css (Tier 1)        RaxEvents    — pub/sub bus       Card, Widget,
theme.css (Tier 2)             RaxRegistry — Extension API      Table, Tabs,
layout / utilities /            RaxTheme    — accent/mode        Modal, Toast,
animations / components/         RaxCharts   — Chart.js gateway   Sidebar, Topbar
                                   RaxCore     — boot orchestrator
                                    RaxPluginLoader — plugin loading
```

## Folder structure

```
rax-theme/
├── README.md, LICENSE, CONTRIBUTING.md, CHANGELOG.md, ROADMAP.md,
│   CODE_OF_CONDUCT.md, SECURITY.md
├── .github/
│   ├── ISSUE_TEMPLATE/            bug_report.md, feature_request.md
│   ├── DISCUSSION_TEMPLATE/       ideas.md
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   ├── README.md                   documentation index — start here
│   ├── architecture.md            system design, layered CSS, boot sequence
│   ├── project-structure.md       annotated file-by-file folder guide
│   ├── component-api.md           every RaxComponents.* contract
│   ├── plugin-api.md              the Extension API + lifecycle
│   ├── auth-api.md                auth provider extension API (no built-in auth)
│   ├── theming.md                 accent/mode system + registerTheme()
│   ├── events.md                  the full framework event catalog
│   └── api-classification.md      Public / Internal / Private, per export
├── plugins/
│   └── README.md                  plugin folder convention
├── examples/
│   └── hello-plugin/               worked Extension API example
├── dashboard.html, interfaces.html, vpn.html, suricata.html, logs.html
└── assets/
    ├── css/                       variables, theme, layout, utilities,
    │                              animations, base, components/*.css
    └── js/                        events, registry, theme, charts, core,
                                    navigation, notifications, search,
                                    command-palette, plugin-loader,
                                    menu-config, commands-config,
                                    components/*.js, pages/*.js
```

Full annotated version: [`docs/project-structure.md`](docs/project-structure.md).

## Installation

No build step, no package manager. Clone or download the repository, then
serve it with any static file server:

```bash
# TODO: replace with the actual repository URL once published
git clone https://github.com/<org>/rax-theme.git
cd rax-theme
python3 -m http.server 8080
# then open http://localhost:8080/dashboard.html
```

Any static host works equally well (nginx, Caddy, GitHub Pages, or OPNsense's
own web server once integrated as a theme).

**Does it work by just double-clicking `dashboard.html` (`file://`), with no
server at all?** Mostly yes, with one caveat: every script and stylesheet
loads via plain relative paths and `<script src>` tags (no `fetch()`/XHR
anywhere in the framework), which browsers load fine from `file://`. The one
thing that can behave differently is theme/accent persistence across page
reloads, which uses `localStorage` — some browsers restrict storage APIs
under the `file://` origin. If that happens, the app still works correctly;
your theme choice just won't be remembered between visits. **For guaranteed
full functionality, use the server command above** — it costs one extra
terminal command and removes any ambiguity.

## Quick start

Once the app is running (see Installation above), open
[`dashboard.html`](dashboard.html):

- Use the sidebar to visit the other 4 pages.
- Press **`Ctrl/Cmd+K`** to open the command palette — try "Toggle Theme" or
  "Cycle Accent Color."
- Use the search box in the topbar on any page — it filters that page's real
  content (tables, VLAN cards), not fake data.
- Click a sortable table column header (Top Clients, Tailnet Peers, Recent
  Alerts, and every table on the Logs page) to sort it.

## Theme system

Two independent axes — **mode** (`dark`/`light`) and **accent** (`cyan`/
`emerald`/`purple`/`red`/`orange`) — resolved entirely through CSS custom
properties on `<html data-mode="..." data-accent="...">`. Switching either
takes effect instantly, with no reload, including live re-coloring of every
Chart.js graph on the page.

```js
RaxTheme.setMode('light');
RaxTheme.setAccent('emerald');
RaxTheme.registerTheme('midnight-rose', { accent: '#FF2D78' }); // plugin-defined theme
```

Full guide, including the token architecture and the `registerTheme()`
lifecycle contract: [`docs/theming.md`](docs/theming.md).

## Plugin system

A plugin is a plain script that registers itself through the public
[Extension API](docs/plugin-api.md) — pages, menu items, commands, search
providers, widgets, and themes — without ever editing a framework file:

```js
// plugins/my-plugin/index.js
(function (global) {
  'use strict';
  global.RaxRegistry.registerPage({ id: 'my-plugin', title: 'My Plugin', init: init, destroy: function () {} });
  global.RaxRegistry.registerMenuItem({ pageId: 'my-plugin', href: 'my-plugin.html', icon: 'puzzle', label: 'My Plugin', section: 'Plugins' });
  function init() { /* ... */ }
})(window);
```

```html
<!-- in any page's <head>, before plugin-loader.js runs -->
<script>window.RAX_PLUGINS = ['plugins/my-plugin/index.js'];</script>
```

`RaxPluginLoader` loads every declared plugin before `RaxCore.boot()` runs, so
registrations are always in place before the sidebar renders and the active
page module boots. A complete, runnable example using `registerPage`,
`registerWidget`, and `registerCommand` is in
[`examples/hello-plugin/`](examples/hello-plugin/). Full reference, including
the complete lifecycle diagram: [`docs/plugin-api.md`](docs/plugin-api.md).

## Authentication

RAX Theme ships **no login page and no authentication backend** — instead, a
provider-based extension point (`RaxAuth`) lets a host application plug in
whatever auth system it already has:

```js
RaxAuth.registerProvider({
  currentUser: function () { /* return the current user, or null */ },
  hasPermission: function (id, user) { /* real permission check */ },
  beforeRoute: function (pageId, user) { /* return false to block */ },
  // login, logout, afterLogin, afterLogout are also supported
});
```

With no provider registered — the state of every page in this repository —
`hasPermission()` returns `true` and `beforeRoute()` never blocks, so nothing
about existing behavior changes until a host application opts in. Full
reference: [`docs/auth-api.md`](docs/auth-api.md).

## Component system

Every reusable UI piece follows one contract:

```js
var instance = RaxComponents.Card.mount(el, props);
RaxComponents.Card.update(instance, newProps);
RaxComponents.Card.destroy(instance);
```

Available components: `Card`, `Widget` (ring gauges), `Table` (sortable
enhancement), `Tabs`, `Modal`, `Toast`. `Sidebar`/`Topbar` are framework-owned
singletons — see [`docs/component-api.md`](docs/component-api.md) for every
component's exact `props` shape and which ones are safe for a plugin to mount
directly.

## Browser support

Built on modern, broadly-supported web platform features:

- CSS custom properties, CSS Grid, `color-mix()` (Chrome/Edge 111+, Firefox
  113+, Safari 16.2+)
- `IntersectionObserver` (used for lazy chart loading — degrades gracefully to
  eager loading if unavailable)
- ES6+ JavaScript (`Promise`, arrow-free but `const`/`let`-free by convention —
  written in ES5-compatible function syntax throughout for maximum
  compatibility without a transpiler)

No IE11 support. No polyfills are bundled — if you need to support an older
browser, `color-mix()` is the most likely feature to require a fallback.

## Documentation

Start at [`docs/README.md`](docs/README.md) for the full documentation index
and recommended reading order. Most frequently needed while building
something:

- [`docs/api-classification.md`](docs/api-classification.md) — every
  exported function, classified Public/Internal/Private, with why.
- [`docs/plugin-api.md`](docs/plugin-api.md) — the complete Extension API
  reference and plugin lifecycle.
- [`docs/auth-api.md`](docs/auth-api.md) — the auth provider extension API.
- [`docs/component-api.md`](docs/component-api.md) — every `RaxComponents.*`
  contract and `props` shape.

## Roadmap

See [`ROADMAP.md`](ROADMAP.md) for what's done and what's planned next (CI,
visual regression testing, dashboard widget customization).

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for setup, coding conventions, and
the PR process. Please also read [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## License

MIT — see [`LICENSE`](LICENSE).
