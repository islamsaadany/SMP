/* ══ CORE ═══════════════════════════════════════════════════════════════
   One state object, one render, one delegated click handler. Every screen is a
   function that returns HTML for the current route; every control names an
   action (data-act) and the action changes state and calls render(). Nothing
   leaves the page: this is a drawing that behaves, not the product. */
'use strict';
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plural = (n, one, many) => n + ' ' + (n === 1 ? one : (many || one + 's'));
const uid = (() => { let n = 1000; return (p) => (p || 'x') + (++n); })();
const TODAY = new Date('2026-10-23T09:00:00');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function dt(iso, withYear) {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length === 10 ? 'T09:00:00' : ''));
  return String(d.getDate()).padStart(2, '0') + ' ' + MONTHS[d.getMonth()] + (withYear === false ? '' : ' ' + d.getFullYear());
}
const dshort = (iso) => dt(iso, false);
const todayIso = () => TODAY.toISOString().slice(0, 10);
function daysFrom(iso) { return Math.round((new Date(iso + 'T09:00:00') - TODAY) / 86400000); }
function addMonths(iso, m) { const d = new Date(iso + 'T09:00:00'); d.setMonth(d.getMonth() + m); return d.toISOString().slice(0, 10); }
const money = (n) => '$' + Number(n).toLocaleString('en-US');

/* the options the team is comparing (the drawing's own switches) */
const OPT = { nav: 'top', brand: false, rail: true, oldTabs: false, marksAll: true, landscape: true, aiPanel: true };
/* per-viewer screen state: never product data */
const UI = { route: ['overview'], look: 'office', menu: null, layer: null, railHidden: null, sel: {}, f: {}, open: {}, msg: null };

/* ── routing ───────────────────────────────────────────────────────── */
const R = {};          // R.name = (args) => html, registered by each screen file
const AFTER = [];      // post-render hooks for one render (map arrows and the like)
function routeToken() { return UI.route.join('~'); }
function go(route, opts) {
  UI.route = Array.isArray(route) ? route.slice() : String(route).split('~');
  UI.menu = null; UI.layer = null; UI.msg = null;
  if (!opts || !opts.keep) UI.sel = {};
  try { history.replaceState(null, '', '#' + routeToken()); } catch (e) {}
  render();
  if (!opts || !opts.keepScroll) window.scrollTo(0, 0);
}
function render() {
  const a = document.activeElement, keepId = a && a.id, caret = keepId && a.selectionStart != null ? [a.selectionStart, a.selectionEnd] : null;
  AFTER.length = 0;
  $('#band').innerHTML = band();
  $('#app').innerHTML = '<div class="doc">' + screen() + '</div>';
  $('#layer').innerHTML = UI.layer ? UI.layer() : '';
  AFTER.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
  positionMenus();
  if (keepId) { const el = document.getElementById(keepId); if (el) { el.focus(); if (caret && el.setSelectionRange) try { el.setSelectionRange(caret[0], caret[1]); } catch (e) {} } }
}
function screen() {
  const name = UI.route[0];
  if (name === 'review') return (R['review'] || (() => ''))(UI.route.slice(1));
  if (UI.look !== 'office') return staffScreen();
  const fn = R[name] || R.overview;
  return frame(fn(UI.route.slice(1)), name);
}

/* an open menu floats above everything, so a table or the frame never clips it */
function positionMenus() {
  $$('#app .menu').forEach((m) => {
    const b = m.parentNode.querySelector('[data-act="menu"]'); if (!b) return;
    const r = b.getBoundingClientRect(), w = m.offsetWidth, h = m.offsetHeight;
    let left = m.classList.contains('left') ? r.left : r.right - w;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    let top = r.bottom + 6; if (top + h > window.innerHeight - 8 && r.top - h - 6 > 8) top = r.top - h - 6;
    Object.assign(m.style, { position: 'fixed', left: left + 'px', top: top + 'px', right: 'auto' });
  });
}
window.addEventListener('scroll', () => { if (UI.menu && UI.menu !== 'opts') { UI.menu = null; render(); } }, { passive: true });

