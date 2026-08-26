# Data model: the onboarding tour

Nothing here reaches the database, the state graph, or any save. Three
shapes: the story data compiled into the platform, the runtime state one tour
run holds, and the two browser-storage marks.

## 1 · `STORIES` — compiled data inside `tour.js`

```js
STORIES = {
  custodian: { role: "Strategy custodian", steps: [ …Step… ] },
  owner:     { role: "Business unit / function owner", steps: [ …Step… ] }
}
```

- Keyed by **story key**, not by role key: two role keys (`owner`, `fnhead`)
  map to one story, and the mapping lives in `storyFor()` (below), so adding
  a role that shares a story is one line.
- Read by nothing outside `tour.js`.

### Step

| Field | Type | Meaning |
|-------|------|---------|
| `kind` | `"welcome"` \| `undefined` \| `"finish"` | Absent means an ordinary numbered step. |
| `dest` | string \| `"$own"` | Destination key to open (`data-u`). `$own` resolves to this viewer's own unit/function at runtime — the story is not written against Mobile. |
| `tab` | string | Tab key (`data-ms`), e.g. `strategy`, `performance`. |
| `sec` | string | Section key (`data-sub2`) where the tab has sections, e.g. `found`, `swot`, `plan`. |
| `targets` | string[] | Selectors to light. **The LAST is the main subject** — card placement clears every hole but is positioned around this one. |
| `title` | string | Card heading. |
| `body` | string (HTML) | Card copy. Content — Islam's to approve (FR-012). |

Rules the shape enforces by construction:

- A step names its own page/tab/section, so **Back is free**: going back
  re-applies that step's navigation. No history stack is kept.
- `targets` is always an array, even for one target — the section steps'
  two-hole case is not a special path.
- No step carries a handler, a promise, or a "wait for" — the engine owns
  sequencing.

### Step counting

`Step n of N` counts only ordinary steps: `N = steps.length - 2` (welcome and
finish excluded). The mockup's off-by-one here was caught by driving it; the
check asserts the last ordinary step reads `N of N`.

## 2 · Runtime state (one run)

| Field | Meaning |
|-------|---------|
| `story` | the story key being walked |
| `at` | index into `steps`; `-1` when not running |
| `asking` | true while the close prompt has replaced the card |
| `prevMode` | the platform mode before Start (`"live"` / `"demo"` / `"demoClear"`), restored on every exit |
| `holes` | the boxes computed for the current step — recomputed, never trusted across a paint |

State is private to the IIFE. The only exported surface is in
[contracts/tour-api.md](contracts/tour-api.md).

## 3 · Browser storage

| Key | Store | Value | Written by | Meaning |
|-----|-------|-------|-----------|---------|
| `smp.tour.<story>` | `localStorage` | `"never"` | finishing the tour; *Don't show again* | never auto-offer this story in this browser again |
| `smp.tour.later` | `sessionStorage` | `"1"` | *Skip for now* | not again this session; a new sign-in is a new session, which is exactly the promise |

- Both reads and writes go through one guarded helper. **A throwing store
  reads as "marked"** — the tour fails quiet rather than nagging on every
  load (spec edge case).
- Replay from the Knowledge base reads neither mark and writes none until the
  person closes again.
- Nothing here is ever sent anywhere; there is no server side to this feature.

## 4 · Story selection

`storyFor(person)` — the ONE place roles become a story:

1. `SMPRules.personRoles(SMPRules.worldOf(graph), person)` → role list
   (Constitution IX: the tour writes no role logic of its own).
2. `custodian` present → `"custodian"`.
3. else `owner` or `fnhead` present → `"owner"`.
4. else → `null` (no automatic offer; the KB entry is absent too).

`$own` in a step resolves from the same role list's `at` value — the unit or
`fn:<key>` the person holds their role over — so the walk happens where they
actually work (§94.6's rule: people open where they work).
