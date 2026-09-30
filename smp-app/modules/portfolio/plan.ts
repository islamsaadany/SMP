/* ── THE PLAN, IN TWO VIEWS (spec 060 §3, §4, §9.9) ───────────────────────
   Signed off from `design-mockups/portfolio/2026-09-18_project-plan.html`,
   whose three questions Islam answered in one line — *the Timeline IS the
   Gantt, billable is a flag and nothing more, the Charter tab stands*.

   BOTH VIEWS COME OFF ONE LIST AND THAT IS THE RULE, NOT A CONVENIENCE
   (§5.2, §9.9): `planRows` is read once, `rollUp` writes the parents' figures
   onto it once, and the tree and the chart are two readings of that array —
   so they cannot disagree, which is the fault this spec spends its length on
   and the one the charter already caught once (§9.8: two typed figures, both
   wrong). A second builder for the timeline would be §305's measured refusal
   arriving in a module that has only just been written.

   NOTHING HERE COMPUTES A FIGURE. The numbers are `renumber`'s, the parents'
   percentages and spans are `rollUp`'s, *late* is `behind`'s and the two
   counts at the top are `waitingSignOff` and `overdue` — every one of them in
   `lib/portfolio.ts`, where `checks/portfolio.mjs` asks them with no browser.

   THE VIEW AND THE OPENED ROW RIDE ON THE ADDRESS, so a plan opened on one
   activity is a link somebody can send (the tracker's own idiom, spec 054) —
   and the switch is an `<a>` rather than a script, because a link is the
   cheapest thing that can be wrong.

   ONE THING NEEDS THE BROWSER AND IT IS SAID RATHER THAN HIDDEN: a
   dependency's elbow drops from one row to another, and how far that is
   cannot be known here — a typed row pitch is a guessed constant that goes
   stale in silence (§122.5, and the drawing's own was already a pixel wrong
   on the build it was written for). `plan.js` measures the two rows and draws
   it; with no script the chart is complete and the elbows are simply absent.

   WHAT IS NOT BUILT, in this file's own words (§54.5): **Edit** — a plan is
   read here and written nowhere yet, so there is no Edit control rather than
   one that refuses, and the drawing's own Edit button is the third thing in
   its bar that this build does not draw; and **files** on the panel, because
   where a file lives IS the permission and none of that is decided (§9.4).
   Progress and Analytics were on this list until §378 built them, and the
   clause naming them stayed behind for a round — §104.8 in a header, removed
   at §379. */
import { type ModuleKey, clientHref } from "../../lib/modules.ts";
import { barFor } from "../../lib/branding.ts";
import {
  type Row, type Role, ROLE_WORD, ACT_WORD, isActStatus,
  rollUp, overall, renumber, behind, waitingSignOff, overdue,
} from "../../lib/portfolio.ts";
import type { Project, Detail } from "../../lib/portfolio-io.ts";
import { shortDay, monthWord } from "../../lib/day.ts";
import { esc, plural, skeleton, tabs, PLAN_CSS } from "./page.ts";

const brk = () => process.env.SMP_BREAK || "";

const DAY = 864e5;
const at = (d: string) => Date.parse(d + "T00:00:00Z");

/* ══ the shape the two views read ══════════════════════════════════════ */
export type PlanArgs = {
  slug: string; tenantId: string; tenantName: string; have: ModuleKey[];
  project: Project;
  rows: Row[];
  names: Map<string, string>;   /* key → what the register calls them today */
  today: string;
  view: "list" | "time";
  act: Detail | null;           /* the opened activity, or none */
  actRow: Row | null;
  role: Role | null;
  office: boolean;
};

/* THE NAME IS THE REGISTER'S ANSWER, and what was stored beside the key is
   the fallback and never the first reading (§48, §130.9) — so renaming
   somebody renames them on every plan, and somebody the register no longer
   holds keeps the name their row carries (§288.1). */
