# 008 · Figure sets — who is responsible for which numbers

**Status:** proposed. Written from Islam's own account of the concept, for him
to read before any code.
**Supersedes** the team+person shape built in §16.7 on 2026-08-21 (nothing is
deployed with it, so nothing migrates).
**Reverses** §16.7's *"Disagreement is settled off the platform. No challenge
workflow, no arbitration screen"* — see §8.

---

## 1 · The concept, in Islam's words

> *"There is someone who can be responsible of a set of numbers. This person
> can see a full list like we created with all the units in place so he can
> tick what he is responsible of."*

Many figures are not the business unit's number. Revenue and margin exist in
Finance before a unit is asked for them, and asking the unit to type them means
the same number is entered ten times — and can be wrong ten times, because the
person typing is not the person who knows it.

**The unit of ownership is a SET, not a person and not a department.** A set is
named, it has an owner, and it holds a list of figures drawn from any unit. The
first one is *Financial Figures*. There will be others.

Naming the set is what makes several of these workable. "Figure custodian 1, 2,
3" says nothing; *Financial Figures* and *Market Figures* say everything. **The
role therefore needs no name of its own** — a person is the owner of a set, and
that is enough.

---

## 2 · What exists, and where it is stored

**A set** — a name, and **up to two owners** ("2 max for now").

**An assignment, on the figure itself** — the person responsible for entering
it, and the set it came from if it came from one:

    measure.src = { set: "<set id>", by: "<person key>" }   ← claimed in a set
    measure.src = {                  by: "<person key>" }   ← named by the unit

Membership lives on the FIGURE rather than as a list inside the set. That is
what makes "one figure, one set" an invariant that cannot be violated rather
than a rule that has to be checked — and it is why a conflict can be detected
at the moment of the tick instead of found later.

---

## 3 · The two ways a figure gets an owner

**A · The set owner ticks.** They open their set and see every figure in the
group, unit by unit, and tick what belongs to it. This is the page that already
exists; it moves from the SMO to the set's owner.

**B · The unit's strategy custodian names people, figure by figure.** *"The
custodian doesn't get a ticking page — he gets all his directions and targets
and a searchable dropdown in front of each number so he can set who can input
them."* It is their own plan as they already see it, with a name against each
number. No set is involved.

**B is BUILT BUT HIDDEN** at Islam's direction — *"keep the option hidden
somewhere in the setup maybe until later"* — so one way of assigning is watched
in practice before the second is turned on.

---

## 4 · One figure, one owner. First claim wins.

There is no precedence rule between A and B, and deliberately so: **whoever
claimed it first holds it**, whether that was a set owner or a unit custodian.
A rule that ranked them would need explaining every time it applied.

Attempting to claim a figure somebody already holds does not fail silently. The
person is told **who holds it**, and is offered **Request the claim**.

---

## 5 · Claim requests

A request records the figure, who asked, and when. **The SMO answers it** —
not the current holder. Two reasons that is right: the holder has an interest in
the answer, and the SMO is the only person who can see both sides of the
argument.

Requests are listed for the SMO on the **Reporting cycle** page, beside the
board that already says who owes what. Approving it moves the figure; declining
it leaves it and closes the request.

---

## 6 · What the unit sees

**"Set by Finance"** — the FUNCTION of the person assigned to that figure, read
off the person, not off the set. Islam: *"it reads of the assigned person on
that measure either from the sets or from the custodian setup."*

The figure is shown, not typed, and the unit does not enter it.

**One stated assumption, for correction rather than a question:** a person with
no supporting function — the "Finance SMO custodian" who sits with the office —
would render as *Set by —*. Where the person has no function, the page will
show the **set's name** instead (*Set by Financial Figures*), and where there is
neither, the person's own name. It never shows a blank.

---

## 7 · The cycle

The person responsible **gets a scoring page with the figures they report** —
every figure assigned to them, across every unit, in one place. This is the
page that already exists; it now serves both origins in §3.

Unchanged from §16.7, and still right:

- **The unit writes the note, always.** The number is the set's; the
  performance is the unit's.
- **An assigned figure still counts toward the unit's total**, so a unit cannot
  submit around a missing number. The unit's page names what is outstanding and
  who owes it, so the unit chases too.
- **The business unit's strategy custodian submits the whole thing**, even
  having entered none of it.

---

## 8 · The decision this reverses, and why

§16.7 settled: *"Disagreement is settled off the platform. No challenge
workflow, no arbitration screen. The platform records one number and who is
master of it; the conversation about whether it is right belongs between the
two teams."*

That still holds for **whether a number is right**. What has changed is
**whether somebody may claim it** — and there the old decision assumed the SMO
was the only person assigning. Once two people can claim, a refusal with no
route forward is a dead end, and the platform is the only place that knows the
claim was refused. Recorded as a reversal with its reasoning, not overwritten.

---

## 9 · What needs deciding when the build reaches it

- **Two owners on one set:** may either of them tick and enter, or is one the
  owner and the other a stand-in? The spec assumes either.
- **Whom may a unit custodian name** — anyone the platform knows, or only
  people attached to their unit? The spec assumes anyone, matching the set
  owner's picker.
- **Does naming somebody give them sight of that unit's other figures?** No —
  they see the figure they were named on and nothing else. Stated so it is a
  decision rather than a side effect.

---

## 10 · Build order

1. **Sets**, and the set owner's ticking page (A).
2. **Claims** — refusal, request, the SMO's list.
3. **The unit custodian's dropdown** (B), hidden.

One at a time, because the second way of assigning should not be turned on
before the first has been watched working.

---

## 11 · How it will be verified

- The server refuses a figure claimed by somebody else — the same way it
  refuses everything else, from the STORED state (§42).
- Every role driven in a real browser, not only in tests: the fault that the
  first version of this shipped with was invisible to 77 passing tests and
  obvious on the page (§42.5).
- Round trip, clean slate, fixed point; contrast across every page and state;
  QA's 31 viewers; byte-identical rebuild.
