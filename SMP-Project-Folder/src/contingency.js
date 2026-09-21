/* ══ THE CONTINGENCY FILES (spec 030) ══════════════════════════════════════
   Islam: *"if the platform all is down we need to have a substitue action. so
   before the review day I will download all the presnetations with a time
   stamp. so in case if things are down I have a backup to adjust to and
   present from."*

   TWO FILES, ANSWERING THE SAME OUTAGE FROM TWO SIDES.

   THE WORKING COPY is this very file with the tenant's own graph parked in it
   — it opens from a laptop with nothing running anywhere, holds every plan and
   every figure, and every deck can be presented and printed from it. It is not
   a second product: `sync.js` reads the block on boot exactly where it already
   decides that a `file://` page runs on baked data, so the copy is the
   platform, not a rendering of it.

   THE SLIDES are the review deck converted to PowerPoint (`pptx.js`), for the
   half of the problem the working copy cannot answer: somebody who has to
   re-cut a slide at six in the morning, on a machine that is not theirs.

   WHY THE COPY IS FETCHED RATHER THAN READ OFF THE PAGE. `document.
   documentElement.outerHTML` is the page as it has been PAINTED — a rendered
   unit, an open deck, a dialog — and that will not boot again. The pristine
   bytes are what the server already served, so they are asked for again.

   AND THE BLOCK GOES ABOVE EVERYTHING. Measured rather than assumed: appended
   at the end of the file the element is not in the document when the boot code
   runs, and the copy comes up on the baked WORKED EXAMPLE with no error
   anywhere — a backup showing another company's figures, which is worse than
   no backup. It is inserted immediately after the charset line.

   NOTHING HERE EVER CALLS `paint()` FROM A TIMER (§35, §71.2). The banner is
   drawn from `paint()` and rewritten in place; a repaint under somebody's
   hands is how a half-typed field dies. */

