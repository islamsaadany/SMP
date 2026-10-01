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

   AND SINCE §380 IT IS ALSO WHERE A PLAN IS WRITTEN (§15), from the drawing
   Islam signed off with *I want to start planning*. THE PEN IS THE ADDRESS
   (`?edit=1`), which is this page's own idiom — the view switch is two links
   already — and it means every control in edit mode is in the document only
   for somebody the rules allow (§61: a control the server refuses is never
   drawn). THERE IS NO PLANNING MODE and §7.3 settled that on the audit: a
   field writes when the cursor leaves it and the api answers with the plan
   DRAWN AGAIN, by `planBody` below, which the script swaps in — so the
   browser holds no copy of the tree and cannot disagree with the server about
   the numbering, the arrows or where an add row goes (§53.5, the tracker's
   own answer at §356.12).

   WHAT IS NOT BUILT, in this file's own words (§54.5): **files** on the
   panel, because where a file lives IS the permission and none of that is
   decided (§9.4); **inserting a row in the middle** — a row is appended and
   moved up, which is §15.3's stated cost; and **an archive of a removed
   row**, which is §15.9's third open question rather than an omission.
   Progress and Analytics were on this list until §378 built them, and the
   clause naming them stayed behind for a round — §104.8 in a header, removed
   at §379. */
import { type ModuleKey, clientHref } from "../../lib/modules.ts";
import { barFor } from "../../lib/branding.ts";
import {
  type Row, type Role, type Who, type Kind, ROLE_WORD, ACT_WORD, isActStatus,
  rollUp, overall, renumber, behind, waitingSignOff, overdue,
  mayMove, removeRefused, mayReport, mayMarkDone, manualProgressRefused, cascade,
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
  /* WRITING (§15). `edit` IS THE PEN AND CARRIES THE GATE: it is true only
     for somebody `mayBuildPlan` allows, enforced at the two places that
     build these args and nowhere below — written as `edit && build` at each
     control, it was ONE QUESTION WITH SEVEN ANSWERS, and the falsification
     that removes the address gate went green over the other six (§53.5,
     §54.5). `build` survives for the two things that are a different
     question: whether the Edit button is drawn at all, and what an empty
     plan says to somebody who could fill it. `personKey` is here because
     reporting a row is read off the ROW and never off the membership
     (§6.2) — the panel asks `mayReport` per activity, which is what lets the
     person a row is assigned to write its breakdown and nothing else
     (§15.7). */
  edit: boolean;
  build: boolean;
  seat: Who["seat"];
  personKey: string | null;
  /* The register, for the owner picker: who may be named on a row. */
  people: { key: string; name: string; place: string }[];
};
/* Who this viewer is, as the rules take it — the SEAT is the door's answer
   and is passed through rather than guessed from `office`, which is the same
   pair Progress and Analytics already take (§53.5). */
function w(a: PlanArgs): Who { return { seat: a.seat, role: a.role }; }

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
/* WHICH KIND A ROW IS, from its level — one map, because the api, the
   queries and this file would otherwise each spell the three words (§53.5). */
const KIND_OF: Record<number, Kind> = { 0: "phase", 1: "package", 2: "activity" };

/* THE TWO ARROWS AND THE CROSS (§15.2). An arrow that can do nothing is NOT
   DRAWN and its space is kept, so the × does not move between rows (§94.15,
   §302's family) — and whether it can do anything is `mayMove`'s answer, the
   same one the server refuses with, or the page draws a control the api turns
   away (§61, §42). Drawn only in edit mode: a strip that is drawn and hidden
   leaves every row holding a column of space it is not using. */
const UP = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 2.5 10 8H2z"/></svg>';
const DOWN = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 9.5 2 4h8z"/></svg>';

function strip(a: PlanArgs, r: Row): string {
  if (!a.edit) return "";
  const gap = '<span style="width:22px"></span>';
  const bu = (dir: -1 | 1, mark: string, word: string) =>
    mayMove(a.rows, r.id, dir)
      ? '<button type="button" data-mv="' + (dir === 1 ? "down" : "up") + '" title="Move ' + word + '"' +
        ' aria-label="Move ' + esc(r.name || "") + " " + word + '">' + mark + "</button>"
      : gap;
  return '<span class="rowbu">' + bu(-1, UP, "up") + bu(1, DOWN, "down") +
    '<button type="button" class="rm" data-rm title="Remove"' +
    ' aria-label="Remove ' + esc(r.name || "") + '">&times;</button></span>';
}

