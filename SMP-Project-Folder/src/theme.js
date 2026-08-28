/* THEME — light or dark, and which PALETTE (§38).

   The dark palette has been in _shared.css since the beginning; what was
   missing was a way to choose it. The product followed the laptop silently
   and a person who wanted the other one had nowhere to say so.

   Two states. Light and Dark, and nothing else - Auto was here for one
   version and went: a third state whose whole job is to be invisible is a
   third state people have to work out, on a control they press once a month.
   The device still decides where you START, so the default is unchanged for
   anyone who never touches it; it just stops being a position on the switch.
   Nothing is written to storage until someone actually chooses, so a browser
   that has never been told keeps following the device across sessions.

   The choice is a property of the SCREEN, not of the person and not of the
   tenant, so it lives in localStorage and NEVER in the state graph. Putting
   it in the graph would autosave it to the database and one person picking
   dark would turn the platform dark for everyone. That is also why the gate
   reads the same key: it is the same browser, so it is the same choice.

   Applied from the head, before the body is parsed, so the page never paints
   light and then flips. Nothing else has to know: no JS reads a colour, so
   changing the attribute is the whole of the change. */
var THEME = (function () {
  /* Shared with index.html — the gate reads this key so signing in does not
     change the colours under you. Changing it means changing both. */
  var KEY = "smp.theme";
  var ORDER = ["light", "dark"];

  /* ── The PALETTE, added in 3.11 (§38) ────────────────────────────
     Two axes now, and they are deliberately separate things. LIGHT/DARK is
     about the room you are sitting in. PALETTE is about whose colours the
     product wears. They multiply rather than combining into one list of four,
     because "dark" means the same thing whichever palette is on, and a single
     four-position switch would make you hunt for the pair you wanted.

     Both are properties of the SCREEN and neither goes near the state graph
     (§25.2) — a palette in the graph would autosave, and one person choosing
     slate would repaint the platform for the whole tenant. When multi-tenant
     lands (§36) a tenant's own branding arrives as a palette DEFAULT, which a
     person may still override for their own screen. */
  /* FOREFRONT FIRST — it is the shipped default, and until v3.12 it was not:
     PALETTES[0] was "slate", so a fresh deployment opened in a palette that is
     not the house one. Nobody noticed while the switch was in the top bar,
     because everybody pressed it. A default nobody has to correct is the only
     honest kind. */
  var PKEY = "smp.palette";
  var PALETTES = ["forefront", "slate"];
  var PNAMES = { forefront: "Forefront", slate: "Slate" };

  /* ── The FONT axis (§38.8) ───────────────────────────────────────
     Independent of the palette for now, deliberately: four faces are embedded
     so they can be judged IN the product rather than from a specimen sheet.
     Once it is settled which face belongs to which palette this collapses into
     the palette and the unpicked faces leave the file.

     "system" first, because it is what the platform shipped with and a
     comparison needs its own starting point in it. */
  var FKEY = "smp.font";
  /* TWO, NOT FIVE (§156, Islam: "let's make the 2 fonts available are the
     system font and the source san3"). §38.7 carried four embedded faces so
     they could be compared in the real product; the comparison is over.

     THIS LIST IS ALSO THE SANITISER — `chosenFont()` returns null for anything
     not in it — so somebody whose browser remembers "manrope" from the
     comparison lands on the system stack rather than on an attribute no
     stylesheet answers any more. Nothing to migrate, and nobody stuck. */
  var FONTS = ["system", "source"];
  var FNAMES = { system: "System", source: "Source Sans" };

  /* Where the switch starts when nobody has chosen: whatever the device says.
     matchMedia is absent in very old engines and returns a stub in some test
     runners, hence the guard - light is the safe fall-through because it is
     what the bare :root block already paints. */
  function fromDevice() {
    try {
      return window.matchMedia &&
             window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch (e) { return "light"; }
  }

  /* Storage is unavailable in a private window and on some file:// origins,
     and reading it throws rather than returning null. Auto is the fallback
     everywhere, so a browser that cannot remember still follows the device. */
  function read() {
    try {
      var v = localStorage.getItem(KEY);
      return ORDER.indexOf(v) === -1 ? fromDevice() : v;
    } catch (e) { return fromDevice(); }
  }
  function write(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
  }

  /* ── The tenant's branding sits UNDER the personal switches (§39) ──
     Precedence, and it is the whole model in three lines:

         a person's own choice   (localStorage)      wins
         the tenant's branding   (the state graph)   otherwise
         the shipped palette                         otherwise

     Which is why `chosen` is null rather than a default when nobody has
     pressed anything: only an actual choice may outrank the tenant's brand,
     and "the value that happened to be first in the list" is not a choice.

     BRAND is handed in after the data loads, because theme.js runs in the head
     before any of it exists. Until then the shipped palette paints, which is
     the honest thing to show while the tenant's own colours are still on the
     wire. */
  var BRAND = null;

  /* THE TENANT DECIDES, NOT THE VIEWER (Islam, 2026-08-21: "I don't need to
     have slate, the branding covers this from inside"). The per-screen switch
     is gone, so the stored key is no longer consulted — a value left in a
     browser from before would otherwise pin that person to a palette with no
     control left to change it back. Branding sets the palette for everyone;
     light and dark stay each viewer's own, because those are about the room
     they are sitting in. */
  function readPalette() {
    return (BRAND && BRAND.palette) || PALETTES[0];
  }
  /* A palette left in a browser from before the switch was removed would
     otherwise pin that person to it for ever, with no control left to change
     it back. Cleared once, on the way past. */
  function forgetPalette() {
    try { localStorage.removeItem(PKEY); } catch (e) {}
  }

  function chosenFont() {
    try {
      var v = localStorage.getItem(FKEY);
      return FONTS.indexOf(v) === -1 ? null : v;
    } catch (e) { return null; }
  }
  function readFont() {
    return chosenFont() || (BRAND && BRAND.font) || FONTS[0];
  }
  function writeFont(v) {
    try { localStorage.setItem(FKEY, v); } catch (e) {}
  }

  var mode = read();
  var palette = readPalette();
  var font = readFont();

  function apply() {
    /* Always an explicit attribute now, even when the value came from the
       device rather than from a person. With only two states there is nothing
       left for the prefers-color-scheme block to decide, and stating it
       outright means one selector paints the page instead of two that have to
       agree. The media block stays in the stylesheet for the gate, which has
       no switch of its own and no script beyond reading storage. */
    document.documentElement.setAttribute("data-theme", mode);
    /* Always stated, never left to a bare :root fallback. The stylesheet does
       list the slate values on bare :root as well, so a page whose script
       failed still paints something coherent rather than nothing — but the
       attribute is what the four blocks are actually keyed on. */
    document.documentElement.setAttribute("data-palette", palette);
    forgetPalette();
    /* REMOVED rather than set for the system stack — absence is what hands the
       decision back to --sys-sans, the same reasoning §25.2 used for the theme
       before Auto was retired. There is no [data-font="system"] block to write
       because there is nothing for it to say. */
    if (font === "system") document.documentElement.removeAttribute("data-font");
    else document.documentElement.setAttribute("data-font", font);

    /* The tenant's own colours, written as inline custom properties on the
       root so they outrank the stylesheet's palette blocks without any of them
       having to know a tenant exists. Cleared first, or a colour removed on
       the Branding page would keep painting until the next full reload. */
    var root = document.documentElement;
    (BRAND_APPLIED || []).forEach(function (k) { root.style.removeProperty(k); });
    BRAND_APPLIED = [];
    var t = (BRAND && BRAND.tokens) || {};
    Object.keys(t).forEach(function (k) {
      root.style.setProperty(k, t[k]);
      BRAND_APPLIED.push(k);
    });
  }
  var BRAND_APPLIED = [];

  /* Sun and moon, drawn in the same 20px box as the rest of the chrome's
     marks. The mark shows the state you are IN, and the title says what the
     press will do - the other way round (showing what you would switch to) is
     the convention nobody agrees on and everyone has to test by clicking. */
  var ICONS = {
    light: '<circle cx="10" cy="10" r="3.7" fill="currentColor"/>' +
           '<g stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
           '<path d="M10 1.6v2.2M10 16.2v2.2M18.4 10h-2.2M3.8 10H1.6"/>' +
           '<path d="M15.9 4.1l-1.6 1.6M5.7 14.3l-1.6 1.6M15.9 15.9l-1.6-1.6M5.7 5.7L4.1 4.1"/></g>',
    dark: '<path d="M15.8 12.6A6.6 6.6 0 0 1 7.4 4.2a6.9 6.9 0 1 0 8.4 8.4z" fill="currentColor"/>'
  };
  var WORDS = { light: "light", dark: "dark" };

  function paintBtn(btn) {
    btn.innerHTML = '<svg viewBox="0 0 20 20" class="themesvg" aria-hidden="true">' +
                    ICONS[mode] + '</svg>';
    /* The glyph is never the only carrier — same rule the nav marks follow.
       The title says the state; the aria-label says the state AND what the
       press will do, because a screen reader gets no hover. */
    var next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    btn.title = "Theme: " + WORDS[mode] + " — click for " + WORDS[next];
    btn.setAttribute("aria-label", btn.title);
  }

  function set(v, btn) {
    mode = v;
    write(mode);
    apply();
    if (btn) paintBtn(btn);
  }


  /* The control renders its own name IN the face it names, so the press is not
     the only way to find out what it looks like. */
  function paintFont(btn) {
    btn.textContent = FNAMES[font];
    btn.style.fontFamily = "var(--sans)";
    var next = FONTS[(FONTS.indexOf(font) + 1) % FONTS.length];
    btn.title = "Typeface: " + FNAMES[font] + " — click for " + FNAMES[next];
    btn.setAttribute("aria-label", btn.title);
  }
  function setFont(v, btn) {
    font = v;
    writeFont(font);
    apply();
    if (btn) paintFont(btn);
  }

  return {
    apply: apply,
    /* Called by the shell once the data exists, and again after the Branding
       page changes anything. Re-reads the two axes because a tenant default
       only takes effect where the person has not chosen for themselves. */
    setBrand: function (b) {
      BRAND = b || null;
      palette = readPalette();
      font = readFont();
      apply();
      var fb = document.getElementById("fontbtn");
      if (fb && !fb.hidden) paintFont(fb);
    },
    mode: function () { return mode; },
    palette: function () { return palette; },
    font: function () { return font; },
    /* Called once, after the chrome exists. */
    wire: function () {
      var btn = document.getElementById("themebtn");
      if (btn) {
        btn.hidden = false;
        paintBtn(btn);
        btn.addEventListener("click", function () {
          set(ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length], btn);
        });
      }
      var fb = document.getElementById("fontbtn");
      if (fb) {
        fb.hidden = false;
        paintFont(fb);
        fb.addEventListener("click", function () {
          setFont(FONTS[(FONTS.indexOf(font) + 1) % FONTS.length], fb);
        });
      }
    }
  };
})();
THEME.apply();

