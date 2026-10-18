import { Pool } from "pg";
import type { Repository } from "./repository";
import type { Approval, ChecklistItem, Crew, CrewAvailability, Dependency, Evidence, Person, Project, ProjectSnapshot, Subcontractor, WorkPackage } from "../types";
import { DEMO_AS_OF } from "./seed";

const g = globalThis as unknown as { __pgPool?: Pool };
const pool = () => (g.__pgPool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 5 }));

const d = (v: Date | string | null): string | undefined => (v == null ? undefined : typeof v === "string" ? v.slice(0, 10) : v.toISOString().slice(0, 10));
const ts = (v: Date | string | null): string | undefined => (v == null ? undefined : typeof v === "string" ? v : v.toISOString());

/* eslint-disable @typescript-eslint/no-explicit-any */
const mapProject = (r: any): Project => ({
  id: r.id, code: r.code, name: r.name, client: r.client, location: r.location, sector: r.sector,
  startDate: d(r.start_date)!, endDate: d(r.end_date)!, status: r.status, contractValue: r.contract_value,
  superintendentId: r.superintendent_id, projectManagerId: r.project_manager_id,
});
const mapWp = (r: any): WorkPackage => ({
  id: r.id, projectId: r.project_id, code: r.code, name: r.name, trade: r.trade, zone: r.zone, exclusiveZone: r.exclusive_zone,
  subcontractorId: r.subcontractor_id, crewId: r.crew_id, startDate: d(r.start_date)!, endDate: d(r.end_date)!,
  status: r.status, percentComplete: r.percent_complete, equipment: r.equipment,
});
const mapItem = (r: any): ChecklistItem => ({
  id: r.id, workPackageId: r.work_package_id, label: r.label, category: r.category, required: r.required, status: r.status,
  responsibleParty: r.responsible_party, dueBy: d(r.due_by), verifiedById: r.verified_by_id ?? undefined, verifiedAt: ts(r.verified_at),
  evidenceIds: r.evidence_ids, notes: r.notes ?? undefined, linkedWorkPackageId: r.linked_work_package_id ?? undefined,
});
const mapApproval = (r: any): Approval => ({
  id: r.id, workPackageId: r.work_package_id, approvedById: r.approved_by_id, approvedAt: ts(r.approved_at)!,
  verifiedItemIds: r.verified_item_ids, notes: r.notes ?? undefined, revokedAt: ts(r.revoked_at), revokedReason: r.revoked_reason ?? undefined,
});
const mapEvidence = (r: any): Evidence => ({
  id: r.id, projectId: r.project_id, workPackageId: r.work_package_id, type: r.type, title: r.title, body: r.body ?? undefined,
  submittedById: r.submitted_by_id, submittedAt: ts(r.submitted_at)!, s3Key: r.s3_key ?? undefined, tags: r.tags,
});

const newId = (p: string) => `${p}-${crypto.randomUUID().slice(0, 12)}`;

