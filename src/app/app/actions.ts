"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { repo } from "@/lib/data";
import { canApprove, evaluateReadiness } from "@/lib/engine";
import { currentUser } from "@/lib/session";
import { APPROVER_ROLES, type ChecklistStatus } from "@/lib/types";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

async function wpContext(projectId: string, workPackageId: string) {
  const snap = await repo.getSnapshot(projectId);
  const wp = snap?.workPackages.find((w) => w.id === workPackageId);
  if (!snap || !wp) throw new Error("Work package not found");
  return { snap, wp };
}

export async function setChecklistStatus(projectId: string, itemId: string, status: ChecklistStatus, note?: string): Promise<ActionResult> {
  const user = await currentUser();
  const snap = await repo.getSnapshot(projectId);
  const item = snap?.checklist.find((c) => c.id === itemId);
  if (!item) return { ok: false, error: "Checklist item not found." };
  await repo.setChecklistStatus({ itemId, status, personId: user.id, note });
  revalidatePath(`/app/projects/${projectId}`, "layout");
  return { ok: true, message: `“${item.label}” marked ${status.replace("_", " ")} by ${user.name}.` };
}

/** Human readiness approval. Re-validated on the server against current checklist records. */
export async function approveWorkPackage(projectId: string, workPackageId: string, notes: string): Promise<ActionResult> {
  const user = await currentUser();
  if (!APPROVER_ROLES.includes(user.role)) {
    return { ok: false, error: `${user.name} (${user.role.replace("_", " ")}) is not authorized to approve readiness. Superintendent or project manager required.` };
  }
  const { snap, wp } = await wpContext(projectId, workPackageId);
  const r = evaluateReadiness(wp, snap);
  const gate = canApprove(r);
  if (!gate.ok) return { ok: false, error: gate.reason };
  await repo.recordApproval({
    workPackageId,
    approvedById: user.id,
    approvedAt: new Date().toISOString(),
    verifiedItemIds: r.items.filter((c) => c.status === "verified").map((c) => c.id),
    notes: notes || undefined,
  });
  revalidatePath(`/app/projects/${projectId}`, "layout");
  return { ok: true, message: `Readiness approval for “${wp.name}” recorded by ${user.name}.` };
}

export async function revokeApproval(projectId: string, approvalId: string, reason: string): Promise<ActionResult> {
  const user = await currentUser();
  if (!APPROVER_ROLES.includes(user.role)) return { ok: false, error: "Only a superintendent or project manager can revoke an approval." };
  await repo.revokeApproval({ approvalId, reason: reason || `Revoked by ${user.name}` });
  revalidatePath(`/app/projects/${projectId}`, "layout");
  return { ok: true, message: "Approval revoked." };
}

export async function addProgressNote(projectId: string, workPackageId: string, title: string, body: string, s3Key?: string, type: "progress_note" | "photo" | "document" = "progress_note"): Promise<ActionResult> {
  const user = await currentUser();
  if (!title.trim()) return { ok: false, error: "Title is required." };
  await wpContext(projectId, workPackageId);
  await repo.addEvidence({ projectId, workPackageId, type, title: title.trim(), body: body.trim() || undefined, submittedById: user.id, submittedAt: new Date().toISOString(), s3Key, tags: [] });
  revalidatePath(`/app/projects/${projectId}`, "layout");
  return { ok: true, message: "Evidence added." };
}

export async function switchUser(personId: string) {
  (await cookies()).set("cc_user", personId, { path: "/", sameSite: "lax" });
  revalidatePath("/app", "layout");
}

export async function resetDemo() {
  await repo.reset?.();
  revalidatePath("/app", "layout");
}
