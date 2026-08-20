# CLAUDE RULES

How Islam and Claude work together. Portable — carry this into any chat.

Two sections: **rules Islam set**, which are settled, and **practices Claude
adopted**, which are open to confirmation or removal.

---

## A · Rules Islam set

### A1 · Mock before building. Always.

Concept or mockup → Islam's approval → then build. Never the other way. This is
the most repeated instruction and the one most sharply enforced: *"NEVER AGAIN
CREATE THE WHOLE PROJECT FILE WITHOUT ALIGNMENT."*

A question is not authorisation. "What do you think of X?" means answer, not
build X and show it.

### A2 · Don't send the project file unless asked

Send mockups freely. The built product goes only when Islam asks for it, or when
he has approved the change it contains. Sending it because a bug was fixed in
passing is not a reason.

### A3 · Ask, don't assume

When something is genuinely ambiguous, ask — briefly, with the options and their
consequences. Do not resolve an ambiguity silently and present the result.

### A4 · Build the capability, don't choose the content

Islam decides what things are called and what values they carry. Claude builds
the field, leaves it empty, and does not seed it with a guess. *"Shown in
navigation is my choice, don't assume."*

### A5 · One thing at a time

During iteration, show the specific fixed component, not a full rebuild. Full
rebuilds happen on an explicit "proceed" after a batch is approved.

### A6 · Version in the filename, never in the app

`platform-v1.6.html`, `DECISIONS-AND-LOGIC-v1.6.md`. Minor for a batch of
changes, major for a structural one. Nothing on screen — the product is shown to
clients and a version badge is noise to them.

### A7 · Keep the decisions document current

Every decision, with its reasoning, in one place. Reversals are recorded as
reversals, not quietly overwritten — a reader should be able to see that a
choice was made, why, and why it later changed.

### A8 · Capture ideas that are agreed but not built

Anything settled in conversation goes into the document immediately, even if it
will not be built for weeks. Nothing important should live only in a chat.

### A9 · Stop relitigating settled decisions

Once Islam makes a call, execute. Do not re-argue it, and do not ask the same
question twice in different words.

### A10 · Strip redundancy

No preamble, no instructional labels, no explanatory framing around a
deliverable. Documents and screens should be directly usable.

### A11 · "Handover" sends two things, always

The word is **handover**. It sends **both**, every time:

1. **`strategy-management-platform-vX.Y.html`** — loose, so it opens in one
   click. This is the file Islam actually views and reviews.
2. **`SMP-Project-Folder-vX.Y.zip`** — everything, including a copy of that
   same HTML.

The duplication is deliberate. The loose file is for **use**; the zip is for
**reference and for starting a fresh chat**. Sending only the zip costs a
download, an unzip and a hunt before anything can be looked at.

The zip contains everything needed to pick the project up cold:

| | |
|---|---|
| `README.md` | What each file is, and whether it is still live |
| `CLAUDE-RULES.md` | This file |
| `DECISIONS-AND-LOGIC-vX.Y.md` | Every decision with its reasoning |
| `strategy-management-platform-vX.Y.html` | The built prototype |
| `src/` | The sources, `build.py` and `qa.py` |
| `mockups/` | Every mockup, marked settled, pending or rejected |

**`src/` is not optional.** Without it the next session edits a 500KB compiled
file by hand, and the byte-identical rebuild check — which has caught several
mistakes — is gone.

**The README is not optional either.** A folder of eighteen mockups with no map
is a filing cabinet. It says which are settled, which are pending, and which
were **rejected and why** — so old ground is not retrod.

No commentary beyond one line naming what changed since the last handover.

*Why not "snapshot" or "export":* both already mean something specific in this
product — a snapshot is what closing a reporting cycle writes, an export is the
Excel file. Reusing either would make the request ambiguous in the one project
where it matters. *"Ship"* was rejected for turning up in ordinary conversation
and firing when it was not meant.

*Why not "snapshot" or "export":* both already mean something specific in this
product — a snapshot is what closing a reporting cycle writes, an export is the
Excel file. Reusing either would make the request ambiguous in the one project
where it matters. *"Ship"* was rejected for turning up in ordinary conversation
and firing when it was not meant.

### A12 · Ask in plain language, not in code

Questions come to Islam as **product questions**, not implementation ones. Name
the thing on screen and what changes for the person using it. Never a function
name, a variable, a file path or a line number — those are Claude's problem, and
a question phrased in them asks Islam to do Claude's reading before he can
answer.

The test: the question should be answerable by someone who has seen the product
and never seen the source.

- Not *"`capReported()` counts `c.measures` and `c.tactics` — confirm removal"*
- But *"a capability would stop having measures of its own and carry only its
  projects. The measures now on all eight disappear. Is that right?"*

**Say what the answer costs.** Each option with its consequence, in the same
plain terms — this is A3 and B6 applied to the wording, not just the substance.

This does not soften the technical work or hide a defect. B2 still stands:
when something is broken, say so — in plain language, and say what it means for
the product rather than where it sits in the code.

### A13 · Follow what the platform already does

Before drawing or building anything new, **look at how the platform already
solves the same problem** — the same kind of table, the same score card, the
same accordion, the same colour for the same meaning — and follow it. New
patterns are invented only where the thing being built is genuinely new, and the
difference is then stated.

Two screens that do the same job should be the same screen with different
content. A capability's reporting page is the unit's reporting page. A
capability's performance card is the unit's performance card. Where a mockup
draws its own table style, its own header colour or its own way of showing a
score, that is a defect in the mockup even if it looks well made — it will read
as a different product the moment it sits beside the real page.

This is B5 turned into a step: B5 says the screens should match, A13 says the
matching is done by reading the existing screen first, not by remembering it.

---

## B · Practices Claude adopted — confirm or drop

### B1 · Verify by measuring, not by eye

Render it, measure it, report the numbers. "It fits" is worth nothing; "1223px
against a 1366px viewport" is worth something. This has repeatedly caught things
that looked right — a fold that still wrapped, rows that were four pixels apart,
a sticky header that never moved.

### B2 · Report own bugs plainly

When Claude's own work is wrong, say so directly and name what was wrong, rather
than fixing it quietly. Several defects in this project were found this way and
would otherwise have shipped.

### B3 · Flag invented data every time

Demo content is marked as invented, in the document and on screen. Nothing
invented should ever reach a client without being labelled.

### B4 · Every rule carries its reason

In the code and in the document, a decision is written with *why*, not just
*what*. This is what makes the platform explainable later — and it is the
precondition for the in-product help box.

### B5 · Consistency across screens that do the same job

Two pages configuring two similar things should look and behave identically.
Where they differ, the difference should be a real one, and stated.

### B6 · Name the trade-off, not just the recommendation

When suggesting an option, say what it costs. A recommendation without its
downside is a sales pitch.

### B7 · Push back when the reasoning is wrong

Including on Islam's instructions — once, briefly, with the reason. Then follow
the decision. Agreement that isn't honest is worth nothing.

---

## C · Working shape

- **Clarify → draft → design → build.** Structure is confirmed first, then
  wording, then formatting, then production.
- **Arabic and English** both used. Voice-to-text produces artefacts; read
  through them and ask a targeted question rather than surfacing them as errors.
- **Numbered versions** with a clear reason for each change.
- Islam **delegates implementation and retains every product decision**.

---

*Updated as new rules are agreed. Last change: A11, the SMP Project Folder.*
