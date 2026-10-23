/* ══ WHAT A CLIENT'S OWN PEOPLE SEE ═════════════════════════════════════
   Their reading list, a published process with "I have read this", and —
   for an approver — the version or the deep-dive plan waiting for them.
   Chosen with "Looking as" in the drawing band. */
const me = () => personById(LOOK_PERSON[UI.look]);
const published = () => procs().filter((p) => inForce(p) && p.status !== 'RETIRED').sort((a, b) => a.code.localeCompare(b.code));
const waitingFor = (who) => procs().filter((p) => p.status === 'IN_REVIEW' && p.approver === who.id);
function staffCounts(who) {
  const toRead = published().filter((p) => expectedReaders(p).some((x) => x.id === who.id) && p.acks.indexOf(who.id) < 0).length;
  const toApprove = waitingFor(who).length + (S.plan.status === 'SENT' && S.plan.approver === who.id ? 1 : 0);
  return { toRead, toApprove };
}
function staffTopBar(who) {
  const c = staffCounts(who), badge = [c.toRead && c.toRead + ' to read', c.toApprove && c.toApprove + ' to approve'].filter(Boolean).join(' · ');
  return '<div class="tb"><div class="trail"><span class="brandname">' + esc(S.ws.name) + '</span><span class="sep">·</span><a class="tbread' + (UI.route[0] === 'read' && !UI.route[1] ? ' on' : '') + '" href="#" data-go="read">Processes' + (badge ? ' <span class="tbn">' + badge + '</span>' : '') + '</a></div>' +
    '<div class="tbacts"><span class="tbwho">' + esc(who.name) + '</span><button class="tbtheme" type="button" data-act="theme" aria-label="Light or dark">' + THEME_ICON + '</button><button class="tbout" type="button" data-act="soon" data-what="Sign out">Sign out</button></div></div>';
}
function staffScreen() {
  const who = me(), r0 = UI.route[0], code = UI.route[1];
  let body;
  if (r0 === 'approve' && byCode(code)) body = readPage(byCode(code), who, true);
  else if (r0 === 'plan-signoff') body = planSignPage(who);
  else if (r0 === 'read' && code && byCode(code)) body = readPage(byCode(code), who, false);
  else body = readList(who);
  return '<div class="frame" style="' + brandVars() + '">' + staffTopBar(who) + '<div class="pg"><div class="read">' + body + '</div></div></div>';
}
function readList(who) {
  const wait = waitingFor(who), plan = S.plan.status === 'SENT' && S.plan.approver === who.id;
  return '<div class="phead"><div><h1>Processes</h1><div class="sub">The approved way we work. Open one to read it and confirm you have.</div></div></div>' +
    (wait.length || plan ? '<div class="sect" style="color:var(--attn-tx)">Waiting for your approval</div><div class="box" style="border-color:var(--attn);margin-bottom:18px">' +
      (plan ? '<div class="readitem" data-go="plan-signoff"><span class="chip attn">Plan</span><span><b>Deep-dive priorities</b><span class="psub">Which processes to take deep, and in what order</span></span><span class="btn sm gold">Open to approve</span></div>' : '') +
      wait.map((p) => '<div class="readitem" data-go="approve~' + p.code + '"><span class="code">' + p.code + '</span><span><b>' + esc(p.name) + '</b><span class="psub">Sent by ' + esc(p.sentBy) + ' on ' + dt(p.sentAt) + '</span></span><span class="btn sm gold">Open to approve</span></div>').join('') + '</div>' : '') +
    '<div class="sect">Published</div><div class="box">' + (published().length ? published().map((p) => { const f = inForce(p), mine = expectedReaders(p).some((x) => x.id === who.id), read = p.acks.indexOf(who.id) >= 0;
      return '<div class="readitem" data-go="read~' + p.code + '"><span class="code">' + p.code + '</span><span><b>' + esc(p.name) + '</b><span class="psub">v' + f.n + ' · in force from ' + dt(f.published) + '</span></span>' + (read ? '<span class="pill good">You have read this version</span>' : mine ? '<span class="pill attn">Needs your acknowledgement</span>' : '<span class="q" style="font-size:12px">For reference</span>') + '</div>'; }).join('') : '<div class="empty">Nothing has been published yet.</div>') + '</div>';
}
function readPage(p, who, approving) {
  const f = inForce(p), v = latestVersion(p);
  const nextN = approving ? (v ? v.n + 1 : 1) : f ? f.n : 1;
  const note = approving ? p.changeNote : f && f.note;
  const steps = workSteps(p);
  let bar;
  if (approving) {
    bar = p.status !== 'IN_REVIEW' || p.approver !== who.id ? '<div class="stick done">Nothing is waiting for your approval here.</div>'
      : '<div class="stick"><span>You are asked to approve this version.</span><span class="acts"><input class="inp" id="ap-why" placeholder="Why it is sent back" style="max-width:240px"><button class="btn" type="button" data-act="apBack" data-code="' + p.code + '">Send back</button><button class="btn gold" type="button" data-act="apApprove" data-code="' + p.code + '">Approve</button></span></div>';
  } else {
    const read = p.acks.indexOf(who.id) >= 0;
    bar = read ? '<div class="stick done">You have read version ' + nextN + '. Thank you.</div>' : '<div class="stick"><span>Confirm you have read and understood version ' + nextN + '.</span><span class="acts"><button class="btn gold" type="button" data-act="ack" data-code="' + p.code + '">I have read this</button></span></div>';
  }
  return '<a class="lnk" href="#" data-go="read">← All processes</a><div class="phead" style="margin-top:10px"><div><h1>' + esc(p.name) + ' <span class="code" style="font-size:14px">' + p.code + '</span></h1><div class="sub">' + (approving ? 'For your approval · sent by ' + esc(p.sentBy) : 'Version ' + nextN + ' · in force from ' + dt(f.published)) + '</div></div></div>' +
    (note ? '<div class="banner attn"><b>What changed in this version.</b> ' + esc(note) + '</div>' : '') +
    '<div class="box" style="padding:16px 18px">' + (p.purpose ? '<div class="lbl">Purpose</div><p style="margin:4px 0 14px">' + esc(p.purpose) + '</p>' : '') +
    (p.inScope.length || p.outScope.length ? '<div class="two" style="margin-bottom:14px"><div><div class="lbl">Covers</div><ul style="padding-left:18px;margin-top:4px">' + p.inScope.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div><div><div class="lbl">Does not cover</div><ul style="padding-left:18px;margin-top:4px">' + p.outScope.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div></div>' : '') +
    '<div class="lbl">The steps</div>' + (steps.length ? steps.map((s, i) => '<div class="rstep"><span class="n">' + (i + 1) + '</span><div><b>' + esc(s.label) + '</b> ' + (s.type === 'DECISION' ? '<span class="chip">Decision</span>' : '') + '<div class="by">Done by: ' + (s.role ? esc(roleName(s.role)) : 'No role named') + '</div>' + (s.actions.length ? '<ul>' + s.actions.map((a) => '<li>' + esc(a) + '</li>').join('') + '</ul>' : '') + '</div></div>').join('') : '<p class="none">No steps are written down.</p>') + '</div>' + bar;
}
ACT.ack = (el) => { const p = byCode(el.dataset.code), who = me(); if (!who.reg) { toast('Only people on the People register can acknowledge. Ask the office to add you.'); return; } if (p.acks.indexOf(who.id) < 0) p.acks.push(who.id); toast('Recorded. Thank you.'); render(); };
ACT.apApprove = (el) => {
  const p = byCode(el.dataset.code), who = me();
  if (p.sentBy === who.name) { toast('You sent this for review, so you cannot also approve it.'); return; }
  const v = latestVersion(p), n = v ? v.n + 1 : 1;
  p.versions.push({ n, approvedAt: todayIso(), by: who.name, role: who.roles.map(roleName).join(', '), published: null, note: p.changeNote, sentBy: p.sentBy });
  p.status = 'APPROVED'; S.feed.unshift([todayIso(), esc(who.name) + ' approved <b>' + esc(p.name) + '</b> v' + n]);
  toast('Approved as v' + n + '. The office publishes it to staff.'); go('read');
};
ACT.apBack = (el) => { const p = byCode(el.dataset.code), why = val('ap-why'); if (!why) { toast('Say why it is sent back.'); return; } p.status = 'DRAFT'; p.returnReason = why; toast('Sent back to the office.'); go('read'); };
function planSignPage(who) {
  const P = S.plan;
  if (P.status !== 'SENT' || P.approver !== who.id) return '<a class="lnk" href="#" data-go="read">← All processes</a><div class="box" style="margin-top:10px"><div class="empty"><b>There is no plan waiting for your approval.</b>When the Strategy Office sends the deep-dive plan to you, it appears here.</div></div>';
  return '<a class="lnk" href="#" data-go="read">← All processes</a><div style="height:10px"></div>' + planDoc(P.snapshot, '<span class="pill attn">Waiting for approval</span>') +
    '<div class="stick"><span>You are asked to approve this plan.</span><span class="acts"><input class="inp" id="pa-why" placeholder="Why it is sent back" maxlength="500" style="max-width:240px"><button class="btn" type="button" data-act="planBack">Send back</button><button class="btn gold" type="button" data-act="planApprove">Approve</button></span></div>';
}
ACT.planApprove = () => { const P = S.plan, who = me(); P.status = 'APPROVED'; P.approvedAt = todayIso(); P.record.unshift([todayIso(), who.name, 'Approved the plan']); toast('Plan approved.'); go('read'); };
ACT.planBack = () => { const why = val('pa-why'); if (!why) { toast('Say why it is sent back.'); return; } const P = S.plan, who = me(); P.status = 'DRAFT'; P.returned = why; P.record.unshift([todayIso(), who.name, 'Sent the plan back to draft', why]); toast('Sent back to the office.'); go('read'); };
