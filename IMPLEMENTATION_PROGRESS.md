# SMP — Implementation Progress

How things are going, in one place. Updated in the same commit as the work it
describes. This replaces sending the built HTML and the project zip after every
version (rules A2 / A11, changed 2026-08-20) — those go only when asked for.

**Direction, 2026-09-09 — the rebuild is the work now (spec 043, §314).**
Islam's decision record, verified against the code and aligned question by
question: SMP moves to **Next.js with one shared Postgres schema and row-level
security**, reversing §36 and §313's schema-per-client eight days after it
merged. Two tables (`users` platform-wide, `people` per client), the tenant
set per request on the direct connection, a non-owner database role, the URL
an address the server checks. **The single file takes no new features from
today**; a client-blocking defect is a correction and is asked about first.
**Nothing built** — `specs/043-shared-schema-rebuild/spec.md` is the
alignment document, **signed off 2026-09-09 with one change** (Raya Trade's
data is carried across by a one-off migration, §314.1); the first slice after
it is a spike of nine proofs on a real Postgres, not a screen. `plan.md`,
`data-model.md`, the two contracts and `quickstart.md` were written 2026-09-09;
four plan-stage choices (no auth library, Prisma with a wrapper and `pg` if S6
fails, the change-list save with a per-tenant lock, the checks pointed at
Next) are in `research.md` §P1–P7 — **answered by Islam 2026-09-09**: three as
written, and the save **enhanced** at his word (§314.2): every box still saves
itself, and the server writes only the rows the change list names — the
wipe-and-rewrite writer is not carried over (spike S9, nine proofs now).
`tasks.md` written 2026-09-09 (72 tasks, one phase per proof) **and the spike
built and green the same day** — nine proofs under `smp-app/spike/`, each red
first under its named break (§314.3): the role and FORCE, the pooler, the
schema check over 42 tables, isolation on every table, Prisma with a wrapper
(the policy took `NULLIF`), deletion, the door, Raya's migration on a copy,
and the row-addressed save (one box → one row, 795 swept). `main` untouched.
**S1's Neon answer is in (§314.4):** through Neon's SQL editor, no connection
string involved — `neondb_owner · rolcreaterole t · rolsuper f · rolbypassrls
t`, so the key makes the role and research §P5's stop does not fire; the
sign-in-as-`smp_app` half is proved locally and runs on Neon at the first
deploy. **The first screen group is built (§315):** the door at `/` and
`/<client>/sign-in`, the password card, and the landing at `/<client>` —
the welcome screen whose rows are the frozen readers' own, run in a vm
(`lib/frozen.cjs`) so the landing cannot disagree with the pages behind it;
the mockup signed off with Islam's own fourth line (*Presented from the
same place*). 44 browser assertions green, red first (3 / 15), `tsc`,
`next build`, S7. Every page behind *Continue* answers with a holder saying
it is the next group's. **The rest of the rebuild is drawn as ten phases
(`specs/043-shared-schema-rebuild/phases.md`, 2026-09-09)** at Islam's word
— *"build a full plan with phases and let's approve it so you don't stop
until you really need my input"* — with one recommendation and its cost:
the frozen product's own renderers and shell are the screens, carried
verbatim over the new API, the new client and the new routing (a verbatim
screen is not a design change, so no mockup; any departure is a stop
point), and six named stop points (the plan itself, a visible departure, a
question the record does not answer, a client-blocking defect on the frozen
build, running Raya's migration on the real data, and the cutover and the
merge). **Approved 2026-09-09 (A0)** — Phases A→J run without stopping except at the plan's own stop points B–F. Islam's one constraint: database work he runs goes through **Neon's SQL editor only**, so Phase I and J hand him SQL to paste (or run at deploy from Vercel's environment), and anything that fits neither is said rather than assumed. **Built:** Phase A, the state API (§315.2 — `smp-app/app/api/[slug]/state`, `checks/state-api.mjs` 87/0, six red runs); **Phase B, the shell on the new stack** (§315.3 — the whole frozen shell served as one file by `lib/shell.ts`, `sync.js` carried rather than rewritten, the address ↔ §173's place in `shell/route.js`, `script-src 'self'` with no hash, Forefront's own pages over `lib/platform-api.ts`; `checks/shell.mjs` 36/0 with two red runs, and `qa.py` against the app 33 viewers / 229 destinations / ERRORS none). **Phase C, Strategy** (§316/§316.1 — the acceptance run: **39 frozen checks re-pointed at the served app, 0 failures**, each on a freshly seeded tenant; `qa.py` at Next 33 viewers / 229 destinations / ERRORS none; state 87/0, door 44/0, shell 36/0, authoriser 588/0, differ 136/0, `tsc` clean. **One product fault**, the first correction §314's freeze has taken: the plan builder minted a capability key objective with **no id**, which rendered and could not be WRITTEN — §314.2's row-addressed writer refuses it by name — asked of Islam first and fixed with `mintRowId` rather than the positional renumber that would have re-addressed every project beneath it (§48). Everything else it found was the HARNESS: a check that serves its own poisoned server is no longer re-pointed, and says so in its own first lines. Nothing retired.) **Phase D, Performance and Reporting** (§316.3/§316.4 — **22 frozen checks re-pointed at the served app, 0 failures**; `qa.py` at Next 33 viewers / 229 destinations / ERRORS none, the `file://` sweep ERRORS none, state 91/0, the nine spike proofs, 588/0, 136/0, `tsc` clean. **One product fault, and it was live on `main`**: pressing *Open a new cycle* looked like it worked and never saved, because §307 took the review point off that panel while the column still insisted on one — proved on the FROZEN writer rather than inferred from the port (§303), put to Islam in plain words and fixed on his word, as a migration on both stacks with the constraint put back to prove it red. Everything else was a CHECK: four that serve their own state and must not be re-pointed, one asserting half a rule, one fixture writing a value the product cannot make, one bucketing pixel tops, one holding a handle across a repaint, one measuring a box the grower had never seen — and my own runner counting failures a way the checks do not all spell them, §298.3. Nothing retired.) **Phase E, Setup and the clip endpoint** (§316.5 — **38 frozen checks re-pointed at the served app** and `api/blob.js` PORTED, the fifth and last endpoint, with `checks/blob-api.mjs` 23/23 and RED both ways; `qa.py` at Next 33 viewers / 229 destinations / ERRORS none, the `file://` sweep ERRORS none, door 44/0, state 91/0, shell 36/0, 588/0, 136/0, `tsc` clean. **No new product fault in this group.** Four reds were established as NOT this work's by reproducing them on `origin/main`'s OWN build before anything here was blamed (§303): `history-page` 10, `band-corner` 6 — where the Plan page does not scroll at 1440×900, so the band sits exactly at its own sticky offset and the corner fill paints at rest — and `tour` 15, whose step 9 points at a control §252.2 made the office's; plus `table-scroll`'s 4px squeeze of the viewer label at 1100px, measured on both stacks and caused by the client-back control a SERVED deployment draws for a Forefront consultant, never for a client's own staff. All four recorded rather than fixed, because the frozen file takes no new work (§314) and none of them blocks a client. Everything else was a CHECK: the chat corner taking clicks that are not its own — it is not drawn over `file://`, so no screen check has ever had to dodge it — five writing on the office's own register row, two arguing with a decision that had moved, one relying on a reload to reset, two keyed on controls §261 and §193.2 replaced, and three reading the built file's inline scripts, which the served shell does not have. Nothing retired.) **Phase F, Presentation** (§316.6 — **18 frozen checks at the served app, 0 failures**; `qa.py` at Next 33 viewers / 229 destinations / ERRORS none, the `file://` sweep ERRORS none, door 44/0, state 91/0, shell 36/0, blob 23/23, 588/0, 136/0. **Nothing was ported for this group and nothing needed to be**: a deck is assembled in the BROWSER from the graph on the press, the `.pptx` and the print are built there too, and the one thing that ever leaves is a clip — whose endpoint was ported at §316.5. **No product fault**; two checks, both shapes this rebuild has met before — one asserting the WORDS of one stack for a rule that holds on both, and one reading the rail before an asynchronous viewer switch had taken (§237). Nothing retired.) **Phase G, Communication** (§316.7 — `api/chat.js` (1883 lines) and `api/mail.js` (462) CARRIED across as `lib/chat-api.cjs` and `lib/mail-api.cjs` with `lib/{mailer,push,assistant,mail-html,audience}.cjs` beside them: every decision byte for byte and **the plumbing replaced in exactly ten named ways**, listed in the carried file's own header and checked by reading the whole code-only diff hunk by hunk against that list. `checks/comms-api.mjs` 47/47, RED both ways; the twelve frozen browser checks marked own-server and green; `qa.py` at Next 33 viewers / 229 destinations, ERRORS the ONE named 404 and nothing else, `file://` ERRORS none; door 44/0, state 91/0, shell 36/0, blob 23/23, 588/0, 136/0, `tsc` clean. **Two product faults, both found by PRESSING the endpoints**: `FROM org WHERE id = 1` named a column the shared schema does not have — `org` is a singleton keyed by `tenant_id` alone — so the settings read threw and every chat request answered *Something went wrong*; and `push_subscriptions` was keyed `(tenant_id, person_key, endpoint)` in the NEW schema where the frozen key is the ENDPOINT alone, so a device signed in to by somebody else would gain a second row instead of moving and the previous person would go on being notified — corrected with migration 003. Two nested transactions became SAVEPOINTs, because the request is already in one and a COMMIT there would take the tenant setting with it. **THE SEAM IS NEW**: all twelve browser checks serve their own stub and must (§94.11), so none had ever spoken to the ported endpoint — section 8 drives the real corner in a browser against the real route and reads the row back through the tenant. **AND ONE QUESTION IS PUT TO ISLAM (stop point C)**: `/sw.js` is 404 by the plan's own line 47, and that same file carries `push` — so no device can register, and once a page load logs that 404 for every viewer, with nobody having turned anything on — `pushSync()` registers the worker BEFORE it asks whether this device wants a subscription (§282.4), so no switch prevents it; the chain I first reasoned, a VAPID pair moving, was REFUTED by deleting the pair and sweeping again. Nothing retired.) **Phase H, files in and out** (§316.8 — NOTHING ported, which is the plan's own row: the workbook builders and readers are client-side and travel with the shell by construction. `template-round-trip` 0 failures at Next; `import-page` and `kb-file` 1 each and both the ONE recorded worker 404, established as not this group's by running all three green over `file://` first. **AND VERIFYING IT FOUND HALF THE ROW COVERED BY NOTHING**: the round trip is proved in the BROWSER and never saves, so *the upload's replace path and the archive land through A's save* had no check on either stack — and it is the half most likely to fail here, because §314.2's writer is row-addressed and a replace is the shape that adds and removes rows. `checks/upload-seam.mjs` 9/9 and RED both ways drives the platform's own workbook in a real browser and reads the plan back out of Postgres through the tenant. **Its own first fixture claimed three kinds of difference and made one** — a plan row's id is minted BY POSITION, so dropping the last pillar and appending a new one leaves the id set exactly as it was: all updates, no insert, no delete, under two labels saying otherwise — found by the break going red on the ARCHIVE and green on both pillar claims. Two faults in my own probe, each an old rule in a new place: it archived the thing it was measuring, and it read the database with stderr thrown away, so an ambiguous-column ERROR came back as *the value is not there* and called a correct build broken. `qa.py` at Next 33 viewers / 229 destinations, ERRORS the ONE recorded 404 and nothing else, `file://` ERRORS none; door 44/0, state 91/0, shell 36/0, blob 23/23, comms 47/47, 588/0, 136/0, `tsc` clean. **STOP POINT C NARROWED**: the worker gap now reddens any re-pointed check that asserts no console errors, not just a sweep's ERRORS line — and Phase J's own row already serves a self-destructing `sw.js`, so a file at that address is in the plan; what is open is only whether it carries `push`. Nothing retired.) **Phase I, the data — PREPARED, not run** (§316.9 — its row is *1 + Islam* behind stop point E, so what is built here is everything that can be, plus a runbook naming each step and who does it. **What Islam is asked for came out at two presses and no SQL, and that is a finding**: a tenant created with an `INSERT` holds no graph, and a tenant with no graph answers 404 at the state API — the client cannot be opened by anybody, including the person who could fix it — while Forefront's own *Add a client* writes the row AND loads §67's cleared graph, deleting the row if that load fails. `scripts/seed-demo.mjs` carries the demo's content under the demo TENANT with the frozen renaming table and its refusal required rather than copied, refusing twice — on the graph it builds and on the graph Postgres hands back — and proved on a virgin database; `checks/demo-seed.mjs` 7/7 and RED both ways scans the COLUMNS of every tenant-owned table rather than the graph, with Raya's scanned the same way as the control. **Its own first run called a correct demo broken five times**, matching the token `Nour` inside the invented *Noura Ghanem* — the frozen refusal splits on non-letters and matches whole words, so the fix was to ask IT per row rather than write a second rule, which brings its picture rule along. **And opening an empty client found a live defect**: the landing resolved the person from the MEMBERSHIP while the state API places them on the REGISTER, so a Forefront admin opening a client by rule read *You are not on this client's register yet* for ever, on every client, with their row plainly in `people` — fixed read-only, because opening a landing is not a placement. `qa.py` at Next 33 viewers / 229 destinations with the one recorded 404; `file://` ERRORS none; door 49/0, state 91/0, shell 36/0, blob 23/23, comms 47/47, upload 9/9, demo 7/7, 588/0, 136/0, nine spike proofs, `tsc` clean. Nothing retired.) **Phase J, the cutover — BUILT, not run** (§316.10 — everything that can be built and proved here, plus `specs/043-shared-schema-rebuild/phase-j-runbook.md`, which names each step and who does it. **Stop point C is answered and it is Islam's** (*"1. ok"*): the worker goes back, carrying the notifications and storing nothing. The plan said both *no service worker* and *carry notifications* and was right about its own half each time — line 47 reasons entirely about CACHING, and that argument is STRONGER on the new stack, because the platform document is server-rendered and per person, so a cached copy is one person's page served to the next. So the caching half is dropped, the notification half is CARRIED — generated by `scripts/build-sw.mjs` from the frozen file with both ends asserted, proved able to fail three ways — and there is no `fetch` handler at all, which is what *stores nothing* means when it is measured. **It is also what clears the frozen caches**, which is why Phase J's row asked for a file here: every cache deleted on activate and the clients claimed, so §91's returning browser cannot be served the old platform off its own disk — and claiming a tab that already had a controller fires §258's *A newer version is ready*, so a tab left open on the frozen build is offered the reload at the cutover. **The 404 every page load logged since Phase G is gone**, and `import-page` and `kb-file`, 1 red each for exactly it, are green at Next. **The manifest had to cross with it or the answer is true on a laptop and nowhere else** — on an iPhone a push is only delivered to a platform added to a HOME SCREEN — so `scripts/sync-static.mjs` carries it and the icons verbatim and both surfaces link them; the offline copy does not come back, which is line 47 standing. **And measuring the deployment found what nothing looks at**: the frozen `vercel.json` sets eight security headers on every path (§43.6) and the only surface on the new stack setting any was the shell's own route — the door, the landing, `/sw.js` and every stylesheet carried none. `next.config.ts` reads them out of that same file, in two sets kept DISJOINT, because a policy is the wrong place to lean on an internal precedence. **The `DELETE FROM sessions` the row asked for is not written and it is said why**: the carry copies password hashes verbatim and not one session, so everybody signs in once by construction and a migration deleting nothing would be ceremony (§24). **What runs at deploy is one file and two switches** (`scripts/deploy.mjs`): the schema every build, the carry and the demo behind `SMP_CARRY_RAYA` / `SMP_SEED_DEMO`, neither firing on a preview — and the switch decides WHEN rather than whether, which is the whole cost, because the carry reads the frozen schema while the frozen site may still be taking writes. `qa.py` at Next 33 viewers / 229 destinations / **ERRORS none**, the first clean line since Phase G; `file://` ERRORS none; door 49/0, state 91/0, shell 60/0 with five red runs, blob 23/23, comms 47/47, upload 9/9, demo 7/7, 588/0, 136/0, the nine spike proofs, `tsc` clean.) **Waiting on Islam, and nothing here is waiting on anything else:** the Vercel settings and the two one-deploy switches, the address, **the two presses of *Add a client*** — he made them on the FROZEN platform, so they are still owed on the new one — and **the merge**, which is his word on that merge, every time.

**Where it runs:** Vercel, production tracks `main`. Static files plus two
serverless functions (`/api/state`, `/api/auth`) against Neon Postgres.
**Latest version:** **Revenue drivers (spec 063, §389) — built and merged to `main` 2026-09-23.**

A new part of the Strategy module for units whose revenue is argued from its
parts (stores &times; basket &times; visits, and so on). Three screens, all
drawn and signed off first: a **Drivers** section beside Plan where the tree is
written, a **Revenue drivers** half on Performance showing what was argued for
against what came in, and **Setup &rsaquo; Revenue drivers**, where the office
names the seasons (Ramadan and the like) once for the whole client.

**And it can be switched off.** At your word, the Revenue drivers page carries
an **On | Off** switch for the office. Off hides the Drivers section, the
Performance half and the Revenue performance card for the whole client, so the
pages look exactly as they did before the module existed; nothing is thrown
away, and On brings it all back as it was. **Every existing client starts
Off**; the demo shows it On.

**Checked:** the arithmetic against your own tool, 99 assertions on the rules,
713 on who may change what (a unit head cannot flip the switch), the switch
pressed in a real browser both ways, the Setup checks, and a full sweep of
every page as every viewer with no errors.

**Merged 2026-09-23 on your word**, with main's My reporting (§380–§388)
brought in first. My reporting had taken the number *spec 062*, so this is
**spec 063** now. Everything was re-run on the combined version, not on the
branch alone.

**Still yours:** turning it On for any client that should use it — every
existing client starts Off.

### Earlier: **§356.16 — the week by its month, fixed cards, and a line that asks later (spec 054).**

**Built and merged to `main`.** All four things you asked for, each drawn
before it was built, and two of them drawn three ways so you could weigh what
each cost. **A week three weeks out reads its month** — *W1 Oct*, *W3 Dec* —
where before it read its number in the year. A week that falls across two
months takes the month its Thursday is in, so 27 September to 1 October is
*W1 Oct*; that follows from the way a week was already stored and needed no
second rule. The picker says what the rows say. **The four cards at the top
hold still.** They were changing size whenever an action moved from one status
to another, because the due card's tail ran onto a second line and all four
cards share a row. The tail is gone and the cards are held open, so nothing
jumps. **The names list is as wide as its longest name** and no wider. **And
the add line asks later**: at rest it is one box for the action, and the
moment you type the first letter the week, the owner, the status and the note
appear beside it — their space is kept from the start, so nothing moves under
your hand while you are typing.

**Checked:** 228 assertions on a real database, the browser half pressing
every control and reading the database back after each press; red under
thirteen deliberate breaks, one for each decision; the modules check green;
the frozen product untouched.

**Still yours:** the module still has to be turned on per client from the
client's card.

---

### Earlier the same day: **§356.15 — the note is asked for, and the week is in words (spec 054).**

**Built and merged to `main`.** Both drawn before either was built — three
ways to ask for a note and two ways to spell a week, each with its cost beside
it — and you chose the arrow and the words. **A note is not on the line until
you ask for it.** The arrow at the end of a row, the one that already opens
the row, opens the note box with it; folding the row empties that box, and the
cost of that is stated rather than discovered — the arrow throws away a note
you had not sent, which is what Escape on that line already did. Tab from the
action is the second way in, and an empty note left behind folds itself.
**A week reads in words**: *This week*, *Next week*, and a number only once
you are past those. **What is not built is the past week, on your own earlier
decision**: an open action whose week has gone already reads *Late*, *Late
1 w*, *Late 2 w*, and a week number there could only replace that word — the
alarm would go with it.

**Checked:** 214 assertions on a real database, the browser half pressed in
Chromium; red under eight deliberate breaks; the frozen product untouched.

**Still yours:** the module still has to be turned on per client from the
client's card.

---

### Earlier the same day: **§357 — Meeting Notes: one meeting, one note, and the minutes as an email (spec 055).**

**Built and merged to `main`.** The sixth module, and it
cost one folder and one line in the table the route asks — everything else it
needs is the platform's already. **The meetings list** is newest first,
grouped by month, with a search and what went out on every row. **A note** is
its title, its date, who was there, and the box you type in while the meeting
runs. **Refine** hands the notes to the assistant and writes the minutes into
six parts beside them — Summary, Discussed, Agreed, Actions, Open, Next
meeting — and **every part is a box you can edit**. **Refining again ADDS**:
whatever you rewrote stays exactly as you left it and the model's new lines
join it. **Send** emails the minutes to everybody on the meeting who has an
address, with a copy to you; a second send says *Updated minutes*, and what
went out the first time is kept as it went. **Somebody who is not on the
client's register** can be added for that meeting only, by name and address,
and is never written to the register. **The office's alone**, by seat, refused
on the page and at the api both.

Checked: 154 assertions, 0 failures, with the last section pressed in a real
browser and Postgres read back after every press; red under each of five
deliberate breaks; a stand-in standing in front of both the assistant and the
mail service, so what was asked and what left are read off the wire rather
than assumed. Three faults it found are fixed: a year printed twice in the
subject line, a stray `&middot;` on an attendee's chip, and a date box that
printed `09/16/2026` — it is the tracker's own date control now, so a date is
set one way across the office's modules.

**Still yours:** the module has to be turned on per client from the
client's card; and the switcher lists it for a client's own person until the
per-module access tab exists (spec 046 §4.4).

**Since then (§357.1–§357.3), from your three notes on the built page:**
**The title and the attendees box did not read as boxes** — they always were
ones, they just did not say so, being borderless and set in heading-sized
bold. Both wear the same small uppercase label and the same border every other
field on that page already has, so nothing new was invented to fix it.
**The attendee list stays open while you tick.** Every press is answered by
the page being drawn again, so a tick used to rebuild the list from scratch and
it vanished, taking whatever you had typed into its search with it. It now
keeps where you had scrolled to, which of its boxes held the cursor, and who
you had just ticked. **There is nothing to confirm** — a tick is in the
database before its chip finishes drawing — so what was missing was a
deliberate way to *finish*, since Escape was the only one and a tablet has no
Escape key. **And adding somebody who is not on the register shut the list
every time**, because the test for "you pressed somewhere else" asked what the
act was called rather than where the press landed.

**Checked:** 164 assertions then, red under each of seven deliberate breaks.

**And since then (§357.4), the date — the one thing that was drawn and not
built:**

You asked for two things: the day to stay where it is, and the calendar to open
on the first press rather than the second. Both are in. **The day is the
button, and pressing it no longer takes the day away** — the calendar simply
opens over it. Until now the press swapped the day for a plain date box, which
printed the date in whatever style the browser happened to use rather than the
way the rest of the platform writes it, and the calendar was then behind a
small icon inside that box.

**The fork was whether the day itself stays something you press.** Both ways
were drawn for you. I took your go-ahead as going with the recommendation: the
same pill you have, with a small calendar mark inside it, and one press
anywhere on it opens the calendar. It keeps the whole pill as the target rather
than a small icon, and it takes away no press that works today. The other
reading — the day as plain text with the mark beside it as the only way to
change it — is a small change away if you would rather it read as a stated fact
than as something to touch.

**It also quietly fixed something that was going to bite.** This date control
was copied from the Internal Tracker's before the tracker fixed a fault in it:
the box was thrown away the moment the calendar opened, because opening the
calendar moves the cursor out of the box. Notes never got that fix. With the
day no longer swapped for a box there is nothing left to throw away.

**Checked:** 170 assertions, red under each of eight deliberate breaks — the
new one puts the two-press behaviour back and fails exactly the two things this
round is about, and nothing else.

**Still yours:** the Internal Tracker sets its dates with the same control and
has not been given this. It is the same control and could take it — I have left
it alone because it is a different module and you did not ask about it. Say the
word and it goes across.

---

### Earlier the same day: **§356.14 — the tracker's dates by the week, a settings menu, the add line that takes everything, one pill size, and a way back (spec 054).**

**Built and merged to `main`.** Everything on the
drawing you signed off is in. **The two faults you hit**: the status pill was
two sizes because the line that sets its type was not one a browser reads, so
the pill you could press and the pill you could only read each fell to a
different font — one box now, every row, pressable or not; and the date could
not be set because the date box was thrown away the moment the cursor left
it, which is what opening the calendar does — it stays now until you pick a
day, press Escape, or press somewhere else. **Dates are weeks**: a row reads
*W38*, this week's number in bold; picking a week stores its Thursday, so a
row set by week and a row set by day are the same kind of row. The picker is
a small table, this week bold, six weeks ahead, *No date* and *A day of my
own…* at the foot. **The three dots** on the far right of the views row hold
*Group by* and *Dates as* (Weeks or Exact dates), remembered by your browser.
**The add line** takes the week, the owner and a note before Enter — a new
line lands due this week, owned by you, unless the line says otherwise. **The
way back** sits above the title, the client's name.

**Checked:** 206 assertions on a real database, the browser half pressing
every new control and reading the database after each press; red under six
deliberate breaks, the sixth putting the old date box back; the modules check
green; the frozen product untouched.

**Still yours:** the module still has to be turned on per client
from the client's card. Notes (meeting minutes) is next and has no spec yet.

---

### Earlier the same day: **§356.11–§356.13 — the Internal Tracker's row, redrawn at your word and built (spec 054).**

**Built and merged to `main`.** Everything on the
drawing you signed off is in: the owner is a **first name**, and pressing it
opens the team on this client to hand the action on (only the owner and the
Super user get the press, everybody else reads the name); the **arrow** at the
end of a row opens it for its notes, its history and Delete, and folds it again;
a **double-click on the name** renames it in place, Enter keeps it and Escape
puts it back; the history is small type in a box that scrolls; late reads
**Late**, **Late 1 w**, **Late 2 w** with the date after; and **Group by** sits
on the far right of the views row — Owner, Status, Due date or None — and your
browser remembers the last one you chose. **Collaborators are gone** as you
said: no *With*, no second name on a row, the column dropped, and one rule for
who may change an action — its owner or the client's Super user.

**And adding is silent.** Enter puts the line under you at once, the counts
move, the box is empty and still under the cursor; nothing reloads. Every other
press on a row works the same way. If the server refuses, the reason is in the
red bar and what you typed is still in the box.

**Checked:** 164 assertions on a real database, the last thirty pressed in a
real browser and read back from the database after every press, with a mark
planted on the page to prove nothing reloaded; red under five deliberate
breaks; the modules check green; the frozen product untouched.

**Still yours:** the module still has to be turned on per client
from the client's card. Notes (meeting minutes) is spec 055, built above.

---

### Earlier the same day: **§356 — the Internal Tracker is built (spec 054).**

**Built and merged to `main`.** The Internal Tracker is
a module a client can be given, like Insights: the office opens it from the
switcher, and it is the weekly list you asked for — This week (late lines
first, carried counts on them), All, Mine and Undated, one strip of counts on
top, a search box, and the next empty line at the bottom. You type a line and
press Enter; it lands under you. Every change is on the row: the tick, the
date, the status, and the title opens the row for its notes, who else is on
it, the owner, the history and Delete. There is no Save button anywhere.

**Only the office can open it**, checked at the server and not only by hiding
the entry; a client's own person is told so with the way back. An action can
be owned only by somebody on the office's seats for that client. The week is
Sunday to Thursday. Being late and "carried N weeks" count from the first date
a line was ever given, so postponing does not reset the count.

**One thing the checks found in my own rule, fixed before you saw it**: the
spec had said a line with no date is never on This week. The line you have just
typed has no date, so it vanished from the page on the reload — the sheet never
did that. A line with no date is on This week now until it is given one.

**Checked:** 124 assertions on a real database, the last twenty pressed in a
real browser and read back from the database after every press; red under all
three deliberate breaks; the modules and Insights checks green. The offline
product is untouched. The mockup you signed off is the record of the look.

**Still yours:** the module has to be turned on per client from
the client's card, like Insights. Notes (meeting minutes) is next and has no
spec yet.

---

### Earlier: **§336 — the capability's owner, and the merge.**

**You were right, and it turned out to be already built.** You asked for a
capability to have an owner and a custodian like a unit, then corrected it: the
function owns the capability, and the function's owner and custodian handle
both. That second version needed nothing new. I tested it by taking one person
and giving them one seat at a time: with no seat the capability is not even in
their list; made the function's head, it is; made its custodian instead, it is
— and giving that role editing rights on its own function opens the function's
plan and its capabilities' plans together.

**So nothing was built for it, and that is the answer.** Two new columns on the
Capabilities page would have been a second place to say who owns a capability,
which is how two screens end up disagreeing. The Head column already shown
there, and the line saying a custodian is named after the function and never
after a capability, are both simply true.

**One real fault came out of the testing, and I have not fixed it.** A
capability's reporting page asks the wrong permission column — it looks for the
business unit's instead of the function's. On the worked example, Yara Kamal
heads Marketing, which holds Product Mindset: the rule says she may report, the
page says she may not, and she is still offered the *Submit to the SMO* button
on a report she cannot fill in. It is one line. It changes who may report, so I
am asking before I write it rather than slipping it into this round.

**And a tidy-up before the merge:** one function was written out twice in the
sources with two different bodies, which is the same shape that once left every
capability unreachable for everybody. The product was running the right one —
measured, not assumed — and the spare is gone.

**The merge is done.** `main` had moved four rounds under this work (the four
modules, the consulting memory, setting a client up from the outside, archiving
a client), so this branch's section numbers moved up by four first, then the
merge, then the built file was made again from the merged sources rather than
merged. Two of the checks needed attention: one of `main`'s own was asking a
new client to arrive with ten business units, which `main` itself stopped doing
when the set-up flow landed — rewritten to what `main` decided, a client born
empty. The other is `main`'s and stays `main`'s: it looks for a function name
that is not in the file, fails the same way on `main`, and repairing it means
deciding a layout question on a screen I did not design.

**What is waiting on you:** the reporting fault above, the three decisions you
asked me to hold, and — still paused at your word — the plan builder's
capability step and renaming a function's Head to Owner.

**Checked:** every page as every one of the 33 people, no errors; 633 permission
tests; the change list; the round trip, the clean slate and two tabs on fresh
databases; the new platform's own suite, with its shell check now at 72 of 72.

---

### Earlier: **§334 — a capability is a strategic entry of its own.**

You answered the four questions on the mockup and said *"shall we proceed?"*,
so this is stage 2 built to those answers.

**A capability is now a place you go to, not a band on somebody else's page.**
It sits in the navigation beside Units and Functions — the switch has three
sides where a tenant has one — and it has the same three pages a supporting
function has: its plan, its performance and its reporting. It is planned either
way, in pillars or in overview and projects, so the shape belongs to the
capability rather than to the function holding it.

**Where it gets its permissions from is the function that holds it.** That is
one line in the shared rules, and it is why Roles & access needs no new column
and nobody's access changes.

**It reports on its own.** It has a row on the cycle board, its own Submit, and
its Reporting tab says when a report is owed — so you can see whether it has
reported without opening it.

**Two doors to create one, and they are the same act.** Setup › Capabilities is
its home, and the function's own Projects page has a control that promotes some
of its projects into one. The panel tells you the new codes before you press,
because a project's code says where it lives and moving it changes that on
every screen.

**The demo keeps exactly one.** *Product Mindset*, held by Marketing, planned
in overview and projects — the one you left to me. It keeps its name, its
definition, its project and every number: nothing was re-made.

**Four things were live and doing nothing, and driving the pages is what found
them.** None of them made an error appear anywhere.

- **The button to remove a project did nothing at all** on a function's own
  projects, and clicking a project in the side list did not move to it. The
  same blind spot meant a function's archived plan said *cannot be restored*
  for a function still on the platform.
- **A project owner was invisible on their own capability** — no mark, and the
  platform opened them somewhere else — and the owner of a project a function
  holds outright had no role at all, so the function was not even in their
  navigation.
- **A capability's Reporting tab said nothing while the cycle board asked it
  for a report**, and its Submit button was addressed wrongly, so a report
  would have been sent and the board would still have been asking for it.
- **A function's presentation had a navigation bar naming nothing** — thirteen
  slides between *Cover* and *Thank you* with no marks in between. It now names
  each project by its code, which is what that bar was always meant to do.

All four were introduced by the last two rounds and none has ever been on the
live platform. Every fix was proved by putting the fault back and watching the
check fail.

**What is not done:** the demo shows a capability in one of its two shapes, so
the pillars shape is exercised only by the checks. A second demo capability
would show it, and nobody asked for one.
---

### Earlier, from the module sessions: **§321, §322 and §323 — merged to `main` 2026-09-12 on
Islam's word**, from `claude/multitenant-onboarding-wizard-kvyfcc`. Three
decisions on the set-up flow §318 built: **the horizon leaves set-up** (§321 —
Islam: *"why is the horizon is in the setup? time is not relevant in the setup.
the plan we upload will need this not the setup"*, so it arrives with the plan);
**set-up happens on the outside and a client is born empty** (§322 — the flow
moved to Forefront's own page, every row still minted by the platform's own
minter, and a new client no longer arrives wearing Raya Trade's units, because
§67's *cleared* graph keeps the names and empties the content — right for a
deployment that is already this client's and wrong for one that never existed);
and **a client is archived, and only then deleted** (§323 — *"we need an option
to remove the client"*, then *"both, demo client is not removable, and the name
is Archive not put aside"*). **Most of §323 was built and had no button**:
`tenants.status` has read `'active' | 'retired'` since the table was written,
`visibleClients()` already keeps a retired client off the cards and `door.ts`
already turns its address away identically to a client that never existed — and
nothing had ever set it, while `lib/tenant-delete.ts` had no caller outside its
spike. §61's trap twice over. Delete is reachable from an archived client and
nowhere else, which is the guard rather than a second confirmation. **Four
faults were found by measuring**: the confirming button at 2.90:1 with its
dark-mode override written outside its media query (§38.4, the mockup caught
it); an archived card with no route to Settings, so Delete was unreachable
(§61); a second page painted under the first on the way back, because
`drawClients()` does not clear; and `canEdit` false for the first time in this
product's life, which drew the read-only path and found a size band that lit
under the pointer and stored nothing. **Not proved and said**: the server half
has never spoken to a database in this session, so one real round trip and one
real cascade are still owed. Checks: `client-archive` 52/0 and
`client-setup-outside` 0 failures on **both** copies of the page,
`client-card-modules` 15/0, `platform-cards` 19/0, `test-platform-rules` 60/0,
`plan-horizon` 0 failures, the frozen sweep clean, the built file byte-identical
to its sources.


---

### Earlier: §333 — the demo no longer shows a capability that is not one

Islam: *"finish the demo data yes."*

**The last round gave a supporting function its own projects, and the worked
example never showed it.** The demo still carried its eight boxes, so on the
build that shipped, Finance's Projects page still had a navy **CAPABILITY ·
Financial Infrastructure** band sitting over three projects already numbered
FIN01, FIN02, FIN03. The thing he first complained about was still on the
screen after the round that removed it. That is what this fixes.

**The eight boxes are gone.** Every one of them was a set of one function's own
projects wearing a container's name, so each one now opens into its function:
Finance, HR, Treasury, Marketing, IT, Care and the Strategy Management Office
own their projects directly. Merchandising plans a different way and is
untouched. **Nothing moved and nothing was renumbered** — every project keeps
its own number and its own code, so every figure ever reported against it still
points at the same row.

**One sentence had nowhere to go, and it answered an open question.** Marketing
was the only function carrying two boxes, so the first one's description became
Marketing's and the second's — *"Treat what we sell as a portfolio to be
shaped, not a catalogue to be carried"* — had no home. That is a strategic
intention rather than a description of what Marketing does day to day, so
**Product Mindset is the recommendation for the one real capability** the next
stage creates. Yours to confirm.

**Two real faults turned up on the way, neither of them in this change.**
Cleaning up pasted titles had quietly stopped reaching a function's projects
when the last round moved them — invisible, because the text looks fine
everywhere except in the edit box, which then opens far too tall. And one
database test had started skipping itself rather than failing, which is a green
run that measured nothing. Both fixed, both proved able to fail.

**Eleven checks were leaning on the demo carrying boxes.** They make their own
now, which is what a check about capabilities has to do from here.

**What is not done:** the demo has no capability at all today, and that is the
truth of the tenant. It gets its one real one when the next stage gives it
somewhere to live.

---

**Before that:** **§330 / §331 — two checks and one list, found by running
the app's own suite.**

Everything before this was proved on the frozen build. But **production is the
new stack now**, so the app's own fifteen checks and nine database proofs were
built and run against a real Postgres. That found three reds, and none of them
was this branch's — the files are identical to the ones on `main`, and the causes
are two earlier pieces of work, also on `main`.

**The demo's name check was looking in the wrong place.** It is the one file
standing between a real client's names and a demo shown to other clients. When
the database was reorganised, that change updated most of this file and missed
the one query that names the place directly — so the check looked in an empty
room, found no tables, and scanned nothing. Put to the test with a real name
deliberately left in the demo, it printed *"no real name survives"* and passed.
It only went red at all because it had been written with two control assertions
beside it, which is exactly what they are for. One line to fix; it now catches a
leak both ways round.

**And "which tables belong to a client" was written down in three places**, two
of them out of date. One is SQL that runs inside the database and cannot import
anything, which is why there is more than one copy at all. The result was that a
correct database was reported as broken, and one of the nine proofs died setting
itself up. The two copies that could be merged now are; the one that cannot is
guarded by a check that the two agree. A number confirms it rather than an
argument: the corrected list walks 42 client tables, which is exactly what the
plan's own data model says.

**And the whole platform was then walked on the stack that actually serves
it.** Everything up to here had been checked on the offline file, which is the
right thing to check for the offline product and is no longer the whole story:
reading the service worker off the live site shows production is running the new
platform. So the sweep was pointed at the running app, signed in at the client's
door, against a real database — 33 people, 230 pages, no errors.

One number did not match the record (it says 229), so it was accounted for
rather than quoted: a page count depends on the data as much as on the build,
and this database had been through the whole suite, which adds a demo client.
The comparison that settles it is the offline sweep, which uses fixed data and
no database: this branch 228, and `main`'s own build 228 — measured by building
`main` beside it. The branch adds no page; the extra one is the test data.

**Verified.** Nine database proofs green · five of their falsifications still
red · the app's fifteen checks green · the whole platform walked on the served
app with no errors · typecheck clean.

---

**Before it:** **§329 — the served copies are in step with the frozen
sources — built on the branch, not merged.**

`smp-app/public/` is not written by hand. Four scripts read the frozen product
and produce what the Next app serves — the shell, the stylesheets, the manifest,
the service worker — and every one of those files is committed. So a change to a
frozen source that stops there leaves production serving the old bytes, with
nothing to say so. §319 wrote that down in its own words, and §328 walked into it
one section later: deleting a dead CSS rule left the served stylesheet still
carrying it. Harmless that time, because nothing used the rule — which is why it
was deleted. It need not be harmless next time, and **production is the new stack
now**, measured rather than assumed.

It was found by running the four scripts and looking at what changed, which is a
habit rather than a method. `checks/generated-in-step.mjs` makes it a check: it
runs the real scripts and compares, works out what to compare from what git
already tracks rather than a list somebody has to remember to update, puts the
tree back exactly as it found it, and fails an automated run properly by exiting
non-zero. Proved able to fail twice, once for each kind of generator.

**Verified.** The stale stylesheet repaired · the check green · both
falsifications red and the tree restored after each.

---

**Before it:** **§328 — ten checks that had stopped checking — built on
the branch, not merged.**

Running the neighbours after the merge turned up two reds and seven harnesses
that cannot run at all; running all 152 turned up eight more checks and one file
that is not a check. **Not one of the ten was a fault in the product**, and none
was this branch's — each reproduces on a build made from `origin/main`'s own
sources. A check goes red honestly when the product breaks; these went red, or
worse stayed green, because the world moved and nothing told them.

**The tour pointed at a control that had moved** (15 red). §275 took the
Performance page's controls out of the page body and onto the tab row, and the
slides step still named the old place — so for five viewer-and-place pairs it
shaded the page and cut no hole in it. A grep would not have found it: the class
it named still exists, on a page that step never opens. The one that had really
gone survived as a stylesheet rule with no markup left, and is deleted with this.

**The history check had one good day in it** (10 red). Its log entries are
stamped 3 September and the page's default window is *today*, so it passed on
the day it was written and has been red every day since — read nine days ago as
a product fault worth recording rather than as a clock. The dates derive from
today now, so what is asserted is the relationship rather than two numbers that
agreed once.

**And seven server harnesses have not been runnable since the multi-client
split** — diagnosed, deliberately not fixed. They die three layers deep, and the
third is that identity is an email now, so making them run means giving each an
account, a seat and a session from an address: a round of its own, with a real
question in it. A first patch was written and reverted, because a change that
moves a failure without removing it is a diagnostic wearing a fix's clothes.
What ships is the record and a line in the command list, so the next person is
told before they run it rather than by a stack trace. Nothing in the product is
implicated.

**Then running all 152 found eight more checks in the same shape.** The CSP
check had been measuring a 404 page, so it had never once tested the thing it is
named after. Two stubs served the service worker as a web page, and the browser's
complaint about that landed in the check's own error listener and read as the
product throwing. One stub still expected the old answer from the chat endpoint,
which §293 changed when it made replies collect for ten minutes. One asserted
the demo banner's wording, which cannot be wrong because the whole demo mode was
deleted. One asked six Setup tables for a pen on the row, found none on the
first because §261 moved three of them into a menu, and then died rather than
reporting the other five. And two more only needed a Python package installing.
Beside them, one file in `checks/` turns out not to be a check at all — it is a
camera for taking before-and-after pictures, and a runner walking the folder
hangs on it.

**One more finding, diagnosed and not fixed:** 22 of the 152 checks print their
failures and then exit as if they had passed, so any runner reading the exit code
reports them as green whatever they say. Every one of the 22 is genuinely green
today — measured, not assumed — so this is a hazard for whoever automates the
suite rather than a failure hiding behind a tick. Fixing it is 22 files and a
round of its own.

**Verified.** `tour` 15 → 0 · `history-page` 10 → 0 · the eight re-run after
repair green by exit code · `test-authorize.js` 608/0 · `test-graph-diff.js` 136/0 ·
round trip and `functional-projects` green on virgin databases · `qa.py` ERRORS
none.

---

**Before it:** **§327 — at its offset is not pinned — built on the branch,
not merged.**

Found by running the suite after the merge, and live for as long as the fill has
existed. On a unit's Plan at 1440×900 the band's flow position and its sticky
offset are the **same pixel** (168 + 22 + the pane's own 1px border = 191), and
that page has nothing to scroll — so the observer that decided *pinned* said yes
from the first frame and never said anything else. The fill painted at rest and
the card's two rounded corners read square: §130.6's complaint alive again, on
the build that section wrote to answer it.

The test is now whether the band has **left its own flow position**, which is
what the word means and needs no threshold to be guessed. A scroll listener
rather than an observer, armed once and throttled to a frame — it sets a class
and paints a corner, so v3.3's rule about sizing against a moving measurement
does not reach it. The resize listener beside it is **kept and known to be
unproven**, and its own comment says so.

**Three of the check's assertions were passing for the wrong reason** (§316.5
said so): its *pinned* block scrolls and measures, and at a window that does not
scroll it was measuring a band nothing had pinned. The scroll is asserted to have
happened first, and the never-scrolling window is a case of its own.

**Verified.** `checks/band-corner.py` all passed, **12 red** with the old test
restored from the sources; the same check on a build made from `origin/main`'s
sources fails the **identical six** it has been failing (§303). `qa.py` ERRORS
none · `no-jump`, `plan-edit-head`, `plan-edit-line`, `table-fit`,
`setup-sticky` green. Screen only: nothing stored, nothing migrated, no rule
moved.

---

**Before it:** **§326 — a function's projects are its own — built on the
branch, not merged (spec 048, stage 1).**

Islam, correcting §325.9's proposal outright: *"capability is something
Strategic ... the problem with having the capability hidden in the functional
plans is confusing for the whole structure aligned with me what you're
understanding to fix this once and for old."*

**Hiding the box was treating the symptom.** The fault is not the word on the
screen — it is that the only container the platform owned for a supporting
function's projects was called a capability, so every function that plans in
projects looked as though it held a strategic capability whether it did or not,
and a real capability had nowhere of its own to live. §325.9's mockup is
recorded as withdrawn, not overwritten; its measurement is still the evidence.

**Measured before anything was written:** six of the seven projects-format
functions carry exactly one box; the navy band is on all four of that
function's pages; the Overview says it twice; and no project code mentions it
at all — FIN01/02/03 are the function's own letters.

**What is built.** A function holds its projects directly and the box is what a
function CARRIES. The band is gone from a function's own work; its Overview is
the one a pillars function already draws (§213's decision finally true of both
sides); the deck stops calling it a capability review; the workbook still
addresses the function by name. Removing a box offers **the function itself**
as a destination — Islam's *"and vice versa"*, one more entry in a list §325's
dialog already had — and the held state he photographed cannot occur any more,
so its branch is deleted. A one-off moves every stored tenant onto the model
through **the same rule the dialog presses**.

**No schema change and no SQL migration**, proved on a real Postgres rather
than claimed: a function's plan already rides in `functions.extra`.

**Verified.** `checks/functional-projects.py` 34/0, falsified four ways from
the sources (3 / 4 / 2 / 6 red) · `scripts/test-functional-projects.js` 18/0 on
a real Postgres 16, falsified twice · `test-authorize.js` 608/0 with a new §37
asserting a function's own projects are judged as a capability's are ·
136/0 differ · round trip, clean slate, clean parity, two tabs green on virgin
databases · `capability-remove.py` 0 failures with five assertions rewritten,
never loosened · eleven neighbouring checks green.

**Merged `main` in, and the number moved.** `main` took §319 and spec 045 for
the consulting memory while this was in flight, so this branch's three sections
shift by one (§319–§325 → §324–§326, spec 045 → 046) — the precedent §287,
§301, §310, §318 and main's own §319.1 all set. The renumber ran BEFORE the
merge, which is what makes it provably scoped to this branch's own lines
(§264.3). Main changed **nothing** in the frozen product, measured rather than
assumed; the built file, `shell.js`, `sw.js`, `platform.css` and the static
carry were regenerated rather than trusted, and that was not ceremony — main's
committed `platform.css` predated §325's dialog rules and had merged cleanly
while stale.

**And the sweep line first written here was measured on the wrong bytes.** It
said *ERRORS none*, true of the build the sweep ran against and not of the
build that shipped: the sweep went first and `clearedGraph()` was corrected
after it (§105.6, with the sign reversed). Re-run, it reports **one** error,
and it is this decision arriving at a check that had not been told — `qa.py`
still counted the eight empty capability shells as part of the org's shape that
a *Clear project* must keep. The entry is **inverted, never deleted** (§218),
so the check still fails on the build before this rather than passing on both;
falsified on a build made from `origin/main`'s own sources.

**`band-corner` is 6 red and is not this branch's** — the identical six
reproduce on a build from `origin/main`'s sources (§303). It is the live defect
§316.5 named: a Plan page that does not scroll leaves the band already at its
sticky offset, so `pinWatch()` cannot tell *satisfied its offset* from
*pinned*, and the corner fill paints at rest. Recorded rather than fixed in
passing — it is a visual behaviour with its own signed-off answer.

**Waiting on Islam:** whether the worked example should dissolve its eight
containers or keep one real capability so §325's feature renders something;
stage 2 — a capability as a strategic entry beside the business units; and the
merge itself, which is his word on that merge.

---

**Before it:** **§325 — removing a capability: the box, or the box and
its work — built on `claude/inspiring-lamport-pm0ki2`.** Islam, with the
browser's own dialog open in front of him: *"when I try to remove the
capability it will remove the projects with it."* **It did** — a project lives
INSIDE a capability, and `projects.cap_id` is NOT NULL with ON DELETE CASCADE,
so the screen's splice and Postgres destroyed it independently: three projects
with their deliverables, outcomes, milestones and every figure reported against
them. **And it was the one removal in the product with no way back** — a pillar
and a project have both archived and been restorable since §232 — while being
the last destructive act still behind a *browser* dialog rather than the
platform's own.

**One word was doing two jobs**: *this box is in my way* is a move, *this work
is finished* is a delete, and the button only ever did the second. It now opens
the platform's own dialog with **two answers** — *Keep the projects*, which
moves them to the function and drops the wrapper, and *Remove everything*,
which takes them — each saying what it does, with the plan archived first
either way. The mockup was signed off before a source moved
(`design-mockups/capability-remove/`) and Islam picked that shape over two
buttons on one line.

**The box stops being drawn rather than being taken out of the data** (his
choice of two, with the cost of each stated): no schema change, no migration,
nothing moving between tables — and it is the first half of the migration
rather than something to undo, because after it every function has exactly one
wrapper. It also keeps the door open, which was his own question: hiding the
box leaves the whole model alive, so a named grouping can come back later as a
drawing decision rather than a migration.

**The codes must not move, and the first build moved them** — a project's code
is its position across the whole function (§310), so appending renumbered
`MKT01 · MKT02 · MKT03` into `MKT02 · MKT03 · MKT01`: the dialog promises in
words that the projects keep their codes, and the promise went quietly false.
Ids are never renumbered, and the second door — the Temple's own Remove, which
would have been left destroying projects — opens the same dialog.

**Verified:** `checks/capability-remove.py` **0 failures over 30 assertions**,
proved able to fail five ways from the sources (21 / 1 / 2 / 4 / 2);
`scripts/test-capability-move.js` **12/12 against a real Postgres 16**, both
ends, proved able to fail twice — with the move made a no-op the cascade eats
two projects and the save still reports success, which is the reported fault at
the storage layer. 595/0 authoriser · 136/0 differ · round trip PASS on a
virgin database · nine neighbouring checks green.

**Recorded, not done:** moving a project *into* a capability has no control in
either direction (this builds the hard half); the screen half of "the box goes";
and whether a capability can be built on the pillars or the projects method —
Islam's own question, which belongs with *Objectives & actions*.

**And before that:** **§324 — a pillar says which kind of thing it is — built
on `claude/inspiring-lamport-pm0ki2`.** Islam, of a client whose supporting
functions plan the way a business unit does: *"the capability is a strategic
concept and we need to differentiate between having a capbility as a strategic
element to focus on or it's ajust a functional obecjtives and actions"*, and of
three of his own functions, *"they are planning somehow in a capability
format."* **Nothing is invented**: a pillar has carried `kind` since the model
was written, the upload template's Pillars sheet has had a validated column for
it the whole time, and §29 turned it off at Islam's own instruction — *"it will
be brought later not now"* — writing a flag rather than deleting the call sites
so the distinction could come back. It has. **The one-character change restored
almost nothing, which is the finding**: measured on a build with the flag
flipped and nothing else changed, the mark came back in three places only (the
pen's head, the Performance rail, a column in the group's unit-card dialog),
while the Plan page, the band beside a pillar's name and the Reporting page
showed none of it — *a flag left as a door back is only a door for as long as
the rooms behind it are still there.* **Two sites needed a guard on the VALUE**
before the flag could go true, because `addPillar` mints no kind and an unsaid
one drew an empty pill and a separator pointing at nothing (§15.1). **And the
field was writable on no screen at all** — four surfaces say it and the only
way to change one was to re-upload the whole plan (§61) — so the pillar's pen
gains a **Kind** row beside its Owner, its list read from the workbook's own
`KINDS` rather than written out again (§53.5), with the blank a real option or
the first pillar anybody adds becomes silently a Direction (§35) — and clearing
it writes `""` rather than deleting the key, which is §50.6 READ rather than
recited: the default here is the empty string and not an absence, because
`addPillar` writes it and the workbook reader normalises a missing cell to the
same. It was built the other way round first; *reading the minter is what
caught it.* The group's
unit cards gain a column and it is **measured, not assumed** (§158): 888px in an
890px box at 1920/1440/1280/1100. **The server needed nothing and it is asserted
anyway** (§172) — `test-authorize.js` §36, both ends, **3 red** with `kind`
added to the classifier's omit list, and the three are the REFUSALS, the
dangerous direction. `checks/pillar-kind.py` 0 failures, proved able to fail
**five ways from the sources** (6 / 3 / 3 / 1 / 1 red), on both sides of the
navigation switch — where the function side is not a formality, being the
subject the whole piece is for. Two of the check's own faults are recorded: it
**died rather than reporting** on its first falsification run (§215) and one
assertion **could not fail**, writing the value the seed already held (§94.5).
Thirteen neighbouring checks green, and the new stack's generated `smp-app/public/shell.js` rebuilt with it — it is tracked and assembled from build.py's own script list, so a change that stopped at the frozen source would have left the Next app serving the old shell, silently (§91 by a different road); the generated worker came back byte-identical, which is §316.10 working as designed. `band-corner` is 6 red and **not this work's**, established by reproducing the
identical six on a baseline built from HEAD (§303) — the failure §316.5 already
records. **Recorded, not done** — the other four things the round settled: the
capability box goes (its own piece, because it moves live client data and wants
a rehearsal on a copy first), **Objectives & actions** as a third way a function
plans (drawn and signed off, big enough to want a written spec), **targets
broken down by category** under a pillar (drawn and signed off; it scores,
Submit waits for it, equal weight, and the mix column is an indicator that is
never scored, all his), and the pillar's description, the pillar committee and
the next-cycle focus box with its switch at cycle open.

**And before that:** **§319 — the consulting memory — merged to `main`
2026-09-11 on Islam's word**, from `claude/blissful-brown-fxlait`. Forefront's
own record of what worked, what went wrong and what was learned with a client:
a fourth tab on the platform page, open to **every** signed-in consultant with
no gate (his decision, with its cost stated — a Raya write-up is readable by
somebody who never worked on Raya), every entry **naming its client and its
author** and **nothing anywhere recording who read one**. Three phases: the
record, the **period debrief** (a prompt taken to a voice conversation, the
answer pasted back, split into drafts you read before `Save all` lands them in
**one transaction**), and an assistant over the entries that **names its
sources** and declines rather than invents. **The trap was the RLS loop**:
`schema.sql` makes every table tenant-owned *by exclusion*, so a column called
`tenant_id` would have given the memory a policy meaning *only this client's
people may read this* — the whole feature dead, with no error, and **perfect on
our deployment and broken on every fresh one**, because `schema.sql` runs once.
The column is `about_tenant_id`, which is a different fact and, more to the
point, a different failure mode: forget the exclusion list on a later memory
table and the loop's `CREATE INDEX … (tenant_id)` **fails the apply outright**
rather than quietly emptying the page. Both halves proved on a database before
the fix was written. 127 assertions over five checks, 0 failures, **all ten
falsifications red**; `check:room` 10/0, `check:deploy` 5/0, `check:shell`
61/0, `check:state` 91/0, `check:door` 49/0, `test:rules` 588/0, `tsc` clean,
`platform-cards.py` 19/0 on both copies of the page. Built as spec 044 / §318
and **renumbered at the merge**, because `main` took both while this was in
flight (the precedent §287, §301, §310 and §318 itself all set). **The words**
(*insight*, *practice · hiccup · lesson*) are placeholders, settled on use
rather than here — Islam waived the after-phase-A stop point (*"don't stop
until you need me for a decision"*).

**Before it:** **§318 — setting a client up: the wizard — built on
`claude/multitenant-onboarding-wizard-kvyfcc`.** A guided flow that shapes a
client from nothing: its name, its year, its business units, its companies, its
supporting functions and how each plans, the words it uses, and who runs the
office — ending on a summary with two doors into the plan builder and the
register. Drawn and signed off first
(`design-mockups/onboarding-wizard/2026-09-07_set-up-a-client.html`, published
as an artifact). Multi-tenancy is deliberately NOT in it — Islam is doing that
in the tenant management platform, and `main`'s own §313–§317 rebuild has since
answered it a different way — and the three shapes the platform cannot do yet
(a function planning in objectives and actions, a capability as its own
strategic entry, the single-business shape) are drawn, inert, and each says
*Later*, at his instruction. Built as §303 and **renumbered at the merge**,
because `main` took that number while this was in flight (the precedent §287,
§301 and §310 all set); spec 042 became **spec 044** for the same reason, `main`
having taken 042 for multi-client. `checks/client-setup.py` 30/0, proved able
to fail four ways; `qa.py` ERRORS none; setup-pages, setup-rail, setup-search,
setup-header, setup-overview, no-jump, table-fit, plan-builder and
people-dialog all green; 574/0 authoriser, 136/0 differ. **Merged with
`main`'s 583 commits** — the Next.js rebuild on a shared schema (spec 043,
§313–§317) — and re-run against the merged result: `client-setup` 33/0,
`qa.py` ERRORS none, the nine neighbours green, 588/0 and 136/0. Three
conflicts, all resolved by hand: `build.py`'s script list, where this branch's
`WIZARD` and `main`'s `CONTINGENCY` sit on the SAME line and taking either side
whole drops a feature with no conflict left to show for it; the progress prose;
and the built file, REBUILT from the merged sources rather than merged (§91).
`wizard.css` added to the app's hand-written stylesheet order, without which
the wizard crosses with its behaviour and none of its design. **Recorded and
NOT changed (§318.7):** a client created through the new stack's *Add a client*
keeps Raya's unit and function names with their content emptied (§67's own
decision), so the Overview's set-up door does not draw for it — the wizard is
still Setup's first entry, so nothing is unreachable, and whether a new client
should start with no units at all is Islam's &mdash; **pressing rather than
latent, because reading the live site (§91.5) showed the cutover has already
run**: production serves the generated worker and answers 404 for the frozen
file, so *Add a client* is the only way a client arrives now.

**Earlier:** **§309 and §310 — a project saved as a draft, and theirs
is the capability that leads — merged to `main` 2026-09-08 on Islam's word**,
from `claude/project-owner-reporting-access-uzze9s`, carrying `main`'s
§303–§308 in with it; built as §302 and §303 and renumbered at the merge,
because `main` took both numbers while this was in flight (the precedent §287
and §301 both set).

**§310 — theirs is the capability that leads.** Islam:
*"the porject owner should open the capability by defaut on his project."*
Measured in his shape first: a project owner whose only project sits in the
**second** of a function's two capabilities lands on somebody else's — 0
controls for him there — with his own starting 705px down and his twelve boxes
below the fold. §301.4 picked the right project inside each capability's rail
and never picked which capability leads, which also left a unit (one pillar at
a time) right and a function wrong. Three shapes were put to him with the cost
of each (`design-mockups/project-owner-capability-first/`); he took **A**: his
capability first, the rest below it, nothing hidden. **The mockup found the
cost that decides it** — reordering the stored list renamed his project
**MKT03 → MKT01** on his own screen while the deck and everybody else still
said MKT03, because a code is a POSITION — so only the drawing order moves and
the codes are asserted identical to the office's. Nothing stored, nothing
migrated, the server unchanged (574/0, 136/0), the office and the custodian
untouched, and the **Overview** deliberately keeps the tenant's order. Proved
able to fail three ways: 3 / 1 / 6 red.

**§309 — a project saved as a draft.** Islam: *"can we
make the project owner save on the project level that is similar to the save
for the submit of the whole cabaiblity."* Measured first, and the measurement
narrowed it: the capability's *Save draft* is not a save (every figure is
already written on blur and posted by the autosave) — it pushes, says so, and
**closes the report until Reopen**. A project owner already had the state on
his band and in the bar since §301, so the gap was a press that pushes and
confirms, and a freeze. Three shapes were drawn in the platform's own pixels
with each cost stated (`design-mockups/project-level-save/`); he took **B**,
and the button's word was drawn both ways before he settled it: **Save draft**,
the bar's own word for the bar's own act, leaving **Draft saved · Reopen** —
word for word what that bar shows. The mark §301 already stores per project
IS the lock, so nothing new is stored, nothing is migrated and the server is
unchanged (asserted: 574/0, 136/0). The custodian and the office are untouched
and keep every control on that project; they see the word and get no button.
4 red on the build before, one per decision.

**Before it:** **§303–§308 — the export round — merged to `main`
2026-09-07 on Islam's word**, from `claude/data-export-import-archive-ot4vl8`,
carrying `main`'s §294–§302 from five other sessions in with it. Built as
§294–§299 and **renumbered at the merge**, because `main` took those numbers
first while this was in flight — the precedent §287 and §301 both set.

**What the six are.** §303 audited the plan and progress templates against what
the platform actually holds and closed five gaps plus one found on the way — an
upload AUTHORS, so a column the file does not carry is a column the plan loses.
§304 rebuilt Import as tabs — Download · Upload · Archived plans — after Islam
turned down three tidier drawings of the old three-step page (*"we need to
rethink the page"*); the merge adds `main`'s Video storage as a fourth and takes
its name for the page, **Import & storage**. §305 downloads the review deck as a
PDF, printing the real deck rather than rebuilding it. §306 is the contingency
files: a working copy of the platform with the tenant's data baked in, the decks
beside it, and a reminder before the review day. §307 made the cycle's END the
review point, retiring a second date that could disagree with it. §308 stores
the **planning period** beside the cycle, so proration counts the plan's own
months instead of assuming January.

**One function was declared twice by the merge itself** — §305's
`openDeckTarget()` and `main`'s §295 `openDeckFor()`, the same six lines under
two names. `main`'s is kept and mine deleted by name (§24, §281).


**Before it:** **§301 — a project owner reports, and the bar said
View only — merged to `main` 2026-09-07 on Islam's word**, from
`claude/project-owner-reporting-access-uzze9s`, carrying §285–§300 from
several other sessions in with it; built as §287 and renumbered at the
merge, because main had taken §287 (the caret and the disclosure) and run
to §300 while it was in flight.

**Before it:** **§300 — a yes or a no that can be under way — merged to
`main` 2026-09-06 on Islam's word**, carrying §298 and §299 in with it from two
other sessions.

**Before it, from another session: §298 — no composer over a list of
people, and a test that says what it cannot see.** Two from Islam, both signed
off from a mockup drawn in the running platform
(`design-mockups/corner-reply-box/2026-09-05_corner-reply-box.html`). As the
office, the box under the Waiting **list** posted `say` with no recipient — the
office writing to the office — which produces all three symptoms he reported;
nothing was lost. It is no longer drawn there, and the Platform Inbox has always
behaved that way with nobody picked. And the notification diagnostic now says
what it cannot see: a browser cannot read the computer's own notification
switch, which is what silenced it in Dia while Chrome worked. Merged to `main`
2026-09-05, with §299 (Waiting and Ask) after it.

**Before it: §296 — the label, the fold, and a Setup page — merged 2026-09-05.**
The minutes label said the number the box beside it already showed; the
notification and assistant diagnostics arrive folded (his B of three drawn),
which is also why the settings panel now fits; and the Setup page's rail was a
full-width, window-tall column between 900 and 1200px — a regression from another
session's unscoped `.split` breakpoint, fixed by scoping that block away from
Setup rather than by giving Setup rules of its own, **with a unit's plan page
asserted byte-identical** so nothing was silently undone. §294 went with it: the
chat settings dropdown scrolls inside itself instead of pushing a scroll onto the
page behind it.

**Before that: §303–§308 — the export round** (see above).

**What §304 is.** Islam, of the page §303's audit was done for: *"I need a
mockup to refine this page and the buttons inside it as it's too clumsy"*, then,
of three tidier drawings of it, *"I don't like any of the options. we need to
rethink the page."* He was right, and the reason is nameable: **the page was a
tutorial — 1, 2, 3 — for something nobody does in one sitting.** You take a
file, it goes away for a week, somebody sends it back. Numbering those as
consecutive steps makes the page furniture for anyone who has done it once, and
it forced *which kind of file* to be answered twice.

Measured before anything was proposed, and it was one CSS declaration:
`.minisw { margin-left:auto }` put step 1's controls **894px along an empty
row**, at a distance that changed with the window (1180 / 860 / 680 at 1600 /
1280 / 1100). Three tabs now — **Download · Upload · Archived plans** — the mode
switch deleted rather than restyled, and the page **435px at rest against 727**.

Download is a blank template card and one **ticked, searchable list of subjects**
with **three buttons over whoever is ticked: Plans · Progress · Archives**, each
carrying its count; one subject is one workbook, several are a zip. Upload is
**two buttons**, and the file confirms the one you pressed — every workbook
opens its Read me with *"Plan workbook"* or *"Progress workbook"*, so the wrong
button is refused by name rather than read wrong. **No CSV leaves; a CSV is
still read.** Every file now names its cycle — measured, no workbook named one
at all, so two progress files taken a cycle apart were identical in their
headings.

**The builder's door moved** to the subject's own empty Plan page, where the
empty state already offered two routes: `data-buildplan` appeared exactly once
in the whole product, so taking the band off Import would have stranded spec 020
entirely. Told that, Islam said *"keep the builder"*.

**One line the whole export rests on:** `zipStore()` encoded every member with
`TextEncoder`, and a workbook through that is mangled silently — the archive
builds, downloads and refuses to open. Falsified: **0 of 19 workbooks open**
without it, with `testzip` still passing.

**Verified.** `checks/import-page.py` (1 red / 2 red on two falsifications, from
the sources) · full `qa.py` ERRORS none · `test-authorize` 527/0 ·
`test-graph-diff` 131/0 · `node --check sw.js` · eleven neighbouring checks
green. `plan-builder.py` rewritten, never loosened.

**Earlier on this branch — what §303 is.** Islam asked for a button that exports every plan at once, and
put the precondition first: *"mka esure that the plans templates for upload and
download are matching all what we have on the platform now and then let's think
how to have this download all build."* That ordering is right, and §22 is why —
an upload AUTHORS a plan, so a column the file does not carry is a column the
plan loses on a download-and-re-upload, and a bulk export built on such files is
a complete-looking archive that cannot be restored.

Measured rather than read: each subject's workbook built with the platform's own
builder, zipped, read back with its own reader, applied through the real replace
path, compared field by field. **Five gaps, and a sixth found on the way — and
every one of them is invisible on the demo data**, so the state had to be made
first. A unit's objectives lost the Weight §243 gave them, so a round trip read
the headline back at equal weight. A capability's `Hidden` was written and never
read, so a hidden objective came home counted. A project's repeat mark had no
column, which changes what happens to its figures at the next cycle. A
capability's progress upload **could not report a deliverable at all** — the
reader asked two fields §104 removed, so "In progress" became `"no"` in a field
nothing reads and the row went on saying Not started while the upload looked
accepted — and a milestone dropped the per-cent §104.10 requires while its
stored figure was written into the box the reporter fills. And a unit's progress
file had no Note column at all, so a report filed entirely by file could never
satisfy §105 and never submit; nor could it carry a tactic's outcome figure,
which §248 made the question that row is actually asked.

Nothing stored moves and nothing is migrated. `checks/template-round-trip.py`
asserts a fixed point rather than a list of columns, so a field added to the pen
turns it red until the file carries it: **19 red** on the shipped build, proved
able to fail one fix at a time. Full `qa.py` ERRORS none, 527/0 on the
authoriser, 131/0 on the differ, and round trip, clean parity, two tabs and eight
concurrent saves green on a virgin Postgres 16. Three neighbouring checks were
stale — one of them **13 red on `main`** since §268 moved the strategy pen — and
were repaired or rewritten rather than loosened (§218).

**Next, already settled with Islam:** the export-all itself — plans + progress +
archives in one zip, from the download dropdown that already holds the
templates. The one piece of new machinery is that `zipStore()` encodes its
members as text, so it must accept bytes before a zip can hold `.xlsx` files.

**Before that: §278.3 — the objectives table — merged to `main`
2026-09-04 on Islam's word**, from
`claude/seasonal-targets-monthly-proration-5clvu3`, on top of §279–§287 from
other sessions.

**What §278.3 was.** Four reports from the live product, two causes. The monthly
drawer spanned every column except the first, and a table shares a spanning
cell's width across the columns it covers — so on the objectives tables, whose
first column was the prose one, Objective went 242px → 97px the instant the
drawer opened and the row 57px → 136px. Islam's own proposal is the fix: the
drawer starts at the second column, under a new `#` column, and no column moves
at all. And `display:flex` on the target `<td>` had stopped it being a
table-cell, which cost two more things nobody had connected — the cell no longer
filled its row (his *"the target cell turned white"*) and, through the sibling
`display:block` rule, a tactic's four target boxes laid out **on top of the
Owner column** at every width (his *"the table is damged"*, measured on the
shipped build with the grid reporting a width of zero). The flex box moved
inside the cell and all three ended together. The row hover is gone at his
instruction — measured, on a striped row the stripe outranked it and it changed
nothing on every second row — and the objectives tables gained the `#` and the
drag handle a pillar's key measures have always had, with the pair centred **by
their marks** rather than by their boxes. Review page:
`design-mockups/objectives-table/2026-09-04_the-objectives-table.html`; the
reasoning is §278.3. `checks/objectives-table.py` is **24 red** on the build
before and green after, 523/0 on the authoriser, 131/0 on the differ, the full
`qa.py` sweep ERRORS none. Three checks held literals these decisions moved and
were **rewritten, not deleted** (§218) — one of which had been red on `main`
since §278 landed and was missed at that merge.

**Before it: §279 — the reporting page says where Submit is held — merged to
`main` 2026-09-04**, from `claude/smo-reporting-submission-m6gbwa`, on top of
§274–§278.2 from five other sessions; built as §274 and renumbered at the merge
because main had taken §274 through §278.2 while it was in flight.

**What §279 is.** Islam, from his own tenant: *"the reporting is not submitting
to the SMO as there is someting requires a note but I can't find it."* Every
figure was in, the plan owed nothing, and the gate was held by a single row — in
a pillar the page was not showing, since a unit's Reporting page draws one
pillar at a time. The rail was worse than silent: the pillar holding the report
up wore a **green 4/4**, because that tally counts figures *entered*. And a
capability function had no note banner at all, so its Submit was refused with
the reason on a hover and nothing on the page. From three options drawn in the
running platform he chose **C**: §272's own missing bar, brought to Reporting —
a count, one chip per place, and a **Next →** walk that opens the right pillar
and puts the cursor in the box that is owed — counting all four things that
hold Submit, with the plan's own gaps as a door to the Strategy tab. The rail
carries the mark too, and stops showing green over a pillar that owes something.
`checks/report-blockers.py` is **43 red** on the build before and **51 green**
after.

**Earlier:** §276 (the `Count` compile rule — a count is owed in whole ones)
and §277 (a reported figure follows the target's unit), merged 2026-09-04 from
`claude/integer-prorating-compilation-6dq77s`.

**§266 — the master presentation — IS ON `main`**, merged 2026-09-03 on
Islam's word (it was built as §261 and renumbered at that merge, because main
had taken §261 and everything up to §265 while it was in flight). The SMO picks
who presents and in what order from the Presentation menu, and the decks are run
end to end as one flow. Six decisions were drawn in the running platform and
answered before a line was written; the reasoning is §266 and the spec is
`specs/029-master-presentation/`.

**§266.10 — the picker is two tables, searched, and dragged by its own
numbers** — merged 2026-09-04 on Islam's word, from his own tenant with eighteen
subjects in it: a searchable *Everyone who reports* table with a **BU / FUNC**
column, a wider dialog, and a running order where **the number is the handle**
(the digit at rest, the platform's own bars the moment you point at it) with the
↑ ↓ buttons gone and the × left. Nothing underneath it moved — the stored order,
its classification and every server rule are byte for byte what §266 shipped, so
no migration. **The glitch he reported on the drawing was measured before this
was built**: with the swap driven by `:hover` alone a four-row drag swapped the
bars six times, half of them onto a row the pointer was passing, so the CSS now
holds the swap for the row in your hand. `checks/master-picker.py` is 37 red on
the build before and **51 green** after.

**§266.11 — and the dialog stopped changing size as rows move**, from his first
minutes with it: each list was sized by its own content under a cap, so a tick
made one column shorter and the other taller and the whole dialog stepped under
the pointer (measured on that build: 571, 604 and 634px across twelve moves). It
takes the height the whole list would need — both columns together, which cannot
change while it is open — measured rather than written as a constant, and capped
so *Start the flow* stays on screen.

**§266.12 — and one deck's strip is labelled, and its pills grouped**, from
what the master flow already does: a unit's own deck drew 31 blank dots on three
rows, and everything the flow's labelled strip needed a single deck already had
— every slide carries an anchor, and the anchors name the deck's parts. One pill
per section, gathered into the deck's own four blue dividers, so Mobile reads
COVER │ FOUND │ SWOT │ PILLARS MB01 MB02 MB03 MB04 │ SCORE END: 10 pills in 5
groups, 547px, one row at every width from 1920 down to 1024. Four treatments
were drawn in the real deck's bar first and three of them died by being drawn.
The master flow's own strip is unchanged and it is asserted.

**Still open on it, and said rather than discovered:** a projects function's
pills are its capabilities and not its projects, so Marketing gets four pills
with nothing to group. And a drag cannot
auto-scroll — with all eighteen in the flow the list is 654px in a 420px box, so
a drop can only land where you can already see (the keyboard route does scroll).
That is true of every sortable table in the product, so closing it means
changing `arrange.js` for all of them.
**Latest version:** **§268, §269 and §270 are ON `main`** — the strategy pen on
the section line, one edit for the whole tab, and three loose ends closed —
merged 2026-09-02 on Islam's word, verified live (production serves the merged
bytes; gate 200, api 401). **§274 is the audit of that merge**, asked for
straight afterwards: nothing in the product was damaged, and the merge did leave
three of main's own checks reading a control that had moved — two failing
loudly, one (`band-corner`) falling silent while still printing "all passed".
All three fixed; the rule earned is *grep the checks on BOTH sides of a merge,
not only before it.*

*(This line read v3.58 while the section below it ran to v3.65: a documentation
drift, flagged before it was corrected rather than quietly realigned.)*

**On the multi-client branch, not merged to `main`:** §313 (one platform, many
clients — spec 042), over v3.56, now merged with main at §278.3. Both numbers
were renumbered on that merge: main had taken §313 and `specs/024-` first while
this branch waited 452 commits for a word.

**Sign in with your EMAIL** (§313.2, spec 042): the person-key path is gone.
The first office accounts are `islam.saadany@`, `mohamed.essam@` and
`omar.alaa@forefront.consulting`, with temporary passwords the migration says
once — a change is forced at first use (§43.1, reversing §19.4).
**Direction:** rebuilding on the HR_ERP stack (§20, decided 2026-08-20).

---

**Latest merged:** **§293 — the platform collects for ten minutes, then sends
one email.** Nothing goes out while a collection fills; one email then carries
every waiting conversation, and the same rule runs the other way for a colleague
who has not come back. Presence decides nothing (his ruling); only a reply stops
it on the office's side. The existing away setting is repurposed as the
collecting time and ships at 10 — no new control. The send rides the platform's
own traffic, so no scheduler. **It supersedes §283's chase**, at Islam's
decision: `chaseDue()` and `chase_html` are gone, the column stays unread.

**Also in this round: §305 — the deck on paper.** The review deck — the one a unit
presents from — downloads as a PDF from the Presentation menu, beside Present.
It prints the real deck rather than rebuilding it, which is the whole argument:
one builder, so the file cannot drift from what the projector shows. Fit-to-
window is turned off first and put back, or the tables break in different places
from the deck that was rehearsed. No gate — what can be projected can be taken
away. Screen only: 527/0, 131/0, sweep clean. The editable `.pptx` of that deck
is Islam's *"for now"* left open.

---

## Documentation sweep, 2026-09-05

A pass over the whole platform's documentation against spec-kit. It touched no
product code **except one thing it found and Islam asked to be fixed** — see
*The one defect, and the fix* at the end. What it found and what was done:

- **§238 and §241 had no section in the decisions document at all**, while being
  referenced by number from §276, §282, §287 and §288 as though they had one.
  Both are live: the hashed CSP plus the `.vercelignore`, and the incremental
  writer. Written up, marked as recorded late.
- **The constitution contradicted the rules file.** Principle I still said
  mockup-first *"is retired"*, eleven days after Islam reinstated it and while
  every feature in that period was being settled from a published mockup.
  Corrected in both files as a reversal; constitution bumped to **1.2.0**.
- **specs/ hygiene**: a duplicate 029 (save-safety-banners → **030**), three
  specs titled with the wrong number, four saying "not built" long after they
  shipped (010, 012, 016, 017 — 016's provisional §101 was never claimed).
- **Seven backfills**, each of behaviour built across a dozen or more sections
  with no single place stating the model:

  | | | |
  |---|---|---|
  | **031** | How a figure is scored | §239, §243, §248–§251, §257, §264, §276–§278 |
  | **032** | How a save reaches the database | §195, §210, §215, §216, §234, §240, §241, §288 |
  | **033** | Reaching somebody who is not looking | §225, §231, §247, §283–§286 |
  | **034** | The review deck | §224, §236, §252–§256, §259, §265, §275, §280 |
  | **035** | Gaps, filling, and where Submit is held | §205, §214, §223, §249, §272, §279 |
  | **036** | Setup: the register, the matrix and the cycle | §116, §174, §175, §186, §187, §190, §261, §273 |
  | **037** | Authoring a plan on the screen | §189, §194, §226–§229, §232, §260, §267–§271, §281 |
  | **038** | The escaping sweep, and the net behind it | §235, §238 |
  | **039** | Reporting is a tab | §222, revisiting §63 |
  | **040** | A supporting function's report | §242 |

**Coverage: 122 → 217 of 286 decision sections named in a spec (76%), and every
feature-sized decision up to §288 now has one.**

**Corrected at the merge (§274's rule — the sweep runs again afterwards).** Main
moved 30 commits while this ran, and three of them changed what a spec said:

- **§293 supersedes §283's chase.** Spec 033 described the chase as live; it is
  gone from the product (`chaseDue()`, `chase_html` unread). Rewritten as
  *what ships now* (§293's collected email) followed by *what §283 was, and why
  its reasoning survives*.
- **§290 changed how the corner arrives**, which spec 033 described through
  §197's hidden-until-answered rule. Noted, with why that rule permitted the
  change.
- **§288 narrowed its own claim** and confirms §241's writer has been live on
  production since 2026-09-03 — which the §241 section had to hedge on, and now
  cites.

**Arrived after the sweep and not yet specified:** §289 (the bootstrap's lock
inside one transaction — spec 032's family), §292 (a row's type is a picker —
spec 031/037's), §294 (the settings panel scrolls — spec 033's). Named here
rather than left to be discovered.

**What is left, honestly.** The 67 uncovered sections are fixes and refinements,
where the decisions document is the right home and a spec would be filing for
its own sake: §10–§20 (the original handoff), §77–§86 (the table standard's
detail, under spec 012), §131–§146 (email and messaging detail, under specs 014,
022 and 027), §149–§157 (the UI audit waves), §164–§167 (the knowledge base),
§173 and §200–§209 (welcome, session and boot follow-ups), §274 and §287.

None of them is a model anybody has to reconstruct, which was the test applied
throughout: **a section gets a spec when reading it alone does not tell you how
the thing works.**

### The one defect, and the fix (§264.3)

Writing spec 031 turned up **17 comments in `config-data.js` and
`group-render.js` citing §264 for the yes/no target behaviour, which is recorded
at §257** — §264's body mentions `Y/N` nought times, against 34 in §257's. Islam
asked for it to be fixed rather than left to ride along with a later change.

**The cause ran the opposite way from the obvious guess**, which is why it is
worth recording rather than just correcting. Both features were renumbered on
their merges, and the Y/N comments had already been renumbered **correctly** to
§257. It was §264's own merge — renumbering *its* §257 → §264 with a blanket
sweep of the sources — that took main's along with its own. The arithmetic is
exact: main carried 3 + 14 such citations, the branch 1 + 8, and the merged
files hold 4 + 22. Every one of main's, none spared.

**A renumber is scoped to the lines the renumbering branch wrote** — after a
merge the sources are not all yours — **and it is silent**, because the number
it produces is a real section, so nothing parses wrong and no check can see it.

The two sets were separated twice by different methods (reading every comment;
matching each line's text against main's own §257 lines at the merge parent),
both naming the same 17. The 9 genuinely about the headline, the breakdown and
the derived score keep §264. **Nothing on any screen moves**: the built file
differs by those 17 comment lines and one §238 CSP hash, which regenerated in
the same build exactly as that section designed it to. `yn-target`,
`measure-score-spread`, `count-compile` and `unit-follows` green; 527/0 on the
authoriser, 131/0 on the differ; full `qa.py` sweep clean. `sw.js` bumped,
because the built file's bytes changed.


---

## §300 — a yes or a no that can be under way

**Merged to `main` 2026-09-06 on Islam's word.**

Islam asked whether a Y/N row that can be part-way — an agreement under
negotiation — needs a third category beside the strictly binary one. It does
not: §104 already deleted a deliverable's plan-time `kind` for the same reason,
so the plan keeps one Y/N row and the REPORTING control gains the middle answer.

- **Reporting** draws §104's own pair — a picker (*Not started · In progress ·
  Done*, the tactic's own Status words) and, only while In progress, a separate
  per-cent box stacked under it. `ynBoxes()`, one builder, on a unit's page and
  on a capability function's, which had never known about a yes/no row at all.
- **Performance** prorates the partial against the row's own window
  (`tacticShare`): 60% at half a Q2–Q3 window reads **120%**. A row that names
  no window reads as itself. **Done is 100 whenever it arrives** — Islam's call,
  with the cost stated: finishing lowers the number on a row that was ahead.
- **An In progress with no per-cent is not an answer** — not counted, marked
  *Needs a %*, and Submit waits for it.
- **Nothing stored moves.** One field, the answer written whole (`In progress
  60`); a tenant's `Yes` and `No` still score 100 and 0 and are read in the new
  words. No migration, no schema change, no workbook column. The target keeps
  `Y/N`, his choice after five alternatives were weighed.

Verified: `checks/yn-in-progress.py` **33 red** on the build before and green
after (its clipping assertion proved able to fail by narrowing the control);
`yn-target` rewritten in two places (§218) and green; `ytd-proration`,
`deck-outcome`, `measure-score-spread`, `submit-gate`, `tactic-proration`,
`count-compile`, `monthly-plan`, `fn-report-gate`, `gap-fill`,
`empty-not-missing`, `objectives-table` green; **534/0** on the authoriser with
a new section asserting the answer classifies as reporting and nothing else,
both ends; **131/0** on the differ; full `qa.py` sweep ERRORS none.

**Recorded, not done:** the progress workbook carries no column for a tactic's
outcome figure at all (§250.2), so a yes/no answer on a tactic does not
round-trip through the file; and `checks/tactic-outcome.py` is red on `main`
with 13 assertions in its plan-pen section, reproduced identically on the build
before this change and left alone.

---
## Waiting on Islam

Nothing proceeds past this line without an answer.

| # | Decision needed | Why it is blocking | Recorded |
|---|---|---|---|
| **D10** | **Sign-off on spec 043** — **answered 2026-09-09**: the isolation mechanics approved as written, the spike first, the benchmarking role and region names deferred, and one reversal of his own plan — Raya Trade's data is carried across rather than thrown away (§314.1, spec 043 §4.7, S8). | The plan and the spike are built against it. | spec 043, §314, §314.1 |
| **D8** | **What each of the ten BU names points at.** The page and the ten rows are built; the targets are empty. | Until a name points somewhere, everyone carrying it is on the register with nothing to open — and a role cannot be given from the employee file, because a role is held over the person's own BU. **IT is the one to think about: a unit and a supporting function share the name.** | §54.1 |

**Answered:**

- **D5 · Go-ahead for R2 — ANSWERED 2026-09-09: rebuild only.** *"I will
  pause the new features until we make the shift."* The single file is
  frozen; the new app replaces `smp-app/` on the branch (§314, spec 043).
- **D9 · The hide-from-presentation mockup — ANSWERED 2026-09-01: approved**,
  and built the same day as §233.

- **D7 · The companies — ANSWERED 2026-08-20: Distribution and B2C are real**,
  with Mobile / Consumer Electronics / IT and Retail Stores / Online Shop / Care
  under them. They stand alongside the units and the supporting functions as the
  client's own, and survive the clean slate (§23.4).
- **D6 · The weighting values — ANSWERED 2026-08-20: cleared too.** The factor
  model stays (the four factors, their types and their 40/30/20/10 weights); the
  per-unit figures, the written reasons and the prior cycle are gone. With
  nothing entered, every unit counts equally (§21.5).
- **D4 · The rebuild plan — ANSWERED 2026-08-20:** CSS carried **verbatim**
  (Tailwind only for genuinely new things); cutover **early, page group by page
  group**, the new app becoming the live site while un-ported screens link back
  to the frozen build.
- **D3 · The demo content in the open — ANSWERED by v2.2.** It is no longer in
  the tenant at all. It lives in the demo dataset, behind a button, labelled
  while it is on screen, and it cannot be written to the database (§21).
- **D1 · Stack — ANSWERED 2026-08-20: move to the HR_ERP stack** (Next.js,
  React, TypeScript, Prisma, NextAuth). Reverses §19's Path A. The database,
  the identity model and every recorded decision carry across; the glue is
  discarded; the offline single-file prototype stops gaining features at v2.1
  (it still takes corrections and the client's own instructions — §20, clarified).
  Recorded as §20.
- **D2 · Phase 2 as it stood** — superseded by the stack move. Its content
  (per-action writes, server-side rule enforcement, the change log) does not go
  away; it becomes part of the rebuild rather than a patch on the old stack.

---

## Agreed and specified, not built

- **The rebuild's data layer — one schema, every client
  (`specs/043-shared-schema-rebuild/spec.md`, 2026-09-09).** Reverses
  spec 042's schema-per-client, recorded as §314. Every tenant-owned table
  carries `tenant_id`; RLS with `FORCE` is the guarantee and no app-code
  filter ever is; the tenant is set per request inside a transaction on the
  direct connection; the app connects as a non-owner role; `users` and
  `people` stay two tables linked by tenant and person; `tenants.region`
  exists and routes nothing; deletion is one cascading statement plus a
  catalogue count. Raya Trade's data is carried across by a one-off
  migration proved by running it (S8); RHI and El Abd empty, the demo seeded.
  **D10 answered 2026-09-09** (§314.1): isolation approved as written, spike
  first, benchmarking role and region names deferred. `plan.md` written
  2026-09-09 (research §P1–P7 hold the plan-stage choices; 44 → 42 tables
  corrected). **§P1–P7 answered 2026-09-09** — the save enhanced to write
  only the rows a change list names (§314.2, S9). `tasks.md` and the spike
  both landed 2026-09-09: nine proofs green, each red first (§314.3). Next
  Islam's Neon run of S1 (in, §314.4), then the first screen group behind
  its mockup — built 2026-09-09 (§315, `tasks-door-landing.md`).
- **Multi-client — one door, many clients (`specs/042-multi-client/spec.md`,
  2026-08-28).** Every decision settled with Islam in session: one door, cards
  for Forefront only, **one Postgres schema per client** (§36.2), RHI and
  El Abd real and empty, an office-only page that creates a client, **email-only
  sign-in** (no person-key, `SMO` / `1234` goes), the office landing as SMO team
  and appearing on the client's register marked as Forefront, Demo data
  office-only. **The main address carries no client's name**; each client hangs
  off it under its own (`/raya-trade`, `/rhi`, `/demo`). **A Demo client** joins
  the cards, Forefront only, seeded from the Raya worked example under invented
  names and editable from then on — which **retires the Demo data button, demo
  mode and §67's Filled/Clear pair**, and reverses §21's "no invented content in
  the database" for that one client, deliberately. The first-run tour then runs
  on the client's own plan and is not offered until there is one.
  **The outer platform has its own access matrix** — §37's table one level up:
  Admin · Lead · Consultant · Observer down, My clients · Other clients ·
  Client configuration · Consultants · Creating a client · Demo across, each
  cell view / edit / nothing, and nothing at all until a role is granted.
  **The office's seats inside a client are set in that client's configuration**,
  not in its register, landing in two steps.
  Built on the live platform; `smp-app/` untouched. **Nothing implemented** — the cards page, the client name in the chrome and the
  create-a-client page are mockup-first (§1c).

## Known red, on purpose

- **`checks/report-saves.py` — 3 × "nothing threw while reporting".** Not a
  product defect and **red on `main` before this branch**, reproduced there with
  §250's changes removed: the failure is
  *"The script has an unsupported MIME type ('text/html')"* — the check's own
  stub does not serve `sw.js`, so the platform's §231.5 registration rejects and
  the page-error listener reports it. §100.3 exactly: *a stand-in that models
  less than the thing it stands in for reports a working build as broken.* Every
  other assertion in the file passes. Fix belongs in that check's stub.

- **`checks/no-jump.py` — "sorting a column" (1 JUMPED).** Real defect,
  diagnosed 2026-08-26 (§109.5): with a register row open for editing, sorting
  collapses the page 1457px → 913px (the open row keeps its class, loses its
  height) and the scroll clamps up. Pre-dates the §109 merge; needs its own
  fix in the register's sort, not a merge-widening patch. Until then this red
  is a true signal — do not silence it.

## Built and verified

### §278.2 — a mark, not a word (2026-09-04, same branch)

Islam, of what §278 shipped: *"the button montthly is big. do you suggest other
options for it's setting or placement?"*

**Measuring it reframed the complaint.** Four treatments drawn into the live
table all leave the Target box between 334 and 343px and the row at 57px — the
column had the slack, so this was never about room. It was bordered, uppercase
and bold, eight times down one column, on rows that mostly will never use it.

**He picked the 24px mark** — twelve cells, four across and three down, wearing
the eye's own 24×22 and amber lit state from two columns to its left, declared
in one CSS block with it. It is the only one of the four where *which of these
eight has a monthly plan* reads at a glance. The caret was drawn and refused:
invisible lit state, and it reads as a dropdown for the box beside it.

Cost stated: the hover is now the only thing that says what the control is, so
it says it in full and on `aria-label` too.

`checks/monthly-plan.py` 51/51 · 497/0 · 131/0 · full sweep ERRORS none · six
neighbouring checks green. **On the branch, not merged.**

### §278 — a target with a shape of its own (2026-09-03, branch `claude/seasonal-targets-monthly-proration-5clvu3`)

Islam: *"targets proration is always flat acorss the year but some targets have
seasonality so the proration is not valid so some targets needs a monthly plan
input so the calculation becomes more accurate."*

Aligned first, then drawn first: the mockup
(`design-mockups/monthly-plan/2026-09-03_monthly-plan-entry.html`) was shot from
the running plan pane and signed off before a source was touched. **The argument
is one row of his own plan** — Accessory revenue, 300M EGP, 96M reported at
June, reads 64% behind flat and 100% on plan against its own shape.

**What was built.** Twelve numbers on a row, in the target's own unit, compiled
by the row's own compile rule (Sum adds the elapsed months, Average takes their
mean, Latest takes the month being stood in). It answers at `measureDue()`, the
one seam every score, YTD column and deck benchmark already goes through, so no
surface had to be taught anything. On all four surfaces he asked for: a pillar's
key measures, a unit's and the group's key objectives, a supporting function's,
and a tactic's outcome.

**His three decisions, taken before it was built.** (a) The monthly plan becomes
the target once complete — the annual box shows the sum, read-only. (a′) His own
correction: a typed 0 is a real month and a blank box is not. (b) All four
surfaces. (c) Reporting unchanged — one YTD figure per cycle.

**Verified.** `checks/monthly-plan.py` 47/47 and **36 red** on the shipped
pre-§278 build; `test-authorize.js` 497/0 (six new, both directions);
`test-graph-diff.js` 131/0 (five new); round trip, clean parity and two tabs
green on a virgin Postgres 16, with the monthly plan written and read back on
all three shapes and its nulls intact; full `qa.py` sweep ERRORS none; twelve
neighbouring checks green.

**Two faults found by driving it rather than reading it.** The drawer's boxes
named the `plan` page for all four callers, so on Foundation they rendered as
read-only spans that looked exactly like boxes (§96). And the check's own first
falsification run died on a missing control and reported 9 failures where the
build has 36 (§215).

**On the branch, not merged.** Recorded, not done: the deck prints the seasonal
benchmark with no word saying why it is not half the year, and a monthly plan is
deliberately not a counted gap.
### §277 — a reported figure follows the target's unit (2026-09-04, branch `claude/integer-prorating-compilation-6dq77s`)

Islam, from his Performance page: *"the YTD is showing 2% from 2# I don't
know where this error is happening."* Not the arithmetic — the reporting box
stamps a typed number with the target's unit AT THAT MOMENT, and the office
later changed the target from % to #, so the figure kept its old stamp.
Reproduced on a tactic's outcome and a key measure alike.

**Built:** when the office changes a target's unit, a figure carrying exactly
the old unit is rewritten in the new one (`2%` → `2#`) with the target's own
separator; a figure typed with its own unit is left as typed (§243); the
FIRST unit is not a change (a filler's act, §201.2); Y/N is neither side
(§257). One function, both surfaces, no server change, nothing migrated.
**Cost stated and accepted:** a row already stored stays `2%` until the
figure is re-entered once on Reporting.

**Verified:** `checks/unit-follows.py` (new; **5 red** on the build before,
printing `2% / 2#` verbatim), nine neighbouring checks, `test-authorize`
491/0, full `qa.py` sweep green. **On the branch, not merged.**

### §276 — a count is owed in whole ones (2026-09-03, branch `claude/integer-prorating-compilation-6dq77s`)

Islam: *"we need a compilation type that prorate to integrs only .. if we have
a target of 2 shops to open in the year so in the 8th month that proration asks
for 1.3 stores which is not feasible."* Aligned first; **Count** as the name
and **rounded down** are both his.

**Built:**

- **A fourth compile rule, `Count`** — Sum for things finished one at a time.
  It prorates the target like Sum and rounds the due figure DOWN to a whole
  one: 2 shops owe nothing until June, one from June, two in December. At
  August his row reads **1 due, 100%** where Sum read 1.33 and 75%.
- **Not a change to Sum**, because that would move stored scores on every
  integer Sum target already planned; 0 of 122 demo rows carry Count and every
  existing row prorates exactly as before, asserted.
- **"Nothing due yet"** on the Performance page for a count with nothing owed,
  in the tactics' own not-yet-due pill; the row leaves every average and no
  `/ 0 #` benchmark is printed.
- **One list (`SMPRules.COMPILES`) where there were seven** — four pen pickers,
  the plan builder, the workbook's validation ranges and the upload's refusal
  all read it. No server change, nothing migrated.

**Verified:** `checks/count-compile.py` (new; **13 red** with the floor
taken out, **2 red** with one picker left on the old list, both from rebuilt
sources — editing the built file instead silenced the whole script block under
§238's hashed CSP); `plan-builder.py` rewritten from a literal to
agreement; `test-authorize` 491/0; eight neighbouring checks and the full
`qa.py` sweep green. **On the branch, not merged.**
### §275 — a function's Presentation button sits where a unit's does (2026-09-04, branch `claude/plans-edit-button-placement-jxw8or`)

Islam: *"can you move the presntation button for the functions to be in the same
place like what we did in the units while having the bands button as well?"* —
then **"yes"** to the mockup.

**Measuring narrowed the ask.** This was the **only** Performance page in the
product drawing its controls in the page body: a unit's, the group's, a
company's and a **pillars**-format function's all call `perfActs()`, which hangs
them on the tab row and appends the Bands menu itself. So the two halves of
"supporting function" had disagreed on this one screen since spec 010 routed the
pillars format through the unit's own page — A15 with no *why* behind it.

**The change is one line** in `renderFnPerformance()`. Screen only: no `api/`,
`lib/` or `db/` file touched, read off the diff rather than remembered.

- **The Bands half comes free and is NEW, not restored** — that page has printed
  *Off track* pills since it was built with nowhere to learn what they mean.
- **One row comes back**: capability band y 300 → 237.
- **The controls land on x 1206 / 1372 — a unit's pixels exactly.**
- **Nobody's rights move**: the menu is asked of `SMPRules.mayDownloadPlan()`,
  of somebody it refuses as well as somebody it allows.
- **The group and a company still carry no Presentation button**, outside the
  ask, untouched and asserted as an absence.

**Fit measured, not assumed** (§158): one line at 1920 / 1500 / 1280 / 1100 /
1000 / 900 / 820 / 768, no overflow, no sideways scroll, 151px still clear at
the narrowest.

Green: `fn-perf-controls` (new, **16 red** on the build before), `perf-line`,
`fn-pillars`, `scoring-bands`, `hide-slide`, `setup-header`, and the full
`qa.py` sweep. `report-chrome`'s one failure reproduces byte-for-byte on main
(§274's list) and is not this change's.

**§275.1 — one of the new check's own assertions could not fail as written**: it
measured the content's start off `panel.firstElementChild`, and before the change
the `.pageact` div WAS that child, so it went green on the reverted build
(§113.8). It measures the capability band now and fails at (224, 181).

Mockup: `design-mockups/fn-performance-controls/2026-09-04_presentation-on-the-tab-row.html`

### §274 — the audit of the §268–§270 merge (2026-09-03, branch `claude/plans-edit-button-placement-jxw8or`)

Islam, straight after the merge: *"did we change or damage something on this
merge from the previous changes?"*

**Nothing in the product.** Every source line the merge removed is one this
branch removed deliberately (`editBar()`, `dlPlanBtn()` and its call, the pen's
old positions, three wrapper lines, two CSS rules); **no documentation was
lost**; of 34 page keys only three remap and only on a function target;
production serves the merged bytes (gate 200, api 401).

**Three of main's own checks were reading a control that had moved**, and the
split between them is the finding:

- `plan-tail-fold.py` (19 failed) and `one-line-titles.py` (rc=1) pressed
  `#panel .penbtn[data-page]`. They failed **loudly**. Both were **added on
  main** (§253, §267) *after* the §268 sweep ran against this branch — so the
  sweep was early rather than careless, and the rule gains a clause: **grep for
  a moved control on both sides of a merge.** Green after: 0 failed / all good.
- `band-corner.py` guarded its last assertion with *if the control is there*,
  so it ran **twice on main and none here** while printing *"all band-corner
  checks passed"*. The property was **measured, not assumed** — the corner still
  holds §268's Arrange arrows, and a click reaches them for `mobhead` and
  `own_mob` in both themes at scroll 0/300/700. The check switches to that
  viewer now and says out loud that somebody still gets the control, so it can
  never fall silent again (§113.8). Falsified: stubbed to nobody it fails twice.

**Attributed, not mine:** nine checks were already red on main (verified against
a worktree at `5cdcd1a`; `tactic-outcome` diffs line-for-line identical), and
eight more fail on both with §167.2's *`welcomeover` intercepts pointer events*.
`office-chat` was never red — it takes over four minutes and had been cut off by
the runner's 240s cap.

**Recorded and deliberately not fixed:** `tactic-outcome.py` skips its own pen
the same silent way, but fails identically on main, so it belongs to its own
pass rather than to this audit.

### §273 — editing the cycle that is running (2026-09-03, branch `claude/cycle-name-date-edit-ze49d0`)

Islam: *"allow me to edit the cycle name. give me an edit button the cycle to
edit the date as you already built and the cycel name edit as well"* — then, of
two shapes drawn in the real page: *"keep the close cycle inside the edit. as
it's a critical button to click, the pen should hold everything editable so
it's kept secured."*

**What was wrong.** A cycle's name and its three dates are written once, when
it is opened (§47.8), and were plain text ever after — so a typo in *H1 2026*,
or a due date that moved, could only be corrected by CLOSING the cycle and
opening another, which archives and clears every figure in the tenant (§49.1).

**What is there now.** One **Edit** on the cycle strip, and nothing else: Close
the cycle moved inside it and the review-point picker went with it, so while a
cycle runs that line carries no control that can be pressed by accident. The
pen is the *Open a new cycle* panel's own shape — Name · Covers from · to ·
Reports due · Reporting as of — with Save and Cancel at one end of its act row
and Close the cycle at the other. Nothing reaches the cycle until Save; Cancel
writes nothing. While anything is unsaved **Close is held and says why**, asked
again at press time rather than trusted from the render.

**What it does not touch.** No figure, no score, no report state. Nothing new
is stored and nothing is migrated: those five values were already there, and
the server has always treated them as the office's (§234) — what is new is that
until today nothing in the product could send one.

**Verified.** `checks/cycle-edit.py` **46 red** on the build before and 47
green after, re-falsified after every correction; full `qa.py` sweep ERRORS
none; 496/0 authoriser (five new, both ways); 126/0 differ; `ytd-proration`,
`repeat-project`, `cycle-board`, `setup-overview`, `setup-header`, `table-fit`,
`safety-banners`, `submit-gate` and `gap-fill` green; the pen's two new inks
measured with the sweep's own function (5.31 light / 5.96 dark) and the probe
proved able to see them. Mockup:
`design-mockups/cycle-name-date-edit/2026-09-03_edit-the-cycle.html`.

**Merged to `main` and live** (§273 · §273.1 · §273.2 · §273.3).

### §273.4 — the pen closes itself, and the banner is two columns (2026-09-04, same branch)

Islam, using what §273 shipped: *"when I'm editing why is the edit button still
there it should turn into done editing so I clik it and thebox collapse saving
what I did rather tahn having a save and candel buttons inside the box itself
rearrange th e buttons and think of different structures of this banner"* —
then, having asked to see **both states** of each, *"C"*.

**What was wrong.** He is describing the platform's own editing model, and §273
had invented a second one. Every pen in SMP is `penBtn()` — Edit ⇄ **Done
editing** — over fields bound through `FIELDS` that write on blur (§35); there
is no Save and no Cancel anywhere else in the product, because there is nothing
for them to do. §273 built a DRAFT, and a draft is what forces a Save (to commit
it), a Cancel (to throw it away) and a guard on Close (because the draft and the
cycle can disagree).

**What is there now.** The draft is gone and the three controls with it. Edit is
a toggle that reads **Done editing** and lights up while the pen is open. The pen
is two columns: the five facts on the left under *This cycle*, **Close the cycle**
alone on the right behind a rule under *Ending it*, with one line saying what it
does — so the destructive act never shares a reading column with the boxes you
type in, which keeps §273's security argument and sharpens it. It stacks below
1100px. An empty name is still refused, and the refusal is now **the stored name
coming back into the box** (§124), because there is no press left to refuse at;
a name with space around it is trimmed rather than refused.

**What it does not touch.** Nothing server-side moves — these five fields already
classified as `cycle` — and it is asserted (514/0).

**Verified.** `checks/cycle-edit.py` **37 red** on the build before, **69 green**
after; §2, §4 and §5 rewritten rather than deleted (§218). Three of the check's
own first failures were one fault: Edit is a TOGGLE now, so a section pressing it
blind shuts the pen a previous section left open. Mockup:
`design-mockups/cycle-name-date-edit/2026-09-03_editing-strip-structures.html`.

### §287 — the caret belongs to the disclosure, not to the class (2026-09-04)

Islam, of the closed Reporting cycle strip: *"what is the arrow function here
beside the open new cycle?"*

**It has none.** The little `▸` was styled by a rule written for a panel
elsewhere that folds open and shut. That rule was not scoped, so the arrow was
drawn on every strip sharing the class — including two that are not foldable at
all: Setup › Reporting cycle and the group's Focus board strip. Both showed a
fold marker for a fold that does not exist; pressing it did nothing.

**Scoped to the thing that folds.** The focus panel keeps its arrow and its
turn; the two plain strips lose one that was never theirs. A duplicate copy of
the same styling rule, thirty lines above, went with it.

**The first attempt was wrong and the check caught it** — it took the arrow off
the panel too, because the panel's head *is* its own summary rather than sitting
inside one. Fixed and re-measured.

**Verified.** `checks/fold-caret.py` proved able to fail **both ways**: 3 red
against the shipped build with the stray arrow, 3 red against the first attempt
with the arrow gone from the panel. `cycle-edit`, `perf-line` and `setup-header`
green; full `qa.py` sweep clean.

**Merged to `main`** on Islam's word, after merging main's §279–§281 into the
branch. Mine was renumbered §279 → §287 — main took the number while this was
being built, and §287 rather than §282 deliberately: §282–§286 came off main
with the chat-round revert but still live on their own branch, so a gap here is
harmless where a collision would not be. The caret rule was asserted to have
SURVIVED the merge (main still carried the unscoped selector, so a silent revert
would have looked identical to a clean merge), the sources were grep'd for
duplicate declarations — none, main's own §281 having swept them — the built
file was rebuilt rather than merged, and `sw.js` bumped past a name main had
already served.

### §273.5 — "Open a new cycle" drew nothing, on `main` (2026-09-04, same branch)

Found while re-running the neighbours: `checks/repeat-project.py` hung for
thirty seconds on `#nc-name`, and the fault **reproduced on the shipped build
before a line was written**. §261.2 replaced `renderCycle()`'s
`NEWCYCLE ? … : CYCLEEDIT ? …` chain with a `CYCLEEDIT`-only branch and took the
NEWCYCLE arm with it — so pressing *Open a new cycle…* sets the draft and
**renders nothing at all**, on the only way to start a cycle. §96 in the worst
place: the state it writes is correct, so every assertion short of asking whether
a PANEL was DRAWN passes.

Put back **verbatim**, not rebuilt on §273.4's `cycleField()` — this panel is
wired by ID in the shell and writes on `input` rather than `change` for a stated
reason, so re-expressing it would be a second change riding a restoration.
`cycle-edit.py` gains §5c, asserting the draft and the panel separately.

**Recorded, not done (§273.6).** Found by looking at the built pen: with no
review point picked — the demo's state, and a legitimate one — the strip reads
*"taken from the cycle's end"* and the month control inside the pen reads a red
**MISSING**. §239.3 settled that a working fallback must not cry Missing and
settled it for the STRIP only; the pen calls `monthBtnHtml()` directly, where
*Missing* is correct for the OTHER panel (opening a cycle refuses without a
month). The fix is a per-caller word, which is a wording decision. It predates
§273.4 and is left alone rather than changed on the way past.

**Merged to `main`** — §273.4, §273.5 and §273.6 together, on Islam's word,
after merging main's §274–§278.2 from five other sessions into the branch:
the three source files both sides touched auto-merged and were grep'd for
duplicate declarations (§56.7), the built file was rebuilt rather than merged
(§91), and `sw.js` bumped past a name main had already served (§94.12, §94.16).
520/0 authoriser and 131/0 differ after the merge, with main's own
`unit-follows`, `count-compile`, `monthly-plan`, `fn-perf-controls` and
`master-picker` green beside the cycle's three (§273.7).
### §263 — a saved draft can be submitted where it stands (2026-09-03, branch `claude/draft-save-smo-submit-8ew3n3`)

Islam, using the reporting page: *"in the reporting on saving the draft keep
the submit to smo button there as it's posible to save the draft and if it's
complete we can submit directly rather than reopen to submit."* Drawn in the
real bar first and published as an artifact (rule 1c); he picked **C**, the
variation that also gives Reopen back its quiet voice.

**Built:**

- **Submit stays on the bar while a draft is saved.** §220 built it as one
  either/or — `subd || parked` drew the state word and Reopen, everything else
  drew Submit — so the control disappeared at the moment somebody looks for it
  and sending a finished draft took three presses.
- **The report itself is unchanged and still locked** until Reopen. Measured
  on the built file: `editable 0 of 25` before and after.
- **One Submit button, written out once** (§53.5): §221's gate cannot differ
  between the open bar and the parked one, and the check asserts the pair —
  the button is back AND it is still shut while figures or plan items are owed.
- **Reopen drops its box** where Submit is beside it, taking the quiet orange
  type Save draft wears while the report is open. One declaration, two
  selectors; the class stays `rc-reopen` so one handler answers for both states.

**Cost, stated before he chose:** the bar rides the tab row, so it goes
494 → 659px (against 577px for the open bar). Nothing moves at 1440 or 1280;
below about 1000px the draft bar becomes the widest state of the page where
today it is the narrowest. Asserted at 1500 and 1280 rather than remembered.

**Checked:** `submit-gate.py` all green and **11 red** on the shipped
pre-§263 build — its first falsification run *died rather than reporting*
(§215), so every press in the new section degrades now. One assertion reversed
and rewritten rather than deleted (§218). `perf-line`, `table-fit` green;
`test-authorize` 491/0, `test-graph-diff` 126/0 (nothing server-side moved).
`report-saves.py` is red on the untouched build for the stub-without-a-worker
fault §250.2 records — reproduced before this change and not touched by it.

**Merged to `main`** on Islam's word, 2026-09-03.


### §259 — the group's mark, and four blue section dividers (2026-09-03, branch `claude/deck-separators-brand`)

Islam, in one message: *"where can I upload the raya trade mark so it can be
used? then work on separators let's make teh serparators blue background like
the client brand colors"* — then four sections by number. Both halves were
drawn in the real deck and published as one artifact before a source was
touched (rule 1c); two of his four answers are choices between treatments that
only existed because they were drawn.

**Built:**

- **Four dividers on `--panel`** — Foundation (new), SWOT (recoloured),
  Strategic pillars (new), Overall performance (new). The blue is the token
  Setup › Branding's *Navigation bar* control sets, so a divider follows a
  tenant who rebrands; the check proves it by rebranding one mid-run rather
  than by naming a hex.
- **The SWOT divider's four hues become one rule** — measured, not preferred:
  2.55 / 2.26 / 3.49 against the blue, and *Opportunities* was `--panel` on
  `--panel`. The four category slides keep their colours.
- **No footer mark on a divider**, his word — and it removes a real fault, the
  plate that keeps a navy lockup readable being switched on by the page being
  dark, which a blue divider on a light page is not.
- **The pillars roll-call stays white** (his, reversing my recommendation) and
  **the closing divider carries no numbers** (his, agreeing with it).
- **A group mark on Setup › Branding** — one upload, the same intake as a
  unit's, `deckMark()` the one reader, no migration, the key deleted on Remove,
  classified `setup` and named so a refusal says Branding. A supporting
  function's deck wears a mark for the first time.
- The knowledge base's branding answer, wrong since the page was written.

**Verified:** `checks/deck-dividers.py` 22 red on the previous build and green
after (every probe degrades — its first two runs there died rather than
reporting); `test-authorize.js` 489/0 with the new rule falsified; full `qa.py`
sweep ERRORS none; nine neighbouring deck checks green.

**Waiting on Islam:** the Raya Trade PNG is rendered and in the repo at
`clients/raya-trade/brand/raya-trade-group-mark.png` — he uploads it on
Setup › Branding once this is merged. Whether the deck cover, Thank you and the
four per-pillar covers should also go blue is asked and deliberately not done.
### §252.2 — the plan download, in the menu and the office's (2026-09-02, same branch)

Islam, in the same breath as the merge: *"the ppt download leave it as an
option in the drop down for the smo only."*

§145.9 hid the pane-corner button for everyone in August and kept the machinery,
saying giving it back was one line. It comes back **somewhere else**: an entry
in the **Presentation** menu, beside *Present* and *Manage slides* — three
deck-shaped things in one place, rather than a fourth control in a pane corner
that already holds the pen, the arrows and the fill button.

**For the office alone**, which reverses §117's audience (the office plus a
unit's owner and custodian and a function's head) at his instruction, and is
recorded as a reversal rather than written over. Reordering is untouched — still
the custodian's and the owner's (§101). The corner button, its page map and the
`editBar` term are **deleted rather than left returning ""** (§24).

Green: `strategy-split` ALL OK (rewritten around the new placement, both ends
per person), `test-authorize` 474/0 with the three reversed assertions
**rewritten, not deleted** (§218), `deck-outcome` 0 failed, `plan-fields`,
`perf-line`, and the full `qa.py` sweep.

### §254.7–.12 — the deck round, finished (2026-09-02, same branch)

Four more from the running deck, on top of the eight before them.

- **§254.7** — a unit written twice *with or without a gap*. His `40 %%`
  survived §254.1's collapse, which split the unit on whitespace. **And it
  caught a regression of my own**: §254.1 added a space to any unit it did not
  recognise, so `40%%` became `40 %%` — made worse by the tidier.
- **§254.8 / §254.12** — the pillar cards size themselves AND fill the slide
  rather than one row of it. Up to three in a row, above that `ceil(sqrt(n))`,
  so *"4 can form a box"* is 2×2 and five goes 264px → 445px. Vertical sizes
  follow the rows, horizontal ones the columns; swept 1 to 10, nothing
  overflows.
- **§254.9** — the aspiration runs the width, *This year* comes first, and the
  objectives table grows. **10 of 10 aim slides were on the generic 19px floor;
  none are now.**
- **§254.10 / .11** — two numbers not four, with the reading put back before it
  was obeyed; the sentence explaining Execution stays.

**Verified:** `deck-figures` **11 red** on the build before; that check plus
`deck-blank-slides`, `notes-slide`, `slide-move`, `deck-outcome`,
`deck-and-weights`, `ytd-proration`, `tactic-proration`, `table-fit`,
`submit-gate` green, **and main's own three new checks** (`hide-slide` 42/0,
`reported-note` 0 failed, `hide-slide-mockup`) green on the merged build.

### §254 — a figure is read against what it is measured by (2026-09-02, same branch)

Eight things Islam sent from the live deck in one afternoon, all mocked up from
the running deck first (`design-mockups/deck-review-round/`) and six built.

- **The benchmark, and the column that names it** — *Annual target*, and what
  is due so far beside every figure, on a unit's objectives, a pillar's
  measures and a capability's objectives. Nothing new computed; one builder.
- **§254.1** — a scaled currency reads as one token wherever it is drawn
  (`8M EGP`), display only, and the doubled unit healed on reporting and save.
- **§254.2** — one question decides the whole row, narrowing §248 at his
  direction: a tactic whose outcome has a target says it is owed a figure.
  0 of 78 demo tactics are in that state, so nothing in the demo moves.
- **§254.3** — a not-due tactic is not dimmed.
- **§254.4 / §254.5** — the pillars are named before they are scored, and the
  deck ends on the score table then the three readings.

**Verified:** `checks/deck-figures.py` **33 red** on the build before, green
after; `deck-blank-slides`, `notes-slide`, `deck-outcome`, `deck-and-weights`,
`ytd-proration`, `tactic-proration`, `slide-move`, `cycle-board`, `table-fit`,
`project-tables`, `submit-gate`, `gap-fill`, `fn-pillars`, `fn-report-gate`,
`hide-element` green. Three checks held literals these decisions moved and were
rewritten rather than loosened. `report-saves` is the known-red-on-main stub
fault (§250.2).

**Waiting on Islam:** `K EGP` on the offered unit list; the deck marks (a
supporting function can never have one, and there is no group mark to fall back
on); whether the notes slide keeps the last word before Thank you.

### §253 — a table with no rows is not a slide (2026-09-02, branch `claude/merchandizing-slides-blank-mxcjfj`)

Islam: *"slides are showing blank pages for the merchandizing."* Measured
before anything was proposed: **four** slides in the whole product draw a
heading, a column strip and a whole empty page, and **all four are
Merchandising** — its own deck's two objectives slides (a function judged by
its pillars legitimately carries none, §214.2) and Retail's **RS04**, the
pillar carried by that function, which printed **93% / 60% / 61%** over
nothing at all.

`deckSlidesFn` has guarded its objectives slide since it was written, which is
why **Marketing** has always been right; the unit deck, which a pillars
function goes through since §224, had no such guard (§53.5). Islam ruled it
for **any** subject, reversing the narrower rule recommended to him.

- **§253.1** — the headline slide drops the objectives cell for any subject
  with none. No new CSS: `.headgrid` without `.three` is the shape it wore
  before §243. Settled from a mockup made of the real deck, which earned its
  place by exposing a footnote that would have gone on explaining a number no
  longer on the slide.
- **§253.2** — the Retail → Merchandising pointer is cut at his instruction.
  The **feature** is untouched; the demo no longer *shows* a carried pillar, so
  spec 010 is described and not visible. Measured across every unit: Retail
  execution 102→104, planned 57→56, RS04's three figures to three dashes,
  nothing else moves.
- **§253.3** — *"the manage presentation show this"*: Manage slides on a
  pillars function, bar drawn, rail and stage empty. §224's fault on two more
  surfaces. `deckHtmlFor()` is the one reader now, asked by Present, Manage
  slides and the anchors; `openDeckFn()` on a pillars function goes **2 → 13**,
  and the capability deck is asserted unchanged. The editor's silent failure
  was given a voice in the same change. **Not claimed**: the demo's pre-fix
  editor draws two slides and his screenshot shows none, so whether the prefix
  branch is exactly what emptied his rail cannot be proved from here.

**Verified:** `checks/deck-blank-slides.py` **14 red** on the build before, all
green after; `notes-slide`, `deck-outcome`, `deck-and-weights`,
`ytd-proration`, `cycle-board`, `table-fit`, `project-tables`, `slide-move`,
`gap-fill`, `submit-gate`, `fn-pillars` green; every unit's five scores read
before and after. `report-saves` is the known-red-on-main stub fault (§250.2),
reproduced on the pre-change build.

**Open, and next:** three from the live deck, taken as their own piece — the
deck's measures table shows no prorated benchmark where Performance does, a
doubled unit (`8 M EGP M EGP`), and a not-due tactic row that is dimmed as
well as labelled.

### §252 — the presentation reads what was reported (2026-09-02, branch `claude/presentations-plan-performance-update-7a94p2`)

Islam: *"presentations doesn't change when the plan performance is done"*, and
then *"the presentation should update on either save draft or submit."* **The
fix he proposed would have changed nothing** — `openDeck()` calls
`deckSlides()` on the press, so a deck is assembled fresh every time it opens
(§51.8) and there is nothing stale for a refresh to clear. **This closes
§250.2**, which the branch beside this one recorded as not done.

**The fault is five readers still looking in the old box.** §248 puts a
tactic's outcome figure in `outActual`. Measured on Mobile before anything was
written:

| | Performance says | The slide said |
|---|---|---|
| a tactic reported through its outcome | `4# / 3 #` · `133%` | `— / 50%` · `—` |

…under a heading on that same slide already reading **`Delivered 98%`** — a
number that counts the row its own table was calling empty. Beside it:
`reportedCount` went **41 of 41 → 40 of 41**, so **Submit refused a finished
report** with *"1 figure still to enter"*; the note rule could not see an
outcome at all; the cycle board's tactics column under-counted; and on
Performance the row was dimmed as unreported next to its own printed figure.

**One expression, named once.** `onOutcome(t) ? tacticReads(t) : tacticRatio(t)`
existed inline in the Performance pane and nowhere else — it is
`tacticProgress()` now, with `rowAnswered()` beside it answering *has this row
been answered* for every kind of row (§53.5). The ternary it replaces in
`reportedCount` had the same expression in both branches.

**The slide's shape is Islam's**, picked from three drawn options shot out of
the real deck (`design-mockups/tactic-outcome-slide/`, published as an artifact
for sign-off): the **outcome takes a column of its own**, as on Performance.
Cost measured before he chose: Mobile's deck **24 → 27 slides**, every extra one
a continuation the deck already makes. Two headings take Performance's words
(*YTD actual* · *Progress*, §239.2), a row owed a figure says **"Not reported ·
due at …"** instead of the em-dash that means *nothing to report*, and a tactic
with no outcome is byte-for-byte what it was.

**Recorded, not done:** the `.pptx` plan download still has no outcome column
(its own mockup), and a deck already open on a projector does not redraw
mid-presentation — put to Islam and deliberately left.

Green: `deck-outcome` (**19 red on the shipped file**, 0 after — and its own
first run died rather than reported, §215), `tactic-proration` (33),
`tactic-outcome` (47), `ytd-proration`, `submit-gate`, `cycle-board`,
`notes-slide`, `project-tables`, `setup-overview`, `gap-fill`, the full `qa.py`
sweep (ERRORS none), `test-authorize` 472/0, `test-graph-diff` 126/0.

### §251 — the unit is there before the number is (2026-09-02, branch `claude/measure-unit-edit-7klw9y`)

Islam, from his own plan with the pen open: *"In the edit I can't set the unit
for a measure."* Two of his four Key measures had no target yet, and the unit
has no field of its own — it lives inside the target string (§199) — so a row
with no target had nowhere to keep one and the column drew an em-dash. The
target holds the unit ALONE until a number joins it, which is §248's own answer
for a tactic's outcome; that section's explicit carve-out for the measures
column is reversed here at his instruction.

**Mockup first (rule 1c), published as an artifact**, built from his own four
rows in the platform's own tokens — never the demo tenant's names (§244) —
because the question he asked was WHERE. He answered **"all 4 places"**: a
pillar's Key measures, a unit's Overview objectives, the group's Foundation, and
a supporting function's Overview on both formats.

**The one cost was stated before it was built and he was told it is not
optional:** a target holding only a unit is unusable, so `target`/`target3y`
join `GAP_NUM` — screen and server through the shared module — and the row goes
on saying **Missing**. Measured: 208 non-blank targets in the shipped plan, 0
non-numeric, so nothing in the demo moves; with the rule removed the count falls
46 → 45 the instant a unit is picked. **Fill mode is deliberately unchanged**
(§201.2) and asserted, one line to open when he asks.

Nothing stored that was not stored before, no migration, no score moves.
`checks/unit-before-number.py` drives all four surfaces through the real
controls and reads the plan back — proved able to fail twice (16 red with the
em-dash put back, 6 red with the numeric rule removed). `objective-unit`,
`tactic-outcome`, `gap-fill`, `submit-gate`, `fn-pillars`, `fn-ko-edit`,
`table-fit`, `plan-fields`, `ytd-proration`, `project-tables`,
`deck-and-weights` green; 472/0 authoriser, 126/0 differ, full `qa.py` sweep
clean. One assertion in `fn-ko-edit.py` was REWRITTEN rather than deleted (§218).

**Not done, and recorded:** the merge to `main` is Islam's word (rule 4) — the
branch carries §251 only, and main has moved to §250 meanwhile, so the merge
needs the fetch-and-look, a rebuild, `node --check sw.js` and a SHELL name
confirmed against `origin/main` immediately before the push (§91, §94.16).


### §250 — a tactic's outcome is measured against its own window (2026-09-02, branch `claude/tactic-proration-calc-uyspmb`)

Islam: a tactic marked Q2 and Q3 "is a 6 months project from april till
september .. now we are reporting till august so the proration how should it be
calauclated? because it's different than the proration of the measurs that
prorate across the eyar." **Half of it was already true** — §239 gave the
*% delivered* column the tactic's own months, so it read **5 of 6 = 83%** — and
§248's OUTCOME still went through the YEAR's share, reading **88% for every one
of ten window shapes** at August: one number for ten periods. The share is now
supplied to the one arithmetic (`measureDue`/`measureScore`/`measureDueLabel`
take an optional share; a measure passes nothing, a tactic's outcome passes
`tacticShare(t)`), and it is an **exact fraction** — the first draft read it back
out of the rounded per cent and moved a whole-year tactic from 88% to 87%.
Islam's case: annual target 12 over Apr–Sep reads **10** at August, and 7 against
it scores **70%** where it read 88%.

**Nothing stored moves, measured not asserted:** 842–852 scores — ten units,
their pillars, every measure and tactic, all eight capabilities, the group and
both companies — read off the shipped build and this one at **six review points**
including unset, identical at every one. **Proved able to fail: 15 red** on the
shipped build, the reporting pane printing `8 # of 12 #`.

**§250.1 — and it nearly shipped a silent disaster.** `pillarPerf` mapped
`measureScore` point-free, and `Array.map` hands its callback the INDEX — so the
new optional share would have been 0, then 1, then 2 down every pillar (one
pillar **100 → not scored**, another **83 → 65**), wrong only for the `Sum` rows.
Guarded by `checks/tactic-proration.py` §2b. The probe that should have caught it
was itself blind, comparing two identical crash strings (§94.5).

**§250.2 — recorded, not done:** the review deck still ignores an outcome
entirely (`present.js` prints `t.actual` against `tacticPlanned`), measured
byte-identical before and after — §248's omission, and correcting it is a
decision about what a slide shows for a row measured in stores.

Green: `tactic-proration` (33), `ytd-proration`, `tactic-outcome` (47),
`submit-gate`, `table-fit`, `cycle-board`, `project-tables`, `plan-fields`,
`gap-fill`, `gap-walk`, `save-fidelity`, the full `qa.py` sweep (ERRORS none),
`test-authorize` 472/0, `test-graph-diff` 126/0.
### §270 — three loose ends closed (2026-09-02, same branch)

Islam, on the three things §268 and §269 had recorded and not done: *"1. make
the fix, noting that editing is only for the smo for now anyway 2. ok will see
it later 3. ok."*

**The screen and the save were asking two different questions.** For a
supporting function's plan, the save checks the *function's* Strategy setting
and the screen checked the *business unit's*. Measured: **nothing changes on
this tenant** — both settings hold the same value for every role, and editing is
the office's anyway, which is exactly why it was safe to fix now. Set them
differently, which is the whole point of having two, and **six people** would
get an Edit button that refuses to save, or be refused one that would have
worked. Fixed in the three places the browser asks, rather than at the twenty
places that ask them.

**The remove × sits beside its field again** on Who we are (6) and the SWOT
(23) — about 400px of empty height between them. The SWOT needed a column
rather than a width, which the check caught on the build that was meant to have
fixed it.

**And two automatic tests stopped crying wolf.** Neither was a real problem: one
was looking for something deliberately removed weeks ago (with another test
asserting its absence — two tests arguing), the other had a fault in its own
setup. A test that is always red is one people stop reading.

25 checks green including the two that were red, full sweep clean, server 454/0
and 126/0, build byte-identical.

*The falsification is worth keeping: with the permissions fix reverted, the
shipped data still passes all 264 person × function pairs. Only a deliberately
divergent tenant goes red — a check that walked only what is in front of it
would have blessed the broken build.*

### §269 — one edit, one done (2026-09-02, same branch)

Islam, on §268: *"the edit opens all so I don't need to edit each tab and then
save for each — it's one edit and one save?"*

**Right, and what was there was worse than three presses.** Measured first: the
edit mode was held per SECTION and is only cleared when you change tab or
destination — so opening Foundation and walking to SWOT left Foundation open
behind you with the line reading *Edit*, and opening the Plan as well gave two
open modes whose single control could close only the one you were standing on.
A control whose word is true of one section and false of the one beside it.

One press now opens every section of the Strategy tab, one press closes them
all, and the word reads the same wherever you stand — **filtered to what that
person may author**, which on a unit is the one Strategy grant (measured: its
three pages can never differ) and on a supporting function is two separate
columns. The red *Fill in what is empty* opens the same mode, so the two doors
cannot leave the tab in a state the Edit button cannot describe.

**And §268 had taken something away without noticing.** A fill-grant holder's
way out of fill mode used to be the corner control; §268 removed it as a
duplicate, and the bar only draws *Done filling* once nothing is missing — so a
custodian with gaps left could leave only by changing tab. Restored, drawn
beside *Next gap*, and asserted in both states. It surfaced as a check timing
out on a control that was no longer there, not by anybody reading the code.

`checks/plan-edit-line.py` §1b–§1d: 8 red with the behaviour broken, printing
the old fault verbatim. Twenty checks green, full `qa.py` sweep clean, server
454/0 and 126/0.

*Recorded, not fixed — both pre-existing: the screen asks the unit's Strategy
column for a supporting function's plan where the server asks the function's
(they never disagree on this tenant, and correcting it would move rights); and
the SWOT's remove × wraps onto its own line, because §114.4's fix is scoped to
table cells and those fields are list items.*

### §268 — the strategy pen lives on the section line (2026-09-02, this branch)

Islam: *"the edit button of the plans can you make it in the same line of the
foundation sowt and plan? as it's a better placement for opening and savng?
verifying that it's only in the startegy anyway and not anywhere else."*

**Checked first, and the check said more than the ask did.** With the plan open
the line ALREADY carried a control — `Done filling`, the wrong word for the
office (who are editing, not filling) and stripped of its button dress by
`.tabs button`, which is §145.14's own recorded trap on the one control it
missed. What was genuinely absent was the way IN. The pen sat at four different
heights depending on the section (234 · 233 · 236 · 308) and **twice** on a
two-project function, the second copy below the fold, both throwing one flag.
Foundation and SWOT were hover-only, so on a tablet the pen measured hidden
until the card itself was tapped — §70's own finding, fixed for the pane in
August and left on the cards.

**Islam picked A** (the red fill button stays beside the pen for the office) and
**the whole Strategy tab** from three placements drawn into the real page and
published as a mockup; the pen glyph was rejected because a 28px hollow circle
built for a card corner all but disappears in a wide tab row. **Not `Save`** —
asked, answered and recorded: the platform writes as you type, so the word would
say the work is lost until it is pressed.

**One map now answers which page a section's pen is**, read by the pen and by
the fill bar — which fixed a bug nobody had reported: a pillars function's
Overview button named `foundation` while that page has read `capfoundation`
since §213, so it set a flag nothing acts on and opened **0 editable fields**,
rendering perfectly the whole time.

**The group is untouched**, which answers the second half of the ask: within a
unit and a supporting function the pen is only on the Strategy tab, and the
group's own Foundation and Temple are tabs with no section line, so both keep
their controls. Arrange stays in the pane's corner (§101's arrows go to somebody
who may reorder and not author, so the slot is never shared), and the pillar's
pinned head keeps its code, name field and Remove.

`checks/plan-edit-line.py`: **48 red** on the build before, all green after.
Contrast 8.95/5.32 light and 8.53/9.82 dark. Full `qa.py` sweep clean, ERRORS
none. **The check sweep was most of the work** — fourteen check files and
`qa.py` pressed the moved pen and would have gone silently green (§51.11).

*Two pre-existing failures were left alone rather than quietly folded in:
`strategy-office.py` §4 and `report-saves.py` fail identically on the previous
build.*

### §236.3 — slide by slide, only the originals pinned (2026-09-01, same branch)

Islam, testing §236.2: "the slides jump from slide 9 to 13 one jump .. the added
slides can move slide by slide the prohipted slides from the movement are the
original slides." Right — §236.2 stopped the dead presses and drew its landing
places from the anchors that already existed, so the SWOT run and the pillar
dividers were still hopped four at a time. Every ORIGINAL slide is a landing
place now (unit: SWOT title, three categories, each pillar title; function:
capability cover, key objectives, project title, milestones), existing keys
unmoved so placed pictures stay put, no migration. A split table's parts stay
ONE stop — a picture cannot sit between a table and its own continuation.
`checks/slide-move.py`: 6 red pre-§236.3 (printing his jump), 20 green after;
deck-adjacent checks and full qa.py green.

### §236.2 — a picture slide can travel the whole deck (2026-09-01, same branch)

Islam, using §236's arrows: "the rearrange of slides doesn't move around the
fixed slides of the main flow." Measured: 25 dead presses of 28 on Mobile's
deck; a function's slide never moved at all. The stored position is an anchor
(§50.3) and the arrows stepped blindly one row, so a press into an unanchored
run recomputed the same position — a button doing nothing, silently. His two
decisions: the arrows now jump to the nearest real landing place, and between
a pillar's measures and tactics IS a place (each measures slide takes its own
anchor; a project's deliverables slide mirrors it on a function's deck,
§53.5). Projector honours the new places for free — one placement function.
`checks/slide-move.py`: 5 red on the pre-§236.2 build, 18 green after;
hide-element, project-tables, repeat-project and full qa.py green.

### §236 — "Add slide after" (2026-09-01, on `claude/slide-insertion-rearrange-fga828`)

Islam's wording on Manage slides' Add button: `+ Add a slide` becomes
**`+ Add slide after`**, so the button says where the empty slide lands. The
hint under it keeps only its half of the sentence ("the one selected" / "the
slide selected below") instead of repeating "after"; the read-mode prose names
the control by its new name. **His rearrange question needed no build**: §51.10's
▲▼ arrows already move ADDED slides only, over generated neighbours too, with
the generated order fixed — exactly the design he proposed. Verified by driving
Mobile's deck: slide added at position 4 with slide 3 selected, arrives
selected, arrows still step it, generated slides offer none, no errors.
*(The open findability question answered itself in §236.2: he found the
arrows, and they were broken — fixed there.)*


### §230 / §230.2 — the hard-refresh notice (merged to `main` 2026-09-01)

- **§230:** when the server's answer arrives after the page's 8-second
  give-up (cold start after a deployment), the real page now appears by
  itself and the notice comes down — no reload, nothing pressed. Measured
  first: the server is healthy; only the cold first answer exceeds 8s.
- **§230.2:** the notice's words are the user's — *Just a moment… / Your
  page is taking a little longer to open. Your work is safe. / It will open
  by itself — no need to do anything. / Try again* — and the "look at the
  example" link is removed at Islam's direction (cost stated: while the
  server is truly down there is no way past).
- Proof: `checks/boot-skeleton.py` §6 new, §4 rewritten — 2 red on the
  build before; ALL GREEN after; full `qa.py` clean.

### §233 — hiding an element from the presentation (2026-09-01, on `claude/smo-hide-element-ppt-s3rodi`)

Islam's three decisions, mockup signed off the same day: hidden is NOT
counted, rows only (never a pillar, capability or project), the workbook
carries the mark. One predicate (`SMPRules.isHidden`/`shown`) runs every
reader — scores, reporting asks, the note rule, Submit, the gap count and
walk, the reporting pane, the deck, the .pptx builder — because not counted
means not asked and not owed. The pen's eye toggles `row.hide` (an absence,
riding extra, no migration); read mode wears "Hidden — not counted" for
everyone; every row sheet gains a Hidden column read both ways.
`checks/hide-element.py`: 17 red pre-§233, 21 green after; the
neighbourhood and the full sweep green; the server suites untouched
(451/106).

### §232 — removing a pillar or a project (2026-09-01, on `claude/smo-hide-element-ppt-s3rodi`)

The mockup an earlier session published for sign-off, signed off by Islam and
built: a worded quiet-red Remove control in the pinned editing head (a
pillar's edhead, a project's edband), drawn only while the pen is open,
opening the platform's own confirmation — what the thing holds, what has been
reported this cycle, and the archive-first way back. Never renumbers (ids are
what figures and snapshots key on); the server needed nothing. **And the way
back was broken for every pillars function** — `restoreArchive()` could not
resolve an `fn:` archive — fixed at both ends, because §232's confirmation
promises it. `checks/pillar-project-remove.py`: 13 red on the pre-§232 build,
27 green after; neighbours and the full sweep green.

### v3.80 — the pending count says where, and walks you there (§192)

- **The badge pointed nowhere.** As the SMO you were told three values were
  waiting for you and given no way to find them.
- **And it printed under the button beside it** — 160 pixels of overlap
  reading, 110 while filling, measured on the real page.
- **The number was never that pillar's**: it counts the whole unit. It moves to
  the totals row where the unit's other counts already are (Islam's pick of two
  drawn options), and the collision goes with it.
- **"Next pending" walks you through them**, the same way "Next gap" already
  does — across pillars and across sections — landing on the tick that confirms
  each one. Confirming updates the count and the button as you go.
- **Only somebody who can confirm gets the walk.** A filler sees the count,
  because those values are still theirs to correct.
- **The bug worth knowing:** the new chip was given a name the product already
  used for something else, which silently stopped every confirm tick in the
  platform being drawn. Found by driving it, not by reading it.
- Proof: `checks/pending-walk.py` is new — 14 red on the build before,
  including the reported overlap.

### v3.83 — editing a pillar keeps its head (§194)

- **The name box now runs the whole line** — it was 228px in a pane 1225px
  wide, which is why a long title stacked up in a narrow column.
- **The code, the name and the Done tick stay put when you scroll.** Reading
  has always kept a band pinned; editing had no equivalent, so the mode you
  work in was the one that lost its place.
- **The unlabelled box under Owner is hidden**, as you asked. Worth knowing:
  that field is still stored but now shows nowhere, so a value that came in
  with an upload can't be corrected from any screen. One line to give back.
- Proof: `checks/plan-edit-head.py` is new — 10 red on the build before.

### v3.82 — "Sending…" stops lying, and home moves left (§193)

- **The reply says "Sent." within about two seconds** instead of sitting on
  *Sending…* for as long as the email takes. The server stores your reply first
  and emails it second, and it only used to speak when both were done.
- **Then it upgrades to "Sent, and emailed to …"** when the email finishes —
  two true sentences in the right order.
- **A request that never comes back now says so** rather than leaving the word
  up for ever. It says the reply may still have gone and points at the thread,
  because that's the truth — and it can never take back a "Sent." you've
  already seen.
- **The home button moved to the far left**, for everyone. It was beside the
  gear, and the gear is the Setup door — which most people never see at all.

### v3.80b — the gap walk reaches every place again (§192.4)

- **"Next gap" on a unit reached two places out of five**, then ran out. It was
  never stuck: it walks every field it has marked, and in the first pillar it
  had marked **six** while the band counted **one**.
- **Five of the six were collaborator boxes.** When we stopped counting missing
  collaborators as missing items, the counts changed and the walker didn't — so
  every press went to a row nothing was asking about, and the walk never got as
  far as Foundation, Objectives or the last two pillars.
- Now the walk visits exactly what the count counts.
- **Left alone, and flagged:** a collaborator box still shows the red "Missing"
  dress while you're filling, even though it is no longer counted. That's a look
  question, so it needs a mockup and your say-so.
- It was reproduced on what's live now before anything was changed, so we knew
  it wasn't from the work beside it.

### v3.79 — a line the platform cannot name is nobody's to change (§191)

- **The hole.** The system works out what changed by matching plan lines
  against their reference numbers. A line with no number matched nothing, so
  nothing was compared — which read as *nothing changed*, and nothing changed
  is allowed. Measured: a **view-only** unit head could rewrite a key
  objective, a pillar, a measure, a tactic and a project's details.
- **Three ways a line goes unnamed** — no number, an empty one, or two lines
  sharing one — and all three are now refused.
- **Three places do the matching**, not one. Fixing the shared one closed three
  of four cases; the sweep across all nine lists found the other two.
- **The rule:** a list the system cannot match line by line is the Strategy
  Office's. Leaving it alone still costs nobody anything.
- **The shipped data is clean** except the group's own six objectives, which
  nobody could ever have edited anyway — they're refused by a separate rule.
  They now carry numbers, with migration 034 for tenants already running.
- **The first draft of that migration would have caused the problem it fixes** —
  it would have handed an existing line a number another line already had.
  Caught by running it against a real database, in four different shapes.
- Proof: 416 assertions pass. Proved able to fail — 19 / 3 / 3 red with each
  of the three guards taken out in turn.

### v3.78 — an attention item you can answer, on the box it is about (§190)

- **Three of the seven kinds could never be cleared.** A seat somebody meant to
  give, a row that never signs in, and two people who really are two people —
  each counted on the button, the Setup Overview and the welcome screen for
  ever, with no data to change that would answer them. A count nobody can get
  to zero is one people stop reading.
- **Every kind has a Dismiss now**, under the box it is about, except a
  declaration — which has had its own since §180 and keeps exactly one control.
- **The sentence moved onto the field**, inside a ring on the whole field
  (label and control), in the warning ground. §116.2's band above the fields
  said what was wrong and left nine boxes to guess between — and it was the
  queue's alone, so *Edit details* said nothing at all.
- **A dismissal remembers WHAT it answered.** Dismissing a Super user seat says
  nothing about the next one: move the person and the item comes straight back.
  That is what makes a dismiss safe to give at §186's own alarm.
- Stored as an absence on `people.extra` — **no migration**, and no server
  change (a non-seat person edit already classifies as `setup`).
- Proof: `checks/attention-dismiss.py` is new — one item per kind, the ring
  measured as paint, one press clearing all three surfaces, both ends.
  **21 red** on the pre-§190 build. `qa.py` clean.
- **Two of its own first failures were the check**: the stub answered the wrong
  action names, so the two server-backed kinds read as *not raised* on a build
  that raises them perfectly. `people-dialog.py` carries the same two typos.

### v3.77 — plan titles you can read while you edit them (§189)

- **They could not wrap at all.** Every title and description on a plan was a
  single-line input. Measured with the pen open: 4 of 23 boxes clipped at
  1440px, 8 at 1100px on a unit's Plan; on a function's Projects the
  Description column already had two clipped cells in the demo's own data.
- **Pillar, measure, tactic, milestone, description, deliverable, outcome,
  project name, sub-line and the Brief** all grow to fit now, on units and
  functions alike.
- **Short fields are untouched** — direction, target, compile rule, dates,
  Repeats, and the picked owner and collaborators. Asserted, so a build that
  turned everything into a paragraph box would fail.
- **It broke the remove ×**, which now sat under the field instead of beside
  it — caught by `plan-fields.py` going red, not by reading the CSS.
- Proof: `checks/plan-wrap.py` is new, asserts the problem rather than the
  control, both ends, two widths, both panes. **14 red** on main.

### v3.76 — the office inbox: the caret, the box, the pill and the tag (§188)

- **Three of the four are one omission.** The corner chat panel was built
  carefully against exactly these faults; the office's own inbox — the surface
  the office lives in — got a thinner version that skipped them.
- **The caret** no longer jumps: only the messages redraw while you have the
  cursor in the reply box. Your text was already being carried across, which
  is why it read as the cursor moving rather than work being lost.
- **The reply box grows** with what you type, like the corner's already did.
- **The rail's pill follows the inbox.** Both numbers were right and of
  different ages — the inbox re-asks every beat, the pill was fetched once per
  visit and never told the summary had changed. Replying is the act that makes
  it wrong. The pill is rewritten in place, never by repainting.
- **A reply that left by email says so**, with the address on the hover.
  Migration 033 adds the column. Nothing is backfilled — the platform never
  recorded it, so nothing is claimed for messages already sent.
- Proof: `checks/office-inbox.py` is new, over HTTP with a stub, **6 red** on
  main. Two of its own first runs were the check: Playwright types `\n` as
  Enter (which sends), so the caret assertions compared "" with "" and passed;
  and 129 characters in a 964px box fits on one line, so the grow test called
  a working build broken.

### Awaiting sign-off — the plan's titles (§188.5)

- Measured with the pen open: **4 of 23 boxes clip their text at 1440px, 8 at
  1100px.** Not because they wrap badly — because every title on a plan is a
  single-line input and cannot wrap at all.
- Mockup published; nothing applied.

### v3.75 — a seat is granted, never derived, and four small ones (§187)

- **`level: "smo"` no longer makes anybody a Super user.** The role rules read
  a field from before roles existed, so a person carrying it derived Super
  user on the screen *and* on the server. Nothing has written it for fifty
  versions — which is what made it dangerous. Islam's instruction: a seat is
  granted on the register and nothing else.
- **"N people hold a seat" on the register**, with every holder on the hover.
  This closes the hole I measured and told him about: the attention queue is
  deliberately quiet about a seat held by somebody who sits at the group.
  Always drawn — a count that vanishes cannot be trusted to be complete.
- **Collaborators are no longer a missing item** (reversing §145.10 at his
  direction). A tactic with nobody supporting it is one person's to run.
- **The welcome header** at 204px — his pick from the mockup. The tenant block
  held its place at every width tested; below 820px it stacks again on
  purpose, and that is asserted.
- **The chat inbox list shows the name, not the full one.** §181 did the
  thread and stopped at the queue — a different builder. Search matches both.
- Proof: `checks/seat-count-and-small.py` is new, every assertion at both
  ends, **9 red** on main's build. `test-authorize.js` §22 added and its
  collaborators block moved to the new contract — **352 passed**.
- **Out of this round by his call:** the Overview redesign and the
  squeezed-window damage. **The chat caret** is banked with his answer — it
  happens while typing, after a few seconds, which points at the poll.

### v3.74 — a seat is not an ordinary role (§186)

- **It was not impossible, and I had said it was.** The register's role picker
  is a plain dropdown, and a role with one destination is granted on the pick
  (§92) — a seat has one destination. So Super user was one selection with
  nothing in between. The people file's Role column was the same grant by
  another road.
- **One line stood behind both:** the grantable test excluded only the derived
  floor roles and said nothing about seats.
- **The server was always right** — a seat move is an `access` change, which
  is the Super user's. The fault was the screen offering what the save
  refuses, and going through instantly for the one person it does not refuse.
- **Now:** seats are not offered to anybody who may not give one, in the
  picker or in the workbook template; and the Super user is asked, with the
  ask naming the person, the role and what it hands over.
- **The ask is state in the dialog's body, never its own modal** — the first
  build used one and the register's repaint painted straight back over it.
- **The register watches**: a seat whose place is not where the person sits
  joins the attention queue, under a collision and above every gap. The test
  is the place, not "holds two roles" — the bootstrap SMO holds a seat and
  heads the SMO function, and must not be nagged.
- **Not claimed:** who granted Hussein's seat and when. The change log holds
  it; that needs the database.
- Proof: `checks/seat-grant.py` is new, every assertion at both ends, proved
  able to fail **2 and 3** ways. `role-picker.py` moved to the new contract —
  it was asserting §92's grant-on-pick, which is the behaviour that caused
  this. 345 server assertions pass; `qa.py` clean.

### v3.73 — viewing as somebody, a way back, and a mark nobody could see (§185)

- **"Viewing as" used your rights, not theirs.** Measured: the same edit,
  refused for Hala and accepted for the SMO. The server reads the person off
  the session, so simulating somebody changed everything the screen drew and
  nothing it accepted — no refusal anybody meets could be reproduced from the
  office, and the office could write through a colleague's view what that
  colleague never could. The simulated person now travels with the save.
- **It can only narrow.** The gate is the seat role on the session, the person
  is looked up in the stored register, and an unknown key is refused rather
  than treated as somebody with no roles. `SMPRules.actingFor()` is the rule,
  so it is testable without a database.
- **A refusal while simulating says so** — "Setup is the SMO's" is baffling
  when you are the SMO.
- **A way back to the welcome screen**: a house beside the gear, drawn
  independently of it so it is not the office's alone.
- **The dismissed mark is CSS, not a character.** §180 proved the dotted circle
  was not tofu; re-measured, it laid down 29 ink pixels against tofu's 28. It
  is a 9px ring now, filled while waiting and open once answered.
- Proof: `test-authorize.js` §21 (**345 passed**), `people-dialog.py`
  re-pointed at the visible mark, `welcome.py` and `refusal-keeps-work.py`
  green, `qa.py` clean.
- **Awaiting sign-off, not applied:** the welcome header when somebody holds
  two long roles — the tenant block wraps below at every width measured
  (294px → 204px header). Mockup published; rule 1c, nothing touched.

### v3.72 — a date the platform cannot read, and a refusal that costs one row (§184)

- **The CX custodian's loss, reproduced against the real authoriser first.**
  An empty due date filled is accepted; the same act on a date holding
  `30/09/2026` is refused, because a non-blank value is not a gap so
  correcting it is *authoring*, which is the office's. The refusal is right.
  The loss is that the whole graph posts together, so one refused row failed
  the whole save and took three legitimate fills with it — and the only
  control on the banner destroyed them. That is why the SMO never received
  them: they were never stored.
- **`monthsOf()` moved into `lib/rules.js`.** The platform's definition of a
  time lived in the browser alone, so the screen and the server answered "is
  this a date" differently. One reader now; `dueFits()` uses it too.
- **An unreadable date is a gap**, keyed on the field name (`start`, `end`,
  `finish`), asked by the counts, the cell and the server through one
  function. A readable one is still the office's — asserted at both ends.
- **The row opens AND still shows what is stored.** Rendering *Missing* over
  `30/09/2026` would hide the value the person is being asked to correct.
- **A refusal now carries an address**, not only a sentence: target, row id,
  field, and the value the row held. The banner names the lines and offers
  **"Put back those lines and save the rest"**. Discard stays, and is never
  the only control again.
- **A change with no row address offers no button** — the server decides
  that, because a button that cannot work is worse than the destructive one.
- **Nothing stored, nothing migrated.**
- Proof: `test-authorize.js` §19–§20 (**336 passed**), proved able to fail 3
  and 2 ways; `checks/refusal-keeps-work.py` is new, drives the whole path in
  a browser with the **real authoriser behind the stub**, and is **11 red** on
  the previous build; `checks/milestone-fill.py` §9. `qa.py` clean.
- **Recorded, not fixed:** the put-back is offered only when every refusal in
  one response is addressable. A save mixing an addressable refusal with an
  un-addressable one still offers Discard alone — nothing is destroyed
  unasked, but the platform cannot rescue it automatically.

### v3.65 — a function could not report at all, and Save draft never finished (§183)

- **A supporting function that plans in pillars reported nothing.** Its
  reporting page is drawn by the unit's renderer, and both field handlers
  looked the subject up with `UNITS[current]` — undefined for `fn:…` — so the
  handler threw and every figure and note typed was discarded in silence.
  Measured: 0 saves before, 1 after. §63's own fault in the two places that
  fix did not reach.
- **Save draft sat on "Saving…" for ever.** A caller arriving while another
  save was in flight was told `"busy"` and nothing ever followed up. Since
  §170's leading-edge autosave this is the ordinary sequence, not a race: the
  button you press right after typing lands inside the flight. Such a caller
  is parked and answered when the next save settles.
- `"busy"` stops being an outcome, so both readers of it go — including
  §170's 300ms retry timer, which the parking replaces.
- `checks/report-saves.py` is new: a figure and a note on a unit, a capability
  function AND a pillars function must reach the stored plan and schedule a
  save. **5 red** on the previous build.
- **Not reproduced:** filling a missing date on a function stamps its pending
  mark correctly here. Left open rather than claimed fixed.

### v3.65 — dismissing a declaration (§180)

- **Accepting always worked** — driven, not read: Use it moved the person, the
  count cleared, the queue emptied. What never existed was the other answer.
- **There was no dismiss anywhere** — not on the row, not in the dialog, not in
  the server — so a claim the SMO disagreed with kept its mark, its queue
  entry, the register badge, the rail pill and the Overview row for ever. The
  Overview has promised "accept or dismiss" since §108.10.
- **The claim is kept and marked answered** (Islam's pick of three), not
  deleted. Migration 031, nothing backfilled, nobody's access moves.
- **Saying it again clears the answer** — a fresh statement is owed a fresh
  reply. There is deliberately no un-dismiss: changing your mind is accepting.
- **The glyph carries the state, not the colour** — `◎` waiting, `◌` answered.
  One ring in two inks was drawn first and the mockup killed it: 9.6px at 11px
  type is too small for a colour to be a state.
- Proved against a real Postgres 16 (virgin round trip, and the migration on a
  tenant that predates the column) and in `checks/people-dialog.py` §8,
  **proved able to fail twice**.

### v3.65 — four from using it (§179)

- **Viewing as reaches the welcome screen.** The screen covers the window, so
  the control underneath could not be reached at all. It sits above the
  greeting — Islam's pick of two placements drawn in the running product — and
  switching redraws the screen for that person. Only a Super-user session gets
  it, asked through the same function the chrome asks.
- **Greeted on every sign-in.** "Seen" was remembered for the browser session
  and signing out only reloads the page in the same tab, so the memory outlived
  the session. It is cleared when a credential is accepted — never on a plain
  refresh, never on a resume.
- **A project's Start and End are picked, as `Jul 26`** — §177's own control,
  reused rather than a second way to say a date. **Not only a look:**
  `30/4/2026` was unreadable to the platform, so that project's End was no date
  and the overrun warning could never fire on it; and `Date.parse("Jul 26")` is
  26 July **2001**, so shipping the picker without repairing the reader would
  have woken a dead warning as a false one on every milestone.
- **Deliverable and Outcome are plain text.** One builder, three panes; the
  column keeps its measure so nothing reflows, and the rows come in 17px
  shorter.
- Dates already written are untouched, a quarter can no longer be a Start or
  End, and nothing moves on the demo (2 overruns before, 2 after).
- `checks/project-dates.py` is new (**5 red** on the previous build);
  `checks/welcome.py` gains §8 and §9 (**2 red**); `checks/project-header.py`
  presses the picker instead of typing. `qa.py` green.

### v3.65 — who owns every place, named once (§175)

- **Islam asked about the CEO rows; both were already right** — a Group CEO owns
  every unit and function (so the *other* columns were already dashed), a
  Company CEO owns their company's units and never a function (so *own
  function* was already dashed).
- **The question found the SMO team row instead.** It read `a_unit_other` /
  `a_fn_other` for everything, so its four *own* cells could never be consulted
  — and it silently behaved differently from the Super user, whose grants it is
  meant to share.
- **The cause was two lists**: `roleOwns()` and the matrix each kept their own
  idea of who owns everything, and neither included the SMO team. One exported
  rule now, asked by both.
- **The SMO team joins the Super user and the Group CEO**, at Islam's direction.
  Nothing moves on a default tenant; a tenant that had narrowed the
  other-columns widens for its SMO team.
- **The check asserts the agreement for every role** rather than the pairs
  somebody noticed — offered-but-unreachable and reachable-but-not-offered,
  both ends. **3 red** with the SMO team reverted.

### v3.65 — the matrix header, and two cells that could never come up (§173–§174)

- **The header is smaller and it stays.** Settled from a mockup drawn in the
  real page: **83px → 53px**, no heading past two lines from 1600 down to 1024,
  the top row vertically centred, and both rows of the head pinned while the
  rows scroll under them. Islam's own acronyms did not meet his own two-line
  rule at 1180 — shown the measurement he picked the shortest wording (Own
  Func. / Other Func.) and kept *Reporting cycle*.
- **`short` is the header's word, `label` is still the product's**, so the full
  name is on every hover and no sentence anywhere changed.
- **Two cells that could never come up are gone**: a Project owner is only ever
  derived on a supporting function, so the own-BU columns can never be theirs;
  and a BU owner can never hold an own supporting function. Defaults were
  already `none`, so nobody's access moves — what goes is an option with
  nothing behind it.
- **One of the two reported examples was wrong and is recorded as such**: a
  Pillar owner IS derived on a function that plans in pillars, so those cells
  stay, and the check asserts they stay.
- **A refresh stays where you are** (§173) — remembered in sessionStorage, so a
  new session still opens where §94.6 says.
- `checks/access-header.py` **13 red** on the previous build; `checks/stay-put.py`
  asserts both halves.

### v3.64 — fill is a grant, and the constraint never heard (§172)

- **The Roles & access 500, found.** §145 gave the Strategy cells a third state
  — **Fill gaps** — and `db/schema.sql` still allowed only none/view/edit. So
  granting it violated a CHECK constraint, `writeState` threw, and the save
  answered 500.
- **It was never one save.** The whole graph is posted each time, so the refused
  value stayed on screen and in every later payload: from that press onward
  **every save of every page failed**. That is why it read as "Roles & access
  never saves".
- Fixed in `schema.sql` and migration **030** (idempotent, backfills nothing —
  no stored row could hold a value the database was refusing). Both paths
  driven: a virgin database and an existing one.
- **The blind spot is closed**: the seed grants no `fill`, so the round trip had
  never offered the fourth value to the database. It now writes one grant of
  every value in `STATE_RANK` — read from the shared rule, not listed — and
  fails loudly on the old constraint.
- §171's banner is what made this findable in twenty minutes instead of another
  round of guessing.

### v3.64 — a failed save says so (§171)

- **Islam reported Roles & access not saving a second time.** It saves in every
  configuration this repository can build — the demo tenant, a **cleared**
  tenant (what a real deployment is), and a refresh 150ms after the press, read
  back from `access_grants` each time. Production's `/api/state` answers 401
  rather than 500 unauthenticated, and `ensureReady()` runs before the session
  check, so its migrations apply cleanly. Nothing visible from here is broken.
- **So what was fixed is the invisibility.** A save that FAILS wrote one line to
  a console nobody has open, which makes a 500, a dropped connection or a
  timeout look exactly like a save that worked. Three silences closed: a server
  error (naming the status), an unreachable server, and — the truly silent one
  — a **remembered refusal**, where `save()` short-circuits before the banner is
  ever drawn. Demo data now says so at the moment of the change too.
- **This is a diagnostic, not a cure.** If the next attempt shows a banner, its
  sentence says where to look. If it shows nothing and the value still reverts,
  the save is landing and the fault is past it.
- `checks/save-said.py` drives seven states through a stub that can be told to
  fail; **5 red** on the previous build.

### v3.64 — a change is saved at once (§170)

- **Press a setting and refresh straight away, and it used to be lost** — on
  every page in the product. The autosave waited 800ms; §138's flush-on-leave
  was meant to cover that and cannot, because `keepalive` caps a body at 64KB
  and **one SMP save is 216,307 bytes**. Measured, not reasoned: pressed a
  Roles & access cell, reloaded 150ms later, the row was unchanged.
- **The wait goes, the coalescing stays.** `afterPaint()` is a leading-edge
  debounce now: the first change of a burst is sent immediately and the
  trailing timer still runs, so one press is durable at once and five presses
  in half a second cost two saves instead of five. Typing is untouched (a field
  writes on blur, so a keystroke never reached that path).
- **One place, no list of controls** — every writer ends in `paint()` and every
  `paint()` ends in `afterPaint()`, so a control added later is covered.
- Verified end to end against a real Postgres on **Roles & access, Scoring
  bands and Terminology** — pressed, refreshed at 150ms, read back from their
  own tables. `checks/save-flush.py` gains the "on the wire inside 250ms"
  assertion, which is **0 posts on the previous build**.

### v3.64 — a Setup page that fits, an editable scale, and the away threshold (§167–§169)

- **The Platform Inbox's headers, and the Setup rail's, stop being lost.**
  `.setuprail` is sticky and on a page where the rail is the tallest thing in
  its row it has **zero travel**, so it never pins — measured on the Inbox at
  1440×760, rail at y=37 and its head at y=38 behind a chrome ending at 75.
  The scroll that did it was 60px the page never needed: `.wrap` ends every
  page with `padding-bottom:80px` while three caps reserved 20 (§122.5's own
  fault, third time). Two numbers now — `--page-foot` for a page of content,
  `--pane-foot` for one capped to the window — because reserving the full 80
  turned the register's table 80px short of the fold and
  `checks/register-header.py` said so six times.
- **The scoring bands are the tenant's**: add a level, remove one, and set each
  one's colour from the five the product paints. The colour **is** the key, so
  picking red is also what makes that level one a reporter has to explain
  (`needsNote()`). Two levels is the floor and the reason is on the page; the
  bottom level always starts at 0. The two stale notes go (one cited a file
  that is not in this product); the "changing a threshold rewrites history"
  warning stays.
- **How long somebody counts as away is a setting**, on the Away email row —
  1 to 120 minutes, off the shipped 3, read by the server and by the row's own
  sentence from one place in `lib/rules.js`. It was a constant in `api/chat.js`
  and a hardcoded "three minutes" in prose beside it.
- **Two checks were blind to §148's welcome screen** and one of them had been
  reporting it as a product defect for a section. Both suppress it now.
- Verified: `checks/setup-sticky.py` (**16 failures** on the previous build),
  `checks/scoring-bands.py` (**4 then a crash**), `scripts/test-chat.js`
  (**57 passed**, 3 red with the server's constant restored),
  `scripts/test-authorize.js` (306 passed), the round trip on a **virgin
  database** (clean slate / round trip / fixed point / archive all PASS), a
  five-band tenant with two levels sharing a colour round-tripped through real
  Postgres, and the full `qa.py` sweep.

### v3.62 — the Performance line, three bands, and two headers over their own rows (§162–§163)

- Islam's seven from a squeezed window; five needed a decision and he gave
  them, two were defects.
- **The hover WAS working** — as a native `title`. Product bubble now, on hover
  and on focus (a tap). Then **the black box**: the compiled cell built its own
  span and kept its own `title`, so it took the new bubble with no words in it
  and the tooltip a second later. §96 again.
- **The bands are a row in a table**, hydrated over the baked default — which
  is why changing what ships changed nothing for him. Migration 029 moves a
  tenant still on the shipped four and leaves a customised one alone; both
  cases and the full round trip driven against a real Postgres.
- **§163.5, the one worth reading**: every Setup table pinned its header to a
  PAGE offset inside a box that scrolls, so the offset resolved from the top of
  the TABLE — the Scoring bands heading 136px down its own body, across the
  third row, at every width unscrolled. §130.2 fixed `.acgrid` and stopped.
- **And my own first guard broke something real**: raising the pinned pane
  title above everything made fill fields unclickable and the sweep failed. The
  tie needed breaking from below.
- Also: the colour banner was the page's control row; the squeezed rail had
  said `display:flex` for versions and meant nothing by it; the chart legend
  kept a second copy of the bands that already disagreed.
- **Awaiting sign-off**: the editable Scoring bands table (add/remove a level,
  set the colour) — the open question is a choice of the product's five colours
  versus a free picker.

### v3.60 — the Performance line, Bands, three bands, a real hover (§161)

- Islam's remaining five from using the product; settled from a mockup drawn
  into the real platform and confirmed before a source was touched.
- **The hover WAS working** — as a native `title`: a second's delay, an 11px
  target, and on an iPad nothing at all. It is the product's own bubble now,
  opening on hover **and on focus**, which is what a tap gives. The `title` is
  removed rather than kept beside it.
- **The colour bar was also the page's control row**, which is why Report and
  Presentation read as a row of their own. Banner gone; the three controls sit
  right on the Performance line; the page gains a whole row.
- **Bands** (his word, over "Colour key") — one noun shared with the Setup page
  that edits them. Opens under its button, shuts on a second press or a click
  outside.
- **Three bands: 90+ / 70–89 / below 70.** `warn` leaves the default, not the
  product — the list is a tenant setting, so a deployment that saved four keeps
  them. Nobody's note obligations move.
- **The chart legend kept its own copy and it was already wrong** (70/50/50
  against the real 85/70/50) — found by reading the function the mockup made me
  open. Derived now.
- **§145.14 came back and the mockup caught it**: `.tabs button` outranks a
  bare class, so the new button first rendered as plain words.
- **§161.2 — the squeezed-window damage is guarded, not fixed.** The trigger
  was never reproduced (ten widths, every scroll offset, both ways in, two
  hypotheses tested and both wrong). What is fixed is the one undecided thing:
  the frozen header cells tied with the pinned title at z-index 4, so document
  order decided which won. **The first attempt fixed it from above and broke a
  real interaction** — raising the title made fill fields unclickable under it,
  and gap-fill went red within minutes; the title is left alone. The check
  sweeps eight widths for anything covering it.
- `checks/perf-line.py` — 7 failures on the pre-§161 build.

### v3.60 — the squeezed rail and the demo banner (§160)

- Two of Islam's seven from using the product on a smaller window. The other
  five need a decision from him and are **not built**.
- **The rail had said `display:flex` for versions and meant nothing by it.**
  Reordering later wrapped every row in a `.sortable` div, so the rail laid out
  its ONE child in a row and the pillars stacked inside it — 255px of a
  squeezed window on a list of four. §51.11's family, failing in the direction
  that looks deliberate.
- **The two sides had drifted and the FUNCTION was the correct one**: its
  projects are direct children of the rail and were horizontal all along. The
  fix is a no-op there. 255px → 66px, and the strip scrolls to the last item.
- `display:flex` on the wrapper, never `display:contents` — that removes the
  box `makeSortable` measures to place a dragged row.
- **The demo banner loses the invented-content line** (Islam's call). Cost
  recorded: nothing on that screen now says which parts were made up. The line
  that stops somebody mistaking the demo for their own tenant stays.
- **Two assertions in the new check could not fail** until they were run
  against the previous build: one read the baked banner instead of the demo
  one (invisible over file://), and one matched a character the built file
  holds only as an escape sequence. 3 failures on the pre-§160 build once
  fixed.
- On its own branch for review: `claude/wave5-demo-line-and-squeezed-rail`.

*The five v3.59 entries below are the UI/UX audit's waves 2 and 3, built and
checked as separate rounds on one branch and shipping as one version — main
took v3.52–v3.57 from four other sessions while they were being built.*

### v3.59 — the welcome screen's way out (§159)

- Islam, on §148's screen: *"continue to the unit or the function button is a
  bit not obvious"* — five variations drawn in the real screen, and he chose
  **B**, one bar across both columns.
- **Three faults, and weight fixes one.** It is the *only* exit (no ×, no
  Escape, no click-outside); it was the quietest thing on the screen; and it
  sat inside the left column, so it read as the end of the list. Measured: the
  link began 585px into the columns and 165px above their bottom, and **below
  960px it was not even last** — at 900px, 411px of side column came after the
  way out.
- **The bar spans the grid**, sits after `.wcols` inside `.wwrap`, and is last
  at every width. It wears `.wpages`' wide-row shape rather than a second
  vocabulary (§53.5) and spends none of §41's accent.
- **The empty case closes a drift**: §148's approved mockup said Continue is
  the loud control when nothing is waiting and the build never did it, so an
  empty welcome was a grey link and nothing else. `.wexit.wloud` is its own
  class, and a row arriving late gives the fill back through `unEmpty()`.
- **The drawing's grey *Strategy · Plan* sub-line is not built** — the label
  already names the destination (1b-ii), and the second line needs the
  navigation-word reader §99 deleted. Recorded, not dropped silently.
- `checks/welcome.py` — 7 failures on the pre-§159 build, exactly the seven
  new assertions. Contrast measured in all four palettes (lowest 4.99).
  **Escape and click-outside still do not close the overlay** — offered with
  the variations, not taken up, and left as its own ask. **Not merged —
  awaiting Islam.**

### v3.59 — the plan tables fit the pane (§158)

- Islam, wave 4: on a smaller window the plan tables were cut off down the
  right — the last column sliced, the heading reading *COMPILE*.
- **A floor cannot yield.** `table { min-width:620px }` is the right default
  and the pane narrows past it: at a 900px window the pane is 585 and the
  table stays at exactly 620. Only between ~820 and 960 — above it fits,
  below 820 the split stacks — which is why 1440 and 768 both look clean.
- **Two wrong fixes were drawn first.** Tightening cell padding narrowed the
  columns and left `scrollWidth` at 620 to the pixel (the flexible column
  absorbs it); §108.5's scroll shadow and track was an affordance over a
  fault, and could not even be demonstrated — headless paints no scrollbar,
  and on an iPad the native one is an overlay that vanishes.
- **§53.5 paid within a minute**: with the floor gone the unit fits and a
  supporting function still ran 11px over at 860 and 41px at 830 (five columns,
  intrinsic minimum). 13px → 8px of cell padding closes it with no heading
  taking a second line.
- **`:not(.setuppane)` was found by the check** — Setup's pane is also `.pane`,
  so the obvious selector stripped the register's floor too.
- **And the obvious both-ends assertion could not fail**: `.cfg table`'s 760px
  floor is dead code, re-declared as 0 later in the same file (the fifth
  duplicate this project has recorded). Asserted on the selector instead.
- `checks/table-fit.py` — 7 failures on the pre-§158 build. Whole suite and
  the 33-viewer sweep green. **Not merged — awaiting Islam.**

### v3.59 — two faces (§157)

- Islam: *"let's make the 2 fonts available are the sytem font and the source
  san3."* §38.7 carried four faces so they could be judged in the real product
  rather than on a specimen sheet; the judging is done. Inter, Manrope and IBM
  Plex Sans leave — files, `@font-face` blocks and `[data-font]` rules together
  (§24) — and the switch offers **System** and **Source Sans**.
- The built file goes **2,690,171 → 2,531,861 bytes** (2.69 → 2.46 MB), which
  is 116 KB of face in every handover of the single file.
- A face lives in three places that must agree — `fonts/`, `FACES` in
  `build.py`, `FONTS` in `theme.js` — and `FONTS` is also the sanitiser, which
  is what makes a browser remembering `manrope` fall back to the system stack
  with the switch still working rather than being stranded.
- **The check reported a correct build broken first.** A `data:` URI removes
  the network and not the asynchrony: the face is `unloaded` until asked for,
  so a width measured in the same frame as the attribute is the system stack's
  width under the right family name (279.95 = 279.95). `await
  document.fonts.load()` first (227.91 vs 279.95), with the decode asserted as
  its own fact.
- **And one assertion could not fail when written** (§94.5): it derived the
  attribute key from the family name, and `"IBM Plex Sans".split()[0]` is
  `ibm` where the selector has always been `plex`.
- `checks/typeface.py` — 11 failures on the pre-§157 build. Wave 1–3 suite,
  `save-flush`, `state-contrast` and the 33-viewer sweep green.
  **Not merged — awaiting Islam.**

### v3.59 — the card sentences and the delta (§156)

- Islam's redirect of Wave 3's item 2: the three group cards each carried a
  different kind of sentence and none said what its number meant — a data
  note, ten unit weights, and "variance +2" under a headline of 104%.
- Each now says what the number IS, with the arithmetic left to "How this is
  calculated →". `deliveryLine()` reads the ratio out in words — **ahead of
  plan / behind plan / exactly on plan** — one function for the group's card
  and a company's, and the check asserts the verdict AGREES with the figure
  rather than asserting the wording.
- The ▲ delta moves from the title into the number (where a unit's own cards
  have always put it); "primary" drops from gold to the page's neutrals.
- 4 failures on the pre-§156 build; whole suite and 33-viewer sweep green.
  **Not merged — awaiting Islam.**


### v3.59 — Wave 3: four visual refinements (§155)

- **The group landing answers "where do I look next"** — one entry per unit,
  worst first, each linking to it; the same figures the Business units section
  already shows, asserted equal entry by entry.
- **Caption explainers stop shouting**; **Branding's pickers open on the colour
  the platform actually paints** (read live, never a literal); **Full Name
  leaves the register's default columns** and stays one tick away.
- **§155.1**: the strip's entries first carried `data-u` and went nowhere —
  that wiring is scoped to the chrome. `data-go` is the platform's own
  document-wide attribute. Found by pressing, §150.1 twice in one session.
- **§155.2**: an assertion nearly forced a wrong design — "quieter" measured
  as colour would have made the explanation fainter than the quietest ink.
  Corrected the check, not the design.
- `checks/wave3.py` — 12 failures on the pre-§155 build. Full sweep: 33
  viewers, no errors. **Not merged — awaiting Islam.**
- **Still with Islam**: the three card sentences (§156 mockup) and whether the
  chip refinement goes in with them.


### v3.59 — the three contrast repairs (§154)

- Islam approved §153's three findings for repair. All three were **one fault**:
  a scoring colour used as TYPE rather than as a mark — the rail's figure
  (3.26 → 4.93), the focus strip's count (4.45 → 6.45), the hovered button and
  its caret (4.34 → 5.36).
- `bandInk()` beside `band()`, applied at 30 call sites, with a fallback for a
  tenant band that has no text twin. Two more fixed by hand, same move.
- **§154.1**: the caret's first fix made it worse (4.34 → 1.43) — a blanket
  rule hit a caret sitting on the navy chrome. Reverted; fixed at the control
  that failed.
- `state-contrast.py`'s baseline is now **empty** — anything failing from here
  is new. Full sweep: 33 viewers, no errors. **Not merged — awaiting Islam.**


### v3.59 — Wave 2 of the UI/UX audit (§149–§153)

- **§151 the tables Islam was stuck on**: a plan wider than its pane was cut
  with no way to scroll (the page never scrolls sideways, §27.2). It scrolls
  inside its own box now, with the `#` and name column frozen — and the second
  frozen column parks against the first one's MEASURED width, because
  `left:38px` slid the name 2.5px on every scroll (§151.1).
- **§150 the reporting controls ride the tab row** — Islam's placement, better
  than the audit's pinned bar: the row is already pinned chrome, so no new
  sticky element and none of its arithmetic. Submit wears the Report orange,
  Save draft the same orange as type with no box. **§150.1**: putting them in
  the row made them subject to the row's wiring — every `#subtabs button` was
  bound as a tab, so Save draft closed the report. Found by pressing it.
- **§149 the glyphs keep their place and gain their meaning**: "More is
  better / Less is better", and the compile rules described; the repeated
  "Latest" quiet, with no standing dotted mark.
- **§152 the viewer switcher** reads name + place, job title on the hover.
- **§153 hover and focus are measured at last** (closes §16.17), reusing the
  sweep's own rule. Three light-mode failures recorded as a named baseline —
  `.dlcar` 4.34, `<b>` 4.45, `.rnum` 3.26 — **awaiting Islam's colour
  decision**, since a palette is his (rule 1c).
- Checks: `plan-columns.py` (6 failures on the old build), `report-chrome.py`
  (12), `table-scroll.py` (9), `state-contrast.py` (new), plus qa.py's own
  reporting assertion updated — it went red for the right reason. Full sweep:
  33 viewers, no errors. **Not merged — on the branch awaiting Islam's word.**


### v3.58 — the welcome screen (§148, spec 025)

- **One screen after sign-in, before the platform**: "Welcome, <first name>"
  leads with the person's role chips and the cycle state; Raya Trade and the
  Strategy Management Office sign the band on the separator's edge. Settled
  over three mockup rounds — the greeting moved left and the bare count
  badges became sentences at Islam's direction.
- **"Waiting on you" computes nothing new**: the submission row, the plan's
  missing elements (§145) and the office's unread reply are the same
  functions their destination pages call; the SMO's list is the Setup
  Overview's own rows. An empty list says so. Every door presses the
  platform's own navigation — "Open reporting" arrives IN reporting mode.
- **The intro round card is the tour's visible offer** and its reachable
  home again (§119.4); starting it hands the screen to the real tour. Once
  per browser session; never the office's tour, never over file://.
- Proof: `checks/welcome.py` (three viewers, made state, doors pressed and
  read back, absences, proved to fail on the pre-§148 build) + full `qa.py`.

### v3.57 — a custodian per project: two roles, not one (§313, spec 042)

- **Three bounded roles, all derived from being named** (§313.7, Islam's
  correction of the first build): **Project owner** from a project's Owner
  row; **Pillar owner** from a pillar's, on a unit or a pillars function;
  **Contributor** for everyone else the plan names — collaborators,
  stakeholders, milestone owners — who report nothing until their row is
  opened, and then only the rows that name them.
- **Two conditions before an owner reports**: their role's Reporting cell at
  edit on Roles & access (both owner rows ship at view), and being named the
  Owner. No register attachment — the silent third condition that broke the
  first live test is gone.
- **One reach rule per row** (`mayReportRow` in `lib/rules.js`), asked by
  both panes and the authoriser; none of the three roles ever submits.
- **Two drifts fixed on the way**: a custodian's deliverable report and the
  §104.10 milestone % were refused as plan since migration 024; and a
  pillars function's Report page read the own-unit cell while the server
  judged the own-function one.
- Proof: `test-authorize.js` §17 (297 passed; proved able to fail),
  `checks/project-custodian.py` (three viewers, both ends, proved able to
  fail), the matrix and project checks, the full `qa.py` sweep; the seed
  scanned — 24 people gain a true chip, nobody's grants move.

### v3.56 — a test copy is a send, and it says so (§146)

- **Islam:** *"there have been multiple sent emails earlier. weren't they saved?
  I can't see them in the overview."*
- **Nothing was lost, and proving that came first.** `messages` sits outside the
  state graph with no foreign key, so the `TRUNCATE … CASCADE` on every save
  cannot reach it, and no `DELETE FROM messages` exists in the product. Driven
  end to end against a real Postgres with a stub in front of Resend: a send
  writes its row *before* the emails go out and appears on the Overview at once.
- **The cause:** two kinds of email leave this platform and only one was
  recorded. `test` — *Send me a copy*, and the test send on Email settings —
  sends a real email through the same builder and wrote nothing at all.
- **Built:** the test copy is recorded (`kind`, migration 028; NULL is a real
  send, nothing backfilled), marked in the **audience** column — beside the
  heading it wrapped the frozen first column, §88 and §116.4 — and **Delete
  reaches test copies only** (Islam's B), drawn behind `mayDestroy()` and
  refused again on the server.
- **The note by *Send me a copy* shrank** to one clause on the hover it already
  had: with the row in the record beneath, the list is the answer (CLAUDE.md
  1b-ii, §127).
- **Found on the way:** `SYNC.mailTest()` did not forward the body — §142's
  fault, found by looking this time rather than by being bitten.
- **Proved:** `checks/send-overview.py` §6 (5 / 1 / 2 failures against three
  deliberate breaks) and `scripts/test-test-copies.js`, 19/0 against a real
  Postgres (3 / 11 against two breaks). Round trip PASS on a virgin database and
  on a tenant rolled back to its pre-§146 shape.
### v3.55 — fill the gaps (§145, spec 023)

- **A third Strategy-cell state, Fill gaps**: the custodian or owner writes
  only where the plan holds nothing — targets, directions, compile rules,
  owners, project dates, a tactic naming no quarter, the aspiration. Granted
  per role by the SMO on Roles & access; reaches only what the person holds;
  no rows added, removed, renamed or reordered in this mode.
- **A fill is pending until the office confirms** (Islam's design): live,
  amber, still the filler's to correct; the office confirms with a tick or
  by simply correcting the value. Stored as `pend` marks in each row's
  `extra` JSONB — no migration, proved on a real Postgres 16.
- **Reporting flows, performance waits**: figures and drafts land against a
  pending target; the score reads a dash and leaves every average until the
  office confirms; **Submit is refused**, naming the rows and pointing at
  the office. Save draft is never blocked.
- **Server-authoritative**: the authoriser classifies fill / amend / unfill /
  confirm ahead of the ordinary diff; anything else falls through
  office-only. `test-authorize.js` §16 — 231 pass, 6 red on the pre-build.
- **The access matrix restyle Islam approved from the mockup** (chip
  toggles, tinted lit states, hairline rows) rides along.
- **§117's .pptx plan download button is hidden for everyone** (§145.9,
  asked mid-build) — machinery kept, one line to give back.
- Proved by `checks/gap-fill.py` (fails on the pre-build from its first
  section), the full `qa.py` walk, and the virgin-database round trip.
- **Second build (§145.10–13), same branch:** collaborators fillable — an
  empty list only, and a pending name confers no reporting right until the
  office confirms (`namedOn` skips marked fields, owner included); the
  objectives' This-year column shows by default (§66's toggle and saved
  choices kept); and the plan says where it is owed — a count on the
  Strategy tab, per-row rail counts, a fill-mode gap band of place chips
  (each a door that keeps fill mode on), and a Next-gap walker, all fed by
  one list and rewritten in place as fills land. 237 server tests, the
  extended browser check, qa and eleven suites green.
- **Third build (§145.14), same branch — the finding system red and worded,
  from Islam's screens:** the whole missing bar ("N Missing" + one red chip
  per owing place + the solid red *Fill in missing elements* button) moves
  INTO the section row beside the section tabs, read mode included, nothing
  in the page body; the Strategy tab's number is gone. The corner button
  beside the arrange arrows is the same press (red → *Done filling* →
  quiet amber *Review pending · N*); rail rows read red italic "N Missing"
  → green ✓; a page owing nothing says so and points away. One press opens
  fill mode and walks to the first blank — fixed to wait for the paint
  §30.1 holds mid-click, the bug that made a real press behave differently
  from every programmatic probe. Red words on `--bad-tx` (§38.5).
  `checks/gap-fill.py` §9 rewritten (58 assertions); qa and the suite
  battery re-run green.

### v3.54 — Send an email opens on what went (§144)

Islam: *"The opening page ... should be a dashboard of what was sent, to whom,
how many people ... and when I say create a message it takes me to another tab
... and when I finish and send it it should take me back to the dashboard and
show me that the message was sent there."* And: *"change messages to
Overview."*

- **Two subtabs** — **Overview** and **Write a message** — in the platform's
  own section row, not a page with a button that navigates.
- **Overview is the record**: drafts under *Not sent yet*, then what was sent
  with heading, when, **who it went to** (in the platform's own words for roles
  and places), how many it reached, and by whom. A row still opens what
  happened to each person.
- **Sending lands back on the Overview** with a green outcome band and the
  composer emptied. A partial failure lands there too; only a send that never
  happened stays put, in red, with the message still loaded.
- **No grey descriptions** on either tab, and the two header dropdowns are
  gone. The one sentence carrying a real fact — that the audience criteria add
  up rather than narrow — moved to the heading's hover.
- **§143 is superseded**: *Write another* and the bar's outcome line go, and
  `checks/send-said.py` is deleted rather than left red. Its surviving rule —
  a send cannot be repeated by one press — now holds by construction.
- **A loud control for the action** (§144.8): **Send an email**, above the
  lists. Both the placement and the word are Islam's, picked from three drawn
  in the real page, and both costs were stated before he chose — the button
  scrolls away on a long record, and the platform now has three nouns for one
  thing. Drawn only on the Overview, asserted at both ends.

**The bug it cost:** both list fetches were gated on `#msgsend`, the Send
button, which now lives on the other tab — so on the Overview neither list was
ever asked and both said *Asking…* for ever. Found by driving the built page,
not by reading the diff. Three other checks held the same stale selector and
were fixed (§51.11).

**Proved:** `checks/send-overview.py`, watched to fail first — the fetches
re-gated on `#msgsend` → 3 failures; the return-to-record removed → 8. `qa.py`
green with no console errors; `send-message.py` and `email-greeting.py` green
after being taught about the tabs.

**On the branch only — not merged to main.**


### v3.54 — the bar reports, and moves on (§143)

Islam, using the product: *"When I send I don't get any verification that the
message was sent and the page stays the same view."*

**The send was working.** Established first, by driving the built platform and
sending a real message through its own controls. Two faults after that moment,
both pre-existing §95 code:

- **Success was written in the failure-neutral voice.** The words were there —
  in 12px, the page's quietest grey. `reallySend()` works out `ok: !j.failed`,
  stores it, and nothing ever read it: a *failed* send turned red, a successful
  one got no colour at all.
- **The loudest control still said not-sent.** The orange button read *Send to
  76 people* and was live — one press from sending the whole thing again, with
  nothing on screen to say it had already gone.

Now: the outcome reads in `--good-tx` / `--bad-tx` at `--fs-note`, and the CTA
becomes **Write another** (clears the message, keeps the audience). `sent` is
its own flag, because a refused request and a partial delivery both read
`ok:false` and only one must lock the button. Both buttons are drawn with one
hidden, so the way back needs no repaint — the message is typed *into* the
preview and a repaint would kill the caret mid-word.

**Found while building it (§142.8):** the greeting was being emitted *inside*
`data-mail-body`, the editable region — so one keystroke in the message
absorbed *"Dear Ahmed,"* into the body text, and the email would have carried
the greeting twice with the wrong person's name for every other recipient.
Moved outside; three assertions added.

**Proved:** `checks/send-said.py` — the assertions that matter are that the
send cannot be repeated by one press (asked by pressing where Send was and
counting requests) and that the way back exists with the caret intact. Watched
to fail first: the pre-§143 bar → 5 failures; `sendmsgTouched()` removed → 2.
`qa.py` green; `send-message.py` and `email-greeting.py` green;
`test-email-greeting.js` 37/0; `test-authorize.js` 212/0;
`test-mail-contrast.js` 16/0.

**On the branch only — not merged to main.**


### v3.54 — the email greets its receiver (§142, spec 022)

Islam: *"can we make an option while sending the email to customize the email
by the first name of the reciever like starting the email with Dear Ahmed ...
it's a turn on and off option."* Settled by question-and-answer, then from a
mockup of the real composer, then **corrected once by looking at it**.

- **A per-message switch on Send a message**, off by default, with the greeting
  word editable per message (starting at "Dear"). Send a message only —
  including *Send me a copy*, which greets whoever is **signed in**.
- **Every recipient already got their own email** (§74.3), so nothing about how
  many go out changes; what changes is that they stop being identical. The
  builder leaves a **marked region** and the server fills it once per recipient
  off the stored register.
- **The first name kept whole** — "Dear Abd El Moniem", never "Dear Abd" —
  using the register's own name reader, so there is no second definition.
- **Never "Dear ,":** a row whose name yields nothing loses the greeting LINE,
  and still receives the message.
- **One line, no prose** (Islam's correction to a two-line first draft), with
  the word box before the switch so the switch never moves.
- **Migration 027**: one nullable `greet` column on `messages` and
  `message_drafts`. NULL is off; nothing backfilled.

**The bug it found:** `SYNC.mailSend()` names every field it forwards, so
`greet` was silently dropped — the emails would have been personalised
perfectly and **the record would have said no message ever greeted anybody**.

**Proved:** `test-email-greeting.js` 37/0 (a real Postgres, standing in front
of the provider via the new `SMP_RESEND_ENDPOINT`, reading what each recipient
was actually sent); `checks/email-greeting.py` 38/0 (the screen and the seam,
over HTTP). Both watched to fail first — 8/2/2 and 2/3. `qa.py` green, no
console errors; `send-message.py`, `setup-pages`, `setup-rail`, `setup-search`,
`office-chat` green; `test-authorize.js` 212/0; `test-mail-contrast.js` 16/0;
round trip and clean parity PASS **on virgin databases**.

**On the branch only — not merged to main.**

### v3.51 — Wave 1 of the UI/UX audit: the destination row scrolls (§136)

- **From the platform-wide audit** (branch `claude/platform-ui-ux-audit-4pf8e5`;
  plan and Wave 1 mockups under `design-mockups/`). Islam chose the scrolling
  row over the wrap-and-grow chrome (“Decision 1: B”) from live screenshots of
  the real build at 1024.
- Below ~1280px the row wrapped inside a 46px box, so the second line painted
  over the tab row and on some pages ate its clicks (§118.7, seen live at
  1024). Now the destinations scroll in one line; the Group menu, the
  Units | Functions switch and the gear are pinned outside the scroll region;
  fades show each side only while that side has more; the lit destination is
  scrolled into view on every paint.
- `checks/nav-scroll.py` — fails 6 ways on the pre-§136 build, green here,
  with page-width, setup-rail, setup-header and the full qa.py sweep re-run
  beside it. **Not merged — on the branch awaiting Islam's word.**
- **§137 — a failed render says so on the page.** The guard sits on the page's
  render alone, so the chrome and navigation stay alive and the card's "open
  another page from the menu above" is true. Islam's words after revising the
  mockup: simple, friendly, one Reload button, the error folded behind a
  closed "Technical details". `checks/render-fail.py` fails 3 ways on the
  pre-§137 build — the production symptom verbatim.
- **§138 — the last 800ms survive leaving the page (closes §126.1).** One
  function in sync.js: on visibilitychange/pagehide anything waiting to save
  is sent immediately (keepalive under 64KB, plain fetch over). Touches no
  save bookkeeping, skips while a save is in flight (ordering), sends nothing
  when clean. `checks/save-flush.py` reproduces §126.1 end to end on the old
  build (0 posts, edit lost) and passes here; `test-roundtrip.js` re-run
  against a throwaway Postgres 16 — all PASS.


### v3.50 — the Setup header line, the marking table, and a repaired matrix (§135)

- Eleven asks from using the Setup pages. **Seven of them are one standard
  applied to sixteen pages**: the page's own search and buttons share the
  pinned line with its name, the `SMO` pill and every count chip go, the quick
  filters and the row count go the way the register's did, and the grey
  briefing paragraph goes everywhere.
- **§121.2 had left those controls on a row of their own for a good reason,
  and that reason forbade the FAKE move rather than the move** — a negative
  margin pulled a non-sticky row up under a pinned title and scrolling slid it
  out. Inside the header they pin with it.
- **Roles & access is repaired, and it had one cause** (§135.2): `.acgrid` is
  `overflow-x:auto`, so the BOX — not the page — is what its head pins against,
  and §121.4's 141px page offset pushed the header 141px down inside the table,
  onto rows three and four. The exact fault §121.4 wrote down about the
  register, on the one table its exclusion forgot. Repairing it made §117's
  *Own business unit* and *Own supporting function* headings readable for the
  first time since the split shipped.
- **Focus measures reaches supporting functions** in both of their shapes, with
  a segmented On|Off switch on the header line, a navigation-style destination
  row carrying each place's mark count, and one table headed like the register.
  The group's Focus board grows the same half, or the marks are stored where
  nobody can see them (§61).
- **Send a message → Send an email**, with the Email settings folded in as its
  second section (a status table, four fields, a live rendered preview and a
  test send: not a dropdown). **Inbox → Platform Inbox**, and Focus measures moves to *Measurement*.
- **A person's company is sometimes derived and sometimes stored** (§135.6):
  read-only wherever the unit has already answered it, written only where
  nothing else has, so two fields cannot contradict one stored fact.
- **A four-pixel slot was closed** (§135.10): `--sethead-h` was a guessed 46px
  and the header is 42–49px depending on the page, so scrolling rows showed
  through the gap between the two pinned headers. Published by a
  ResizeObserver now.
- `checks/setup-header.py` was proved able to fail first — **33 failures
  against the previous build** — and **two of its own assertions could not
  fail when written** (§113.8's blind spot, and `tr.getBoundingClientRect()`
  reporting the un-stuck layout).
- Verified after the merge: `qa.py`, setup-header, setup-rail, setup-pages,
  setup-search, register-header, focus-switch, role-picker, table-standard-all,
  no-wrap, and main's own band-corner, owner-picker and rail-standard all
  green; `test-authorize` 212/0; **round trip and clean parity on a virgin
  Postgres 16** (§113.7); contrast 52 failures, unchanged, none on the new
  surfaces.

### v3.52 — the Knowledge base in two tabs (§141)

How it works 9 | Questions & answers 43 — counts on the tabs, contents pills
per tab, the pen on the questions tab alone, the tour's replay with the
explanations, and the last-used tab remembered per browser. Server untouched.

**Verified:** kb-pen.py §0 (failed 4 ways with the default flipped) ·
knowledge-base.py re-taught to gather from both tabs after going loudly red ·
tour.py clean · qa.py ERRORS: none.

### v3.52 — the knowledge base gets a pen (§140)

The office edits the assistant's scenarios on the page they are read from —
approved from a mockup first. One precedence rule in `lib/rules.js` feeds the
page AND the assistant's corpus, so the two can never disagree; overrides ride
`org.extra`, delete on default, and the shipped wording is always one click
back. Standard entries can be rewritten but never deleted; own questions can be
added per group and removed. Typed text renders escaped.

**Verified:** driven against a real Postgres including the reload round trip ·
kb-pen.py ALL CLEAR, failing 2 ways with the rule broken · test-assistant 45/0
· test-authorize 215/0 · extract-kb --check in step · qa.py clean.

### v3.52 — the send says what is happening (§139)

The "glitch": with the assistant on, `say` holds its response for the model
round-trip, so the typed message sat in the box for seconds. Now it moves into
the thread the moment Send is pressed, the box empties, and a quiet *Asking
the assistant…* line shows until the reply replaces the echo. A failed send
puts the words back in the box; the poll skips a beat while a send is in
flight so it cannot erase the echo; a network failure says "That did not
send" instead of the browser's "Failed to fetch".

**Verified:** driven against a 4s-slow model and an aborted send ·
office-chat.py §13 permanent, failing 3 ways on the pre-§139 build.

### v3.49 — the register notices two people whose name reads the same (§131)

- Islam: *"notify me as an issue to address if 2 people their 1st 2 names are
  the same so I can edit one of them."* The pair now joins the **Attention
  queue** on the People register — the button counts them, opening it walks to
  each with the reason above the fields, naming the other person in full.
- **A notice, never a duplicate mark** (§87: a shared name is not one human),
  and it sorts last — collisions, declarations and missing identifiers stay
  worse. Anybody already flagged as a possible duplicate is left to that flag.
- **Amending one Name clears both**; a typed Name that still collides stays
  flagged, because typed values are never auto-lengthened (§81.1).
- Proved in `checks/duplicates.py` (watched to fail 4 ways on the pre-§131
  build), with `identity-merge`, `people-dialog`, `table-standard` and the
  full `qa.py` sweep green. Found on the way: the demo's two placeholder
  company CEOs genuinely read the same ("Company CEO,") and now say so.

### v3.47 — building a plan on the platform (§129, spec 020)

- **A second door beside Import**: *Build a plan* opens a chooser of every
  unit and function — with an honest Empty / Has-a-plan status, **Continue**
  on a part-built subject, and **Start fresh** behind a confirm that archives
  first through the import's own path. A new unit or function is created in
  the same place; a new function is asked *pillars or projects* at birth.
- **The builder band** under the tab row is a MAP: one chip per plan section,
  openable in any order, each chip reading the data (✓ / count / ○). Nothing
  is stored; pausing costs nothing. Finish opens a review that names every
  gap and jumps to it.
- **Every "+ Add" in build mode opens a form** asking the row kind's fields
  in the outcome's order (§116's dialog shape); the name makes Add live,
  gaps are named in amber and never forced; *Add & add another* for tables.
- **Five empty-state fixes** outside the builder too: the first "Who we are"
  line (unit and group), SWOT add/remove, the empty Plan page offering its
  first pillar, a virgin pillars function's first row actually writing, and
  a capability's key objectives gaining their first authoring surface.
- **"+ Add a business unit" asks a form now** — name, prefix, company — with
  the key minted from the name, `real:true`, and the weighting row minted
  from the factor list.
- Proved by `checks/plan-builder.py` (every control pressed, the DATA asked,
  able to fail twice — the second proof caught the check itself), plus the
  full `qa.py` sweep and the affected checks on the merged bytes.

### v3.46 — the deck's last gaps, and the overview's download (§128)

- **A tactic that names no quarter is ticked in bold red in all four**
  quarter columns — the template's four columns are untouched and nothing is
  merged. A tactic that names some quarters is left alone, as before.
- **Every plan deck ends on a Thank you slide**, matching the review deck.
- **The Function overview carries the download**, beside Edit — the other half
  of a capability function's strategy tab had no way to take the plan away.
- Proved by `checks/strategy-split.py` §5 (state made, merged-cell attributes
  read, the button pressed with a hit test), able to fail 3 ways.

### v3.46 — the settings, in the order you'd decide them (§127)

Asked to rethink the chat settings' sequence, titles and explanations. Settled
from a mockup made of that very panel, approved, then built. **882px → 478px**,
same seven controls, nothing removed, no stored key renamed.

- **The order was not one.** The master switch sat *third*, under a setting it
  governs; the two email rows sat five apart. It now descends from *does this
  exist* to *a tuning knob*.
- **Every explanation is a tooltip** that opens on **hover, focus or tap** —
  hover doesn't exist on a tablet, and these now carry the whole explanation.
- **A status is not an explanation.** *"No one is set"* stays on the page: behind
  a hover, somebody turns Handover email on, nobody is chosen, and nothing says
  so.
- **The bubble is anchored to the row, not the mark** — centring a 264px note on
  a 14px mark hangs it off a 392px dropdown, at seven different x positions.

**Verified:** office-chat.py §12 ALL CLEAR, asserting the *problems* rather than
the layout, each watched to fail first · qa.py ERRORS: none · test-chat 52/0 ·
test-assistant 33/0 · test-authorize 193/0. **One assertion was rewritten for
being unfalsifiable** — it measured the row against the panel, and a row is
inside its own panel by definition.

### v3.50 — the knob's guard keyed on words the provider never says (§134.5)

§134 shipped and went straight down in production: gemini-3.6-flash refuses
the thinking cap with the GENERIC "400: Request contains an invalid argument."
— and the self-healing retry only fired when the 400 named thinking, because
the stub imitated the documentation's verbose refusal instead of the
provider's real one. The guard now keys on the situation (a 400 on a request
that carried the knob), never the wording. Stub corrected to production's
verbatim words; the shipped guard reproduces the production failure 2 ways in
the suite; 39/0 after.

### v3.49 — the thinking cap (§134)

§133's 20s budget blew on its first preview run — the same model, the same
question, under 12s the hour before. Reasoning time is a lottery, so the fix is
not a bigger timeout: **thinking is capped at nought**, because answering from
a corpus that is in the prompt is retrieval, not reasoning. And since the
knob's contract on future models is unknowable, **a 400 naming thinking drops
the knob and re-asks once**, remembered per process — a config knob must never
be what takes the assistant down. Bad keys are never retried into.

**Verified:** test-assistant 38/0 (retry watched to fail — 2), test-chat 52/0,
built file byte-identical. The preview URL's CSP console error is Vercel's SSO
layer fetching the manifest — harmless, absent from production (§134.3).

### v3.49 — the reply that never came back (§133)

Every diagnostic row green, and still no reply in the chat. The diagnostic and
the conversation share one code path; what differs is time. Two budgets fixed:

- **The function outlives the model now** — the model timeout was 12s inside
  Vercel's default 10s function cap, so a slow answer had the whole function
  killed under it after the message was stored and before any reply or handoff
  could be written. `api/*.js` gets 30s; the model gets 20.
- **Thinking counts** — Gemini 2.5+ bills its reasoning against
  `maxOutputTokens`, so the 700 cap could be eaten whole by thought and the
  truncated JSON read as a failure, which by design writes nothing. Now 2048.
- **Failures reach the operator** — one `console.error` with the provider's own
  reason, into the Vercel function log. The person's silence (§112.2) is
  untouched; proved by driving a real `say` against a quota-refusing stub.

**Verified:** test-assistant 34/0 · test-chat 52/0 · the say-path failure
observed in the log with the provider's reason while the send still succeeded ·
built file byte-identical (server-only).

### v3.49 — the key was right, the model was retired (§132)

The re-issued key WORKS — Google's 404 proved authentication passed — and the
404's own text named the last problem: `gemini-2.5-flash` is retired for new
users. SF keeps using it on its old project; SMP's fresh project cannot. The
default moves to `gemini-3.6-flash` (Google's recommendation, verbatim);
`GEMINI_MODEL` still overrides.

And §126's shape row called the newer `AQ.`-prefixed key "a different kind of
credential" while the provider accepted it one step later. Both Google shapes
are recognised now; an unmatched one reads UNRECOGNISED, never wrong — a
heuristic never overrules the provider.

**Verified:** test-assistant 34/0, the new assertion watched to fail · both
cases driven end to end through the diagnostic · built file byte-identical
(server-only, no SHELL bump).

### v3.48 — §126 resolved: the key was not the key (redeploy commit)

The diagnosis held. Comparing against Strategy-Formulation's working Gemini
setup showed the two projects byte-equivalent on the wire — same env name,
same model, same endpoint, same header — so the only remaining difference was
the stored VALUE in this project's Vercel environment. Islam's own AI Studio
chart agreed: SMP_Key had accepted a real request, while the deployment's copy
was refused, which means the deployment held a different string.

Islam deleted and re-added `GEMINI_API_KEY` in Vercel. **This commit exists to
trigger the build that bakes it in** — a deployment only carries the variables
that existed when it was built, and editing one changes nothing until the next
build. Proof on screen after deploy: Test the assistant → the key row's length
and first four characters match SMP_Key, and the model row reads WORKING.

### v3.46 — which key, without saying which key (§126)

The diagnostic read *switch WORKING · knowledge base WORKING · key PRESENT*
with Google still refusing the key. **"Rejected" and "that's not the key you
made" send you to two different websites**, and nothing on screen could tell
them apart.

The key row now reports its **length and first four characters** — an AI Studio
key is `AIza` plus 35, so any other shape is a different kind of credential
entirely — and names the Vercel trap: a deployment only carries the variables
that existed when it was **built**.

**Recorded and deliberately not fixed:** the autosave is debounced 800ms with
**no flush when the page goes away**. Press a switch, leave 150ms later, and
nothing is saved while the screen shows the new value. It affects every setting
in the platform, and it was **not** the fault being chased.

### v3.46 — a handoff the person can see (§125)

*"Nothing happens at all"* — with the assistant on and a key the provider now
accepts. That was §104 working exactly as designed, and that is the problem.

- **A handoff wrote nothing**, so the person saw a screen identical to the one
  they'd see if the assistant had never been asked. §123 separated four
  failures for the *operator*; this is the same fault on the *person's* side.
- **One line now says so** — the product's words, never the model's — and the
  conversation **stays waiting**, so the office's queue, the Waiting tab and
  the email chase are unchanged.
- **Narrated, not spoken**: no name, no bubble, no way out button. The two
  sides of the conversation are the person and the office; a handoff is
  neither, and somebody is already coming.
- **A failure still writes nothing.** No key, a refusal, a timeout, malformed
  JSON, the switch off — all unchanged. A handoff is a decision; a failure is
  not, and saying otherwise would mask the faults §123 exists to surface.

**And a test was found reading a setting it did not control** — `test-chat.js`
failed five assertions after a restart and passed on the next run, which looks
exactly like a race and is not one: with the assistant on, her message comes
back with a second row beside it. An hour went into hunting a product race that
did not exist.

**Verified:** test-assistant 28/0 and office-chat.py ALL CLEAR, each new
assertion watched to fail first (2 and 3 failures respectively) · one assertion
thrown away for being unfalsifiable (§94.5) · test-chat 52/0, twice running ·
qa.py ERRORS: none · test-authorize 193/0 · extract-kb --check in step ·
migration 026 applied to a **virgin database**, round trip PASS (§113.7) ·
contrast measured by hand at 5.00 light / 6.61 dark, because the chat panel has
never been in the sweep at all.

**Flagged, not fixed:** `.chbot` and `.chout` have no CSS anywhere — the
way-out button under an assistant answer is a bare browser button. A visual
decision on a surface this work was not asked to touch.

### v3.46 — the diagnostic contradicted itself (§124)

The first thing §123's button reported was **"It is not working — the model"**
with *The API key · **WORKING*** in the row directly above the provider's
*400: API key not valid*. Two rows on one screen disagreeing, both written by
the diagnostic.

- **A status word is a claim.** `configured()` only checks that a variable is
  non-empty; the word *working* claimed the provider accepts it. That row reads
  **PRESENT** now, and a step may choose its own word wherever the state's
  default would overclaim.
- **The refusal is reported against the key, not the model.** Google answers a
  bad key with **400**, so the generic branch had caught it —
  `looksLikeBadKey()` reads 401, 403 and the provider's own words, and the row
  is *The key itself*, naming the three causes that produce a correct-looking
  key the provider refuses.
- **Two of those can no longer happen**: `apiKey()` trims and strips
  surrounding quotes, because a value that only works when it is clean should
  be cleaned by whatever reads it.
- **The headline spells its own field names** — `toLowerCase()` had turned
  *The API key* into *the api key*; only the leading article moves now.

**Verified:** office-chat.py ALL CLEAR with three new assertions, each watched
to fail first (3 failures against the previous build) · all five real states
driven end to end against a Google stub, each landing on the step it belongs
to · qa.py ERRORS: none · test-chat 52/0 · test-assistant 25/0 ·
test-authorize 193/0 · extract-kb --check in step.

### v3.46 — is the bot working? (§123)

Islam turned the assistant on, asked it something, and nothing came back — but
the message reached the inbox. That was the designed degradation working, and
it is precisely why he could not tell it from the assistant never being asked.

- **Four failures looked identical**: no API key, a rejected model, an
  unreachable provider, and a genuine decline.
- **The diagnostic walks the chain and names where it stops** — a button in the
  Messages Settings dropdown, where you stand after flipping the switch.
- It makes a **real call**, and stores nothing.
- The **Vercel trap is named in the row**: a deployment only has the
  environment variables that existed when it was built.

**And it rendered perfectly and did nothing** — the branch went into the
menu's `change` listener instead of `click`, and a `<button>` never fires
`change`. Every assertion short of pressing it passed.

**Verified:** office-chat.py §10 ALL CLEAR (asserts the diagnostic *separates*
outcomes, not that it appears) · all five real states driven end to end against
a stub modelling Google · qa.py clean · test-assistant 25/0 · test-authorize
193/0.
### v3.41 — the CF tab (§118)

**§118 — reported from production.** *"The CF tab is not showing anything
while it was showing it a minute ago."* Reordering a measure or tactic with
the pen on counted the "+ Add" row, appended one phantom entry per drag, and
the autosave wrote it as a `null` into the pillars function's plan blob —
from the next hydration on, the function's page threw mid-paint and the tab
read as dead, with the error only in the console. Fixed at the commit
(`makeSortable` counts data rows only), backstopped (`applyOrder` refuses a
non-permutation), and healed for tenants that already saved the poison
(`fnPruneNulls()` at the hydration door — CF comes back on its next visit,
nothing was lost). The tour is no longer offered to the office (§118.5).
`checks/reorder-integrity.py` fails 16 ways against the previous build and
is green on this one; qa.py and the full battery green on the merged build.
Flagged, not fixed (§118.7): a dead render still says nothing on the page;
the wrapped destination row eats clicks below ~1100px; no-jump.py's
"sorting a column" trial fails on main's own build.

### v3.39 — the register stops being a form (§116) — another session's

- Merged from main during this release: the People register edits in a dialog,
  the attention chips become one queue, the quick filters go. See §116 in the
  decisions document; its checks (people-dialog and the reworked register
  checks) ride in this repo and are green on the merged build.

### v3.41 — the deck names its gaps, and the base becomes the office's (§118)

- **The plan download says `Missing` in bold red** wherever the plan owes
  something, and draws the Foundation, SWOT and capability slides even when
  they are empty — a skipped slide says "nothing is missing here".
- **The tactics table becomes four quarter columns** (Q1–Q4) with a mark in
  the ones in action, the shape the plan workbook already has.
- **The pillar rail opens collapsed**; only an explicit press turns it off.
  The rows-to-check alarm survives the collapse (§106.2 is preserved).
- **The knowledge base is the office's** — Super user and SMO team — reversing
  §30/§37. Cost recorded: the tour's replay button is no longer reachable by
  the people it fits; the first-run tour is untouched, and where that button
  should live is an open question.
- **Not reproducible and asked instead**: "for the projects there is no arrange
  or download" — measured on live production, the office gets pen + download
  and a function head gets arrange + download.

### v3.40 — the Strategy | Reporting split, and the plan as slides (§117, spec 019)

- The Roles & access table's own columns are two halves each — **Strategy**
  (Foundation · SWOT · Plan; a capability's definition and projects) and
  **Reporting** (figures, drafts, submitting). Strategy edit ships with the
  office alone; **the SMO can open it to a role deliberately** (Islam's
  choice). A stored grant on the old key keeps meaning the Reporting half, so
  nobody's rights move on upgrade and no migration runs.
- §101's reorder arrows survive the split (they ride the Reporting grant), and
  strategy-at-none hides the pane, the arrows and the download together.
- **Download the plan as slides**: a button beside the pen on the Strategy
  panel builds a real editable `.pptx` — plan content only, SWOT included, no
  reported figures — for the office, the BU owner, the custodian, and a
  function's head. Offline, no new dependency (the platform's own zip writer).
- Proved by `checks/strategy-split.py` (both ends, both directions, the file
  unzipped and read, proved able to fail three ways), `test-authorize.js` §15
  (212 assertions), the full check suite and `qa.py`.

### v3.37 — the assistant (§111, §112), and a chat that vanished (§113)

**§113 — reported from production.** *"I replied and the chat disappeared from
all places."* Nothing was deleted: replying marks a conversation answered, the
inbox opens on Waiting, and Waiting excludes answered ones — so replying
removed the row from the list the office was looking at. Two correct decisions;
nobody had asked what they do to each other.

- **The conversation you have open is exempt from the filter**, and only that
  one. Waiting still means Waiting.
- **An empty list names where everything went** instead of being a dead end —
  and the Flagged tab stops claiming there are no conversations when there are.
- A handler that lit tabs by comparing nodes would have un-lit all three when
  the new shortcut was pressed. Lit by value now.

**Verified:** office-chat.py §9 ALL CLEAR, proved to fail (3 failures) with the
exemption removed. Reproduced against a real database before and after.

### v3.37 — the assistant (§111, §112; spec 016)

**§111 — the corpus.** 43 task recipes in `src/recipes.js`, as data, rendered
on the Knowledge base page and read by `scripts/extract-kb.js` into
`db/kb.json`: 9 sections, 26 page explainers, 43 recipes, ~9,800 words.

**§112 — the assistant answers first.** Gemini, at Islam's choice.

- **Off is the default**, and off means the model is never called — enforced in
  `say` on the server, asserted as a call count of zero.
- **Order is the robustness argument:** the message is stored and the thread is
  already waiting before the model is asked, so every failure lands on exactly
  the chat as it worked before.
- **The handoff is a flag**, not a sentence — `{answered, reply, source}`.
- **Every answer carries a way out**, for the case the spec did not cover: the
  assistant being confidently wrong.
- `bot` and `source` columns (migration 024); an answer never wears a
  colleague's name.
- A handoff can email a named representative — its own switch.

**Verified:** `scripts/test-assistant.js` **25 passed, 0 failed** against a real
Postgres and a stub that models Google · office-chat.py ALL CLEAR ·
knowledge-base.py ALL CLEAR · test-authorize 190/0 · qa.py clean.

**Waiting on:** `GEMINI_API_KEY` in Vercel. Everything is built and tested
against a stub; the live call is the only unexercised path.

### v3.38 — the pen's last read-only fields, and a repeating project (§114–§115)

- **§114:** a measure's direction and compile, and a tactic's quarters, are
  editable behind the plan pen — §31's read-only reason expired with §94. The
  Temple's own vocabulary; quarters as pressable marks; all three proved to
  WRITE (§96).
- **§115: a repeating project.** CX-mystery-shopping-shaped work is marked
  *Repeats: each cycle* from the front matter pen. On a new cycle it is
  archived, cleared and its dates shift one cycle forward (rhythm kept,
  adjustable); an **unmarked project now keeps its figures** — before this,
  every project was wiped on every new cycle, a landmine the live tenant had
  not yet stepped on. The archive also stops storing a deliverable's deleted
  `actual` and starts keeping the milestone's `pct` (stale since migration 024).

- **§114.4: the remove button's seat.** The row-removing × wrapped under its
  field (`.fld` is `width:100%`) and cost every editable row 20px. Islam picked
  **beside the field** over inside it — inside an input, an × means clear the
  text, not remove the row. Keyed on the pair (`td:has(> .fld + .xbtn)`), so
  every table using the pattern is seated at once.

**Verified:** `plan-fields.py` and `repeat-project.py` all passed, the second
failing three ways on the pre-§115 build before its green was believed ·
test-authorize **195** · full battery + qa.py clean · §114.4: pairs share one
line and the × is hittable at its centre, proved able to fail (width rule
removed → 1 FAILED).

### v3.34 — a project's front matter (§109)

Islam: *"any project needs 3 things at its starting part — the brief,
stakeholders, start and end date."*

- **The start and end were stored and shown nowhere.** They appeared in exactly
  one place in the whole product — the review deck — so the page that *authors*
  a project could not say when it runs.
- **One box, divided:** owner · start · end down the left, the brief and the
  stakeholders as two labelled rows on the right. Settled from a mockup made of
  the real platform, over two other arrangements.
- **Deliberately not a `<table>`.** The platform's global
  `table { min-width: 620px }` makes any small table overflow its own grid track
  by 300px — Islam caught it in the mockup, and the column was 320px throughout.
- **Both value columns start at one x**, which was the ask: each column's label
  track is sized to its own longest label, and a pill's leading margin is pulled
  back so the chip's border meets the brief's first letter.
- **The Timeline pill is gone.** It once decided how every date was read; §104
  ended that, and its one remaining effect was to *suppress* a true overrun
  warning. The field and the import template are untouched.
- **Plan pane only** — Performance and Reporting show no dates, confirmed as
  right by Islam rather than assumed.

**Verified:** new `src/checks/project-header.py` **all passed**, both halves
proved able to fail first (an `auto` label track reproduces the exact
misalignment, 627 vs 687; wiring one field to a bare `<input>` fails twice) ·
every other check clean against the merged build · qa.py clean.

### v3.32 — the onboarding tour (§107, spec 017)

A first-sign-in guided tour on demo data: the page dims, what matters stays
lit — the one button that says where you are, or a section button together
with its content — and a short card explains it. **Two stories** (strategy
custodian; unit / function owner), told wherever the person actually works,
on a unit or on a function. Next and Back only; **one exit** through the ×,
which asks *Don't show again* or *Skip for now* with a way back for a stray
press. Replay from the Knowledge base. Memory in the browser only.

Settled over **four reviewed revisions of a working mockup** before a line of
`src/` was touched — and three of the five decisions are reversals of
something drawn first, none of which could have been argued in the abstract:
the interactive click-the-real-button tour was built and then reversed
(§107.2), Skip tour was removed in favour of the × asking (§107.3), and the
spotlight narrowed from the whole navigation row to the one button that says
where you are (§107.4).

Built with `src/tour.js` + `tour.css`, mounted outside every region `paint()`
rewrites, holding selectors rather than nodes, navigating by pressing the
platform's own controls, and reading roles through the platform's own
`personRoles()`. `src/checks/tour.py` walks every story as every role —
custodian on a unit AND on a function, owner of a unit AND head of a
function — and was **proved able to fail before its green run was believed**
(§107.10); the first deliberate break was a no-op and caught nothing, which
is §94.5's own fault repeated.

Found by measuring rather than reasoning: a step that disagreed with itself
once a function walked it (§107.7), a tenant's label inflected into *"the
pillarss"* (§107.8), and a contrast measurement proved real by wrecking the
card's text and watching it report 1.6:1.

Corrected after Islam replayed it (§107.14): the tour now takes you to the
main page before the welcome card, rather than drawing it over the Knowledge
base — and the dataset swap moved ahead of resolving where to tour, because
`own` was being read from the client's own tenant and looked up in the demo
tenant's navigation. The check had asserted the tour was *running* and stopped
there; **"it started" is not "it went anywhere"**, and it now asserts a
destination is selected, the Knowledge base is off screen, and there are tabs
to tour.

**Waiting on Islam:** the owner story's copy. The custodian's is his, word
for word off the signed-off mockup; the owner's is mine until he has read it.

### v3.30 — reordering comes back (§101), and focus gets a switch (§102)

Two small independent changes, both agreed in words first.

**§101 — reordering comes back**, reversing §94.3. `mayArrange()` is a separate
rule, not a widening of the authoring gate: the plan's order is the unit's, its
words stay the office's. BU owner, strategy custodian, function head; never a
contributor. `lib/authorize.js` learned to tell a reorder from a rewrite. The
control is up-down arrows in the pen's slot — Islam's pick over the grip mark.

**§102 — focus measures get a switch.** Off hides every surface and keeps every
mark; on restores them. Stored as an absence (`GROUP.focusOff`), so an unasked
tenant and one switched off and on again are byte-identical. The switch is the
SMO's alone while marking stays the CEO's, and the page carrying it survives
being switched off (§61).

**The bug worth remembering:** the switch was wired, the rule was written, and
flipping it did nothing — `worldOf()` and `W()` are **two allow-lists, one
behind the other**, and a group key must be named in both. Silent, and in the
safe-looking direction. Found by driving the page.

**Verified:** test-authorize 165 → **190, 0 failed** · new
`src/checks/plan-arrange.py` and `src/checks/focus-switch.py` **ALL CLEAR** ·
qa.py clean · all four failure modes proved to fail before being trusted.

### v3.32 — the plan's own shape, one row, and a function that submits (§103–§106)

Four sections of one thread: the project tables rethought from the plan
outwards, then the two things that thread turned up.

- **§103 · The plan's own shape.** A milestone keeps a **name and** a
  description; a deliverable gets a **due date** back (some land before the
  project ends). Dates are read, never refused — `Done` and `Pending` in a
  due-date column are **named as what they are**.
- **§104 · One table, one row shape.** §99's split is undone for a better
  reason: giving a deliverable a real direction (`=`) and target (`Y/N`) means
  the cells it left empty now have answers. Reporting is **Not started / In
  progress / Delivered**, the per-cent typing itself at both ends. The score
  column is **Performance** on deliverables and outcomes, **Progress** on
  milestones — `%` is a unit, not a name.
- **Not due is a label, not a lock** (§104.8). The comment said so from the day
  it was written and the code did the opposite: a not-due row had its picker
  **replaced** by a word, so reporting early was the one act the pane refused.
- **An In progress with no number is not nought** (§104.10). It read **0**, so
  the average counted it and a project's figure fell the instant a dropdown
  changed. It leaves the average now and the row is marked *Needs a %*.
- **§105 · A supporting function submits**, and everything except the button
  was already built — the server has carried an explicit `fn:` branch since
  spec 006. The dot on that tab had been asking for a submission nobody could
  make. It refuses on a row owing a per-cent or a red figure with no note, and
  the SMO's cycle board carries the functions.
- **§106 · What the merge does to a plan already uploaded.** Nothing is
  deleted. **Execution rises 8–27 points on every capability**, because an In
  progress milestone stops counting as nought — so the card now prints
  `5 of 12 milestones · 2 not counted yet`. And a bad due date in a plan
  **already stored** is finally noticed, named by value and row, with the count
  on the rail.

**Verified:** `src/checks/project-tables.py` all passed, every new assertion
proved able to fail first · test-authorize **184, 0 failed** · qa.py clean ·
main's `plan-arrange.py` and `office-chat.py` ALL CLEAR against the merged
build. **Not run: migration 024 against a real Postgres** — score-preserving by
construction, formula parity asserted, SQL never executed against a live schema.

### v3.30 — reordering comes back, as its own grant (§101)

Islam is giving arrangement back to unit people, reversing §94.3.

- **`mayArrange()` is a separate rule**, not a widening of the authoring gate —
  the order of a plan is the unit's; its words stay the office's.
- **Who:** BU owner, strategy custodian, supporting function head. Never a
  contributor; a group or company CEO only if they hold one of those.
- **The authoriser learned a new shape.** `same(idsOf(a), idsOf(b))` is an
  ordered comparison, which is why §94.3's drags were refused silently.
  `reordered()` answers by set and classifies as `arrange`.
- **The control** is up-down arrows in the pen's slot — Islam's pick over the
  grip mark — and is never drawn beside a pen. Settled from a mockup made of
  the real platform.
- Performance and Reporting needed nothing: the order **is** the array.

**Verified:** test-authorize 165 → **181, 0 failed** · new
`src/checks/plan-arrange.py` **ALL CLEAR** (five viewers, both ends, the button
pressed, 0 → 13 handles) · qa.py clean · both failure modes proved to fail
before being trusted.

### v3.29 — the corner, corrected again (§100.4, §100.5)

Three more notes from using it, and one of them turned out to be three.

- **Clicking outside minimises the panel**, on `pointerdown`, with the dock and
  an open modal deliberately not counting as "outside" (a screenshot opened
  *from* the panel renders into the platform's overlay). **Escape now works from
  anywhere** — it had been wired on the composer alone, so it did nothing once
  focus moved. A half-typed message survives all of it.
- **The bubble is not drawn while the panel is open**, which is what puts the
  panel's bottom edge 18px from the window's instead of a bubble's height above
  it. CSS off the class the opener already sets, not a second piece of state.
- **The office's inbox follows the window.** It stood at a fixed 593px, so on a
  short screen the reply box and Send fell below the fold — 506px of page scroll
  at 700px tall, measured before touching it. Now `calc(100dvh - --chin-top -
  20px)` with a 340px floor, and the scrolling moved inside the two panes.

**Verified:** office-chat.py **ALL CLEAR** with a new section 8 sweeping four
window heights · the fix proved by putting `height:593px` back and watching
section 8 fail at 660px and on the sweep · qa.py clean.

**The assertion that matters is that the box MOVED with the window.** Every
other one of section 8's — Send on screen, the thread scrolling in its own box —
passes on a tall window with the fixed height back in place, which is exactly
how this shipped. And the stub had to grow a conversation of twenty messages
before any of it could be measured: the office's page had never once been
opened with a thread in it, so the inbox drew "Pick somebody on the left" and
there was nothing to look at.

### v3.28 — the corner, corrected by using it (§100.1–§100.3)

Three notes from Islam within minutes of v3.26 reaching production, all from
having it open rather than reading about it.

- **The captured context line is gone everywhere** — §97.4 reversed. Not hidden
  from the sender: the helpers, the icon, `BUILD_ID` and the build stamp are
  deleted, and **migration 023 drops the four columns**. The composer's
  "the page you are on is sent with your message" went with it.
- **The × is a minus labelled Minimise.** Nothing was ever closed — one
  conversation per person, permanent.
- **A reply announces itself.** A third cadence (15s) while the conversation is
  waiting, back to 180s once answered, and a one-shot ring on the bubble.

**Verified:** office-chat.py **37 checks ALL CLEAR** (the context assertions
inverted to assert absence) · test-chat.js 52/52 · settings drive 21/21 · chat
drive 25/25 · test-authorize 165/165 · test-roundtrip on a virgin database all
PASS · migration 023 applied and the columns confirmed gone.

Two things the checks caught that reading would not have: the announcement
compared the arriving count against a value it had already overwritten, so it
could never fire; and the check's stub answered `thread: null` where the real
server returns `{waiting:true}`, so correct client behaviour read as broken.

### v3.27 — the chat gets a switch, and a poll gets cheaper (§98)

Two asks, one subject.

**What a poll was costing.** Measured, not estimated: one poll was **14
database round trips**, of which **ten were `ensureReady()`** re-running the
whole schema and both migration phases on every request. Memoised per process:
**14 → 5**, and that helps `/api/state` as much as the chat. The client also
**stops polling entirely while the tab is hidden**, and the idle beat goes from
60s to 180s.

The two real limits are worth knowing and neither is a request quota:
**Vercel's Hobby plan is not licensed for commercial use** (a licence term, so
a client deployment wants Pro whatever the volume), and **Neon's free compute
never autosuspends while anything polls** — one signed-in tab keeps the
database awake whether or not a word is written.

**Five settings**, in a dropdown on the Messages page header: on/off,
Live/Relaxed, the promise the panel shows, screenshots, email-when-away. Off
removes the corner everywhere, stops all polling, and turns the office's reply
box off with it — nothing is deleted, and the page stays in the rail so it can
be turned back on.

**Verified, and how:**

- `scripts/test-chat.js` — **52 checks, all clear** against a real Postgres,
  including every setting enforced **on the server** with the corner not drawn.
- `SMP-Project-Folder/src/checks/office-chat.py` — **29 checks, all clear.**
- Browser drive of the settings — **21 checks**: the menu, each control, the
  corner going and coming back, and the tenant storing **nothing at all** once
  everything is back at its default.
- `scripts/test-roundtrip.js` on a **virgin** database — clean slate PASS,
  round trip PASS, fixed point PASS. (It first read FAIL on a database I had
  already run it against; the assertion only holds on a first deployment.)
- `qa.py` — **ERRORS: none**. `test-authorize.js` — 165 passed.

### v3.26 — talking to the Strategy Office (§97, spec 015)

A bubble in the bottom-right corner of every page opens **one running
conversation with the office**. The office answers from **Setup › Running the
cycle › Messages**: who is waiting on the left, the conversation on the right.

**It is §71 finished, not a second feature.** That section built the endpoint,
two tables, the reply thread, the screenshot handling and the access rules —
and the box that was meant to sit in that corner was never drawn. This is that
box, reshaped from a form into a conversation, so `022-office-chat.sql` drops
`feedback`/`feedback_replies` (no human could ever reach them) and
`api/feedback.js` goes with them.

What was settled with Islam before anything was drawn:

| | |
|---|---|
| one box, or two? | **one** — the chat absorbs §71's feedback |
| who is written to? | **the office**; replies are signed by a name |
| does it leave the platform? | **only when the person is away** |
| where does the office answer? | **Setup › Running the cycle › Messages** |
| what is the unit of work? | **the person**, not the ticket |

**Verified, and how:**

- `SMP-Project-Folder/src/checks/office-chat.py` — **20 checks, all clear.**
  Serves the built file over HTTP with a stub `/api/chat`, because the whole
  feature is invisible over `file://`. Covers the corner being *pressable* (not
  merely present), the captured page reading in the navigation's own words, a
  poll not eating a half-typed message, and the three states where **no bubble
  is the pass** — a projector, `file://`, and a refused session.
- `scripts/test-chat.js` — **36 checks, all clear**, against a real Postgres
  with the dev-server running. Signs in as a second person holding **no role**
  and has all seven of the office's actions refused, checks the refusal does not
  name a role, and asserts **both sides** of the presence rule.
- `qa.py` — **ERRORS: none** across the whole product. It is also what caught
  the office's Setup page fetching `/api/chat` over `file://`.
- Driven end to end in a browser against Postgres: sign in, write from the
  corner, answer from Setup, watch it come back to the corner — **25 checks**.

**Waiting on nothing.** One thing is recorded rather than fixed: with no
scheduler on Vercel, "are they away?" is decided at the moment of replying, so
somebody who shut their laptop thirty seconds ago gets no email. The office is
shown which way it will go before pressing Send. A proper sweep needs a cron
entry in `vercel.json`.

### v3.24 — the floor stops being a role, and the password column stops lying

Four of Islam's, from using the register (§93).

- **Employee is no longer a role.** *"Anyone with no role is employee — it
  doesn't give the person anything, so let's remove this strange role."* It was
  never granted, only derived, so the chip could not be taken off. The floor
  itself stays and is still the client's to set: **Everyone else** on the access
  matrix, marked as not a role, under the key it always had.
- **The password column was never asked.** Nothing was lost — `credentials` is
  its own table outside the state graph. The fetch was gated on the page's old
  edit pen, which spec 012 removed, so the column showed the dash that means
  *not asked yet*. It asks on the register now, and says **unreadable** with the
  reason when the ask fails, rather than showing the same dash.
- **The Unit cell is an ordinary value**, not a chip.
- The role chip's place label stays, on his instruction — it is already
  suppressed where a role has one possible place (§92).
- **A note about the units nobody is keeping**, on the register beside the
  other counts, because that is where a custodian is given. A retired person
  does not count as one. Adding it pushed *Register file* off the pane —
  `.hright` never wrapped — which is now fixed and asserted by pressing the
  point rather than asking whether the button exists.
- **The merge receipt is the wizard's last step**, not a panel left standing
  under the table: *"this page is a table page, not for other notifications."*
- **Name and Full Name are two columns.** *Name* is what somebody is called —
  two names, stored and correctable — and *Full Name* is what the employee file
  holds, in its own hideable column. It reverses half of the previous day's
  answer and gives most of the width back: the frozen column is 216px, not 392.
  Files written before today still read correctly.
- **Email and mobile copy on click.**


### v3.24 — who a row is, and merging two rows that are one person

Islam: *"in the send message functionality I got 3 people skipped but they have
an email in the registry."* They did. **The three were on the register twice** —
once from the employee file with an address, once typed into the role picker
with a shorter spelling of the same name and no identifier — and the role sat on
the copy that could not be emailed. Nothing in the resolver was wrong; the
register let one human become two rows and had no way to say so (§87, spec 013).

- **A name is never an identifier.** Emp ID, then email, and no third rung —
  `personByIdentity()` is the one answer and it says which rung decided. An
  address on two rows answers nothing, the same as at the door (§69.23).
- **Both hand-typed doors ask for one now**, and refuse an identifier already
  here by naming who it is. A matching *name* stops nothing — two people can
  share one. Neither is required; the row is **marked** instead, because that is
  the shape the next upload cannot match.
- **The role picker suggests before it creates.** A name typed a little
  differently matched nobody and the only offer was *"+ Add"*; it now shows the
  rows whose chain of names runs through what was typed, and searches on the
  employee number and the address too.
- **The upload sets aside what it cannot place** — an ID and an email pointing at
  two people, or an address arriving under a number never seen — names both
  readings with the people they mean, and applies **nothing** until each is
  answered.
- **A difference is an offer, never an instruction.** Recorded value beside
  proposed one, taken only where ticked, with *take everything from the file* as
  one press. The register wins by default: a people file is usually an export
  somebody edited two cells of.
- **Merge**, from the row's ⋮. The survivor is chosen (defaulting to the row that
  can be matched later); every role, figure set, named figure and open claim
  moves; the last act is the delete, so anything the merge forgot refuses it and
  fails loudly rather than dropping a role.

Verified: `qa.py` green including the new §87 block and the people-file fixed
point **re-measured with every pick taken** (with the ticks off it would have
been measuring the defaults, §51.11), plus `src/checks/identity-merge.py`
driving the screen — the add row refuses and then relents, the merge runs from
the menu, and the role ends up on a row a message can reach.

**Still to do, and it needs Islam:** the three real pairs in the live tenant.
The merge button is built and the register now points at the pairs itself, but
this session has no access to the production database — merging them is three
presses on the People page, or send the register export and the exact pairs can
be named first.

### v3.21 — a function that plans in pillars actually works

The piece flagged when spec 010 merged. Building the two Setup controls
surfaced **four faults from that merge**, each hidden behind the last (§59):

- **Its custodian could not report on it** — every change to a function
  classified as Setup. Now classified through the unit's own classifier against
  the `fn:<key>` target, so §42's figure/note/plan split arrives intact.
- **Its pillars had no ids**, so the authoriser compared them by `undefined`
  and saw no change at all. `renumberUnit()` runs over them now.
- **It was not in the navigation** — and the rule was written twice, so fixing
  one copy left it as invisible. `fnHasWork()` answers it once.
- **Its Performance page then threw**, because `deltaFor()` resolved a target
  as `UNITS[key]`. `unitLike()` resolves either kind in one place.

Plus the controls themselves: **Plans in** and **Under** on Setup › Supporting
functions, refused while the other side holds a plan, shown disabled with the
reason rather than hidden.

Verified: `test-authorize.js` 142 passed (136 + 6 new, including a custodian
reporting a figure and being refused the plan); `qa.py` 31 viewers clean — and
it walks Merchandising for the first time, which is what found the crash;
`test-roundtrip.js` all four PASS on a fresh Postgres 16.

**Still open on spec 010:** a pillars function's plan cannot yet ARRIVE by
upload — the plan template lists business units only.

### v3.21 — Official BU, and it is measured by nothing

- **Main BU → Official BU** everywhere a person reads it (§58): the register's
  column, the Setup page and its rail entry, the workbook's column and Read-me,
  and every sentence pointing at the page. *BU* keeps its own name — it is what
  the official one points at, and what decides access.
- **The workbook writes the new header and reads either.** Somebody is holding
  a file downloaded before the rename; a header is a contract.
- **No logic was built for it, deliberately** — recorded as a decision rather
  than left as an absence. An Official BU has no plan, no score and no page:
  what carries a score is a business unit, a supporting function, or a company
  grouping them, and each already has its own record. The page now says so.
- Stored field names unchanged (`p.mainbu`, `GROUP.mainbus`), so no migration.

### v3.21 — a Main BU holds several, and the sign-in list gets short

- **Setup › BU list maps one name to several units and functions** (§57) —
  chips with an ×, a dropdown that offers only what is unmapped. Editable by
  the SMO, which is what Islam asked for so he can do the mapping himself.
- **A name that holds several places nobody**: the employee file leaves them
  unattached and the sign-in picker offers those few instead. The importer was
  attaching people to the ARRAY until the new assertion caught it.
- **The gate's list is narrowed on the server** from that mapping — their own
  under the client's own word, then *Other business units* / *Other supporting
  functions*, so nothing is unreachable.
- Reads the old single-target shape, so nothing already mapped is lost and
  there is no migration.

Verified end to end on a real Postgres: Distribution mapped to Mobile and
Consumer Electronics on Setup, the SMO given that Main BU, and the sign-in card
offering **Distribution (2) · Other business units (8) · Other supporting
functions (8)** with the pick landing in `bu_declarations`.

### v3.21 — where people say they work, and no attention slide

- **The first sign-in asks where they work** (§56) — every business unit and
  every supporting function, or "I would rather the SMO set it". It is a
  DECLARATION and grants nothing: the SMO sees "They said X — Use it" under the
  BU on the register and accepts it there. Stored outside the state graph and
  without a foreign key, or a save would erase it.
- **The "What needs attention" slide is gone** from both decks — a second
  telling of numbers already shown pillar by pillar, and the one slide that read
  as a list of failures rather than the unit's own account.
- **A merge bug found by driving the product** (§56.6): two branches each added
  a `var pf` to the same function, 600 lines apart with no textual conflict, so
  a function's Present button threw and did nothing.

Verified: the picker driven end to end against a real Postgres — declared,
stored, read back on the register, accepted with one press and the person's
`unit_key` moved; `test-authorize.js` 136 passed; `qa.py` 31 viewers clean;
both decks open (unit 27 → 24 slides, function 19 → 18).

### v3.21 — the floor is two roles

- **Employee** joins the seven roles: on the register, attached to a part of the
  business, named on nothing. **Contributor** keeps its meaning — named on a
  measure or a tactic. Both derived from the plan, neither grantable (§55).
- The concept behind twelve `"contrib"` checks is named once
  (`OWN_LINES_ONLY`), so an employee given edit still speaks only for
  themselves — it cost nothing to add and would have been a silent widening to
  miss.
- Employee ships with a Contributor's current access, so no one's view changes
  on upgrade; the matrix is where it gets tightened. 49 stored grants → 56.

Verified: `test-authorize.js` 136 passed (131 + 5 new, including the widening
that would otherwise have gone unnoticed); `qa.py` 31 viewers clean; the split
measured on real data — Ramy Behairy a Contributor, the Group CFO an Employee;
`test-roundtrip.js` all four PASS on a fresh Postgres 16.

### v3.21 — a unit and a function are the same product

Five items from Islam, and the middle one is the rule the other four are
evidence for. Full reasoning in §53 of the decisions log.

- **A function opens on its Projects**, as a unit opens on its Plan. §28 decided
  that for plans; the code said `&& !isFn(k)`, so it reached units only.
- **A capability is a band, not a card.** Its body was a bordered box with 16px
  of padding, so the rail and pane inside it sat 34px narrower than the
  identical rail and pane on a unit's page — and its white ground fought the
  pinned band's ground filler down both sides.
- **The function's rails match the unit's**: no bare number, no footer
  captioning it (§29.6, applied to one rail of two), a small line of counts
  rather than counts plus both dates plus the timeline kind, and a footer that
  states the summary. The project's owner moved onto the band.
- **Deliverables and outcomes are one table with a Type column** — while the
  score still keeps them apart, half per side. **No due** (a deliverable is
  delivered when the project ends) and **no owner** (the department is
  responsible), removed from the panes, the deck, both `.xlsx` sheets, both CSV
  column lists, the seed and the database (migration 016).
- **THE RULE: any functional or visual change is tested on both sides of the
  navigation switch.** Walking both sides is not testing both sides — the sweep
  had walked every function page each time and reported "ok", because walking
  proves a page renders and none of these were rendering faults. `qa.py` now
  measures the two panes and asserts they agree.

Verified: `qa.py` — 31 viewers, no console errors, template round trip, parity
same-shape, both landings; `test-authorize.js` 125 passed; `test-roundtrip.js`
clean slate / round trip / fixed point / archived plan all PASS on a fresh
Postgres 16, plus an upgrade run against a database created at v3.19 with
`due` and `owner` populated; contrast sweep 53 failing runs across 4
combinations × 34 pages and states — unchanged, all pre-existing (§16.15).

### v3.21 — the BU list, and the register as a file

Islam brought one row of Raya's employee data (`Emp.ID 102347 · Mohamed
Hassanin Ehsan Hassanin · … · BU: Distribution`) and the official list of ten
BUs, and asked for the mapping, an Excel template for the register, roles as a
dropdown, and *Standing* renamed to *Status*.

**Checked before building, and six of the ten do not resolve.** Distribution is
a *company* here, not a unit; Retail is *Retail Stores*; IT is the name of both
a unit and a function; Maintenance, Mazaya, Risk and Support Function have no
counterpart at all. So the file cannot be read against the platform's own list.

- **Setup → BU list** (new page, under *Who*, shares `c_people`). The client's
  ten names, each pointing at a unit, a function, a company, the group — or at
  nothing, which is a real answer for a department that employs people and
  carries no strategy. **The ten names ship; the mappings are deliberately
  empty** (A4) — IT in particular is Islam's call.
- **The register gains *Main BU* and renames two columns.** *Belongs to* →
  **BU** and *Standing* → **Status**, both at Islam's word. Where a person sits
  somewhere other than their Main BU points, the cell says so rather than
  either being quietly corrected.
- **Download and upload on the People page.** One workbook, eight columns,
  matched on **Emp ID**. It downloads the register as it stands, so it is the
  export as well as the template. **An upload adds and amends and never removes
  anybody**; a department it has never met is added to the BU list unmapped
  rather than refused.
- Employee number, email and Main BU are new facts on a person, and **none
  needed a migration**.

**What the round trip caught immediately:** the platform refused its own
export — 31 of 33 downloaded rows named a role the upload could not place.
Fixed by the rule the column already promised: it gives a role, it never takes
or moves one (§54.4).

**Verified:** `test-authorize.js` 131 passed / 0 failed (five new, covering
that nobody below the SMO can point a BU row); `qa.py` clean across all 31
viewers with a new people-file round trip (33 rows, fixed point PASS); contrast
53 failing runs before and 53 after; `test-roundtrip.js` PASS against a real
Postgres 16; and the whole path driven signed-in against the API — the BU list
and a seeded person save, persist, read back, and appear in `change_log` as
*"the BU list"* rather than *unknown*.

**Cost, recorded rather than hidden:** the register table was already 1061px
inside a 920px box; Main BU makes it 1127px. It scrolls in place, the page does
not, and Job title or Contact can be switched off to recover it.

**Waiting on Islam:** what each of the ten names points at (see D8 above).

### v3.21 — the client's mark, on the door and on the deck

- The Raya Trade lockup on the sign-in gate, both cards (§52)
- A unit's own mark: uploaded on Setup › Business units, **PNG only** because an
  uploaded SVG is executable content; large on its review deck's cover and small
  in the footer of every other slide (§52.9)
- The group and unit lockups extracted as vector from the client's brand manual,
  and the client's material filed under `clients/raya-trade/`

### v3.19 — the capability half catches up, and slides get a place

Islam went through the built product and sent notes as he found things. Almost
none of it is a feature: most are paths broken since a rename, fields nothing
read, or controls that looked like one thing and behaved as another.

| What | Outcome |
|---|---|
| **Adding a capability took the product down** | The add button minted `{name, def, measures, tactics}` — the shape a capability had **before §15**. No id, no function, neither list, and the Capabilities Setup page threw and rendered nothing. Removing one threw before it could confirm. §24's rule with the sign reversed: **when a field is renamed, find the code that CREATES it, not only the code that reads it.** |
| **The capability table** | Name typed rather than printed, Remove on the row, Add beneath it, and a confirmation naming what would be destroyed. |
| **Capability pages ↔ pillar pages** | Project codes (FIN01), the coded band on all three project panes, and the function nameplate gone — a unit has no such band, so a function carrying one made the two halves read as two products. |
| **1.43:1** | Two `.capline` rules in one file; the second won on source order, so the band moved to navy and kept the page's ink. The capability's own name, on the band that exists to say it. Sixth header missed by §41.10 — and the function pages had **never been contrast-checked at all**. |
| **Manage slides** | A mode, not a dialog: the whole deck down the left as real slides at one tenth, the selected one large on the right. That removed the position dropdown entirely — you place a slide by where you insert it. Add, move up/down, Fit/Fill, crop, caption. |
| **Fit, not fill** | Two of Islam's notes were one note. Frames were `object-fit:cover`, so a portrait infographic lost both edges and the zoom could only make it worse — 100% was already the tightest crop available. A picture fits whole now; Fill is the deliberate choice. |
| **One switching button** | Units \| Functions had looked like one control since §41.8 and was two buttons dressed to look like one. I measured the container, showed him it was one box, and argued the point. **The measurement was true and the answer was still wrong.** |
| **Four found by using it** | A function's "Shown in the nav" read by nothing; the searchable dropdown closing when you scrolled its own list; long-text boxes two lines tall; blank lines shown at last. |

**Verified:** `qa.py` 31 viewers, no console errors. `test-authorize.js` 123
passed. `test-roundtrip.js` clean slate, round trip, fixed point and archived
plan against a fresh Postgres 16. Contrast **53 failing runs across 34 pages and
states** — every one of them the §16.15 family already recorded, none on any
surface this version built.

**And the checks themselves were wrong three times in one day** (§51.11). A
sweep labelled a page it had never scanned; a probe of mine broke when I edited
what it string-matched and reported the page behind as the new surface; and
removing the two-button fold would have left `qa.py` reporting "ok" having
walked half the product. **A check keyed on markup that no longer exists does
not fail — it passes quietly.** Both sweeps now assert what is lit and say which
page they actually scanned.

### v3.18 — collaborators get a column, and the review gets pictures

Two asks from Islam. The four product decisions inside the second were put to
him before anything was written; his answers are in §50 and spec 009.

| What | Outcome |
|---|---|
| **Collabs.** | A column beside Owner on all three tactics tables — the unit's Performance page, the Plan page and the deck. The data was never missing: `collaborators` has been on a tactic since the import template, is stored in the database, and is what lets a Contributor report a line they are named on. It had no column, no way to be typed, and no demo content — so 116 tactics rendered nothing. §45.2 again. |
| **Setting them** | Under the SMO's pen on Plan, the same gate as any plan correction. Not tidiness: **being named on a tactic decides who may report it**, so a unit that could edit its own collaborators could grant itself reporting rights the matrix never gave it. |
| **Picture slides** | The custodian, owner or SMO adds a titled slide of one to four pictures at any of twelve named points in the deck (five for a function), crops each one inside its frame by dragging and zooming, and captions it. Builds backlog §16.12, undesigned since v3.5. |
| **What is stored** | Never a slide — a title, a position, an arrangement and the pictures. The deck is built fresh every time it opens, and a stored slide would be the exported deck the feature exists to avoid. Lands in `review.extra`, so **no migration**. |
| **Where they go** | An anchor is written on the deck slide it names and carries its own label; the position picker is built by reading the deck back. **The list of places IS the deck**, so the two cannot drift. An anchor that has gone sends its picture to the end rather than dropping it. |
| **How long they last** | The cycle. Archived with its figures on close, cleared for the next one — a picture that stayed would present itself as this cycle's until somebody remembered to remove it. |
| **Who may add one** | Not a new rule: a picture speaks for the whole unit, the same act as submitting and the same act as the cycle note, so it is classified with them and both sides ask one function. |
| **Taking a picture in** | Shrunk to 1,600px, then **encoded both ways and the smaller kept** — measured, not guessed: a screenshot is 164 KB as PNG against 256 KB as JPEG; a photograph is 395 KB as JPEG against 3,058 KB as PNG. |
| **One way into the dialog** | §48.4 made the modal actually modal and left two callers setting `.on` by hand. `openModalHtml()` is the single door now; all three go through it. |

**Verified by driving it, not by reading it.** `qa.py` 31 viewers, no console
errors. Contrast **0 failures on the two new surfaces** across all four
palette-and-theme combinations. **Screen against server: 527 questions — every
person against every unit and function — 0 disagreements.**
`test-authorize.js` 123 passed (8 new). `test-roundtrip.js` with picture slides
in the graph: clean slate, round trip, fixed point and archived plan all PASS
against a fresh Postgres 16. Then signed in to a running `dev-server.js`, added
a picture, watched `POST /api/state` return 200, **reloaded, and read it back
out of the database** on the slide it was placed on.

**Two checks were found lying, both silently and in the safe direction.** The
contrast sweep clicked a unit and labelled what appeared `unit/perf` — but since
§28 a unit opens on Strategy › Plan, so for twelve versions it measured the Plan
page twice and the Performance page never. Clicking Performance explicitly
surfaces **31 failures that have been there all along** (§16.15, recorded and
NOT fixed — a palette decision on a page this version was not asked to touch).
And a scoped probe of my own broke when I edited the sweep, silently scanning
the whole page and reporting the page behind as mine; it asserts its contract
now instead of string-matching it.

### v3.17 — one door, a switch, and a cycle that asks

| What | Outcome |
|---|---|
| **Setup + Manage merged** | One railed page, five groups, *Running the cycle* first. The gear navigates instead of opening a menu — with one destination behind it, a menu of one is a door behind a door. Groups fold, never the one you are in. |
| **Units \| Functions** | A two-position switch: one side always lit, the row always showing one list. The third "both closed" state is what had made it a pair of folds; the disclosure arrow went with it. |
| **Opening a cycle** | Asks for name, period, due date and end quarter. `endsQuarter` was hard-coded to 4 and decides which tactics count as due — a silent guess that moved every unit's execution score. Nothing touches REVIEW until Open. |
| **Prose cleaning** | All thirteen user-facing pages driven and read. Nine already clean. One line cut outright (Weighting described the database); three trimmed of their aphorism but kept their fact. |
| **Report page** | Gets the pillar band Plan and Performance took in §46.3, and stops printing "Direction" — the last place `SHOW_KIND` was ignored. |
| **Pillar note** | Gone. One unit had it, nine did not, so the layout shifted by pillar. Still editable while correcting a plan. |
| **Pillar switch** | Returns you to the top of the pane, with the rail still pinned — not `scrollTo(0,0)`, which would throw the pin away. |

**Verified:** `qa.py` 31 viewers no console errors; contrast sweep **0 failures
across 4 combinations × 25 pages and states**; `test-authorize.js` 114 passed;
`test-roundtrip.js` clean slate, round trip, fixed point and archived plan
against a fresh Postgres 16. Both sweeps were themselves updated — they clicked
menu entries that no longer exist, and now walk the rail and unfold every group
first (§41.5, third time).

### v3.16 — Setup becomes a place, and four things drawn before they were built

Four of the five items were settled from a **mockup** rather than a
description. Two options in it were killed by being drawn, one of them mine
(§46).

| What | Outcome |
|---|---|
| **Setup rail** | Ten flat tabs become a rail grouped by *the question you came to answer* — Who · What we run · How it's measured · How it looks. `.rail` is the unit pages' own component, so nothing new was invented. The gear menu now offers Setup as **one** entry: listing the pages in the menu *and* the rail states the navigation twice. The icon-strip collapse was **killed by its own mockup** — ten setup pages need ten icons, and a label, a scoring band and a figure set have no picture anyone guesses right. |
| **Figure sets** | Configuring and filling become two sections of one page. Gated on `c_source` (`area:"always"`), so the SECTIONS decide: the SMO gets both, a set owner gets only *Fill*, anyone else gets no entry. |
| **Pillar title** | Back on Plan and Performance as **treatment B3** — `--surface-2` with a 3px gold left edge, to the pixel what `.ritem.on` wears. 57px → 33px. Exposed that the Plan page printed `01` where every other surface printed `MB01`: **the code shown is derived, the code stored is an identifier.** |
| **Fill a figure set** | One flat searchable table across all ten units. Measure and Target are separate columns so search can't match `4B EGP`; key objectives join through an `In` column; `#` numbers what is *shown*. Typing never repaints. |
| **People** | 79px → **39px, every row the same height.** Content-sized columns, a *Belongs to* column, roles clipped with the full text on hover, Password squeezed to None/Set/Temp, and a kebab at the end of the row holding Reset password, View as and Retire. |
| **Collective passwords** | Two actions, not one with a wider reach. *Issue to those with none* can lock nobody out; *Reset everyone* overwrites live passwords, ends those sessions, is confirmed first, and **excludes the person asking** — on the server. |

**Verified by driving it.** `qa.py` walks 31 viewers with no console errors;
contrast sweep **0 failures across 4 combinations × 25 pages and states**;
`test-authorize.js` 114 passed; `test-roundtrip.js` passes clean slate, round
trip, fixed point and archived plan. Both collective actions were run against a
live Postgres and checked at the row level — the SMO's hash and `must_change`
untouched, everyone else's replaced and their sessions gone.

**One crash found and fixed on the way:** an empty array is truthy, so a viewer
whose every section was refused walked into `secs[0].k`. The real fault was
upstream — paint() fell back to the *unfiltered* def list when the reachable one
came out empty, putting back exactly what it had ruled out.

### v3.15 — eight refinements, and what the measuring found

Islam went through the built product screen by screen. Eight items, none of
them a feature; half of them a symptom with a cause worth recording (§45).

| # | Asked for | What it turned out to be |
|---|---|---|
| 1 | Drop the 3-year column from a plan's key measures | Done on the **Plan page only**. Key objectives keep theirs on Foundation, the Temple and the deck — a different table, and Islam was told which. `target3y` is still stored: a column went, not a field. |
| 2 | The pane repeats the rail card | Removed on Plan and Performance. Kept where a unit has ONE pillar (no rail to name it) and in edit mode (the name is typed in that heading). The pen moved, because **a hover control needs something to hover**. |
| 3 | Keep the "view as" dropdown; put the Finance-entry thing in the demo data | The dropdown was a **live bug**: `sync.js` read `person.level`, a field §33 deleted, so the switcher was hidden from everybody including the SMO. And the demo shipped with no figure sets, so §44 rendered nothing anywhere. |
| 4 | Dropdowns beyond 5 items searchable | One component, every `<select>` in the platform. The native select **stays and is hidden in place** — nothing wire() attaches is disturbed. |
| 5 | What does this toggle do? | Answered, no change: it is §44's tenant switch for *Strategy › Who enters*. |
| 6 | The access table's design | Header notes to hover; the eye was a **colour emoji** that could neither take the button's colour nor fit inside it — both icons are SVG now; rows tightened; the two essays moved to the knowledge base. |
| 7 | The fill-a-figure-set list is screen wide | Capped at 760px. The tick and the state it produces were at opposite ends of the monitor. |
| 8 | People rows are very high; where is password reset? | The chips explained the **worst** row and none of the ordinary ones. Measuring every cell found three things paid on all 31 rows: 61px → 41px. Password reset was never missing — credentials are not in the state graph, so the column is absent from a file-opened build. |

**Verified by driving it, not by reasoning.** `qa.py` walks 31 viewers with no
console errors; the contrast sweep reports **0 failures across 4 combinations ×
25 pages and states**; `test-authorize.js` passes 114; `test-roundtrip.js`
passes clean slate, round trip, fixed point and archived plan against a fresh
Postgres 16 — where `org.extra` now holds no `sets`, because the demo's figure
set was the first thing §44 stored where §21's clean slate was not looking.

**Multi-tenant:** restated by Islam and recorded as §36.5. Still nothing built
and nothing scaffolded, deliberately. His restatement settles half of §36.4's
open question — *enter first, then choose the client* means one account
reaching many tenants, not an account per tenant.

### v3.14 — figure sets: who is responsible for which numbers

The whole of spec 008, in three steps. **Many numbers are not the business
unit's number** — revenue and margin exist in Finance before a unit is asked
for them, and asking ten units to type them means the same figure is entered
ten times and can be wrong ten times.

**A set is the thing that owns numbers** — a name, a team, one owner, and a
list of figures drawn from any unit. *Financial Figures · team Finance · owner
Hossam.* Naming the set is what makes it workable: "figure custodian 1, 2, 3"
says nothing, and the owner then needs no role of their own. The **team is on
the set**, so the unit reads *Set by Finance* — which is what the BU head
actually needs when he is writing the note against a number he did not enter.

**Who may pick a set's figures is a security setting, not a convenience.**
Ticking from the full list means reading every number in the group. For Finance
that costs nothing; for anybody else it hands the lot to somebody whose job was
three of them. So it **defaults to you**, and you open it deliberately — and
the server enforces it, not the screen.

**One figure, one set — first claim wins.** A figure somebody already holds is
refused by name, with **Request the claim** beside it rather than nothing. The
request records the figure, the asking set and who asked; **you answer it** on
the Reporting cycle page — *Move it* or *Leave it*. Asking twice is refused.

**The second way of assigning is built and switched OFF**, as you asked. Once
you turn it on (Setup › Figure sets, behind Edit), every unit gains a
**Strategy › Who enters** page: the unit's own plan in the order it reads, with
a searchable name against each figure. Naming somebody gives them **that figure
and nothing else**. Turning the switch back off hides the page and keeps every
naming.

**Three pages:** Setup › Figure sets, Setup › Fill a figure set (offered only
to somebody who has a set to fill), Manage › Figures I report (hidden for
anybody named on nothing).

*Verified:* 114 authorisation checks, 0 failures. Driven against a running
server and a real Postgres — the custodian's save was accepted and the server
holds it; a forged naming against another unit was refused, said so on the
page, and wrote nothing. Round trip, clean slate and fixed point PASS on a
fresh database. Contrast 0 across 4 combinations × 25 pages and states. QA's 31
viewers, zero console errors. Byte-identical rebuild.

### v3.13 — the headers wear your brand again

You spotted the rail's **PILLARS** header and the table headers had gone grey.
That was deliberate in v3.11 — the design language I ported uses a light table
header — and you were right that it was wrong for us: **`--panel` is the colour
Setup › Branding sets for the navigation bar**, so a header on it wears the
tenant's brand. A grey header wears nothing.

**All five went back together:** every table header, the pillar-list header,
the rail's header, the grouping rows in Setup, and the unit and capability card
headers. Half of them would have been worse than none — the ones left behind
read as mistakes rather than as a style, which is exactly what had happened to
the presentation deck.

Rather than list them from memory I diffed every rule that used the bar colour
before the retheme against every rule that uses it now. Eight had lost it: five
were headers and are restored; three had gone to the accent instead, which is a
different decision and stays.

### v3.12 — Finance enters the numbers Finance owns

Your Finance custodian, built. §16.7 in the decisions document had already
designed this; your description matched it, so nothing was reinvented.

**Setup › Source of figures.** You choose the **team and the person once**, at
the top. Then the units are buttons in a row — with a count on each, so you can
see where the work is left — and every figure is a single tick: *is this theirs
or not.* Measure and target, nothing else. A figure already marked for another
team shows that team's name instead of a tick, so you cannot overwrite it
without noticing.

The first version asked for two dropdowns on every row, one unit at a time —
116 of them. You were right that it was impractical; this is one choice and a
run of ticks.

**Manage › Figures I report.** The custodian's own screen: every figure they are
master of, across every unit, in one place. Finance enters revenue once per unit
without visiting ten pages. Nobody else sees this page — it is hidden outright
for anyone named on nothing.

**On the unit's own page**, a sourced figure shows greyed with the team's name
beside it. The unit cannot type it — the server refuses, not just the screen.

**Three things worth knowing, all of them already settled in §16.7:**

- **The unit still writes the note.** The number is Finance's; the performance is
  the unit's; the explanation belongs to whoever owns the performance.
- **A sourced figure still counts toward the unit's total**, so a unit cannot
  submit around a missing Finance number. That looks like a defect and is not
  one: it means the unit chases too, instead of the SMO being the only one. The
  page names what is outstanding and which team owes it.
- **Who is master of a figure is yours alone to set.** A unit that could nominate
  the source of its own numbers could nominate itself.

**Not sourced yet:** capability projects — deliverables, outcomes and milestones.
Unit key objectives and key measures are what you described, and what is built.

### v3.12 — the security floor

Everything in the list I gave you, built.

**The `1234` password is retired, not deleted.** You can still sign in with it
— a deployment with no way in is not a deployment — but it now takes you
straight to "choose your own password", once. If you have already changed it,
nothing happens: the check asks whether the stored password is still the
shipped one, and only nags if it is. **It cannot lock you out.**

**A temporary password now buys nothing.** Before, someone you issued a
password to could ignore the change screen and still open the whole tenant for
thirty days. The server refuses until they have chosen their own.

**Guessing is slowed down.** Eight wrong attempts on one person, or twenty-five
from one address, in fifteen minutes, and it stops answering. It clears itself
— no lock for anyone to lift. One thing to know: anyone who knows a username
can push that account over the limit on purpose. That is the price of having a
limit at all, and a short self-clearing window is the cheaper half of the
trade.

**Security headers, on every page.** The platform can no longer be put in a
frame on someone else's site, cannot load anything from anywhere else, and
cannot send anything anywhere else. One honest limit: the single-file design
means the strictest form of this is not available yet — recorded, with what it
would cost.

**Database errors stop reaching the browser.** They named tables and columns —
a free map for anyone probing. One plain sentence now; the real error goes to
our log.

**Sessions.** Expired ones are cleaned up. And changing your password now signs
out every other device you were signed in on — which is the point of changing
it.

**Still open, and these need decisions rather than code:** who at Forefront can
read the production database, backups and what happens to a client's data when
an engagement ends, and an outside penetration test before go-live.

### v3.12 — the server decides who may change what

**The hole.** Saving used to check that you were signed in and nothing else,
then write back whatever the browser sent — the whole tenant, register and
permissions included. Anyone with a login could make themselves the SMO. The
access page we built in v3.10 decided what a screen *showed*; it decided
nothing about what the server *accepted*.

**Closed.** The server now compares every save against what it already holds,
works out what actually changed, and refuses anything that person's roles do
not allow. You see nothing different — same screens, same saving.

**And you get the history for free.** The comparison that decides the save is
the one that gets written down: *Mobile · Data duplicate rate · actual · 1.4%
→ 51% · Ashraf Laithy.* "Who moved this target" has an answer now.

**Your three answers, built.** A locked cycle takes no more figures from
anyone but you. Contributors view by default, and if you give one edit they
can only touch the lines they are named on — and they cannot submit the unit's
report, because that speaks for the whole unit. A tactic's quarters are part
of the plan, so only you move them.

**A refused save now says so, on the page.** Before, a failed save warned a
console nobody has open and retried for ever — which with this change would
have meant an edit sitting on screen as though it had landed.

**One defect this found:** the platform was quietly sending a "branding" the
database never had, on every single save. Sixty-seven tests missed it; signing
in as a unit head and typing one number found it in a minute.

**Not closed, and next:** the `1234` password, the temporary-password gap, no
limit on password guessing, and the missing security headers.

### v3.11 — a new look, and colours and fonts you can swap

The Strategy-Formulation design language, ported onto SMP's own screens: 14px
body, no serif, black-weight uppercase micro-labels, hairline cards that state
themselves by border colour, and a light table header where SMP had a navy band
and a zebra stripe.

**Two layers.** The *language* — type, shape, weight — is one set and never
changes. The *palette* is colours only: **Slate** and **Forefront**, each in
light and dark. When multi-tenant lands, a client's branding will arrive as a
palette, never a language — so they get their colours without getting a
different product.

**Branding is a Setup page** (§39). Two colours — the accent and the navigation
bar — and the platform works out the other five, including darkening a colour
that cannot be read as text and telling you it did. Every derived pair is
contrast-checked as you type. It is saved with everything else, so it is what
everyone in the tenant sees; the switches in the top bar remain your own screen.

**Typeface is a third switch, for now.** Four faces are embedded in the file:
Inter, Source Sans 3, Manrope, IBM Plex Sans. Try them on your own screens with
your own numbers, then tell me which face belongs to which palette — at that
point the switch folds into the palette and the ones you did not pick come out
of the file. Embedded rather than linked because the file has to open from a
memory stick and still look like itself.

**Zero contrast failures across all four colour combinations.** Light mode had
been carrying 61 known failures since v3.0; the new palette clears them rather
than fixing them one at a time.

**The accent budget** (§41). The retheme gave a solid accent fill to five
things at once, and one solid fill is a mark where nine is a colour scheme —
it is a strategy platform, it should be quietly coloured. The rail's selected
direction went back to a grey ground with an accent EDGE, the navigation went
back to the underline, and the pips stayed solid because a 20px pip is a mark,
not a slab. The **open Units / Functions fold** was the last one left: with the
navigation quiet again, the menu you had opened was louder than the page you
were on. It is accent words with no fill now — an open fold is a heading over
the list it just revealed, and a heading does not need a box.

The file is 994 KB with all four typefaces inside, up from 792 KB.

**Merged in v3.12.** Some deeper reporting and config surfaces still carry old
shapes. The login page is untouched — it has its own design you approved.

### v3.10 — roles and access, at the size you can read

The page you called exhausting was 25 pages × 7 roles, three buttons a cell —
**525 controls on one screen**. It is **seven roles down and seven kinds of page
across**: Group, own business unit, other business units, own supporting
function, other supporting functions, Reporting cycle, Setup. Forty-nine cells,
one screen, none / view / edit, and edit includes view.

Two changes to your six columns, both forced by what the current settings
actually said. **Setup and Management could not be one column** — every role
sees the Reporting cycle and only you touch Labels and Bands. And the
**Knowledge base left the table**: it was `view` for all seven roles, and a
column where every cell holds the same answer is a question with no second
answer.

**"Own" is not a setting**, exactly as you said. It is read from what each role
is attached to. That also let the table say something it never could before:
*a unit owner may view other units.* Tested live — granting it took Mobile's
head from 2 destinations to 11 on the next repaint.

**Three things became rules instead of cells**: the knowledge base is readable
by everyone; a plan is corrected by the SMO alone, however much access the
unit's people hold; and focus measures are marked by the group CEO and you.

One thing this costs, recorded rather than hidden: a **Contributor** with edit
on their own unit can now also edit that unit's Foundation and SWOT, where
before the SWOT was hidden from them. Reversible by setting Contributor to
*view*, at the cost of their reporting.

### v3.9 — the sign-in page, and the register

**The sign-in page** (§34). One 400px card was carrying the whole product, so
every line of brand had to be squeezed above the password box. It is a split
now: a navy wall arguing the product's case, a pale dotted field the form floats
on. Glass card, icon-inset fields with a gold focus ring, one staggered
entrance. Everything the wall claims is something SMP actually does — the front
door is the last place invented capability belongs.

**The register** (§35). A People page: everyone the platform knows, their job
title (which never decides access), contact, roles with what each is attached
to, password state, and standing. SMO only.

Your "these three tables should interact together" needed no synchronising. §33
had already put a responsibility role on the **thing**, so the People page
writes `UNIT_ROLES.mobile.head` — the same field the Business units page writes,
through the same function. There is one copy, so they cannot disagree.

The role dropdown is a **search** now, with **+ Add new**. The old `<select>`
could offer only people already attached to the unit, which meant a new unit
could never be given its first head; and it could not offer somebody who does
not exist, which is the normal case when a plan arrived yesterday. Typing a name
nobody has creates the person and gives them the role in one act, and they are
in the register immediately.

**Passwords.** Per-row set and reset, plus one shared temporary password issued
to everyone who has none — the **server** picks that set, so a stale screen can
only ever issue to fewer people, never more. Each person is forced to choose
their own on first sign-in.

**People are retired, never deleted** — snapshots name whoever entered a figure.
Retiring revokes every role they hold and closes the door on the server: a
retired person is refused with the correct password.

**The URL** (§35.6). It read `/SMP-Project-Folder/strategy-management-platform-v3.8.html`;
it reads `/raya-trade` now. The version stays in the filename, because the
version is the cache bust — it just stops being something a person has to look
at.

**Multi-tenant** (§36) is assessed, not built: one Postgres schema per tenant
when the time comes, never a tenant column — person keys are short and global,
so a column forces composite keys through credentials and sessions.

### v3.8 — roles replace levels
N-1 / N-2 / N-3 are gone. **The role is the thing**, and job titles never decide
access — they are information about a person. Seven roles: Super user, Group
CEO, Company CEO, Business unit owner, Strategy custodian, Supporting function
head, Contributor.

The design that makes your "and vice versa" work: a role naming a **seat**
(super user, CEO) lives on the person; a role naming **responsibility for a
thing** (unit owner, custodian, function head) lives on the thing — Mobile
already had a head field, and that pointer *is* the role read from the other
end. So setting it on the unit page and setting it in the registry are the same
write and cannot disagree. Several roles at once come free: group CEO *and*
owner of Care are two records in two places.

Someone holding several roles gets the **most generous** grant across them —
but only ever within the reach each role carries.

The matrix was **rebuilt, not mapped**, as you asked, and now shows seven role
columns across every page.

**Two things this caught that would have hit production.** The access matrix
crashed on a migrated tenant, because its map is legitimately empty and the
page read it directly. And more seriously: `schema.sql` can never add a column
to an existing table, so the seed would have written `people.role` before the
migration renaming `level` ever ran — breaking your live database, invisible to
every fresh-deploy test. Migrations now declare `-- @phase: pre` and run in two
passes: schema before the seed, data after.

Verified against a **faithful v3.7 tenant built by the v3.7 code itself**, then
upgraded.

### v3.7 — one door
**The gate was three states, not two.** It painted the sign-in card
immediately in its old shape, then reshaped it when `/api/auth` answered, then —
if your session was already valid — swapped the whole thing for a Starting page
whose only content was a button to the platform. Every time.

Now: nothing paints until the session check answers. **Session live → the
platform opens and the gate is never seen.** No session → the sign-in card,
once, in its final shape. Temporary password → the change-password step, because
that is the one thing standing between signing in and being in. The Starting
page is gone entirely; sign out lives in the platform's top bar.

The **30 days were already true** (`SESSION_DAYS = 30`) — what made it feel
untrue was being asked to press a button every time. The gate now says it out
loud under the button.

The door itself follows HR_ERP: navy ground rather than pale grey, a gold
eyebrow above the mark, deeper corners, more padding, errors as a tinted block.

Also: the Labels page loses its last three notes to the knowledge base. The
**collision alarm stays** — that is a blocked save, not an explanation.

### v3.6 — the plan is correctable, for the SMO
The pen you asked for is on the Plan page, **for the SMO only**. §22 still
stands: a plan is authored by upload, the template still carries no codes, and
replacing one still archives it. What this adds is the correction afterwards —
a target typed wrong, an owner who moved — without re-uploading a whole unit to
fix a word.

Editable: the pillar name and end-state, each measure's name, target and
three-year target, each tactic's name and owner. Not editable: the code (minted
on arrival), and the direction and compile rule — those change what a figure
*means*, and a plan whose meaning drifts under a reported actual is worse than
one that is wrong in a name.

SMO only and not merely by access key: `u_plan` at edit is held by unit heads
too, and a plan being correctable by the person measured against it is a
different decision from one correctable by its custodian.

### v3.5 — the knowledge base, and the two-click save
**The two-click save.** Fields commit on `change`, which fires on *blur* — so
pressing Done blurred the field, which saved, which repainted, which destroyed
the button you were pressing. Your value was saved on click one; what needed the
second click was leaving edit mode. Fixed once for every field: a repaint asked
for while the mouse is down waits until the click lands.

**The Knowledge Base is live**, first in the Manage menu, open to everyone.
Seven sections with a contents strip — scoring, access, labels, units and
functions, plans, the cycle, and where the data lives. Everything I removed from
the four setup screens is in it, plus rules that were previously only in the
decisions document.

Building it caught something worse: **a page added in a new version was
invisible on every existing tenant.** The access map is stored per tenant, so it
only holds the keys that existed when it was written, and a missing key read as
"denied". It now falls back to the shipped default. That would have bitten every
future page, silently, and only in production.

Also: **Companies is its own tab**; the **pen icon** replaces the bare Edit bar
on Foundation and SWOT, appearing on hover and staying while you edit; a third
byte-identical **dead duplicate function** removed.

Two things not done, both deliberate. The **Plan page has no pen**: it has no
edit mode because plans are authored by upload (§22), so adding one is a real
change to how plans work, not a seventh tweak. The **scroll step that reverts**
did not reproduce under real wheel input — one candidate named in §30.8, not
fixed on a guess.

### v3.4 — seven from the deployed product
**The Units/Functions buttons weren't lagging — they were dead.** Open the
Manage menu, close it any way at all, and both folds stopped listening until
something else forced a repaint. The row's HTML is rewritten whenever the menu
opens or closes, which destroys every handler inside it; the folds were wired
somewhere that only ran on a full repaint. Now whoever rewrites that row re-wires
it, in the same place.

The **first line is 27px**, half of 47. It was stuck at 31px of content because
two `.themebtn` rules disagreed and the wrong one won — a duplicated rule doesn't
fail loudly, it quietly ignores you.

The **rail no longer slides**. It sat 34px below the chrome and pinned at 12px,
so it dropped 22px on the first scroll. The gap and the pin are now the same
variable, so the difference can't be non-zero: measured 0px of travel at every
scroll position.

Also: **Direction/Capability is hidden everywhere a reader goes** (one flag,
five call sites — flip it to bring them all back; the field itself is untouched
in the data and the import template). The **"Plan only" notice** and the rail's
**"Figure shown is key measures"** footer are gone. The rail rows now read
**"3 measures · 2 tactics"** instead of a small line and a bare unlabelled
number. The Manage menu's group labels sit on a grey band.

### v3.3 — your six, and the scroll glitch at its source
The footer sentence is gone. **Manage is a gear**, not a word — it was the
widest thing in the navigation row and it named a menu rather than a place; the
word moved to its tooltip. The **rail expands to fit any number of directions**
— the cap that cut lists off mid-row is gone, proven against a unit with 18.
The heading above it went too, on both Plan and Performance, along with the unit
name and the "plan as agreed" note: the nav row and the tab already say both. A
**business unit now opens on Strategy › Plan**.

And the scroll-up glitch, at its source this time. Three earlier versions fixed
real causes underneath it and the symptom kept returning. What was still there,
measured: **at scroll position 25 the chrome settled at 190px if you arrived
scrolling down and 168px if you arrived scrolling up — and stayed there.** That
is the condense-on-scroll's hysteresis working as designed, and its cost is that
scrolling back up drops 22px of chrome into the page in one animated step,
moving everything below it. It bought 22px on a header that is now 47px tall.
The whole mechanism is gone. The chrome reports **one single height** across a
full sweep in both directions and 65 frames of continuous upward scroll.

### v3.2 — one line, and the thing that was really moving it
The first line is now **one line at every width**, not just at 1180 and above —
which is what v3.0 actually verified, and why it still arrived as two rows on
your laptop. It no longer wraps at all; the pieces shrink instead, buttons last.
The product name went from 26px to 13px (it was the largest text in the whole
product, restating the tab you are already on), and the header went **from 108px
tall to 47px**. Auto is gone: Light and Dark only, with your device still
deciding where the switch starts.

The "glitchy header" was never the header. Every explanatory icon's hover note
is a ~320px box that was laid out **at all times** at `opacity: 0` — invisible,
but still counted. Wherever one sat near the right edge it pushed the page wider
than the window, the page scrolled sideways, and the sticky chrome slid with it,
as sticky is defined to do. Hidden tooltips are `display: none` now, so nothing
in the product scrolls sideways any more.

One thing fixed that you did not ask for: the group's front page read **`NaN%`**
under BUSINESS UNITS — EXECUTION. With no tactics loaded it was computing 0/0.
It reads "Not yet measurable" now, like the two cards beside it. Every clean
slate showed it; the demo dataset never did.

### v3.1 — installable
SMP installs to a dock or a home screen: its own icon, its own window with no
browser chrome, and it opens with no network. The one thing a service worker
must **not** do is the thing it exists for — `/api/*` is never cached, because a
cached `/api/state` is last quarter's actuals wearing this quarter's chrome.
Those go straight to the network and are allowed to fail; the platform already
falls back to its baked data and says so. Everything else — gate, platform file,
icons, manifest — is held, network-first so a deploy still reaches everyone.

Icons: 192, 512 and a 512 **maskable**, which is a different drawing rather than
a resize (platforms crop maskable icons to a circle, so the rounded tile would
have lost its corners). Two `theme-color` tags, one per scheme, or an installed
app in dark keeps a navy title bar over a near-black page.

### v3.0 — light and dark, by choice
The dark palette had been in the stylesheet since the beginning and nothing
ever selected it, so the product followed your laptop silently. Now there is a
control: **Auto · Light · Dark**, cycled by the round mark left of Demo data.
Auto is where everyone starts and keeps following the device. The choice is
remembered **on that screen only** — never in the database, or one person
picking dark would turn the platform dark for the whole tenant — and the
sign-in gate reads the same choice, so signing in never changes the colours
under you. The gate's own dark colours were built; it had none.

Switching the palette on for the first time exposed what had never been
checked: colours written into rules as literals. The zebra stripe on **every
table** was a hardcoded `#F7F9FC`, so in dark it painted a near-white band
under near-white text. Five new tokens close that class. Measured over 19
pages, dark went from **482 failing runs to 11**. Light, untouched, still has
61 — pre-existing, shipped, and a palette decision rather than a dark-mode fix
(§25.5, open).

Two things came back with it: **the client's name** beside the product name on
the first line, which §24 had removed entirely, and the first line **actually
being one line** — measured, it never had been for anyone signed in: the two
buttons had been wrapping onto a row of their own since v2.9.

### v2.9 — two lines of chrome, and one way in
Your six changes, all of them, plus the Info button you asked to remove.

The first line was carrying five statements of where you are — "Strategy
Management Platform · Spec 012", "Raya Trade — B2B eComm", "Group · 10 business
units · H1 2026", Info, Demo data — stacked above a navigation row that already
highlights the unit you are on and a tab row that names the page. It is three
things now: **Strategy Management Platform** on the left, **Viewing as** in the
middle, **Demo data** and **Sign out** on the far right. Then the navigation.
Then the tabs.

Setup and Manage were a gear and a stacked-list glyph pinned at the right of the
nav row, holding ten pages between them, and which glyph held which was
something you had to remember rather than read. They are one **Manage ▾** button
now, with the ten listed under two headings — MANAGE (Reporting cycle, Import,
Archived plans, Focus measures) and SETUP (Labels, Levels & access, Scoring
bands, Business units, Supporting functions, Capabilities). To your test: **every
entry still takes you to its own place**, with the same tab row underneath it.
Nothing about the pages changed — only the way in.

*Verified served and signed in: all ten entries opened their own page with the
right tab selected; the menu closes on an outside click and on Escape; `qa.py`
now walks the menu as well as the row, 31 viewers, zero console errors. The rail
re-proven rather than assumed — three window sizes, four scroll depths,
`elementFromPoint` returning the rail on every row every time. Round trip, fixed
point and archived-plan round trip PASS; the seed is byte-identical, because
none of this touched the data.*

*One thing the removals also fixed: `.eyebrow` was styled for the header but is
also the deck slide's kicker, so a `max-height:20px` clip and a `body.scrolled`
fade written for a condensing header were reaching a full-screen presentation
slide. Deleting the element took its CSS with it.*

### v2.8 — the cap that would not settle
You asked me to test the rail again, so I tested it the way you actually use it:
**served, signed in, on a cleared tenant, against an uploaded plan, clicked while
scrolled.** The browser driver would not click at all — *element is not stable*,
retried for thirty seconds. And the cause was v2.7's own fix.

Capping the rail against the measured chrome height closes a loop: the cap
follows the chrome, the cap changes the page height, that re-clamps the scroll,
that flips the header, that changes the measured height. Traced at
240 → 243 → 290 → 240 → 290, forever. **A sticky offset changes nobody's height;
a max-height does.** The cap is a constant now.

The loop had a second door: the chrome is in flow, so condensing it shortens
every page by ~40px, and where a page is barely taller than the window that
alone flips the header back. The header no longer condenses when there is no
room to scroll — reclaiming 40px on a page with 60px of scroll was never worth
it anyway.

*Verified across three window sizes — desktop, short, and a 620px laptop — on
both Performance and Strategy → Plan, at four scroll depths each: **every rail
click selected the pillar pressed**, no row covered by the chrome on any normal
window, and the rail's position dead steady across 22 consecutive frames.*

One residual, honestly stated: on a very short window the first rail row can sit
behind the chrome — because a sticky element cannot float outside its container,
and on a short page the whole section has scrolled up with it. That is what
sticky does; making the rail escape its container would be worse.

### v2.7 — the rail was pinned under the chrome
You were right that neither was fixed. The rail was `top:12px` — twelve pixels
from the top of the **window**, while the header above it is a sticky bar up to
258px tall. So the moment you scrolled, the rail's first rows slid underneath the
chrome, and because the chrome sits above them the **chrome took the clicks**.
You were pressing a navigation button. That is why it failed on Performance and
on Plan alike, and why it looked fine to me sitting at the top of the page.

Pinned below the chrome now, at the same measured height the pillar header
already used, so it follows the header as it condenses.

**The haze had a second cause:** `.chrome` had no background of its own. It
relied on its three rows tiling it exactly — true at rest, not mid-condense,
when the rows animate their padding while the container animates its height.
Measured 169px against children summing to 170: in that gap, the page showed
through. It has a floor now.

*Verified by asking what a click actually lands on:* `elementFromPoint` over
every rail row at four scroll positions — at rest each row hits itself; before
the fix, past 500px the first row hit `BUTTON.primary` in the nav; after it, no
row is covered at any position. Then clicked through, scrolled, on both
Performance and Plan: every click selects the pillar pressed.

### v2.6 — the horizon stops being a default
You spotted that the plan template shipped with **2029** already in it. That came
from the demo data, the clean slate missed it, and it had therefore survived into
your tenant — a year nobody chose, reading as a decision somebody had made.

The Aspiration sheet now says *"Horizon (the year this plan runs to)"* and leaves
it **blank** until you set one; once you have, it shows what is in force so a
later plan neither hides it nor overwrites it silently. Every page that reads the
horizon copes with it being unset: the Temple heading drops its dangling "by",
and the pill says **not set**.

`007-horizon-is-yours.sql` clears it from your tenant — **but only if it is still
the seeded 2029**. Anything you have entered since is yours and is left alone.

### v2.5 — the company level, and two bugs a real plan exposed
**Companies**, ported from the build you did outside the repo (§23). A layer
between the group and the business unit — Distribution and B2C today, with four
units standing alone. It is **visibility, not strategy**: a company carries no
score and no page. A company CEO sees their own units, and two flags **per
company** decide whether they also see the other companies (default no) and the
group (default yes). Supporting functions belong to no company.

Set up on **Setup → Business units**, which now leads with a Companies table and
gives each unit a Company column. Standing alone is named in words rather than
left as an empty cell, because it is a decision. The navigation row does **not**
group by company — you built that and took it out in the same version, and the
reasoning is recorded rather than deleted.

**Two defects you found by actually using the upload:**

- **A pillar arriving from an upload had no code.** Its title read "undefined"
  and every rail button carried the same key, so the rail could not select
  between pillars. Codes are filled in when absent now, positionally; hand-set
  ones are left alone, because nine units carry codes already printed in decks.
- **The sticky chrome was pinned three times over**, at offsets read from two
  custom properties that the shipped file never sets. The header condenses on
  scroll, so the rows drifted out of register and content showed through the
  seams — the haze. One container is pinned now, and the browser owns the
  offset.

**And one found while porting:** `renderFocusSetup` was defined twice, the first
56 lines dead and returning the wrong screen. That is what made your copy look
as though the Focus measures page were broken. Removed.

*Verified:* the access rule proved for both company CEOs and for both flags ·
the code fix through the real upload path, with the rail navigating to the right
pillar · the chrome screenshotted at four scroll positions, rows stacking
contiguously · round trip, fixed point and archived-plan round trip PASS, with
the clean slate now asserting 2 companies and 6 assigned units · every page as
every viewer, live and demo, no console errors · offline walk clean for all 31
viewers · byte-identical rebuild.

### v2.4 — SMP gets an icon
The Strategy Temple, in the house navy and gold, as the browser-tab and bookmark
icon: pediment, architrave, three pillars, stylobate — the platform's own
drawing rather than a generic mark. It reads at 16px, which is the only size
that really matters.

`favicon.svg` and `favicon.png` sit at the repo root for the served site; the
single-file platform carries the same mark **inlined as a data URI**, so it
still shows its own icon opened from a memory stick with no network.

### v2.3 — the plan template loses its codes
**One generic workbook** instead of a download per business unit, and no code in
it anywhere. The unit is chosen on the Read me sheet (one dropdown, cell B2);
everything else — pillar codes, item ids, the links between a measure and its
pillar — the platform assigns on arrival, exactly as it does when you add a
pillar on screen.

What made that possible is a rule, not a clever matcher: **an upload authors a
plan, it does not amend one.** With no row ever matched against what is
recorded, no row needs an identity typed into a sheet.

**Replacing a plan archives it.** Before the new plan is written, the outgoing
one is snapshotted whole — foundation, aspiration, objectives, SWOT, pillars,
measures, tactics and every figure reported against them. **Archived plans** on
Manage lists them with what each held, who replaced it and when, and a
**Restore** that puts one back (archiving whatever is there now, so a restore
can itself be undone). Nothing an import does is a deletion.

**The template asks in your words, not the platform's:** theme by name with an
explicit *— none —* for a cross-cutting pillar · owner typed, not chosen · the
Pillar list on Measures and Tactics read **live** from the Pillars sheet · units
of measure suggested rather than enforced · targets written as real numbers.

*Fixed on the way, and the reason this was urgent:* on a unit with no plan the
Pillar and Owner dropdowns were **empty**, and Excel refuses whatever is typed
into an empty list — so a first plan could not be authored from the template at
all. The same hole sat in the capability workbook's Project column. And every
cell the workbook wrote was text, so every target carried Excel's "number stored
as text" warning.

*Verified:* the template built and inspected sheet by sheet · a filled template
written, read back, and every code minted in the right order with every child on
the right pillar · the flow driven on the real screens — upload, the unit read
from the file, the warning naming 16 reported figures, apply, archive, restore ·
the same over HTTP against Postgres, including the archive surviving a page
reload · round trip, fixed point and an archived-plan round trip all PASS · every
page walked as every viewer, live and demo, no console errors · offline walk
clean for all 29 viewers · byte-identical rebuild.

**A plan must arrive as the .xlsx template.** A CSV has no Read me sheet, so it
cannot say whose plan it is, and guessing would write one unit's plan into
another. Reporting still takes a CSV — it is per unit and the unit is chosen on
screen.

### v2.2 — the clean slate, and the Demo button
The deployed tenant is now the client's own. **Kept:** the company, the ten
business units, the supporting functions, the three group themes, the eight
capability names with their owning function, and all configuration (labels,
bands, levels, the access matrix, the weighting factors and their values).
**Cleared:** every unit plan, foundation and SWOT · the group's foundation,
purpose, values and key objectives · every capability's definition, key
objectives and projects · the reporting cycle, its focus marks and its history ·
the invented people and their role assignments · every weighting factor value,
the written reasons beside them, and the prior cycle. Only `SMO` can sign in.

The worked example did not go: a **Demo data** button top-right switches the
whole product to the full Raya Trade dataset for explaining, shows the
invented-data banner the whole time it is up, and **cannot be saved** — the
autosave refuses to run in demo mode, and returning restores the client's data
exactly as it was left. Offline the button is hidden, because the file *is* the
example.

Three defects only an empty tenant could expose, fixed on the way: "Clear all
plans" on Supporting functions had been inert since 1.7 (it cleared fields a
capability stopped having); capability key objectives and projects were being
stored twice, so a cleared capability would have refilled itself on the next
save; and the group's own scorecard was a stored number that read `undefined%`
with no objectives set — it is computed on read now, like everything else
(§5.1). The viewer switcher was also filled once at load, so after hydration it
still offered the example's 29 people and threw when one was picked.

*Verified:* clean-slate counts read back from a database seeded and migrated
from scratch (units 10, functions 7, themes 3, capabilities 8, people 1;
pillars, measures, tactics, key objectives, clauses, SWOT, projects and history
all 0; cycle and review empty; `smo` the only account) · every page walked as
every viewer, **live and demo, no console errors** · the database read before,
during and after a demo session and across the autosave interval: **unchanged**
· round trip and fixed point still PASS · the offline file walks clean for all
29 viewers.

**The weighting table, empty.** The four factors and their 40/30/20/10 weights
stay — that is the model, not content — and each unit keeps a row to enter its
figures into. Until anything is entered, **every unit counts equally** in the
group compile and the page says so; a share of nothing reads as a dash, not 0%.
Two more defects fell out of this: emptying a cell used to leave the old figure
in place, and a factor added through the editor never got a share column.

### v2.1 — identity
Real sign-in on the deployed product. The gate is a login (person key +
password, scrypt-hashed, httpOnly session); `/api/state` requires a session; a
signed-in person sees their own view; the SMO issues temporary passwords from
Levels & access and every issued password must be changed on first use. The
viewer switcher survives only as the SMO's read-only simulation and in the
offline file. Sign-in for the SMO is `SMO` / `1234` with no forced change
(§19.4, 2026-08-20).

*Verified:* full flow in a real browser against a throwaway Postgres 16 —
bootstrap forced a change; the SMO issued Mennah Farouk a password; she was
forced to change it, saw only Group and Mobile, reported a figure that landed in
its exact row; her temporary password was refused afterwards; unauthenticated
access bounced to the gate. Offline QA walk clean for all 29 viewers.

### v2.0 — the state moved into the database
Schema (the §4 hierarchy + configuration + cycle as real tables), seed generated
mechanically from the platform sources, one endpoint reading and writing the
whole state, schema and seed applied on first contact with an empty database
under an advisory lock. Offline the file still runs on baked data.

*Verified:* round-trip deep-equal (seed → write → read → identical) and
`write(read())` a fixed point; seed-once / no-reseed; browser edits landing in
their exact rows; QA walk clean over HTTP and file://.

### v1.9 — the last prototype gaps closed
Capability card + Cards/Table toggle (§16.6) · capability project import and
export, idempotent for all eight capabilities (§16.4) · presentation mode for a
supporting function · the rail on a unit's My reporting (§15.12 fully cleared).

*Verified:* byte-identical rebuild, QA walk for all 29 viewers, plus a browser
suite per feature.

---

## In flight

**Spec 059 — the client's People register: a cell is the control (§372), on the
branch, built 2026-09-17.** Islam: *"for the client registry I'd like to do some
in line adjustments like the phone, employee ID, email, the unit/function, job
title, etc. and about the roles why do I need to add them as chips why can't we
make it a multi tick serarchable drop down to add the roles?"* A double-click
opens one cell as the field the dialog already draws for it — Enter stores it,
Escape throws it away — and the Roles cell IS the ticking list, with the chips it
already draws handed over as the closed control's label so there is one builder
for what a role looks like. **The first drawing took the Roles column 209 → 477px
and grew every row 39 → 49, and the mockup is what said so** (rule 1c); shipped it
is 236px and 39. §116's reason for moving editing into a dialog is not withdrawn
and the assertion carrying it is REWRITTEN rather than loosened (§218): one
control per cell, none past its cell. **Islam's own instruction kept it correct** —
*"before building I urget you to check main"* — because main had moved 43 commits
and carried the minted/adopted pair, without which inline editing would have been
taken off every adopted row. **Escape had to be MADE to discard** (Chromium fires
`change` on a focused element being removed), and the open field's 8px overrun was
seven dead `min-width` rules matching nothing since §116. Verified: role-picker,
people-dialog, seat-grant, smo-team, forefront-team, duplicates and no-jump all
green; authoriser 683/0, change list 140/0; proved able to fail three ways from
the sources (1 / 7 / 2 red), restored and rebuilt byte-identical.

**AND §372.14–.17 ANSWER WHAT HE FOUND ON TESTING IT** (2026-09-18): *"on
opening something the arrow appears, no need for the arrow. and for the roles as
well ... the table in general should look everything fixed and not editable until
I made the double click."* The caret goes (it announces a list the double-click
has already opened, and as an inline span after a block label it fell to a line
of its own, taking the open row 38.6 → 59.6px); the Roles cell stops standing
open, so at rest the table holds **0 buttons and 0 carets** against 33 of each,
and the column gives back 27px; and an open cell is one height whichever kind it
is — `searchsel.js` draws a `<button>`, which `.cfg input`'s own 12.5px/`4px 7px`
cannot reach, so the drop cell sat 3.4px proud of a resting row and now sits on it
to the pixel. **Keyed on `PROLEPICK`, never `PCELL`**, because a ticking list
fires `change` on every tick and would have shut on the first role. **And a real
live-deployment defect in §372 came out of it**: the paint a double-click makes
schedules a save, its answer paints again, the box is removed, Chromium fires
`blur` on removal — so the cell shut under the person who had just opened it,
invisible over `file://` where nothing saves, which is why every check was green.
**The check could not see the fault it was written for either** — it opened a
text cell, which has no button and therefore no caret, and measured the rows after
Escape; REWRITTEN, never loosened (§218), it opens the two cells that draw a list
and measures them while open. Proved able to fail four ways from the sources
(8 / 4 / 16 / 4 red, the last printing his symptom verbatim). **Waiting on
Islam: the merge.**

**AND §373 ANSWERS THE TWO HE FOUND NEXT** (2026-09-19): the open Unit box lying
across the Email column, and *"you added the 3 dots to the roles whihc is wrong
the 3 dots is out of this column."* **Neither is visible on the worked example**
(§255) — its longest unit label fits, and at 1500px the register does not scroll
at all — so his own state was made and both answers were **drawn out of the
running platform and signed off before a source moved** (rule 1c); of the two
offered for the ⋮, he picked **A**. **§373.1**: measured, **261.1px of control in
a 176px cell**, 93.6px into EMAIL, and a click inside the email cell returns the
box — §110.1's fault again. One word: `width:auto` fills for an `<input>` and
**shrink-fits for a `<button>`**, and `.ssbtn` is `white-space:nowrap`, so its
text is its width; `max-width:none` → `max-width:100%`, measured **both with and
without the column's declared width** because the file records eighty lines above
that this cap does nothing here — true of §110's `<input>`, which was sizing its
own column, and not of a button. **§373.2**: the ⋮ was never added to Roles; it is
the frozen last column floating over what scrolls beneath — **and its seam has
never painted**, because no `box-shadow` draws on a `<td>` under
`border-collapse:collapse`. Proved by putting a **solid red 10px** shadow on the
cell and photographing **no change at all**, while a border, a `::before` and a
background each moved the pixels. A `::before` wash now, `--froze-wash` in all
four palettes, a dark wash on both grounds because the seam is depth.
**§373.3**: `role-picker.py` **already asserted that the open control fits its
cell** and went green through the whole round that shipped the fault — the right
property with no data to exercise it (§255) — so the state is made and put back
there now; and the seam is asserted as **PAINT**, two screenshots either side of
the wash which must differ, because reading the declaration is exactly what could
not tell a live seam from a dead one. Proved able to fail three ways from the
sources — **4 / 8 / 8 red**, the last two identical, which is the finding: to the
page, a seam declared as that shadow and no seam at all are the same build. **Found and not swept** (rule 1b): the name column and the functions
table carry the same dead declaration, and the kebab block is declared **twice**
in `config.css` byte for byte. 

**AND §377 TAKES THE CONTROL AWAY AGAIN** (2026-09-20): *"please remvoe the 1
click copy bhavior I can always have a right click and copy the text."* Done,
and measuring it first changed what was worth saying. **At rest the register
looks exactly the same** — the two builds are the same picture byte for byte,
because §93.6 styled the button to look like the value rather than like a
control — so there was no look to sign off on. What goes is what the cell
**does**: the underline under the cursor, and the address being replaced by the
word *Copied* for a second, which on the one table whose job is showing values
was the only thing that hid the value. **And his fallback turns out to need
this change to work at all**: §93.6's reason for making the value a button was
that you could not select text in that table — and a drag across a button
selects nothing, which is what made that true. Measured on both builds, same
row, same drag: **nothing before, the whole address after**. **The hover changes
and it is the better behaviour**: today every address and every number carries a
tooltip repeating itself; now only a value that is actually cut off has one,
which is what every other column does — 65 tooltips become 1, and nothing cut
is left without one. **Nothing moves**: every row the same height, every column
the same width. **Two checks were turned round rather than deleted**, so the
claim still fails if somebody puts the control back — 4 red and 3 red on the
build that still has it. **Nobody is signed out and nothing stored moves.**
**Waiting on Islam: the merge.**

---

**AND §374 ANSWERS THE ONE HE FOUND NEXT** (2026-09-20): *"the copy on click for
the email and double click to edit is working but the same behavior is not
working on the phone number."* **It is not a phone fault**, and finding that out
was the round: both cells are built by the same two functions, and over
`file://` both open perfectly. The fault follows a value **two rows share** — a
shared office line, or the same number typed twice — and the phone is only where
one repeats. Falsified three ways: phones shared → Mobile fails and Email works;
both unique → both work; **emails** shared → Email fails and Mobile works.
**The chain**: the platform puts the cursor back after a repaint by naming the
control that had it with its first `data-` attribute, every editable control
carries a KEY (`data-pphone="loghead"`) and the copy button carries
**`data-copy="+20 100 1234567"`, which is the value**; so the first click of the
double-click focuses that button, the paint that opens the cell asks for that
value, and the browser hands back the **first row carrying that number** —
somebody else's button. Focus leaves the box, `blur` fires with the box still on
the page, §372.16's guard reads it as a person moving away, and the cell shuts
**about 90ms after opening**. §87 one field over: *a value is never an
identifier* — **and the Email only worked by luck**, being unique, so the
selector matched the one button the paint had just replaced and restored
nothing. **Invisible over `file://` and that is why every check was green**
(§372.16's own trap, one guard along): nothing saves there, so the second paint
never happens. One guard — restore only what the mark names once, the open
dialog's copy first — which can never lose a correct restore and only ever stops
a wrong one, in the general helper rather than in the copy button, because a
list of attributes to skip is a list somebody forgets to add to (§104.7).
**The check's own fixture already held the state and nothing asked**: every row
in `people-dialog.py`'s fixture carries the same number, and §372.14's
save-racing section presses **Job title**, whose address is unique. §2b presses
the shared value with the unique Email beside it as the control, and asserts the
box is **still there a beat later** — **1 red** from the sources with the guard
reverted (§276), printing the symptom verbatim. **Recorded, not done** (rule
1b): the Mobile copy target is **19.4px in a 38.6px row** against Email's 28.1,
because the address wears `.val` (4px of padding) and the number wears `.mono`
(none) — not what he reported, a restyle nobody asked for, and it wants a
measurement of every `.mono` cell rather than one column's.
**Merged to `main` 2026-09-20 on Islam's word** (§4). `main` had not moved, so
it is a clean fast-forward and what went up is what was checked. **The merge
carries a line of its own on purpose**: the branch had already been pushed, and
Vercel builds once per commit whatever ref it arrives on, so handing it a commit
the branch ref already holds is a deployment that may never happen — writing the
record the round owed anyway is what gives `main` something of its own to build.
**And the live site could not be read from this session, which is said rather
than glossed**: this environment refuses that address outright, so nobody here
has seen production serve it. **The one file to compare is `shell.js`**, which
should read **3,827,402** bytes where the build before it read 3,824,282 — not
the service worker and not the stylesheet, neither of which changed at all, so
either would read the same whether or not production built this. **The branch
is left where it stands** until somebody has looked, because moving it is the
one thing that could still cost the build. **Nobody is signed out and nothing
stored moves**: the whole change is one screen, one check and the record.

---

### The mouse that does nothing until you click once — found and fixed

**What you reported.** Signing in, arriving at the console, and the mouse doing
nothing: no highlight when you point at something you can click, and the first
press wasted. Click anywhere once and it all starts working. Only when you type
the password — never when the browser remembers it.

**I got this wrong twice before I got it right, and it is worth saying why.**
I first blamed how long the page takes to open, and then how much of a client
card you can actually click. Both are real, and neither is this. The thing that
ruled them out was in your own message and I read past it: **the highlight does
not work either.** That highlight is done by the page's styling alone — no
code, no wiring — so nothing about slowness or missing buttons can explain it. A
page that will not highlight is a page that is not being given the mouse at all.

**What it actually is.** Your recording settles it. At just under eleven seconds
the console is completely drawn and your pointer is sitting on Raya Trade's
*Insights* row with an ordinary arrow and no highlight; four seconds later the
same card lights up under the same pointer, with nothing having reloaded. So the
page was finished and deaf.

I then checked, rather than assumed, that nothing of ours was in the way: with
the console loaded there is **nothing covering the window at all**, and **all 47
things you can click are directly reachable** by the pointer. No invisible
layer, nothing swallowing the press.

**Which leaves your own clue, and it is the answer.** The difference between
your two cases is a password the browser has already saved versus one you have
just typed. Our sign-in page was not handing the sign-in to the browser the way
browsers expect: it took the press itself, sent your details in the background,
**wiped the password box**, and then jumped to the console. To the browser's
password keeper that is a sign-in it has to guess at — so it raises its "save
this password?" question late, over the page you have just arrived at. While
that question is waiting, the browser holds the mouse and the page gets nothing.
Your first click closes it, and everything wakes up.

**What I changed.** The sign-in is now handed to the browser normally, and we no
longer wipe the password box. The browser asks its question on the sign-in page,
where it belongs, and you arrive at the console with nothing in front of it.
The server already knew how to accept a sign-in this way — that path was built
from the start for people with scripting switched off — so nothing new was
added; one line was removed.

**Nothing on any screen changes.** No layout, no colours, no wording. Signing in
looks exactly as it did.

**One cost, paid rather than left to you to find.** A wrong password now reloads
the page, so your email address would come back empty — and the browser only
refills an address it has saved, which in your case it has not. The address is
carried across that one reload, kept for that tab only and never put in the web
address.

**What I cannot prove from here, said plainly.** The browser's save-password
question is not visible anywhere in your recording. So the chain is reasoned
from your autofill clue rather than seen. What is certain is that the guessing
was caused by our page, and that is what has gone.

**Checked**: the sign-in driven in a real browser and read off what the browser
actually sends — a normal form submission and a genuinely new page, where before
it was a background request and no page change at all; the refusal still says
its one sentence; the address comes back; the password box is empty. The door's
own test suite is 143 of 143 with all seven of its deliberate breakages still
failing as they should, and every neighbouring test is green.

**Still open, and yours:** the password-change screen does the same thing the
sign-in screen used to, so setting a first password may hit the same dead moment
one screen later. It is not a one-line change there — that screen compares two
boxes and asks where you work before it can move on — so I have written it down
rather than folded it in.

**Also still yours, from before this:** three-quarters of a client card takes no
click (it stopped being one big button on 11 September), and the console's slow
opening, which is fixed on the branch and not yet merged.

### The console's dead first moment (§369) — repaired; one half waiting on you

**What you reported.** Opening Forefront's own console, the window looks open
and nothing responds until you click once.

**What it actually was.** The window was fine. The page had not finished, and
from where you sit those two look identical — the top bar is drawn outside the
part that gets hidden while it loads, so Forefront's name and the Sign out
button stand up over an empty page with nothing saying why.

**What was underneath it.** The console asked the server **three questions in a
row** to open one page, and the last two were **the same question** — the most
expensive one it has, which reaches into every client to count its units, check
whether it has a plan and read its cycle. Asked twice, one after the other,
every single time you open the page. A click during that stretch lands on
nothing at all.

**What I changed.** It asks both questions at once now, and asks the expensive
one once. Measured at the same speed either side:

| | before | after |
|---|---|---|
| bar up, nothing responding | 1,255ms | **742ms** |
| cards on screen | 1,872ms | **742ms** |
| page appears, then cards appear | two stages | **one** |

The cards now arrive *with* the page rather than a beat after it.

**It was not the card-mark round.** I checked that first rather than assuming:
the same measurement on the build before it gives 1,259ms against 1,255. This
has been there since the console was written.

**The one thing still yours.** There is one round trip left, and during it the
page still shows a bar over nothing — brief when the server is warm, seconds
when it has gone cold. Making it *say* something means deciding what you see,
so I have drawn the two candidates out of the real page and put them in front
of you: **the page's own words** (its title, its search box and its own
"Reading your clients…"), or **a grey skeleton** of card shapes. Each one's
cost is on the page beside it. My recommendation is the first.

**One more thing, found while checking the above.** The test I wrote for this
has to be run twice — once against each of the two copies of the console page —
and the instructions written at the top of it only worked from one folder. Run
from the folder everything else is run from, it could not find the second copy
and said nothing useful: it handed back a browser error rather than telling me
which file it had looked for. Both ways work now, and if the file genuinely is
not there it says so by name and stops. Nothing on any screen changes — this is
the testing tool, not the product — and I re-ran every test afterwards,
including the two deliberately broken builds, to make sure the edit had not
quietly stopped it from being able to catch anything.

**Still yours:** that choice, and the merge to main — which is your word on
that merge, and which I have held as you asked.


**§368 — a mark, not a sentence, on a client card's module rows. On the
branch, built 2026-09-17.** Your words: *"we don't needs notes that take 2
lines we can just have a notificaiton here if something is new to check … to
keep it neat and clean nad let's make it compact for better view"* — and then,
of three drawings, **"A with tighter rows and Forefront own"**.

**What was there, measured before anything was drawn.** A card with two
modules carried nine pieces of text. Five of them said nothing you can act on
— the module names and the addresses are the same on every client — and the
other two **said one fact twice**: the short word at the end of the row
(*Cycle open*) and the sentence under it (*Cycle open · reports due 30 Sep*).
That sentence is what ran onto two lines, and it did so at every window size,
because it is long rather than because the column is narrow.

**What a row says now.** A short mark at the end of the row, and only when
there is something for you to look at: *Not answering* if the client's
platform did not answer at all, *No plan* if no plan has been built, or how
many subjects are still to submit. Nothing otherwise — so a client with
nothing outstanding reads its name, its address and its module names, and you
can run your eye down the page. Insights says *N new* when there are new
reports this month. **The cost, which you took:** a cycle that is open with
everybody submitted now looks the same as no cycle at all, because the mark
means *something to do* rather than *what state is this in*. The state is one
press away inside the module.

**The mark is Forefront's own answer**, which was your sharper instruction. It
does not follow the sentence a client picked for their own landing page — that
is a different question, about what a client says to its own people — so the
card cannot change under you because a client changed their own wording.

**How compact it got, measured.** The tallest card 304 → 247 pixels, an
ordinary client card 235 → 205, the tallest row 57 → 33. At a 1024-wide window
the card was 252 and is now 205, so **its height no longer depends on the
window**, which it did only because that sentence wrapped at some widths and
not others. Nothing runs past the edge of a row at any width.

**Checked:** the modules check 158 assertions, red under nine deliberate
breaks including a new one — a build that puts a mark on every row whatever
the facts say, which is exactly what you rejected; the card check 23
assertions on both copies of the console page, red under four breaks; the door
check 143, red under seven. The client platform itself is untouched, so
nothing about the product a client opens has moved.

**One thing flagged rather than changed.** When the client's settings moved
into the platform, the client's own landing page went with it — and with the
card no longer reading it either, the **Landing line** page in Setup now
governs nothing except its own preview. That is a decision about what that
page is for, so it is said rather than quietly tidied away.

**Still yours:** the merge to `main`, which is your word on that merge.

---

**Spec 056 — the client and its modules (§362), on the branch, stage 1 of
six built 2026-09-16.** Islam, of the page the console's *Settings* chip
opens: *"theclient settings shouldn't open the strategy banner in the top this
is a client settings separate than any module"* — and, of the narrow answer
first offered, *"you are trying to make a simple fix. let's discuss the
architecture and who sees what it's not a simple fix."* Six stages, each
shipping and proved on its own. **Stage 1 (§362)** is the reported fault: on a
client-scoped Setup document the chrome draws the client's mark, its name and
*Save & close*, and draws none of the destination row, the Group dropdown, the
Units | Functions switch, the gear or the viewer strip — one reader asked where
the chrome is drawn rather than per control (§53.5, §104.7), off a scope the
SERVER stamps, because the module switcher is built once at load above the line
that resolves the address.

**§362.1, from Islam using it:** *"I ca't find the access page in the strategy
module … why did we remove it it's a very important table that can't be
removed."* **Nothing was removed and the measurement says so** — Roles & access
is on Strategy's rail under a group headed *Access*, and the matrix is
byte-identical to `main`'s. What was missing is a DOOR: §360.9 gave a module's
rail a row across to the client's and left the reverse unbuilt, so arriving by
the card left somebody on a rail with no Roles & access on it and no way to the
rail that has it (§61). One row per module at the foot of the client's rail;
`data-modules` stops carrying the switcher's rule in its name and becomes the
LIST, with the *a menu of one is a door behind a door* test (§32) moving into
`shell/route.js`.

**T0, the access baseline, taken before stage 3 moves anything**:
`scripts/test-access-unmoved.js` asks `grantAtPage` — the one function the
screen and the server both ask (§42) — for 33 people × 35 page keys × 21
targets, with no browser and no database. Against `origin/main`: **UNMOVED**,
every person opening exactly what they opened at every target across all 34
shared keys, the only difference `c_landing` ADDED. The baseline is kept as
`specs/058-the-client-and-its-modules/access-baseline.json` with the commit it
came from.

**Stage 2 (§362.2) — Forefront team is the store, the register is a reader
(spec 058 §3a), built 2026-09-16.** Islam's own revision of his first
instruction: *"how about the forefront team is a separate view as you did but
we keep them on the client list reading from the forefront team list."* A
client-scoped Setup page under *Who*, above the register because it is the
store the register reads — **mounted rather than moved**, so the set-up flow's
step and the page are two readers of one renderer sharing one state (§9's
pattern, §53.5).

**The finding is §3a's own closing warning, read before anything was built.**
There are **two kinds of Forefront row** and `officeRow` has marked them apart
since §313.29 while nothing read the difference: a **MINTED** row the platform
BUILT, whose role IS the seat and is rewritten on every request, and an
**ADOPTED** row — the client's own person, marked because their address matched
one active row (§313.32), which that same function says it *"never rewrites"*.
§3a's literal rule would have **stripped the client's own custodian of their
custodianship the day they joined the account team**, and frozen their unit,
their address and their name with it. So the question is asked of the **MINT,
never of the mark** — `SMPRules.isMintedRow` / `isForefrontRow`, one pair read
by the register and by `lib/authorize.js` (§42) — and Raya Trade is the live
case, its register having come across by the carry.

**On the register a minted row states its seat and offers nothing that would
rewrite it**, which is STRONGER than §3a asks and was measured rather than
assumed: §116 took the role picker off the ROW, so it is read-only by not
being offered *Edit details*. Its menu keeps *View the platform as them*
(reads and writes nothing) and *Delete permanently* (a removal, already the
Super user's); **the password entry goes for everybody**, since a consultant
signs in at Forefront's own door. An adopted row gets its picker back and
carries a quiet mark beside its chips. **The count says both** — and only
where there IS a split, which is what keeps §122's removal of a plain total
whole (a narrow reversal, recorded).

*Verified:* shell **111/0** with a new §3c proving the served seam — the page
drawing this client's REAL team, the register's consultants asserted as an
agreement with it — red **2** from the sources; `checks/forefront-team.py`
**37 assertions, 0 failures**, three populations in one run, red **4 / 1 / 3**
from the sources; `test-authorize.js` §42 **683 passed**, red **2 / 2**;
door-landing 140/0, modules 125/0, `built-in-step` all good, `tsc` clean, and
**the access baseline still UNMOVED**. Three of the new check's own first
failures were the CHECK, one of them a death rather than a report (§215).

*Stage 1 verified:* shell 103/0 (§3b six new assertions, red 5 and 1 from the
sources), modules 125/0 with `switch-always` still red, door-landing 140/0,
`generated-in-step` all clear, `built-in-step` all good, `tsc` clean cold, the
access baseline UNMOVED and red 635 / 22 on two falsifications. **`main`
untouched — the merge is Islam's word, on that merge.**

---

**§364 — the Forefront team is a setup table, 2026-09-17.** Islam, of the page
§362.2 shipped: *"forefront team is damaged it needs to be a table looks like
the people register wiht the required columns."*

**The cause is one class, and it was measured before anything was drawn.** The
team's rows were wrapped in the class the set-up flow's step CHIPS wear — a
pill — so a control's own shape was painted round a whole page, which is the
oval he photographed. Under it the rows were the flow's own flex row, written
for a 760px step column: on a full-width Setup page they laid out side by side
and wanted **2471px in a 1323px box**, which is the third consultant cut in
half. Both are one fault seen twice — a shape built for one room, used in
another.

**It is the setup tables' own shape, never a second one.** The navy heading
row, one line per cell, the value on a hover where it does not fit and the
ellipsis all come from the family Companies, the BU list and Functions already
wear. Five columns — **Name · Email · Seat on this client · On this register as
· Remove** — the add row under the table, the note under that. Islam signed all
three off from a mockup made of the RUNNING platform, so *today* was the
product's own markup rather than a drawing of it.

**One renderer, two hosts**: the flow's seventh step and the Setup page are two
readers of one function, because people join and leave an account team all
through an engagement and a renderer copied for the page is a drift waiting to
happen. Measured on both — 1325 of 1325 in the page's pane at 1600, 760 of 760
inside the flow's column, one line a row in each. **The register column is
drawn only where it can be answered** (on a client whose register came across,
where the match is by address and has to be confirmed; on one the platform
built the seat IS the register row and there is nothing to pick), **and the
head follows the cells**, asserted on both client shapes in one run. **The key
inside the cell is gone** — it was the control's name while the rows were a
list and is the column heading now, so it said the word twice on one row; the
name moves onto the control. **One sentence, two dresses**: the note's words
are written once and the host says how they are dressed.

**The slack has to go somewhere, and saying which column takes it is most of
the fit.** Two attempts, each measured rather than reasoned: a 1% last column
— the register's own trick — **starved it to 10px at 1280 with its own word
painted outside it**; a 100% name column starved the middle three to nought at
the same width. Left alone the leftover is shared. **A column can never be
narrower than the widest thing that will not wrap**, and the sum of five of
those was 936px against an 825px pane: the select fills its cell now, so the
register column costs its heading and nothing more, and the address caps at
220. It fits at **1325 / 1165 / 1005 / 825** — and below about 1080 no cap can
make it fit, so **the box scrolls rather than cutting**, with the last column
asserted reachable and the page gaining no sideways scroll of its own.

**And the hover on a control was removed by the run that was meant to prove it
needed keeping.** A cell holding a `<select>` has no value to put on a hover —
its text is every option it holds — so the first build wore an opt-out mark;
the falsification made to prove that mark load-bearing came back GREEN, because
giving the select its own cell had already removed the overflow that produced
the title at all. The mark is deleted rather than left as a line the next reader
takes for load-bearing.

*Verified:* `checks/team-page.py` **31 assertions, 0 failures**, over HTTP with
a stub, because the page is empty over `file://` by construction and a stub is
the only way to make both client shapes and to read what a press WROTE rather
than what it drew. Proved able to fail **six ways** from the sources —
**9 / 2 / 2 / 3 / 3 / 1 red**, and A's nine name the reported fault in its own words.
`checks/multi-client.py` and `smp-app/checks/shell.mjs` §3c held the flow's row
selectors and were re-pointed; the first is recorded as unrun, needing the
rehearsal database. Ten neighbouring checks green, `built-in-step` all good,
the four generators re-run, `qa.py` over `file://` **33 viewers / 242 destinations /
ERRORS none — and the same on a build made from the commit before this one**, so nothing this
changed is reachable from the navigation, measured rather than argued. **`main`
untouched — the merge is Islam's word, on that merge.**

---

**§363 — the trial module goes, 2026-09-17.** Islam: *"let's remove the trial
module now."* It was built to prove a module could be turned on for one client
and opened, and three real modules have proved it since — so it goes, and
**nothing in any database has to be cleaned up**: a client's stored list is
read through `modulesFor`, which has always dropped a word the code no longer
knows, under a comment saying exactly why. Raya Trade keeps the word in its
row and simply stops being drawn a row for it, on its card, in the switcher
and on its own Setup rail.

**The work was the check, and it is the same lesson at two sizes.**
`checks/modules.mjs` had a whole section for the trial's page and spelled that
word in a dozen assertions besides — a literal outliving the decision behind
it (§214.3, the eleventh time). It now **names no module at all**: the second
module, the ones that draw a page of their own and the ones declaring no area
are all derived, with the derivations themselves guarded so a list of one
cannot go quietly green. Six of the deleted section's claims were never about
the trial — they were about any page a module draws for itself — and are asked
of every such module now, so the next one is covered the day it lands. **Three
assertions genuinely retired and are named rather than absorbed** (§54.5): the
trial's greeting was made of the client's register, so it alone proved a count
the page could not read is said rather than printed as a nought, and that a
plural is not made by adding an `s`.

**And the falsification survives**: `SMP_BREAK=static-hello` — a build whose
page stopped naming THIS client — moved to Insights, so `check:modules:red` is
still eight breaks and all eight still red.

**A red neighbour was cleared on the way**, established as not this round's
before it was touched: `client-card-modules.py` asserted that pressing a
card's **Settings** *"navigates nowhere"*, which stopped being true when §360
made it a door into the client's own Setup. Rewritten to the claim that
survives — Settings is its own control, going to the client's Setup and not
into a module — asserted at both ends.

*Verified:* modules **115/0** (from 125, and every one of the ten accounted
for line by line) **red all eight ways**; insights 127/0; shell 111/0;
door-landing 140/0; client-card-modules 16/0; client-archive and
client-setup-outside 0 failures; `built-in-step` all good — the frozen
product is untouched and measured, so `sw.js` is **not** bumped; `tsc` clean
cold. **`main` untouched — the merge is Islam's word, on that merge.**

---

**Spec 055 — the client's settings live in the platform (§360), on the
branch, built 2026-09-16.** Islam, of spec 056's landing beside the frozen
welcome: *"why do I have a welcome screen for the client overall, I just need
a welcome screen for the strategy module for now"* — then **"A"** of three
drawn (`design-mockups/client-settings-door/`). Reverses §315's landing and
spec 056 §4.1's blocks: `/<client>` redirects into the first openable module
(`openableModules`), `Welcome.tsx` deleted, the frozen `welcome.js` offered
again once a session. The console's card's *Settings* opens `/<client>/setup`
— the client's own Setup rail with `‹ Back to the console`, a *Getting
started* strip (`N of 7 done · …`, from the flow's `progress()`) until *Done
with set-up* writes `GROUP.setupDone` and the page moves to the bottom as
*Client set-up*; Branding absorbed into step 1 and its page deleted with the
`look` group; `kb` back on Strategy; a module's rail draws `Client settings ›`.
The console's flow CARRIED into `src/client-setup.js` (one function for three
hosts: the platform page, Add a client, an archived card); `__smpShape` moved
out of `frozen.cjs`'s glue so browser and server run one function; a row
matched by NAME first and keeping its KEY (§360.3 — the first drive was
refused on a graph nobody had renamed); a refusal puts the rows back; the
focus after + Add lands inside `render()`. Authoriser §41 673/0, red 4 / 3.
Checks: `door-landing.mjs` 136/0 (red 3 / 18), `shell.mjs` 75/0,
`modules.mjs` 125/0, `setup-per-module.py` (red 7 / 2) and green served,
NEW `client-setup.py` (red 39 / 9), `client-setup-outside.py` as the
console's three doors (red 12), `client-archive.py` (red 2), `welcome.py` OK,
`qa.py` file:// ERRORS none and at Next 33 / 243 / ERRORS none; `generated-in-step` and
`built-in-step` clear; `tsc` clean. Two product faults found by the checks
and fixed (§360.6 Add a client threw before it posted; §360.7 the bare
`/<client>/setup` landed on the entry page).

**And two more from Islam pressing it (§360.9, 2026-09-16):** *"when I press
continue it opens the clietn settings!! … the settings should open the
settings directly … a perosn can access the client settings from the module
settings page but it should be at the bottom."* The screen he pressed was
right and the WELCOME was standing in front of it: §360 gave the frozen
overlay its job back and left no condition in its place, so it drew over the
first client document of a session whatever address opened it, and *Continue*
taking it down read as the press having opened the settings. It is the
module's HOME screen now — offered where the address names no page (which is
what `/<client>`'s redirect and the door both produce) and never over a page
somebody named, through `data-deep-address` written by `shell/route.js` and
read by `WELCOME.offer()` alone: the tour's own rule since §315.3, in its own
words. And `Client settings ›` moved to the FOOT of a module's rail, after
the list and outside it so it cannot scroll away, while `‹ Back to the
console` stays at the top — one row LEAVES and the other goes ON. Red from
the sources 1 / 1 / 2 / 1, the third printing his report verbatim. Two
neighbours were red on the branch and both were §360's, established on a
worktree built from HEAD (§303) and rewritten rather than loosened:
`setup-search` folded the deleted `look` group, `setup-rail` asked the strip
to be inside the list it is deliberately outside — and that rewrite found the
Branding errand (*"where do I change the logo"*) had lost its answer while the
set-up is a strip, asserted now where the done state is made.
**Waiting on Islam: the merge; and a look at step 1's modules band
and archive block, which he has not seen there.** `main` untouched.

**Spec 054 — Setup per module (§359), on the branch, all six steps built.**
Signed off 2026-09-15 from two mockups (`design-mockups/module-setup/`).
Step 1: the Setup Overview is deleted (§359.1) — both its halves were
already on the landing — and the gear lands on Reporting cycle;
`checks/attention-rows.py` replaces the two Overview checks, 6 red on the
build before. Step 2 (§359.2): every Setup def carries `mod`, the rail draws
by the document's scope (the served router writes it from the address, the
gear from the module the document was served for, nothing over file://), the
page decides the rail when the two disagree, Setup is the spine's own document
for every module, and the client's rail carries the way back;
`checks/setup-per-module.py` 0/0 on both halves, red 4 / 2 / 1 from the
sources. Step 3 (§359.3): the landing draws a Client setup block for the
Super user's seat — six doors at their spine addresses, Access opening the
register at its seat column and Email the email settings by a hash the shell
now honours — and a Your modules list from the client's own registry row,
one row per module in MODULES' order; `door-landing.mjs` 70 → 87/0, red 2 / 2,
`welcome.py` §11. Measuring it found step 1's carried reader still naming the
deleted Overview, corrected. Waiting on Islam: whether the email settings
move to Branding (the spec's table says so, the product holds them on
Strategy's Send an email). Step 4 (§359.4): each module declares the
sentences it can say about itself, the client picks one on the module's own
Landing line page (Strategy's rail, a new group *The landing*), the pick
rides the group under `SMPRules.LANDING_PICK` as an absence, and the
landing's row, the console's card and the page's preview all read ONE server
reader over facts read once for the viewer; `test-authorize.js` §40a red
5 / 2, the round trip on a virgin Postgres, `modules.mjs` §4b,
`door-landing.mjs` §8 red under `no-landing-stamp`. Step 5 (§359.5):
Insights' rail carries Roles & access and Landing line — the same keys as
Strategy's, told apart by the scope — the access table is the roles down and
the module's declared areas across, one eye per cell carrying the shipped
state, absent reading as shipped and the default stored as an absence; the
store was proved key-agnostic on a virgin Postgres before anything was built
on it, so no schema change and no server rule (`test-authorize.js` §40b
665/0, red 6); `mayOpenModuleArea()` is the one reader the frozen page and
`smp-app/lib/access.ts` both ask, the route asks it before `serverFor` and a
refusal is the legacy redirect (§320.5), the landing's Your modules filtered
by the same answer; `modules.mjs` §4c 123/0 red 2, `door-landing.mjs` §9
101 → 127/0 red under `gate-open` and `no-areas-stamp`. The check's first
fixture wrote a seat a client login cannot hold (§100.3) and is corrected.
Step 6 (§359.6), the sweep: `qa.py` at Next 33 viewers / 243 destinations /
ERRORS none and over `file://` 33 / 241 / ERRORS none; shell 74/0; door 127/0;
modules 123/0; `built-in-step` all good, `generated-in-step` all clear; `sw.js`
at `v5.08-module-access`, unique against `origin/main`. The count was
accounted for rather than quoted: the office's +2 is the Inbox and History,
drawn only over HTTP; the +8 on every other viewer with a gear was the SWEEP —
its client-rail `goto` landed back on the office and walked the office's
eight pages under a CEO's name (§50.6, §51.7) — corrected in `qa.py`, and its
first correction re-picked the office as the office, whose §237 rebase took
the rail off the screen (39 against 47). 275 → 235 → 243 = 241 + 2, exact.
The built file is byte-identical. **Waiting on Islam: the merge.** `main`
untouched.

**R1 — the Next.js scaffold — is done, on the branch only.** `main` serves the
v2.9 single file as it always has; nothing anyone uses runs on the new stack
yet.

What R1 proved, in `smp-app/`:

- **Prisma reads the existing database.** All 35 tables introspected with
  `prisma db pull` — no new tables, no data moved, no migration. The schema
  stays owned by `db/schema.sql` and `db/migrations/`, which the platform
  applies itself.
- **The design crosses intact.** `scripts/sync-css.mjs` generates the app's
  stylesheet from the platform's own `src/*.css` in build.py's order — carried,
  never hand-copied. A card rendered with the real class names comes out with
  the navy header and the 112px dial, unaltered.
- **The scoring engine ports exactly.** `lib/scoring.ts` (nulls dropped, one
  band function, optional KO weights) computes **the same figure as the live
  platform for all ten units**, Nigeria's dash included.
- Typecheck and production build both pass.

Stack note: Prisma 7 keeps the connection URL in `prisma.config.ts` and
connects through a driver adapter (`@prisma/adapter-pg`) — the same `pg`
driver the old endpoints used.

---

## Next — the rebuild on the HR_ERP stack

**D4 answered 2026-08-20:** the CSS is carried **verbatim** (Tailwind only for
genuinely new things), and the cutover is **early, page group by page group** —
the new app becomes the live site while un-ported screens still link back to
the v2.9 build. Those two answers work together: because the stylesheet is the
same one, the mixed period looks consistent rather than like two products.

| Step | What it is | Why this order |
|---|---|---|
| ~~**R1**~~ | ~~Scaffold beside the live product.~~ **Done** — see *In flight*. NextAuth itself moves to R2, where the shell needs it. | Proved the new stack reads the real data before a single screen is ported. |
| **R2** | **Sign-in and the shell.** The gate, the session, the navigation, the access matrix — the frame every page hangs in. | Everything else needs the frame and the person. |
| **R3** | **Read-only screens first:** Group Performance, unit Performance, Foundation, SWOT, Temple, Strategy/Plan, capability pages. Measured against the frozen v2.9 file screen by screen. | Reading is the bulk of the product and the highest drift risk — port it while there is a reference to compare against. |
| **R4** | **Editing and reporting, per action.** Each write its own server operation, validated against the cycle rules, carrying the **change log** (§16.0a) — the old Phase 2, now built the right way rather than patched on. | Enforcement stops being the browser's word. |
| **R5** | **The heavy machinery:** import/export (Excel + CSV), presentation mode, cycle close and snapshots. | Self-contained; safest to move last. |
| **R6** | **Cutover**, then multi-tenant (§1) and strategy versions (§16.10). | — |

**Longer-term backlog**, unchanged and unstarted: source teams (§16.7), the help
box (§16.8), the rest of people-and-credentials (§16.9 — Phase 1 took the login
half), images in review mode (§16.11). **Open model questions** still open:
§11 (year-end rollover, mid-year tactic removal, the ELABD single-company
shape, optional pillar-measure weighting).

---

## Known limits of what is deployed

Stated here rather than discovered later.

1. **The tenant is empty, and that is the point.** Until the plans are authored,
   most screens show "No data" rather than figures — which is correct, not
   broken. Load one with **Manage → Import**: download the plan template, choose
   the unit on its Read me sheet, fill it, upload it. Press **Demo data** to show
   anyone what a filled-in platform looks like meanwhile.
2. **A plan upload replaces that unit's whole plan** rather than merging into
   it. The one it replaces is archived and restorable, so this is safe — but it
   is not the way to correct a typo. Edit on screen for that.
3. **Authorization is at the door, not per action.** A signed-in person is
   authenticated, but their browser is still trusted about *what* changed.
   Step R4 of the rebuild closes it.
4. **Last writer wins.** Saves replace the whole state transactionally; two
   people editing at once will not corrupt anything, but the second overwrites
   the first.
5. **The SMO password is `1234`** and is not forced to change (§19.4) — weak,
   deliberate, and to be replaced before anything client-confidential goes in.
   Passwords the SMO issues to other people are still temporary and still force
   a change. **No self-service recovery:** a forgotten password is reset by the
   SMO, which also ends that person's sessions.
6. **Usernames are person keys** (`own_mob`, `mobhead`), shown to the SMO beside
   the Set-password control. Real emails are §16.9 work.
7. **The demo content is invented** except Mobile's plan, and labelled as such
   in the product.

---

## Working outside the repo, and bringing it back

You develop in the project folder outside this repo and bring it back. One rule
makes that safe: **start each outside session from the current folder.** Ask me
for a zip, or pull from GitHub. The v2.5 round arrived on a pre-1.9 base, so
taking it wholesale would have deleted four shipped features and everything from
2.0 on — measured at 409, 191 and 187 lines of pure removal in three files.

- **Quick features and adjustments:** just say so here. Nothing to transfer,
  nothing to reconcile, and it lands verified against the real database.
- **Bigger design rounds outside:** fine, from a fresh copy. Then the difference
  is your new work and it merges cleanly.
- **Never send the built HTML as the thing to merge.** It is generated from
  `src/` by `build.py`; an edit made directly to it cannot go back into the
  sources. Edit sources only.

## Where the pieces live

| Path | What |
|---|---|
| `index.html` | The gate — real login when served with a database, legacy AdminSMO latch offline |
| `SMP-Project-Folder/src/` | The platform's sources; `build.py` assembles the single file, `qa.py` walks every page as every viewer |
| `SMP-Project-Folder/strategy-management-platform-v3.10.html` | The built platform (must rebuild byte-identical from `src/`) |
| `SMP-Project-Folder/DECISIONS-AND-LOGIC-v3.17.md` | Every decision with its reasoning — the contract |
| `db/` | `schema.sql`, `migrations/`, `seed-state.json` (generated) |
| `lib/`, `api/` | State reader/writer and auth; the two endpoints |
| `scripts/` | `extract-state.js` (regenerate the seed), `test-roundtrip.js`, `dev-server.js` |
| `specs/` | Per-feature specifications (spec-kit) |

**The verification loop before any handover:** rebuild byte-identical → `qa.py`
walk → `DATABASE_URL=… node scripts/test-roundtrip.js` (clean slate, round trip,
fixed point and the archived-plan round trip must all print PASS) →
`node scripts/dev-server.js` and drive it in a browser.

**Since §313 there are TWO more halves to that loop**, because neither of the
product's sweeps reaches them: the boundary and the seats on the server
(`node scripts/test-platform.js`, `node scripts/test-platform-rules.js`) and
Forefront's own two pages on screen (`checks/multi-client.py`,
`checks/platform-look.py`). And "in both live and demo mode" is gone with the
demo switch — the worked example is a CLIENT now, at `/demo`.

---

## Multi-client (§313, spec 042) — where it stands

| Slice | What it is | State |
|---|---|---|
| US1 | The boundary: every request names its client; Raya moves into its own schema | **Built**, rehearsed on a v2.0-shaped copy |
| US2 | One door, the client cards, the client's name in the chrome | **Built** |
| US3 | The office's own pages: consultants, a client's configuration, who sees what | **Built** |
| US2b | The door is a door — Forefront's shell at `/platform` (Islam's correction) | **Built** |
| US3b | A role is a seat on a client (Islam's correction; retires the four platform roles) | **Built** |
| US4 | The Demo client, and the retirement of the Demo-data button and demo mode | **Built** |
| Phase 7 | Byte-identical rebuild, the two sweeps, §313, the steering files | **Built** |
| — | **The live migration** | **Not run.** Rehearsed only. |

**The one thing left, and it is Islam's call:** `scripts/migrate-to-multi-client.js`
has been run end to end against a copy of a v2.0-shaped deployment and against a
seeded one, twice each, and is idempotent — but it has **not** been run against
production, and nothing merges to `main` without the word (rule 4).

**2026-09-08 — the merge rehearsed (§313.37).** `origin/main` (§294–§312 from
five other sessions) merged INTO the branch locally and pushed nowhere; seven
conflicts resolved, the built file rebuilt, `sw.js` at
`smp-shell-v4.86-client-doors` pending the last-second confirmation (§94.16),
§303 → §313 and spec 030 → 042 on the branch's own lines only. Four faults in
the branch's own code found by reading and fixed (store calls throwing over
HTTP, the store's slug in the wrong place, a dismissal always refused, a
notification press landing on Raya for everyone), asserted and falsified; dead
code and stale comments swept. Every suite green on the merged tree except the
four recorded reds (`csp-net.py` red on main too; `test-concurrent-saves.js`
and `test-push.js` harnesses predating the split; `test-video-endpoint.js`
needs `@vercel/blob`, absent here). **Waiting on Islam's word to merge.**

**§296 — the editable `.pptx` of the review deck.** He chose the PDF *"for
now"*, which leaves the other one open. It is about a day, and the cost is
permanent rather than one-off: a second builder is a second answer to *what is
on this slide*, and this deck has moved four times in a fortnight, so every such
change would have to be made twice from then on.

**§295 / §296 — the merge.** The branch is built, checked and pushed; `main` is
Islam's call on that merge (rule 4). Neither section changes how a save is
judged, so no forced sign-out — but both change the built file, so `SHELL` in
`sw.js` needs bumping at the merge, to a name `origin/main` does not already
hold, confirmed again immediately before the push (§91, §94.12, §94.16).

**2026-09-11 — spec 045, the consulting memory: written, nothing built.** Islam
asked for somewhere consultants record good practices, lessons learned and the
hiccups they met with a client, with a wizard to collect one and eventually an
assistant to ask *"we have hit this before, what happened?"*. `specs/045-consulting-memory/spec.md`.
**It is three things built in one order** — the record, the way in, the
assistant — because an assistant over an empty memory answers confidently from
nothing. **It cannot be a tenant table**: specs 042 and 043 exist to stop one
client's data reaching another, and this is deliberately cross-client, so it
lives in the **platform schema** on Forefront's own side of the door and is
**never drawn inside a client's shell** (asserted at both ends). Two decisions
are Islam's: **everyone at Forefront reads every entry** (cost stated — a lesson
naming Raya's figures reaches a consultant who never worked on Raya), and **an
entry always names its client**, overruling my own recommendation that a
client-less one be allowed — the generalisation arrives through the client's
industry instead. **The industry is not a field on the entry**, because every
client card already carries one. **Flagged, not done:** `clients.industry` is
free text, so two spellings of one industry make the memory answer half a
question — cheap now, expensive in a year, and it touches the client card, which
was not part of the ask (rule 1b). **Two more settled the same day**:
the entry **names its author** (*"the entry is for the team and identified by
who added this lesson or insight"*), and **nothing records who READ one** — a
readership log was offered and refused, written down as a decision rather than
left as an omission, and asserted as an absence at both ends. **AND THE MAIN DOOR IS A PERIOD DEBRIEF, WHICH IS HIS CORRECTION OF THE FIRST
DRAWING**: *"it will not be case by case usually it would be a period of time to
share."* Right, and it changes which button is loud — a consultant comes back
from a month with six things in their head, not one. One conversation, several
insights: the platform writes a prompt carrying the client and the period, the
prompt **interviews** (one question at a time, pushing back on a vague answer,
drawing out what went better / what cost time / what I know now / what I would
warn the next person about) and writes every item back in one fixed block, and
the paste is **split into drafts somebody reads before anything is saved**.
**The prompt forbids invention and the review screen exists because that cannot
be enforced** — the platform cannot tell a paragraph somebody said from one a
model completed. **A block it could not read is shown with its text intact,
never dropped** (§184), and the count says *three read and one it could not*
rather than four found (§108.1). Storing the conversation whole was refused: it
buries five insights inside a sixth and loses the kind, the search and the
filter. The mockup is six states in the platform's own tokens
(`design-mockups/consulting-memory/2026-09-11_consulting-memory.html`).
**SIGNED OFF 2026-09-11** (*"the questions are good, go ahead with the plan"*);
`plan.md` and `tasks.md` written, nothing built. **AND READING THE NEW STACK
FOUND THE TRAP THAT WOULD HAVE KILLED IT IN SILENCE**: `smp-app/db/schema.sql`
ends in one loop that gives every table row-level security and a `tenant_rows`
policy **by EXCLUSION**, so a memory table carrying the obvious column name
`tenant_id` would be handed a policy reading *this row belongs to the current
tenant* — and a consultant on RHI could never read a Raya insight, which is the
entire feature, gone, with no error anywhere. **Worse, the two deployments would
disagree** (§113.7's mirror): `schema.sql` runs ONCE and is recorded, so ours
would be fine and every fresh deployment dead. Answered twice over — the table
joins the exclusion list, **and the column is `about_tenant_id`**, so that if a
later table forgets the list the loop's `CREATE INDEX … (tenant_id)` fails the
apply outright instead of quietly emptying the page. **Three more decisions from
reading rather than assuming**: a route of its own rather than a fourth action on
the carried `platform-api.ts`, which is frozen byte for byte; **no new rule in
`platform-rules.cjs`**, because `platform.html` loads no rules module in the
browser at all and reads flags the server computed (§53.5) — which also avoids a
live drift, that file being byte-identical at the root with nothing syncing them,
recorded and not touched; and the splitter as its own UMD module, being the one
piece with a wrong answer available to it, so it is checkable with no browser and
no database. **Three phases, A usable alone** (the record, then the debrief, then
the assistant), **four checks each red first**, and **two stop points that are
Islam's**: after phase A, on use rather than on a drawing, and the merge.


**2026-09-11 — spec 045 BUILT, all three phases (§319).** Islam: *"go on with
all the phases in sequence and don't stop until you need me for a decision"* —
so stop point 1 is **waived by him** and the words (*insight*, *practice ·
hiccup · lesson*) stay placeholders to be settled on use. **The record, the
period debrief and the assistant**, on the new stack: `memory_entries` in the
platform half of `smp-app/db/schema.sql` + migration 004, `lib/memory-api.ts`
behind `app/api/memory`, `lib/memory-split.cjs`, `lib/memory-ask.ts`, and a
fourth tab in `platform.html`.

**THE TRAP WAS REAL AND WAS PROVED ON A DATABASE BEFORE THE FIX WAS WRITTEN.**
schema.sql's closing loop gives every table RLS and a `tenant_rows` policy **by
exclusion**: a `tenant_id` column here takes the policy **silently** (measured —
`THE TRAP IS REAL — policy attached: tenant_rows`), and `about_tenant_id` with
the list forgotten **fails the apply outright** (`column "tenant_id" does not
exist`). So the naming is a decision about the FAILURE MODE, measured rather
than argued. **AND THE FRESH-APPLY PATH FOUND WHAT THE EXISTING ONE COULD NOT**
(§113.7's mirror, §33.5): on a new deployment schema.sql and migration 004 run
in ONE transaction, so the migration met its own table — `42P07`, the whole
apply rolled back, **every new deployment failing to start** — invisible on the
database to hand. Guarded, and both paths then measured side by side: 0
policies, RLS off, 12 columns, identical.

**THREE MORE FAULTS FOUND BY DRIVING IT AND NONE BY READING**: `deleteTenant`
would have surfaced the new RESTRICT as a raw foreign-key error, so it **names
what is in the way** (§62, §184) — it has no callers yet, established rather
than assumed; `dev-tenant.mjs` could no longer remake the dev tenant; and the
debrief prompt **went stale in the one way that matters** — `change` fires on
blur, so somebody filling in the end date and reaching straight for *Copy the
prompt* copied a prompt with no end date (measured: *"covering 1 August 2026"*
with 11 September in the box beside it). It follows `input` now, which repaints
nothing — it writes into one `<pre>` (§63, §193).

**AND THE CHECK LIED TO ME FOR HALF AN HOUR, WHICH IS THE LESSON WORTH KEEPING**
(§105.6's family): a `next start` from an earlier run held the check's port
**from before a script tag existed**, so every later run bound-failed silently
and measured a four-minute-old DOCUMENT with a current page script — and
reported a product fault that was not there. Both HTTP checks now **refuse to
run if anything is already listening**, and wait for the port after. My own
probe then compounded it by measuring `window.MemorySplit` on the **door**,
because the platform page 401s and redirects there (§50.6).

**FIVE CHECKS, 127 ASSERTIONS, ALL TEN FALSIFICATIONS RED** — split 21/0,
boundary 12/0 (`--break=policy` reddening exactly the four the real fault would,
printing `rows seen: 0`), api 36/0, page 42/0 (contrast measured in BOTH
palettes, §38.5), ask 16/0 against a stand-in for the model (§100.3).
`check:room` 10/0 · `check:deploy` 5/0 · `check:shell` 61/0 · `check:state`
91/0 · `check:door` 49/0 · `test:rules` 588/0 · `tsc` clean ·
`platform-cards.py` 19/0 on **both** copies of the page (§317). **One check
REWRITTEN, never loosened** (§218, §214.3): `checks/shell.mjs` held the literal
*"Clients|Consultants|Who sees what"*, so a fourth page read as a regression.
**`check:demo` is red on the build BEFORE this work**, reproduced with the
change stashed (§303) — this sandbox has no seeded demo tenant.

**FOUR OF MY OWN CHECK'S FAILURES WERE THE CHECK**: a control asserting more
than the product claims (any office account may read the consultants list); a
`textContent` read of a **textarea's value**, which it cannot see; a §260
assertion asking for something the product deliberately does not do (ordinary
spacing is untouched); and a break that was a no-op. **Waiting on Islam**: the
words, on use — and the merge, on that merge (rule 4).

**§319.1 — the merge, and the check that was wrong in a way only the merge run
exposed.** `main` moved **409 commits** under this branch (§318's client set-up
wizard, and §317's last cutover corrections) and the merge was **textually
clean, which is not the same as safe** (§313.37). Read rather than believed:
the two sides touched **disjoint code** — `main`'s work is on the frozen side,
this is the new stack plus Forefront's own `platform.html`, and the only shared
file is this one, which auto-merged — so none of §56.7's shared-scope
collisions was available here, measured rather than assumed. **Everything
generated was rebuilt rather than trusted** (§91): `build.py`, `build-shell`,
`build-sw`, `sync-css` and `sync-static` each reproduced their artefact
**byte-identical** to the merged one, and only `shell/platform.html` and
`public/platform-page.js` moved, which is this branch's own renumber
propagating — the proof the generator ran at all. `node --check sw.js` parses.
**No `SHELL` bump is owed and that is measured**: §91's trigger is *the built
file's bytes changed* and they did not, `main` having already bumped it for its
own frozen change — and since §316.10 split the caching half off, the worker
the new stack serves carries no `SHELL` at all. **`main`'s own
`client-setup.py` is green on the merged result**, because a merge that quietly
breaks somebody else's work is the merge's fault and not theirs.
**AND MY OWN BOUNDARY CHECK DEFAULTED THE APP ROLE'S PASSWORD TO A WORD THE
PRODUCT DOES NOT USE** — `smp_app_pw`, where `lib/db.ts`, `db/apply.mjs` and
`scripts/dev-tenant.mjs` all fall back to the literal `smp_app` — so section 4,
*the read that IS the feature*, **died on a failed sign-in and reported the
boundary broken when what was broken was the check** (§100.3, §53.5, §215). It
passed on every earlier run only because the variable happened to be set in
that shell: *a fixture that invents its own spelling of the product's own
default is green exactly until somebody runs it the way the product runs.* It
takes the product's default now — 12/0, with the section that matters actually
running. **Re-run against the merged result**: memory 21 / 12 / 36 / 42 / 16 =
**127 assertions, 0 failures**, all ten falsifications red; room 10/0, deploy
5/0, shell 61/0, state 91/0, door 49/0, 588/0, `tsc` clean, `platform-cards.py`
19/0 on **both** copies of the page. The frozen `qa.py` sweep is **not re-run
and it is said why**: not one byte of the frozen build changes here, proved by
rebuilding it, so `main`'s own sweep carries over rather than being
re-measured for the sake of a number.

**§365 — the sweep before the merge, and the five things it found,
2026-09-17.** Islam: *"make a full sweep on the branch to make sure that if we
merge to main we will not loose any client access or mess with any current
behavior on the platform."* **The honest sweep had to be of the MERGED TREE**,
which is the first finding and not a preliminary: `main` had moved **33
commits** underneath — the Internal Tracker and Meeting Notes, two whole
modules — so a branch that passes everything says nothing about what production
would hold (§56.7). Rehearsed locally, resolved, everything re-run on the
result; `main` untouched.

**The question asked first, answered by measuring**: access is **UNMOVED**,
both directions — base → main, base → branch, and **merged → main** — 33 people
× 34 shared page keys × 21 targets, every one opening exactly what they opened,
with `c_landing` added and its 693 cells the whole of 8842 → 9535.

**One real regression, and it was this branch's**: §363's flow extraction sliced
a range out of `platform.html` and took the Insights/Processes publishing room
with it — the console called `drawLibrary()` with the function defined nowhere.
Established as mine before anything was touched (§303): the check is **74/0 on
main's own build and DIES on this branch's**. Restored from main's copy, 74/0.

**One that would not have built**: main's registry imports the module this
branch deleted. **Three checks that had stopped checking**, all from one move —
including **five of six falsifications become silent no-ops** while the file
read 33 ok, 0 failed. **And six of the nine spike proofs dark**, which is main's
own tables meeting a harness with two hand-written special cases — closed here,
because the merge cannot be called safe for the tenant boundary without S2.

**And the one that matters most came out of the LAST file run**: sorting was
dead on every Setup table in the product — the register, the business units, the
companies, the supporting functions, the Official BU list. Not slow, not wrong:
the click landed, the page repainted, and nothing moved. **One word** — spec 058
§4.4 gave the header builder a parameter for the column an address can point at,
spelt `id`, which shadows the TABLE's own id one line up, so every sortable head
came out `data-tksort="undefined|N"` and all five tables shared one sort slot.
It renders perfectly and throws nothing, so only PRESSING it found it; the check
**died** rather than reporting, which is the one thing this project keeps asking
of a check. Established as this branch's on main's own build first. Two more
checks were stale rather than broken — §360 absorbed Branding into the set-up
flow and they still walked to the page — **rewritten, never loosened**, with the
group's mark upload verified still drawn where the renderer moved to.

**Verified on the merged result**: the whole frozen suite, 181 checks, **twice** —
once to find it and once on the build that fixes it; `qa.py` 33 viewers / 242 destinations /
ERRORS none, T0 unmoved, authoriser 683/0, change list 140/0, built-in-step and
generated-in-step clear, round trip · clean parity · two tabs 21/0 · the
incremental writer byte-identical on fresh databases; door 140/0, shell 111/0,
state 92/0, **modules 143/0**, comms 47/47, upload 9/0, **tracker 228/0**,
**notes 170/0**, insights 127/0, blob 23/23, store 31/0, setup 33/0 with all six
red, standing 7/0, demo 7/0, room 10/0, deploy 5/0, frameworks 90/0 and 64/0,
assistant 10/0, memory 16/0 · 14/0 · 21/0 · 36/0, `tsc` clean cold, `next build`
green, eight of nine spikes with all sixteen falsifications red.

**Merged to `main` 2026-09-17** as a clean fast-forward, deployment read off the
live site.

---

## §366 — the four that were red (2026-09-17) · **done**

Islam: *"What are these issues that went red? shall we fix them?"* — then
**"go"**. **Every one was run rather than recited, and not one is a fault in the
product.** Three are checks asking about a state the platform no longer holds;
the fourth was never run here.

- **Tactic outcomes, 4 red** — the check needs a tactic whose outcome is still
  blank and §353 filled every one (measured: Mobile's 22 tactics, 0 blank
  outcomes, 0 without a target, all 22 carrying a figure). It MAKES the state
  now, the repair §353.5 gave seven other checks. One assertion rewritten,
  never loosened — it asked the SCORE, which also asks whether anybody
  reported, so it answered null for the other reason.
- **The contingency files, 1 red** — it looked for `45% / 50%`, both halves
  per-cents; the slides carry the pair as counts and days. It asks for the
  thing now rather than one way of writing it.
- **Multi-client — it DIED rather than failing**, on a module row the frozen
  console cannot draw (that endpoint has never sent a `modules` field — the
  band is the served console's, and nothing regressed), and again on the team
  table §360 moved to an address this stack does not serve. It runs to the end
  now and says what it cannot see and where that claim IS asserted. **And its
  falsification had been going green because a stray server held its port** —
  it refuses one in words now.
- **Forefront's own pages — not red at all**: 27/0 given a database.

**Verified**: tactic-outcome 47/0 (red four ways), contingency 0 failures (red
one way), multi-client 124/0 (red 2, port guard proved to fire), platform-look
27/0, `qa.py` ERRORS none, `built-in-step.py` all good. **No product file
changed** — the whole diff is three files under `checks/` — so nothing stored
moves, nothing is migrated and `sw.js` is not bumped.

**Recorded, not done**: the deck's tactics row builds its figure-and-benchmark
pair by hand rather than through the shared builder; the frozen console and the
frozen platform endpoint have drifted (harmless while production serves the new
stack, and a decision rather than a repair); and six more harnesses still do not
say that they need a rehearsal database.

**Merged to `main` 2026-09-17.**

---

## §367 — moving between the client's settings and a module's stopped reloading the platform (2026-09-17)

**What Islam asked.** *"The shifting between the client settings and the main
console and then getting into the strategy and from the module settings to the
client settings takes too long — is there a way to make these movements smoother
in general?"*

**What was measured first.** Three kinds of movement, and they cost wildly
different things. Anything **inside** a module — a unit, a tab, the gear into
that module's own Setup — is redrawn in place: no server, instant. Anything
**between** the console, a client and a module throws the whole platform away
and rebuilds it: the browser re-reads **3.8MB** of the platform's code and
**660KB** of its styling, then asks the server for the client's entire plan again
(**~360KB**, read across 42 tables) before it can draw anything.

**And one of those hops was doing all of that to change one word.** The client's
settings and a module's settings are the SAME page: the server builds both from
the same data and they differ by a single mark saying which list to draw. So
pressing *Client settings ›* or *Strategy settings ›* rebuilt a 3.8MB
application and re-fetched the whole plan for no reason at all. The console and
the module switcher are not waste — those really are different applications —
and neither is arriving in a client for the first time. This hop was.

**Four options were put to him with the cost of each. He took A**, the smallest:
make that one crossing a press.

**What was built.** Pressing either of those two rows now changes the rail in
place, instantly, with no server involved. The link underneath is untouched, so
a middle click, a right-click *Copy link address* and opening in a new tab all
still work and still carry the right address — it is faster and not narrower.
Where somebody has no page at all in the rail they are crossing to, the press
steps aside and the link goes as before.

**One thing had to follow it.** The four-square module switcher in the top left
was kept off the client's own settings by never being built there, which worked
while the only way across was a page load. With the crossing a press it was
wrong both ways — missing after crossing to a module, still standing after
crossing back. It now follows the same rule as the rest of that bar: built where
there is a choice, hidden on the client's own pages by the one CSS rule that
already hides the navigation row, the Group dropdown, the Units | Functions
switch, the gear and the viewer strip.

**Checked.** The shell check was **111 green** before this and is **118 green**
after, seven assertions added — led by the one the whole change is for: a build
that followed the link lands on the same rail wearing the same bar at the same
address, three seconds later, so a marker planted in the page before the press
is the only thing that can tell them apart. Both directions are asserted, and so
is Back. Proved able to fail twice, each break made from the sources: the rows
as plain links again → **2 red**, exactly the two markers; the switcher's old
rule back → **1 red**, the control silently missing after the crossing.

Neighbours: `setup-per-module` green on both halves (its served half drives the
addresses both rails write), plus `setup-rail`, `setup-search`, `setup-pages`,
`setup-sticky`, `setup-squeezed`, `client-setup`, `client-setup-outside`,
`attention-rows` and `welcome`; `modules` 143/0, `door-landing` 140/0,
`built-in-step` clear. **`qa.py` over `file://` is 33 viewers / 242 destinations
/ ERRORS none** — the §365 record to the number, so nothing else moved.

**Not done, and recorded rather than quietly skipped.** Three things would make
the remaining hops faster and none is this change:

* **Back between the console and a client still rebuilds**, because every page
  here is served with an instruction telling the browser not to keep it.
  Loosening that would make Back instant at no cost to the figures — the plan
  never travels in the page — but it is a **security setting**, so it is Islam's
  call, and what a signed-out Back shows has to be measured before it is
  promised.
* **The two big generated files are re-checked on every page change.** They only
  change when we deploy, so they could be stamped with a version and cached.
  Removes two round trips per hop; the re-reading cost stays.
* **The 3.8MB itself** is the floor under every hop that genuinely changes page,
  the module switcher included. A real piece of work, and where the weight
  actually sits has not been measured.

**Merged to `main` 2026-09-18** on Islam's word.

`main` had moved one commit underneath — §366, which repaired three checks and
changed no product file — so this was a real merge and not a fast-forward. The
three record files conflicted and both sides were **kept**, never picked. Then
everything was run again **on the merged tree**, which is the only tree that
matters:

* The frozen sweep: **33 viewers, 242 destinations, no errors.**
* The check this round is about: **118 of 118.** Its neighbours 143 and 140.
* The three §366 repaired: **47 of 47**, **no failures**, **124 of 124.**
* The shipped file is the build; the served copies are what their generators
  produce; the types are clean from cold; the worker parses.

**How we know it is live.** The service worker cannot be the witness here — the
generator drops the half its version name sits in, so the served worker is
identical either side of a merge. What moved are the two files a browser
actually downloads, read off the live site: the platform script
**3,789,535 → 3,794,390 bytes** and the stylesheet **659,996 → 660,815**, both
matching this build exactly. The branch was only brought level after that.

**Nobody is signed out.** Nothing in this merge touches the server, the rules or
the database — read off the file list, not assumed — so no figure, plan or
password moves, and nothing needs migrating.

**One thing to know.** Because the served worker did not change, a tab somebody
left open will **not** be offered "a newer version of the platform is ready". It
keeps the older screen, with its old settings rail, until it is reloaded.

**§371 — the card before there is a client in it (2026-09-19).** Built. Islam,
of §369's one open item: *"didn't we agree to show a grey skeleton?"* — and he
is right: §94.10 settled that for the client platform, and the console's own
boot gate cites the rule while never taking the treatment. Two treatments were
drawn out of the real page at the time and published; he took the skeleton over
the recommendation. The console now draws its title and three grey card shapes
straight away instead of an empty screen, and the real cards replace them —
nothing drawn that could turn out to have been the wrong tenant's. The Add
card's own 152px is shared rather than copied; the search box is deliberately
not drawn over placeholders; the waiting cards come down before a refusal goes
up. **Two assertions went red the day it gained a treatment, which is what they
were for** — rewritten, never loosened, and one of them had already started
passing over an empty sample list. Two neighbouring checks died rather than
reported on a documented command, which is §369.4's fault in two files it did
not reach; both now name a missing page rather than timing out.

Verified: console-boot **13/0 on both copies**, red **five ways**;
platform-cards 21/0, publishing-room 74/0, both also against the generated
copy; client-card-modules 23/0; client-setup-outside and client-archive 0
failures; built-in-step all good. The frozen product is untouched, so the
shipped file is byte-identical and no `sw.js` bump is owed. **Recorded, not
done:** the heading still shifts 77px down when the tab row lands — it is in
the signed-off pair, and closing it means drawing a navy band nobody has seen.

**§371.5 — renumbered before the merge (2026-09-19).** Main took §366 and §367
for different work while this branch was building, so the branch's four
sections shifted up by one: §367 → §368 (the client card's marks), §368 → §369
(the console's boot), §369 → §370 (the browser signs you in), §370 → §371 (this
one). **Done BEFORE the merge, which is what makes it provably scoped** — the
merge base holds no citation of §366–§371 in any spelling, measured, so every
occurrence in the tree was a line this branch wrote (§264.3). Descending, or
each step eats the next; **both spellings**, because CLAUDE.md uses the HTML
entity throughout and a one-spelling sweep would have left 29 citations naming
somebody else's sections (§336.1); every substitution asserted it matched the
count measured first (31 / 9 / 56 / 57); and of 150 changed lines, 0 do not
carry a citation. **The sweep also took the two sentences describing the
numbering itself**, which then named the wrong number — the fault in miniature,
and why both were rewritten by hand.

**§371.6 — a bare `.ccard` stopped meaning a client (2026-09-19).** Found by
running the neighbours on the merged tree: `door-landing.mjs` 142 ok, 1 failed.
**This round's fault, not the merge's** — the check is byte-identical to §371's
tip but for the renumber, and the cause is §371's own markup: a placeholder is
a `.ccard` with no client, no name and no heading, so the wait returned on the
skeleton and the name was read a beat early. A race, which is why it passed at
§371's own run. The wait is `.ccard[data-client]` now — what `.ccard` meant when
the line was written (§218) — 143/0 twice on two fresh databases; and every
other reach for a card was swept (§51.11), two more fixed, one left as correct.

**Merged to `main` 2026-09-19 on Islam's word.**

---

## §376 — The reports, as a tab in the platform (spec 061, 2026-09-20)

**On the branch `claude/trusting-wright-1m2bgv`, not merged.**

**What Islam asked for.** That a client's own people reach the Insights library
from a tab beside the tabs they already use, rather than from the module
switcher — *"the module is managed by the smo which is relevant but the user to
move between modules is not very usable."*

**What was wrong, measured first.** The switcher is a four-square picture with
no word beside it, in the pale top bar, in a different row from every other
piece of navigation — and for a client's person it opens a menu of two, one of
which is the page they are standing on. **And it offers doors that refuse
them**: Tracker and Notes declare no area, so `decideOpen` lets a client's
person through and their pages turn them away.

**What he chose.** Three placements were drawn at real size in the product's own
chrome and published; he picked **C**, a real tab. It was the one recommended
against, so the cost is recorded as his: the library is the *client's*, so the
tab shows the same reports whichever unit you stand on. Then three decisions,
all confirmed: every destination carries the tab; the tab writes the module's
own address; the four-square mark is drawn only where the tabs cannot reach.

**Built.** `libraryRows`/`readLibrary`/`libraryFragment` shared by the module's
page and the tab; `GET /<client>/insights/list`; the `data-library-cats` stamp;
`src/insights.js` (`LIBRARY`) with its sections, its pane and its three count
answers; `LIB_TAB` declared once and referenced on all four destination kinds;
the pane's design scoped to `.libpane`; the address and the switcher in
`shell/route.js`; `checks/insights-tab.mjs`.

**Checked.** 16/16 on the new check, **proved able to fail three ways from the
sources** (3 / 1 / 3 red), the source restored byte-identical and the build
re-run after. `built-in-step.py` all good; the four generators re-run and
`generated-in-step.mjs` clean but for the uncommitted-edits line, which is its
"you have edits in flight" answer and not a stale copy. `sw.js` bumped to
`v5.20-reports-tab`, a name neither `main` nor this branch held.

**Not run here, and said rather than left as an absence (§54.5).** Neither
Playwright binding is installed in this session, so the tab was **not driven in
a browser**: what is asserted is the rules, the row builder's four states and
the structure — not that it renders. §5 of the check is written for the served
sweep and names what it covers.

**Recorded, not done.** Tracker and Notes are still offered to a client's person
on a tenant that holds them. Decision 3 empties that menu for a client with
Strategy and the reports, and leaves it standing for one that also has an office
module — so **my second mockup's claim that decision 3 closes the defect "for
free" is true of the shapes in front of us and not in general**, corrected here
rather than left standing (§124). The fix is those two modules' own area
declarations, which this round was not asked about (rule 1b).
## Portfolio — the delivery plan, per client (spec 060)

**Waiting on Islam, not on me.** Nothing is built and no source has moved; this
is a spec and six drawings. Three screens are signed off — the project team, the
charter and the plan — and **three await a word**: Progress, Analytics and now
the landing.

**Every screen is drawn as of 2026-09-20.** The landing was the last one with no
picture: the project list for this client, with each project's state and the
cross-project reading §9.11 deliberately kept off the tabs. One question and a
row answers it four ways — how far along, whether it is late, what is waiting on
somebody, and when anybody next looks at it.

**A project has no status field and never gains one.** Every figure in that list
is worked out from the plan underneath it, so the list cannot disagree with the
four pages behind it. Two of the five projects drawn have no figure at all, on
purpose: one has a charter and no plan (which says so rather than printing 0%),
and one has a plan nobody has started (which is 0%, and is the difference).

**What changed in the drawings' own plumbing.** The rows were already shared
between three drawings; **the sums were not**, and were about to be copied a
fourth time. They live in one file now and are spliced the same way — proved
behaviour-neutral (all three render byte-identical to what they published) and
proved load-bearing one break at a time. The extraction broke the Plan on its
first attempt, taking a helper out with the block it sliced; the baseline had
been captured before the first edit, so it was one diff rather than a hunt.

**And this container can render, where the earlier rounds' could not.** So every
figure on the new page was read out of the rendered document, the three older
drawings were confirmed byte-identical to what they published, contrast was
measured across all four in both palettes (**0 failures**, with the probe proved
able to fail first), and the table's fit was measured at seven widths from 1600
to 768 with nothing scrolling sideways.

**Next, and it is a decision rather than work**: three sign-offs. After them,
the spec's own §10 still says what building needs — this repository has never
seen the reference code, so the two audits behind §7 and §9.11 were written by
sessions with it attached and nothing has been run.

---

## Portfolio — the rules and the tables (2026-09-20, spec 060, §375)

**Built: the half with no picture.** Every screen of this module is drawn and
three of the six are signed off, so what could honestly be built is the part
that is decided and has no design in it — the shape the data takes, and the
rules that say what may be done to it.

**Nothing on any screen has changed and nothing can be opened.** Portfolio is
still switched off in the list of modules, so there is no page, no address and
no entry in the switcher. That is asserted rather than assumed: a module
switched on with nothing behind it is a door onto an empty room.

**What is in it.** Eight tables — the plan's tree (phases, work packages,
activities and their breakdown), who is on a project and at what, and the three
words a client uses for the levels. And the rules the spec calls the actual
product: two people finish an activity rather than one, and reopening it is
gated the same way as signing it off; the real dates are worked out and never
typed, at one place in the code; progress comes from the breakdown and a typed
figure over it is refused with the reason; moving a date shows you what else
moves before anything commits; the numbers renumber themselves, so deleting a
phase cannot leave a gap; and a phase's figure is made of the rows under it
rather than stored, which is what stops it disagreeing with the page it summarises.

**How it is proved.** 121 assertions with no browser and no screen, each
refusal asserted beside the same act allowed to somebody the rule admits — and
the whole file proved able to fail ten times over, one break per rule, before
the green run was believed. The tables were proved by running them twice: on a
fresh database, and on one already up, where only the migration creates them.

**Two things worth recording.** One break modelled a broken function rather
than the defect it was named after, and was rewritten until it reproduces the
fault exactly. And building §6 found two sentences in the spec pointing
different ways — whether a Lead can name somebody onto a project, which the
team screen says no to and the charter implies yes. Answered the narrow way,
written into the spec, and Islam's to settle.

**Not this work's, established on a baseline first**: the Tracker's check is
one red on a date that has gone stale since it was written, and one spike proof
dies in its own seed harness on a Meeting Notes column. Both recorded.

**Next, and still a decision rather than work**: the three sign-offs. Nothing
visual can be built until they are given.

**§375.1 — merged to `main`, 2026-09-20.** Islam: *"merge to main."*

**Main had moved 73 commits underneath** — Setup per module, the client's
settings in the platform, the registry drawn inline — and had taken both this
round's numbers, so §359 became §375 and spec 056 became spec 060 **before**
the merge, which is what makes the renumber provably this branch's own and not
somebody else's citations swept up by accident.

**Four files overlapped and every one was combined rather than picked.** The
proof is a measurement, not a reading: against `main` exactly one line is
removed across the three records, and it is main's own "Last Updated" line
becoming "Earlier", which is what that file does with an entry that is no
longer the newest.

**The frozen platform is untouched, byte for byte**, so nothing was rebuilt and
the service worker is not bumped — what a client's browser receives does not
change.

**Everything was re-run on the merged tree**, because a branch that passes says
nothing about what production would hold: Portfolio 121/0 and red all ten ways,
and thirteen other checks green, with the build and a cold typecheck clean.
**One red is main's own**, reproduced on a worktree of main before anything
here was blamed — a check whose expected wording has gone stale as the weeks
moved.

**What is on `main` is the rules and the tables and not one screen.** Portfolio
is still switched off; the three drawings awaiting sign-off are unchanged and
still waiting on Islam.

**§375.2 — pushed to `main`, 2026-09-20.** Main had not moved, so it
fast-forwarded onto the tree that was actually checked.

**What could not be checked from here, said rather than claimed**: this
machine's network policy refuses the production address outright, so nobody
here has seen the live site serve this commit. And there is no file to compare
even if it could — this round changes not one served byte, so the two builds
look identical from outside; what production gains is in the database and in
code nothing calls yet.

**The branch is deliberately left behind main** until production has served it,
which is the rule for keeping a deployment from being raced away.

**Nobody is signed out and nothing stored moves**: no request-handling file
changed, nothing reads the new tables, and the migration only adds its own
eight.


## §376.1 — The reports-as-a-tab round, merged to main (2026-09-20) · **done**

Merged on Islam's word, and the renumber came **first** — main had moved 30
commits and taken §375 and spec 060 for Portfolio, so this round became **§376
and spec 061**. Doing it before the merge is what makes the scoping provable:
the merge base holds neither string, so every occurrence was this branch's by
construction.

**What the run taught.** The renumber pass planned from a per-pass snapshot, so
on the four files taking two substitutions each the second write was made from
the original text and discarded the first — with every per-pass assertion
passing, because each was measured against the snapshot it was planned from.
Asserting that a substitution *matched* is not asserting that it *survived*;
what catches it is the final state of the tree.

**The merge.** Five conflicts: the three record files combined rather than
picked (0 headings lost from either side, asserted), the built file rebuilt
rather than merged, and `sw.js` rebuilt from main's copy with the one line
re-applied at a name past both (v5.20). The merged concatenation scans to 1514
top-level names with exactly the six duplicates §281.1 leaves.

**What ran, and what could not.** Built-in-step and generated-in-step all clear;
authoriser 683/0, change list 140/0, platform rules 69/0, KB audience clear,
session-state and db-url-choice clear, KB corpus in step, seed byte-identical.
This container holds neither `smp-app/node_modules` nor python Playwright, so
`qa.py` and every frozen browser check could not launch, and `insights-tab.mjs`
is 16/0 with two sections declaring NOT RUN in their own words.

**Nobody is signed out and nothing stored moves** — no frozen `api/`, `lib/` or
`db/` file is in this branch's work. The live read could not be made from here
(the egress policy refuses the host at CONNECT), so nobody here has seen
production serve it; the witness is `shell.js` 3,827,402 → 3,843,984 and
`platform.css` 669,731 → 674,039. The branch is deliberately not
fast-forwarded, keeping main's tip unique.

## §377.6 — Merged to main (2026-09-20, spec 059) · **done**

Islam: *"MERGE TO MAIN"*. Merged, pushed, and the deployment is the one
thing that could not be confirmed from here.

**Main had moved 33 commits and had taken §375** — Portfolio (spec 060)
and the reports as a tab (spec 061). So this round is **§377**, renumbered
**before** the merge, which is the only moment that is provably scoped:
the merge base holds §375, §376 and §377 nought times, so all 20 citations
were this branch's own and main's 26 could not be swept up. Both
spellings; no changed line carries anything but a citation. Spec 059 is
unchanged — it is this branch's own and was already on main.

**`sw.js` was §94.12 exactly**: both sides wrote `smp-shell-v5.20-*`.
Resolved to **v5.21**, unique against every name the history holds, one
declaration, parses clean. `CLAUDE.md` combined rather than picked. The
built file rebuilt from the merged sources and byte-identical to the
build; the four generators re-run.

**The decisions doc was out of order and it was my own drift, not the
merge's** — §377's block sat between §374 and its own §374.1 at the wrong
heading level, measured on the branch before the merge. Put in order.

**Green on the merged tree:** `qa.py` ERRORS none · built-in-step ·
generated-in-step · people-dialog · identity-merge · nine register-family
neighbours · authoriser 683/0 · change list 140/0 · platform rules 69/0 ·
db-url-choice 10/0 · session-state · kb-audience · setup-shape 33/0 ·
deploy-context 5/0 · assistant-defaults 10/0 · declared-deps ·
insights-tab 16/0.

**Unrun, and said so rather than left as an absence:** `smp-app/node_modules`
is empty in this container, so twenty served-stack checks and `tsc` could
not run at all. §377 touches no `smp-app` source — only the two generated
files — and `generated-in-step`, which does run, proves those are exactly
what the generators produce.

**No forced sign-out is owed**, read off the diff: no `api/`, `lib/` or
`db/` file is in it.

**The deployment is unverified and is said to be:** the proxy refuses
`smp-orpin-tau.vercel.app` at CONNECT with a 403. The witness would be
`shell.js` **3,843,984 → 3,843,142** and `platform.css` **674,039 →
673,729** — never `sw.js`, whose served copy is byte-identical either side.
**The branch is deliberately not fast-forwarded**, so main's tip stays
unique until somebody has read the live site.

## §378 — An address is taken whole (2026-09-20, spec 059) · **built, on the branch**

Islam: *"can you make a right click on the email to highlight the whole email
to copy on right click .. as it happens on the phone number."*

**Measured first, and the report does not reproduce.** Since §377 both cells
come off the same line, and driven in a real browser a right-click selects
**nothing** on either, while a double-click and a drag each take the whole
value on **both**. So what differs is his browser's idea of a word, not this
table — which is why the answer could not be a difference between those two
lines. *(The first run of that probe reported the reported fault, because it
measured both boxes once up front and the email's double-click repainted the
page underneath the Mobile coordinates — §222. One page load per gesture.)*

**What was built:** `user-select:all` on those two values and nowhere else,
so every gesture takes the whole of one in every browser. It is the
product's own device — §43.8's issued-password box has carried it since it
was written — not a new one.

**The two costs were stated before he took them** (*"yes agreed for the
question and build"*): a plain left-click highlights the value too (it copies
nothing, so §377 stands), and a drag can no longer take part of an address.

**Both cells, never one** — they are identical today, so changing only the
Email would create his own complaint in reverse. **Scoped to those two**, and
the check measures a column that was NOT asked about in the same run and
requires it to select nothing, or a build that widened the rule to every
value in every Setup table passes everything else (§94.2, §113.8).

**Nothing visual moves**, measured: same widths, same row heights, same
colours — so no mockup was owed (rule 1c).

**Verified:** `people-dialog` all good with four new assertions; proved able
to fail **twice from the sources** (§276), one break per decision, each
asserted to have matched first (§344.1) and each reddening only its own:
the rule removed **2 red**, printing the reported state verbatim; the rule
widened **1 red** on the scoping assertion, printing `'Ashraf Laithy'` — the
widened rule reaching a column nobody asked about. The tree was restored and
rebuilt byte-identical to the build the breaks were made from (§343.9).

**And two of my own new assertions proved nothing first (§378.1)**, found by
falsifying rather than by reading. The scoping one went GREEN on the very
build it exists to catch, because it ran after another right-click in the
same page and the second right-click of a page does not land — *nothing
selected* is also what a correctly scoped build reports. And the clicks were
landing on the wrong element: with every column showing the register scrolls
sideways, so those cells sit off the right edge or beneath the frozen last
column (§373.2), and the hit test read back `NOTHING` and `TD`. Each gesture
gets a fresh page now, the cell is brought into view first, and the check
**asserts where the click landed before it asserts what was selected**
(§93.4). Both falsifications were then run AGAIN, because one made before a
check is rewritten proves nothing about the check that ships.

**Nothing stored moves, nothing is migrated, no forced sign-out** — read off
the diff, no `api/`, `lib/` or `db/` file (§172, spec 029). The built file's
bytes changed, so `sw.js` is bumped to `v5.22-whole-values` (§91) — reaching
the offline copy alone, since the generator drops the half carrying the name.

**Not merged: `main` is Islam's word, on that merge.**

## §378.2 — Merged to main (2026-09-20, spec 059) · **done**

Islam: *"merge to main"*.

**Main had not moved**, measured rather than assumed — `origin/main` was at
§377.6, this commit's own parent — so it is a clean **fast-forward** and the
tree pushed is byte-for-byte the tree that was verified. No resolution, no
rebuild, nothing recombined. §378 was free on main, so no renumber was owed.

**`sw.js` confirmed immediately before the push** (§94.16): `v5.22-whole-values`
against main's `v5.21`, a name the history has never held, one declaration,
`node --check` clean.

**The merge carries its own record commit** (§91, §357.4): the branch tip was
already pushed, and Vercel deduplicates by SHA, so `main` needs a commit the
branch does not hold — and the record owed one anyway, since §378's block still
read *"main untouched"* over a merge that had happened.

**The deployment is unverified from here and is said to be** (§54.5): the proxy
refuses `smp-orpin-tau.vercel.app` at CONNECT with a 403. The witness is
`shell.js` **3,843,142 → 3,844,669** and `platform.css` **673,729 → 674,285**,
both larger — never `sw.js`, whose served copy is **4,104 bytes on both**.

**No forced sign-out is owed**, read off the diff: no `api/`, `lib/` or `db/`
file. Nothing stored moves, nothing is migrated.

**What to go and check:** Setup › People register — right-click an email, then a
phone number: the whole value should highlight and Copy should be live. A
double-click should still open the cell for editing. Nothing else on the page
should look different.

---

## §379 — The working copy carries the platform (2026-09-21, spec 030) · **merged to `main`**

Islam downloaded a working copy from his own tenant and it would not open:
*"the working copy download html is damaged."*

**Nothing of his was lost, and that was the first thing to establish.** The
file is 1,593,876 bytes and **1,580,208 of them are Raya Trade's plan**, whole.
What is missing is the platform — 12,716 characters of markup, with the code
and the design left as LINKS to the server: `shell.js` (3.84 MB),
`platform.css` (674 KB) and `theme.js`. So the backup asked the server for the
product on the one day the whole feature exists for.

**Measured at both ends rather than reasoned about** (§3a). His file, driven in
a real browser from a file path: **0 destinations**, 19 tags in the page — the
boot skeleton and nothing else. The same file with the three put inside it:
**Raya Trade, 28 destinations, 219 rail rows, 11,401 tags**. He has that
repaired file.

**The cause is §306 meeting the cutover, and neither was wrong when it was
written.** The copy is made by fetching the page and adding the graph, which
was the whole product while production served one self-contained file (4.47 MB,
**zero** external references). Since §316.10 production serves a 12 KB shell
that links its code. *The backup depended on exactly the thing it is a backup
against.*

**Why nothing caught it**: `checks/contingency.py` serves the frozen
self-contained build as the platform, for a reason of its own (§100.3), so the
copy it makes is whole by construction — **no check had ever made one from the
page production serves** (§94.11, §329's family).

**What is built is Islam's pick of two**, each with its cost stated first:
every linked script and stylesheet is fetched and put inside the file, derived
from the document rather than from a list of the three names (§104.7). The
alternative — serving the frozen file for the copy — was recommended against,
because what you open would stop being the screen you pressed from.

**Nothing visual moves and it was checked rather than assumed** (rule 1c): the
card, its three buttons and their words are untouched, and the press already
says *Taking…*.

**§379.1 — and `String.replace` reads patterns in the replacement.** `$&`, `$1`
and friends are interpreted inside it, so inlining 3.8 MB of `shell.js` — which
writes `"<\/$1"` in its own regexes — corrupted the copy at every one. §306's
own line had it too, on the JSON. Proved load-bearing: **6 red** with the plain
form back, the copy throwing *Unexpected end of input*.

**§379.2 — three of the new check's own assertions were the check**, all found
by falsifying: a text search that cannot tell a tag from a sentence about one
(the copy carries the comment naming the tag it removes, §272.8); an assertion
that THREW where it should report, ending the run with one failure printed of
forty (§215); and a guessed property (`header.top` is `static`, `.chrome` is
the sticky one) replaced by the paint — the page's own `--ground` defined and
painted.

**§379.3 — and a stylesheet points at things of its own.** `platform.css`
links one font, and §38.7 embedded that face precisely because *a linked
webfont would break the offline single-file handover* — the frozen build
carries it as a data URI and the served one does not, so a copy that inlined
the CSS and stopped would open in the system stack. Every same-origin `url()`
in an inlined stylesheet is carried too. **A missing one is not a refusal**,
which is the opposite of the rule for the script and the stylesheet and is
stated rather than left to be discovered: without those the copy does not work,
without the face it works and reads in a different font.

**Verified**: contingency **0 failures**, red **8 / 6 / 1** from the sources
(§276), one break per decision; **and one break refused itself**, the line it
replaces having moved, with the run that followed reporting 0 failures — which
is indistinguishable from a guard that works (§54.5), and the only reason it
was not believed is that every break asserts it matched first (§344.1). The
tree was restored from a saved copy and rebuilt byte-identical (§343.9).
deck-pdf 0, import-page all green, `qa.py` ERRORS none; `built-in-step` all
good; the four generators re-run. `sw.js` bumped to
`v5.23-copy-carries-platform`, because the built file's bytes changed (§91).

**§379.4 — merged to `main` on Islam's word (2026-09-21).** `main` had not
moved — measured, not assumed: it stood at this commit's own parent, so the
merge is a clean fast-forward and the tree pushed is byte-for-byte the tree
that was verified. §379 was free on main, checked in both spellings, so no
renumber was owed (§264.3). `sw.js` confirmed against main immediately before
the push (§94.16): `v5.23-copy-carries-platform` against `v5.22`, a name the
history has never held, one live `const SHELL`, `node --check` clean.
**The merge carries its own record commit**, because the branch tip was
already pushed: Vercel deduplicates by SHA, so fast-forwarding main onto a
commit the branch ref already holds is one deployment and which ref gets it
is a race already lost (§91) — and the record owed the line anyway, since
§379's own block still read *"main untouched"* over a merge that had
happened. **§379.5 — the live read was made, and this block first said it
could not be**: that sentence was carried over from §377.6 and §378.2, where
the proxy refused the production address, and was written before it was tried.
It answered 200. Corrected rather than left standing (§124) — and the cost is
named: on those two merges the deploy went unverified when it need not have.
**Production has served this commit**, read off the live site and compared as
**bytes** rather than as a length (§113.8): `shell.js` sha256 `702fd30c…`,
identical to the generated copy, where the read two minutes earlier answered
3,844,669 — §378's build — so the two readings tell a landed deploy from one
that had not. The witness is **`shell.js` alone**, measured rather than
assumed: the served `sw.js` is 4,104 bytes on both builds (the generator drops
the half carrying `SHELL`) and `platform.css` is 674,285 on both (no
stylesheet changed), so neither could prove anything; `shell.js` goes
**3,844,669 → 3,852,494**. **The branch was held behind and then brought up**,
in that order, so main's tip was unique for the whole window that mattered —
**and the stop hook asked for that push while the hold was on**, which is
recorded rather than quietly obeyed: a generic rule about unpushed work
against a specific one about a deployment in flight, answered by finishing the
wait. **No forced sign-out is owed**, read off the diff (spec 029): not one
`api/`, `lib/` or `db/` file is in it. `built-in-step` all good,
`generated-in-step` all clear before the push.

**Recorded, not done**: the copy still links the favicon, the manifest and the
touch icon, which 404 from a file — decoration, and refusing on them would
refuse a backup for a missing picture.

**What to go and check:** Setup › Import & storage → *Working copy*. The press
takes a few seconds longer and the file is about 6 MB rather than 1.6. Open it
with no connection: it should come up on your own tenant, fully styled, with
the navigation and the decks in it.

---

## §380 — One blank template per way of planning (2026-09-22, spec 059) · **merged to `main`**

Islam: *"in the template download we need to have the different types of
functions plans templates."*

### What was wrong

The blank-template card on **Setup → Import & storage → Download** offered
**two** buttons where a supporting function plans **three** ways, and its
sentence had been wrong for some time — *"a capability plans in projects and
everything else in pillars"* stopped being true when a function was given its
own projects, and it never mentioned objectives and actions at all.

Worse than a missing button: the card's own words send you to the **wrong**
one. Pressing *Pillars* for a function that plans in objectives and actions
gives a unit's workbook; pressing *Projects* gives a file with **no Actions
sheet**, whose dropdown does not even offer that function.

### What was built

Three buttons — **Pillars · Projects · Objectives & actions** — under a
sentence that is true: *"One per way of planning. A unit always plans in
pillars; a function plans whichever way Setup says."*

- **Each blank file carries only the sheets its format uses.** Projects drops
  Actions; Objectives & actions carries Read me, Objectives and Actions and
  none of the four project sheets.
- **Each file's Read me lists only the subjects that format fits**, and says
  *Supporting function* rather than *Capability* where only a function can plan
  that way.
- **A subject downloading its own plan is untouched** and still gets all seven
  sheets — the earlier decision, not reversed.

Two costs, both stated before they were taken and both accepted: a subject's
own download keeps every sheet, and a function whose format changes after a
download has to download again.

### A live defect found while building it

**A function that plans in objectives and actions was offered a template the
upload could not take back.** The file's dropdown offered it; the upload
answered *"no business unit, supporting function or capability called
\"HR\""*. Measured on the shipped build. A plan that downloads and cannot come
back — one question with two answers, written out in two places, drifting the
moment one gained a format the other had not heard of. Both sides ask one
function now.

The check that should have caught it asserted the half that worked: it asserted
the function is **offered**, then read the file through the reader **directly**,
never through the door a person actually meets. It drives the real control now.

**And a template nobody can fill in**: before a tenant has a single function
planning that way, the narrowed list is empty — and an empty dropdown refuses
every value there is, so the cell can be neither picked from nor typed into. No
validation is written for an empty list.

### Proof

- `checks/import-page.py` §2 rewritten, `checks/objectives-actions.py` §8b
  added — 47 → **52 passed, 0 failed**; `import-page` all green.
- Proved able to fail **six ways from the sources**, one break per decision:
  2 / 3 / 7 / 2 / 3 / 1 red, each reddening its own assertions. The stranded
  button prints `{'rows': 2, 'lead': 592}`; the door prints the reported
  refusal verbatim.
- Neighbours green: `template-round-trip`, `functional-projects` 45/0,
  `project-tables`, `fn-pillars`. `qa.py` over `file://` **ERRORS none**.
- The built file is in step with its sources, the served copies regenerated,
  and `sw.js` bumped.

### §380.2 — Merged to `main` (2026-09-22) · **done**

**`main` had not moved** — measured, not assumed. It stood at §379.5, this
branch's own ancestor, so the merge is a clean fast-forward and the tree pushed
is byte-for-byte the tree that was verified: nothing resolved, nothing rebuilt,
nothing recombined.

- **§380 was free on `main`**, checked in both spellings rather than assumed, so
  no renumber was owed.
- **`sw.js` confirmed immediately before the push**:
  `v5.24-three-blank-templates` against main's `v5.23`, a name the history has
  never held — measured across every commit that has ever touched that file,
  not only against main — one live declaration, and the file parses.
- **The merge carries its own record commit**, because the branch tip was
  already pushed: Vercel gives one deployment per commit, so putting the same
  commit on `main` and on the branch is a race for which one gets built. The
  record owed the line anyway, since all three files still said *"on the
  branch"* over a merge that had happened.
- **The witness for "production has this" was measured, not carried over from
  last time.** The served `sw.js` is 4,104 bytes on both builds, so it can
  prove nothing; `shell.js` (3,852,494 → 3,861,361) and `platform.css`
  (674,285 → 674,961) both moved, so this round has two witnesses where the
  last had one — because this round changed a stylesheet and that one did not.
- **Nobody is signed out** — read off the diff: not one `api/`, `lib/` or `db/`
  file is in it, so nothing about how a save is judged moves, nothing stored
  moves and nothing is migrated.
- Both in-step guards clear before the push.
- **Production has served this commit** — the live read was made rather than
  written ahead of itself, and it landed in about **60 seconds**. The read
  taken minutes earlier is what makes it mean something: the site was serving
  §379's build to the hash, so the two readings tell a landed deploy from one
  that has not. Both witnesses came back byte-identical to what the generators
  produce — `shell.js` 3,861,361 and `platform.css` 674,961.
- **The file that could not be a witness was measured, not quoted**: the served
  `sw.js` is 4,104 bytes and holds the cache-name string nought times, which is
  the generator dropping that half, shown on the live site rather than cited.
- **The branch was held behind and then brought up, in that order**, so `main`'s
  tip was the only ref carrying the commit for the whole window that mattered.
- **One thing to expect rather than report**: because the served worker's bytes
  did not move, a tab left open on the old build is *not* offered *"A newer
  version of the platform is ready"* — it keeps its old shell until somebody
  reloads it.

### Waiting on Islam

- Four things flagged on the mockup and deliberately not folded in: the
  projects file's Read me still says *Capability* over a list of functions; the
  Pillars button spells the word as a literal where the page beside it uses the
  tenant's own word; a capability plans two ways where a function plans three;
  and an archived plan's workbook carries no format.

---

## §381 — the plan builder, on a supporting function (2026-09-22, spec 020)

Islam: *"we need to have build a plan for the functions like what we did with
the units."*

**The builder already opens on functions and was largely blind there.** Driven
on **Finance** — which holds three projects, a definition and two key
objectives — its band read **○ ○ ○ ○**, every box empty, and the same on
**six of the seven functions that plan in projects**. It counted a function's
work inside the function's **capabilities**, and that work moved onto the
function itself earlier this month, so it was counting an empty box. The map
is the whole point of the builder, and it said the plan was empty when it was
not.

**Built and verified: the repair.** The count now reads where a function's
work actually lives — the same list its own pages read, so the band cannot
disagree with the page it points at. Finance now reads **✓ Definition · 2
Objectives · 3 Projects**, exactly what it holds; all seven functions agree
with their own plans. Nothing visual moved, so no drawing was owed for this
part.

**The shape for the rest, confirmed by Islam before building** (*"yes the
shape is right"*): a function's builder is **Definition · Objectives · its
work · Review** — four boxes where a unit has five, because a supporting
function does not write its own aspiration or its own SWOT; it takes both from
the unit it plans under.

**Waiting on Islam — the drawing.** Two pieces change what the band shows and
are drawn first: a function that plans in **pillars** gaining its Definition
and Objectives boxes (it has two today where a unit has five), and the third
way of planning — **objectives and actions** — getting a route at all; today
it falls through to the projects one and would be offered a *Projects* box its
pages do not have. The chip label *Definitions* becoming *Definition* is in
that drawing too, since a label is a visual element.

`plan-builder` all green with seven new assertions, proved able to fail twice
from the sources (4 red and 1 red, each break reddening only its own);
`functional-projects` 45/0, `objectives-actions` 47/0, `fn-pillars`,
`fn-ko-edit`, `capability-entry` 43/0, `capability-remove` all green; full
`qa.py` sweep ERRORS none. Screen only — nothing stored moves, nothing is
migrated, nobody's rights move. **Merged to `main` 2026-09-22**, with the
round below it.

## §381.2 — one shape, three formats (2026-09-22, spec 020)

Islam, of the shape drawn before anything was built: *"yes the shape is right,
go ahead"*, then *"proceed."*

**Built and verified: the other two pieces.** A supporting function's builder
now shows the same four boxes whichever of the three ways it plans —
**Definition · Objectives · its work · Review** — and only the work box
differs: *Pillars*, *Projects* or *Actions*, each counting the thing that page
actually holds. A function that plans in pillars had two boxes where it should
have four; a function that plans in objectives and actions had no route of its
own at all and was being offered a *Projects* box its pages do not have.

**The two boxes a unit has and a function does not are missing on purpose** —
a supporting function does not write its own aspiration and does not write its
own SWOT: it takes both from the unit it plans under. So *"like the units"*
cannot mean identical, and which two are absent is part of what was agreed.

**Two things were broken underneath and neither had been reported.** Adding an
action while building wrote a **blank row** — every other kind of row is asked
for on a small form first, and the action was the one the builder did not know
about, on exactly the way of planning this piece is for. And a function
**could not be created** as objectives-and-actions at all: the question on the
form offered two answers, and the part that makes the function was written for
two as well — so widening the question alone would have created a function
that says it plans one way and plans another, silently, on the one screen that
asks. Both ends are fixed and both are checked.

**The chip label is *Definition*, singular**, as drawn.

`plan-builder` all green with 27 new assertions, proved able to fail five ways
from the sources (3 / 9 / 8 / 8 / 1 red, each break reddening its own);
`objectives-actions` 47/0, `functional-projects` 45/0, `capability-entry`
43/0, `fn-pillars`, `fn-ko-edit`, `capability-remove` and `import-page` all
green; full `qa.py` sweep ERRORS none; the shipped file and the four served
copies back in step.

**Two faults in the check itself, both recorded rather than tidied away.** Its
first falsification run **died rather than reporting** on three of the five
breaks, so it reported four failures where there are twenty-nine — the counts
above are the second run, after every probe was made to carry on. And its own
press of the pen **closed** a pen the builder had just opened, which read for a
while as a product fault until it was measured.

Screen only — nothing stored moves, nothing is migrated, nobody's rights move.
**Merged to `main` 2026-09-22 on Islam's word.**

`main` had moved four commits while this was being built, and had used the
same section numbers for a different piece of work — the blank plan
templates. This round's numbers were moved up **first, before the merge**,
which is the only moment it can be shown that only this branch's own lines
were touched.

The two sides met in one file and **fitted together rather than fighting**:
the other piece taught the plan page to add an action, this one taught the
builder to ask for it on a form first, and the merged page tries the form and
falls back to the plain add — which is what both were written to do. The two
records were combined rather than one being chosen, with every heading from
both sides checked present afterwards.

**The offline copy's cache name had been written by both sides in the same
week**, differing only in its last few words — so the two collided, which is
the good outcome: the same words on both sides would have gone through in
silence with different files behind them, and a browser that had opened the
platform before would have gone on serving itself the old one. Moved past
both, to a name nothing has ever served.

Everything was re-run on the **merged** result rather than on the branch: the
nine checks either piece touches — including the workbook round trip, which
is the other piece's — the full sweep with **no errors**, the plan rules and
the change list unmoved, and the two guards that the shipped file and the
served copies are in step.

## §383 — the tab that filled the row, and the mirror that showed your own face (2026-09-20, spec 061)

**Built on the branch, not merged.** Islam, with three screenshots the morning
after §376 reached main: *"when viewing as Mahdy he started seeing the other
units and functions while he should only see his unit karim from mobile is
seeing the report while the report is made only for the retail and online
team."*

**Two faults, both §376's, and neither is the narrowing itself.**

**The row.** The Insights tab was keyed on `c_kb`, the one access key the
matrix holds at `area:"always"` — so the question the navigation asks (*is
there a tab here this person holds*) came back yes at every unit, every
function and the group, for everybody. Measured on the worked example against
the shipped build: **31 of 33 people** got a bigger row, **29 of 33** met the
Units | Functions switch that is meant for the SMO and the CEO, a unit's
custodian went from one unit to ten. **No plan and no figure was exposed** —
the tabs that draw those still refused, which is why his own screenshot of
Mahdy on Mobile shows a tab row holding one tab; what filled up is the row of
names. Established as §376's by measuring the build before `ac94f9db`.

The fix is `everywhere:true` on the tab and `ownTabs()` beside `allowed()`,
asked by the six gates that decide what the row offers — marked on the tab so
a second client-wide tab says so about itself. The tab is still drawn once you
are somewhere you reach for another reason; it stops being the reason.
`anyDestination()` keeps the module switcher listing Insights for somebody who
reaches nowhere, which is the hole §376.3's own comment promises never opens —
and that forced the switcher to be built on the first paint rather than at
load, because the question is viewer-dependent and at load the shell has not
hydrated (§362's wall, from the other side).

**The mirror.** The Insights module resolves who is asking from the seat the
DOOR established, which is the sign-in — so the office's own seat answered and
every narrowed report was returned whoever the switcher pointed at. The
narrowing works for a person signing in themselves; what was broken is the
mirror the office checks it IN. Now narrowed once at the seam
(`lib/view-as.ts`, called by the route before anything of the module is
asked), so every module is right by construction. It can only narrow: the gate
is the session's seat, the result is the simulated person's, and an unknown
key is refused rather than read as nobody.

**What ran.** `scripts/test-nav-row.js` 15/0 (red 6 from the source, its first
failure printing Islam's report); `check:viewas` 20/0 (red 3 ways, the last
printing the fault itself); the **access baseline UNMOVED** — 33 people ×
every page key × every target, so nobody's access changed and only what the
navigation offers narrowed back; authoriser 683/0, change list 140/0, platform
rules 69/0, built-in-step all good, setup-shape 33/0, deploy-context 5/0,
session-state and db-url-choice clear.

**What could not.** No `smp-app/node_modules` and no python Playwright here,
so `qa.py`, every frozen browser check, `check:insights` and `check:modules`
could not launch (`check:modules` established as already unrunnable by
stashing the change and getting the identical error). The view-as fix is
proved as a rule and at both ends of its seam and is **not** yet driven
through a browser against a client — that run is owed before it is called
finished.

**Nobody is signed out and nothing stored moves**: no frozen `api/`, `lib/` or
`db/` file is touched, nothing is migrated, no rule about who may save what
changes. `sw.js` is bumped because the built file's bytes changed — to
`v5.21-nav-and-viewas` at the time, and past main's own `v5.22` when §384
landed on the same branch (§94.12: a name nobody else has served, confirmed
again immediately before a push to `main`).

## §384 — a tactic's owner is a row on the table (2026-09-20)

**Built on the branch, not merged.** Islam, after §383 established that Mahdy
reached a whole supporting function because a project there named him as
Owner: *"what we need to follow is the accessablity matrix. we don't have a
tactic or measure owner in the roles to set accessability for so until then
they are defaulted to see nothing and edit nothing"*, then *"don't chagne the
settings of the accessablity. I believe we need to add measures & tactics
owners as roles so I can set their accessability."* **And he closed the
original complaint himself** — *"mahdy is a project owner then it ok to see
the project and report it ofcourse my bad"* — so nothing about Project owner
moves; what was missing is a row for the level below it.

**The fault, and it is the one he is pointing at.** A pillar has an Owner and
every tactic under it has one, and being named the Owner IS the role — the
derivation `powner` and `plowner` have had since §147.7. **A tactic's Owner
derived nothing.** The only thing that ever reached such a person was the
Contributor floor, which fires on *holding no other role at all* — so a unit
head who also owns a tactic somewhere else reached it through no row anybody
could see on the table, and could be switched off by nobody.

**It ships at `none` in every column**, which is his instruction rather than a
cautious default, and **it takes nothing away**: the floor is now asked of the
roles that grant something, so a role granting nothing cannot displace the
view somebody already stands on. `powner` and `plowner` are deliberately left
exactly as they are.

**A handle of its own, never the row's owner.** A measure's reporting context
sets `row.owner` from the **pillar's** owner (§55), so the obvious branch
would have made opening this row quietly open every key measure to pillar
owners. `ctx.tacticOwner` is set only where a tactic is the subject — six call
sites, one meaning.

**The measure half is drawn and not built**, because a key measure has **no
Owner field anywhere in the product** — a role over a field that does not
exist is a row that can never match anybody (§61). The mockup is published
and awaiting sign-off; measured on the real table, the column fits at
1600/1440/1280/1100/1000 in both read and pen mode with no row growing.

**What ran.** `scripts/test-tactic-owner.js` **29/0**, red five ways from the
source (8/1/1/1/7); the **access baseline UNMOVED** — 33 people × every page
key × every target — so nobody's access changes; authoriser 683/0, change list
140/0, platform rules 69/0, `built-in-step` all good, `access-header` clear
after its rewrite, `role-picker` · `seat-grant` · `project-custodian` ·
`project-done` green, and the full `qa.py` sweep **ERRORS none**. The matrix
draws twelve rows with **Tactic owner · 18 people**, nothing overflowing at
1600/1280/1000.

**One check was rewritten, never loosened.** `access-header.py` kept a
hand-written list of which roles are derived and went red on a correct build
the moment a fourth existed (§214.3, §218); it derives the list from
`isOwnLinesRole` now, which is the question the register's picker actually
asks.

**Nothing stored moves and nothing is migrated.** The seed gains one access
row, all `none` — the same answer the default already gives — so a tenant that
has never touched the matrix and one seeded today behave alike. `sw.js` is
bumped to `v5.23-tactic-owner` — past main's own `v5.22`, because the built
file's bytes changed and a worker caches by name (§91, §94.12).

**Recorded, not done**: the Measure owner row and the field under it; and the
Insights category filters are still drawn whether or not a report of that type
exists, which is the other half of the report §383 answered.

## §385 — the filters are the reports that exist (2026-09-21)

Islam, of the reports tab: *"the filters of the reports should appear only if
there is this type of report."* The other half of that message was the
view-as fault §383 answered; this is the first half.

**Measured before anything was proposed.** The row under the tab drew the
module's whole list — `All · Analysis · Macro · Market · Sector · Governance` —
for everybody, whatever the library holds. So a client with nothing published
was shown **six filters, five of which could only ever return nothing**, on a
tab a new client is likely to press first. Not a wrong list: the honest answer
to *what kinds of report exist in the product* and the wrong answer to *what can
I filter this library by*.

**It had to be the server's answer.** That section row is built synchronously
inside `paint()`, so nothing fetched can be in it — and §376's own rule for the
tab is that it never repaints from a fetch, because the search box is in that
row and a hand may be in it. So the categories are stamped on the document, as
they already were; what changed is *what they are stamped with*.

**Asked of the library, through the same two clauses the list is read
through** — published only, and the per-place narrowing — so the row can never
offer a category the list itself would refuse. A draft's category is not a
filter; a report narrowed away from somebody is not a filter for them. The
console is not a caller: publishing is CHOOSING a category, which is a different
question.

**Three answers, not two.** No library behind the tab (no module, not open to
this person, or no server) draws no tab at all; a library with nothing filed
draws the tab, no filter row and *0 reports* — hiding it would say Forefront has
no library rather than that it is empty; a list draws those filters.

**One reader where there were nearly four.** The same six lines that resolve who
is looking sat in the Insights module and in the landing's facts, the second
under a comment naming the first, and this needed it again — one answer now, in
its own file beside the library's, so `lib/library.ts` stays free of a database
driver and its check can still run with no database at all.

**And the Setup document had to carry it too**, because the shell walks from
Setup to a unit without asking for the document again.

**A real fault found on the way, and not this round's.** `lib/shell.ts` has an
escaper of its own and it escaped `& < > "` and not `'` — a text-node escaper
used inside **single-quoted** attributes, which is §235's fault in the served
app's own copy. Live: the Internal Tracker's note is *"The office's weekly
actions about this client"*, so a client holding it was served a root element
whose module list **ended at that apostrophe** — the browser mis-parsed the
rest and the module switcher was silently not drawn. The landing stamp carries a
published report's title, which a person types, so the same break could forge
attributes the shell reads. No script can run either way (the policy is
`script-src 'self'` with nothing inline). One line, matching the frozen escaper.

**Two checks were stale and both were my own unmerged rounds.** Established by
stashing this work, rebuilding, restarting the served app and re-running —
identical failures (the first attempt measured a server still running the old
build). §384 made a tactic's owner a role, so the Mobile head derives two rows
and shutting one no longer shuts them: the product is right and the fixture had
stopped making the state. Both checks shut **every row the person holds, asked
of the product's own rule**, with the custodian beside them asserted untouched.
And §383 drops a module the tab row already reaches, so on a client holding
Strategy and the reports there is genuinely nowhere to switch to — the fixture
makes a third module, and the two-module case is now asserted in its own right,
so that decision is guarded rather than worked around.

**What ran.** `check:insights` **137/0** with a new section whose state is made,
red under three breaks (6 / 7 / 9); `check:insights:tab` 24/0; the escaping fix
falsified from the source at **11 red**, its first failure printing the
truncated attribute verbatim. `check:shell` 116/2 → **120/0**, `check:door`
140/3 → **144/0**, `check:modules` three failures → **159/0**, `check:state`
92/0, `check:viewas` 20/0, `check:setup` 33/0. Driven in a real browser against
the served app: a Mobile head reads `All · Macro`, a Finance head
`All · Macro · Sector`, and a client with nothing published gets the tab, no
filter row and *0 reports*.

**Nothing stored moves and nothing is migrated.** No frozen source changed, so
the built file does not move and `sw.js` is **not** bumped — that trigger is the
built file's bytes changing, and they did not.

**Recorded, not done**: the Measure owner row and the field under it, still
awaiting sign-off on the mockup; and `lib/chat-api.cjs`'s escaper, which has the
same gap and is a carried file whose twin a check asserts byte-identical.

**§385.10 — and the tracker's one red was two notions of today.** Run after
the push. The record has carried `tracker` 227/1 for two rounds as *"a
date-relative literal gone stale"*; it is not a literal. That section renders
the page with a **fixed** today (2026-09-15) and the expectation worked its
answer out from the **real clock**, so on 2026-09-21 the page said *Next week ·
20 – 24 Sep* — right, relative to the 15th — and the check demanded *This
week*. The days beside the word were already asking the fixed date, which is
what made the pair disagree with itself. It went red on the **calendar** rather
than on any commit, which is exactly why it looked like a stale literal. One
argument, and it stops depending on the calendar at all.

**And it could not fail under either of its own breaks**: both sides call the
same wording function, so breaking it moves the expectation with the product
and the assertion goes green on the very build it is there to catch. That was
true before the repair too. A second assertion names the two headings the fixed
today produces — a week has a word, then its place in its month — which is the
one claim that can fail: 1 red under each break, where the agreement is green.
227/1 → **229/0**.

**§385.11 — and the seam between the two halves was measured by nobody.**
Found running the falsification suites for the checks this round edited: the
`:red` list for the shell check held five breaks and `no-library-cats` — which
`lib/shell.ts` declares — was not one of them.

Pulling that thread found the larger thing. §385 has two halves and each is
asserted where it has what it needs: the **rule** (which categories this person
has) against a database in `checks/insights.mjs`, the **row** (what the tab
draws with them) with no database in `checks/insights-tab.mjs`. Between them is
the attribute the server writes on the document, **and nothing read it** — so a
build whose stamp was still the module's whole list satisfies both files
perfectly and draws Islam's six filters. §316.7's own finding one feature over.

The shell check already starts the served app, so the seam goes there: read off
the **raw HTML** rather than the DOM (the tab row is built before any answer
could arrive, which is the whole reason the list is stamped), asserted as an
**agreement** with the rule rather than against a typed list, with the state
**made** — the dev tenant publishes nothing, so every assertion would pass on a
build that stamped an empty list always, which is the other way to get this
wrong — and **both ends**, a client without the module carrying no stamp at all.

**And the check that claimed to run it said so in its own docstring.** The
insights-tab check named that break as reddening its §5, and §5 prints that it
is *"run by the served-app sweep"* — and nothing runs it. A file saying a thing
is covered elsewhere is read as a file that has covered it. Corrected in words,
the two halves named with their breaks, and what is asserted nowhere said
plainly: the tab on all four destination kinds, the address it writes, and
typing never repainting.

5 green; **red 5** under the break — four of the new section's own, **plus one
of §3b's**, which is a true consequence rather than a stray: dropping the stamp
drops the tab, and §383's switcher rule reads the tab, so the four-square mark
correctly comes back where that section asserts it does not. The new section's
fifth is correctly green under it, absent being absent either way — which is
what a both-ends control looks like when the break lands. Shell 120/0 →
**125/0**, its falsification list five breaks → **six**.

The whole-platform sweep was run again at the end of it and reads **33 people,
242 pages walked, no errors** — the same figure the last two rounds recorded.
That sameness is the point rather than a formality: the sweep walks the offline
file on built-in data, so it gives the same answer every time unless something
in that file changed. This round changed nothing in it, so a different number
would have meant the opposite of what this entry says. The number was added up
from the run's own lines instead of copied from the record, or it would only be
repeating itself.

**Recorded, not done**: §5 is still unrun. It needs the served app, which the
shell check now starts, so the honest next move is for its remaining subjects to
go there rather than a second file starting a second server.

---

## 2026-09-21 — The screen check runs at last (§382.5)

**On the branch, not merged.** The merge is Islam's word, on that merge.

**What was outstanding.** The round below shipped with one thing openly
unfinished: the check that drives the screen had never been run, because that
session had the browser and not the driver that steers it. It has been run now.

**Nothing in the product was wrong.** Every one of the four failures was in
the check itself — it asked for a control by a name the platform has never
used, it asked in a way that stops the whole file dead instead of reporting,
it forgot to dismiss the welcome screen so every press landed on that instead,
and its last test stood on a page the person it was testing is not allowed to
open, so it was reading the wrong screen and calling a healthy build broken.
All four are corrected, and the last one is now a stronger test than it was:
it walks every page that person can actually reach rather than sampling one.

**Then it was proved it can still catch a real fault** — three deliberate
breaks in the product, each one making the right part of the check go red, and
the code put back afterwards and checked byte for byte against what it was.

**Where it stands.** The screen check passes 24 of 24, the whole-platform
sweep walks 33 people across 242 pages with no errors, and every other check
around it is green. One file changed, and it is a test file.

## 2026-09-20 — My reporting: the lines a tactic's owner enters (§382, spec 062)

**On the branch, not merged.** The merge is Islam's word, on that merge.
**Its one open item — the unrun screen check — is closed above (§382.5).**

**What he asked.** Whether a tactic's owner can report their own tactic. They
could not — and the honest answer came with the number: every one of the
worked example's 83 tactics names an owner, and the machinery that lets
somebody enter a figure they are named on walks a subject's objectives and its
measures and **never its tactics**.

**What is built.** A **My reporting** tab beside Reporting, holding the lines
the plan names this person on, grouped by unit with a filter when there is more
than one. They enter figures; the note and the submission stay the unit's. On
the unit's own Reporting page those same rows are read-only, so there is one
way in. Save draft locks their own lines and Reopen opens them — per person and
per subject, so one owner's draft never touches another's. And the welcome
screen tells somebody their lines are waiting.

**What does not move, which was the constraint he set.** Nothing on Roles &
access. One tenant switch, shipping **off**, stored as an absence — so an
untouched tenant behaves byte for byte as it does today, and both checks assert
that end as hard as the other. No migration and no schema change.

**Two things I got wrong and corrected in front of him.** The first drawing put
two foreign units in somebody's navigation; measuring says a bounded role can
never see one, so the harder-looking case cost nothing. And I told him *My
reporting* was a name already taken; it renders on no screen, and the stale
label is brought into step in the same edit.

**The thing worth keeping from the building.** A narrowing I had written turned
out to be reached by nothing — both checks stayed green with it removed — and
what it *would* have done is reverse an earlier decision of his, that being
named a collaborator on a milestone is a reporting right. He asked about
tactics. It is deleted, and the decisions document records why rather than
leaving an absence.

**Checked.** The rules and the page: 53 assertions, proved able to fail six
ways. The server: 704 assertions, proved able to fail eight ways, including the
direction that matters — a stranger being allowed. Everything rebuilt and the
served copies regenerated.

**What could not be checked here, said plainly.** This machine has the browser
but not the driver that steers it, so no screen check could be run at all —
including the new one, which is written and waiting for somebody with a
browser. Nothing on a screen has been driven by a machine in this round; the
claims about what is drawn come from calling the product's own renderer.

**Waiting on Islam**: the merge.

---

## 2026-09-21 — The two branches merged into one (§385.1)

Islam asked for the other branch to be brought into ours and the overlaps
sorted out before anything goes to main. There were **two** overlaps, and only
one of them was the branch he named.

**The one he knew about.** That branch and ours both built something about a
**tactic's owner**, two minutes apart, in two sessions that could not see each
other. Ours adds a **row** on the roles table — *Tactic owner*, switched off,
so the office can decide — and theirs adds a **switch** and a page of the
owner's own called **My reporting**, where the unit's ordinary reporting page
becomes read-only for them. Both quote him. Neither came first in any
meaningful sense.

**Both are kept**, and the order between them is now written into the code
rather than left to be found out: with the switch **off**, an owner's tactic
behaves exactly as our row says; with it **on**, the unit's page steps aside
and they type on their own page.

**One combination still says two different things, and that one is his.** A
client that switches the row on *and* turns the switch on will read "can
report" on the roles table and meet a page that will not take the number.
Nothing is broken and nothing is lost — but two ways of saying yes to one
thing is how they come to disagree later, so it is flagged rather than decided
here.

**The one he did not know about.** Main has moved since our last round and has
taken two of the section numbers we were using, from a third session. So our
three unmerged sections were renumbered first, before anything was merged —
which is the only moment that can be done safely, because at that point every
one of those numbers in our copy is provably ours. Every count was declared in
advance and the whole pass refused itself on a mismatch; three different ways
of writing a section number had to be swept, not two.

**What the merge itself turned up.** A comment in the incoming work describes
something that code no longer does — corrected rather than carried across. The
two branches had independently given the service worker **the same version
name**, which is the fault that has bitten this project before and which git
only caught this time by luck. And two checks went red for opposite reasons:
one was doing its job (it noticed a new file of ours needing a browser), and
one was reporting a fault that is not there, because its stand-in answered a
question it should have refused — the product was checked directly rather than
believed broken.

**What was run, on the merged result rather than on either branch**: every
rule suite, the frozen product's own checks, the served app rebuilt from
scratch against a real database, and the whole-platform sweep. All green, no
errors — **and the sweep's numbers did not move, which is the point**: the
merge adds a new tab, and a new tab must not add new places in the navigation.
That is the exact fault an earlier round of ours existed to fix, so a changed
number would have meant it had come back.

**Main is untouched.** This is the rehearsal he asked for. Merging to main is
his word, and main's own two sections are still to come across.

---

## 2026-09-21 — main's two sections brought in (§385.2)

**Done on the branch. Main is untouched.**

This is the second half of what you asked for. You said: *"there are
intresections and we need it resolved before merging. so better merge that
branch with ours first."* The other branch was merged last time. This brings in
the two rounds `main` had taken meanwhile — a third session's work on the
People register, where the email and the phone number stopped being buttons you
click to copy and became ordinary text you can select.

**Nothing new was built.** Every line of this round is either a conflict being
resolved or a file being rebuilt from its sources.

### What the two sides each did

- **Ours** (already on the branch): the reports tab's filters, a tactic owner's
  own reporting tab, and the row on Roles & access.
- **Main's** (brought in now): the one-click copy removed from the register's
  Email and Mobile cells, and then a right-click or a drag taking the whole
  value rather than one word of it.

They do not overlap in what they do. They overlapped in five files, and each
one had a rule already written down for it:

- **The three record files** — both sides kept, never one picked. A script
  checked that every line of each side survived.
- **The built platform file** — rebuilt from the merged sources rather than
  merged, which is the standing rule, and then checked byte-for-byte against
  what the builder produces.
- **`sw.js`** — rebuilt from main's copy with our one line put back, and the
  version name moved past both sides so no browser is served the wrong shell.

And the rebuilt file was checked to carry **both** sides' work, not one of
them.

### What went wrong, and it was all mine

Three things, none of them in the product:

1. I set two environment variables in one line in a way that left the second
   one empty, so the first round of database checks all ran against the wrong
   kind of connection — **and the platform printed a warning about it on every
   single run**, which I read past nine times. Everything was re-run properly.
2. I started the big sweep in a way that killed it immediately, and it came
   back reporting success with an empty log. The rule that catches this is one
   we already had: read the last line, and an empty last line is a failure.
3. Two checks needed a Python library this container did not have, and two
   needed a rehearsal database set up in three steps. All four were set up, and
   all four are green.
4. Two of those checks then said *"the server never came up"*, and I guessed at
   the cause instead of asking. The real one: a leftover server from the
   newer stack was still sitting on the exact port they use. I found it by
   starting the server by hand and reading the error it prints — and the first
   tool I asked told me the port was free when it was not.
5. Running one of the database checks left three test accounts behind, which
   made the next one report a real rule as broken. Rebuilt clean, it passes.
   The order these are run in matters, and that is now written down.

### Three things are still red, and none of them is this merge's

Each was established by measurement, not by assumption — for two of them by
running them on the tree as it was *before* the merge and getting the identical
failure, and for the third by showing that not one file the check looks at
changed:

- **`test-clean-parity`** — already recorded as red on main, from a difference
  between the clean-slate migration and the cleared-graph function.
- **One of the nine database spike proofs** — its seeder cannot handle a table
  that points at itself, which the Portfolio tables do.
- **`frameworks-page`** — the console's tab row comes up empty in this
  container. Every file that check looks at is byte-for-byte what it was before
  the merge, so it is not this round's; what it is, I could not close from here,
  and that is said rather than left out.

### What to go and check, if this is merged

- **Setup › People register** — right-click an email, then a phone number: the
  whole value should highlight and Copy should be live. A double-click should
  still open the cell for editing. That is main's round, not ours.
- **Setup › Roles & access** — the Tactic owner row is still there and still
  starts shut.
- **The Insights tab** — the filters above the list are still only the kinds of
  report that actually exist.

Nothing is stored differently, nothing is migrated, and nobody is signed out.

### One thing to know before the next round

While this was being finished, `main` moved on again — three more commits, from
the same third session. They are **not** in this merge.

They matter for one reason: that session has used the number **§379** for its
own work, and this branch already used §379 for the reporting tab that came in
last time. Two different pieces of work wearing one number. Nothing was wrong
today — their §379 is not in our copy — but whoever does the next merge has to
renumber ours first, before merging, or the two become impossible to tell
apart.

**That renumber is now done — it is the round below.**

## 2026-09-22 — The numbers moved, so the next merge can happen (§385.3)

**Nothing was built.** No screen changed, no rule changed, nothing is stored
differently, nothing is migrated, and nobody is signed out. The whole of this
round is section numbers, the two files that are generated from them, and the
record.

### Why it had to happen first

The other session on `main` used **§379** for its work. This branch used §379
for the reporting tab. Two pieces of work, one number — and once the two trees
are merged there is no way left to tell whose line is whose.

So the numbers are moved **before** the merge, not during it. That is the only
moment it can be proved that every §379 in this tree belongs to this branch: the
point the two trees last agreed carries none of these numbers at all, so there
is nothing of anybody else's for the change to sweep up by accident.

### What moved

This branch's four sections each went up by one, so they keep their order and
sit above main's:

    My reporting      §379 → §380
    The nav row       §380 → §381
    The tactic owner  §381 → §382
    The reports tab   §382 → §383

§379 is handed back to `main`. **346 references** were rewritten across 37
files. The spec folder numbers needed nothing — ours is 062 and main's highest
is 061, checked rather than assumed.

### What the round found

**A change like this quietly rewrites the sentences that are about it.** Nine
sentences in the two record files had become false — including the paragraph
whose whole subject is *"main has taken a number"*, which ended up naming the
wrong number, and the table recording what the **previous** renumber did, which
ended up describing a move that never happened.

The rule that comes out of it, and it is now written down: a number in these
records is one of two things. If it **points at a section in this tree**, it
should move. If it is a **record of what happened** — what an earlier renumber
did, or what `main` was measured to hold at some moment — it must not, or the
record calmly states something untrue. All nine were put right by hand.

**And the check that was meant to prove only numbers moved was wrong first.**
It looked for the new numbers only, so every line where a §379 had been removed
looked like an unrelated change, and it reported a clean run as 108 faults.
Corrected, it reports none — and a second reading proves the same thing the
other way round: hide the numbers on both sides and the two are identical.

### What is still owed before this can be merged

1. Run the whole suite on the **merged** tree — not on this branch. Nothing here
   has been checked against main's three new commits.
2. Bump the version name in `sw.js` at the merge itself, checked against `main`
   in the same breath as the push.
3. Three checks are red and none of them is ours — they were reproduced on
   main's own build first. They are listed in the previous round.

**`main` is untouched. The merge is yours to say.**

---

## 2026-09-22 — the switch decides, and the Tactic owner row comes off

**What you said.** *"We need not to confuse the custodian with the tactic
owner. The custodian should have always access to their unit or function
entry, except in one case when we set figure sets. My reporting appears for
tactics for units or functions she is not the custodian or the owner."* And
then, of the two drawings: **"A"**.

### What is built

**One question is asked per subject: do I run this one?** Its answer decides
both things at once.

- **I run it** — I enter everything on that unit's own Reporting page, tactics
  included. There is **no My reporting tab** for it, because a second page
  holding rows that are already on the first is a second place to look for one
  number.
- **I don't run it, but I own tactics there** — those lines are on My
  reporting, and that is where I type them.
- **A line somebody else owns, inside a unit I run** — I see the figure, I do
  not type it. That part is unchanged.
- **Figure sets are untouched**, which is the one exception you named.

**The Tactic owner row is off Roles & access**, with the whole role and
everything that plumbed it. The switch on Setup › Reporting cycle is the only
control, and it still ships off.

### What it actually moves, on the worked example

| | |
|---|---|
| tactics naming an owner | **83** |
| ...that name somebody on the register | **51** |
| ...owned by the person who also runs that subject | **49** — they lose a second screen |
| **...that reach My reporting** | **2**, one person |
| tactics naming somebody the register does not hold | **32** |

**Those 32 are the finding.** A plan is typed by a custodian and a register is
filled from HR, so a third of the owner names reach nobody. Before today, a
line like that was treated as belonging to a person who does not exist — so
**one of your 33 people could enter it, the SMO**, and nothing on any screen
said why. It goes back to the unit, exactly as it was before the switch was
turned on.

**And removing the row moves nobody's access.** 33 people × 36 pages × 21
places = 24,948 answers, measured both ways: **0 changed.** Somebody who owns a
tactic and nothing else is a Contributor again, which is what they were before
that row existed.

### What the switch now says

It read **"83 83 lines"** — the word printed twice, and the wrong number. Both
are fixed: it says the number it actually moves, which on your tenant is **2**.

### What went wrong while building it

**My own new check reported "all good" over two real failures.** The section I
added to measure this used a variable name the file already uses for its
failure count, so it wiped it. Found by deliberately breaking the product and
watching the check fail to notice. Two more of that section's mistakes were the
same shape — it measured a row nothing asks for this cycle, and it switched
viewer in a way that silently does nothing over a real server, so a sweep of 33
people was really a sweep of one.

None of the three was in the product. All three are fixed and written down.

### Checked

The four states driven in a browser and proved able to fail three ways; 709
server assertions, 65 rule assertions, the full page sweep with no errors, and
both in-step guards clear. The seed is regenerated and the offline file matches
the build.

**`main` is untouched. The merge is yours to say.**

---

## §388 — the second renumber, the merge, and two guards a decision had already invalidated (2026-09-22)

**Islam: *"merge to main."***

**Fetching `main` before going near a merge found the collision again.** It had
moved **nine commits** and taken **§380 and §381** for another session's work on
the plan builder (spec 020), while this tree held §380–§385 for My reporting and
the two rounds beside it. Two numbers, two meanings, for the second round
running — so the renumber ran **first**, which is the only moment it is provably
scoped (§264.3): the merge base holds §380–§387 **nought** times in every
spelling, so every one of them here is a line this branch wrote.

**The renumber.** Descending by source, or each pass eats the next (§365.5):

| was | is |
| --- | --- |
| My reporting | §380 → §382 |
| The nav row | §381 → §383 |
| The tactic owner | §382 → §384 |
| The reports tab | §383 → §385 |
| — | §384 → §386 |
| Do I run this one? | §385 → §387 |

Three spellings (§336.1) — `§NNN`, the `&sect;NNN` entity, and the `§NNN`
JavaScript escape, **nine of the last across three check files**, which a
two-spelling sweep would have left naming somebody else's section. Every count
declared in advance and the pass refused on a mismatch (§344.1): **89 / 2 / 115
/ 113 / 91 / 185, 595 in all**, each step also asserting its target was free
before it wrote and its source 0 after, and applied to the file on disk each
pass rather than from a planning-time snapshot (§376.1).

**§388a — and the sweep takes the sentences that describe the numbering.**
§385.3a arriving for the second time, and the finding of the round. *A number in
these records is one of two things and only one of them may move*: a **label**
naming a section in this tree is rightly swept, so it still points at the thing
it names; a **historical fact** — the arrows of a past renumber, or a
measurement of `main` made at that moment — must not be, or the record calmly
states something that never happened. **Forty-one lines** across all three
record files had become false, the table above among them. Put back by hand,
each guarded on the line it was aimed at and refusing rather than writing
nothing (§353.4), the labels beside them left swept, and every region re-read
afterwards to confirm only labels remain changed. **And the first keyword filter
missed lines** — *"before our own §380 and about the same subject"* carries no
renumber word — so what is read is **every** changed line in the numbering
regions rather than the ones a filter volunteers.

**§388b — the merge's five conflicts, each with a named rule.** The three record
files **combined, never picked** (§318.7, §356.17), with every non-blank line of
each side asserted present in the result — 0 lost from ours, 0 from main —
because either side taken whole drops the other session's round and there is no
`generated-in-step` for prose. The built file **rebuilt from the merged sources,
never merged** (§91) and byte-identical to `build.py`'s output, with
`smp-app/public/` regenerated from its four generators (§329). `sw.js` rebuilt
from main's copy with this branch's one line re-applied (§146.2) at a name
**past both** rather than picking either — main v5.25, ours v5.27, merged
**v5.28** — proved never held anywhere in the history, one live `const SHELL`,
`node --check` clean. The merged result is **read, not believed** (§313.37):
every name this branch deleted grepped for, and the duplicate top-level
declaration scan over build.py's own script list reads 1534 names with exactly
the six §281.1 leaves deliberately.

**§388.1 — two checks held a guard §387.1 had already invalidated.** Both read
*"the head holds more than one row"*, written at §385.8 while §384's Tactic
owner row existed; §387.1 removed that row on Islam's word, so both began
**reporting a correct build broken** (`check:modules` 158/1, `check:door`
143/1). **Invisible on the branch** — §387's own session held no `node_modules`
and records `check:modules` as unrun — which is §365's argument for re-running
on the merged tree rather than the branch, paid a second time. Rewritten, never
loosened (§218), to the claims that survive either decision: the rows are the
product's own answer (`personRoles` over `worldOf`, §42) and one of them is the
BU owner's. **What the count was standing in for is driven where it can be**, in
`checks/modules.mjs` §4c over the custodian, who does hold two — one row shut
and `decideOpen` asked, so §33's most-generous rule is measured rather than
assumed.

**§388.2 — and the first falsification was a no-op that looked exactly like a
working guard** (§54.5). Inverting `mayOpenModuleArea` as
`if (best === "none" || RANK[g] < RANK[best])` fires on every iteration while
`best` is none, so it takes the last non-none grant and is still generous. It
matched exactly once, the check reported **160 ok, 0 failed**, and that is
indistinguishable from a rule that holds. A faithful inverse needs a sentinel
(`best === null`); only measuring `frozen.mayOpen` directly with the break in
place told the two apart. With the sentinel the same break is **1 red and it is
exactly the §33 assertion**. Restored from the saved copy rather than with
`git checkout` (§343.9), and the rebuild asserted byte-identical.

**§388.3 — spec 029 answered by measurement.** `lib/authorize.js`,
`lib/rules.js` and `lib/graph-diff.js` all changed, which is the trigger for a
forced sign-out — so `origin/main`'s **own** authoriser and change-list suites
were run against the **merged** rule modules in a worktree: **683/0 and 140/0**.
No rule an old tab relies on has moved (§382's new kinds sit behind a switch
that ships off, and off is byte-identical), so **no forced sign-out is owed**.

**And one red was a run that died rather than a fault** (§298.3): `check:door`
first read *97 ok, 21 failed* — 118 assertions against the complete run's 144 —
under contention with the build finishing beside it; re-run it is 143/1, and the
one is §388.1's.

**Verified on the merged tree** (§365): `built-in-step` all good,
`generated-in-step` all clear, authoriser 709/0, change list 140/0, platform
rules 69/0, `test-my-reporting` 65/0, and on the stack production serves state
92/0, modules 160/0, door 144/0, insights 137/0, frameworks 90/0, tracker 229/0,
notes 170/0, portfolio 121/0, upload 9/0, demo 7/0, standing 7/0, room 10/0,
deploy 5/0.

## §390 — the people upload takes a client's own sheet (2026-09-23)

**Built, on the branch.** A new person needs three things: Name, Job title
and Email. The downloaded template marks those three columns with an asterisk.
If a row that would add somebody is missing any of them, the upload stops and
the review names the row and what it lacks. People already on the register can
still be updated with blank cells, which keep what is recorded. Your own HR
export works as it is: if there's no sheet called "People", the first sheet is
read, and headings like *Title*, *E-mail* or *Employee Name* are understood.
## §391 — a supporting function can belong to a division (2026-09-22) · **merged to `main` 2026-09-23**

You asked for functions that belong to a division, with the division's
performance counting them. A division is the **Company** the platform already
has — nothing new was invented for it. On a function's Setup row there are now
two new things: **which company it belongs to** (or the group, which is what
every function starts as), and **its weight in that company**.

The weight works the way you chose (A): a weight you set is used as given; a
blank takes the average of the weights that are set; with none set, each
function counts as one equal member beside the units; the units then share
what is left, keeping their sizes against each other. A company made of
functions only shares the whole between them. A total over 100% is refused,
and the page says why beside the box.

The company page draws its functions in their own section, and both headline
numbers — performance and execution — count them. **A company with no
functions reads exactly what it read before**; that is checked first, against
the old arithmetic. The company's CEO sees the functions and does not report on
them. Retiring a company that still holds a function is refused, naming it.

**Checked:** a new check (`checks/division-functions.py`) of 25 assertions,
shown to fail three ways when the decisions are broken on purpose; the
permission rules (683) and the change list (140) unmoved; the full sweep of
every page as every person with no errors; the shipped file and the served
copies in step.

**Waiting on you:** the **Terminology** change — each word with a description,
a default and the name you choose — is drawn and published for sign-off and
not built yet.

## §392 — Terminology: one word per thing, a word for one and a word for many (2026-09-23) · **merged to `main` 2026-09-23**

The Terminology page now has your thirteen rows, in your order, each with your
description and default word. There is no separate group word and
business-unit word any more: whatever is typed is used at the group, in every
business unit and in every function. Each row has two boxes: the word for one
("Project") and the word for many ("Projects"), because the platform cannot
make a plural reliably. The default sits beside the boxes; Reset appears only
on a row that differs; emptying a box puts its default back.

Three rows are new: Division (the Companies layer, *Divisions* by default),
Supporting Function and Project. Capability has its own row instead of hiding
in Pillars as "Group capabilities". The aspiration uses one word everywhere, so
the group no longer says *Vision* while a unit says *Winning Aspiration*.

Existing clients are moved over once, on the next deploy: a word a client typed
for business-unit pages is kept, a word still on the old default moves to the
new default, and the single form starts on the default.

The Setup rail, the page headings, the tables and the deck follow the words.
The navigation switch keeps its short "Units / Capabilities / Functions" until
a client types their own word.

Not changed: the workbook's column headings, the People register's Company
column, and the set-up flow's words step (it still asks only the word for
many).

**Merged to `main` 2026-09-23** on Islam's word, renumbered from §382/§383 before
the merge because main had taken those numbers.
On the merged build: whole-platform sweep clean, 188 checks walked. One check
(`yn-in-progress`) is red, and it is red on main's own build too, from the
tactic-owner rounds — recorded, not fixed in this merge.


## §398 — the set-up flow's sentences use lower case (2026-09-23) · **merged to `main` 2026-09-23**

**Built; merged to `main` 2026-09-23 on Islam's word.** The set-up questions now read "Are the
business units grouped into divisions?" rather than capitalising the words
mid-sentence. Short forms like "BUs" are left as typed, and headings keep
their capitals. Five places on the Divisions step still said "company"; they
now use the client's word too.


## §397 — every release offers the reload (2026-09-23) · **merged to `main` 2026-09-23**

**Built; merged to `main` 2026-09-23 on Islam's word.** The platform already has a banner that
says "A newer version of the platform is ready" with a button to reload and keep
your work, but it had stopped appearing: it only shows when a small background
file changes, and that file had been identical in every release since the
rebuild. Each release now stamps that file with a fingerprint of the pages it
serves, so any release that changes what people see brings the banner up in
every open tab. A check fails if the fingerprint is missing or out of date, and
the merge rules now require confirming it changed on the live site.


## §396 — the set-up flow's questions use the client's words (2026-09-23) · **merged to `main` 2026-09-23**

**Built; merged to `main` 2026-09-23 on Islam's word.** On Client set-up, the Divisions step's
question still said "Are the units grouped into companies?" under a heading
reading "Divisions". The question and both answers now use the client's own
words, and so do the questions on the business units, supporting functions and
capabilities steps. The "Yes" answer also says a division can hold supporting
functions, which has been true since §391. Nothing stored changes.


## §395 — the client's words on every screen (2026-09-23) · **merged to `main` 2026-09-23**

**Built; merged to `main` 2026-09-23 on Islam's word.** After §392 the terminology page held two
words per term, but many screens still printed the platform's own word. Every
term was renamed to a nonsense word and every page, tab, section, the edit
pen, the slides and Setup were walked: 139 places still said "Pillar",
"Key measure", "Project" and so on. They now all use the client's own word,
exactly as typed, including column heads, buttons, tabs, the slides and the
counted lines like "3 Key measures · 2 Tactics asked". The set-up flow's
"words" step now asks both words, the one and the many, like the Terminology
page. Left as they are, on purpose: the knowledge base's sentences, hover
notes, the workbook's column headings, role names like "Pillar owner", the
Focus measures page name, a pillar's kind, and the short column heads on
Roles & access. Nothing saved changes. Checked: a new check that renames
everything and fails if the platform's word is left anywhere a heading, button
or label is drawn (proved to fail twice), the full check suite, the full
sweep.

## §394 — a capability planned in pillars can be saved by the office (2026-09-23)

**Built.** On a capability that plans in pillars (Data Management), the SMO
team was refused when adding or changing a pillar, and the function head
could not enter figures there. The server had never been told a capability
can plan that way, so it treated every change inside it as something only the
Super user may do. It now judges such a capability exactly as it judges a
function that plans in pillars: the office writes the plan, the function's
people report. Checked: seven new server checks, both ways (five of them fail
on the old rule, the two refusals hold either way), the full server suite.

## §393 — clicking a pillar opens that pillar (2026-09-23) · **merged to `main` 2026-09-23**

**Built, on the branch.** On a client with pillars added by hand, the side
list lit several pillars at once and clicking some of them opened a different
one. Pillars added with the pen never got the short identifier the list used
to tell them apart, so they all looked like the same pillar. The list now
tells pillars apart by their row number, which is always unique, on the Plan,
Performance and Reporting pages, and the missing-items chips follow it.
Nothing saved changes. Checked: a new check that clicks every pillar in three
awkward states (it fails 18 ways on the old build), six neighbouring checks
updated, the full sweep. Merged to `main` on Islam's word, after bringing in §391–§392.

## §404 — the client's structure (2026-09-24, on the branch)

Built from the approved mockup. Setting up a client now asks, second: what the
top level is called, whether there is a second layer (companies, divisions or
another word), and which parts each level carries — who we are, purpose,
aspiration, North Star, themes, pillars, capabilities, values, SWOT — plus how a
supporting function plans by default. The Temple is a picture you can turn on
when its parts are there. Setup › Structure lets the office switch a part off
or on for one unit, function or company. Switching off hides and never deletes.
Clients that never use it look exactly as before. A company gets its own
Foundation page once its layer carries something.

**Waiting on Islam**: whether to merge (the branch is 13 commits behind main).
**Not done yet**: turning Pillars off does not hide a unit's plan; the second
layer has no Temple drawing of its own.


**§404.1 — a supporting function carries no brief and no themes.** Islam: *"supporting function shouldn't have themes, the function has no brief and even the function owner is set in the registry so a function here has no description needed."* A function's Overview no longer draws the "What it is" card (name, Led by, Definition) — who leads it is set on the register — and Themes is never shown for a function. The set-up step and Setup › Structure no longer offer either for functions. Capabilities keep their definition. This one changes existing clients' function Overviews (nothing is deleted). Checks rewritten to match; all green.

**§404.2 — the functions level asks only what a function carries.** Setting up a client, the supporting functions now offer only Purpose, Aspiration, North Star and SWOT, and the "Plan in, by default" row is gone — each function picks how it plans on the Supporting functions step. The default words for new clients are singular except Key Objectives, Pillars, Capabilities, Core Values and Themes (so *Mission* and *Winning Aspiration*); existing clients keep their words and can change them on Setup › Terminology.

**§404.3 — existing clients get the singular words too.** Existing clients still read *Missions* and *Winning Aspirations* because the platform itself put those words there two days earlier. A one-time change at the next deploy turns them into *Mission* and *Winning Aspiration* wherever the stored word is exactly that old default; a word a client typed is untouched. Tested on a real database.
