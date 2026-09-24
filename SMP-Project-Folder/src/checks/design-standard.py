"""THE DESIGN STANDARD CAN ONLY GAIN GROUND (§411).

The standard (design-mockups/design-standard/2026-09-24_smp-design-standard.html,
signed off 2026-09-24) is six text sizes, four spacing steps, three corners, two
shadows and colours by name. Pages move onto it one at a time, so on any given
day most of the product is still off it -- and the only honest rule for that is
a RATCHET: count every value typed in directly rather than taken from a token,
compare with the recorded baseline, and fail if any count has GONE UP.

What is counted, in the stylesheets build.py concatenates and in the scripts it
inlines (a `style="font-size:12px"` in a builder is the same fault as one in a
.css file):
  font-size   a px/rem/em value that is not var(...)
  radius      a border-radius in px that is not var(...) and not 0
  shadow      a box-shadow that is not var(...), none or 0
  colour      a #hex anywhere OUTSIDE a --token definition line
  sizes       how many DISTINCT literal font sizes there are (the headline
              number the standard exists to bring to six)

It needs no browser and no database. When a page moves and a count falls, run
with --update: it rewrites the baseline ONLY where the new number is lower, and
refuses to raise one (a baseline that can be raised by the same command that
checks it is not a ratchet).
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.dirname(HERE)
BASE = os.path.join(HERE, "design-standard-baseline.json")

def sources():
    b = open(os.path.join(SRC, "build.py")).read()
    css = re.findall(r"open\('([\w\-]+\.css)'\)", b)
    js = re.findall(r'\("[A-Z]+",\s*"([^"]+\.js)"\)', b)
    js.append("theme.js")
    files = css + js
    seen, out = set(), []
    for f in files:
        p = os.path.normpath(os.path.join(SRC, f))
        if p not in seen and os.path.exists(p):
            seen.add(p); out.append(p)
    return out

FS = re.compile(r"font-size\s*:\s*(?!var\()([\d.]+(?:px|rem|em))")
RAD = re.compile(r"border-radius\s*:\s*(?!var\()([^;\"'}]+)")
SHD = re.compile(r"box-shadow\s*:\s*(?!var\()([^;\"'}]+)")
HEX = re.compile(r"#[0-9A-Fa-f]{3,8}\b")
TOKEN_LINE = re.compile(r"^\s*--[\w-]+\s*:")

def measure():
    n = {"font-size": 0, "radius": 0, "shadow": 0, "colour": 0}
    sizes = set()
    per = {}
    for p in sources():
        t = open(p, encoding="utf-8").read()
        c = {"font-size": 0, "radius": 0, "shadow": 0, "colour": 0}
        for m in FS.finditer(t):
            c["font-size"] += 1; sizes.add(m.group(1))
        for m in RAD.finditer(t):
            v = m.group(1).strip()
            if v not in ("0", "0px", "inherit") and "px" in v:
                c["radius"] += 1
        for m in SHD.finditer(t):
            v = m.group(1).strip()
            if v not in ("none", "0", "inherit"):
                c["shadow"] += 1
        is_css = p.endswith(".css")
        for line in t.splitlines():
            if TOKEN_LINE.match(line):
                continue
            s = line.split("/*")[0] if is_css else line
            if is_css or "style" in s or "color" in s or "background" in s:
                c["colour"] += len(HEX.findall(s))
        per[os.path.relpath(p, SRC)] = c
        for k in n: n[k] += c[k]
    n["sizes"] = len(sizes)
    return n, per, sorted(sizes, key=lambda x: float(re.sub(r"[a-z]", "", x)))

def main():
    now, per, sizes = measure()
    if not os.path.exists(BASE):
        json.dump(now, open(BASE, "w"), indent=2); open(BASE, "a").write("\n")
        print("baseline written:", now); return 0
    base = json.load(open(BASE))
    if "--update" in sys.argv:
        new = {k: min(base.get(k, now[k]), now[k]) for k in now}
        json.dump(new, open(BASE, "w"), indent=2); open(BASE, "a").write("\n")
        print("baseline lowered where it could be:", new); return 0
    bad = 0
    for k in ("font-size", "radius", "shadow", "colour", "sizes"):
        was, is_ = base.get(k), now[k]
        mark = "ok  " if is_ <= was else "FAIL"
        if is_ > was: bad += 1
        note = "" if is_ >= was else "  (fell -- run with --update to lock it in)"
        print(f"  {mark} {k:10} {is_:5}  baseline {was}{note}")
    print("  literal font sizes in use:", " ".join(sizes))
    if bad:
        print(f"{bad} FAILED -- a value was typed in where the standard names one. "
              "Use the --t-/--s/--r-/--sh- tokens in _shared.css.")
        return 1
    print("design standard: nothing gained ground against it")
    return 0

if __name__ == "__main__":
    sys.exit(main())
