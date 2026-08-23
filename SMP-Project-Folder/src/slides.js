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
function picStyle(p){
  var z = Math.max(1, Math.min(3, +p.z || 1));
  return "object-position:" + (+p.x || 0) + "% " + (+p.y || 0) + "%;" +
    (z > 1 ? "transform:scale(" + z + ");" : "");
}
function pslideHtml(sl){
  var pics = (sl.pics || []).filter(function(p){ return p && p.src; })
                            .slice(0, PIC_PER_SLIDE);
  if (!pics.length) return "";      /* a slide with no picture is not a slide */
  var across = Math.max(1, Math.min(PIC_PER_SLIDE, +sl.layout || pics.length));
  var cells = pics.map(function(p){
    return '<figure class="pcell"><span class="pframe">' +
      '<img src="' + esc(p.src) + '" alt="' + esc(p.cap || sl.title || "Picture") +
      '" style="' + picStyle(p) + '"></span>' +
      (p.cap ? '<figcaption>' + esc(p.cap) + '</figcaption>' : '') + '</figure>';
  }).join("");
  return '<section class="dslide d-pics">' +
    (sl.title ? '<h2>' + esc(sl.title) + '</h2>' : '') +
    '<div class="pgrid pg' + Math.min(across, pics.length) + '">' + cells + '</div></section>';
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
    var fr = new FileReader();
    fr.onerror = function(){ reject(new Error("the file could not be read")); };
    fr.onload = function(){
      var img = new Image();
      img.onerror = function(){ reject(new Error("that picture could not be opened")); };
      img.onload = function(){
        var w = img.naturalWidth, h = img.naturalHeight;
        if (!w || !h) { reject(new Error("that picture has no size")); return; }
        var k = Math.min(1, PIC_MAX_EDGE / Math.max(w, h));
        var cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k));
        var cv = document.createElement("canvas");
        cv.width = cw; cv.height = ch;
        var cx = cv.getContext("2d");
        /* White underneath, or a transparent PNG re-encoded as a JPEG comes
           back with a black ground. */
        cx.fillStyle = "#FFFFFF"; cx.fillRect(0, 0, cw, ch);
        cx.imageSmoothingQuality = "high";
        cx.drawImage(img, 0, 0, cw, ch);
        var jpg = cv.toDataURL("image/jpeg", 0.82);
        var png = cv.toDataURL("image/png");
        resolve(png.length < jpg.length ? png : jpg);
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

/* ── The editor ──────────────────────────────────────────────────────────
   A modal rather than a page. Preparing the pictures for one review is a
   finished task with an end, it belongs beside the Present button that opens
   the deck they go into, and it needs no address of its own.

   THE STATE IT EDITS IS THE LIVE ONE. There is no draft and no Save: a change
   is written as it is made, exactly as every other edit surface in the
   platform behaves, and the autosave carries it. */
var PICED = { target:null, kind:null, anchors:[], err:"" };

function picEditorOpen(kind, key){
  var target = kind === "fn" ? "fn:" + key : key;
  if (!canSpeakFor(target)) return;
  PICED = { target:target, kind:kind, key:key, err:"",
            anchors:deckAnchors(kind, key) };
  openModalHtml("Picture slides",
    esc(picTargetName(kind, key)) + " &middot; " + esc(REVIEW.name) +
    " &mdash; they are archived with this cycle when it closes",
    picEditorBody());
  picEditorWire();
}
function picTargetName(kind, key){
  return kind === "fn" ? (FUNCTIONS[key] || {}).name || key
                       : (UNITS[key] || {}).name || key;
}

function picEditorBody(){
  var list = pslidesOf(PICED.target);
  var full = list.length >= PIC_MAX_SLIDES;
  return '<div class="picwrap">' +
    (PICED.err ? '<p class="picerr" role="alert">' + esc(PICED.err) + '</p>' : '') +
    (list.length
      ? list.map(picSlideCard).join("")
      : '<p class="picnone">No pictures in this deck yet. A slide can hold up to ' +
        PIC_PER_SLIDE + ' pictures, and sits wherever you put it in the review.</p>') +
    '<div class="picfoot">' +
      '<button class="editbtn" data-picadd="1"' + (full ? " disabled" : "") + '>Add a slide</button>' +
      (full ? '<span class="picsub">' + PIC_MAX_SLIDES + ' slides is the limit — remove one to add another.</span>'
            : '<span class="picsub">' + list.length + ' of ' + PIC_MAX_SLIDES + '</span>') +
    '</div></div>';
}

function picSlideCard(sl){
  var pics = sl.pics || [];
  var across = Math.max(1, Math.min(PIC_PER_SLIDE, +sl.layout || 1));
  var slots = [];
  for (var i = 0; i < across; i++) slots.push(picSlot(sl, pics[i], i));
  return '<div class="piccard" data-ps="' + esc(sl.id) + '">' +
    '<div class="piccard-h">' +
      '<input class="fld picttl" data-picttl="' + esc(sl.id) + '" value="' + esc(sl.title || "") +
        '" placeholder="Slide title — optional" aria-label="Slide title">' +
      '<button class="editbtn" data-picdel="' + esc(sl.id) + '">Remove slide</button>' +
    '</div>' +
    '<div class="piccard-cfg">' +
      '<label class="picfield"><span>Where it goes</span>' +
        '<select data-picat="' + esc(sl.id) + '">' +
          PICED.anchors.map(function(a){
            return '<option value="' + esc(a.a) + '"' + (a.a === sl.at ? " selected" : "") +
              '>' + esc(a.label) + '</option>';
          }).join("") + '</select></label>' +
      '<label class="picfield"><span>Pictures on the slide</span>' +
        '<span class="minisw" role="group" aria-label="Pictures on the slide">' +
          [1,2,3,4].map(function(n){
            return '<button data-piclay="' + esc(sl.id) + '" data-n="' + n + '" aria-pressed="' +
              (across === n) + '">' + n + '</button>';
          }).join("") + '</span></label>' +
    '</div>' +
    '<div class="picslots">' + slots.join("") + '</div>' +
    (pics.length > across
      ? '<p class="picsub picover">' + (pics.length - across) + ' more ' +
        (pics.length - across === 1 ? "picture is" : "pictures are") +
        ' kept but not shown at this arrangement.</p>' : '') +
  '</div>';
}

function picSlot(sl, p, i){
  if (!p || !p.src) {
    return '<div class="picslot empty">' +
      '<label class="picdrop"><input type="file" accept="image/*" data-picfile="' +
        esc(sl.id) + '" data-i="' + i + '">' +
      '<span class="picplus" aria-hidden="true">+</span><span>Add a picture</span></label></div>';
  }
  var z = Math.round((Math.max(1, Math.min(3, +p.z || 1))) * 100);
  return '<div class="picslot" data-i="' + i + '">' +
    '<span class="picframe" data-picdrag="' + esc(sl.id) + '" data-i="' + i + '" ' +
      'title="Drag to move the picture inside the frame">' +
      '<img src="' + esc(p.src) + '" alt="" style="' + picStyle(p) + '"></span>' +
    '<div class="picctl">' +
      '<label class="piczoom"><span>Zoom</span>' +
        '<input type="range" min="100" max="300" step="1" value="' + z + '" ' +
        'data-piczoom="' + esc(sl.id) + '" data-i="' + i + '" aria-label="Zoom"></label>' +
      '<button class="editbtn" data-picdrop="' + esc(sl.id) + '" data-i="' + i +
        '" aria-label="Remove this picture">Remove</button>' +
    '</div>' +
    '<input class="fld piccap" data-piccap="' + esc(sl.id) + '" data-i="' + i +
      '" value="' + esc(p.cap || "") + '" placeholder="Caption — optional" aria-label="Caption">' +
  '</div>';
}

/* Only the editor repaints, and only when its SHAPE changes. Typing a title or
   a caption changes nothing about the shape, so it never repaints — §35's rule,
   and the same reason the register filters rows in place: a repaint replaces
   the field being typed into. */
function picEditorRepaint(){
  document.getElementById("modal-b").innerHTML = picEditorBody();
  PICED.err = "";
  picEditorWire();
  SEARCHSEL.wire();
}

function picEditorWire(){
  var box = document.getElementById("modal-b");
  var slideOf = function(el, attr){ return pslideById(PICED.target, el.dataset[attr]); };
  var mark = function(){ if (typeof SYNC !== "undefined" && SYNC.afterPaint) SYNC.afterPaint(); };

  box.querySelectorAll("[data-picadd]").forEach(function(b){
    b.addEventListener("click", function(){
      var list = pslidesFor(PICED.target);
      if (list.length >= PIC_MAX_SLIDES) return;
      list.push({ id:pslideNewId(), title:"", layout:1,
                  at:(PICED.anchors[0] || {}).a || "end", pics:[] });
      mark(); picEditorRepaint();
    });
  });

  box.querySelectorAll("[data-picdel]").forEach(function(b){
    b.addEventListener("click", function(){
      var list = pslidesFor(PICED.target), id = b.dataset.picdel;
      for (var i = 0; i < list.length; i++) if (list[i].id === id) { list.splice(i, 1); break; }
      pslidesTidy(PICED.target);
      mark(); picEditorRepaint();
    });
  });

  /* Typing. Written straight into the model, no repaint. */
  box.querySelectorAll("[data-picttl]").forEach(function(f){
    f.addEventListener("input", function(){
      var sl = slideOf(f, "picttl"); if (sl) { sl.title = f.value; mark(); }
    });
  });
  box.querySelectorAll("[data-piccap]").forEach(function(f){
    f.addEventListener("input", function(){
      var sl = slideOf(f, "piccap"); if (!sl) return;
      var p = (sl.pics || [])[+f.dataset.i]; if (p) { p.cap = f.value; mark(); }
    });
  });
  box.querySelectorAll("[data-picat]").forEach(function(f){
    f.addEventListener("change", function(){
      var sl = slideOf(f, "picat"); if (sl) { sl.at = f.value; mark(); }
    });
  });

  box.querySelectorAll("[data-piclay]").forEach(function(b){
    b.addEventListener("click", function(){
      var sl = slideOf(b, "piclay"); if (!sl) return;
      sl.layout = +b.dataset.n;
      /* THE PICTURES ARE NOT THROWN AWAY when the arrangement narrows. Going
         from four to one and back again must return what was there — a control
         that destroys data on the way past is not a control (§44's switch). */
      mark(); picEditorRepaint();
    });
  });

  box.querySelectorAll("[data-picfile]").forEach(function(f){
    f.addEventListener("change", function(){
      var sl = slideOf(f, "picfile"), file = f.files && f.files[0];
      if (!sl || !file) return;
      picIntake(file).then(function(src){
        sl.pics = sl.pics || [];
        sl.pics[+f.dataset.i] = { src:src, cap:"", z:1, x:50, y:50 };
        /* A slot skipped over leaves a hole in the array; the deck filters
           them out, and so must the editor's own count. */
        for (var i = 0; i < sl.pics.length; i++) if (!sl.pics[i]) sl.pics[i] = null;
        mark(); picEditorRepaint();
      }).catch(function(e){
        PICED.err = "That picture could not be added — " + e.message + ".";
        picEditorRepaintWithError();
      });
    });
  });

  box.querySelectorAll("[data-picdrop]").forEach(function(b){
    b.addEventListener("click", function(){
      var sl = slideOf(b, "picdrop"); if (!sl) return;
      (sl.pics || []).splice(+b.dataset.i, 1);
      mark(); picEditorRepaint();
    });
  });

  box.querySelectorAll("[data-piczoom]").forEach(function(r){
    r.addEventListener("input", function(){
      var sl = slideOf(r, "piczoom"); if (!sl) return;
      var p = (sl.pics || [])[+r.dataset.i]; if (!p) return;
      p.z = (+r.value) / 100;
      var img = r.closest(".picslot").querySelector("img");
      if (img) img.setAttribute("style", picStyle(p));
      mark();
    });
  });

  /* Drag to choose what shows. The two numbers written here are the two the
     deck reads, so the frame in this modal and the frame on the slide are the
     same frame. Pointer events, so it works with a finger as well as a mouse —
     the platform is installable and gets opened on a tablet. */
  box.querySelectorAll("[data-picdrag]").forEach(function(fr){
    fr.addEventListener("pointerdown", function(ev){
      var sl = slideOf(fr, "picdrag"); if (!sl) return;
      var p = (sl.pics || [])[+fr.dataset.i]; if (!p) return;
      var img = fr.querySelector("img"), r = fr.getBoundingClientRect();
      var sx = ev.clientX, sy = ev.clientY, ox = +p.x || 0, oy = +p.y || 0;
      fr.setPointerCapture(ev.pointerId);
      fr.classList.add("dragging");
      ev.preventDefault();
      var move = function(e){
        /* A drag across the whole frame sweeps the whole picture. Dividing by
           the frame's own size is what keeps a small frame and a large one
           feeling the same. */
        p.x = Math.max(0, Math.min(100, ox - (e.clientX - sx) / r.width  * 100));
        p.y = Math.max(0, Math.min(100, oy - (e.clientY - sy) / r.height * 100));
        if (img) img.setAttribute("style", picStyle(p));
      };
      var up = function(e){
        fr.removeEventListener("pointermove", move);
        fr.removeEventListener("pointerup", up);
        fr.removeEventListener("pointercancel", up);
        fr.classList.remove("dragging");
        try { fr.releasePointerCapture(e.pointerId); } catch (x) {}
        mark();
      };
      fr.addEventListener("pointermove", move);
      fr.addEventListener("pointerup", up);
      fr.addEventListener("pointercancel", up);
    });
  });
}

/* The error survives the repaint that shows it; every other repaint clears it,
   which is why the two are separate functions rather than a flag. */
function picEditorRepaintWithError(){
  var msg = PICED.err;
  picEditorRepaint();
  PICED.err = msg;
  document.getElementById("modal-b").insertAdjacentHTML("afterbegin",
    '<p class="picerr" role="alert">' + esc(msg) + '</p>');
}

/* Closing it refreshes ONLY the count on the button that opened it. A full
   repaint here would replace the very button the dialog is about to hand focus
   back to (§48.4's restore, §30.1's family) — and there is nothing else on the
   page behind that a picture slide changes. */
function picEditorClosing(){
  if (!PICED.target) return;
  PICED = { target:null, kind:null, key:null, anchors:[], err:"" };
  document.querySelectorAll("[data-picedit]").forEach(function(b){
    var n = pslidesOf(b.dataset.picedit === "fn" ? "fn:" + b.dataset.pickey : b.dataset.pickey).length;
    var pill = b.querySelector(".pill");
    if (n && pill) pill.textContent = n;
    else if (n) b.insertAdjacentHTML("beforeend", ' <span class="pill kind">' + n + '</span>');
    else if (pill) pill.remove();
  });
}

/* The button that opens it, beside Present. It carries the count, because the
   one thing you want to know before a review is whether the pictures are in. */
function picBtn(kind, key){
  var target = kind === "fn" ? "fn:" + key : key;
  if (!canSpeakFor(target)) return "";
  var n = pslidesOf(target).length;
  return '<button class="editbtn" data-picedit="' + esc(kind) + '" data-pickey="' + esc(key) +
    '" title="Picture slides for this review">Pictures' +
    (n ? ' <span class="pill kind">' + n + '</span>' : '') + '</button>';
}
