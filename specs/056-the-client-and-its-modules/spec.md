# 056 · The client's settings are the client's, and each module's are its own

**Status:** aligned 2026-09-16 over one conversation, drawn before anything
moves (rule 1c). **Stage 1 built 2026-09-16 (§359), on the branch** — the
client's settings wear the client's bar; the other five stages are unbuilt.
Stage 1's one deviation from `tasks.md` is recorded there: its check is a
section of `smp-app/checks/shell.mjs` rather than a Python file of its own,
because the whole surface is served-only and that file already stands up the
built app, a database and a browser.

**Opened by:** Islam, with a screenshot of `/raya-trade/setup` — the client's
own Setup rail underneath Strategy's full navigation bar — *"theclient
settings shouldn't open the strategy banner in the top this is a client
settings separate than any module we need to talk about the architecture
again"*. Then, of the first answer offered: *"you are trying to make a simple
fix. let's discuss the architecture and who sees what it's not a simple
fix."* He was right; this spec is that conversation settled.

**Depends on:** spec 046 (modules on one spine), spec 054 (a def knows its
module; the rail draws by scope), spec 055 (the client's settings live in the
platform, reached from the card).

**Reverses nothing.** Spec 055 put the client's settings behind the card's
*Settings* button and said they open "in the client's chrome". They do — and
the client has no chrome of its own, so what renders is Strategy's. This spec
gives the client one.

---

## 1 · The shape, in Islam's own words

> *"the settings of the Client is accessible from the main settings button on
> the card of the Client in the platform and it doesn't show anything else.
> It's just a settings page for the client with the structure that we agreed
> on and the person who opens it he can save and go back … to the console to
> choose which module I'd like to see … Each module has its own starting
> screen and has its own settings page … the Strategy module has a welcome
> screen and then you get inside and you can open the settings. The other
> modules has no welcome or home screen. You just open it right away."*

**Three levels, each with its own screen.**

| | what it is | whose |
|---|---|---|
| **The console** | Forefront's list of clients, one card each | ours |
| **The client** | its settings — and nothing else on the screen | the two seats |
| **A module** | its own start screen, its own pages, its own settings | whoever that module's access admits |

And the governing sentence, which is the whole architecture:

> *"the client settings is governing every module below and each module has
> it's own sub settings for the module and it's user depending on the module
> itself."*

## 2 · The rule that decides where any page goes

From that sentence plus his correction on the inbox — *"most of the client
main setting should be for setup and not for daily use"* — the rule is:

- **The client's settings are what you SET UP about the client.** Every
  module below reads them.
- **A module's settings are how that module works and who may use it.**
- **What you DO daily is not a setting at all** — it is the module's tool,
  and it lives with the module.

Applied to every page we have today, most are already where the rule puts
them. §5 to §8 are the four that were not, each settled with Islam in this
conversation.

## 3 · The client's settings page

**Reached from the console's card, by *Settings*.** Unchanged from spec 055.

**What is on it:** the client's name, its mark and its colours; the rail we
agreed (*Client set-up*, **Forefront team**, People register, Official BU
list, Business units, Companies, Functions, Capabilities, Terminology,
Outgoing email, History); the page; and **Save & close, which returns to the
console**.

**What is NOT on it — the whole of the complaint:** no house mark into a
module, no Group dropdown, no Units | Functions switch, no row of
destinations, no tab row, no module switcher. *"It doesn't show anything
else."*

**Why nothing on that rail loses anything by it:** none of those seven pages
uses a destination, a tab or a section. They were never navigating with it.

**Who chooses a module, and it is two different controls for two different
people** — stated because it decides nothing gets stranded:

- **us**: the console. Save & close lands there, and the card's module rows
  are already doors into each module.
- **the client's own people**: they never see the console — they sign in at
  the client's door — so the chooser for them is the **module switcher in the
  module bar**, which is already built and already drawn only where there is
  more than one module to choose from (§320.6).

**Branding** is already absorbed into *Getting started* (spec 055) and stays
there: it describes the client, and every module wears it.

## 3a · Forefront team, and the register that reads from it

Islam, of the drawing's register showing a consultant beside the client's own
people: *"the client setting has no custodian or owner, it has only the super
user and the smo team"*, then *"a consultant shouldn't be on the register one
role is enough"*, and then — his own revision, which is the decision —
*"how about the forefront team is a separate view as you did but we keep them
on the client list reading from the forefront team list."*

