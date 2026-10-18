import { diffDays } from "../dates";
import type { Approval, ChecklistItem, ProjectSnapshot, WorkPackage } from "../types";

/**
 * Readiness is computed ONLY from recorded checklist results and recorded human approvals.
 * No model output is an input to this function.
 */
export type ReadinessState = "complete" | "approved" | "awaiting_approval" | "not_verified" | "blocked";

export const READINESS_LABEL: Record<ReadinessState, string> = {
  complete: "Complete",
  approved: "Approved for work",
  awaiting_approval: "Checklist verified · awaiting approval",
  not_verified: "Verification outstanding",
  blocked: "Blocked",
};

/** Outstanding items become blockers when the start date is this close. */
export const BLOCKING_WINDOW_DAYS = 3;

export type ApprovalStatus = "none" | "valid" | "invalidated";

export interface ReadinessResult {
  workPackageId: string;
  state: ReadinessState;
  label: string;
  daysUntilStart: number;
  requiredCount: number;
  verifiedCount: number;
  items: ChecklistItem[];
  outstanding: ChecklistItem[];
  failed: ChecklistItem[];
  blocking: ChecklistItem[];
  approval?: Approval;
  approvalStatus: ApprovalStatus;
  approvalNote?: string;
}

function activeApproval(approvals: Approval[], wpId: string): Approval | undefined {
  return approvals
    .filter((a) => a.workPackageId === wpId && !a.revokedAt)
    .sort((a, b) => b.approvedAt.localeCompare(a.approvedAt))[0];
}

export function evaluateReadiness(wp: WorkPackage, snap: Pick<ProjectSnapshot, "asOf" | "checklist" | "approvals">): ReadinessResult {
  const items = snap.checklist.filter((c) => c.workPackageId === wp.id);
  const required = items.filter((c) => c.required && c.status !== "not_applicable");
  const outstanding = required.filter((c) => c.status !== "verified");
  const failed = required.filter((c) => c.status === "failed");
  const daysUntilStart = diffDays(snap.asOf, wp.startDate);

  const approval = activeApproval(snap.approvals, wp.id);
  let approvalStatus: ApprovalStatus = "none";
  let approvalNote: string | undefined;
  if (approval) {
    const coversAll = required.every((c) => approval.verifiedItemIds.includes(c.id));
    if (outstanding.length === 0 && coversAll) {
      approvalStatus = "valid";
    } else {
      approvalStatus = "invalidated";
      approvalNote =
        outstanding.length > 0
          ? "Approval no longer valid: a checklist item was reopened after approval."
          : "Approval no longer valid: required items were added after approval.";
    }
  }

  const inWindow = daysUntilStart <= BLOCKING_WINDOW_DAYS || wp.status === "in_progress";
  const blocking = outstanding.filter(
    (c) => c.status === "failed" || inWindow || (c.dueBy !== undefined && c.dueBy < snap.asOf),
  );

  let state: ReadinessState;
  if (wp.status === "complete") state = "complete";
  else if (failed.length > 0 || blocking.length > 0) state = "blocked";
  else if (outstanding.length > 0) state = "not_verified";
  else if (approvalStatus === "valid") state = "approved";
  else state = "awaiting_approval";

  return {
    workPackageId: wp.id,
    state,
    label: READINESS_LABEL[state],
    daysUntilStart,
    requiredCount: required.length,
    verifiedCount: required.length - outstanding.length,
    items,
    outstanding,
    failed,
    blocking,
    approval,
    approvalStatus,
    approvalNote,
  };
}

/** Human approval gate. The engine refuses an approval unless every required item is verified. */
export function canApprove(r: ReadinessResult): { ok: true } | { ok: false; reason: string } {
  if (r.state === "complete") return { ok: false, reason: "Work package is already complete." };
  if (r.outstanding.length > 0) {
    return {
      ok: false,
      reason: `${r.outstanding.length} required checklist item(s) are not verified: ${r.outstanding.map((c) => c.label).join("; ")}.`,
    };
  }
  if (r.approvalStatus === "valid") return { ok: false, reason: "A valid approval is already recorded." };
  return { ok: true };
}
