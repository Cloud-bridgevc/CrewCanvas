import { addDays, fmt, fmtRange, overlap } from "../dates";
import type { ProjectSnapshot, WorkPackage } from "../types";
import type { Conflict } from "./conflicts";
import { BLOCKING_WINDOW_DAYS, type ReadinessResult } from "./readiness";
import { downstreamOf } from "./schedule";

export type RecommendationKind = "hold" | "verify" | "resequence" | "reassign" | "approve" | "escalate" | "notify";

export interface Recommendation {
  id: string;
  kind: RecommendationKind;
  priority: 1 | 2 | 3;
  workPackageId: string;
  conflictId?: string;
  action: string;
  rationale: string;
  owner: string;
}

/**
 * Rule-based corrective actions. These are suggestions for people to act on —
 * none of them changes readiness, releases work, or records an approval.
 */
export function recommend(snap: ProjectSnapshot, readiness: Map<string, ReadinessResult>, conflicts: Conflict[]): Recommendation[] {
  const recs: Recommendation[] = [];
  const wpById = new Map([...snap.workPackages, ...snap.externalAssignments].map((w) => [w.id, w]));
  const person = (id: string) => snap.people.find((p) => p.id === id);
  const supt = person(snap.project.superintendentId);
  const pm = person(snap.project.projectManagerId);
  const crewLabel = (crewId: string) => {
    const c = snap.crews.find((x) => x.id === crewId);
    const s = c && snap.subcontractors.find((x) => x.id === c.subcontractorId);
    return c ? `${s?.name} ${c.name}` : crewId;
  };
  const allAssignments = [...snap.workPackages, ...snap.externalAssignments];

  const crewFree = (crewId: string, start: string, end: string, ignore: string[]) =>
    !allAssignments.some((w) => w.crewId === crewId && !ignore.includes(w.id) && w.status !== "complete" && overlap(w.startDate, w.endDate, start, end)) &&
    !snap.availability.some((a) => a.crewId === crewId && a.status === "unavailable" && overlap(a.startDate, a.endDate, start, end));

  for (const c of conflicts) {
    const wp = wpById.get(c.workPackageIds[0])!;
    switch (c.type) {
      case "missing_prerequisite": {
        const r = readiness.get(wp.id)!;
        const item = r.blocking[0];
        const cutoff = addDays(wp.startDate, -1);
        recs.push({
          id: `rec-hold-${wp.id}`,
          kind: "hold",
          priority: 1,
          workPackageId: wp.id,
          conflictId: c.id,
          action: `Hold “${wp.name}” (${fmtRange(wp.startDate, wp.endDate)}). Do not release ${crewLabel(wp.crewId)}${wp.equipment.length ? ` or the ${wp.equipment.join(", ")}` : ""} until the outstanding item${r.blocking.length > 1 ? "s are" : " is"} verified.`,
          rationale: `Required item${r.blocking.length > 1 ? "s" : ""} not verified: ${r.blocking.map((b) => `“${b.label}”`).join(", ")}. Readiness can only be approved by an authorized person after verification.`,
          owner: supt ? `${supt.name} (Superintendent)` : "Superintendent",
        });
        for (const b of r.blocking) {
          recs.push({
            id: `rec-verify-${b.id}`,
            kind: "verify",
            priority: 1,
            workPackageId: wp.id,
            conflictId: c.id,
            action: `Get “${b.label}” from ${b.responsibleParty} by ${fmt(b.dueBy && b.dueBy < cutoff ? b.dueBy : cutoff)} and attach the report as evidence.`,
            rationale: b.notes ?? `Item is ${b.status}.`,
            owner: pm ? `${pm.name} (Project Manager)` : "Project Manager",
          });
        }
        // Keep the crew productive: pull forward another package that is fully verified.
        const candidate = snap.workPackages
          .filter((o) => o.id !== wp.id && o.crewId === wp.crewId && o.status === "not_started" && o.startDate > wp.startDate)
          .filter((o) => {
            const ro = readiness.get(o.id)!;
            return (ro.state === "awaiting_approval" || ro.state === "approved") &&
              snap.dependencies.filter((d) => d.successorId === o.id).every((d) => wpById.get(d.predecessorId)?.status === "complete");
          })
          .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
        if (candidate) {
          const ro = readiness.get(candidate.id)!;
          recs.push({
            id: `rec-reseq-${wp.id}-${candidate.id}`,
            kind: "resequence",
            priority: 2,
            workPackageId: wp.id,
            conflictId: c.id,
            action: `If not verified by ${fmt(cutoff)}, swap sequence: move “${candidate.name}” to ${fmt(wp.startDate)} so ${crewLabel(wp.crewId)} stays productive, and move “${wp.name}” to ${fmt(candidate.startDate)}.`,
            rationale: `“${candidate.name}” has all required checklist items verified and its predecessors are complete.${ro.state === "awaiting_approval" ? " It still needs a human readiness approval before it can start." : ""}`,
            owner: supt ? `${supt.name} (Superintendent)` : "Superintendent",
          });
        }
        const down = downstreamOf(wp.id, snap.dependencies).map((id) => wpById.get(id)!).filter(Boolean);
        if (down.length) {
          recs.push({
            id: `rec-notify-${wp.id}`,
            kind: "notify",
            priority: 3,
            workPackageId: wp.id,
            conflictId: c.id,
            action: `Give a heads-up to ${unique(down.map((d) => subName(snap, d))).join(", ")} that ${down.map((d) => `“${d.name}”`).join(", ")} may move if this hold continues.`,
            rationale: "Early notice lets downstream crews re-plan their manpower.",
            owner: pm ? `${pm.name} (Project Manager)` : "Project Manager",
          });
        }
        break;
      }
      case "crew_double_booked": {
        const [a, b] = c.workPackageIds.map((id) => wpById.get(id)!);
        // Move the later / shorter package; prefer reassigning within the same subcontractor.
        const mover = b.projectId !== snap.project.id ? a : a.startDate > b.startDate ? a : b;
        const crew = snap.crews.find((x) => x.id === mover.crewId)!;
        const alt = snap.crews.find((x) => x.subcontractorId === crew.subcontractorId && x.id !== crew.id && crewFree(x.id, mover.startDate, mover.endDate, [mover.id]));
        if (alt) {
          recs.push({
            id: `rec-reassign-${mover.id}`,
            kind: "reassign",
            priority: 2,
            workPackageId: mover.id,
            conflictId: c.id,
            action: `Ask ${subName(snap, mover)} to staff “${mover.name}” with ${alt.name} (${alt.headcount} workers, ${alt.foreman}) ${fmtRange(mover.startDate, mover.endDate)}.`,
            rationale: `${alt.name} has no other assignment and no recorded unavailability in that window.`,
            owner: pm ? `${pm.name} (Project Manager)` : "Project Manager",
          });
        } else {
          const other = mover === a ? b : a;
          recs.push({
            id: `rec-reseq-${mover.id}`,
            kind: "resequence",
            priority: 2,
            workPackageId: mover.id,
            conflictId: c.id,
            action: `Shift “${mover.name}” to start ${fmt(addDays(other.endDate, 1))}, after “${other.name}”.`,
            rationale: `No alternate ${crew.trade.toLowerCase()} crew is free ${fmtRange(mover.startDate, mover.endDate)}.`,
            owner: supt ? `${supt.name} (Superintendent)` : "Superintendent",
          });
        }
        break;
      }
      case "crew_unavailable": {
        const crew = snap.crews.find((x) => x.id === wp.crewId)!;
        const alt = snap.crews.find((x) => x.subcontractorId === crew.subcontractorId && x.id !== crew.id && crewFree(x.id, c.window.start, c.window.end, [wp.id]));
        const from = String(c.facts.availableFrom);
        recs.push({
          id: `rec-avail-${c.id}`,
          kind: alt ? "reassign" : c.facts.availabilityStatus === "reduced" ? "escalate" : "resequence",
          priority: c.severity === "high" ? 2 : 3,
          workPackageId: wp.id,
          conflictId: c.id,
          action: alt
            ? `Cover ${fmtRange(c.window.start, c.window.end)} on “${wp.name}” with ${alt.name}.`
            : c.facts.availabilityStatus === "reduced"
              ? `Ask ${subName(snap, wp)} to backfill manpower on “${wp.name}” ${fmtRange(c.window.start, c.window.end)}, or accept reduced production in the look-ahead.`
              : `Confirm with ${subContact(snap, wp)} whether “${wp.name}” can start ${fmt(from)}; otherwise re-plan the first ${c.window.start === c.window.end ? "day" : "days"}.`,
          rationale: `Recorded availability: ${c.facts.reason}.`,
          owner: supt ? `${supt.name} (Superintendent)` : "Superintendent",
        });
        break;
      }
      case "zone_overlap": {
        const [a, b] = c.workPackageIds.map((id) => wpById.get(id)!);
        const first = a.startDate <= b.startDate ? a : b;
        const second = first === a ? b : a;
        // The non-exclusive package is usually the one already in place; let it finish.
        const stay = first.exclusiveZone && !second.exclusiveZone ? second : first;
        const move = stay === first ? second : first;
        recs.push({
          id: `rec-zone-${c.id}`,
          kind: "resequence",
          priority: 2,
          workPackageId: move.id,
          conflictId: c.id,
          action: `Start “${move.name}” in ${c.facts.zone} on ${fmt(addDays(stay.endDate, 1))}, after “${stay.name}” finishes — or agree a split work-area plan for ${fmtRange(c.window.start, c.window.end)} at the daily huddle.`,
          rationale: `${c.facts.zone} is exclusive for overhead work; two crews would share it ${fmtRange(c.window.start, c.window.end)}.`,
          owner: supt ? `${supt.name} (Superintendent)` : "Superintendent",
        });
        break;
      }
      case "equipment_overlap": {
        recs.push({
          id: `rec-eq-${c.id}`,
          kind: "resequence",
          priority: 3,
          workPackageId: wp.id,
          conflictId: c.id,
          action: `Build a single ${c.facts.equipment} schedule for ${fmtRange(c.window.start, c.window.end)} or book a second unit.`,
          rationale: c.detail,
          owner: supt ? `${supt.name} (Superintendent)` : "Superintendent",
        });
        break;
      }
      case "sequence_violation":
      case "predecessor_slip": {
        const pred = wpById.get(c.workPackageIds[1])!;
        recs.push({
          id: `rec-slip-${c.id}`,
          kind: "escalate",
          priority: c.severity === "high" ? 2 : 3,
          workPackageId: wp.id,
          conflictId: c.id,
          action: `Ask ${subContact(snap, pred)} for a recovery plan on “${pred.name}”, or move “${wp.name}” to ${fmt(String(c.facts.earliest))}.`,
          rationale: c.detail,
          owner: pm ? `${pm.name} (Project Manager)` : "Project Manager",
        });
        break;
      }
    }
  }

  // Verified-but-unapproved packages starting soon need a person to approve them.
  for (const wp of snap.workPackages) {
    const r = readiness.get(wp.id)!;
    if (r.state === "awaiting_approval" && r.daysUntilStart <= 10) {
      recs.push({
        id: `rec-approve-${wp.id}`,
        kind: "approve",
        priority: r.daysUntilStart <= 3 ? 1 : 3,
        workPackageId: wp.id,
        action: `Review the ${r.requiredCount} verified checklist items for “${wp.name}” and record a readiness decision before ${fmt(wp.startDate)}.`,
        rationale: "All required items are verified. CrewCanvas never releases work on its own — an authorized superintendent or project manager must approve.",
        owner: supt ? `${supt.name} (Superintendent)` : "Superintendent",
      });
    } else if (r.state === "not_verified" && r.daysUntilStart <= 10) {
      recs.push({
        id: `rec-close-${wp.id}`,
        kind: "verify",
        priority: 3,
        workPackageId: wp.id,
        action: `Close out ${r.outstanding.length} open item(s) for “${wp.name}”: ${r.outstanding.map((o) => `“${o.label}” (${o.responsibleParty}${o.dueBy ? `, due ${fmt(o.dueBy)}` : ""})`).join("; ")}.`,
        rationale: `They become blockers ${BLOCKING_WINDOW_DAYS} days before the ${fmt(wp.startDate)} start.`,
        owner: pm ? `${pm.name} (Project Manager)` : "Project Manager",
      });
    }
  }

  return recs.sort((a, b) => a.priority - b.priority);
}

function unique<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}
function subName(snap: ProjectSnapshot, wp: WorkPackage) {
  return snap.subcontractors.find((s) => s.id === wp.subcontractorId)?.name ?? "the subcontractor";
}
function subContact(snap: ProjectSnapshot, wp: WorkPackage) {
  const s = snap.subcontractors.find((x) => x.id === wp.subcontractorId);
  return s ? `${s.contactName} (${s.name})` : "the subcontractor";
}
