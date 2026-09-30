/* ── PROGRESS — the sign-off queue and what is owed (spec 060 §9.10) ───────
   Signed off from `design-mockups/portfolio/2026-09-18_project-progress.html`.

   IT READS THE PLAN'S ROWS, which is the point rather than a convenience
   (§5.2, §9.8): the count at the top of the Plan page and the count at the
   top of this one come off one array, rolled up once by the route. Nothing
   here computes a figure — the four sections are `waitingSignOff`,
   `overdue`, `nobodyOn` and `signedOff`, and every one of them lives in
   `lib/portfolio.ts` where `checks/portfolio.mjs` asks it with no browser.

   THE PAGE SAYS WHAT IS TRUE AND THE CONTROLS ARE DRAWN FOR WHOEVER HOLDS
   THEM (§301, §9.10): a Lead signs off and reopens, a Contributor reads the
   same four sections and is offered neither, a Viewer the same. **Nothing is
   hidden from anybody** — what changes is what can be pressed — which is the
   difference between this and a narrowed page. The drawing's own *Looking
   as* switch is the DRAWING's and is deliberately not built: it exists so
   both ends could be looked at on a static page, and here the person looking
   is the answer.

   AND THE BOUND THE ROW SAYS IS THE BOUND THE SERVER REFUSES (§42, §124):
   `endDateRefused` is asked by the screen before the press and again by the
   handler after it, so a screen that only narrows a picker has not narrowed
   anything.

   WHAT THE DRAWING'S BOUND HAS AND THIS ONE DOES NOT, said rather than left
   to be discovered (§54.5): *not before the day the work was marked done*.
   **There is no column for that day** (§13.6, §377.6) — the platform stores
   when work was ACCEPTED, which is right, and never when somebody marked it
   done. So the lower bound is the day the work STARTED, which is stamped,
   and the drawing's stricter half is a recorded decision rather than a
   silent omission. The same absence is why a row awaiting sign-off cannot
   be drawn as having overrun on the plan's chart.

   A GOLD EDGE MEANS *THIS ONE IS YOURS TO DO* and is drawn on what is owed
   and never on what is finished — marking somebody's own signed-off rows
   would be a colour that means nothing (§41's budget). */
import { type ModuleKey, clientHref } from "../../lib/modules.ts";
import { barFor } from "../../lib/branding.ts";
import {
  type Row, type Role, type Cadence, type Who, ROLE_WORD,
  renumber, waitingSignOff, overdue, nobodyOn, signedOff,
  nextCheckpoint, mayComplete, mayReopen, inOffice,
} from "../../lib/portfolio.ts";
import type { Project } from "../../lib/portfolio-io.ts";
import { shortDay, readableDay } from "../../lib/day.ts";
import { esc, plural, skeleton, tabs, PROGRESS_CSS } from "./page.ts";

const brk = () => process.env.SMP_BREAK || "";
const DAY = 864e5;
const at = (d: string) => Date.parse(d + "T00:00:00Z");
const over = (a: string, b: string) => Math.round((at(a) - at(b)) / DAY);

export type ProgressArgs = {
  slug: string; tenantId: string; tenantName: string; have: ModuleKey[];
  project: Project;
  rows: Row[];                  /* already rolled up */
  names: Map<string, string>;
  today: string;
  role: Role | null;
  seat: Who["seat"];
  personKey: string | null;
};

const who = (r: Row, names: Map<string, string>) =>
  r.assignee ? (names.get(r.assignee) || r.assigneeName || r.assignee) : (r.assigneeName || "");

function cell(k: string, v: string | number, lab: string, sub: string): string {
  return '<div class="cell ' + k + '"><p class="k">' + esc(lab) + "</p>" +
    '<div class="v">' + esc(String(v)) + '</div><div class="w">' + esc(sub) + "</div></div>";
}

/* WHICH PHASES A LIST SITS IN, worked out rather than typed — the drawing
   typed it once and §9.8's whole lesson is that a typed figure on a second
   reading of one project is the fault (§9.10 records the correction). */
function inPhases(list: Row[], rows: Row[], nums: string[]): string {
  const ps: string[] = [];
  for (const r of list) {
    const p = String(nums[rows.indexOf(r)] || "").split(".")[0];
    if (p && ps.indexOf(p) < 0) ps.push(p);
  }
  if (!ps.length) return "";
  return (ps.length === 1 ? "All in phase " : "Across phases ") + ps.join(", ");
}