/* ── dialogs, side sheets, toasts ─────────────────────────────────── */
function dialog(o) {
  UI.layer = () => '<div class="scrim" data-act="scrim"><div class="dlg' + (o.wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-labelledby="dlg-t">' +
    '<div class="dlg-h"><div><h3 id="dlg-t">' + o.title + '</h3>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div><button class="x" type="button" data-act="close" aria-label="Close">×</button></div>' +
    '<div class="dlg-b">' + (typeof o.body === 'function' ? o.body() : o.body) + '</div>' +
    (o.foot ? '<div class="dlg-f">' + (typeof o.foot === 'function' ? o.foot() : o.foot) + '</div>' : '') + '</div></div>';
  render();
  setTimeout(() => { const f = $('#layer input:not([type=checkbox]):not([type=radio]):not([readonly]), #layer textarea, #layer select'); if (f) f.focus(); }, 0);
}
function sheet(o) {
  UI.layer = () => '<div class="scrim" data-act="scrim" style="place-items:stretch end;padding:0"></div><aside class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t">' +
    '<div class="dlg-h"><div><h3 id="sh-t">' + o.title + '</h3>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div><button class="x" type="button" data-act="close" aria-label="Close">×</button></div>' +
    '<div class="dlg-b">' + (typeof o.body === 'function' ? o.body() : o.body) + '</div>' +
    (o.foot ? '<div class="dlg-f">' + (typeof o.foot === 'function' ? o.foot() : o.foot) + '</div>' : '') + '</aside>';
  render();
}
function closeLayer() { UI.layer = null; render(); }
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2800); }
const soon = (what) => toast(what + ': not part of this drawing.');

