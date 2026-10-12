
### Entering figures from the keyboard (built, on the branch, not merged)
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

### The platform says it has saved (built, on the branch, not merged)
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

### Helicopter view — choose which processes to show (built, on the branch, not merged)
A "Processes" dropdown beside Milestones | Cards: tick the processes you want (ticking a main ticks its subs, search by code or name, Select all / none). It applies to both views and to the PNG download. Unticking only hides it from the picture; nothing is deleted. It starts with everything shown and remembers your choice in that browser. A process that picks up from a hidden one says "from ADM105, hidden". Still to do: look at it on a real workspace.
