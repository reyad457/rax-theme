# RAX Theme — Authentication Extension API

*RAX Theme — Modern OPNsense-inspired Dashboard Framework*

RAX Theme ships **no login page, no authentication backend, and no
credential storage of any kind.** What it ships instead is `RaxAuth`
(`assets/js/auth.js`): a provider-based extension point so a host
application can plug in whatever authentication system it already has —
session cookies, OPNsense's own auth, JWT, SSO, or nothing at all.

This document is the complete contract. There is no separate implementation
to read — `assets/js/auth.js` is short enough that the dispatch logic and
this document should match exactly; if they ever don't, the code is the
source of truth and this doc has a bug.

---

## Why a provider, not a built-in system

A theme framework shouldn't decide how its host application authenticates
users — that decision belongs entirely to whatever RAX Theme is embedded
in (OPNsense itself, a custom dashboard, a demo environment with no auth
at all). `RaxAuth` follows the exact same shape as `RaxTheme.registerTheme()`:
the framework owns the *dispatch mechanism*, a provider owns the *policy*.

## Default behavior — no provider registered

This is the state of every page in this repository today, and it is a
**deliberate, security-relevant default**, not an oversight:

| Function | Default (no provider) |
|---|---|
| `currentUser()` | `null` (anonymous) |
| `login(credentials)` | rejects with an `Error` explaining no provider is registered |
| `logout()` | rejects with an `Error`, same reasoning |
| `hasPermission(id)` | **`true`, always** — permissive, no access control |
| `beforeRoute(pageId)` | resolves `true`, always — never blocks navigation |

**`hasPermission()` defaulting to `true` is the one default worth reading
twice.** It means: until a host application registers a real provider, RAX
Theme enforces no access control whatsoever — every page and feature is
reachable by anyone who can load the page, exactly as it was before
`auth.js` existed. This is what makes adding `RaxAuth` to every page a
backward-compatible change. If you want real access control, you must
register a provider — RAX Theme will not pretend to have one it doesn't.

## The provider interface

A provider is a plain object implementing some or all of these 7 functions.
Only `currentUser` is required to register at all; every other function
falls back to its documented default (above) if the provider doesn't
implement it.

```ts
interface RaxAuthProvider {
  // REQUIRED
  currentUser(): User | null;

  // Optional — omitting any of these falls back to the default table above
  login(credentials: any): User | Promise<User>;
  logout(): void | Promise<void>;
  hasPermission(permissionId: string, user: User | null, context?: any): boolean;
  beforeRoute(pageId: string, user: User | null): boolean | Promise<boolean>;

  // Optional lifecycle hooks — called by RaxAuth after a successful
  // login()/logout(), in addition to (not instead of) the 'auth:login'/
  // 'auth:logout' events every provider gets for free (see docs/events.md)
  afterLogin(user: User): void;
  afterLogout(): void;
}
```

`User` is intentionally undefined by this API — it's whatever shape your
provider's `currentUser()` returns. RAX Theme never inspects a user
object's fields itself; it only ever passes it through to your own
`hasPermission`/`beforeRoute`/`afterLogin` implementations.

## Registering a provider

```js
RaxAuth.registerProvider({
  currentUser: function () { /* ... */ },
  login: function (credentials) { /* ... */ },
  logout: function () { /* ... */ },
  hasPermission: function (permissionId, user) { /* ... */ },
  beforeRoute: function (pageId, user) { /* ... */ },
  afterLogin: function (user) { /* ... */ },
  afterLogout: function () { /* ... */ },
});
```

**Lifecycle requirement:** register your provider from a plugin script
loaded via `RAX_PLUGINS` (see `docs/plugin-api.md`), **before**
`RaxCore.boot()` runs — `boot()` calls `RaxAuth.beforeRoute()` as part of its
own sequence, so the provider needs to already be registered by then. This
is the same lifecycle timing `RaxTheme.registerTheme()` requires.

