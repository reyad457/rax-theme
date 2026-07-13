/**
 * components/tabs.js — RaxComponents.Tabs
 * ------------------------------------------------------------------
 * Purpose:        Generic tab controller. Replaces the bespoke,
 *                 page-local activateTab()/hashMap logic previously
 *                 hand-written in logs.html (Phase A finding §4).
 * Responsibility: Wire up existing .tabbar/.tab-btn/.tab-panel markup
 *                 with correct ARIA state + optional hash-routing. It
 *                 does not generate the tab markup itself — pages
 *                 author semantic tab markup, this component makes it
 *                 interactive and accessible.
 * Public API:     mount(el, props) -> instance
 *                 update(instance, props) -- no-op, tabs are self-managing
 *                 destroy(instance)
 *                 props: { hashMap: { hashValue: tabId } }
 * Dependencies:   RaxUtils
 * Extension:      Any page with a `.tabbar` inside `el` gets working,
 *                 accessible tabs automatically — no per-page JS
 *                 required.
 */
(function (global) {
  'use strict';
  var qsa = global.RaxUtils.qsa;

  function activate(el, tabId) {
    var btn = el.querySelector('.tab-btn[data-tab="' + tabId + '"]');
    var panel = el.querySelector('#' + tabId);
    if (!btn || !panel) return;

    qsa('.tab-btn', el).forEach(function (b) { b.setAttribute('aria-selected', 'false'); b.tabIndex = -1; });
    qsa('.tab-panel', el).forEach(function (p) { p.dataset.active = 'false'; p.setAttribute('hidden', ''); });

    btn.setAttribute('aria-selected', 'true');
    btn.tabIndex = 0;
    panel.dataset.active = 'true';
    panel.removeAttribute('hidden');
  }

  function wireAria(el) {
    var tabbar = el.querySelector('.tabbar');
    if (!tabbar) return;
    tabbar.setAttribute('role', 'tablist');
    qsa('.tab-btn', el).forEach(function (btn) {
      var tabId = btn.dataset.tab;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('id', 'tab-' + tabId);
      btn.setAttribute('aria-controls', tabId);
      var panel = el.querySelector('#' + tabId);
      if (panel) {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', 'tab-' + tabId);
      }
    });
  }

  function wireKeyboardNav(el) {
    var buttons = qsa('.tab-btn', el);
    buttons.forEach(function (btn, i) {
      btn.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        var next = e.key === 'ArrowRight' ? (i + 1) % buttons.length : (i - 1 + buttons.length) % buttons.length;
        buttons[next].focus();
        activate(el, buttons[next].dataset.tab);
      });
    });
  }

  function mount(el, props) {
    props = props || {};
    wireAria(el);
    wireKeyboardNav(el);

    var clickHandler = function (e) {
      var btn = e.target.closest('.tab-btn');
      if (!btn || !el.contains(btn)) return;
      activate(el, btn.dataset.tab);
      if (props.hashMap) {
        var hash = Object.keys(props.hashMap).find(function (h) { return props.hashMap[h] === btn.dataset.tab; });
        if (hash) history.replaceState(null, '', '#' + hash);
      }
    };
    el.addEventListener('click', clickHandler);

    var initialTab = null;
    if (props.hashMap) {
      var hashKey = window.location.hash.replace('#', '');
      initialTab = props.hashMap[hashKey];
    }
    var first = el.querySelector('.tab-btn');
    activate(el, initialTab || (first && first.dataset.tab));

    return { el: el, clickHandler: clickHandler, props: props };
  }

  function update() { /* tabs manage their own DOM state; nothing to patch externally */ }

  function destroy(instance) {
    instance.el.removeEventListener('click', instance.clickHandler);
  }

  global.RaxComponents = global.RaxComponents || {};
  global.RaxComponents.Tabs = { mount: mount, update: update, destroy: destroy };
})(window);
