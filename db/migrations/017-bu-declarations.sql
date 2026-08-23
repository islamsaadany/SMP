-- @phase: pre
--
-- WHERE PEOPLE SAY THEY WORK (§56).
--
-- Islam, 2026-08-23: "on registration and password change they can set their BU
-- from the list or their supporting function, so we can get precisely who is
-- where rather than guessing."
--
-- A DECLARATION IS NOT AN ATTACHMENT. What somebody picks about themselves is
-- recorded here and grants nothing: their BU on the register — which is what
-- decides what they can open — is still the SMO's, changed on the People page
-- like any other. Otherwise the first sign-in would be a screen where anybody
-- awards themselves the reach to read whichever unit's plan they were curious
-- about, and a self-service escalation is the worst kind to explain afterwards.
--
-- OUTSIDE THE STATE GRAPH, and it has to be: `lib/state-io.js` writes a save by
-- TRUNCATE-ing all thirty tables and re-inserting, so a column on `people`
-- would be erased by the next thing the SMO saved. It sits where credentials,
-- sessions and the change log sit, for the same reason (§42).
--
-- AND WITH NO FOREIGN KEY, deliberately, for the reason `credentials` has none:
-- that TRUNCATE is CASCADE, so a reference to people(key) would take this table
-- with it on every single save. The key is a plain text column; a row for
-- somebody who has since been removed is answered by the join, not by the
-- database deleting evidence.

CREATE TABLE IF NOT EXISTS bu_declarations (
  person_key  text PRIMARY KEY,
  at          text NOT NULL,
  declared_on timestamptz NOT NULL DEFAULT now()
);