export const postgresRepository: Repository = {
  async listProjects() {
    const { rows } = await pool().query("SELECT * FROM projects ORDER BY start_date");
    return rows.map(mapProject);
  },
  async getPeople() {
    const { rows } = await pool().query("SELECT * FROM people ORDER BY name");
    return rows as Person[];
  },
  async getSnapshot(projectId) {
    const db = pool();
    const p = await db.query("SELECT * FROM projects WHERE id = $1", [projectId]);
    if (!p.rows[0]) return null;
    const [people, subs, crews, avail, wps, deps, items, approvals, ev] = await Promise.all([
      db.query("SELECT * FROM people"),
      db.query("SELECT id, name, trade, contact_name AS \"contactName\", contact_email AS \"contactEmail\", phone, hubspot_company_id AS \"hubspotCompanyId\" FROM subcontractors"),
      db.query("SELECT id, subcontractor_id AS \"subcontractorId\", name, trade, headcount, foreman FROM crews"),
      db.query("SELECT id, crew_id AS \"crewId\", start_date, end_date, status, reason FROM crew_availability"),
      db.query("SELECT * FROM work_packages WHERE project_id = $1 ORDER BY start_date", [projectId]),
      db.query("SELECT id, project_id AS \"projectId\", predecessor_id AS \"predecessorId\", successor_id AS \"successorId\", lag_days AS \"lagDays\", note FROM dependencies WHERE project_id = $1", [projectId]),
      db.query("SELECT c.* FROM checklist_items c JOIN work_packages w ON w.id = c.work_package_id WHERE w.project_id = $1", [projectId]),
      db.query("SELECT a.* FROM approvals a JOIN work_packages w ON w.id = a.work_package_id WHERE w.project_id = $1", [projectId]),
      db.query("SELECT * FROM evidence WHERE project_id = $1", [projectId]),
    ]);
    const workPackages = wps.rows.map(mapWp);
    const crewIds = workPackages.map((w) => w.crewId);
    const external = await db.query("SELECT * FROM work_packages WHERE project_id <> $1 AND crew_id = ANY($2)", [projectId, crewIds]);
    const snap: ProjectSnapshot = {
      // AS_OF_DATE=today uses the real date; unset keeps the reproducible demo date.
      asOf: process.env.AS_OF_DATE === "today" ? new Date().toISOString().slice(0, 10) : (process.env.AS_OF_DATE ?? DEMO_AS_OF),
      project: mapProject(p.rows[0]),
      people: people.rows as Person[],
      subcontractors: subs.rows as Subcontractor[],
      crews: crews.rows as Crew[],
      availability: avail.rows.map((r: any) => ({ id: r.id, crewId: r.crewId, startDate: d(r.start_date)!, endDate: d(r.end_date)!, status: r.status, reason: r.reason })) as CrewAvailability[],
      workPackages,
      dependencies: deps.rows as Dependency[],
      checklist: items.rows.map(mapItem),
      approvals: approvals.rows.map(mapApproval),
      evidence: ev.rows.map(mapEvidence),
      externalAssignments: external.rows.map(mapWp),
    };
    return snap;
  },
  async setChecklistStatus({ itemId, status, personId, note, evidenceId }) {
    const db = await pool().connect();
    try {
      await db.query("BEGIN");
      await db.query(
        `UPDATE checklist_items SET status = $2,
           verified_by_id = CASE WHEN $2 = 'verified' THEN $3 ELSE NULL END,
           verified_at    = CASE WHEN $2 = 'verified' THEN now() ELSE NULL END,
           notes = COALESCE($4, notes),
           evidence_ids = CASE WHEN $5::text IS NULL THEN evidence_ids ELSE array_append(evidence_ids, $5) END
         WHERE id = $1`,
        [itemId, status, personId, note ?? null, evidenceId ?? null],
      );
      await db.query("INSERT INTO checklist_events (item_id, status, person_id, note) VALUES ($1, $2, $3, $4)", [itemId, status, personId, note ?? null]);
      await db.query("COMMIT");
    } catch (e) {
      await db.query("ROLLBACK");
      throw e;
    } finally {
      db.release();
    }
  },
  async recordApproval(input) {
    const a: Approval = { id: newId("ap"), ...input };
    await pool().query(
      "INSERT INTO approvals (id, work_package_id, approved_by_id, approved_at, verified_item_ids, notes) VALUES ($1,$2,$3,$4,$5,$6)",
      [a.id, a.workPackageId, a.approvedById, a.approvedAt, a.verifiedItemIds, a.notes ?? null],
    );
    return a;
  },
  async revokeApproval({ approvalId, reason }) {
    await pool().query("UPDATE approvals SET revoked_at = now(), revoked_reason = $2 WHERE id = $1", [approvalId, reason]);
  },
  async addEvidence(input) {
    const e: Evidence = { id: newId("ev"), ...input };
    await pool().query(
      "INSERT INTO evidence (id, project_id, work_package_id, type, title, body, submitted_by_id, submitted_at, s3_key, tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [e.id, e.projectId, e.workPackageId, e.type, e.title, e.body ?? null, e.submittedById, e.submittedAt, e.s3Key ?? null, e.tags],
    );
    return e;
  },
  async addDemoRequest(input) {
    const id = newId("dr");
    const { rows } = await pool().query(
      `INSERT INTO demo_requests (id, name, email, company, company_type, role, active_projects, message, hubspot_synced)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING created_at`,
      [id, input.name, input.email, input.company, input.companyType, input.role ?? null, input.activeProjects ?? null, input.message ?? null, input.hubspotSynced],
    );
    return { id, createdAt: ts(rows[0].created_at)!, ...input };
  },
};
