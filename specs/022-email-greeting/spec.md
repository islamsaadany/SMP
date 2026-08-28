# 022 · The email greets its receiver

**Version:** v3.54 (built) · **Decisions:** §142 · **Status:** answered; built
**Constitution:** checked against v1.1.0.

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

**The composer gains ONE LINE: a label, the word box while it is on, and the
switch.** Islam, on the two-line first draft — *"the design of the setting is
poor. It should be one line you dont need 2 lines .. and no explanations
needed in the setting itself it's clear."* **He is right twice.** A label
reading *Open with a greeting* beside a box holding the word *Dear* has
already said everything the sentence under it said — §127's ruling on the chat
settings, reached again from the other direction. And the height was not the
only cost: two lines under the message made the greeting read as a **bigger
decision than the button row beneath it**, which is one line; they carry the
same weight now.

The row is `.imp-row` + `.cfg-lab` + `.minisw` — the platform's own Off/On
switch row, the one the naming setting wears (§44), never a control invented
for this. **The word box sits to the LEFT of the switch**, so the switch is
last in the row whether the greeting is on or off: a control that shifts under
the press that produced it is §41.8's fault.

The box starts at "Dear"; blanking it falls back to "Dear" — a switch that is
on always greets, and the way to send a plain message is to turn it off, not
to hollow the greeting out. The greeting renders as the first paragraph of the
body, in the body's own style: *Dear Ahmed,* then the message.

**The builder emits the greeting inside a MARKED REGION.** `MAIL.html` gains an
optional `greeting` field — still ONE builder (§72.3), on every surface — and
writes the greeting paragraph between `GREET_OPEN` and `GREET_CLOSE` with
`GREET_NAME` where the name goes. All three live in `lib/rules.js`, because
both sides need the same three strings and a second copy of a contract drifts
in silence.

**Delimited, not merely tokenised**, and it buys two things: nothing outside
the region is ever touched, so a sender who types the token into their own
message cannot have it substituted; and an empty name removes **the whole
paragraph** rather than leaving "Dear ,".

**An absent name and an empty one are different answers** (§142.6). Absent
means *the server will fill this*; present-and-empty means *the caller looked
and there is none*, and writes no greeting at all — which is what *Send me a
copy* hands over when the signed-in sender's own row has no usable name, on
the one path no server ever touches.

Then each side fills it with the name it is authoritative for:

- **The server**, on send: for each recipient, `Rules.greetFill()` with that
  person's first name, HTML-escaped, read from the stored register (the same
  rows the audience was resolved from) — never from anything the browser
  posted.
- **The browser**, for the preview and for *Send me a copy*: the preview shows
  the greeting with a sample name — the first resolved recipient's — under
  **six words**: *Everyone sees their own name here.* That line survives the
  no-explanations rule because it is not in the setting and is **the one thing
  the screen cannot say by showing** — without it a draft opened by somebody
  else reads as *everybody gets "Dear Ahmed"*. It sits OUTSIDE the email: a
  badge inside would be a line nobody receives, and the preview's whole value
  is that it is the real output (§72.3). The greeting line is NOT editable,
  unlike the title and body around it, because it is the one part that differs
  in every inbox. The copy to self is substituted in the browser with the
  **signed-in** sender's own first name (`SYNC.person()`, never `viewer()` —
  §95's rule, unchanged).

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

## 4b · What building it found

**`SYNC.mailSend()` names every field it forwards**, so `greet` was silently
absent from the posted body. The emails would have been personalised perfectly
— the fill rides in the html's region — and `messages.greet` would have been
NULL on every row: **the record would have said no message ever greeted
anybody.** Found by asking what the page POSTS, not by reading it (§142.5).

**`lib/mailer.js`'s Resend address became `SMP_RESEND_ENDPOINT`**, defaulting
to the real one — §100.3's rule, so a check can MODEL the provider rather than
branch around it. Without it there is no way to know what each recipient was
actually sent, which is the whole of what this spec claims.

## 5 · What must be proved before this is called built

All of it, and it is proved. Two halves, because the claim has two halves.

**`scripts/test-email-greeting.js` — 37 passed.** Stands in front of the
provider (`SMP_RESEND_ENDPOINT`) and reads what each recipient was actually
sent, against a real Postgres. Four shapes of name are injected because the
demo register may not hold them forever: ordinary, compound, a typed short
name, and a row whose name yields nothing. The assertion that separates this
from a build greeting everybody with the first recipient's name is that **each
message carries nobody else's**. Off: every payload identical, `greet` NULL. A
token typed into the body is left alone. A draft round-trips, including OFF
over a draft saved ON (back to NULL, §50.6).

**`src/checks/email-greeting.py` — 38 passed.** The screen and the seam, over
HTTP (§94.11): one line with no prose in both states, the switch not moving,
every control PRESSED (§93.4), and what the page posts carrying the region
**and naming nobody**.

**Both were watched to fail first** (§94.5) — 8 / 2 / 2 on the server, 2 / 3 on
the browser. **Two of the browser check's own first-run failures were the
check**: it clustered the row's controls by their `top`, and three controls of
three heights on one line have three different tops (§122.4, already written
down once); and it asserted the row's pixel height was unchanged when the word
box appears, which is false and was never the point.

**Regression:** `qa.py` green, no console errors; `send-message.py` all green;
`test-authorize.js` 212/0; `test-mail-contrast.js` 16/0; round trip and clean
parity PASS **on virgin databases** (§113.7), with migration 027 applied.

## 6 · The mockup, and the one correction it drew

Rule 1c: the composer gains a visible row, so it was drawn before `src/` was
touched. `src/checks/greeting-mockup.py` serves the BUILT file with the same
stub `checks/send-message.py` uses (the whole page is the empty state over
`file://`, §94.11), walks to Setup › Send a message, and injects the proposal
into the live pane in both themes — so both sides of every picture are the
same build (§41.9). Published at
`design-mockups/email-greeting/2026-08-27_email-greeting.html`.

**Revision 1 → 2 is Islam's, and it is recorded rather than overwritten**: the
row lost its second line and its prose (see §3). Two smaller things the
drawing caught that reading could not:

- The word box first took **half the pane**, because `.ctarow` is a
  two-column grid — a field that wide reads as one expecting a sentence.
- The mockup PAGE first set the light and dark twins side by side, which left
  the row being reviewed **44px tall and unreadable**. *A mockup whose evidence
  cannot be read is a mockup that has not been shown.*
