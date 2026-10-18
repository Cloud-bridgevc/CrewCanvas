import { AiSummary } from "@/components/AiSummary";
import { EvidenceForm } from "@/components/EvidenceForm";
import { Card, StateBadge } from "@/components/ui";
import { evidenceTemplate } from "@/lib/ai/templates";
import { fmtDateTime } from "@/lib/dates";
import { digestEvidence } from "@/lib/engine";
import { helpers, loadProject } from "@/lib/session";

export const metadata = { title: "Progress evidence" };

const TYPE_LABEL = { photo: "Photo", checklist_result: "Checklist result", progress_note: "Progress note", document: "Document" } as const;

export default async function EvidencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { snap, analysis } = await loadProject(id);
  const h = helpers(snap);
  const digests = digestEvidence(snap, analysis);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {digests.map((d) => (
          <Card
            key={d.workPackage.id}
            title={d.workPackage.name}
            subtitle={`${d.items.length} item${d.items.length > 1 ? "s" : ""} · ${d.checklist.verified}/${d.checklist.required} required checklist items verified`}
            action={<StateBadge state={analysis.readiness.get(d.workPackage.id)!.state} short />}
          >
            <div className="border-b border-char-100 bg-char-50/60 px-4 py-4 sm:px-5">
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-char-500">Activity summary</div>
              <AiSummary
                kind="evidence_summary"
                template={evidenceTemplate(d, snap)}
                facts={{
                  workPackage: d.workPackage.name,
                  status: d.workPackage.status,
                  readiness: analysis.readiness.get(d.workPackage.id)!.label,
                  progress: d.progress,
                  checklist: d.checklist,
                  evidence: d.items.map((e) => ({ type: e.type, title: e.title, body: e.body, by: h.person(e.submittedById)?.name, at: e.submittedAt })),
                }}
              />
            </div>
            <ul className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
              {d.items.map((e) => (
                <li key={e.id} className="overflow-hidden rounded-lg border border-char-200">
                  {e.type === "photo" ? (
                    <div className="photo-tile relative flex h-28 items-end p-2">
                      <span className="rounded bg-char-900/70 px-1.5 py-0.5 font-mono text-[10px] text-white">{e.s3Key?.split("/").pop()}</span>
                    </div>
                  ) : (
                    <div className="flex h-10 items-center gap-2 bg-steel-50 px-3 text-[11px] font-semibold uppercase tracking-wider text-steel-700">{TYPE_LABEL[e.type]}</div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-medium text-char-900">{e.title}</p>
                    {e.body && <p className="mt-1 text-xs text-char-600">{e.body}</p>}
                    <p className="mt-1.5 text-[11px] text-char-400">{h.person(e.submittedById)?.name} · {fmtDateTime(e.submittedAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <div>
        <Card title="Submit evidence" subtitle="Photos and PDFs upload directly to Amazon S3" className="lg:sticky lg:top-6">
          <EvidenceForm projectId={id} workPackages={snap.workPackages.filter((w) => w.status !== "complete").map((w) => ({ id: w.id, name: w.name }))} />
        </Card>
      </div>
    </div>
  );
}
