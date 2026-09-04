"""A PICTURE PASTED INTO THE COMPOSER (§252).

Islam: "allow in the chat to copy paste a picture rather than only attaching
it." Somebody reporting a number that looks wrong has just pressed the
screen-grab key; making them save the file and find it again is asking them to
do the computer's job.

A REAL PASTE, not a call to the handler: a ClipboardEvent carrying a real PNG
in a real DataTransfer, dispatched at the box. A probe that called
`takePicture()` directly would pass on a build where the listener was never
wired — which is §96's family, and the fault this project keeps finding.

AND IT ASSERTS THE THREE THINGS THAT COULD GO WRONG QUIETLY: that ordinary text
still pastes as text, that the picture actually TRAVELS with the message rather
than merely appearing to attach, and that with pictures switched off it is
refused IN WORDS rather than dropped (§98.2 — a paste that seems to work and
then vanishes is worse than one that says no).
"""
import json, socketserver, threading, http.server, pathlib, base64
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path("/home/user/SMP")
HTML = (ROOT/"SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
GATE = (ROOT/"index.html").read_bytes(); SW = (ROOT/"sw.js").read_bytes()
SEED = json.loads((ROOT/"db/seed-state.json").read_text())
PERSON = {"key":"hend","name":"Hend Farouk","role":""}
SAID=[]; CFG={"on":True,"shots":True,"promise":"p","beat":4000,"popup":False,"vapid":""}
class H(http.server.BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def _s(self,c,b,t):
        self.send_response(c); self.send_header("Content-Type",t)
        self.send_header("Content-Length",str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path.startswith("/sw.js"): self._s(200,SW,"application/javascript"); return
        if self.path.startswith("/api/state"):
            self._s(200,json.dumps({"ok":True,"state":SEED,"person":PERSON}).encode(),"application/json"); return
        if self.path.startswith("/raya-trade"): self._s(200,HTML,"text/html; charset=utf-8"); return
        self._s(200,GATE,"text/html; charset=utf-8")
    def do_POST(self):
        n=int(self.headers.get("Content-Length") or 0); raw=self.rfile.read(n)
        b=json.loads(raw or b"{}")
        if (b.get("action") or "")=="say": SAID.append(b)
        self._s(200,json.dumps({"ok":True,"office":False,"messages":[],"unread":0,
            "thread":None,"chat":dict(CFG)}).encode(),"application/json")
srv=socketserver.ThreadingTCPServer(("127.0.0.1",0),H); srv.daemon_threads=True
threading.Thread(target=srv.serve_forever,daemon=True).start()
URL="http://127.0.0.1:%d/raya-trade"%srv.server_address[1]

# A REAL PNG, 2x2, so the intake has something to actually decode and shrink.
PNG = base64.b64decode(
 "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFUlEQVR4nGP8//8/AwwwMSAB"
 "3BwA/lYDCGb7uHsAAAAASUVORK5CYII=")
PASTE = """(b64) => {
  const bin = atob(b64); const arr = new Uint8Array(bin.length);
  for (let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
  const f = new File([arr], "shot.png", { type: "image/png" });
  const dt = new DataTransfer(); dt.items.add(f);
  const ev = new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true });
  document.getElementById("chatsay").dispatchEvent(ev);
  return ev.defaultPrevented; }"""
PASTE_TEXT = """() => {
  const dt = new DataTransfer(); dt.setData("text/plain", "just words");
  const ev = new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true });
  document.getElementById("chatsay").dispatchEvent(ev);
  return ev.defaultPrevented; }"""
ok=[0]; bad=[0]
def ck(w,c,d=""):
    if c: ok[0]+=1; print("  ok    "+w+(("  ("+str(d)+")") if d else ""))
    else: bad[0]+=1; print("  FAIL  "+w+(("  — "+str(d)) if d else ""))
b64 = base64.b64encode(PNG).decode()
with sync_playwright() as p:
    br=p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
    pg=br.new_page(viewport={"width":1300,"height":900})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)[:160]))
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg.goto(URL,wait_until="networkidle")
    pg.wait_for_selector("#chatdock:not([hidden])",timeout=20000)
    pg.click("#chatbtn"); pg.wait_for_timeout(900)

    print("\nA PICTURE PASTED INTO THE BOX")
    prevented = pg.evaluate(PASTE, b64); pg.wait_for_timeout(1200)
    ck("the paste is taken over", prevented)
    note = pg.eval_on_selector("#chatnote","e=>e.textContent")
    ck("...and the box says a picture is attached", "screenshot is attached" in note, note)

    print("\nAND IT TRAVELS WITH THE MESSAGE")
    SAID.clear()
    pg.fill("#chatsay","Here is what I see."); pg.click("#chatsend"); pg.wait_for_timeout(1400)
    ck("the message went", len(SAID)==1, len(SAID))
    ck("...carrying the pasted picture",
       bool(SAID and (SAID[0].get("shot") or "").startswith("data:image/")),
       (SAID[0].get("shot") or "")[:24] if SAID else "-")

    print("\nORDINARY TEXT IS UNTOUCHED")
    prev2 = pg.evaluate(PASTE_TEXT); pg.wait_for_timeout(400)
    ck("a text paste is left alone", not prev2)

    print("\nWITH PICTURES TURNED OFF IT IS REFUSED IN WORDS")
    CFG["shots"]=False
    pg.wait_for_timeout(5000)          # the switch reaches the browser on a poll
    ck("  (the switch arrived)", pg.eval_on_selector("#chatpic","e=>e.hidden"))
    pg.evaluate(PASTE, b64); pg.wait_for_timeout(800)
    note2 = pg.eval_on_selector("#chatnote","e=>e.textContent")
    ck("it says so rather than dropping it silently", "turned off" in note2, note2)
    print("\npage errors:", errs or "none")
    if errs: bad[0]+=1
    br.close()
srv.shutdown()
print("\n%d ok, %d FAILED" % (ok[0], bad[0]))

import sys
sys.exit(1 if bad[0] else 0)
