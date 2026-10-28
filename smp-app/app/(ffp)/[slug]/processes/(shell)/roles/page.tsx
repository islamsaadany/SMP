import { requireOffice } from "@/ffp/lib/auth/require-office";
import { registerReady, titleKey } from "@/ffp/lib/register-sync";
import { registerTitles, unmatchedRoles } from "@/ffp/lib/data/role-matching";
import { getMessages } from "@/ffp/lib/i18n/server";
import { MatchForm } from "./match-form";

/**
 * MATCH JOB ROLES (stage 1b, Islam 2026-10-28: "2 A"). Roles come from the
 * client register's job titles now; a role Processes made that no title
 * matches is listed here once, with where it is used, and matched to a
 * title. Matching moves every use onto the title (ffp/lib/actions/roles-match.ts).
 * Reached from To handle, which counts what is waiting here.
 */
export default async function MatchRolesPage(props: PageProps<"/[slug]/processes/roles">) {
  const { slug: workspaceId } = await props.params;
  await requireOffice(workspaceId);
  await registerReady(workspaceId);
  const m = (await getMessages()).builder.roles;
  const [titles, roles] = await Promise.all([registerTitles(workspaceId), unmatchedRoles(workspaceId)]);

  if (!titles.length || !roles.length)
    return (
      <main className="w-full">
        <div className="rounded-lg border border-dashed border-[#D6DCE5] bg-white px-[18px] py-[22px] text-[13.5px] text-[#414A58]">
          {titles.length ? m.empty : m.noTitles}
        </div>
      </main>
    );

  /* a title that reads like the role is offered first; the office still presses Match */
  const suggest = (name: string) => {
    const k = titleKey(name);
    return titles.find((t) => titleKey(t) === k) ?? titles.find((t) => titleKey(t).includes(k) || k.includes(titleKey(t))) ?? "";
  };

  return (
    <main className="w-full">
      <p className="mb-3 text-[13px] text-[#636C79]">{m.hint}</p>
      <div className="relative overflow-x-auto rounded-lg border border-[#D6DCE5] bg-white">
        <table className="w-full text-[13px]">
          <thead className="bg-[#E4E9F0] text-start text-[10.5px] font-extrabold uppercase tracking-[.08em] text-[#414A58]">
            <tr>
              <th className="border-b border-[#D6DCE5] px-3 py-2.5 text-start">{m.role}</th>
              <th className="border-b border-s border-[#D6DCE5] px-3 py-2.5 text-start">{m.used}</th>
              <th className="border-b border-s border-[#D6DCE5] px-3 py-2.5 text-start">{m.title}</th>
            </tr>
          </thead>
          <tbody className="ffp-zebra">
            {roles.map((r) => {
              const used = m.usedIn(r.steps, r.raci, r.rules, r.governance);
              return (
                <tr key={r.id} className="border-t border-[#E6EAF0]">
                  <td className="px-3 py-2.5 font-bold text-[#171B22]">{r.name}</td>
                  <td className="border-s border-[#E6EAF0] px-3 py-2.5 text-[#414A58]">{used || <span className="text-[#636C79]">{m.notUsed}</span>}</td>
                  <td className="border-s border-[#E6EAF0] px-3 py-2.5">
                    <MatchForm workspaceId={workspaceId} roleId={r.id} titles={titles} suggested={suggest(r.name)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
