"use client";

import { useState, useTransition } from "react";
import { approveWorkPackage, revokeApproval, setChecklistStatus, type ActionResult } from "@/app/app/actions";
import type { ReadinessResult } from "@/lib/engine";
import type { ChecklistStatus, Person } from "@/lib/types";
import { fmt, fmtDateTime } from "@/lib/dates";
import { cx, StateBadge } from "./ui";

const STATUS_STYLE: Record<ChecklistStatus, string> = {
  verified: "bg-ok-100 text-ok-600",
  pending: "bg-warn-100 text-warn-600",
  failed: "bg-bad-100 text-bad-600",
  not_applicable: "bg-char-100 text-char-500",
};

interface Props {
  projectId: string;
  wp: { id: string; name: string; code: string; startDate: string; endDate: string; crew: string };
  readiness: ReadinessResult;
  people: Person[];
  user: Person;
  canApproveRole: boolean;
}

export function ReadinessPanel({ projectId, wp, readiness: r, people, user, canApproveRole }: Props) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [notes, setNotes] = useState("");
  const name = (id?: string) => people.find((p) => p.id === id)?.name ?? "—";
  const run = (fn: () => Promise<ActionResult>) => start(async () => setResult(await fn()));
  const approvalBlockedReason =
    r.outstanding.length > 0
      ? `${r.outstanding.length} required item${r.outstanding.length > 1 ? "s" : ""} not verified`
      : !canApproveRole
        ? `${user.name} cannot approve (superintendent or PM only)`
        : null;

  return (
    <section id={wp.id} className={cx("scroll-mt-24 overflow-hidden rounded-xl border bg-white", r.state === "blocked" ? "border-bad-600/40" : "border-char-200")}>
      {r.state === "blocked" && <div className="hazard-stripe h-1.5" />}
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-char-100 px-4 py-4 sm:px-5">
        <div>
          <p className="font-mono text-[11px] text-char-500">{wp.code} · {fmt(wp.startDate)}–{fmt(wp.endDate)} · {wp.crew}</p>
          <h3 className="font-display text-base font-bold text-char-900">{wp.name}</h3>
          <p className="mt-0.5 text-xs text-char-500">
            {r.verifiedCount} of {r.requiredCount} required items verified
            {r.daysUntilStart > 0 ? ` · starts in ${r.daysUntilStart} day${r.daysUntilStart > 1 ? "s" : ""}` : " · active"}
          </p>
        </div>
        <StateBadge state={r.state} />
      </header>

      <ul className="divide-y divide-char-100">
        {r.items.map((c) => (
          <li key={c.id} className="grid gap-2.5 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cx("rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", STATUS_STYLE[c.status])}>{c.status.replace("_", " ")}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-char-400">{c.category}{c.required ? "" : " · optional"}</span>
                {r.blocking.some((b) => b.id === c.id) && <span className="text-[10px] font-bold uppercase tracking-wider text-bad-600">Blocking</span>}
              </div>
              <p className="mt-1 text-sm font-medium text-char-900">{c.label}</p>
              <p className="mt-0.5 text-xs text-char-500">
                {c.responsibleParty}
                {c.dueBy && c.status !== "verified" ? ` · due ${fmt(c.dueBy)}` : ""}
                {c.status === "verified" && c.verifiedAt ? ` · verified by ${name(c.verifiedById)}, ${fmtDateTime(c.verifiedAt)}` : ""}
                {c.evidenceIds.length ? ` · ${c.evidenceIds.length} evidence` : ""}
              </p>
              {c.notes && <p className="mt-1 text-xs italic text-char-500">{c.notes}</p>}
            </div>
            <div className="grid grid-cols-3 gap-1 sm:flex">
              {(["verified", "pending", "failed"] as const).map((s) => (
                <button
                  key={s}
                  disabled={pending || c.status === s}
                  onClick={() => run(() => setChecklistStatus(projectId, c.id, s))}
                  className={cx(
                    "rounded-md border px-2 py-2 text-xs font-medium capitalize transition disabled:cursor-default sm:py-1",
                    c.status === s ? "border-transparent bg-char-900 text-white" : "border-char-200 text-char-600 hover:border-char-400 disabled:opacity-50",
                  )}
                >
                  {s === "verified" ? "Verify" : s}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <footer className="space-y-3 border-t border-char-100 bg-char-50 px-4 py-4 sm:px-5">
        {r.approvalStatus === "valid" && r.approval ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-char-700">
              <strong className="text-ok-600">Approved for work</strong> by {name(r.approval.approvedById)} · {fmtDateTime(r.approval.approvedAt)}
              {r.approval.notes ? ` — “${r.approval.notes}”` : ""}
            </p>
            {canApproveRole && (
              <button disabled={pending} onClick={() => run(() => revokeApproval(projectId, r.approval!.id, ""))} className="rounded-md border border-char-300 px-3 py-1.5 text-xs font-medium text-char-700 hover:border-bad-600 hover:text-bad-600">
                Revoke approval
              </button>
            )}
          </div>
        ) : r.state === "complete" ? (
          <p className="text-sm text-char-500">Work package complete.</p>
        ) : (
          <div className="space-y-2">
            {r.approvalStatus === "invalidated" && <p className="text-xs font-medium text-bad-600">{r.approvalNote}</p>}
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Approval notes (optional)"
                className="min-w-0 flex-1 rounded-md border border-char-200 bg-white px-3 py-2 text-sm sm:py-1.5"
                disabled={!!approvalBlockedReason}
              />
              <button
                disabled={pending || !!approvalBlockedReason}
                onClick={() => run(() => approveWorkPackage(projectId, wp.id, notes))}
                className="rounded-md bg-safety-500 px-4 py-2.5 text-sm sm:py-1.5 font-semibold text-white hover:bg-safety-600 disabled:cursor-not-allowed disabled:bg-char-300"
              >
                Record readiness approval
              </button>
            </div>
            <p className="text-xs text-char-500">
              {approvalBlockedReason
                ? `Approval unavailable: ${approvalBlockedReason}.`
                : `You are approving as ${user.name}. This records your decision against the ${r.verifiedCount} verified items above.`}
            </p>
          </div>
        )}
        {result && <p className={cx("text-xs font-medium", result.ok ? "text-ok-600" : "text-bad-600")}>{result.ok ? result.message : result.error}</p>}
      </footer>
    </section>
  );
}
