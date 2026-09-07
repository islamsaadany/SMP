# 038 · The escaping sweep, and the net behind it

**Status:** BACKFILL of built behaviour — nothing here is new, and nothing here
is a proposal.
**Decisions:** §235 · §238 (+.1, .2)
**Constitution:** checked against v1.2.0 — Principle X (the server decides; the
browser only draws) and the standing rule that anything involving money,
permissions or rules is server-authoritative.
**Related:** spec 006 (the server decides who may change what), spec 007 (the
security floor), spec 032 (the write path §238.2 deferred).

---

## 0 · Why this document exists

Spec 007 was the security floor as of 2026-08-21: the door, sessions, rate
limiting, headers. **The 2026-09-01 sweep found something older and worse than
anything on that list** — a cross-site scripting hole reachable from ordinary
tenant data, executing with the reader's full authority — and it has no spec.

Its two halves were written as §235 (the escaper) and §238 (the net and the
deployment's file list), and §238 had **no section in the decisions document at
all** until 2026-09-05. Both are live. This is the one place that says what the
hole was, what closed it, and what is still open.

**It changes nothing.** Where this and the product disagree, the product is
right and this file is the defect.

---

## 1 · The hole

`esc()` — the platform's main text-cleaner — escaped **`&` and `<` and nothing
else**. That is a *text-node* escaper: correct for text between tags, and unsafe
inside an HTML attribute, where **a literal `"` in tenant data breaks out of the
quotes.**

It is used inside double-quoted attributes **~226 times**.

**And the CSP allowed `'unsafe-inline'`**, so an injected `onfocus=` or
`onerror=` did not merely render — it **executed, in the reader's browser**. The
reader is very often the SMO, with full SMO authority: role changes, password
resets.

**The attacker input is anything editable**: a person's name, a plan note, a
renamed label, a cell in an uploaded `.xlsx`.

**Two sites had hand-patched `.replace(/"/g,"&quot;")`** — which is the gap being
noticed and never generalised. *Two patches against 226 is the definition of
ad hoc.*

**Separately, the tenant's LABELS rendered raw at ~43 sites** and, through
`recipeText()`, were spliced raw into the knowledge base — so a Pillar relabelled
`<img src=x onerror=…>` ran for **every reader in the tenant**.

---

## 2 · The fix is three one-liners, and it is inert for normal content

1. **`esc()`** (and `welcome.js`'s **`wesc()`**) escape `>`, `"` and `'` as well.
   An entity renders as its character, **so nothing displayed normally changes**
   — verified that `esc()`'s output is only ever concatenated into `innerHTML`
   (never compared, keyed, or read back), which is what makes the two
   hand-patches harmless no-ops rather than double-escapes.
2. **`L()` returns through `esc()`**, which closes the 43 raw label sites **and**
   the knowledge-base substitution in one place, because every reader of a label
   goes through `L()`. Its 88 uses are all display-only — verified, no
   comparison, key, or data-attribute read back.
3. The knowledge base's deliberate `<b>` markup is **untouched** (the answer
   template is trusted; only the spliced label was not), and its raw-`<p>` render
   is **deliberately left alone** to preserve formatting.

> **Escaping at the one reader rather than at 43 call sites is the whole
> design.** A sweep that fixed 43 sites would have left the 44th to whoever adds
> it next.

**The cost is stated, not hidden**: a label *containing* `& < > " '` — none of
the 8 real labels do — would show as an entity in a couple of double-cleaned
spots. Cosmetic, and never a broken flow, access, or figure.

**Proved not to damage anything** rather than argued: `qa.py` clean across every
page as every viewer, and `report-saves`, `gap-fill`, `submit-gate`,
`knowledge-base` and `fn-ko-edit` all green — reporting a figure and a note
reaches the stored plan, and filling, submitting and editing all behave exactly
as before. **Numbers contain none of these characters, so reporting is
byte-for-byte unchanged.**

---

## 3 · The net behind it (§238)

§235 is the answer. **§238 is the net under it**, and the argument for a net is
that the escaper is one function reached from hundreds of places: *the next gap
will look exactly like the last one — correct at every call site, and one call
site that builds its own markup.*

**The policy is hashed at build time, which is the only reason it is safe.**
`build.py`'s `csp_meta()` takes the SHA-256 of every inline `<script>` block's
exact bytes and writes them into a `<meta http-equiv="Content-Security-Policy">`
at the head of the built file, allow-listing those hashes and nothing else
inline.

> **The whole danger of a hashed CSP is a stale hash — a page that will not load
> — and it cannot go stale here, because the hashing happens in the same build
> that emits the scripts it is hashing.** A build that is not byte-identical is
> already a stop-the-line condition (Principle III); this rides that.

**It is a second policy, not a replacement.** `vercel.json`'s header still
carries `'unsafe-inline'`, and must: it applies to every path including the
**gate** (`index.html`), which is not built by `build.py` and has no hashes. The
meta is scoped to the platform file alone, and a browser enforces both — so the
real blocks pass on their hash and an injected handler passes neither. **Only
`script-src` is set.**

**Nothing legitimate relies on inline execution**, checked rather than assumed:
every handler is added with `addEventListener` and nothing injects a `<script>`
at runtime. Proved by `checks/csp-net.py` over HTTP — the real blocks run, an
injected `onerror=` does **not** fire — and by a full `qa.py` walk.

**And it has a cost nobody predicted** (§276): a check that falsifies a build by
**editing the built file** now silences the whole script block whose bytes it
changed, so every function vanishes and the check reports *cannot continue*
rather than failing. Broken builds are made from the **sources** through
`build.py`, and a check that needs one takes `SMP_BUILT` to be pointed at a copy.
*The right trade — the falsification technique changed, the product did not — and
it arrived silently.*

---

## 4 · The deployment stopped serving its own workings (§238.1)

`src/`, the in-repo `checks/`, `scripts/`, `design-mockups/`, `ui-versions/`,
`specs/`, `.specify/`, `clients/`, `smp-app/` and every `.md` were **publicly
fetchable**.

**No secrets were ever exposed** — every credential is a server environment
variable read in one place (§72, §231), and the client rules ship inline in the
built file by design (§42) — so what leaked was implementation detail, not
access. It is still not the deployment's to serve.

`.vercelignore` excludes them. **`lib/` and `db/` are deliberately kept**,
because the `api/*` functions require them: **excluding a path removes it from
the function bundle as well as from static serving**, so anything the runtime
needs may never appear in that file. That is the documented residual — server
source, still no secrets — stated rather than implied.

**Verified on production after the deploy** rather than reasoned about (§91.5's
rule, one surface out): `scripts/`, `smp-app/` and the sources answer **404**;
the gate, the platform and `/api/state` answer **200**.

---

## 5 · What the sweep deliberately did not do (§238.2)

**The server-side database write.** Every save still cleared and rewrote all 31
tables. The acute cost was already gone (§195), and closing the rest means an
incremental writer or a read-authorise-write lock on the **live** write path —
**the one change in this product that can corrupt a client's data.**

So it was recorded as needing its own staged pass rather than folded into a
security afternoon. §240 took the lock the same day; §241 took the writer, behind
a flag. **Both are spec 032.**

---

## 6 · Requirements, as things that can be checked

- **R1** `esc()` and `wesc()` escape all five of `& < > " '`.
- **R2** Every tenant label reaches the screen through `L()`, and `L()` escapes.
- **R3** `esc()` output is never compared, keyed on, or read back — only
  concatenated into markup.
- **R4** The built file carries a `script-src` allow-listing exactly the hashes
  of the inline blocks in that same build.
- **R5** An injected inline handler does not execute on the built file served
  over HTTP.
- **R6** Every legitimate script block still runs, on every page, as every
  viewer.
- **R7** No source, check, mockup, spec or document is fetchable from the
  deployment; `lib/` and `db/` remain available to the functions.

---

## 7 · Traceability

| Behaviour | Section | Check |
|---|---|---|
| The escaper, and the label reader | §235 | `qa.py`, plus `report-saves`, `gap-fill`, `submit-gate`, `knowledge-base`, `fn-ko-edit` as the no-damage evidence |
| The hashed CSP | §238 | `checks/csp-net.py` |
| What the deployment serves | §238.1 | `.vercelignore`, verified live after deploy |
| The write path it deferred | §238.2 | spec 032 |

---

## 8 · Open, and recorded rather than done

- **`'unsafe-inline'` remains in the `vercel.json` header** for the gate, which
  is not built and therefore has no hashes. Bringing the gate through a build
  would close it; nobody has asked, and the gate is a single small page.
- **Tenant isolation (§36)** is unbuilt and deliberately unscaffolded — one
  Postgres schema per tenant when it comes, not a tenant column.
- **Key custody, backups, retention, and who at Forefront can read production**
  are named in spec 007 and are still decisions rather than code.
- **An external penetration test before go-live** is recorded in spec 007 and
  has not happened.
- **The knowledge base's raw `<p>` render** is trusted content by decision; it
  would have to change if the KB ever accepted text from outside the office.
