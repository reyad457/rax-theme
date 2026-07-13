/**
 * components/card.js — RaxComponents.Card (StatCard factory)
 * ------------------------------------------------------------------
 * Purpose:        Programmatic creation of the StatCard markup
 *                 pattern (card-head + title + pill + metric-value +
 *                 metric-label), for widgets registered via
 *                 RaxRegistry.registerWidget rather than hand-authored
 *                 per page. Existing hand-authored cards in the 5
 *                 Phase 1 pages are left as semantic HTML — this
 *                 factory exists for the *next* card a plugin adds,
 *                 not to replace markup that already works.
 * Public API:     mount(el, props) -> instance
 *                 update(instance, props)
 *                 destroy(instance)
 *                 props: { title, value, valueSuffix, label, status, glow }
 *                 status: { type: 'ok'|'warn'|'danger'|'info', label, dot }
 *                     dot defaults to true; set false for a dot-less pill
 *                     (e.g. VPN peers count "4 online").
 * Dependencies:   RaxUtils
 */
(function (global) {
  'use strict';
  var dom = global.RaxUtils.dom;

  function render(el, props) {
    el.innerHTML = '';
    el.className = 'card' + (props.glow ? ' card-glow-' + props.glow : '');

    var head = dom('div', { class: 'card-head' }, [
      dom('span', { class: 'card-title' }, [props.title || '']),
    ]);
    if (props.status) {
      var pillChildren = [];
      if (props.status.dot !== false) pillChildren.push(dom('span', { class: 'pill-dot' }));
      pillChildren.push(props.status.label);
      head.appendChild(dom('span', { class: 'pill pill-' + props.status.type }, pillChildren));
    }
    el.appendChild(head);

    var valueChildren = [String(props.value)];
    if (props.valueSuffix) {
      valueChildren.push(dom('span', { class: 'text-md text-tertiary' }, [props.valueSuffix]));
    }
    el.appendChild(dom('div', { class: 'metric-value' }, valueChildren));
    el.appendChild(dom('div', { class: 'metric-label' }, [props.label || '']));
  }

  function mount(el, props) {
    render(el, props);
    return { el: el, props: props };
  }

  function update(instance, props) {
    instance.props = Object.assign({}, instance.props, props);
    render(instance.el, instance.props);
  }

  function destroy(instance) {
    instance.el.innerHTML = '';
  }

  global.RaxComponents = global.RaxComponents || {};
  global.RaxComponents.Card = { mount: mount, update: update, destroy: destroy };
})(window);
