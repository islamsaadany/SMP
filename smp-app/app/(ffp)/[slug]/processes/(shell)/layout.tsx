import { notFound as nextNotFound, redirect } from "next/navigation";
import { requireWorkspaceAccess } from "@/ffp/lib/auth/workspace";
import { prisma } from "@/ffp/lib/db/client";
import { hasSufficientAccess } from "@/ffp/lib/domain/access-control";
import { mixHex, readableInkOn } from "@/ffp/lib/domain/color-contrast";
import { requireOffice } from "@/ffp/lib/auth/require-office";
import { WorkspaceAccessProvider } from "./workspace-access";
import { OfficeFrame } from "./office-frame";
import { gapsByProcess } from "@/ffp/lib/data/process-gaps";
import { unmatchedRoles } from "@/ffp/lib/data/role-matching";
import { clientSettings, profileAndBrand } from "@/ffp/lib/data/client-settings";
import { barVars } from "@/lib/branding.ts";

const DEFAULT_ACCENT = "#334155"; // slate-700 — a workspace with no logo/accent set yet
const DEFAULT_ACCENT_SECONDARY = "#4338ca"; // indigo-700 — matches this app's existing accent look
const DEFAULT_ACCENT_TERTIARY = "#4338ca";

export default async function WorkspaceLayout(
  props: LayoutProps<"/[slug]/processes">
) {
  const { slug: workspaceId } = await props.params;

  // The office's own: a client's own person is sent to their reading page (see ../require-office.ts).
  await requireOffice(workspaceId);

  const access = await requireWorkspaceAccess(workspaceId, "VIEWER");
  if (!access.ok) {
    if (access.error === "UNAUTHORIZED") redirect("/" + workspaceId + "/sign-in");
    nextNotFound();
  }

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) nextNotFound();

  // Resolved once here, for every control on every page below. The server
  // actions enforce this independently — this is what stops the interface
  // offering a Viewer edits it will then refuse.
  const canEdit = hasSufficientAccess(access.data.accessLevel, "EDITOR");
  // Membership is Admin-gated, not Editor-gated (see lib/actions/membership.ts),
  // so it gets its own answer rather than riding on canEdit.
  const canManageMembers = hasSufficientAccess(access.data.accessLevel, "ADMIN");

  /* The band's counts (spec 067 §4.2): drafts, those the approver sent back,
     and the gaps the map, RACI and Authority pages flag. To handle counts the
     same things its page lists. */
  const [statuses, gaps, toMatch, suggestions] = await Promise.all([
    prisma.process.findMany({ where: { workspaceId, archivedAt: null }, select: { id: true, lifecycleStatus: true, returnReason: true } }),
    gapsByProcess(workspaceId),
    unmatchedRoles(workspaceId),
    prisma.processSuggestion.count({ where: { workspaceId, state: { in: ["NEW", "REPLIED"] } } }),
  ]);
  const drafts = statuses.filter((p) => p.lifecycleStatus === "DRAFT");
  const sentBack = drafts.filter((p) => p.returnReason).length;
  const approved = statuses.filter((p) => p.lifecycleStatus === "APPROVED").length;
  const gapTotal = [...gaps.values()].reduce((a, n) => a + n, 0);
  const drawnWithGaps = statuses.filter((p) => p.lifecycleStatus !== "PUBLISHED" && (gaps.get(p.id) ?? 0) > 0).length;
  const counts = { total: statuses.length, drafts: drafts.length, sentBack, gaps: gapTotal, suggestions, toHandle: suggestions + sentBack + approved + (drawnWithGaps ? 1 : 0) + (toMatch.length ? 1 : 0) };
  /* The client's name and brand as SMP's client settings hold them now (stage 1b, spec 067 §4.4): the
     workspace row keeps the name it was made with, and its own logo and colours only until client settings
     hold some. */
  const client = profileAndBrand(await clientSettings(workspaceId), workspace);
  const clientName = client.name;
  /* Forefront's navy, with the inks the shared panel works out for it (lib/branding.ts). */
  const barStyle = Object.fromEntries(barVars("#16325C").split(";").map((d) => d.split(":") as [string, string])) as React.CSSProperties;

  const primary = client.primary ?? DEFAULT_ACCENT;
  const tertiary = client.tertiary ?? DEFAULT_ACCENT_TERTIARY;

  return (
    <div
      className="flex flex-1"
      style={
        {
          "--accent": primary,
          "--accent-secondary": client.secondary ?? DEFAULT_ACCENT_SECONDARY,
          "--accent-tertiary": tertiary,
          // The page header paints itself in the client's Primary, so its text
          // colour is derived from that rather than assumed white — a pale
          // logo would otherwise give white-on-yellow. Computed here so every
          // page can just use the variable.
          "--accent-ink": readableInkOn(primary),
          "--accent-banner-to": mixHex(primary, tertiary, 0.3),
        } as React.CSSProperties
      }
    >
      <div className="relative min-w-0 flex-1">
        <WorkspaceAccessProvider value={{ accessLevel: access.data.accessLevel, canEdit, canManageMembers }}>
          <OfficeFrame workspaceId={workspaceId} clientName={clientName} counts={counts} canEdit={canEdit} barStyle={barStyle}>
            {props.children}
          </OfficeFrame>
        </WorkspaceAccessProvider>
      </div>
    </div>
  );
}
