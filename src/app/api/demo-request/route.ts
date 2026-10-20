import { NextResponse } from "next/server";
import { repo } from "@/lib/data";
import { syncDemoRequest } from "@/lib/hubspot";
import type { DemoRequest } from "@/lib/types";

const TYPES: DemoRequest["companyType"][] = ["general_contractor", "subcontractor", "owner_developer", "enterprise"];
const PLANS: NonNullable<DemoRequest["plan"]>[] = ["project", "contractor", "enterprise", "unsure"];
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const input = {
    name: str(b.name),
    email: str(b.email).toLowerCase(),
    company: str(b.company),
    companyType: b.companyType as DemoRequest["companyType"],
    role: str(b.role) || undefined,
    plan: PLANS.includes(b.plan) ? (b.plan as DemoRequest["plan"]) : undefined,
    activeProjects: str(b.activeProjects, 20) || undefined,
    message: str(b.message, 2000) || undefined,
  };
  if (!input.name || !input.company || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email) || !TYPES.includes(input.companyType)) {
    return NextResponse.json({ error: "Please complete name, a valid work email, company and company type." }, { status: 400 });
  }
  let hubspotSynced = false;
  try {
    hubspotSynced = await syncDemoRequest(input);
  } catch (e) {
    // Never lose a lead because the CRM is down — it is stored and can be re-synced.
    console.error("[hubspot] sync failed", e);
  }
  const saved = await repo.addDemoRequest({ ...input, hubspotSynced });
  return NextResponse.json({ id: saved.id, hubspotSynced });
}
