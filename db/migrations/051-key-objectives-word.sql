/* KEY OBJECTIVES, NOT KEY MEASURES (§623) — the per-tenant stack's 031.
   Islam: "key measures is not the default on the foundation, it should be
   Key Objectives." 045 kept a client's old business-unit word as the MANY
   and filled the ONE from the platform's default, so El Abd's row became
   "Key Objective" / "Key Measures" — a carry-over, never a choice. Exactly
   that pair is put back to the platform's word. Written so a second run
   changes nothing. */
-- @phase: post
UPDATE labels SET bu = 'Key Objectives'
 WHERE key = 'keyobj' AND bu = 'Key Measures' AND grp = 'Key Objective';
