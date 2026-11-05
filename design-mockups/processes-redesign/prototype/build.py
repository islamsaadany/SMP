#!/usr/bin/env python3
"""Assembles the Processes prototype into one self-contained HTML file.

Two outputs, same content:
  ../2026-10-23_processes-prototype.html   a full document: the file to download and open offline
  <scratch>/processes-prototype.artifact.html  the same page without the document skeleton,
                                                which the artifact host adds itself
Run: python3 build.py [scratch_dir]
"""
import base64, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent / "2026-10-23_processes-prototype.html"
FONT = HERE.parents[2] / "smp-app" / "public" / "fonts" / "Source_Sans_3.woff2"

font64 = base64.b64encode(FONT.read_bytes()).decode()
css = (HERE / "styles.css").read_text().replace("%FONT%", font64)
js = "\n".join(p.read_text() for p in sorted((HERE / "js").glob("*.js")))

body = (
    "<title>Processes Prototype</title>\n"
    '<meta name="claude:viewport-fit-sides" content="cover">\n'
    "<style>\n" + css + "\n</style>\n"
    '<div id="band"></div>\n<div id="app"></div>\n<div id="layer"></div>\n<div id="toast" class="toast" hidden></div>\n'
    "<script>\n" + js + "\n</script>\n"
)
doc = (
    "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n"
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
    "<style>:root{padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n"
    "</head>\n<body>\n" + body + "</body>\n</html>\n"
)
OUT.write_text(doc)
print("wrote", OUT, len(doc) // 1024, "KB")
if len(sys.argv) > 1:
    art = pathlib.Path(sys.argv[1]) / "processes-prototype.artifact.html"
    art.write_text(body)
    print("wrote", art)
