import { ReadinessPanel } from "@/components/ReadinessPanel";
import { GroundingNote } from "@/components/ui";
import { helpers, currentUser, loadProject } from "@/lib/session";
import { APPROVER_ROLES } from "@/lib/types";

export const metadata = { title: "Site readiness" };

export default async function ReadinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ snap, analysis }, user] = await Promise.all([loadProject(id), currentUser()]);
  const h = helpers(snap);
  const order = { blocked: 0, awaiting_approval: 1, not_verified: 2, approved: 3, complete: 4 };
  const wps = snap.workPackages
    .filter((w) => w.status !== "complete")
    .sort((a, b) => order[analysis.readiness.get(a.id)!.state] - order[analysis.readiness.get(b.id)!.state] || a.startDate.localeCompare(b.startDate));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Site readiness checklists</h2>
          <p className="text-sm text-char-500">Record verification results, then an authorized superintendent or PM records the readiness decision.</p>
        </div>
      </div>
      <GroundingNote />
      <div className="grid gap-5 xl:grid-cols-2">
        {wps.map((w) => (
          <ReadinessPanel
            key={w.id}
            projectId={id}
            wp={{ id: w.id, name: w.name, code: w.code, startDate: w.startDate, endDate: w.endDate, crew: `${h.sub(w.subcontractorId).name} · ${h.crew(w.crewId).name}` }}
            readiness={analysis.readiness.get(w.id)!}
            people={snap.people}
            user={user}
            canApproveRole={APPROVER_ROLES.includes(user.role)}
          />
        ))}
      </div>
    </div>
  );
}
