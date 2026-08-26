# Contract: `window.TOUR`

The engine's entire public surface. Everything else in `tour.js` is private
to the IIFE. Two callers exist (the shell's paint, the boot's land) plus the
Knowledge base's replay button and the check.

## Exports

### `TOUR.onPaint()`
Called at the end of `paint()` in `shell.html`, beside `SEARCHSEL.wire()` and
`CHAT.wireInbox()`. Re-resolves the current step's selectors and re-places
shade, rings and card. No-op when no tour is running.

**Never calls `paint()`** — directly or transitively (§97). A tour step's
navigation is performed by pressing real controls, which paint on their own
and re-enter here.

### `TOUR.offer(person)`
Called from `land()` in `sync.js` after its paint. Decides whether to open
the welcome card, and does nothing at all unless every condition holds:
a `person` (a real session), a story for their roles, no `smp.tour.<story>`
mark, no `smp.tour.later` session mark, storage readable, not
`body.presenting`, and http(s) rather than `file://`.

Returns nothing. Silent when it declines — declining is the common case.

### `TOUR.start(storyKey)`
Starts (or restarts) a story regardless of stored marks. The Knowledge base's
replay button and the check both use this. Remembers the current platform
mode, switches to demo, and shows the welcome card.

### `TOUR.storyFor(person) → storyKey | null`
The one role→story mapping (see data-model §4). Exported because the
Knowledge base needs it to decide which story its button starts, and the
check needs it to know which stories to walk for a given viewer.

### `TOUR.state() → { story, at, asking, steps }`
Read-only snapshot for the check. `steps` is the count of ordinary steps.
Exported deliberately: a check that has to scrape the card's text to know
where it is would break on every copy edit (§94.8 — assert the problem, not
the wording).

## Behaviour the contract guarantees

1. **Exit restores the world.** Finish, *Don't show again*, *Skip for now*
   and Escape-then-close all restore the pre-tour mode and leave no shade,
   ring, card or listener behind.
2. **Zero writes.** No tour path calls a save; demo mode's existing refusal
   (§21, §67) is the backstop, not the mechanism.
3. **No timers.** Nothing polls; nothing runs while no tour is running.
4. **Not drawn on a projector.** `body.presenting` suppresses the whole
   feature (CSS, off the class `present.js` already sets), as with the chat
   corner.
5. **Selectors, never nodes.** Any element reference is re-resolved after
   every paint, resize and scroll.

## What the contract deliberately excludes

- No `TOUR.next()` / `TOUR.back()` exports — a caller stepping the tour from
  outside would let a second control drift from the card's own buttons.
  The check presses the card's real buttons, like a person.
- No API for adding a story at runtime; stories are compiled data.
- No server surface of any kind.
