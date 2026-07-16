---
name: Feature request
about: Suggest an addition or change to RAX Theme
title: "[Feature] "
labels: enhancement
---

## Is this a framework change or a plugin?

Most new pages, widgets, commands, and search behaviors should be built as a
[plugin](../../docs/plugin-api.md) using the existing Extension API, not a
change to the framework itself. Before requesting a framework change, check:

- [ ] I've read `docs/plugin-api.md` and confirmed this genuinely can't be
      done as a plugin (e.g. it requires a new `register*` function, a new
      framework event, or a new shared component).
- [ ] This is a plugin idea, not a framework change (consider building it as
      a plugin and sharing it instead of requesting it here).

## What problem does this solve?

## Proposed solution

## Alternatives considered

## Does this affect the public API?

If yes, describe the change to `docs/api-classification.md`,
`docs/component-api.md`, `docs/events.md`, or `docs/theming.md` this would
require. Breaking changes to the Public API are treated seriously — see
`CONTRIBUTING.md`.

## Additional context
