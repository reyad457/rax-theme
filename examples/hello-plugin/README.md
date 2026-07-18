# Hello Plugin (example)

A minimal, runnable example of the RAX Theme Extension API. Demonstrates
exactly three public registration functions — nothing else:

- `RaxRegistry.registerWidget()`
- `RaxRegistry.registerCommand()`
- `RaxRegistry.registerPage()`

## Run it

Serve the repository root as described in the main
[`README.md`](../../README.md#installation), then open:

```
http://localhost:8080/examples/hello-plugin/hello-plugin.html
```

You should see:

- A "Hello Plugin" card, rendered by this plugin's own `init()` from the
  widget it registered (via `RaxComponents.Card` — a Public component, not a
  private framework internal).
- A working command: press `Ctrl/Cmd+K`, type "hello", and run **Say Hello**
  — it shows a toast via `RaxNotifications`.

## How it's loaded

`hello-plugin.html` declares:

```html
<script>window.RAX_PLUGINS = ['./index.js'];</script>
```

before `RaxPluginLoader.loadAll()` runs — the exact same mechanism any
third-party plugin uses. No file under `assets/` was changed to make this
example work; `index.js` is the entire plugin.

## What this example deliberately does NOT show

- `registerMenuItem()` — this plugin has no sidebar entry; you reach it by
  URL directly, on purpose, to keep this example focused on exactly the
  three functions above. See `docs/plugin-api.md` for `registerMenuItem()`.
- `registerSearchProvider()` / `registerTheme()` — same reasoning; see
  `docs/plugin-api.md` for both.
- Any private/internal framework API. Everything this plugin calls is
  classified **Public** in `docs/api-classification.md`.
