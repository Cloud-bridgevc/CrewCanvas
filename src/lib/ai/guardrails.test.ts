import { describe, expect, it } from "vitest";
import { applyGuardrail } from "./guardrails";

describe("narration guardrail", () => {
  it.each([
    "The Level 2 deck is ready for the pour.",
    "The site is safe for crews on Thursday.",
    "Summit is cleared to proceed.",
    "It is safe to pour once the pump arrives.",
    "No safety risks remain on Level 2.",
  ])("rejects: %s", (t) => expect(applyGuardrail(t).ok).toBe(false));

  it.each([
    "The L2 pour is blocked: Keystone has not issued the steel connection inspection report.",
    "Dana Ruiz approved the electrical rough-in after all three checklist items were verified.",
    "Consider asking Brightline to staff temporary power with Crew B.",
  ])("allows: %s", (t) => expect(applyGuardrail(t).ok).toBe(true));
});
