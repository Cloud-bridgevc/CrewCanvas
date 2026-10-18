import Link from "next/link";
import { Card, GroundingNote, Kpi, LevelBadge, StateBadge } from "@/components/ui";
import { repo } from "@/lib/data";
import { analyzeProject } from "@/lib/engine";
import { diffDays, fmt, fmtRange } from "@/lib/dates";

export default async function PortfolioPage() {
  const projects = await repo.listProjects();
  const loaded = await Promise.all(
    projects.map(async (p) => {
      const snap = (await repo.getSnapshot(p.id))!;
      return { p, snap, a: analyzeProject(snap) };
    }),
  );
  const allRisks = loaded
    .flatMap(({ p, snap, a }) => a.risks.map((r) => ({ ...r, project: p, wp: snap.workPackages.find((w) => w.id === r.workPackageId)!, state: a.readiness.get(r.workPackageId)!.state })))
    .sort((x, y) => y.score - x.score)
    .slice(0, 8);
  const totals = loaded.reduce(
    (t, { a, snap }) => ({
      blocked: t.blocked + a.health.blocked,
      conflicts: t.conflicts + a.health.conflicts,
      approvals: t.approvals + a.health.awaitingApproval,
      active: t.active + snap.workPackages.filter((w) => w.status === "in_progress").length,
    }),
    { blocked: 0, conflicts: 0, approvals: 0, active: 0 },
  );
  const asOf = loaded[0]?.snap.asOf;

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-safety-600">Northline Builders · Portfolio</p>
          <h1 className="font-display text-2xl font-bold text-char-900">Project portfolio</h1>
        </div>
        <p className="text-sm text-char-500">As of {asOf && fmt(asOf, { weekday: "long", month: "long", day: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Active work packages" value={totals.active} />
        <Kpi label="Blocked packages" value={totals.blocked} tone={totals.blocked ? "bad" : "ok"} hint="Unverified prerequisites" />
        <Kpi label="Schedule conflicts" value={totals.conflicts} tone={totals.conflicts ? "warn" : "ok"} hint="Next 21 days" />
        <Kpi label="Awaiting approval" value={totals.approvals} tone="steel" hint="Verified, needs a person" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {loaded.map(({ p, snap, a }) => {
          const next = snap.workPackages.filter((w) => w.status === "not_started" && w.startDate >= snap.asOf).sort((x, y) => x.startDate.localeCompare(y.startDate))[0];
          const done = snap.workPackages.filter((w) => w.status === "complete").length;
          const pct = Math.round((diffDays(p.startDate, snap.asOf) / diffDays(p.startDate, p.endDate)) * 100);
          return (
            <Link key={p.id} href={`/app/projects/${p.id}`} className="group block min-w-0 rounded-xl border border-char-200 bg-white p-4 sm:p-5 transition hover:border-safety-500 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-[11px] text-safety-600">{p.code}</span>
                  <h2 className="font-display text-base font-bold leading-snug text-char-900 group-hover:text-safety-600">{p.name}</h2>
                  <p className="mt-0.5 text-xs text-char-500">{p.location} · {p.contractValue}</p>
                </div>
                <span className="rounded bg-char-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-char-600">{p.status}</span>
              </div>
              <p className="mt-2 text-xs text-char-500">{p.sector}</p>
              <div className="mt-4">
                <div className="flex justify-between text-[11px] text-char-500">
                  <span>{fmt(p.startDate, { month: "short", year: "numeric" })}</span>
                  <span>Time elapsed {Math.max(0, pct)}%</span>
                  <span>{fmt(p.endDate, { month: "short", year: "numeric" })}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-char-100">
                  <div className="h-full bg-steel-500" style={{ width: `${Math.max(2, Math.min(100, pct))}%` }} />
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-char-50 py-2">
                  <dt className="text-[10px] uppercase tracking-wide text-char-500">Blocked</dt>
                  <dd className={`font-display text-lg font-bold ${a.health.blocked ? "text-bad-600" : "text-char-800"}`}>{a.health.blocked}</dd>
                </div>
                <div className="rounded-lg bg-char-50 py-2">
                  <dt className="text-[10px] uppercase tracking-wide text-char-500">Conflicts</dt>
                  <dd className={`font-display text-lg font-bold ${a.health.conflicts ? "text-warn-600" : "text-char-800"}`}>{a.health.conflicts}</dd>
                </div>
                <div className="rounded-lg bg-char-50 py-2">
                  <dt className="text-[10px] uppercase tracking-wide text-char-500">Packages</dt>
                  <dd className="font-display text-lg font-bold text-char-800">{done}/{snap.workPackages.length}</dd>
                </div>
              </dl>
              {next && (
                <p className="mt-3 flex items-center justify-between gap-2 border-t border-char-100 pt-3 text-xs text-char-600">
                  <span className="truncate">Next: {next.name} · {fmt(next.startDate)}</span>
                  <StateBadge state={a.readiness.get(next.id)!.state} short />
                </p>
              )}
            </Link>
          );
        })}
      </div>

      <Card title="Highest-risk upcoming activities" subtitle="Ranked across the portfolio by unresolved dependencies, conflicts and time to start">
        <ul className="divide-y divide-char-100 md:hidden">
          {allRisks.map((r) => (
            <li key={r.workPackageId} className="px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/app/projects/${r.project.id}/risks#${r.workPackageId}`} className="font-medium leading-snug text-char-900">{r.wp.name}</Link>
                  <p className="font-mono text-[11px] text-char-500">{r.project.code} · {fmtRange(r.wp.startDate, r.wp.endDate)}</p>
                </div>
                <span className="flex flex-none items-center gap-1.5"><LevelBadge level={r.level} /><span className="text-xs tabular-nums text-char-500">{r.score}</span></span>
              </div>
              <div className="mt-2"><StateBadge state={r.state} short /></div>
              <p className="mt-1.5 text-sm text-char-600">{r.reasons[0]}</p>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-char-500">
              <tr>
                <th className="px-5 py-2 font-semibold">Activity</th>
                <th className="px-3 py-2 font-semibold">Window</th>
                <th className="px-3 py-2 font-semibold">Readiness</th>
                <th className="px-3 py-2 font-semibold">Risk</th>
                <th className="px-5 py-2 font-semibold">Top reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-char-100">
              {allRisks.map((r) => (
                <tr key={r.workPackageId} className="align-top">
                  <td className="px-5 py-3">
                    <Link href={`/app/projects/${r.project.id}/risks#${r.workPackageId}`} className="font-medium text-char-900 hover:text-safety-600">{r.wp.name}</Link>
                    <div className="font-mono text-[11px] text-char-500">{r.project.code} · {r.wp.code}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-char-600">{fmtRange(r.wp.startDate, r.wp.endDate)}</td>
                  <td className="px-3 py-3"><StateBadge state={r.state} short /></td>
                  <td className="px-3 py-3"><LevelBadge level={r.level} /> <span className="ml-1 tabular-nums text-char-500">{r.score}</span></td>
                  <td className="px-5 py-3 text-char-600">{r.reasons[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <GroundingNote />
    </div>
  );
}
