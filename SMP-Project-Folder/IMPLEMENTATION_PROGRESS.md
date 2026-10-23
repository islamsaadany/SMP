<!-- Entries for 14–23 October were carried here from the repository's own
     IMPLEMENTATION_PROGRESS.md, which was kept current throughout while this
     copy was not. The wording is that log's, condensed; it is not a fresh
     reading of each piece of work. Most of it is other sessions' work. -->

## 2026-10-23

### Insights, Meeting Notes and Portfolio's projects in the Internal Tracker's look (§605) (built, merged to `main` 2026-10-23)
Each opens with the client's coloured panel: the client's name, the page's name and its count, with Insights' categories inside it. Under it are the Tracker's underlined search line and the amber button (New meeting, Start a project). Lists sit under the Tracker's heavy rule: Notes' months are numbered sections, and "Not sent" is a status word rather than a pill that looked pressable. Portfolio's two tables lose their navy band, zebra stripes and box. Every word and control is in the Tracker's typeface; many had been falling back to Arial. On a phone, the counts sit inside the panel, Portfolio's rows fold, and nothing runs past the screen. Processes, the one-line top bar on phones and the Tracker's phone views were drawn but are not built. Mockup: `design-mockups/modules-look/2026-10-23_one-look.html`.

### The client set-up's stale "Seven" comment says three (§544.16) (built, merged to `main` 2026-10-23)
A comment only; the shipped platform file and its two served copies were rebuilt from the source, and nothing else in them moved.

### Every slide table's columns are as wide as what they hold (§604) (built, merged to `main` 2026-10-23)
On every table slide the figures, quarters and status take only the room they need, an owner's name stays on one line, and the columns of words share the rest: on the tactics slide Tactic and Outcome get the most, equal, and the Note no longer keeps a quarter of the slide. Where notes are long they get more room, wherever that makes the rows shorter. On El Abd's tactics slide the Outcome goes from about 150 to over 200 pixels and all six tactics fit on one slide. A slide and its continuation keep the same widths, and the PowerPoint download takes the same widths. Nothing in any cell changes.

### The demo no longer names people and teams that do not exist (§551.4) (built, merged to `main` 2026-10-23)
Five of the demo's "stakeholders" on projects were names nothing in the platform knows: *Finance Department* and *IT Department* (which are simply Finance and IT), *Operations* and *Sales* (departments this client does not have), and *Unit heads* (not a department or a person at all). They are now real units and functions, every one. Shown the four ways to fix it, you chose dropping the three that match nothing and keeping the real stakeholder beside them; the one project whose own title says "in distribution" now says **Distribution**. **Checked four days later before going live**, because the platform had moved 307 times in between: the wrong names were still there, the replacements are all still real, and the live site now serves the fix.

### The console's tabs move into a column on the left (§601) (built, merged to `main` 2026-10-23)
The eight tabs leave the navy bar across the top for a navy column on the left, in the same order, under Work · Team · Knowledge with History alone at the foot. The white line above them goes too: FOREFRONT · Platform heads the column, and your name, role and Sign out sit at its foot. The « button keeps the column to its icons, remembered on that device, and pointing at an icon shows the tab's name beside it. On a phone a menu button opens the same column over the page, in place of the tab bar that scrolled sideways. On tablets and narrow windows (below 1000px) the menu is used too, so the page keeps the full width. Nothing on any tab changes. Checked in a real browser on a phone, a tablet width and a computer: the console's own check is green, and its new lines fail on the build before. Mockup: `design-mockups/left-nav/2026-10-23_left-sidebar.html`.

### The colours on Client set-up take effect again (§600) (built, merged to `main` 2026-10-23)
On the live platform, the first time Client set-up was opened, picking or typing an Accent or Navigation bar colour did nothing: the page redrew itself when the client's details arrived and the colour boxes it put back were connected to nothing. They stay connected now, so a colour applies at once and saves on its own, as everything else does — there is no save button by design. Nothing on screen looks different. Checked on both ends: the new check is green here and red on the previous build; the set-up, console and team checks are green.

### The pages' own building blocks are checked by name too (§599) (built, merged to `main` 2026-10-23)
The strategy pages and the console each build their own named pieces: the save engine, the client set-up screens, the tour, the keyboard sheets and so on. A misspelt call into one of them used to go unnoticed. It is now caught, across 33 of them. It found no existing mistakes. The pages themselves were not changed, so nothing on screen changes and nothing the browser downloads changes.

### The day view reaches the company's plan and every function (§598.1) (built, merged to `main` 2026-10-23)
"As it stood on…" now works on the company's own Plan page and on every function's plan page, whichever way it plans: pillars, projects or objectives. Same link after "See history", same banner, same greyed "Removed since" rows, same "Back to today". The company's page also gets the "Last changed by … · See history" line it did not have. Nothing on screen can be edited while an old plan is shown, and today's plan is untouched. Checked on finance's projects page and on a company plan: the new parts of the check are green here and red on the previous build; the history, hide, save and project checks are green.