function who(r: Row, names: Map<string, string>): string {
  if (!r.assignee) return r.assigneeName || "";
  /* The check's break reads the STORED name first, so renaming somebody on
     the register stops renaming them here (§48, §130.9) — which must turn
     checks/portfolio-module red (§94.5). Never set on a deployment. */
  if (brk() === "stale-name") return r.assigneeName || names.get(r.assignee) || r.assignee;
  return names.get(r.assignee) || r.assigneeName || r.assignee;
}

/* THE SPAN A ROW READS AS: a day range inside one month, a month range where
   it crosses one, and months alone for a parent or anything over six weeks —
   which is the drawing's own rule, because *5 Jan – 16 Jan* on a phase that
   runs to August tells nobody anything. */
function span(r: Row, today: string): string {
  if (!r.start || !r.end) return "—";
  /* ONE DAY IS ONE DATE, never "27 – 27 Feb": a milestone's span is the day it
     falls on, and printing it twice reads as a range of nothing. Found by
     looking at the rendered page rather than by a check (§311.1's own lesson). */
  if (r.start === r.end) return shortDay(r.start, today);
  const long = r.lvl < 2 || at(r.end) - at(r.start) > 45 * DAY;
  if (long) {
    const a = monthWord(r.start), b = monthWord(r.end);
    const ya = r.start.slice(2, 4), yb = r.end.slice(2, 4);
    /* A SPAN THAT CROSSES A YEAR SAYS BOTH, or "Sep – Feb 27" reads as though
       September were 2027 too — which it is not, and the drawing never
       crossed a year so it never had to answer this. */
    if (ya !== yb) return a + " " + ya + " – " + b + " " + yb;
    return (a === b ? a : a + " – " + b) + " " + yb;
  }
  const a = shortDay(r.start, today), b = shortDay(r.end, today);
  return a.split(" ")[1] === b.split(" ")[1] ? a.split(" ")[0] + " – " + b : a + " – " + b;
}

/* THE COLUMN SAYS WHAT THE STATUS MEANS, WHERE `ACT_WORD` SAYS WHAT IT IS
   CALLED. `done` and `completed` are the two steps §6.2 keeps apart, and a
   column reading *Done* beside *Completed* asks the reader to have been told
   the difference — so this one reads the drawing's own word, which says it.
   `ACT_WORD` is untouched and is still what the api and every refusal spell,
   because that is the status's NAME (§53.5's line: one answer per question,
   and these are two questions). */
const WORD: Record<string, string> = { ...ACT_WORD, done: "Waiting to sign off" };
function statusOf(r: Row): { cls: string; word: string } {
  if (r.lvl < 2) {
    const p = r.pct ?? 0;
    return p === 100 ? { cls: "done", word: "Completed" }
      : p > 0 ? { cls: "wip", word: "In progress" } : { cls: "not", word: "Not started" };
  }
  const s = isActStatus(r.status) ? r.status : "not_started";
  const cls = s === "completed" ? "done" : s === "done" ? "sign" : s === "in_progress" ? "wip" : "not";
  return { cls, word: WORD[s] };
}

/* BLOCKED IS DERIVED AND NEVER STORED: its dependency has not been signed
   off. Their schema carries no such column and inventing one would be a
   second answer to a question the plan already holds (§53.5, §7.6). */
function blockedSet(rows: readonly Row[]): Set<string> {
  const by = new Map(rows.map((r) => [r.id, r]));
  const out = new Set<string>();
  for (const r of rows) {
    if (r.lvl !== 2 || !r.dependsOn) continue;
    const dep = by.get(r.dependsOn);
    if (dep && dep.status !== "completed" && (r.pct ?? 0) < 100) out.add(r.id);
  }
  return out;
}

