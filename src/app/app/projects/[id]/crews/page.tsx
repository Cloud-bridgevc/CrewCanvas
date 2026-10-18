import { Card } from "@/components/ui";
import { addDays, eachDay, fmt, weekday } from "@/lib/dates";
import { helpers, loadProject } from "@/lib/session";
import { repo } from "@/lib/data";

export const metadata = { title: "Crew availability" };

export default async function CrewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ snap }, projects] = await Promise.all([loadProject(id), repo.listProjects()]);
  const h = helpers(snap);
  const days = eachDay(addDays(snap.asOf, 0), addDays(snap.asOf, 20));
  const crewIds = [...new Set(snap.workPackages.filter((w) => w.status !== "complete").map((w) => w.crewId))];
  const assignments = [...snap.workPackages, ...snap.externalAssignments].filter((w) => w.status !== "complete");

  return (
    <div className="space-y-6">
      <Card title="Crew availability — next 3 weeks" subtitle="Assignments across all projects, recorded unavailability and double-bookings">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 min-w-[140px] bg-white px-3 py-2 sm:min-w-[220px] sm:px-5 text-left text-[11px] font-semibold uppercase tracking-wider text-char-500">Crew</th>
                {days.map((d) => (
                  <th key={d} className={`min-w-[40px] px-0.5 sm:min-w-[52px] py-2 text-center font-medium ${weekday(d) === 0 ? "text-char-300" : "text-char-500"}`}>
                    <div className="text-[10px]">{"SMTWTFS"[weekday(d)]}</div>
                    <div>{fmt(d, { day: "numeric" })}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {crewIds.map((cid) => {
                const crew = h.crew(cid);
                return (
                  <tr key={cid}>
                    <td className="sticky left-0 z-10 border-t border-r border-char-100 bg-white px-3 py-2 sm:border-r-0 sm:px-5">
                      <div className="font-medium text-char-900">{h.sub(crew.subcontractorId).name}</div>
                      <div className="text-char-500">{crew.name} · {crew.headcount}<span className="hidden sm:inline"> workers · {crew.foreman}</span></div>
                    </td>
                    {days.map((d) => {
                      const jobs = assignments.filter((w) => w.crewId === cid && w.startDate <= d && w.endDate >= d);
                      const av = snap.availability.find((a) => a.crewId === cid && a.startDate <= d && a.endDate >= d);
                      const sunday = weekday(d) === 0;
                      let cls = "bg-white";
                      if (jobs.length > 1) cls = "bg-bad-100 text-bad-600 ring-1 ring-inset ring-bad-600/40";
                      else if (av?.status === "unavailable") cls = "hazard-stripe opacity-70";
                      else if (jobs.length === 1) cls = jobs[0].projectId === id ? "bg-steel-100 text-steel-700" : "bg-char-100 text-char-600";
                      if (av?.status === "reduced" && jobs.length) cls += " outline outline-2 -outline-offset-2 outline-warn-600";
                      return (
                        <td key={d} className={`border-t border-l border-char-100 p-0.5 text-center ${sunday ? "bg-char-50" : ""}`}>
                          <div className={`flex h-9 flex-col items-center justify-center rounded font-mono text-[10px] leading-tight ${cls}`} title={[...jobs.map((j) => `${j.name} (${projects.find((p) => p.id === j.projectId)?.code})`), av ? `${av.status}: ${av.reason}` : ""].filter(Boolean).join("\n")}>
                            {jobs.map((j) => <span key={j.id}>{j.code.split("-")[1]}</span>)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-char-100 px-4 py-3 sm:px-5 text-[11px] text-char-500">
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-4 rounded bg-steel-100" />This project</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-4 rounded bg-char-100" />Other project</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-4 rounded bg-bad-100 ring-1 ring-bad-600/40" />Double-booked</span>
          <span className="inline-flex items-center gap-1.5"><span className="hazard-stripe h-3 w-4 rounded opacity-70" />Unavailable</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-4 rounded outline outline-2 -outline-offset-2 outline-warn-600" />Reduced capacity</span>
        </div>
      </Card>

      <Card title="Recorded availability exceptions">
        <ul className="divide-y divide-char-100">
          {snap.availability.filter((a) => crewIds.includes(a.crewId)).map((a) => {
            const c = h.crew(a.crewId);
            return (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm sm:px-5">
                <span><strong className="text-char-900">{h.sub(c.subcontractorId).name} {c.name}</strong> <span className="text-char-500">— {a.reason}</span></span>
                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${a.status === "unavailable" ? "bg-bad-100 text-bad-600" : "bg-warn-100 text-warn-600"}`}>{a.status} · {fmt(a.startDate)}{a.endDate !== a.startDate ? `–${fmt(a.endDate)}` : ""}</span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
