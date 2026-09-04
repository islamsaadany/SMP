-- 039 · AN OBJECTIVE THE PLATFORM CAN NAME (§242)
--
-- Islam, from a live client session: *"for the functions planning in pillars
-- the key objectives reporting wasn't done … and the input there wasn't
-- saved."* The second half is this file's reason.
--
-- Every "add a row" control in the product mints an id — `addMeasure()`,
-- `addTactic()`, `addProject()` and, for a UNIT's objectives, `koSettle()`
-- since §96.4. The one that serves a CAPABILITY and a pillars function's
-- Overview never did: it pushed a row with no id at all. So the reporting page
-- drew that row's box carrying the string "undefined", `findById()` matched
-- nothing, and the handler returned without writing — no error, no console,
-- the figure gone. §51.10 exactly: the code that CREATES a field has to be
-- found as well as the code that reads it.
--
-- The control is fixed from this version. This is for the rows already sitting
-- in a client's database, which is where the objectives Islam could not report
-- against are.
--
-- ONLY A FUNCTION'S OWN OBJECTIVES CAN BE IN THAT STATE, and the schema is
-- what says so: `cap_key_objectives.id` is a PRIMARY KEY, so a capability's
-- id-less objective could never be stored at all — that save failed outright
-- (§172's shape, where one refused value then poisons every later save). A
-- pillars function keeps its objectives in `functions.extra`, which is jsonb
-- and holds anything, which is precisely why these survived to be reported
-- against and could not be.
--
-- THE SPELLING IS THE PRODUCT'S OWN: `renumberUnit()` writes `fn:<key>-KO<n>`
-- for a function read through `fnAsUnit()`, so this is that convention rather
-- than a second one beside it (§53.5).
--
-- IDEMPOTENT, AND IT FILLS ONLY BLANKS. A row that already holds an id keeps
-- it untouched — an id already written is what a reported figure, a focus mark
-- and a cycle snapshot are keyed on (§48.1), and rewriting one orphans all
-- three. A second run finds no blanks and updates nothing.
--
-- AND THE NUMBERING CONTINUES PAST WHAT IS ALREADY THERE rather than counting
-- from position. §191 recorded this as a near-miss worth not repeating: its
-- first draft numbered from the row's index and, on a tenant that had already
-- had a row added by hand, minted a name that row was holding — a duplicate,
-- which every reader treats exactly like a missing id, so the migration would
-- have caused the very thing it exists to remove.

WITH src AS (
  SELECT fn.key AS k,
         e.value AS v,
         e.ord   AS ord,
         COALESCE((SELECT max((regexp_match(x.value->>'id', '-KO([0-9]+)$'))[1]::int)
                     FROM jsonb_array_elements(fn.extra->'keyObjectives') AS x(value)
                    WHERE x.value->>'id' ~ '-KO[0-9]+$'), 0) AS top
    FROM functions fn,
         LATERAL jsonb_array_elements(fn.extra->'keyObjectives') WITH ORDINALITY AS e(value, ord)
   WHERE jsonb_typeof(fn.extra->'keyObjectives') = 'array'
), numbered AS (
  -- The blanks sort first inside each function, so they take 1, 2, 3 … in the
  -- order they appear; the numbering of the rows that already have an id is
  -- computed and discarded.
  SELECT k, ord, top, v,
         row_number() OVER (PARTITION BY k
                            ORDER BY (CASE WHEN COALESCE(v->>'id', '') = '' THEN 0 ELSE 1 END),
                                     ord) AS n
    FROM src
), fixed AS (
  SELECT k,
         jsonb_agg(CASE WHEN COALESCE(v->>'id', '') = ''
                        THEN v || jsonb_build_object('id', 'fn:' || k || '-KO' || (top + n))
                        ELSE v END
                   ORDER BY ord) AS kos,
         bool_or(COALESCE(v->>'id', '') = '') AS needed
    FROM numbered
   GROUP BY k
)
UPDATE functions f
   SET extra = jsonb_set(f.extra, '{keyObjectives}', fixed.kos)
  FROM fixed
 WHERE f.key = fixed.k
   AND fixed.needed;
