/* ── PICTURE SLIDES (§50, backlog §16.12 built) ───────────────────────────
   "Review mode should accommodate images: a screenshot of a platform or an
   outcome, or an uploaded picture slide placed at a chosen point in the deck."

   THE DECK IS BUILT FRESH EVERY TIME IT IS OPENED and there is no exported
   copy — that is the whole argument for presenting out of the platform (§8.8).
   A picture slide has to obey the same rule, so what is stored is not a slide:
   it is a TITLE, a POSITION, an ARRANGEMENT and the pictures themselves. The
   slide is assembled at the moment the deck opens, beside figures that are
   current to the minute.

   THEY BELONG TO THE CYCLE (Islam, 2026-08-23). A picture is evidence for one
   review — the store that opened, the screen that went live, the shelf as it
   actually looks. It is archived with the cycle's figures when the cycle
   closes and the next cycle starts with a clean deck, exactly as the unit's
   note does. The alternative was tried in the asking and rejected for the
   reason that decides it: a picture that stays presents itself as this
   cycle's until somebody remembers to take it out, and nobody does.

   WHO MAY ADD ONE is not a new rule. A picture slide speaks for the whole unit
   in front of the board, which is the same act as submitting and the same act
   as the cycle note — so it is authorised by the SAME classification on the
   server (`reportState`), and offered by the same function on the screen.
   Custodian, owner and the SMO; a contributor limited to their own lines does
   not put a picture in front of the board.
   ─────────────────────────────────────────────────────────────────────── */

/* The stage is 1600x900, so a picture longer than 1600px on its long edge is
   detail nobody in the room can see, carried in every save for ever. */
var PIC_MAX_EDGE   = 1600;
var PIC_MAX_SLIDES = 12;    /* per unit or function, per cycle */
var PIC_PER_SLIDE  = 4;

/* ── The model ───────────────────────────────────────────────────────────
   REVIEW.slides is keyed exactly as REVIEW.note is: a unit key, or "fn:<key>".
   One keying, so a deck's pictures and a deck's note are found the same way.

   READING NEVER WRITES. §42's lesson, and it cost a whole afternoon there: a
   reader that quietly creates the field it was looking for makes every save
   carry a change the database never held, and every non-SMO save is then
   refused for ever. So this returns a shared empty array and the container is
   created only by an act that actually puts something in it. */
/* Frozen, because it is SHARED: every target with no pictures is handed this
   same array, so one careless push would give a picture to all of them. */
var PIC_NONE = Object.freeze([]);
function pslidesOf(target){
  var m = REVIEW && REVIEW.slides;
  return (m && Array.isArray(m[target])) ? m[target] : PIC_NONE;
}
/* ...and the writing half, which does create it — and tidies up after itself,
   so a tenant that adds a picture and then removes it is left byte for byte
   where it started rather than carrying an empty object for ever. */
function pslidesFor(target){
  if (!REVIEW.slides) REVIEW.slides = {};
  if (!Array.isArray(REVIEW.slides[target])) REVIEW.slides[target] = [];
  return REVIEW.slides[target];
}
function pslidesTidy(target){
  if (!REVIEW.slides) return;
  if (REVIEW.slides[target] && !REVIEW.slides[target].length) delete REVIEW.slides[target];
  if (!Object.keys(REVIEW.slides).length) delete REVIEW.slides;
}
function pslideById(target, id){
  var hit = null;
  pslidesOf(target).forEach(function(s){ if (s.id === id) hit = s; });
  return hit;
}
/* An id that cannot collide with one made a second earlier in another tab.
   Nothing here is derived from a picture's content: two identical pictures on
   two slides are two slides. */
