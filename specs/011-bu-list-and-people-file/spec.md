# 011 · The BU list, and the register as a file

**Version:** v3.21 · **Decisions:** §54, §57, §58 · **Status:** built and verified

> *Renamed in §58: what this spec calls **Official BU** was called **Main BU** until
> v3.21. And since §57 one name holds SEVERAL units or functions, not one.*

Islam brought one row of Raya's employee data, the official list of ten BUs,
and four asks: map the main BU onto what the platform calls a BU, give the
People register a download-and-upload template, put the roles in the template
as a dropdown, and rename *Standing* to *Status*.

---

## 1 · The problem, measured rather than assumed

The sample row's `BU` is **Distribution**. The platform holds no such unit.
Checked against the tenant, six of the ten official names do not resolve:

| Official BU | What the platform holds |
|---|---|
| Distribution | a **company** |
| Finance | supporting **function** |
| IT | a **unit** *and* a **function** |
| Logistics | **unit** |
| Maintenance | — |
| Marketing | supporting **function** |
| Mazaya | — |
| Retail | the unit **Retail Stores** |
| Risk | — |
| Support Function | — |

An employee file therefore cannot be read against the platform's own list, and
naming a unit on each of five hundred rows would be one fact typed five hundred
times.

---

## 2 · What is settled

1. **A stored BU list**, on its own Setup page under *Who*, sharing `c_people`.
2. **The register shows Official BU beside BU.** *Belongs to* → **BU**, *Standing*
   → **Status**.
3. **One workbook**, download and upload, on the People page, matched on
   **Emp ID**.
4. **A role in the file is held over the person's own BU** — one column, not
   two.

---

## 3 · The model

`GROUP.mainbus` — an ordered list of `{ name, at }`.

`at` is `null`, `"group"`, `"co:<company>"`, `"fn:<function>"`, or a unit key:
**the same vocabulary a role's `at` uses**, and the same one `roleWhereLabel()`
renders. That reuse is why a Official BU can point at a company without anything
new being invented — a company CEO is already attached that way (§23).

It lives on `GROUP`, so it lands in `org.extra`: no migration, the same free
ride figure sets took (§44).

A person gains `empId`, `email` and `mainbu`; `phone` already existed. All
three ride in the `people` row's `extra`: no migration.

### 3.1 Two questions, two columns

- **Official BU** — the client's word for the person's part of the business. Off
  the file, never interpreted.
- **BU** — what it points at here. This is `personAt(p)`, the attachment
  access has always been read from.

They can disagree — the list can be re-pointed, and a person can be moved by
hand. **Neither is reconciled silently**; the register marks it. A mapping that
moved thirty people the next time a row changed would be the worst kind of
helpful.

`personAt()` and `attachPersonAt()` are the one pair that answer "where does
this person sit". The register drew it inline before, reading `fn` then `unit`,
which was complete until a company could be the answer.

### 3.2 Pointing at nothing

A legitimate, stored answer. Risk employs people and carries no strategy: they
are on the register, they belong to Risk, and there is nothing for them to
open. A list demanding a target for every name would force a wrong one.

---

## 4 · The file

Two sheets. **Read me**, and **People** with eight columns:

`Emp ID · Name · Job title · Email · Mobile · Official BU · Role · Status`

plus a ninth, *Also holds*, written by the platform and ignored on the way back
— a person may hold three roles and the Role column holds one, so the rest is
shown rather than silently dropped.

**It downloads what is on the register now**, so it is the export as well as
the template.

### 4.1 Rules

- **Adds and amends. Never removes.** §22's contract turned round: a plan is
  authored by upload because a plan is one whole thing; a register arrives in
  batches from an HR system nobody here controls, so a file that replaced it
  would retire everybody it forgot to mention.
- **Matched on Emp ID.** It survives a name change and a mail domain change.
  A row with no employee number is **skipped with a notice** — the thirty-three
  people already in the tenant have none, and a template that downloads and
  cannot be uploaded back is §51.14 in a second file.
- **A blank cell means "nothing to say", never "clear it".**
- **`Status: Retired`** does exactly what the row's own menu does. Restoring
  gives no roles back by itself (§49.4) — the Role column is the answer.
