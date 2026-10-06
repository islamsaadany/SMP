/* ── WHAT THE CLIENT WEARS, ASKED ONCE (spec 046 §4.1, §354) ─────────────
   Branding is the SPINE's: a module should get the client's colour for
   nothing, the way it gets the door and the session. It was not getting it.
   Measured before this file existed: Strategy wore the tenant's bar colour,
   the trial module read it for itself (that module is gone; §363), and
   Insights carried the shipped navy
   as a literal with no reader at all — so a client who had chosen a colour
   saw it on two screens out of three, and the third was not wrong by accident
   but by there being nowhere to ask.

   ONE ANSWER, TWO WAYS OF GETTING IT, and the difference is where the graph
   already is rather than what the rule is (§53.5):
     · `barFrom(value)` is the rule — what counts as a colour and what a
       client who has chosen none wears. Every caller ends here.
     · `barFor(tenantId)` is that rule plus the one small read, for a module
       that has no reason to load the whole graph. Insights lists a library;
       loading thirty tables for a colour would be a page slower for nothing.
   A module holding the graph already (a module that reads it for its
   count) asks `barFrom` and makes no second query.

   THE DEFAULT IS THE ABSENCE OF A CHOICE, never a copy of one (§50.6): it is
   what config-data.js's BRAND_DEFAULT ships, so a tenant that has never opened
   Branding wears this everywhere, and a tenant that HAS wears theirs
   everywhere. Neither is a module's decision.

   AND A COLOUR MAY NEVER STOP A PAGE DRAWING. A database that will not answer
   gives the default and the library still lists (§231.3's rule, one layer in:
   a dependency must not be able to take down the feature it decorates). */
import { withTenant } from "./tenant.ts";

export const BAR_DEFAULT = "#16325C";

/* Six hex digits and nothing else. A stored value outside that is not
   corrected and not drawn — it is simply not a colour, and the client wears
   what they wear when they have chosen none (§96.2: nothing stored is
   rewritten, here or anywhere). */
export function barFrom(value: unknown): string {
  /* THE CHECK'S BREAK: a build that wore the shipped navy whatever the client
     chose is the fault this file was written for, and it must turn
     checks/modules.mjs red (§94.5). Never set on a deployment. */
  if ((typeof process !== "undefined" ? process.env.SMP_BREAK || "" : "") === "module-own-colour") return BAR_DEFAULT;
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : BAR_DEFAULT;
}

/* One column of one row, under the client's own tenant setting — never
   `readState`, which is the whole graph. `org` is a singleton keyed by
   tenant alone (§316.7), so there is no id to name and no row is a real
   answer: a client with no plan yet has no org row and wears the default. */
export async function barFor(tenantId: string): Promise<string> {
  try {
    const bar = await withTenant(tenantId, async (c) => {
      const r = await c.query("SELECT extra->'branding'->>'bar' AS bar FROM org");
      return r.rows[0] ? r.rows[0].bar : null;
    });
    return barFrom(bar);
  } catch {
    return BAR_DEFAULT;
  }
}

/* WHAT CAN BE READ ON THE CLIENT'S COLOUR (§498). A band painted in the
   client's own bar carried FIXED inks — white words, pale-blue quiet words,
   a salmon "late", a gold rule — chosen for the shipped navy. On a client
   who picked a light colour (a tan, measured at 1.9:1 for the white title)
   the band went unreadable. The frozen product solved this once
   (config-data.js's inkFor / readableOn, §38.4); this is that same rule for
   the modules, so the two cannot answer differently (§53.5):
     · ink    — white or near-black, whichever reads better on the bar;
     · quiet  — the ink pulled toward the bar, then walked back until it
                clears 4.5:1, so a secondary word stays secondary AND legible;
     · accent — the house gold, walked until it clears 4.5:1 (it is a word —
                the week line — as well as a rule);
     · late   — a red that reads on the bar, from the light or dark side;
     · hover  — a wash in the ink's own direction.
   Returned as CSS declarations, so a page writes `:root{%BARVARS%;…}` and
   every rule asks a token rather than a literal. */
type RGB = [number, number, number];
const hexRgb = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgbHex = (c: number[]) => "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase();
const relLum = (c: number[]) => {
  const s = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
};
export function contrastOf(a: string, b: string): number {
  const l1 = relLum(hexRgb(a)), l2 = relLum(hexRgb(b));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
const mix = (a: number[], b: number[], t: number) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const WHITE: RGB = [255, 255, 255], DARK: RGB = [12, 17, 26];
/* Walked toward the INK's side — not decided again from the bar's own
   lightness, which on a mid tone (a tan, a grey) picks the side the ink did
   not and walks a word away from legibility. */
function readableOn(fg: number[], bg: string, need: number, towardWhite: boolean): string {
  const target = towardWhite ? [255, 255, 255] : [0, 0, 0];
  for (let t = 0; t <= 1.001; t += 0.04) {
    const c = rgbHex(mix(fg, target, t));
    if (contrastOf(c, bg) >= need) return c;
  }
  return rgbHex(target);
}
export type BarInks = { ink: string; quiet: string; accent: string; late: string; hover: string };
export function barInks(barValue: unknown): BarInks {
  const bar = barFrom(barValue), b = hexRgb(bar);
  const light = contrastOf(rgbHex(WHITE), bar) >= contrastOf(rgbHex(DARK), bar);
  const inkRgb = light ? WHITE : DARK;
  /* THE CHECK'S BREAK: the fixed light inks put back (§94.5). */
  if ((typeof process !== "undefined" ? process.env.SMP_BREAK || "" : "") === "bar-fixed-inks") {
    return { ink: "#FFFFFF", quiet: "#C6D2E5", accent: "#E8A33A", late: "#FF9B8F", hover: "rgba(255,255,255,.1)" };
  }
  return {
    ink: rgbHex(inkRgb),
    quiet: readableOn(mix(inkRgb, b, 0.3), bar, 4.5, light),
    accent: readableOn(hexRgb("#E8A33A"), bar, 4.5, light),
    late: readableOn(hexRgb(light ? "#FF9B8F" : "#A23123"), bar, 4.5, light),
    hover: light ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.07)",
  };
}
export function barVars(barValue: unknown): string {
  const i = barInks(barValue);
  return "--bar:" + barFrom(barValue) + ";--bar-ink:" + i.ink + ";--bar-quiet:" + i.quiet + ";--bar-accent:" + i.accent + ";--bar-late:" + i.late + ";--bar-hover:" + i.hover;
}
