# 033 · Reaching somebody who is not looking

**Status:** BACKFILL of built behaviour — nothing here is new, and nothing here
is a proposal.
**Decisions:** §225 · §231 (+.2 –.6) · §247 · §282.2 –.4 · §283 · §284 · §285
(+.2) · §286 (+.2) · §288.1
**Constitution:** checked against v1.2.0 — Principles VI (follow what the
platform already does), X (the server decides), and the standing rule that a
dependency must never be able to take down the feature it serves.
**Related:** spec 015 (talking to the Strategy Office — the chat itself),
spec 016 (the assistant), spec 032 (why a save used to freeze all of this).

---

## 0 · Why this document exists

Spec 015 specified the conversation. What it did not specify — because it did
not exist yet — is everything that happens **when the person is not on the
page**: a box from the operating system, an email chased half an hour later, a
queue in the office's own corner, and a picture pasted rather than attached.

That is nine decision sections, a **new external dependency**, a **signing key
minted into the database**, and a service worker. It is also the part of the
product with the most ways to fail silently — four links in a chain, each of
which fails invisibly by design — which is exactly why it needs one document
rather than nine.

**It changes nothing.** Where this and the product disagree, the product is
right and this file is the defect.

---

## 1 · Three switches, and all three must say yes (§225)

Islam asked for a browser notification *"for the SMO when someone replies, and
for the users when the SMO replies to them"*, wording **B** (who wrote, and the
first line), *"and the user can swithc off inside the platform as well"*, **per
device**.

| Switch | Whose | Where | Default |
|---|---|---|---|
| `chat.popup` | the company's | Setup › Inbox settings | **off** — only an explicit `true` turns it on |
| the bell | the person's | in the conversation panel | on, **per device** |
| the browser's permission | the operating system's | the browser | unasked |

**Three decisions by three people, and none stands in for another.** It is not
named `notify`, which is already the handover email (§87's twins, in a settings
object).

**The person's is per device and that is the truth, not a shortcut.** The
browser's permission is per device too, so a switch claiming to follow somebody
everywhere would read ON on the laptop and stay silent on the iPad. Stored in
`localStorage` **as an absence** (§50.6) — and **a throwing store reads as ON**,
which is the opposite of §107's tour: the failure that matters here is nagging
somebody who said no, and that needs the key present.

**Asked on a gesture only** — opening the panel, or pressing the bell on.
Nothing is shown where it is already on screen (panel open; the office reading
the queue), **the first answer of a session never announces**, and there is one
tag per side so a waiting question never replaces a reply.

---

## 2 · The browser stops asking; the server sends (§231)

§225 drew the box and it only ever appeared while the SMP tab was the one you
were looking at. Measured: **45 seconds in the background, zero requests and
zero boxes**, then both boxes at once on coming back — the one moment they are
worth nothing.

**The cause predates it.** §98.1 stops the chat's clock dead while
`document.hidden`, so the database can sleep rather than be kept awake by a tab
somebody left open on Friday. Right for a badge you see next time you look, and
exactly wrong for a notification, *whose whole job is to reach somebody who is
not looking.*

> **A feature can be correct in every line and still sit on a decision that
> makes it pointless.**

`lib/push.js` is the one place a notification leaves the platform, mirroring
`lib/mailer.js` deliberately: the only place the credential is read, nothing it
returns or throws contains it, and it knows nothing about who anybody is — it
takes a subscription and a payload. Who may be written to is the caller's,
resolved against the stored register (§74.2). `sw.js` receives.

### 2.1 · Why a dependency, when §72 refused one

§72 refused an SDK for the assistant and was right: talking to Gemini is one
POST. **Web push is not one POST.** RFC 8291 is an ECDH key agreement, an HKDF
and an AES-128-GCM record with padding; RFC 8292 is an ES256 JWT beside it. Each
is silently wrong in the same way — nothing arrives and nothing says why.

**The deciding fact is that this sandbox cannot reach a push service**, so
hand-rolled crypto could never be tested against the thing it has to satisfy.
`web-push` is the reference implementation of both RFCs; what is left to test is
our own plumbing, which is testable. **17 packages, stated rather than hidden.**

### 2.2 · The key pair is minted on first use, into the database

Environment wins where set (`VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`);
otherwise a pair is generated and written to `push_keys` (migration 038).
Without that, the feature is off on every deployment until an engineer pastes
two strings into Vercel.

**The cost is said**: a database dump now holds a key that could send a box to a
subscribed device — smaller than the password hashes already there, and stated
rather than discovered. The public half is handed to every browser that
subscribes, which is what it is for; **the private half never leaves the
module**. Minting races are harmless: `ON CONFLICT DO NOTHING`, and the row is
**read back** rather than assumed, because a pair that reached no device is
nothing.

