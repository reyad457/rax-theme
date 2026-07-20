# RAX Theme — Plugin Manifest Reference

*RAX Theme — Modern OPNsense-inspired Dashboard Framework*

Every plugin should include a `manifest.json` describing what it is, what
version it's at, and what it depends on. This document explains every field.
For how the manifest is actually consumed at runtime (and why that's not a
direct `fetch()` of the JSON file), see "How the manifest is loaded" below.
For the lifecycle hooks and dependency validation behavior, see
[`plugin-api.md`](plugin-api.md).

---

## Minimal example

```json
{
  "id": "hello-plugin",
  "name": "Hello Plugin",
  "version": "1.0.0"
}
```

`id`, `name`, and `version` are the only required fields. Everything else is
optional metadata or optional behavior declaration.

## Complete example

```json
{
  "id": "wireguard-plugin",
  "name": "WireGuard",
  "description": "Manage WireGuard peers and tunnels from the RAX Theme sidebar.",
  "version": "2.1.0",
  "author": "Jane Doe <jane@example.com>",
  "license": "MIT",
  "homepage": "https://github.com/example/rax-wireguard-plugin",
  "icon": "shield",
  "category": "vpn",
  "keywords": ["vpn", "wireguard", "tunnels"],
  "minimumRaxVersion": "1.0.0",
  "permissions": ["wireguard.view", "wireguard.manage"],
  "dependencies": [
    { "id": "core-vpn-api", "version": ">=1.0.0" }
  ],
  "optionalDependencies": [
    { "id": "notification-api", "version": ">=1.0.0" }
  ]
}
```

---

## Field reference

### `id` (required, string)

A unique, stable identifier for this plugin. Must be lowercase kebab-case,
matching `^[a-z0-9][a-z0-9-]*$` — e.g. `wireguard-plugin`, `hello-plugin`.
This is what other plugins reference in their own `dependencies`, what
`RaxPlugins.getPlugin(id)` looks up, and what appears in every validation
error message. `RaxPlugins.registerManifest()` refuses to register a
manifest with a missing or malformed `id`.

### `name` (required, string)

A human-readable display name, e.g. `"WireGuard"`. Shown wherever plugin
metadata is surfaced (currently only `RaxPlugins.getPlugin()`/`getPlugins()`
— there is no plugin-manager UI, see `plugin-api.md`).

### `version` (required, string)

A semver-like version string, e.g. `"2.1.0"`. Must at minimum parse as
`MAJOR.MINOR.PATCH` (a pre-release/build suffix like `-beta.1` is tolerated
but ignored by comparisons — see "Version comparison" below).
`RaxPlugins.registerManifest()` refuses to register a manifest with a
missing or unparseable `version`.

### `description` (optional, string)

A one- or two-sentence summary.

### `author` (optional, string)

Free text, e.g. `"Jane Doe <jane@example.com>"`. Not validated or parsed.

### `license` (optional, string)

An SPDX license identifier, e.g. `"MIT"`, `"Apache-2.0"`, `"GPL-3.0-only"`.
Not validated against the actual SPDX list — this is a convention, not an
enforced constraint.

### `homepage` (optional, string)

A URL to the plugin's source, documentation, or issue tracker.

### `icon` (optional, string)

