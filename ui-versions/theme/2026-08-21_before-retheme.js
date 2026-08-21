/* THEME — Auto, Light, Dark.

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

  var mode = read();

  function apply() {
    /* Always an explicit attribute now, even when the value came from the
       device rather than from a person. With only two states there is nothing
       left for the prefers-color-scheme block to decide, and stating it
       outright means one selector paints the page instead of two that have to
       agree. The media block stays in the stylesheet for the gate, which has
       no switch of its own and no script beyond reading storage. */
    document.documentElement.setAttribute("data-theme", mode);
  }

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

  return {
    apply: apply,
    mode: function () { return mode; },
    /* Called once, after the chrome exists. */
    wire: function () {
      var btn = document.getElementById("themebtn");
      if (!btn) return;
      btn.hidden = false;
      paintBtn(btn);
      btn.addEventListener("click", function () {
        set(ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length], btn);
      });
    }
  };
})();
THEME.apply();
