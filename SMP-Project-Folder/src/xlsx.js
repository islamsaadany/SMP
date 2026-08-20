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

/* A sheet: header row, data rows, column widths, a frozen header and any
   dropdowns. Values are written as inline strings \u2014 no shared-string table to
   keep in step with the cells that point into it. */
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
      return '<c r="' + colName(ci) + n + '"' + style + ' t="inlineStr"><is><t>' + xesc(v) + '</t></is></c>';
    }).join("") + '</row>');
  });

  var dv = (sh.validations || []).map(function(v){
    return '<dataValidation type="list" allowBlank="1" showInputMessage="1" showErrorMessage="1" ' +
      'errorTitle="Not a valid entry" error="' + xesc(v.error || "Choose one of the listed values.") + '" ' +
      'sqref="' + v.range + '"><formula1>"' + xesc(v.list.join(",")) + '"</formula1></dataValidation>';
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

function readme(kind, unitName){
  var lines = kind === "plan"
    ? [["Plan workbook", ""],
       ["Unit", unitName],
       ["", ""],
       ["How to fill it", "One sheet per part of the plan. Fill the sheets left to right \u2014 Pillars before Measures and Tactics, because those two choose their pillar from a list of what you typed."],
       ["Dropdowns", "Direction, Compile, Kind, Theme and the quarter columns are lists. Type nothing else in them."],
       ["The ID column", "Grey, always last. Leave it alone. Blank means a new item; filled means the platform already has it and will update rather than duplicate."],
       ["Blank rows", "Ignored. Delete a row only if you mean to stop tracking it \u2014 removing a row here does not delete anything already recorded."],
       ["Targets", "Put the number in Target and the unit in Unit \u2014 30 and %, not \"30%\". A blank target is allowed: the measure is recorded and left unscored."],
       ["", ""],
       ["When you are done", "Save as .xlsx and upload it on Manage \u2192 Import."]]
    : [["Progress workbook", ""],
       ["Unit", unitName],
       ["", ""],
       ["How to fill it", "Type only in the New value column. Everything else is there so you can see what you are reporting against."],
       ["Leaving it blank", "A blank New value means nothing changed. Only the rows you fill are read."],
       ["Measures", "Enter the actual, in the same unit as the target. What it means against the target is worked out on arrival."],
       ["Tactics", "Enter percent complete, as a number. Due % is what the plan says should be delivered by now."],
       ["Not yet due", "Rows marked so are outside the current review. Leave them blank."],
       ["", ""],
       ["When you are done", "Save as .xlsx and upload it on Manage \u2192 Import."]];
  return { name:"Read me", widths:[22, 96],
           rows:lines.map(function(l){ return [l[0], l[1]]; }) };
}

function planWorkbook(u){
  var themes = GROUP.themes.map(function(t){ return t.ab; });
  var pillarNames = u.items.map(function(p){ return p.name; });
  var owners = PEOPLE.filter(function(p){ return p.unit === u.ukey || p.unit === "group"; })
                     .map(function(p){ return p.name; });

  return [
    readme("plan", u.name),

    { name:"Foundation", widths:[20, 78, 16], lockedCols:[2],
      head:["Label", "Text", "ID"],
      rows:u.clauses.map(function(c){ return [c[0], c[1], c[2]]; }) },

    { name:"Aspiration", widths:[24, 86, 16], lockedCols:[2],
      head:["Field", "Text", "ID"],
      rows:[
        ["Winning aspiration", u.aspiration, u.ukey + "-ASP1"],
        ["End in mind (optional)", u.endInMind || "", u.ukey + "-ASP2"],
        ["Horizon", GROUP.horizon, ""]
      ] },

    { name:"Objectives", widths:[36, 18, 11, 16, 16, 10, 12, 16], lockedCols:[7],
      head:["Objective", "Group", "Direction", "3-year target", "This year target", "Unit", "Compile", "ID"],
      validations:[{ range:"C2:C60", list:DIRS }, { range:"G2:G60", list:COMPILES }],
      rows:u.keyObjectives.map(function(m){
        var a = splitTarget(m.target), b = splitTarget(m.target3y);
        return [m.name, m.group || "", m.dir, b.value, a.value, a.unit, m.compile, m.id];
      }) },

    { name:"SWOT", widths:[16, 78, 16], lockedCols:[2],
      head:["Type", "Point", "ID"],
      validations:[{ range:"A2:A200", list:["Strength","Weakness","Opportunity","Threat"] }],
      rows:[["s","Strength"],["w","Weakness"],["o","Opportunity"],["t","Threat"]]
        .reduce(function(acc, pair){
          (u.swot[pair[0]] || []).forEach(function(x, i){
            acc.push([pair[1], x, u.ukey + "-" + pair[1][0].toUpperCase() + (i+1)]);
          });
          return acc;
        }, []) },

    { name:"Pillars", widths:[40, 14, 10, 22, 16], lockedCols:[4],
      head:["Pillar", "Kind", "Theme", "Owner", "ID"],
      validations:[{ range:"B2:B60", list:KINDS },
                   { range:"C2:C60", list:themes, error:"Use one of the group's theme codes." }],
      rows:u.items.map(function(p){ return [p.name, p.kind, p.theme, p.owner, p.id]; }) },

    { name:"Measures", widths:[34, 40, 11, 14, 10, 12, 16], lockedCols:[6],
      head:["Pillar", "Measure", "Direction", "Target", "Unit", "Compile", "ID"],
      validations:[{ range:"A2:A400", list:pillarNames, error:"Choose a pillar from the Pillars sheet." },
                   { range:"C2:C400", list:DIRS }, { range:"F2:F400", list:COMPILES }],
      rows:u.items.reduce(function(acc, p){
        p.measures.forEach(function(m){
          var a = splitTarget(m.target);
          acc.push([p.name, m.name, m.dir, a.value, a.unit, m.compile, m.id]);
        });
        return acc;
      }, []) },

    { name:"Tactics", widths:[30, 40, 40, 34, 20, 24, 7, 7, 7, 7, 16], lockedCols:[10],
      head:["Pillar", "Tactic", "Description", "Outcome", "Owner", "Collaborators",
            "Q1", "Q2", "Q3", "Q4", "ID"],
      validations:[{ range:"A2:A400", list:pillarNames, error:"Choose a pillar from the Pillars sheet." },
                   { range:"G2:J400", list:YESNO }],
      rows:u.items.reduce(function(acc, p){
        p.tactics.forEach(function(t){
          acc.push([p.name, t.name, t.description || "", t.outcome || "", t.owner,
            (t.collaborators || []).join(", "),
            t.q1 ? "Yes" : "No", t.q2 ? "Yes" : "No", t.q3 ? "Yes" : "No", t.q4 ? "Yes" : "No",
            t.id]);
        });
        return acc;
      }, []) }
  ];
}

function progressWorkbook(u){
  return [
    readme("progress", u.name),

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

function planFromWorkbook(u, sheets){
  var rows = [], pillarId = {};
  var next = u.items.length;

  /* A child names its pillar rather than carrying its id, which is what makes
     the workbook fillable. The cost is that renaming a pillar on the Pillars
     sheet leaves every measure and tactic still naming the old one \u2014 the
     dropdown cannot help, its list is fixed text inside the file. So the name
     is tried first, and anything already known falls back to the parent the
     platform currently records for it. */
  function parentFor(pillarName, childId){
    if (pillarId[pillarName]) return pillarId[pillarName];
    var hit = childId ? findById(u, childId) : null;
    return hit && hit.pillar ? hit.pillar.id : "";
  }

  (sheetObjects(sheets["Pillars"])).forEach(function(r){
    var id = r["ID"] || (u.ukey + "-P" + (++next));
    pillarId[r["Pillar"]] = id;
    rows.push({ id:id, type:"PILLAR", name:r["Pillar"], kind:r["Kind"],
                theme:r["Theme"], owner:r["Owner"], notes:"", parent_id:"",
                description:"", outcome:"", collaborators:"", direction:"",
                value:"", value_3y:"", unit:"", horizon:"", compile:"",
                q1:"", q2:"", q3:"", q4:"", source_slide:"" });
  });

  sheetObjects(sheets["Foundation"]).forEach(function(r){
    rows.push({ id:r["ID"], type:"FOUNDATION", name:r["Label"], description:r["Text"] });
  });
  sheetObjects(sheets["Aspiration"]).forEach(function(r){
    if (/horizon/i.test(r["Field"] || "")) { GROUP.horizon = r["Text"] || GROUP.horizon; return; }
    rows.push({ id:r["ID"], type:"ASPIRATION", name:r["Field"], description:r["Text"] });
  });
  sheetObjects(sheets["Objectives"]).forEach(function(r){
    rows.push({ id:r["ID"] || (u.ukey + "-KO" + (rows.length + 1)), type:"NORTHSTAR",
      name:r["Objective"], direction:r["Direction"], value:r["This year target"],
      value_3y:r["3-year target"], unit:r["Unit"], compile:r["Compile"] });
  });
  var swotN = { Strength:0, Weakness:0, Opportunity:0, Threat:0 };
  sheetObjects(sheets["SWOT"]).forEach(function(r){
    var t = r["Type"]; if (!swotN.hasOwnProperty(t)) return;
    swotN[t]++;
    rows.push({ id:r["ID"] || (u.ukey + "-" + t[0].toUpperCase() + swotN[t]),
                type:t.toUpperCase(), name:r["Point"] });
  });
  sheetObjects(sheets["Measures"]).forEach(function(r, i){
    rows.push({ id:r["ID"] || (u.ukey + "-M-new" + i), type:"MEASURE",
      parent_id:parentFor(r["Pillar"], r["ID"]), name:r["Measure"], direction:r["Direction"],
      value:r["Target"], unit:r["Unit"], compile:r["Compile"] });
  });
  sheetObjects(sheets["Tactics"]).forEach(function(r, i){
    rows.push({ id:r["ID"] || (u.ukey + "-T-new" + i), type:"TACTIC",
      parent_id:parentFor(r["Pillar"], r["ID"]), name:r["Tactic"],
      description:r["Description"], outcome:r["Outcome"], owner:r["Owner"],
      collaborators:(r["Collaborators"] || "").split(/[,|]/).map(function(x){ return x.trim(); })
        .filter(Boolean).join("|"),
      q1:yes(r["Q1"]) ? "1" : "0", q2:yes(r["Q2"]) ? "1" : "0",
      q3:yes(r["Q3"]) ? "1" : "0", q4:yes(r["Q4"]) ? "1" : "0" });
  });

  return rows.map(function(r){
    ["parent_id","source_slide","name","description","outcome","owner","collaborators",
     "direction","value","value_3y","unit","horizon","compile","q1","q2","q3","q4",
     "theme","kind","notes"].forEach(function(k){ if (r[k] == null) r[k] = ""; });
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

function capReadme(kind, capName){
  var lines = kind === "plan"
    ? [["Plan workbook", ""],
       ["Capability", capName],
       ["", ""],
       ["How to fill it", "One sheet per part of the plan. Fill Projects first — Deliverables, Outcomes and Milestones choose their project from a list of what you typed."],
       ["Dropdowns", "Direction, Compile, Kind, Timeline and the Project columns are lists. Type nothing else in them."],
       ["The ID column", "Grey, always last. Leave it alone. Blank means a new item; filled means the platform already has it and will update rather than duplicate."],
       ["Blank rows", "Ignored. Delete a row only if you mean to stop tracking it — removing a row here does not delete anything already recorded."],
       ["Targets", "Put the number in Target and the unit in Unit — 12 and d, not \"12 d\". A blank target is allowed: the outcome is recorded and left unscored."],
       ["Milestone dates", "A milestone may finish after its project ends. It is saved exactly as entered and said out loud, never refused."],
       ["", ""],
       ["When you are done", "Save as .xlsx and upload it on Manage → Import."]]
    : [["Progress workbook", ""],
       ["Capability", capName],
       ["", ""],
       ["How to fill it", "Type only in the New value or New status column. Everything else is there so you can see what you are reporting against."],
       ["Leaving it blank", "A blank new value means nothing changed. Only the rows you fill are read."],
       ["Objectives and outcomes", "Enter the actual, in the same unit as the target. What it means against the target is worked out on arrival."],
       ["Deliverables", "Yes or No where it is delivered-or-not; a number where it is a percentage."],
       ["Milestones", "Not started, In progress or Completed."],
       ["Not yet due", "Rows marked so are outside the current review. Leave them blank."],
       ["", ""],
       ["When you are done", "Save as .xlsx and upload it on Manage → Import."]];
  return { name:"Read me", widths:[22, 96],
           rows:lines.map(function(l){ return [l[0], l[1]]; }) };
}

function capPlanWorkbook(c){
  var projNames = (c.projects || []).map(function(p){ return p.name; });
  return [
    capReadme("plan", c.name),

    { name:"Objectives", widths:[40, 11, 14, 10, 10, 12, 16], lockedCols:[6],
      head:["Objective", "Direction", "Target", "Unit", "Weight", "Compile", "ID"],
      validations:[{ range:"B2:B60", list:DIRS }, { range:"F2:F60", list:COMPILES }],
      rows:(c.keyObjectives || []).map(function(m){
        var a = splitTarget(m.target);
        return [m.name, m.dir, a.value, a.unit, m.weight == null ? "" : String(m.weight), m.compile, m.id];
      }) },

    { name:"Projects", widths:[38, 70, 20, 30, 12, 14, 14, 16], lockedCols:[7],
      head:["Project", "Brief", "Owner", "Stakeholders", "Timeline", "Start", "End", "ID"],
      validations:[{ range:"E2:E100", list:TIMELINES }],
      rows:(c.projects || []).map(function(p){
        return [p.name, p.brief || "", p.owner || "", (p.stakeholders || []).join(", "),
                p.timeline === "date" ? "Dates" : "Quarters", p.start || "", p.end || "", p.id];
      }) },

    { name:"Deliverables", widths:[34, 44, 16, 10, 20, 16], lockedCols:[5],
      head:["Project", "Deliverable", "Kind", "Due", "Owner", "ID"],
      validations:[{ range:"A2:A400", list:projNames, error:"Choose a project from the Projects sheet." },
                   { range:"C2:C400", list:DELIV_KINDS }],
      rows:(c.projects || []).reduce(function(acc, p){
        (p.deliverables || []).forEach(function(d){
          acc.push([p.name, d.name, d.kind === "pct" ? "% delivered" : "Delivered / not",
                    d.due || "", d.owner || "", d.id]);
        });
        return acc;
      }, []) },

    { name:"Outcomes", widths:[34, 44, 11, 12, 10, 14, 16], lockedCols:[6],
      head:["Project", "Outcome", "Direction", "Target", "Unit", "Measured at", "ID"],
      validations:[{ range:"A2:A400", list:projNames, error:"Choose a project from the Projects sheet." },
                   { range:"C2:C400", list:DIRS }],
      rows:(c.projects || []).reduce(function(acc, p){
        (p.outcomes || []).forEach(function(o){
          var a = splitTarget(o.target);
          acc.push([p.name, o.name, o.dir, a.value, a.unit, o.measureAt || "", o.id]);
        });
        return acc;
      }, []) },

    { name:"Milestones", widths:[34, 38, 52, 16, 14, 16], lockedCols:[5],
      head:["Project", "Milestone", "What it covers", "Owner", "Finish", "ID"],
      validations:[{ range:"A2:A400", list:projNames, error:"Choose a project from the Projects sheet." }],
      rows:(c.projects || []).reduce(function(acc, p){
        (p.milestones || []).forEach(function(m){
          acc.push([p.name, m.name, m.covers || "", m.owner || "", m.finish || "", m.id]);
        });
        return acc;
      }, []) }
  ];
}

function capProgressWorkbook(c){
  return [
    capReadme("progress", c.name),

    { name:"Objectives", widths:[40, 11, 16, 18, 18, 16], lockedCols:[5],
      head:["Objective", "Direction", "Target", "Currently recorded", "New value", "ID"],
      rows:(c.keyObjectives || []).map(function(m){
        return [m.name, m.dir, m.target || "no target",
                m.actual == null ? "" : String(m.actual), "", m.id];
      }) },

    { name:"Deliverables", widths:[30, 40, 16, 10, 18, 18, 16], lockedCols:[6],
      head:["Project", "Deliverable", "Kind", "Due", "Currently recorded", "New value", "ID"],
      rows:(c.projects || []).reduce(function(acc, p){
        (p.deliverables || []).forEach(function(d){
          acc.push([p.name, d.name, d.kind === "pct" ? "% delivered" : "Delivered / not",
                    d.due || "", d.actual == null ? "" : String(d.actual), "", d.id]);
        });
        return acc;
      }, []) },

    { name:"Outcomes", widths:[30, 40, 14, 14, 18, 18, 16], lockedCols:[6],
      head:["Project", "Outcome", "Target", "Measured at", "Currently recorded", "New value", "ID"],
      rows:(c.projects || []).reduce(function(acc, p){
        (p.outcomes || []).forEach(function(o){
          acc.push([p.name, o.name, o.target || "no target", o.measureAt || "",
                    o.actual == null ? "" : String(o.actual), "", o.id]);
        });
        return acc;
      }, []) },

    { name:"Milestones", widths:[30, 40, 14, 16, 18, 16], lockedCols:[5],
      head:["Project", "Milestone", "Finish", "Current status", "New status", "ID"],
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
function capPlanFromWorkbook(c, sheets){
  var rows = [], projId = {};
  var nextP = (c.projects || []).length;
  var childN = { D:0, O:0, M:0 };

  function parentFor(projName, childId){
    if (projId[projName]) return projId[projName];
    var hit = childId ? capFindById(c, childId) : null;
    return hit && hit.proj ? hit.proj.id : "";
  }

  sheetObjects(sheets["Projects"]).forEach(function(r){
    var id = r["ID"] || (c.id + "-P" + (++nextP));
    projId[r["Project"]] = id;
    rows.push({ id:id, type:"PROJECT", name:r["Project"], description:r["Brief"],
      owner:r["Owner"], stakeholders:(r["Stakeholders"] || "").split(/[,|]/)
        .map(function(x){ return x.trim(); }).filter(Boolean).join("|"),
      timeline:timelineKey(r["Timeline"]) || "", start:r["Start"], end:r["End"] });
  });
  sheetObjects(sheets["Objectives"]).forEach(function(r, i){
    rows.push({ id:r["ID"] || (c.id + "-KO-new" + (i + 1)), type:"CAPOBJECTIVE",
      name:r["Objective"], direction:r["Direction"], value:r["Target"], unit:r["Unit"],
      weight:r["Weight"], compile:r["Compile"] });
  });
  sheetObjects(sheets["Deliverables"]).forEach(function(r){
    rows.push({ id:r["ID"] || (parentFor(r["Project"]) + "-D-new" + (++childN.D)), type:"DELIVERABLE",
      parent_id:parentFor(r["Project"], r["ID"]), name:r["Deliverable"],
      kind:delivKindKey(r["Kind"]) || r["Kind"], due:r["Due"], owner:r["Owner"] });
  });
  sheetObjects(sheets["Outcomes"]).forEach(function(r){
    rows.push({ id:r["ID"] || (parentFor(r["Project"]) + "-O-new" + (++childN.O)), type:"OUTCOME",
      parent_id:parentFor(r["Project"], r["ID"]), name:r["Outcome"],
      direction:r["Direction"], value:r["Target"], unit:r["Unit"], measure_at:r["Measured at"] });
  });
  sheetObjects(sheets["Milestones"]).forEach(function(r){
    rows.push({ id:r["ID"] || (parentFor(r["Project"]) + "-M-new" + (++childN.M)), type:"MILESTONE",
      parent_id:parentFor(r["Project"], r["ID"]), name:r["Milestone"],
      covers:r["What it covers"], owner:r["Owner"], finish:r["Finish"] });
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
