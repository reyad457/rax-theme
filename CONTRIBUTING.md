# Contributing to RAX Theme

Thanks for considering a contribution. This project has no build step and a
fairly small, deliberately consistent codebase — most of what you need to
know is in `docs/` (start at [`docs/README.md`](docs/README.md)), not here.
This file covers process; `docs/architecture.md` and
`docs/api-classification.md` cover design.

## Before you start

- Read [`docs/architecture.md`](docs/architecture.md) for the layered CSS
  system and module boundaries.
- If you're adding a page, widget, command, or search behavior, you almost
  certainly want the [Extension API](docs/plugin-api.md) (`plugins/`), not a
  change to a framework file under `assets/`.
- Check [`ROADMAP.md`](ROADMAP.md) and open issues first — someone may
  already be working on it.

## Development setup

No install step.

```bash
# TODO: replace with the actual repository URL once published
git clone https://github.com/reyad457/rax-theme.git
cd rax-theme
python3 -m http.server 8080
# open http://localhost:8080/dashboard.html
```

There is no build, no `npm install`, and no compilation step for any change
to `assets/css/` or `assets/js/` — edit and refresh.

## Coding conventions

These are enforced by convention, not yet by an automated linter (tracked in
`ROADMAP.md`). Run the checks in "Validating your change" below before
opening a PR.

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
  page by name outside a docblock example — checked by the grep in
  "Validating your change" below, and a PR that introduces a page-specific
  reference in a framework file will be asked to move it.
- Never call `new Chart(...)` directly — always go through `RaxCharts.create()`.

**Both**

- No raw inline `style="..."` attributes except for genuinely per-instance
  data values expressed as CSS custom properties (`--fill`, `--gauge-percent`,
  diagram-node coordinates) — see `docs/architecture.md` for the exact
  reasoning and the disclosed exceptions.

## Making a change

1. Fork and branch from `main`.
2. Make your change, following the conventions above.
3. Run the checks below against your changed files (there's no CI yet —
   tracked in `ROADMAP.md` — so this is manual for now).
4. Update the relevant `docs/*.md` file if you changed a public API,
   component contract, or event.
5. Open a PR using the template — it asks for exactly what a reviewer needs
   to verify the above.

## Validating your change

No tooling required — these are all one-line checks you can run from the
repository root before opening a PR:

```bash
# No duplicate top-level CSS selectors across component files
grep -hoE '^\.[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)?\s*\{' assets/css/components/*.css assets/css/*.css \
  | sed 's/\s*{$//' | sort | uniq -d
# (should print nothing)

# No direct Chart.js calls outside charts.js
grep -rn "new Chart(" assets/js/ | grep -v "assets/js/charts.js"
# (should print nothing, or only a docblock comment mentioning it)

# Every icon is hidden from assistive tech
for f in *.html; do grep -oE '<i data-lucide="[^"]*"[^>]*>' "$f" | grep -v 'aria-hidden'; done
# (should print nothing)

# Every toggle switch has an accessible name
grep -n 'class="switch"' *.html -A1 | grep 'input type="checkbox"' | grep -v 'aria-label'
# (should print nothing)

# Every asset reference resolves to a real file
for f in *.html; do
  grep -oE '(src|href)="assets/[^"]+"' "$f" | sed -E 's/^(src|href)="//; s/"$//' \
    | while read -r path; do [ -f "$path" ] || echo "MISSING: $f -> $path"; done
done
# (should print nothing)

# JavaScript syntax is valid
for f in assets/js/*.js assets/js/components/*.js assets/js/pages/*.js; do node --check "$f"; done
```

## Reporting bugs / requesting features

Use the issue templates under `.github/ISSUE_TEMPLATE/`. For open-ended
ideas or questions rather than a concrete bug/feature, use
`.github/DISCUSSION_TEMPLATE/` if Discussions are enabled on the repository.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).
