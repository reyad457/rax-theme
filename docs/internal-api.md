# RAX Theme — Internal API (Do Not Build Against This)

*RAX Theme — Modern OPNsense-inspired Dashboard Framework*

Everything on this page is classified **Internal**. It is real, working
code you can technically call — every export in RAX Theme is a plain
global, nothing is hidden or sandboxed (see
[`versioning.md`](versioning.md#why-this-doesnt-technically-prevent-anything)
for why) — but **none of it is covered by any compatibility guarantee**.
It can change shape, change behavior, or disappear entirely in any release,
including a patch release, with no deprecation warning. If your plugin
depends on something here, expect it to break without notice.

If you think something listed here should be Public because your plugin
genuinely needs it, that's useful signal — see `CONTRIBUTING.md` about
opening an issue, rather than depending on it anyway.

---

## RaxUtils (most of it)

`qs`, `qsa`, `dom`, `debounce`, `formatNumber`, `formatBytes` — convenience
helpers used throughout the framework's own components. Usable, but their
signatures (especially `dom()`'s hyperscript-style call shape) are
implementation conveniences that could change shape in a future release
without a deprecation cycle. Write plain DOM code in your plugin instead of
depending on these.

(`readCssVar` and `hexToRgba` are the two exceptions — see
[`public-api.md`](public-api.md).)

## RaxComponents.Sidebar, RaxComponents.Topbar

Framework-owned singletons, mounted exactly once by `navigation.js` when a
page calls `RaxNavigation.mount({...})`. Calling `.mount()` on either of
these yourself creates a second sidebar/topbar in the DOM — this isn't a
compatibility risk so much as a "this will visibly break the page" risk.
Use `RaxRegistry.registerMenuItem()` instead; `Sidebar` automatically
re-renders on `registry:change`.

## RaxSearch.query

Called by `Topbar`'s search input on every keystroke. A plugin *could* call
this to trigger a search programmatically, but it isn't part of the
documented contract — `RaxSearch.registerProvider()` (Public) is how a
plugin is meant to participate in search.

## RaxTheme.init

Called exactly once, by `RaxCore.boot()`. A plugin has no reason to call
this itself, and calling it again would re-apply the persisted theme
preference redundantly.

---

## Why "Internal" instead of just... not exporting it?

RAX Theme has no build step and no module bundler — every file is a plain
`<script>` tag, and every module attaches its exports to `window` because
there's no other mechanism available (see `docs/architecture.md`'s
JavaScript architecture section for the full reasoning). There is no way to
make a JavaScript function "private but still callable by other framework
files" without a bundler's private-scope machinery, which this project
deliberately doesn't have.

So instead of a technical wall, this is a **documented, honest boundary**:
Internal-tier exports exist in the open, are used by the framework itself
between its own files, and are visible to anyone who looks — but
`docs/public-api.md` is the actual promise. This page is the other half of
that promise: an explicit list of what the promise does *not* cover, so
"it wasn't in the Internal-API doc so I assumed it was safe" is never a
fair complaint against a future breaking change here.