### History puts a removed row back in its place, and the Plan page shows the plan as it stood on a day (§598) (built, merged to `main` 2026-10-23)
Two things you asked for. When a row is removed, the change log now keeps the whole row and where it sat, so its line on Setup › History reads "MB01 · measure 2 of 5 → removed" and its Restore works: the row comes back in its old position with its target, its settings and the figures reported on it. A figure changed on a removed row waits until the row is back, and says so. Rows removed before today have nothing saved and keep the greyed button. On a unit's Plan page, beside "See history", the office gets "As it stood on…": pick a day and the same page shows the plan as it was at the end of that day, read only, under a banner that says how many changes came after; rows removed since are greyed and marked. Nothing you see there can be edited or saved, and today's plan is untouched. Not yet: the company's own plan and a function that plans in projects or objectives have no day view. Checked on both ends: the new check is green here and red on the previous build; the history, hide, refused-save and save-banner checks are green; the server tests pass as before.

### A hidden row stays on the slide (§597) (built, merged to `main` 2026-10-23)
Rows hidden with the eye still don't count and reporting still doesn't ask for them. What changes is the presentation: instead of leaving the row out, every slide keeps it where it sits, greyed, with the "Hidden — not counted" label after its name, so the presenter can show the room what was set aside and why. The PowerPoint download does the same, writing the row in grey with the label after the name. Always on, for every presentation. Mockup shown and approved first. Checked on both ends: the hide check asserts the row is on the slide and marked, the score unchanged, and goes red on the previous build; the nine neighbouring deck and PowerPoint checks are green. Not done, waiting for alignment: a way to put back a removed row from History, and a view of the plan as it stood on a given date.

### The technical list of numbered saves is kept for a week (§588.2) (built, merged to `main` 2026-10-23)
The list open tabs read to learn what changed is trimmed on every save to the last seven days; the History page is untouched. A tab older than the list fetches the plan once and carries on.

### The console's routes into the client set-up screens are checked (§596) (built, merged to `main` 2026-10-23)
From the two places the console opens the set-up screens, every route the code can take is followed. Anything that needs a client's data must check first that the data is there. It found nothing unsafe today. Shown with a re-creation of the past Add a client crash: it catches it and names the exact route. One route is declared rather than worked out, with the reason written down; if that code changes, the check fails until someone looks again. Nothing on screen changes. It adds one small tool used only by the check.

### TypeScript's checker on the console page (§594) (built, merged to `main` 2026-10-23)
The console page (My work, the clients, Memory, Copilot, Frameworks, History) is now read the way the browser runs it, alongside the strategy pages. It found no existing fault. It now catches a misspelt function, name or element method on the console, and, most usefully, the client set-up screens starting to use strategy-page data the console does not have, which is how a past console crash happened. It would not have caught that past crash itself, which came from a new path rather than a new name; a check that follows paths is possible and not done. Nothing on screen changes and nothing the browser downloads changes.

### Units and functions each get their own score, on the group and on a division (§593) (built, merged to `main` 2026-10-23)
Where a client has business units, the group page keeps the units' cards and adds a row for the functions — their performance and execution, each function counted equally — with their own where-to-look-next list. A division's headline is now its units alone, with its functions' two cards beside it. The function weight on Setup is gone. A division that held functions is the one figure that moves. Nobody is signed out.

### The new app's code checks its calls into the rules (§592) (built, merged to `main` 2026-10-23)
The newer part of the platform loaded the permission rules, the platform's own rules, the save's change-list reader and the save checker in a way that left every call into them unchecked. It now reads each one's own description and checks every call. It found no existing fault. It now catches a misspelt rule, a missing piece, a permission word that does not exist, and a new file that loads the rules unchecked. Nothing on screen changes. Open tabs are offered a reload once, because one comment line left the rules file.

### The remote works from any page while presenting (§582.2) (built, merged to `main` 2026-10-23)
With the slides up on a second screen or in a window, Page Down / Page Up and → / ← move them from any page of the platform, and T holds or starts their timer. Typing in a box never moves a slide, the tab bar keeps its arrows, and ↑ ↓ keep scrolling the page. The strip on each page names the keys, and the keyboard sheet (?) lists them.

### The company is labelled the company in the Master presentation; a box of capabilities is called that (§591) (built, merged to `main` 2026-10-23)
From the simplification's final test. On a client with business units whose company also plans (Wander), the Master presentation listed the company as a business unit; it reads The company now. And Wander's closing slide, which said 4 Pillars over four capabilities, says Capabilities. Nothing else moves. Nobody is signed out.

### The server notices a misspelt rule name too (§590) (built, merged to `main` 2026-10-23)
The part of the server that decides whether a save is allowed could call a permission rule by a misspelt name and nothing would notice. It is now caught, as it is on the strategy pages. Nothing behaves differently, and no screen changes. Every rule it calls by name already existed.

### TypeScript's checker on the strategy pages (§589) (built, merged to `main` 2026-10-23)
The checker now reads every strategy page the way the browser runs it, as one page that sees the permission rules. It found no existing fault, and every place the pages call a rule names one that exists. From now on it catches six kinds of slip it could not see before: a rule name misspelt, a rule called with a piece missing, two inputs swapped, a misspelt function, a misspelt property on a page element, and a misspelt name. Nothing on screen changes; not a byte the browser receives is touched. The cost: an edit the checker dislikes, even a harmless one, has to be read and settled before the check passes again.

### Other people's saves arrive on the screen without a reload (§588, §588.1) (built, merged to `main` 2026-10-23)
When somebody else saves on the unit you are on, their change now appears on your page by itself: what you have typed stays, nothing asks you to reload, and the only message left is when you both changed the same cell (Keep mine / Keep theirs). Adding, removing or moving a row no longer sends the whole unit, so it can no longer put back a figure somebody else filled meanwhile; and two people adding a row at the same moment no longer get the same row id. **The second step is built too (§588.1):** every save is numbered, and an open tab asks "what changed since my number" and gets back only the change itself, for the whole client at once, instead of fetching the whole plan; a tab that nobody has touched for three minutes asks once a minute instead of every twenty seconds.

