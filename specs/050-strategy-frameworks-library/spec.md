# 050 · The strategy frameworks library — Forefront's own

**Status:** clarified 2026-09-13, not yet drawn. Nothing is built. The shape
below is settled; the screens are not, and are a mockup before a source moves
(rule 1c).

Read with **spec 045 (the consulting memory)**, which this follows in almost
every respect — where it lives, who reaches it, and how an assistant is pointed
at a corpus of its own. Where it departs from 045 it says so and why.

**It is not spec 049.** That one is *Resources*, a client-facing module whose
content is still unread in the SMS repository. This is Forefront's own library,
outside every client, and the two share only the word *library*.

---

## 1 · What is asked

Islam, 2026-09-13, of the Strategic Decision Toolkit: *"it's a straetgy
frameworks library. we can keep it for the consultants outside like the memory
not a client thing. ask me what you need to build it and have an admin for it to
add more with a prompt to use through ai and come back woth the answer to add a
new one"*

Three things: bring the library in, keep it on Forefront's side, and let an
admin add to it by asking the assistant and reviewing what comes back.

---

## 2 · What it is, measured

Read from `islamsaadany/strategic-decision-toolkit` at `12089e9`, cloned and
counted rather than described:

- **80 frameworks** — Porter's Five Forces, Ansoff, the Balanced Scorecard,
  PESTEL, the Value Chain — across **8 sections**, the largest being Corporate
  Strategy (24) and Business Strategy (19).
- **Thirteen fields each**, and **not one is empty across all 80**. That is
  worth stating: it is a finished dataset, not a start.
- **73 KB** in total.

How it works today, and what does not come with it: there is **no server and no
database** — the data is bundled into the page and searched in the browser. The
**"Download Template" button pops an alert**; the templates do not exist. There
is a **detail page per framework that nothing links to**. Dark mode is declared
and has no effect. Each is named here so none is copied as though it worked.

---

## 3 · Where it lives — outside every client

**On the Forefront console, beside the consulting memory.** Islam's own
placement, and it removes most of what a module would have cost: no tenant, no
per-client row, no module word, no address inside a client, no entry in the
switcher, and nothing in any client's Setup or access matrix.

**A framework is about nobody.** The memory's entries each name a client and a
colleague; these name neither. So its table references `tenants` not at all,
which is the one structural place it departs from 045.

**It joins the platform's own tables**, which is an edit in **two** places that
must agree — the exclusion list in `db/schema.sql`'s row-level-security loop and
`PLATFORM_TABLES` in `lib/schema-check.ts`. They cannot share a constant (one
runs inside Postgres), which is why §331 wrote a check asserting they name the
same set. That check is what catches this if either is forgotten.

---

## 4 · The decisions

Put to Islam on 2026-09-13, before anything was written.

| # | Question | Answer |
|---|---|---|
| 1 | Who reads, who adds | **Everyone reads, admins add.** Every consultant with a Forefront account searches and reads all of it; only a platform admin adds or edits. |
| 2 | What the admin gives the AI | **All three doors:** the framework's name, pasted source material, or a description of a client situation. |
| 3 | Straight in, or reviewed | **A draft that comes back to be checked**, edited and then saved. |
| 4 | Search it, or ask it | **Ask it too**, beside the search — the toolkit's own stated purpose, and the machinery already exists. |

Taken as settled without being asked, and stated so they can be reversed: it is
a **table and not a file** (an admin adding from a screen cannot be a file
redeployed each time); the **80 come across as the starting content**; the
**thirteen fields stay**; and it is **rebuilt in the platform's own colours**.

### 4.1 Two of those answers are one build

Question 2's third door — *describe the problem and the AI proposes a framework*
— and question 4 — *ask the library a question* — **are the same feature seen
from two ends.** You describe a situation; the assistant names the frameworks in
the library that fit and says why. When nothing fits it says so, and for an
admin that sentence is the way to add the missing one.

That is the memory's own shape exactly, down to its sentence: *"Nobody has
written that one up yet. If you know the answer, it is worth adding."*

**So it is two doors and not three**: two ways to ADD (a name, or pasted source),
and one way to ASK — which doubles as the door to adding what is missing. Said
here rather than discovered halfway through, because built as three it would be
two answers to one question (§53.5).

---

## 5 · What an entry holds

The thirteen the dataset already carries: `id`, `name`, `slug`, `section`, and
the nine that are the content — purpose, key questions, when to use it, when not
to, inputs required, outputs, an executive example, a consultant use case, and
facilitation tips.

Beside them:

- **`added_by`, and it may be empty.** The 80 that come with the library were
  written by nobody here, and an absent author is an absence rather than a
  person invented to fill it (§35).
- **`created_at` / `updated_at`**, as every table here has.

