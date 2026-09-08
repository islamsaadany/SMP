/* ── The plan leaves as slides (§117) ────────────────────────────────
   Islam, 2026-08-26: "add the access of downloading a presentation for the
   plan for the custodian and the business unit owner through a button in the
   strategy panel — sometimes they need it in slides to update things and view
   it outside to come back with the SMO for refinement."

   A REAL .PPTX, NOT THE DECK PRINTED. The point of the ask is the file being
   EDITABLE outside the platform — marked up, argued over, brought back — and
   a picture of the deck cannot be edited. A .pptx is a zip of XML exactly as
   a .xlsx is, so this reuses zipStore() from xlsx.js and adds no dependency:
   the file builds offline, from file://, like everything else.

   THE CONTENT IS THE PLAN, NEVER THE CYCLE. Foundation, the SWOT (asked for
   by name), key objectives, and each pillar's measures and tactics — targets
   and owners, no actual and no progress anywhere. This is u_plan's content
   with u_found's and u_anal's around it, which is what "a presentation for
   the plan" means; the review deck with its figures already exists and is a
   different artefact for a different meeting.

   A UNIT AND A FUNCTION ARE THE SAME PRODUCT (§53.5): a pillars-planning
   function goes through fnAsUnit() and gets the unit's slides; a capability
   function gets one overview slide per capability and its projects table —
   plan-level facts only, same rule.

   WHO GETS THE BUTTON IS `SMPRules.mayDownloadPlan()` — the office and the
   roles that hold the thing. The rule is client-side only, deliberately: the
   download re-arranges what the page already shows this person, so there is
   no write for the server to refuse (§117).

   COLOURS ARE THE TENANT'S where the tenant has set them (Setup › Branding),
   and the house navy/gold where it has not — the same two answers the
   platform itself gives, read from the same branding() the pages read. */

/* 16:9 in EMUs. One inch is 914400; the margins and grid below are in whole
   EMUs so nothing accumulates rounding. */
var PPTX_W = 12192000, PPTX_H = 6858000;
var PPTX_MX = 640080;                       /* 0.7in side margin */
var PPTX_CW = PPTX_W - 2 * PPTX_MX;         /* content width */

/* THE THIRD COPY OF THE BLOB DANCE GETS EXTRACTED (§54.3 said two copies is
   when the second one gets the revoke wrong; this was about to be the third
   after sendXlsx and the CSV button in shell.html — both call this now). */
function sendFileBytes(bytes, name, mime){
  var blob = new Blob([bytes], { type: mime });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 0);
}

/* ── ONE FILE, OR SEVERAL AS A ZIP (§304) ──────────────────────────────
   The download card hands over whatever is ticked, and one subject ticked is
   ONE workbook rather than a zip holding one — a person who asked for Mobile's
   plan and got an archive to unpack has been given a chore, not a file.

   The zip itself is `zipStore()` from xlsx.js, which since §304 takes bytes as
   well as text, so a zip of workbooks needs nothing new: each member is
   already a Uint8Array from buildXlsx().

   FOLDERS ARE THE MEMBER'S OWN NAME. A zip has no directory entries to make —
   a slash in the name IS the folder — so `plans/mobile.xlsx` arrives inside a
   folder called plans with no extra machinery. */
