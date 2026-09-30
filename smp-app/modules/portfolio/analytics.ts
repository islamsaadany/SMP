/* ── ANALYTICS — the reading you take into a review (spec 060 §9.12) ───────
   Signed off from `design-mockups/portfolio/2026-09-20_project-analytics.html`
   as shape B. **Two sections and nothing else**: where each part of the plan
   stands, and every commitment with whether it was met.

   WHAT IS ABSENT IS THE DESIGN. No health score, no seven status tiles, no
   Cancelled figure, no upcoming-deadline columns, no severity buckets and no
   sign-off queue — the first four because §9.11 binned them on the audit's
   own evidence, the last two because **they are Progress's and nothing is
   repeated across the two tabs**. That separation is the whole of what B
   means: Progress is a working queue for the people doing the work, this is
   the reading you take into a review.

   NOTHING HERE IS A SECOND ANSWER. The roll-up is `rollUp`'s, the word
   beside a bar is `howFar`'s, *behind* is `behind`'s and a commitment's
   state is `msState`'s — all of them in `lib/portfolio.ts` and all of them
   read by the landing too, so a percentage cannot be described one way here
   and another there (§53.5, §5.2).

   TWO CORRECTIONS OF THE REFERENCE ARE VISIBLE ON THE PAGE (§9.12):
   a commitment is hit when it was accepted ON OR BEFORE its date and not
   otherwise, and **marked done is not hit** — a commitment whose work is
   finished and waiting for a Lead is counted in NEITHER column, where theirs
   counts it as delivered on time because an activity with no recorded end
   date is assumed to have met its date, which flatters exactly the backlog
   it sits beside.

   AND THE TWO NUMBERS THAT LOOK LIKE A CONTRADICTION ARE NAMED (§124): a
   phase can read *2 of 3 done* while its commitment reads *Awaiting
   sign-off*, because progress counts work that is finished and a commitment
   is met when somebody accepts it. The page says so rather than leaving it
   to be puzzled over.

   *ON TRACK* IS NOT A WORD A PERCENTAGE MAY USE (§344): the word beside the
   bar answers *how far along* and the red mark answers *is it late*, and a
   phase at 67% and behind is both. */
import { type ModuleKey, clientHref } from "../../lib/modules.ts";
import { barFor } from "../../lib/branding.ts";
import {
  type Row, type Role, type MsState, ROLE_WORD,
  renumber, overall, behind, howFar, commitments, msState, hitOnTime, met, SOON, inOffice,
  type Who,
} from "../../lib/portfolio.ts";
import type { Project } from "../../lib/portfolio-io.ts";
import { shortDay } from "../../lib/day.ts";
import { esc, plural, skeleton, tabs, ANALYTICS_CSS } from "./page.ts";

const brk = () => process.env.SMP_BREAK || "";
const DAY = 864e5;
const at = (d: string) => Date.parse(d + "T00:00:00Z");
const gap = (a: string, b: string) => Math.round((at(a) - at(b)) / DAY);

export type AnalyticsArgs = {
  slug: string; tenantId: string; tenantName: string; have: ModuleKey[];
  project: Project;
  rows: Row[];                  /* already rolled up */
  today: string;
  role: Role | null;
  seat: Who["seat"];
};

/* THE BADGE SAYS WHICH STATE AND HOW FAR — one word per state, and the two
   that carry a figure work it out rather than rounding a stored one. */
function badge(r: Row, today: string): { cls: MsState; word: string } {
  const st = msState(r, today);
  const on = r.signedOffAt || r.actualEnd || null;
  if (st === "hit") return { cls: st, word: "On time" };
  if (st === "late") return { cls: st, word: plural(gap(String(on), String(r.end)), "day") + " late" };
  if (st === "wait") return { cls: st, word: "Awaiting sign-off" };
  if (st === "over") return { cls: st, word: plural(gap(today, String(r.end)), "day") + " overdue" };
  if (st === "soon") return { cls: st, word: "In " + plural(gap(String(r.end), today), "day") };
  return { cls: st, word: "Planned" };
}

function cell(k: string, v: string, lab: string, sub: string): string {
  return '<div class="cell ' + k + '"><p class="k">' + esc(lab) + "</p>" +
    '<div class="v">' + v + '</div><div class="w">' + esc(sub) + "</div></div>";
}

/* WHICH PHASE A COMMITMENT SITS IN, read off the numbering rather than off a
   stored parent — the number IS the position (§3 №5), so the two cannot
   disagree about where a row is. */
function phaseOf(rows: Row[], nums: string[], r: Row): string {
  const top = String(nums[rows.indexOf(r)] || "").split(".")[0];
  for (let i = 0; i < rows.length; i++)
    if (rows[i].lvl === 0 && nums[i] === top) return rows[i].name || "";
  return "";
}