/* ══ the list ══════════════════════════════════════════════════════════ */
function listView(a: PlanArgs, nums: string[], blocked: Set<string>): string {
  const head = '<div class="head"><span>#</span><span>Phase · Work package · Activity</span>' +
    "<span>Owner</span><span>Planned</span><span>Status</span><span>Done</span></div>";
  const rows = a.rows.map((r, i) => {
    const st = statusOf(r);
    const late = r.lvl === 2 && behind(r, a.today);
    const owner = who(r, a.names);
    const href = r.lvl === 2 ? planHref(a, { act: r.id }) : null;
    const nm = '<span class="nm">' +
      (r.lvl < 2 ? '<span class="tw">▾</span>' : "") +
      (href ? '<a class="t" href="' + esc(href) + '">' + esc(r.name || "") + "</a>"
            : '<span class="t">' + esc(r.name || "") + "</span>") +
      (r.milestone ? '<span class="mk">Milestone</span>' : "") +
      (blocked.has(r.id) ? '<span class="blk">Blocked</span>' : "") + "</span>";
    return '<div class="r lvl' + r.lvl + (a.act && a.act.id === r.id ? " pick" : "") + '">' +
      '<span class="num">' + esc(nums[i]) + "</span>" + nm +
      '<span class="pwho">' + (owner ? esc(owner) : "—") + "</span>" +
      '<span class="win' + (late ? " late" : "") + '">' + esc(span(r, a.today)) + "</span>" +
      '<span class="st ' + st.cls + '">' + esc(st.word) + "</span>" +
      '<span class="fig">' + (r.pct == null ? "—" : r.pct + "%") + "</span></div>";
  }).join("");
  return '<div class="box" id="list">' + head + rows + "</div>";
}

/* ══ the timeline ══════════════════════════════════════════════════════ */
/* THE SCALE IS THE PLAN'S OWN, and where the plan has no dates the agreed
   window stands in — because a chart drawn on nothing is worse than a
   sentence saying there is nothing to draw (§45.2). */
function scaleOf(a: PlanArgs): { from: string; to: string } | null {
  const days = a.rows.flatMap((r) => [r.start, r.end, r.actualEnd].filter(Boolean) as string[]);
  if (a.project.agreedStart) days.push(a.project.agreedStart);
  if (a.project.agreedEnd) days.push(a.project.agreedEnd);
  if (!days.length) return null;
  const from = days.reduce((m, d) => (d < m ? d : m));
  const to = days.reduce((m, d) => (d > m ? d : m));
  /* BOTH ENDS SNAP TO A WHOLE MONTH, because the axis is months: the start to
     the 1st, and the end to the LAST day of its month — without which a
     milestone falling on the scale's final day is half outside the track and
     is drawn clipped. Found by looking at the chart, not by a check. */
  const end = new Date(Date.UTC(Number(to.slice(0, 4)), Number(to.slice(5, 7)), 0));
  return { from: from.slice(0, 8) + "01", to: end.toISOString().slice(0, 10) };
}

