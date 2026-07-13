/**
 * components/sidebar.js — RaxComponents.Sidebar
 * ------------------------------------------------------------------
 * Purpose:        Render the primary nav from RaxRegistry.getMenuItems()
 *                 and mark the active page. Replaces the old page-local
 *                 VaryxNav.mount({...}) calls with one registry-driven
 *                 renderer (Phase B §5.4).
 * Responsibility: Sidebar markup only. Never imports a page module.
 * Public API:     mount(el, props) -> instance
 *                 update(instance, props)
 *                 destroy(instance)
 *                 props: { activePageId }
 * Dependencies:   RaxUtils, RaxRegistry, RaxEvents
 */
(function (global) {
  'use strict';
  var dom = global.RaxUtils.dom;

  function groupBySection(items) {
    var sections = [];
    var index = {};
    items.forEach(function (item) {
      if (!index[item.section]) {
        index[item.section] = { label: item.section, items: [] };
        sections.push(index[item.section]);
      }
      index[item.section].items.push(item);
    });
    return sections;
  }

  function render(el, activePageId) {
    el.innerHTML = '';
    el.setAttribute('aria-label', 'Primary navigation');

    el.appendChild(dom('div', { class: 'sidebar-brand' }, [
      dom('div', { class: 'sidebar-brand-mark', 'aria-hidden': 'true' }, ['R']),
      dom('div', { class: 'sidebar-brand-text' }, ['RAX Theme']),
    ]));

    var nav = dom('nav', { class: 'sidebar-nav' });
    var sections = groupBySection(global.RaxRegistry.getMenuItems());

    sections.forEach(function (section) {
      var sectionEl = dom('div', { class: 'sidebar-section' });
      sectionEl.appendChild(dom('div', { class: 'sidebar-section-label' }, [section.label]));

      var list = dom('div', { role: 'list' });
      section.items.forEach(function (item) {
        var isActive = item.pageId === activePageId;
        var link = dom('a', {
          class: 'sidebar-item',
          href: item.href || (item.pageId + '.html'),
          role: 'listitem',
        }, [
          dom('i', { 'data-lucide': item.icon || 'circle', 'aria-hidden': 'true' }),
          dom('span', {}, [item.label]),
        ]);
        if (isActive) link.setAttribute('aria-current', 'page');
        list.appendChild(link);
      });
      sectionEl.appendChild(list);
      nav.appendChild(sectionEl);
    });

    el.appendChild(nav);

    var collapseBtn = dom('button', {
      class: 'sidebar-collapse',
      type: 'button',
      'aria-pressed': String(document.body.dataset.sidebar === 'collapsed'),
      'aria-label': 'Toggle sidebar collapse',
      onClick: function () {
        var collapsed = document.body.dataset.sidebar === 'collapsed';
        document.body.dataset.sidebar = collapsed ? 'expanded' : 'collapsed';
        collapseBtn.setAttribute('aria-pressed', String(!collapsed));
        global.RaxEvents.emit('sidebar:toggle', { collapsed: !collapsed });
      },
    }, [
      dom('i', { 'data-lucide': 'panel-left-close', 'aria-hidden': 'true' }),
      dom('span', {}, ['Collapse']),
    ]);
    el.appendChild(collapseBtn);

    if (global.lucide) global.lucide.createIcons();
  }

  function mount(el, props) {
    props = props || {};
    render(el, props.activePageId);
    var unsubscribe = global.RaxEvents.on('registry:change', function (evt) {
      if (evt.type === 'menuItem') render(el, props.activePageId);
    });
    return { el: el, props: props, unsubscribe: unsubscribe };
  }

  function update(instance, props) {
    instance.props = Object.assign({}, instance.props, props);
    render(instance.el, instance.props.activePageId);
  }

  function destroy(instance) {
    if (instance.unsubscribe) instance.unsubscribe();
    instance.el.innerHTML = '';
  }

  global.RaxComponents = global.RaxComponents || {};
  global.RaxComponents.Sidebar = { mount: mount, update: update, destroy: destroy };
})(window);
