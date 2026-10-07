/* The Copilot's settings, on Forefront's console (§501, spec 064).
 *
 * WHY THEY MOVED HERE: they are the same for every client (§456), so reaching
 * them from inside one client's platform said something untrue — that they
 * were that client's. Islam: the Copilot is switched on per client and shows
 * as a tab inside Strategy, and its settings are reached "from somewhere
 * else". That somewhere is the console, beside the frameworks library, which
 * is the other thing the firm keeps for every client.
 *
 * READING IS EVERY CONSULTANT'S, CHANGING IS A FOREFRONT SUPER USER'S — the
 * platform admin flag, §456's rule unchanged, asked HERE on every write; the
 * page drawing no Edit button is the courtesy (§42). A client's own login is
 * refused in frameworks-api.ts's words to the letter (§53.5).
 *
 * The store is lib/copilot-settings.ts, untouched: a platform table, read
 * through the door's pool and never inside withTenant. */
import type { Pool, PoolClient } from "pg";
import type { SessionUser } from "./auth.ts";
import { partsOf, templatesOf, savePart, saveTemplate, resetAsset, MAX_TEMPLATE, SECTION_ORDER, SECTION_TITLE } from "./copilot-settings.ts";

type Q = Pool | PoolClient;
export type Answer = { code: number; body: Record<string, unknown> };
const ok = (body: Record<string, unknown>): Answer => ({ code: 200, body: { ok: true, ...body } });
const no = (code: number, error: string): Answer => ({ code, body: { ok: false, error } });

const NOT_YOURS = "That is not something this account opens.";
const NOT_ADMIN = "Only a Forefront super user can change the Copilot's settings.";

export const mayChange = (me: SessionUser): boolean =>
  process.env.SMP_BREAK === "copilot-settings-any" ? true   /* RED: any consultant writes every client's Copilot */
    : me.isAdmin;
export const mayRead = (me: SessionUser): boolean =>
  process.env.SMP_BREAK === "copilot-settings-client" ? true /* RED: a client's own login reads the firm's method */
    : me.kind !== "client";

async function everything(pool: Q, me: SessionUser) {
  return {
    canEdit: mayChange(me),
    sections: SECTION_ORDER.map((k) => ({ key: k, title: SECTION_TITLE[k] })),
    parts: await partsOf(pool),
    templates: await templatesOf(pool),
  };
}

export async function copilotSettingsAction(pool: Q, me: SessionUser, body: any, by: string | null): Promise<Answer> {
  if (!mayRead(me)) return no(403, NOT_YOURS);
  const act = String((body && body.action) || "");
  if (act === "read") return ok(await everything(pool, me));
  if (act !== "save" && act !== "reset" && act !== "replace") return no(400, "Not something this page does.");
  if (!mayChange(me)) return no(403, NOT_ADMIN);
  const key = String(body.key || "");
  let r: { ok: true; changed: boolean } | { ok: false; why: string };
  if (act === "save") r = await savePart(pool, key, String(body.text ?? ""), by);
  else if (act === "reset") r = await resetAsset(pool, key);
  else {
    const name = String(body.name || "");
    const b64 = String(body.data || "");
    if (!b64) r = { ok: false, why: "Choose the file to put in its place." };
    else {
      const bytes = Buffer.from(b64, "base64");
      r = bytes.length > MAX_TEMPLATE ? { ok: false, why: "A template can be up to 3 MB." } : await saveTemplate(pool, key, name, bytes, by);
    }
  }
  if (!r.ok) return no(400, r.why);
  return ok({ changed: r.changed, ...(await everything(pool, me)) });
}
