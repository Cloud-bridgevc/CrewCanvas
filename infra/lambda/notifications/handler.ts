/**
 * Background readiness notifications.
 *
 * Triggered by an EventBridge schedule (weekday mornings) and by `checklist.changed`
 * events. Runs the SAME deterministic engine as the web app against PostgreSQL,
 * then publishes new blockers/conflicts to SNS (fan-out to email/SMS) once per day.
 * Bedrock is not used here: alerts must be exact and reproducible.
 */
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { Pool } from "pg";
import { postgresRepository } from "../../../src/lib/data/postgres";
import { analyzeProject, type Conflict } from "../../../src/lib/engine";

const sns = new SNSClient({});
let pool: Pool;

/** Resolve DATABASE_URL from Secrets Manager once per cold start. */
async function init() {
  if (pool) return;
  if (!process.env.DATABASE_URL && process.env.DB_SECRET_ARN) {
    const sec = await new SecretsManagerClient({}).send(new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN }));
    const { username, password } = JSON.parse(sec.SecretString ?? "{}");
    process.env.DATABASE_URL = `postgres://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${process.env.DB_HOST}:5432/crewcanvas?sslmode=require`;
  }
  pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
}

interface Event {
  source?: string;
  "detail-type"?: string;
  detail?: { projectId?: string };
}

export async function handler(event: Event) {
  await init();
  const projects = event.detail?.projectId ? [{ id: event.detail.projectId }] : await postgresRepository.listProjects();
  let sent = 0;

  for (const p of projects) {
    const snap = await postgresRepository.getSnapshot(p.id);
    if (!snap) continue;
    const a = analyzeProject(snap);
    const alertable = a.conflicts.filter((c) => c.severity !== "medium");
    const approvals = snap.workPackages.filter((w) => {
      const r = a.readiness.get(w.id)!;
      return r.state === "awaiting_approval" && r.daysUntilStart <= 3;
    });

    for (const c of alertable) {
      if (await alreadySent(p.id, "conflict", `${snap.asOf}:${c.id}`, c)) continue;
      await publish(snap.project.name, formatConflict(c), { projectId: p.id, kind: "conflict", severity: c.severity });
      sent++;
    }
    for (const w of approvals) {
      const supt = snap.people.find((x) => x.id === snap.project.superintendentId);
      if (await alreadySent(p.id, "approval_needed", `${snap.asOf}:${w.id}`, { workPackageId: w.id })) continue;
      await publish(
        snap.project.name,
        `Readiness decision needed: "${w.name}" starts ${w.startDate}. All required checklist items are verified; ${supt?.name ?? "the superintendent"} must record approval before work is released.`,
        { projectId: p.id, kind: "approval_needed", severity: "high" },
      );
      sent++;
    }
  }
  return { sent };
}

function formatConflict(c: Conflict) {
  return `[${c.severity.toUpperCase()}] ${c.title}\n${c.detail}`;
}

/** Idempotency: one notification per item per day, even if the function retries. */
async function alreadySent(projectId: string, kind: string, dedupeKey: string, payload: unknown) {
  const res = await pool.query(
    "INSERT INTO notifications (project_id, kind, dedupe_key, payload) VALUES ($1, $2, $3, $4) ON CONFLICT (dedupe_key) DO NOTHING RETURNING id",
    [projectId, kind, dedupeKey, JSON.stringify(payload)],
  );
  return res.rowCount === 0;
}

async function publish(project: string, message: string, attrs: Record<string, string>) {
  await sns.send(
    new PublishCommand({
      TopicArn: process.env.NOTIFY_TOPIC_ARN,
      Subject: `CrewCanvas · ${project}`.slice(0, 99),
      Message: message,
      MessageAttributes: Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k, { DataType: "String", StringValue: v }])),
    }),
  );
}
