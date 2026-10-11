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

### Helicopter view — choose which processes to show (built, on the branch, not merged)
A "Processes" dropdown beside Milestones | Cards: tick the processes you want (ticking a main ticks its subs, search by code or name, Select all / none). It applies to both views and to the PNG download. Unticking only hides it from the picture; nothing is deleted. It starts with everything shown and remembers your choice in that browser. A process that picks up from a hidden one says "from ADM105, hidden". Still to do: look at it on a real workspace.
