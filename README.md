# RAX Theme

A futuristic front-end skin for an OPNsense-style dashboard, built as a static HTML/CSS/JS
prototype. Open `login.html` or `dashboard.html` directly in a browser — no build step needed.

## What's here

```
rax-theme/
├── login.html           Animated sign-in screen (canvas particles + CSS grid)
├── dashboard.html       Main SOC dashboard (all requested widgets)
├── logs.html            Modern data tables: firewall logs, DHCP, aliases, NAT
├── vpn.html             VPN & Tailscale: peers, exit-node routes, throughput, connection history
├── interfaces.html      Interfaces & VLAN config: physical ports, per-VLAN cards, isolation matrix
├── suricata.html        Dedicated Suricata alerts view: severity, categories, top rules, alert log
├── css/
│   ├── variables.css    Every color, radius, shadow, font, timing — one source of truth
│   ├── base.css         Reset + global typography + reduced-motion handling
│   ├── components.css   Sidebar, topbar, cards, gauges, tables, buttons, feed, VLAN cards, etc.
│   └── login.css        Login-screen-only styles
└── js/
    ├── nav.js            Shared sidebar + topbar template — injected on every console page
    ├── app.js            Live clock, sidebar collapse, button ripple, entrance animation
    ├── particles.js      Canvas particle field for the login background
    └── dashboard.js      Ring gauges + Chart.js graphs (traffic, DNS, sessions)
```

### Shared navigation

Every console page (all but `login.html`) has two empty mount points instead of duplicated markup:

```html
<aside class="sidebar" id="sidebar-mount"></aside>
...
<header class="topbar" id="topbar-mount"></header>
...
<script src="js/nav.js"></script>
<script>RaxNav.mount({ active: 'vpn', title: 'VPN & Tailscale', crumb: '/ Network / VPN' });</script>
```

`js/nav.js` renders the full nav list once and marks the current page active — so adding a page or
renaming a nav item is now a one-line change in `nav.js` instead of an edit across six files.

## Design tokens (from the brief)

| Token | Value |
|---|---|
| Background | `#090B10` |
| Card | `#11161D` |
| Accent (cyan) | `#00D9FF` |
| Accent (green) | `#00FF9D` |
| Warning | `#FFC857` |
| Danger | `#FF3B5C` |
| Radius | `16px` cards, `12px` inputs, `8px` buttons |
| Fonts | Inter (UI), JetBrains Mono (IPs, logs, stats) |

Everything reads from `css/variables.css`, so a palette or radius change is a one-file edit.

## Wiring this to real OPNsense data

This prototype uses mock numbers so it renders standalone. To make it live without touching
any OPNsense PHP:

1. **Keep the OPNsense backend untouched.** This is a presentation layer only — it doesn't
   replace `/usr/local/www`, it's a separate app that talks to OPNsense over its existing API.
2. Point it at the **OPNsense REST API** (Firewall → Settings → API accounts, or `os-api` module)
   for firewall status, interfaces, gateway health, and DHCP leases.
3. Pull **Suricata** and **CrowdSec** stats either from their own APIs/log files, or — since you're
   already planning NetPulse — have a small Flask service poll OPNsense/Suricata/CrowdSec/AdGuard
   Home and expose one clean JSON endpoint each widget below can call:
   - `/api/status` → the 4 summary cards
   - `/api/vitals` → CPU / RAM / disk / temp gauges
   - `/api/traffic?range=24h` → the traffic graph
   - `/api/dns` → the DNS donut
   - `/api/threats` → threat feed + blocked-IP count
   - `/api/sessions` → sessions-by-VLAN bar chart
4. In `js/dashboard.js`, swap the mock arrays (`down`, `up`, the doughnut `data`, etc.) for
   `fetch()` calls to those endpoints, then re-run the same Chart.js/gauge code — the rendering
   logic doesn't need to change, just the data source.
5. For the tables in `logs.html`, replace the hard-coded `<tr>` rows with rows rendered from
   the firewall log / lease / alias / NAT API responses — the CSS classes (`pill-ok`,
   `pill-danger`, `.mono`, `.ip`) already encode the right styling per value.

## Notes

- All charts use Chart.js (loaded from cdnjs) and Lucide icons (loaded from unpkg) — both free, no
  API keys.
- Respects `prefers-reduced-motion`.
- Sidebar collapse, clock, ripple, and card entrance animation are all vanilla JS in `app.js` —
  no framework dependency, so it's easy to drop into whatever templating OPNsense's `legacy` or
  custom theme system ends up using.
