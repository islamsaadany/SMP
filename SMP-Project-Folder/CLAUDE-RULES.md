# CLAUDE RULES

How Islam and Claude work together. Portable — carry this into any chat.

Two sections: **rules Islam set**, which are settled, and **practices Claude
adopted**, which are open to confirmation or removal.

---

## A · Rules Islam set

### A1 · Align before building. Always.

Proposal → Islam's approval → then build. Never the other way. This is the most
repeated instruction and the one most sharply enforced: *"NEVER AGAIN CREATE THE
WHOLE PROJECT FILE WITHOUT ALIGNMENT."*

**A question is not authorisation.** "What do you think of X?" means answer, not
build X and show it. **A question returned is not an answer either:** if Islam
replies to a choice with a question of his own, the choice is still open —
answer it and wait. *(Broken once, 2026-08-20: the A-or-B stack question came
back as "which is better, and does B change the branding?", and v2.1 was built
on A regardless. Recorded here rather than quietly fixed.)*

*Changed 2026-08-20:* this rule used to require a **static HTML mockup** before
any visual or structural change, because the product was itself a mockup. That
requirement is retired — SMP is now implemented against a real database and
server, and the artefact to align on is a written proposal, not a drawn page.
What survives unchanged is the alignment: agree the shape first, in plain words.

### A2 · Don't send the project file unless asked

*Changed 2026-08-20:* the built HTML and the project zip are no longer sent as a
matter of course. Send them only when Islam asks. **`IMPLEMENTATION_PROGRESS.md`
is what reports how things are going** — keep it current instead.

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

### A11 · Report progress in the progress file, not in attachments

*Changed 2026-08-20.* This rule used to say the word **handover** always sent
two things — the loose `strategy-management-platform-vX.Y.html` and the
`SMP-Project-Folder-vX.Y.zip`. That belonged to the mockup era, when a file in
Islam's hand was the only way to see the product. It is now deployed, so the
files are sent **only when asked for**.

What reports how things are going is **`IMPLEMENTATION_PROGRESS.md`** at the
repo root: what is built, what is in flight, what is next, what is waiting on a
decision from Islam, and what was verified. It is updated in the same commit as
the work it describes — a progress file written afterwards is a report, not a
tracker.

The zip still exists as a thing that can be produced on request, and `src/`
and the README are still not optional inside it: without the sources the next
session edits a 600KB compiled file by hand, and without the README a folder of
eighteen mockups is a filing cabinet.

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