export async function analyticsDocument(a: AnalyticsArgs): Promise<string> {
  const bar = await barFor(a.tenantId);
  const nums = renumber(a.rows);
  const phases = a.rows.filter((r) => r.lvl === 0);
  const pct = overall(a.rows);

  const ms = commitments(a.rows);
  const hit = ms.filter((r) => hitOnTime(r, a.today));
  const lateMs = ms.filter((r) => msState(r, a.today) === "late");
  const open = ms.filter((r) => !met(r));
  const near = open[0] || null;

  const strip =
    cell("", (pct == null ? "—" : pct + "%"), "Progress",
      pct == null ? "no plan to roll up" : "the " + plural(phases.length, "phase") + ", rolled up") +
    cell(lateMs.length ? "warn" : "",
      hit.length + ' <small>of ' + ms.length + "</small>", "Commitments met on time",
      lateMs.length ? plural(lateMs.length, "more") + " delivered late" : "None delivered late") +
    cell(open.length ? "warn" : "", String(open.length), "Still to come",
      near && near.end
        ? "the nearest is " + shortDay(near.end, a.today) + " — " + badge(near, a.today).word.toLowerCase()
        : ms.length ? "every commitment has been met" : "no commitments are set on this plan");

  /* WHERE EACH PART STANDS — phases and work packages, never activities:
     the activity-by-activity detail is the Plan tab and this is the level
     above it (§9.12). */
  const parts = a.rows.filter((r) => r.lvl < 2);
  const phaseRows = parts.map((r) => {
    const w = howFar(r.pct ?? 0);
    return '<div class="pr lvl' + r.lvl + '">' +
      '<span class="pn">' + esc(nums[a.rows.indexOf(r)]) + "</span>" +
      '<span class="pt">' + esc(r.name || "") +
      (behind(r, a.today) ? '<span class="behind">Behind</span>' : "") + "</span>" +
      '<span class="pbar"><i style="width:' + (r.pct ?? 0) + '%"></i></span>' +
      '<span class="ppc">' + (r.pct ?? 0) + "%</span>" +
      '<span class="pcnt">' + (r.done ?? 0) + " of " + esc(plural(r.total ?? 0, "activity", "activities")) + "</span>" +
      /* THE WORD AND THE MARK ANSWER TWO QUESTIONS (§344). `on-track` puts
         the reference's own label back — a claim about a schedule made by a
         figure that cannot see one — and `far-words` gives this page a word
         table of ITS OWN, which is the drift the assertion exists to catch
         (§53.5); both must turn the check red (§94.5). */
      '<span class="pwd ' + (brk() === "on-track" ? "on" : w.cls) + '">' +
        esc(brk() === "on-track" ? "On Track"
          : brk() === "far-words" ? ((r.pct ?? 0) === 100 ? "Finished" : "Nearly there")
          : w.word) + "</span></div>";
  }).join("");

  const msRows = ms.map((r) => {
    const b = badge(r, a.today);
    const past = !!(r.end && r.end < a.today);
    const on = r.signedOffAt || null;
    return '<div class="ms' + (past ? " past" : "") + '">' +
      '<span class="when2">' + esc(r.end ? shortDay(r.end, a.today) : "—") + "</span>" +
      '<span class="nm2"><b>' + esc(r.name || "") + "</b><span>" +
        esc(nums[a.rows.indexOf(r)]) + " &middot; " + esc(phaseOf(a.rows, nums, r)) +
        (on ? " &middot; signed off " + esc(shortDay(on, a.today)) : "") + "</span></span>" +
      /* THE APPARENT CONTRADICTION IS NAMED, ON A HOVER (§9.12, §124) — a
         phase can read *2 of 3 done* while its own commitment reads
         *Awaiting sign-off*, because progress counts work that is finished
         and a commitment is met when somebody accepts it. It is a fact the
         screen does not otherwise state, so it is a hover rather than a
         grey paragraph under a heading (rule 1b-ii). */
      '<span class="bd ' + b.cls + '"' +
        (b.cls === "wait"
          ? ' title="The work is finished and no Lead has accepted it yet, so it counts as met by nobody. ' +
            'Progress counts work that is done; a commitment is met when somebody accepts it."'
          : "") +
        ">" + esc(b.word) + "</span></div>";
  }).join("");

  const whoWord = inOffice(a.seat) ? "a seat on " + a.tenantName : a.role ? ROLE_WORD[a.role] : "";
  const empty = !a.rows.length;

  const body = '<main class="wrap">\n' +
    '<div class="phead"><div><p class="crumb">' +
      '<a href="' + esc(clientHref(a.slug, "portfolio", "")) + '">Projects</a> &middot; Analytics</p>' +
      "<h1>" + esc(a.project.name) + "</h1></div>" +
      (whoWord ? '<span class="word">You are here as ' + esc(whoWord) + "</span>" : "") + "</div>\n" +
    tabs(a.slug, a.project.id, "analytics") +
    (empty
      ? '<div class="box"><p class="empty"><b>No plan yet.</b><br>' +
        "There is nothing to read until this project has a plan. Writing one is not built yet." +
        "</p></div>\n"
      : '<div class="strip">' + strip + "</div>\n" +
        '<div class="box"><div class="an-h"><b>Where each part stands</b><span class="c">' +
          esc(plural(phases.length, "phase")) + (pct == null ? "" : " &middot; " + pct + "% overall") +
          "</span></div>" +
          (parts.length ? phaseRows : '<p class="empty">This plan has no phases yet.</p>') + "</div>\n" +
        '<div class="box"><div class="an-h"><b>What we committed to</b><span class="c">' +
          (ms.length ? esc(plural(ms.length, "commitment")) + " &middot; in date order" : "") +
          "</span></div>" +
          (ms.length ? msRows
            : '<p class="empty">No activity on this plan is marked as a commitment. ' +
              "Marking one puts it here, and on the landing when it falls due inside " +
              esc(plural(SOON, "day")) + ".</p>") + "</div>\n") +
    "</main>\n";

  return skeleton({ slug: a.slug, tenantName: a.tenantName, have: a.have, bar,
    css: ANALYTICS_CSS, body });
}
