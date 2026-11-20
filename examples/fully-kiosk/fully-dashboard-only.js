// Fully > Advanced Web Settings > Inject JavaScript. Tablet-local only.
(() => {
  if (window.__braumeisterKiosk) return;
  window.__braumeisterKiosk = true;
  function style(root, css) {
    if (!root || root.querySelector('#braumeister-kiosk-style')) return;
    const node = document.createElement('style');
    node.id = 'braumeister-kiosk-style';
    node.textContent = css;
    root.appendChild(node);
  }
  function visit(root) {
    for (const element of root.querySelectorAll('*')) {
      if (!element.shadowRoot) continue;
      const name = element.localName;
      if (name === 'hui-root') {
        style(element.shadowRoot, ':host{--header-height:0px!important;--ha-header-height:0px!important}.header,app-header,ha-menu-button{display:none!important}#view,hui-view-container{padding-top:0!important;margin-top:0!important}');
        continue;
      }
      if (name === 'home-assistant-main') {
        style(element.shadowRoot, ':host{--ha-sidebar-width:0px!important;--mdc-drawer-width:0px!important}ha-sidebar{display:none!important}');
      }
      if (name === 'ha-drawer') {
        style(element.shadowRoot, ':host{--ha-sidebar-width:0px!important;--mdc-drawer-width:0px!important}.sidebar-shell,.mdc-drawer,wa-drawer{display:none!important}.app-content,.mdc-drawer-app-content{padding-inline-start:0!important;margin-left:0!important;margin-inline-start:0!important;width:100%!important}');
      }
      visit(element.shadowRoot);
    }
  }
  function apply() {
    if (location.host !== 'HA_HOST:8123' || !location.pathname.startsWith('/firehd-braumeister/')) return;
    visit(document);
  }
  apply();
  setInterval(apply, 1000);
})();
