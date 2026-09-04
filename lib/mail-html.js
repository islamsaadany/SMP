/* ══ THE EMAIL THE PLATFORM SENDS (§72) ═══════════════════════════════════
   Islam: "I need to have a test email send to see the design of the email and
   the sender of the email name etc."

   ONE FUNCTION BUILDS THE HTML, and the preview on the setup page and the test
   send are the SAME call — a preview drawn from anything but the real builder
   is a picture of an email nobody will receive (§50's rule about the deck,
   one medium further out).

   EMAIL IS NOT THE WEB, and the whole shape of this file is that sentence:

   · TABLES, NOT DIVS. Outlook renders through Word, which has no flexbox, no
     grid, and no reliable `max-width` on a block. A table with fixed widths is
     the only layout every client agrees on.
   · EVERY STYLE INLINE. Gmail strips <style> from the head on some clients and
     keeps it on others, so a design that depends on it is a design that is
     right half the time.
   · NO DATA-URI IMAGE, and this is the one that cost a decision. The tenant's
     mark is stored as a data URI (§52) — and Gmail and Outlook BLOCK data-URI
     images outright. An <img src="data:…"> is not "sometimes hidden"; it is a
     broken-image box in the clients most people read mail in. So the header is
     TYPOGRAPHIC: the organisation's name set in the tenant's own accent
     colour. To carry the real mark, the platform would have to serve it from a
     URL an email client can fetch unauthenticated — which is a decision about
     making a logo public, and it is Islam's to make rather than mine to
     assume.
   · COLOURS ARE LITERAL. No custom properties: `var()` is not supported in
     most mail clients, so every colour is written out.
   ──────────────────────────────────────────────────────────────────────── */
