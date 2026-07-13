/**
 * search.js — RaxSearch
 * ------------------------------------------------------------------
 * Purpose:        Lets each page module register a query function so
 *                 the topbar SearchBox stays page-scoped without the
 *                 Topbar component needing per-page knowledge baked
 *                 in (Phase B §4.6).
 * Responsibility: Store one provider per pageId, invoke it on query.
 * Public API:     RaxSearch.registerProvider(pageId, queryFn)
 *                 RaxSearch.query(pageId, term) -- calls the provider
 *                     if one is registered; emits 'search:results'
 *                     with whatever the provider returns, for the
 *                     page to render however it wants.
 * Dependencies:   RaxEvents
 */
(function (global) {
  'use strict';

  var providers = Object.create(null);

  function registerProvider(pageId, queryFn) {
    providers[pageId] = queryFn;
  }

  function query(pageId, term) {
    var provider = providers[pageId];
    if (!provider) return;
    var results = provider(term) || [];
    global.RaxEvents.emit('search:results', { pageId: pageId, term: term, results: results });
  }

  global.RaxSearch = { registerProvider: registerProvider, query: query };
})(window);