/* ══ the queue — the only place the real end date is written ════════════ */
function queue(a: ProgressArgs, nums: string[], mayAccept: boolean): string {
  const list = waitingSignOff(a.rows);
  if (!list.length)
    return '<p class="empty">Nothing is waiting. Everything marked done on this project ' +
      "has been accepted.</p>";
  return list.map((r) => {
    const i = a.rows.indexOf(r);
    const late = !!(r.end && r.end < a.today);
    /* THE BOUND IS WHAT `endDateRefused` REFUSES AND NOTHING MORE: from the
       day the work started, where that is stamped, to today. Saying a bound
       the server does not keep is the drift §42 is about, pointing the other
       way. */
    const bound = r.actualStart
      ? "Between " + shortDay(r.actualStart, a.today) + ", when the work started, and today."
      : "Any date up to today — nothing was stamped when this started.";
    const act = mayAccept
      ? '<span class="qfld"><label for="e-' + esc(r.id) + '">Real end date</label>' +
        '<input id="e-' + esc(r.id) + '" type="date" value="' + esc(a.today) +
        '" max="' + esc(a.today) + '"' + (r.actualStart ? ' min="' + esc(r.actualStart) + '"' : "") + "></span>" +
        '<button type="button" class="cta" data-signoff="' + esc(r.id) + '">Sign off as complete</button>'
      : '<span class="nocta">A Lead signs this off and sets the real end date.</span>';
    return '<div class="q" data-q="' + esc(r.id) + '"><div class="qh">' +
      '<span class="qnum">' + esc(nums[i]) + "</span><b>" + esc(r.name || "") + "</b>" +
      '<span class="qwho">' + esc(who(r, a.names) || "Nobody") + "</span></div>" +
      '<div class="qsub">' +
        (r.end
          ? "Planned to end " + esc(shortDay(r.end, a.today)) + "." +
            (late ? " " + esc(plural(over(a.today, r.end), "day")) + " past that date." : "")
          : "No planned end date.") +
      "</div>" +
      '<p class="qbound">' + esc(bound) + "</p>" +
      '<div class="qact">' + act + "</div></div>";
  }).join("");
}

/* ══ the three plain lists ═════════════════════════════════════════════ */
function rowsOf(a: ProgressArgs, nums: string[], list: Row[], kind: "late" | "free" | "done",
                empty: string, mayUndo: boolean, blocked?: Map<string, Row>): string {
  if (!list.length) return '<p class="empty">' + esc(empty) + "</p>";
  return list.map((r) => {
    const i = a.rows.indexOf(r);
    /* MINE MEANS OWED AND MINE. `done` never wears it (§41's budget), and
       the break paints it on the signed-off list too — which must turn the
       check red (§94.5). Never set on a deployment. */
    const mine = (kind !== "done" || brk() === "gold-on-done") &&
      !!a.personKey && r.assignee === a.personKey;
    let right = "", name = "";
    if (kind === "late") {
      right = '<span class="qwin bad">' + esc(plural(over(a.today, String(r.end)), "day")) + " over</span>";
      name = who(r, a.names) ? esc(who(r, a.names)) : '<span class="none">Nobody</span>';
    } else if (kind === "free") {
      right = '<span class="qwin">' + (r.start ? "Starts " + esc(shortDay(r.start, a.today)) : "No start date") + "</span>";
      name = '<span class="none">Nobody</span>';
    } else {
      right = '<span class="qwin">' + (r.actualEnd ? "Ended " + esc(shortDay(r.actualEnd, a.today)) : "—") + "</span>";
      name = esc(who(r, a.names) || "—");
    }
    /* THE SIGNED-OFF ROW SAYS WHO ACCEPTED IT where the reader cannot undo
       it, rather than leaving the cell where a control would be empty
       (§35, and the drawing's own). */
    const tail = kind !== "done" ? ""
      : mayUndo ? '<button type="button" class="quiet" data-reopen="' + esc(r.id) + '">Reopen</button>'
      : r.signedOffBy ? "by " + esc(a.names.get(r.signedOffBy) || r.signedOffBy)
      : "";
    return '<div class="qrow' + (mine ? " mine" : "") + '" data-r="' + esc(r.id) + '">' +
      '<span class="qnum">' + esc(nums[i]) + "</span>" +
      /* BLOCKED IS NOT A SECTION (§9.10) — 2.3 cannot start because 2.2 has
         not finished, which is a fact about 2.2 and already counted above,
         and a fifth section would make one activity read as two things owed
         (§108.1). It is said on the row instead, because a row thirty days
         over that cannot start explains itself. */
      '<span class="qt">' + esc(r.name || "") +
        (blocked && blocked.get(r.id)
          ? ' <span class="none">\u2014 blocked by ' +
            esc(nums[a.rows.indexOf(blocked.get(r.id) as Row)]) + " " +
            esc(blocked.get(r.id)!.name || "") + "</span>"
          : "") + "</span>" +
      '<span class="qwho">' + name + "</span>" + right +
      '<span class="qtail">' + tail + "</span></div>";
  }).join("");
}