/* ── ONE BUILDER, RUN ON BOTH SIDES (§261.2, §42's rule applied to an email) ──
   This was `src/mail.js`, a browser file, because the office composed a reply
   and the browser built the html to go with it. The ten-minute collection
   sends LATER, from a request nobody's composer is attached to, so the server
   has to build the same message — and a second builder is a second answer to
   "what does our email look like", which is the drift lib/rules.js exists to
   prevent. Moved rather than copied: build.py inlines this file exactly as it
   inlines the rules, api/chat.js requires it, and there is one shape.

   The BODY of the file is unchanged from the day it was written. */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory();
  else root.MAIL = factory();
})(typeof self !== "undefined" ? self : this, function(){

  /* Email has no esc() to borrow and its own reasons to want one: a subject or
     a signature is typed by a person, and it lands inside markup. */
  function e(s){
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  /* A typed paragraph becomes paragraphs. The composer is a textarea, so the
     line breaks somebody put in are the only structure the message has —
     §51.1's lesson (a paragraph typed as two must read as two), in a medium
     where `white-space:pre-line` is not dependable. */
  function paras(text, colour){
    var blocks = String(text == null ? "" : text).split(/\n{2,}/)
      .map(function(b){ return b.trim(); }).filter(Boolean);
    if (!blocks.length) return "";
    return blocks.map(function(b){
      return '<p style="margin:0 0 16px;font:400 15px/1.6 Helvetica,Arial,sans-serif;' +
        'color:' + colour + '">' + e(b).replace(/\n/g, "<br>") + '</p>';
    }).join("");
  }

  /* The tenant's own accent, falling back to the house gold. Read from
     branding where the tenant has set one, so an email looks like the platform
     it came from rather than like a different product. */
  function accentOf(o){
    var a = String((o && o.accent) || "").trim();
    return /^#[0-9a-fA-F]{3,8}$/.test(a) ? a : "#B8862B";
  }
  function panelOf(o){
    var p = String((o && o.panel) || "").trim();
    return /^#[0-9a-fA-F]{3,8}$/.test(p) ? p : "#16325C";
  }

  /* ── A COLOUR THAT WORKS AS A FILL USUALLY FAILS AS TYPE (§38.4) ──────
     Written first with the accent as the kicker over the panel, which measures
     3.94:1 on the house pair — the same trap this project has walked into five
     times, and the first version of this file walked into it again. The accent
     moves to a BAR, which is a fill and has no ratio to meet, and the kicker
     takes the panel's own ink softened toward it.

     AND THE INK IS DERIVED, NOT ASSUMED. `--panel` is whatever Branding sets,
     so white-on-panel is only safe while the tenant keeps a dark bar. The
     platform derives `--panel-ink` for exactly this reason and an email cannot
     read a custom property, so the six lines are here. */
  function rgbOf(h){
    h = String(h || "").replace("#", "");
    if (h.length === 3) h = h.charAt(0)+h.charAt(0)+h.charAt(1)+h.charAt(1)+h.charAt(2)+h.charAt(2);
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return [22, 50, 92];
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  }
  function lumOf(c){
    var s = c.map(function(v){ v /= 255;
      return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); });
    return 0.2126*s[0] + 0.7152*s[1] + 0.0722*s[2];
  }
  function hexOf(c){
    return "#" + c.map(function(v){
      var x = Math.max(0, Math.min(255, Math.round(v))).toString(16);
      return x.length < 2 ? "0"+x : x;
    }).join("").toUpperCase();
  }
  function inkOn(bg){ return lumOf(rgbOf(bg)) > 0.42 ? "#111A28" : "#FFFFFF"; }
  function mix(a, b, t){
    var A = rgbOf(a), B = rgbOf(b);
    return hexOf([0,1,2].map(function(i){ return A[i]*(1-t) + B[i]*t; }));
  }

  /* ── THE GREETING (spec 022) ────────────────────────────────────────
     Islam: "customize the email by the first name of the receiver like
     starting the email with Dear Ahmed and then the body comes after."

     IT IS THE FIRST PARAGRAPH OF THE BODY, in the body's own type — not a
     heading and not a styled banner. A greeting that wears a different size
     from the sentence after it reads as a label on the message rather than as
     the opening of it.

     TWO MODES, ONE FUNCTION. Given a `name` it writes it (the composer's
     preview, and the copy the sender takes for themselves); given none it
     writes the MARKED REGION `SMPRules.greetFill()` fills once per recipient
     on the server, because who the recipients are is the server's answer
     (§74.2). Either way this is the only place the greeting's markup exists.

     `SMPRules` is a global here: build.py inlines lib/rules.js FIRST, and
     scripts/test-mail-contrast.js hands it in for the same reason. */
  function greetPara(g, colour){
    if (!g) return "";
    var word = String(g.word == null ? "" : g.word).trim() || "Dear";
    var p = function(inner){
      return '<p style="margin:0 0 16px;font:400 15px/1.6 Helvetica,Arial,sans-serif;' +
        'color:' + colour + '">' + inner + '</p>';
    };
    /* AN ABSENT `name` AND AN EMPTY ONE ARE DIFFERENT ANSWERS, and reading
       them as one produced the only "Dear ," this feature can make. Absent
       means "the server will fill it"; PRESENT AND EMPTY means the caller
       looked and there is no name — which is exactly what `Send me a copy`
       hands over when the signed-in sender's own row has none. Falling back to
       the region there would emit markers nobody fills, and an HTML comment
       renders as nothing: the reader would get "Dear ,". */
    if (g.name !== undefined) {
      var who = String(g.name == null ? "" : g.name).trim();
      return who ? p(e(word) + " " + e(who) + ",") : "";
    }
    /* THE RULES, WHEREVER THIS IS RUNNING (§262). In the browser they are a
       global, because build.py inlines lib/rules.js first; in Node they are a
       require away, and reaching for the global alone would have made a
       server-composed greeting silently vanish — the guard below returns ""
       and nothing would have said why (§35). */
    var R = (typeof SMPRules !== "undefined") ? SMPRules
          : (typeof require !== "undefined" ? require("./rules.js") : null);
    if (!R) return "";
    return R.GREET_OPEN + p(e(word) + " " + R.GREET_NAME + ",") + R.GREET_CLOSE;
  }

  /* o: { org, title, body, footer, accent, panel, cta:{label,href},
          greeting:{word,name} } */
  function html(o){
    o = o || {};
    var accent = accentOf(o), panel = panelOf(o);
    var org = o.org || "Strategy Management Platform";
    var onPanel = inkOn(panel), kicker = mix(onPanel, panel, 0.28);
    /* #8A94A6 on the mail ground is 2.83:1 — measured, and the second of the
       two failures in this file's first draft. */
    /* §203: NO `outer` ANY MORE. The organisation's name was printed a
       THIRD time in a grey line under the whole card — Islam: *"remove the
       raya trade small title in the bottom, it's already in the long title
       above."* It is in the header, and the footer line under the rule says
       *"Sent from Raya Trade — Strategy Management Office"*, so the third
       copy said nothing and was the one furthest from anything it explained.
       The colour goes with the line it painted (§24). */
    var ink = "#1B2330", quiet = "#6B7686", line = "#E3E8EF";

    var cta = (o.cta && o.cta.label && o.cta.href)
      /* A button is a table with a background, because a styled <a> loses its
         padding in Outlook and collapses to underlined text. */
      ? '<table role="presentation" cellpadding="0" cellspacing="0" border="0" ' +
          'style="margin:8px 0 22px"><tr><td bgcolor="' + panel + '" ' +
          'style="border-radius:6px"><a href="' + e(o.cta.href) + '" ' +
          'style="display:inline-block;padding:11px 22px;font:600 14px/1 Helvetica,Arial,sans-serif;' +
          'color:' + onPanel + ';text-decoration:none">' + e(o.cta.label) + '</a></td></tr></table>'
      : "";

    return '<!doctype html><html><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width">' +
      /* Says the design has a light ground on purpose, so a dark-mode client
         does not invert it into something nobody drew. */
      '<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">' +
      '<title>' + e(o.title || org) + '</title></head>' +
      '<body style="margin:0;padding:0;background:#F4F6FA">' +
      /* What a mail list shows beside the subject. Hidden, and it is the one
         piece of text most people read before deciding to open anything. */
      '<div style="display:none;max-height:0;overflow:hidden;opacity:0">' +
        e(o.preheader || o.title || "") + '</div>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
        'style="background:#F4F6FA"><tr><td align="center" style="padding:28px 12px">' +
        '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" ' +
          'style="width:600px;max-width:100%;background:#FFFFFF;border:1px solid ' + line + ';' +
          'border-radius:10px;overflow:hidden">' +

          /* The header. Typographic, for the reason at the top of this file. */
          '<tr><td bgcolor="' + panel + '" style="padding:20px 28px">' +
            '<div style="font:700 15px/1.3 Helvetica,Arial,sans-serif;color:' + onPanel + ';' +
              'letter-spacing:.01em">' + e(org) + '</div>' +
            '<div style="font:600 10.5px/1.4 Helvetica,Arial,sans-serif;color:' + kicker + ';' +
              'letter-spacing:.14em;text-transform:uppercase;padding-top:3px">' +
              e(o.eyebrow || "Strategy Management Platform") + '</div>' +
          '</td></tr>' +
          /* THE ACCENT, WHERE AN ACCENT BELONGS: 3px of fill under the header.
             It is the tenant's mark on the message and it has no word in it. */
          '<tr><td bgcolor="' + accent + '" style="font-size:0;line-height:0;height:3px">&nbsp;</td></tr>' +

          '<tr><td style="padding:28px 28px 8px">' +
            /* `data-mail-title` / `data-mail-body` are HOOKS FOR THE EDITOR
               (§76.3): the composer makes these two contenteditable so the
               message is typed into the design rather than into boxes beside
               it. A data attribute costs an email client nothing and it means
               the editor never has to guess which element is the body — a
               guess that would break the first time this markup moved. */
            (o.title
              ? '<h1 data-mail-title style="margin:0 0 14px;font:700 22px/1.3 Helvetica,Arial,sans-serif;' +
                'color:' + ink + '">' + e(o.title) + '</h1>'
              : '<h1 data-mail-title style="margin:0 0 14px;font:700 22px/1.3 Helvetica,Arial,sans-serif;' +
                'color:' + ink + '"></h1>') +
            /* ── THE GREETING SITS OUTSIDE `data-mail-body`, AND THAT IS
               NOT COSMETIC. That div is the composer's EDITABLE region: the
               message is typed straight into the preview (§76.3) and read
               back with `b.innerText`. Put the greeting inside it and the
               first keystroke in the message absorbs "Dear Ahmed," into the
               body text — after which the email carries the greeting twice
               and the stored message holds a name that was never typed.
               Measured, not reasoned: `body` came back as
               "…Dear Ahmed,\n\nThe cycle opens…" after one character.

               Visually identical — both are block children of the same cell —
               and it is what makes the greeting line un-editable, which is
               right: it is the one part of the message that differs in every
               inbox. */
            greetPara(o.greeting, ink) +
            '<div data-mail-body>' + paras(o.body, ink) + '</div>' + cta +
          '</td></tr>' +

          '<tr><td style="padding:0 28px"><div style="border-top:1px solid ' + line + '"></div></td></tr>' +
          '<tr><td style="padding:16px 28px 24px">' +
            '<p style="margin:0;font:400 12px/1.55 Helvetica,Arial,sans-serif;color:' + quiet + '">' +
              (o.footer ? e(o.footer).replace(/\n/g, "<br>") : "") + '</p>' +
          '</td></tr>' +
        '</table>' +
      '</td></tr></table></body></html>';
  }

  /* What the test send carries, so pressing it shows the real thing rather
     than a page of lorem: every part of the template with something in it. */
  function sampleFor(o){
    return html({
      org: o.org, accent: o.accent, panel: o.panel, footer: o.footer,
      eyebrow: o.eyebrow,
      title: "This is what your emails will look like",
      preheader: "A test from the Strategy Management Platform.",
      body: "This is a test, sent from the platform so you can see the design, " +
            "the sender name and the address it arrives from before anybody else " +
            "receives one.\n\nThe header carries your organisation's name and your " +
            "accent colour. The footer below carries whatever you set on the " +
            "Communication page.\n\nIf this looks right, it is ready to use.",
      /* ── NEVER "#" (spec 027) ──────────────────────────────────────
         It was `o.href || "#"`, and a "#" in an EMAIL is not a quiet no-op the
         way it is on a page: there is no base document, so the mail client
         hands it to the operating system and macOS answers "The application
         can't be opened. -50". html() draws no button at all when the link is
         empty, which is the honest shape — a test of the design that offers no
         button is better than one offering a button that cannot open. */
      cta: { label: "Open the platform", href: o.href || "" }
    });
  }

  /* ── THE SMALL PRINT, WHEN THE TENANT HAS NOT WRITTEN ANY (§262) ────
     It lived in config-data.js, which is a browser file — fine while the
     browser composed every email, and a second copy the day the server had to
     compose one (§53.5). Here, beside the builder that prints it, so the
     office's preview and a collection sent an hour later cannot say different
     things in the same line. */
  function footerDefault(org){
    return "Sent from the Strategy Management Platform" +
           (org ? " for " + org : "") +
           ". If you were not expecting this, tell your SMO.";
  }

  return { html: html, sampleFor: sampleFor, footerDefault: footerDefault };
});
