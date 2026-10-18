"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import * as seed from "@/lib/data/seed";
import { snapshotFrom } from "@/lib/data/memory";
import { analyzeProject, canApprove, CONFLICT_LABEL } from "@/lib/engine";
import { fmt } from "@/lib/dates";
import type { Approval, ChecklistItem, ChecklistStatus } from "@/lib/types";
import { cx, StateBadge } from "../ui";

const WP = "wp-200";
const initial = () => structuredClone({ checklist: seed.checklist, approvals: seed.approvals, evidence: seed.evidence });

export function ReadinessDemo() {
  const [data, setData] = useState(initial);
  const [flash, setFlash] = useState(false);
  const snap = useMemo(() => snapshotFrom("hpm", data)!, [data]);
  const a = useMemo(() => analyzeProject(snap), [snap]);
  const wp = snap.workPackages.find((w) => w.id === WP)!;
  const r = a.readiness.get(WP)!;
  const recs = a.recommendations.filter((x) => x.workPackageId === WP);
  const warning = a.conflicts.find((c) => c.workPackageIds[0] === WP && c.type === "missing_prerequisite");
  const risk = a.risks.find((x) => x.workPackageId === WP);
  const items = r.items.filter((c) => c.required);
  const dock = snap.workPackages.find((w) => w.id === "wp-210")!;
  const swapSuggested = recs.some((x) => x.kind === "resequence");

  // Highlight the recommendation panel whenever the top action changes.
  const topAction = recs[0]?.id;
  const prev = useRef(topAction);
  useEffect(() => {
    if (prev.current !== topAction) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1200);
      prev.current = topAction;
      return () => clearTimeout(t);
    }
  }, [topAction]);

  const setStatus = (id: string, status: ChecklistStatus) =>
    setData((d) => ({
      ...d,
      checklist: d.checklist.map((c): ChecklistItem =>
        c.id === id ? { ...c, status, ...(status === "verified" ? { verifiedById: "p-priya", verifiedAt: new Date().toISOString() } : { verifiedById: undefined, verifiedAt: undefined }) } : c,
      ),
    }));

  const approve = () => {
    if (!canApprove(r).ok) return;
    const ap: Approval = { id: `demo-${Date.now()}`, workPackageId: WP, approvedById: "p-dana", approvedAt: new Date().toISOString(), verifiedItemIds: r.items.filter((c) => c.status === "verified").map((c) => c.id) };
    setData((d) => ({ ...d, approvals: [...d.approvals, ap] }));
  };
  const gate = canApprove(r);

  return (
    <div className="min-w-0 overflow-clip rounded-2xl border border-char-700 bg-char-900 text-white shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-char-700 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2 text-xs text-char-400">
          <span className="h-2.5 w-2.5 rounded-full bg-bad-600" /><span className="h-2.5 w-2.5 rounded-full bg-warn-600" /><span className="h-2.5 w-2.5 rounded-full bg-ok-600" />
          <span className="ml-2 font-mono">Harbor Point Medical Pavilion · fictional project · Mon Oct 19</span>
        </div>
        <button onClick={() => setData(initial())} className="rounded border border-char-600 px-2.5 py-1 text-xs text-char-300 hover:text-white">Reset scenario</button>
      </div>

      {/* Phones: the result panel sits below the checklist, so pin a summary while toggling. */}
      <div className="sticky top-16 z-10 flex items-center gap-2 border-b border-char-700 bg-char-900/95 px-4 py-2.5 backdrop-blur lg:hidden" aria-live="polite">
        <StateBadge state={r.state} short />
        <span className="font-mono text-[11px] text-char-400">{r.verifiedCount}/{r.requiredCount}</span>
        <span className="min-w-0 flex-1 truncate text-right text-xs text-char-200">
          {recs[0] ? <><span className="font-bold uppercase text-safety-400">{recs[0].kind}</span> · {recs[0].action}</> : "No action needed"}
        </span>
      </div>

      <div className="grid lg:grid-cols-[1.05fr_1fr]">
        {/* Checklist */}
        <div className="border-b border-char-700 p-4 sm:p-5 lg:border-b-0 lg:border-r">
          <p className="font-mono text-[11px] text-safety-400">03-200 · {fmt(wp.startDate, { weekday: "short", month: "short", day: "numeric" })}–{fmt(wp.endDate)} · Summit Concrete Placement Crew 1</p>
          <h3 className="font-display text-lg font-bold">Level 2 slab-on-deck pour</h3>
          <p className="mt-1 text-xs text-char-400">Toggle a result to see how CrewCanvas reacts. Only recorded results count.</p>
          <ul className="mt-4 space-y-2">
            {items.map((c) => (
              <li key={c.id} className={cx("rounded-lg border p-3 transition", c.status === "verified" ? "border-char-700 bg-char-800/60" : c.status === "failed" ? "border-bad-600/60 bg-bad-600/10" : "border-warn-600/60 bg-warn-600/10")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">{c.label}</p>
                    <p className="mt-0.5 text-[11px] text-char-400">{c.category} · {c.responsibleParty}</p>
                  </div>
                  <div className="flex flex-none rounded-md bg-char-950 p-0.5 text-[11px] font-semibold" role="group" aria-label={`Result for ${c.label}`}>
                    {(["verified", "pending", "failed"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(c.id, s)}
                        aria-pressed={c.status === s}
                        className={cx("min-w-9 rounded px-2 py-1.5 capitalize transition sm:min-w-0 sm:py-1", c.status === s ? (s === "verified" ? "bg-ok-600 text-white" : s === "failed" ? "bg-bad-600 text-white" : "bg-warn-600 text-white") : "text-char-400 hover:text-white")}
                      >
                        {s === "verified" ? "✓" : s === "failed" ? "✕" : "…"}
                        <span className="sr-only">{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Engine output */}
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-char-400">Readiness</span>
            <StateBadge state={r.state} />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-char-700">
              <div className={cx("h-full transition-all", r.state === "blocked" ? "bg-bad-600" : r.state === "approved" ? "bg-ok-600" : "bg-steel-400")} style={{ width: `${(r.verifiedCount / r.requiredCount) * 100}%` }} />
            </div>
            <span className="font-mono text-xs text-char-300">{r.verifiedCount}/{r.requiredCount} verified</span>
            {risk && <span className="font-mono text-xs text-char-300">risk {risk.score}</span>}
          </div>

          {warning ? (
            <div className="rounded-lg border border-bad-600/60 bg-bad-600/15 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-bad-100">⚠ {CONFLICT_LABEL[warning.type]} · {warning.severity}</p>
              <p className="mt-1 text-sm">{warning.detail}</p>
            </div>
          ) : r.state === "awaiting_approval" ? (
            <div className="rounded-lg border border-steel-400/50 bg-steel-500/15 p-3 text-sm">
              All required items are verified. CrewCanvas does <strong>not</strong> release the pour — a superintendent or PM must record the decision.
            </div>
          ) : r.state === "approved" ? (
            <div className="rounded-lg border border-ok-600/60 bg-ok-600/15 p-3 text-sm">
              Approved for work by Dana Ruiz (Superintendent) against {r.approval?.verifiedItemIds.length} verified items. Reopening any item voids this approval.
            </div>
          ) : null}

          <div className={cx("rounded-lg border p-3 transition-colors duration-700", flash ? "border-safety-500 bg-safety-500/15" : "border-char-700 bg-char-800/50")}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-char-400">Recommended action</span>
              {flash && <span className="text-[11px] font-bold text-safety-400">Updated</span>}
            </div>
            {recs.length ? (
              <ol className="space-y-2">
                {recs.slice(0, 3).map((x, i) => (
                  <li key={x.id} className="flex gap-2 text-sm">
                    <span className={cx("mt-0.5 h-fit rounded px-1.5 py-0.5 text-[10px] font-bold uppercase", i === 0 ? "bg-safety-500 text-white" : "bg-char-700 text-char-300")}>{x.kind}</span>
                    <span className={i === 0 ? "text-white" : "text-char-300"}>{x.action}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-char-300">No corrective action needed. Proceed per the approved plan.</p>
            )}
          </div>

          {/* Crew sequence mini-timeline */}
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-char-400">Summit Crew 1 sequence {swapSuggested && <span className="text-safety-400">· swap suggested</span>}</p>
            <div className="space-y-1 font-mono text-[11px]">
              {[{ w: wp, d: swapSuggested ? dock.startDate : wp.startDate }, { w: dock, d: swapSuggested ? wp.startDate : dock.startDate }]
                .sort((x, y) => x.d.localeCompare(y.d))
                .map(({ w, d }) => (
                  <div key={w.id} className="flex items-center gap-2">
                    <span className="w-14 text-char-400">{fmt(d)}</span>
                    <span className={cx("flex-1 truncate rounded px-2 py-1 transition-all", w.id === WP ? (r.state === "blocked" ? "bg-bad-600/70" : "bg-ok-600/70") : "bg-steel-500/60")}>{w.name}</span>
                  </div>
                ))}
            </div>
          </div>

          <button
            onClick={approve}
            disabled={!gate.ok}
            className="w-full rounded-lg bg-safety-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-safety-600 disabled:cursor-not-allowed disabled:bg-char-700 disabled:text-char-400"
          >
            {r.state === "approved" ? "Approval recorded" : "Approve as Dana Ruiz, Superintendent"}
          </button>
          {!gate.ok && r.state !== "approved" && <p className="-mt-2 text-center text-[11px] text-char-400">{gate.reason.length > 110 ? `${gate.reason.slice(0, 108)}…` : gate.reason}</p>}
        </div>
      </div>
    </div>
  );
}
