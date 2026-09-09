/* The document the frozen shell is served in (spec 043 Phase B).

   build.py's head, as a served page: charset, viewport, the tenant's name
   in the title, the theme-colour metas, the icon, the product's own
   stylesheet LINKED (scripts/sync-css.mjs, verbatim), theme.js from the head
   (it stamps `booting` and the theme before the body parses, §94.10), the
   body markup (shell/body.html, generated), and the whole shell as ONE
   external script. No inline script anywhere, so the page carries
   `script-src 'self'` — §238's net without a hash to go stale. The rest of
   the policy is vercel.json's, word for word. */
import { readFileSync } from "node:fs";
import { join } from "node:path";

let body: string | null = null;
export function shellBody(): string {
  if (body === null) body = readFileSync(join(process.cwd(), "shell", "body.html"), "utf8");
  return body;
}
function esc(s: string): string { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

export function shellDocument(tenantName: string): string {
  /* THE CHECK'S BREAKS (constitution XVI, checks/shell.mjs): `no-route`
     stands shell/route.js down, so the address stops naming the page;
     `open-csp` (shellHeaders) drops the policy. Never set on a deployment. */
  const brk = process.env.SMP_BREAK || "";
  return "<!doctype html>\n<html lang='en'" + (brk === "no-route" ? " data-break='no-route'" : "") + ">\n<head>\n<meta charset='utf-8'>\n" +
    "<meta name='viewport' content='width=device-width,initial-scale=1'>\n" +
    "<title>" + esc(tenantName) + " — Strategy Management Platform</title>\n" +
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg">\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">\n' +
    '<meta name="theme-color" content="#16325C" media="(prefers-color-scheme: light)">\n' +
    '<meta name="theme-color" content="#14161A" media="(prefers-color-scheme: dark)">\n' +
    '<link rel="stylesheet" href="/platform.css">\n' +
    '<script src="/theme.js"></script>\n' +
    "</head>\n<body>\n" + shellBody() + '\n<script src="/shell.js"></script>\n</body>\n</html>\n';
}

/* vercel.json's policy with ONE change: script-src is 'self' alone. */
export const SHELL_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; " +
  "connect-src 'self'; worker-src 'self'; manifest-src 'self'; media-src 'self' blob: https://*.blob.vercel-storage.com; " +
  "frame-src https://www.youtube-nocookie.com https://player.vimeo.com https://drive.google.com https://*.sharepoint.com; " +
  "object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";

export function shellHeaders(): Record<string, string> {
  return {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    ...(process.env.SMP_BREAK === "open-csp" ? {} : { "Content-Security-Policy": SHELL_CSP }),
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    /* same-origin: the frozen site said no-referrer everywhere and the shell's
       own scripts spell /api/state with no client on it (history.js,
       safety.js) — the referrer is how the server learns which client's page
       is asking (app/api/state/route.ts), and nothing leaves the origin */
    "Referrer-Policy": "same-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "X-DNS-Prefetch-Control": "off",
  };
}

/* Forefront's own page (§313.3), served as it is. */
let platformPage: string | null = null;
export function platformDocument(): string {
  if (platformPage === null) platformPage = readFileSync(join(process.cwd(), "shell", "platform.html"), "utf8");
  return platformPage;
}
