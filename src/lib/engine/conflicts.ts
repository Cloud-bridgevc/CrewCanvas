import { addDays, diffDays, fmt, fmtRange, overlap } from "../dates";
import type { ISODate, ProjectSnapshot, WorkPackage } from "../types";
import { BLOCKING_WINDOW_DAYS, type ReadinessResult } from "./readiness";
import { earliestSuccessorStart, projectedEnd } from "./schedule";

export type ConflictType =
  | "missing_prerequisite"
  | "crew_double_booked"
  | "crew_unavailable"
  | "zone_overlap"
  | "equipment_overlap"
  | "sequence_violation"
  | "predecessor_slip";

export type Severity = "critical" | "high" | "medium";

export const CONFLICT_LABEL: Record<ConflictType, string> = {
  missing_prerequisite: "Missing prerequisite",
  crew_double_booked: "Crew double-booked",
  crew_unavailable: "Crew unavailable",
  zone_overlap: "Conflicting work window",
  equipment_overlap: "Equipment conflict",
  sequence_violation: "Dependency out of sequence",
  predecessor_slip: "Predecessor slipping",
};

export interface Conflict {
  id: string;
  type: ConflictType;
  severity: Severity;
  workPackageIds: string[];
  window: { start: ISODate; end: ISODate };
  title: string;
  detail: string;
  /** Structured facts for recommendations and AI narration. */
  facts: Record<string, string | number | string[]>;
}

/** Only look at work that is active or starts within this horizon. */
export const LOOKAHEAD_DAYS = 21;

function isLive(wp: WorkPackage, asOf: ISODate) {
  return wp.status !== "complete" && diffDays(asOf, wp.startDate) <= LOOKAHEAD_DAYS && wp.endDate >= asOf;
}

