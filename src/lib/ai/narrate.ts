import "server-only";
import { AnthropicBedrockMantle } from "@anthropic-ai/bedrock-sdk";
import { applyGuardrail, SYSTEM_PROMPT, type NarrationKind } from "./guardrails";

export interface Narration {
  text: string;
  source: "bedrock" | "template";
  model?: string;
  /** Set when model text was discarded by the guardrail. */
  guardrail?: string;
}

let client: AnthropicBedrockMantle | null = null;
function bedrock() {
  return (client ??= new AnthropicBedrockMantle({ awsRegion: process.env.AWS_REGION }));
}

export function bedrockEnabled() {
  return process.env.BEDROCK_ENABLED === "true";
}

/**
 * Turn engine facts into prose. The model only rewords facts it is given; the
 * deterministic template is always computed first and is the fallback for any
 * failure, refusal or guardrail hit.
 */
export async function narrate(kind: NarrationKind, facts: unknown, template: string): Promise<Narration> {
  if (!bedrockEnabled()) return { text: template, source: "template" };
  const model = process.env.BEDROCK_MODEL_ID ?? "anthropic.claude-opus-5-5";
  try {
    const res = await bedrock().messages.create({
      model,
      max_tokens: 2000,
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Task: ${TASKS[kind]}\n\nFacts (JSON, the only source you may use):\n${JSON.stringify(facts)}`,
        },
      ],
    });
    if (res.stop_reason === "refusal") return { text: template, source: "template", guardrail: "Model declined; showing template." };
    const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
    const checked = applyGuardrail(text);
    if (!checked.ok) return { text: template, source: "template", guardrail: checked.reason };
    return { text, source: "bedrock", model };
  } catch (err) {
    console.error("[bedrock] narration failed", err);
    return { text: template, source: "template" };
  }
}

const TASKS: Record<NarrationKind, string> = {
  daily_report:
    "Write a 4–6 sentence superintendent's summary for today's coordination meeting. Lead with blockers, then conflicts, then approvals needed. Use the work package names exactly as given.",
  evidence_summary:
    "Summarize the submitted evidence for this work package in 2–4 sentences: what was documented, by whom, what checklist items remain outstanding, and whether progress matches plan.",
  recommendation:
    "Explain in 2–3 plain sentences why these corrective actions are suggested, in the order given. Do not add new actions.",
};
