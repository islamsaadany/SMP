"""THE REGISTER NAMES WHERE SOMEBODY SITS IN THE CLIENT'S OWN WORD (§563).

Islam, of El Abd: *"in elabd people belong to functions not units how to fix
this?"* — then, asked what Raya would see, *"ok go ahead"*. El Abd's people
were never in units (its units were deleted, §535.8); the register said they
were, heading the column "Unit" for every client.

It MAKES its states (§255) over Raya's worked example, which holds both units
and functions: as it is, with the units off (El Abd's shape), with the
functions off, and with a word the client typed in Terminology. BOTH ENDS
(§94.2): the new word is on the heading, the column chooser, the dialog and the
role refusal, AND "Unit" is not, AND the field's KEY did not move with its
name — the register's cell still opens on a double-click and the role list
still finds the field it points at, because the label is how both find it.
SMP_BUILT points it at another build (§276).
"""
import os
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(
    os.path.dirname(__file__), "..", "strategy-management-platform.html")
URL = "file://" + os.path.abspath(BUILT)

bad = 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — %s" % (x,)) if not ok and x != "" else ""))

def ev(pg, js, arg=None, dflt=None):
    try:
        return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e:
        return dflt

# The Structure switches, stored as an absence (§50.6): on is no key at all.
SHAPE = """(s)=>{var st = GROUP.structure = GROUP.structure || {};
  ['bu','fn'].forEach(function(k){ st[k] = st[k] || {};
    if (s[k]) delete st[k].exists; else st[k].exists = false; });
  if (s.fnword) { var e = LABELS.entries.find(function(x){ return x.key === 'fnword'; });
    e.group = s.fnword[0]; e.bu = s.fnword[1]; }
  paint(); return true}"""
HEADS = "()=>[...document.querySelectorAll('.peoplecfg thead th')].map(t=>t.textContent.trim())"
CHOOSER = """()=>{const b=document.querySelector('[data-colmenu]'); if(!b) return null; b.click();
  return [...document.querySelectorAll('.hmenu-panel.cols .colrow')].map(r=>r.textContent.trim())}"""
DLG = """()=>{const s=document.querySelector('#modal-b [data-pat]'); const f=s&&s.closest('.pdf');
  const l=f&&f.querySelector('.pdfl'); return l?l.textContent.trim():null}"""
STOP = "()=>{const e=document.querySelector('.rolestop');return e?e.textContent.trim():null}"
HINT = """(n)=>{const r=[...document.querySelectorAll('.sspop .ssrow')].find(x=>{const c=x.cloneNode(true);
  [...c.querySelectorAll('.sshint')].forEach(h=>h.remove()); return c.textContent.trim()===n;});
  const h=r&&r.querySelector('.sshint'); return h?h.textContent.trim():null}"""
PICK = """(n)=>{const r=[...document.querySelectorAll('.sspop .ssrow')].find(x=>{const c=x.cloneNode(true);
  [...c.querySelectorAll('.sshint')].forEach(h=>h.remove()); return c.textContent.trim()===n;});
  if(!r) return false; r.click(); return true}"""
ROLES = """(k)=>{const s=document.querySelector('#modal-b [data-proleset="'+k+'"]');
  const b=s&&s.previousElementSibling; if(!b||!b.classList.contains('ssbtn')) return false; b.click(); return true}"""

def land(pg, shape):
    pg.goto(URL); pg.wait_for_timeout(700)
    ev(pg, "()=>{document.querySelector('[data-md=\"setup\"]').click(); return true}"); pg.wait_for_timeout(300)
    ev(pg, "()=>{document.querySelector('[data-setupgo=\"people\"]').click(); return true}"); pg.wait_for_timeout(600)
    ev(pg, SHAPE, shape); pg.wait_for_timeout(400)

def open_person(pg, key):
    ev(pg, "(k)=>{document.querySelector('[data-pmenu=\"'+k+'\"]').click(); return true}", key); pg.wait_for_timeout(200)
    ev(pg, "(k)=>{document.querySelector('[data-pedit=\"'+k+'\"]').click(); return true}", key); pg.wait_for_timeout(500)

def close_person(pg):
    ev(pg, "()=>{const b=document.querySelector('[data-pdlg-close]'); if(b) b.click(); return true}"); pg.wait_for_timeout(400)

