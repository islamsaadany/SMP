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
    bad:   "B04434"
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
    '<p:txBody><a:bodyPr wrap="square" lIns="91440" rIns="91440" tIns="45720" bIns="45720">' +
    '<a:normAutofit/></a:bodyPr><a:lstStyle/>' + paras.join("") + '</p:txBody></p:sp>';
}
/* A table. `widths` are EMU column widths; `head` is one array of strings;
   `rows` an array of arrays. The header wears the tenant's bar with its own
   ink — §38.5: a surface with its own ground needs its own ink. */
function pptxTable(id, box, widths, head, rows){
  var C = pptxColors();
  function cell(c, hdr, ri){
    /* A cell is a string, or an object: `{miss:true}` renders the bold red
       Missing (§119); `{t, align}` carries a mark that wants centring. */
    var o = (c !== null && typeof c === "object") ? c : { t: c };
    var runOpts = hdr    ? { sz:1100, b:true, color:C.ground }
                : o.miss ? { sz:1100, b:true, color:C.bad }
                :          { sz:1100, color:C.ink };
    /* `span` opens a cell across the columns after it and `merged` is each of
       those columns saying "I am the one before me" — the pair DrawingML needs
       for a merged run, and what lets one Missing sit across Q1–Q4 rather than
       being printed four times (§119.7). */
    if (o.merged) return '<a:tc hMerge="1"><a:txBody><a:bodyPr/><a:lstStyle/>' +
      pptxPara(pptxRun("", { sz:1100 })) + '</a:txBody><a:tcPr/></a:tc>';
    return '<a:tc' + (o.span ? ' gridSpan="' + o.span + '"' : '') +
      '><a:txBody><a:bodyPr/><a:lstStyle/>' +
      pptxPara(pptxRun(o.miss ? "Missing" : (o.t == null ? "" : o.t), runOpts),
               o.align ? { align: o.align } : undefined) +
      '</a:txBody><a:tcPr marL="72000" marR="72000" marT="36000" marB="36000">' +
      '<a:lnB w="6350"><a:solidFill><a:srgbClr val="' + C.line + '"/></a:solidFill></a:lnB>' +
      '<a:solidFill><a:srgbClr val="' +
        (hdr ? C.bar : (ri % 2 ? C.zebra : C.ground)) + '"/></a:solidFill></a:tcPr></a:tc>';
  }
  var tr = function(cells, hdr, ri){
    return '<a:tr h="335280">' + cells.map(function(t){ return cell(t, hdr, ri); }).join("") + '</a:tr>';
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
function pptxHead(kicker, title){
  var C = pptxColors();
  return [
    pptxText(2, { x:PPTX_MX, y:274320, cx:PPTX_CW, cy:320040 },
      [pptxPara(pptxRun(kicker.toUpperCase(), { sz:1000, b:true, color:C.quiet }))]),
    pptxText(3, { x:PPTX_MX, y:539496, cx:PPTX_CW, cy:594360 },
      [pptxPara(pptxRun(title, { sz:2400, b:true, color:C.bar }))]),
    pptxText(4, { x:PPTX_MX, y:1173480, cx:1828800, cy:45720 }, [pptxPara(pptxRun(" ", { sz:100 }))],
      { fill:C.accent })
  ];
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
  /* AN UNTICKED QUARTER IS THE MARK; NO QUARTER AT ALL IS A GAP (§119.7).
     Islam, seeing four empty columns beside a Missing owner: "in the tactics
     slide, Qs are missing as well." §119.1 deliberately left a blank quarter
     alone and that is still right — a tactic that runs in Q2 and Q3 is saying
     something about Q1 and Q4 by leaving them empty. What it cannot mean is
     ALL FOUR empty: nobody has said when this runs at all, which is exactly
     what the plan owes. One Missing across the four, never four of them: the
     gap is one fact, and printing it four times makes a row of alarm out of a
     single unanswered question. */
  var any = ["q1","q2","q3","q4"].some(function(q){ return t[q]; });
  if (!any) return [{ miss:true, align:"ctr", span:4 },
                    { merged:true }, { merged:true }, { merged:true }];
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
       ? pptxPara(pptxRun(u.aspiration, { sz:1500, i:true, color:C.bar }), { before:600 })
       : pptxPara(pptxRun("Missing", { sz:1500, b:true, color:C.bad }), { before:600 })],
    { fill:C.zebra }));
  if (found.length) fShapes.push(pptxText(7,
    { x:PPTX_MX, y:2705100, cx:PPTX_CW, cy:2971800 }, found));
  slides.push(pptxSlideXml(fShapes));

  var kos = u.keyObjectives || [];
  if (kos.length) slides = slides.concat(pptxTableSlides(kicker, "Key objectives",
    [4754880, 914400, 2621280, 2621280],
    ["Objective", "Dir.", "This year's target", "3-year target"],
    kos.map(function(k){ return [k.name, orMiss(k.dir), orMiss(k.target), orMiss(k.target3y)]; })));

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
      (p.measures || []).map(function(m){
        return [m.name, orMiss(m.dir), orMiss(m.target), orMiss(m.compile)];
      })));
    slides = slides.concat(pptxTableSlides(pk, p.name + " — Tactics",
      [4571760, 2103120, 1676400, 640140, 640140, 640140, 640140],
      ["Tactic", "Owner", "Collaborators", "Q1", "Q2", "Q3", "Q4"],
      (p.tactics || []).map(function(t){
        return [t.name, orMiss(t.owner),
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
    var kos = c.keyObjectives || [];
    if (kos.length) shapes.push(pptxTable(7,
      { x:PPTX_MX, y:2529840, cx:PPTX_CW },
      [5760720, 914400, 2118360, 2118360],
      ["Key objective", "Dir.", "Target", "Weight"],
      kos.slice(0, 8).map(function(k){
        return [k.name, orMiss(k.dir), orMiss(k.target),
                k.weight != null ? k.weight + "%" : PPTX_MISS];
      })));
    slides.push(pptxSlideXml(shapes));
    slides = slides.concat(pptxTableSlides(f.name + " · " + c.name, "Projects",
      [3931920, 1737360, 1188720, 1188720, 2865120],
      ["Project", "Owner", "Start", "End", "Carries"],
      (c.projects || []).map(function(p){
        return [p.name, orMiss(p.owner), orMiss(p.start), orMiss(p.end),
          plural((p.deliverables || []).length, "deliverable") + " · " +
          plural((p.outcomes || []).length, "outcome") + " · " +
          plural((p.milestones || []).length, "milestone")];
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

function pptxPackage(slides, title){
  var xmlh = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  var files = [];
  files.push({ name:"[Content_Types].xml", data: xmlh +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
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
  slides.forEach(function(xml, i){
    files.push({ name:"ppt/slides/slide" + (i + 1) + ".xml", data: xml });
    files.push({ name:"ppt/slides/_rels/slide" + (i + 1) + ".xml.rels", data: xmlh +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>' +
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
