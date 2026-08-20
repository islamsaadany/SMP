/* R1 · Stack verification.
 *
 * Not a ported screen — its only job is to prove the chain end to end before
 * any real screen is built: the existing Neon tables → Prisma → a React server
 * component → the platform's own stylesheet, with the scoring computed rather
 * than stored. It is deliberately labelled so nobody mistakes it for the
 * rebuilt product.
 */
import { prisma } from "@/lib/db";
import { bandOf, koScore, pct } from "@/lib/scoring";

export const dynamic = "force-dynamic";

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

/* The dial, in the platform's own markup — same classes, same custom
   properties, so it is styled by the carried-over stylesheet rather than by
   anything written here. */
function Gauge({ value }: { value: number | null }) {
  const band = bandOf(value);
  if (value == null) {
    return (
      <div className="gauge" style={{ ["--p" as string]: 0, ["--c" as string]: "var(--none)" }}>
        <span className="gauge-in">
          <b style={{ fontSize: 15, color: "var(--none)" }}>—</b>
          <em />
        </span>
      </div>
    );
  }
  return (
    <div className="gauge" style={{ ["--p" as string]: value, ["--c" as string]: `var(--${band.key})` }}>
      <span className="gauge-in">
        <b>
          {value}
          <span style={{ fontSize: ".55em" }}>%</span>
        </b>
        <em />
      </span>
    </div>
  );
}

export default async function VerificationPage() {
  const org = await prisma.org.findFirst();
  const units = await prisma.units.findMany({
    where: { active: true },
    orderBy: { idx: "asc" },
    include: {
      unit_key_objectives: { orderBy: { idx: "asc" } },
      pillars: { include: { measures: true, tactics: true } },
    },
  });
  const koWeights = await prisma.ko_weights.findMany();
  const weightFor = (key: string) =>
    (koWeights.find((w) => w.unit_key === key)?.weights as number[] | undefined) ?? null;

  const cards = units.map((u) => {
    const objectives = u.unit_key_objectives.map((m) => ({ progress: num(m.progress) }));
    const score = koScore(objectives, weightFor(u.key));
    const measures = u.pillars.reduce((a, p) => a + p.measures.length, 0);
    const tactics = u.pillars.reduce((a, p) => a + p.tactics.length, 0);
    return { key: u.key, name: u.name, real: u.real, score, pillars: u.pillars.length, objectives: objectives.length, measures, tactics };
  });

  return (
    <>
      <div className="banner">
        <span>
          <strong>R1 · stack verification.</strong> Next.js reading the live SMP database through
          Prisma, styled by the platform&apos;s own stylesheet.
        </span>
        <span>
          <strong>Not a ported screen.</strong> The real screens are step R3.
        </span>
      </div>

      <div className="wrap">
        <div className="view">
          <div className="section">
            <div className="section-h">
              <h2>{org?.org_name ?? "—"} — business units</h2>
            </div>
            <p className="sec-note">
              {units.length} active units read from the database. The dial is each unit&apos;s Key
              Objectives, computed on read — never stored (§5.1) — with weights applied where the
              tenant has set them, and nulls dropped rather than counted as zero (§5.7).
            </p>

            <div className="gauges g3">
              {cards.map((c) => (
                <div className="gwrap" key={c.key}>
                  <div className="gcard">
                    <div className="card-head">
                      <div className="gname">{c.name}</div>
                      <div className="gsub">
                        {c.pillars} pillars · {c.objectives} objectives
                        {c.real ? "" : " · illustrative"}
                      </div>
                    </div>
                    <div className="two">
                      <div className="box-obj">
                        <div className="boxlabel">
                          <span>Objectives</span>
                        </div>
                        <Gauge value={c.score} />
                      </div>
                      <div className="box-exec">
                        <div className="boxlabel">
                          <span>Content</span>
                        </div>
                        <dl className="led">
                          <dt>Measures</dt>
                          <dd>{c.measures}</dd>
                          <dt>Tactics</dt>
                          <dd>{c.tactics}</dd>
                          <dt>Objectives</dt>
                          <dd>{pct(c.score)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