var CONT = (function () {
  var el = null, dismissed = {}, busy = false, note = "";

  function servable() { return location.protocol !== "file:"; }
  function live() { return typeof SYNC !== "undefined" && SYNC.isLive && SYNC.isLive(); }
  function E(s) { return typeof esc === "function" ? esc(s) : String(s == null ? "" : s); }

  /* ── WHO, AND WHETHER THERE IS ANYTHING TO SAY ─────────────────────────
     Asked of the shared rule and never of a list of role names, so the card,
     this banner and the server answer one question (§42). */
  function mayTake() {
    try { return SMPRules.mayTakeContingency(world(), viewer()); } catch (e) { return false; }
  }
  function meKey() {
    try { return String((viewer() || {}).key || ""); } catch (e) { return ""; }
  }

  /* ── THE STAMP ─────────────────────────────────────────────────────────
     `REVIEW.taken[personKey] = { copy, slides }`, riding the review row's
     spare column, so nothing is migrated. Stored as an ABSENCE (§50.6): a
     person who has taken neither has no entry at all, and a cycle nobody has
     taken files for carries no `taken` key.

     THE RESIDUE IS STATED RATHER THAN DISCOVERED. This map is keyed by PERSON
     and travels whole, so two of the office pressing the button inside the
     same save window can lose one stamp (§234's shape, one map over). The cost
     of losing one is one extra reminder — not a lost file — which is why it is
     recorded here instead of being split per person, which the differ and the
     authoriser would have to be taught together (§234). */
  function taken() {
    try { return SMPRules.contingencyTaken(REVIEW, meKey()); } catch (e) { return null; }
  }
  function hasBoth() {
    try { return SMPRules.hasBothFiles(REVIEW, meKey()); } catch (e) { return false; }
  }
  function mark(kind) {
    var k = meKey();
    if (!k) return;
    if (!REVIEW.taken) REVIEW.taken = {};
    var row = REVIEW.taken[k] || (REVIEW.taken[k] = {});
    row[kind] = new Date().toISOString();
  }

  /* ── THE FILE NAMES CARRY THE MOMENT ───────────────────────────────────
     Islam's own word — *"with a time stamp"* — and it is what makes a folder
     of these readable a fortnight later. Local time, because the person
     reading the folder is in it. */
  function stamp() {
    var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) +
      "-" + p(d.getHours()) + p(d.getMinutes());
  }
  function cycleWord() {
    var n = (typeof REVIEW !== "undefined" && REVIEW.name) || "";
    return String(n).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cycle";
  }

  /* ── THE WORKING COPY ──────────────────────────────────────────────────
     One request for our own bytes, one string insertion, one download. The
     graph is asked of `SYNC` rather than rebuilt, or the copy would carry a
     second idea of what the state is.

     AND THE COPY CARRIES THE PLATFORM, NOT A LINK TO IT (§379). §306 fetched
     the page and stopped there, which was the whole product while the platform
     was ONE self-contained file: those bytes held the code and the design.
     Since the cutover the served document is a 12KB shell that LINKS them
     (`lib/shell.ts`), so the same fetch returned the tenant's graph and a
     `<script src="/shell.js">` pointing at the server the backup exists
     because it is down. Measured on a copy taken from production: 1,580,208
     characters of Raya Trade and 12,716 of markup, with 4.5MB of platform
     missing — it opened on a blank unstyled page. Every linked script and
     stylesheet is fetched and put INSIDE the file now.

     DERIVED FROM THE DOCUMENT, NEVER A LIST OF THE THREE NAMES (§104.7): a
     fourth file linked next month is carried the day it is added, rather than
     on the day somebody remembers this function exists.

     THE FROZEN BUILD LINKS NOTHING, so over `file://` and against the offline
     platform there is nothing to inline and the copy is byte-identical to
     what §306 produced. Asserted at both ends, or a build that stopped
     inlining would pass on the one shape that never needed it.

     ANYTHING THAT CANNOT BE CARRIED IS A REFUSAL, never a quiet omission:
     a backup missing part of the product is exactly the fault this removes,
     and §306's own argument — a copy that silently comes up wrong is worse
     than no copy — applies with more force to one that will not come up at
     all. Marks and the manifest are not refused: they are decoration, and a
     missing favicon stops nothing. */
  var ANCHOR = "<meta charset='utf-8'>";
  /* Both shapes `lib/shell.ts` emits, and the two the frozen build would emit
     if it linked anything. A `<script src>` has an empty body by definition,
     so the pair is matched together and replaced whole. */
  var SCRIPT_SRC = /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>\s*<\/script\s*>/gi;
  var LINK_TAG   = /<link\b[^>]*>/gi;

  /* Same server: anything carrying a scheme of its own, or starting `//`, is
     somewhere else. A cross-origin one could not be fetched at all (the
     policy admits none today), so it is NAMED rather than dropped. */
  function ourOwn(u) { return !/^[a-z][a-z0-9+.-]*:|^\/\//i.test(u); }

  function grab(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + " could not be read (" + r.status + ")");
      return r.text();
    });
  }

  /* ── AND WHAT THE STYLESHEET ITSELF POINTS AT (§379.3) ─────────────────
     `platform.css` carries one `url(/fonts/Source_Sans_3.woff2)`, and §38.7
     embedded that face precisely because *a linked webfont would break the
     offline single-file handover* — which is what the frozen build does, as a
     `data:` URI, and what the served stylesheet does not (`sync-css.mjs`:
     served, it is a file beside the stylesheet). So a copy that inlined the
     CSS and stopped would open in the system stack: the platform, in another
     typeface.

     A MISSING ONE IS NOT A REFUSAL, and the line is worth stating because it
     is the opposite of the rule above. Without the script or the stylesheet
     the copy does not work; without the face it works and reads in a
     different font. A backup that refuses to exist because a woff2 answered
     404 is worse than one that opens in Source Sans's fallback — so this is
     carried where it can be and left alone where it cannot.

     SPLIT AND JOIN rather than `replace`: every occurrence, and no `$`
     pattern read out of the replacement (§379.1). */
  var MIME = { woff2: "font/woff2", woff: "font/woff", ttf: "font/ttf",
               otf: "font/otf", svg: "image/svg+xml", png: "image/png",
               jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif",
               webp: "image/webp", ico: "image/x-icon" };

  function b64(buf) {
    var a = new Uint8Array(buf), s = "", i;
    /* In chunks: `apply` with a whole font's worth of arguments overflows. */
    for (i = 0; i < a.length; i += 8192) {
      s += String.fromCharCode.apply(null, a.subarray(i, i + 8192));
    }
    return btoa(s);
  }

  function inlineCssUrls(css) {
    var urls = [], seen = {}, m;
    var RE = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
    while ((m = RE.exec(css))) {
      var u = m[2];
      if (seen[u] || /^data:/i.test(u) || !ourOwn(u)) continue;
      seen[u] = 1; urls.push(u);
    }
    if (!urls.length) return Promise.resolve(css);
    return Promise.all(urls.map(function (u) {
      return fetch(u).then(function (r) {
        if (!r.ok) throw new Error("skip");
        return r.arrayBuffer();
      }).then(function (buf) {
        var ext = (u.split("?")[0].split(".").pop() || "").toLowerCase();
        return { u: u, data: "data:" + (MIME[ext] || "application/octet-stream") +
                             ";base64," + b64(buf) };
      }).catch(function () { return null; });
    })).then(function (got) {
      got.forEach(function (g) {
        if (g) css = css.split(g.u).join(g.data);
      });
      return css;
    });
  }

  /* ── PUT ONE STRING WHERE ANOTHER WAS, VERBATIM (§379.1) ───────────────
     `String.replace` reads `$&`, `$1`, `` $` `` and `$'` IN THE REPLACEMENT,
     so handing it 3.8MB of `shell.js` — which writes `"<\/$1"` in its own
     regexes — silently corrupts the copy at every one of them. §306's own
     line had it too, on the JSON: a tenant that typed `$&` into a plan got it
     replaced by the charset tag, and nothing would have said so. A function
     replacement is the one form that is never read for patterns. */
  function put(hay, needle, block) {
    return hay.replace(needle, function () { return block; });
  }

  function buildCopy(done) {
    var page;
    fetch(location.pathname, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("the platform file could not be read (" + r.status + ")");
        return r.text();
      })
      .then(function (html) {
        if (html.indexOf(ANCHOR) < 0) throw new Error("the platform file is not the shape this expects");
        page = html;

        var want = [], m;
        SCRIPT_SRC.lastIndex = 0;
        while ((m = SCRIPT_SRC.exec(html))) want.push({ tag: m[0], url: m[1], css: false });
        LINK_TAG.lastIndex = 0;
        while ((m = LINK_TAG.exec(html))) {
          var tag = m[0];
          if (!/\brel\s*=\s*["'][^"']*\bstylesheet\b/i.test(tag)) continue;
          var href = /\bhref\s*=\s*["']([^"']+)["']/i.exec(tag);
          if (href) want.push({ tag: tag, url: href[1], css: true });
        }
        var away = want.filter(function (w) { return !ourOwn(w.url); });
        if (away.length) {
          throw new Error("the copy cannot carry " + away[0].url +
                          " — it is not served from here, so the file would open without it");
        }
        return Promise.all(want.map(function (w) {
          return grab(w.url).then(function (text) {
            /* A stylesheet points at things of its own — the typeface — and
               those come too (§379.3). */
            return w.css ? inlineCssUrls(text) : text;
          }).then(function (text) { w.text = text; return w; });
        }));
      })
      .then(function (want) {
        /* A CLOSING TAG INSIDE THE BYTES WOULD END THE BLOCK IT IS IN — the
           same fault as the JSON below, and §272.8's in a stylesheet. It
           measures NOUGHT in all three files served today, because the
           sources already write `<\/script>`; this is here for the file that
           does not, and it is honest only where the sequence sits inside a
           string, which in valid JS and CSS is the only place it can. */
        want.forEach(function (w) {
          var safe = w.css ? w.text.replace(/<\/(style)/gi, "<\\/$1")
                           : w.text.replace(/<\/(script)/gi, "<\\/$1");
          var block = w.css ? "<style>\n" + safe + "\n</style>"
                            : "<script>\n" + safe + "\n<\/script>";
          page = put(page, w.tag, block);
        });

        var g = SYNC.graph();
        /* `</` inside a script block ENDS it wherever it appears, so the one
           sequence that can break out is escaped. JSON reads `<\/` as `</`,
           so nothing about the data changes. */
        var json = JSON.stringify(g).replace(/<\//g, "<\\/");
        var isl = '<script type="application/json" id="smp-offline">' + json + '<\/script>\n';
        done(null, put(page, ANCHOR, ANCHOR + "\n" + isl));
      })
      .catch(function (e) { done(e, null); });
  }

  function takeCopy(done) {
    buildCopy(function (err, html) {
      if (err) return done(err);
      try {
        sendFileBytes(new TextEncoder().encode(html),
          "SMP-working-copy-" + cycleWord() + "-" + stamp() + ".html", "text/html");
        mark("copy");
        done(null);
      } catch (e) { done(e); }
    });
  }

  /* ── THE SLIDES ────────────────────────────────────────────────────────
     Every subject that presents, one PowerPoint each, in the cycle board's
     own order (§245) — the same list the master presentation walks, so the
     folder and the running order cannot disagree. One subject is one file
     rather than a zip holding one (§304). */
  function subjects() {
    try { return masterSubjects(); } catch (e) { return []; }
  }
  function takeSlides(done) {
    var subs = subjects();
    if (!subs.length) return done(new Error("nothing is set up to present yet"));
    var files;
    try {
      files = subs.map(function (t) {
        return { name: reviewPptxName(t), data: buildReviewPptx(t),
                 mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation" };
      });
    } catch (e) { return done(e); }
    try {
      sendFilesZip(files, "SMP-presentations-" + cycleWord() + "-" + stamp() + ".zip");
      mark("slides");
      done(null);
    } catch (e) { done(e); }
  }

  /* ── AND ONE PDF OF THE WHOLE FLOW (§312) ────────────────────────────
     Islam: *"the pdf in the contiengcy back is like the master presentation a
     full pdf with all slides there."*

     IT IS NOT A DOWNLOAD AND IS NOT IN `takeBoth`. A PDF here is the browser
     printing (§305), so it opens a dialog and waits for a person — which is
     right for a button somebody presses and wrong for the banner's one press,
     whose whole promise is that it hands over the files without asking
     anything. The banner keeps its two; the card gains a third.

     NOTHING IS STAMPED. `afterprint` fires on Save and on Cancel alike, so a
     mark saying this person holds the PDF would be a claim the platform
     cannot see (§124) — and it would move when §306's reminders stop, which
     nobody asked for. */
  function takeFlowPdf(done) {
    if (!subjects().length) return done(new Error("nothing is set up to present yet"));
    try {
      if (!flowToPdf()) return done(new Error("nothing is set up to present yet"));
      done(null);
    } catch (e) { done(e); }
  }

  /* Both, which is what the banner's one button does — a person told to take
     the contingency files should not have to know there are two. */
  function takeBoth(done) {
    takeCopy(function (e1) {
      takeSlides(function (e2) { done(e1 || e2 || null); });
    });
  }

  /* ── THE BANNER ────────────────────────────────────────────────────────
     Islam's option B, from two drawn: across the top of the page, in the slot
     the platform already keeps for "something about saving" — so a caution
     about losing a review sits where a caution about losing work sits.

     THE SMO TEAM'S AND NOBODY ELSE'S, which is his correction of the first
     drawing: it had used the welcome screen's waiting list, and that screen is
     every viewer's, so the reminder appeared beside a unit head's own row.
     A unit head has nothing to download.

     QUIET, THEN LOUD. The two wide moments wear the attention ground, where
     nothing has gone wrong yet (§168, §190); the two near ones wear the alarm.
     The last drops *Later*, because at three hours there is no later.

     EACH PERSON'S REMINDERS END WHEN THAT PERSON HAS BOTH FILES. Not when
     somebody else has: four is the most anybody who ignores it ever sees, and
     nought after the first press — without which it is four nags whatever
     they do, and people learn to dismiss it (§190). */
  var LOUD_AT = 6;                /* this moment and nearer wear the alarm */

  function mount() {
    if (el || !servable() || !document.body) return;
    el = document.createElement("div");
    el.className = "banner safety cont";
    el.id = "contingency";
    el.hidden = true;
    var sf = document.getElementById("safety");
    if (sf && sf.parentNode) sf.parentNode.insertBefore(el, sf.nextSibling);
    else document.body.insertBefore(el, document.body.firstChild);
  }

  function hide() { if (el) { el.hidden = true; el.innerHTML = ""; } }

  var IC_CLOCK =
    '<svg class="safety-ic" viewBox="0 0 20 20" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" aria-hidden="true"><circle cx="10" cy="10" r="7.5"></circle>' +
    '<path d="M10 6v4.4l2.8 1.7" stroke-linecap="round"></path></svg>';
  var IC_WARN =
    '<svg class="safety-ic" viewBox="0 0 20 20" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" aria-hidden="true"><path d="M10 2.6 18.4 17H1.6L10 2.6Z" ' +
    'stroke-linejoin="round"></path><path d="M10 8v3.6" stroke-linecap="round"></path>' +
    '<circle cx="10" cy="14.2" r=".9" fill="currentColor" stroke="none"></circle></svg>';

  function when() {
    try { return SMPRules.reviewMoment(REVIEW); } catch (e) { return null; }
  }
  function due() {
    try { return SMPRules.remindDue(REVIEW); } catch (e) { return null; }
  }

  /* The review's own words: "tomorrow at 10:00" reads better than a date
     somebody has to work out, and past a day it says the day. */
  function whenWord() {
    var w = when();
    if (!w) return "";
    var mins = Math.round((w.getTime() - Date.now()) / 60000);
    var at = w.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    if (mins < 60) return "in " + mins + " minutes";
    if (mins < 24 * 60) return "today at " + at;
    if (mins < 48 * 60) return "tomorrow at " + at;
    return w.toLocaleDateString(undefined, { day: "numeric", month: "short" }) + " at " + at;
  }

  function paintBanner() {
    if (!servable() || !live()) return;
    mount(); if (!el) return;
    if (!mayTake()) return hide();

    var t = taken(), both = hasBoth(), h = due();

    /* Taken, and said once. The green line is the receipt for a press that
       downloaded two files with no other sign anything happened — and it is
       dismissible, because it is news rather than an outstanding thing. */
    if (both) {
      if (dismissed.done || !note) return hide();
      el.className = "banner safety cont done";
      el.innerHTML =
        '<svg class="safety-ic" viewBox="0 0 20 20" fill="none" stroke="currentColor" ' +
        'stroke-width="1.9" aria-hidden="true"><circle cx="10" cy="10" r="7.5"></circle>' +
        '<path d="m6.6 10.2 2.3 2.3 4.5-4.7" stroke-linecap="round" stroke-linejoin="round">' +
        '</path></svg>' +
        '<div class="safety-msg"><strong>' + E(note) + '</strong>' +
        '<span>Both are on this computer. This is the last you will hear about it for ' +
        E((REVIEW && REVIEW.name) || "this cycle") + '.</span></div>' +
        '<div class="safety-acts"><button type="button" class="safety-btn ghost" ' +
        'data-cont-dismiss>Dismiss</button></div>';
      wire();
      el.hidden = false;
      return;
    }

    if (h == null || dismissed[h]) return hide();

    var loud = h <= LOUD_AT;
    var half = t && (t.copy || t.slides);
    el.className = "banner safety cont" + (loud ? " loud" : "");
    el.innerHTML = (loud ? IC_WARN : IC_CLOCK) +
      '<div class="safety-msg"><strong>' +
        (loud
          ? E(h + " hours to the " + ((REVIEW && REVIEW.name) || "") +
              " review, and you have no contingency files")
          : E("The " + ((REVIEW && REVIEW.name) || "") + " review is " + whenWord())) +
      '</strong><span>' +
        (busy ? "Taking them…"
              : half
                ? "One of the two is still missing. Take them both while there is time."
                : loud
                  ? "Two downloads. If the platform is down at the review this is the only way it still happens."
                  : "Take the contingency files while there is time — if the platform cannot be reached on the day you can still present from them.") +
      '</span></div>' +
      '<div class="safety-acts"><button type="button" class="safety-btn" data-cont-take' +
        (busy ? " disabled" : "") + '>Take them now</button>' +
        /* No way to defer at the last moment (§221's shape: the control that
           is not there is the honest one, rather than one that is drawn and
           refuses). */
        (loud && h <= 3 ? "" :
          '<button type="button" class="safety-btn ghost" data-cont-later>Later</button>') +
      '</div>';
    wire();
    el.hidden = false;
  }

  /* Wired on the FOOT after every rewrite, never once at boot: the banner's
     innerHTML is replaced on each paint, so a handler bound to a button that
     has since been thrown away is bound to nothing (§24, §47.2). */
  function wire() {
    var b = el.querySelector("[data-cont-take]");
    if (b) b.addEventListener("click", press);
    var l = el.querySelector("[data-cont-later]");
    if (l) l.addEventListener("click", function () {
      var h = due(); if (h != null) dismissed[h] = true;
      hide();
    });
    var d = el.querySelector("[data-cont-dismiss]");
    if (d) d.addEventListener("click", function () { dismissed.done = true; hide(); });
  }

  /* THE PRESS SAYS WHAT HAPPENED, IN THE ELEMENT (§63): a repaint would
     replace the button that was just pressed, so the outcome is written
     where it is read. A failure is said in the user's words and the stamp is
     NOT written — a person told they are covered when the file never
     downloaded is worse than one who was told nothing (§124). */
  function press() {
    if (busy) return;
    busy = true; paintBanner();
    takeBoth(function (err) {
      busy = false;
      if (err) {
        el.className = "banner safety cont loud";
        el.innerHTML = IC_WARN +
          '<div class="safety-msg"><strong>The files could not be taken</strong>' +
          '<span>' + E(String((err && err.message) || err)) +
          ' — try again, or take them from Setup › Import &amp; archives.</span></div>' +
          '<div class="safety-acts"><button type="button" class="safety-btn" data-cont-take>' +
          'Try again</button></div>';
        wire();
        el.hidden = false;
        return;
      }
      note = "Contingency files taken · " +
        new Date().toLocaleString(undefined, { day: "numeric", month: "short",
                                               hour: "2-digit", minute: "2-digit" });
      dismissed.done = false;
      paint();          /* the stamp is state — the list and the card follow it */
    });
  }

  return {
    onPaint: paintBanner,
    mayTake: mayTake,
    takeCopy: takeCopy,
    takeSlides: takeSlides,
    takeFlowPdf: takeFlowPdf,
    buildCopy: buildCopy,
    subjects: subjects,
    stamp: stamp,
    /* For the check, and for the card, which says what this person already has. */
    taken: taken,
    hasBoth: hasBoth,
    due: due,
    hide: hide
  };
})();
