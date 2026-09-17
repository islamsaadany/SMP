# Extraction brief — ScopePlan, for the Portfolio port (spec 056)

For a session that can read **`aleymahmoud-ff/clientplus`**. This session
cannot: an `add_repo` across owners is refused, and the GitHub tools are scoped
to `islamsaadany/smp`.

**Written to produce ARTEFACTS, not a description.** The first handover brief
was prose, so every claim it made is marked in spec 056 §7 as *the brief's,
unverified here* — and a spec built on unverified claims is a spec that has to
be redone the first time one of them turns out to be wrong. What is asked for
below is code, schema and counts, so each claim can be checked rather than
believed.

---

## What is already decided — so no effort is spent on it

Read this first; it removes about a third of the work.

1. **The `(client, agreement, scope)` triple is gone.** A project belongs to a
   client, full stop. `domains`, `subdomains`, `agreements`, `scopes` and
   whatever joins them are **not** being ported. Do not extract their logic —
   but **do** say, in one line each, what facts they held that the plan tree
   reads (a budget? a date? a lead?), because those may come back as fields on
   the project.
2. **Six roles become three** — Lead, Contributor, Viewer. **Extract the role
   logic in full anyway**: that is precisely how the collapse gets checked. A
   branch that cannot be mapped onto one of the three is a finding, and it is
   worth more than agreement.
3. **Files are real uploads**, not links.
4. **The three tree words are renameable per client.**
5. Nothing is being built yet. This is reading, not porting.

---

## What is wanted, in order of how much it decides

### A · The schema, verbatim

Every `CREATE TABLE` for the plan tree and everything hanging off it, **copied
exactly**, not summarised — column types, defaults, `NOT NULL`, every foreign
key with its `ON DELETE`, every index, every unique constraint, every enum or
`CHECK`. If it is a migration framework, the resolved shape of the table as it
stands today, plus where the migrations live.

Then, for each table, **one line: what a row IS**, in the words somebody using
the product would say.

*Why exact:* SMP is Postgres with row-level security forced on every
tenant-owned table; each of these becomes a table with a `tenant_id` and a
policy. A missing `ON DELETE` or a nullable that should not be is a data-loss
bug that arrives months later.

### B · The rules, as code

The handover named **nine rules** as the module's real value. For **each one**:

- the function, pasted, with its file and line numbers;
- what it reads and what it writes;
- where it is called from;
- **is it enforced on the server, on the screen, or both?**

The ones known to matter, and there may be more:

1. **Roll-up.** How a parent's percentage comes from its children — a plain
   count, a weighted average, weighted by duration, by effort? What a parent
   with no children reads. What an empty child does to it.
2. **Done versus Completed.** Who sets each, what else changes when it is set,
   and whether anything can be un-set.
3. **Dates.** Planned against actual. What happens when a child runs past its
   parent's end — refused, allowed, or does the parent move? Is there any
   working-day or calendar arithmetic?
4. **Dependencies** between activities, if any exist at all, and whether
   anything enforces them.
5. **The status values**, as the literal enumeration, and which transitions are
   allowed.
6–9. Whatever the remaining rules are.

### C · The six roles, at every point they are enforced

Not the list of names. **Every branch in the code that asks what role somebody
holds** — file, line, the condition, and what it guards. Server routes and
screen alike, and say which is which.

Then: **is a role held on the plan, on the scope, or on the client?** And can
one person hold different roles on two plans?

### D · Files

How `activity_files` is written and read. Is anything uploaded today, or is it
strictly a URL somebody types? Is there any delete at all — and if an activity
is deleted, what happens to its files? Any size or type limit, and where it is
enforced.

### E · Comments and tagging

How a comment is stored, how a tagged person is stored (a key? a name? free
text?), and how the tag is resolved back to a person. Whether a tag does
anything beyond being drawn.

### F · Notifications

**Is there any notification at all?** A bell, a feed, an email, a push, a
digest, an unread count — or nothing. If there is, what triggers it and where
it lands. If there is nothing, say so plainly: that is an answer, and an open
question in SMP is waiting on it.

### G · The Excel round-trip

The template builder and the reader, as code. What columns the sheet has, what
validation it carries, what the instruction sheet for the AI actually says
(paste it), and what the reader does with a row it cannot accept — refuse the
file, refuse the row, or write it anyway. Which library, and which version.

### H · Numbers, not impressions

- rows per table, on whatever real data is reachable;
- how many plans exist, and across how many clients;
- the largest plan: how many phases, work packages, activities;
- lines per file for the module's own files;
- the 113 TypeScript errors: are any inside these files?
- does anything test any of this?

### I · Traps

The four the handover named, confirmed or corrected against the code, plus
anything else that would bite somebody porting it. **A trap you confirm by
reading the code is worth ten you suspect.**

---

## How to answer

One markdown document. Code in fenced blocks with its file path above it. DDL
verbatim in its own section.

**Mark anything you could not verify.** *"I could not find where this is
enforced"* is a useful sentence; a confident guess is not. If the code
contradicts this brief, the code wins — say so, and quote it.
