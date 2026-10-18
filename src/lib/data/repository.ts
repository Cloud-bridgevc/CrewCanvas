import type { Approval, ChecklistStatus, DemoRequest, Evidence, Person, Project, ProjectSnapshot, WorkPackage } from "../types";

export interface PortfolioRow {
  project: Project;
  workPackages: WorkPackage[];
}

/** Persistence boundary. `memory` serves the seeded demo; `postgres` is the production store. */
export interface Repository {
  listProjects(): Promise<Project[]>;
  getPeople(): Promise<Person[]>;
  getSnapshot(projectId: string): Promise<ProjectSnapshot | null>;
  setChecklistStatus(input: { itemId: string; status: ChecklistStatus; personId: string; note?: string; evidenceId?: string }): Promise<void>;
  recordApproval(input: Omit<Approval, "id">): Promise<Approval>;
  revokeApproval(input: { approvalId: string; reason: string }): Promise<void>;
  addEvidence(input: Omit<Evidence, "id">): Promise<Evidence>;
  addDemoRequest(input: Omit<DemoRequest, "id" | "createdAt">): Promise<DemoRequest>;
  /** Restore demo data (memory store only). */
  reset?(): Promise<void>;
}
