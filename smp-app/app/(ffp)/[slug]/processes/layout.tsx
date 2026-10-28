/* ── THE PROCESSES MODULE'S FRAME ────────────────────────────────────────
   FFProcess, carried into SMP with its own design (Islam: "keep its design").
   Its pages are React, so they are drawn here rather than by an HTML-string
   server in modules/; what this layout adds is the part that makes it SMP's:

     · the door — SMP's sign-in, asked through resolveTenant exactly as every
       other page asks it, and the module must be switched on for the client;
     · who may open WHICH part is asked by the part itself, not here: the
       office-only areas ((shell), reports) call requireOffice first — a
       client's own person is sent to their reading page — and
       the staff reader view (read) asks readerSeat. This frame only makes
       sure the person got through the door. tests/processes-gate.mjs fails if
       a page is left without one of the two;
     · SMP's white top bar (lib/topbar.ts, §444), the same on every module,
       in place of FFProcess's own header.

   FFProcess's root layout set the language on <html>; SMP's root layout owns
   <html>, so the language and direction ride a wrapper element instead —
   Tailwind's rtl: variants and logical properties read the nearest `dir`. */
import { readingFor } from "@/ffp/lib/data/process-reading";
import { offersReadingLink } from "@/ffp/lib/domain/process-reader";
import { registerReady } from "@/ffp/lib/register-sync";
import "@/ffp/globals.css";
import { redirect } from "next/navigation";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { currentUser } from "@/lib/session.ts";
import { doorPool } from "@/lib/auth.ts";
import { resolveTenant } from "@/lib/door.ts";
import { modulesFor, clientHref, DEFAULT_MODULE } from "@/lib/modules.ts";
import { openableModules } from "@/lib/access.ts";
import { topBarHtml, TOPBAR_CSS, TOPBAR_SRC } from "@/lib/topbar.ts";
import { getLocale } from "@/ffp/lib/i18n/server";
import { dirFor } from "@/ffp/lib/i18n/locale";
import { LocaleProvider } from "@/ffp/lib/i18n/client";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const plexArabic = IBM_Plex_Sans_Arabic({ variable: "--font-arabic", subsets: ["arabic"], weight: ["400", "500", "600", "700"] });

export const dynamic = "force-dynamic";

export async function generateMetadata(props: LayoutProps<"/[slug]/processes">) {
  const { slug } = await props.params;
  return { title: slug.toUpperCase() + " — Processes" };
}

export default async function ProcessesFrame(props: LayoutProps<"/[slug]/processes">) {
  const { slug } = await props.params;
  const user = await currentUser();
  if (!user) redirect("/" + slug + "/sign-in");
  const door = await resolveTenant(doorPool(), user, slug);
  if (!door.ok) {
    if (door.status === 302) redirect(door.redirect);
    if (door.status === 403) redirect("/" + slug + "/sign-in");
    redirect("/platform");
  }
  if (!modulesFor(door.tenant.modules).includes("processes")) redirect(clientHref(slug, DEFAULT_MODULE, ""));
  const office = door.seat === "super" || door.seat === "smoteam";
  const have = await openableModules(door.tenant.id, door.seat, door.personKey, door.tenant.modules);
  /* The Org Directory mirrors the client's People register (ffp/lib/
     register-sync.ts registerReady — the pages that list people await the
     same per-request sync, so none reads ahead of it). */
  if (office) await registerReady(slug);
  // The staff reading link, for a client's own person on the register: this frame is not
  // served by the router that sets it for every other page (lib/bar-extras.ts).
  const processesRead =
    !office && door.personKey && offersReadingLink({ clientHasProcesses: true, office, userKind: user.kind, personKey: door.personKey })
      ? await readingFor(slug, door.personKey)
      : null;
  const bar = topBarHtml({ slug, tenantName: door.tenant.name, module: "processes", have, consultant: user.kind !== "client", processesRead });
  const locale = await getLocale();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TOPBAR_CSS + "@media print{.tb{display:none}}" }} />
      {/* eslint-disable-next-line @next/next/no-sync-scripts -- the shared bar's one script (§444) */}
      <script src={TOPBAR_SRC} />
      <div dangerouslySetInnerHTML={{ __html: bar }} />
      <div
        data-ffp=""
        lang={locale}
        dir={dirFor(locale)}
        className={`${geistSans.variable} ${geistMono.variable} ${plexArabic.variable} flex min-h-[calc(var(--winh)-41px)] flex-col bg-slate-50 font-sans text-slate-900 antialiased`}
      >
        <LocaleProvider locale={locale}>
          {props.children}
        </LocaleProvider>
      </div>
    </>
  );
}
