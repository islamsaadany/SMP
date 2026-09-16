# 055 · Meeting Notes — one meeting, one note, and the minutes as an email

**Status:** **drawn 2026-09-16, awaiting sign-off, not built.** Every decision
below is Islam's (2026-09-16, the seven answers in §1 and *"ok write the spec
and draw it"* on the format and the prompt in §3) or is marked as mine with
its reason. The mockup is
`design-mockups/meeting-notes/2026-09-16_list-note-minutes-email.html`,
published as an artifact. Nothing in `smp-app/` exists for it yet; the branch
is `claude/meeting-notes`, started from the tracker branch's tip so it carries
the module frame.

**Read with spec 046 (Modules)**, whose §4.2 contract this passes in §4, and
with spec 054 (Internal Tracker), whose chrome, seat gate and shape this
inherits — the two office modules are meant to read as one product.

**Not the tracker.** Spec 054 decision 3 stands: a note's actions go to the
attendees in the minutes and never into the tracker; nothing points from one
module to the other.

**Reference, never source:** `aleymahmoud-ff/strategy-management-system`'s
Notes app, read through the description Islam uploaded on 2026-09-15. §7 says
what is taken and what is left.

---

## 1 · What is asked

Islam, 2026-09-15: *"notes are for taking meeting notes and refine it by AI
and send it as MOM for the attendees of the meeting"* — a client module, for
the office, per client, like the tracker (*"they belong to the client as they
are modules for handling this specific client. so the registry would help for
the emails and who to share the moms with"*).

Then, 2026-09-16, one answer each to the seven questions that decide the
build:

1. *"one meeting one note, title date attendees and text is enough"*
2. *"the free text box is like a note taking app just writing down the the
   role of the ai assistant needs to refine it and may be compile it to
   agreements points and actions etc. so we need to agree on a format and an
   AI prompt"*
3. *"yes for all what you said it do everything"* — the assistant tidies the
   wording, lays it out under headings AND pulls out decisions and actions;
   he always reads and edits before anything goes out.
4. *"also the office and maybe we can add someone casually to the meeting"*
5. *"no it's an email with no signing in"*
6. *"still editable as if we get a note or something we can add more and
   resend"*
7. *"yes ok"* — the list by date, newest first, with a search, each note on
   its own page.

---

## 2 · The decisions

| # | Question | Answer |
|---|---|---|
| 1 | What a note is | **One meeting, one note**: a title, a date, its attendees, and the text typed while it runs. No place, no agenda, no second box (answer 1). |
| 2 | How notes are taken | **One free text box**, saved as you type, exactly as the sheet-like tracker line is (answer 2). No fixed headings to fill: the shape is given to the MINUTES by the assistant, not to the notes by the typist. |
| 3 | What Refine does | **Everything** (answer 3): rewrites the raw notes as minutes in the six parts of §3, tidied and laid out, with decisions and actions pulled out — and **he reads and edits every part before it goes**. The raw notes are never touched by it. |
| 4 | Who attends | **The client's register, the office, and somebody casual** (answer 4). A casual attendee is a name and an email for THIS meeting only and is not written to the register — the register is the client's people and this is one person at one meeting. |
| 5 | What is sent | **The minutes are the email** (answer 5). One email per attendee with the minutes in the body; no link back, because an attendee who never signs in cannot open one. Somebody on the register with no email stays an attendee, is marked, and receives nothing. |
| 6 | After sending | **Still editable, and sent again** (answer 6, reversing my own recommendation to lock it). The email of a second send says *Updated minutes*, and every send is kept in the note's history — who, when, to whom, and the minutes as they went — so what went out is always readable even though the note moved on. |
| 7 | The list | **By date, newest first, with a search**, grouped by month; each note opens its own page (answer 7). |
| 8 | Who opens and who edits | **The office only, by rule** (the client's Super user and SMO team seats) — spec 054 decision 2, same reason. **Any office person on the client may write, refine and send any note** — mine: notes are the office's shared record of a client and one person covers for another; a note keeps who wrote it and who sent it, which is the accountability, and a lock would send the SMO to find the writer to fix a typo. Put to Islam with the mockup. |
| 9 | Where the assistant lives | **The one the platform already has** (`smp-app/lib/assistant.cjs`, the deployment's `GEMINI_API_KEY`), asked with `askJson` under this module's own fixed shape and `needsCorpus:false` — a draft answers from the notes, not from the knowledge base. No second key, no second link. |
| 10 | Where the email lives | **The platform's own email shell** (`lib/mail-html.cjs`, the same builder the strategy module's sends use), sent through `lib/mailer.cjs` from the platform's address with the sender's NAME on it and replies going to the sender, and **a copy to the sender**. Its own design inside that shell (§3), not a second builder. |
| 11 | The word | **Meeting Notes**, key `notes` — mine, and Islam's to change: two words, the first says what a note is of. Recorded here as proposed, not settled. |

---

## 3 · The minutes, and what the assistant is told

Agreed 2026-09-16 (*"ok write the spec and draw it"*).

**The minutes, in this order.** The head — the client, the meeting's title,
the date, who attended, who wrote it up — and then six parts:

1. **Summary.** Two or three lines on what the meeting was about.
2. **Discussed.** The points that came up, as short items.
3. **Agreed.** The decisions, one line each.
4. **Actions.** A small table: what · who · by when. Who and when are filled
   only where the notes say so, otherwise left blank for the writer to fill.
5. **Open.** What was raised and not settled.
6. **Next meeting**, if one was set — drawn inside Open when there is one,
   never an empty heading.

Every part is a box the writer edits before sending; the raw notes stay
beside it, untouched.

**What the assistant is told, in plain words** (the prompt is written once,
in the module's rules file, and the check reads it from there):

- These are raw notes typed during a meeting with *this client*, on *this
  date*, with *these attendees*.
- Rewrite them as minutes in the six parts above. Keep every fact. Invent
  nothing. Add nothing the notes do not say.
- Keep names as written. An action's owner must be one of the attendees, and
  only where the notes name one; otherwise leave it blank.
- Where a point is unclear, keep it and mark it with a question mark rather
  than guessing.
- Write in the language the notes are in; if they mix Arabic and English,
  follow the majority.
- Plain, short sentences. No greetings, no filler, no sign-off.

**It answers in a fixed shape** — `{summary, discussed[], agreed[],
actions[{what, who, when}], open[], next}` — so the platform puts each part in
its box rather than parsing prose (spec 052's `askJson` pattern). A shape the
model does not honour is refused in words and the boxes are left as they
were; a deployment with no key is told so on the button, and the minutes can
still be written by hand.

**Refining again** (decision 6): the assistant is handed the minutes as they
stand AND the raw notes, and told to **add** what the notes now carry and
never to rewrite a part the writer has edited. What it returns replaces the
boxes only where it added; the check asserts an edited line survives a second
Refine.

---

## 4 · The module contract (spec 046 §4.2)

| # | Asks for | Here |
|---|---|---|
| 1 | Its own navigation | The list, and one note |
| 2 | Its own roles and areas | **None on the table**, by decision 8: office by rule, the tracker's deliberate exception again |
| 3 | Its own Setup group | **None.** The email's display name, reply-to and footer are already the tenant's (`GROUP.comms`, §72); nothing else is set |
| 4 | Its own rhythm | **Per meeting.** No week, no cycle |
| 5 | A landing | The list |

What the spine gives for nothing: the address `/<client>/notes/…`, the
switcher entry, the row on the client's card, the on/off drawer, the door,
`withTenant`, the register through `lib/place.ts`, the assistant and the
mailer.

---

## 5 · What it stores

Two tenant-owned tables, RLS-forced by `db/schema.sql`'s loop on the next
apply, and **not** on `lib/schema-check.ts`'s `PLATFORM_TABLES` (§331).

**`notes`**

| Field | Why |
|---|---|
| `id`, `tenant_id` | the note and the client it is about |
| `title` | the meeting's title; may be empty while it is being taken |
| `met_on date` | the meeting's date; today when the note is started |
| `attendees jsonb` | a list of `{key}` for a register or office row, or `{name, email}` for a casual attendee — the register renders a key's name and email at draw and send time, so a rename or a corrected address reaches every note (§48, §74.2) |
| `raw text` | the notes as typed; never written by the assistant |
| `minutes jsonb` | the six parts, as last edited; NULL until refined or written |
| `refined_at`, `refined_by` | the last Refine |
| `created_by`, `created_at`, `updated_at` | |
| `extra jsonb` | room for what is not built (§7) |

**`note_sends`** — one row per send: `note_id`, `sent_by`, `sent_at`, `to
jsonb` (name, email, and whether the provider took it), `update boolean`
(false on the first send, true after), and `minutes jsonb` — the minutes AS
SENT, because a note stays editable (decision 6) and the record of what went
out must not move with it (§42's rule about a log). Appended, never edited.

The email itself is also written to `messages` with its own `kind`, the way a
test copy is (§146), so the platform's record of what it sent stays whole.

**No migration beyond the two tables.**

---

## 6 · Who may do what

- **Open the module:** the client's Super user and SMO team seats, refused at
  the module's own server for everybody else (§42, §44).
- **Start, write, refine, send, delete a note:** anybody who can open it
  (decision 8). Delete asks in place, naming the meeting, and deletes the
  sends with it; a sent note's email is not recalled and the row in
  `messages` stays.
- **Refine** is refused in words, never hung, when the assistant is not set
  up or answers in a shape the module cannot read.
- **Send** needs at least one attendee with an address and at least one
  non-empty part; otherwise it says which is missing (§221, aria-disabled
  with the reason).

---

## 7 · What is taken from the reference and what is left

| Theirs | Here |
|---|---|
| A note per meeting with a date and attendees | Taken |
| Free text refined by AI into structured minutes | Taken, on the platform's own assistant and a fixed shape (§3) |
| Minutes sent as MOM by email | Taken, on the platform's own email shell, no sign-in |
| Attendees from a contact list | Taken as the client's register plus the office, plus one casual attendee per meeting |
| Action items created from a note into the tracker | **Not taken** (spec 054 decision 3) |
| Templates / agenda per meeting | **Not taken** (answer 1); room in `extra` |
| Attachments on a note | **Not taken** to start; the chat's picture intake (§50) is the road if ever wanted |
| Sharing a note as a link | **Not taken** (answer 5): the attendees do not sign in |

---

## 8 · How it is proved

`smp-app/checks/notes.mjs`, needing a database, in `checks/tracker.mjs`'s
shape: a stand-in for the model at `GEMINI_ENDPOINT` and a stand-in for the
mail service at `SMP_RESEND_ENDPOINT` (§142.6, §100.3), reading what was
actually asked and what actually left. Both ends of every rule (§94.2): the
office in and a client person turned away at the server; a note read back off
Postgres after every press; the prompt asserted to carry the attendees and
the date and to name nothing else; a Refine filling the six boxes from the
stand-in's answer and a malformed answer refused with the boxes untouched; an
edited line surviving a second Refine; one email per attendee with an
address, none to the one without, a copy to the sender, the subject opening
with *Updated minutes* on the second send; `note_sends` holding the minutes
as sent while the note moves on; a casual attendee never reaching `people`;
and the two tables asserted RLS-forced and off `PLATFORM_TABLES`. Red under a
named break before green is believed (§94.5); every probe degrades (§215).
`checks/modules.mjs` covers the registry half by construction.

---

## 9 · Open, for Islam

- The word (decision 11): *Meeting Notes*, or another.
- Decision 8's second half: any office person edits any note, or only its
  writer and the Super user (the tracker's rule).

## 10 · Recorded, not decided

- The switcher still lists an office module for a client's own person, who
  is then refused at the door (spec 054 §10's first line; the per-module
  access tab is where it ends).
- The module is turned on per client from the client's card.
- Nothing is sent on a schedule and nobody is reminded to send minutes.
- A second Refine can only add; if the notes were CORRECTED rather than
  extended, the writer corrects the minutes by hand — said on the mockup, and
  the cheaper of two behaviours.
- The email cannot carry the client's mark (§72: mail clients block a
  data-URI image), so the head is typographic: the client's name in the bar.
