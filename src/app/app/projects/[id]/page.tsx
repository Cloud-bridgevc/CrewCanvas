import Link from "next/link";
import { Gantt } from "@/components/Gantt";
import { ConflictList, RecommendationList } from "@/components/Lists";
import { Card, GroundingNote, Kpi, StateBadge } from "@/components/ui";
import { fmt, fmtDateTime } from "@/lib/dates";
import { projectedEnd } from "@/lib/engine";
import { loadProject } from "@/lib/session";

export default async function ProjectOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { snap, analysis: a } = await loadProject(id);
  const states = Object.fromEntries([...a.readiness].map(([k, r]) => [k, r.state]));
  const names = Object.fromEntries(snap.workPackages.map((w) => [w.id, w.name]));
  const projected = Object.fromEntries(snap.workPackages.map((w) => [w.id, projectedEnd(w, snap.asOf)]));
  const pct = Math.round(snap.workPackages.reduce((s, w) => s + w.percentComplete, 0) / snap.workPackages.length);
  const evidence = [...snap.evidence].sort((x, y) => y.submittedAt.localeCompare(x.submittedAt)).slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 [&>*:last-child]:col-span-2 md:[&>*:last-child]:col-span-1">
        <Kpi label="Readiness health" value={`${a.health.score}`} hint="100 = no blockers or conflicts" tone={a.health.score < 60 ? "bad" : a.health.score < 80 ? "warn" : "ok"} />
        <Kpi label="Blocked" value={a.health.blocked} tone={a.health.blocked ? "bad" : "ok"} />
        <Kpi label="Conflicts" value={a.health.conflicts} tone={a.health.conflicts ? "warn" : "ok"} />
        <Kpi label="Awaiting approval" value={a.health.awaitingApproval} tone="steel" />
        <Kpi label="Package progress" value={`${pct}%`} hint={`${snap.workPackages.length} work packages`} />
      </div>

      <Card
        title="Project timeline"
        subtitle="Bars colored by readiness state · arrows are finish-to-start dependencies · dashed outline = projected finish at current production"
        action={<Legend />}
      >
        <div className="py-2">
          <Gantt workPackages={snap.workPackages} dependencies={snap.dependencies} states={states} asOf={snap.asOf} projected={projected} highlight={a.risks.filter((r) => r.level === "critical").map((r) => r.workPackageId)} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Act now" subtitle="Priority-1 corrective actions" action={<Link className="text-xs font-semibold text-safety-600" href={`/app/projects/${id}/risks`}>All actions →</Link>}>
          <RecommendationList recs={a.recommendations.filter((r) => r.priority === 1)} projectId={id} names={names} compact />
        </Card>
        <Card title="Schedule conflicts" subtitle="Next 21 days" action={<Link className="text-xs font-semibold text-safety-600" href={`/app/projects/${id}/risks`}>Risk view →</Link>}>
          <ConflictList conflicts={a.conflicts.slice(0, 4)} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Starting soon">
          <ul className="divide-y divide-char-100">
            {snap.workPackages
              .filter((w) => w.status !== "complete" && w.startDate >= snap.asOf)
              .sort((x, y) => x.startDate.localeCompare(y.startDate))
              .slice(0, 6)
              .map((w) => {
                const r = a.readiness.get(w.id)!;
                return (
                  <li key={w.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-char-900">{w.name}</p>
                      <p className="text-xs text-char-500">{fmt(w.startDate)} · {r.verifiedCount}/{r.requiredCount} required items verified</p>
                    </div>
                    <StateBadge state={r.state} short />
                  </li>
                );
              })}
          </ul>
        </Card>
        <Card title="Latest evidence" action={<Link className="text-xs font-semibold text-safety-600" href={`/app/projects/${id}/evidence`}>Evidence →</Link>}>
          <ul className="divide-y divide-char-100">
            {evidence.map((e) => (
              <li key={e.id} className="px-4 py-3 sm:px-5">
                <p className="text-sm font-medium text-char-900">{e.title}</p>
                <p className="text-xs text-char-500">{names[e.workPackageId]} · {fmtDateTime(e.submittedAt)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <GroundingNote />
    </div>
  );
}

function Legend() {
  const items: [string, string][] = [["#c23b3b", "Blocked"], ["#d99a06", "Outstanding"], ["#5b7a99", "Awaiting approval"], ["#2f9e6b", "Approved"], ["#8a9199", "Complete"]];
  return (
    <div className="hidden flex-wrap gap-3 text-[11px] text-char-500 md:flex">
      {items.map(([c, l]) => (
        <span key={l} className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded-sm" style={{ background: c }} />{l}</span>
      ))}
    </div>
  );
}
