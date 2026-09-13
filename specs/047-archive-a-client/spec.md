# 047 · Archiving a client, and only then deleting one

**Version:** v4.90 · **Decisions:** §323 · **Status:** answered; built; merged

Islam: *"we need an option to remove the client"* — and, asked whether that
means putting a client aside or ending them outright, and whether the worked
example is included: *"both, demo client is not removable, and the name is
Archive not put aside."*

Drawn first (`design-mockups/archive-a-client/2026-09-12_archive-and-delete.html`,
six frames made of the platform page's own stylesheet verbatim, rule 1c).

---

## 1 · What is asked

1. A client can be **archived** — put aside, their door closed, nothing lost.
2. An archived client can be **deleted** — ended outright, with the data gone.
3. The **worked example is neither**; it is reseeded.
4. The word on the screen is **Archive**, not *put aside*.

## 2 · What was already built and had no button

`tenants.status` has read `'active' | 'retired'` since the table was written.
`visibleClients()` already keeps a retired client off the cards, and `door.ts`
already turns a retired client's address away **identically** to a client that
never existed — one constant, so the two cases cannot be told apart from
outside. Nothing had ever set that column, and `lib/tenant-delete.ts` had no
caller outside its own spike. §61's trap twice over: the machinery is the
feature, and the feature had no door.

## 3 · The decisions

- **DELETE IS REACHABLE FROM AN ARCHIVED CLIENT AND NOWHERE ELSE.** That is the
  guard rather than a second confirmation: archiving closes the door, so nobody
  is working inside a client while it is being deleted.
- **THE STORED WORD STAYS `retired`** and the label is *Archived* (§30.2, §65):
  renaming a stored value for a word nobody reads is a migration with no reader
  on the other end of it.
- **THE BLOCK IS §273.4's SHAPE**, which Islam chose once already for the
  reporting cycle: the destructive act in its own block, behind a rule, under a
  heading, at the foot of Settings.
- **NOT DRAWN RATHER THAN DISABLED** (§61): the worked example and anybody who
  is not the platform's admin get no block at all.
- **THE NAME IS TYPED BACK, AND THE SERVER ASKS AGAIN** (§42): the admin's
  right, the client already archived, and an exact match — all three on the
  server, because a rule the page keeps and the endpoint does not is a rule
  anybody with a console can walk past.
- **AN ARCHIVED CLIENT IS READ, NOT EDITED**: `saveClient`, `shapeClient` and
  `setModules` all refuse one by name, so the state and the permission are two
  different answers rather than one.
- **IT RUNS ON THE OWNER POOL AND THAT IS NOT A PREFERENCE**: `deleteTenant`
  proves the delete by counting every tenant-owned table back to zero, and
  those tables are RLS-FORCED — as `smp_app` every count reads nought whatever
  survived, so the assertion would pass because it could see nothing (§113.8).

## 4 · What it stores

Two facts beside `status`, in migration `007-a-client-can-be-archived.sql`:
`archived_at` and `archived_by` (the account's email, printed, with no foreign
key). **NULL is the honest default and both are cleared on the way back** —
they describe the state the row is IN, so a live client carrying *"archived 12
Sep by Islam"* is a value nobody chose (§50.6).

## 5 · What is proved

`checks/client-archive.py` — 52 assertions over 13 sections, 0 failures on both
copies of the page, falsified 11 / 3 / 3 red; `test-platform-rules.js` 60/0,
falsified 1 / 2 / 1, including §12, which asserts `lib/platform-rules.js` and
`smp-app/lib/platform-rules.cjs` are byte-identical — written because this
round's own drift went unnoticed until it was looked for.

**Not proved, and said**: the server half has never spoken to a database in
the session that built it. The page, its requests and the rules are proved;
one real round trip through Postgres and one real cascade are not.

## 6 · Recorded, not done

The archived card says when and by whom and carries no reason; an archived
client's own people are told nothing, because nothing in this platform reaches
out to them; and the frozen `api/platform.js` learns neither action — it has
been unreachable since the cutover put Next in front of it (§317.8), which is
§322's own precedent.
