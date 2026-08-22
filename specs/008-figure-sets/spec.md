# 008 · Figure sets — who is responsible for which numbers

**Status:** AGREED 2026-08-21, not yet built. Written from Islam's own account
of the concept and checked with him line by line; §6 and §9 carry his answers.
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

**A set** — a name, **a team**, **ONE owner**, and **who picks its figures**
(Islam, 2026-08-21):

    Financial Figures  ·  team Finance  ·  owner Hossam  ·  picked by the owner

The team is on the SET, not read off the person. Islam's reason for showing a
department at all decides this: the BU head needs to know **who to talk to**
when he is writing the note against a number he did not enter, and when he
looks at his entry page and finds a figure he cannot type. *"Set by Financial
Figures"* does not tell him that; *"Set by Finance"* does. And the person's own
department cannot be trusted to say it — the "Finance SMO custodian" sits with
the office rather than in Finance, which is the case that broke reading it off
the person.

It also survives the owner changing: hand *Financial Figures* to somebody else
and the unit still reads *Set by Finance*. Two sets may share a team.

**An assignment, on the figure itself:**

    measure.src = { set: "<set id>" }      ← claimed into a set
    measure.src = { by:  "<person key>" }  ← named by a unit custodian

Membership lives on the FIGURE rather than as a list inside the set. That is
what makes "one figure, one set" an invariant that cannot be violated rather
than a rule that has to be checked — and it is why a conflict can be detected
at the moment of the tick instead of found later.

**A set-claimed figure stores only the SET.** Who enters it is the set's owner,
read from the set — not copied onto every figure it holds. One owner per set is
what allows this, and it is worth having: handing *Financial Figures* to
somebody else becomes ONE edit rather than twenty-seven, and no figure can be
left pointing at the person who used to hold the set. Same pattern as a unit's
head pointer (§33): a role is read from the thing, never stored twice.

If two people genuinely need to split the work, that is **two sets** — which is
the more honest arrangement anyway, because each one's scope is then visible
instead of two people sharing an undivided pile.

---

## 2b · Who picks the figures — a SECURITY setting, not a convenience

Islam: *"some numbers are confidential for some people and they shouldn't see
all the group numbers, but for Finance everything is not confidential because
they see everything, so they are a special case."*

**A set owner who ticks from the full list has, by definition, read every
number in the group.** That is the whole mechanism of A below. For Finance it
costs nothing — they see the figures anyway. For anybody else it means somebody
whose entire job was entering three numbers can read the lot.

So each set carries a switch:

- **The SMO marks** — DEFAULT. The owner never sees the full list. They open
  their set and find only what they have been given.
- **The owner picks** — self-service. They browse every figure in the group and
  tick. For a team like Finance, from whom nothing is confidential.

**Safe by default, opened deliberately.** The exception is the one you switch
on, not the one you remember to switch off.

**It is enforced on the SERVER, not by hiding the page.** A set set to "SMO
marks" has its claims refused when they come from its owner. A switch that only
hides a control is decoration, and §42 exists because of exactly that.

**And there is no half-view to design.** "The owner picks" IS the grant of
sight over the whole group's figures — so where it is off, the picking page
does not exist for that owner at all.

## 3 · The two ways a figure gets an owner

**A · Somebody ticks from the full list** — the SMO by default, or the set's
owner where §2b's switch allows it. Every figure in the group, unit by unit,
ticked into the set. This is the page that already exists; who may open it is
now a property of the set.

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

**"Set by Finance"** — the SET's team. Always, with no fallback and nothing
depending on where the assigned person happens to sit.

The figure is shown, not typed, and the unit does not enter it.

Two places this is what the BU head is actually reading, and both are why the
department appears at all rather than the set's name:

- **the note.** He writes the explanation for a number he did not enter, so he
  has to know whose it is.
- **his entry page.** He finds a figure he cannot type, and needs to know who
  to chase rather than that something is broken.

A figure named by a unit custodian rather than claimed into a set has no team,
and reads as the person: *Entered by Nadia*. That is right — it is the unit's
own arrangement, and the person IS the answer to "who do I ask".

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

**ANSWERED 2026-08-21:**

- **A unit custodian may name anyone the platform knows** — not only people
  attached to their unit. Same reach as the set owner's picker.
- **Naming somebody gives them that FIGURE and nothing else.** Not the unit's
  other measures, not its plan, not its score. They sign in during the cycle
  and find one page listing every figure they owe, wherever those figures live.

**Nothing is left assumed.** The two-owner question is gone (a set has one
owner; two people splitting the work is two sets), and who may pick a set's
figures is now a stored setting rather than a convention.

---

## 10 · Build order

1. **Sets** — the Setup page (name, team, owner, who picks), and the ticking
   page (A) with §2b's switch decided on the server.
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
