# RAX Theme — Versioning & Compatibility

*RAX Theme — Modern OPNsense-inspired Dashboard Framework*

RAX Theme has **two independent version numbers**. Confusing them is the
most common mistake a plugin author will make, so this document leads with
the distinction before anything else.

## Two numbers, two different questions

| | Framework version (`RaxCore.VERSION`) | API version (`RaxAPI.VERSION`) |
|---|---|---|
| Example | `"1.0.0-rc"`, `"1.2.0"`, `"2.4.1"` | `"v1"`, `"v2"` |
| Format | Semver (`MAJOR.MINOR.PATCH`) | Coarse integer tag (`v` + a number) |
| Answers | "Which release of RAX Theme is this?" | "Which version of the **Public API contract** does this release support?" |
| Changes | Every release, however small | Only when a **breaking** change is made to a Public-tier export (see `docs/public-api.md`) |
| A plugin checks it via | `manifest.minimumRaxVersion` | `manifest.apiVersion` |

**The framework version can climb through many releases — 1.0.0, 1.1.0,
1.2.0, 1.3.0 — while the API version stays `v1` the entire time,** as long
as none of those releases break a Public-tier export. The API version only
increments when a Public API breaking change genuinely can't be avoided —
which, per this project's own compatibility rules, should be rare and
deliberate, not routine.

Why keep them separate at all? So a plugin can declare "I need at least
RAX Theme 1.2.0" (for a bug fix or new component it depends on) *and*
separately "I was built against API v1" (so a hypothetical future API v2 —
which might rename or restructure Public exports — doesn't silently break
it). The two checks catch different problems: `minimumRaxVersion` catches
"this specific release is too old to have the feature you need,"
`apiVersion` catches "the surface you coded against may not exist in this
shape anymore."

## The three-tier API surface

Every export in RAX Theme is classified into exactly one tier, held at
runtime by `RaxAPI` and documented in full in `docs/public-api.md` /
`docs/internal-api.md` (the curated, human-facing views) and
`docs/api-classification.md` (the exhaustive per-export ledger with
reasoning for each classification).

- **Public** — the stable contract. Covered by the API-version guarantee
  above: won't change shape or disappear within the same API version.
  Build plugins against this tier.
- **Internal** — used across framework modules, technically reachable
  (everything in this codebase is a plain global — see "Why this doesn't
  technically prevent anything" below), but **not** covered by any
  compatibility guarantee. Can change shape in any release, including a
  patch release, with no deprecation warning.
- **Experimental** — a Public-tier candidate that hasn't stabilized yet.
  Usable, but expect it to change before it's promoted to Public. (No
  export is currently classified Experimental — this tier exists for
  future use, e.g. a new component shipped ahead of its final `props` shape
  settling.)

```js
RaxAPI.getClassification('RaxUtils', 'dom'); // -> 'internal'
RaxAPI.getSurface('public');                  // -> every Public-tier entry
```

### Why this doesn't technically prevent anything

