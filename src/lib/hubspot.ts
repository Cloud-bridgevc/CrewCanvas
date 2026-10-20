import "server-only";
import type { DemoRequest } from "./types";

/**
 * Demo request -> HubSpot contact + company + deal (CRM v3 API).
 * Workflow design lives in docs/hubspot-crm-workflows.md.
 */
const API = "https://api.hubapi.com";

const SEGMENT: Record<DemoRequest["companyType"], { lifecycle: string; segment: string }> = {
  general_contractor: { lifecycle: "salesqualifiedlead", segment: "General Contractor" },
  subcontractor: { lifecycle: "lead", segment: "Subcontractor" },
  owner_developer: { lifecycle: "lead", segment: "Owner / Developer" },
  enterprise: { lifecycle: "salesqualifiedlead", segment: "Enterprise Construction Company" },
};

export function hubspotConfigured() {
  return Boolean(process.env.HUBSPOT_ACCESS_TOKEN);
}

async function hs(path: string, body: unknown) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HubSpot ${path} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<{ id: string }>;
}

export async function syncDemoRequest(r: Omit<DemoRequest, "id" | "createdAt" | "hubspotSynced">): Promise<boolean> {
  if (!hubspotConfigured()) return false;
  const seg = SEGMENT[r.companyType];
  const [firstname, ...rest] = r.name.trim().split(/\s+/);
  // Upsert by email so repeat requests don't duplicate contacts.
  const contact = await hs("/crm/v3/objects/contacts/batch/upsert", {
    inputs: [
      {
        idProperty: "email",
        id: r.email,
        properties: {
          email: r.email,
          firstname,
          lastname: rest.join(" "),
          company: r.company,
          jobtitle: r.role ?? "",
          lifecyclestage: seg.lifecycle,
          crewcanvas_segment: seg.segment,
          crewcanvas_active_projects: r.activeProjects ?? "",
        },
      },
    ],
  }).then((x) => (x as unknown as { results: { id: string }[] }).results[0]);
  const company = await hs("/crm/v3/objects/companies", { properties: { name: r.company, crewcanvas_segment: seg.segment } });
  const deal = await hs("/crm/v3/objects/deals", {
    properties: {
      dealname: `${r.company} — CrewCanvas demo`,
      pipeline: process.env.HUBSPOT_PIPELINE_ID ?? "default",
      dealstage: process.env.HUBSPOT_DEALSTAGE_ID ?? "appointmentscheduled",
      crewcanvas_segment: seg.segment,
      ...(r.plan && r.plan !== "unsure" ? { crewcanvas_plan: r.plan[0].toUpperCase() + r.plan.slice(1) } : {}),
      description: r.message ?? "",
    },
  });
  // Default association types: contact↔company 279, deal↔contact 3, deal↔company 341.
  await Promise.all([
    fetch(`${API}/crm/v4/objects/contacts/${contact.id}/associations/default/companies/${company.id}`, { method: "PUT", headers: { Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}` } }),
    fetch(`${API}/crm/v4/objects/deals/${deal.id}/associations/default/contacts/${contact.id}`, { method: "PUT", headers: { Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}` } }),
    fetch(`${API}/crm/v4/objects/deals/${deal.id}/associations/default/companies/${company.id}`, { method: "PUT", headers: { Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}` } }),
  ]);
  return true;
}
