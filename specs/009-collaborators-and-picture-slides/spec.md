# 009 · Collaborators on tactics, and pictures in the review

**Status:** BUILT (2026-08-23), v3.18; the editor rebuilt as a mode in v3.19
(see §4a — the position picker described in §5 is gone, the rule behind it is
not). Both parts asked for by Islam in one
message; the four product decisions inside the second were put to him before
anything was written and his answers are in §3 and §6.
**Builds** backlog §16.12 (*"Review mode should accommodate images"*), which had
been recorded and left undesigned since v3.5.
**Recorded as** §50 in the decisions document.

---

## 1 · The two asks, in Islam's words

> *"in the tactics table add collaborator so we have Owner which is 1 person
> and Collabs. which are the people who will support"*

> *"In the presentation I want to add a feature for the custodian to add a
> slide with pictures where he uploads pictures to add in certain slides and
> adjust these pictures in the slide"*

---

## 2 · Collaborators — what was already true

`collaborators` is not new. It has been on a tactic since the import template
was built (§22): the upload writes it, `tactics.collaborators` (jsonb) stores
it, `templates.js` round-trips it through export and re-import, and
`SMPRules.namedOn()` reads it to decide whether a **Contributor** may report a
line that is theirs (§42, spec 006 §7.2).

Three things kept it invisible, and all three are the ask:

| | Before | Now |
|---|---|---|
| Setting them | Only by uploading a plan | Typed under the SMO's pen on Plan |
| Unit's Performance page | A grey *"with A, B"* line under the owner | A **Collabs.** column beside Owner |
| Plan page and the deck | Absent entirely | A **Collabs.** column beside Owner |
| The demo | No tactic had any, so it rendered nothing | Retail Stores carries five |

Owner is untouched: **one person, never a list.**

### 2.1 Who may set them

**The SMO only** (Islam, asked and answered). Not tidiness: being named on a
tactic is what decides who may report it, so a unit able to edit its own
collaborators could hand itself reporting rights the access matrix never gave
it. It sits behind `mayEditPlan()` — the same pen and the same gate as the rest
of a plan correction (§31).

### 2.2 Demo content

Collaborators were added to **Retail Stores only**. Mobile's plan is the
client's real one and who supports its tactics is not Forefront's to invent
(rule A4, practice B3).

---

## 3 · Picture slides — the four decisions

Each was put to Islam with its cost before any code was written (rule A1).

| Decision | Answer |
|---|---|
| How long they last | **The cycle** — archived with its figures when it closes; the next cycle opens clean |
| Who may add one | **Custodian, owner and the SMO** |
| What "adjust" covers | **Arrangement, crop and caption** — not free placement |
| Who sets collaborators | **The SMO only** |

---

## 4 · What is stored

Never a slide. The deck is built fresh every time it is opened and there is no
exported copy (§8.8) — a stored slide would be the exported deck the whole
feature exists to avoid. So `REVIEW.slides`, keyed exactly as `REVIEW.note` is
(a unit key, or `fn:<key>`):

    { id, title, at, layout, pics: [ { src, cap, z, x, y } ] }

`at` is an anchor (§5). `layout` is how many pictures sit across; four means
two by two. `src` is a data URI; `z`/`x`/`y` are the crop.

**No migration.** It lands in the `review` row's `extra` jsonb and is merged
back on read — proven by the round-trip test rather than claimed.

**Reading never writes.** `pslidesOf()` returns a shared frozen empty array; the
container is created only by an act that puts something in it, and removing the
last picture deletes the key again. This is §42's `branding()` fault, which made
every save carry a change the database never held and refused every non-SMO save
for ever.

---

## 4a · Manage slides — the editor (v3.19, §51.8)

**Status:** BUILT. Replaces the modal editor this spec first described.

Islam, on driving it: *"the buttons shouldn't be pictures it should be manage
slides which opens the slides list on the left like PowerPoint and on the right
are the slides view … think of the customer experience to have something
functional."*

**A mode, not a dialog** — the reason presenting is one: this is looking at a
deck, and a deck does not fit in a 940px box.

**The left rail is the WHOLE deck**, every generated slide included, rendered as
real slides at one tenth rather than as drawings of them — so a slide that is
wrong is wrong in the rail too. **That is what removed the position dropdown
this spec's §5 described**: a picture slide is placed by where it is inserted.
The anchor rule underneath is unchanged; it is read from where the slide was
dropped rather than typed into a list describing the deck in words.

| Control | Behaviour |
|---|---|
| **+ Add a slide** | Pinned at the top of the rail. Inserts after the selection. |
| **▲ ▼** | Steps a picture slide over its neighbour, whatever kind it is — how a picture moves from the pillars to the SWOT without naming an anchor. Only picture slides move. |
| **1 2 3 4** | How many pictures sit across. Narrowing never destroys pictures. |
| **Fit / Fill** | Fit shows the whole picture; Fill bleeds it and crops. **Fit is the default** — see below. |
| **Zoom** | 50–300%, with the number shown. |
| **Drag** | Reframes the picture; the big slide and its thumbnail move together. |