function timeView(a: PlanArgs, nums: string[]): string {
  const sc = scaleOf(a);
  if (!sc)
    return '<div class="box" id="time"' + hid(a.view !== "time") + '><p class="empty">' +
      "<b>Nothing to put on a scale yet.</b><br>The timeline draws itself once the plan carries dates." +
      "</p></div>";

  const t0 = at(sc.from), t1 = at(sc.to) + DAY, W = t1 - t0;
  const pc = (ms: number) => ((ms - t0) / W) * 100 + "%";
  /* THE AXIS SAYS WHICH YEAR WHERE THE SCALE CROSSES ONE, or a plan running
     from January 2026 to February 2027 draws JAN and FEB twice with nothing
     telling them apart. Only the first month of each later year carries it —
     a year on every column would be twelve repetitions of one fact. */
  const months: string[] = [];
  let cur = new Date(t0);
  const y0 = cur.getUTCFullYear();
  while (cur.getTime() < t1) {
    const day = cur.toISOString().slice(0, 10);
    const first = cur.getUTCFullYear() !== y0 && cur.getUTCMonth() === 0;
    months.push(monthWord(day) + (first ? " " + String(cur.getUTCFullYear()).slice(2) : ""));
    cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1));
  }
  const cols = "repeat(" + months.length + ",1fr)";
  const grid = '<div class="grid" style="grid-template-columns:' + cols + '">' +
    months.map(() => "<i></i>").join("") + "</div>";

  let h = '<div class="gwrap"><div class="g"><div class="ghead">' +
    '<span class="gl">Phase · Work package · Activity</span>' +
    '<span class="months" style="grid-template-columns:' + cols + '">' +
    months.map((m) => "<span>" + esc(m) + "</span>").join("") + "</span></div>";

  a.rows.forEach((r, i) => {
    let body = "";
    if (r.start && r.end) {
      const s = at(r.start), e = at(r.end) + DAY;
      /* A MILESTONE IS A DATE, NOT A STRETCH OF WORK (§9.9), so a marked row
         of a day or two is a diamond — and one that genuinely runs for weeks
         keeps its bar, because drawing it as a point would hide when it ran. */
      if (r.milestone && e - s <= 2 * DAY) {
        body = '<span class="dia' + (r.pct === 100 ? "" : " not") + '" style="left:' + pc(s) + '"></span>';
      } else {
        body = '<span class="b' + (r.lvl < 2 ? " sum" : "") + '" style="left:' + pc(s) +
          ";width:calc(" + pc(e) + " - " + pc(s) + ')"><i style="width:' + (r.pct ?? 0) + '%"></i></span>';
        /* PAST THE PLAN, drawn where the work actually ran long — the stamped
           date and never a typed one (§3 №3). */
        if (r.actualEnd && at(r.actualEnd) + DAY > e)
          body += '<span class="over" style="left:' + pc(e) +
            ";width:calc(" + pc(at(r.actualEnd) + DAY) + " - " + pc(e) + ')"></span>';
      }
    }
    h += '<div class="gr lvl' + r.lvl + (a.act && a.act.id === r.id ? " pick" : "") + '"' +
      (r.dependsOn ? ' data-dep="' + esc(r.dependsOn) + '"' : "") +
      ' data-row="' + esc(r.id) + '"' +
      (r.end ? ' data-end="' + esc(pc(at(r.end) + DAY)) + '"' : "") +
      (r.start ? ' data-at="' + esc(pc(at(r.start))) + '"' : "") + ">" +
      '<span class="gl"><span class="gn">' + esc(nums[i]) + "</span>" +
      '<span class="t">' + esc(r.name || "") + "</span></span>" +
      '<span class="track">' + grid + body +
      /* TODAY IS DRAWN ON EVERY TRACK rather than once over the chart: the
         rows scroll sideways together, so a single line would have to be
         positioned against the scroller instead of the scale. */
      (at(a.today) >= t0 && at(a.today) < t1
        ? '<span class="now" style="left:' + pc(at(a.today)) + '"></span>' +
          (i === 0 ? '<span class="nowlab" style="left:' + pc(at(a.today)) + '">Today</span>' : "")
        : "") +
      "</span></div>";
  });

  h += '<div class="gfoot">' +
    '<span><b style="background:var(--good)"></b>Done</span>' +
    '<span><b style="background:var(--surface-2);border:1px solid var(--line)"></b>Still to do</span>' +
    '<span><b style="background:var(--bad)"></b>Past the plan</span>' +
    '<span><b style="background:var(--stone);opacity:.55"></b>A phase, spanning what is in it</span>' +
    '<span><b style="background:var(--gold)"></b>Today</span></div></div></div>';
  return '<div class="box" id="time"' + hid(a.view !== "time") + ">" + h + "</div>";
}

/* The check's break hides neither view, so the switch does nothing and both
   are drawn at once — which must turn checks/portfolio-module red (§94.5).
   Never set on a deployment. */
const hid = (yes: boolean) => (yes && brk() !== "both-views" ? " hidden" : "");

/* ══ the panel ═════════════════════════════════════════════════════════ */
/* THE FIGURE IS THE BREAKDOWN BY WEIGHT AND THE PANEL SAYS SO (§3 №2, §9.8):
   the three sub-activities and their weights are drawn beside the per cent
   they add up to, because a figure with nothing behind it is the one the
   charter got wrong twice. Where there is no breakdown the figure is the
   activity's own and the panel says THAT instead — two honest answers rather
   than one that is true half the time (§35). */
