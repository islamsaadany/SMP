# 007 · The security floor

**Status:** BUILT (2026-08-21). The five items left open by spec 006, plus
session hygiene.

Spec 006 closed the only hole a real user could walk through. These are the
ones an attacker walks through, and the floor everything else stands on.

---

## 1 · The `1234` SMO

**The issue.** A four-character password on a super user, on a public URL,
that never expired and never had to be changed.

**Built.** Not removed — **retired**. The bootstrap still creates `smo` / `1234`
on an empty database, because a deployment with no way in is not a
deployment; it now carries `must_change`, so the first sign-in leads straight
to the change screen. For a tenant already running, a one-off step checks
whether the stored hash still verifies against `1234` and sets `must_change`
only if it does.

**Why it is a JS step and not a `.sql` file.** Migration 003 wrote the hash
with its own salt, so "is this still the shipped password?" cannot be asked in
SQL. It runs once, recorded in the same `_sql_migrations` registry, and it
sets a flag rather than clearing a password — **this must not be able to lock
anybody out of their own deployment**. Somebody who has already chosen a real
password is not nagged, because `verifyPassword` fails and nothing happens.

**This reverses §19.4**, which was right for a prototype nobody's data was in
and wrong for a product a client's strategy is in. The convenience it bought
was one screen, once.

---

## 2 · A temporary password bought the whole tenant

**The issue.** The gate sent people with a temporary password to the change
screen; the server did not care whether they went. So an issued password
opened a full thirty-day session and every figure in the tenant.

**Built.** `/api/state` refuses both GET and POST while `must_change` is set,
and says so with a flag the platform reads to send them back to the door.

Identity is checked before authorisation, deliberately: a person who has not
finished signing in is not somebody whose roles are worth consulting.

---

## 3 · Nothing slowed a guess

**The issue.** Passwords could be guessed as fast as the network allowed, and
person keys are short and guessable (`smo`, `ceo`), so the username half of
each guess was free.

**Built.** `login_attempts` (migration 012) records failures only. Two
thresholds in a rolling 15-minute window: **8 per person key** — somebody
working a password list against one person — and **25 per address** — somebody
working a list of PEOPLE instead. A successful sign-in clears that key's
failures. Rows older than the window are pruned on every sign-in, because
there is no scheduler here.

**Checked BEFORE the password is verified**, or the limiter is a timing
oracle: a wrong password costs a scrypt hash, a locked-out one costs nothing,
and the difference is measurable. The message never says which threshold was
hit or whether the key exists — **a rate limiter that confirms usernames has
given away what it was protecting**.

**The trade-off, stated:** a threshold per key means somebody who knows a key
can push that account over it on purpose. That is why the window is short and
self-clearing rather than a lock that has to be lifted by hand — a permanent
lockout turns "I know your username" into "I can keep you out indefinitely".
It is real, and it was observed while testing: hammering `smo` locked the
SMO out for the window.

---

## 4 · No security headers

**Built**, in `vercel.json`, for every path: a Content-Security-Policy,
`X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: no-referrer`, HSTS,
a `Permissions-Policy` turning off camera, microphone, geolocation, payment
and USB, `Cross-Origin-Opener-Policy: same-origin`, and DNS prefetch off.

`scripts/dev-server.js` reads the list **out of `vercel.json`** rather than
repeating it — the local server exists to test what ships, and a second copy
of a header list is a second copy that goes stale. It drops HSTS only:
sending it from `http://localhost` would pin the browser to https for
localhost and break every other local server on the machine.

**The honest limit.** The policy allows `'unsafe-inline'` for scripts and
styles, because the single-file design is nothing but inline script and inline
`style=` attributes. What the policy still buys is real — no external script,
no external connection, no framing, no plugins, no `<base>` — so an injection
has nowhere to send anything. What it does not buy is protection from an
injection that runs. **The upgrade is a hash-based `script-src`**: there are
no inline event handlers anywhere, so it is possible; it needs `build.py` to
emit the hashes and the gate to carry its own, and a stale hash is a page that
does not load. Recorded rather than done.

---

## 5 · Raw database errors reached the browser

**The issue.** Any 500 returned `String(e.message)` — a free map of tables,
columns and sometimes values to anyone probing, and meaningless to the person
who hit it.

**Built.** One sentence to the browser, the real error to the function's log.
The one exception is "no database configured", which is an operator's message
and names no schema.

---

## 6 · Sessions

**Built.** Expired rows are deleted on every sign-in — one DELETE on a path
already writing. And choosing a new password ends **every other session that
person holds**: the old password may be exactly why they are choosing. Their
own survives, because being signed out of the tab you just used to choose a
password is not security, it is a bug that looks like one.

---

## 7 · Verified

- 11 checks on the door and the limiter, against a real Postgres and the real
  API: `1234` still signs in and buys nothing; the change is accepted and the
  state then opens; a weak replacement is refused; guessing is cut off from
  the ninth attempt; a CORRECT password is refused while the window holds.
- 4 checks on sessions: two live sessions, a password change from one, the
  other gone and the changing one alive.
- A stale session row disappears on the next sign-in.
- 12 checks re-run on spec 006's authorisation, now through the temporary-
  password flow.
- The platform driven in a browser under the CSP, as a unit head and as the
  SMO: **no CSP violations**, service worker registers, manifest loads, fonts
  render, reporting saves, a plan change is refused with the banner.
- Fresh database: clean slate, round trip and fixed point PASS, and the
  bootstrap SMO arrives with `must_change` set.
- QA 31 viewers, zero console errors; byte-identical rebuild.

## 8 · Still not done

Hash-based CSP (§4). Tenant isolation (§36). At-rest key custody, backups and
retention. Who at Forefront can read production — a people-and-process control,
not a code one. An external penetration test before go-live. The Copilot's
read scope.
