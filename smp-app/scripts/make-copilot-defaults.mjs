/* ── THE COPILOT'S SHIPPED INSTRUCTIONS AND TEMPLATES (§456, spec 064) ──
   Islam handed over two things on 2026-10-01: the methodology text another
   product of ours had hard-coded (assets/copilot/instructions-source.md, kept
   verbatim as the record) and five blank workbooks. This turns them into
   lib/copilot-defaults.generated.ts, which is what a deployment ships with
   and what Copilot settings shows until a Forefront super user edits a part
   (lib/copilot-settings.ts — a stored row overrides the shipped text by key,
   and deleting the row puts the shipped text back).

   A ONE-OFF GENERATOR, run by hand and its output committed, for
   make-frameworks-migration.mjs's reason: the source changes when Islam
   hands over a new export, not on every build.

   WHAT "TIDIED" MEANS, AND IT IS MECHANICAL ON PURPOSE (the signed-off
   mockup's own promise: the other product's screen names, output layouts and
   web address removed, every rule, example and bad example kept as written):
     · the export's own front matter and contents list go — they describe the
       export, not the method;
     · every `_Source: …_` line goes — it is a file path in the other product;
     · every block headed "Output Format" goes, with everything under it to
       the next heading of the same or a higher level — those are the other
       product's screen layouts, and the Copilot answers in its own shape
       (lib/copilot-ask.ts SCHEMA); handing the model two shapes is asking it
       to choose;
     · the `~~~~text` fences go and their text stays;
     · a heading that is a constant's name (FOUNDATION_INSTRUCTIONS) reads as
       words.
   Nothing else is touched, and the check counts words before and after so a
   rule that ate more than it said would show (checks/copilot-settings.mjs).

   FOURTEEN PARTS, FIVE SECTIONS. The Copilot works in five sections
   (lib/copilot.ts SECTIONS); each part is filed under the one its method
   serves, and a section is told every part filed under it, in order. */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, "..", "assets", "copilot");
const src = readFileSync(join(dir, "instructions-source.md"), "utf8").replace(/\r\n/g, "\n");

const SECTION_OF = {
  1: "foundation", 2: "analysis", 3: "analysis", 4: "analysis", 5: "analysis",
  6: "directions", 7: "directions", 8: "directions", 9: "directions",
  10: "execution", 11: "execution", 12: "execution", 13: "execution", 14: "advisory",
};

const lines = src.split("\n");
const starts = [];
/* The part's title is the other product's menu name less its screen word
   ("(Guided Mode)", "Mode") — the method is the same, the screen is not ours. */
const titleOf = (t) => t.replace(/\s*\(Guided Mode\)\s*$/, "").replace(/^Consultant Mode$/, "Consultant");
lines.forEach((l, i) => { const m = /^## (\d+)\. (.+)$/.exec(l); if (m) starts.push({ i, n: Number(m[1]), title: titleOf(m[2].trim()) }); });
if (starts.length !== 14) throw new Error("expected 14 parts, found " + starts.length);

const level = (l) => { const m = /^(#{1,6}) /.exec(l); return m ? m[1].length : 0; };
const words = (s) => (s.match(/\S+/g) || []).length;

function tidy(body) {
  const out = [];
  let skip = 0; // the level of an Output Format heading being skipped, or 0
  let fence = false;
  for (const l of body) {
    if (/^~~~~/.test(l)) { fence = !fence; continue; }
    const lv = fence ? 0 : level(l);
    if (skip) { if (lv && lv <= skip) skip = 0; else continue; }
    if (!fence && lv && /^#+ Output Format\s*$/.test(l)) { skip = lv; continue; }
    if (!fence && /^_Source: .*_\s*$/.test(l)) continue;
    if (!fence && /^---\s*$/.test(l)) continue;
    if (lv) {
      /* A constant's name reads as words: "### FOUNDATION_INSTRUCTIONS" →
         "### Foundation instructions", "Option 1 - CORE_CAPABILITIES_…" too. */
      out.push(l.replace(/\b([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)\b/g, (w) => {
        const s = w.toLowerCase().replace(/_/g, " ");
        return s.charAt(0).toUpperCase() + s.slice(1);
      }));
      continue;
    }
    out.push(l);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

const parts = starts.map((s, k) => {
  const end = k + 1 < starts.length ? starts[k + 1].i : lines.length;
  const raw = lines.slice(s.i + 1, end);
  const text = tidy(raw);
  return { key: "part" + s.n, n: s.n, title: s.title, section: SECTION_OF[s.n], text,
           rawWords: words(raw.join("\n")), words: words(text) };
});

const TEMPLATES = [
  { key: "t1", file: "1-Foundation-Interview-Template.xlsx", name: "Foundation interview", section: "foundation",
    use: "Who we are, purpose, aspiration, north star and values" },
  { key: "t2", file: "2-Analysis-Interview-Template.xlsx", name: "Analysis interview (Q1–Q12)", section: "analysis",
    use: "Interview answers and the interviewee list" },
  { key: "t3", file: "3-Porters-Five-Forces-Template.xlsx", name: "Porter's Five Forces", section: "analysis",
    use: "The five forces, scored" },
  { key: "t4", file: "4-DESTEP-Template.xlsx", name: "DESTEP", section: "analysis",
    use: "The outside world, factor by factor" },
  { key: "t5", file: "5-Department-SW-Template.xlsx", name: "Department strengths & weaknesses", section: "analysis",
    use: "Strengths and weaknesses for each unit and function" },
].map((t) => ({ ...t, data: readFileSync(join(dir, t.file)).toString("base64") }));

const out =
  "/* GENERATED by scripts/make-copilot-defaults.mjs from assets/copilot/ — do not edit by hand.\n" +
  "   The Copilot's shipped instructions (fourteen parts, filed under its five sections) and its\n" +
  "   five blank templates. A Forefront super user's edits are stored over these by key\n" +
  "   (lib/copilot-settings.ts); this file is what a part goes back to. */\n" +
  "export type DefaultPart = { key: string; n: number; title: string; section: string; text: string; rawWords: number; words: number };\n" +
  "export type DefaultTemplate = { key: string; file: string; name: string; section: string; use: string; data: string };\n" +
  "export const DEFAULT_PARTS: DefaultPart[] = " + JSON.stringify(parts, null, 0) + ";\n" +
  "export const DEFAULT_TEMPLATES: DefaultTemplate[] = " + JSON.stringify(TEMPLATES, null, 0) + ";\n";
writeFileSync(join(here, "..", "lib", "copilot-defaults.generated.ts"), out);
console.log("parts " + parts.length + " · words " + parts.reduce((a, p) => a + p.words, 0) + " of " +
  parts.reduce((a, p) => a + p.rawWords, 0) + " · templates " + TEMPLATES.length + " · bytes " + out.length);
