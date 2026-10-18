import { diffDays, fmt } from "../dates";
import type { Evidence, ProjectSnapshot, WorkPackage } from "../types";
import { detectConflicts, type Conflict } from "./conflicts";
import { evaluateReadiness, type ReadinessResult } from "./readiness";
import { recommend, type Recommendation } from "./recommendations";
import { rankRisks, type RiskEntry } from "./risk";
import { expectedPercent, projectedEnd } from "./schedule";

export * from "./conflicts";
export * from "./readiness";
export * from "./recommendations";
export * from "./risk";
export * from "./schedule";

export interface ProjectAnalysis {
  asOf: string;
  readiness: Map<string, ReadinessResult>;
  conflicts: Conflict[];
  risks: RiskEntry[];
  recommendations: Recommendation[];
  health: { blocked: number; awaitingApproval: number; conflicts: number; critical: number; score: number };
}

export function analyzeProject(snap: ProjectSnapshot): ProjectAnalysis {
  const readiness = new Map(snap.workPackages.map((wp) => [wp.id, evaluateReadiness(wp, snap)]));
  const conflicts = detectConflicts(snap, readiness);
  const risks = rankRisks(snap, readiness, conflicts);
  const recommendations = recommend(snap, readiness, conflicts);
  const blocked = [...readiness.values()].filter((r) => r.state === "blocked").length;
  const awaitingApproval = [...readiness.values()].filter((r) => r.state === "awaiting_approval").length;
  const critical = risks.filter((r) => r.level === "critical").length;
  const score = Math.max(0, 100 - blocked * 15 - conflicts.length * 5 - critical * 10);
  return { asOf: snap.asOf, readiness, conflicts, risks, recommendations, health: { blocked, awaitingApproval, conflicts: conflicts.length, critical, score } };
}

/** Structured evidence roll-up per work package — the facts an AI summary may narrate. */
export interface EvidenceDigest {
  workPackage: WorkPackage;
  counts: Record<Evidence["type"], number>;
  latest?: Evidence;
  items: Evidence[];
  checklist: { verified: number; required: number; outstanding: string[] };
  progress: { percent: number; expected: number; projectedEnd: string; plannedEnd: string };
}

export function digestEvidence(snap: ProjectSnapshot, analysis: ProjectAnalysis): EvidenceDigest[] {
  return snap.workPackages
    .map((wp) => {
      const items = snap.evidence.filter((e) => e.workPackageId === wp.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
      const counts = { photo: 0, checklist_result: 0, progress_note: 0, document: 0 } as EvidenceDigest["counts"];
      items.forEach((e) => counts[e.type]++);
      const r = analysis.readiness.get(wp.id)!;
      return {
        workPackage: wp,
        counts,
        latest: items[0],
        items,
        checklist: { verified: r.verifiedCount, required: r.requiredCount, outstanding: r.outstanding.map((o) => o.label) },
        progress: { percent: wp.percentComplete, expected: expectedPercent(wp, snap.asOf), projectedEnd: projectedEnd(wp, snap.asOf), plannedEnd: wp.endDate },
      };
    })
    .filter((d) => d.items.length > 0);
}

/** Deterministic daily coordination report content. */
export function buildDailyReport(snap: ProjectSnapshot, a: ProjectAnalysis) {
  const name = (id: string) => snap.workPackages.find((w) => w.id === id)?.name ?? id;
  const active = snap.workPackages.filter((w) => w.status === "in_progress" || (w.startDate <= snap.asOf && w.endDate >= snap.asOf && w.status !== "complete"));
  const startingSoon = snap.workPackages
    .filter((w) => w.status === "not_started" && diffDays(snap.asOf, w.startDate) >= 0 && diffDays(snap.asOf, w.startDate) <= 5)
    .sort((x, y) => x.startDate.localeCompare(y.startDate));
  const since = new Date(new Date(`${snap.asOf}T07:00:00Z`).getTime() - 3 * 86_400_000).toISOString();
  const recentEvidence = snap.evidence.filter((e) => e.submittedAt >= since).sort((x, y) => y.submittedAt.localeCompare(x.submittedAt));
  return {
    date: snap.asOf,
    title: `${snap.project.name} — Daily coordination report, ${fmt(snap.asOf, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`,
    active,
    startingSoon,
    blockers: a.conflicts.filter((c) => c.type === "missing_prerequisite"),
    conflicts: a.conflicts.filter((c) => c.type !== "missing_prerequisite"),
    approvalsNeeded: snap.workPackages.filter((w) => a.readiness.get(w.id)!.state === "awaiting_approval"),
    recentEvidence,
    topRisks: a.risks.slice(0, 5).map((r) => ({ ...r, name: name(r.workPackageId) })),
    actions: a.recommendations.filter((r) => r.priority <= 2),
  };
}
export type DailyReport = ReturnType<typeof buildDailyReport>;
