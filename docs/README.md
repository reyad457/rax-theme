# RAX Theme — Documentation Index

*RAX Theme — Modern OPNsense-inspired Dashboard Framework*

Start here. This folder has 11 files; this page tells you which one answers
your question and what order to read them in if you're starting from zero.

## Where to start

| If you are... | Start with |
|---|---|
| Evaluating RAX Theme for the first time | The main [`README.md`](../README.md), then come back here |
| Setting up a development environment / opening your first PR | [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — it links back into this folder where relevant |
| Building a plugin | [`plugin-api.md`](plugin-api.md), then the worked example in [`../examples/hello-plugin/`](../examples/hello-plugin/) |
| Writing a plugin's `manifest.json` | [`plugin-manifest.md`](plugin-manifest.md) — every field explained, with examples |
| Asking "is this function safe for me to build a plugin against?" | [`public-api.md`](public-api.md) (yes) / [`internal-api.md`](internal-api.md) (no, and why) |
| Confused about framework version vs. API version, or deprecation | [`versioning.md`](versioning.md) |
| Adding real access control (login, permissions) to a host application | [`auth-api.md`](auth-api.md) — RAX Theme ships no auth backend itself, only the extension point |
| Building a new reusable UI component | [`component-api.md`](component-api.md) |
| Trying to understand *why* the code is structured this way | [`architecture.md`](architecture.md), then [`architecture-diagram.md`](architecture-diagram.md) if you want the visual version |
| Looking for a specific file's purpose | [`project-structure.md`](project-structure.md) |
| Adding or changing an accent/theme | [`theming.md`](theming.md) |
| Wiring up or listening to a framework event | [`events.md`](events.md) |
| Wanting the exhaustive, per-export reasoning behind every Public/Internal call | [`api-classification.md`](api-classification.md) |

## Recommended reading order (first-time, end to end)

1. [`architecture.md`](architecture.md) — the layered CSS system, the core
   JavaScript modules, and the boot sequence. Everything else builds on this.
2. [`component-api.md`](component-api.md) — the reusable UI building blocks
   (`Card`, `Widget`, `Table`, `Tabs`, `Modal`, `Toast`) and their shared
   `mount`/`update`/`destroy` contract.
3. [`theming.md`](theming.md) — how the accent/mode system works and how to
   register a new theme.
4. [`events.md`](events.md) — the complete list of framework events, what
   fires them, and what (if anything) listens.
5. [`plugin-api.md`](plugin-api.md) — how everything above comes together
   into the Extension API, plus the plugin loading lifecycle, plugin
   lifecycle hooks, dependency resolution, validation, and developer mode.
6. [`plugin-manifest.md`](plugin-manifest.md) — the manifest schema every
   plugin should ship, field by field.
7. [`versioning.md`](versioning.md) — framework version vs. API version, the
   three-tier Public/Internal/Experimental surface, and the deprecation
   system. Read this before depending on anything not covered in
   `public-api.md`.
8. [`public-api.md`](public-api.md) / [`internal-api.md`](internal-api.md) —
   the curated Public-tier reference to build against, and the Internal-tier
   list to avoid.
9. [`auth-api.md`](auth-api.md) — the auth provider extension point, if your
   host application needs real access control (RAX Theme itself ships none).
10. [`api-classification.md`](api-classification.md) — the exhaustive
    reference table: every exported function, classified, with the
    reasoning for each classification.
11. [`project-structure.md`](project-structure.md) — keep this open as a
    reference while you work; it's not meant to be read start-to-finish.

## What each file covers, in one line

- **`architecture.md`** — system design: CSS token layering, JS module list,
  boot sequence, Extension API summary, event system summary, theme engine
  summary, plugin platform summary, API stability summary, component
  contract summary, and the design principles the project holds itself to.
- **`architecture-diagram.md`** — the same architecture as four Mermaid
  diagrams (boot order, Extension API surface, CSS token layering, component
  contract) — useful if you think visually rather than in prose.
- **`project-structure.md`** — an annotated, file-by-file folder listing,
  plus a "where do I add a new X" quick-reference table.
- **`component-api.md`** — every `RaxComponents.*` component's exact `props`
  shape, with a live-instance count and notes on what each component is and
  isn't a fit for.
- **`plugin-api.md`** — the `register*` Extension API functions, the
  full plugin loading lifecycle (with a diagram), plugin lifecycle hooks,
  dependency resolution, plugin validation, the plugin metadata API,
  developer mode, and what plugins must not do.
- **`plugin-manifest.md`** — the `manifest.json` schema every plugin should
  ship: every field explained (including `apiVersion`), a minimal and a
  complete example, the minimal semver comparator's exact behavior, and why
  the framework reads the manifest as a JS object rather than fetching the
  JSON file directly.
- **`versioning.md`** — the framework-version-vs-API-version distinction,
  the three-tier Public/Internal/Experimental API surface (and why it can't
  technically be enforced, only documented), the deprecation system, the
  plugin compatibility checker, and Developer Mode.
- **`public-api.md`** — every Public-tier export in one place, safe to build
  a plugin against, organized by module.
- **`internal-api.md`** — every notable Internal-tier export, with the
  specific reason it isn't Public and what to use instead.
- **`auth-api.md`** — the provider-based auth extension API
  (`currentUser`/`login`/`logout`/`hasPermission`/`beforeRoute`/
  `afterLogin`/`afterLogout`), the permissive-by-default behavior when no
  provider is registered, and why RAX Theme ships no auth system of its own.
- **`theming.md`** — the accent/dark-light mode system, verification results
  for each part of the theme engine, and the `registerTheme()` API for
  plugin-defined themes.
- **`events.md`** — every framework event: what emits it, its exact payload
  shape, what (if anything) consumes it, and whether it's currently
  exercised by the built-in app or reserved for plugin use.
- **`api-classification.md`** — the exhaustive, per-export ledger: every
  exported function across every module, classified Public (stable,
  plugin-safe), Internal (usable but not covered by the same compatibility
  guarantee), or Private (implementation detail), with the reasoning for
  each — the source of truth `public-api.md`/`internal-api.md` are curated
  from.