### 2.3 · The subscription is the switch

There is no `on` column to disagree with it (§104.7, §50.6). It is written
against the **signed-in person, never a key from the body** (§185), and only an
**https** endpoint is accepted, because our own server fetches it (§71).

**One box, one source** (§53.5): on a subscribed device the page stands its own
box down, or one message draws two. **A 410 drops that device and a 500 drops
nothing**, and a notification never costs the message it is about.

---

## 3 · A dependency must not take down the feature it serves (§231.3)

Minutes after the §231 merge: *"the chat bubble disappeared!"*

`lib/push.js` required `web-push` at its **top level** and `api/chat.js`
requires `lib/push.js` at **its** top level — so anything stopping the library
loading stopped **the whole chat endpoint** loading. And §197 is explicit that
the corner is created hidden and revealed only by a *successful* answer, so a
500 matched no branch and the bubble was simply never drawn. Reproduced: with
the package moved aside the dev-server will not start.

**§104's rule, one module out**: no key, a refusal, a timeout and the switch off
all land on the chat as it worked before — and *"the package did not load"*
belongs on that list. **It degrades to no push, never to no conversation.**
Loaded inside a `try`, remembered so it is attempted once.

**Asserted as the SHAPE**: a top-level require is what cannot be caught, so its
*absence* is the assertion — a test that moved the package aside could only run
once.

---

## 4 · A refusal without its cause is why nothing converges (§282.2–.4)

Measured against a stand-in push service: a mismatched key (403), a dead
registration (400) and an oversized payload (413) **all returned `failed: 1`
and printed one sentence** — *"The push service would not take it."*

> **Four rounds of fixes converged on nothing because nothing ever named one
> thing.** §124 at the far end of the chain.

Now: the service's own words are carried back; the service is **named from the
endpoint's host alone** (Apple will not deliver until the platform is on the
home screen — a different errand from Chrome), and the rest of the endpoint is
the address of somebody's device and is not taken; and the diagnostic asks
**this browser** as well as the server, because a browser registered at one
address while the server sends to another reads as perfect health at both ends.

**A registration is bound to the key it was made with.** Accepting an existing
one without looking means that once the key changes the browser hands the old
one back **for ever** — bell on, device counted, every send refused, and nothing
able to notice. Compared and re-made now; **a browser that will not report its
key is left alone**, because churning on a guess is worse.

**And the first build of that stopped subscribing entirely** — `pushSync`
already had a `want`, a second `var want` in the same callback hoisted over it,
`if (!want)` read `undefined` and took the unsubscribe branch every time.
§56.7's collision, valid on both sides, past `node --check`, **found by the
check going red and not by reading it.**

### 4.1 · The bell has five states, and the fourth was a lie (§231.2, §231.5)

§225 read the person's switch alone, so a browser that had never been asked
showed **ON** with a hover promising a box that could not appear (§124), and the
only control switched OFF the thing that was not on (§61).

The fifth state came from Islam testing on a second account: *"the notifications
are not working despite I accepted it."* One console line settled it — his main
account answered REGISTERED, the test account's promise **never settled at
all**. `sw.js` was registered **from the gate only** (§26), which was sufficient
while the worker merely cached the shell: a browser that never completed a gate
load (fresh profile, private window, a session opening the platform directly)
has no registration, and `navigator.serviceWorker.ready` there **never
resolves**.

> **A hang is not a failure, which is why it was silent.** It does not reject,
> so no catch runs.

The platform registers the worker itself (harmless twice), the wait is **raced
against a clock**, and the bell gains an allowed-but-not-registered state that
says what happened and offers to try again rather than switching off what never
came on. **And the fix's first build repeated the fault**: `subscribe()`'s own
`.catch` set a flag and said nothing.

### 4.2 · "Is it working?" is a page, not an answer (§231.6)

Notifications have **four links and every one fails invisibly by design**.
*Test on this device* walks the chain in the panel that already holds *Test the
assistant*, drawn by that button's own renderer (§53.5), only while the switch
is on (§61). **A real send**, because an inspected chain is one nobody walked —
to the asker's own devices and nobody else's. It **stores nothing** (§35) and
**reads without repairing**, asserted — except that it re-registers this device
first, or a browser that allowed notifications and never registered is told
*none of your devices is registered* without the platform having tried.

---

## 5 · A reply nobody was ever told about (§283)

