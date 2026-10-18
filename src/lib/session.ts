import "server-only";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { repo } from "./data";
import { analyzeProject } from "./engine";
import { people } from "./data/seed";

/**
 * Demo identity: a cookie picks which team member you act as.
 * Replace with Cognito / SSO in production — approvals rely on the role.
 */
export async function currentUser() {
  const id = (await cookies()).get("cc_user")?.value ?? "p-dana";
  const all = await repo.getPeople();
  return all.find((p) => p.id === id) ?? people[0];
}

export const loadProject = cache(async (id: string) => {
  const snap = await repo.getSnapshot(id);
  if (!snap) notFound();
  return { snap, analysis: analyzeProject(snap) };
});

export const helpers = (snap: Awaited<ReturnType<typeof loadProject>>["snap"]) => ({
  wp: (id: string) => snap.workPackages.find((w) => w.id === id)!,
  sub: (id: string) => snap.subcontractors.find((s) => s.id === id)!,
  crew: (id: string) => snap.crews.find((c) => c.id === id)!,
  person: (id?: string) => snap.people.find((p) => p.id === id),
});
