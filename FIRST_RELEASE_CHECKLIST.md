# First Release Checklist (v1.0.0)

Gate checklist before tagging `v1.0.0`. Items are grouped by whether they're
already satisfied by Phase F's work, or still need a human/maintainer action
this sandboxed development process couldn't complete itself.

## Already satisfied (verified in Phase F)

- [x] `LICENSE` present (MIT)
- [x] `README.md` covers overview, features, architecture, folder structure,
      installation, quick start, theme system, plugin system, component
      system, browser support, roadmap, contributing, license
- [x] `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md` present
- [x] `CHANGELOG.md`, `ROADMAP.md` present
- [x] `.github/ISSUE_TEMPLATE/` (bug report, feature request),
      `PULL_REQUEST_TEMPLATE.md`, `DISCUSSION_TEMPLATE/` present
- [x] `docs/` complete: architecture, architecture diagram, project
      structure, component API, plugin API, theming, events, API
      classification
- [x] No known duplicate CSS or JS (re-verified this phase)
- [x] No known broken internal links (every relative markdown link checked)
- [x] No known broken asset references (every `src`/`href` checked, every
      asset file confirmed used)
- [x] No known accessibility regressions (icon/switch/landmark checks re-run)
- [x] Branding consistent: "RAX Theme — Modern OPNsense-inspired Dashboard
      Framework" across README, all `docs/*.md`, and all 5 page `<title>`/
      meta description tags (2 minor inconsistencies found and fixed this
      phase)
- [x] Public API surface classified and documented
      (`docs/api-classification.md`) with a stated versioning policy
      (`RELEASE_NOTES_v1.md`)

## Requires a maintainer action before tagging (cannot be completed in this environment)

- [ ] **Add real screenshots.** `README.md` has a placeholder list of
      suggested captures under `docs/screenshots/` — none exist yet (this
      environment has no browser to render and capture them).
- [ ] **Perform one full manual browser QA pass**, per
      `PHASE-E-READINESS-ASSESSMENT.md`'s limitations section: click through
      all 5 pages, toggle dark/light, cycle all 5 accents, open the command
      palette and run both built-in commands, sort every sortable table,
      search on every page, resize past each responsive breakpoint. This
      review's "zero visual regression" and "theme engine verified" claims
      are based on static/structural analysis, not a rendered browser.
- [ ] **Generate and add SRI hashes** for the Lucide and Chart.js CDN
      `<script>` tags, from a machine that can reach `unpkg.com` and
      `cdnjs.cloudflare.com` (blocked in every phase of this development
      process by sandbox network restrictions). Command is in
      `PHASE-E-TECHNICAL-DEBT.md`.
- [ ] **Set the repository's actual GitHub organization/URL** — `README.md`'s
      clone command currently uses a placeholder
      (`github.com/<your-org>/rax-theme.git`).
- [ ] **Confirm the LICENSE copyright holder line** — currently reads "RAX
      Theme Contributors"; update if a specific individual or organization
      should be named instead.
- [ ] **Decide on `login.html` scope** before or shortly after v1.0.0 — see
      `ROADMAP.md`.
- [ ] **Set up CI** (or explicitly decide not to, for v1.0.0, and note it as
      a known gap in the release) to run the validation checks documented in
      `CONTRIBUTING.md` automatically.
- [ ] **Tag the release** and publish `RELEASE_NOTES_v1.md`'s content as the
      GitHub release description once the above are complete.

## Recommended but not blocking

- [ ] A first example plugin under `plugins/` (tracked in `ROADMAP.md` as
      the highest-priority post-1.0 item — genuinely fine to ship v1.0.0
      without one, but shouldn't wait long after).
- [ ] Enable GitHub's private vulnerability reporting feature (referenced by
      `SECURITY.md` but not something this process can toggle on the user's
      behalf).