/* ONE ADD ROW AT THE FOOT OF EVERY CONTAINER, and the kind is decided by
   WHERE you are typing rather than by a picker somewhere else (§15.3): a work
   package holds activities and says so, the tree holds phases and says so,
   and a phase may hold either, so it offers both and pressing one key puts
   the cursor in the box. That is the Internal Tracker's idiom, chosen there
   for the same reason — *we are shifting from a simple google sheet, so it
   needs to be super simple* (§356).

   A *+ add beneath* on the row strip was drawn and REMOVED: on a phase it
   cannot say whether it means a work package or an activity, and these rows
   already say it unambiguously — two ways to do one thing, one of them vague
   (§32). */
function addRow(lvl: 0 | 1 | 2, parent: string, kinds: Kind[]): string {
  const word = (k: Kind) => (k === "package" ? "work package" : k);
  const keys = kinds.length === 1
    ? '<span class="ak">+ ' + esc(word(kinds[0])) + "</span>"
    : kinds.map((k, n) =>
        '<button type="button" class="ak" data-kind="' + k + '" aria-pressed="' + (n === 0) + '">+ ' +
        esc(word(k)) + "</button>").join("");
  return '<div class="addr l' + lvl + '" data-add="' + esc(parent) + '" data-kind="' + kinds[0] + '">' +
    keys + '<input placeholder="Name it and press Enter"' +
    ' aria-label="Add a ' + esc(word(kinds[0])) + '"></div>';
}

/* WHICH CONTAINER A ROW IS IN — the nearest shallower row, by position,
   which is `kidsOf`'s own reading of the tree (§5.2). An activity straight
   under a phase has the phase as its parent, which is exactly what the
   schema's two nullable columns say (§7.6). */
function parentOf(rows: readonly Row[], i: number): { id: string; lvl: number } | null {
  for (let k = i - 1; k >= 0; k--) if (rows[k].lvl < rows[i].lvl) return { id: rows[k].id, lvl: rows[k].lvl };
  return null;
}
/* And the PHASE a row sits under, however deep it is. */
function phaseOf(rows: readonly Row[], i: number): string | null {
  for (let k = i; k >= 0; k--) if (rows[k].lvl === 0) return rows[k].id;
  return null;
}

