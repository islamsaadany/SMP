# 027 · A link in an email has nothing to be relative to

**Version:** v3.65 · **Decisions:** §176 · **Status:** answered; built

Islam, having sent himself a message with a button and pressed it — macOS:

> **The application can't be opened. −50**

Asked for the link, he pasted it:

> `smp-orpin-tau.vercel.app`

---

## 1 · What went wrong

That is what he typed into the composer's button-link box, and the platform
mailed it verbatim.

A **browser** forgives a missing `https://` because it has an address bar to
guess with. An **email** has no base document, so there is nothing for a
relative link to be relative *to*: the mail client hands the raw string to the
operating system, macOS looks for a file of that name, and answers `-50`.

The button was dead for **every recipient**, not only for him, and nothing
between typing it and sending it said so.

Three things were wrong, and the third is the one that let the first two live:

1. The typed link was never completed or checked — client or server.
2. The **test email** falls back to `href="#"` whenever the platform does not
   know its own address. On a page `#` is a quiet no-op; in an inbox it is the
   same `-50`.
3. The two emails this product sends disagreed about where "the platform" is:
   `commsShape()` said `origin + "/"` (the **sign-in gate**) and `chat.js` said
   `origin + location.pathname` (the **platform**). Two builders, one question,
   no shared answer — §53.5 with an inbox on the end of it.

---

## 2 · What counts as a link

`SMPRules.webUrl(raw)` in `lib/rules.js` — the shared module, because the
composer completes and the server refuses, and a screen that tidies a value the
server judges by a different rule is §42's drift with an inbox on the end of it.

| Typed | Becomes | Why |
|---|---|---|
| `smp-orpin-tau.vercel.app` | `https://smp-orpin-tau.vercel.app` | a host, completed |
| `www.a.b/c?d=1` | `https://www.a.b/c?d=1` | a host, completed |
| `//x.io` | `https://x.io` | protocol-relative resolves against nothing in mail |
| `https://…` / `http://…` | unchanged | already an address |
| `javascript:` · `data:` · `mailto:` | **refused** | not a link to the platform |
| `/raya-trade` | **refused** | a path points at nothing once the message has left |
| `click here` | **refused** | not an address at all |

**Completing is not guessing.** `https://` is added only where what is there is
already a host — a dot, no whitespace, no scheme of its own. Everything else is
refused rather than decorated, because inventing an address is how a message
goes out pointing somewhere nobody meant.

**Only http(s) survive.** A scheme the product never sends is not one it should
carry: this same string is rendered into the platform's own live preview, which
is a page (§43.6).

---

## 3 · Where it is asked

| Where | What happens |
|---|---|
| The link box, on **blur** | A completable value is completed **and written into the field** — seeing `https://` appear *is* the explanation (§124). Never on `input`, or the scheme lands in front of the third character typed and the caret sits behind it (§35). |
| **Send**, before the confirmation | A value no tidying can rescue refuses the send, naming what to do. Before the confirmation, because that is the last moment it can still be stopped. |
| **Send me a copy** | The same refusal, in the same words — a copy that quietly dropped the button would be a preview of a message nobody can send. |
| `api/mail.js`, on `send` | Asked again. A guard that only lives on the screen is decoration (§42, §44, §98.2), and this is the side that actually sends. |

**What the server guard does not claim.** The `html` is built by the page and
posted whole (§72.3), so it checks the link the composer says it used — not
every href inside that document. It stops the product sending a dead button,
which is the fault. It is not a sanitiser.

**The record stores the completed link**, because the Overview reads it and a
re-opened draft puts it back in the composer.

---

## 4 · One answer to where the platform is

`commsShape().href` is `origin + location.pathname` — the platform, which is
served at `/raya-trade` (§35.6), not the gate at the root. `chat.js` asks it
rather than keeping its own copy.

**Empty where there is no address to give.** Opened from a file, `origin` is
the string `"null"`, and a link built on that is worse than no link — so every
caller draws **no button** rather than a dead one, and `sampleFor` no longer
substitutes `#`.

---

## 5 · Proof

`SMP-Project-Folder/src/checks/email-link.py`, over HTTP because this whole
surface is the empty state over `file://` (§94.11).

It asserts **the link that leaves**, read out of the html actually posted to
`/api/mail` — never the value in the box, which is what looked right the whole
time. Both surfaces, both ends of the refusal (it says so **and** nothing
goes), and both emails' destination.

**Proved able to fail (§94.5): 18 failures against the previous build**, among
them `and it is absolute — ['smp-orpin-tau.vercel.app']` — the reported fault,
reproduced.

---

## 6 · Not done

- **Messages already sent keep their dead button.** Nothing can recall them;
  the recipients need telling, or the message re-sending.
- The **live preview** still draws its button from the raw box while somebody
  is mid-type. It agrees with what is sent after blur, and the send refuses
  what cannot work, so the preview is never a picture of a message that goes.
- The server checks the link the composer declares, not the posted html (§3).