### The split setting decides how a presentation groups directions and capabilities (§587) (built, merged to `main` 2026-10-23)
The company-only special case is gone: the setting that shows directions and capabilities apart now decides for any box. Raya and El Abd are unchanged; Wander Development's company presentation, which holds only capabilities, now reads Capabilities instead of Pillars. This finishes the simplification's presentation step. Nobody is signed out.

### Present in a window, for an online meeting (§582.1) (built, merged to `main` 2026-10-23)
For the office, a Present in a window button in the slide view opens the slides in a window of their own on the same screen, named "Slides · <client> · Master presentation", to share in Teams, Zoom or Meet. The laptop keeps the slide view and drives it as on two screens, and its strip says which window to share. Present itself is unchanged. Works in Safari too.

### One template for every presentation (§586) (built, merged to `main` 2026-10-23)
Units, functions and the company now build their presentations from one template in one order — cover, Foundation, Analysis, the plan, Overall performance, notes, Thank you — with only the plan part differing (directions or projects). Nothing changes on screen: every presentation the platform can draw, on six saved states including El Abd and Raya, was compared with what was live, 396 of them, all identical. A new check keeps it one template. Nobody is signed out.

### A trial: TypeScript's checker on the shared rules (§585) (built, merged to `main` 2026-10-23)
The rules that decide who may see and change what are still plain JavaScript, now with type comments the checker reads. Nothing behaves differently, and no screen changed. The checker found no existing fault. It now catches five kinds of mistake it missed before — a misspelt setting, a setting left out of the list the rules read, a person passed where a role is wanted, a permission word that does not exist, and a rule called with a piece missing. Waiting on Islam: whether to carry this to the console's own files, or to the new stack's code that calls the rules.

### The two door-check lines that kept failing (§544.16) (built, merged to `main` 2026-10-23)
They asked for the client set-up's seven steps; since §544 it has three (the client, the shape, the office), and the check was never updated, so it failed on the right page every run. It now asks for the three in order; the door check reads 146 ok, 0 failed, and its seven breaks still go red. No page changed.

## 2026-10-22

### The Copilot line in the console check that kept failing (§538.2) (built, merged to `main` 2026-10-22)
The check asked for Apply to plan to be switched off before a save; since §538 it is held instead — still pressable, saying why in a bubble — and the check was never updated, so it failed on the right page every run. It now asks for the held shape and that a press does nothing; the console check reads 403 ok, 0 failed, and goes red with the guard taken out. No page changed.

### The lines under the two numbers on Where it stands sit beside their figures (§578.1) (built, merged to `main` 2026-10-22)
Each figure now follows its name, in a column just after the longest name, instead of at the far edge of its half; the left half always keeps a clear space before the right half, and a name too long for it is cut short.

