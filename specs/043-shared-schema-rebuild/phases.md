# The rest of the rebuild, in phases — for approval (spec 043, after §315)

**Date**: 2026-09-09 · **Branch**: `claude/smp-tenancy-stack-decision-l5aoo5`
**Status**: **drawn for Islam's approval, nothing built.** Once approved, the
phases run in order without stopping except at the stop points in §3.

Islam: *"build a full plan with phases and let's approve it so you don't stop
until you really need my input."* This file is that plan. It follows the
spike (`tasks.md`, §314.3) and the door and landing (`tasks-door-landing.md`,
§315), and it says three things: **how** the remaining screens are carried
across (§1 — one recommendation, with its cost), **what** each phase ports
and what proves it (§2), and **where** the work has to stop for a word from
Islam (§3). Everything else is mine to do.

---

## 1 · How the screens are carried: the product's own renderers are the screens

**The recommendation.** Every page behind *Continue* is served by the new
app from the **frozen product's own render functions and shell script**,
carried across as they are, with three things replaced underneath them: the
data layer (`sync.js` → a tenant-aware client talking to the new API), the
API (`api/*.js` → Next routes over the shared schema, every read and write
inside `withTenant()` as `smp_app`), and the routing (the Vercel rewrites →
`/<client>/<target>/<tab>`). The door and the landing (§315) stay as built.

