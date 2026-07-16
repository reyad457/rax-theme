## Summary

What does this PR change, and why?

## Type of change

- [ ] Bug fix
- [ ] New page/component/framework module
- [ ] Documentation only
- [ ] Plugin (in `plugins/`)
- [ ] Other:

## Checklist

- [ ] No raw hex/pixel/rgba values added outside `assets/css/variables.css` /
      `assets/css/theme.css` (see `CONTRIBUTING.md`).
- [ ] No new inline `style="..."` attributes except genuinely per-instance
      data values (CSS custom properties like `--fill`, or diagram coordinates).
- [ ] Any new component implements `mount(el, props)` / `update(instance, props)`
      / `destroy(instance)`.
- [ ] No direct `new Chart(...)` calls outside `assets/js/charts.js`.
- [ ] Framework modules (`assets/js/*.js` top level) don't reference a
      specific page by name outside a docblock example.
- [ ] Every new/changed icon has `aria-hidden="true"`; every new/changed
      toggle switch has an `aria-label`.
- [ ] Relevant `docs/*.md` updated if this changes a public API, component
      contract, or event (see `docs/api-classification.md` for what counts
      as public).
- [ ] `CHANGELOG.md` updated under `[Unreleased]`.
- [ ] Manually re-ran the validation checks in `CONTRIBUTING.md` /
      `PHASE-E-MIGRATION-REPORT.md` §8 against changed files (no CI yet).

## Does this change the public API?

If yes: is it additive (safe) or breaking? Breaking changes need a strong
justification and a maintainer sign-off — see `CONTRIBUTING.md`.

## Screenshots (if visual)

## Related issues

Closes #
