/* KEY OBJECTIVES, NOT KEY MEASURES (§623) — per tenant; the frozen stack's 051.
   Islam, of El Abd's shape screen, where the many box for Key Objective read
   "Key Measures" in grey: "key measures is not the default on the
   foundation, it should be Key Objectives."
   WHERE IT CAME FROM: before §392 a client had a group word and a business-
   unit word for each thing, and El Abd's business-unit word for its Key
   Objectives was "Key Measures". 016 kept the business-unit word as the MANY
   and filled the ONE from the platform's default, so the row became the
   mismatched pair "Key Objective" / "Key Measures" — a carry-over, never a
   choice, and with Terminology gone (§621) nothing showed it or could change
   it. Exactly that pair is put back to the platform's word; a client who
   chose its own ONE word keeps both. Written so a second run changes
   nothing. */
UPDATE labels SET bu = 'Key Objectives'
 WHERE key = 'keyobj' AND bu = 'Key Measures' AND grp = 'Key Objective';
