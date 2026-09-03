/* ── xlsx, written by hand ────────────────────────────────────────────────
   An .xlsx is a ZIP of XML. Nothing here needs a library: entries are stored
   uncompressed, which the format allows and Excel opens without complaint, so
   the writer needs no deflate at all.

   The point of the workbook is that the team never sees an id, a parent_id or
   a flat 22-column table. Each sheet holds one kind of thing with only its own
   columns, and the relationships come from dropdowns of names.
   ──────────────────────────────────────────────────────────────────────── */

var CRC_TABLE = (function(){
  var t = new Uint32Array(256);
  for (var i = 0; i < 256; i++) {
    var c = i;
    for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c >>> 0;
  }
  return t;
})();
function crc32(bytes){
  var c = 0xFFFFFFFF;
  for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function zipStore(files){
  var enc = new TextEncoder(), chunks = [], central = [], offset = 0;
  function u16(n){ return [n & 255, (n >>> 8) & 255]; }
  function u32(n){ return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]; }

  files.forEach(function(f){
    var name = enc.encode(f.name), data = enc.encode(f.data), crc = crc32(data);
    var local = [].concat([0x50,0x4b,0x03,0x04], u16(20), u16(0), u16(0), u16(0), u16(0),
                          u32(crc), u32(data.length), u32(data.length),
                          u16(name.length), u16(0));
    chunks.push(new Uint8Array(local), name, data);
    central.push({ name:name, crc:crc, size:data.length, offset:offset });
    offset += local.length + name.length + data.length;
  });

  var dir = [], dirLen = 0;
  central.forEach(function(c){
    var h = [].concat([0x50,0x4b,0x01,0x02], u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
                      u32(c.crc), u32(c.size), u32(c.size),
                      u16(c.name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(c.offset));
    dir.push(new Uint8Array(h), c.name);
    dirLen += h.length + c.name.length;
  });
  var end = new Uint8Array([].concat([0x50,0x4b,0x05,0x06], u16(0), u16(0),
                    u16(central.length), u16(central.length), u32(dirLen), u32(offset), u16(0)));

  var total = chunks.reduce(function(a,x){ return a + x.length; }, 0) + dirLen + end.length;
  var out = new Uint8Array(total), pos = 0;
  chunks.concat(dir, [end]).forEach(function(x){ out.set(x, pos); pos += x.length; });
  return out;
}

function xesc(s){
  return String(s == null ? "" : s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,"");
}
function colName(n){
  var s = "";
  while (n >= 0) { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; }
  return s;
}

/* Styles: 0 default, 1 header, 2 locked helper, 3 wrapped text, 4 note. */
var XL_STYLES =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<fonts count="5">' +
    '<font><sz val="11"/><name val="Calibri"/></font>' +
    '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>' +
    '<font><sz val="10"/><color rgb="FF8A9099"/><name val="Consolas"/></font>' +
    '<font><sz val="11"/><name val="Calibri"/></font>' +
    '<font><i/><sz val="10"/><color rgb="FF6B7583"/><name val="Calibri"/></font>' +
  '</fonts>' +
  '<fills count="4">' +
    '<fill><patternFill patternType="none"/></fill>' +
    '<fill><patternFill patternType="gray125"/></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FF16325C"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFEFF2F6"/><bgColor indexed="64"/></patternFill></fill>' +
  '</fills>' +
  '<borders count="2"><border/>' +
    '<border><left style="thin"><color rgb="FFD6DCE5"/></left><right style="thin"><color rgb="FFD6DCE5"/></right>' +
    '<top style="thin"><color rgb="FFD6DCE5"/></top><bottom style="thin"><color rgb="FFD6DCE5"/></bottom></border>' +
  '</borders>' +
  '<cellStyleXfs count="1"><xf/></cellStyleXfs>' +
  '<cellXfs count="5">' +
    '<xf xfId="0" borderId="1" applyBorder="1"><alignment vertical="top" wrapText="1"/></xf>' +
    '<xf xfId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1">' +
      '<alignment vertical="center" wrapText="1"/></xf>' +
    '<xf xfId="0" fontId="2" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1">' +
      '<alignment vertical="top"/></xf>' +
    '<xf xfId="0" fontId="3"><alignment vertical="top" wrapText="1"/></xf>' +
    '<xf xfId="0" fontId="4"><alignment vertical="top" wrapText="1"/></xf>' +
  '</cellXfs></styleSheet>';

/* A number is written as a number.

   Every cell used to go out as an inline string, which put Excel's
   "number stored as text" warning on every target in the file and stopped the
   column sorting or totalling. A value the sheet declares numeric and that
   parses as one is written with no type attribute, which is xlsx for a number;
   anything else stays a string, so "4,500" typed with a comma is not silently
   turned into 4.5. */
function numericCell(v){
  if (v == null || v === "") return null;
  var t = String(v).trim();
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return null;
  var n = Number(t);
  return isNaN(n) ? null : String(n);
}

/* A sheet: header row, data rows, column widths, a frozen header and any
   dropdowns. Text is written as inline strings \u2014 no shared-string table to
   keep in step with the cells that point into it.

   A validation is one of two kinds. `list` is literal values, typed into the
   file. `from` is a RANGE on another sheet, which is what makes the pillar
   dropdown live: it reads whatever the Pillars sheet holds at the moment the
   cell is opened, so a pillar typed two minutes ago is offered here. A fixed
   list could not do that, and on a unit with no plan it offered nothing at all
   \u2014 Excel then refused every pillar name typed into the column, which is why
   a first plan could not be authored from the template.

   `soft` makes a validation a SUGGESTION: the dropdown is offered, anything
   else is still accepted. Units of measure are a tenant's own vocabulary, so a
   locked list would block the first legitimate unit nobody thought of. */
function sheetXml(sh){
  var cols = sh.widths ? '<cols>' + sh.widths.map(function(w, i){
    return '<col min="' + (i+1) + '" max="' + (i+1) + '" width="' + w + '" customWidth="1"/>';
  }).join("") + '</cols>' : '';

  var rows = [];
  if (sh.head) {
    rows.push('<row r="1" ht="28" customHeight="1">' + sh.head.map(function(h, i){
      return '<c r="' + colName(i) + '1" s="1" t="inlineStr"><is><t>' + xesc(h) + '</t></is></c>';
    }).join("") + '</row>');
  }
  (sh.rows || []).forEach(function(r, ri) {
    var n = ri + (sh.head ? 2 : 1);
    rows.push('<row r="' + n + '">' + r.map(function(v, ci){
      if (v == null || v === "") return "";
      var style = (sh.lockedCols && sh.lockedCols.indexOf(ci) > -1) ? ' s="2"' : ' s="0"';
      var num = (sh.numCols && sh.numCols.indexOf(ci) > -1) ? numericCell(v) : null;
      if (num !== null)
        return '<c r="' + colName(ci) + n + '"' + style + '><v>' + num + '</v></c>';
      return '<c r="' + colName(ci) + n + '"' + style + ' t="inlineStr"><is><t>' + xesc(v) + '</t></is></c>';
    }).join("") + '</row>');
  });

  /* EXCEL DROPS AN INLINE LIST OVER 255 CHARACTERS, AND SAYS NOTHING (§67.5).
     The file opens, the column looks right, and the dropdown is simply empty —
     which is how the Unit column shipped: 21 places is 301 characters, and the
     Official BU list beside it is 93, so one worked and one did not.

     A list that grows with the tenant will cross that line one day whatever it
     is today, so the writer refuses rather than truncating: `from` is the way
     to write a long list and this makes forgetting it loud. */
  (sh.validations || []).forEach(function(v){
    if (v.from) return;
    var n = ('"' + (v.list || []).join(",") + '"').length;
    if (n > 255) throw new Error(
      "xlsx: a dropdown of " + (v.list || []).length + " values is " + n +
      " characters, and Excel silently ignores an inline list over 255. " +
      "Put the values in a sheet and use `from` instead (" + v.range + ").");
  });
  var dv = (sh.validations || []).map(function(v){
    var f = v.from ? xesc(v.from) : '"' + xesc((v.list || []).join(",")) + '"';
    return '<dataValidation type="list" allowBlank="1" showInputMessage="1" ' +
      'showErrorMessage="' + (v.soft ? "0" : "1") + '" ' +
      'errorTitle="Not a valid entry" error="' + xesc(v.error || "Choose one of the listed values.") + '" ' +
      'sqref="' + v.range + '"><formula1>' + f + '</formula1></dataValidation>';
  }).join("");

  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetViews><sheetView workbookViewId="0">' +
      (sh.head ? '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' : '') +
    '</sheetView></sheetViews>' +
    '<sheetFormatPr defaultRowHeight="15"/>' + cols +
    '<sheetData>' + rows.join("") + '</sheetData>' +
    (dv ? '<dataValidations count="' + (sh.validations || []).length + '">' + dv + '</dataValidations>' : '') +
    '</worksheet>';
}

function buildXlsx(sheets){
  var files = [
    { name:"[Content_Types].xml", data:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      sheets.map(function(s, i){
        return '<Override PartName="/xl/worksheets/sheet' + (i+1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
      }).join("") +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      '</Types>' },
    { name:"_rels/.rels", data:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>' },
    { name:"xl/workbook.xml", data:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      sheets.map(function(s, i){
        return '<sheet name="' + xesc(s.name) + '" sheetId="' + (i+1) + '" r:id="rId' + (i+1) + '"/>';
      }).join("") + '</sheets></workbook>' },
    { name:"xl/_rels/workbook.xml.rels", data:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sheets.map(function(s, i){
        return '<Relationship Id="rId' + (i+1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i+1) + '.xml"/>';
      }).join("") +
      '<Relationship Id="rId' + (sheets.length+1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '</Relationships>' },
    { name:"xl/styles.xml", data:XL_STYLES }
  ];
  sheets.forEach(function(s, i){
    files.push({ name:"xl/worksheets/sheet" + (i+1) + ".xml", data:sheetXml(s) });
  });
  return zipStore(files);
}

/* ── The workbooks ────────────────────────────────────────────────────────
   One sheet per kind of thing, each with only its own columns. Relationships
   come from a dropdown of names, not from an id typed by hand \u2014 ids are the
   single largest source of error in a filled sheet, and the team never needs
   to see one.

   The ID column is present but greyed and always last: blank in a fresh
   template, filled when a plan is downloaded, and what makes a second upload
   update a plan rather than duplicate it.
   ─────────────────────────────────────────────────────────────────────── */

var DIRS = ["\u2265", "\u2264"];
var COMPILES = ["Latest", "Sum", "Average"];
var KINDS = ["Direction", "Capability"];
var YESNO = ["Yes", "No"];

/* A theme is chosen by NAME, never by its code. The codes (OT, VC, DIV) are
   the platform's own shorthand and mean nothing to whoever fills the sheet.
   "— none —" is offered explicitly because a pillar is allowed to belong to no
   theme — the platform reads that as cross-cutting and shows it on the
   Temple's base — and the dropdown never used to admit it. */
var NO_THEME = "\u2014 none \u2014";
function themeNames(){
  return GROUP.themes.map(function(t){ return t.name; }).concat([NO_THEME]);
}
function themeNameOf(ab){
  var t = GROUP.themes.filter(function(x){ return x.ab === ab; })[0];
  return t ? t.name : NO_THEME;
}
/* The code is still accepted on the way in, so a file written against an
   earlier template still loads. */
function themeAbOf(name){
  var n = String(name == null ? "" : name).trim();
  if (!n || n === NO_THEME) return "";
  var t = GROUP.themes.filter(function(x){ return x.name === n || x.ab === n; })[0];
  return t ? t.ab : "";
}

/* Units of measure are a tenant's own vocabulary, so the list SUGGESTS rather
   than enforces: whatever is already in use, plus the obvious ones. A locked
   list would refuse the first legitimate unit nobody anticipated. Anything
   carrying a comma is left out — Excel's literal lists are comma-separated. */
function unitSuggestions(){
  var seen = {}, out = [];
  function add(x){
    x = String(x == null ? "" : x).trim();
    if (!x || seen[x] || x.indexOf(",") > -1) return;
    seen[x] = 1; out.push(x);
  }
  /* §251: `Y/N` is offered here too, or a plan authored on the platform and
     downloaded would come back with every yes/no target unrecognised — the
     upload AUTHORS the plan (§22), so a unit the template cannot say is a
     unit the round trip destroys. It is written into the Target cell whole,
     exactly as `6.2B EGP` is; there is no separate column for a unit. */
  ["%", "EGP", "M EGP", "B EGP", "days", "#", "Y/N"].forEach(add);
  UNIT_KEYS.forEach(function(k){
    var u = UNITS[k];
    (u.keyObjectives || []).forEach(function(m){ add(splitTarget(m.target).unit); });
    (u.items || []).forEach(function(p){
      (p.measures || []).forEach(function(m){ add(splitTarget(m.target).unit); });
    });
  });
  return out.slice(0, 40);
}

/* The pillar list, live.

   `Pillars!$A$2:$A$400` is read at the moment the cell is opened, so a pillar
   typed on the Pillars sheet a minute ago is offered here. The list used to be
   fixed text baked in at download — which on a unit with no plan was EMPTY,
   and Excel then refused every pillar name typed into the column. That is why
   a first plan could not be authored from the template at all. */
var PILLAR_RANGE = "Pillars!$A$2:$A$400";
/* Sized to the list rather than padded to a round number: a range with blank
   rows in it puts blank entries in the dropdown. */
function LISTS_UNIT_RANGE(n){ return "Lists!$A$2:$A$" + (n + 1); }
function LISTS_BU_RANGE(n){ return "Lists!$B$2:$B$" + (n + 1); }
var PROJECT_RANGE = "Projects!$A$2:$A$100";

/* ── The Read me sheet ────────────────────────────────────────────────────
   The template is GENERIC: the same file whichever unit is being planned, and
   nothing in it names a unit except one cell. B2 is a dropdown of the tenant's
   business units, and it is what the platform reads on upload to know whose
   plan this is. Codes used to carry that — every id began with the unit's key —
   and with the codes gone this cell is the only thing that says it. */
function readme(kind, pickLabel, pickList){
  var lines = kind === "plan"
    ? [["Plan workbook", ""],
       [pickLabel, ""],
       ["", ""],
       ["How to fill it", "One sheet per part of the plan. Fill Pillars FIRST \u2014 Measures and Tactics choose their pillar from what you type there."],
       ["Dropdowns", "Kind, Theme, Direction, Compile, Unit and the quarter columns are lists. Unit suggests rather than insists: type your own if it is not offered."],
       ["Owners", "Type the person's name."],
       ["Targets", "The number in Target, the unit beside it \u2014 90 and %, not \"90%\". A blank target is allowed: the measure is recorded and left unscored."],
       ["Horizon", "On the Aspiration sheet: the year this plan runs to. Yours to set \u2014 the platform does not assume one \u2014 and it is what every \"by <year>\" on screen reads from."],
       ["Themes", "A pillar may belong to no theme. Choose \"" + NO_THEME + "\" and it reads as cross-cutting."],
       ["Blank rows", "Ignored."],
       ["Codes", "There are none to type. The platform assigns every code itself when the file arrives."],
       ["What upload does", "Writes this plan from scratch. Whatever is recorded now is archived first and can be restored \u2014 nothing is deleted."],
       ["", ""],
       ["When you are done", "Save as .xlsx and upload it on Manage \u2192 Import."]]
    : [["Progress workbook", ""],
       [pickLabel, ""],
       ["", ""],
       ["How to fill it", "Type only in the New value column. Everything else is there so you can see what you are reporting against."],
       ["Leaving it blank", "A blank New value means nothing changed. Only the rows you fill are read."],
       ["Measures", "Enter the actual, in the same unit as the target. What it means against the target is worked out on arrival."],
       ["Tactics", "Enter percent complete, as a number. Due % is what the plan says should be delivered by now."],
       ["Not yet due", "Rows marked so are outside the current review. Leave them blank."],
       ["", ""],
       ["When you are done", "Save as .xlsx and upload it on Manage \u2192 Import."]];
  return { name:"Read me", widths:[22, 96],
           rows:lines.map(function(l){ return [l[0], l[1]]; }),
           validations:[{ range:"B2:B2", list:pickList,
                          error:"Choose one from the list." }] };
}

/* Read the one cell that says whose plan this is. */
/* ── Reading the Read me sheet (§51.14) ──────────────────────────────────
   BY LABEL, NEVER BY ROW NUMBER. An entirely empty row is not written into an
   .xlsx at all — Excel skips it — so the blank spacer this sheet uses for air
   is present when the template is generated and GONE from the file that comes
   back. Every row below it shifts up by one.

   That is what broke uploading a business unit's plan: the function cell was
   read at row index 2, which in a returned file is "How to fill it", so the
   platform refused the upload saying there was no supporting function called
   "One sheet per part of the plan. Fill Pillars FIRST…". A template downloaded
   from the product could not be uploaded back into it.

   THE LABEL IN COLUMN A IS THE CELL'S IDENTITY. Position is not: it depends on
   what is above, and what is above can be dropped by a spreadsheet nobody in
   this codebase controls. Reading by label also means a row can be added to
   the Read me sheet later without breaking a file saved before it. */
function readmeCell(sheets, label){
  var rows = sheets["Read me"];
  if (!rows) return "";
  var want = String(label).trim().toLowerCase();
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i] || [];
    if (String(r[0] == null ? "" : r[0]).trim().toLowerCase() === want)
      return String(r[1] == null ? "" : r[1]).trim();
  }
  return "";
}

/* Whose plan this is. Both templates label it differently — a unit's says
   "Business unit" and a capability's says "Capability" — so both are asked
   for, and the one that answers is the answer. */
/* WRITES THE NEW LABEL, READS EITHER (§58, §61). The pillars Read me sheet used
   to be labelled "Business unit" and now says "Business unit or function",
   because the dropdown offers both. A label is a CONTRACT with every file
   already downloaded and sitting in somebody's Downloads folder, so the old one
   still reads — and renaming it without this is the §51.11 fault exactly: the
   reader stops finding the cell, the upload reports "no business unit called
   ''", and nothing says why. */
var READ_PICK_LABELS = ["Business unit or function", "Business unit", "Capability"];
function readmePick(sheets){
  for (var i = 0; i < READ_PICK_LABELS.length; i++) {
    var v = readmeCell(sheets, READ_PICK_LABELS[i]);
    if (v) return v;
  }
  return "";
}

/* Everything a pillars plan may be written for, in the order the dropdown
   offers it. Named once because the Import page shows the same count. */
function planSubjectNames(){
  return UNIT_KEYS.filter(function(k){ return UNITS[k].active !== false; })
           .map(function(k){ return UNITS[k].name; })
    .concat(FUNCTION_KEYS.filter(function(k){
      return FUNCTIONS[k].active !== false && fnPlansInPillars(FUNCTIONS[k]);
    }).map(function(k){ return FUNCTIONS[k].name; }));
}

function planWorkbook(u){
  var themes = themeNames();
  var units = unitSuggestions();
  var picked = u ? u.name : "";

  /* UNITS AND THE FUNCTIONS THAT PLAN LIKE THEM (§61). A function whose
     format is pillars carries the same plan a unit does — the same pillars,
     measures and tactics, read by the same pages — so it can arrive in the
     same file, and the only thing that had ever stopped it was this list.

     Retired ones are left out on both sides, and the label stays "Business
     unit": it is the cell the reader looks for, and renaming it would refuse
     every file downloaded before today (§58.2, the same contract). */
  /* "or function" is not decoration: the dropdown now offers both, and a label
     reading "Business unit" beside a function's name would read as a mistake
     in the file rather than as the feature (§61). */
  var readmeSheet = readme("plan", "Business unit or function", planSubjectNames());
  readmeSheet.rows[1][1] = picked;

  /* THE FILE STOPS ASKING A FUNCTION FOR A STRATEGY IT DOES NOT AUTHOR
     (§213, Islam: *"if you're talking about the template of the functions,
     yes you can drop these columns of course"*).

     A supporting function inherits its aspiration, SWOT and who-we-are from
     the unit it plans under, so a template offering it those three sheets was
     asking for content the product now has nowhere to show — which is the
     fault §212 spent a section removing, arriving from the file end. Its
     objectives take a CAPABILITY's shape for the same reason: that is what its
     Overview draws, and a 3-year target column would collect a value no page
     renders while the Weight the page shows would have nowhere to come from.

     A UNIT'S WORKBOOK IS UNTOUCHED — every sheet, every column, every
     validation range — and that is asserted rather than assumed. */
  var isFn = !!(u && String(u.ukey || "").indexOf("fn:") === 0);

  return [
    readmeSheet]
  .concat(isFn ? [] : [
    { name:"Foundation", widths:[20, 78],
      head:["Label", "Text"],
      rows:u.clauses.map(function(c){ return [c[0], c[1]]; }) },

    { name:"Aspiration", widths:[24, 86],
      head:["Field", "Text"],
      rows:[
        ["Winning aspiration", u.aspiration],
        ["End in mind (optional)", u.endInMind || ""],
        /* Blank until the tenant has set one. The horizon is the year they
           are planning TO — an input, not a default the platform hands them,
           and a pre-filled year reads as a decision somebody already made. */
        ["Horizon (the year this plan runs to)", GROUP.horizon || ""]
      ] }
  ])
  .concat(isFn ? [
    /* A function's objectives, in its Overview's own columns. `numCols` and
       every validation range move with the columns — a range is a POSITION
       (§65), and leaving them where a unit's are would validate the wrong
       cells in silence. */
    { name:"Objectives", widths:[36, 11, 16, 10, 12, 10, 9],
      head:["Objective", "Direction", "This year target", "Unit", "Compile", "Weight %", "Hidden"],
      numCols:[2, 5],
      validations:[{ range:"B2:B60", list:DIRS },
                   { range:"D2:D60", list:units, soft:true },
                   { range:"E2:E60", list:COMPILES },
                   { range:"G2:G60", list:YESNO, soft:true }],
      rows:u.keyObjectives.map(function(m){
        var a = splitTarget(m.target);
        return [m.name, m.dir, a.value, a.unit, m.compile,
                m.weight == null ? "" : m.weight,
                SMPRules.isHidden(m) ? "Yes" : ""];
      }) }
  ] : [
    { name:"Objectives", widths:[36, 18, 11, 16, 16, 10, 12, 9],
      head:["Objective", "Group", "Direction", "3-year target", "This year target", "Unit", "Compile", "Hidden"],
      numCols:[3, 4],
      validations:[{ range:"C2:C60", list:DIRS },
                   { range:"F2:F60", list:units, soft:true },
                   { range:"G2:G60", list:COMPILES },
                   { range:"H2:H60", list:YESNO, soft:true }],
      rows:u.keyObjectives.map(function(m){
        var a = splitTarget(m.target), b = splitTarget(m.target3y);
        return [m.name, m.group || "", m.dir, b.value, a.value, a.unit, m.compile,
                SMPRules.isHidden(m) ? "Yes" : ""];
      }) },

    { name:"SWOT", widths:[16, 78],
      head:["Type", "Point"],
      validations:[{ range:"A2:A200", list:["Strength","Weakness","Opportunity","Threat"] }],
      rows:[["s","Strength"],["w","Weakness"],["o","Opportunity"],["t","Threat"]]
        .reduce(function(acc, pair){
          (u.swot[pair[0]] || []).forEach(function(x){ acc.push([pair[1], x]); });
          return acc;
        }, []) }
  ])
  .concat([
    { name:"Pillars", widths:[40, 14, 22, 22],
      head:["Pillar", "Kind", "Theme", "Owner"],
      validations:[{ range:"B2:B60", list:KINDS },
                   { range:"C2:C60", list:themes,
                     error:"Choose a theme name, or \u2014 none \u2014 for a cross-cutting pillar." }],
      rows:u.items.map(function(p){ return [p.name, p.kind, themeNameOf(p.theme), p.owner]; }) },

    { name:"Measures", widths:[34, 40, 11, 14, 12, 12, 9],
      head:["Pillar", "Measure", "Direction", "Target", "Unit", "Compile", "Hidden"],
      numCols:[3],
      validations:[{ range:"A2:A400", from:PILLAR_RANGE,
                     error:"Choose a pillar from the Pillars sheet." },
                   { range:"C2:C400", list:DIRS },
                   { range:"E2:E400", list:units, soft:true },
                   { range:"F2:F400", list:COMPILES },
                   { range:"G2:G400", list:YESNO, soft:true }],
      rows:u.items.reduce(function(acc, p){
        p.measures.forEach(function(m){
          var a = splitTarget(m.target);
          acc.push([p.name, m.name, m.dir, a.value, a.unit, m.compile,
                    SMPRules.isHidden(m) ? "Yes" : ""]);
        });
        return acc;
      }, []) },

    /* §248: THE OUTCOME'S THREE FACTS TRAVEL WITH IT, or downloading a plan
       and uploading it back would silently drop every target the office had
       set — §22's contract is that an upload AUTHORS the plan, so a column the
       file does not carry is a column the plan loses.

       A VALIDATION RANGE IS A POSITION (§65), so the three new columns push
       Q1–Q4 from G:J to J:M and Hidden from K to N. Getting that wrong
       validates the wrong cells in silence, which is why the ranges move in
       the same edit as the head. */
    { name:"Tactics", widths:[30, 40, 40, 34, 8, 12, 12, 20, 24, 7, 7, 7, 7, 9],
      head:["Pillar", "Tactic", "Description", "Outcome",
            "Outcome direction", "Outcome target", "Outcome compiled",
            "Owner", "Collaborators", "Q1", "Q2", "Q3", "Q4", "Hidden"],
      validations:[{ range:"A2:A400", from:PILLAR_RANGE,
                     error:"Choose a pillar from the Pillars sheet." },
                   { range:"E2:E400", list:["\u2265", "\u2264"], soft:true },
                   { range:"G2:G400", list:["Sum", "Latest", "Average"], soft:true },
                   { range:"J2:M400", list:YESNO },
                   { range:"N2:N400", list:YESNO, soft:true }],
      rows:u.items.reduce(function(acc, p){
        p.tactics.forEach(function(t){
          acc.push([p.name, t.name, t.description || "", t.outcome || "",
            t.outDir || "", t.outTarget || "", t.outCompile || "",
            t.owner, (t.collaborators || []).join(", "),
            t.q1 ? "Yes" : "No", t.q2 ? "Yes" : "No", t.q3 ? "Yes" : "No", t.q4 ? "Yes" : "No",
            SMPRules.isHidden(t) ? "Yes" : ""]);
        });
        return acc;
      }, []) }
  ]);
}

/* Reporting is unchanged: it is per unit, it amends rows that already exist,
   and its ID column is what addresses them. Only the plan template lost its
   codes, because only the plan template authors rather than amends. */
function progressWorkbook(u){
  var sheet = readme("progress", "Business unit", [u.name]);
  sheet.rows[1][1] = u.name;
  return [
    sheet,

    { name:"Objectives", widths:[40, 11, 16, 18, 18, 16], lockedCols:[5],
      head:["Objective", "Direction", "Target", "Currently recorded", "New value", "ID"],
      rows:u.keyObjectives.map(function(m){
        return [m.name, m.dir, m.target || "no target", m.actual || "", "", m.id];
      }) },

    { name:"Measures", widths:[30, 38, 11, 16, 18, 18, 16], lockedCols:[6],
      head:["Pillar", "Measure", "Direction", "Target", "Currently recorded", "New value", "ID"],
      rows:u.items.reduce(function(acc, p){
        p.measures.forEach(function(m){
          acc.push([p.name, m.name, m.dir, m.target || "no target", m.actual || "", "", m.id]);
        });
        return acc;
      }, []) },

    { name:"Tactics", widths:[30, 42, 16, 12, 18, 18, 16], lockedCols:[6],
      head:["Pillar", "Tactic", "Quarters", "Due %", "Currently recorded %", "New %", "ID"],
      rows:u.items.reduce(function(acc, p){
        p.tactics.forEach(function(t){
          var pl = tacticPlanned(t);
          acc.push([p.name, t.name, spanLabel(t),
            tacticDue(t) ? String(pl) : "not yet due",
            t.actual == null ? "" : String(t.actual), "", t.id]);
        });
        return acc;
      }, []) }
  ];
}

/* ── Reading an xlsx back ─────────────────────────────────────────────────
   A ZIP read from its central directory, then the sheet XML. Excel omits
   empty cells entirely, so a column position can never be inferred from
   order \u2014 it has to come from each cell's own reference. Getting that wrong
   silently shifts every value one column left the moment a cell is left
   blank, which is why the reader keys on the reference.
   ─────────────────────────────────────────────────────────────────────── */

async function inflateRaw(bytes){
  var ds = new DecompressionStream("deflate-raw");
  var w = ds.writable.getWriter(); w.write(bytes); w.close();
  return new Uint8Array(await new Response(ds.readable).arrayBuffer());
}

async function unzip(buf){
  var b = new Uint8Array(buf), dv = new DataView(buf);
  /* Find the end-of-central-directory record from the back; a comment may
     follow it, so it cannot be assumed to be the last 22 bytes. */
  var eocd = -1;
  for (var i = b.length - 22; i >= 0 && i > b.length - 66000; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("Not a zip file");
  var count = dv.getUint16(eocd + 10, true), start = dv.getUint32(eocd + 16, true);
  var out = {}, p = start;
  for (var n = 0; n < count; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    var method = dv.getUint16(p + 10, true);
    var compSize = dv.getUint32(p + 20, true);
    var nameLen = dv.getUint16(p + 28, true);
    var extraLen = dv.getUint16(p + 30, true);
    var commLen = dv.getUint16(p + 32, true);
    var local = dv.getUint32(p + 42, true);
    var name = new TextDecoder().decode(b.subarray(p + 46, p + 46 + nameLen));
    var lNameLen = dv.getUint16(local + 26, true);
    var lExtraLen = dv.getUint16(local + 28, true);
    var dataAt = local + 30 + lNameLen + lExtraLen;
    var raw = b.subarray(dataAt, dataAt + compSize);
    out[name] = method === 0 ? raw : await inflateRaw(raw);
    p += 46 + nameLen + extraLen + commLen;
  }
  return out;
}

function xmlDoc(bytes){
  return new DOMParser().parseFromString(new TextDecoder().decode(bytes), "application/xml");
}
function refToCol(ref){
  var m = /^([A-Z]+)/.exec(ref);
  if (!m) return 0;
  var n = 0;
  for (var i = 0; i < m[1].length; i++) n = n * 26 + (m[1].charCodeAt(i) - 64);
  return n - 1;
}

/* THE SAME NUMBER, SPELLED THE WAY SOMEBODY WOULD WRITE IT (§96.3).
   Returns the raw text unchanged unless a round trip through Number lands on
   exactly the same characters-to-double value AND is shorter — so `9.7` wins
   over `9.6999999999999993`, `0.1` and `1e21` are left alone, and a 20-digit
   account number, which cannot round-trip, is never touched. */
function shortestNum(raw){
  var txt = String(raw == null ? "" : raw).trim();
  if (!txt) return txt;
  var n = Number(txt);
  if (!isFinite(n)) return txt;
  var short = String(n);
  /* AND NEVER INTO EXPONENTIAL NOTATION. `-0.0000001` shortens to `-1e-7`,
     which is the same number and the wrong thing to put in a plan target —
     shorter is only better while it is still the spelling a person would
     write. */
  if (/[eE]/.test(short) && !/[eE]/.test(txt)) return txt;
  /* The test is that the SHORT form reads back as the same double, not that
     the two strings look alike — that is what makes it safe to substitute. */
  if (short.length < txt.length && Number(short) === n) return short;
  return txt;
}

async function readXlsx(buf){
  var files = await unzip(buf);

  var shared = [];
  if (files["xl/sharedStrings.xml"]) {
    var sd = xmlDoc(files["xl/sharedStrings.xml"]);
    Array.prototype.forEach.call(sd.getElementsByTagName("si"), function(si){
      var ts = si.getElementsByTagName("t"), s = "";
      for (var i = 0; i < ts.length; i++) s += ts[i].textContent;
      shared.push(s);
    });
  }

  /* Sheet order and names come from the workbook; the file each maps to comes
     from the relationships, not from the sheetN.xml naming, which is only a
     convention. */
  var wb = xmlDoc(files["xl/workbook.xml"]);
  var rels = xmlDoc(files["xl/_rels/workbook.xml.rels"]);
  var relMap = {};
  Array.prototype.forEach.call(rels.getElementsByTagName("Relationship"), function(r){
    relMap[r.getAttribute("Id")] = r.getAttribute("Target").replace(/^\/?xl\//, "");
  });

  var sheets = {};
  Array.prototype.forEach.call(wb.getElementsByTagName("sheet"), function(sh){
    var name = sh.getAttribute("name");
    var rid = sh.getAttribute("r:id") || sh.getAttributeNS(
      "http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
    var target = relMap[rid];
    var data = files["xl/" + target] || files[target];
    if (!data) return;
    var doc = xmlDoc(data), rows = [];
    Array.prototype.forEach.call(doc.getElementsByTagName("row"), function(row){
      var cells = [];
      Array.prototype.forEach.call(row.getElementsByTagName("c"), function(c){
        var idx = refToCol(c.getAttribute("r") || "");
        var t = c.getAttribute("t"), v = "";
        if (t === "inlineStr") {
          var is = c.getElementsByTagName("t");
          for (var i = 0; i < is.length; i++) v += is[i].textContent;
        } else {
          var vn = c.getElementsByTagName("v")[0];
          v = vn ? vn.textContent : "";
          if (t === "s") v = shared[+v] != null ? shared[+v] : "";
          /* ── A NUMBER EXCEL WROTE AT FULL PRECISION (§96.3) ────────
             Islam, on a key objective reading `9.6999999999999993%`.

             It is not the platform's arithmetic — JavaScript prints that
             number as `9.7`, and there is no sum, ratio or conversion
             anywhere near a target. It is the RAW TEXT of the cell: Excel
             writes a value's full 17-digit form whenever it came from a
             calculation rather than from somebody typing it, and this reader
             took `vn.textContent` and stored the characters.

             So a numeric cell is put through the shortest string that parses
             back to the SAME double. `9.6999999999999993` and `9.7` are one
             number, and the short spelling is the one a person wrote.
             Anything already short is untouched, and anything that does NOT
             round-trip is left exactly as it arrived — a long identifier
             beyond a double's precision must not be quietly rewritten by a
             reader (§50.6: a reader that changes what it reads is the fault,
             and this is the narrowest form of it that still fixes the bug). */
          if (!t || t === "n") v = shortestNum(v);
        }
        cells[idx] = v;
      });
      for (var i = 0; i < cells.length; i++) if (cells[i] == null) cells[i] = "";
      rows.push(cells);
    });
    sheets[name] = rows;
  });
  return sheets;
}

/* ── Workbook back to the flat rows the importer already understands ──── */
function sheetObjects(rows){
  if (!rows || rows.length < 2) return [];
  var head = rows[0].map(function(h){ return String(h || "").trim(); });
  return rows.slice(1).filter(function(r){ return r.join("").trim() !== ""; })
    .map(function(r){
      var o = {};
      head.forEach(function(h, i){ if (h) o[h] = String(r[i] == null ? "" : r[i]).trim(); });
      return o;
    });
}
function yes(v){ return /^(y|yes|1|true|x|\u2713)$/i.test(String(v || "").trim()); }

/* Reading the filled workbook.

   Nothing here matches an existing row, because an upload AUTHORS a plan
   rather than amending one (§22): every item is created and every code is
   minted, in sheet order. A measure names its pillar and the pillar's freshly
   minted code is looked up by that name — and because a file holds exactly one
   unit, every pillar in the file is one of that unit's, so there is nothing to
   get wrong. */
function planFromWorkbook(u, sheets){
  var rows = [], pillarId = {}, n = 0;
  var mint = function(suffix){ return u.ukey + "-" + suffix; };

  sheetObjects(sheets["Pillars"]).forEach(function(r){
    if (!r["Pillar"]) return;
    var id = mint("P" + (++n));
    pillarId[r["Pillar"]] = id;
    rows.push({ id:id, type:"PILLAR", name:r["Pillar"], kind:r["Kind"],
                theme:themeAbOf(r["Theme"]), owner:r["Owner"], notes:"", parent_id:"",
                description:"", outcome:"", collaborators:"", direction:"",
                value:"", value_3y:"", unit:"", horizon:"", compile:"",
                q1:"", q2:"", q3:"", q4:"", source_slide:"" });
  });

  var fN = 0;
  sheetObjects(sheets["Foundation"]).forEach(function(r){
    if (!r["Label"] && !r["Text"]) return;
    rows.push({ id:mint("F" + (++fN)), type:"FOUNDATION",
                name:r["Label"], description:r["Text"] });
  });

  var aN = 0;
  sheetObjects(sheets["Aspiration"]).forEach(function(r){
    if (/horizon/i.test(r["Field"] || "")) { GROUP.horizon = r["Text"] || GROUP.horizon; return; }
    if (!r["Text"]) return;
    rows.push({ id:mint("ASP" + (++aN)), type:"ASPIRATION",
                name:r["Field"], description:r["Text"] });
  });

  var kN = 0;
  sheetObjects(sheets["Objectives"]).forEach(function(r){
    if (!r["Objective"]) return;
    /* §213: a function's sheet has no "3-year target" and DOES have a
       "Weight %"; a unit's is the other way round. Read by header name and
       both files pass through one reader — an absent column simply reads
       undefined, which is what an absent value already means here (§58's
       rule: write the new label, read either). */
    rows.push({ id:mint("KO" + (++kN)), type:"NORTHSTAR", name:r["Objective"],
      group:r["Group"], direction:r["Direction"], value:r["This year target"],
      value_3y:r["3-year target"], unit:r["Unit"], compile:r["Compile"],
      weight:r["Weight %"],
      hidden:yes(r["Hidden"]) ? "1" : "" });
  });

  var swotN = { Strength:0, Weakness:0, Opportunity:0, Threat:0 };
  sheetObjects(sheets["SWOT"]).forEach(function(r){
    var t = r["Type"];
    if (!swotN.hasOwnProperty(t) || !r["Point"]) return;
    swotN[t]++;
    rows.push({ id:mint(t[0].toUpperCase() + swotN[t]), type:t.toUpperCase(), name:r["Point"] });
  });

  var mN = {}, tN = {};
  sheetObjects(sheets["Measures"]).forEach(function(r){
    if (!r["Measure"]) return;
    var pid = pillarId[r["Pillar"]] || "";
    mN[pid] = (mN[pid] || 0) + 1;
    rows.push({ id:pid ? pid + "-M" + mN[pid] : "", type:"MEASURE",
      parent_id:pid, name:r["Measure"], direction:r["Direction"],
      value:r["Target"], unit:r["Unit"], compile:r["Compile"],
      hidden:yes(r["Hidden"]) ? "1" : "" });
  });
  sheetObjects(sheets["Tactics"]).forEach(function(r){
    if (!r["Tactic"]) return;
    var pid = pillarId[r["Pillar"]] || "";
    tN[pid] = (tN[pid] || 0) + 1;
    rows.push({ id:pid ? pid + "-T" + tN[pid] : "", type:"TACTIC",
      parent_id:pid, name:r["Tactic"],
      description:r["Description"], outcome:r["Outcome"],
      /* Blank says nothing, exactly as every other optional column does — a
         file written before this existed carries none of the three and its
         tactics arrive measured the way they always were. */
      outDir:r["Outcome direction"] || "", outTarget:r["Outcome target"] || "",
      outCompile:r["Outcome compiled"] || "",
      owner:r["Owner"],
      collaborators:(r["Collaborators"] || "").split(/[,|]/).map(function(x){ return x.trim(); })
        .filter(Boolean).join("|"),
      q1:yes(r["Q1"]) ? "1" : "0", q2:yes(r["Q2"]) ? "1" : "0",
      q3:yes(r["Q3"]) ? "1" : "0", q4:yes(r["Q4"]) ? "1" : "0",
      hidden:yes(r["Hidden"]) ? "1" : "" });
  });

  return rows.map(function(r){
    ["parent_id","source_slide","name","description","outcome","owner","collaborators",
     "direction","value","value_3y","unit","horizon","compile","q1","q2","q3","q4",
     "theme","kind","notes","group","hidden"].forEach(function(k){ if (r[k] == null) r[k] = ""; });
    return r;
  });
}

function progressFromWorkbook(u, sheets){
  var out = [];
  ["Objectives","Measures","Tactics"].forEach(function(name){
    sheetObjects(sheets[name]).forEach(function(r){
      var v = r["New value"] != null ? r["New value"] : r["New %"];
      if (!v) return;
      out.push({ id:r["ID"], type:name === "Tactics" ? "TACTIC" : name === "Measures" ? "MEASURE" : "NORTHSTAR",
                 parent_name:r["Pillar"] || "", name:r["Measure"] || r["Tactic"] || r["Objective"],
                 new_value:String(v).trim() });
    });
  });
  return out;
}

/* ── Capability workbooks (§16.4) ─────────────────────────────────────────
   The same discipline as a unit's workbook: one sheet per kind of thing, each
   with only its own columns, relationships from a dropdown of names, and the
   ID column grey and last. The sheets are the project model's — Objectives,
   Projects, Deliverables, Outcomes, Milestones — because that is what a
   capability plans. */

var DELIV_KINDS = ["Delivered / not", "% delivered"];
var TIMELINES = ["Quarters", "Dates"];
var MS_STATUSES = ["Not started", "In progress", "Completed"];
/* The same three states, one word apart: a deliverable is DELIVERED where a
   milestone is COMPLETED, and that difference is right (§104). */
var MS_STATUSES_D = ["Not started", "In progress", "Delivered"];

/* ONE NAMING IN THE FILE (§51.19, Islam: "I don't think we should have the
   capability file with 2 namings capability and function. we can just upload
   with the capability and we connect the function on the platform").

   §51.2 added a Supporting function row so two functions with a similarly
   named capability could be told apart. It solved that and created a worse
   problem: the file then carried TWO names that had to AGREE, and a workbook
   whose B2 and B3 disagreed was refused — which is what happened to "Customer
   Centric" under "Customer Experience". A second name is a second thing to get
   wrong, and it was asking the file to carry a link the platform owns.

   WHICH FUNCTION CARRIES A CAPABILITY IS A SETUP DECISION, made on the
   Capabilities page where it can be seen and changed (§51.11). The file names
   the capability and nothing else.

   The ambiguity §51.2 worried about does not go unanswered — it is answered
   where it belongs, on arrival: two capabilities sharing a name are REFUSED BY
   NAME rather than resolved by whichever came first in the array. */
function capReadme(kind, capNames, picked){
  var lines = kind === "plan"
    ? [["Plan workbook", ""],
       ["Capability", ""],
       ["", ""],
       ["How to fill it", "One sheet per part of the plan. Fill Projects FIRST \u2014 Deliverables, Outcomes and Milestones choose their project from what you type there."],
       ["Dropdowns", "Direction, Compile, Kind, Timeline and the Project columns are lists. Unit suggests rather than insists: type your own if it is not offered."],
       ["Owners", "Type the person's name."],
       ["Targets", "The number in Target, the unit beside it \u2014 12 and d, not \"12 d\". A blank target is allowed: the outcome is recorded and left unscored."],
       ["Milestone due dates", "A month and a year \u2014 July 2026. A STATUS is not a due date: Done and Pending belong in the reporting cycle, not here. A quarter or a full date is still read, so a file written earlier still uploads; anything that is not a time at all is saved as entered and said out loud on upload."],
       ["Milestone dates", "A milestone may finish after its project ends. It is saved exactly as entered and said out loud, never refused."],
       ["Blank rows", "Ignored."],
       ["Codes", "There are none to type. The platform assigns every code itself when the file arrives."],
       ["What upload does", "Writes this plan from scratch. Whatever is recorded now is archived first and can be restored \u2014 nothing is deleted."],
       ["", ""],
       ["When you are done", "Save as .xlsx and upload it on Manage \u2192 Import."]]
    : [["Progress workbook", ""],
       ["Capability", ""],
       ["", ""],
       ["How to fill it", "Type only in the New value or New status column. Everything else is there so you can see what you are reporting against."],
       ["Leaving it blank", "A blank new value means nothing changed. Only the rows you fill are read."],
       ["Objectives and outcomes", "Enter the actual, in the same unit as the target. What it means against the target is worked out on arrival."],
       ["Deliverables", "Yes or No where it is delivered-or-not; a number where it is a percentage."],
       ["Milestones", "Not started, In progress or Completed."],
       ["Not yet due", "Rows marked so are outside the current review. Leave them blank."],
       ["", ""],
       ["When you are done", "Save as .xlsx and upload it on Manage \u2192 Import."]];
  var sheet = { name:"Read me", widths:[22, 96],
                rows:lines.map(function(l){ return [l[0], l[1]]; }),
                validations:[{ range:"B2:B2", list:capNames,
                               error:"Choose one from the list." }] };
  sheet.rows[1][1] = picked || "";
  return sheet;
}

/* The function cell is gone with the row (§51.19). Kept as a reader returning
   "" so a workbook saved while the row existed still opens and is simply not
   asked the question — a template people keep on disk for months and which
   stops opening is a template that has broken. */
function readmePickFn(){ return ""; }

function capPlanWorkbook(c){
  var names = GROUP.capabilities.map(function(x){ return x.name; });
  var units = unitSuggestions();
  return [
    capReadme("plan", names, c ? c.name : ""),

    { name:"Objectives", widths:[40, 11, 14, 12, 10, 12, 9],
      head:["Objective", "Direction", "Target", "Unit", "Weight", "Compile", "Hidden"],
      numCols:[2, 4],
      validations:[{ range:"B2:B60", list:DIRS },
                   { range:"D2:D60", list:units, soft:true },
                   { range:"F2:F60", list:COMPILES },
                   { range:"G2:G60", list:YESNO, soft:true }],
      rows:(c.keyObjectives || []).map(function(m){
        var a = splitTarget(m.target);
        return [m.name, m.dir, a.value, a.unit, m.weight == null ? "" : String(m.weight), m.compile,
                SMPRules.isHidden(m) ? "Yes" : ""];
      }) },

    { name:"Projects", widths:[38, 70, 20, 30, 12, 14, 14],
      head:["Project", "Brief", "Owner", "Stakeholders", "Timeline", "Start", "End"],
      validations:[{ range:"E2:E100", list:TIMELINES }],
      rows:(c.projects || []).map(function(p){
        return [p.name, p.brief || "", p.owner || "", (p.stakeholders || []).join(", "),
                p.timeline === "date" ? "Dates" : "Quarters", p.start || "", p.end || ""];
      }) },

    /* THREE COLUMNS. Due and Owner went with the fields (§53.4): a
       deliverable is delivered when the project ends, and the project's owner
       is the project's. A column the platform no longer reads is worse than
       no column — somebody fills it in and nothing happens. */
    { name:"Deliverables", widths:[34, 60, 9],
      /* §104.8: NO DUE DATE COLUMN, and no Kind either. A deliverable's
         direction and target are written by the platform, and Islam took the
         date off the templates "for now" -- the field survives in the model
         and nothing asks for it, so every deliverable is simply always asked,
         which is what the product did before §104 put the date back. */
      /* §233: the old C2:C400 DELIV_KINDS validation was aimed at the Kind
         column that sheet no longer has — Hidden takes the position, so the
         stale list goes with it rather than dressing the new column. */
      head:["Project", "Deliverable", "Hidden"],
      validations:[{ range:"A2:A400", from:PROJECT_RANGE,
                     error:"Choose a project from the Projects sheet." },
                   { range:"C2:C400", list:YESNO, soft:true }],
      rows:(c.projects || []).reduce(function(acc, p){
        (p.deliverables || []).forEach(function(d){
          acc.push([p.name, d.name, SMPRules.isHidden(d) ? "Yes" : ""]); });
        return acc;
      }, []) },

    { name:"Outcomes", widths:[34, 44, 11, 12, 12, 14, 9],
      head:["Project", "Outcome", "Direction", "Target", "Unit", "Due date", "Hidden"],
      numCols:[3],
      validations:[{ range:"A2:A400", from:PROJECT_RANGE,
                     error:"Choose a project from the Projects sheet." },
                   { range:"C2:C400", list:DIRS },
                   { range:"E2:E400", list:units, soft:true },
                   { range:"G2:G400", list:YESNO, soft:true }],
      rows:(c.projects || []).reduce(function(acc, p){
        (p.outcomes || []).forEach(function(o){
          var a = splitTarget(o.target);
          acc.push([p.name, o.name, o.dir, a.value, a.unit, o.measureAt || "",
                    SMPRules.isHidden(o) ? "Yes" : ""]);
        });
        return acc;
      }, []) },

    /* §227: Collaborators beside the Owner, the tactics sheet's own column —
       comma-separated names, and the export carries them or a download-and-
       re-upload would silently drop every one (§22: an upload AUTHORS). */
    { name:"Milestones", widths:[34, 38, 52, 16, 26, 14, 9],
      head:["Project", "Milestone", "Description", "Owner", "Collaborators", "Due date", "Hidden"],
      validations:[{ range:"A2:A400", from:PROJECT_RANGE,
                     error:"Choose a project from the Projects sheet." },
                   { range:"G2:G400", list:YESNO, soft:true }],
      rows:(c.projects || []).reduce(function(acc, p){
        (p.milestones || []).forEach(function(m){
          acc.push([p.name, m.name, m.covers || "", m.owner || "",
                    (m.collaborators || []).join(", "), m.finish || "",
                    SMPRules.isHidden(m) ? "Yes" : ""]);
        });
        return acc;
      }, []) }
  ];
}

function capProgressWorkbook(c){
  return [
    capReadme("progress", [c.name], c.name),

    { name:"Objectives", widths:[40, 11, 16, 18, 18, 16], lockedCols:[5],
      head:["Objective", "Direction", "Target", "Currently recorded", "New value", "ID"],
      rows:(c.keyObjectives || []).map(function(m){
        return [m.name, m.dir, m.target || "no target",
                m.actual == null ? "" : String(m.actual), "", m.id];
      }) },

    /* §104: a status and a per-cent, the pair the Milestones sheet has always
       had. "New %" is read only for In progress -- the word decides the
       figure at both ends, and a per-cent behind "Delivered" is a number
       nobody can see. */
    { name:"Deliverables", widths:[30, 48, 18, 18, 12, 16], lockedCols:[5],
      head:["Project", "Deliverable", "Current status", "New status", "New %", "ID"],
      validations:[{ range:"D2:D400", list:MS_STATUSES_D }],
      rows:(c.projects || []).reduce(function(acc, p){
        (p.deliverables || []).forEach(function(d){
          acc.push([p.name, d.name, delivStatusWord(d.status), "", "", d.id]);
        });
        return acc;
      }, []) },

    { name:"Outcomes", widths:[30, 40, 14, 14, 18, 18, 16], lockedCols:[6],
      head:["Project", "Outcome", "Target", "Measure date", "Currently recorded", "New value", "ID"],
      rows:(c.projects || []).reduce(function(acc, p){
        (p.outcomes || []).forEach(function(o){
          acc.push([p.name, o.name, o.target || "no target", o.measureAt || "",
                    o.actual == null ? "" : String(o.actual), "", o.id]);
        });
        return acc;
      }, []) },

    { name:"Milestones", widths:[30, 40, 14, 16, 18, 12, 16], lockedCols:[6],
      head:["Project", "Milestone", "Due date", "Current status", "New status", "New %", "ID"],
      validations:[{ range:"E2:E400", list:MS_STATUSES }],
      rows:(c.projects || []).reduce(function(acc, p){
        (p.milestones || []).forEach(function(m){
          acc.push([p.name, m.name, m.finish || "", msStatusWord(m.status), "",
                    m.pct == null ? "" : String(m.pct), m.id]);
        });
        return acc;
      }, []) }
  ];
}

/* Workbook back to the flat rows the capability importer understands. A child
   names its project; anything already known falls back to the parent the
   platform records — the same rename protection a unit's workbook has. */
/* Same rule as a unit's plan: everything is created, every code is minted,
   children find their project by the name typed on the Projects sheet. */
function capPlanFromWorkbook(c, sheets){
  var rows = [], projId = {}, n = 0;
  var childN = {};

  sheetObjects(sheets["Projects"]).forEach(function(r){
    if (!r["Project"]) return;
    var id = c.id + "-P" + (++n);
    projId[r["Project"]] = id;
    rows.push({ id:id, type:"PROJECT", name:r["Project"], description:r["Brief"],
      owner:r["Owner"], stakeholders:(r["Stakeholders"] || "").split(/[,|]/)
        .map(function(x){ return x.trim(); }).filter(Boolean).join("|"),
      timeline:timelineKey(r["Timeline"]) || "", start:r["Start"], end:r["End"] });
  });

  var kN = 0;
  sheetObjects(sheets["Objectives"]).forEach(function(r){
    if (!r["Objective"]) return;
    rows.push({ id:c.id + "-KO" + (++kN), type:"CAPOBJECTIVE",
      name:r["Objective"], direction:r["Direction"], value:r["Target"], unit:r["Unit"],
      weight:r["Weight"], compile:r["Compile"] });
  });

  function child(sheet, type, nameCol, letter, extra){
    sheetObjects(sheets[sheet]).forEach(function(r){
      if (!r[nameCol]) return;
      var pid = projId[r["Project"]] || "";
      var key = pid + letter;
      childN[key] = (childN[key] || 0) + 1;
      var row = { id:pid ? pid + "-" + letter + childN[key] : "", type:type,
                  parent_id:pid, name:r[nameCol] };
      extra(row, r);
      rows.push(row);
    });
  }
  child("Deliverables", "DELIVERABLE", "Deliverable", "D", function(row, r){
    /* Due date since §104; a workbook written before it has a Kind column
       instead, which is read and ignored (§58: write the new label, read
       whatever arrives). */
    row.finish = r["Due date"] != null ? r["Due date"] : "";
    row.hidden = yes(r["Hidden"]) ? "1" : "";
  });
  child("Outcomes", "OUTCOME", "Outcome", "O", function(row, r){
    row.direction = r["Direction"]; row.value = r["Target"];
    row.unit = r["Unit"];
    /* Measure date since §99, read as either — the same contract the milestone
       column keeps below, and for the same reason. */
    row.measure_at = r["Due date"] != null ? r["Due date"]
                   : r["Measure date"] != null ? r["Measure date"] : r["Measured at"];
    row.hidden = yes(r["Hidden"]) ? "1" : "";
  });
  child("Milestones", "MILESTONE", "Milestone", "M", function(row, r){
    /* Description since §103, read as either (§58). The STORED field keeps its
       spelling -- `covers` is an identifier, "Description" is a label. */
    row.covers = r["Description"] != null ? r["Description"] : r["What it covers"];
    row.owner = r["Owner"];
    /* §227: normalised to the pipe-joined shape the differ compares and
       applyCapPlan splits — the same road the Projects sheet's Stakeholders
       already travel. A file written before the column reads "" (§58). */
    row.collaborators = (r["Collaborators"] || "").split(/[,|]/)
      .map(function(x){ return x.trim(); }).filter(Boolean).join("|");
    /* WRITE THE NEW LABEL, READ EITHER (§58, §65). The column is called Due
       date from §99; somebody is holding a workbook downloaded before that,
       and a header is a contract. The STORED field keeps its own spelling —
       renaming `finish` would be a migration for a word nobody reads. */
    row.finish = r["Due date"] != null ? r["Due date"] : r["Finish"];
    row.hidden = yes(r["Hidden"]) ? "1" : "";
  });

  return rows.map(function(r){
    CAPP_COLS.forEach(function(k){ if (r[k] == null) r[k] = ""; });
    return r;
  });
}

function capProgressFromWorkbook(c, sheets){
  var out = [];
  [["Objectives","CAPOBJECTIVE","Objective"],
   ["Deliverables","DELIVERABLE","Deliverable"],
   ["Outcomes","OUTCOME","Outcome"],
   ["Milestones","MILESTONE","Milestone"]].forEach(function(def){
    sheetObjects(sheets[def[0]]).forEach(function(r){
      var v = r["New value"] != null ? r["New value"] : r["New status"];
      if (!v) return;
      out.push({ id:r["ID"], type:def[1], parent_name:r["Project"] || "",
                 name:r[def[2]], new_value:String(v).trim() });
    });
  });
  return out;
}

/* ══════════════════════════════════════════════════════════════════
   THE PEOPLE WORKBOOK (§54.3, spec 011)

   Two sheets: how to fill it, and the register. The same file both ways —
   what downloads is who is on the register right now, so it is the export as
   well as the template, and a filled copy uploaded back amends rather than
   duplicating (planPeopleFile/applyPeopleFile in config-data.js).

   THREE DROPDOWNS, AND ONE OF THEM IS DELIBERATELY A SUGGESTION. Role and
   Status are closed lists — there are seven roles and two statuses, and a
   typo in either is a person in the wrong place or a person who cannot sign
   in. Official BU is SOFT, because the list starts empty on a new tenant and a
   locked column would mean no employee file could ever be read until somebody
   had typed ten department names by hand. That is exactly the trap the plan
   template fell into (§22): a fixed list offered nothing, so Excel refused
   every pillar name typed into the column, so a first plan could not be
   authored from the template at all. A name the list has not met is added on
   arrival, pointing at nothing.
   ══════════════════════════════════════════════════════════════════ */
var PEOPLE_STATUSES = ["Active", "Retired"];

function peopleReadme(){
  var lines = [
    ["People workbook", ""],
    ["", ""],
    ["What it is", "The register as it stands, and the form for changing it. Download it, edit it, upload it back on Setup → People register."],
    ["Matching", "Emp ID is who the row is. Where a row has none, the Email decides. A number or an address already on the register updates that person; a row matching neither adds them; a row with no Emp ID and no Email is skipped, because there is nothing to match it on. The Name is never used to match — two people can share one."],
    ["If the two disagree", "A row whose Emp ID points at one person and whose Email points at another is set aside on the review screen and named, with both readings, for you to answer. Nothing in the file is applied until every one of them has been."],
    ["Adding somebody", "Fill Name, and Emp ID or Email. Everything else is optional — but a row with neither identifier cannot be matched by the next upload, so it gets added a second time."],
    ["Blank cells", "Mean “nothing to say about this”, never “clear it”. A field you leave empty keeps whatever is recorded."],
    ["Cells that differ", "Are offered, not applied. The review lists what is recorded beside what this file says, and takes the file’s only where you tick it — what is on the register is what people have been correcting by hand. “Take everything from the file” is one press above the list."],
    ["Official BU", "Your own official name for their part of the business. Which unit or supporting function it opens here is set once on Setup → Official BU list, and one name may hold several. A name this file uses for the first time is added there, pointing at nothing, for you to map."],
    ["Unit", "Where they actually sit here — the business unit, supporting function or company that decides what they can open. Choose it from the dropdown. Fill it and it is used; leave it blank and their Official BU decides, where that name points at exactly one place; leave both and they are left where they are. This is the column to fill if you already know: nobody then has to be asked at sign-in."],
    ["Role", "A role is always held over the person's own BU, so there is nothing to type but the role itself. Leave it blank and their roles are left alone — this column gives, it never takes away. Employee and Contributor are not offered: they are what somebody attached to a part of the business and holding nothing else already is — Contributor where a plan names them, Employee where it does not."],
    ["Status", "Active or Retired. Retiring takes away every role they hold and closes the door; everything already attributed to them stays true. Nobody is ever deleted by an upload, and a person the file does not mention is not touched."],
    ["Also holds", "Written by the platform, ignored on the way back. It is there so a person with three roles does not look like a person with one."],
    ["", ""],
    ["When you are done", "Save as .xlsx and upload it on Setup → People register."]
  ];
  return { name:"Read me", widths:[22, 96],
           rows:lines.map(function(l){ return [l[0], l[1]]; }) };
}

function peopleWorkbook(){
  var names = mainbuNames();
  /* Neither floor role is offered, for the same reason the reader refuses
     them: both are derived, not granted. */
  /* §186: AND NO SEAT IN A FILE SOMEBODY CANNOT GIVE ONE WITH. The Role
     column is the second road to `p.role = "super"` — the reader grants what
     it names — so the template offered by somebody who may not hand out a
     seat does not list one. `roleIsGrantable()` is the same question the
     picker asks, so the file and the screen cannot disagree (§53.5). */
  var roleNames = ROLES.filter(function(r){ return roleIsGrantable(r.key); })
                       .map(function(r){ return r.name; });
  /* COLUMNS MOVED WHEN Unit WAS INSERTED (§65): Role G→H, Status H→I. A
     validation range is a POSITION and nothing warns when it stops matching
     its column — a Role dropdown left on G would have been offering role names
     in the Unit cell, which is the kind of wrong that looks like a feature.
     The ranges are derived from PEOPLE_FILE_COLS now, so a column added later
     cannot leave one behind. */
  var colLetter = function(head){
    var i = PEOPLE_FILE_COLS.indexOf(head);
    return i < 0 ? null : String.fromCharCode(65 + i);
  };
  var range = function(head){
    var c = colLetter(head);
    return c ? c + "2:" + c + "2000" : null;
  };
  var vals = [
    { range:range("Role"), list:roleNames,
      error:"Choose a role from the list, or leave the cell blank." },
    { range:range("Status"), list:PEOPLE_STATUSES,
      error:"Active or Retired." }
  ];
  /* THE UNIT LIST IS NOT SOFT. An Official BU that the platform has never met
     is added to the list unmapped (§54), because that is how the client's own
     names arrive. A unit is the opposite: it either exists here or it does
     not, and typing a new one cannot conjure one — so the dropdown is the
     whole answer and a name outside it is refused by the reader with the two
     it could have meant.

     BOTH LISTS COME FROM A SHEET, not from the formula (§67.5). The Unit list
     is 301 characters and Excel ignores an inline list over 255 — silently, so
     the column looked right and the dropdown was empty. The Official BU list
     is 93 today and would have gone the same way the moment a client had
     twenty departments, which is the fault arriving later and quieter, so it
     moves too: converting one member of a family and leaving the other is how
     the second one gets forgotten (§40). */
  var places = placeOptions().map(function(o){ return o.label; });
  if (places.length) {
    vals.push({ range:range("Unit"), from:LISTS_UNIT_RANGE(places.length),
      error:"Choose the unit, supporting function or company from the list." });
  }
  /* An empty list would write formula1 as a pair of quotes with nothing in
     them, which Excel reads as a broken validation rather than as no
     validation. On a tenant whose BU list is still empty the column simply
     has no dropdown — and that is the case the soft list exists for. */
  if (names.length) {
    vals.unshift({ range:range("Official BU"), from:LISTS_BU_RANGE(names.length),
                   soft:true });
  }

  /* Built ONCE for the whole file, not per row (§93.8) — and the file has to
     carry the same value the register shows, or a download-edit-upload round
     trip would report the two people it separated as a change. */
  var dnames = displayNames();
  var rows = PEOPLE.map(function(p){
    var held = personRoles(p).filter(function(r){ return !SMPRules.isOwnLinesRole(r.role); });
    return [
      /* FULL NAME THEN NAME, in PEOPLE_FILE_COLS' order (§93.8). The short one
         is written as what the register SHOWS — the guess when nobody has
         corrected it — so the file is a picture of the page, and the reader
         stores nothing when it comes back unchanged. */
      p.empId || "", p.name, knownName(p, dnames), p.title || "", p.email || "",
      p.phone || "", p.mainbu || "",
      /* Where they actually sit, in the words the register shows and the
         reader takes back (§65). Blank for somebody attached to nothing —
         which is a real state, and writing a guess into it would be the file
         answering a question only the SMO can. */
      roleWhereLabel2(personAt(p)),
      held.length ? roleName(held[0].role) : "",
      personActive(p) ? "Active" : "Retired",
      /* Everything after the first, WITH where it is held — the one column
         cannot carry a second role and must not pretend there is not one. */
      held.slice(1).map(function(r){
        return roleName(r.role) + " · " + roleWhereLabel(r.at);
      }).join("; ")
    ];
  });

  /* A sheet the reader never looks at — peopleFromWorkbook() asks for "People"
     by name — carrying the two lists the dropdowns point at. Visible rather
     than hidden: a hidden sheet is a thing somebody finds by accident and
     deletes, and a validation whose range has gone is a dropdown that is empty
     again, which is the bug this exists to fix. */
  var listRows = [];
  for (var i = 0; i < Math.max(places.length, names.length); i++) {
    listRows.push([places[i] || "", names[i] || ""]);
  }

  return [
    peopleReadme(),
    { name:"Lists", widths:[38, 30],
      head:["Unit, function or company", "Official BU"],
      rows:listRows },
    { name:"People", widths:[12, 30, 30, 32, 16, 20, 22, 26, 11, 34],
      head:PEOPLE_FILE_COLS.concat([PEOPLE_FILE_EXTRA]),
      /* "Also holds" is written and never read, so it is locked — and its
         index moved with the new column (§65). */
      lockedCols:[9],
      validations:vals,
      rows:rows }
  ];
}

/* The sheet is named People and read by its header row, so a column moved or
   a column added later costs nothing — sheetObjects() keys on the heading, not
   on the position. */
function peopleFromWorkbook(sheets){
  return sheetObjects(sheets["People"] || []);
}

/* ── THE QUESTIONS FILE (§161) ─────────────────────────────────────────────
   Islam: "let me able to export and import the questions and answers." He had
   just done it by hand — the whole corpus into a spreadsheet, softened, and
   back — so this is that round trip made part of the product.

   THE EXPORT IS THE TEMPLATE, the people file's rule (§54): what downloads is
   what uploads, so there is no second artefact to keep in step.

   MATCHED ON Id, and that is the whole reason the column exists. The question
   TEXT is the office's to edit, so it cannot be the key — §87's rule about
   names and identifiers, arriving in a third place. A blank id is a new
   question; an id nobody knows applies NOTHING and says so, because that is
   the row that would otherwise become a silent duplicate.

   PARAGRAPHS ARE BLANK LINES HERE, never the `|` the source file uses: a pipe
   is not a thing anybody types into a cell. Both are read (SMPRules.kbParas),
   and kbSetOver compares canonically, so an untouched round trip stores
   nothing at all (§54.5). */
/* NO REFERENCE COLUMN. The first build carried a read-only "Standard answer"
   beside the editable one, because that is the shape Islam worked in by hand
   (§160's Before/After). Looking at it, he asked for it out: "remove the
   standard answer from the sheet not to be confused." Two columns of prose
   that differ only where somebody has edited one is a sheet you have to read
   twice to know which is which — and the shipped wording is one press away on
   the page, on the button that also puts it back (§140's "Back to the
   standard wording"). A comparison you can act on beats a column you cannot.

   REMOVING IT COSTS NOTHING TO OLD FILES: sheetObjects() keys on the heading
   row, so a file downloaded before today still reads, and its extra column is
   simply a key nobody asks for (§58's rule — write the new shape, read
   either). */
var KB_FILE_COLS = ["Id", "Section", "Question", "Answer", "Audience"];

function kbAudLabels(){
  return SMPRules.KB_AUDIENCES.map(function(k){
    return SMPRules.KB_AUDIENCE_LABEL[k];
  });
}
function kbAudFromLabel(v){
  var t = String(v || "").trim().toLowerCase();
  var hit = SMPRules.KB_AUDIENCES.filter(function(k){
    return SMPRules.KB_AUDIENCE_LABEL[k].toLowerCase() === t || k === t;
  })[0];
  return hit || null;
}
/* Paragraphs as a cell holds them. */
function kbCellText(a){ return SMPRules.kbParas(a).join("\n\n"); }

function kbReadme(){
  return { name:"Read me", widths:[104], head:["The questions file"], rows:[
    ["This is every question the knowledge base answers, and the words it answers with."],
    [""],
    ["It is the same file both ways: what you download is what you upload. Edit the"],
    ["Question, the Answer and the Audience; leave everything else alone."],
    [""],
    ["Id — how a row is recognised. Do not change it. The question text is yours to"],
    ["   edit, so it cannot be what a row is matched on."],
    ["   Leave the Id EMPTY to add a question of your own — give it a Section."],
    [""],
    ["Answer — a blank line inside the cell starts a new paragraph (Alt+Enter)."],
    [""],
    ["Audience — who the assistant answers with this. One of:"],
    ["   " + kbAudLabels().join("   |   ")],
    [""],
    ["Putting an Answer back to the standard wording clears your change for that"],
    ["question, so this file is also how you undo one. The standard wording is on"],
    ["the Knowledge base page itself: an answer you have changed says so, on the"],
    ["button that puts it back."],
    [""],
    ["Uploading ADDS and AMENDS and never removes: a row you delete from this file"],
    ["leaves the platform exactly as it was. Remove a question you added on the page."],
    [""],
    ["You see everything that will change, and press Apply, before anything is saved."]
  ]};
}

function kbWorkbook(){
  var rows = [];
  RECIPES.forEach(function(g){
    g.items.forEach(function(r){
      var o = SMPRules.kbLook(GROUP.kb, r.id);
      var aud = SMPRules.kbAudience(GROUP.kb, r.id, r.who || g.who);
      rows.push([r.id, g.g, (o && o.q) || r.q, kbCellText((o && o.a) || r.a),
                 SMPRules.KB_AUDIENCE_LABEL[aud]]);
    });
  });
  /* The office's own questions, at the foot. */
  SMPRules.kbAllAdds(GROUP.kb).forEach(function(x){
    rows.push([x.id, x.g || "", x.q, kbCellText(x.a),
               SMPRules.KB_AUDIENCE_LABEL[SMPRules.kbAudienceWord(x.w)]]);
  });
  return [
    kbReadme(),
    { name:"Questions", widths:[22, 30, 46, 96, 22],
      head:KB_FILE_COLS,
      validations:[
        { range:"E2:E2000", list:kbAudLabels(),
          error:"Choose who the assistant answers with this question." }
      ],
      rows:rows }
  ];
}

/* ── READING IT BACK ───────────────────────────────────────────────────────
   Classifies and applies NOTHING. The caller shows the list and applies it on
   a press, the way the people file and the plan import already do — a bad
   paste must not be able to rewrite sixty-four answers in silence.

   Every comparison is canonical, so a file downloaded and uploaded untouched
   classifies as no change at all. That is the assertion the check makes first,
   because a round trip that reports work is a round trip nobody trusts. */
function kbFromWorkbook(sheets){
  var rows = sheetObjects(sheets["Questions"] || []);
  var out = { reword:[], audience:[], reset:[], add:[], unknown:[], blank:0 };
  rows.forEach(function(r){
    var id = String(r["Id"] || "").trim();
    var q  = String(r["Question"] || "").trim();
    var a  = String(r["Answer"] || "").trim();
    var audRaw = r["Audience"];
    var aud = kbAudFromLabel(audRaw);
    if (!q && !a) { out.blank++; return; }
    /* NEW: no id at all. Given one on apply, never here — minting inside a
       classifier would leave ids behind on a discarded review. */
    if (!id) {
      out.add.push({ g: String(r["Section"] || "").trim(), q:q, a:a, w:aud || "everyone" });
      return;
    }
    var added = SMPRules.kbAllAdds(GROUP.kb).filter(function(x){ return x.id === id; })[0];
    if (added) {
      var wasA = SMPRules.kbAudienceWord(added.w);
      if (!SMPRules.kbSame(added.q, q) || !SMPRules.kbSame(added.a, a))
        out.reword.push({ id:id, q:q, a:a, w:aud || wasA, mine:true });
      else if (aud && aud !== wasA)
        out.audience.push({ id:id, q:q, a:a, w:aud, mine:true, from:wasA });
      return;
    }
    var std = kbShipped(id);
    if (!std) { out.unknown.push({ id:id, q:q }); return; }
    var now = SMPRules.kbLook(GROUP.kb, id);
    var nowQ = (now && now.q) || std.q, nowA = (now && now.a) || std.a;
    var nowW = SMPRules.kbAudience(GROUP.kb, id, std.who);
    var sameText = SMPRules.kbSame(q, nowQ) && SMPRules.kbSame(a, nowA);
    var backToStd = SMPRules.kbSame(q, std.q) && SMPRules.kbSame(a, std.a);
    if (!sameText) {
      /* Back to the shipped words IS the way to undo, so it is reported as a
         reset rather than as another rewording — the two land somewhere
         different and somebody reading the list needs to know which. */
      (backToStd && now ? out.reset : out.reword).push({ id:id, q:q, a:a,
        w: aud || nowW, from:nowW });
    } else if (aud && aud !== nowW) {
      out.audience.push({ id:id, q:q, a:a, w:aud, from:nowW });
    }
  });
  return out;
}
function kbChangeCount(c){
  return c.reword.length + c.audience.length + c.reset.length + c.add.length;
}
/* Applying is the only place that writes, and it goes through the SAME
   writers the pen uses — so a rule about what may be stored (an override that
   equals the shipped wording dies, §50.6) cannot be true on one path and not
   the other (§53.5). */
function kbApply(c){
  c.reset.forEach(function(x){ kbResetOver(x.id); });
  c.reword.forEach(function(x){
    if (x.mine) kbSetAdded(x.id, x.q, x.a, x.w); else kbSetOver(x.id, x.q, x.a, x.w);
  });
  c.audience.forEach(function(x){
    if (x.mine) kbSetAdded(x.id, x.q, x.a, x.w); else kbSetOver(x.id, x.q, x.a, x.w);
  });
  c.add.forEach(function(x){
    var id = kbAddNew(x.g || (RECIPES[0] && RECIPES[0].g) || "");
    kbSetAdded(id, x.q, x.a, x.w);
  });
}
