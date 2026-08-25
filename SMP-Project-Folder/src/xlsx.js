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
  ["%", "EGP", "M EGP", "B EGP", "days", "#"].forEach(add);
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

  return [
    readmeSheet,

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
      ] },

    { name:"Objectives", widths:[36, 18, 11, 16, 16, 10, 12],
      head:["Objective", "Group", "Direction", "3-year target", "This year target", "Unit", "Compile"],
      numCols:[3, 4],
      validations:[{ range:"C2:C60", list:DIRS },
                   { range:"F2:F60", list:units, soft:true },
                   { range:"G2:G60", list:COMPILES }],
      rows:u.keyObjectives.map(function(m){
        var a = splitTarget(m.target), b = splitTarget(m.target3y);
        return [m.name, m.group || "", m.dir, b.value, a.value, a.unit, m.compile];
      }) },

    { name:"SWOT", widths:[16, 78],
      head:["Type", "Point"],
      validations:[{ range:"A2:A200", list:["Strength","Weakness","Opportunity","Threat"] }],
      rows:[["s","Strength"],["w","Weakness"],["o","Opportunity"],["t","Threat"]]
        .reduce(function(acc, pair){
          (u.swot[pair[0]] || []).forEach(function(x){ acc.push([pair[1], x]); });
          return acc;
        }, []) },

    { name:"Pillars", widths:[40, 14, 22, 22],
      head:["Pillar", "Kind", "Theme", "Owner"],
      validations:[{ range:"B2:B60", list:KINDS },
                   { range:"C2:C60", list:themes,
                     error:"Choose a theme name, or \u2014 none \u2014 for a cross-cutting pillar." }],
      rows:u.items.map(function(p){ return [p.name, p.kind, themeNameOf(p.theme), p.owner]; }) },

    { name:"Measures", widths:[34, 40, 11, 14, 12, 12],
      head:["Pillar", "Measure", "Direction", "Target", "Unit", "Compile"],
      numCols:[3],
      validations:[{ range:"A2:A400", from:PILLAR_RANGE,
                     error:"Choose a pillar from the Pillars sheet." },
                   { range:"C2:C400", list:DIRS },
                   { range:"E2:E400", list:units, soft:true },
                   { range:"F2:F400", list:COMPILES }],
      rows:u.items.reduce(function(acc, p){
        p.measures.forEach(function(m){
          var a = splitTarget(m.target);
          acc.push([p.name, m.name, m.dir, a.value, a.unit, m.compile]);
        });
        return acc;
      }, []) },

    { name:"Tactics", widths:[30, 40, 40, 34, 20, 24, 7, 7, 7, 7],
      head:["Pillar", "Tactic", "Description", "Outcome", "Owner", "Collaborators",
            "Q1", "Q2", "Q3", "Q4"],
      validations:[{ range:"A2:A400", from:PILLAR_RANGE,
                     error:"Choose a pillar from the Pillars sheet." },
                   { range:"G2:J400", list:YESNO }],
      rows:u.items.reduce(function(acc, p){
        p.tactics.forEach(function(t){
          acc.push([p.name, t.name, t.description || "", t.outcome || "", t.owner,
            (t.collaborators || []).join(", "),
            t.q1 ? "Yes" : "No", t.q2 ? "Yes" : "No", t.q3 ? "Yes" : "No", t.q4 ? "Yes" : "No"]);
        });
        return acc;
      }, []) }
  ];
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
    rows.push({ id:mint("KO" + (++kN)), type:"NORTHSTAR", name:r["Objective"],
      group:r["Group"], direction:r["Direction"], value:r["This year target"],
      value_3y:r["3-year target"], unit:r["Unit"], compile:r["Compile"] });
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
      value:r["Target"], unit:r["Unit"], compile:r["Compile"] });
  });
  sheetObjects(sheets["Tactics"]).forEach(function(r){
    if (!r["Tactic"]) return;
    var pid = pillarId[r["Pillar"]] || "";
    tN[pid] = (tN[pid] || 0) + 1;
    rows.push({ id:pid ? pid + "-T" + tN[pid] : "", type:"TACTIC",
      parent_id:pid, name:r["Tactic"],
      description:r["Description"], outcome:r["Outcome"], owner:r["Owner"],
      collaborators:(r["Collaborators"] || "").split(/[,|]/).map(function(x){ return x.trim(); })
        .filter(Boolean).join("|"),
      q1:yes(r["Q1"]) ? "1" : "0", q2:yes(r["Q2"]) ? "1" : "0",
      q3:yes(r["Q3"]) ? "1" : "0", q4:yes(r["Q4"]) ? "1" : "0" });
  });

  return rows.map(function(r){
    ["parent_id","source_slide","name","description","outcome","owner","collaborators",
     "direction","value","value_3y","unit","horizon","compile","q1","q2","q3","q4",
     "theme","kind","notes","group"].forEach(function(k){ if (r[k] == null) r[k] = ""; });
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

    { name:"Objectives", widths:[40, 11, 14, 12, 10, 12],
      head:["Objective", "Direction", "Target", "Unit", "Weight", "Compile"],
      numCols:[2, 4],
      validations:[{ range:"B2:B60", list:DIRS },
                   { range:"D2:D60", list:units, soft:true },
                   { range:"F2:F60", list:COMPILES }],
      rows:(c.keyObjectives || []).map(function(m){
        var a = splitTarget(m.target);
        return [m.name, m.dir, a.value, a.unit, m.weight == null ? "" : String(m.weight), m.compile];
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
    { name:"Deliverables", widths:[34, 52, 18],
      head:["Project", "Deliverable", "Kind"],
      validations:[{ range:"A2:A400", from:PROJECT_RANGE,
                     error:"Choose a project from the Projects sheet." },
                   { range:"C2:C400", list:DELIV_KINDS }],
      rows:(c.projects || []).reduce(function(acc, p){
        (p.deliverables || []).forEach(function(d){
          acc.push([p.name, d.name, d.kind === "pct" ? "% delivered" : "Delivered / not"]);
        });
        return acc;
      }, []) },

    { name:"Outcomes", widths:[34, 44, 11, 12, 12, 14],
      head:["Project", "Outcome", "Direction", "Target", "Unit", "Measure date"],
      numCols:[3],
      validations:[{ range:"A2:A400", from:PROJECT_RANGE,
                     error:"Choose a project from the Projects sheet." },
                   { range:"C2:C400", list:DIRS },
                   { range:"E2:E400", list:units, soft:true }],
      rows:(c.projects || []).reduce(function(acc, p){
        (p.outcomes || []).forEach(function(o){
          var a = splitTarget(o.target);
          acc.push([p.name, o.name, o.dir, a.value, a.unit, o.measureAt || ""]);
        });
        return acc;
      }, []) },

    { name:"Milestones", widths:[34, 38, 52, 16, 14],
      head:["Project", "Milestone", "What it covers", "Owner", "Due date"],
      validations:[{ range:"A2:A400", from:PROJECT_RANGE,
                     error:"Choose a project from the Projects sheet." }],
      rows:(c.projects || []).reduce(function(acc, p){
        (p.milestones || []).forEach(function(m){
          acc.push([p.name, m.name, m.covers || "", m.owner || "", m.finish || ""]);
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

    { name:"Deliverables", widths:[30, 44, 18, 18, 18, 16], lockedCols:[5],
      head:["Project", "Deliverable", "Kind", "Currently recorded", "New value", "ID"],
      rows:(c.projects || []).reduce(function(acc, p){
        (p.deliverables || []).forEach(function(d){
          acc.push([p.name, d.name, d.kind === "pct" ? "% delivered" : "Delivered / not",
                    d.actual == null ? "" : String(d.actual), "", d.id]);
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

    { name:"Milestones", widths:[30, 40, 14, 16, 18, 16], lockedCols:[5],
      head:["Project", "Milestone", "Due date", "Current status", "New status", "ID"],
      validations:[{ range:"E2:E400", list:MS_STATUSES }],
      rows:(c.projects || []).reduce(function(acc, p){
        (p.milestones || []).forEach(function(m){
          acc.push([p.name, m.name, m.finish || "", msStatusWord(m.status), "", m.id]);
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
    row.kind = delivKindKey(r["Kind"]) || r["Kind"];
  });
  child("Outcomes", "OUTCOME", "Outcome", "O", function(row, r){
    row.direction = r["Direction"]; row.value = r["Target"];
    row.unit = r["Unit"];
    /* Measure date since §96, read as either — the same contract the milestone
       column keeps below, and for the same reason. */
    row.measure_at = r["Measure date"] != null ? r["Measure date"] : r["Measured at"];
  });
  child("Milestones", "MILESTONE", "Milestone", "M", function(row, r){
    row.covers = r["What it covers"]; row.owner = r["Owner"];
    /* WRITE THE NEW LABEL, READ EITHER (§58, §65). The column is called Due
       date from §96; somebody is holding a workbook downloaded before that,
       and a header is a contract. The STORED field keeps its own spelling —
       renaming `finish` would be a migration for a word nobody reads. */
    row.finish = r["Due date"] != null ? r["Due date"] : r["Finish"];
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
  var roleNames = ROLES.filter(function(r){ return !SMPRules.isOwnLinesRole(r.key); })
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