function panel(a: PlanArgs, nums: string[]): string {
  if (!a.act || !a.actRow) return "";
  const r = a.actRow, det = a.act;
  const i = a.rows.indexOf(r);
  const owner = who(r, a.names);
  const st = statusOf(r);
  const by = a.names;
  const row = (lab: string, v: string, full = false) =>
    v ? '<div class="arow' + (full ? " full" : "") + '"><em>' + esc(lab) + '</em><div class="v">' + v + "</div></div>" : "";

  const late = behind(r, a.today);
  const planned = r.start && r.end
    ? '<span class="win' + (late ? " late" : "") + '">' + esc(span(r, a.today)) + "</span>" : "";
  /* WHAT THE ROW SAYS HERE MUST NOT CONTRADICT ITS STATUS ONE LINE UP
     (§124): *still running* is true of work in progress and false of work
     marked done, whose real end date is written AT SIGN-OFF (§9.10) and
     which therefore has none to print. Three states, three sentences — and
     the middle one says where the date comes from rather than leaving a
     reader to wonder why it is missing (§35). Found by looking at the
     rendered panel, not by a check. */
  const over = r.actualEnd && r.end && r.actualEnd > r.end
    ? Math.round((Date.parse(r.actualEnd + "T00:00:00Z") - Date.parse(r.end + "T00:00:00Z")) / DAY) : 0;
  const ranEnd = r.actualEnd
    ? '<span class="win' + (over ? " late" : "") + '">' + esc(shortDay(r.actualEnd, a.today)) + "</span>" +
      (over ? ' <span class="soon">· ' + esc(plural(over, "day")) + " over</span>" : "")
    : r.status === "done" ? '<span class="soon">the end date is written at sign-off</span>'
    : '<span class="soon">still running</span>';
  const ran = r.actualStart ? esc(shortDay(r.actualStart, a.today)) + " – " + ranEnd : "";

  const depRow = r.dependsOn ? a.rows.find((x) => x.id === r.dependsOn) : null;
  const blocks = a.rows.filter((x) => x.dependsOn === r.id);
  const nameWith = (x: Row) => esc(nums[a.rows.indexOf(x)] + " " + (x.name || ""));

  const subs = det.subs.length
    ? '<div class="sub">' + det.subs.map((s) =>
        '<div class="s"><span>' + esc(s.name) + "</span>" +
        '<span class="st ' + (s.status === "done" ? "done" : s.status === "in_progress" ? "wip" : "not") + '">' +
        esc(s.status === "done" ? "Done" : s.status === "in_progress" ? "In progress" : "To do") + "</span>" +
        '<span class="w">' + (s.weight == null ? "—" : s.weight + "%") + "</span></div>").join("") +
      "</div><div class=\"note\">" + (r.pct ?? 0) + "% is these " + det.subs.length +
      " by their weights. Nobody types the figure.</div>"
    : "";

  const collab = det.collaborators.map((k) => esc(by.get(k) || k)).join(", ");
  const signed = det.signedOffAt
    ? esc(shortDay(det.signedOffAt, a.today)) +
      (det.signedOffBy ? " · " + esc(by.get(det.signedOffBy) || det.signedOffBy) : "")
    : "";

  return '<div class="act">\n<header><span class="k">' + esc(nums[i]) + "</span><b>" +
    esc(det.name) + "</b>" +
    (owner ? '<span class="k" style="margin-left:auto">' + esc(owner) + "</span>" : "") +
    '<a class="k shut" href="' + esc(planHref(a, { act: null })) + '">Close</a></header>\n' +
    '<div class="abody">' +
    row("Produces", det.deliverables ? "<p>" + esc(det.deliverables) + "</p>" : "", true) +
    row("About", det.description ? "<p>" + esc(det.description) + "</p>" : "", true) +
    row("Planned", planned) +
    row("Actually", ran) +
    row("Status", '<span class="st ' + st.cls + '">' + esc(st.word) + "</span>") +
    row("Depends on", depRow ? nameWith(depRow) : "") +
    row("Blocks", blocks.map(nameWith).join("<br>")) +
    row("With", collab) +
    row("Signed off", signed) +
    row("Billable", det.billable ? '<span class="mk">Yes</span>' : "") +
    row("Broken into", subs, true) +
    (det.subs.length ? "" :
      row("Progress", (r.pct ?? 0) + "% — the activity's own figure; it has no breakdown", true)) +
    /* FILES ARE DECIDED AND NOT SPECIFIED (§9.4): where one lives IS the
       permission, and none of the path, the ceiling or what happens on delete
       is settled — so the panel says so rather than drawing an empty row that
       reads as a feature that failed (§45.2, §54.5). */
    '<div class="arow full"><em>Files</em><div class="v"><span class="soon">Not built yet</span></div></div>' +
    "</div>\n</div>\n";
}

