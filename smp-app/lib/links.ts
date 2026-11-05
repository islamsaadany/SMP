/* LINKS IN A NOTE READ SHORT (§733). Islam: "if someone add a link can we
   have it as a short link? … shall we do this automatic or the link is added
   separately" → automatic, as a small tag ("go with the small tag").

   A progress note is plain text, stored as typed. When it is DRAWN, every
   http(s) address in it becomes a small tag named after its site — Google
   Sheets, Google Drive, SharePoint, or the site's own name — that opens in a
   new tab, with the full address on hover. Nothing about the stored words
   changes, so an edit gets back exactly what was written.

   The console (platform.html) draws My tasks and Home in the browser and
   carries the same rule as a few lines of its own (mwLinks); this is the one
   the server draws the Tracker with. Kept apart deliberately and small: the
   site names are the list below, in both. */

const URL_RE = /https?:\/\/[^\s<>"']+/g;

export function siteName(href: string): string {
  let u: URL;
  try { u = new URL(href); } catch { return "Link"; }
  const h = u.hostname.toLowerCase().replace(/^www\./, "");
  const p = u.pathname;
  if (h === "docs.google.com") {
    if (p.startsWith("/spreadsheets")) return "Google Sheets";
    if (p.startsWith("/document")) return "Google Docs";
    if (p.startsWith("/presentation")) return "Google Slides";
    if (p.startsWith("/forms")) return "Google Forms";
    return "Google Docs";
  }
  if (h === "drive.google.com") return "Google Drive";
  if (h.endsWith(".sharepoint.com")) return "SharePoint";
  if (h === "onedrive.live.com" || h === "1drv.ms") return "OneDrive";
  if (h === "teams.microsoft.com") return "Teams";
  if (h === "miro.com") return "Miro";
  if (h === "notion.so" || h.endsWith(".notion.site")) return "Notion";
  return h || "Link";
}

const LINK_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 9.5l3-3M7 4.5l1-1a2.8 2.8 0 0 1 4 4l-1 1M9 11.5l-1 1a2.8 2.8 0 0 1-4-4l1-1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

/* Plain text in, HTML out: everything escaped, each address a tag. A full
   stop, comma or bracket closing the sentence is not taken into the address. */
export function withLinks(text: string, esc: (s: unknown) => string): string {
  const s = String(text ?? "");
  let out = "", at = 0;
  for (const m of s.matchAll(URL_RE)) {
    let url = m[0];
    const trail = url.match(/[.,;:!?)\]]+$/);
    if (trail) url = url.slice(0, -trail[0].length);
    const i = m.index ?? 0;
    out += esc(s.slice(at, i));
    out += '<a class="lktag" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" title="' + esc(url) + '">' + LINK_SVG + esc(siteName(url)) + "</a>";
    at = i + url.length;
  }
  return out + esc(s.slice(at));
}