export function detectConflicts(snap: ProjectSnapshot, readiness: Map<string, ReadinessResult>): Conflict[] {
  const { asOf } = snap;
  const out: Conflict[] = [];
  const wps = snap.workPackages.filter((w) => isLive(w, asOf));
  const crewName = (id: string) => {
    const c = snap.crews.find((x) => x.id === id);
    const s = c && snap.subcontractors.find((x) => x.id === c.subcontractorId);
    return c ? `${s?.name ?? ""} ${c.name}`.trim() : id;
  };

  // 1. Missing / failed prerequisites from verified checklist records.
  for (const wp of wps) {
    const r = readiness.get(wp.id)!;
    if (r.state !== "blocked") continue;
    const failed = r.failed.length > 0;
    out.push({
      id: `cf-prereq-${wp.id}`,
      type: "missing_prerequisite",
      severity: failed || r.daysUntilStart <= BLOCKING_WINDOW_DAYS ? "critical" : "high",
      workPackageIds: [wp.id],
      window: { start: wp.startDate, end: wp.endDate },
      title: `${wp.name}: ${r.blocking.length} unverified required item${r.blocking.length > 1 ? "s" : ""}`,
      detail: `${wp.name} is scheduled ${fmtRange(wp.startDate, wp.endDate)} but these required checklist items are not verified: ${r.blocking
        .map((c) => `“${c.label}” (${c.status}, ${c.responsibleParty})`)
        .join("; ")}.`,
      facts: {
        items: r.blocking.map((c) => c.label),
        responsible: r.blocking.map((c) => c.responsibleParty),
        daysUntilStart: r.daysUntilStart,
      },
    });
  }

  // 2. Crew double-booking, including assignments on other projects.
  const all = [...wps, ...snap.externalAssignments.filter((w) => isLive(w, asOf))];
  for (let i = 0; i < wps.length; i++) {
    for (const other of all) {
      const a = wps[i];
      if (other.id === a.id || other.crewId !== a.crewId) continue;
      // Avoid emitting the same in-project pair twice.
      if (other.projectId === a.projectId && wps.indexOf(other) < i) continue;
      const w = overlap(a.startDate, a.endDate, other.startDate, other.endDate);
      if (!w) continue;
      const external = other.projectId !== a.projectId;
      out.push({
        id: `cf-crew-${a.id}-${other.id}`,
        type: "crew_double_booked",
        severity: "high",
        workPackageIds: [a.id, other.id],
        window: w,
        title: `${crewName(a.crewId)} assigned to two packages ${fmtRange(w.start, w.end)}`,
        detail: `${crewName(a.crewId)} is assigned to “${a.name}” and “${other.name}”${external ? " on another project" : ""} during ${fmtRange(w.start, w.end)}.`,
        facts: { crewId: a.crewId, crew: crewName(a.crewId), external: external ? "yes" : "no" },
      });
    }
  }

  // 3. Crew availability exceptions.
  for (const wp of wps) {
    for (const av of snap.availability.filter((x) => x.crewId === wp.crewId)) {
      const w = overlap(wp.startDate, wp.endDate, av.startDate, av.endDate);
      if (!w) continue;
      out.push({
        id: `cf-avail-${wp.id}-${av.id}`,
        type: "crew_unavailable",
        severity: av.status === "unavailable" ? "high" : "medium",
        workPackageIds: [wp.id],
        window: w,
        title: `${crewName(wp.crewId)} ${av.status === "unavailable" ? "unavailable" : "at reduced capacity"} ${fmtRange(w.start, w.end)}`,
        detail: `“${wp.name}” needs ${crewName(wp.crewId)} ${fmtRange(w.start, w.end)}. Recorded availability: ${av.reason}.`,
        facts: { crewId: wp.crewId, crew: crewName(wp.crewId), availabilityStatus: av.status, reason: av.reason, availableFrom: addDays(av.endDate, 1) },
      });
    }
  }

  // 4. Conflicting work windows in exclusive zones, and 5. shared equipment.
  for (let i = 0; i < wps.length; i++) {
    for (let j = i + 1; j < wps.length; j++) {
      const [a, b] = [wps[i], wps[j]];
      const w = overlap(a.startDate, a.endDate, b.startDate, b.endDate);
      if (!w) continue;
      if (a.zone === b.zone && (a.exclusiveZone || b.exclusiveZone)) {
        out.push({
          id: `cf-zone-${a.id}-${b.id}`,
          type: "zone_overlap",
          severity: "high",
          workPackageIds: [a.id, b.id],
          window: w,
          title: `${a.zone}: “${a.name}” and “${b.name}” overlap`,
          detail: `${a.zone} is marked exclusive for ${a.exclusiveZone ? a.name : b.name}, but both packages are scheduled there ${fmtRange(w.start, w.end)}.`,
          facts: { zone: a.zone },
        });
      }
      // Lifts are fleet items; only single-unit equipment (cranes, pumps) is checked.
      const shared = a.equipment.filter((e) => b.equipment.includes(e) && !/lift/i.test(e));
      for (const eq of shared) {
        out.push({
          id: `cf-eq-${a.id}-${b.id}-${eq}`,
          type: "equipment_overlap",
          severity: "medium",
          workPackageIds: [a.id, b.id],
          window: w,
          title: `${eq} needed by two packages ${fmtRange(w.start, w.end)}`,
          detail: `“${a.name}” and “${b.name}” both require the ${eq} ${fmtRange(w.start, w.end)}.`,
          facts: { equipment: eq },
        });
      }
    }
  }

  // 6. Dependency logic: planned sequence and projected predecessor slip.
  for (const dep of snap.dependencies) {
    const pred = snap.workPackages.find((w) => w.id === dep.predecessorId);
    const succ = snap.workPackages.find((w) => w.id === dep.successorId);
    if (!pred || !succ || succ.status === "complete" || !isLive(succ, asOf)) continue;
    const plannedEarliest = earliestSuccessorStart(pred.endDate, dep);
    if (pred.status !== "complete" && succ.startDate < plannedEarliest) {
      out.push({
        id: `cf-seq-${dep.id}`,
        type: "sequence_violation",
        severity: "high",
        workPackageIds: [succ.id, pred.id],
        window: { start: succ.startDate, end: plannedEarliest },
        title: `“${succ.name}” starts before “${pred.name}” can finish`,
        detail: `Finish-to-start${dep.lagDays ? ` +${dep.lagDays}d` : ""}: earliest start is ${fmt(plannedEarliest)}, scheduled ${fmt(succ.startDate)}.`,
        facts: { earliest: plannedEarliest },
      });
      continue;
    }
    const proj = projectedEnd(pred, asOf);
    const projectedEarliest = earliestSuccessorStart(proj, dep);
    if (pred.status === "in_progress" && projectedEarliest > succ.startDate) {
      const slip = diffDays(succ.startDate, projectedEarliest);
      out.push({
        id: `cf-slip-${dep.id}`,
        type: "predecessor_slip",
        severity: slip >= 3 ? "high" : "medium",
        workPackageIds: [succ.id, pred.id],
        window: { start: succ.startDate, end: projectedEarliest },
        title: `“${pred.name}” trending late — “${succ.name}” at risk by ${slip}d`,
        detail: `${pred.name} is ${pred.percentComplete}% complete; at the current production rate it finishes ${fmt(proj)} (planned ${fmt(pred.endDate)}). With ${dep.lagDays}d lag, ${succ.name} could start ${fmt(projectedEarliest)} at the earliest (scheduled ${fmt(succ.startDate)}).`,
        facts: { projectedEnd: proj, plannedEnd: pred.endDate, earliest: projectedEarliest, slipDays: slip },
      });
    }
  }

  const rank: Record<Severity, number> = { critical: 0, high: 1, medium: 2 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity] || a.window.start.localeCompare(b.window.start));
}
