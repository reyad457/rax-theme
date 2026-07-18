# Security Policy

## Supported Versions

RAX Theme is pre-1.0 as of this document. Until a 1.0.0 tag exists, only the
latest commit on the default branch is supported with security fixes.

| Version | Supported |
|---|---|
| `main` (pre-release) | ✅ |

## Reporting a Vulnerability

If you discover a security vulnerability in RAX Theme itself (not in
OPNsense, Chart.js, or Lucide, which are separate upstream projects with
their own reporting channels), please report it privately rather than
opening a public issue:

1. Use GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability)
   feature on this repository, if enabled.
2. If that isn't available, open a regular issue titled only
   "Security contact needed" with no details, and a maintainer will follow up
   with a private channel.

Please do **not** open a public issue with exploit details before a
maintainer has had a chance to respond.

## What counts as a security issue here

RAX Theme is a static, client-side frontend theme/framework — it has no
server component, no authentication of its own, and no database. Realistic
report categories:

- **XSS or injection vectors** in how the framework renders plugin- or
  user-supplied data (e.g. `RaxComponents.Card`'s props, search terms,
  command palette input) — the framework should escape/treat all such input
  as text, never `innerHTML` it unescaped.
- **Supply-chain concerns** with the two pinned CDN dependencies (Lucide,
  Chart.js) — e.g. if a pinned version is later found to have a known CVE.
- **Plugin loading (`RaxPluginLoader`)** — since a plugin script has full DOM
  access once loaded (the same trust level as installing any OPNsense
  package), this is a documented trust boundary, not itself a vulnerability —
  but a way to load an *unintended* script (e.g. from an untrusted `RAX_PLUGINS`
  source) would be.

## What is explicitly out of scope

- Vulnerabilities in OPNsense itself.
- Vulnerabilities in Chart.js or Lucide upstream — report those to their own
  repositories.
- The absence of Subresource Integrity (SRI) hashes on the CDN `<script>`
  tags is a **known, tracked limitation** (see `ROADMAP.md`), not a new
  report. To add one, from a machine that can reach the CDN in question:

  ```bash
  curl -s <script-url> | openssl dgst -sha384 -binary | openssl base64 -A
  ```

  Prefix the result with `sha384-` and add it as the `integrity` attribute
  on the corresponding `<script>` tag, along with `crossorigin="anonymous"`.
