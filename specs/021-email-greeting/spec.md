# 021 · The email greets its receiver

**Version:** not built · **Decisions:** to be numbered at build · **Status:** agreed; not built
**Constitution:** to be checked at build.

Islam: *"For the emails sent can we make an option while sending the email to
customize the email by the first name of the receiver like starting the email
with Dear Ahmed and then the body comes after — it's a turn on and off
option."*

Settled by question-and-answer on 2026-08-27, before anything was drawn or
built. Five decisions, all Islam's, recorded in §2.

---

## 1 · What is true today, and why this is cheap

**Every recipient already receives their own individual email.** `/api/mail`'s
send loop posts one message per person to Resend (`to: [r.email]`, batched),
never one message with many addresses — that shape was chosen in §72/§74 so a
send could be recorded per recipient. Personalisation therefore changes *what
each of those emails says*, not *how many there are* or who can see whom.

What it does change is a rule worth naming: today the **browser builds one
HTML** (`MAIL.html`, §72.3 — the preview IS the builder's output) and the
server sends that identical HTML to everyone. A greeting that names the
receiver means the HTML can no longer be identical, and the substitution must
happen **on the server**, because the server is the side that resolves who the
recipients actually are (§74.2 — the browser sends content, never a recipient
list).

---

## 2 · The decisions

| Question | Islam's answer |
|---|---|
| Which name after the greeting word | **The first name, kept whole when it is compound** — "Dear Ahmed"; "Dear Abd El Moniem", never "Dear Abd". (Asked twice: the first answer read two ways, and the register's own *Abd El Moniem Mohamed…* row was the case that separated them.) |
| The switch's default | **Off.** A message sends exactly as it does today unless the sender turns the greeting on for that message. |
| The greeting word | **Editable per message** — a small text box beside the switch, starting at "Dear", so "Hi", "Dear Mr." and the like are the sender's choice per send. |
| Scope | **Send a message only**, including *Send me a copy*. The chat's emails, password mail and everything else the platform sends are untouched. |
| Where it lives | On the composer, with the CTA fields — a per-message choice, never a Setup page (it is a property of one message, not of the tenant). |

---

## 3 · How it works

**The first name is read through the register's own name rules.**
`SMPRules.nameWords(p.known || p.name, 1)` — one name, with the particle list
(`Abd`, `El`, `Abou`, `bin`, `van`…) keeping a compound first name whole,
exactly as the register already does for its short-name guess (§93.8). A typed
short Name (`known`) wins over the legal name, because a typed value is the
SMO's correction and always wins (§93.8). **No new name rule is written**; a
second spelling of "what is somebody's first name" is how §53.5's drift starts.

**The composer gains one row: a switch and, while it is on, the word box.**
The box starts at "Dear"; blanking it falls back to "Dear" — a switch that is
on always greets, and the way to send a plain message is to turn it off, not
to hollow the greeting out. The greeting renders as the first paragraph of the
body, in the body's own style: *Dear Ahmed,* then the message.

**The builder emits the greeting with a token where the name goes.**
`MAIL.html` gains an optional `greeting` field and renders the greeting
paragraph with a placeholder token instead of a name — still ONE builder
(§72.3), on every surface. Then each side fills the token with the name it is
authoritative for:

- **The server**, on send: for each recipient, replace the **first occurrence**
  of the token with that person's first name, HTML-escaped, read from the
  stored register (the same rows the audience was resolved from). First
  occurrence only, because the greeting is the first thing in the message —
  so a sender who types the token's literal text in their body cannot make
  the substitution land twice.
- **The browser**, for the preview and for *Send me a copy*: the preview shows
  the greeting with a sample name — the first resolved recipient's — and a
  quiet line saying *each person gets their own name*; the greeting line is
  NOT editable, unlike the title and body around it, because it is the one
  part of the preview that is different in every inbox. The copy to self is
  substituted in the browser with the **signed-in** sender's own first name
  (`SYNC.person()`, never `viewer()` — §95's rule, unchanged).

**A first name that comes out empty drops the greeting line for that person.**
Never "Dear ,". A register row with a blank or unreadable name gets the
message as it sends today; the send is not refused and the record does not
mark it — a greeting is a courtesy, not a delivery condition.

**Off is byte-identical to today.** With the switch off, `MAIL.html` receives
no `greeting`, emits no token, and the server substitutes nothing — the same
HTML to every recipient, exactly the current behaviour. The absent key is the
off state (§50.6): nothing stores `false`.

**Drafts and the record remember it.** One nullable text column on
`message_drafts` and on `messages` (migration 027): NULL is off, a value is
the greeting word. One column, not two — a switch and a word that can disagree
("on, but no word") is a state nothing above allows. A draft reopens with the
switch and word as they were saved; the Sent record can say a message greeted
its receivers.

---

## 4 · What this deliberately does not do

- **No other email changes.** The chat's away/reply mail, the assistant, and
  password issuance keep their current shapes — asked and answered (§2).
- **No titles, no honorifics.** "Dear Mr. ‹surname›" logic needs a gender or a
  title the register does not hold; the word box lets a sender type "Dear Mr."
  for an audience where that is right, and that is the whole provision.
- **No per-person overrides.** One greeting word per message; the name is the
  register's. Correcting how somebody is greeted is correcting their Name on
  the register — one door (§93.8).
- **No tenant setting.** Nothing lands in `GROUP.comms` or Setup › Email; the
  choice is the message's.

---

## 5 · What must be proved before this is called built

- **The check makes the state and asks both ends** (§94.2): with the switch on,
  the stub's captured Resend payloads show each recipient's OWN first name and
  nobody else's; with it off, every payload is byte-identical to every other
  and holds no token. The compound-name case (*Abd El Moniem…*) and the
  blank-name case (greeting line absent, not "Dear ,") are both injected,
  because the demo register may not hold either forever.
- **The preview still is the builder's output** (§72.3) — asserted through the
  real `MAIL.html`, not a copy.
- **A draft round-trips the switch and the word**, including OFF over a draft
  saved ON (the column back to NULL, §50.6).
- **`checks/send-message.py` is grepped for selectors the new row moves**
  before its next green run is trusted (§51.11).

## 6 · Before building: the mockup

The composer gains a visible row and the preview gains a line, so rule 1c
applies in full: a static HTML mockup of the composer with the switch on and
off, and of the preview showing the sample greeting, published as an artifact
and signed off — before `src/` is touched.