### The console's text boxes, client set-up's size band and Frameworks' chips in their declared type (§584.4) (built, merged to `main` 2026-10-22)
Every text box, dropdown and notes box is 14px and 39px tall (was the browser's 13.33px, 33px), the size band in Add a client is semibold and 48px, and Frameworks' chips semibold 12px and 26px. No tab slides sideways and nothing runs past the screen, on a phone or a computer. That was the last of the console's dropped font rules. Mockup: `design-mockups/console-buttons/2026-10-22_text-boxes-and-chips.html`.

### The console's buttons in the weight their style asks for (§584.3) (built, merged to `main` 2026-10-22)
Every console button, Sign out among them, drew at the browser's 13.33px regular because its style was written in a form browsers ignore; it is semibold 13px now, each button 29 → 34px tall and the top line 48 → 53px. No tab slides sideways and no button breaks in two, on a phone or a computer. The text boxes and two small controls with the same fault are left as they are. Mockup: `design-mockups/console-buttons/2026-10-22_button-weight.html`.

### The console's tab names in the weight their style asks for (§584.2) (built, merged to `main` 2026-10-22)
The tabs' style asked for semibold 13.5px in a form browsers ignore, so they drew at the browser's 13.33px regular; it is written so it takes now. The bar is 1px shorter and the eight tabs need 768px instead of 714px. The same fault in the console's buttons, text boxes and two small controls is left as it is until asked. Mockup: `design-mockups/console-tabs-phone/2026-10-22_tab-weight.html`.

### The presenter's clock as time runs out (§580) (built, merged to `main` 2026-10-22)
The clock turns amber and a third bigger from five minutes left, grows again with a slow pulse in the last minute, and goes red, twice the size and pulsing once over. From four minutes over it pulses twice as fast and the slide goes a quarter dark; at five over the slide goes black with the clock still on it. T lifts the dark at once and T again brings it back; the next direction clears it all. On two screens the laptop's strip says when the room's slide is dimmed or dark.

### The console's tab bar and name line on a phone (§584, §584.1) (built, merged to `main` 2026-10-22)
On a phone the eight tabs stay on one line and the tab bar scrolls sideways inside itself, faded at whichever edge has more tabs, with the tab you are on brought into view; the page no longer slides sideways (it was 620px wide at 400). The line above it keeps one line too: Sign out never breaks, the role is left for a wider screen, and a long name ends in … with the whole name on a hover. Nothing changes on a computer screen. Also fixed: My work's four counts line up on a phone. Mockup: `design-mockups/console-tabs-phone/2026-10-22_tabs-swipe.html`.

### Three fixes to the note lock (§576.2) (built, merged to `main` 2026-10-22)
On My reporting, typing a red figure and pressing Tab now always lands in its note (it sometimes landed on Save draft). On a capability's Reporting page the lock's red bar is no longer clipped at the bottom by the pinned project header, and the ringed note box reads "Why, and what is being done" instead of "Note, if there is one".

### My work in the Internal Tracker's look, with the done tick and the status on the row (§583) (built, merged to `main` 2026-10-22)
The console's My work tab now wears the Tracker's furniture: the navy panel with the week, *My work* and the same four counts (the admins' Show picker beside the name), the three groups as numbered sections under a heavy rule, and each row the Tracker's tick · the action · its client · its week · its status · an arrow into that client's Tracker; on a phone a row folds onto two lines. Ticking a row, or choosing a status, writes to that client's Tracker through its own door and its own rule (the owner, or the client's Super user), with the Tracker's history line; the counts drop at once and the ticked row stays, green and saying the day it was done, until My work is next opened. A row the person looking may not change shows the fact without a control. Mockup: `design-mockups/my-work/2026-10-22_tracker-look.html`.

### Presenting on two screens (§582) (built, merged to `main` 2026-10-22)
For the office, with a projector connected as a second screen: Present opens the slides in their own window on the projector, and the laptop keeps the slide view. A strip shows what the room is seeing and the time, and the room's slide is marked ON SCREEN. ← → move the room; T, Y and R work on the room. Clicking a slide shows it on the laptop only; Enter shows it to the room and Esc comes back. On any other page, a strip at the top has ← → T and Back to slides. The projector's window saves nothing and never shows the platform; it asks for one click to go full screen. With one screen, Present is unchanged. Not yet tried on a real projector. The clock's stages (§580, round 2) are drawn, not built.

### R updates the figures while presenting, Y resets the timer (§581) (built, merged to `main` 2026-10-22)
In a presentation, R fetches the latest saved figures and redraws the slides on the same slide, still full screen, with the timer carrying on; a master presentation does it by itself when it moves on to the next direction. The timer's reset moves from R to Y. The clock's stages (§580, round 2) and presenting on two screens (§582) are drawn as mockups, not built.

### Line by line, and where a direction's two readings come from (§574.11, §578, §579) (built, merged to `main` 2026-10-22)
A Line by line switch in the slide view beside Columns (the office's, for every deck of the company): when it is on, the key measures, categories, tactics and projects tables fill one row per press, and Where it stands one reading at a time; ← takes a line back. A direction's Where it stands now lists, under each reading, the lines it is worked out from, with what it leaves out. The guided tour's Where it stands opens clear. The presenter's clock is drawn as a mockup (§580), not built.

### A target by quarter as well as by month (§577) (built, merged to `main` 2026-10-22)
The drawer that opens from the grid mark beside a target has a By month / By quarter switch; By quarter shows four boxes (Q1 to Q4, each naming its months). Switching carries the figures across and the target does not move. A review partway through a quarter owes that share of it (a cycle ending in August owes Q1, Q2 and two-thirds of Q3). Performance says *by quarter* under the annual target, and the workbook carries Q1 target to Q4 target after December — an upload with both months and quarters on one row is refused by name. Also fixed: the grid mark now lights as soon as a figure is typed, not only after leaving the pillar. Rows with no plan, or a monthly one, read exactly as before.

### A tactic counted in numbers says Completed only at its full target (§575) (built, merged to `main` 2026-10-22)
A tactic running Q3–Q4 with a target of 10 had 5 due by the end of September; its owner reported 8, and the platform marked it Completed because 8 is ahead of the 5 due. It now says Completed only when the figure reaches the whole 10, so that row reads In progress with its 150%. Rows already saved the old way read right straight away; nobody re-enters anything. Yes/no outcomes, tactics with no outcome and "at most" targets read as before. Checked: a new check, green, and red ten ways on the build before; the neighbouring tactic checks green, two older failures the same on the build before. **Merged to `main` 2026-10-22 on Islam's word.**

### A red figure gets its note before anything else (§576) (built, merged to `main` 2026-10-22)
On every Reporting page, the moment a figure lands in red with no note, every other box greys out and stops taking typing; only that row's figure and its note stay open, and the cursor goes to the note. A red bar where the "to finish" bar sits names the row, with Go to it, which opens the right pillar or project and lands in the note. Writing the note, or correcting the figure out of the red, opens the page again. Save draft and Close still work. On My reporting the tactic's owner now has a Note column and writes the note on their own red rows. Found and fixed on the way: with tactic owners switched on, the server refused the unit's custodian and head the note on a line someone else owns, although the page offered it; now the owner or the unit may write it. Checked: a new check across the pages, red 33 ways on the live build; the server tests; the neighbouring reporting checks green, two of them rewritten for the new behaviour. **Merged to `main` 2026-10-22 on your word**, together with the quarterly targets another session had merged first. Mockup: `design-mockups/note-first/2026-10-22_note-before-anything-else.html`.

### The guided tour opens on the cover clear before lighting it (§574.10) (built, merged to `main` 2026-10-22)
Pressing Guided tour now shows the made-up direction's cover as the room would see it; the next press lights it with the first card.

### The guided tour ends on what the platform is for, and its cards are bigger again (§574.6–§574.9) (built, merged to `main` 2026-10-22)
A last slide in the example: One source of truth, Visibility, Accountability, History that stays, in big titles with a short line under each, brought in one per press with nothing dimmed (not toured); the closing card then reads Now, today's review, and is the biggest card in the tour; every card is a size up for the projector. Mockup: `design-mockups/guided-tour/2026-10-22_purpose-slide.html`.

### The guided tour's cards are bigger for the projector, and its clear views name the slide (§574.4, §574.5) (built, merged to `main` 2026-10-22)
On the key measures and tactics slides' clear views the title is ringed, its name turns gold, and a label in the corner reads KEY MEASURES, the results we committed to, or TACTICS, the work that delivers them. The cards' text now grows with the screen as the slides do: about 25px at 1920 (was 16px), 18px on a laptop. On the cover the lit area is the words themselves, so the card stands beside it rather than over it.

### A guided tour on a made-up direction, from the Presentation menu (§574–§574.3) (built, merged to `main` 2026-10-22)
Presentation → Guided tour, under Master presentation and for the same people, opens a made-up direction (EX001 Growing the Restaurant Business, never saved, its cover saying the figures are made up) full screen with the tour on: the slide dims and one part at a time is lit with a card — the key measures' target, actual, progress and note; the tactics' quarters, status, DELAYED, YTD actual and progress; and the two readings on Where it stands. Its measures span all three bands and its tactics read Completed, Delayed, on track and Not due at whatever point the cycle stands. The key measures and tactics slides each open on the whole slide clear, walk their parts, and close clear again; after the Note the key measures light one whole line, the one furthest behind; on the tactics, YTD actual and Progress come before Delayed; the example's slides have no Owner or Collabs. columns. Finish returns to the platform. The first build's picker in Master presentation is gone. Mockup: `design-mockups/guided-tour/2026-10-22_made-up-direction.html`.

### Units are a little smaller than their number and in dark grey, dollars are written in front, and the unit list is shorter (§573) (built, merged to `main` 2026-10-22)
Everywhere a figure is shown — the slides, Performance, Reporting's target column and the plan pages — the unit (EGP, %, #) is a little smaller than its number and dark grey; inside the grey "due" line it takes that line's grey. K, M and B stay full size because they are part of the amount. Dollar figures read $2M and $800K. The unit list for new rows is %, #, Y/N, EGP, M EGP, B EGP, $, $K, $M, $B: SQM, d and h are gone, and rows that already use them keep them. Nothing saved changes, only how it is shown. The PowerPoint download writes the unit smaller and in dark grey too.

## 2026-10-21

### A cleaner tactics slide, and Performance to match (§572) (built, merged to `main` 2026-10-21)
On the tactics and key measures slides and on Performance's two tables: tactic and key measure names are bold and the outcome is regular; the status sits in a pill with a red dot and DELAYED under it when late; what is due shows under the actual as "due 100%" or "due 50%" instead of "35% / 100%" beside it; and Progress is bigger. DELAYED is regular weight, not bold, so the pill leads, and on the slide it sits centred under the pill as on Performance. The key objectives slides show "due" the same way, and the PowerPoint download follows. No figure or score changes; Reporting and the plan download are untouched. Checked: the checks that described the old layout were rewritten and each fails on the live version; the neighbouring checks are green. Anyone with the platform open is asked to reload once; nobody is signed out.

### A tactic's status says what is really happening, with Delayed under it; numbers in YTD actual; Status on the slides; and a switch to hide Owner and Collabs. (§571) (built, merged to `main` 2026-10-21)
On Performance a tactic's status is now one of Completed, In progress (yellow), Not started or Not due, always in its own colour, and a late tactic gets a red DELAYED under that word. Late means its whole time is over and it isn't finished, or it was reported still at 0% after its first quarter. YTD actual shows a number instead of a word (35% / 100%, 0%, 100%), so it no longer contradicts the status. The tactics slide gets the same Status column, and the PowerPoint download follows. A new Columns menu in the slide view, for the office, hides Owner and Collabs. on every tactics slide of the company at once; the plan download keeps them. Reporting is unchanged and no figure or score moves. Checked: two new checks and one server test set, each failing on the live version and passing on this one; the neighbouring checks are green. Anyone with the platform open is asked to reload once; nobody is signed out.

### With no business units, the first button is called Strategy and the tab under it Plan (§570) (built, merged to `main` 2026-10-21)
El Abd's first button carried the company's name, which read as one more place beside its own functions. Islam turned down "Company" and "Overall" for the same reason (the functions are the company too) and chose Strategy, with the tab under it renamed Plan so the two do not repeat: Strategy › Plan › Directions, Strategy › Performance, Strategy › Reporting. The function tabs keep their own Strategy tab; clients with business units read exactly as before; it is still the page the platform opens on. Open tabs get the reload banner; nobody is signed out. The company's name stays where it names the place rather than the button (the rails, the board, Home's links).

### Smaller target on the slides, categories as Target and Actual, and a monthly plan that overrides the even spread (§568, §569) (built, merged to `main` 2026-10-21)
On the key measures and tactics slides the target after the slash is now set smaller than the figure, so the actual leads; the PowerPoint download does the same. The categories table on Performance and on its slide now reads as Reporting does: for each column its target, then the actual coloured by how it is doing, with no slash between them. And a row with a monthly plan is now measured against its months from the first one typed: an empty month counts as nothing planned, so New Shop Openings (2+2+2+2+2+3 for January to June) is owed all 13 by September and 14 reads 108%, where it read 9 and 150%. The sentence under the monthly plan says so instead of "still spread evenly". A full twelve-month plan reads exactly as before, and nothing stored changes. Checked: the three changed checks are green and each fails on the version before; the neighbouring checks are green, one red that was already red before; the whole-platform walk is clean for all 33 people. Anyone with the platform open is asked to reload once; nobody is signed out.

### The Tracker's add line goes back to This week and you after every add (§567)., merged to `main` 2026-10-21 on Islam's word (built, merged to `main` 2026-10-21)
Before, if you picked another week or person on the add line, the next action you typed went to the same week and person unless you noticed. Now each add leaves the line on This week and you; a topic you picked still stays, as before. The Tracker check is fully green again. Nobody is signed out.

### The Internal Tracker: the white top bar stays put too, no count line, tabs that filter in place (§566)., merged to `main` 2026-10-21 on Islam's word (built, merged to `main` 2026-10-21)
On the Tracker everything from the platform's white top bar down to the add line now stays at the top while the list scrolls (on a phone nothing is pinned, as before). The "14 actions on this week" line under the add line is gone, since the navy band already counts; it also gave the number of matches while searching, and that goes with it, as agreed. This week, All, Mine, Undated and Weekly check now switch the list in place: the tab lights at once and the list follows without loading a new page, and Back returns to the previous tab. Checks prove each and go red without it. Nobody is signed out.

### The Internal Tracker: people by their Name, the top stays put, a roomier rename box (§565) (built, merged to `main` 2026-10-21)
Everywhere the Tracker, Notes and Portfolio print a person, they now use the Name from the People register — what was typed there, or the first two names — instead of the full official name, so a heading reads "Noran Essam" rather than her whole name, and somebody given a different Name on the register is called that. On the Tracker the navy band, the add line, the search and the count stay at the top while the list scrolls (as in the approved mockup; on a phone they scroll away as before). Renaming an action by double-click now gives a box as wide as the name's space instead of a narrow one that hid the end of a long name. Checks prove each of the three and go red without it; one older Tracker check was already failing before this and is noted, not touched. Nobody is signed out.

## 2026-10-20

### The plan download is the presentation without its figures (§564) (built, merged to `main` 2026-10-20)
Download the plan now gives the presentation's own slides, in the same order, with every reported figure taken out, as an editable PowerPoint. El Abd's company plan, which made no file before, now downloads. Kept: directions not running yet with their years, tactic requirements, and the red Missing marks. No longer carried: a measure's direction and compile rule, and a capability set up apart (it has its own slides). Nobody is signed out.

### The People register names where somebody sits in the client's own word (§563) (built, merged to `main` 2026-10-20)
The register headed that column "Unit" for every client, so El Abd, which only has functions, read as if its people were in units. It now follows what the client has switched on: El Abd reads **Function**, a client with only units **Unit**, and Raya and RHI, with both, **Unit or function**; a word the client typed in Terminology is used instead. The same word is on the column chooser, the person's dialog, the merge card, the Company hover and the role list's "set the … first". Wording only: nobody moves, nothing is saved differently, the upload file keeps its columns. A new check proves it and fails 25 ways on the build before. Pages only: nobody is signed out.

### Slide limits, and Slides as the one word (§562) (built, merged to `main` 2026-10-20)
A direction or capability can add 2 slides; a unit, a function or the company's closing slides 4, whoever adds. The add shows how many are used and explains a refusal; slides already there stay. The button that opens a unit's, function's or direction's own slides now reads Slides everywhere (Present stays for people who can only watch), and an owner of two directions gets a Slides line for each — before, they got nothing. Nobody is signed out.

### No title over the company's Directions and Capabilities lists, and Slides at the far right (§561.1) (built, merged to `main` 2026-10-20)
The list's own head already names it, so the title above it went; the Slides button now sits at the right edge of the direction's bar. Pages only: nobody is signed out.

### A Slides button on each direction and capability (§561) (built, merged to `main` 2026-10-20)
The strategy office had no way into one direction's own slides — only the Master presentation. Each direction and capability on the company's Performance page now carries a Slides button, for the office only, that opens that one's own slides; what is added there shows in that direction's part of the Master presentation, which stays for order, timers, hiding and presenting, and keeps its own "+ Add a final slide". Checked on El Abd's plan; a new check proves it and fails on the build before. Nothing about saving changed, so nobody is signed out.

### The Edit button is back on the company's Capabilities tab (§560) (built, merged to `main` 2026-10-20)
Since El Abd's capabilities were moved into the company's own plan, the Capabilities tab next to Pillars drew no Edit button for anybody — the Super user included, not only the SMO team. The new tab had simply never been added to the list of tabs that get one. It is now: one Edit opens Pillars and Capabilities together, exactly as the other tabs on that page work, and nobody who could not edit before can now. **Checked** in the real page as the Super user and as an SMO team member: the button is there, pressing it opens the capabilities, and a typed change is saved into the plan; the CEO and a capability's owner still get no Edit. A new check proves it and fails on the build before. It came in alongside somebody else's presentation work that had just landed on `main`; the whole-platform sweep came back with no errors across 33 people and 181 pages. Nothing about saving changed, so nobody is signed out; a tab left open will show the reload banner.

### Reporting fits a phone (§559) (built, merged to `main` 2026-10-20)
On a phone the Reporting page was more than twice the screen's width, so it slid sideways and Submit sat off the edge. Now nothing slides: the Reporting bar takes its own line under the tabs, with the count above Submit, Save draft and Close; the band over each row wraps, with its counts under the name, and scrolls with the page instead of staying pinned; the top bar takes two lines and keeps both names whole. The top bar and the band behave the same way on every page that has them, on a phone only. Desktop is unchanged, compared pixel for pixel. Pages only: nothing about how a save is judged changed, so nobody is signed out.

### A role over its own thing names itself and stops; the top level is called what you call it; and the roles read in your order (§558) (built, merged to `main` 2026-10-20)
Three things. **One:** on Home, the chips under your name. A **Capability owner** now reads just that, with no capability named after it, and a **Direction owner** reads just that, with no "the group" — and a capability's **Strategy custodian** reads the same way. A **unit** custodian and a **function head** read exactly as before: their place is still named, because for them it says something the role name does not. A **direction's** custodian needed nothing; being named one already makes them a direction owner. **Two:** the top level is called a **company** on your tenant, and four places still said "the group" as a fixed word — every role chip, the place list, the sentence a refused role pick shows, and the one answer the switcher offers for a seat role. They now read the terminology row you can already set. On the default word nothing moves; a tenant that has not set it reads "the group" exactly as before. The people workbook still accepts the old wording as well as yours, so nothing you have already downloaded stops matching. **Three, and this is the one you asked for last:** your roles now list in the order you gave — **seat, unit, direction, capability, project & pillar, function**. It was that order already except that *function* and *direction* were the wrong way round, so it is one swap of two blocks. It moves no permission: nothing reads the first role or takes a first match, which was measured and not assumed. Where it mattered is that Home draws only the first three roles — with direction last, somebody holding four roles did not see *Direction owner* pushed to the end, they did not see it at all. **Checked:** one check drives the real strip in the real page, 33 assertions none failing, and it was proved able to fail twice and separately — 10 red against the build before the chip and wording change, 3 red against a build with only the role order put back. Three neighbouring browser checks (173 assertions) and the platform rule suite are green and unmoved. **One red is main's, not this branch's, and is reported rather than fixed:** the rule suite comes back 1,097 passed and **3 failed**, identically with main's own untouched copy. A commit on main dropped the guard that stopped a **Direction owner** being derived while the business units are on — §505 says that must never happen. It could be a regression or a deliberate change whose tests were not updated; those lead opposite ways, so it needs your word. It sits in the exact rule this work's direction chip reads. **Two more of main's reds turned up beside it**, also unchanged here: one app-side suite is 129 passed and 3 failed, and another does not finish at all. All three behave the same with main's own untouched files. Said plainly: **main is not green today, in three separate suites.** **One thing the reorder did make necessary:** the server keeps its own copy of the rules file, nothing automates copying it, and the check caught it stale right after the merge — left alone, the server would have used the old order while the browser used the new one, silently. It is re-carried and the two now match byte for byte. **Renumbered §534 → §558** on the merge: main took §534 twice in the twenty-three sections it moved while this sat unmerged. **On the merge:** the whole-platform sweep came back with no errors across 33 viewers and 181 destinations, and the offline copy's name was bumped so a returning browser fetches the new platform rather than its own disk — a tab left open will show the reload banner. Nothing about saving changed, so nobody is signed out. **Main still carries the three red suites above unfixed**, including the one in your direction rule; the merge did not touch them and the first still needs your word. **Seen live:** about seventy-five seconds after the push, production was serving it — the platform file it runs from is the same size as the one built here, down to the byte, and all three changes are in it. **Not yet seen in a browser by you.**

## 2026-10-19

### Categories on Reporting read as Target and Reported (§557) (built, merged to `main` 2026-10-19)
On El Abd's Reporting, D001's Categories table put the box you type into and its target (`/ 13%`) together in one column, with the `%` fallen out of the box into a grey strip under it. Now each column of a categories table is two: the target as a plain figure, headed by the column's own name (*Target Mix% ≥*), and the box beside it under *Reported* — the way the Key Measures table above it already reads — with the `%` back inside the box. A table with several columns gets one target-and-reported pair per column. Nothing else changes: the same figures, scores, tallies and notes; Strategy, Performance and the slides are untouched; nobody is signed out. Rows are shorter too (88px to 55px). Checked: the categories check now tests the new layout and fails on the old one; the other Reporting checks pass exactly as they did before; the whole-platform walk is clean for all 33 people.

### El Abd's Reporting: directions and capabilities on one rail (§556) (built, merged to `main` 2026-10-19)
As the SMO, El Abd's Reporting drew the directions and the capabilities as two blocks, one under the other, each with its own rail and open pane, so the capabilities started well below the first screen. Now all ten sit in one rail, Directions first and then Capabilities, each under its own label, with one pane beside it, under one heading: *Directions and Capabilities*. The red "still to enter" lines of every row stay in view together, and the bar's jump buttons land on the one rail. Nothing else changes: Strategy keeps its two tabs, Performance is untouched, an owner of one half still sees only their half, and every business unit reads as before. Checked in the browser as the SMO on a company set up like El Abd and on a unit set apart; the related checks are green, and the whole-platform walk is clean for all 33 people. Nothing about how a save is judged changed, so nobody is signed out.

### The target is what the months come to, from the first one you type (§555) (built, merged to `main` 2026-10-19)
You were four months into a monthly plan and the Target box still held the figure you had typed, so the same number was being entered twice with nothing checking that the two agreed. Now the moment you type the first month, the Target box fills itself with what the months so far come to — added up, averaged, or the last one, whichever that row's compile rule says — and it stops taking typing for as long as there is a monthly plan on the row. Delete a month later and the target follows the ones that are left. Clear the whole plan and the box is yours to type again, keeping the last figure the months came to. **What has not changed:** until all twelve months are filled, the row is still measured flat across the year, because a month left empty is a month nobody has planned yet, not a planned nought. The drawer under the row says both things in words. Two smaller things came with it: picking the compile rule after the months are typed now works out the target straight away (before, it sat on the old figure, and with the box locked nobody could correct it), and the sentence at the bottom of the drawer was missing a space in the twelve-of-twelve case — it read *"12 of 12 months setAdds up to 300M EGP"*. Checked: the monthly plan's own check is green at 67 assertions, 10 of them new, and was broken on purpose four ways to prove it catches each part; the neighbouring checks are green; the whole-platform walk is clean for all 33 people with no errors. One check reports the `#` column's marks a hair off centre — that is the same on the version before this and is noted rather than changed. **On the branch, not merged** — the merge is your word.

### Viewing as is the SMO team's too, up to their own seat (§554) (built, merged to `main` 2026-10-19)
The **Viewing as** dropdown was the Super user's alone; the SMO team has it now, on both bars — the Strategy top bar and the shared one the modules draw (Insights). Their list is the whole register **except the Super user**: a view hands you the rights of the person you look through, and the Super user is the one person on a client's register holding more than the team does, so looking through them would have been a way up rather than a simulation. Islam picked that over the whole register and over a look-only Super user view, with the cost of each put to him first. **It also closed a leak nobody had reported:** the People register's row menu already offered *View the platform as them* to the team — Setup is the office's — and pressing it changed the screen while their saves went on being judged as themselves, which is §185's fault on the one path that never asked. Measured on the build before, not argued. Checked: the shared rule green 33 ways and red four (one break puts the escalation itself back), six new assertions on the save path (1097 passing), and a **new browser check** that signs in as an SMO team member and presses the real controls — green here, 7 red on the build before. The four neighbouring browser checks stay green.

## 2026-10-18

### An owner is chosen from a list, never typed (§551, §551.1, §551.2, §551.3) (built, merged to `main` 2026-10-18)
A direction on El Abd was owned by *"Tamer Abdelhamid"* while the register says *"Tamer Abdelhameed"* — a different spelling, so it matched no real person, and an owner who matches nobody cannot enter their own figures. **The plan screens already picked from a list**, which was worth measuring before building anything; three places did not. **The builder** — the way plans are actually written — had five plain boxes asking "Who answers for it", now dropdowns of your register. **The Copilot's draft plan** had the last typed box; it picks too. **Collaborators and stakeholders** are the same list, several at a time, searchable: a stakeholder is a unit or a person in your own words. **A name that matches nobody is flagged where it shows, never deleted** — the name is the only clue to who was meant. The spreadsheet got dropdowns and refuses a typed name on upload, though you have since said the sheets are not how you build, so that part guards a side road.

### The change log remembers the filters you set (§550) (built, merged to `main` 2026-10-18)
Setup › History had four dropdowns — person, place, kind, when — and all four went back to Everyone / Everywhere / Every kind / Today every single visit, so anyone who checks one person's changes every Monday set all four again every Monday. They now come back as you left them. **The search box deliberately does not**: choosing a person and a window is a decision you made; half a word left in a search box is not, and a page quietly filtered by text you do not remember typing reads as a fault. And a saved filter naming somebody who has since left the register is dropped rather than carried, so the screen can never say "Everyone" while asking the server for one person.

## 2026-10-15 — Processes: Risks & controls and Quality tabs (§538)
**Built, merged to `main` 2026-10-15.** (This block read *"Built (branch, not merged)"*
until 2026-10-23: the work had been on `main` since the day it was written and the
status was never updated. Corrected and named rather than realigned silently.)

On a process page, the Risks & controls tab lists risks with their control, owner and last test, flags risks and steps with no control, and lets the office add or delete them; the Quality tab records non-conformances and moves them open → in progress → closed. Two new tables, applied automatically at deploy. **Next:** staff Reader view with Acknowledge, then People tab, Governance, list columns. **Waiting on Islam:** the merge, and a look at the two tabs in the browser.


## 2026-10-14

### Internal Tracker: the weekly check, and every topic reachable (§532, §533) (built, merged to `main` 2026-10-14)
A fifth view, **Weekly check**, built for the Monday meeting: always read by topic, three weeks deep. Inside each topic, last week, this week and next week each get their own card — this week's lit in gold, next week's an outline — and next week's card holds a write line already set to next week, so the next action is written where you are instead of at the top of the page. A line that did not get done is **carried to next week in one press**, as the same action: its notes and history ride with it and the late mark goes on climbing, so nothing can hide behind a fresh date. A topic with nothing this week is still on the list and says so, rather than being skipped in silence. Separately, **Topics** behind the ⋯ lists every topic on the client — including ones with no actions and closed ones, which could not be reached from the page at all — and a name is renamed by typing over it. Nothing new is stored: no table, no column, no migration. Checked: 96 tracker checks green before the database sections, 31 of them new, each rule broken on purpose four ways to prove the checks catch it; the page rendered and the script driven in Chromium (31 assertions), which caught two faults reading the code had not. **The database sections of the tracker check were NOT run — this container has no Postgres**, so that is said rather than claimed.

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
