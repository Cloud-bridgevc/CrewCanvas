// Core domain model for CrewCanvas. Dates are ISO calendar dates (YYYY-MM-DD).
export type ISODate = string;

export type Role = "superintendent" | "project_manager" | "project_engineer" | "safety_manager" | "foreman";

/** Roles allowed to record a human readiness approval. */
export const APPROVER_ROLES: Role[] = ["superintendent", "project_manager"];

export interface Person {
  id: string;
  name: string;
  role: Role;
  company: string;
  email: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  location: string;
  sector: string;
  startDate: ISODate;
  endDate: ISODate;
  status: "active" | "preconstruction" | "closeout";
  contractValue: string;
  superintendentId: string;
  projectManagerId: string;
}

export interface Subcontractor {
  id: string;
  name: string;
  trade: string;
  contactName: string;
  contactEmail: string;
  phone: string;
  hubspotCompanyId?: string;
}

export interface Crew {
  id: string;
  subcontractorId: string;
  name: string;
  trade: string;
  headcount: number;
  foreman: string;
}

/** Exceptions to a crew's default Mon–Sat availability. */
export interface CrewAvailability {
  id: string;
  crewId: string;
  startDate: ISODate;
  endDate: ISODate;
  status: "unavailable" | "reduced";
  reason: string;
}

export type WorkPackageStatus = "not_started" | "in_progress" | "complete" | "on_hold";

export interface WorkPackage {
  id: string;
  projectId: string;
  code: string;
  name: string;
  trade: string;
  zone: string;
  /** Exclusive zones cannot be shared with another active package. */
  exclusiveZone: boolean;
  subcontractorId: string;
  crewId: string;
  startDate: ISODate;
  endDate: ISODate;
  status: WorkPackageStatus;
  percentComplete: number;
  equipment: string[];
}

export interface Dependency {
  id: string;
  projectId: string;
  predecessorId: string;
  successorId: string;
  /** Finish-to-start lag in calendar days. */
  lagDays: number;
  note?: string;
}

export type ChecklistCategory = "prerequisite" | "safety" | "quality" | "logistics" | "permit";
export type ChecklistStatus = "verified" | "pending" | "failed" | "not_applicable";

export interface ChecklistItem {
  id: string;
  workPackageId: string;
  label: string;
  category: ChecklistCategory;
  required: boolean;
  status: ChecklistStatus;
  /** Who is responsible for producing the verification. */
  responsibleParty: string;
  dueBy?: ISODate;
  verifiedById?: string;
  verifiedAt?: string;
  evidenceIds: string[];
  notes?: string;
  /** Upstream package this verification belongs to (e.g. inspection of prior work). */
  linkedWorkPackageId?: string;
}

export interface Approval {
  id: string;
  workPackageId: string;
  approvedById: string;
  approvedAt: string;
  /** Checklist items that were verified at the moment of approval. */
  verifiedItemIds: string[];
  notes?: string;
  revokedAt?: string;
  revokedReason?: string;
}

export type EvidenceType = "photo" | "checklist_result" | "progress_note" | "document";

export interface Evidence {
  id: string;
  projectId: string;
  workPackageId: string;
  type: EvidenceType;
  title: string;
  body?: string;
  submittedById: string;
  submittedAt: string;
  /** Object key in the S3 evidence bucket. */
  s3Key?: string;
  tags: string[];
}

export interface DemoRequest {
  id: string;
  name: string;
  email: string;
  company: string;
  companyType: "general_contractor" | "subcontractor" | "owner_developer" | "enterprise";
  role?: string;
  activeProjects?: string;
  message?: string;
  createdAt: string;
  hubspotSynced: boolean;
}

/** Everything the deterministic engine needs to evaluate one project. */
export interface ProjectSnapshot {
  asOf: ISODate;
  project: Project;
  people: Person[];
  subcontractors: Subcontractor[];
  crews: Crew[];
  availability: CrewAvailability[];
  workPackages: WorkPackage[];
  dependencies: Dependency[];
  checklist: ChecklistItem[];
  approvals: Approval[];
  evidence: Evidence[];
  /** Crew assignments on other projects, used for portfolio-wide double-booking checks. */
  externalAssignments: WorkPackage[];
}
