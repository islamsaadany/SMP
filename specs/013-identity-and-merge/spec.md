# 013 · Who a row is, and merging two rows that are one person

**Version:** v3.24 (built) · **Decisions:** §85 · **Status:** answered; built
**Constitution:** checked against v1.1.0.

Islam, sending a screenshot of the message composer: *"in the send message
functionality I got 3 people skipped but they have an email in the registry.
can you investigate this?"*

Then, on the fix: *"the platform should compare the upload vs the current and
notify the uploader with options to replace if there is totally different data
or merge in case of new data that were empty … and adding a new person of
course should conflict, but the name is not the challenge — the identifier
really would be the ID and the email."*

---

## 1 · What was actually wrong

Nothing in the resolver. **The three people were on the register twice.**

Each existed once from the employee file (an address, a long legal name) and
once typed into the role picker (a shorter spelling, no identifier at all). The
role sat on the typed row, so a message aimed at that role resolved to the copy
with no address and reported *"no address on the register"* — a true sentence
about a row nobody was looking at. The register's Name column shows the first
three words (§81.1), which is why the two rows read as one on screen.

Three ways to make a twin, all of them silent:

| door | matched on | what it produced |
|---|---|---|
| the register's Add row | nothing | a row with no ID and no email |
| the role picker's *add new* | nothing | the same, holding a role |
| the people upload | Emp ID only | a second row whenever the ID was blank or changed |

§81's duplicate flag could not see any of it: it matches on a value two rows
**share**, and these pairs shared nothing.

## 2 · The identity rule

**Emp ID, then email, and no third rung.** The name never matches anything.

- `personByIdentity(id, email)` is the one answer, and it reports **which rung**
  answered, because a review line saying "matched" tells nobody what to check.
- An address on two rows answers **nothing** — one person or none, the same rule
  the door keeps (§69.23) and §57 keeps for a Main BU holding several.
- A row with neither identifier is legal and is **marked**: it is the shape the
  next upload cannot match.

## 3 · Adding somebody

Both hand-typed doors carry an Emp ID and an Email field.

- An identifier already on the register **stops** the add, names who it is, and
  offers their row. Only a second, explicitly different press gets past it.
- A matching **name** stops nothing — it is a remark. Two people can share one.
- Neither identifier is required. The row is added and marked instead.
- The role picker, when nothing matches exactly, shows the rows whose **chain of
  names runs through** what was typed — *"is it one of these?"* — before
  offering to create anybody. Its search also reads the ID and the address.

## 4 · The upload

Matched on the ladder. Two conflicts are **set aside, never guessed**:

- an Emp ID and an email pointing at **two different people**
- an email already here arriving under an Emp ID the register has **never seen**

Each names both readings with the people they mean, and offers: *this is A* ·
*this is B* · *somebody new* · *leave it*. **Nothing applies while one is
unanswered.** An address on two register rows is a problem, not a question — the
answer is to merge those rows first.

Every field the file would change is an **offer**: recorded value beside
proposed one, applied only where ticked, with *take everything from the file* as
one press. The register wins by default, because a people file is usually an
export somebody edited two cells of. A blank cell still means *nothing to say*.

## 5 · Merging two rows

A section under the register, opened from the row's ⋮ menu.

- **The survivor is chosen**, defaulting to the row that can be matched later.
  The row that goes takes its sign-in name, password and sessions with it.
- Every pointer moves: seats, unit and function roles, figure sets, named
  figures, open claims, and the place they sit if the survivor has none.
- Blanks are filled without asking; genuine disagreements are picked.
- The last act is `deletePerson()`, so **anything the merge forgot to hand over
  refuses the delete and fails the merge loudly**.

## 6 · What it does not do

Nothing merges itself. Every join is a person answering a question the platform
could not — which reading a file row meant, which row survives, which value is
right. The platform notices, names both sides, and refuses to guess.

## 7 · Checks

- `src/checks/identity-merge.py` — driven through the **screen**: the add row
  refuses and then relents, the pair is marked, the merge runs from the ⋮ menu,
  the role lands on the row with an address, and the picker suggests before it
  creates.
- The §85 block in `src/qa.py` — driven through the **rules**: the ladder, both
  conflicts, the block until answered, and the name that must never stop an add.
- The people-file fixed point re-measured with every pick **taken**, or it would
  be measuring the defaults (§51.11).