**Nothing records that an entry was AI-drafted**, and that is a decision rather
than an omission: every draft is read and saved by a person (decision 3), so the
entry is theirs whichever way it was written. A flag would say *this one is less
trustworthy* about a row somebody has already vouched for.

**The slug is unique and minted from the name.** Today a one-off script derives
it and nothing could collide; with admins adding, two frameworks can want one
slug — so the constraint is in the database and a collision is refused **by
name**, never resolved silently.

---

## 6 · The three doors, and the one that is different in kind

**One assistant, a third corpus.** `lib/assistant.cjs` already answers from a
corpus, declines rather than inventing, hands over to a person and caps its own
thinking; `lib/memory-ask.ts` points it at the memory under two rules of its
own. This points it at the library. **Never a second assistant** (§53.5).

### 6.1 Asking — the memory's two rules, unchanged

Answer **only** from the library. **Always name the frameworks drawn on**,
because the consultant's next step is to go and read them. When nothing in the
library fits, **say so rather than reaching for something close** — and offer an
admin the way to add it.

### 6.2 Adding — and here the assistant is asked to do the opposite

This is the one genuinely new thing, and the spec exists mostly to say it out
loud. **Everywhere else in this platform the assistant is built to decline
rather than invent.** Adding a framework asks it to produce eleven fields of
content. Two rules make that safe, and neither is optional:

1. **It may say it does not know.** Asked for a framework it has not got
   straight, the honest answer is *I do not know this one well enough* — and a
   library of eighty real frameworks is exactly where a plausible invention
   does the most damage, because it will be quoted to a client under Forefront's
   name. Pasting the source is the answer when it declines.
2. **Nothing is ever saved unreviewed.** The draft comes back editable; the
   admin reads it and presses save. **The press is what writes**, and a draft
   that is never pressed writes nothing.

The cost of the second is one extra step on every addition, stated before it was
chosen and taken anyway.

---

## 7 · Access

- **Reading:** any signed-in Forefront account. The door in front of it is the
  memory's — a session, and a password that is no longer temporary.
- **Adding and editing:** `accounts.is_admin`. **Refused on the server**, not
  only undrawn on the screen (constitution X, §42): a screen that hides a
  control has decided nothing.
- **No client can reach it, by construction.** It is not tenant-owned, it is not
  a module, and no client request routes to it. This is asserted rather than
  assumed — see §9.
- **Nobody's existing rights move.** No role is added, no matrix cell changes,
  and no client's access is touched.

---

## 8 · The 80 that come with it

Loaded once, from the dataset as it stands, with `added_by` empty. It is a
migration and not a seed: the library is Forefront's content and does not belong
to the demo, and it must not be re-run over entries an admin has since edited.

**What is not carried:** the placeholder template button, the unlinked detail
route, the Tailwind styling, and the search engine. The search is ours — 80
items is small, and what matters is that a typo still finds the framework and
that the name counts for more than an example, which is what the existing
weighting already says.

---

## 9 · What must be proved

- **The 80 land whole.** All thirteen fields on all eighty, none empty —
  measured against the source file, never claimed.
- **A non-admin cannot add or edit**, asked of the server and not of the screen,
  and **both ends**: an admin can, or the refusal proves nothing (§94.2).
- **The ask names its sources**, and **declines** when the library holds nothing
  that fits — both ends, or a build that declines always would pass half of it.
- **A draft writes nothing until it is pressed.** Read the table before and
  after.
- **A slug collision is refused by name.**
- **The two platform-table lists agree** — §331's own check, which this is the
  first table to exercise since it was written.
- **No client request can reach it**, driven rather than read.

---

## 10 · Recorded, not done

- **Templates.** The toolkit's own next phase is a spreadsheet per framework.
  Nothing here builds it; if it arrives, this library grows a file on the end
  and becomes much closer to what spec 049 describes.
- **The originator as its own field.** It currently sits inside the name, in
  brackets — *Three Generic Strategies (Porter)*. Worth splitting out the day
  anybody wants to read by author.
- **Editing an entry's history.** An admin can edit; nothing keeps what it said
  before.
- **Retiring a framework.** No control, and none asked for.

---

## 11 · Open — to settle on the mockup, not here

- **Sections: fixed at eight, or can an admin add one?** Offering the eight and
  allowing a new one follows what this platform already does with a stored value
  outside a list (§96.2), and its cost is that the list fragments with nothing
  to merge two sections afterwards. Not decided.
- **Where the ask sits** — beside the search, or leading it. Islam has already
  turned down *asking leads*, so this is where on the page rather than whether.
- **What a declined addition offers.** *Paste the source instead* is the obvious
  next step and it is a screen decision.
- **The name on the console.** *Frameworks* is the working word.