**Why this and not a React rewrite screen by screen.** Measured: the frozen
sources are **72,811 lines**, of which the render files and the shell are
some 34,000 (`group-render.js` 7,995 · `config-render.js` 8,345 ·
`config-data.js` 8,319 · `shell.html` 9,209), and spec 043 §4.8 lists what
is thrown away — the API, `sync.js`, the badge roles, the built file *as the
live product* — and **does not list the renderers**. Rewriting them in React
is a second answer to *what is on this screen* for every screen at once
(§53.5, §305's own argument against a second deck builder), and every line
of it is a place for the look, the wording and the arithmetic to drift from
the 315 sections that decided them. Carrying them verbatim keeps the
decisions document true of the new product line for line, and it is what
§315 already did for the landing's rows (`lib/frozen.cjs`).

**What it costs, stated.** (1) The app has two kinds of page — the door and
the landing in React, the rest the carried shell — until Islam asks for a
screen to be redrawn, at which point that screen gets a mockup and a React
page and the shell loses it. (2) A browser still downloads the whole shell
for any page, as it does today. (3) The rewrite of every bare-id reader
(§314's stated price) lands where the data is addressed — the API and the
save — not in the renderers, which go on reading the hydrated graph exactly
as they do now. (4) No service worker and no offline copy: the wall already
says so (§315, Islam's own fourth line), and §91's cache-by-name trap goes
with it.

**What rule 1c means under this.** A screen carried verbatim — markup and
stylesheet word for word — is **not a design change** and needs no mockup;
the mockup rule fires the moment a screen departs from the frozen product
in any visible way, and that is stop point B in §3. The office's own pages
(`platform.html`: Clients, Consultants, Who sees what, §313.3) are carried
the same way.

---

## 2 · The phases

Each phase ends green on its own proof, red first (constitution XVI),
`tsc` and `next build` clean, the record written in the same commit (the
decisions document's §316 onward, the tracker, this file's boxes ticked),
and the branch pushed. **Size** is an estimate in working sessions and is
there so the order can be judged, not promised.

| # | Phase | What is ported, from where | What proves it | Size |
|---|---|---|---|---|
| **A** | **The state API** | `api/state.js` → `GET /api/state` (the graph for the session's tenant, the `?since` peek of §258, the `?log` read of §262), `POST /api/state` (the change list of §210/§215 applied onto the stored graph, judged by the ported authoriser, written by S9's row-addressed writer under §240's per-tenant lock, `change_log` written from the same diff). `lib/authorize.cjs` and `lib/graph-diff.cjs` are already carried; `state-io.ts`'s read side gains the four things the shell hydrates that the spike did not carry. | The frozen harnesses' assertions re-run over HTTP on a real Postgres: two tabs (§210), eight concurrent saves (§240), a refusal keeping the good rows (§184), a view-as save judged as the viewed person (§185), the history read (§262), the safety peek (§258); each red first. | 2 |
| **B** | **The shell on the new stack** | `scripts/build-shell.mjs` assembles the platform page from `build.py`'s own file list minus `sync.js`, the demo/gate remnants and the worker registration; a new `sync.ts` (hydrate from A, change-list saves, the peek, the door URL, the view-as rebase); the route `/<client>/<target>/<tab>[/…]` replacing every holder; the CSP of §238 as a Next header with the hashes computed at build; `/platform` carried from `platform.html` (Clients · Consultants · Who sees what) over `lib/platform-rules` and `api/platform.js` ported. | `qa.py` pointed at Next: every page as every viewer, console errors none, both themes (constitution IV); the door check still 44/0; a check harness that opens a URL and signs in instead of opening a file (research §P4). | 3 |
| **C** | **Strategy** — Foundation · SWOT · Plan, unit and both function formats | Nothing new is written; this phase is the acceptance run. The checks that walk these pages (plan-edit-line, plan-fields, plan-tail-fold, gap-fill, gap-walk, empty-not-missing, one-line-titles, monthly-plan, objectives-table, unit-before-number, yn-target, count-compile, tactic-outcome, fn-pillars, fn-ko-edit, plan-builder, project-row-type, hide-element, pillar-project-remove, setup-arrange's plan half, …) are re-pointed at Next and each failure is fixed in A/B, never in the frozen sources. | Every check in the group green against Next; any that cannot apply (a `file://`-only subject) retired by name with its reason. | 2 |
| **D** | **Performance and Reporting** | As C: ytd-proration, measure-score-spread, submit-gate, report-blockers, report-saves, report-note-wrap, reported-note, project-done, capability-first, cycle-edit, planning-period, unit-follows, scoring-bands, perf-line, fn-perf-controls, deck-figures' page half, focus. | Green against Next, red first where a fix was needed. | 2 |
| **E** | **Setup** | People (the register and its dialog, roles, passwords issued through the new `users`/`people` link), Roles & access, Business units and Functions (arrange), Companies, Branding and the marks (`api/blob.js` → a route over the store), Terminology, Reporting cycle, Cycle board, Import & storage, Email settings, History, Overview, Knowledge base and the questions file. `api/blob.js` and the mark upload ported here. | The Setup checks (people-dialog, register-header, role-picker, access-header, setup-arrange, setup-overview, setup-rail, setup-search, setup-header, setup-pages, history-page, kb-file, knowledge-base, attention-dismiss, no-jump, …) green against Next. | 3 |
| **F** | **Presentation** | The deck, Manage slides, the master flow, the deck PDF, the review `.pptx`, the plan `.pptx`, video slides (the clip endpoint over the store), the contingency files. All client-side except the store; the working copy (§306) is built from the shell B assembles. | deck-*, hide-slide, master-*, present-loop, video-*, contingency, review-pptx green against Next. | 2 |
| **G** | **Communication** | `api/chat.js` → routes: the corner, the Platform Inbox, the assistant and Ask (`GEMINI_*` env), the collection email (§293), notifications (`lib/push.js`, one VAPID pair per deployment — data-model.md), `api/mail.js` → Send an email over `lib/mailer.js` (`RESEND_API_KEY`, `SMP_MAIL_FROM`), the greeting, test copies. Every table outside the graph keeps its tenant policy (S5 already covers them). | test-chat, test-ask, test-chat-chase, test-push, test-email-greeting, test-test-copies re-pointed; office-chat, office-ask, corner-reply-box, paste-picture, chat-settings-scroll, send-overview, email-greeting, email-link green against Next. | 3 |
| **H** | **Files in and out** | Workbooks and templates (`xlsx.js`, `templates.js`) are client-side and travel with the shell; the upload's replace path and the archive land through A's save. Nothing ported; verified. | template-round-trip, import-page, kb-file green against Next; the plan and progress workbooks a fixed point. | 1 |
| **I** | **The data** | `scripts/migrate-raya.mjs` run against the real `raya_trade` schema (S8 proved it on a copy); RHI and El Abd created empty; the demo tenant seeded by `seed-demo.mjs` (seed-demo-client.js carried, writing under the demo tenant); every existing login carried onto `users` with its hash and `must_change`. | S8's four assertions on the real data (counts equal per table, a plan byte-identical, a save round-tripping, every migrated sign-in still working); the door check as each carried person. | 1 + Islam |
| **J** | **Cutover** | The Next app deployed (Vercel project, Neon env, `db/apply.mjs` at deploy, `smp_app`'s sign-in half of S1 on Neon); the frozen site's addresses answered by the new app; a self-destructing `sw.js` so returning browsers drop the cached shell (§91); everybody signs in again (§258's kind of deploy, one-shot `DELETE FROM sessions`); the merge; the what-to-check list (A16). | The live site read, not the dashboard (§91.5); the door check and `qa.py` against production; each client's own door wearing its mark. | 1 + Islam |

**Order.** A before B (the shell needs an API); B before C–H (the acceptance
runs need the shell); C–H in the order above, because each group's checks
lean on the ones before (a Reporting check submits a plan C proved; a deck
check reads figures D proved). I and J last, and only with Islam.

**What every phase does the same way.** The frozen sources are read, never
edited (constitution III); a fix goes into the new API, the new client or
the check harness. A check that goes red on the new stack is a finding
about the port, and it is fixed in the port. A check whose subject no longer
exists (the `file://` boot, the CSP net over an inline file, the worker,
demo mode) is retired **by name with its reason** in the phase's record,
never left silently red. Contrast is measured in both themes wherever a
group's sweep measures it today (constitution XIII). Nothing in `main`
moves.

---

## 3 · Where the work stops for Islam

These are the only places the phases wait. Everything not listed here is
decided by what the frozen product already does.

| | Stop point | When | What is put to him |
|---|---|---|---|
| **A0** | **This plan** | Now | Approve §1's approach and §2's order, or say what to change. |
| **B** | **A visible departure** | Any phase | A screen that cannot be carried verbatim — because the new stack forces a change, or because a frozen behaviour is unreachable without one — gets a mockup published as an artifact, with the cost, before it is built (rule 1c). Expected rarely; none is known today. |
| **C** | **A product question the record does not answer** | Any phase | Named in the phase's record with the default taken (today's behaviour) and the question; the work continues on the default. |
| **D** | **A client-blocking defect on the frozen build** | Any time | Asked about before it is touched (§314: the single file takes no new features; a correction is asked first). |
| **E** | **Phase I — the real data** | After H | Islam can run database work ONLY through Neon's SQL editor (his word, 2026-09-09) — never a connection string in chat, and no Node script from his shell. So every step he runs is handed as SQL to paste there; where a step cannot be said in SQL (S8's `migrate-raya.mjs` walks JSON), it runs at deploy from Vercel's own environment (`db/apply.mjs`), and the choice is recorded at Phase I with its cost. A step that fits neither is SAID, not assumed. He runs it; I read the printed results. The demo tenant's names are seed-demo-client.js's own, already his (§313.8). |
| **F** | **Phase J — where it is served, and the merge** | After I | The Vercel project and its environment variables (the database, `GEMINI_*`, `RESEND_*`/`SMP_MAIL_FROM`, the store token — each named, none pasted), the address the clients open, the day everybody signs in again, and the merge to `main` — his word on that merge, every time. |

Nothing else asks. A phase that finishes reports in one message — what was
ported, what its checks measured, what was retired and why — and the next
begins.

---

## 4 · The boxes

- [x] A0 Plan approved by Islam (2026-09-09: *"agreed ... proceed"*, with the Neon constraint below).
- [x] A The state API — read, save, peek, history; harnesses green red-first (§315.2, 2026-09-09: `check:state` 87/0, six red runs).
- [x] B The shell on the new stack — build-shell, the frozen `sync.js` carried rather than rewritten, routing, CSP, /platform (§315.3, 2026-09-09: `check:shell` 36/0 with two red runs; `qa.py` at Next 33 viewers, 229 destinations, ERRORS none; door 44/0, state 87/0).
- [x] C Strategy checks green against Next (§316/§316.1, 2026-09-10: 39 checks, 0 failures; `qa.py` at Next 33 viewers / 229 destinations / ERRORS none; state 87/0, door 44/0, shell 36/0; one product fault found and corrected — the builder's id-less capability objective, §316 — and nothing retired).
- [x] D Performance and Reporting checks green against Next (§316.3/§316.4, 2026-09-10: 22 checks, 0 failures; `qa.py` at Next 33 viewers / 229 destinations / ERRORS none; state 91/0, spike 9/9, 588/0, 136/0; one product fault found and fixed on Islam's word — opening a new cycle could not be saved, §316.3, live on `main` and proved on the frozen writer — and nothing retired).
- [x] E Setup checks green against Next; blob route ported (§316.5, 2026-09-10: 38 checks, 0 failures except four reds established as NOT this work's — `history-page` 10, `band-corner` 6 and `tour` 15 reproduced identically on `origin/main`'s OWN build, and `table-scroll`'s 4px label squeeze measured on both stacks and served-only; `api/blob.js` ported with `check:blob` 23/23 and RED both ways; `qa.py` at Next 33 viewers / 229 destinations / ERRORS none, `file://` ERRORS none; door 44/0, state 91/0, shell 36/0, 588/0, 136/0; nothing retired).
- [x] F Presentation checks green against Next (§316.6, 2026-09-10: 18 checks, 0 failures; NOTHING was ported for this group and nothing needed to be — a deck is assembled in the browser and the one thing that leaves is a clip, ported at §316.5; `qa.py` at Next 33 viewers / 229 destinations / ERRORS none, `file://` ERRORS none; door 44/0, state 91/0, shell 36/0, blob 23/23, 588/0, 136/0. No product fault; two checks, both shapes met before — a file-only assertion and a viewer switch read before it took. Nothing retired).
- [x] G Communication routes ported; server and browser checks green (§316.7, 2026-09-10: `api/chat.js` and `api/mail.js` CARRIED across as `lib/chat-api.cjs`/`lib/mail-api.cjs` with ten named plumbing edits and nothing else — the whole code-only diff read hunk by hunk against that list — plus `lib/{mailer,push,assistant,mail-html,audience}.cjs`; `checks/comms-api.mjs` 47/47 with a browser SEAM section, RED both ways; the twelve frozen browser checks own-server and green. **Two faults found by PRESSING the endpoints**: `FROM org WHERE id = 1` naming a column the shared schema does not have, so every chat request answered *Something went wrong*; and `push_subscriptions` mis-keyed in the NEW schema so a device changing hands would multiply rather than move (migration 003). Two nested transactions became SAVEPOINTs. `qa.py` at Next 33 viewers / 229 destinations, ERRORS the ONE named 404 and nothing else, `file://` ERRORS none; door 44/0, state 91/0, shell 36/0, blob 23/23, 588/0, 136/0, `tsc` clean. **STOP POINT C RAISED, not answered**: `/sw.js` is 404 by the plan's own line 47, and that same file carries `push` — so notifications cannot arrive while Phase G's row says to carry them, and every page load logs that 404 for every viewer, with nobody having turned anything on — the chain I first reasoned (a VAPID pair moving) was REFUTED by deleting the pair and sweeping again. Nothing retired).
- [x] H Files in and out verified (§316.8, 2026-09-10: NOTHING ported — the workbook builders travel with the shell BY CONSTRUCTION, `build-shell.mjs` reading build.py's own list and asserting the assembly byte-identical. `template-round-trip` 0 failures at Next; `import-page` and `kb-file` 1 each and both the ONE recorded worker 404, established as not this group's by running all three green over `file://` first (§303). **AND HALF THE ROW WAS COVERED BY NOTHING**: the round trip is proved IN THE BROWSER and never saves, so *the upload's replace path and the archive land through A's save* had no check on either stack — `checks/upload-seam.mjs` 9/9, RED both ways, drives the real workbook in a real browser and reads the plan back out of Postgres through the tenant (an update, an INSERT, a DELETE, the archive once, and none of it in the other client). Its own first fixture claimed three kinds of difference and made one — ids are minted BY POSITION, so drop-one-append-one leaves the id set unchanged — found by the break, not by reading. `qa.py` at Next 33 viewers / 229 destinations, ERRORS the ONE recorded 404 and nothing else, `file://` ERRORS none; door 44/0, state 91/0, shell 36/0, blob 23/23, comms 47/47, 588/0, 136/0, `tsc` clean. **STOP POINT C NARROWED, still not answered**: Phase J's own row already serves a self-destructing `sw.js`, so a file at that address is in the plan — what is open is only whether it carries `push`. Nothing retired).
- [ ] I The data — Raya carried (Islam runs it), RHI and El Abd empty, demo seeded.
- [ ] J Cutover — deployed, served, everybody signed in again, merged on Islam's word, what-to-check sent.
