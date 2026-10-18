export type NarrationKind = "daily_report" | "evidence_summary" | "recommendation";

export const SYSTEM_PROMPT = `You write short coordination summaries for a construction general contractor's project team.

You are given facts computed by CrewCanvas's deterministic readiness engine from recorded checklist results, schedules and human approvals. Use only those facts. Do not invent dates, people, quantities or inspection results.

Readiness is decided by verified checklist records and an authorized person's approval, never by you. Never state or imply that a site, area or activity is safe, ready, cleared or good to go. When the facts show a package as "approved", say it was approved by the named person. When items are unverified, say what is unverified and who is responsible. Describe recommendations as suggestions for the team to decide on.

Write plain prose for busy superintendents. No headings, no bullet lists, no preamble.`;

/**
 * Last line of defence: discard model text that claims safety or readiness on its own authority.
 * A match falls back to the deterministic template.
 */
const FORBIDDEN: { re: RegExp; why: string }[] = [
  { re: /\b(is|are|was|looks|appears|seems)\s+(now\s+)?(completely\s+|fully\s+)?safe\b/i, why: "safety claim" },
  { re: /\bsafe to (proceed|start|pour|work|begin)\b/i, why: "safety claim" },
  { re: /\b(site|area|zone|level|deck|work|activity|pour)\s+(is|are)\s+(now\s+)?(fully\s+)?ready\b/i, why: "readiness claim" },
  { re: /\b(cleared|good) to (go|proceed|start|pour|begin)\b/i, why: "release claim" },
  { re: /\bno (safety )?(risks?|hazards?|issues?) (remain|exist)\b/i, why: "risk-free claim" },
];

export function applyGuardrail(text: string): { ok: true } | { ok: false; reason: string } {
  if (!text) return { ok: false, reason: "Empty model response." };
  for (const f of FORBIDDEN) {
    if (f.re.test(text)) return { ok: false, reason: `Model text removed by guardrail (${f.why}); showing deterministic summary.` };
  }
  return { ok: true };
}
