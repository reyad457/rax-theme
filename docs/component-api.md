# RAX Theme — Component API Reference

Every component in `RaxComponents` follows the same three-function contract:

```js
var instance = RaxComponents.<Name>.mount(el, props);
RaxComponents.<Name>.update(instance, newProps);
RaxComponents.<Name>.destroy(instance);
```

`el` is always an existing DOM element the component renders into (never
creates itself). `mount` returns an opaque `instance` object — treat it as a
handle, not a data structure to read fields from (its shape may change; only
`update`/`destroy` are guaranteed to accept it back).

---

## Card (`components/card.js`)

The StatCard pattern: title + optional status pill + value (+ optional
suffix) + label.

```js
RaxComponents.Card.mount(el, {
  title: 'Firewall Status',
  value: '3,412',
  valueSuffix: ' rules',        // optional, rendered in a smaller tertiary span
  label: 'rules active · 0 conflicts',
  status: { type: 'ok', label: 'Protected', dot: true }, // type: ok|warn|danger|info; dot defaults true
  glow: 'green',                 // optional: 'cyan' | 'green'
});
```

Live on 13 instances across `dashboard.html`, `interfaces.html`, `vpn.html`,
`suricata.html`.

**Not a fit for:** any card whose header needs something other than a status
pill (e.g. a toggle switch) — see `pages/suricata.js`'s documented exception
for the Engine Mode card. Extend a page's own markup for those, don't grow
Card's contract to fit one special case.

## Widget (`components/widget.js`)

The ring-gauge pattern (0–100 value, SVG stroke-dashoffset driven by a single
`--gauge-percent` CSS custom property).

```js
RaxComponents.Widget.mount(el, {
  label: 'CPU Load',
  value: 34,
  unit: '%',                    // optional, default '%'
  ariaLabel: 'CPU load: 34 percent', // optional override for the generated aria-label
  sublabel1: 'Intel i3 3rd gen',
  sublabel2: '4 threads · 1.2 GHz avg',
});
```

Live on all 4 dashboard vitals gauges (CPU/Memory/Disk/Temperature).

## Modal (`components/modal.js`)

Singleton `ModalHost`, mounted once by `core.js`. Don't mount this yourself —
trigger it via events instead:

```js
RaxEvents.emit('modal:open', { title: 'Confirm', body: 'Are you sure?' });
// ...later, to force-close programmatically:
RaxEvents.emit('modal:close');
```

Focus-trapped, restores focus to whatever triggered it on close, dismissible
via Esc/backdrop click/close button. See `docs/events.md` for the full
`modal:*` event trio.

## Table (`components/table.js`)

Progressive enhancement over existing `.data-table` markup — does not
generate table markup itself.

```js
RaxComponents.Table.mount(containerEl, { sortable: true });
```

`containerEl` can be a single table's wrapper or any ancestor containing
multiple `.data-table` elements (e.g. `logs.js` mounts it once against
`main.page` to sort all 4 tab tables in one call). Adds `role="button"`,
`tabindex="0"`, and `aria-sort` to each `<th>`; click or Enter/Space to sort.

**Not a fit for:** matrix-shaped tables where row order is semantically
meaningful (e.g. `interfaces.html`'s inter-VLAN isolation matrix) — sorting
would break the row/column correspondence.

## Tabs (`components/tabs.js`)

Progressive enhancement over existing `.tabbar`/`.tab-btn`/`.tab-panel`
markup — adds `role="tablist"/"tab"/"tabpanel"`, `aria-selected`,
`aria-controls`, arrow-key navigation, and optional hash-routing.

```js
RaxComponents.Tabs.mount(containerEl, {
  hashMap: { rules: 'fwlogs', dhcp: 'dhcp', aliases: 'aliases', nat: 'nat' }, // optional
});
```

## Toast (`components/toast.js`)

Singleton `ToastStack`, mounted once by `core.js`. Don't mount this yourself
— use `RaxNotifications.toast()` / `.ok()` / `.warn()` / `.danger()` / `.info()`
instead (see `docs/plugin-api.md`).

---

## Framework-owned singletons (do not mount yourself)

`RaxComponents.Sidebar` and `RaxComponents.Topbar` are mounted exactly once,
by `navigation.js`, when a page calls `RaxNavigation.mount({...})`. Calling
`.mount()` on these yourself will create a second sidebar/topbar in the DOM.
If you need the sidebar to reflect a new menu item, use
`RaxRegistry.registerMenuItem()` — `Sidebar` automatically re-renders on
`registry:change` (see `docs/events.md`).