function sec(title: string, count: number, body: string): string {
  return '<div class="box"><div class="pr-h"><b>' + esc(title) + "</b>" +
    '<span class="c">' + (count ? String(count) : "") + "</span></div>" + body + "</div>";
}

export async function progressDocument(a: ProgressArgs): Promise<string> {
  const bar = await barFor(a.tenantId);
  const nums = renumber(a.rows);
  const w: Who = { seat: a.seat, role: a.role };
  /* THE SAME PREDICATE THE HANDLER ASKS (§42, §61): a control the server
     would refuse is never drawn. The break hands both to anybody who can
     see the project, which must turn the check red (§94.5). */
  const mayAccept = brk() === "anyone-signs" ? true : mayComplete(w);
  const mayUndo = brk() === "anyone-signs" ? true : mayReopen(w);

  /* WHAT CANNOT START YET, derived and never stored — its dependency has
     not been accepted. Their schema carries no such column and inventing
     one would be a second answer to a question the plan already holds
     (§53.5, §7.6). The plan's own view works it out the same way. */
  const byId = new Map(a.rows.map((r) => [r.id, r]));
  const blocked = new Map<string, Row>();
  for (const r of a.rows) {
    if (r.lvl !== 2 || !r.dependsOn) continue;
    const dep = byId.get(r.dependsOn);
    if (dep && dep.status !== "completed" && (r.pct ?? 0) < 100) blocked.set(r.id, dep);
  }

  const wait = waitingSignOff(a.rows);
  const late = overdue(a.rows, a.today);
  const free = nobodyOn(a.rows);
  const off = signedOff(a.rows);

  const furthest = late.reduce((m, r) => {
    const n = over(a.today, String(r.end));
    return n > m ? n : m;
  }, 0);

  const strip =
    cell("owed", wait.length, "Waiting to be signed off",
      mayAccept ? "Yours to accept" : "A Lead accepts these") +
    cell("late", late.length, "Past their date",
      late.length ? "The furthest is " + plural(furthest, "day") + " over" : "Nothing is late") +
    cell("", free.length, "Nobody is on these",
      free.length ? inPhases(free, a.rows, nums) : "Everything has a name against it");

  /* THE CHECKPOINT IS A DATE AND NOTHING ELSE (§9.10): it stores nothing,
     records nothing and gates nothing, and a project with none draws no line
     and is not nagged about one (§45.2 with the sign reversed). */
  const cad = a.project.cadence as Cadence | null;
  const when = nextCheckpoint(cad, a.project.cadenceDay, a.today);
  const away = when ? over(when, a.today) : 0;
  const chk = when
    ? '<div class="chk"><span class="k">Next checkpoint</span><b>' +
      esc(readableDay(when)) + "</b><span>&middot; " + esc(cad === "weekly" ? "weekly" : "monthly") +
      ", set on this project &middot; " +
      esc(away === 0 ? "today" : away === 1 ? "tomorrow" : plural(away, "day") + " away") +
      "</span></div>"
    : "";

  const whoWord = inOffice(a.seat) ? "a seat on " + a.tenantName : a.role ? ROLE_WORD[a.role] : "";
  const empty = !a.rows.length;

  const body = '<main class="wrap">\n' +
    '<div class="phead"><div><p class="crumb">' +
      '<a href="' + esc(clientHref(a.slug, "portfolio", "")) + '">Projects</a> &middot; Progress</p>' +
      "<h1>" + esc(a.project.name) + "</h1></div>" +
      (whoWord ? '<span class="word">You are here as ' + esc(whoWord) + "</span>" : "") + "</div>\n" +
    tabs(a.slug, a.project.id, "progress") +
    (empty
      ? '<div class="box"><p class="empty"><b>No plan yet.</b><br>' +
        "Nothing has been broken down for this project, so there is nothing to sign off or " +
        "chase. Writing a plan is not built yet.</p></div>\n"
      : '<div class="strip">' + strip + "</div>\n" + chk +
        sec("Waiting to be signed off", wait.length, queue(a, nums, mayAccept)) +
        sec("Past their date", late.length,
          rowsOf(a, nums, late, "late", "Nothing is past its date.", mayUndo, blocked)) +
        sec("Nobody is on these", free.length,
          rowsOf(a, nums, free, "free", "Every activity has somebody against it.", mayUndo)) +
        sec("Signed off", off.length,
          rowsOf(a, nums, off, "done", "Nothing has been signed off yet.", mayUndo))) +
    "</main>\n";

  return skeleton({ slug: a.slug, tenantName: a.tenantName, have: a.have, bar,
    css: PROGRESS_CSS, api: clientHref(a.slug, "portfolio", "api"),
    js: clientHref(a.slug, "portfolio", "progress.js"), body });
}
