# 055 · The client's settings live in the platform, and Strategy's welcome is the welcome

**Status:** decided 2026-09-16, built the same day on the branch. Islam,
with two screenshots of what spec 054 shipped — the client landing on the
new stack and the frozen welcome overlay on the old — *"why do I have a
welcome screen for the client overall, I just need a welcome screen for the
strategy module for now"*; then, of where the client's own settings go,
**"A"** from `design-mockups/client-settings-door/2026-09-16_where-client-settings-live.html`
(published and signed off as an artifact, rule 1c; the drawing is the record
of what was agreed and is not edited to match what was built, Principle II).

**Reverses:** spec 054 §4.1 (*the client-wide settings go to the client
landing, the spine's own page*) and §315's landing (*the landing is the
welcome, so the shell's own welcome is stood down*). Both reversed at Islam's
instruction and recorded as reversals, never overwritten. Spec 054's reason —
*the spine has to live somewhere that is not inside any module* — was never
wrong; what changed is WHERE that somewhere is. The landing put it on a page
of its own, and a page of its own turned out to be a second welcome.

**Depends on:** spec 054 (a def knows its module; the rail draws by scope),
spec 044 (the set-up flow), spec 046 (modules on one spine).

**Decisions log:** §357, written with the build (rule A7).

---

## 1 · What this is

Spec 054 built a **client landing** at `/<client>`: a greeting, the person's
rows, a *Client setup* block of six doors and a *Your modules* list. Inside
Strategy the frozen product still had its own welcome overlay (`welcome.js`,
§148), stood down on the new stack because the landing was the welcome now.

Islam saw both and asked why there were two. There were two because the
Next app had grown a page that says *welcome* while the frozen product
already had one — two answers to one screen (§53.5), with a person standing
between them. His decision has three parts, taken in three messages:

1. **No welcome for the client overall.** `/<client>` is a door and nothing
   more: it sends a person INTO the first module they may open. Strategy's
   own welcome greets them there, once a session, and the house mark is its
   way back (§193.2). *"I just need a welcome screen for the strategy module
   for now."*
2. **The client's settings are one rail, and set-up is a one-off inside it.**
   From the console's card you press *Settings* and land on the client's own
   Setup rail, in the client's chrome — **A** of the three drawn. *Getting
   started* sits at the top as a strip until the set-up is finished, then
   *"turns into a normal setting like C"* at the bottom of the rail as
   *Client set-up*. It absorbs Branding (the mark and the colours), so the
   separate Branding page goes; *"Done with set-up"* is a press that marks
   it done (*"1. ok"*).
3. **Two things stay where they were.** The email settings are a Strategy
   module setting (*"2. email is a Strategy-module setting"*), and the
   knowledge base stays on Strategy's rail *"until we decide later"*.

## 2 · The shape

### 2.1 The client's address opens the module

`smp-app/app/(platform)/[slug]/page.tsx` resolves the tenant exactly as
before — the one-door rule holds (a signed-out person to this client's door,
§313.36; a temporary password to the card; a client that is not theirs to
their own; anything else the one refusal) — and then **redirects** to
`clientHref(slug, open[0] || DEFAULT_MODULE, "")`, where `open` is
`openableModules()` (§356.5): the same answer the switcher and the card read,
never a second list. `Welcome.tsx` is deleted; `lib/landing.ts` keeps only
what the route still asks (`landingStampFor`, `doorHref`, `tourHref`).
`shell/route.js` no longer stamps `smp.welcome.done`, so the frozen welcome is
OFFERED again on a deep address, once a session, through its own control.

### 2.2 The client's Setup rail, and the set-up as a strip

`/<client>/setup` is the frozen Setup document served with
`data-setup-scope="client"` (spec 054 §4.2's own machinery). Its rail:

- `‹ Back to the console` — a row at the top, href `/platform`, drawn on the
  client scope only. A module's rail draws `Client settings ›` in the same
  slot, href `/<client>/setup`, where it drew *Back to the landing*.
- **The strip**: while `SMPRules.setupDone(GROUP)` is false, a button
  `.railstart[data-setupgo="start"]` above the search — *Getting started*
  and a progress line *"N of 7 done · <what is left> ▸"* computed from the
  flow's own `CLIENTSETUP.progress()`, never a literal — and the `start` def
  is filtered OUT of the groups. Once done, no strip; the def sits in the
  last group **The client** as *Client set-up*.
- The groups: cycle, who, run, meas, access, landing, help, client. **The
  `look` group is deleted** and the `brand` def with it: Branding is the
  flow's first step. **`kb` is `mod:"strategy"`**, grp `help`.

### 2.3 One flow, two hosts

`SMP-Project-Folder/src/client-setup.js` (+ `client-setup.css`) is the
console's set-up flow carried into the frozen sources, with **three
exports for three places**:

- `CLIENTSETUP.mount(host, opts)` — the platform's Setup page (`start` def).
  Seven steps: client · units · companies · functions · capabilities ·
  words · office. No summary step: the summary was the landing's job and
  the rail's strip does it now.
- `CLIENTSETUP.mountCreate(host, opts)` — the console's *Add a client*
  (name, industry, size, notes → `createClient` → `/<key>/setup/start`).
- `CLIENTSETUP.mountArchived(host, key, opts)` — the console's archived
  card (bring back, delete), because an archived client has no platform to
  open.

**The registry half writes on `change`** (§35): the client's name, industry,
size, notes and mark through `/api/platform`'s `saveClient`, the modules
through `setModules`, the team through `setTeam`, archiving through
`archiveClient` — the same actions the console posted. **The shape half
commits on Next, Back or Done**: `__smpShape()` — the SAME function
`lib/frozen.cjs` runs for the server's `shapeClient` — over a COPY of
`SYNC.graph()`, rebound with `SYNC.hydrate` (newly exported) only if nobody
in charge of anything was dropped, and the ordinary autosave carries every
row it minted (§210). So a unit made on Getting started is byte for byte a
unit made on Setup › Business units.

**A row is matched by its NAME first and only then by its key** (§357.3):
`addBusinessUnit` mints a key from the name and a client's stored keys were
not always minted that way, so re-minting read every existing head as
dropped and refused a pass that added one unit. A matched row keeps its key
— figures, focus marks, memberships and snapshots are keyed on it (§48,
§232) — and is re-addressed under it.

**A refusal puts the rows back and says so**: a removal or rename of a unit
or function somebody is in charge of is refused by name, the flow's list is
re-read off the graph that stood, the step redrawn so the row is SEEN to be
back, and the sentence says both halves. Without the put-back the flow held
the person on the step for ever.

**The shape is frozen once the client holds a plan** (`canShape()`), as the
console's was; the registry half, the mark, the modules and the team stay
editable.

### 2.4 Done with set-up

One key on the group, `SMPRules.SETUP_DONE` (`setupDone`), `true` or absent
(§50.6). `lib/authorize.js` classifies it `setup` and lists it in the
group's known keys — both edits, or the change is invisible and therefore
allowed to everybody (§259.2). `test-authorize.js` §41: the office may, a
custodian may not, neither direction reaches the unknown sweep; red 4 / 3
with either edit removed.

### 2.5 The console keeps three doors

`platform.html` loses the 2,198-line in-console flow. A live card's
*Settings* goes to `/<key>/setup`; *Add a client* mounts the create piece;
an archived card's *Settings* mounts the archived piece. `<script
src="/client-setup.js">` serves the one file; `build-shell.mjs` copies it
into `smp-app/public/` and refuses a `platform.html` that does not load it.

## 3 · Costs, stated

- **Islam has not seen the modules band and the archive block on step 1.**
  They were on the console's settings page; the mockup drew step 1 with the
  registry fields and Branding. Named in the what-to-check list.
- **The strip's count is steps answered, not rows.** *"6 of 7"* on a client
  with ten units and no office row is right and reads oddly beside the
  registry; the words after the dot say what is left.
- **A person who may open Setup may shape a client that holds no plan** —
  the platform's own writers decide inside the platform, where the console
  asked the console's `canEdit`. Both were the office's; stated because it
  is a different gate.
- **Nothing at `/<client>` to bookmark.** The address redirects; a bookmark
  of it lands on Strategy, which is what the button did.

## 4 · What must be proved

- `/<client>` redirects into the first openable module; the frozen welcome is
  offered there and its way out takes it down (`door-landing.mjs`,
  `shell.mjs`, `modules.mjs` off the source).
- The client rail: Back to the console, the strip agreeing with
  `progress()`, the flow mounted, step 1 writing `saveClient` on change with
  the Branding controls inside it, Done writing the mark and moving the def,
  put back in a finally (`door-landing.mjs`, served).
- Over file://: the bare state MADE (§255), a unit added and read back off
  the stored graph with heads and weighting rows surviving, a headed removal
  refused by name with the row put back and the next press proceeding, an
  unnamed row refused in words, Done moving the def, the shape frozen under
  a plan (`checks/client-setup.py`, red from the sources).
- The console's three doors (`checks/client-setup-outside.py`, rewritten):
  what is POSTED, never what is drawn (§96), on both copies of
  `platform.html`.
- `setup-per-module.py`: kb on Strategy, `start` on the client, the groups,
  the rows in both directions — file:// and served halves.
- The sweeps: `qa.py` file:// and at Next; `built-in-step`,
  `generated-in-step`; authoriser 673/0.

## 4.1 · What the checks found in the carry

- **Add a client threw before it posted** (§357.6): the console's create
  piece holds no step state and the shared `say()` wrote into it; no
  `createClient` was ever sent. Found by asserting what is POSTED.
- **The bare `/<client>/setup` landed on the entry page** (§357.7): the
  router writes it as a place with no page and `restoreWhere()` read that
  as nothing remembered. It lands on the scoped rail's own first page now —
  the strip, else the primary, else the first.
- **A client user at `/<client>/setup`** is served the spine document (the
  route gates modules, not the spine) and the shell lands them where they
  work with no rail drawn — measured and stated, not a refusal in words.

## 4.2 · What Islam found in it, and what changed (§357.9)

He pressed *Settings* on the console's card and met the welcome overlay over
the client's own Setup rail: *"when I press continue it opens the clietn
settings!! … the settings should open the settings directly … the welcome
screen (the home screen belongs to the straegy module) … a perosn can access
the client settings from the module settings page but it should be at the
bottom."* Two changes, neither reversing a decision above.

- **The welcome is the module's HOME screen.** §2.1 removed the line that had
  been standing the frozen overlay down and left no condition in its place, so
  it offered itself on the first client document of a session whatever address
  opened it. `shell/route.js` writes `data-deep-address` when `placeOf()`
  answered a place — which the bare `/<client>/<module>` the redirect and the
  door both produce does not — and `WELCOME.offer()` declines when it is
  there. The same rule the tour has had since §315.3, in its own words: *an
  address is somebody who has already chosen a page*. A document fact rather
  than a stored one, so the memory `welcome.js` keeps goes on answering one
  question (§107); read by `offer()` and never by `open()`, so the house mark
  still opens it from anywhere (§185).
- **`Client settings ›` sits at the FOOT of a module's rail**, where §2.2 put
  it under the head. The two rows are not two spellings of one thing: `‹ Back
  to the console` LEAVES and stays at the top, this one goes ON. After
  `.raillist` as a `flex:none` sibling, so it is at the bottom of the rail box
  by construction and does not scroll away with the list (§108.5, §290.1); its
  hairline swaps ends with it. Both ends asserted, or a build that put the two
  in one slot passes half.

**And `/<client>/tour` is an address too** (found by reading the condition
rather than by a check): nothing is remembered for it and the tour's own mark
must not be set on it, but `land()` offers the intro round only where the
welcome declined (§148) — so without the stand-down there, the one address
that names the tour is the one address that cannot start it. It gets the fact
and nothing else. **RECORDED, NOT DONE**: `lib/landing.ts`'s `tourHref` has
had no caller since §2.1 deleted the landing that linked it (§24), and
whether the address itself stays is a question about how the tour is offered
now that the welcome's own card is the only door to it.

Proved able to fail from the sources (§276): the row back at the head, 1 red;
the foot rule deleted, 1 red; `data-deep-address` removed, `door-landing.mjs`
2 red (the first printing `[1,null]`, his report reproduced) and `shell.mjs`
1 red. Two neighbours were red on the branch, both §357's and both rewritten
rather than loosened: `setup-search` folded the deleted `look` group, and
`setup-rail` asked the strip to be inside the list it is deliberately outside.

## 5 · Deliberately not decided here

- Where the knowledge base finally lives (*"until we decide later"*).
- Whether the email settings ever join Branding (spec 054's table said so;
  Islam: a Strategy-module setting).
- Per-module set-up steps: a module that arrives with a set-up question of
  its own has no step in this flow yet.
