# What to go and check (rule A16)

For the merge that brings the multi-client split to `main`. One line each: what
to open, what to do there, what should happen. **Nothing here can be checked
until `scripts/migrate-to-multi-client.js` has been run against production** —
that is a separate decision, and `rollback.md` is the way back.

## The door

- **Open the main address.** One sign-in card, and nothing else — no cards, no
  tabs, no tables. It asks for an **email**, not a name.
- **Sign in with your email** and the temporary password the migration printed.
  It forces a password change at once, then lands you on **/platform**.

## Forefront's platform

- **Clients.** Four cards — Raya Trade, RHI, El Abd, Demo. Each says its
  industry and **your seat on it**; Demo is marked as the demo.
- **Press Raya Trade.** It opens the platform you know, at `/raya-trade`, with
  everything exactly where it was.
- **The client's name in the top line.** Press it: back to the cards.
- **Consultants.** Three people, their seats listed **read-only**, and a
  password to issue. The seats are set on a client, not here.
- **Press Settings on a card.** The client's name, industry, notes, its
  address (shown, never editable), and its team with a **Super user / SMO
  team** pair per person. Give somebody else Super user: the previous holder
  becomes SMO team in the same press.
- **Who sees what.** One row — everybody who is not the platform admin — and
  four columns. Press a lit half to put a cell back to nothing.

## The clients

- **Open RHI.** Empty, and it opens: no units, no plan, no invented content,
  and no console error.
- **Open Demo.** A full worked example under invented names — **Meridian
  Group**, ten units, thirty-three people — and it **saves**, which is the
  whole point of it.

## What has gone

- **The Demo data button is not there**, on any page, for anyone. The worked
  example is the Demo client now.
- **The tour** offers itself on a plan that has something in it, and the
  Knowledge base's replay button **says why** on one that does not.

## From other branches, in this merge

- **Nothing.** This branch has taken nothing from another session since it
  started; if that changes before the merge, it belongs on this list.