`RaxUtils.dom`, `RaxComponents.Sidebar.mount`, and every other Internal-tier
export remain plain, callable globals — nothing is hidden, frozen, or
blocked. Actually sandboxing them would be a breaking change for any code
already depending on one, which contradicts this project's own backward
compatibility rules. "Preventing plugins from relying on internal modules"
is enforced through **visibility, not a technical wall**: strong
documentation (`docs/public-api.md` says explicitly "build against this";
`docs/internal-api.md` says explicitly "don't"), plus — when
[Developer Mode](#developer-mode) is enabled — a loud console warning the
moment a *deprecated* Public or Internal API is used through
`RaxAPI.warnDeprecated()` (see below).

## Deprecation system

When a Public-tier export needs to change or be removed, it goes through a
deprecation period first — never a silent removal.

```js
RaxAPI.deprecate('RaxTheme.oldMethod', {
  replacement: 'RaxTheme.newMethod',
  removalVersion: '2.0.0',
  message: 'Optional extra context.', // shown appended to the warning
});
```

At the point where the deprecated code actually runs, call:

```js
RaxAPI.warnDeprecated('RaxTheme.oldMethod');
```

This is **development-mode only, by design** (per the task this system was
built against) — `warnDeprecated()` checks `RaxDevMode.isEnabled()` first
and does *nothing at all* if it's off or if `RaxDevMode` isn't loaded. A
production page that never enables dev mode pays zero cost for every
`warnDeprecated()` call in the codebase — not reduced cost, zero: the
function returns before touching the deprecation registry at all.

```js
RaxAPI.isDeprecated('RaxTheme.oldMethod');  // -> true
RaxAPI.getDeprecations();                    // -> every registered entry
```

**As of this release, RAX Theme has deprecated nothing.** No Public API
export currently has a deprecation registered — there was no genuine
candidate (see the migration report for this stage's reasoning on why
nothing was deprecated just to demonstrate the mechanism). The system is
real, tested, and ready for the first time it's actually needed.

## Compatibility checker

`RaxPlugins.registerManifest()` automatically runs
`RaxAPI.checkPluginCompatibility(manifest)` (if `RaxAPI` is loaded) and
folds the result into its own validation log — the same
`getValidationErrors()`/`getValidationWarnings()` you already check for
duplicate IDs and missing dependencies (see `docs/plugin-api.md`).

| `manifest.apiVersion` | Result |
|---|---|
| Not declared | Compatible. An informational note (not an error or warning) recommends declaring it. |
| Equal to `RaxAPI.VERSION` | Compatible. No issue at all. |
| Lower than `RaxAPI.MIN_SUPPORTED_VERSION` | **Error** — "no longer supported." |
| Higher than `RaxAPI.VERSION` | Compatible, but a **warning** — "targets a newer API than this framework provides." |
| Equal to a version `RaxAPI.isDeprecated('api-vN')` flags | Compatible, but a **warning** naming the replacement. |
| Not parseable (e.g. `"latest"`) | Compatible, but a **warning** — the check is skipped rather than guessed at. |

Nothing here ever blocks a plugin from running — by the time
`registerManifest()` runs, the plugin's own script has already executed.
This mirrors every other validation in `RaxPlugins`: report, never enforce.

## Developer Mode

Opt-in, disabled by default on every page in this repository:

```js
window.RAX_DEV_MODE = true; // before framework scripts load, OR:
RaxDevMode.enable();         // at any time — persists via localStorage
```

While enabled, `RaxDevMode` collects and reports:

- **Deprecated API usage** — every `RaxAPI.warnDeprecated()` call that
  actually found a registered deprecation.
- **Plugin load timing** — how long each `RAX_PLUGINS` script took to load,
  recorded by `RaxPluginLoader`.
- **Plugin lifecycle timing** — how long each `onInstall`/`onEnable`/
  `onDisable`/`onUpdate`/`onUninstall` hook took to run, recorded by
  `RaxPlugins`.
- **Duplicate registrations** — not collected separately; `RaxDevMode.report()`
  reads `RaxPlugins.getValidationErrors()`/`getValidationWarnings()` (which
  already report these unconditionally, in every mode — see
  `docs/plugin-api.md`) and folds them into one combined summary.

```js
RaxDevMode.report(); // prints a grouped console summary of all of the above
```

`RaxPluginLoader.loadAll()` calls `RaxDevMode.report()` automatically once
every plugin has loaded, but only if dev mode is enabled — see
`assets/js/plugin-loader.js`'s own docblock for the exact zero-overhead
guarantee when it's off.

## Summary for plugin authors

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "minimumRaxVersion": "1.0.0",
  "apiVersion": "v1"
}
```

Declare both `minimumRaxVersion` and `apiVersion`. Build only against
exports classified **Public** in `docs/public-api.md`. If you're unsure
whether something is safe to depend on, check
`RaxAPI.getClassification('ModuleName', 'exportName')` — or just check
`docs/public-api.md`; it's the same table.
