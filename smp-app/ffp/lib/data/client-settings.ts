import "server-only";
import { cache } from "react";
import { currentUser } from "@/lib/session.ts";
import { doorPool } from "@/lib/auth.ts";
import { resolveTenant } from "@/lib/door.ts";
import { withTenant } from "@/lib/tenant";

/**
 * WHAT SMP'S CLIENT SETTINGS HOLD FOR PROCESSES (spec 067 §4.4, stage 1b).
 * Org & roles and Settings left Processes: the client's logo and colours,
 * its industry, size and notes, and its departments are set once, in SMP's
 * client settings, and read here (§53.5, one fact, one door).
 *
 *   · the mark          Profile › Brand (tenants.mark, a PNG)
 *   · bar and accent    Profile › Brand (org.extra.branding), null = the shipped palette
 *   · industry, size    Profile › Details (tenants.industry, tenants.size)
 *   · notes             Profile › Details (tenants.notes), Processes' "about this client"
 *   · departments       The organisation › Official BU list (org.extra.mainbus)
 *
 * Read through SMP's own door for the signed-in viewer, once per request. A
 * read that fails answers null and every caller falls back to what Processes
 * kept on its workspace row, so a page never fails on a setting.
 */
export type ClientSettings = {
  tenantId: string;
  name: string;
  mark: string | null;
  industry: string;
  size: string;
  notes: string;
  bar: string | null;
  accent: string | null;
  departments: string[];
};

const HEX = /^#[0-9a-fA-F]{6}$/;

export const clientSettings = cache(async (slug: string): Promise<ClientSettings | null> => {
  try {
    const user = await currentUser();
    if (!user) return null;
    const door = await resolveTenant(doorPool(), user, slug);
    if (!door.ok) return null;
    const tenantId = door.tenant.id;
    return await withTenant(tenantId, async (c) => {
      const t = (await c.query("SELECT name, mark, industry, size, notes FROM tenants WHERE id = $1", [tenantId])).rows[0] ?? {};
      const o = (await c.query("SELECT extra->'branding' AS branding, extra->'mainbus' AS mainbus FROM org")).rows[0] ?? {};
      const b = (o.branding ?? {}) as { bar?: unknown; accent?: unknown };
      const list = Array.isArray(o.mainbus) ? (o.mainbus as { name?: unknown }[]) : [];
      return {
        tenantId,
        name: String(t.name ?? door.tenant.name ?? ""),
        mark: typeof t.mark === "string" && t.mark.startsWith("data:image/") ? t.mark : null,
        industry: String(t.industry ?? "").trim(),
        size: String(t.size ?? "").trim(),
        notes: String(t.notes ?? "").trim(),
        bar: typeof b.bar === "string" && HEX.test(b.bar) ? b.bar : null,
        accent: typeof b.accent === "string" && HEX.test(b.accent) ? b.accent : null,
        departments: [...new Set(list.map((x) => String(x?.name ?? "").trim()).filter(Boolean))],
      };
    });
  } catch (e) {
    console.error("processes: client settings could not be read —", (e as Error).message);
    return null;
  }
});

/** What Processes kept on its workspace row before stage 1b, for the fallback below. */
type WorkspaceKept = {
  name: string;
  industry: string | null;
  description: string | null;
  logoDataUrl: string | null;
  accentColor: string | null;
  accentColorSecondary: string | null;
  accentColorTertiary: string | null;
};

/**
 * The client's name, profile and brand as Processes shows them: SMP's client
 * settings first; what Processes kept on its workspace row only where client
 * settings hold nothing yet, so a client already set up in Processes keeps its
 * logo and words until someone fills Profile › Details and Profile › Brand.
 * The bar colour stands for Processes' primary, the accent for the other two.
 */
export function profileAndBrand(s: ClientSettings | null, w: WorkspaceKept) {
  return {
    name: s?.name || w.name,
    industry: s?.industry || w.industry || null,
    about: s?.notes || w.description || null,
    size: s?.size || null,
    logo: s?.mark ?? w.logoDataUrl ?? null,
    primary: s?.bar ?? w.accentColor ?? null,
    secondary: s?.accent ?? w.accentColorSecondary ?? null,
    tertiary: s?.accent ?? w.accentColorTertiary ?? null,
  };
}