**Forefront team is the store; the register is a reader.** Written out
because the pattern is §9's, a fifth time: **one store, one place to edit,
more than one place to read.**

- **Forefront team** is its own entry under *Who*, above the register. It is
  the ONE place a consultant is added, given a seat, or removed. It exists
  today inside the set-up flow (spec 044), so this is mostly a move: people
  join and leave an account team all through an engagement, which is not a
  one-off.
- **The register shows them too**, read from that list, so there is still one
  screen showing everybody who can touch this client — and one search box
  that finds all of them.
- **On the register a consultant is READ-ONLY and marked as ours.** Their role
  there IS their seat. **One role is enough**, enforced by the platform rather
  than by whoever is typing: a seat holder can never also be given a client
  role from the register.
- **The columns that mean nothing for them are blank and say so** — no unit,
  no Official BU, no Emp ID — and **no password controls on their row**, which
  the server already refuses (§89): a row must not offer what the save will
  turn down.
- **The count says both**: *33 of the client's own people · 3 from Forefront*,
  rather than one number quietly meaning two things.

**The name is Islam's**, and it is deliberately not *SMO team*: that is also
the name of one of the two seats, so a table called it would hold Super users
too and say one word meaning two things (§87's twins).

**What must NOT be done without its own piece of work, said plainly.** A
consultant's standing on a client IS a minted register row today — it is how
the platform knows they hold the seat, how a plan can name them, and how the
state API places them. Removing the row is the live defect fixed on
2026-09-12 (§338, §316.9), where an office person opening a client was told
*"You are not on this client's register yet"* for ever, on every client. So
the row stays and the TABLE changes. Making the row genuinely go would mean
the door, the landing and the state API resolving a consultant another way,
and it is its own item.

**One thing to check when it is built:** §313.32 lets an office account whose
email matches exactly one active register row ADOPT that row, for a client
whose register the platform did not build. Under this rule that path needs
re-reading — it is the one way a human could end up meaning both things.

### 3a.1 · What that re-reading found (T2.1, 2026-09-16, before building)

**THERE ARE TWO KINDS OF FOREFRONT ROW AND ONLY ONE OF THEM IS OURS TO
REWRITE**, and the register already tells them apart — `lib/state-api.ts`'s
`officeRow` has marked them since §313.29, so this needs no new field:

- **`extra.ffrow`** — the platform MINTED the row for a consultant who was on
  nobody's register. Its `role` IS the seat, and `officeRow` rewrites it on
  every request (§338's heal). So the register must never let anybody set it
  to a client role: the next page load would put the seat straight back, and a
  control whose value is overwritten behind the person who set it is §96 with
  a save on the end of it.
- **`extra.forefront` WITHOUT `ffrow`** — the row is the CLIENT'S OWN person,
  adopted because their address matched exactly one active row (§313.32), and
  `officeRow` deliberately does not touch its role: *"adopted, never
  rewritten … one mark, `forefront`, and nothing else on a row the platform
  did not mint."* **That person legitimately holds a client role AND a seat.**

**SO THE REFUSAL NARROWS, AND SAYING SO IS THE POINT.** §3a reads *"a seat
holder can never also be given a client role from the register"*; taken
literally that would strip the client's own custodian of their custodianship
the day they are added to the account team, which is data the client entered
and which §96.2 forbids us to rewrite. The rule that is both true and safe is
**you may not give a client role to a row the platform minted** — the
`ffrow` rows, whose role is not theirs to hold in the first place.

**WHAT AN ADOPTED PERSON THEN LOOKS LIKE, and it is the one thing to check on
a screen:** they are on Forefront team (they hold a seat) AND on the register
as the client's own person, editable, marked as also being ours. One human,
one row, two lists that agree because both are reading it. That is §9's
pattern holding rather than an exception to it.

**Measured rather than assumed**: Raya Trade's register was brought across by
the carry and not built by the platform, so `made_here` is false there and
adoption is the live path for it — this is not a corner nobody reaches.

## 4 · Who may open it

**The two seats, and nobody else.** Islam, asked outright: *"yes access to
client settings is the two seats."*

This is already the measured truth rather than a change: `a_setup` is `edit`
for `super` and `smoteam` and `none` for every one of the client's own roles —
group CEO, company CEO, unit owner, custodian, function head, project owner,
pillar owner, contributor, everyone else. And the two seats are held by
**Forefront accounts**, on the console. His own words when that was written:
*"no one should have access to the settings except for the SMO"*, and later,
*"there is not client smo for the client it's always the smo whihc is us."*

**The consequence is a simplification.** With the client's seven pages
answering to the seat, they leave the access matrix entirely — they stop
being a matrix question at all.

**The seats are already set inside the client's settings**, on the team step
of the set-up flow (spec 044). That half of the mechanism is built.

## 5 · Roles & access — the rows are the client's, the columns are the module's

Islam: *"roles and access in the strategy is only for the strategy access not
the client … align with me on that because the roles and access page in
straegy is super critical to change it manages the whole clients accessability
including the smo office."*

**That page does two jobs today, and separating them is what makes it safe.**

- **The rows — who the people are — are the CLIENT'S.** Islam, checking it
  back: *"the people registry and their roles is a client wide thing not a
  module thing but the access and roles view page is per module."* Exactly
  that. Super user and SMO team come from the two seats (read from Forefront
  team, §3a). Group CEO, company CEO, business unit owner, function head and
  custodian come from the client's register and from the units and functions
  pages. One list, defined once, read by every module — **and the register
  keeps its roles column, because that is where a client role is given.**
- **The columns — what each may reach — are the MODULE'S.** Strategy's are
  the group, a unit, a function, the cycle, its own settings. Insights
  declares its own. A module may also add ROWS its own work creates: project
  owner, pillar owner and contributor exist because *Strategy's plan* names
  somebody, so they appear on Strategy's table and nowhere else.

**The risk falls rather than rises, and that answers the warning.** That page
is critical today for one reason: its **Setup** column reaches the
client-level pages. Once those answer to the seat (§4), Strategy's table
governs nothing outside Strategy and its Setup column means *Strategy's own
settings*.

**HARD RULE, TO BE ASSERTED AND NOT PROMISED: nobody's access changes on the
day this ships.** Every shipped default stays what it is; every client's
stored matrix goes on meaning what it meant (§30.2). This is a re-housing,
never a re-granting. The check must compare, for every person and every page,
what they could open before and after — and require them equal.

**A REVERSAL WITHDRAWN, RECORDED RATHER THAN DELETED (Principle II).** Between
his two messages this spec briefly proposed the opposite — that the roles are
the MODULE'S and the client level holds only people, places and the two seats
— on an over-reading of *"the client setting has no custodian or owner"*. That
sentence is about **who may open the client's settings** (§4), not about where
roles live. The proposal was withdrawn on his correction. What survives from
it and is right: a module may add ROWS its own work creates — project owner,
pillar owner and contributor are derived from Strategy's plan naming somebody,
so they are Strategy's rows and appear on no other module's table.

## 6 · Terminology — one page, two doors

Islam: *"terminology is a client setting however it can be adjusted from the
strategy module as well … maybe they can show the same page"* — then, of the
proposal below, *"one page ok from 2 doors."*

- **One page, one store, opened from two places** — the client's settings and
  Strategy's settings. **Never two copies that sync**: two answers to one
  question is the drift this project keeps recording (§53.5). There is
  nothing to keep in step when there is only one of it.
- **Each module declares its own words**, and only the words of modules the
  client HAS are shown. The list today mixes the client's word — *business
  unit* — with Strategy's: Pillar, Theme, Tactic, Key measure, Winning
  Aspiration, Purpose, Core Values. Without the declaration, a client who has
  Insights and no Strategy would be asked what to call a Pillar.

**Third instance of a pattern** (§9): the module declares, the client sets —
as with a module's access areas (§356.5) and its landing line (§356.4).

## 7 · Tools go to the module; the email identity stays with the client

Islam: *"the platform inbox and email are action tools they should be on any
module with settings and for now we have only the strategy having this."*

- **The Platform Inbox and Send an email are the MODULE'S** — they are things
  you do, not things you set. Today only Strategy has them.
- **What the client's outgoing email looks like is the CLIENT'S** — the
  address it comes from, the display name, the reply-to, the footer. Set once,
  and if Processes sends a reminder next year it must come from the same
  address with the same name. Islam: *"for the adress and the name and footer
  can be in the client not the module true."*

**Recorded, not in this round:** by the same rule, most of Strategy's own
*Running the cycle* group — the reporting cycle, import and storage, figures I
report — are daily tools sitting in a settings rail. That predates this and
is worth its own look.

## 8 · History — one record, a door per scope

Islam: *"every module should have it's history for now"*, then *"each module
has access of history to it's own module history not the overall and the
overall is in the client settings."*

- **A module's settings shows that module's history**, and you stay inside
  the module.
- **The client's settings shows the overall history** — everything, with tabs
  to narrow: the client itself, then one per module. The office's, the two
  seats.
- **It must be the module's own rail drawing it, never a link out to the
  client's page.** The client-level page belongs to the two seats, so a link
  would be a door that opens onto a refusal for anybody else (§61).
- **The tabs somebody sees are the modules they may open**, which is already
  worked out (`openableModules`).

**The one real piece of work:** `change_log` has no module column. It has
`kind` — what the authoriser decided the change was — so **which module a
change belongs to is DERIVED from that rather than stored beside it**: a
second field saying the same thing as `kind` is two answers to one question,
and it would leave every row already written with nothing in it. A kind the
map does not recognise falls to the **client** tab, which is the safe end,
because that page is the office's and shows everything anyway.

**Named so it is not discovered later:** a module's history shows that
module's changes, so renaming a business unit — a client-level change
Strategy plainly cares about — is on the client's tab and not on Strategy's.
The module's history says in one line where the rest is: a door for a seat
holder, a plain sentence for everybody else (§61, §124).

**And about the word:** history is a RECORD, not a setting. The client's
settings is the only client-level screen there is, so it goes there — and if
the client level ever grows a second screen, history is the first thing that
should move out of the word *settings*.

## 9 · The pattern, and it is the test for the next thing

Four things in this spec landed on the same shape:

> **One store, one renderer, a door per scope — each door narrowing to its
> own.**

Terminology (one page, two doors). Access (one list of people, each module's
own columns). History (one record, a module door for its slice and a client
door for the whole). The landing line and the access areas before them (the
module declares, the client sets).

**This is what keeps the modular architecture cheap: we are not building a
second copy of anything, we are giving each scope its own door onto one
thing.** Apply it to the next thing somebody wants "per module" before
building a second one of it.

## 10 · Separate on screen, and the spine as its own piece

Islam: *"separate code or separate on screen satisfy the case noting that"* —
the need being the relationship in §1, not the file layout.

**So: separate on screen now.** The client's settings are served without any
module's navigation, and the seven pages keep the renderer they already have.
Nothing about the register or the business units is rebuilt to get the screen
he described.

**And taking the spine out of the Strategy file goes on the plan as its own
piece.** Stated honestly: the frozen shell IS the spine today — it draws the
top bar, the theme and the session chrome for every screen — so lifting the
client's settings out of it alone would remove one thread of a dependency
that sits under everything else. That piece is worth doing when a module
needs navigation of its own, and it pays for Insights and Processes at the
same time (§345, `specs/046-modules/repo-boundary.md`).

## 11 · What this does not do

- **It does not move anybody's access** (§5), and that is asserted.
- **It does not give a client's own people the settings.** If that is ever
  wanted, §4 is the decision to revisit, and `a_setup` would have to stop
  being one all-or-nothing switch.
- **It does not build a client-level home screen.** `/<client>` stays a door
  into the first module somebody may open (spec 055).
- **It does not touch how a module draws its own work** — only its settings
  rail and its chrome.

## 12 · How it will be proved

- **Nothing else on the screen**, at both ends: the client's settings draws
  no destination row, no tab row, no Group dropdown, no Units | Functions and
  no switcher — *and a module's page still draws all of them*, or a build
  that deleted the navigation everywhere passes half (§94.2).
- **Save & close lands on the console**, and the card's module rows still open
  their modules.
- **Nobody's access moved**: for every person in the demo tenant and every
  page, what they could open before equals what they can open after (§5).
- **Terminology is one store**: a word set from one door reads from the other,
  and a client without a module is never asked for that module's words — both
  ends.
- **A module's history is its own slice and the client's is everything**,
  asserted as an AGREEMENT with the log rather than against a typed list
  (§94.8); the derivation's unknown kind lands on the client tab.
- **The client's colours and mark are on the page** (Islam's (c)).
- **Forefront team is the only place a consultant changes**: the register
  draws them read-only with no unit, no role picker and no password control,
  and a seat holder cannot be given a client role from it — asserted at both
  ends, or a build that simply dropped them from the register passes half
  (§94.2). The search finds them from the register's own box.
- Each claim proved able to fail from the SOURCES before its green run is
  believed (§276, §94.5).
