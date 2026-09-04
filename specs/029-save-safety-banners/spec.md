# 029 — Save-safety banners, and the deploy rule they rest on

**Status:** built and live (§258, §258.1, §258.2, §258.3), 2026-09-03.
**Asked by:** Islam — *"can we have some sort of mid page warning like the error and network issue in case the person is saving with someone opening the same thing … with clear action so we can know what to do?"* Then, of the two cautions drawn: *"BOTH"*.
**Mockups:** `design-mockups/data-loss-warnings/2026-09-02_save-safety-banners.html` (the two cautions), `design-mockups/data-loss-warnings/2026-09-03_save-first-banners.html` (the built banners in every state, shot from the real build).

## Why

Every loss in the reporting round of 2026-09-01/02 was a **stale tab**: a browser still on the build from before a save-protocol fix posted the old shape, the server refused it, and a refusal is all or nothing (§184), so every field in that post reverted. The other risk is two people on one number: different fields merge (§210), the same field is last-write-wins.

## What it is

Two cautions in the slot the red "Not saved" bar uses, on the attention ground (amber), never the alarm red — nothing has gone wrong yet.

1. **A newer version of the platform is ready.** The service worker claims its clients on activate, so an open tab hears of a deploy within about a minute, or on coming back to the tab. It fires only when the tab had an older worker before, never on a first install. One control: **Reload**.
2. **Somebody updated this page while you were working.** Every 20 seconds while the tab is visible it asks the server whether anybody else landed a change on the page it is on since it loaded, answered from the change log (one indexed query, never the graph), the asker excluded. It names the person and the page, and goes away by itself when you move to another tab. Setup pages never ask. The tab's clock is the server's, taken on the first ask. Controls: **Reload & keep mine**, **Dismiss**.

**Both buttons save first.** They commit the box under the cursor, ask the platform to save, and reload only when the server has answered "saved". A save that fails or is refused keeps the page and the red bar, and the button comes back live. The wording is Islam's: *"Finish what you are typing, then press Reload — it saves your work first and then opens the new version."*

**The red bar speaks the user's language.** *"The server could not take your change just now"* or *"The platform cannot reach the server — check your internet connection"*, then *"Keep this tab open — it tries again by itself every few seconds, and this bar clears the moment your change goes through. If it stays for more than a minute, tell the Strategy Office."* The technical detail (the HTTP status) is on the hover of "Not saved." for whoever has to chase it.

## What it does not close, and the rule that does

- **A deploy that changes how a save is judged.** An old tab's save under new rules can be refused. Reload then does NOT reload: the work stays on screen with the red bar, but the tab cannot save on the old rules and reloading would discard the screen. The exposure is small because everything up to the last completed box was already autosaved under the old server; what is unsaved is the box being typed in. It is not zero.
- **The rule (2026-09-03, Islam's question, my answer, adopted):** a merge to `main` that changes how a save is judged or shaped — the authoriser, the change-list diff, the review map, a migration that alters what a save touches — ships **with the forced sign-out** (a one-shot migration `DELETE FROM sessions;`, precedent 040), so no tab can stay on the old rules. A merge that only changes pages, wording or layout ships with the banner alone. Every merge says which kind it is in its "what to go and check" note.
- **Two people typing into the same box inside one 20-second peek** still resolve last-write-wins. History (spec 028) shows who won and puts the value back.
- **A tab from before the banners existed** cannot show them. A plain refresh is the answer there.

## Proof

`SMP-Project-Folder/src/checks/safety-banners.py` (20 red on the build before §258; 9 red before §258.1; 7 red before §258.2), `scripts/test-safety-peek.js` (the server's clock and the log read, on a real Postgres), `checks/save-said.py` (the red bar's words).
