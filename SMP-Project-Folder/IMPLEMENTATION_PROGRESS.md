### The checking round, after bringing main in (done, on the branch, not merged)
We brought main's latest work into this branch and then checked the whole
platform again — on the combined copy, because that is the only one anybody
would ever be shown. Of the 222 checks, 16 are picture-makers that correctly
refuse to run in a sweep, so 206 are real checks: **191 passed, and all 15 that
did not were already failing on main before this branch existed.** Each one was
opened by hand and run again against main's own build to be sure, because four
of them printed a last line that was not a verdict at all — two of them had
crashed rather than failed.

**One real fix came out of it.** A proof that makes sure one client can never
see another client's data walks every table in turn, and it was stopping at the
Copilot's file table — so most of the tables after it were not being checked at
all. Not a fault in the platform, and not this branch's: it has been like that
since the Copilot's tables arrived and nobody ran that proof again. One line;
it now covers 63 tables instead of 56.

**Two checks were left as they are, and this is the part for you.** They sign in
as the office, then wait for the client cards to appear — and the console now
opens on *My work* instead, which has been the case since 23 September. The
cards themselves are fine: pressing Clients shows all of them, and the server
answers correctly. So the platform is right and those two checks are looking at
the wrong page. Where they should land is a decision about a screen this branch
did not design, so nothing was changed.

Everything else came back clean: the whole-platform walk (33 people, 234 pages,
no errors), the permission rules, the save rules, and every check on the version
the live site actually serves.

**Still waiting on Islam:** whether to merge this to main.

### A capability owner opens on their capability (built, merged to main 2026-10-11)
Viewing as Ehab, the company opened on Performance. It should open on his capability, and now it does: somebody who owns or looks after one capability lands on Strategy › Capabilities with their own capability already chosen. Holding more than one lands on the first of them. The office and a direction's owner still land on Strategy › Plan exactly as before, and anybody offered neither list still lands on Performance. Refreshing the page still leaves you where you were. Nothing stored moves and nobody's access changed.

What to check: viewed as Ehab, press El Abd — it opens Strategy › Capabilities on his own capability; viewed as Amr Hassan — Strategy › Plan with his directions; as the SMO — Strategy › Plan.

### The bar tells a capability owner and a direction owner their own progress (built, merged to main 2026-10-11)

Islam was typing figures into his own capability on the company's Reporting tab and the counter at the top stayed at "0 of 42 · View only". The 42 was never his figures — it is the company's own rows, and a capability's rows are counted on their own rail (the earlier fix today). So the bar now tells a capability owner or custodian, and a direction owner or custodian, their OWN progress: one chip per capability or direction they hold, reading for example "C002 · 1 of 2 entered" and "C002 · Done" once every figure is in, or "D001 · 3 of 5 entered" for a direction. The office and the CEO keep the company's count and the Submit button. Nobody's access changed. A business unit's or a function's own bar is exactly as it was. While building it, a unit's project chip briefly read "Done" for a project nobody had marked done — caught by the neighbouring check and put back.

What to check: Group › Reporting viewed as Ehab — two chips at the top, one per capability, moving as you type; viewed as Amr Hassan — his direction's chip; viewed as the SMO — the company count and Submit, no chips.

### A capability owner reports on the company Reporting tab (built, merged to main 2026-10-11)

Ehab owns two capabilities. The company's Reporting tab now shows him one section called **Capabilities — Key measures and Tactics** (in whatever word the client uses for capabilities), with both capabilities listed down the left side — each with how many figures are entered of how many are asked, and "Still to enter" while some are owed. Pressing one shows its own key measures and tactics on the right with the boxes he can type into. The capability's name is no longer written across the top of the page, and the line that said "Directions" is gone. A direction owner sees no capabilities section. This finishes the earlier fix the same day, where a capability planned in pillars had read "No Projects to report on" and then, once fixed, filled the page with a whole unit's layout.

What to check: Group › Reporting viewed as Ehab — one Capabilities section, two rows on its rail, press each row, type a figure and refresh.

### The top bar goes quiet while you are viewing as somebody else (built, merged to main 2026-10-11)

You asked about the white bar at the top staying there while you view as Amr Hassan. It is not a glitch and nothing is wrong: that bar belongs to whoever is signed in, which is still you, and the box you switch viewers with is in that same row — so a bar that disappeared while a view was on would take away the only way back out of it. What you asked for instead is what is built: while a view is on, the trail (**PLATFORM > El Abd > Strategy**) goes grey, and it comes back to full strength the moment you switch back to yourself. The two dropdowns still open while it is grey, which is the option you picked; the one where they also stopped working was the other option and is deliberately not built, because that is how somebody gets stuck inside a view. One change to the drawing you signed off: the little arrows that say a menu opens keep their colour, because at the grey the drawing used they would have been invisible rather than quiet — so only the two > marks between the words recede. Still to do: twelve checks for the new app could not be run in this session (the database packages are not installed here), and with them the one that proves a client's own staff never see this bar at all — that part is answered in the code in two places and was not run.

### Competitive Discipline — the section's new name (built, merged to main 2026-10-11)
The section that used to read "How we compete" now reads **Competitive Discipline** everywhere a person sees it: the section beside Foundation and SWOT on the top level and on a business unit, the tick on the Structure step, the slide in the review deck, and the Copilot's card, its chat and the title it saves a deliverable under. Nothing stored moves and nothing needs migrating — a deliverable somebody already saved keeps the old title it was saved under, so for a while that one list will show both names. The instructions you wrote for the Copilot already called it Competitive Discipline, so the screens have caught up with them. Still to do: three checks and the typecheck for the new app could not be run in this session (the packages are not installed here), and the changes in those files are only the words.


### Helicopter view — choose which processes to show (built, merged to main 2026-10-08)
A "Processes" dropdown beside Milestones | Cards: tick the processes you want (ticking a main ticks its subs, search by code or name, Select all / none). It applies to both views and to the PNG download. Unticking only hides it from the picture; nothing is deleted. It starts with everything shown and remembers your choice in that browser. A process that picks up from a hidden one says "from ADM105, hidden". Still to do: look at it on a real workspace.
