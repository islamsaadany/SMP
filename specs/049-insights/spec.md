# 049 · Insights — the library, published by Forefront

**Status:** two decisions taken 2026-09-13; the rest specified. **Nothing is
drawn and nothing is built** — the two screens want a mockup before a line of
them is written (rule 1c).

**Decisions section:** to be taken on the build. Not claimed here, because a
number claimed in advance is one another session takes while this is in flight
(§287, §94.12's family).

**Depends on:** spec 046 / §320 (four modules on one spine, and the module
switch, which is built) and spec 043 / §314 (the shared schema).

**Reverses:** nothing. It is spec 046 §4.8 built, and the second item in that
spec's own order of work.

---

## 1 · What is asked

Islam, 2026-09-13, with a rebuild description of a *resources* module taken from
another codebase (`aleymahmoud-ff/strategy-management-system`, feature 012)
attached: *"here is a resources module we need to add for our clients."*

**THE MODULE WAS ALREADY DECIDED AND ALREADY NAMED**, and saying so was most of
the answer. On 2026-09-11 he was asked what to call the research module and
answered **Insights**, turning `Resources` down for a reason that still holds —
standing beside a project-management module it reads as *people and capacity*,
the one thing it is not (spec 046, decision #4). The word is in `MODULES`,
reserved, `built: false`, with its line already written. Nothing is behind it.

So the file he sent is **evidence of what such a module contains, not the
design**. Two things were put to him and answered the same day:

| Asked | Answered |
|---|---|
| The name — does *Resources* reverse *Insights*? | **Insights stands.** |
| Who publishes — Forefront, or the client in their own app? | **Forefront only, from the client's card in `/platform`.** |

A third was put badly and is recorded as such: *"one machine, used twice"* came
back *"I don't understand"* — it was asked in this document's words rather than
his, and it was not open anyway. Spec 046 §4.8 already settles it: **Insights
and Processes are one machine, built once and instantiated twice.** Written
plainly for him, and not re-asked (§266: a question the reader cannot parse is
answered by drawing it, and one that is already answered is not asked again).

---

## 2 · Where the attached file disagrees with what is already decided

Three, and each is named so the file cannot be copied past them.

**2.1 · Who publishes.** The file gives the *client* an upload modal inside
their own app, gated on a `STRATEGY_MANAGER` role there. Spec 046 decision #9
is the opposite — Forefront publishes, the client searches, opens and
downloads, and **there is no authoring surface in the client app at all**.
Confirmed again today. This moves most of the build into `/platform` and makes
the client's half thin by design (spec 046 §4.9).

**2.2 · One machine or one module.** The file describes a module of its own,
with tables named after reports. Built that way, Processes is a second build of
the same search box, the same list and the same categories — §53.5 at the size
of a module.

**2.3 · Where the bytes live, and this one is a hard constraint rather than a
preference.** The file puts the PDF in Postgres `BYTEA`. **A serverless
function refuses a request body over about 4.5MB**, which `lib/blob-api.ts`
records as the reason §261's clips go to a blob store and arrive in pieces — so
a 20MB report cannot reach the database the way the file describes. The file
admits it never tested this: its own §10.8 says *"treat 20 MB as unproven"* and
names lowering the cap as the remedy. **We already know the cap it would have
had to be lowered to, and we already have the way round it.**

---

## 3 · What exists today, and what the contract still wants

Spec 046 §4.2: to be a module a thing must bring **five**. Against Insights:

| # | The contract asks for | Today |
|---|---|---|
| 1 | Its own navigation | — · a library's second row is **its categories** (spec 046 §4.6) |
| 2 | Its own roles and areas | — · nothing; §4 below |
| 3 | Its own Setup group | — · and it may hold nothing, §4.7 |
| 4 | Its own rhythm, or none | **none, and versions** (spec 046 §4.3) |
| 5 | A landing | — · the route has a branch per module and no Insights arm |

What the spine already gives it for nothing: the address
(`/<client>/insights/…`, `lib/modules.ts` `whereOf`), the switcher
(`moduleMenu`), the row on the client's card (`moduleRows`), the on/off drawer
in the client's Settings (`setModules`), and the door (`resolveTenant`).

**Insights would be the first module ever built into that frame**, which is why
spec 046 §5 puts it second: *"a frame with one tenant in it is not a frame that
has been proved."* The trial module proved a module can be turned on and
opened; it brings none of the five.

**AND THE ROUTE SAYS SO IN ITS OWN COMMENT.** `app/(platform)/[slug]/[...rest]/route.ts`
serves Strategy or the trial from a branch, with the note that *"a third makes
the table worth having"* (§2b). Insights is the third.

**THE BLOB STORE IS NOT SWITCHED ON.** `lib/blob-api.ts` loads `@vercel/blob`
inside a `try` and the package is deliberately not a dependency, so the degrade
path — *"no video store here"* — is the one every check exercises today. Two
things Islam must do before an upload can be proved end to end: install the
package, and set `BLOB_READ_WRITE_TOKEN` on the deployment. Everything else in
this spec can be built and checked without it.

---

## 4 · The decisions

### 4.1 · One machine, two names

An **item** is: a name, a set of categories, a date it was published, a version,
and something to open. Insights has a **file** on the end; Processes has
**steps**. One table, one list screen, one search, one set of categories, and a
`kind` on the item that says which library it belongs to.

**NOT TWO TABLES**, and not a table per module. Two would be the same columns
twice, and the day a category rule or a search changes it would change in one of
them (§53.5). Processes is then what spec 046 promises it is: *nearly free*.

### 4.2 · What an item is

One tenant-owned table. **`tenant_id` is the whole of what it costs to be
isolated** — `db/schema.sql`'s loop at the end enables RLS, forces it, indexes
`tenant_id` and attaches the `tenant_rows` policy to every table in the schema
that is not on the platform's own list, on the next apply. So a new table is
covered by construction rather than by somebody remembering, and
`lib/schema-check.ts`'s `PLATFORM_TABLES` must **not** gain it (§331: the two
lists name the platform's tables and must agree).

| Field | Why it is there |
|---|---|
| `id`, `tenant_id` | the item, and the client it belongs to |
| `kind` | `insights` or `processes` — the one machine's discriminator |
| `title` | required; trimmed; non-empty is the only thing that makes an item |
| `summary` | two lines on what it covers. Plain text, never rendered as markup |
| `categories jsonb` | a set of words, canonically ordered, §4.4 |
| `published_on date` | **the report's own date, not the upload's** — the file he sent gets this right and it matters: a market report is filed under when it was written |
| `version` | spec 046 §4.3 gives this library *"None; versions"* — §4.6 below |
| `state` | `draft` or `published`; §4.5 |
| `file_path`, `file_name`, `file_size` | where the bytes are and what they were called |
| `downloads` | a count and never a log; §4.9 |
| `published_at`, `published_by` | stamped the first time it goes out, never rewritten |
| `extra jsonb` | **room for an owner and a next-review date, drawn by nothing** — Islam's *"for now"* on Processes (spec 046 decision #10), so growing teeth later is an addition rather than a migration |

**`extra` IS THE ROAD THIS PROJECT ALREADY USES** (§177, §213): a field that
lands there needs no migration and no schema change, proved by writing one and
reading it back rather than claimed (§172, which exists because that claim has
been wrong here before).

### 4.3 · Where the bytes live

**The blob store, on §261's own rules, not a second answer to a question this
product has already measured.**

- The path **is** the permission: a clip is `videos/<target>/<id>.<ext>` and the
  read address reads the target back out of the path to ask the same question
  again. An item's file is `insights/<tenant>/<id>.<ext>` on the same principle,
  with every segment scrubbed to a safe alphabet so nothing typed can climb out
  of the folder it belongs to.
- **The upload arrives in pieces** (§261's multipart path), because of §2.3, and
  **every piece is authorised** rather than one address being minted and then
  trusted.
- **A read address is minted in two steps and is short-lived** — a private blob
  has no fetchable address of its own (§261.10, whose whole lesson was that
  `getDownloadUrl` is not this and nothing ever played).
- **No store, no crash** (§231.3): with the package absent the library still
  lists, searches and says in words that the file cannot be fetched. It does not
  take the module down.

**The cap is not chosen here.** 20MB is the attached file's unproven number; the
real one is whatever the store and the browser's piece size make comfortable,
measured once the store exists, and written down as the measurement rather than
as a preference.

### 4.4 · Categories — the module's navigation

A library's second navigation row **is its categories** (spec 046 §4.6), so this
is the contract's item 1 rather than a filter bolted onto a list.

**A fixed list of words in code, for now — and the item stores the WORDS.**
That last clause is the whole of why it is safe to start fixed: a per-client
vocabulary later reads the same stored rows and costs no migration. The
attached file's six (*Analysis, Macro, Market, Sector, Governance, Other*) are a
reasonable start and are not adopted unread — they are Forefront's to set.

**An item carries a set, any number including zero**, canonically ordered on the
way in so the order somebody clicked in cannot change what is stored. An unknown
word is dropped rather than refused (the file gets this right).

**NEEDS ISLAM'S WORD, and it is in §7:** whether one client's categories are
another's. A market-research vocabulary for a retail group is not one for a
bank, and the Official BU list (§54) is the precedent for *the client's own
words, stored per client, set by us*.

### 4.5 · Who may open it

**One area, in the module's own tab** — spec 046 §4.4: one Access page, a Client
tab and a tab per module, *"nothing is multiplied"*.

**AND IT MUST NOT BE AN EDIT TO STRATEGY'S MATRIX**, for a reason that is
mechanical rather than tidy: `smp-app/lib/rules.cjs` is a **carried copy** of
the frozen `lib/rules.js`, and `checks/generated-in-step.mjs` asserts the two
are identical after one declared transform (§335 — written because three
carried modules went stale and the served authoriser ran without a rule it
needed). Adding `a_insights` to the carried copy alone turns that check red;
adding it to both puts a module's area into the frozen Strategy product, which
is not where it belongs. **So Insights' roles and areas live in a module-owned
file of its own**, which is what the contract asked for in the first place.

**Two states, not three: `view` or `none`.** Nobody in the client's app writes,
so an `edit` would be a grant with nothing behind it (§94.15). This is spec 046
decision #15 — *whole module, for now: if you can open Insights you can see
everything in it* — and the per-item visibility it defers.

**No role in the module, no module in the switcher** (spec 046 §4.4, §61).

**THE SHIPPED DEFAULT NEEDS HIS WORD** and is in §7. The argument each way: a
library Forefront chose to publish to a client is *for* that client, which says
`view` for everyone; and this project's own instinct is that defaults ship at
the narrow answer and the client's Super user opens them (§37, §42).

### 4.6 · Versions — replace in place, and say which edition

Spec 046 §4.3 gives Insights *"None; versions"*, and §4.8 puts a **version** on
the item. The attached file has no versioning at all — it replaces the file in
place and records nothing. **Both, which costs one column:**

- Replacing the file **keeps the id, the address, the categories and the
  download count** — the semantics are *a new edition of the same report*, which
  the file gets right and says so in its own form.
- `version` **goes up by one**, so a reader can see they are not holding what
  they held last month. That is the whole of what "versions" buys here.
- **No revision table and no previous-editions list.** What the old file said is
  not kept, and that is stated rather than left to be discovered.
- `published_at` is stamped **once** and never rewritten, so withdrawing and
  republishing does not move a report's place in history. (The file does this
  and then never shows the value anywhere — see §6.)

### 4.7 · Setup — the group may be empty, and that is an answer

The contract asks for a Setup group. With publishing on our side and no
per-item permissions, **Insights may have nothing for the client to set** —
in which case it draws no group rather than a page with nothing behind it
(spec 046 §4.5: a module switched off removes its group; a module with nothing
to set never had one).

If §7's category question comes back *per client*, that IS the group's one
page — and it is **Forefront's to edit**, not the client's, on the same argument
that publishing is.

### 4.8 · Retiring — withdraw, then delete

The attached file's two mechanisms are right and are kept:

- **Withdraw** (`state: draft`) is the soft one. The item leaves the client's
  list, and its address answers **not found** rather than not allowed — a reader
  is never told a record exists. That rule must sit in the `WHERE` of every
  read, the file download included, and not in the screen (§42, §44).
- **Delete** ends it, and the bytes go with it. A row removed must take its blob
  with it or the store quietly accumulates megabytes nobody can name — the file
  gets this free from a database cascade and **we do not**, because our bytes
  are outside the database. So the delete removes the blob and then the row, and
  a blob the store no longer holds is not an error on the way (§62's shape:
  the refusal is the feature, and a missing file is not a refusal).

There is no tombstone, no redirect to a replacement and no notice to anybody who
downloaded it. Stated rather than implied.

### 4.9 · The count, and what it deliberately is not

`downloads` is a count and **never a log**. It is the one thing that tells
Forefront whether anybody reads what we publish, which is worth having; a
per-person record of what each of a client's staff opened is a surveillance
decision nobody asked for, inside a client's own app.

**Counted on the server, at the moment the address is minted** — not
optimistically in the browser, which is the attached file's own recorded fault
(its §10.7: a 404 still bumps the number on screen).

---

## 5 · What the attached file is worth taking whole

Three things, and they match how this product already thinks:

1. **A file is checked by its first bytes, never by its name or the browser's
   claim** — `%PDF-`, and PNG/JPEG for a cover. §313's branding upload is the
   precedent here, and §52's PNG-only decision is the reason it matters: an
   uploaded file is executable content until something has looked at it.
2. **The filename is scrubbed before it reaches a response header** — control
   characters, slashes, quotes and `..` runs — because a filename in a
   `Content-Disposition` is a header-injection surface.
3. **A withdrawn item answers *not found*, not *not allowed*.**

And one shape: **the list is the only screen.** No detail page, no in-app
viewer.

---

## 6 · What must not be copied

The file's own §10 is honest and all of it stays out:

- the **detail endpoint with no caller** — if a detail view is wanted it is new
  work, not a port;
- the **sort parameter that is never validated** and falls through silently;
- `publishedAt` **written, typed, selected and never shown** (§61's trap: it is
  either on a screen or it is not a field);
- the **optimistic download count** (§4.9);
- the cover-fit verdict **computed and never branched on**;
- and the constants exported and never imported.

Plus the three in §2, and this: the file's roles (`STRATEGY_MANAGER`,
`FUNCTION_HEAD`, `EXECUTIVE`), its Prisma models, its NextAuth session and its
Tailwind classes are another product's. Nothing of that layer ports.

---

## 7 · Not decided — Islam's, before the mockups are drawn

1. **Are the categories the same for every client, or the client's own?**
   Recommendation: **one fixed list now**, stored as words so per-client later
   costs no migration (§4.4). Against it: a research vocabulary is exactly the
   kind of thing that differs per client, and the Official BU list (§54) is the
   precedent for us setting a client's own words.
2. **What does the module default to on the access table — `view` for
   everybody, or `none` until the client's Super user opens it?** (§4.5.)
3. **Does Processes come with it, or after it?** Spec 046 says *nearly free
   once Insights exists*; free is not nothing, and the answer changes what the
   first mockup draws.
4. **The blob store** — the package and the key (§3). Not a design decision, but
   uploads cannot be proved without it.

---

## 8 · The order of the work

1. **Two mockups, signed off before a source moves** (rule 1c, non-negotiable):
   the client's library — a search box, the categories as its navigation, a list,
   a download — and the **publishing room** on the client's card in `/platform`.
   Both drawn out of the pages' own stylesheets, published as artifacts.
2. The table and the migration; the item, read and written under `withTenant`.
3. The publishing room (the larger half).
4. The client's library, and the route's third branch — which is where the
   per-module table replaces the two `if`s (§3).
5. The module's own roles file and its tab.
6. Processes, if §7.3 says now.

---

## 9 · What must be proved

- **A check of its own** (`smp-app/checks/insights.mjs`), red first, falsified
  from the sources (§276).
- **The boundary, at both ends** (§94.2): one client's item is invisible to
  another — asserted as `smp_app`, under the tenant, and asserted for a *second*
  client rather than only for the absence of rows, because a query that returns
  nothing satisfies both a working policy and a broken read (§113.8).
- **A withdrawn item 404s by its own address** for a client's reader, and the
  file with it — driven, not reasoned.
- **The client's app has no way to write.** Asserted on the **server**: every
  write refused for a client's own person however the request is spelt, because
  a rule the screen keeps and the endpoint does not is one anybody with a
  console walks past (§42).
- **A replaced file keeps the address and the count and moves the version**
  — read back from the database, never from the screen (§96).
- **With no blob store the module still lists and searches** and says what it
  cannot do (§231.3).
- `checks/modules.mjs` extended: Insights offerable once `built: true`, and the
  address refusing it for a client that does not hold it.
- `generated-in-step.mjs` green — nothing added to the carried rule modules
  (§4.5, §335).