- **An unknown Official BU is added to the list, unmapped**, rather than refused.
  It is how the ten names arrive; a fresh tenant's list is empty, and a locked
  dropdown would mean no first file could be read (§22).
- **A role the person already holds is not an ask.** The column gives a role;
  it never takes one and never moves one. Without this the platform refused its
  own export on 31 of 33 rows (§54.4).
- **Contributor is not offered.** It is not granted — it is what somebody
  attached to a unit and holding nothing else already is (§49.5).

### 4.2 Dropdowns

Role and Status are closed lists. **Official BU is a suggestion**, for the reason
in 4.1.

---

## 5 · Authorisation

`group.mainbus` is classified **setup** in `lib/authorize.js`, and named rather
than falling into the unknown bucket. Not a soft classification: a row's target
decides where everyone carrying that name is attached the next time a file
lands, so anybody who could re-point one could walk a department into a unit
whose plan they wanted read.

Changes to `people` were already `setup` (`TOP_SETUP`), so the three new fields
are guarded the day they are added.

---

## 6 · What this deliberately does not do

- **It does not choose the mappings.** The demo ships the ten names and no
  targets (A4). IT is the one that needs a decision: a unit and a function
  share the name.
- **It does not move a role.** See 4.1.
- **It does not make email the sign-in name.** The username is still a key
  minted from the person's name (§35). That is its own decision.
- **It does not put Raya's departments in a client's database.** Migration 004
  strips `mainbus` from `org.extra` after the seed, beside `sets`, `claims` and
  `naming` — §45.3's fault avoided rather than repeated.

---

## 7 · Verified

- `test-authorize.js` — 131 passed, 0 failed. Five new: a unit head and a
  custodian cannot point or re-point a BU row, the SMO can, and the change
  classifies as `setup`.
- `qa.py` — every page as all 31 viewers, no console errors. New people-file
  round trip: 33 rows, **fixed point PASS**, one edited cell → exactly one
  changed row, and the sample employee in an unknown department → *added*, with
  the department offered to the BU list.
- Contrast sweep — 53 failing runs before, 53 after. The new pages add none.
- `test-roundtrip.js` against Postgres 16 — clean slate, deep-equal and fixed
  point all PASS with the BU list in the seed. A fresh deployment's `org` row
  carries no `mainbus`.
- End to end, signed in, against the API — the BU list and a seeded person
  save, persist and read back; `change_log` records *"the BU list"*. The real
  upload path was driven through the file input: the review named a duplicate
  employee number, skipped the person with none, offered the unknown
  department, and applied.

---

## 8 · Open

- **What each of the ten names points at** (D8). Ten dropdowns; only Islam can
  fill them.
- **The register is 1127px inside a 920px box** — it was 1061px before Official BU.
  It scrolls in place and the page does not; Job title or Contact can be
  switched off to recover it. Recorded rather than resolved, because trimming a
  column nobody asked to lose is not this version's decision.
- **A file can grant a role, including Super user.** Authorised as Setup like
  everything else here, and worth knowing before a file arrives from somebody
  else's laptop.

---

## Addendum — §65 (2026-08-24)

The people workbook carries a second place column, **Unit**, beside Official BU.

**Why it was missing.** §54 put the client's own name for a part of the business
in the file, and §56/§57 then made the place it opens reachable two other ways —
the Official BU list mapping it, or the person declaring it at sign-in. Neither
helps somebody who already knows where people sit and wants to upload it.

**The two columns, and how they settle.** Fill **Unit** and it decides. Leave it
and the **Official BU** decides, where that name points at exactly one place.
Leave both and the person stays where they are. Blank has meant "nothing to say"
in every cell of this file since it existed; the precedence needed no new rule.

**Vocabulary.** `roleWhereLabel()`'s — "the group", "Mobile", "Merchandising
(function)", "Distribution" — the same words the register's own cell and the
Official BU list's chips show. The `(function)` suffix disambiguates a tenant
with a unit and a function of the same name.

**Softness runs opposite ways, deliberately.** An unknown **Official BU** is
added to the list unmapped, because that is how the client's names arrive at
all. An unknown **Unit** is refused: a unit exists here or it does not, and
typing one cannot create it.

**Naming.** The header is *Unit*, not *BU* — Islam, because the column covers
business units, supporting functions and companies. The stored key stays `bu`,
and the reader still accepts the old "BU" header.
