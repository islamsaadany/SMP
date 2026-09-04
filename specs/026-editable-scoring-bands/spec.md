# 026 · An editable scoring scale, and the away threshold

**Version:** v3.64 · **Decisions:** §168, §169 · **Status:** answered; built

Islam, in two messages from using the product:

> *"for the bands make it editable in the scoring bands table in the setup ..
> to remove or add levels and set the values and colors."*

> *"on another note in the caht settings for the away email add my a small
> option to set the number of away minuits to send the email."*

Both are the same shape of change: a number or a list that was decided in the
source is decided by the tenant instead, in the one place the setting already
has a page.

---

## 1 · What is asked

1. The Scoring bands table lets the office **add** a level and **remove** one,
   not only rename it and move its floor.
2. Each level's **colour** is set on that table.
3. The Away email setting carries a **small option** for how many minutes
   somebody must be away before a reply chases them by email.

---

## 2 · The scale

**A level's colour is its key.** `bands[].key` is read as a CSS token
(`var(--good)`, `.pill.good`) and by `needsNote()`, which asks for an
explanation on a figure landing in `bad` or `warn`. Setting a colour therefore
sets both how the level is painted and whether landing in it obliges a note.

Five colours are offered — green, amber, orange, red, grey — and deliberately
no sixth: a colour the product does not paint renders as nothing at all.

| Act | Rule |
|---|---|
| Add | The new level goes immediately **above the bottom one**, at half the floor of the band above it, wearing a colour nothing else is wearing. Named *New level*. |
| Remove | Available only while there are **more than two** levels; where it is withheld the reason is on the row, not merely the button missing. Whatever ends up last has its floor set to **0**. |
| Colour | One press writes the level's key; the swatch, the pill and every chart segment follow. |
| Name, floor | Unchanged from before: written on `change`, and the range beside them is derived. |

**Invariants.** Floors descend (the page refuses to save an overlap, as it
already did); the bottom level starts at 0, so every figure lands somewhere;
at least two levels exist.

**Storage.** No migration. `bands` is keyed on `idx` alone, so any number of
rows — and two levels sharing a colour — store and read back unchanged. The
authoriser already classified the list as `setup`.

**What went.** Two notes under the table: one citing `src/lib/scoring.ts`, a
file that is not in this product, carried from the original handoff with its
own *"reconcile against the codebase"* caveat; and one describing thresholds
of 70 and 50 that §162 replaced. The warning that **changing a threshold
rewrites history** stays.

---

## 3 · The away threshold

`chatCfg().away` — minutes, default **3**, clamped **1 to 120** — replaces
`HERE_MINUTES` in `api/chat.js` and the hardcoded *"three minutes"* in the
setting's own tooltip. It lives in `lib/rules.js` because the server decides
`here` from it and the office's page explains it.

- The box is drawn **only while the Away email is on** — the shape `rep`
  already has under Handover email.
- It writes on `change`, never per keystroke, and redraws the menu rather than
  the page.
- The row's sentence and the words beside the box both **read** the value.
- Absence is tested for before the value is read as a number: `Number(null)`
  is 0 and finite, so clamping alone answered one minute for every untouched
  tenant.

**Three is marginal and is not changed.** A shut panel stamps `here_at` every
180 seconds, so at exactly three minutes somebody at their desk is between
beats as often as not. Moving the shipped default is a decision about when
emails go out, not a fix; the tooltip says that anything below four can call
somebody away while they are working.

---

## 4 · How it is proved

| Check | What it establishes |
|---|---|
| `checks/scoring-bands.py` | Every control **pressed** and `BANDS.bands` read back; both ends each time; the two removed notes gone and the warning kept; the whole page absent for somebody without the grant. **4 failures then a crash** on the previous build. |
| `scripts/test-chat.js` | The **server** obeys the stored threshold — the row aged to a fixed distance and the number moved either side of it — plus the clamp and the not-a-number case. **3 red** with the endpoint's constant restored. |
| `checks/office-chat.py` | The box is on the Away email row, the row's sentence reads it, and it goes and comes back with the switch. |
| Real Postgres | A five-band tenant, two levels sharing a colour, round-tripped; plus the standard round trip on a virgin database. |
