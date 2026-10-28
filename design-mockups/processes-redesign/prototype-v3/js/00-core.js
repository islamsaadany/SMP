/* ══ CORE ══════════════════════════════════════════════════════════════
   State, addresses, one listener for every button, the dialog and the toast.
   Every screen is a function that returns its page; any change re-draws it. */
'use strict';
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clone = (o) => JSON.parse(JSON.stringify(o));
const TODAY = '2026-10-24';
const ACT = {}, CHG = {}, INP = {};
const R = {};
let S = null;
const UI = { as: 'hend', scr: 'list', args: [], sel: null, q: '', sort: ['name', 1], rq: '', rsort: ['name', 1], filt: null, pick: false, undo: [], exp: null };

/* who you can look as: the person each stands for */
const AS = { hend: 'p3', yara: 'p1', dalia: 'p13', mona: 'office' };
const home = (as) => (as === 'mona' ? 'all' : 'list');

/* addresses are plain tokens (#hend.mine, #mona.b.ORD100.map): the artifact host passes only those through */
function go(token) { if (location.hash === '#' + token) render(); else location.hash = token; }
const addr = (...parts) => [UI.as].concat(parts).join('.');
function parse() {
  const parts = (location.hash || '').slice(1).split('.').filter(Boolean);
  UI.as = AS[parts[0]] ? parts[0] : 'hend';
  UI.scr = parts[1] || home(UI.as);
  UI.args = parts.slice(2);
}

let lastKey = '';
const AFTER = [];
function render() {
  const prev = lastKey, prevAs = UI.as;
  parse();
  if (UI.as !== prevAs) UI.filt = null;
  /* Save and exit goes back to wherever the builder was entered from */
  if (UI.scr === 'b' && prev && !/^#mona\.(b|preview)\./.test(prev)) UI.from = prev.slice(1);
  const key = location.hash;
  const keep = key === lastKey ? window.scrollY : 0;
  if (key !== lastKey) { UI.pick = false; }
  $('#band').innerHTML = protoBand();
  const fn = R[UI.scr];
  $('#app').innerHTML = fn ? fn(UI.args) : R[home(UI.as)]([]);
  lastKey = key;
  window.scrollTo(0, keep);
  AFTER.forEach((f) => f());
}

/* the toast, the dialog */
let tt;
function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => { t.hidden = true; }, 3600); }
function dialog({ title, sub, body, foot, wide }) {
  $('#layer').innerHTML = '<div class="scrim" data-act="closeOut"><div class="dlg' + (wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-labelledby="dlg-t"><div class="dlg-h"><h3 id="dlg-t">' + title + '</h3>' + (sub ? '<p>' + sub + '</p>' : '') + '</div><div class="dlg-b">' + body + '</div><div class="dlg-f">' + (foot || '<button class="btn" type="button" data-act="close">Close</button>') + '</div></div></div>';
  setTimeout(() => { const f = $('#layer textarea, #layer input:not([type=checkbox]), #layer select'); if (f) f.focus(); }, 0);
}
function closeLayer() { $('#layer').innerHTML = ''; }
ACT.close = () => closeLayer();
ACT.closeOut = (el, e) => { if (e.target === el) closeLayer(); };
const val = (id) => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
const fld = (label, inner) => '<label class="fld"><span>' + label + '</span>' + inner + '</label>';
const sel = (id, opts, cur) => '<select id="' + id + '">' + opts.map(([v, l]) => '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(l) + '</option>').join('') + '</select>';
const foot2 = (act, label, data) => '<button class="btn" type="button" data-act="close">Cancel</button><button class="btn gold" type="button" data-act="' + act + '"' + (data || '') + '>' + label + '</button>';

/* one listener: data-act runs an action, data-go moves to an address; the innermost wins */
document.addEventListener('click', (e) => {
  const t = e.target;
  if (UI.pick && !t.closest('#pmenu') && !t.closest('[data-act="pick"]')) { UI.pick = false; const m = $('#pmenu'); if (m) m.hidden = true; }
  const a = t.closest('[data-act]'), g = t.closest('[data-go]');
  if (a && (!g || g.contains(a))) { const f = ACT[a.dataset.act]; if (f) f(a, e); return; }
  if (g) { e.preventDefault(); closeLayer(); go(g.dataset.go); }
});
document.addEventListener('change', (e) => { const el = e.target.closest('[data-chg]'); if (el && CHG[el.dataset.chg]) CHG[el.dataset.chg](el, e); });
document.addEventListener('input', (e) => { const el = e.target.closest('[data-inp]'); if (el && INP[el.dataset.inp]) INP[el.dataset.inp](el, e); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeLayer(); if (UI.pick) { UI.pick = false; const m = $('#pmenu'); if (m) m.hidden = true; } } });
window.addEventListener('hashchange', render);

/* the tab bar (and the builder's way out) stays in place; it is marked once it holds on */
function markStuck() { $$('.vtbar,.exitbar').forEach((b) => b.classList.toggle('stuck', window.scrollY > 0 && b.getBoundingClientRect().top <= 1)); }
window.addEventListener('scroll', markStuck, { passive: true });
AFTER.push(markStuck);
