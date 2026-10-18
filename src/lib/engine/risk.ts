import { fmt } from "../dates";
import type { ProjectSnapshot } from "../types";
import type { Conflict, Severity } from "./conflicts";
import { LOOKAHEAD_DAYS } from "./conflicts";
import type { ReadinessResult } from "./readiness";
import { downstreamOf } from "./schedule";

export type RiskLevel = "critical" | "high" | "medium" | "low";

export interface RiskEntry {
  workPackageId: string;
  score: number;
  level: RiskLevel;
  reasons: string[];
  conflictIds: string[];
  daysUntilStart: number;
}

const SEVERITY_POINTS: Record<Severity, number> = { critical: 30, high: 20, medium: 10 };
const STATE_POINTS: Record<ReadinessResult["state"], number> = {
  blocked: 50,
  not_verified: 15,
  awaiting_approval: 8,
  approved: 0,
  complete: 0,
};

export function levelFor(score: number): RiskLevel {
  if (score >= 70) return "critical";
  if (score >= 45) return "high";
  if (score >= 20) return "medium";
  return "low";
}

/**
 * Transparent additive score — every point added produces a human-readable reason,
 * so each warning can be explained without a model.
 */
export function rankRisks(snap: ProjectSnapshot, readiness: Map<string, ReadinessResult>, conflicts: Conflict[]): RiskEntry[] {
  const byId = new Map(snap.workPackages.map((w) => [w.id, w]));
  const entries: RiskEntry[] = [];

  for (const wp of snap.workPackages) {
    const r = readiness.get(wp.id)!;
    if (wp.status === "complete" || r.daysUntilStart > LOOKAHEAD_DAYS || wp.endDate < snap.asOf) continue;
    let score = STATE_POINTS[r.state];
    const reasons: string[] = [];

    if (r.state === "blocked") {
      reasons.push(`Blocked: ${r.blocking.length} required item(s) unverified — ${r.blocking.map((c) => c.label).join("; ")}.`);
    } else if (r.state === "not_verified") {
      reasons.push(`${r.outstanding.length} required item(s) still to verify (next due ${fmt(r.outstanding.map((c) => c.dueBy ?? wp.startDate).sort()[0])}).`);
    } else if (r.state === "awaiting_approval") {
      reasons.push("Checklist verified, but no human readiness approval is recorded.");
    }
    if (r.approvalStatus === "invalidated" && r.approvalNote) {
      score += 10;
      reasons.push(r.approvalNote);
    }

    const mine = conflicts.filter((c) => c.workPackageIds[0] === wp.id || (c.type !== "predecessor_slip" && c.type !== "sequence_violation" && c.workPackageIds.includes(wp.id)));
    for (const c of mine) {
      if (c.type === "missing_prerequisite") continue; // already counted via state
      score += SEVERITY_POINTS[c.severity];
      reasons.push(`${c.title}.`);
    }

    // Upstream: predecessors that are blocked themselves.
    for (const dep of snap.dependencies.filter((d) => d.successorId === wp.id)) {
      const pr = readiness.get(dep.predecessorId);
      if (pr?.state === "blocked") {
        score += 15;
        reasons.push(`Upstream package “${byId.get(dep.predecessorId)?.name}” is blocked.`);
      }
    }

    // Downstream exposure if this package slips.
    if (r.state === "blocked" || mine.length > 0) {
      const down = downstreamOf(wp.id, snap.dependencies).filter((id) => byId.get(id)?.status !== "complete");
      if (down.length) {
        score += Math.min(15, down.length * 5);
        reasons.push(`A slip here affects ${down.length} downstream package(s): ${down.map((id) => byId.get(id)?.name).join(", ")}.`);
      }
    }

    if (score > 0) {
      if (r.daysUntilStart <= 3) {
        score += 15;
        reasons.push(r.daysUntilStart <= 0 ? "Work is active or starts today." : `Starts in ${r.daysUntilStart} day(s).`);
      } else if (r.daysUntilStart <= 7) {
        score += 8;
        reasons.push(`Starts in ${r.daysUntilStart} days.`);
      }
    }

    score = Math.min(100, score);
    entries.push({
      workPackageId: wp.id,
      score,
      level: levelFor(score),
      reasons,
      conflictIds: mine.map((c) => c.id),
      daysUntilStart: r.daysUntilStart,
    });
  }

  return entries.sort((a, b) => b.score - a.score || a.daysUntilStart - b.daysUntilStart);
}
