import Link from "next/link";
import { CONFLICT_LABEL, type Conflict, type Recommendation } from "@/lib/engine";
import { fmtRange } from "@/lib/dates";
import { cx, EmptyState, LevelBadge } from "./ui";

const KIND_STYLE: Record<Recommendation["kind"], string> = {
  hold: "bg-bad-600 text-white",
  verify: "bg-char-900 text-white",
  resequence: "bg-steel-600 text-white",
  reassign: "bg-steel-600 text-white",
  approve: "bg-ok-600 text-white",
  escalate: "bg-safety-500 text-white",
  notify: "bg-char-200 text-char-700",
};

export function RecommendationList({ recs, projectId, names, compact = false }: { recs: Recommendation[]; projectId: string; names: Record<string, string>; compact?: boolean }) {
  if (!recs.length) return <EmptyState>No corrective actions suggested.</EmptyState>;
  return (
    <ol className="divide-y divide-char-100">
      {recs.map((r) => (
        <li key={r.id} className="flex flex-col gap-1.5 px-4 py-3.5 sm:flex-row sm:gap-3 sm:px-5">
          <span className={cx("mt-0.5 h-fit w-fit flex-none rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", KIND_STYLE[r.kind])}>{r.kind}</span>
          <div className="min-w-0 text-sm">
            <p className="font-medium text-char-900">{r.action}</p>
            {!compact && <p className="mt-0.5 text-char-500">{r.rationale}</p>}
            <p className="mt-1 text-xs text-char-400">
              Owner: {r.owner} ·{" "}
              <Link className="hover:text-safety-600" href={`/app/projects/${projectId}/risks#${r.workPackageId}`}>
                {names[r.workPackageId]}
              </Link>{" "}
              · P{r.priority}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ConflictList({ conflicts }: { conflicts: Conflict[] }) {
  if (!conflicts.length) return <EmptyState>No schedule conflicts in the look-ahead window.</EmptyState>;
  return (
    <ul className="divide-y divide-char-100">
      {conflicts.map((c) => (
        <li key={c.id} className="px-4 py-3.5 sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            <LevelBadge level={c.severity} />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-char-500">{CONFLICT_LABEL[c.type]}</span>
            <span className="text-[11px] text-char-400">{fmtRange(c.window.start, c.window.end)}</span>
          </div>
          <p className="mt-1 text-sm font-medium text-char-900">{c.title}</p>
          <p className="mt-0.5 text-sm text-char-500">{c.detail}</p>
        </li>
      ))}
    </ul>
  );
}
