/* THEME — Auto, Light, Dark.

   The dark palette has been in _shared.css since the beginning; what was
   missing was a way to choose it. The product followed the laptop silently
   and a person who wanted the other one had nowhere to say so.

   Three states, not two. Auto is the starting position and keeps following
   the device, which is what most people want and what the CSS already did;
   Light and Dark are a person overriding it for this screen. A two-state
   toggle would have had to guess an initial side and would have lost the
   ability to go back to following.

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
  var ORDER = ["auto", "light", "dark"];

  /* Storage is unavailable in a private window and on some file:// origins,
     and reading it throws rather than returning null. Auto is the fallback
     everywhere, so a browser that cannot remember still follows the device. */
  function read() {
    try {
      var v = localStorage.getItem(KEY);
      return ORDER.indexOf(v) === -1 ? "auto" : v;
    } catch (e) { return "auto"; }
  }
  function write(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
  }

  var mode = read();

  function apply() {
    /* Auto REMOVES the attribute rather than setting it to "auto": the
       stylesheet keys off :root[data-theme="dark"] and
       :root:not([data-theme="light"]), so absence is what hands the decision
       back to prefers-color-scheme. An "auto" value would just be a third
       string neither selector matches — which happens to work today, and
       would quietly stop working the moment a rule tested for "light". */
    var el = document.documentElement;
    if (mode === "auto") el.removeAttribute("data-theme");
    else el.setAttribute("data-theme", mode);
  }

  /* Half-filled circle, sun, moon. Drawn at the same 20px box as the rest of
     the chrome's marks. Auto is deliberately the half circle: it reads as
     "either", which is what following the device means. */
  var ICONS = {
    auto: '<circle cx="10" cy="10" r="6.4" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
          '<path d="M10 3.6a6.4 6.4 0 0 0 0 12.8z" fill="currentColor"/>',
    light: '<circle cx="10" cy="10" r="3.7" fill="currentColor"/>' +
           '<g stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
           '<path d="M10 1.6v2.2M10 16.2v2.2M18.4 10h-2.2M3.8 10H1.6"/>' +
           '<path d="M15.9 4.1l-1.6 1.6M5.7 14.3l-1.6 1.6M15.9 15.9l-1.6-1.6M5.7 5.7L4.1 4.1"/></g>',
    dark: '<path d="M15.8 12.6A6.6 6.6 0 0 1 7.4 4.2a6.9 6.9 0 1 0 8.4 8.4z" fill="currentColor"/>'
  };
  var WORDS = { auto: "following your device", light: "light", dark: "dark" };

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