The platform decided whether to email **at the instant the office replied** —
*has this person had a page open in the last few minutes?* — and a **yes is a
prediction**, wrong in one direction: somebody reading two minutes ago who then
shuts their laptop counts as present, gets no email, and is **never told at
all**. §97.5 wrote the edge down when it built the rule and called a sweep a
later decision. This is that decision.

**Stop predicting, start looking.** A reply still **unread** after the office's
wait (30 minutes, Islam's number) is chased then. One row of the table moves:
away is still mailed at once, a read reply is still never mailed, and
present-and-never-came-back stops being silence.

- **The message is kept, not rebuilt** (§72.3: the browser builds the email and
  the server resolves the recipient, so a chase half an hour later has no
  browser to ask). The **same** email merely later, never a second kind that
  would drift. Written only when the send is deferred, and cleared the moment it
  goes or they read it.
- **`chaseDue()` rides ordinary requests**, which is what §43 already does with
  expired sign-in attempts, **once a minute per process** so §98's 14→5 is not
  given back, and it can never fail the request it rode in on.
- **The limitation is stated**: nobody touching the platform means nothing goes
  out until somebody does.
- **The address is resolved at send time** from the stored register (§74.2) —
  never kept, so a retired person is not written to.
- **The unread test is a fact, not a cancellation**: `t.seen_by_them IS NULL OR
  m.at > t.seen_by_them`, so somebody who came back and read it is not chased,
  decided by the state rather than by anybody remembering to cancel anything.

**And the check found a hole in the query itself** — it asked for `from_office`
only after review; harmless today, since only `reply` writes a kept message, and
*a query that relies on what cannot happen yet breaks silently the day it can.*

**And §105.6 bit twice in an hour**: two runs were measured against a dev-server
started **before** the file under test was written — once calling the fix
working with the falsified build on disk, once calling it broken with the good
one. **Compare the file's mtime with the server's start time; never trust the
order the commands were typed in.**

---

## 6 · The corner, after it stopped being only a corner

### 6.1 · It survives the walk (§284, reversing §100.4)

*"we need the chat to sustain the navigation so it's open while me navigating
across the different pages."* Measured: one press on a page tab closed it.

§100.4 minimised on any `pointerdown` outside the dock — Islam's own earlier
instruction — and **the two cannot both be true, because the platform is ONE
PAGE**: every destination, tab, section and card is a press "outside", so a rule
exempting navigation would exempt everything but the empty margins.

**Recorded as a reversal, not overwritten**: §100.4 was right for a panel you
dip into and leave, and stopped being right when the panel became somewhere you
work. The minus and Escape remain, and both are an act; nothing typed is lost
either way, because the panel is hidden rather than rebuilt.

### 6.2 · The office's corner carries the queue (§285)

*"the chat bubble of the SMO team shouldn't be something to be sent to the smo,
that is redundancy … it should be the chats of the other people sending the smo
the messages."* **Redundancy of an odd kind**: the corner is *your* conversation
with the office, and for the office that is a conversation with themselves.

Islam's decisions, all recorded: waiting only · no cap · all of the office ·
**the badge is the LENGTH of the list** (he first said messages; a badge reading
7 over 4 rows is what gets reported as a bug) · the one you have open never
vanishes under you (§113) · search reaches **all history** and shows the line
that matched.

**Nothing new is authorised or stored** — opening is the Inbox's `thread`,
replying its `reply`, so §283's chase, §231's box and §71's answered-by-the-act
come free. **It rides the poll that already exists** (§98) and never touches the
register (§282). **One composer, forked at the top**, and `replyPost()` is the
one email builder both screens call — the corner's first draft built a smaller
one, which would have emailed somebody differently depending on which screen the
office was looking at.

Prefixed `cq`, never `ch` — the Inbox owns `.chq*` (§65.9). **Two `var`
collisions in one change, both found by the check going red**: `firstLine` is a
server helper and threw inside the list builder, leaving a blank corner with
nothing on the console because the throw was in the poll's own callback; and
`var cfg` in `drawPanelChrome()` shadowed the module's, which is filled from the
server, so the panel wore the shipped promise over the office's own.

**§285.2 — one panel, whatever is in it.** Measured: **531 against 498, top edge
351 against 384** — the panel is anchored at the bottom, so what moved was the
top, 33px every time you switched. `.chatbody` held a flat `height:340px` and
the panel was the sum of its parts; **it is the other way round now** — the
panel holds the height, the body flexes with `min-height:0`, and anything added
to the chrome costs a row rather than moving the panel.

**§288.1 — a row says the register's name.** §187 did this for the Inbox's list
and the corner is the **third** builder onto the same rows: matching on the
short name (§93.8) and drawing the long one, with `chatPlaceOf()` one answer
both lists ask. Somebody the register no longer holds keeps their stored name
and is given **no** place (§35).

### 6.3 · The office starts a conversation (§247)

Until then the office could only ever **answer**: with nobody having written in
there was no way to reach them from the Inbox at all.

**It is a flag on the reply, not an action of its own** — leaving the waiting
list by the act (§71), the email chase (§97.5) and the box on their screen
(§231) are all written once in the reply path, and a second endpoint would be a
second copy of every one of them. What starting adds is that the conversation
may not exist yet.

**And the person must be one**: `ensureThread` mints a row for any string, so a
typo would leave a conversation with nobody in the queue for ever — checked
against the **stored, active** register (§74.2), a retired person refused because
they cannot sign in to read it. **One conversation per person survives** (§97):
starting one with somebody who has written in carries on into their thread, and
`person_key` being the primary key is what makes a second impossible.

### 6.4 · A picture is pasted, not only attached (§286)

*"allow in the chat to copy paste a picture rather than only attaching it."*
Somebody reporting a wrong number has just pressed the screen-grab key; making
them save the file and find it again is asking them to do the computer's job.

**It feeds `takePicture()` and adds nothing** — §50's whole intake (1600px, both
formats with the smaller kept, the failure said in words) holds because it is
the same door, and the office's reply box being the same box means §285's queue
gained it with no second listener.

