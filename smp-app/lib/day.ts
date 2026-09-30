/* ── A CALENDAR DAY, FOR EVERY MODULE THAT HANDLES ONE ─────────────────────
   These were the Internal Tracker's (lib/tracker.ts), and `lib/notes.ts`
   borrowed them with a note saying what to do next: *"A third module wanting
   them is the day they move to a file of their own."* Portfolio is that third
   module, and this is that day — carried out rather than deferred, because I
   had already written a second `todayIn` inside `modules/portfolio/` and a
   second copy of *which day is it* is exactly what the note was about.

   THE ZONE IS THE TEAM'S AND IT IS ONE ANSWER. Two of the office's modules
   disagreeing about which day it is at 23:30 in Cairo is the drift §53.5
   exists to stop, and the cost of getting it wrong is a row reading *late* on
   one screen and not on another.

   A DAY IS A STRING, AND THAT IS DELIBERATE. `YYYY-MM-DD` compares exactly as
   text, so every rule that asks *is this before that* is a string compare with
   no zone and no clock in it. `calendarDay` is the one door a typed or posted
   value comes through: a day that does not exist is REFUSED rather than rolled
   over, because `2026-02-31` silently becoming the 3rd of March is a date
   nobody chose (§96.2).

   WHAT IS NOT HERE, said rather than left to be discovered (§54.5): the
   Sunday-to-Thursday week (`weekOf`, `thursdayOf`, `weekLabel`) stays the
   tracker's, because a week that starts on Sunday is spec 054's own decision
   and not a fact about days. And `addDays`/`daysBetween` are in BOTH
   `lib/tracker.ts` and `lib/portfolio.ts`, written twice and answering
   identically — RECORDED, NOT MOVED: the portfolio copy is what `cascade`
   does its arithmetic with, guarded by ten falsifications, so joining them is
   its own change and not one to ride in beside a screen (rule 1b). */

export const TIME_ZONE = "Africa/Cairo";
const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function toDate(day: string): Date {
  const m = DAY.exec(day)!;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}
export function dayOf(d: Date): string {
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0");
}

/* The one door a typed value comes through. A day that does not exist is
   refused rather than rolled over. */
export function calendarDay(v: unknown): string | null {
  const s = (v == null ? "" : String(v)).trim();
  if (!DAY.test(s)) return null;
  return dayOf(toDate(s)) === s ? s : null;
}

export function todayIn(now: Date = new Date(), zone: string = TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/* THE YEAR IS DROPPED WHERE IT IS THIS YEAR, and that is a fact about the
   reader rather than about the day — so `today` is passed in rather than read
   from the clock, and a screen that prints a day out of some other year says
   so. */
export function readableDay(day: string | null, today?: string): string {
  if (!day || !DAY.test(day)) return "";
  const d = toDate(day);
  const y = today && today.slice(0, 4) === day.slice(0, 4) ? "" : " " + d.getUTCFullYear();
  return WEEKDAY[d.getUTCDay()] + " " + d.getUTCDate() + " " + MONTH[d.getUTCMonth()] + y;
}

/* The same day with no weekday on it — what a span reads as on a plan, where
   the row already says what the work is and the weekday is noise. */
export function shortDay(day: string | null, today?: string): string {
  return readableDay(day, today).replace(/^\w+ /, "");
}
export function monthWord(day: string): string { return MONTH[toDate(day).getUTCMonth()]; }