Only one provider can be active at a time. Registering a second one replaces
the first (with a console warning) — `RaxAuth` does not compose multiple
providers.

## Function reference

### `RaxAuth.currentUser()`

Returns whatever your provider's `currentUser()` returns, or `null` if no
provider is registered. Synchronous — if your real auth check requires a
network round-trip, do that once (e.g. on page load) and have your
provider's `currentUser()` return a cached result.

### `RaxAuth.login(credentials)` → `Promise<User>`

Delegates to `provider.login(credentials)`. Wraps a non-Promise return value
in `Promise.resolve()` automatically, so your provider can be either
synchronous or asynchronous. On success: calls `provider.afterLogin(user)`
if defined, then emits `auth:login` and `auth:change` (see `docs/events.md`).

### `RaxAuth.logout()` → `Promise<void>`

Same pattern as `login()`, emits `auth:logout` and `auth:change`.

### `RaxAuth.hasPermission(permissionId, context?)` → `boolean`

Delegates to `provider.hasPermission(permissionId, RaxAuth.currentUser(), context)`.
`context` is passed through unmodified — use it for resource-level checks
your provider needs (e.g. `RaxAuth.hasPermission('edit-vlan', { vlanId: 30 })`).

Pair this with `RaxRegistry.registerPermission({ id, label, description })`
(see `docs/plugin-api.md`) to declare what permission IDs your plugin
defines or checks — that registration is metadata only (for a future
permissions-management UI); the actual runtime check always goes through
`hasPermission()` above.

### `RaxAuth.beforeRoute(pageId)` → `Promise<boolean>`

Called automatically by `RaxCore.boot()`, once, before the active page
module's `init()` runs. If your provider's `beforeRoute` resolves/returns
`false`, **`RaxCore` skips that page's `init()` and does nothing else** — no
redirect, no lock screen, no auth UI of any kind. That's entirely your
provider's job:

```js
beforeRoute: function (pageId, user) {
  if (!user && pageId !== 'login') {
    window.location.href = '/login.html'; // your own page, your own logic
    return false;
  }
  return true;
}
```

This division of responsibility is deliberate: RAX Theme's core has zero
opinions about what "not authenticated" should look like.

### `RaxAuth.isProviderRegistered()` → `boolean`

Lets a plugin or page module check whether it should even bother rendering
auth-dependent UI (e.g. a user menu) before calling `currentUser()`.

---

## Illustrative example (not a real provider — do not use as-is)

This shows the *shape* only. It has no real credential check, no network
call, and no session persistence — copy the structure, not the logic.

```js
// plugins/example-auth/index.js — ILLUSTRATIVE ONLY
(function (global) {
  'use strict';

  var mockUser = null; // replace entirely with your real session source

  global.RaxAuth.registerProvider({
    currentUser: function () {
      return mockUser;
    },
    login: function (credentials) {
      // Replace with a real call to your actual auth backend.
      return Promise.resolve({ id: '1', name: credentials.username || 'demo' })
        .then(function (user) { mockUser = user; return user; });
    },
    logout: function () {
      mockUser = null;
      return Promise.resolve();
    },
    hasPermission: function (permissionId, user) {
      // Replace with your real role/permission check.
      return !!user;
    },
    beforeRoute: function (pageId, user) {
      return !!user || pageId === 'login';
    },
    afterLogin: function (user) {
      global.RaxNotifications.ok('Welcome, ' + user.name + '.');
    },
    afterLogout: function () {
      global.RaxNotifications.info('Signed out.');
    },
  });
})(window);
```

## What RAX Theme deliberately does not provide

- No login form, no password field, no credential storage — anywhere.
- No session/cookie/token handling.
- No default provider beyond the permissive no-op described above.
- No lock screen or "access denied" page — see `beforeRoute()` above.
- No enforcement of `hasPermission()` results anywhere in the built-in UI
  today (no built-in page currently calls it) — same "storage/dispatch is
  real, consuming UI is a separate later piece of work" pattern already
  used for `RaxRegistry.registerWidget()`.