function sendFilesZip(files, zipName){
  if (!files.length) return 0;
  if (files.length === 1) {
    var one = files[0];
    sendFileBytes(one.data, one.name.replace(/^.*\//, ""), one.mime ||
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return 1;
  }
  sendFileBytes(zipStore(files.map(function(f){ return { name:f.name, data:f.data }; })),
    zipName, "application/zip");
  return files.length;
}

function pptxColors(){
  var b = branding();
  var strip = function(h, fb){ return String(h || fb).replace(/^#/, "").toUpperCase(); };
  return {
    bar:   strip(b.bar,    "#16325C"),      /* headers — the navigation's own */
    accent:strip(b.accent, "#C9A24D"),      /* the mark, sparingly (§41) */
    ink:   "1B2740", quiet:"5E6E88", ground:"FFFFFF", line:"DCE3ED",
    zebra: "F2F5F9",
    /* The platform's own light --bad: what `.missing` wears on screen, worn
       here on the slide's white ground (§119). */
    bad:   "B04434",
    /* ── A SCORE WEARS ITS BAND (§309) ─────────────────────────────────
       The deck colours a figure by the band it falls in (`.final.good`), and
       the download printed all of them black — so the one column a room runs
       its eye down said nothing until you read every number in it.

       LITERALS, AND FOR THE REASON EVERY COLOUR HERE IS ONE (§25 stated
       rather than broken): a slide is white whatever palette or theme the
       person downloading it is sitting in, so the LIGHT palette's band
       colours are the right ones ON IT — reading the live tokens would put
       dark mode's mint green on a white page.

       FIVE, because §168 lets a tenant colour a band from five and
       `bandOf()` can answer with any of them; a sixth would render as
       nothing, which is that section's own reason for there being five. */
    band: { good:"2E7D5B", attn:"B8860B", warn:"CC6B3D", bad:"B04434", none:"676C73" }
  };
}

/* ── MISSING IS SAID, IN BOLD RED (§119) ─────────────────────────────
   Islam: "identify the missing areas of the plan and type missing in bold red
   so they know what they need to fill." The deck used to print an em-dash for
   an empty plan fact, which reads as "nothing to say" when the truth is
   "nobody has said it yet" — the same distinction §35 drew for the password
   column. The product already marks an unset target `Missing` in red
   (`.missing`, §104.10's family); the slides now speak the same word.

   NOT every blank is a gap: collaborators are optional by design, and a
   quarter column left unmarked is the mark. What gets the word is what the
   PLAN OWES — a direction, a target, a compile rule, a tactic's owner, a
   project's owner and dates, a capability's definition, the aspiration, and
   an empty SWOT quadrant. */
var PPTX_MISS = { miss: true };
function orMiss(v){ return v ? v : PPTX_MISS; }
/* §145: a value filled but not yet confirmed is ANSWERED, not missing — it
   prints as the value plus "(pending)", never as the bold red gap mark. */
function orPend(row, f){
  var v = row && row[f];
  if (v && row.pend && row.pend[f]) return String(v) + " (pending)";
  return orMiss(v);
}

/* ── The DrawingML fragments ────────────────────────────────────────── */
function pptxRun(text, o){
  o = o || {};
  return '<a:r><a:rPr lang="en" sz="' + (o.sz || 1400) + '"' +
    (o.b ? ' b="1"' : '') + (o.i ? ' i="1"' : '') + '>' +
    '<a:solidFill><a:srgbClr val="' + (o.color || pptxColors().ink) + '"/></a:solidFill>' +
    '<a:latin typeface="Calibri"/></a:rPr><a:t>' + xesc(text) + '</a:t></a:r>';
}
function pptxPara(runs, o){
  o = o || {};
  return '<a:p><a:pPr' + (o.align ? ' algn="' + o.align + '"' : '') +
    (o.before ? ' ><a:spcBef><a:spcPts val="' + o.before + '"/></a:spcBef></a:pPr>' : '/>') +
    (Array.isArray(runs) ? runs.join("") : runs) + '</a:p>';
}
function pptxText(id, box, paras, o){
  o = o || {};
  return '<p:sp><p:nvSpPr><p:cNvPr id="' + id + '" name="text ' + id + '"/>' +
    '<p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>' +
    '<p:spPr><a:xfrm><a:off x="' + box.x + '" y="' + box.y + '"/>' +
    '<a:ext cx="' + box.cx + '" cy="' + box.cy + '"/></a:xfrm>' +
    '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>' +
    (o.fill ? '<a:solidFill><a:srgbClr val="' + o.fill + '"/></a:solidFill>' : '') +
    (o.line ? '<a:ln w="9525"><a:solidFill><a:srgbClr val="' + o.line + '"/></a:solidFill></a:ln>' : '') +
    '</p:spPr>' +
    '<p:txBody><a:bodyPr wrap="square" lIns="91440" rIns="91440" tIns="45720" bIns="45720"' +
    (o.anchor ? ' anchor="' + o.anchor + '"' : '') + '>' +
    '<a:normAutofit/></a:bodyPr><a:lstStyle/>' + paras.join("") + '</p:txBody></p:sp>';
}
/* A table. `widths` are EMU column widths; `head` is one array of strings;
   `rows` an array of arrays. The header wears the tenant's bar with its own
   ink — §38.5: a surface with its own ground needs its own ink. */
function pptxTable(id, box, widths, head, rows, o){
  var C = pptxColors();
  o = o || {};
  var SZ = o.sz || 1100, ROW_H = o.rowH || 335280;
  function cell(c, hdr, ri){
    /* A cell is a string, or an object: `{miss:true}` renders the bold red
       Missing (§119); `{t, align}` carries a mark that wants centring; and
       since §309 `{color, b}` carry a band, `{sub}` a second line, and
       `{runs}` a cell written as several runs — which is what lets a figure
       and the benchmark it is measured against sit in one cell in two
       weights, the way the deck draws them. */
    var o2 = (c !== null && typeof c === "object") ? c : { t: c };
    /* Three weights: the header, a GAP (the word Missing), and an ordinary
       value — plus `alarm`, which is an ordinary value wearing the gap's
       colour, for a mark that says something is owed without being a word
       (§128.1: the quarter ticks). */
    var runOpts = hdr     ? { sz:SZ, b:true, color:C.ground }
                : o2.miss  ? { sz:SZ, b:true, color:C.bad }
                : o2.alarm ? { sz:SZ, b:true, color:C.bad }
                :           { sz:SZ, b:!!o2.b, color:o2.color || C.ink };
    var pPr = o2.align ? { align: o2.align } : undefined;
    var body = o2.runs
      ? pptxPara(o2.runs.map(function(r){
          return pptxRun(r.t, { sz:r.sz || SZ, b:!!r.b, i:!!r.i, color:r.color || C.ink });
        }), pPr)
      : pptxPara(pptxRun(o2.miss ? "Missing" : (o2.t == null ? "" : o2.t), runOpts), pPr);
    /* A SECOND LINE IS A SECOND PARAGRAPH, never the same one. The deck's
       score table writes a pillar's name over a grey line naming its kind
       and owner; read as one string they arrive as one word, which is what
       "…Scale RAYA Smart CareDirection · · Mahmoud" was (§309). */
    if (o2.sub) body += pptxPara(pptxRun(o2.sub, { sz:Math.max(900, SZ - 200), color:C.quiet }), pPr);
    return '<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>' + body +
      '</a:txBody><a:tcPr marL="72000" marR="72000" marT="36000" marB="36000">' +
      '<a:lnB w="6350"><a:solidFill><a:srgbClr val="' + C.line + '"/></a:solidFill></a:lnB>' +
      '<a:solidFill><a:srgbClr val="' +
        (hdr ? C.bar : (ri % 2 ? C.zebra : C.ground)) + '"/></a:solidFill></a:tcPr></a:tc>';
  }
  var tr = function(cells, hdr, ri){
    return '<a:tr h="' + ROW_H + '">' +
      cells.map(function(t){ return cell(t, hdr, ri); }).join("") + '</a:tr>';
  };
  return '<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="' + id + '" name="table ' + id + '"/>' +
    '<p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr>' +
    '<p:xfrm><a:off x="' + box.x + '" y="' + box.y + '"/><a:ext cx="' + box.cx + '" cy="' + (box.cy || 335280) + '"/></p:xfrm>' +
    '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">' +
    '<a:tbl><a:tblPr firstRow="1" bandRow="1"/><a:tblGrid>' +
    widths.map(function(w){ return '<a:gridCol w="' + w + '"/>'; }).join("") +
    '</a:tblGrid>' + tr(head, true, 0) +
    rows.map(function(r, i){ return tr(r, false, i); }).join("") +
    '</a:tbl></a:graphicData></a:graphic></p:graphicFrame>';
}

/* ── A PICTURE IN THE PACKAGE (§309) ───────────────────────────────────
   The one change in this round that the FILE FORMAT has to grow for. Every
   other fix is text and geometry inside slides that already existed; a mark
   is bytes, so the zip gains a `ppt/media` member, `[Content_Types].xml`
   gains a png default, and every slide's relationships gain a link to it.
   Drawn as a dashed box in the mockup so the cost was visible before it was
   agreed rather than discovered afterwards.

   ONE MEDIA PART FOR THE WHOLE FILE, linked from each slide, so a
   twenty-slide deck carries the mark once rather than twenty times. */
function pptxPic(id, box, rid){
  return '<p:pic><p:nvPicPr><p:cNvPr id="' + id + '" name="mark"/>' +
    '<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>' +
    '<p:blipFill><a:blip r:embed="' + rid + '"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>' +
    '<p:spPr><a:xfrm><a:off x="' + box.x + '" y="' + box.y + '"/>' +
    '<a:ext cx="' + box.cx + '" cy="' + box.cy + '"/></a:xfrm>' +
    '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>';
}

/* A data URI to bytes. `atob` gives one character per byte, which is what a
   zip member wants since §304.6 taught `zipStore()` to hold them — a
   Uint8Array through TextEncoder is mangled silently, and the archive builds,
   downloads and refuses to open. */
function dataUriBytes(uri){
  var i = String(uri || "").indexOf(",");
  if (i < 0) return null;
  var bin = atob(String(uri).slice(i + 1));
  var out = new Uint8Array(bin.length);
  for (var k = 0; k < bin.length; k++) out[k] = bin.charCodeAt(k);
  return out;
}

/* A PNG'S OWN SIZE, READ OFF ITS HEADER rather than measured by loading it:
   an `Image` answers asynchronously and everything here is synchronous, and
   a mark whose shape arrives after the file has been written is a mark
   stretched to whatever box was guessed for it. IHDR is the first chunk, so
   width and height are two big-endian longs at offset 16. */
function pngSize(b){
  if (!b || b.length < 24 || b[0] !== 0x89 || b[1] !== 0x50) return null;
  var rd = function(o){ return (b[o] << 24 | b[o+1] << 16 | b[o+2] << 8 | b[o+3]) >>> 0; };
  var w = rd(16), h = rd(20);
  return (w && h) ? { w:w, h:h } : null;
}

var PPTX_NS =
  ' xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"' +
  ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"' +
  ' xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';

function pptxSlideXml(shapes){
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<p:sld' + PPTX_NS + '><p:cSld><p:spTree>' +
    '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>' +
    '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>' +
    '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>' +
    shapes.join("") +
    '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';
}

/* Every content slide opens the same way: a kicker naming where we are, the
   slide's own title, and a hairline of the tenant's accent under them. */
/* ── THE PAIR SITS WHERE THE ROOM LOOKS FOR IT (§309) ──────────────────
   A pillar's two headline figures are drawn top RIGHT on the screen, and the
   converter had no idea they were a pair: they came through `deckLead()` as
   four paragraphs — MEASURES, 117%, EXECUTION, 81% — stacked top left above
   the table, which is Islam's first complaint of the round.

   `stats` is a list of `{k, v, color}`; with none, this is byte for byte the
   head the plan download has always drawn, and the plan download passes
   none. The title box narrows only when there is a pair to make room for,
   so a slide without one keeps the full width for a long name. */
function pptxHead(kicker, title, stats){
  var C = pptxColors();
  var wide = (stats && stats.length) ? stats.length * 1600200 : 0;
  var out = [
    pptxText(2, { x:PPTX_MX, y:274320, cx:PPTX_CW, cy:320040 },
      [pptxPara(pptxRun(kicker.toUpperCase(), { sz:1000, b:true, color:C.quiet }))]),
    pptxText(3, { x:PPTX_MX, y:539496, cx:PPTX_CW - wide, cy:594360 },
      [pptxPara(pptxRun(title, { sz:2400, b:true, color:C.bar }))]),
    pptxText(4, { x:PPTX_MX, y:1173480, cx:1828800, cy:45720 }, [pptxPara(pptxRun(" ", { sz:100 }))],
      { fill:C.accent })
  ];
  (stats || []).forEach(function(st, i){
    var x = PPTX_W - PPTX_MX - wide + i * 1600200;
    out.push(pptxText(20 + i, { x:x, y:388620, cx:1600200, cy:800100 }, [
      pptxPara(pptxRun(String(st.k).toUpperCase(), { sz:900, b:true, color:C.quiet }), { align:"r" }),
      pptxPara(pptxRun(st.v, { sz:2400, b:true, color:st.color || C.ink }), { align:"r", before:200 })
    ]));
  });
  return out;
}

/* ── The slides themselves ──────────────────────────────────────────── */
var PPTX_TABLE_Y = 1381125;
var PPTX_ROWS_PER_SLIDE = 11;

/* A long table continues on its own next slide rather than shrinking to fit —
   the deck's own fit-pass argument (§51.10), decided by counting rather than
   measuring because a table row here has a fixed height by construction. */
function pptxTableSlides(kicker, title, widths, head, rows){
  var out = [];
  for (var i = 0; i < rows.length || i === 0; i += PPTX_ROWS_PER_SLIDE) {
    var part = rows.slice(i, i + PPTX_ROWS_PER_SLIDE);
    var t = i ? title + " (continued)" : title;
    out.push(pptxSlideXml(pptxHead(kicker, t).concat(part.length
      ? [pptxTable(10, { x:PPTX_MX, y:PPTX_TABLE_Y, cx:PPTX_CW }, widths, head, part)]
      : [pptxText(10, { x:PPTX_MX, y:PPTX_TABLE_Y, cx:PPTX_CW, cy:457200 },
          [pptxPara(pptxRun("Nothing here yet.", { sz:1200, i:true, color:pptxColors().quiet }))])])));
  }
  return out;
}

/* One cell per quarter, a mark where the tactic runs (§119 — Islam: "make
   the tactics columns a column for each Q with a mark for the qs in action",
   the shape the plan workbook's Q1–Q4 columns already have). */
function pptxQCells(t){
  /* AN UNTICKED QUARTER IS THE MARK; NO QUARTER AT ALL IS A GAP (§128.1,
     corrected by Islam the same day).

     §128 first answered this by merging one bold red `Missing` across the
     four columns. Islam: "you changed the quarters columns format to type
     missing that's wrong, the template should stay the same — revert the
     columns of the quarters to separate columns and maybe make check marks in
     bold red inside all as an indicator of missing."

     THE COLUMN SHAPE IS THE TEMPLATE'S AND IS NOT MINE TO SPEND. The four Q
     columns exist because the plan workbook has four, and a reader moves
     between the two; a table that keeps its grid on every row can be scanned
     down, and one whose cells merge when a row is incomplete cannot. Saying
     the gap cost the shape that carries every other row — a bad trade, and
     the mark can carry the alarm on its own.

     SO THE MARK CHANGES RATHER THAN THE TABLE CHANGING SHAPE: the four cells
     carry a mark in the one colour the deck uses for nothing but a gap,
     beside a Missing owner in the same red. §119.1 is untouched — a tactic
     that names SOME quarters is answering the question, and its ticks stay
     the ordinary ink.

     AND THE MARK IS A QUESTION MARK, NOT A TICK (§128.2, Islam: "rather than
     the red check mark for the missing qs make it red question marks to
     indicate the missing"). §128.1 shipped a red ✓ in all four, and a tick
     is an AFFIRMATION whatever colour it wears — it says the tactic runs in
     that quarter, so the row read "runs everywhere" to anybody who did not
     also read the colour, which is the opposite of what it is there to say.
     A `?` says the same thing the colour says: nobody answered this. The
     colour is now the emphasis rather than the whole message. */
  var any = ["q1","q2","q3","q4"].some(function(q){ return t[q]; });
  if (!any) return ["q1","q2","q3","q4"].map(function(){
    return { t:"?", align:"ctr", alarm:true };
  });
  return ["q1","q2","q3","q4"].map(function(q){
    return { t: t[q] ? "\u2713" : "", align: "ctr" };
  });
}

/* THE DECK CLOSES THE WAY THE REVIEW DECK CLOSES (§119.8). Islam: "add a
   thank you page at the end of the ppt." `present.js` has ended on a
   `d-thanks` cover slide since the deck existed — same words, same shape, the
   subject's name under a rule — so this is the plan deck learning the manners
   the projected one already has rather than a new idea (§53.5). */
function pptxThanks(name, subLine){
  var C = pptxColors();
  return pptxSlideXml([
    pptxText(2, { x:0, y:0, cx:PPTX_W, cy:PPTX_H }, [pptxPara(pptxRun(" ", { sz:100 }))], { fill:C.bar }),
    pptxText(3, { x:PPTX_MX, y:2834640, cx:PPTX_CW, cy:1005840 },
      [pptxPara(pptxRun("Thank you", { sz:4400, b:true, color:C.ground }))]),
    pptxText(4, { x:PPTX_MX, y:3931920, cx:1828800, cy:45720 },
      [pptxPara(pptxRun(" ", { sz:100 }))], { fill:C.accent }),
    pptxText(5, { x:PPTX_MX, y:4114800, cx:PPTX_CW, cy:365760 },
      [pptxPara(pptxRun(subLine, { sz:1400, color:C.ground }))])
  ]);
}

function pptxCover(orgLine, name, subLine){
  var C = pptxColors();
  return pptxSlideXml([
    /* The bar carries the tenant's colour across the whole cover. */
    pptxText(2, { x:0, y:0, cx:PPTX_W, cy:PPTX_H }, [pptxPara(pptxRun(" ", { sz:100 }))], { fill:C.bar }),
    pptxText(3, { x:PPTX_MX, y:2194560, cx:PPTX_CW, cy:365760 },
      [pptxPara(pptxRun(orgLine.toUpperCase(), { sz:1200, b:true, color:C.accent }))]),
    pptxText(4, { x:PPTX_MX, y:2651760, cx:PPTX_CW, cy:1005840 },
      [pptxPara(pptxRun(name, { sz:4400, b:true, color:C.ground }))]),
    pptxText(5, { x:PPTX_MX, y:3748333, cx:PPTX_CW, cy:365760 },
      [pptxPara(pptxRun(subLine, { sz:1400, color:C.ground }))])
  ]);
}

/* The plan of a unit — or of a pillars-planning function through fnAsUnit(),
   which is the whole point of that reader existing (§61). */
function pptxUnitSlides(u, kicker){
  var C = pptxColors(), slides = [];
  var today = new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" });
  slides.push(pptxCover(GROUP.org || "Strategy Management Platform", u.name,
    "Strategy plan — as agreed, no reported figures · " + today));

  /* Foundation: the clauses read as the sentences they are, the aspiration as
     the one big statement the objectives hang off. */
  var found = [];
  (u.clauses || []).forEach(function(c){
    found.push(pptxPara([pptxRun(c[0] + "  ", { sz:1200, b:true, color:C.quiet }),
                         pptxRun(c[1], { sz:1200 })], { before:600 }));
  });
  /* The Foundation slide is ALWAYS in the deck since §119: a slide skipped
     for being empty hides exactly the gap the Missing marks exist to show. */
  var fShapes = pptxHead(kicker, "Foundation");
  fShapes.push(pptxText(6,
    { x:PPTX_MX, y:PPTX_TABLE_Y, cx:PPTX_CW, cy:1188720 },
    [pptxPara(pptxRun("ASPIRATION", { sz:1000, b:true, color:C.quiet })),
     u.aspiration
       ? pptxPara(pptxRun(u.aspiration +
           (u.pend && u.pend.aspiration ? " (pending)" : ""),
           { sz:1500, i:true, color:C.bar }), { before:600 })
       : pptxPara(pptxRun("Missing", { sz:1500, b:true, color:C.bad }), { before:600 })],
    { fill:C.zebra }));
  if (found.length) fShapes.push(pptxText(7,
    { x:PPTX_MX, y:2705100, cx:PPTX_CW, cy:2971800 }, found));
  slides.push(pptxSlideXml(fShapes));

  var kos = SMPRules.shown(u.keyObjectives);
  if (kos.length) slides = slides.concat(pptxTableSlides(kicker, "Key objectives",
    [4754880, 914400, 2621280, 2621280],
    ["Objective", "Dir.", "This year's target", "3-year target"],
    kos.map(function(k){ return [k.name, orPend(k, "dir"), orPend(k, "target"), orPend(k, "target3y")]; })));

  /* The SWOT, asked for by name (Islam, 2026-08-26). Four boxes, two rows —
     the shape the Analysis page draws. */
  var sw = u.swot || {};
  (function(){
    var half = (PPTX_CW - 228600) / 2, boxH = 2103120, id = 6;
    var quad = function(x, y, title, items){
      var body = (items || []).length
        ? (items || []).map(function(t){
            return pptxPara(pptxRun("·  " + t, { sz:1000 }), { before:300 });
          })
        : [pptxPara(pptxRun("Missing", { sz:1100, b:true, color:C.bad }), { before:300 })];
      return pptxText(id++, { x:x, y:y, cx:half, cy:boxH },
        [pptxPara(pptxRun(title.toUpperCase(), { sz:1050, b:true, color:C.bar }))].concat(body),
        { fill:C.zebra });
    };
    slides.push(pptxSlideXml(pptxHead(kicker, "Analysis — SWOT").concat([
      quad(PPTX_MX, PPTX_TABLE_Y, "Strengths", sw.s),
      quad(PPTX_MX + half + 228600, PPTX_TABLE_Y, "Weaknesses", sw.w),
      quad(PPTX_MX, PPTX_TABLE_Y + boxH + 182880, "Opportunities", sw.o),
      quad(PPTX_MX + half + 228600, PPTX_TABLE_Y + boxH + 182880, "Threats", sw.t)
    ])));
  })();

  /* One pillar, two tables, two slides — measures then tactics, the order the
     Plan pane reads them in. */
  (u.items || []).forEach(function(p, pi){
    var code = (u.codePrefix || "") + (p.code || (pi + 1));
    var pk = kicker + " · " + code;
    slides = slides.concat(pptxTableSlides(pk, p.name + " — Key measures",
      [5303520, 914400, 2346960, 2346960],
      ["Measure", "Dir.", "Target", "Compiles"],
      SMPRules.shown(p.measures).map(function(m){
        return [m.name, orPend(m, "dir"), orPend(m, "target"), orPend(m, "compile")];
      })));
    slides = slides.concat(pptxTableSlides(pk, p.name + " — Tactics",
      [4571760, 2103120, 1676400, 640140, 640140, 640140, 640140],
      ["Tactic", "Owner", "Collaborators", "Q1", "Q2", "Q3", "Q4"],
      SMPRules.shown(p.tactics).map(function(t){
        return [t.name, orPend(t, "owner"),
                (t.collaborators || []).join(", ") || "—"].concat(pptxQCells(t));
      })));
  });
  slides.push(pptxThanks(u.name, (GROUP.org || "") + " \u00b7 Strategy plan"));
  return slides;
}

/* A capability function's plan: one overview slide per capability (what it
   is, and its key objectives), then its projects — plan-level facts only.
   The rows inside a project (deliverables, outcomes, milestones) are counted
   rather than listed: the slide answers "what did we commit to", and the
   product is where a project's inside lives. */
function pptxFnSlides(fk){
  var f = FUNCTIONS[fk], C = pptxColors(), slides = [];
  var today = new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" });
  slides.push(pptxCover(GROUP.org || "Strategy Management Platform", f.name,
    "Strategy plan — as agreed, no reported figures · " + today));
  capsOfFunction(fk).forEach(function(c){
    var shapes = pptxHead(f.name, c.name);
    shapes.push(pptxText(6, { x:PPTX_MX, y:PPTX_TABLE_Y, cx:PPTX_CW, cy:960120 },
      [pptxPara(pptxRun("WHAT IT IS", { sz:1000, b:true, color:C.quiet })),
       c.def
         ? pptxPara(pptxRun(c.def, { sz:1300, i:true, color:C.bar }), { before:600 })
         : pptxPara(pptxRun("Missing", { sz:1300, b:true, color:C.bad }), { before:600 })],
      { fill:C.zebra }));
    var kos = SMPRules.shown(c.keyObjectives);
    if (kos.length) shapes.push(pptxTable(7,
      { x:PPTX_MX, y:2529840, cx:PPTX_CW },
      [5760720, 914400, 2118360, 2118360],
      ["Key objective", "Dir.", "Target", "Weight"],
      kos.slice(0, 8).map(function(k){
        return [k.name, orPend(k, "dir"), orPend(k, "target"),
                k.weight != null
                  ? k.weight + "%" + (k.pend && k.pend.weight ? " (pending)" : "")
                  : PPTX_MISS];
      })));
    slides.push(pptxSlideXml(shapes));
    slides = slides.concat(pptxTableSlides(f.name + " · " + c.name, "Projects",
      [3931920, 1737360, 1188720, 1188720, 2865120],
      ["Project", "Owner", "Start", "End", "Carries"],
      (c.projects || []).map(function(p){
        return [p.name, orPend(p, "owner"), orPend(p, "start"), orPend(p, "end"),
          plural(SMPRules.shown(p.deliverables).length, "deliverable") + " · " +
          plural(SMPRules.shown(p.outcomes).length, "outcome") + " · " +
          plural(SMPRules.shown(p.milestones).length, "milestone")];
      })));
  });
  slides.push(pptxThanks(f.name, (GROUP.org || "") + " \u00b7 Strategy plan"));
  return slides;
}

/* ── The package around the slides ──────────────────────────────────── */
function pptxTheme(){
  var C = pptxColors();
  var scheme =
    '<a:dk1><a:srgbClr val="' + C.ink + '"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>' +
    '<a:dk2><a:srgbClr val="' + C.bar + '"/></a:dk2><a:lt2><a:srgbClr val="' + C.zebra + '"/></a:lt2>' +
    '<a:accent1><a:srgbClr val="' + C.accent + '"/></a:accent1>' +
    '<a:accent2><a:srgbClr val="' + C.bar + '"/></a:accent2>' +
    '<a:accent3><a:srgbClr val="8FA3BE"/></a:accent3><a:accent4><a:srgbClr val="B0873A"/></a:accent4>' +
    '<a:accent5><a:srgbClr val="5E6E88"/></a:accent5><a:accent6><a:srgbClr val="2F6B4F"/></a:accent6>' +
    '<a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink>';
  var fonts = '<a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>' +
    '<a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>';
  var fill = '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>';
  var fmt =
    '<a:fillStyleLst>' + fill + fill + fill + '</a:fillStyleLst>' +
    '<a:lnStyleLst>' +
      '<a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>' +
      '<a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>' +
      '<a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>' +
    '</a:lnStyleLst>' +
    '<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle>' +
    '<a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>' +
    '<a:bgFillStyleLst>' + fill + fill + fill + '</a:bgFillStyleLst>';
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="SMP">' +
    '<a:themeElements><a:clrScheme name="SMP">' + scheme + '</a:clrScheme>' +
    '<a:fontScheme name="SMP">' + fonts + '</a:fontScheme>' +
    '<a:fmtScheme name="SMP">' + fmt + '</a:fmtScheme></a:themeElements></a:theme>';
}

function pptxPackage(slides, title, media){
  var xmlh = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  var files = [];
  files.push({ name:"[Content_Types].xml", data: xmlh +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    (media ? '<Default Extension="png" ContentType="image/png"/>' : '') +
    '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>' +
    '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>' +
    '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>' +
    '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>' +
    slides.map(function(_, i){
      return '<Override PartName="/ppt/slides/slide' + (i + 1) +
        '.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>';
    }).join("") +
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
    '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
    '</Types>' });
  files.push({ name:"_rels/.rels", data: xmlh +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>' +
    '</Relationships>' });
  files.push({ name:"ppt/presentation.xml", data: xmlh +
    '<p:presentation' + PPTX_NS + '>' +
    '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>' +
    '<p:sldIdLst>' + slides.map(function(_, i){
      return '<p:sldId id="' + (256 + i) + '" r:id="rId' + (i + 2) + '"/>';
    }).join("") + '</p:sldIdLst>' +
    '<p:sldSz cx="' + PPTX_W + '" cy="' + PPTX_H + '"/>' +
    '<p:notesSz cx="6858000" cy="9144000"/></p:presentation>' });
  files.push({ name:"ppt/_rels/presentation.xml.rels", data: xmlh +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>' +
    slides.map(function(_, i){
      return '<Relationship Id="rId' + (i + 2) +
        '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide' + (i + 1) + '.xml"/>';
    }).join("") + '</Relationships>' });
  files.push({ name:"ppt/slideMasters/slideMaster1.xml", data: xmlh +
    '<p:sldMaster' + PPTX_NS + '><p:cSld><p:spTree>' +
    '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>' +
    '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>' +
    '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>' +
    '</p:spTree></p:cSld>' +
    '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>' +
    '<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>' +
    '</p:sldMaster>' });
  files.push({ name:"ppt/slideMasters/_rels/slideMaster1.xml.rels", data: xmlh +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>' +
    '</Relationships>' });
  files.push({ name:"ppt/slideLayouts/slideLayout1.xml", data: xmlh +
    '<p:sldLayout' + PPTX_NS + ' type="blank"><p:cSld><p:spTree>' +
    '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>' +
    '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>' +
    '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>' +
    '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>' });
  files.push({ name:"ppt/slideLayouts/_rels/slideLayout1.xml.rels", data: xmlh +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>' +
    '</Relationships>' });
  files.push({ name:"ppt/theme/theme1.xml", data: pptxTheme() });
  if (media) files.push({ name:"ppt/media/" + media.name, data: media.bytes });
  slides.forEach(function(xml, i){
    files.push({ name:"ppt/slides/slide" + (i + 1) + ".xml", data: xml });
    files.push({ name:"ppt/slides/_rels/slide" + (i + 1) + ".xml.rels", data: xmlh +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>' +
      (media ? '<Relationship Id="' + PPTX_MARK_RID + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/' + media.name + '"/>' : '') +
      '</Relationships>' });
  });
  files.push({ name:"docProps/core.xml", data: xmlh +
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/">' +
    '<dc:title>' + xesc(title) + '</dc:title>' +
    '<dc:creator>Strategy Management Platform</dc:creator></cp:coreProperties>' });
  files.push({ name:"docProps/app.xml", data: xmlh +
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">' +
    '<Application>Strategy Management Platform</Application></Properties>' });
  return zipStore(files);
}

/* ── The one door the button calls ──────────────────────────────────── */
function planPptxName(target){
  var t = String(target || "");
  var name = t.indexOf("fn:") === 0
    ? (FUNCTIONS[t.slice(3)] || {}).name : (UNITS[t] || {}).name;
  return (name || "Plan") + " — Strategy plan.pptx";
}

function buildPlanPptx(target){
  var t = String(target || "");
  var slides;
  if (t.indexOf("fn:") === 0) {
    var fk = t.slice(3), f = FUNCTIONS[fk];
    slides = fnPlansInPillars(f) ? pptxUnitSlides(fnAsUnit(fk), f.name)
                                 : pptxFnSlides(fk);
  } else {
    slides = pptxUnitSlides(UNITS[t], (UNITS[t] || {}).name || "");
  }
  return pptxPackage(slides, planPptxName(target).replace(/\.pptx$/, ""));
}

function sendPlanPptx(target){
  /* Asked AGAIN at press time, not only at render time (§48.2): the viewer
     switcher can change who this is between the paint and the click. */
  if (!SMPRules.mayDownloadPlan(world(), viewer(), target)) return;
  sendFileBytes(buildPlanPptx(target), planPptxName(target),
    "application/vnd.openxmlformats-officedocument.presentationml.presentation");
}

/* ══ THE REVIEW DECK AS A POWERPOINT (spec 030) ════════════════════════════
   Islam: *"we need the ppt downloads the final presentations reported
   according to the last performance at the moment of download."*

   THIS IS NOT `pptxUnitSlides` WITH FIGURES ADDED, AND THE DIFFERENCE IS THE
   WHOLE DESIGN. That builder writes the PLAN — its own cover slide says so in
   words, "as agreed, no reported figures" — and its tables are Measure · Dir.
   · Target · Compiles and Tactic · Owner · Collaborators · Q1–Q4. Not one
   reported number appears in it. What a unit presents from is the REVIEW
   deck, which carries the YTD figure against the benchmark due, the progress,
   the band, the reporter's note and the score tables.

   §305 REFUSED TO WRITE THAT DECK A SECOND TIME AND THAT REFUSAL STILL
   STANDS. Its argument was measured: `deckSlides` + `deckSlidesFn` are 639
   lines over some twenty-one kinds of slide, the deck has moved four times in
   a fortnight (§243, §253, §254, §259), and a second description of the same
   slides would have had to be corrected on every one of those — with the
   drifting copy being the one nobody looks at until the platform is down.

   SO IT IS NOT DESCRIBED A SECOND TIME. IT IS CONVERTED. `deckHtmlFor()`
   assembles the real deck — the same call Present and the PDF make — and this
   walks the slides it produced, turning each one's heading, prose and TABLES
   into PowerPoint shapes. A slide kind added to the deck tomorrow arrives here
   with no edit, because nothing here knows the difference between a pillar's
   measures and a project's milestones: it knows headings, paragraphs and
   tables. One answer to *what is on this slide*, converted twice (§53.5).

   WHAT IT COSTS, STATED RATHER THAN DISCOVERED: the file is text and tables,
   not a picture of the deck. The gauges, the band colours behind a pill and
   the SWOT's four hues do not survive — a figure that reads "Off track" as a
   red pill on the screen reads as the words "Off track" here. That is the
   trade for slides somebody can actually edit in PowerPoint at 6am, which is
   what the file is for.

   THE DECK MUST BE ATTACHED FOR ANYTHING THAT MEASURES (§69) — and nothing
   here measures. `deckFitPass()` splits long tables against a box, which is
   why the PDF has to attach; this counts rows instead (§51.10's own argument,
   in `pptxTableSlides`), so a detached render is correct AND cheap. */

/* Text of an element, collapsed the way a slide reads it. */
function deckTxt(el){
  return String((el && el.textContent) || "").replace(/\s+/g, " ").trim();
}

/* ── TWO THINGS THE SCREEN SEPARATES AND A FLAT READ DOES NOT (§309) ────
   `textContent` is the concatenation of the descendants, and the deck relies
   on layout for the gaps between them — so a SWOT item written as
   `<li><span class="n">1</span><span>Long-standing…</span></li>` reads back
   as "1Long-standing", and a pillar's name over its grey sub-line reads as
   "…Smart CareDirection". Both were in the file Islam sent, on eight slides.

   The pieces are joined with ONE space and then collapsed, so a value that
   already carries its own spacing is unchanged — this can only ever add a
   separator where the document had none. */
function deckPieces(el){
  if (!el) return "";
  var out = [];
  [].forEach.call(el.childNodes, function(n){
    var t = String(n.textContent || "").replace(/\s+/g, " ").trim();
    if (t) out.push(t);
  });
  return out.join(" ").replace(/\s+/g, " ").trim();
}

/* ── THREE THINGS A RAW `textContent` GETS WRONG, EACH FOUND BY READING THE
   FILE RATHER THAN THE CODE (§96's family) ──────────────────────────────

   A HEADING IS TWO THINGS RUN TOGETHER. The deck writes a pillar's slide as
   `<h2><span class="dcode">MB01</span> Digital…<span class="dwhich">Key
   measures</span></h2>` — a name and a sub-label with no separator between
   them, because on the screen CSS puts the sub-label on its own line. Read
   flat it comes out "…OperationsKey measures", one word made of two. */
function deckHeading(sl){
  var h = sl.querySelector("h1, h2, h3");
  if (!h) return "";
  var w = h.querySelector(".dwhich"), which = w ? deckTxt(w) : "";
  var c = h.cloneNode(true), cw = c.querySelector(".dwhich");
  if (cw) cw.remove();
  var main = deckPieces(c);
  return which ? (main + " — " + which) : main;
}

/* A QUARTER CELL IS FOUR MARKS AND ONLY THE LIT ONES MEAN ANYTHING. The
   deck draws `<i>1</i><i class="on">2</i><i class="on">3</i><i>4</i>`, so
   flat text reads "1234" — which says a tactic runs all year when it runs in
   two quarters, and is worse than saying nothing. */
function deckQuarters(el){
  var on = [].slice.call(el.querySelectorAll("i")).filter(function(i){
    return i.classList.contains("on");
  }).map(function(i){ return "Q" + deckTxt(i); });
  return on.length ? on.join(" ") : "—";
}

/* ── A BAND IS A CLASS ON THE CELL (§309) ──────────────────────────────
   `dBand()` writes the band's own key onto the cell (`.final.good`) and the
   deck's stylesheet turns it into a colour. Read it back here rather than
   re-deriving the score, or the file and the projector could disagree about
   a number they both got from `bandOf()` (§53.5). */
var DECK_BAND_KEYS = ["good", "attn", "warn", "bad", "none"];
function deckBandColor(el){
  var C = pptxColors(), hit = null;
  DECK_BAND_KEYS.forEach(function(k){
    if (!hit && el.classList.contains(k)) hit = C.band[k];
  });
  return hit;
}

/* ── ONE CELL, AS THE DECK DRAWS IT (§309) ─────────────────────────────
   Every figure came through as plain black text hard left, so the column a
   room runs its eye down said nothing and the benchmark behind the slash
   carried the same weight as the figure it judges. Four facts are read off
   the cell the deck already marked:

     `.num`      — a figure, so right-aligned and on a common edge
     `.final`    — the score, so bold and in its band's colour
     `.duehalf`  — the benchmark, so a second run in italic quiet
     `.missing`  — the plan owes this, so §119's bold red Missing
     `.dsub`     — a second line, so a second paragraph (never one string)

   NOTHING IS NAMED PER SLIDE KIND. A table added to the deck tomorrow marks
   its own columns the same way and arrives here already right. */
function deckCellSpec(td){
  var C = pptxColors();
  var qs = td.querySelector(".qs");
  if (qs) return { t: deckQuarters(qs), align:"ctr" };
  var isNum = td.classList.contains("num"), isIdx = td.classList.contains("idx");
  var align = (isNum || isIdx) ? "r" : null;
  /* THE GAP MARK FOLLOWS ITS COLUMN, like every other value in it. Written
     right-aligned outright it sat hard right in the prose columns — a tactic
     with no outcome read as a figure (§119, found by looking at the page). */
  if (td.querySelector(".missing")) return { miss:true, align:align };

  var color = deckBandColor(td) || (isIdx ? C.quiet : null);
  var bold  = td.classList.contains("final");

  var due = td.querySelector(".duehalf");
  if (due) {
    var c2 = td.cloneNode(true); c2.querySelector(".duehalf").remove();
    return { align:align, runs: [
      { t: deckPieces(c2) || "—", b:bold, color: color || C.ink },
      { t: " " + deckTxt(due), i:true, color: C.quiet }
    ] };
  }

  var sub = td.querySelector(".dsub");
  if (sub) {
    var c3 = td.cloneNode(true); c3.querySelector(".dsub").remove();
    return { t: deckPieces(c3) || "—", sub: deckTxt(sub), align:align,
             color: color, b: bold };
  }

  var t = deckPieces(td) || "—";
  return { t:t, align:align, color:color, b:bold };
}

/* THE COLUMN WIDTHS ARE READ OFF THE HEADER, never guessed per slide kind.
   The deck marks its own numeric columns (`.num`) and its index column
   (`.idx`), so a prose column takes two shares of what is left, a figure
   takes one, and the `#` takes a fixed sliver — which is how a nine-column
   tactics table and a three-column score table both come out readable
   without either being named here.

   ── AND A HEADING MUST FIT ITS OWN COLUMN (§309) ──────────────────────
   Shares alone gave a numeric column half a prose one whatever it was
   called, so PowerPoint broke the headings as "Progres s" and "Quarter s" —
   a column narrower than the word naming it. Each column now STARTS at the
   room its own heading needs and the shares divide what is left, so a
   longer heading takes its width from the table rather than from itself. */
var DECK_HEAD_CH = 63500;      /* ≈ one character of the header's own size */
var DECK_CELL_PAD = 144000;    /* the cell's marL + marR */
function deckColWidths(ths){
  var IDX = 320040, shares = [], mins = [], total = 0, fixed = 0;
  ths.forEach(function(th){
    if (th.classList.contains("idx")) { shares.push(0); mins.push(IDX); fixed += IDX; return; }
    var m = deckTxt(th).length * DECK_HEAD_CH + DECK_CELL_PAD;
    var sh = th.classList.contains("num") ? 1 : 2;
    shares.push(sh); mins.push(m); total += sh; fixed += m;
  });
  var room = PPTX_CW - fixed;
  /* A table whose headings alone overflow the slide keeps its proportions
     rather than running off the edge — the minima are scaled to fit and the
     shares have nothing left to divide (§158's rule, one artefact along). */
  if (room < 0) {
    var k = PPTX_CW / fixed;
    return mins.map(function(m){ return Math.floor(m * k); });
  }
  return shares.map(function(sh, i){
    return sh === 0 ? IDX : mins[i] + Math.round(room * sh / total);
  });
}

/* One HTML table → head and rows of cell specs. A cell that renders as
   nothing becomes an em-dash rather than an empty box, which is the word the
   platform already uses for "there is nothing to say" (§15.1). */
function deckTable(tbl){
  var ths = [].slice.call(tbl.querySelectorAll("thead th"));
  if (!ths.length) return null;
  var rows = [].slice.call(tbl.querySelectorAll("tbody tr")).map(function(tr){
    return [].slice.call(tr.children).map(deckCellSpec);
  });
  /* THE HEADING FOLLOWS ITS COLUMN. A right-aligned figure under a
     left-aligned heading reads as two columns rather than one. */
  return { widths: deckColWidths(ths),
           head: ths.map(function(t){
             return { t: deckTxt(t),
                      align: (t.classList.contains("num") || t.classList.contains("idx")) ? "r" : null };
           }),
           rows: rows };
}

/* ── THE SHAPES THAT ARE NEITHER PROSE NOR A TABLE (§309) ──────────────
   Three of the deck's slide kinds are laid out rather than written, and each
   arrived in the download as something worse than nothing:

     `.headgrid`  Where the unit stands — THREE HEADINGS WITH NO FIGURES,
                  because `deckLead()` reads `.dlab` and paragraphs and the
                  figures are `<b>` inside a `.headcell`. The worst of the
                  round: a slide that names three readings and shows none.
     `.dstats`    a pillar's headline pair, which became four naked lines of
                  lead prose above the table.
     `.pcards`    the pillars roll-call, which fell through to the leaf-text
                  fallback and became eight lines of plain text.

   Each is read by the class the deck already puts on it, so a fourth laid-out
   kind added later still falls back to the leaf text rather than vanishing. */
function deckStats(sl){
  var box = sl.querySelector(".dstats, .leadstats");
  if (!box) return null;
  var out = [];
  [].forEach.call(box.children, function(el){
    var k = el.querySelector("i, .dlab"), v = el.querySelector("b");
    if (!k || !v) return;
    out.push({ k: deckTxt(k), v: deckTxt(v), color: deckBandColor(v) });
  });
  return out.length ? out : null;
}

function deckHeadCells(sl){
  var g = sl.querySelector(".headgrid");
  if (!g) return null;
  var out = [];
  [].forEach.call(g.querySelectorAll(".headcell"), function(el){
    var k = el.querySelector(".dlab"), v = el.querySelector("b"),
        sub = el.querySelector(".headsub");
    if (!k || !v) return;
    out.push({ k: deckTxt(k), v: deckTxt(v), color: deckBandColor(v),
               sub: sub ? deckTxt(sub) : "" });
  });
  return out.length ? out : null;
}

function deckCards(sl){
  var g = sl.querySelector(".pcards");
  if (!g) return null;
  var out = [];
  [].forEach.call(g.querySelectorAll(".pcard"), function(el){
    out.push({ c: deckTxt(el.querySelector(".pcard-c")),
               n: deckTxt(el.querySelector(".pcard-n")),
               s: deckTxt(el.querySelector(".pcard-s")) });
  });
  return out.length ? out : null;
}

/* The prose a slide carries above its table: the deck writes a small
   uppercase key (`.dlab`, `.seclab`) over a paragraph, and both are kept —
   the key is what says whether a paragraph is an aspiration or a note. */
var DECK_LAID_OUT = ".dstats, .leadstats, .headgrid, .pcards";
function deckLead(sl){
  var out = [];
  [].forEach.call(sl.querySelectorAll(".dlab, .coversub, .asp2, .asp3, p, li"), function(el){
    /* NOT THE HEADING'S OWN PARTS. The pillar slides put the code and the
       sub-label inside the `<h2>`, so without this the title is printed and
       then immediately printed again a line below it, in pieces.

       NOR ANYTHING A LAID-OUT SHAPE OWNS (§309): those are drawn by the
       three readers above, and reading them here as well printed each one
       twice — once as a shape and once as a stack of stray lines. */
    if (el.closest("table") || el.closest("h1, h2, h3") || el.closest(DECK_LAID_OUT)) return;
    var n = el.querySelector(".n");
    if (n) {
      /* A NUMBERED ITEM KEEPS ITS NUMBER APART. The deck sets a SWOT item's
         index in its own quiet column; run into the words it is the fault
         §309 removed, and glued back on with a space it is one grey word at
         the head of a sentence. */
      var c = el.cloneNode(true); c.querySelector(".n").remove();
      out.push({ n: deckTxt(n), t: deckPieces(c), key:false });
      return;
    }
    var t = deckPieces(el);
    if (!t) return;
    out.push({ t:t, key: el.classList.contains("dlab") });
  });
  /* A SLIDE THAT IS NEITHER PROSE NOR A TABLE IS STILL A SLIDE. A card kind
     added to the deck tomorrow matches none of the selectors above, so the
     fallback reads the LEAF text: every element carrying words that has no
     child carrying words. An empty slide in a file taken as a backup is the
     one thing this feature exists to prevent. */
  if (!out.length) {
    [].forEach.call(sl.querySelectorAll("*"), function(el){
      /* THE FALLBACK OBEYS THE SAME EXCLUSION, and the check is what found
         that it did not: a pillar's tables carry no prose at all, so the
         selector pass came back empty and the leaf reader then swept up the
         headline pair a second time — drawn once in the head and once as
         two stray lines above the table, which is the fault §309 removed
         wearing a different hat. */
      if (el.closest("table") || el.closest("h1, h2, h3") ||
          el.closest(DECK_LAID_OUT) || el.querySelector("*")) return;
      var t = deckTxt(el);
      if (t) out.push({ t:t, key: false });
    });
  }
  return out;
}

var DECK_LEAD_LINE = 274320;                 /* one line of lead prose, EMU */

/* ── A TABLE IS THE CONTENT OF ITS SLIDE, NOT A FOOTNOTE ON IT (§309) ───
   The plan download's 11pt over a 335280 row is right for a plan somebody
   marks up at a desk. A review is read off a projector, and at that size a
   three-row table sat in the top third of the page reading like small print.
   The row and the type grow together, and the number of rows a slide can
   hold is DERIVED from the row height rather than restated — so changing one
   number cannot leave a table running off the bottom (§122.5). */
var DECK_ROW_H = 457200;                     /* 0.375in */
var DECK_ROW_SZ = 1200;
/* THE FOOTER BAND IS THE MARK'S OWN BOX, and it was guessed at first — 685800
   left a full table and the roll-call's cards drawn straight over the lockup,
   which the XML could not show and one rendered page did (§296.1). It is the
   mark's own margin, its own height and a gap, so a change to any of the
   three moves this with it rather than leaving a constant to go stale
   (§122.5). */
var DECK_FOOT_ROOM = 640080 + 274320 + 182880;
function deckRowsPerSlide(topY){
  var room = PPTX_H - topY - DECK_FOOT_ROOM - DECK_ROW_H;   /* less the header row */
  return Math.max(1, Math.floor(room / DECK_ROW_H));
}

/* One slide of the deck → one or more PowerPoint slides. Long tables
   continue, exactly as the plan download's do. */
function deckSlidePptx(sl, kicker, mark){
  var C = pptxColors();
  var title = deckHeading(sl) || kicker;

  /* A section divider or the cover: the deck's own big-type slides, and they
     become the same here rather than being flattened into a heading with
     nothing under it. */
  if (sl.classList.contains("d-thanks")) return [pptxThanks(kicker, deckTxt(sl.querySelector(".coversub")))];
  if (sl.classList.contains("d-cover")) {
    var sub = deckTxt(sl.querySelector(".coversub")) ||
      [].slice.call(sl.querySelectorAll(".seccell")).map(deckTxt).join("  ·  ");
    return [pptxCover(GROUP.org || "", title, sub)];
  }

  var stats = deckStats(sl);
  var foot = mark ? [mark] : [];

  /* WHERE THE UNIT STANDS — the three readings the whole review builds to,
     which the download printed as three headings and nothing else (§309). */
  var cells = deckHeadCells(sl);
  if (cells) {
    var shapes = pptxHead(kicker, title);
    var cw = Math.floor(PPTX_CW / cells.length);
    cells.forEach(function(hc, i){
      shapes.push(pptxText(30 + i, { x:PPTX_MX + i * cw, y:2057400, cx:cw - 182880, cy:1828800 }, [
        pptxPara(pptxRun(hc.k.toUpperCase(), { sz:1000, b:true, color:C.quiet })),
        pptxPara(pptxRun(hc.v, { sz:5400, b:true, color:hc.color || C.ink }), { before:400 }),
        pptxPara(pptxRun(hc.sub || " ", { sz:1200, color:C.ink }), { before:400 })
      ], { anchor:"ctr" }));
    });
    var note = deckLead(sl).map(function(l){
      return pptxPara(pptxRun(l.t, { sz:1200, color:C.quiet }));
    });
    if (note.length)
      shapes.push(pptxText(40, { x:PPTX_MX, y:4800600, cx:PPTX_CW, cy:914400 }, note));
    return [pptxSlideXml(shapes.concat(foot))];
  }

  /* THE PILLARS ROLL-CALL — cards on the screen, and eight lines of flat
     text in the file until §309. Drawn as PowerPoint rectangles, so they are
     still four things somebody can move rather than a picture of four. */
  var cards = deckCards(sl);
  if (cards) {
    var sh2 = pptxHead(kicker, title);
    var cols = cards.length <= 3 ? cards.length : Math.ceil(Math.sqrt(cards.length));
    var rows = Math.ceil(cards.length / cols);
    var gap = 182880;
    var cwid = Math.floor((PPTX_CW - gap * (cols - 1)) / cols);
    var top = 1600200, bot = PPTX_H - DECK_FOOT_ROOM;
    /* A CARD IS SIZED, NOT STRETCHED. Filling the whole space gave two names
       floating at the top of a 3.4in panel; capped and then centred in what
       is left, the row reads as the deck's own (§254.5). */
    var chgt = Math.min(2011680,
      Math.floor((bot - top - gap * (rows - 1)) / rows));
    top += Math.floor((bot - top - (chgt * rows + gap * (rows - 1))) / 2);
    cards.forEach(function(cd, i){
      var cx = PPTX_MX + (i % cols) * (cwid + gap);
      var cy = top + Math.floor(i / cols) * (chgt + gap);
      /* The accent rule across the top of the card is the deck's own — one
         colour across the row rather than one per card (§254.5, §41). */
      sh2.push(pptxText(60 + i * 2, { x:cx, y:cy, cx:cwid, cy:45720 },
        [pptxPara(pptxRun(" ", { sz:100 }))], { fill:C.accent }));
      sh2.push(pptxText(61 + i * 2, { x:cx, y:cy + 45720, cx:cwid, cy:chgt - 45720 }, [
        pptxPara(pptxRun(cd.c, { sz:1100, b:true, color:C.quiet })),
        pptxPara(pptxRun(cd.n, { sz:2000, b:true, color:C.ink }), { before:400 })
      ].concat(cd.s ? [pptxPara(pptxRun(cd.s, { sz:1200, color:C.quiet }), { before:300 })] : []),
        { fill:C.zebra, anchor:"ctr" }));
    });
    return [pptxSlideXml(sh2.concat(foot))];
  }

  var lead = deckLead(sl);
  var tables = [].slice.call(sl.querySelectorAll("table"))
                 .map(deckTable).filter(Boolean);

  /* ── PROSE IS AN INTRODUCTION OR IT IS THE SLIDE (§309) ──────────────
     Above a table it introduces one, so it stays small and out of the way.
     With no table it IS the content — the four SWOT slides and the cycle's
     notes — and 13pt at the top of an otherwise empty page reads as small
     print rather than as the thing somebody is being shown. */
  var solo = !sl.querySelector("table");
  var LSZ = solo ? 1600 : 1300, LGAP = solo ? 600 : 60;
  var paras = lead.map(function(l){
    if (l.key) return pptxPara(pptxRun(l.t.toUpperCase(),
      { sz:1000, b:true, color:C.quiet }), { before:300 });
    var runs = [];
    if (l.n) runs.push(pptxRun(l.n + "   ", { sz:LSZ, b:true, color:C.accent }));
    runs.push(pptxRun(l.t, { sz:LSZ, color:C.ink }));
    return pptxPara(runs, { before:LGAP });
  });

  if (!tables.length) {
    return [pptxSlideXml(pptxHead(kicker, title, stats).concat(
      paras.length ? [pptxText(10, { x:PPTX_MX, y:PPTX_TABLE_Y, cx:PPTX_CW,
                                     cy:PPTX_H - PPTX_TABLE_Y - 457200 }, paras)]
                   : []).concat(foot))];
  }

  /* WITH A TABLE, THE PROSE SITS ABOVE IT AND THE TABLE MOVES DOWN. The
     alternative — prose on a slide of its own — doubles a deck whose aim
     slide is one aspiration over one table, and separates the sentence from
     the thing it introduces. Capped, so a long note cannot push a table off
     the bottom: past four lines it is the table that matters. */
  var out = [], leadH = Math.min(lead.length, 4) * DECK_LEAD_LINE;
  var topts = { sz:DECK_ROW_SZ, rowH:DECK_ROW_H };
  tables.forEach(function(t, ti){
    var y = PPTX_TABLE_Y + (ti === 0 ? leadH : 0);
    var per = deckRowsPerSlide(y);
    for (var i = 0; i < t.rows.length || i === 0; i += per) {
      var part = t.rows.slice(i, i + per);
      var ttl = (i || ti) ? title + " (continued)" : title;
      var shp = pptxHead(kicker, ttl, stats);
      if (ti === 0 && i === 0 && paras.length)
        shp = shp.concat([pptxText(9, { x:PPTX_MX, y:PPTX_TABLE_Y,
          cx:PPTX_CW, cy:leadH }, paras.slice(0, 4))]);
      shp = shp.concat(part.length
        ? [pptxTable(10, { x:PPTX_MX, y:(i ? PPTX_TABLE_Y : y), cx:PPTX_CW },
            t.widths, t.head, part, topts)]
        : [pptxText(10, { x:PPTX_MX, y:y, cx:PPTX_CW, cy:457200 },
            [pptxPara(pptxRun("Nothing here yet.", { sz:1200, i:true, color:C.quiet }))])]);
      out.push(pptxSlideXml(shp.concat(foot)));
    }
  });
  return out;
}

/* ── THE MARK IN THE FOOTER (§309) ─────────────────────────────────────
   `deckFootMarks()` puts the subject's own lockup along the foot of every
   content slide of the deck (§259), and the download had none at all — so
   the file a unit hands round was the one artefact of the review with
   nothing on it saying whose it is.

   THE MARK IS ASKED FOR RATHER THAN PARSED BACK OUT OF THE HTML, because the
   deck this converter walks is `deckHtmlFor()`, which runs BEFORE
   `deckFootMarks()` (that pass belongs to `deckBuild()`). Asking
   `deckMark()` is asking the same question that pass asks — the subject's
   own mark, or the group's (§259.2) — rather than depending on the order two
   passes happen to run in.

   IT IS SIZED FROM ITS OWN PIXELS. A mark laid into a fixed box is a mark
   stretched, and every tenant's is a different shape; the height is the
   deck's own footer band and the width follows from the file's aspect. */
var PPTX_MARK_RID = "rId9";
var PPTX_MARK_H = 274320;                    /* 0.225in — the deck's footer */
function reviewPptxMark(target){
  var src = deckMark(UNITS[target] || null);
  if (!src) return null;
  var bytes = dataUriBytes(src), size = bytes && pngSize(bytes);
  if (!bytes || !size) return null;
  var cx = Math.round(PPTX_MARK_H * size.w / size.h);
  return {
    media: { name:"mark.png", bytes:bytes },
    shape: pptxPic(90, { x:PPTX_MX, y:PPTX_H - 640080 - PPTX_MARK_H,
                         cx:cx, cy:PPTX_MARK_H }, PPTX_MARK_RID)
  };
}

/* THE SUBJECT'S OWN NAME IS THE KICKER on every slide, because the file is
   read a fortnight later out of a folder of nineteen of them. */
function reviewPptxSlides(target, mark){
  var box = document.createElement("div");
  box.innerHTML = deckHtmlFor(target);
  var kicker = placeLabel(target) || String(target || "");
  var out = [];
  [].forEach.call(box.querySelectorAll(".dslide"), function(sl){
    out = out.concat(deckSlidePptx(sl, kicker, mark));
  });
  return out;
}

function reviewPptxName(target){
  return (placeLabel(target) || "Review") + " — " +
    ((REVIEW && REVIEW.name) || "review") + ".pptx";
}

function buildReviewPptx(target){
  var m = reviewPptxMark(target);
  return pptxPackage(reviewPptxSlides(target, m && m.shape),
    reviewPptxName(target).replace(/\.pptx$/, ""), m && m.media);
}
