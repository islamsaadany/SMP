### Entering figures from the keyboard (built, merged to `main` 2026-10-12)
Reporting is a long page of small boxes, and until now the only way through it
was the mouse or the tab key, which stops at everything. Islam asked for all four
of the behaviours put to him, and all four are built.

**Enter moves to the next figure**, Shift+Enter back, skipping the note boxes. At
the last box Enter does what it always did — the box keeps the cursor and the
figure is already saved — because a key that swallows a press and does nothing
reads as broken.

**Alt+Enter is the *Next →* button from the keyboard**, so it skips every box that
is already answered. That is the one that makes a long report feel short rather
than merely shorter.

**Escape puts a box back** to what it held before you started typing, exactly as
it does on the People register, and leaves the cursor where it is.

**The note box is out of the tab path** unless that row is at risk and owes an
explanation — on a nine-row pillar that was nine of eighteen stops spent on a box
nobody is being asked to fill — and **Alt+N** opens the row's note whenever you
want it.

One thing stays exactly as it was: pressing Enter inside a note still makes a new
line. A note is the sentence somebody writes to explain a figure, and it is the
one place in the product where a paragraph is required, so it keeps its key.

**Nothing on any screen looks different.** Every hint rides a hover and the
keyboard-shortcut label a screen reader reads, which is how the hide-row eye and
the monthly mark already work, so there was nothing visual to sign off.

**One real fault was found while building it**: walking past the last box dropped
the cursor onto the page itself, so the final figure of a pillar lost focus on the
one press meant to move it. Fixed, and the check now presses both ends.

The new check is all good and was proved able to fail thirteen different ways;
two of those breaks came back clean and are recorded as such rather than quietly
counted, because the behaviour they aim at is held in two places at once. Six
neighbouring checks and the whole-platform walk (33 viewers, no errors) are green.
Nothing stored moves, nothing is migrated, nobody is signed out, and no rule about
who may save what has changed.

**One neighbour was repaired on the way**: a check about the Enter key had been
pressing a box on a page that does not draw one, so it reported two failures on a
build that was behaving perfectly. It was failing the same way on `main`, so it
was stale rather than broken by this; it now finds the box before it presses it,
and was proved able to fail.

**Next, in Islam's order:** the browser's own pop-up boxes moved inside the
platform (26 confirms, 11 alerts and one prompt); then what a failed save tells
the client; then the dates, which are spelt six different ways.
**Waiting on Islam:** whether a client's own staff get a help page of their own
— the knowledge base is the office's today, so they have none.

### The platform says it has saved (built, merged to `main` 2026-10-12)
There is no Save button anywhere in SMP and there never was one — every box
writes itself the moment the cursor leaves it — and nothing on the screen said
so. A reporter typed a figure, moved on, and had only the absence of an error to
go on. Now one small message sits at the bottom left of every page: **Saving…**
while it goes, **Saved** when it lands, and **Not saved** if it did not. Hovering
**Saved** says what time it last saved.

Four places were drawn for it and Islam chose the bottom left, then asked for it
to stay on the screen while somebody works rather than fade after each box. So
**Saved** fades after six seconds of quiet, and **Not saved** stays until the
platform has actually saved. It says nothing at all until there is something to
say, and it never explains a failure — the red banner that already names the
reason, the reference and the way to put the work back is untouched.

It is drawn from the one place in the platform where a save ends, so there is one
message and no second copy to drift. It is not drawn while presenting, so nothing
appears over a slide in front of a room.

**Two things the checks found, both worth knowing.** **Saved** would have stayed
on the screen for ever: a save that has nothing to send answers *nothing changed*
a beat later, and that answer was cancelling the fade it had just started. And a
save that failed is re-sent every five seconds for as long as the page is open,
so **Not saved** stays whether or not the code tries to hold it there — measured
rather than assumed, and the check now asserts the retry, which is what actually
keeps the message up.

38 checks on the message itself, all good, each one proved able to fail; the
whole-platform walk, 33 viewers, no errors. Nothing stored moves, nobody is
signed out, and nothing but the screen changed.

### The checking round, after bringing main in (done, merged to main 2026-10-12)
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

**Merged to main on 2026-10-12**, on Islam's word. Main had moved while this was being
built, so main was brought in first, the three written records were combined rather than one
side being kept, and the offline file and the four files the live site serves were rebuilt from
the joined-up sources rather than trusted to the merge. Then the whole round of checking was
run again on the joined-up tree rather than on the branch, because that is the only tree
anybody is ever served: the walk of the whole platform came back 33 people, 234 pages, no
errors — main's own figure to the digit, which is what it should be when nothing about the
navigation moved — and every rule check, every save check and every check on the stack the
live site serves came back clean.

**Nobody is signed out by this.** Only two files outside the offline sources changed, both of
them the Copilot's own, and neither touches how a save is judged or what is stored — so a
save that worked before this still works, and no migration runs.

**One check read red before it read green, and it was the machine rather than the product**:
the shell check came back 131 of 141 while three other checks were running beside it, and 384
of 384 run on its own. Those checks each start their own server, so they are run one at a time.

**Seven things are still red and all seven are main's**, each established by running them
against main's own copy before anything here was blamed: three checks and one test that fail
identically there, one whose every file is byte-for-byte main's, and two of the nine database
proofs — one wanting an old-shape database this machine does not hold and saying so itself,
and one whose fixture deletes two tables in the wrong order. That second one is red on main
too, a step earlier, so last week's fix moved its failure along rather than causing it; and it
sits behind the first in the chain, which is why last week's round never reached it. Recorded
rather than fixed inside a merge.

**The one thing not yet done is reading the live site.** This machine's network policy refuses
the production address outright, so nobody here has seen production serve this. What to compare
once somebody can open it is written down in the decisions document, and the branch is
deliberately left one step behind main until then, so the deployment cannot be confused about
which commit it was building.

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
