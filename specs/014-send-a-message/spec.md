# 014 · The composer stays one screen

**Version:** v3.25 (built) · **Decisions:** §95 · **Status:** answered; built
**Constitution:** checked against v1.1.0.

Islam: *"the send message needs a reform for a better user experience. evaluate
the page and come back to me with your proposal and mockup of how this page
should be interacted with what's missing and the page design and flow."*

Mockup published, signed off (*"ok implement your mock up"*), and confirmed for
build (*"send messge rework let's build it"*).

---

## 1 · What was actually wrong

The page had **exactly one part whose size was not fixed, and everything else
was below it.**

Every resolved recipient rendered as a chip. On this tenant a group-wide send
comes to seventy-six people, which put roughly nine hundred pixels of names
between the message and the button that sends it — and below *that* sat the
drafts and the record of everything ever sent, each loading lazily. Add a unit
to the business, and the Send button moves further away.

Everything else on the page was already correct. The resolver is right on both
sides (§74.2), the criteria add up rather than narrow (§75), the three "nobody"
answers are distinguished (§75.3), and the per-recipient record exists and can
be read (§93.15). This is a layout problem with a safety problem inside it.

---

## 2 · What is built

| | Before | Now |
|---|---|---|
| Audience | a chip per recipient, unbounded | counts, the reason, *Show the names* |
| Skipped | a number in a list further down | **on the line, always** |
| Send | at the end of the scroll, labelled *Send* | a pinned bar, **Send to 76 people** |
| Confirmation | `confirm()` | the platform's modal, naming who is skipped |
| Before it goes | nothing | **Send me a copy** |
| Drafts / Sent | sections below Send | header dropdowns with counts |
| The button field | a top-level section | a row under the composer |

---

## 3 · The rules this had to obey

**The skipped count is never behind the disclosure.** It is the fault that
started the thread — three people silently missed (§87) — so it reads whether or
not anybody opens the names, and the names when opened put the skipped **first**:
"3 skipped" tells nobody which three, and each one is a different edit on a
different row.

**The count belongs on the control that acts.** The number that cannot be taken
back is on the button that takes it, not a scroll away in a summary.

**A test copy goes to the person SIGNED IN, never the person being viewed as.**
`viewer()` is the simulation (§45.1) and the SMO uses it constantly; a test that
followed it would put a real message in a real colleague's inbox, sent from a
screen the sender was only looking through. `SYNC.person()` is the session.

**The same message, the same builder.** The copy is built by `MAIL.html` from
the same fields, subject unprefixed — a preview of something else is not a
preview.

**Nothing here may repaint the composer.** The subject and body are typed
straight into the preview (§76.3), so the audience block redraws itself and the
page does not (§35, §71.2).

---

## 4 · What it cost to get right

**One control a partial repaint did not update (§95.7).** `paintAudience()`
writes the answer into the audience block and the header and deliberately does
not call `paint()`. Putting the count on the Send button made that button the
one control it had to update and did not — so it said *Send* for the entire life
of every message. The same replacement killed the *Show the names* handler,
which was bound in `wire()` and lived inside the element being replaced, **at
the only moment there is ever anything to disclose.**

**A header selector that stopped matching (§95.7).** The recipient count was
found by `.chip:last-of-type`, and `:last-of-type` counts **tags**; the two new
dropdown `<span>`s went after the chips in the same header, and the count sat on
"nobody chosen" while the page had resolved seventy-six. It carries
`data-audcount` now.

**Fixed layout does not hand a column the leftover (§95.5).** In a 600px panel a
118px "Last saved" came out at 243px and the draft Heading — the only thing
telling one draft from another — clipped to "Half-wri…". Every column gets an
explicit share adding to 100.

---

## 5 · Not built, deliberately

- **A schedule.** Nobody has asked for a message to go at a time.
- **A second confirmation for large audiences.** One dialog that names the count
  is the safeguard; a threshold above which it asks twice is a number nobody can
  defend.
- **`.editbtn:hover` at 4.34:1**, found while measuring this page and recorded
  as §16.17: one token pair governing every button in the platform, which is a
  palette decision rather than anything this page touched.
