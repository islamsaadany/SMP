/* THE CARRIED RULE MODULES, AS THEIR OWN FILES DESCRIBE THEMSELVES (§592).

   The shared rules, the change-list differ and the authoriser are plain
   JavaScript carried from the frozen product (§330), and this app loaded them
   with `require`, which hands back `any` — so no call from here into the
   rules was ever checked. These types are READ from those files (their
   type comments, §585), never written out a second time, so they cannot
   drift from the code they describe. `allowJs` in tsconfig.json is what lets
   the checker read them; `checkJs` stays off, so the files themselves are
   not held to this app's strict settings (`npm run check:rules-types`
   checks them, loosely).

   CLOSED, for §589's reason: an object written in JavaScript is open to the
   checker, so `R.isSMOO` would read as `any`. A mapped copy of the same keys
   is closed, and a misspelt rule is an error. */
type Closed<T> = { [K in keyof T]: T[K] };

export type Rules = Closed<typeof import("./rules.cjs")>;
export type Differ = Closed<typeof import("./graph-diff.cjs")>;
export type Authorizer = Closed<typeof import("./authorize.cjs")>;
export type PlatformRules = Closed<typeof import("./platform-rules.cjs")>;
