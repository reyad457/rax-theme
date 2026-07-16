# Roadmap

## Completed

- ✅ **Architecture v1** (Phase C) — token-driven CSS, framework core modules,
  component library, all 5 built-in pages running on the new architecture
  with zero visual regression from the original prototype.
- ✅ **Component Library v1** (Phase D) — every component exercised in the
  shipped app; search, command palette, and sortable tables all functional
  on every page.
- ✅ **Theme Engine** (Phase E) — 5 accents + dark/light, `registerTheme()`
  extension point, chart color-following fixed.
- ✅ **Plugin API** (Phase E) — all 6 `register*` functions documented and
  implemented; `RaxPluginLoader` for loading plugin scripts without core
  file changes.
- ✅ **Open Source Release Prep** (Phase F, this document included) — full
  repository documentation, GitHub community health files, release quality
  audit, branding standardization, release assets.

## Next — planned, not yet started

- **First example plugin.** `docs/plugin-api.md` is complete but has no
  worked, runnable example in the repository itself. Highest-priority
  post-1.0 item — a contributor's first instinct will be "show me a real one."
- **CI pipeline.** Every validation check referenced throughout this
  project's phase reports (duplicate-CSS grep, `new Chart(` isolation check,
  accessibility marker checks, asset-reference resolution) has so far been
  run manually. These should become an actual CI job that runs on every PR.
- **Automated visual regression testing.** Every phase's "zero visual
  regression" claim has been verified by identical class names + identical
  token values + manual review, never a real screenshot diff. Flagged as open
  debt since Phase C.
- **Subresource Integrity (SRI) hashes** on the Lucide/Chart.js CDN
  `<script>` tags. Versions are pinned; hashes are not yet added (blocked in
  every prior phase by sandboxed-environment network restrictions during
  development — needs one person, on a normal network, running the command
  documented in `PHASE-E-TECHNICAL-DEBT.md`).
- **Dashboard widget customization** (drag-to-reorder / show-hide), building
  on `RaxRegistry.registerWidget()`, which is fully implemented but has zero
  call sites in the shipped app today — intentionally deferred until a real
  consumer (this feature, or a plugin) needs it.
- **`login.html`.** Referenced by the original prototype's README, never
  built in any phase. Needs a scoping decision: does RAX Theme ship its own
  login screen, or assume OPNsense's own auth wraps every themed page?

## Exploratory — not scheduled

- **Widget Marketplace.** A curated listing of community
  `registerWidget()`-based plugins. Explicitly out of scope until the Plugin
  API and Dashboard Customization above are both stable and have at least one
  real-world plugin proving the shape is right.
- **Light-weight build step (optional).** The project deliberately has none
  today (see `README.md`'s Browser Support section for the reasoning). If
  the component/module count grows significantly, an *optional* bundler
  pass for production deployments (not required for development) may be
  worth revisiting — no decision made either way.

## Versioning

This project is pre-1.0. See `RELEASE_NOTES_v1.md` for what "1.0.0" is
expected to mean once tagged, and `FIRST_RELEASE_CHECKLIST.md` for what has
to be true before that tag is cut.