- **Text still pastes as text**: only an image item is taken, and
  `preventDefault` fires only when one is found.
- **`items` first, then `files`** — a screenshot lands on `items` in every
  desktop browser and on `files` in Safari.
- **With pictures off it is refused in words** (§98.2): a paste that appears to
  work and then vanishes is worse than one that says no.
- Proved by dispatching a **real ClipboardEvent with a real PNG** — a probe
  calling `takePicture()` directly passes on a build where the listener was
  never wired (§96).

**§286.2 — what is attached is shown, not described.** *"the message is very
subtle I didn't notice that something was attached."* The whole confirmation was
one line of the page's quietest grey. Four drawn in the real composer; Islam
picked the strip above it — **the picture, a line naming it, and a way to take
it off**. The picture is the part a sentence cannot replace (*which* screenshot
is about to go), and it sits **above** the box so the thing under the cursor
never moves. **The thumbnail is the already-shrunk data** (§50): what is
previewed is what sends. The remove is wired on the **foot**, not the button —
the strip is rewritten every paint — and it clears the file input, or the same
file cannot be picked twice.

---

## 7 · Requirements, as things that can be checked

- **R1** All three switches must say yes before a box is drawn; each is asserted
  separately.
- **R2** No key, a refusal, a timeout, an unloadable library and the switch off
  all leave the chat working exactly as before.
- **R3** `lib/push.js` is required lazily; a top-level require is a defect.
- **R4** The private VAPID half never appears in a return value or an error.
- **R5** A refusal names the service and carries its words.
- **R6** A registration made with a superseded key is re-made, not accepted.
- **R7** A reply unread after the office's wait is emailed; a read one never is.
- **R8** The chase resolves the address at send time from the stored register.
- **R9** The corner survives navigation and does not draw the bubble under an
  open panel.
- **R10** A pasted image goes through the same intake as an attached one.

---

## 8 · Traceability

| Behaviour | Section | Check |
|---|---|---|
| Three switches, the row's placement | §225 | `checks/office-chat.py` |
| The server sends | §231 | `scripts/test-push.js` (a throwaway HTTPS server stands in front of the real service, so the encrypted body and the VAPID header are read **off the wire**) |
| The bell's five states | §231.2, §231.5 | `checks/office-chat.py` |
| The office starts one | §247 | `checks/send-message.py`, `office-inbox.py` |
| The chase | §283 | `scripts/test-chat.js` |
| The corner survives the walk | §284 | `checks/chat-corner.py` |
| The office's queue | §285, §288.1 | `checks/corner-queue.py` |
| Paste a picture | §286 | `checks/paste-picture.py` |

---

## 9 · Open, and recorded rather than done

- **"Browser closed" is true on a phone and partly true on a laptop** — the push
  service can only hand a message over while the browser runs somewhere. Stated
  in §231 rather than claimed away.
- **iOS still needs the platform on the home screen** before Apple will deliver.
- **The chase cannot fire on its own**: with no scheduler on Vercel it rides
  ordinary requests, so nobody touching the platform means nothing goes out
  until somebody does.
- **A same-second collision between a chase and a read** is not guarded; the
  worst case is one email somebody did not need.
