# RAX Theme — Documentation Index

*RAX Theme — Modern OPNsense-inspired Dashboard Framework*

Start here. This folder has 8 files; this page tells you which one answers
your question and what order to read them in if you're starting from zero.

## Where to start

| If you are... | Start with |
|---|---|
| Evaluating RAX Theme for the first time | The main [`README.md`](../README.md), then come back here |
| Setting up a development environment / opening your first PR | [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — it links back into this folder where relevant |
| Building a plugin | [`plugin-api.md`](plugin-api.md), then the worked example in [`../examples/hello-plugin/`](../examples/hello-plugin/) |
| Adding real access control (login, permissions) to a host application | [`auth-api.md`](auth-api.md) — RAX Theme ships no auth backend itself, only the extension point |
| Building a new reusable UI component | [`component-api.md`](component-api.md) |
| Trying to understand *why* the code is structured this way | [`architecture.md`](architecture.md), then [`architecture-diagram.md`](architecture-diagram.md) if you want the visual version |
| Looking for a specific file's purpose | [`project-structure.md`](project-structure.md) |
| Adding or changing an accent/theme | [`theming.md`](theming.md) |
| Wiring up or listening to a framework event | [`events.md`](events.md) |
| Asking "is this function safe for me to call from a plugin?" | [`api-classification.md`](api-classification.md) |

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
   into the Extension API, plus the plugin loading lifecycle.
6. [`auth-api.md`](auth-api.md) — the auth provider extension point, if your
   host application needs real access control (RAX Theme itself ships none).
7. [`api-classification.md`](api-classification.md) — the reference table:
   every exported function, classified Public/Internal/Private, with the
   reasoning for each classification.
8. [`project-structure.md`](project-structure.md) — keep this open as a
   reference while you work; it's not meant to be read start-to-finish.

## What each file covers, in one line

- **`architecture.md`** — system design: CSS token layering, JS module list,
  boot sequence, Extension API summary, event system summary, theme engine
  summary, component contract summary, and the design principles the project
  holds itself to.
- **`architecture-diagram.md`** — the same architecture as four Mermaid
  diagrams (boot order, Extension API surface, CSS token layering, component
  contract) — useful if you think visually rather than in prose.
- **`project-structure.md`** — an annotated, file-by-file folder listing,
  plus a "where do I add a new X" quick-reference table.
- **`component-api.md`** — every `RaxComponents.*` component's exact `props`
  shape, with a live-instance count and notes on what each component is and
  isn't a fit for.
- **`plugin-api.md`** — the `register*` Extension API functions, the
  full plugin loading lifecycle (with a diagram), and what plugins must not
  do.
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
- **`api-classification.md`** — the definitive list of every exported
  function across every module, classified Public (stable, plugin-safe),
  Internal (usable but not covered by the same compatibility guarantee), or
  Private (implementation detail).
