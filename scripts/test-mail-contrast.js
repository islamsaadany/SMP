/* ── EVERY COLOUR THE EMAIL ACTUALLY WRITES, AGAINST THE GROUND IT ACTUALLY
      WRITES IT ON (§72) ──────────────────────────────────────────────────
   Arithmetic on the colours I intended proves what I intended. This reads the
   builder's OUTPUT, so a line that moves is still measured and a colour added
   later is measured the day it is added.

   THE GROUND IS TRACKED WITH A STACK, not by looking backwards for the nearest
   `bgcolor=`. The first draft did the latter and reported the CTA's white label
   as white-on-white, because the button sits INSIDE the card's cell and carries
   a ground of its own — a check that measures the wrong thing passes or fails
   for reasons that have nothing to do with the product (§50.6). */
const fs=require("fs");
const src=fs.readFileSync(__dirname+"/../SMP-Project-Folder/src/mail.js","utf8");
/* SMPRules IS HANDED IN, not stubbed. The builder reads the greeting's region
   markers from the shared module (spec 022), and build.py supplies them the
   same way — by inlining lib/rules.js before mail.js. Feeding the real module
   is what makes this the real builder's output rather than a near miss
   (§103.4: a stub is what you reach for when you cannot supply the thing). */
const MAIL=(new Function("SMPRules", src+";return MAIL;"))(require("../lib/rules.js"));

function rgb(h){h=String(h).replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');
  return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16));}
function lum(c){const s=c.map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});
  return 0.2126*s[0]+0.7152*s[1]+0.0722*s[2];}
function ratio(a,b){const A=lum(rgb(a)),B=lum(rgb(b));const [h,l]=A>B?[A,B]:[B,A];
  return Math.round(((h+0.05)/(l+0.05))*100)/100;}

let bad=0, n=0;
/* Walk the tags in order, keeping a stack of grounds. A <td bgcolor="X"> pushes
   X; its </td> pops. Anything else inherits. Every `color:#…` is measured
   against the top of the stack. */
function scan(html, base){
  const out=[];
  const stack=[base];
  const re=/<td\b([^>]*)>|<\/td>|color:(#[0-9A-Fa-f]{3,6})/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[0] === "</td>") { if (stack.length > 1) stack.pop(); continue; }
    if (m[1] !== undefined) {
      const bg = m[1].match(/bgcolor="(#[0-9A-Fa-f]{3,6})"/);
      stack.push(bg ? bg[1] : stack[stack.length-1]);
      /* The same tag can carry both a ground and, in its style, a colour. */
      const c = m[1].match(/color:(#[0-9A-Fa-f]{3,6})/);
      if (c) out.push([c[1], stack[stack.length-1]]);
      continue;
    }
    out.push([m[2], stack[stack.length-1]]);
  }
  return out;
}
function measure(label, brand){
  console.log("\n── " + label + " ──");
  const html=MAIL.sampleFor(Object.assign({org:"Raya Trade"}, brand));
  /* The card is white and the page it sits on is the mail ground; neither is
     written as a bgcolor, so they are the two the stack starts from. */
  const pairs=scan(html.replace(/background:#F4F6FA/g,'bgcolor-ground'), "#FFFFFF");
  const seen={};
  pairs.forEach(function(p){
    const k=p[0]+"|"+p[1];
    if (seen[k]) return; seen[k]=1;
    const r=ratio(p[0],p[1]), ok=r>=4.5;
    n++; if(!ok) bad++;
    console.log((ok?"ok  ":"FAIL").padEnd(5), String(r).padStart(6)+":1", p[0]+" on "+p[1]);
  });
}
measure("the shipped palette", {});
measure("a tenant with a LIGHT bar", {panel:"#E8EDF5", accent:"#0F766E"});
measure("a tenant with a bright accent", {panel:"#1F1147", accent:"#F59E0B"});
/* The one colour outside every cell: the line under the card, on the ground. */
const under=MAIL.sampleFor({org:"Raya Trade"}).match(/color:(#[0-9A-Fa-f]{3,6});padding:14px 8px 0/);
if (under) { const r=ratio(under[1],"#F4F6FA"); n++; if(r<4.5) bad++;
  console.log("\n" + (r>=4.5?"ok  ":"FAIL").padEnd(5), String(r).padStart(6)+":1",
              under[1]+" on #F4F6FA  (the line under the card)"); }
console.log("\n" + n + " pairs measured, " + (bad? bad+" FAILURES" : "0 failures"));
process.exit(bad?1:0);
