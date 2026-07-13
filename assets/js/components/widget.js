/**
 * components/widget.js — RaxComponents.Widget (GaugeWidget)
 * ------------------------------------------------------------------
 * Purpose:        Generate the ring-gauge SVG markup and drive its
 *                 fill percentage via the --gauge-percent CSS custom
 *                 property (gauge.css owns the fixed stroke-dashoffset
 *                 rule that reads it). Replaces 4 hand-copied SVG
 *                 blocks in dashboard.html with one generator
 *                 (Phase A finding §5/§6).
 * Public API:     mount(el, props) -> instance
 *                 update(instance, props)
 *                 destroy(instance)
 *                 props: { value (0-100), label, unit, sublabel1, sublabel2 }
 * Dependencies:   RaxUtils
 * Extension:      A dashboard widget contributed via
 *                 RaxRegistry.registerWidget can reuse this component
 *                 for any 0-100 metric without writing its own SVG.
 */
(function (global) {
  'use strict';
  var dom = global.RaxUtils.dom;

  var GAUGE_NS = 'http://www.w3.org/2000/svg';

  function svgGauge() {
    var svg = document.createElementNS(GAUGE_NS, 'svg');
    svg.setAttribute('width', '76');
    svg.setAttribute('height', '76');
    svg.setAttribute('viewBox', '0 0 76 76');
    svg.setAttribute('aria-hidden', 'true');

    var track = document.createElementNS(GAUGE_NS, 'circle');
    track.setAttribute('class', 'gauge-track');
    track.setAttribute('cx', '38'); track.setAttribute('cy', '38'); track.setAttribute('r', '32');

    var value = document.createElementNS(GAUGE_NS, 'circle');
    value.setAttribute('class', 'gauge-value');
    value.setAttribute('cx', '38'); value.setAttribute('cy', '38'); value.setAttribute('r', '32');

    svg.appendChild(track);
    svg.appendChild(value);
    return svg;
  }

  function render(el, props) {
    el.innerHTML = '';
    var gauge = dom('div', { class: 'gauge', role: 'img', 'aria-label': props.ariaLabel || (props.label + ': ' + props.value + (props.unit || '%')) });
    gauge.style.setProperty('--gauge-percent', props.value);
    gauge.appendChild(svgGauge());
    gauge.appendChild(dom('div', { class: 'gauge-label' }, [String(props.value) + (props.unit || '%')]));

    var meta = dom('div', {}, [
      dom('div', { class: 'metric-label' }, [props.sublabel1 || '']),
      dom('div', { class: 'metric-label' }, [props.sublabel2 || '']),
    ]);

    el.appendChild(dom('div', { class: 'card-title mb-4' }, [props.label]));
    el.appendChild(dom('div', { class: 'gauge-wrap' }, [gauge, meta]));
  }

  function mount(el, props) {
    render(el, props);
    return { el: el, props: props };
  }

  function update(instance, props) {
    instance.props = Object.assign({}, instance.props, props);
    var gaugeEl = instance.el.querySelector('.gauge');
    if (gaugeEl) gaugeEl.style.setProperty('--gauge-percent', instance.props.value);
    var labelEl = instance.el.querySelector('.gauge-label');
    if (labelEl) labelEl.textContent = String(instance.props.value) + (instance.props.unit || '%');
  }

  function destroy(instance) {
    instance.el.innerHTML = '';
  }

  global.RaxComponents = global.RaxComponents || {};
  global.RaxComponents.Widget = { mount: mount, update: update, destroy: destroy };
})(window);
