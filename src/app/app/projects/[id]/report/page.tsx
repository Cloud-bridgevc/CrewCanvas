import { AiSummary } from "@/components/AiSummary";
import { PrintButton } from "@/components/PrintButton";
import { LevelBadge, StateBadge } from "@/components/ui";
import { dailyReportTemplate } from "@/lib/ai/templates";
import { fmt, fmtDateTime, fmtRange } from "@/lib/dates";
import { buildDailyReport } from "@/lib/engine";
import { helpers, loadProject } from "@/lib/session";

export const metadata = { title: "Daily coordination report" };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { snap, analysis: a } = await loadProject(id);
  const h = helpers(snap);
  const r = buildDailyReport(snap, a);

  return (
    <article className="mx-auto max-w-4xl rounded-xl border border-char-200 bg-white print:border-0">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b-4 border-safety-500 px-4 py-5 sm:px-8 sm:py-6">
        <div>
          <p className="font-mono text-xs text-safety-600">{snap.project.code} · Daily coordination report</p>
          <h2 className="font-display text-xl font-bold text-char-900">{fmt(r.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</h2>
          <p className="text-sm text-char-500">{snap.project.name} · Prepared for the 6:30 AM foreman huddle</p>
        </div>
        <PrintButton />
      </header>

      <Section title="Superintendent summary">
        <AiSummary
          kind="daily_report"
          template={dailyReportTemplate(r)}
          facts={{
            date: r.date,
            blockers: r.blockers.map((b) => b.detail),
            conflicts: r.conflicts.map((c) => c.title),
            approvalsNeeded: r.approvalsNeeded.map((w) => w.name),
            startingSoon: r.startingSoon.map((w) => ({ name: w.name, start: w.startDate, readiness: a.readiness.get(w.id)!.label })),
            topActions: r.actions.slice(0, 5).map((x) => x.action),
          }}
        />
      </Section>

      <Section title={`Blockers (${r.blockers.length})`}>
        {r.blockers.length === 0 ? <p className="text-sm text-char-500">None recorded.</p> : (
          <ul className="space-y-2 text-sm">{r.blockers.map((b) => <li key={b.id} className="border-l-4 border-bad-600 pl-3"><strong>{b.title}</strong><br /><span className="text-char-600">{b.detail}</span></li>)}</ul>
        )}
      </Section>

      <Section title="Today's active work">
        <Table rows={r.active.map((w) => [w.name, `${h.sub(w.subcontractorId).name} · ${h.crew(w.crewId).name}`, `${w.percentComplete}%`, <StateBadge key="s" state={a.readiness.get(w.id)!.state} short />])} head={["Package", "Crew", "Progress", "Readiness"]} />
      </Section>

      <Section title="Starting in the next 5 days">
        <Table rows={r.startingSoon.map((w) => { const rr = a.readiness.get(w.id)!; return [w.name, fmtRange(w.startDate, w.endDate), `${rr.verifiedCount}/${rr.requiredCount}`, <StateBadge key="s" state={rr.state} short />]; })} head={["Package", "Window", "Verified", "Readiness"]} />
      </Section>

      <Section title={`Schedule conflicts (${r.conflicts.length})`}>
        <ul className="space-y-1.5 text-sm">{r.conflicts.map((c) => <li key={c.id} className="flex items-start gap-2"><LevelBadge level={c.severity} /><span>{c.title}</span></li>)}</ul>
      </Section>

      <Section title="Actions for today">
        <ol className="list-decimal space-y-2 pl-5 text-sm">{r.actions.map((x) => <li key={x.id}><span className="font-medium">{x.action}</span> <span className="text-char-500">— {x.owner}</span></li>)}</ol>
      </Section>

      <Section title="Readiness approvals needed">
        {r.approvalsNeeded.length === 0 ? <p className="text-sm text-char-500">None.</p> : <ul className="list-disc pl-5 text-sm">{r.approvalsNeeded.map((w) => <li key={w.id}>{w.name} — starts {fmt(w.startDate)}</li>)}</ul>}
      </Section>

      <Section title="Evidence received (last 72 h)">
        <ul className="space-y-1 text-sm">{r.recentEvidence.map((e) => <li key={e.id}>{e.title} <span className="text-char-500">· {h.person(e.submittedById)?.name}, {fmtDateTime(e.submittedAt)}</span></li>)}</ul>
      </Section>

      <footer className="border-t border-char-100 px-4 py-4 sm:px-8 text-xs text-char-500">
        Readiness states reflect verified checklist records and recorded approvals only. Generated summaries are advisory and do not authorize work.
      </footer>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-char-100 px-4 py-5 sm:px-8">
      <h3 className="mb-2.5 font-display text-sm font-bold uppercase tracking-wider text-char-700">{title}</h3>
      {children}
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  if (!rows.length) return <p className="text-sm text-char-500">None.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-[11px] uppercase tracking-wider text-char-500"><tr>{head.map((x) => <th key={x} className="py-1 pr-3 font-semibold">{x}</th>)}</tr></thead>
        <tbody className="divide-y divide-char-100">{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="py-2 pr-3">{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
