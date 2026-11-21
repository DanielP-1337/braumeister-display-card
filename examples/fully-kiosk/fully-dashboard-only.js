// Fully > Advanced Web Settings > Inject JavaScript. Tablet-local only.
(() => {
  if (window.__braumeisterKiosk) return;
  window.__braumeisterKiosk = true;
  // Choose 'compact' (content height) or 'fullscreen' (at least viewport height).
  const layout = 'compact';
  const observedCards = new WeakSet();
  const cardCss = layout === 'fullscreen' ? ':host{display:block!important;margin:0!important}ha-card{display:flex!important;flex-direction:column!important;box-sizing:border-box!important;min-height:100vh!important;min-height:100dvh!important;border-radius:0!important;border:0!important}.screen{flex:1 0 auto!important}' : '';
  function isDashboard() {
    return location.host === 'HA_HOST:8123' && location.pathname.startsWith('/firehd-braumeister/');
  }
  function style(root, css) {
    if (!root) return;
    const existing = root.querySelector('#braumeister-kiosk-style');
    if (!css) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;
    const node = document.createElement('style');
    node.id = 'braumeister-kiosk-style';
    node.textContent = css;
    root.appendChild(node);
  }
  function visit(root, active) {
    for (const element of root.querySelectorAll('*')) {
      if (!element.shadowRoot) continue;
      const name = element.localName;
      if (name === 'hui-root') {
        style(element.shadowRoot, active ? ':host{--header-height:0px!important;--ha-header-height:0px!important;--lovelace-background:#060606!important}.header,app-header,ha-menu-button{display:none!important}#view,hui-view-container{padding:0!important;margin:0!important;background:#060606!important}' : '');
      }
      if (name === 'home-assistant-main') {
        style(element.shadowRoot, active ? ':host{--ha-sidebar-width:0px!important;--mdc-drawer-width:0px!important}ha-sidebar{display:none!important}' : '');
      }
      if (name === 'ha-drawer') {
        style(element.shadowRoot, active ? ':host{--ha-sidebar-width:0px!important;--mdc-drawer-width:0px!important}.sidebar-shell,.mdc-drawer,wa-drawer{display:none!important}.app-content,.mdc-drawer-app-content{padding-inline-start:0!important;margin-left:0!important;margin-inline-start:0!important;width:100%!important}' : '');
      }
      if (name === 'hui-panel-view') {
        style(element.shadowRoot, active ? ':host{--lovelace-background:#060606!important}#root{padding:0!important;margin:0!important}' : '');
      }
      if (name === 'braumeister-display-card') {
        const cardRoot = element.shadowRoot;
        style(cardRoot, active ? cardCss : '');
        // The card replaces its shadow contents on HA updates. Restore the
        // layout before the next paint instead of waiting for the timer.
        if (active && cardCss && !observedCards.has(cardRoot)) {
          new MutationObserver(() => style(cardRoot, isDashboard() ? cardCss : ''))
            .observe(cardRoot, { childList: true });
          observedCards.add(cardRoot);
        }
        continue;
      }
      visit(element.shadowRoot, active);
    }
  }
  function apply() {
    const active = isDashboard();
    style(document.head, active ? 'html,body{margin:0!important;min-height:100%;background:#060606!important}' : '');
    visit(document, active);
  }
  apply();
  setInterval(apply, 1000);
})();