function listView(a: PlanArgs, nums: string[], blocked: Set<string>): string {
  const ed = a.edit;
  const head = '<div class="head"><span>#</span><span>Phase · Work package · Activity</span>' +
    "<span>Owner</span><span>Planned</span><span>Status</span><span>Done</span>" +
    (ed ? '<span class="edonly"></span>' : "") + "</div>";
  const out: string[] = [];
  a.rows.forEach((r, i) => {
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
    out.push('<div class="r lvl' + r.lvl + (a.act && a.act.id === r.id ? " pick" : "") +
      '" data-row="' + esc(r.id) + '" data-kind="' + KIND_OF[r.lvl] + '">' +
      '<span class="num">' + esc(nums[i]) + "</span>" + nm +
      '<span class="pwho">' + (owner ? esc(owner) : "—") + "</span>" +
      '<span class="win' + (late ? " late" : "") + '">' + esc(span(r, a.today)) + "</span>" +
      '<span class="st ' + st.cls + '">' + esc(st.word) + "</span>" +
      '<span class="fig">' + (r.pct == null ? "—" : r.pct + "%") + "</span>" +
      strip(a, r) + "</div>");
    if (!ed) return;
    /* The add row sits where a container ENDS, which is the last row at or
       below its level — read off the next row rather than counted, for
       `kidsOf`'s own reason (§5.2: the tree is positional). */
    const next = a.rows[i + 1];
    const par = parentOf(a.rows, i);
    const closesPkg = r.lvl === 2 && par && par.lvl === 1 && (!next || next.lvl <= 1);
    const closesPhase = (!next || next.lvl === 0) && r.lvl > 0;
    if (closesPkg && par) out.push(addRow(2, par.id, ["activity"]));
    if (closesPhase) {
      /* A PHASE ALREADY HOLDING A WORK PACKAGE IS OFFERED ONLY ANOTHER ONE,
         because an activity hung beside a package would number 1.1 against
         that package's own 1.1 (§3 №5's collapse, from the other side). */
      const ph = phaseOf(a.rows, i);
      if (ph) {
        const hasPkg = a.rows.some((x, j) => x.lvl === 1 && phaseOf(a.rows, j) === ph);
        out.push(addRow(1, ph, hasPkg ? ["package"] : ["activity", "package"]));
      }
    }
  });
  if (ed) out.push(addRow(0, a.project.id, ["phase"]));
  return '<div class="box pl' + (ed ? " ed" : "") + '" id="list">' + head + out.join("") +
    (ed ? '<div class="ednote edonly">Numbers follow position. Moving or removing a row renumbers' +
      " the ones after it — a code is where a row sits, not a name it keeps.</div>" : "") +
    (ed ? '<div class="said" id="said"></div>' : "") + "</div>";
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
   the sub-activities and their weights are drawn beside the per cent they add
   up to, because a figure with nothing behind it is the one the charter got
   wrong twice. Where there is no breakdown the figure is the activity's own
   and the panel says THAT instead — two honest answers rather than one that
   is true half the time (§35).

   AND SINCE §380 TWO AUDIENCES SHARE IT AND SEE DIFFERENT HALVES (§15.7):

     · a Lead or a seat (`mayBuildPlan`) writes every fact on the row;
     · the person it is assigned to (`mayReport`) gets the breakdown's status
       pickers and *Mark it done*, and NOTHING else — the platform's own rule
       in its own words, *see the plan, write your own rows* (§7.4A). THE
       STEP'S NAME AND ITS WEIGHT ARE THE PLAN'S, NOT THE REPORT'S, so they
       read as text for them; the drawing's first draft made all three boxes
       and quietly let somebody reporting their own work re-weight it;
     · a Viewer sees the read panel and no control at all. Everybody lands at
       Viewer, so read-only is what the default quietly grants, which is the
       only default that fails closed (§7.4B).

   THE DRAWING'S `.leadonly`/`.cononly` PAIR IS NOT BUILT, deliberately: it is
   a mockup device for showing two states side by side, and the server knows
   which one this is — so one of them is DRAWN and the other does not reach
   the document at all (§61: a control the server refuses is never drawn, and
   §298.2 three times over on what `hidden` does to a box with its own
   `display`). */

/* A DAY IS SET THE WAY THE OFFICE'S OTHER MODULES SET ONE (§356.14, §357.4):
   the word is the button and the native box is CLIPPED beside it rather than
   swapped in for it, so the day never reformats under the hand that pressed
   it — and the press asks the browser for its picker, which is the one thing
   a check cannot see, so what is asserted is that the picker was ASKED FOR.
   Never dismissed on blur: opening the calendar IS focus leaving the box,
   which is the fault Islam hit on the tracker. */
function dayBu(field: "start" | "end", v: string | null, today: string, label: string): string {
  return '<span class="dayw"><button type="button" class="daybu" data-day="' + field + '"' +
    ' aria-label="' + esc(label) + '">' + esc(v ? shortDay(v, today) : "Not set") + "</button>" +
    '<input type="date" tabindex="-1" aria-hidden="true" value="' + esc(v || "") + '"></span>';
}

function panel(a: PlanArgs, nums: string[]): string {
  if (!a.act || !a.actRow) return "";
  const r = a.actRow, det = a.act;
  const i = a.rows.indexOf(r);
  const owner = who(r, a.names);
  const st = statusOf(r);
  const by = a.names;
  const row = (lab: string, v: string, full = false) =>
    v ? '<div class="arow' + (full ? " full" : "") + '"><em>' + esc(lab) + '</em><div class="v">' + v + "</div></div>" : "";
  /* A row that is EMPTY still has to be drawn where it can be written, or the
     one field a plan is missing is the one with no box (§45.2, §61). */
  const wrow = (lab: string, v: string, full = false) =>
    '<div class="arow' + (full ? " full" : "") + '"><em>' + esc(lab) + '</em><div class="v">' + v + "</div></div>";

  /* THE PEN IS FOR RESTRUCTURING AND REPORTING IS NOT, which is why these
     are two tests rather than one (§15.1, §15.7): a Lead's FIELDS are behind
     the pen, because changing what the plan says is a mode somebody enters,
     and the breakdown's status pickers and *Mark it done* are drawn with no
     mode at all — reporting is what the person a row is assigned to came to
     do, and they have no pen to open (`mayBuildPlan` is false for them, so
     `?edit=1` is simply ignored).

     Which also means a Lead with the pen SHUT still reports: `mayReport`
     answers true for anybody who may build (§6.2), so the two halves overlap
     on purpose rather than being an either/or. */
  const build = a.edit;
  const on = { assignee: r.assignee, collaborators: det.collaborators };
  const report = mayReport(w(a), a.personKey, on);
  const mark = mayMarkDone(w(a), a.personKey, on);

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

  /* ══ the breakdown ═══════════════════════════════════════════════════ */
  const SUBW: Record<string, string> = { todo: "To do", in_progress: "In progress", done: "Done" };
  const subPick = (id: string, now: string) =>
    '<select class="fld" data-sub="' + esc(id) + '" data-field="status" aria-label="Step">' +
    ["todo", "in_progress", "done"].map((v) =>
      '<option value="' + v + '"' + (v === now ? " selected" : "") + ">" + esc(SUBW[v]) + "</option>").join("") +
    "</select>";
  const subs = det.subs.length
    ? '<div class="sub">' + det.subs.map((s) => {
        const cls = s.status === "done" ? "done" : s.status === "in_progress" ? "wip" : "not";
        if (!build && !report)
          return '<div class="s"><span>' + esc(s.name) + "</span>" +
            '<span class="st ' + cls + '">' + esc(SUBW[s.status] || s.status) + "</span>" +
            '<span class="w">' + (s.weight == null ? "—" : s.weight + "%") + "</span></div>";
        /* Name and weight are the PLAN's; the status is the REPORT's (§15.7). */
        const nm = build
          ? '<input class="fld" data-sub="' + esc(s.id) + '" data-field="name" value="' + esc(s.name) + '" aria-label="Step">'
          : esc(s.name);
        const wt = build
          ? '<input class="fld" data-sub="' + esc(s.id) + '" data-field="weight" inputmode="numeric" value="' +
            esc(s.weight == null ? "" : String(s.weight)) + '" aria-label="Weight">'
          : '<span class="wt">' + (s.weight == null ? "—" : s.weight + "%") + "</span>";
        return '<div class="s edit"><span class="wcell">' + nm + "</span>" + subPick(s.id, s.status) +
          '<span class="wcell">' + wt + "</span>" +
          (build ? '<span class="rowbu"><button type="button" class="rm" data-subrm="' + esc(s.id) +
            '" title="Remove">&times;</button></span>' : "<span></span>") + "</div>";
      }).join("") + "</div>" +
      (build ? '<div class="subadd"><input class="fld" id="subadd" placeholder="Add a step and press Enter"' +
        ' aria-label="Add a step"><span></span><span></span><span></span></div>' : "") +
      '<div class="note derived">The figure above is <b>' + (r.pct ?? 0) + "%</b> — these " +
      det.subs.length + " by their weights. Nobody types it." +
      (build ? " <b>Where the weights do not add up to 100 they are ignored and every step counts the" +
        " same</b>, which is the honest answer to a half-filled set rather than a refusal mid-edit." : "") +
      "</div>"
    : build
    ? '<div class="subadd"><input class="fld" id="subadd" placeholder="Add a step and press Enter"' +
      ' aria-label="Add a step"><span></span><span></span><span></span></div>' +
      '<div class="note derived">Nothing yet. With a breakdown the figure above is worked out from it' +
      " and nobody types it.</div>"
    : "";

  const collab = det.collaborators.map((k) => esc(by.get(k) || k)).join(", ");
  const signed = det.signedOffAt
    ? esc(shortDay(det.signedOffAt, a.today)) +
      (det.signedOffBy ? " · " + esc(by.get(det.signedOffBy) || det.signedOffBy) : "")
    : "";

  /* ══ the rows, written or read ═══════════════════════════════════════ */
  const nameRow = build
    ? wrow("Name", '<input class="fld" data-field="name" value="' + esc(det.name) + '" aria-label="Name">', true)
    : "";
  const prose = (field: "deliverables" | "description", lab: string, v: string) =>
    build
      ? wrow(lab, '<textarea class="fld" rows="2" data-field="' + field + '" aria-label="' + esc(lab) + '">' +
          esc(v) + "</textarea>", true)
      : row(lab, v ? "<p>" + esc(v) + "</p>" : "", true);

  const plannedRow = build
    ? wrow("Planned", '<span class="two">' + dayBu("start", r.start || null, a.today, "Planned start") +
        '<span class="to">to</span>' + dayBu("end", r.end || null, a.today, "Planned end") + "</span>")
    : row("Planned", planned);

  const ownerRow = build
    ? wrow("Owner", '<select class="fld" data-field="assignee" aria-label="Owner">' +
        '<option value="">Nobody</option>' +
        a.people.map((p) =>
          '<option value="' + esc(p.key) + '"' + (p.key === r.assignee ? " selected" : "") + ">" +
          esc(p.name + (p.place ? " — " + p.place : "")) + "</option>").join("") +
        /* A NAME THE REGISTER NO LONGER HOLDS KEEPS ITS PLACE ON THE LIST
           (§96.2, §130.9): a row assigned to somebody who has left would
           otherwise read as Nobody the moment the pen is opened, and saving
           any other field would then quietly clear it. */
        (r.assignee && !a.people.some((p) => p.key === r.assignee)
          ? '<option value="' + esc(r.assignee) + '" selected>' + esc(owner || r.assignee) +
            " — no longer on the register</option>" : "") +
        "</select>")
    : row("Owner", owner ? esc(owner) : "");

  const depRowHtml = build
    ? wrow("Depends on", '<select class="fld" data-field="dependsOn" aria-label="Depends on">' +
        '<option value="">Nothing</option>' +
        a.rows.filter((x) => x.lvl === 2 && x.id !== r.id).map((x) =>
          '<option value="' + esc(x.id) + '"' + (x.id === r.dependsOn ? " selected" : "") + ">" +
          esc(nums[a.rows.indexOf(x)] + " — " + (x.name || "")) + "</option>").join("") +
        "</select>")
    : row("Depends on", depRow ? nameWith(depRow) : "");

  const marksRow = build
    ? wrow("Marks", '<span class="two">' +
        '<label class="tick"><input type="checkbox" data-field="milestone"' +
        (r.milestone ? " checked" : "") + "> A milestone</label>" +
        '<label class="tick"><input type="checkbox" data-field="billable"' +
        (det.billable ? " checked" : "") + "> Billable</label></span>")
    : (r.milestone || det.billable
        ? row("Marks", (r.milestone ? '<span class="mk">Milestone</span> ' : "") +
            (det.billable ? '<span class="mk">Billable</span>' : ""))
        : "");

  /* THE ACTIVITY'S OWN FIGURE, where there is nothing behind it. §3 №3's own
     words are *typing over it is refused WHEN IT WOULD LIE*, so a row with no
     breakdown takes a typed figure and `manualProgressRefused` is what turns
     one away where a breakdown exists — asked here so the box is simply not
     drawn there rather than drawn and refused (§61, §15.4). */
  const canType = (build || report) && !manualProgressRefused(det.subs.map((s) => ({
    status: s.status as "todo" | "in_progress" | "done", weight: s.weight,
  })));
  const figRow = det.subs.length ? "" : canType
    ? wrow("Progress", '<input class="fld" id="pct" inputmode="numeric" value="' + (r.pct ?? 0) +
        '" aria-label="Per cent done" style="max-width:88px"> <span class="soon">%' +
        " — this activity has no breakdown, so the figure is its own</span>")
    : row("Progress", (r.pct ?? 0) + "% — the activity's own figure; it has no breakdown", true);

  /* ══ marking it done — the FIRST of the two steps (§3 №1, §6.5) ══════ */
  /* AND IT TURNS BOTH WAYS, which the drawing does not show and §61 requires:
     a one-way door on a press anybody doing the work can reach is a trap, and
     the way back out of `completed` is a Lead's (`reopen`). A signed-off row
     offers neither — reopening it is Progress's own control. */
  const done = r.status === "done";
  const doneBar = mark && r.status !== "completed"
    ? '<div class="donebar"><button type="button" class="' + (done ? "ghost" : "start") + '" id="mark"' +
      ' data-done="' + (done ? "0" : "1") + '">' + (done ? "Not done yet" : "Mark it done") + "</button>" +
      '<p class="why">' + (done
        ? "It is waiting for a Lead to accept it and set the day the work actually ended."
        : "A Lead accepts it and sets the day the work actually ended. Until then it sits on" +
          " Progress waiting, and its real end date stays empty.") + "</p></div>"
    : "";

  return '<div class="act"' + (build || report ? ' data-act="' + esc(det.id) + '"' : "") + '>\n' +
    '<header><span class="k">' + esc(nums[i]) + "</span><b>" +
    esc(det.name) + "</b>" +
    (owner ? '<span class="k" style="margin-left:auto">' + esc(owner) + "</span>" : "") +
    '<a class="k shut" href="' + esc(planHref(a, { act: null })) + '">Close</a></header>\n' +
    '<div class="abody">' +
    nameRow +
    prose("deliverables", "Produces", det.deliverables) +
    prose("description", "About", det.description) +
    plannedRow +
    ownerRow +
    row("Actually", ran) +
    row("Status", '<span class="st ' + st.cls + '">' + esc(st.word) + "</span>") +
    depRowHtml +
    row("Blocks", blocks.map(nameWith).join("<br>")) +
    row("With", collab) +
    row("Signed off", signed) +
    marksRow +
    (subs ? wrow("Broken into", subs, true) : "") +
    figRow +
    /* FILES ARE DECIDED AND NOT SPECIFIED (§9.4): where one lives IS the
       permission, and none of the path, the ceiling or what happens on delete
       is settled — so the panel says so rather than drawing an empty row that
       reads as a feature that failed (§45.2, §54.5). */
    '<div class="arow full"><em>Files</em><div class="v"><span class="soon">Not built yet</span></div></div>' +
    "</div>\n" + doneBar +
    (build || report ? '<div class="said" id="asaid"></div>' : "") +
    "</div>\n";
}

/* ══ the address ═══════════════════════════════════════════════════════ */
/* THE VIEW AND THE OPENED ROW ARE ON IT, so any state of this page is a link.
   Only what differs from the default is written, or every link would carry
   `?view=list` and read as a choice somebody made (§50.6's shape, in a URL). */
function planHref(a: PlanArgs, over: { view?: "list" | "time"; act?: string | null; edit?: boolean }): string {
  const view = over.view !== undefined ? over.view : a.view;
  const act = over.act !== undefined ? over.act : (a.act ? a.act.id : null);
  const edit = over.edit !== undefined ? over.edit : a.edit;
  const q: string[] = [];
  if (view === "time") q.push("view=time");
  if (edit) q.push("edit=1");
  if (act) q.push("act=" + encodeURIComponent(act));
  return clientHref(a.slug, "portfolio", a.project.id + "/plan") + (q.length ? "?" + q.join("&") : "");
}

/* ══ the two dialogs (§15.5, §15.6) ════════════════════════════════════ */
/* BOTH ARE THE PAGE'S OWN `.dlg > .card > h2 + p + .cbtns`, which is what
   *Start a project* opens, and neither re-declares one rule of it — the
   drawing's best hour (§65.9): its first draft called the CARD `.dlg`, and
   `.dlg` on this page is the OVERLAY, so the card inherited
   `position:fixed; inset:0` and measured 520x756 at the top-left with its
   navy header off screen.

   THEY ARE EMPTY SHELLS THE SCRIPT FILLS, because what goes in them is
   worked out from the row that was pressed — and `cascade` is a rule, so the
   PREVIEW is the server's and arrives with the answer rather than being
   re-derived in the browser (§53.5, §42). */
const DIALOGS =
  '<div class="dlg" id="ov-shift" hidden><div class="card wide" role="dialog" aria-modal="true"' +
  ' aria-labelledby="sh1"><h2 id="sh1"></h2><div id="sh-body"></div>' +
  '<div class="cbtns apart"><button type="button" class="ghost" data-shut>Leave everything</button>' +
  '<button type="button" class="start" id="sh-go"></button></div></div></div>\n' +
  '<div class="dlg" id="ov-rm" hidden><div class="card wide" role="dialog" aria-modal="true"' +
  ' aria-labelledby="sh2"><h2 id="sh2"></h2><div id="rm-body"></div>' +
  '<div class="cbtns apart"><button type="button" class="ghost" data-shut>Keep it</button>' +
  '<button type="button" class="start" id="rm-go">Remove it</button></div></div></div>\n';

/* ══ the plan, drawn ═══════════════════════════════════════════════════ */
/* ONE BODY, DRAWN BY ONE FUNCTION, which the document below wraps and the api
   ANSWERS WITH (§53.5, and the tracker's own answer at §356.12): every write
   comes back as this, and the script swaps it in — so the browser holds no
   copy of the tree and cannot disagree with the server about the numbering,
   which arrow a row may use, or where an add row goes. */
export function planBody(a: PlanArgs): string {
  const nums = renumber(a.rows);
  const blocked = blockedSet(a.rows);
  const empty = !a.rows.length;
  if (empty && !a.edit)
    return '<div class="box"><p class="empty"><b>No plan yet.</b><br>' +
      (a.build
        ? "Nothing has been broken down for this project. Press Edit and name its first phase."
        : "Nothing has been broken down for this project yet.") + "</p></div>";
  return listView(a, nums, blocked).replace('id="list"', 'id="list"' + hid(a.view !== "list")) +
    timeView(a, nums) + panel(a, nums);
}

export async function planDocument(a: PlanArgs): Promise<string> {
  const bar = await barFor(a.tenantId);
  const wait = waitingSignOff(a.rows).length;
  const late = overdue(a.rows, a.today).length;
  const pct = overall(a.rows);

  const counts =
    (wait ? '<span class="owed">' + esc(plural(wait, "activity", "activities")) + " waiting for sign-off</span>" : "") +
    (late ? '<span class="owed red">' + late + (late === 1 ? " past its date" : " past their date") + "</span>" : "");

  /* THE SWITCH IS TWO LINKS, and the one you are on is marked rather than
     disabled — a control that does nothing is furniture (§94.15), and a
     marked link still says which view this is.

     AND THE PEN IS A THIRD LINK, which is the whole of why there is no
     Planning Mode: the mode rides on the address (§173), so pressing Edit is
     a page the server draws for somebody it has already allowed, and every
     control inside it is in the document for nobody else (§61). It is `.btn`
     and not `.pen`, because §268 settled that a pen takes the shape of the
     line it sits on and this line is a row of `.btn`s; lit it is `.btn.on`,
     which is what a pressed pen already looks like. Its two words are
     `penBtn()`'s own and it wears NO tick — the platform's pen has never
     carried one, and the drawing's first draft invented it (§25). */
  const sw = '<span class="sp">' +
    '<a class="btn' + (a.view === "list" ? " on" : "") + '" href="' + esc(planHref(a, { view: "list" })) + '">List</a>' +
    '<a class="btn' + (a.view === "time" ? " on" : "") + '" href="' + esc(planHref(a, { view: "time" })) + '">Timeline</a>' +
    (a.build
      ? '<a class="btn' + (a.edit ? " on" : "") + '" id="pen" aria-pressed="' + (a.edit ? "true" : "false") +
        '" href="' + esc(planHref(a, { edit: !a.edit })) + '">' + (a.edit ? "Done editing" : "Edit") + "</a>"
      : "") +
    "</span>";

  const whoWord = a.office ? "a seat on " + a.tenantName : a.role ? ROLE_WORD[a.role] : "";

  const body = '<main class="wrap pl">\n' +
    '<div class="phead"><div><p class="crumb">' +
      '<a href="' + esc(clientHref(a.slug, "portfolio", "")) + '">Projects</a> &middot; Plan</p>' +
      "<h1>" + esc(a.project.name) + "</h1></div>" +
      (whoWord ? '<span class="word">You are here as ' + esc(whoWord) + "</span>" : "") + "</div>\n" +
    tabs(a.slug, a.project.id, "plan") +
    '<div class="pbar">' + counts +
      (pct == null ? "" : '<span class="pcx">' + pct + "% of the plan done</span>") + sw + "</div>\n" +
    '<div id="plbody">' + planBody(a) + "</div>\n" +
    (a.edit ? DIALOGS : "") +
    "</main>\n";

  /* TWO SCRIPTS AND THEY ARE TWO JOBS (§53.5): `plan.js` measures a
     dependency's elbow and is the chart's, `write.js` is the pen's — and the
     second is served only where the pen is open, so a reader's page carries
     no writing code at all. The check's break serves the page without the
     elbows, which must leave the chart complete (§61's shape). */
  const js: string[] = [];
  if (brk() !== "no-elbows") js.push(clientHref(a.slug, "portfolio", "plan.js"));
  if (a.edit) js.push(clientHref(a.slug, "portfolio", "write.js"));

  return skeleton({ slug: a.slug, tenantName: a.tenantName, have: a.have, bar,
    css: PLAN_CSS, js: js.length ? js : undefined,
    body, attrs: a.edit
      ? ' data-api="' + esc(clientHref(a.slug, "portfolio", "api")) + '"' +
        ' data-plan="' + esc(planHref(a, {})) + '"'
      : undefined });
}
