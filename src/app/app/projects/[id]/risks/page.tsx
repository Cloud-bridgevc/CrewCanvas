import Link from "next/link";
import { AiSummary } from "@/components/AiSummary";
import { ConflictList, RecommendationList } from "@/components/Lists";
import { Card, GroundingNote, LevelBadge, StateBadge } from "@/components/ui";
import { recommendationTemplate } from "@/lib/ai/templates";
import { fmtRange } from "@/lib/dates";
import { loadProject } from "@/lib/session";

export const metadata = { title: "Blockers & risk" };

export default async function RisksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { snap, analysis: a } = await loadProject(id);
  const names = Object.fromEntries(snap.workPackages.map((w) => [w.id, w.name]));
  const blockers = a.conflicts.filter((c) => c.type === "missing_prerequisite");

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Blockers" subtitle="Required checklist items not verified before scheduled work">
          <ConflictList conflicts={blockers} />
        </Card>
        <Card title="Schedule conflicts" subtitle="Crews, work windows, equipment and dependencies">
          <ConflictList conflicts={a.conflicts.filter((c) => c.type !== "missing_prerequisite")} />
        </Card>
      </div>

      <Card title="Readiness risk ranking" subtitle="Additive score — every point is explained below. Critical ≥ 70 · High ≥ 45 · Medium ≥ 20">
        <ol className="divide-y divide-char-100">
          {a.risks.map((r, i) => {
            const wp = snap.workPackages.find((w) => w.id === r.workPackageId)!;
            const recs = a.recommendations.filter((x) => x.workPackageId === wp.id);
            return (
              <li key={r.workPackageId} id={r.workPackageId} className="scroll-mt-24 px-4 py-5 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="font-display text-2xl font-bold tabular-nums text-char-300">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="font-display text-base font-bold text-char-900">{wp.name}</h3>
                      <p className="text-xs text-char-500">{fmtRange(wp.startDate, wp.endDate)} · {wp.zone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StateBadge state={a.readiness.get(wp.id)!.state} short />
                    <LevelBadge level={r.level} />
                    <span className="w-8 text-right font-display text-lg font-bold tabular-nums text-char-800">{r.score}</span>
                  </div>
                </div>
                <div className="mt-3 grid gap-4 lg:grid-cols-2">
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-char-500">Why this warning</div>
                    <ul className="list-disc space-y-1 pl-4 text-sm text-char-700">
                      {r.reasons.map((x) => <li key={x}>{x}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-char-500">Recommended actions</div>
                    {recs.length ? (
                      <div className="-mx-4 sm:-mx-5">
                        <RecommendationList recs={recs} projectId={id} names={names} compact />
                      </div>
                    ) : (
                      <p className="text-sm text-char-500">No action suggested.</p>
                    )}
                    {recs.length > 0 && i < 3 && (
                      <div className="mt-2 rounded-lg bg-char-50 p-3">
                        <AiSummary
                          kind="recommendation"
                          template={recommendationTemplate(recs)}
                          facts={{ workPackage: wp.name, readiness: a.readiness.get(wp.id)!.label, reasons: r.reasons, actions: recs.map((x) => ({ action: x.action, rationale: x.rationale, owner: x.owner })) }}
                        />
                      </div>
                    )}
                    <Link href={`/app/projects/${id}/readiness#${wp.id}`} className="mt-2 inline-block text-xs font-semibold text-safety-600">Open checklist →</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>
      <GroundingNote />
    </div>
  );
}
