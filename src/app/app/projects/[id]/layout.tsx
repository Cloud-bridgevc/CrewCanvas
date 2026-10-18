import { ProjectTabs } from "@/components/AppChrome";
import { loadProject } from "@/lib/session";

export default async function ProjectLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { snap, analysis } = await loadProject(id);
  const p = snap.project;
  const supt = snap.people.find((x) => x.id === p.superintendentId);
  const pm = snap.people.find((x) => x.id === p.projectManagerId);
  return (
    <div>
      <div className="border-b border-char-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-safety-600">{p.code} · {p.client}</p>
              <h1 className="font-display text-xl font-bold leading-tight text-char-900 sm:text-2xl">{p.name}</h1>
              <p className="mt-0.5 text-sm text-char-500">{p.location} · {p.sector}</p>
            </div>
            <div className="flex flex-wrap gap-x-4 text-xs text-char-500 sm:block sm:text-right">
              <div>Superintendent <strong className="text-char-800">{supt?.name}</strong></div>
              <div>Project manager <strong className="text-char-800">{pm?.name}</strong></div>
            </div>
          </div>
          <div className="-mx-4 mt-3 px-4 sm:mx-0 sm:mt-4 sm:px-0">
            <ProjectTabs projectId={id} counts={{ "/risks": analysis.health.blocked, "/readiness": analysis.health.awaitingApproval }} />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</div>
    </div>
  );
}