function pslideNewId(){
  return "ps" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* ── Drawing one, in the deck ────────────────────────────────────────────
   The arrangement is how many pictures sit ACROSS; four means two by two. A
   slot with no picture in it is not drawn — a hole in a grid in front of a
   client is worse than a narrower row, and the grid closes up on its own.

   The crop is `object-position` plus a scale, and it is the SAME two numbers
   the editor writes and the same two the editor previews. One rendering, so
   what was framed is what is shown. */
/* FIT IS THE DEFAULT, NOT FILL (§51.10, Islam: "allow me to zoom out more as
   the zoom in is too big", and "pictures need to be wrapped to fit in the space
   you give to it in the slide").

   Both notes are the same note. The frames were `object-fit:cover`, which fills
   the box and throws away whatever does not fit — so a portrait infographic in
   a landscape frame lost both its edges, and the zoom slider could only make
   that worse because 100% was already the tightest crop available. There was no
   way to say "show me all of it".

   So a picture FITS its frame whole, and FILL is the deliberate choice for a
   photograph that should bleed. §16.12 asks for a screenshot of a platform
   before it asks for anything else, and a screenshot with its edges cut off is
   not a screenshot of anything. Zoom starts at 50% so a picture can also be
   made smaller than its box. */
function picStyle(p){
  var z = Math.max(0.5, Math.min(3, +p.z || 1));
  return "object-fit:" + (p.fit === "cover" ? "cover" : "contain") + ";" +
    "object-position:" + (+p.x == null ? 50 : +p.x) + "% " + (+p.y == null ? 50 : +p.y) + "%;" +
    (z !== 1 ? "transform:scale(" + z + ");" : "");
}
/* `blank` is the EDITOR's flag and nothing else's. A slide with no picture in
   it is not a slide and must never reach a projector (§50.2) — but the moment
   after you press Add slide after it is exactly that, and a rail that does not show
   the thing you just made is a rail that swallowed it. So the deck asks
   without the flag and the editor asks with it. */
function pslideHtml(sl, blank){
  if (slideIsVideo(sl)) return vslideHtml(sl, blank);
  var pics = (sl.pics || []).filter(function(p){ return p && p.src; })
                            .slice(0, PIC_PER_SLIDE);
  if (!pics.length) {
    if (!blank) return "";
    return '<section class="dslide d-pics d-blank" data-ps="' + esc(sl.id) + '">' +
      (sl.title ? '<h2>' + esc(sl.title) + '</h2>' : '') +
      '<div class="blankslide"><span>This slide is empty</span>' +
      '<em>It will not appear in the review until it has a picture.</em></div></section>';
  }
  var across = Math.max(1, Math.min(PIC_PER_SLIDE, +sl.layout || pics.length));
  var cells = pics.map(function(p){
    return '<figure class="pcell"><span class="pframe">' +
      '<img src="' + esc(p.src) + '" alt="' + esc(p.cap || sl.title || "Picture") +
      '" style="' + picStyle(p) + '"></span>' +
      (p.cap ? '<figcaption>' + esc(p.cap) + '</figcaption>' : '') + '</figure>';
  }).join("");
  return '<section class="dslide d-pics" data-ps="' + esc(sl.id) + '">' +
    (sl.title ? '<h2>' + esc(sl.title) + '</h2>' : '') +
    '<div class="pgrid pg' + Math.min(across, pics.length) + '">' + cells + '</div></section>';
}

/* A video slide, drawn (§261). One clip, filling the slide under the title,
   with the caption where a picture's already sits.

   IT DOES NOT AUTOPLAY, deliberately. A clip that starts the moment the deck
   reaches the slide takes the room away from whoever is presenting, and there
   is no way to give it back except to find the pause button in front of the
   board. `controls` and nothing else.

   A LINK WE CANNOT PLAY IS NOT DRAWN AS A BROKEN PLAYER. It gets the poster
   and a way out to the browser — §15.1's rule, which is the whole reason the
   paste box says so at the desk instead. */
function vslideHtml(sl, blank){
  var vid = vidOf(sl), how = videoPlay(vid);
  /* A CLIP THE OFFICE CLEARED IS SAID, NEVER DRAWN AS A DEAD PLAYER (§15.1,
     §261). The poster and the caption stay, so an archived review still shows
     what was presented — and the slide keeps its place in the deck rather
     than vanishing out of a record somebody may be reading. */
  if (!how && vid && vid.cleared) {
    return '<section class="dslide d-video" data-ps="' + esc(sl.id) + '">' +
      (sl.title ? '<h2>' + esc(sl.title) + '</h2>' : '') +
      '<div class="vwrap">' +
        (vid.poster ? '<img src="' + esc(vid.poster) + '" alt="">' : '') +
        '<span class="vaway"><b>This video was removed to free storage</b>' +
        '<span>' + esc(vid.cleared) + '</span></span>' +
      '</div>' +
      (sl.vcap ? '<figcaption>' + esc(sl.vcap) + '</figcaption>' : '') +
      '</section>';
  }
  if (!how) {
    if (!blank) return "";
    return '<section class="dslide d-video d-blank" data-ps="' + esc(sl.id) + '">' +
      (sl.title ? '<h2>' + esc(sl.title) + '</h2>' : '') +
      '<div class="blankslide"><span>This slide is empty</span>' +
      '<em>It will not appear in the review until it has a video.</em></div></section>';
  }
  var body;
  if (how.kind === "embed") {
    /* `allowfullscreen` and nothing else: no autoplay, no camera, no
       microphone, no payment. A frame gets the narrowest hand we can give it
       (§43.6's argument, one element in). */
    /* THE PLAYER HAS TO KNOW WHO IS EMBEDDING IT (§261.11). Islam got
       YouTube's **error 153 — "Video player configuration error"**, and the
       cause is ours twice over: `vercel.json` sets `Referrer-Policy:
       no-referrer` for the whole site, and this iframe said it again. A player
       that cannot see the embedding origin cannot check whether the video may
       be shown there, so it refuses to configure at all.

       `strict-origin` IS THE NARROWEST THING THAT WORKS: the scheme and host,
       never the path — so YouTube learns the platform's address and nothing
       about which unit or which review is on screen — and nothing at all if
       the connection is ever downgraded. The element's own policy overrides
       the document's for this one request; every other request the platform
       makes still sends no referrer. */
    /* THE PLAYER IS LOADED ONLY ON THE SLIDE YOU ARE ON (§261.14). The
       address rides in `data-vsrc` and `videoArm()` moves it into `src` when
       this slide is the one showing, and empties it again when it is not.
       Three things follow, and the first is the reported fault: a player
       still loaded on a slide nobody is looking at goes on holding the
       keyboard, so the arrow keys move the clip instead of the deck. It also
       stops the rail drawing twenty players at one tenth, and means nothing
       is asked of YouTube until a slide with a clip on it is actually
       reached. */
    body = '<iframe data-vsrc="' + esc(how.play) + '" title="' + esc(sl.title || "Video") +
      '" allowfullscreen allow="fullscreen" referrerpolicy="strict-origin" ' +
      /* Kept, and the two that matter are what it withholds: the frame cannot
         navigate the platform away from under the presenter, and cannot start
         a download. `allow-same-origin` is not optional — without it the
         player is given an opaque origin, loses its own storage, and fails
         for a second reason. */
      'sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>';
  } else if (how.kind === "file") {
    body = '<video src="' + esc(how.play) + '" controls preload="metadata"' +
      (vid.poster ? ' poster="' + esc(vid.poster) + '"' : "") + '></video>';
  } else {
    body = (vid.poster ? '<img src="' + esc(vid.poster) + '" alt="">' : "") +
      '<span class="vaway"><b>This video opens in a new tab</b>' +
      '<a href="' + esc(how.url) + '" target="_blank" rel="noopener noreferrer">' +
      'Open the video</a></span>';
  }
  return '<section class="dslide d-video" data-ps="' + esc(sl.id) + '">' +
    (sl.title ? '<h2>' + esc(sl.title) + '</h2>' : '') +
    '<div class="vwrap">' + body + '</div>' +
    (sl.vcap ? '<figcaption>' + esc(sl.vcap) + '</figcaption>' : '') +
    '</section>';
}

/* THE CLIP BELONGS TO ONE SLIDE, AND SO DOES THE KEYBOARD (§261.14).

   Islam, presenting: *"the video is on the first 3 slides ... I'm not able to
   navigate from it."* A cross-origin player that has been clicked owns every
   key the presenter presses — the arrows seek the clip and the deck does not
   move — and a frame left loaded on a slide that is no longer showing goes on
   owning them from behind `display:none`.

   So the frame is only ever loaded while its own slide is the one on screen,
   and emptying it is what hands the keyboard back. `<video>` is paused rather
   than emptied: it is our own element, so pausing is enough and the presenter
   keeps their place in the clip.

   `live` is the ONE slide passed in, never "every slide wearing .on" — the
   editor's rail marks every thumbnail `.on` so it lays out, and a rail that
   armed them would load one player per row. */
function videoArm(root, live){
  if (!root) return;
  [].forEach.call(root.querySelectorAll("iframe[data-vsrc]"), function(f){
    var want = (live && live.contains(f)) ? (f.dataset.vsrc || "") : "";
    if ((f.getAttribute("src") || "") !== want) f.setAttribute("src", want);
  });
  [].forEach.call(root.querySelectorAll(".d-video video"), function(v){
    if (!(live && live.contains(v)) && !v.paused) v.pause();
  });
}

/* ── Taking a picture in ─────────────────────────────────────────────────
   Shrunk in the browser, before it is ever stored. It travels inside the same
   save as everything else in the platform, so a 4MB photograph is 4MB on every
   save this tenant makes until somebody deletes it.

   ENCODED BOTH WAYS, AND THE SMALLER ONE KEPT. §16.12 asks for two different
   things — "a screenshot of a platform" and "an outcome". A photograph is far
   smaller as a JPEG; a screenshot of a table is both smaller AND sharper as a
   PNG, because JPEG puts a halo round every letter. Guessing from the file's
   own type gets it wrong the moment somebody pastes a screenshot saved as JPG,
   so it is measured rather than guessed. */
function picIntake(file){
  return new Promise(function(resolve, reject){
    if (!file || !/^image\//.test(file.type || "")) {
      reject(new Error("that is not a picture")); return;
    }
    imgToCanvas(file, PIC_MAX_EDGE, "#FFFFFF").then(function(cv){
      var jpg = cv.toDataURL("image/jpeg", 0.82);
      var png = cv.toDataURL("image/png");
      resolve(png.length < jpg.length ? png : jpg);
    }, reject);
  });
}

/* Read a file, scale it to fit `maxEdge`, and hand back the canvas. The ONE
   copy of decode-and-scale, because two things want it for opposite reasons.

   `ground` is a colour painted before the picture, or null for none, and it
   is not a detail: a slide picture needs WHITE underneath or a transparent
   PNG re-encoded as a JPEG comes back with a black ground, while a LOGO needs
   nothing underneath at all — a ground behind a logo is the very fault that
   made the supplied JPEGs unusable (§52.2). One helper, and the difference
   stated by its caller rather than guessed here. */
function imgToCanvas(file, maxEdge, ground){
  return new Promise(function(resolve, reject){
    var fr = new FileReader();
    fr.onerror = function(){ reject(new Error("the file could not be read")); };
    fr.onload = function(){
      var img = new Image();
      img.onerror = function(){ reject(new Error("that picture could not be opened")); };
      img.onload = function(){
        var w = img.naturalWidth, h = img.naturalHeight;
        if (!w || !h) { reject(new Error("that picture has no size")); return; }
        var k = Math.min(1, maxEdge / Math.max(w, h));
        var cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k));
        var cv = document.createElement("canvas");
        cv.width = cw; cv.height = ch;
        var cx = cv.getContext("2d");
        if (ground) { cx.fillStyle = ground; cx.fillRect(0, 0, cw, ch); }
        cx.imageSmoothingQuality = "high";
        cx.drawImage(img, 0, 0, cw, ch);
        resolve(cv);
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

/* ── A VIDEO ON A SLIDE (§261) ────────────────────────────────────────────
   The clip is NOT in the state graph and never will be: the graph is 297KB
   and travels to every person on every sign-in, while a two-minute clip is
   20–40MB. What the slide keeps is a pointer, a poster frame and two numbers.
   §50's model is otherwise untouched — same list, same anchor, same place in
   the deck, same cycle, same permission.

   `kind` DECIDES WHAT IS DRAWN, AND NOTHING IS THROWN AWAY. Switching a slide
   to Video keeps its pictures exactly as narrowing the arrangement keeps them
   (§50.6): changing your mind must never cost what somebody already put
   there. Absent means pictures, so every slide already stored reads as it did
   and nothing is migrated. */
function slideIsVideo(sl){ return !!sl && sl.kind === "video"; }
function vidOf(sl){ return slideIsVideo(sl) && sl.vid ? sl.vid : null; }

/* The office's own hosts, from Setup › Video storage. Read through one
   function because the deck, the paste box and the storage page must agree
   about which links play (§53.5) — and reading NEVER creates the field
   (§42): a reader that writes puts a phantom change into every save. */
function videoHosts(){
  var v = GROUP && GROUP.videoHosts;
  return Array.isArray(v) ? v : VID_NO_HOSTS;
}
var VID_NO_HOSTS = Object.freeze([]);

/* WHERE A CLIP IS PLAYED FROM. One of ours goes through the platform's own
   address, which checks the session and sends the browser on to the store —
   so no address that outlives a sign-in is ever written into a slide, and a
   deck opened by somebody who may not see it plays nothing.

   A link is resolved at the moment of drawing rather than at the moment of
   pasting, so adding a host on the storage page makes every link already
   pasted for that host start playing (§42). */
function videoPlay(vid){
  if (!vid) return null;
  if (vid.path) return { kind:"file", play:"/api/blob?play=" + encodeURIComponent(vid.path) };
  var r = SMPRules.videoLink(vid.url, videoHosts());
  return r.kind ? r : null;
}

/* ── Taking a clip in ─────────────────────────────────────────────────────
   MEASURED, NEVER TRUSTED. The ceiling is 50MB and two minutes (Islam), and
   both are read off the file itself — the length from the browser's own
   decoder, because a name and a size say nothing about how long something
   runs. Refused ABOVE the ceiling with the reason said, never silently
   re-encoded: what somebody exported on purpose is what the room sees, and
   there is no `canvas.toDataURL` for video to re-encode it with anyway. */
function videoMeta(file){
  return new Promise(function(resolve, reject){
    var url = URL.createObjectURL(file);
    var v = document.createElement("video");
    var done = false;
    var give = function(err, out){
      if (done) return;
      done = true;
      URL.revokeObjectURL(url);
      err ? reject(err) : resolve(out);
    };
    /* A file the browser cannot decode never fires either event, and a promise
       that never settles is a spinner nobody can explain (§231.5's hang). */
    setTimeout(function(){ give(new Error("it could not be read")); }, 20000);
    v.onerror = function(){ give(new Error("that is not a video this browser can play")); };
    v.onloadeddata = function(){
      var secs = Math.round(v.duration || 0);
      if (!(secs > 0)) return give(new Error("its length could not be read"));
      if (secs > SMPRules.VIDEO_MAX_SECS) {
        return give(new Error("it runs " + vidTime(secs) + " and the limit is " +
          vidTime(SMPRules.VIDEO_MAX_SECS)));
      }
      /* THE POSTER IS WHAT MAKES THE DECK SURVIVE A CLIP IT CANNOT REACH
         (§15.1, §45.2). Grabbed here rather than asked for, and small — it is
         the one part of a clip that DOES ride in the graph, so it is sized
         like a thumbnail and not like a picture slide. */
        var w = v.videoWidth || 16, h = v.videoHeight || 9;
        var k = Math.min(1, 640 / Math.max(w, h));
        var cv = document.createElement("canvas");
        cv.width = Math.max(1, Math.round(w * k));
        cv.height = Math.max(1, Math.round(h * k));
        var cx = cv.getContext("2d");
        cx.fillStyle = "#0D1520";
        cx.fillRect(0, 0, cv.width, cv.height);
        try { cx.drawImage(v, 0, 0, cv.width, cv.height); } catch (e) { /* a frame we cannot draw is not a failure — the slide has its title */ }
        give(null, { secs:secs, bytes:file.size, name:file.name,
                     poster:cv.toDataURL("image/jpeg", 0.7) });
    };
    /* A tenth of a second in: the first frame of a clip is very often black. */
    v.onloadedmetadata = function(){ try { v.currentTime = Math.min(0.1, (v.duration || 1) / 2); } catch (e) { /* some decoders refuse to seek; loadeddata still fires */ } };
    v.preload = "auto";
    v.muted = true;
    v.src = url;
  });
}

function vidTime(secs){
  secs = Math.max(0, Math.round(secs || 0));
  return Math.floor(secs / 60) + ":" + String(secs % 60).padStart(2, "0");
}
function vidSize(bytes){
  var mb = (bytes || 0) / 1048576;
  return (mb >= 10 ? Math.round(mb) : Math.round(mb * 10) / 10) + "MB";
}

/* THE FILE GOES STRAIGHT PAST US. Our own endpoint checks who is asking and
   hands back a one-shot address; the browser sends the bytes to the store
   itself. That is not a nicety — a serverless function refuses a body over
   4.5MB, so a 50MB clip could not reach the store by any other road. */
function videoUpload(file, target, onProgress){
  return videoMeta(file).then(function(meta){
    if (file.size > SMPRules.VIDEO_MAX_BYTES) {
      throw new Error("it is " + vidSize(file.size) + " and the limit is " +
        vidSize(SMPRules.VIDEO_MAX_BYTES));
    }
    return new Promise(function(resolve, reject){
      SYNC.videoSign({ target:target, name:file.name, bytes:file.size,
                       type:file.type }, function(err, j){
        if (err || !j || !j.path) {
          return reject(new Error(
            err === "no server here"
              ? "there is nowhere to put it from this copy of the platform"
            : err === "no video store here"
              ? "video storage has not been switched on for this deployment yet. " +
                "The clip is fine \u2014 nothing has been lost. A link to a video " +
                "kept on YouTube, Vimeo, SharePoint or Google Drive works in the " +
                "meantime"
            : (err || "the store would not take it")));
        }
        SYNC.videoPut({ file:file, path:j.path, key:j.key, uploadId:j.uploadId,
                        onPart:onProgress },
          function(err2){
            if (err2) return reject(new Error(err2));
            resolve(Object.assign({ path:j.path }, meta));
          });
      });
    });
  });
}

/* ── MANAGE SLIDES (§51.8) ────────────────────────────────────────────────
   Islam: "the buttons shouldn't be pictures it should be manage slides which
   opens the slides list on the left like PowerPoint and on the right are the
   slides view and the user can add a slide there a blank one and then add
   pictures there. think of the customer experience to have something
   functional."

   THE LEFT RAIL IS THE WHOLE DECK, not just the picture slides — every
   generated slide too, in the order they will project. That is what makes the
   POSITION DROPDOWN DISAPPEAR: where a picture slide goes is said by where it
   sits, which is how anybody who has used slides expects to say it. §50.3's
   rule is unchanged underneath — the anchor is still read back out of the deck
   — but it is now read from where you dropped the slide rather than typed into
   a list describing the deck in words.

   It is a MODE rather than a dialog, for the same reason presenting is: this
   is looking at a deck, and a deck does not fit in a 940px box.

   Nothing about what is STORED changed. Still a title, an anchor, an
   arrangement and the pictures (§50.2). */

var SLED = { target:null, kind:null, key:null, sel:null, err:"" };

/* Every section in the assembled deck gets an identity the rail can hold on
   to across a repaint: a picture slide by its own id, a generated slide by its
   running position among the generated ones — which does not move when a
   picture slide is added above it. */
/* ── THE EDITOR ASSEMBLES THE SAME DECK THE PROJECTOR DOES (§69.5) ──────
   It did not, and three of Islam's complaints about Manage slides were one
   cause: content overflowed its slide, the unit's lockup was missing from
   every footer, and a long table simply ran off the bottom instead of
   continuing. All three are steps openDeckWith() runs and this did not —
   deckFootMarks() and deckFitPass() — so the rail and the stage were showing a
   deck nobody would ever project. The mode exists to show you the real slide
   at one tenth (§51.8); it was showing an unfinished one.

   THE BOX HAS TO BE IN THE DOCUMENT, and that is the whole reason this was
   easy to miss. `deckFitPass()` decides by measuring — `s.scrollHeight >
   s.clientHeight` — and both are 0 on a detached element, so a detached deck
   reports every slide as fitting and the pass silently does nothing. §50.3
   renders the deck detached to read its anchors out, which is fine for reading
   markup and useless for reading a height.

   So it goes into a host that is a real `.deck`: 1600x900, laid out, and
   parked off-screen with `left:-99999px` rather than hidden — `display:none`
   has no layout and `visibility:hidden` still keeps the box, but off-screen is
   the one that is unambiguously measurable (§3.2's lesson from the other end).
   `inert` and `aria-hidden`, because a full deck of slides in the accessibility
   tree behind the editor is a screen reader walking the whole review twice. */
/* A DECK THAT CANNOT BE BUILT SAYS SO (§253.3). `slidesAssemble()` had a
   `try/finally` and no catch, and `slidesPaint()` opened `if (!all.length)
   return;` — so a throw anywhere in the builder, or a deck that came back
   empty, left the editor's bar drawn over a blank rail and a blank stage with
   nothing said and nothing in the console the person could see. That is the
   screen Islam sent. §32's rule (a refusal must be visible where the act was)
   and §171's (a failure that is silent is indistinguishable from a success),
   on the one surface that had neither.

   THE CAUSE IS FIXED ABOVE and this is the net under it, said as such: it
   makes an invisible failure visible, it does not claim to have found the
   cause of any particular one. */
function slidesAssemble(){
  var host = document.createElement("div");
  host.className = "slmeasure";
  host.setAttribute("aria-hidden", "true");
  host.inert = true;
  var box = document.createElement("div");
  box.className = "deck";
  host.appendChild(box);
  document.body.appendChild(host);
  try {
    /* §253.3: the FORMAT decides the deck, never the `fn:` prefix — asked
       through the one reader Present and the anchors also ask. */
    box.innerHTML = deckHtmlFor(SLED.target);
    insertPictureSlides(box, SLED.target, true);
    /* The same order openDeckWith() uses, and the order matters both ways:
       AFTER the picture slides so a custodian's own slide is footed too, and
       BEFORE the fit pass so a slide it splits carries the footer into every
       continuation (§52.9). */
    if (SLED.target.indexOf("fn:") !== 0 && UNITS[SLED.target]) {
      deckFootMarks(box, UNITS[SLED.target]);
    }
    deckFitPass(box);
    /* The keys are minted AFTER the fit pass, or a continuation slide it mints
       carries a clone of its parent's `data-ed` — two rows in the rail with one
       key, so selecting the second selects the first and the arrows stick. */
    var g = 0;
    [].forEach.call(box.querySelectorAll(".dslide"), function(el){
      var id = el.getAttribute("data-ps");
      el.dataset.ed = id ? "ps:" + id : "gen:" + (g++);
    });
    /* ── THE EDITOR MARKS WHAT THE PROJECTOR REMOVES (§256) ────────────
       `deckHidePass()` is deliberately NOT called here. This mode exists to
       show the whole deck, and a hidden slide that vanished from the rail
       could never be brought back (§61) — so it is stamped instead, and the
       rail dims it and says so.

       Stamped after the fit pass, so a hidden table long enough to continue
       marks BOTH its parts: on this side they are two rows, and a row wearing
       the state while its own continuation does not is the row disagreeing
       with itself. On the projector the question never arises, because the
       parent is removed before it can be split.

       INSIDE THE TRY, with §253.3's catch below it: a subject whose stored
       list cannot be read is a deck that could not be built, and the person
       gets that sentence rather than a blank rail. */
    var subj = deckSubject(SLED.target);
    [].forEach.call(box.querySelectorAll(".dslide[data-anchor]"), function(el){
      if (SMPRules.slideHidden(subj, el.dataset.anchor)) el.dataset.off = "1";
    });
  } catch (e) {
    /* Kept, not rethrown: the editor is already open, and the person needs a
       sentence rather than a blank screen. `slidesPaint()` reads it. */
    SLED.err = "This deck could not be built. Nothing has been lost — your "
             + "pictures are saved with the cycle. " + (e && e.message ? e.message : "");
    box.innerHTML = "";
  } finally {
    /* Detached before it is read from, so a failure anywhere above cannot
       leave a full deck parked in the document for the rest of the session. */
    host.remove();
  }
  return box;
}
/* A heading carries its own kicker inside it (`.dwhich` — "Key measures",
   "Tactics", "continued"), so reading the element's textContent ran the two
   together: "RS03 Retail Operations ExcellenceKey measures". The parts are
   read separately and joined with a separator, which is what the slide itself
   shows visually. */
function slidesLabel(el){
  var h = el.querySelector("h1, h2");
  if (!h) return el.classList.contains("d-swot") ? "SWOT" : "Slide";
  var extra = [];
  [].forEach.call(h.querySelectorAll("span, em"), function(x){
    var t = x.textContent.trim();
    if (t) extra.push(t);
  });
  var clone = h.cloneNode(true);
  [].forEach.call(clone.querySelectorAll("span, em"), function(x){ x.remove(); });
  var main = clone.textContent.trim();
  return [main].concat(extra).filter(Boolean).join(" \u00b7 ") || "Slide";
}
/* WHAT THE SLIDE HOLDS, IN ITS OWN WORD (\u00a7261.13). The rail said "your
   pictures" under every slide the custodian added, video included \u2014 so a
   clip was labelled as the one thing it is not, on the surface whose whole
   job is telling the slides apart. Two places write that word (the rail is
   built once and the open row is rewritten as somebody types), so it is one
   function or they drift the next time either is touched (\u00a753.5). */
function slidesMineWord(sl){
  return slideIsVideo(sl) ? "your video" : "your pictures";
}

function slidesOpen(kind, key){
  var target = kind === "fn" ? "fn:" + key : key;
  if (!canSpeakFor(target)) return;
  SLED = { target:target, kind:kind, key:key, sel:null, err:"" };
  var root = document.getElementById("slideroot");
  root.querySelector(".sl-title").textContent = "Manage slides";
  root.querySelector(".sl-sub").textContent =
    picTargetName(kind, key) + " · " + (REVIEW.name || "");
  root.classList.add("on");
  document.body.classList.add("presenting");
  var wrap = document.querySelector(".wrap");
  if (wrap) { wrap.inert = true; wrap.setAttribute("aria-hidden", "true"); }
  slidesPaint();
  root.focus();
}
function picTargetName(kind, key){
  return kind === "fn" ? (FUNCTIONS[key] || {}).name || key
                       : (UNITS[key] || {}).name || key;
}
/* ── PLAY, AND COMING BACK (§295) ────────────────────────────────────────
   Islam: *"if they exit the presentation mood thye get back to the manage ppt
   for quick edits if needed."*

   THE EDITOR IS NOT CLOSED, IT IS STOOD DOWN. The deck is painted over it and
   the mode is left exactly as it was — the same slide selected, the rail at the
   same scroll — because coming back to where you were is the whole of what was
   asked for. Closing and reopening would repaint it (§71.2) and land you at the
   top of a 31-row rail.

   `inert` AND `aria-hidden`, the pair `slidesOpen()` already puts on the page
   behind it: without them the keyboard walks out of the deck and into a rail
   nobody can see. */
function slidesSuspend(){
  var root = document.getElementById("slideroot");
  root.inert = true;
  root.setAttribute("aria-hidden", "true");
}
function slidesResume(){
  var root = document.getElementById("slideroot");
  root.inert = false;
  root.removeAttribute("aria-hidden");
  root.focus();
}
/* The deck for whatever this editor is editing, through the ONE resolver
   (§295): the Present button and this ask `openDeckFor()` the same question,
   so a pillars function cannot get one deck here and another there — which is
   the fault §253.3 found on this very screen. */
function slidesPlay(){
  if (!SLED.target) return;
  /* THE DECK OPENS FIRST, AND ONLY THEN IS THE EDITOR STOOD DOWN. The other
     order is one line shorter and leaves the mode INERT WITH NOTHING IN FRONT
     OF IT if the deck cannot be built — an editor nobody can click, with the
     reason in a console nobody has open (§32, §171). Standing down after the
     open means a throw costs the press and nothing else. */
  openDeckFor(SLED.target, "editor");
  slidesSuspend();
}

function slidesClose(){
  var root = document.getElementById("slideroot");
  if (!root.classList.contains("on")) return;
  root.classList.remove("on");
  document.body.classList.remove("presenting");
  var wrap = document.querySelector(".wrap");
  if (wrap) { wrap.inert = false; wrap.removeAttribute("aria-hidden"); }
  SLED = { target:null, kind:null, key:null, sel:null, err:"" };
  paint();
}

/* ── Painting ────────────────────────────────────────────────────────────
   The rail's thumbnails are the REAL slides, scaled. Not a drawing of a slide
   and not a description of one: the same markup the projector gets, at 1/10,
   so a slide that is wrong is wrong here too. */
var SL_THUMB = 0.105;

function slidesPaint(){
  var box = slidesAssemble();
  var all = [].slice.call(box.querySelectorAll(".dslide"));
  if (!all.length) {
    /* NEVER A SILENT RETURN (§253.3). This left the bar over an empty rail and
       an empty stage — the screen Islam reported — so an empty deck now says
       what happened where the act was. */
    document.getElementById("slidelist").innerHTML =
      '<p class="picsub">Nothing to show here yet.</p>';
    document.getElementById("slidepane").innerHTML =
      '<p class="picerr" role="alert">' + esc(SLED.err ||
        "This review has no slides to manage yet. A plan with nothing in it "
        + "produces no deck, so there is nowhere to put a picture.") + '</p>';
    return;
  }
  /* Keep the selection if it still exists; otherwise take the first picture
     slide, and failing that the first slide. */
  var keys = all.map(function(el){ return el.dataset.ed; });
  if (keys.indexOf(SLED.sel) < 0) {
    var firstPic = all.filter(function(el){ return el.dataset.ps; })[0];
    SLED.sel = firstPic ? firstPic.dataset.ed : keys[0];
  }

  /* ADD A SLIDE SITS AT THE TOP, PINNED (§51.9). It was the last thing in the
     rail, after all twenty-three rows — so the one control the whole mode
     exists for could only be found by scrolling to the end of a list nobody
     had a reason to scroll. A control you have to go looking for is a control
     that is not there. */
  var list = document.getElementById("slidelist");
  var off = all.filter(function(el){ return el.dataset.off; });
  list.innerHTML = '<div class="sl-add"><button class="editbtn" data-sladd="1">' +
      '+ Add slide after</button>' +
      '<span class="picsub">' + (SLED.sel && SLED.sel.indexOf("ps:") === 0
        ? "the one selected" : "the slide selected below") + '</span></div>' +
    slidesHiddenLine(off.length) +
    all.map(function(el, i){
    var mine = !!el.dataset.ps;
    return '<div class="slrow' + (el.dataset.ed === SLED.sel ? " on" : "") +
        (mine ? " mine" : "") + (el.dataset.off ? " off" : "") +
        '" data-slgo="' + esc(el.dataset.ed) + '">' +
      '<span class="sl-n">' + (i + 1) + '</span>' +
      '<span class="sthumb"><span class="sthumb-in"></span></span>' +
      '<span class="sl-lab">' + esc(slidesLabel(el)) +
        (mine ? '<em>' + esc(slidesMineWord(
          pslideById(SLED.target, el.dataset.ps))) + '</em>' : '') + '</span>' +
      (el.dataset.off ? '<span class="sl-off">Hidden</span>' : '') +
      slidesEye(el, all) + '</div>';
  }).join("");

  /* The clones go in after the innerHTML, or writing the rail would discard
     them. Each thumbnail is the slide itself with `.on` so it lays out. */
  [].forEach.call(list.querySelectorAll(".sthumb-in"), function(holder, i){
    var c = all[i].cloneNode(true);
    c.classList.add("on");
    holder.appendChild(c);
  });

  var pane = document.getElementById("slidepane");
  var cur = all[keys.indexOf(SLED.sel)];
  var sl = cur && cur.dataset.ps ? pslideById(SLED.target, cur.dataset.ps) : null;
  pane.innerHTML = slidesPaneHtml(cur, sl);
  var stage = pane.querySelector(".sstage-in");
  if (stage && cur) {
    var c = cur.cloneNode(true);
    c.classList.add("on");
    stage.appendChild(c);
  }
  /* The stage plays; the rail does not (§261.14) — twenty thumbnails each
     loading a player is twenty players. */
  videoArm(document.getElementById("slideroot"), stage);
  slidesFitStage();
  slidesWire();
  /* THE RAIL FOLLOWS THE SELECTION. Adding a slide in the middle of a
     twenty-three slide deck and being shown the bottom of the list is the rail
     answering a question nobody asked. `nearest` rather than `center`, so a
     selection already on screen does not jump. */
  var on = list.querySelector(".slrow.on");
  if (on && on.scrollIntoView) on.scrollIntoView({ block:"nearest" });
  SLED.err = "";
}

/* ── HIDING A SLIDE (§256) ───────────────────────────────────────────────
   The office's alone (Islam). `inOffice()` is the platform's wrapper around
   the same `SMPRules.isOffice()` the server asks before it accepts the save
   (§42) — a screen that offers what the save refuses is the drift that whole
   module exists to prevent. A custodian or an owner opening this mode for
   their pictures still SEES what is hidden; they get no control.

   THE EYE IS THE ONLY CONTROL, and it is drawn on every row rather than on
   hidden ones alone: a switch you can only find once it is on is a switch
   nobody turns on. It is `aria-disabled`, never `disabled`, on the one row
   it refuses, or the sentence explaining the refusal cannot be reached by
   hover or by focus (§163, §221). */
var EYE_ON = '<svg viewBox="0 0 20 20" width="14" height="14" fill="none" ' +
  'stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
  '<path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z"/><circle cx="10" cy="10" r="2.2"/></svg>';
var EYE_OFF = EYE_ON.replace("</svg>", '<path d="M3 3l14 14"/></svg>');

/* A deck presented with nothing in it is not a presentation, so the last
   slide standing cannot be hidden — refused HERE, on the press, rather than
   in `deckHidePass()`: a pass that quietly declined to remove what it was
   told to remove would be a second answer to the same question (§53.5), and
   the person pressing would never learn why. Showing one again is always
   allowed, whatever the count. */
function slidesCanHide(el, all){
  if (el.dataset.off) return true;
  return all.filter(function(s){ return !s.dataset.off; }).length > 1;
}
function slidesEye(el, all){
  /* A picture slide has no anchor and is not hidden — it is REMOVED, by the
     control the pane already carries (§24: not a second way to do one act). */
  if (!el.dataset.anchor || !inOffice()) return "";
  var hid = !!el.dataset.off, can = slidesCanHide(el, all);
  return '<button class="slhide" data-slhide="' + esc(el.dataset.anchor) + '"' +
    (can ? "" : ' aria-disabled="true"') +
    ' title="' + (hid ? "Show this slide in the review again"
                      : can ? "Hide this slide from the review"
                            : "This is the only slide left to show") + '"' +
    ' aria-label="' + (hid ? "Show this slide again" : "Hide this slide") + '">' +
    (hid ? EYE_OFF : EYE_ON) + '</button>';
}
/* Quiet, never amber (§187, §168). Hidden slides are a decision somebody made
   on purpose, not something outstanding, and an alarm ground over a healthy
   state is how a product teaches people to stop reading its colours. Drawn
   only when there is something to say (§41's budget) — and drawn for EVERYONE,
   because the state is the deck's and seeing it is not the same act as
   setting it. `Show all` is the office's. */
function slidesHiddenLine(n){
  if (!n) return "";
  return '<div class="sl-hidden"><span>' + plural(n, "slide") + ' hidden</span>' +
    (inOffice() ? '<button class="lnk" data-slshowall="1">Show all</button>' : '') +
    '</div>';
}
/* Sorted, so hiding A then B and hiding B then A leave the same bytes — an
   array that remembers the order it was written in reports a change to the
   server every time somebody hides two slides in the other sequence.
   The emptied key is DELETED (§50.6). */
function slidesSetHidden(anchor, on){
  var subj = deckSubject(SLED.target);
  if (!subj || !anchor) return;
  var list = SMPRules.hiddenSlides(subj).slice(), i = list.indexOf(anchor);
  if (on && i < 0) list.push(anchor);
  if (!on && i >= 0) list.splice(i, 1);
  list.sort();
  if (list.length) subj[SMPRules.HIDE_SLIDES] = list;
  else delete subj[SMPRules.HIDE_SLIDES];
  slidesMark(); slidesPaint();
}

function slidesPaneHtml(cur, sl){
  /* A 50MB clip takes real seconds to leave the building, and silence while it
     does is indistinguishable from a control that did nothing (§193). `busy`
     survives the repaint that shows it — `slidesPaint()` clears only `err` —
     and is cleared by whichever way the upload ends. */
  var head = (SLED.err ? '<p class="picerr" role="alert">' + esc(SLED.err) + '</p>' : '') +
             (SLED.busy ? '<p class="picbusy" role="status">' + esc(SLED.busy) + '</p>' : '');
  if (!sl) {
    var hid = !!(cur && cur.dataset.off);
    /* WHAT HIDING COSTS IS SAID WHERE IT IS DONE, and it is the sentence that
       keeps this apart from §233: that switch takes a row out of every score,
       this one takes a slide out of the projector and out of nothing else.
       Somebody who has just hidden a slide should not have to go and find out
       whether they have moved a number. */
    return head +
      '<div class="sstage' + (hid ? " sstage-off" : "") + '"><div class="sstage-in"></div></div>' +
      (hid
        ? '<div class="slctl slctl-read"><div class="slctl-h slctl-off">' +
          '<b>Hidden from the review</b>' +
          (inOffice() ? '<button class="editbtn" data-slshow="' +
            esc(cur.dataset.anchor || "") + '">Show this slide</button>' : '') +
          '</div><p class="picsub">It is skipped when the deck is presented. Nothing ' +
          'else changes &mdash; the figures on it are still reported, still scored and ' +
          'still on the page.</p></div>'
        : '<div class="slctl slctl-read"><p class="picsub">This slide is built by the ' +
          'platform from what the unit has reported, and is refreshed every time the ' +
          'deck opens. <b>Add slide after</b> puts your own pictures after it.</p></div>');
  }
  var pics = sl.pics || [];
  var across = Math.max(1, Math.min(PIC_PER_SLIDE, +sl.layout || 1));
  var vid = slideIsVideo(sl);
  var slots = [];
  for (var i = 0; i < across; i++) slots.push(slidesSlot(sl, pics[i], i));
  return '<div class="sstage"><div class="sstage-in"></div></div>' +
    '<div class="slctl">' +
      '<div class="slctl-h">' +
        '<input class="fld picttl" data-picttl="' + esc(sl.id) + '" value="' + esc(sl.title || "") +
          '" placeholder="Slide title — optional" aria-label="Slide title">' +
        /* WHAT IS ON THE SLIDE, before how much of it. The arrangement is a
           question about pictures, so it is not asked at all on a video. */
        '<span class="minisw" role="group" aria-label="What is on this slide">' +
          '<button data-slkind="' + esc(sl.id) + '" data-v="pics" aria-pressed="' + (!vid) +
            '" title="Pictures on this slide">Pictures</button>' +
          '<button data-slkind="' + esc(sl.id) + '" data-v="video" aria-pressed="' + vid +
            '" title="A video on this slide">Video</button>' +
        '</span>' +
        (vid ? '' :
        '<span class="minisw" role="group" aria-label="Pictures on the slide">' +
          [1,2,3,4].map(function(n){
            return '<button data-piclay="' + esc(sl.id) + '" data-n="' + n + '" aria-pressed="' +
              (across === n) + '" title="' + n + ' on the slide">' + n + '</button>';
          }).join("") + '</span>') +
        '<span class="slmove"><button data-slmove="-1" aria-label="Move this slide up" ' +
          'title="Move up">&#9650;</button>' +
          '<button data-slmove="1" aria-label="Move this slide down" ' +
          'title="Move down">&#9660;</button></span>' +
        '<button class="editbtn" data-picdel="' + esc(sl.id) + '">Remove slide</button>' +
      '</div>' +
      /* HERE, not at the top of the pane (§261.12): a refusal about a clip
         belongs beside the box the clip was chosen in. */
      head +
      (vid ? vslideCtl(sl) :
      '<div class="picslots">' + slots.join("") + '</div>' +
      (pics.length > across
        ? '<p class="picsub picover">' + (pics.length - across) + ' more ' +
          (pics.length - across === 1 ? "picture is" : "pictures are") +
          ' kept but not shown at this arrangement.</p>' : '')) +
    '</div>';
}

/* ── The video half of the pane (§261) ───────────────────────────────────
   TWO WAYS IN, SIDE BY SIDE AND EQUAL — Islam asked for both, and neither is
   the fallback: a unit whose clip already sits on the company's own storage
   should not have to download it in order to upload it again.

   THE PASTE BOX ANSWERS AT THE DESK. Whether a link will play on the slide or
   only open in a new tab is decided by where the video lives, and the one
   moment that fact is worth anything is while somebody is still holding the
   link — never in the meeting room (§32, §171). So the line under the box is
   the verdict, not a description. */
/* THE TWO WAYS IN, in ONE builder — a slide that never had a clip and one
   whose clip the office cleared are the same question (§53.5), and writing
   them twice is how the ceiling comes to be checked on one of them.

   The ceiling counts the slide being edited OUT: a slide already holding a
   clip that is being replaced is not a fourth video. */
function vslideSrc(sl){
  var others = pslidesOf(SLED.target).filter(function(s){ return s.id !== sl.id; });
  if (!SMPRules.videoRoom(others)) {
    return '<p class="picsub vfull">This ' + esc(deckSubjectWord(SLED.target)) +
      ' already has ' + plural(SMPRules.VIDEO_PER_SUBJECT, "video") +
      ' in this review, which is the limit. Remove one to add another.</p>';
  }
  return '<div class="vsrc">' +
    '<label class="picdrop"><input type="file" accept="video/*" data-vidfile="' +
      esc(sl.id) + '">' +
      '<span class="picplus" aria-hidden="true">+</span><b>Upload a clip</b>' +
      '<span class="picsub">Up to ' + vidSize(SMPRules.VIDEO_MAX_BYTES) + ' and ' +
      vidTime(SMPRules.VIDEO_MAX_SECS) + '.</span></label>' +
    '<div class="vlink"><b>Or paste a link</b>' +
      '<input class="fld" data-vidlink="' + esc(sl.id) +
        '" placeholder="YouTube, Vimeo, SharePoint or Google Drive address" ' +
        'aria-label="Video address">' +
      '<span class="picsub" data-vidsay="1">The clip stays where it is; the review ' +
        'points at it.</span>' +
    '</div></div>';
}

function vslideCtl(sl){
  var vid = vidOf(sl);
  /* Cleared: the two ways in come BACK, because putting another clip on the
     slide is the only thing left to do here — but the fact is stated first,
     or it reads as a slide that lost its video for no reason (§61, §124). */
  if (vid && vid.cleared && !vid.path && !vid.url) {
    return '<p class="picsub vwarn">This clip was removed to free storage on ' +
      esc(vid.cleared) + '. The slide kept its title and caption.</p>' +
      vslideSrc(sl);
  }
  if (!vid) return vslideSrc(sl);
  var how = videoPlay(vid);
  var what = vid.path
    ? esc(vid.name || "Your clip") : esc(vid.url);
  var facts = vid.path
    ? [vidTime(vid.secs), vidSize(vid.bytes),
       "uploaded by " + esc(vid.by || "—") + (vid.at ? ", " + esc(vid.at) : "")].join(" · ")
    : (how && how.kind === "embed"
        ? "Plays on the slide" + (how.service ? " · " + esc(how.service) : "")
        : how && how.kind === "file" ? "Plays on the slide"
        : "Opens in a new tab — upload the file to play it on the slide")
      + (vid.at ? " · added " + esc(vid.at) : "");
  return '<div class="vhas">' +
      '<span class="vthumb">' +
        (vid.poster ? '<img src="' + esc(vid.poster) + '" alt="">' : '') +
        '<span class="vbadge" aria-hidden="true"></span></span>' +
      '<span class="vmeta"><b>' + what + '</b>' +
        '<span class="picsub">' + facts + '</span></span>' +
      '<span class="vacts">' +
        '<button class="editbtn" data-vidswap="' + esc(sl.id) + '">Replace</button>' +
        '<button class="editbtn" data-viddrop="' + esc(sl.id) + '">Remove</button>' +
      '</span>' +
    '</div>' +
    '<input class="fld vcap" data-vidcap="' + esc(sl.id) + '" value="' + esc(sl.vcap || "") +
      '" placeholder="Caption — optional" aria-label="Caption">';
}

/* The subject's own word, so the ceiling reads "This business unit already
   has…" rather than naming a key nobody uses (§93.12's vocabulary). */
function deckSubjectWord(target){
  return String(target || "").indexOf("fn:") === 0 ? "supporting function" : "business unit";
}

function slidesSlot(sl, p, i){
  if (!p || !p.src) {
    return '<div class="picslot empty">' +
      '<label class="picdrop"><input type="file" accept="image/*" data-picfile="' +
        esc(sl.id) + '" data-i="' + i + '">' +
      '<span class="picplus" aria-hidden="true">+</span><span>Add a picture</span></label></div>';
  }
  var z = Math.round((Math.max(0.5, Math.min(3, +p.z || 1))) * 100);
  var fills = p.fit === "cover";
  return '<div class="picslot" data-i="' + i + '">' +
    '<span class="picframe" data-picdrag="' + esc(sl.id) + '" data-i="' + i + '" ' +
      'title="Drag to move the picture inside the frame">' +
      '<img src="' + esc(p.src) + '" alt="" style="' + picStyle(p) + '"></span>' +
    '<div class="picctl">' +
      /* WHOLE or CROPPED, said in two words rather than inferred from a
         slider position (§51.10). Fit shows all of it; Fill bleeds it to the
         edges and throws away what does not reach. */
      '<span class="minisw" role="group" aria-label="How the picture sits">' +
        '<button data-picfit="' + esc(sl.id) + '" data-i="' + i + '" data-v="contain" ' +
          'aria-pressed="' + (!fills) + '" title="Show the whole picture">Fit</button>' +
        '<button data-picfit="' + esc(sl.id) + '" data-i="' + i + '" data-v="cover" ' +
          'aria-pressed="' + fills + '" title="Fill the frame, cropping the rest">Fill</button>' +
      '</span>' +
      '<button class="editbtn" data-picdrop="' + esc(sl.id) + '" data-i="' + i +
        '" aria-label="Remove this picture">Remove</button>' +
    '</div>' +
    '<label class="piczoom"><span>Zoom</span>' +
      '<input type="range" min="50" max="300" step="1" value="' + z + '" ' +
      'data-piczoom="' + esc(sl.id) + '" data-i="' + i + '" aria-label="Zoom">' +
      '<b>' + z + '%</b></label>' +
    '<input class="fld piccap" data-piccap="' + esc(sl.id) + '" data-i="' + i +
      '" value="' + esc(p.cap || "") + '" placeholder="Caption — optional" aria-label="Caption">' +
  '</div>';
}

/* The stage is the deck's own 1600x900, scaled to whatever room the pane has.
   Same trick deckScale() uses, and for the same reason: what is rehearsed has
   to be what projects, so the slide is never re-laid-out at another size. */
function slidesFitStage(){
  var pane = document.getElementById("slidepane");
  var st = pane && pane.querySelector(".sstage");
  if (!st) return;
  var k = Math.min(st.clientWidth / 1600, st.clientHeight / 900);
  if (!(k > 0)) k = 0.01;
  var inner = st.querySelector(".sstage-in");
  /* Left is 50% of the box, so pulling back half the SCALED width centres it.
     Translate before scale, because the two are applied right to left and a
     translate written after would itself be scaled. */
  if (inner) inner.style.transform = "translateX(" + (-1600 * k / 2) + "px) scale(" + k + ")";
}

/* ── Adding one where you are standing ───────────────────────────────────
   THE ANCHOR IS READ OUT OF THE DECK, still (§50.3) — but out of the PLACE
   rather than out of a dropdown. Walking back from the insertion point to the
   nearest anchored slide is the same lookup the picker used to render, asked
   from the other end.

   Where it lands in the stored list matters as much: several picture slides
   can share one anchor, and their order among themselves is list order. So
   the new one is spliced in at the position its VISUAL place implies, not
   appended and hoped for. */
/* ── Putting a slide in a place ──────────────────────────────────────────
   ONE function, because Add and the up/down arrows are the same act: decide
   which anchor the slide now belongs to, and where among that anchor's other
   slides it sits. Written twice they would drift, and the drift would be a
   slide that moves one way when added and another way when nudged.

   `after` is a position in the ASSEMBLED deck — insert immediately after that
   slide. The anchor is the nearest anchored slide at or before it (§50.3, read
   out of the deck as always), and the index inside the stored list is the
   count of that anchor's slides already sitting at or before the point. */
function slidesPlace(sl, all, after){
  var anchor = "";
  for (var i = after; i >= 0; i--) {
    if (all[i] && all[i].dataset.anchor) { anchor = all[i].dataset.anchor; break; }
  }
  if (!anchor) {
    for (var f = 0; f < all.length; f++) if (all[f].dataset.anchor) { anchor = all[f].dataset.anchor; break; }
  }
  if (!anchor) anchor = "end";

  var list = pslidesFor(SLED.target);
  var was = list.indexOf(sl);
  if (was > -1) list.splice(was, 1);        /* out first, so the count is honest */

  var k = 0;
  for (var j = 0; j <= after && j < all.length; j++) {
    var id = all[j].getAttribute("data-ps");
    if (!id || id === sl.id) continue;
    var other = pslideById(SLED.target, id);
    if (other && other.at === anchor) k++;
  }
  var withA = [];
  list.forEach(function(x, idx){ if (x.at === anchor) withA.push(idx); });
  var pos = k < withA.length ? withA[k]
          : (withA.length ? withA[withA.length - 1] + 1 : list.length);
  sl.at = anchor;
  list.splice(pos, 0, sl);
}

function slidesAdd(){
  var list = pslidesFor(SLED.target);
  if (list.length >= PIC_MAX_SLIDES) {
    SLED.err = PIC_MAX_SLIDES + " slides is the limit — remove one to add another.";
    slidesPaint();
    return;
  }
  var all = [].slice.call(slidesAssemble().querySelectorAll(".dslide"));
  var after = all.map(function(el){ return el.dataset.ed; }).indexOf(SLED.sel);
  if (after < 0) after = all.length - 1;
  var made = { id:pslideNewId(), title:"", layout:1, at:"", pics:[] };
  slidesPlace(made, all, after);
  SLED.sel = "ps:" + made.id;
  slidesMark();
  slidesPaint();
}

/* UP AND DOWN (§51.10; the walk re-cut in §236.2). Only picture slides move:
   the generated ones are the deck's own order and are not ours to shuffle.

   A PRESS MUST LAND SOMEWHERE A SLIDE CAN ACTUALLY LIVE. A stored position is
   an anchor plus a place among that anchor's own slides (§50.3), so stepping
   blindly one row recomputed the SAME position wherever the next row carries
   no anchor — the button repainted in place and did nothing, silently
   (measured: 25 dead presses of 28 walking Mobile's deck, §236.2). So the walk
   goes to the nearest row that IS a place: an anchored slide, or another
   picture slide (which keeps sibling reordering one step at a time). A slide
   whose NEXT row carries the same anchor is a fit-pass continuation's parent
   — the place is after the last of them, so the walk passes the clones. */
function slidesMove(dir){
  if (!SLED.sel || SLED.sel.indexOf("ps:") !== 0) return;
  var sl = pslideById(SLED.target, SLED.sel.slice(3));
  if (!sl) return;
  var all = [].slice.call(slidesAssemble().querySelectorAll(".dslide"));
  var at = all.map(function(el){ return el.dataset.ed; }).indexOf(SLED.sel);
  if (at < 0) return;
  var slot = function(j){
    if (all[j].getAttribute("data-ps")) return true;
    var a = all[j].dataset.anchor;
    return !!a && !(all[j + 1] && all[j + 1].dataset.anchor === a);
  };
  /* "after" is measured in the deck as it stands with this slide still in
     it: down starts one below, up starts two above (the row directly above
     is the one this slide already follows). */
  var after = null, j;
  if (dir > 0) { for (j = at + 1; j < all.length; j++) if (slot(j)) { after = j; break; } }
  else         { for (j = at - 2; j >= 0;         j--) if (slot(j)) { after = j; break; } }
  if (after == null) return;   /* the ceiling or the floor: nowhere further */
  slidesPlace(sl, all, after);
  slidesMark();
  slidesPaint();
}

function slidesMark(){ if (typeof SYNC !== "undefined" && SYNC.afterPaint) SYNC.afterPaint(); }

/* Re-draw the SELECTED slide only — the big one and its thumbnail — from the
   one function the deck itself uses. Not a repaint: the controls being typed
   into live in `.slctl`, a different subtree, so nothing under the cursor is
   replaced (§35's rule is about the field, not about the page).

   It exists because patching the rendered slide by hand does not survive a
   field going from empty to filled: typing the first title had nothing to
   write into, since a slide with no title has no heading element at all. */
function slidesRestage(){
  if (!SLED.sel || SLED.sel.indexOf("ps:") !== 0) return;
  var sl = pslideById(SLED.target, SLED.sel.slice(3));
  if (!sl) return;
  var html = pslideHtml(sl, true);
  var root = document.getElementById("slideroot");
  [root.querySelector(".sstage-in"), root.querySelector(".slrow.on .sthumb-in")]
    .forEach(function(holder){
      if (!holder) return;
      holder.innerHTML = html;
      if (holder.firstElementChild) holder.firstElementChild.classList.add("on");
    });
  /* The rail's WORDS as well as its picture. A slide whose thumbnail says
     "New stores this half" and whose label underneath still says "Slide" is
     the two halves of one row disagreeing. */
  videoArm(root, root.querySelector(".sstage-in"));
  var lab = root.querySelector(".slrow.on .sl-lab");
  var made = root.querySelector(".sstage-in .dslide");
  if (lab && made) lab.innerHTML = esc(slidesLabel(made)) +
    '<em>' + esc(slidesMineWord(sl)) + '</em>';
}
/* The same picture in both places, so framing it moves the slide AND the
   thumbnail. Done by patching rather than restaging, because a drag redraws
   many times a second and rebuilding the markup under the pointer is how a
   drag gets dropped. */
function slidesLive(i){
  var root = document.getElementById("slideroot");
  return [root.querySelectorAll(".sstage-in img")[i],
          root.querySelectorAll(".slrow.on .sthumb-in img")[i]]
    .filter(Boolean);
}

function slidesWire(){
  var root = document.getElementById("slideroot");
  var slideOf = function(el, attr){ return pslideById(SLED.target, el.dataset[attr]); };

  root.querySelectorAll("[data-slgo]").forEach(function(r){
    r.addEventListener("click", function(){ SLED.sel = r.dataset.slgo; slidesPaint(); });
  });
  root.querySelectorAll("[data-sladd]").forEach(function(b){
    b.addEventListener("click", slidesAdd);
  });

  /* §256. The eye sits INSIDE the row, and the row's own handler selects it —
     so the press has to be stopped from also walking the selection, or hiding
     a slide would move you to it. A refused press still explains itself
     rather than doing nothing (§221): `aria-disabled` takes focus and fires
     click, which is the whole reason it is not `disabled`. */
  root.querySelectorAll("[data-slhide]").forEach(function(b){
    b.addEventListener("click", function(e){
      e.stopPropagation();
      if (b.getAttribute("aria-disabled") === "true") {
        SLED.err = "Every other slide is hidden, so this one has to stay — " +
                   "a review with no slides in it cannot be presented.";
        slidesPaint();
        return;
      }
      var subj = deckSubject(SLED.target);
      slidesSetHidden(b.dataset.slhide, !SMPRules.slideHidden(subj, b.dataset.slhide));
    });
  });
  root.querySelectorAll("[data-slshow]").forEach(function(b){
    b.addEventListener("click", function(){ slidesSetHidden(b.dataset.slshow, false); });
  });
  /* The way back for all of them at once. It DELETES the field rather than
     writing an empty array (§50.6), which `slidesSetHidden` also does — but
     going through it one anchor at a time would repaint per slide, so this
     writes once. */
  root.querySelectorAll("[data-slshowall]").forEach(function(b){
    b.addEventListener("click", function(){
      var subj = deckSubject(SLED.target);
      if (!subj) return;
      delete subj[SMPRules.HIDE_SLIDES];
      slidesMark(); slidesPaint();
    });
  });
  root.querySelectorAll("[data-slmove]").forEach(function(b){
    b.addEventListener("click", function(){ slidesMove(+b.dataset.slmove); });
  });
  root.querySelectorAll("[data-picfit]").forEach(function(b){
    b.addEventListener("click", function(){
      var sl = slideOf(b, "picfit"); if (!sl) return;
      var p = (sl.pics || [])[+b.dataset.i]; if (!p) return;
      p.fit = b.dataset.v;
      slidesMark(); slidesPaint();
    });
  });
  root.querySelectorAll("[data-picdel]").forEach(function(b){
    b.addEventListener("click", function(){
      var list = pslidesFor(SLED.target), id = b.dataset.picdel;
      for (var i = 0; i < list.length; i++) if (list[i].id === id) { list.splice(i, 1); break; }
      pslidesTidy(SLED.target);
      SLED.sel = null;
      slidesMark(); slidesPaint();
    });
  });

  /* Typing never repaints (§35) — the stage above is refreshed by hand from
     the one field that changes it, so the slide follows the title without the
     control being replaced under the cursor. */
  root.querySelectorAll("[data-picttl]").forEach(function(f){
    f.addEventListener("input", function(){
      var sl = slideOf(f, "picttl"); if (!sl) return;
      sl.title = f.value;
      slidesRestage();
      slidesMark();
    });
  });
  root.querySelectorAll("[data-piccap]").forEach(function(f){
    f.addEventListener("input", function(){
      var sl = slideOf(f, "piccap"); if (!sl) return;
      var p = (sl.pics || [])[+f.dataset.i]; if (!p) return;
      p.cap = f.value;
      slidesRestage();
      slidesMark();
    });
  });

  root.querySelectorAll("[data-piclay]").forEach(function(b){
    b.addEventListener("click", function(){
      var sl = slideOf(b, "piclay"); if (!sl) return;
      /* Pictures are never thrown away when the arrangement narrows: four to
         one and back must return what was there (§50.6). */
      sl.layout = +b.dataset.n;
      slidesMark(); slidesPaint();
    });
  });

  /* ── The video controls (§261) ─────────────────────────────────────────
     THE SWITCH KEEPS BOTH SIDES. Turning a slide to Video leaves its pictures
     where they are and turning it back gives them straight back — the same
     rule the arrangement buttons already obey, and the reason §257.2 was
     corrected: making somebody pay for changing their mind is a defect. */
  root.querySelectorAll("[data-slkind]").forEach(function(b){
    b.addEventListener("click", function(){
      var sl = slideOf(b, "slkind"); if (!sl) return;
      if (b.dataset.v === "video") {
        /* The ceiling is asked HERE rather than at the upload, so nobody
           fills a clip in and is refused after choosing it (§221's shape:
           say it before the press, not after). A slide that is ALREADY a
           video is not a fourth. */
        if (!slideIsVideo(sl) && !SMPRules.videoRoom(pslidesOf(SLED.target))) {
          SLED.err = "This " + deckSubjectWord(SLED.target) + " already has " +
            plural(SMPRules.VIDEO_PER_SUBJECT, "video") + " in this review, " +
            "which is the limit. Remove one to add another.";
          slidesPaint();
          return;
        }
        sl.kind = "video";
      } else {
        /* Absent, never "pics" — a slide that has never been a video and one
           switched back must be the same bytes (§50.6). */
        delete sl.kind;
      }
      slidesMark(); slidesPaint();
    });
  });

  root.querySelectorAll("[data-vidfile]").forEach(function(f){
    f.addEventListener("change", function(){
      var sl = slideOf(f, "vidfile"), file = f.files && f.files[0];
      if (!sl || !file) return;
      SLED.err = "";
      SLED.busy = "Reading " + file.name + "…";
      slidesPaint();
      /* THE COUNT IS WRITTEN INTO THE NODE, never repainted (§63, §193). A
         paint here would replace the pane mid-upload — and a 50MB clip is a
         dozen pieces, so that is a dozen chances to throw the page away
         under somebody who is watching it. */
      var say = function(txt){
        SLED.busy = txt;
        var el = document.querySelector("#slidepane .picbusy");
        if (el) el.textContent = txt;
      };
      videoUpload(file, SLED.target, function(n, total){
        say("Sending " + file.name + " — piece " + n + " of " + total + "…");
      }).then(function(vid){
        SLED.busy = "";
        sl.vid = Object.assign(vid, { by: actingName(), at: todayLabel() });
        delete sl.vcapPending;
        slidesMark(); slidesPaint();
      }).catch(function(e){
        SLED.busy = "";
        SLED.err = "That clip could not be added — " + e.message + ".";
        slidesPaint();
      });
    });
  });

  /* THE VERDICT IS SAID WHILE THEY TYPE and stored only on the way out
     (§35: a field commits on change, which for a text box is on blur). The
     line is written into the node rather than repainted, or the box being
     typed into is replaced under the cursor (§71.2). */
  root.querySelectorAll("[data-vidlink]").forEach(function(f){
    var say = function(){
      var note = f.parentNode.querySelector("[data-vidsay]");
      if (!note) return;
      var raw = f.value.trim();
      if (!raw) {
        note.className = "picsub";
        note.textContent = "The clip stays where it is; the review points at it.";
        return;
      }
      var r = SMPRules.videoLink(raw, videoHosts());
      if (!r.kind) {
        note.className = "picsub vno";
        note.textContent = "That does not look like a web address.";
      } else if (r.kind === "away") {
        note.className = "picsub vwarn";
        note.textContent = "This one will not play on the slide — it opens in a new " +
          "tab. Upload the file instead to play it in the review.";
      } else {
        note.className = "picsub vyes";
        note.textContent = "This will play on the slide" +
          (r.service ? " (" + r.service + ")." : ".");
      }
    };
    f.addEventListener("input", say);
    f.addEventListener("change", function(){
      var sl = slideOf(f, "vidlink"); if (!sl) return;
      var raw = f.value.trim();
      if (!raw) return;
      var r = SMPRules.videoLink(raw, videoHosts());
      if (!r.kind) {
        SLED.err = "That does not look like a web address, so there is nothing to point at.";
        slidesPaint();
        return;
      }
      if (!SMPRules.videoRoom(pslidesOf(SLED.target))) {
        SLED.err = "This " + deckSubjectWord(SLED.target) + " already has " +
          plural(SMPRules.VIDEO_PER_SUBJECT, "video") + " in this review, which is the limit.";
        slidesPaint();
        return;
      }
      /* The COMPLETED address is stored and written back into the box, because
         seeing `https://` appear is the explanation (§176, §124). */
      sl.vid = { url: r.url, by: actingName(), at: todayLabel() };
      f.value = r.url;
      slidesMark(); slidesPaint();
    });
  });

  root.querySelectorAll("[data-viddrop]").forEach(function(b){
    b.addEventListener("click", function(){
      var sl = slideOf(b, "viddrop"); if (!sl) return;
      /* THE SLIDE STAYS AND THE CLIP GOES, so the way back is the box that
         was there before (§61). The bytes in our store are NOT deleted here:
         a clip is cleared from Setup › Video storage, deliberately, because
         an archived review still points at it (§49.2). */
      delete sl.vid;
      slidesMark(); slidesPaint();
    });
  });
  root.querySelectorAll("[data-vidswap]").forEach(function(b){
    b.addEventListener("click", function(){
      var sl = slideOf(b, "vidswap"); if (!sl) return;
      delete sl.vid;
      slidesMark(); slidesPaint();
    });
  });
  root.querySelectorAll("[data-vidcap]").forEach(function(f){
    f.addEventListener("input", function(){
      var sl = slideOf(f, "vidcap"); if (!sl) return;
      sl.vcap = f.value;
      slidesRestage();
      slidesMark();
    });
  });

  root.querySelectorAll("[data-picfile]").forEach(function(f){
    f.addEventListener("change", function(){
      var sl = slideOf(f, "picfile"), file = f.files && f.files[0];
      if (!sl || !file) return;
      picIntake(file).then(function(src){
        sl.pics = sl.pics || [];
        sl.pics[+f.dataset.i] = { src:src, cap:"", z:1, x:50, y:50 };
        for (var i = 0; i < sl.pics.length; i++) if (!sl.pics[i]) sl.pics[i] = null;
        slidesMark(); slidesPaint();
      }).catch(function(e){
        SLED.err = "That picture could not be added — " + e.message + ".";
        slidesPaint();
      });
    });
  });
  root.querySelectorAll("[data-picdrop]").forEach(function(b){
    b.addEventListener("click", function(){
      var sl = slideOf(b, "picdrop"); if (!sl) return;
      (sl.pics || []).splice(+b.dataset.i, 1);
      slidesMark(); slidesPaint();
    });
  });

  /* Zoom and crop move the CONTROL's picture and the STAGE's picture together,
     because the stage is the point: you are framing the slide, not a swatch. */
  root.querySelectorAll("[data-piczoom]").forEach(function(r){
    r.addEventListener("input", function(){
      var sl = slideOf(r, "piczoom"); if (!sl) return;
      var i = +r.dataset.i, p = (sl.pics || [])[i]; if (!p) return;
      p.z = (+r.value) / 100;
      var img = r.closest(".picslot").querySelector("img");
      if (img) img.setAttribute("style", picStyle(p));
      var readout = r.parentNode.querySelector("b");
      if (readout) readout.textContent = r.value + "%";
      slidesLive(i).forEach(function(x){ x.setAttribute("style", picStyle(p)); });
      slidesMark();
    });
  });
  root.querySelectorAll("[data-picdrag]").forEach(function(fr){
    fr.addEventListener("pointerdown", function(ev){
      var sl = slideOf(fr, "picdrag"); if (!sl) return;
      var i = +fr.dataset.i, p = (sl.pics || [])[i]; if (!p) return;
      var img = fr.querySelector("img"), r = fr.getBoundingClientRect();
      var sx = ev.clientX, sy = ev.clientY, ox = +p.x || 0, oy = +p.y || 0;
      fr.setPointerCapture(ev.pointerId);
      fr.classList.add("dragging");
      ev.preventDefault();
      var move = function(e){
        p.x = Math.max(0, Math.min(100, ox - (e.clientX - sx) / r.width  * 100));
        p.y = Math.max(0, Math.min(100, oy - (e.clientY - sy) / r.height * 100));
        if (img) img.setAttribute("style", picStyle(p));
        slidesLive(i).forEach(function(x){ x.setAttribute("style", picStyle(p)); });
      };
      var up = function(e){
        fr.removeEventListener("pointermove", move);
        fr.removeEventListener("pointerup", up);
        fr.removeEventListener("pointercancel", up);
        fr.classList.remove("dragging");
        try { fr.releasePointerCapture(e.pointerId); } catch (x) {}
        slidesMark();
      };
      fr.addEventListener("pointermove", move);
      fr.addEventListener("pointerup", up);
      fr.addEventListener("pointercancel", up);
    });
  });
}

function wireSlides(){
  var root = document.getElementById("slideroot");
  root.querySelector("[data-slexit]").addEventListener("click", slidesClose);
  root.querySelector("[data-slplay]").addEventListener("click", slidesPlay);
  addEventListener("resize", function(){ if (root.classList.contains("on")) slidesFitStage(); });
  addEventListener("keydown", function(ev){
    if (!root.classList.contains("on")) return;
    /* ── THE DECK IN FRONT HAS THE KEYBOARD (§295) ──────────────────
       Both handlers are on the window and each gates on its OWN root being
       `.on`, and while a deck is played from here BOTH are on — so without
       this line Escape ran `closeDeck()` and `slidesClose()` and threw away
       the mode as well as the deck, and every arrow key moved the slide AND
       walked the rail underneath it. Found by reading the two gates together,
       which is the only place it is visible. */
    if (document.getElementById("deckroot").classList.contains("on") ||
        ev.smpDeckKey) return;
    if (ev.target.tagName === "INPUT" || ev.target.isContentEditable) {
      if (ev.key === "Escape") ev.target.blur();
      return;
    }
    if (ev.key === "Escape") slidesClose();
    /* ── WALK THE DECK WHILE ADJUSTING IT (§69.6) ─────────────────
       Islam: "allow the arrows up and down so I can navigate the slides while
       adjusting". The rail is a vertical list, so ↑/↓ are the natural pair —
       and ←/→ move with them, because the thing being walked is a DECK and
       every projector in the world uses those. Home and End for the same
       reason the projector has them.

       WHICH ARROW-KEY DEFAULT THIS TAKES OVER IS THE WHOLE CARE HERE. The
       guard above already leaves an <input> and anything contenteditable
       alone, and a `<select>` and a `<textarea>` need the same courtesy — a
       picture slide's controls carry both, and stealing ↓ from an open
       dropdown is how a keyboard user loses the ability to choose anything.
       So the keys are taken only when focus is on nothing that reads them. */
    if (SLIDE_ARROWS[ev.key] && !slidesTyping(ev.target)) {
      ev.preventDefault();
      slidesStep(SLIDE_ARROWS[ev.key]);
    }
  });
}

/* -1 / +1 / the ends. Written as a map rather than a chain of ifs so the set
   of keys is one thing to read and one thing to change. */
var SLIDE_ARROWS = { ArrowDown:1, ArrowRight:1, ArrowUp:-1, ArrowLeft:-1,
                     PageDown:1, PageUp:-1, Home:"first", End:"last" };
function slidesTyping(el){
  if (!el) return false;
  if (el.isContentEditable) return true;
  var t = (el.tagName || "").toUpperCase();
  return t === "INPUT" || t === "TEXTAREA" || t === "SELECT";
}
/* The rail's OWN order, read off the rail rather than recomputed. Assembling
   the deck again to answer "what is next" is a second copy of the list — and
   the rail is what the person is looking at, so it is the list that has to be
   right (§51.8: the rail IS the deck). */
function slidesStep(how){
  var rows = [].slice.call(document.querySelectorAll("#slidelist [data-slgo]"));
  if (!rows.length) return;
  var keys = rows.map(function(r){ return r.dataset.slgo; });
  var i = keys.indexOf(SLED.sel);
  var next = how === "first" ? 0
           : how === "last"  ? keys.length - 1
           : Math.max(0, Math.min(keys.length - 1, (i < 0 ? 0 : i) + how));
  if (keys[next] === SLED.sel) return;   /* at an end: nothing to repaint */
  SLED.sel = keys[next];
  slidesPaint();
}

/* The button that opens it, beside Present. It carries the count, because the
   one thing you want to know before a review is whether the pictures are in. */
/* picBtn() was here. It became the "Manage slides" entry inside the
   Presentation menu (§63), and a function nothing calls is a function the next
   reader has to prove is dead before touching anything near it (§24). */
