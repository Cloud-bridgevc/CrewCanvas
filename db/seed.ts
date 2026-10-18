// Loads the fictional demo dataset into PostgreSQL:  DATABASE_URL=... npm run db:seed
import { Client } from "pg";
import * as s from "../src/lib/data/seed";

async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  await db.query("BEGIN");
  await db.query(
    "TRUNCATE notifications, demo_requests, evidence, approvals, checklist_events, checklist_items, dependencies, work_packages, crew_availability, crews, subcontractors, projects, people CASCADE",
  );
  for (const p of s.people) await db.query("INSERT INTO people VALUES ($1,$2,$3,$4,$5)", [p.id, p.name, p.role, p.company, p.email]);
  for (const p of s.projects)
    await db.query("INSERT INTO projects (id, code, name, client, location, sector, start_date, end_date, status, contract_value, superintendent_id, project_manager_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)", [
      p.id, p.code, p.name, p.client, p.location, p.sector, p.startDate, p.endDate, p.status, p.contractValue, p.superintendentId, p.projectManagerId,
    ]);
  for (const x of s.subcontractors)
    await db.query("INSERT INTO subcontractors VALUES ($1,$2,$3,$4,$5,$6,$7)", [x.id, x.name, x.trade, x.contactName, x.contactEmail, x.phone, x.hubspotCompanyId ?? null]);
  for (const c of s.crews) await db.query("INSERT INTO crews VALUES ($1,$2,$3,$4,$5,$6)", [c.id, c.subcontractorId, c.name, c.trade, c.headcount, c.foreman]);
  for (const a of s.availability) await db.query("INSERT INTO crew_availability VALUES ($1,$2,$3,$4,$5,$6)", [a.id, a.crewId, a.startDate, a.endDate, a.status, a.reason]);
  for (const w of s.workPackages)
    await db.query("INSERT INTO work_packages VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)", [
      w.id, w.projectId, w.code, w.name, w.trade, w.zone, w.exclusiveZone, w.subcontractorId, w.crewId, w.startDate, w.endDate, w.status, w.percentComplete, w.equipment,
    ]);
  for (const d of s.dependencies) await db.query("INSERT INTO dependencies VALUES ($1,$2,$3,$4,$5,$6)", [d.id, d.projectId, d.predecessorId, d.successorId, d.lagDays, d.note ?? null]);
  for (const c of s.checklist)
    await db.query("INSERT INTO checklist_items VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)", [
      c.id, c.workPackageId, c.label, c.category, c.required, c.status, c.responsibleParty, c.dueBy ?? null, c.verifiedById ?? null, c.verifiedAt ?? null, c.evidenceIds, c.notes ?? null, c.linkedWorkPackageId ?? null,
    ]);
  for (const a of s.approvals)
    await db.query("INSERT INTO approvals (id, work_package_id, approved_by_id, approved_at, verified_item_ids, notes) VALUES ($1,$2,$3,$4,$5,$6)", [a.id, a.workPackageId, a.approvedById, a.approvedAt, a.verifiedItemIds, a.notes ?? null]);
  for (const e of s.evidence)
    await db.query("INSERT INTO evidence VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)", [e.id, e.projectId, e.workPackageId, e.type, e.title, e.body ?? null, e.submittedById, e.submittedAt, e.s3Key ?? null, e.tags]);
  await db.query("COMMIT");
  await db.end();
  console.log("Seeded CrewCanvas demo data.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
