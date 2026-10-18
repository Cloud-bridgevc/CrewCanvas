import * as seed from "./seed";
import type { Repository } from "./repository";
import type { Approval, ChecklistItem, DemoRequest, Evidence, ProjectSnapshot } from "../types";

interface State {
  checklist: ChecklistItem[];
  approvals: Approval[];
  evidence: Evidence[];
  demoRequests: DemoRequest[];
}

const fresh = (): State => structuredClone({ checklist: seed.checklist, approvals: seed.approvals, evidence: seed.evidence, demoRequests: [] });

// Survive dev-server hot reloads.
const g = globalThis as unknown as { __crewcanvas?: State };
const state = () => (g.__crewcanvas ??= fresh());

let seq = 0;
const id = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(seq++).toString(36)}`;

/** Build a snapshot from plain arrays — shared by the memory store and the public demo. */
export function snapshotFrom(projectId: string, s: Pick<State, "checklist" | "approvals" | "evidence">, asOf = seed.DEMO_AS_OF): ProjectSnapshot | null {
  const project = seed.projects.find((p) => p.id === projectId);
  if (!project) return null;
  const workPackages = seed.workPackages.filter((w) => w.projectId === projectId);
  const wpIds = new Set(workPackages.map((w) => w.id));
  const crewIds = new Set(workPackages.map((w) => w.crewId));
  return {
    asOf,
    project,
    people: seed.people,
    subcontractors: seed.subcontractors,
    crews: seed.crews,
    availability: seed.availability,
    workPackages,
    dependencies: seed.dependencies.filter((d) => d.projectId === projectId),
    checklist: s.checklist.filter((c) => wpIds.has(c.workPackageId)),
    approvals: s.approvals.filter((a) => wpIds.has(a.workPackageId)),
    evidence: s.evidence.filter((e) => e.projectId === projectId),
    externalAssignments: seed.workPackages.filter((w) => w.projectId !== projectId && crewIds.has(w.crewId)),
  };
}

export const memoryRepository: Repository = {
  async listProjects() {
    return seed.projects;
  },
  async getPeople() {
    return seed.people;
  },
  async getSnapshot(projectId) {
    return snapshotFrom(projectId, structuredClone(state()));
  },
  async setChecklistStatus({ itemId, status, personId, note, evidenceId }) {
    const item = state().checklist.find((c) => c.id === itemId);
    if (!item) throw new Error(`Unknown checklist item ${itemId}`);
    item.status = status;
    if (status === "verified") {
      item.verifiedById = personId;
      item.verifiedAt = new Date().toISOString();
    } else {
      delete item.verifiedById;
      delete item.verifiedAt;
    }
    if (note) item.notes = note;
    if (evidenceId) item.evidenceIds.push(evidenceId);
  },
  async recordApproval(input) {
    const a: Approval = { id: id("ap"), ...input };
    state().approvals.push(a);
    return a;
  },
  async revokeApproval({ approvalId, reason }) {
    const a = state().approvals.find((x) => x.id === approvalId);
    if (!a) throw new Error(`Unknown approval ${approvalId}`);
    a.revokedAt = new Date().toISOString();
    a.revokedReason = reason;
  },
  async addEvidence(input) {
    const e: Evidence = { id: id("ev"), ...input };
    state().evidence.push(e);
    return e;
  },
  async addDemoRequest(input) {
    const r: DemoRequest = { id: id("dr"), createdAt: new Date().toISOString(), ...input };
    state().demoRequests.push(r);
    return r;
  },
  async reset() {
    g.__crewcanvas = fresh();
  },
};