/* ── form helpers ─────────────────────────────────────────────────── */
const val = (id) => { const el = document.getElementById(id); return el ? (el.type === 'checkbox' ? el.checked : el.value.trim()) : ''; };
const checkedVals = (name) => $$('input[name="' + name + '"]:checked').map((i) => i.value);
function fld(label, input, o) {
  o = o || {};
  return '<label class="fld' + (o.full ? ' full' : '') + '"><span>' + label + (o.req ? '<em>*</em>' : '') + '</span>' + input + (o.hint ? '<small>' + o.hint + '</small>' : '') + (o.err ? '<span class="err">' + o.err + '</span>' : '') + '</label>';
}
const inp = (id, v, o) => '<input type="' + ((o && o.type) || 'text') + '" id="' + id + '" value="' + esc(v) + '"' + (o && o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + (o && o.ro ? ' readonly' : '') + (o && o.max ? ' maxlength="' + o.max + '"' : '') + (o && o.min != null ? ' min="' + o.min + '"' : '') + '>';
const area = (id, v, o) => '<textarea id="' + id + '"' + (o && o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + (o && o.rows ? ' rows="' + o.rows + '"' : '') + '>' + esc(v) + '</textarea>';
function sel(id, opts, cur, o) {
  return '<select id="' + id + '"' + (o && o.chg ? ' data-chg="' + o.chg + '"' : '') + (o && o.data ? ' ' + o.data : '') + (o && o.dis ? ' disabled' : '') + '>' +
    opts.map((x) => { const v = Array.isArray(x) ? x[0] : x, l = Array.isArray(x) ? x[1] : x, d = Array.isArray(x) && x[2]; return '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + (d ? ' disabled' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>';
}
const searchBox = (id, ph, v, act) => '<label class="search"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg><input type="search" id="' + id + '" value="' + esc(v || '') + '" placeholder="' + esc(ph) + '" aria-label="' + esc(ph) + '" data-inp="' + act + '"></label>';
function menuBtn(id, label, items, o) {
  o = o || {};
  const open = UI.menu === id;
  return '<div class="menu-wrap"><button class="' + (o.cls || 'btn') + '" type="button" data-act="menu" data-id="' + id + '" aria-expanded="' + open + '"' + (o.aria ? ' aria-label="' + o.aria + '"' : '') + '>' + label + (o.noCaret ? '' : ' <span class="dn">▾</span>') + '</button>' +
    (open ? '<div class="menu' + (o.left ? ' left' : '') + '"' + (o.w ? ' style="min-width:' + o.w + 'px"' : '') + '>' + items + '</div>' : '') + '</div>';
}
const mi = (label, act, attrs, small) => '<button class="mi' + (attrs && attrs.indexOf('bad') === 0 ? ' bad' : '') + '" type="button" data-act="' + act + '" ' + (attrs && attrs.indexOf('bad') === 0 ? attrs.slice(3) : (attrs || '')) + '>' + label + (small ? '<small>' + small + '</small>' : '') + '</button>';
const goBtn = (route, label, cls) => '<a class="' + (cls || 'btn') + '" href="#" data-go="' + route + '">' + label + '</a>';

/* ── actions ──────────────────────────────────────────────────────── */
const ACT = {};        // ACT.name = (el, event) => void, registered by each screen file
const CHG = {};        // change handlers for selects and inputs (data-chg)
const INP = {};        // input handlers (data-inp), for live search
ACT.close = () => closeLayer();
ACT.scrim = (el, e) => { if (e.target === el) closeLayer(); };
ACT.menu = (el) => { UI.menu = UI.menu === el.dataset.id ? null : el.dataset.id; render(); };
ACT.soon = (el) => soon(el.dataset.what || el.textContent.trim());
ACT.toast = (el) => toast(el.dataset.msg);

document.addEventListener('click', (e) => {
  const t = e.target;
  const g = t.closest('[data-go]'), a0 = t.closest('[data-act]');
  if (g && !(a0 && g.contains(a0) && a0 !== g)) { e.preventDefault(); go(g.dataset.go); return; }
  const a = a0;
  if (a) {
    if (a.tagName === 'A') e.preventDefault();
    if (UI.menu && a.dataset.act !== 'menu') UI.menu = null;
    const fn = ACT[a.dataset.act];
    if (fn) fn(a, e); else soon(a.textContent.trim());
    return;
  }
  if (UI.menu && !t.closest('.menu, .mk-pop')) { UI.menu = null; render(); }
});
document.addEventListener('change', (e) => { const el = e.target.closest('[data-chg]'); if (el && CHG[el.dataset.chg]) CHG[el.dataset.chg](el, e); });
document.addEventListener('input', (e) => { const el = e.target.closest('[data-inp]'); if (el && INP[el.dataset.inp]) INP[el.dataset.inp](el, e); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (UI.layer) closeLayer(); else if (UI.menu) { UI.menu = null; render(); } }
  if (e.key === 'Enter' && e.target.matches('[data-enter]')) { e.preventDefault(); const fn = ACT[e.target.dataset.enter]; if (fn) fn(e.target, e); }
});
window.addEventListener('resize', () => { if (window.__rz) cancelAnimationFrame(window.__rz); window.__rz = requestAnimationFrame(() => AFTER.forEach((f) => { try { f(); } catch (er) {} })); });

/* measured elbow arrows between boxes: used by the map and the landscape */
function drawArrows(container, svg, edges) {
  if (!container || !svg || !container.offsetParent) return;
  const o = container.getBoundingClientRect();
  let out = '<defs><marker id="ah-' + svg.id + '" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto"><path class="ah" d="M0 0 8 4 0 8z"/></marker></defs>', labels = '';
  edges.forEach((ed) => {
    const A = document.getElementById(ed.from), B = document.getElementById(ed.to);
    if (!A || !B) return;
    const a = A.getBoundingClientRect(), b = B.getBoundingClientRect();
    const ax = a.left - o.left + container.scrollLeft, ay = a.top - o.top + container.scrollTop, bx = b.left - o.left + container.scrollLeft, by = b.top - o.top + container.scrollTop;
    let d, lx, ly;
    if (Math.abs((ax + a.width / 2) - (bx + b.width / 2)) < 12) {
      const x = ax + Math.round(a.width * 0.32), down = by > ay, y1 = down ? ay + a.height : ay, y2 = down ? by - 2 : by + b.height + 2;
      d = 'M' + x + ' ' + y1 + 'V' + y2; lx = x + 6; ly = (y1 + y2) / 2;
    } else if (bx > ax) {
      const sx = ax + a.width, sy = ay + a.height / 2, ex = bx - 2, ey = by + b.height / 2, mx = Math.round(sx + Math.min(26, (ex - sx) / 2));
      d = Math.abs(sy - ey) < 2 ? 'M' + sx + ' ' + sy + 'H' + ex : 'M' + sx + ' ' + sy + 'H' + mx + 'V' + ey + 'H' + ex;
      lx = mx + 5; ly = Math.abs(sy - ey) < 2 ? sy - 7 : (sy + ey) / 2 + 4;
    } else {
      const sx = ax + a.width / 2, sy = ay + a.height, ex = bx + b.width / 2, ey = by + b.height, low = Math.max(sy, ey) + 22;
      d = 'M' + sx + ' ' + sy + 'V' + low + 'H' + ex + 'V' + (ey + 2); lx = (sx + ex) / 2; ly = low - 5;
    }
    out += '<path d="' + d + '"' + (ed.dash ? ' class="dash"' : '') + ' marker-end="url(#ah-' + svg.id + ')"/>';
    if (ed.label) { const w = ed.label.length * 5.7 + 8; labels += '<rect x="' + (lx - 3) + '" y="' + (ly - 11) + '" width="' + w + '" height="15" rx="3"/><text x="' + lx + '" y="' + ly + '">' + esc(ed.label) + '</text>'; }
  });
  svg.innerHTML = out + labels;
}
