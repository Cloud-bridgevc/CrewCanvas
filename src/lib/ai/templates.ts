import { fmt } from "../dates";
import type { DailyReport, EvidenceDigest, ProjectAnalysis, Recommendation } from "../engine";
import type { ProjectSnapshot } from "../types";

/** Deterministic prose used when Bedrock is off, fails, or is overruled by the guardrail. */

export function dailyReportTemplate(r: DailyReport): string {
  const parts: string[] = [];
  if (r.blockers.length) {
    parts.push(`${r.blockers.length} package${r.blockers.length > 1 ? "s are" : " is"} blocked by unverified prerequisites: ${r.blockers.map((b) => b.title).join("; ")}.`);
  } else {
    parts.push("No packages are blocked by unverified checklist items.");
  }
  if (r.conflicts.length) {
    parts.push(`${r.conflicts.length} schedule conflict${r.conflicts.length > 1 ? "s" : ""} need coordination, led by ${r.conflicts[0].title.charAt(0).toLowerCase()}${r.conflicts[0].title.slice(1)}.`);
  }
  if (r.approvalsNeeded.length) {
    parts.push(`${r.approvalsNeeded.map((w) => `“${w.name}”`).join(", ")} ${r.approvalsNeeded.length > 1 ? "have" : "has"} a fully verified checklist and needs a superintendent or PM readiness decision.`);
  }
  if (r.startingSoon.length) {
    parts.push(`Starting in the next five days: ${r.startingSoon.map((w) => `${w.name} (${fmt(w.startDate)})`).join(", ")}.`);
  }
  parts.push(`${r.recentEvidence.length} evidence item${r.recentEvidence.length === 1 ? "" : "s"} submitted in the last 72 hours.`);
  return parts.join(" ");
}

export function evidenceTemplate(d: EvidenceDigest, snap: ProjectSnapshot): string {
  const who = [...new Set(d.items.map((e) => snap.people.find((p) => p.id === e.submittedById)?.name ?? "team"))];
  const bits = [
    `${d.items.length} submission${d.items.length > 1 ? "s" : ""} (${d.counts.photo} photo, ${d.counts.checklist_result} checklist result, ${d.counts.progress_note} note) from ${who.join(", ")}; latest “${d.latest?.title}”.`,
    `Checklist: ${d.checklist.verified} of ${d.checklist.required} required items verified${d.checklist.outstanding.length ? `; outstanding — ${d.checklist.outstanding.join("; ")}` : ""}.`,
  ];
  if (d.workPackage.status === "in_progress") {
    bits.push(
      d.progress.projectedEnd > d.progress.plannedEnd
        ? `Reported ${d.progress.percent}% vs ${d.progress.expected}% planned; trending to finish ${fmt(d.progress.projectedEnd)} (planned ${fmt(d.progress.plannedEnd)}).`
        : `Reported ${d.progress.percent}% vs ${d.progress.expected}% planned — on pace.`,
    );
  }
  return bits.join(" ");
}

export function recommendationTemplate(recs: Recommendation[]): string {
  if (!recs.length) return "No corrective actions are suggested for this package.";
  return recs.map((r) => r.rationale).join(" ");
}

export function healthLine(a: ProjectAnalysis): string {
  return `${a.health.blocked} blocked · ${a.health.conflicts} conflicts · ${a.health.awaitingApproval} awaiting approval`;
}