`slidesPlace()` is the ONE function behind Add and the arrows — they are the
same act (which anchor, and where among that anchor's others). It removes the
slide from the list **first**, or the count of what sits before it includes
itself and the slide creeps.

A **blank slide** is drawn in the editor and nowhere else: a slide with no
picture is not a slide and must never reach a projector, but the moment after
Add it is exactly that, and a rail that does not show what you just made has
swallowed it.

### 4b · Fit is the default, not Fill (§51.9)

Two of Islam's notes — *"allow me to zoom out more as the zoom in is too big"*
and *"pictures need to be wrapped to fit in the space you give to it in the
slide"* — are one fault. The frames were `object-fit:cover`, which fills the box
and discards whatever does not reach the edge, so a portrait infographic in a
landscape frame lost **both** its edges; and the zoom slider could only make it
worse, because 100% was already the tightest crop on offer. **There was no way
to say "show me all of it."**

§1 of this spec asks for a screenshot of a platform before it asks for anything
else, and a screenshot with its edges cut off is not a screenshot of anything.
So a picture fits whole and Fill is chosen deliberately, said in two words
rather than inferred from a slider position.

The frame's ground is the slide's own white: with `contain` the picture no
longer fills its box, so anything behind it becomes a letterbox band **on the
slide**, and a grey band around a screenshot reads as part of the design.

---

## 5 · Where a picture can go

An **anchor** is a named point written on the deck slide it names, carrying its
own label. The position picker is built by generating the deck into a detached
element and reading those anchors back — **the list of places IS the deck**, so
the two cannot drift. Twelve for a unit, five for a supporting function.

Insertion runs **before the fit pass**: the fit pass clones a long table's slide
to continue it, so a picture inserted afterwards could land between a table and
its own continuation, and an anchor read after cloning would match twice.

**An anchor that has gone is not a lost slide.** A pillar can be renamed or
replaced by an upload between the day a picture was placed and the day the deck
opens; the picture goes to the end rather than being dropped.

---

## 6 · Who may add one — and why it is not a new rule

A picture put in front of the board **speaks for the whole unit**, which is the
same act as submitting and the same act as the cycle note. So it is classified
with them (`reportState`) rather than given a rule of its own, and both sides
ask one function, `canSpeakFor()`.

- A **contributor** limited to their own lines does none of the three.
- A **locked cycle** stops taking all three together.
- Someone who **views** a unit without editing it adds nothing.

### 6.1 Verified by comparison, not by reasoning

For each of the 31 people in the seed against each of the 10 units and 7
supporting functions, the browser's `canSpeakFor()` was compared with the real
server authoriser's verdict on the same change: **527 questions, 0
disagreements.** This is the drift §42 exists to prevent — a screen offering an
edit the server then refuses.

`scripts/test-authorize.js` carries eight further cases (§8 of that file).

### 6.2 The honest limit

A locked cycle refuses a picture the same way it refuses a figure. Right for
figures; arguable for pictures, since a review meeting can happen after the
lock. Left matching the note rather than given a fourth rule. Revisit if it
bites.

---

## 7 · Taking a picture in

Shrunk in the browser before it is ever stored: **1,600px** on the long edge,
because the stage is 1600×900 and more is detail nobody in the room can see,
carried in every save for ever.

**Encoded both ways, and the smaller one kept.** §16.12 asks for a screenshot
*and* a photograph, and they want opposite formats. Measured:

| | as PNG | as JPEG |
|---|---|---|
| Screenshot of a table | **164 KB** | 256 KB |
| Photograph | 3,058 KB | **395 KB** |

Guessing from the file's own type gets both wrong the moment somebody pastes a
screenshot saved as `.jpg`.

Uploaded, never linked: a linked image would break the offline single-file
handover and put a request to a third party on every load of a file holding a
client's strategy.

---

## 8 · Limits, stated

- **Twelve slides** per unit or function per cycle, **four pictures** a slide.
- Pictures travel inside the same save as everything else, so each one makes
  every save heavier. That is the cost of keeping the single-file handover
  working, and it is why the shrinking is aggressive.
- Capability **projects** carry no picture slides; the function deck does.

---

## 9 · Verified

- QA sweep — every page as every viewer: **no console errors**.
- Contrast, four palette-and-theme combinations, scoped to the two new
  surfaces: **0 failures**.
- Screen-versus-server drift: **527 questions, 0 disagreements**.
- `scripts/test-authorize.js`: **123 passed, 0 failed**.
- `scripts/test-roundtrip.js` with picture slides in the graph: clean slate
  PASS, round trip PASS, fixed point PASS, archived plan PASS.
- Driven against a running `dev-server.js` and Neon-shaped Postgres: added,
  saved (`POST /api/state` 200), **reloaded from the database**, and shown on
  the slide it was placed on.
- Cycle behaviour: archived on close, cleared for the new cycle, restored
  byte-for-byte from the archive, and absent from the graph until a picture
  exists.
