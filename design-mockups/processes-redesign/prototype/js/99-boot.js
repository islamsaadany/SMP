/* ══ BOOT ═══════════════════════════════════════════════════════════════
   Opens the route named in the link (#p~ORD100~map and the like), or the
   Overview. A staff route opens with the matching "Looking as". */
(function boot() {
  function apply(t) {
    UI.route = t.split('~'); UI.layer = null; UI.menu = null;
    const r0 = UI.route[0];
    if (r0 === 'read') UI.look = UI.look === 'approver' ? 'approver' : 'staff';
    else if (r0 === 'approve' || r0 === 'plan-signoff') UI.look = 'approver';
    else if (r0 !== 'review') UI.look = 'office';
  }
  const h = (location.hash || '').slice(1);
  if (h) apply(h);
  render();
  window.addEventListener('hashchange', () => { const t = (location.hash || '').slice(1); if (t && t !== routeToken()) { apply(t); render(); } });
})();
