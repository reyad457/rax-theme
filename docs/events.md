# RAX Theme — Event Catalog

Every event name that exists anywhere in the framework. Built by grepping every `RaxEvents.emit(`/`.on(`/`.once(` call site in
`assets/js/` — this list is exhaustive, not illustrative.

All events go through `RaxEvents` (`assets/js/events.js`) — `on(name, handler)`,
`once(name, handler)`, `off(name, handler)`, `emit(name, payload)`.

---

## Naming convention

Event names follow `noun:verb` (e.g. `theme:change`, `toast:show`). A few
pre-existing names mix imperative and past-tense verbs (`modal:close` vs.
`modal:closed`); this is a **deliberate, not accidental**, pair — see the
Modal section below. Event names are treated as part of the stable Public
API (see `docs/api-classification.md`) and are not renamed once shipped.
New events introduced by the framework going forward should
follow `noun:verb` for actions and `noun:verb-past` for after-the-fact
notifications, matching the Modal pair.

---

## `theme:change`

- **Emitted by:** `theme.js`, on every `setMode`, `setAccent`, `setCustomAccent`,
  and `toggleMode` call (and once more, internally, if a late-registered theme
  matches the currently-applied accent name).
- **Payload:** `{ mode: 'dark'|'light', accent: string }`
- **Consumed by:** `charts.js` (re-resolves axis text color and every chart's
  bound dataset colors — see `docs/theming.md`).
- **Available for:** any plugin widget that draws its own canvas/SVG and needs
  to know when to re-read CSS custom properties.

## `auth:login`

- **Emitted by:** `auth.js`, from `RaxAuth.login()`, after the registered
  provider's `login()` (and `afterLogin()`, if defined) resolve successfully.
- **Payload:** `{ user: <whatever the provider's login() resolved to> }`
- **Consumed by:** nothing in the built-in framework today.
- **Status:** available for plugin use — e.g. a plugin widget that shows a
  "Welcome back" toast or refreshes user-specific data. See `docs/auth-api.md`.

## `auth:logout`

- **Emitted by:** `auth.js`, from `RaxAuth.logout()`, after the registered
  provider's `logout()` (and `afterLogout()`, if defined) resolve successfully.
- **Payload:** none.
- **Consumed by:** nothing in the built-in framework today.
- **Status:** available for plugin use, same reasoning as `auth:login`.

## `auth:change`

- **Emitted by:** `auth.js`, after every successful `registerProvider()`,
  `login()`, and `logout()` call — a single, generic "auth state may have
  changed" signal for code that doesn't care *which* of the three happened,
  only that it should re-check `RaxAuth.currentUser()`/`hasPermission()`.
- **Payload:** `{ reason: 'provider-registered'|'login'|'logout' }`
- **Consumed by:** nothing in the built-in framework today.
- **Status:** available for plugin use — e.g. a sidebar item that shows/hides
  itself based on the current permission set would listen here rather than
  duplicating listeners on both `auth:login` and `auth:logout`.

## `toast:show`

- **Emitted by:** `notifications.js`, from `RaxNotifications.toast()`.
- **Payload:** `{ message: string, type: 'ok'|'warn'|'danger'|'info', duration?: number }`
- **Consumed by:** `components/toast.js` (the sole listener — this is the only
  thing that renders a toast).

## `modal:open`

- **Emitted by:** nothing in the built-in framework today — this is the trigger
  a page or plugin uses to summon the modal.
- **Payload:** `{ title: string, body: string }`
- **Consumed by:** `components/modal.js`.
- **Status:** no built-in emitter (available for plugin use) — same situation
  already documented for `registerWidget`/`registerCommand` before something
  in the app started calling them. Not dead code; an unexercised extension point.

## `modal:close`

- **Emitted by:** nothing today (same status as `modal:open`).
- **Payload:** none required.
- **Consumed by:** `components/modal.js`, via a fresh `RaxEvents.once('modal:close', ...)`
  registered every time a modal opens — emitting this while a modal is open
  will correctly close it.
- **Status:** available for plugin use — e.g. a plugin could close the modal
  after an async action completes, from code that has no reference to the
  modal's own close button.

## `modal:closed`

- **Emitted by:** `components/modal.js`, after a modal actually finishes
  closing (whether via Esc, backdrop click, the close button, or an external
  `modal:close` emit).
- **Payload:** none currently.
- **Consumed by:** nothing in the built-in framework today.
- **Status:** genuinely unexercised on both ends within the shipped app, kept
  because "know when the modal finished closing" is a real, common need for
  any plugin that opens a modal and wants to do something after (e.g. refresh
  a table). Flagged explicitly here rather than silently left unexplained.

## `search:results`

- **Emitted by:** `search.js`, from `RaxSearch.query()`, after calling the
  page's registered provider.
- **Payload:** `{ pageId: string, term: string, results: any[] }`
- **Consumed by:** `components/topbar.js` (drives the visually-hidden
  `aria-live` results announcement).

## `registry:change`

- **Emitted by:** `registry.js`, from every `register*` call.
- **Payload (standardized):** `{ type: 'page'|'menuItem'|'widget'|'command'|'settingsPage'|'notification'|'permission', id: string }`
  — the `menuItem` case previously used `pageId` instead of `id`; every
  emit now consistently uses `id` (for menu items, `id` is the item's
  `pageId`, since menu items don't have a separate identity). This is
  additive — nothing that reads this event ever depended on the old `pageId`
  key, so no consumer breaks.
- **Consumed by:** `components/sidebar.js` (re-renders when a `menuItem` change
  arrives — e.g. a plugin registering its own nav entry after initial mount).

## `nav:change`

- **Emitted by:** `navigation.js`, once per page load, from `RaxNavigation.mount()`.
- **Payload:** `{ pageId: string }`
- **Consumed by:** nothing in the built-in framework today.
- **Status:** unexercised — kept because it's the only reliable signal that
  "the shell has finished mounting for this page," which a plugin's own page
  module may want to know before doing setup that depends on the sidebar/topbar
  existing in the DOM.

## `sidebar:toggle`

- **Emitted by:** `components/sidebar.js`, when the collapse button is clicked.
- **Payload:** `{ collapsed: boolean }`
- **Consumed by:** nothing in the built-in framework today (the collapsed
  state itself is read from `document.body.dataset.sidebar` by CSS, not by any
  JS listener).
- **Status:** unexercised — kept for any plugin widget that needs to
  re-layout itself when the sidebar's width changes (e.g. a canvas-based
  widget that needs to know its new available width).

---

## Duplicate events found

**None.** Every event name above has exactly one emit-shape and is documented
once. (`modal:close`/`modal:closed` are two *different*, intentionally-paired
names, not a duplicate of the same event.)

## Dead events found

Six events are emitted with zero built-in listeners (`modal:closed`,
`nav:change`, `sidebar:toggle`, `auth:login`, `auth:logout`, `auth:change`),
and one is listened for with zero built-in emitters (`modal:close`,
`modal:open` — both intentionally plugin-triggered). None were removed:

- Removing them would be indistinguishable from a breaking API change for any
  future plugin relying on the framework doing exactly what's documented here.
- Each has a concrete, named use case above, not a hypothetical one.
- This mirrors the same judgment call already made for `registerWidget()`/
  `registerCommand()` before something in the app started exercising them —
  "unexercised" and "dead" are treated as different things throughout this
  project, and are called out explicitly rather than left for someone to
  rediscover. The 3 `auth:*` events are unexercised for the same reason
  `RaxAuth` itself is: this repository ships zero auth providers by design
  (see `docs/auth-api.md`) — there is nothing to listen for yet, on purpose.
