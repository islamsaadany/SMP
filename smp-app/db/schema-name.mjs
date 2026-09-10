/* WHICH ROOM THE SHARED SCHEMA LIVES IN (§317.4).

   Named ONCE, because five things have to agree about it — the applier, the
   role's grants, both connection pools, the carry's destination and the demo
   seed — and a name spelled in five places is a name that is wrong in one of
   them (§53.5).

   IT IS NOT `public`, AND THAT IS THE WHOLE POINT. On the real database
   `public` is a CLIENT: when spec 042 split the clients into a schema each,
   the one that already existed stayed where it stood, so `public` holds Raya
   Trade's 47 live tables and the registry points `raya-trade` at it. The
   spike and every rehearsal ran against a database whose `public` was empty,
   which is the one shape that cannot show this — so the first real build
   stopped at `relation "sessions" already exists`, one table into a
   transaction that was about to be laid over a client's own data. It rolled
   back and nothing was written; what it cost was the discovery, not the data.

   A ROOM OF ITS OWN ALSO KEEPS THE WAY BACK PERFECT: the frozen site goes on
   serving `public` exactly as it does now, and the carry only ever READS it,
   so putting the Root Directory back restores the old site whole.

   AND `public` IS DELIBERATELY NOT LEFT IN THE SEARCH PATH BEHIND IT. A
   fallback there would mean a table missing from this schema resolving
   SILENTLY to a client's live one — the fault this exists to prevent, wearing
   a green build. */
export const SCHEMA = process.env.SMP_SCHEMA || "smp";

/* A schema name reaches SQL by concatenation in a few places (you cannot bind
   an identifier), so it is refused rather than escaped if it is not a plain
   one — the same refusal `lib/tenant.ts` makes about a tenant. */
export function schemaIdent(name = SCHEMA) {
  if (!/^[a-z_][a-z0-9_]{0,62}$/.test(name)) throw new Error("schema-name: not a plain schema name — " + name);
  return name;
}