/* ── THE BOOT SKELETON'S SWITCH (§94.10) ──────────────────────────────────
   Islam: "when I open the platform it opens on a color scheme and then it
   glitches and shifts to the current color."

   IT IS HERE BECAUSE THE ARGUMENT IS THIS FILE'S ARGUMENT. Everything above
   exists so the page never paints light and then flips; this is the same
   sentence about the TENANT's colours, which cannot be answered the same way
   because they are not in the browser — they are in the database, on
   Setup › Branding, and they arrive with `/api/state`. So the page CANNOT
   open in the right colours. It can open in NO colours, which is what this
   does, and before the answer is known that is the only honest thing to show
   (§32, at the gate, one surface further in).

   AND THE COLOURS ARE THE SMALLER HALF. The worked example is baked into the
   file, so today a client's deployment flashes RAYA TRADE's units and figures
   before their own arrive. Same moment, same fix, and worse.

   ONLY WHERE THERE IS A SERVER TO WAIT FOR. Opened from a file nothing
   arrives late, so the skeleton would appear and vanish for no reason. `SYNC`
   decides the same thing the same way, and this is deliberately NOT that
   check moved here: this has to run in the HEAD, before sync.js exists, and a
   boot state that waited for a script further down the page would be exactly
   one frame too late — which is the whole fault being fixed.

   IT IS TAKEN OFF BY sync.js, ON EVERY PATH IT HAS — hydrated, refused,
   unreachable, or timed out. A loading state that can get stuck is worse than
   the glitch it replaces. */
(function () {
  try {
    if (location.protocol !== "http:" && location.protocol !== "https:") return;
    document.documentElement.classList.add("booting");
    document.documentElement.setAttribute("aria-busy", "true");
  } catch (e) {}
})();
