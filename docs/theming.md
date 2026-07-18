# RAX Theme — Theming Guide

## Verification

Each claim below was checked against the actual source, not assumed.

| Check | Result |
|---|---|
| **Accent switching** | `RaxTheme.setAccent(name)` sets `data-accent` on `<html>`, which `theme.css`'s `[data-accent="..."]` blocks resolve into `--accent`, `--accent-glow`, and `--chart-series-1..4`. Verified all 5 built-in accents (cyan/emerald/purple/red/orange) have a complete block defining all 4 tokens. |
| **Dark/light mode** | `RaxTheme.setMode(mode)` sets `data-mode` on `<html>`; `theme.css`'s `[data-mode="dark"]`/`[data-mode="light"]` blocks resolve `--surface-*`/`--text-*`/`--border-*`. Verified both blocks define the same token set (no token exists in one mode and not the other — checked by diffing the property names in each block). |
| **CSS token inheritance** | Every `components/*.css` file was grepped for raw hex colors, raw `rgba(...)` literals outside `theme.css`/`variables.css`, and raw pixel shadow/spacing values. None found outside the two token files and the handful of documented per-instance exceptions (diagram node coordinates, `--fill`/`--gauge-percent` data values) documented in `docs/architecture.md`. |
| **Runtime updates** | `theme:change` fires on every `setMode`/`setAccent`/`setCustomAccent`/`toggleMode` call. `charts.js` is the one framework module that must react imperatively (Chart.js bakes colors into canvas draw calls, unlike CSS) — see the fix below. |
| **Every component reacts correctly** | **Gap found and fixed** — see below. |

### Gap found: charts didn't actually follow the accent

Previously, `charts.js`'s `theme:change` handler only updated
`Chart.defaults.color` (the shared axis/tick text color). Each chart's own
dataset `borderColor`/`backgroundColor` were hardcoded hex strings baked into
the config at creation time in each page module — switching accents changed
every card, pill, and CSS-driven bar, but line/bar/doughnut chart colors
stayed frozen at whatever the default cyan theme was.

**Fix:** `RaxCharts.create(canvas, config, meta)` now accepts an optional
third argument:

```js
RaxCharts.create(canvasEl, chartJsConfig, {
  seriesVars: ['--chart-series-1', '--chart-series-2'], // one CSS var per dataset
  fillAlpha: 0.12,                                       // alpha for the translucent fill derived from the same var
});
// — or, for a single-dataset bar/doughnut where each segment has its own meaning:
RaxCharts.create(canvasEl, chartJsConfig, {
  barColorVars: ['--status-danger', '--status-warn', '--chart-series-1'],
});
```

`charts.js` resolves these CSS variables into real colors at creation time
**and** again on every `theme:change`, then calls `chart.update()`. All 5
built-in charts (dashboard's traffic/DNS/sessions, vpn's throughput,
suricata's category breakdown) were migrated to use this — verified by
grepping every `RaxCharts.create(` call site in `assets/js/pages/` for a
third argument.

Note the deliberate distinction used in the bindings: series that represent
"the current accent" use `--chart-series-N` (which changes with accent),
while series that represent a fixed semantic meaning (danger/warn/ok,
regardless of accent) use `--status-*` (which, per `theme.css`'s own design,
**never** changes with accent — only with nothing, since status colors are
intentionally accent-invariant). Suricata's category chart mixes both in one
chart correctly: Malware bars stay `--status-danger` red even if the person
switches to the purple accent, while the Policy bar (which represents "normal,
accent-colored" activity) follows the accent.

---

## How to change the theme (for people using RAX Theme)

- **Dark/light:** click the sun/moon icon in the topbar, or open the command
  palette (`Ctrl/Cmd+K`) and run "Toggle Theme."
- **Accent:** open the command palette and run "Cycle Accent Color" (cycles
  cyan → emerald → purple → red → orange → cyan...).
- Both choices persist across page loads via `localStorage` (key `rax-theme`).

## How to add a theme (for plugin authors)

Two mechanisms exist, for two different needs:

### `setCustomAccent(hex)` — one-off, unnamed

```js
RaxTheme.setCustomAccent('#FF00AA');
```
Sets `--accent` and a derived `--accent-glow` directly. Not persisted under a
reusable name — if the person picks a different accent and comes back, this
color is gone. Good for a live color-picker UI, not for a plugin that wants to
offer a named "Midnight Rose" theme in the accent list.

### `RaxTheme.registerTheme(name, def)` — named, reusable

```js
RaxTheme.registerTheme('midnight-rose', {
  accent: '#FF2D78',
  accentGlow: 'rgba(255,45,120,0.35)',       // optional — derived automatically if omitted
  chartSeries: ['#FF2D78', '#00D9FF', '#FFC857', '#5A6577'], // optional
});

RaxTheme.setAccent('midnight-rose');
```

**Lifecycle requirement:** `registerTheme()` must run **before**
`RaxCore.boot()` calls `RaxTheme.init()` — i.e., from a plugin script loaded
via `RaxPluginLoader` (see `docs/plugin-api.md`), not from a page module's own
`init()` (which runs after theme init has already resolved). If a person has
`'midnight-rose'` persisted from a previous visit but the plugin that
registers it isn't loaded this time, `theme.js` fails safe to the `'cyan'`
default rather than rendering with unresolved tokens — this was verified by
tracing `apply()`'s fallback branch, not assumed.

You cannot register a theme using one of the 5 built-in accent names
(`cyan`/`emerald`/`purple`/`red`/`orange`) — `registerTheme()` rejects it with
a console error, to prevent a plugin from silently reskinning the built-in
defaults out from under every other page.
