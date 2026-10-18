import { Card, StateBadge } from "@/components/ui";
import { fmt, fmtRange } from "@/lib/dates";
import { loadProject } from "@/lib/session";

export const metadata = { title: "Subcontractors" };

export default async function SubcontractorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { snap, analysis } = await loadProject(id);
  const subIds = new Set(snap.workPackages.map((w) => w.subcontractorId));
  const subs = snap.subcontractors.filter((s) => subIds.has(s.id) || snap.checklist.some((c) => c.responsibleParty === s.name && c.status !== "verified"));

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {subs.map((s) => {
        const wps = snap.workPackages.filter((w) => w.subcontractorId === s.id).sort((a, b) => a.startDate.localeCompare(b.startDate));
        const crews = snap.crews.filter((c) => c.subcontractorId === s.id);
        const owed = snap.checklist.filter((c) => c.responsibleParty === s.name && c.status !== "verified" && c.status !== "not_applicable");
        return (
          <Card key={s.id} title={s.name} subtitle={s.trade}>
            <div className="space-y-4 px-4 py-4 text-sm sm:px-5">
              <div className="text-xs text-char-600">
                <div>{s.contactName} · <a className="text-steel-600 hover:underline" href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a></div>
                <div>{s.phone}</div>
                <div className="mt-1 text-char-400">{crews.map((c) => `${c.name} (${c.headcount})`).join(" · ") || "Inspection agency — no crews"}</div>
              </div>
              {wps.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-char-500">Assignments</div>
                  <ul className="space-y-2">
                    {wps.map((w) => (
                      <li key={w.id} className="flex items-start justify-between gap-2">
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-char-900">{w.name}</span>
                          <span className="text-xs text-char-500">{fmtRange(w.startDate, w.endDate)}</span>
                        </span>
                        <StateBadge state={analysis.readiness.get(w.id)!.state} short />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {owed.length > 0 && (
                <div className="rounded-lg border border-warn-600/30 bg-warn-100/50 p-3">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-warn-600">Owes verification</div>
                  <ul className="space-y-1 text-xs text-char-700">
                    {owed.map((c) => <li key={c.id}>{c.label}{c.dueBy ? ` — due ${fmt(c.dueBy)}` : ""}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
