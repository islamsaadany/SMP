/* THE SAVE ITSELF, NUMBERED (§585.1). Every save that lands is written here
   as the change list it carried, with a number in the order the save lock
   let them land, so an open tab asks "what changed since N" and is answered
   with the change and nothing else — instead of §258's per-target peek and
   §585's whole-graph fetch. A body too large to carry, or a whole-graph post
   from an older tab, is recorded as {"full": true}, which tells the tab to
   fetch the graph. One table per client schema, like change_log (010).
   Written so a second run changes nothing. */
CREATE TABLE IF NOT EXISTS saves (
  id          bigserial PRIMARY KEY,
  at          timestamptz NOT NULL DEFAULT now(),
  person_key  text NOT NULL,
  person_name text,
  changes     jsonb NOT NULL
);