A [Lucide](https://lucide.dev) icon name, for consistency with
`registerMenuItem()`'s own `icon` field (see `plugin-api.md`).

### `category` (optional, string)

A free-text grouping, e.g. `"vpn"`, `"monitoring"`, `"example"`. No fixed
category list is enforced.

### `keywords` (optional, array of strings)

For future discoverability tooling. Must be an array of strings if present.

### `minimumRaxVersion` (optional, semver-like string)

The lowest RAX Theme framework version this plugin requires, checked against
`RaxCore.VERSION` when the manifest registers. **This is report-only** — an
unsatisfied `minimumRaxVersion` logs a validation error
(`RaxPlugins.getValidationErrors()`) but does **not** prevent the plugin
from loading or running. By the time `registerManifest()` runs, the
plugin's own script has already executed in full — there is nothing left to
"block."

### `permissions` (optional, array of strings)

Permission IDs this plugin defines or checks, e.g.
`["wireguard.view", "wireguard.manage"]`. This is metadata only — declaring
a permission here doesn't register it with `RaxRegistry.registerPermission()`
or enforce anything by itself. Pair the two: call
`RaxRegistry.registerPermission({ id, label, description })` for each
permission you actually want discoverable, and check it at runtime via
`RaxAuth.hasPermission(id)` (see `auth-api.md`).

### `dependencies` (optional, array)

Other plugins this plugin requires to function correctly. Two accepted
shapes, and you can mix both in the same array:

```json
"dependencies": [
  "core-vpn-api",
  { "id": "notification-api", "version": ">=1.0.0" }
]
```

- A plain string is shorthand for `{ "id": "<string>" }` with no version
  constraint.
- The object form's `version` is optional; if given, it's checked with the
  same minimal semver comparator described below.

**RAX Theme validates that each declared dependency's plugin id has been
registered — it never installs, downloads, or fetches anything to satisfy a
dependency.** If `core-vpn-api` isn't loaded (e.g. via its own entry in
`RAX_PLUGINS`, loaded before this plugin), that's reported as a validation
error naming both plugins, and nothing more happens automatically. See
`plugin-api.md`'s Dependency Resolution section for the exact error format
and worked examples (a WireGuard plugin depending on a Core VPN API plugin;
a Grafana plugin depending on a Notification API plugin).

### `optionalDependencies` (optional, array)

Same shape as `dependencies`, but a missing one is logged as a **warning**,
not an error — for integrations that enhance a plugin if present but aren't
required for it to work (e.g. a plugin that shows richer toasts if a
notification-related plugin happens to be loaded, but functions fine
without it).

---

## Version comparison

`RaxPlugins` implements a **minimal** semver-lite comparator — not the full
[node-semver](https://github.com/npm/node-semver) range syntax. Supported
constraint prefixes on a dependency's `version` field or a manifest's
`minimumRaxVersion`:

| Prefix | Meaning |
|---|---|
| *(none)* — e.g. `"1.2.3"` | Exact match only |
| `>=1.2.3` | Greater than or equal |
| `^1.2.3` | Same major version, and greater than or equal on minor.patch |

Anything else (`~1.2.3`, `1.x`, `>1.2.3 <2.0.0`, etc.) is **not** understood
— if a constraint can't be parsed, the check is silently skipped rather than
incorrectly failing a plugin that's probably fine. This limitation is
deliberate: implementing full semver range parsing was out of scope for a
framework-only, no-package-manager plugin platform. If your plugin needs
precise range matching, do it yourself in your own `onInstall`/`onEnable`
hook using `RaxPlugins.getPluginVersion()`.

---

## How the manifest is loaded

RAX Theme deliberately never calls `fetch()` or `XMLHttpRequest` anywhere in
the framework — this is what keeps every page working when opened directly
via `file://` (see `README.md`'s Browser Support section), where fetching a
local JSON file is blocked by many browsers' security model.

This means **`manifest.json` is not read directly by the framework at
runtime.** It is the canonical, documented, tooling-readable manifest file —
write it, keep it accurate, and a future build tool, registry, or validator
script can read it directly with plain `JSON.parse(fs.readFileSync(...))`.
But at runtime, your plugin's own `index.js` passes the identical data to
`RaxPlugins.registerManifest()` as a plain JavaScript object:

```js
// manifest.json and this object should always stay in sync.
var manifest = {
  id: 'hello-plugin',
  name: 'Hello Plugin',
  version: '1.0.0',
  // ...every other field, identical to manifest.json
};

RaxPlugins.registerManifest(manifest, { /* lifecycle hooks */ });
```

**Call `registerManifest()` before any `registerPage`/`registerWidget`/
`registerCommand` call in the same script.** `RaxPlugins` attributes
subsequent registrations to whichever manifest was most recently registered,
which is what makes cross-plugin duplicate-ID detection possible (see
`plugin-api.md`'s Plugin Validation section). Registering out of order won't
break anything functionally, but duplicate-ID detection may misattribute the
registration.

See [`examples/hello-plugin/`](../examples/hello-plugin/) for a complete,
runnable, correctly-ordered example.
