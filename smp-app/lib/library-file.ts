/* ── ONE REPORT'S FILE (spec 053) ────────────────────────────────────────
   The address a client's Download button points at, and the only way the
   bytes are reached. It is OUR route and not a link to the store, because a
   blob address is permanent and unconditional: handed to a client's browser
   it would outlive the report being withdrawn, outlive the person leaving,
   and be forwardable to anybody (§261.10's own reason for minting one per
   read).

   THE ORDER OF THE THREE STEPS IS THE WHOLE OF IT:

     1 · FIND IT AS **THIS PERSON** SEES IT — `forClient: true`, so `state =
         'published'` is in the WHERE, and the VIEWER, so a report narrowed
         away from where they sit is in the WHERE too (spec 046 §4.10). A
         withdrawn report, one narrowed past them and one that never existed
         all answer identically here, and a reader is never told which (spec
         053 §4.8). **The link is the reason this matters**: a narrowed report
         is not in their list, so the only way to this address is somebody
         sending it to them — which is exactly the case the narrowing is for;
     2 · COUNT IT, once, on the server, in one statement;
     3 · MINT the address and send them to it.

   A STORE THAT IS NOT SET UP ANSWERS IN WORDS (§231.3, §230.2): the library
   goes on listing and searching, and this one act says what it cannot do and
   what to do about it — a dead end with no sentence is the fault that section
   exists to stop. */
import { withTenant } from "./tenant.ts";
import { oneItem, countDownload, safeFileName, type Kind, type Viewer } from "./library.ts";
import { signedReadFor } from "./blob-api.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function plain(status: number, text: string): Response {
  return new Response(text, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function libraryFile(tenantId: string, kind: Kind, id: string, _url: string, viewer: Viewer): Promise<Response> {
  /* An id that is not one never reaches the database: it is the same answer
     either way, and a malformed uuid would otherwise be a 500 rather than a
     404 (§316.2 — a refused statement that names a type sends somebody to
     look at everything). */
  if (!UUID.test(String(id))) return plain(404, "Not found");

  const item = await withTenant(tenantId, (c) => oneItem(c, kind, id, true, viewer));
  if (!item || !item.file_path) return plain(404, "Not found");

  await withTenant(tenantId, (c) => countDownload(c, id));

  const url = await signedReadFor(String(item.file_path));
  if (!url) {
    return plain(503,
      "This report cannot be fetched just now.\n\n" +
      "Nothing has been lost — the report is still here and the strategy office can send it to you.\n" +
      "Try again in a few minutes.");
  }
  return new Response(null, {
    status: 302,
    headers: {
      location: url,
      /* The name the person's browser saves it under is the one we stored,
         scrubbed AGAIN at the moment it goes into a header — the store's
         address is not ours to trust and this costs nothing (spec 053 §5). */
      "content-disposition": 'attachment; filename="' + safeFileName(item.file_name) + '"',
      "cache-control": "no-store",
    },
  });
}
