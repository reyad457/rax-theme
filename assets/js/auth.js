/**
 * auth.js — RaxAuth
 * ------------------------------------------------------------------
 * Purpose:        A provider-based extension point so a host
 *                 application can plug in ANY authentication system —
 *                 session cookies, JWT, OPNsense's own auth, SSO,
 *                 whatever — without RAX Theme shipping, assuming, or
 *                 depending on any particular one.
 * Responsibility: Hold at most one active auth provider, dispatch the
 *                 7 lifecycle calls to it, and define safe, documented
 *                 defaults for when NO provider is registered at all
 *                 (the default state of every page in this repository
 *                 today — see "Default behavior" below).
 * Public API:     RaxAuth.registerProvider(provider)
 *                 RaxAuth.currentUser() -> object | null
 *                 RaxAuth.login(credentials) -> Promise<user>
 *                 RaxAuth.logout() -> Promise<void>
 *                 RaxAuth.hasPermission(permissionId, context?) -> boolean
 *                 RaxAuth.beforeRoute(pageId) -> Promise<boolean>
 *                 RaxAuth.isProviderRegistered() -> boolean
 * Dependencies:   events.js (emits 'auth:login', 'auth:logout',
 *                 'auth:change')
 * Extension:      This is the entire auth extension point. See
 *                 docs/auth-api.md for the full provider interface
 *                 contract, lifecycle diagram, and a worked (non-
 *                 functional, illustrative-only) example provider.
 * ------------------------------------------------------------------
 * THIS FILE CONTAINS NO REAL AUTHENTICATION. There is no login form,
 * no credential storage, no session/cookie/token handling, and no
 * network call anywhere in this module. It is exclusively the
 * dispatch mechanism a real provider plugs into — same pattern as
 * RaxTheme.registerTheme() (a real, working extension point with zero
 * concrete themes of its own opinion baked in).
 * ------------------------------------------------------------------
 * DEFAULT BEHAVIOR (no provider registered) — this is a
 * security-relevant default, stated explicitly rather than left
 * implicit:
 *   - currentUser()      -> null (anonymous)
 *   - login()/logout()   -> rejects with a clear error (no-op to call)
 *   - hasPermission()    -> true, ALWAYS (permissive / no access
 *                           control at all — this preserves today's
 *                           actual behavior, where every page and
 *                           feature is reachable by anyone who can
 *                           load the page, exactly as before this
 *                           module existed)
 *   - beforeRoute()       -> resolves true, ALWAYS (never blocks
 *                            navigation)
 * A host application that wants real access control MUST register a
 * provider — RAX Theme ships permissive-by-default and does not
 * pretend otherwise. This default is what makes adding this file to
 * every existing page a backward-compatible change: with zero
 * providers registered (true of all 5 built-in pages and the example
 * plugin today), nothing about how the app behaves changes at all.
 */
(function (global) {
  'use strict';

  var provider = null;

  function emit(name, payload) {
    global.RaxEvents && global.RaxEvents.emit(name, payload);
  }

  function registerProvider(p) {
    if (!p || typeof p.currentUser !== 'function') {
      console.error('[RaxAuth] registerProvider requires an object implementing at least currentUser(). See docs/auth-api.md.');
      return;
    }
    if (provider) {
      console.warn('[RaxAuth] An auth provider is already registered — replacing it. Only one provider can be active at a time.');
    }
    provider = p;
    emit('auth:change', { reason: 'provider-registered' });
  }

  function isProviderRegistered() {
    return provider !== null;
  }

  function currentUser() {
    if (!provider || typeof provider.currentUser !== 'function') return null;
    return provider.currentUser();
  }

  function toPromise(value) {
    return value && typeof value.then === 'function' ? value : Promise.resolve(value);
  }

  function login(credentials) {
    if (!provider || typeof provider.login !== 'function') {
      return Promise.reject(new Error('[RaxAuth] login() was called but no auth provider is registered. See docs/auth-api.md.'));
    }
    return toPromise(provider.login(credentials)).then(function (user) {
      if (typeof provider.afterLogin === 'function') provider.afterLogin(user);
      emit('auth:login', { user: user });
      emit('auth:change', { reason: 'login' });
      return user;
    });
  }

  function logout() {
    if (!provider || typeof provider.logout !== 'function') {
      return Promise.reject(new Error('[RaxAuth] logout() was called but no auth provider is registered. See docs/auth-api.md.'));
    }
    return toPromise(provider.logout()).then(function () {
      if (typeof provider.afterLogout === 'function') provider.afterLogout();
      emit('auth:logout', {});
      emit('auth:change', { reason: 'logout' });
    });
  }

  function hasPermission(permissionId, context) {
    // Permissive default — see the module docblock's "Default behavior"
    // note. This is the one function in this module where the default
    // is a real, deliberate policy decision, not just a placeholder.
    if (!provider || typeof provider.hasPermission !== 'function') return true;
    return !!provider.hasPermission(permissionId, currentUser(), context);
  }

  function beforeRoute(pageId) {
    if (!provider || typeof provider.beforeRoute !== 'function') return Promise.resolve(true);
    return toPromise(provider.beforeRoute(pageId, currentUser())).then(function (allowed) {
      return allowed !== false;
    });
  }

  global.RaxAuth = {
    registerProvider: registerProvider,
    isProviderRegistered: isProviderRegistered,
    currentUser: currentUser,
    login: login,
    logout: logout,
    hasPermission: hasPermission,
    beforeRoute: beforeRoute,
  };
})(window);