def word_everywhere(pg, name, shape, want, who="cfo"):
    land(pg, shape)
    heads = ev(pg, HEADS) or []
    ck(name + ": the register's column reads \"%s\"" % want, want in heads, heads)
    if want != "Unit":
        ck(name + ": ...and no column reads \"Unit\"", "Unit" not in heads, heads)
    rows = ev(pg, CHOOSER) or []
    ck(name + ": the Columns chooser names it the same", want in rows, rows)
    ev(pg, "()=>{PCOLMENU=false; paint(); return true}"); pg.wait_for_timeout(200)
    open_person(pg, who)
    ck(name + ": the person's dialog names the field the same", ev(pg, DLG) == want, ev(pg, DLG))
    close_person(pg)

print("\nthe register's word for where somebody sits — " + URL)
src = open(os.path.abspath(BUILT), encoding="utf-8").read()
ck("one function answers it (§53.5)", src.count("function sitsInWord(") == 1, src.count("function sitsInWord("))
ck("the merge dialog's card asks it rather than saying Unit",
   '<div class="mgf"><span>Unit</span>' not in src and
   "'<div class=\"mgf\"><span>' + esc(sitsInWord()) + '</span><span>'" in src)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1');"
                       "sessionStorage.setItem('smp.tour.later','1');"
                       "localStorage.setItem('smp.people.columns', JSON.stringify({company:true}))}catch(e){}")

    print("\n1. Raya as it is: units and functions")
    word_everywhere(pg, "Raya", {"bu": True, "fn": True}, "Unit or function")
    land(pg, {"bu": True, "fn": True})
    tip = ev(pg, "()=>{const e=document.querySelector('.peoplecfg [title^=\"Comes from the unit\"]'); return e?e.title:null}")
    ck("Raya: the Company hover names the field by the same word",
       tip == "Comes from the unit. Change the Unit or function to move them.", tip)

    print("\n2. El Abd's shape: the units off")
    word_everywhere(pg, "units off", {"bu": False, "fn": True}, "Function")

    print("\n3. the functions off")
    word_everywhere(pg, "functions off", {"bu": True, "fn": False}, "Unit")

    print("\n4. a word the client typed is used as typed")
    word_everywhere(pg, "own word, units off", {"bu": False, "fn": True, "fnword": ["Department", "Departments"]},
                    "Department")
    word_everywhere(pg, "own word, both on", {"bu": True, "fn": True, "fnword": ["Department", "Departments"]},
                    "Unit or department")
    word_everywhere(pg, "an acronym is left alone", {"bu": True, "fn": True, "fnword": ["BU Function", "BU Functions"]},
                    "Unit or BU function")

    print("\n5. the role list and its refusal name the field by its word")
    land(pg, {"bu": False, "fn": True})
    open_person(pg, "cfo")
    ev(pg, """()=>{const s=document.querySelector('[data-pat="cfo"]'); s.value='';
      s.dispatchEvent(new Event('change',{bubbles:true})); return true}"""); pg.wait_for_timeout(400)
    ev(pg, ROLES, "cfo"); pg.wait_for_timeout(250)
    hint = ev(pg, HINT, "Function head") or ""
    ck("units off: the role list says to set the Function first", "set the Function first" in hint, hint)
    ev(pg, PICK, "Function head"); pg.wait_for_timeout(600)
    said = ev(pg, STOP) or ""
    ck("units off: the refusal says to set the Function", said.startswith("Set the Function first"), said)
    ck("...and it is a refusal: nothing was granted",
       ev(pg, "()=>personRoles(personBy('cfo')).length") == 0, ev(pg, "()=>JSON.stringify(personRoles(personBy('cfo')))"))
    close_person(pg)

    print("\n6. the field's KEY did not move with its name")
    land(pg, {"bu": False, "fn": True})
    pg.dblclick('[data-pcell="cfo|Unit or function"]'); pg.wait_for_timeout(400)
    ck("double-clicking the register's cell still opens its dropdown",
       ev(pg, "()=>!!document.querySelector('.peoplecfg td.pcellopen [data-pat=\"cfo\"]')") is True)
    ck("the attention outline still points at the field by its key",
       ev(pg, "()=>ATTN_FIELD.said") == "Unit or function", ev(pg, "()=>ATTN_FIELD.said"))

    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n" + ("all good" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
