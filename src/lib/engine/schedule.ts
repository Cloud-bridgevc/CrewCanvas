import { addDays, diffDays } from "../dates";
import type { Dependency, ISODate, WorkPackage } from "../types";

/** Planned progress (0–100) at the start of `asOf`, assuming linear production. */
export function expectedPercent(wp: WorkPackage, asOf: ISODate): number {
  const duration = diffDays(wp.startDate, wp.endDate) + 1;
  const elapsed = Math.max(0, diffDays(wp.startDate, asOf));
  return Math.min(100, Math.round((elapsed / duration) * 100));
}

/** Tolerance before an in-progress package is considered behind. */
export const BEHIND_TOLERANCE = 10;

/**
 * Projected finish from observed production rate. Returns the planned end
 * unless the package is in progress and behind by more than the tolerance.
 */
export function projectedEnd(wp: WorkPackage, asOf: ISODate): ISODate {
  if (wp.status === "complete") return wp.endDate;
  if (wp.status !== "in_progress") return wp.endDate;
  const elapsed = diffDays(wp.startDate, asOf);
  const expected = expectedPercent(wp, asOf);
  if (elapsed <= 0 || wp.percentComplete >= expected - BEHIND_TOLERANCE) return wp.endDate;
  const rate = Math.max(wp.percentComplete, 1) / elapsed;
  const remaining = Math.ceil((100 - wp.percentComplete) / rate);
  const projected = addDays(asOf, remaining - 1);
  return projected > wp.endDate ? projected : wp.endDate;
}

/** Earliest finish-to-start date for a successor given a predecessor finish. */
export function earliestSuccessorStart(predEnd: ISODate, dep: Dependency): ISODate {
  return addDays(predEnd, 1 + dep.lagDays);
}

/** All packages downstream of `wpId` (transitive). */
export function downstreamOf(wpId: string, deps: Dependency[]): string[] {
  const out = new Set<string>();
  const queue = [wpId];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const d of deps) {
      if (d.predecessorId === cur && !out.has(d.successorId)) {
        out.add(d.successorId);
        queue.push(d.successorId);
      }
    }
  }
  return [...out];
}
