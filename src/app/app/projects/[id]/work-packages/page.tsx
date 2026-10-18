import { Card, StateBadge } from "@/components/ui";
import { fmt, fmtRange } from "@/lib/dates";
import { earliestSuccessorStart, expectedPercent, projectedEnd } from "@/lib/engine";
import { helpers, loadProject } from "@/lib/session";

export const metadata = { title: "Work packages" };

export default async function WorkPackagesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { snap, analysis } = await loadProject(id);
  const h = helpers(snap);
  const wps = [...snap.workPackages].sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <div className="space-y-6">
      <Card title="Work packages" subtitle={`${wps.length} packages · scope, assignments and readiness`}>
        {/* Phones: one card per package instead of a 7-column table. */}
        <ul className="divide-y divide-char-100 md:hidden">
          {wps.map((w) => {
            const preds = snap.dependencies.filter((d) => d.successorId === w.id);
            const proj = projectedEnd(w, snap.asOf);
            return (
              <li key={w.id} className="space-y-2 px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium leading-snug text-char-900">{w.name}</p>
                    <p className="font-mono text-[11px] text-char-500">{w.code} · {w.trade}</p>
                  </div>
                  <StateBadge state={analysis.readiness.get(w.id)!.state} short />
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <div><dt className="text-char-400">Window</dt><dd className="text-char-700">{fmtRange(w.startDate, w.endDate)}</dd></div>
                  <div><dt className="text-char-400">Zone</dt><dd className="text-char-700">{w.zone}{w.exclusiveZone ? " · exclusive" : ""}</dd></div>
                  <div className="col-span-2"><dt className="text-char-400">Crew</dt><dd className="text-char-700">{h.sub(w.subcontractorId).name} · {h.crew(w.crewId).name}</dd></div>
                  {preds.length > 0 && (
                    <div className="col-span-2"><dt className="text-char-400">Depends on</dt><dd className="text-char-700">{preds.map((d) => `${h.wp(d.predecessorId).name} (FS${d.lagDays ? `+${d.lagDays}d` : ""})`).join(", ")}</dd></div>
                  )}
                </dl>
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-char-100"><div className="h-full bg-steel-500" style={{ width: `${w.percentComplete}%` }} /></div>
                  <span className="tabular-nums text-char-600">{w.percentComplete}%</span>
                  {w.status === "in_progress" && proj > w.endDate && <span className="text-bad-600">trending {fmt(proj)}</span>}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-char-500">
              <tr>
                <th className="px-5 py-2 font-semibold">Package</th>
                <th className="px-3 py-2 font-semibold">Zone</th>
                <th className="px-3 py-2 font-semibold">Subcontractor · crew</th>
                <th className="px-3 py-2 font-semibold">Window</th>
                <th className="px-3 py-2 font-semibold">Progress</th>
                <th className="px-3 py-2 font-semibold">Depends on</th>
                <th className="px-5 py-2 font-semibold">Readiness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-char-100">
              {wps.map((w) => {
                const preds = snap.dependencies.filter((d) => d.successorId === w.id);
                const exp = expectedPercent(w, snap.asOf);
                const proj = projectedEnd(w, snap.asOf);
                return (
                  <tr key={w.id} className="align-top">
                    <td className="px-5 py-3">
                      <div className="font-medium text-char-900">{w.name}</div>
                      <div className="font-mono text-[11px] text-char-500">{w.code} · {w.trade}{w.equipment.length ? ` · ${w.equipment.join(", ")}` : ""}</div>
                    </td>
                    <td className="px-3 py-3 text-char-600">
                      {w.zone}
                      {w.exclusiveZone && <span className="ml-1 rounded bg-char-100 px-1 text-[10px] font-semibold uppercase text-char-500">exclusive</span>}
                    </td>
                    <td className="px-3 py-3 text-char-600">{h.sub(w.subcontractorId).name}<div className="text-xs text-char-400">{h.crew(w.crewId).name}</div></td>
                    <td className="whitespace-nowrap px-3 py-3 text-char-600">{fmtRange(w.startDate, w.endDate)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-char-100"><div className="h-full bg-steel-500" style={{ width: `${w.percentComplete}%` }} /></div>
                        <span className="tabular-nums text-char-600">{w.percentComplete}%</span>
                      </div>
                      {w.status === "in_progress" && (
                        <div className={`mt-1 text-xs ${proj > w.endDate ? "text-bad-600" : "text-char-400"}`}>
                          plan {exp}%{proj > w.endDate ? ` · trending ${fmt(proj)}` : ""}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-char-600">
                      {preds.length === 0 ? <span className="text-char-400">—</span> : preds.map((d) => {
                        const p = h.wp(d.predecessorId);
                        return (
                          <div key={d.id}>
                            <span className="font-mono">{p.code}</span> FS{d.lagDays ? `+${d.lagDays}d` : ""} <span className="text-char-400">· {p.status === "complete" ? "done" : `earliest ${fmt(earliestSuccessorStart(projectedEnd(p, snap.asOf), d))}`}</span>
                          </div>
                        );
                      })}
                    </td>
                    <td className="px-5 py-3"><StateBadge state={analysis.readiness.get(w.id)!.state} short /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Dependency network" subtitle="Finish-to-start links with lag and rationale">
        <ul className="grid gap-px bg-char-100 sm:grid-cols-2">
          {snap.dependencies.map((d) => {
            const p = h.wp(d.predecessorId);
            const s = h.wp(d.successorId);
            return (
              <li key={d.id} className="bg-white px-4 py-3 text-sm sm:px-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-char-900">{p.name}</span>
                  <span className="rounded bg-steel-100 px-1.5 font-mono text-[10px] text-steel-700">FS{d.lagDays ? `+${d.lagDays}d` : ""} →</span>
                  <span className="font-medium text-char-900">{s.name}</span>
                </div>
                {d.note && <p className="mt-0.5 text-xs text-char-500">{d.note}</p>}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
