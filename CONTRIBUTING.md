# Contributing to RAX Theme

Thanks for considering a contribution. This project has no build step and a
fairly small, deliberately consistent codebase — most of what you need to
know is in `docs/`, not here. This file covers process; `docs/architecture.md`
and `docs/api-classification.md` cover design.

## Before you start

- Read [`docs/architecture.md`](docs/architecture.md) for the layered CSS
  system and module boundaries.
- If you're adding a page, widget, command, or search behavior, you almost
  certainly want the [Extension API](docs/plugin-api.md) (`plugins/`), not a
  change to a framework file under `assets/`.
- Check [`ROADMAP.md`](ROADMAP.md) and open issues first — someone may
  already be working on it.

## Development setup

No install step. Clone the repo and serve it with any static file server:

```bash
python3 -m http.server 8080
# open http://localhost:8080/dashboard.html
```

There is no build, no `npm install`, and no compilation step for any change
to `assets/css/` or `assets/js/` — edit and refresh.

## Coding conventions

These are enforced by convention and by the project's own validation passes
(see `PHASE-E-MIGRATION-REPORT.md` §8 for the exact checks run every phase),
not yet by an automated linter (tracked in `ROADMAP.md`).

**CSS**

- Never declare a raw hex color, raw pixel spacing/radius/shadow value, or
  raw `rgba()` literal outside `assets/css/variables.css` or
  `assets/css/theme.css`. If a value doesn't exist as a token yet, add one —
  don't hardcode.
- One component = one file under `assets/css/components/`.
- Every file opens with a docblock: Purpose / Responsibility / Public API /
  Dependencies / Extension — follow the existing files' format exactly.

**JavaScript**

- Plain classic scripts, ES5-compatible function syntax (no bundler, no
  transpiler — see `README.md`'s Browser Support section for why).
- One global export per module (`RaxTheme`, `RaxRegistry`, etc.), attached to
  `window` inside an IIFE.
- Every component under `assets/js/components/` implements exactly
  `mount(el, props)` / `update(instance, props)` / `destroy(instance)`.
- Every `console.error`/`console.warn` message starts with the module's
  bracketed name, e.g. `'[RaxTheme] ...'`.
- Page modules (`assets/js/pages/*.js`) own their own data and DOM; framework
  modules (`assets/js/*.js` at the top level) must never reference a specific
  page by name outside a docblock example — this is checked by grep every
  phase, and a PR that introduces a page-specific reference in a framework
  file will be asked to move it.
- Never call `new Chart(...)` directly — always go through `RaxCharts.create()`.

**Both**

- No raw inline `style="..."` attributes except for genuinely per-instance
  data values expressed as CSS custom properties (`--fill`, `--gauge-percent`,
  diagram-node coordinates) — see `docs/architecture.md` for the exact
  reasoning and the disclosed exceptions.

## Making a change

1. Fork and branch from `main`.
2. Make your change, following the conventions above.
3. Re-run the validation checks documented in
   `PHASE-E-MIGRATION-REPORT.md` §8 against your changed files (duplicate
   CSS selectors, `new Chart(` outside `charts.js`, icon `aria-hidden`
   coverage, switch `aria-label` coverage, asset references resolving) —
   there's no CI yet (tracked in `ROADMAP.md`), so this is manual for now.
4. Update the relevant `docs/*.md` file if you changed a public API,
   component contract, or event.
5. Open a PR using the template — it asks for exactly what a reviewer needs
   to verify the above.

## Reporting bugs / requesting features

Use the issue templates under `.github/ISSUE_TEMPLATE/`. For open-ended
ideas or questions rather than a concrete bug/feature, use
`.github/DISCUSSION_TEMPLATE/` if Discussions are enabled on the repository.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).
