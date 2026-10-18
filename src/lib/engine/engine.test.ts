import { describe, expect, it } from "vitest";
import { snapshotFrom } from "../data/memory";
import * as seed from "../data/seed";
import { analyzeProject, canApprove } from "./index";
import type { ChecklistItem } from "../types";

const base = () => structuredClone({ checklist: seed.checklist, approvals: seed.approvals, evidence: seed.evidence });
const DEMO_ITEM = "ck-200-1";

function withItem(status: ChecklistItem["status"]) {
  const s = base();
  s.checklist.find((c) => c.id === DEMO_ITEM)!.status = status;
  return s;
}

describe("readiness is grounded in checklist records and human approval", () => {
  it("blocks the L2 pour while the special inspection is pending", () => {
    const a = analyzeProject(snapshotFrom("hpm", base())!);
    const r = a.readiness.get("wp-200")!;
    expect(r.state).toBe("blocked");
    expect(r.blocking.map((c) => c.id)).toEqual([DEMO_ITEM]);
    expect(a.conflicts.find((c) => c.type === "missing_prerequisite")?.severity).toBe("critical");
    expect(a.risks[0].workPackageId).toBe("wp-200");
    expect(a.risks[0].level).toBe("critical");
  });

  it("recommends a hold and a crew-preserving resequence while blocked", () => {
    const a = analyzeProject(snapshotFrom("hpm", base())!);
    const kinds = a.recommendations.filter((r) => r.workPackageId === "wp-200").map((r) => r.kind);
    expect(kinds).toContain("hold");
    expect(kinds).toContain("resequence");
    expect(kinds).not.toContain("approve");
  });

  it("does not become 'approved' just because the checklist is verified", () => {
    const a = analyzeProject(snapshotFrom("hpm", withItem("verified"))!);
    const r = a.readiness.get("wp-200")!;
    expect(r.state).toBe("awaiting_approval");
    const recs = a.recommendations.filter((x) => x.workPackageId === "wp-200");
    expect(recs.map((x) => x.kind)).toEqual(["approve"]);
  });

  it("is approved only after a recorded human approval", () => {
    const s = withItem("verified");
    const r0 = analyzeProject(snapshotFrom("hpm", s)!).readiness.get("wp-200")!;
    expect(canApprove(r0).ok).toBe(true);
    s.approvals.push({ id: "ap-x", workPackageId: "wp-200", approvedById: "p-dana", approvedAt: "2026-10-19T16:00:00Z", verifiedItemIds: r0.items.filter((c) => c.status === "verified").map((c) => c.id) });
    expect(analyzeProject(snapshotFrom("hpm", s)!).readiness.get("wp-200")!.state).toBe("approved");
  });

  it("refuses approval with unverified items", () => {
    const r = analyzeProject(snapshotFrom("hpm", base())!).readiness.get("wp-200")!;
    expect(canApprove(r).ok).toBe(false);
  });

  it("invalidates an approval when an item is reopened", () => {
    const s = base();
    s.checklist.find((c) => c.id === "ck-310-2")!.status = "pending";
    const r = analyzeProject(snapshotFrom("hpm", s)!).readiness.get("wp-310")!;
    expect(r.approvalStatus).toBe("invalidated");
    expect(r.state).toBe("blocked");
  });

  it("treats a failed item as a blocker regardless of start date", () => {
    const s = base();
    s.checklist.find((c) => c.id === "ck-500-1")!.status = "failed";
    expect(analyzeProject(snapshotFrom("hpm", s)!).readiness.get("wp-500")!.state).toBe("blocked");
  });
});

describe("schedule conflict detection", () => {
  const a = analyzeProject(snapshotFrom("hpm", base())!);
  const types = a.conflicts.map((c) => c.type);
  it("finds crew, zone, availability and slip conflicts", () => {
    expect(types).toEqual(expect.arrayContaining(["crew_double_booked", "zone_overlap", "crew_unavailable", "predecessor_slip"]));
  });
  it("suggests reassigning the double-booked package to a free crew", () => {
    const rec = a.recommendations.find((r) => r.kind === "reassign" && r.workPackageId === "wp-320");
    expect(rec?.action).toMatch(/Crew B/);
  });
});