/* ══ the address ═══════════════════════════════════════════════════════ */
/* THE VIEW AND THE OPENED ROW ARE ON IT, so any state of this page is a link.
   Only what differs from the default is written, or every link would carry
   `?view=list` and read as a choice somebody made (§50.6's shape, in a URL). */
function planHref(a: PlanArgs, over: { view?: "list" | "time"; act?: string | null }): string {
  const view = over.view !== undefined ? over.view : a.view;
  const act = over.act !== undefined ? over.act : (a.act ? a.act.id : null);
  const q: string[] = [];
  if (view === "time") q.push("view=time");
  if (act) q.push("act=" + encodeURIComponent(act));
  return clientHref(a.slug, "portfolio", a.project.id + "/plan") + (q.length ? "?" + q.join("&") : "");
}

export async function planDocument(a: PlanArgs): Promise<string> {
  const bar = await barFor(a.tenantId);
  const nums = renumber(a.rows);
  const blocked = blockedSet(a.rows);
  const wait = waitingSignOff(a.rows).length;
  const late = overdue(a.rows, a.today).length;
  const pct = overall(a.rows);

  const counts =
    (wait ? '<span class="owed">' + esc(plural(wait, "activity", "activities")) + " waiting for sign-off</span>" : "") +
    (late ? '<span class="owed red">' + late + (late === 1 ? " past its date" : " past their date") + "</span>" : "");

  /* THE SWITCH IS TWO LINKS, and the one you are on is marked rather than
     disabled — a control that does nothing is furniture (§94.15), and a
     marked link still says which view this is. */
  const sw = '<span class="sp">' +
    '<a class="btn' + (a.view === "list" ? " on" : "") + '" href="' + esc(planHref(a, { view: "list" })) + '">List</a>' +
    '<a class="btn' + (a.view === "time" ? " on" : "") + '" href="' + esc(planHref(a, { view: "time" })) + '">Timeline</a>' +
    "</span>";

  const whoWord = a.office ? "a seat on " + a.tenantName : a.role ? ROLE_WORD[a.role] : "";
  const empty = !a.rows.length;

  const body = '<main class="wrap pl">\n' +
    '<div class="phead"><div><p class="crumb">' +
      '<a href="' + esc(clientHref(a.slug, "portfolio", "")) + '">Projects</a> &middot; Plan</p>' +
      "<h1>" + esc(a.project.name) + "</h1></div>" +
      (whoWord ? '<span class="word">You are here as ' + esc(whoWord) + "</span>" : "") + "</div>\n" +
    tabs(a.slug, a.project.id, "plan") +
    '<div class="pbar">' + counts +
      (pct == null ? "" : '<span class="pcx">' + pct + "% of the plan done</span>") + sw + "</div>\n" +
    (empty
      ? '<div class="box"><p class="empty"><b>No plan yet.</b><br>' +
        "Nothing has been broken down for this project. Writing one is not built yet.</p></div>\n"
      : listView(a, nums, blocked).replace('id="list"', 'id="list"' + hid(a.view !== "list")) +
        timeView(a, nums) + panel(a, nums)) +
    "</main>\n";

  return skeleton({ slug: a.slug, tenantName: a.tenantName, have: a.have, bar,
    css: PLAN_CSS, js: brk() === "no-elbows" ? undefined : clientHref(a.slug, "portfolio", "plan.js"),
    body });
}
