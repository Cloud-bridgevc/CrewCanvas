import { Suspense } from "react";
import { narrate } from "@/lib/ai/narrate";
import type { NarrationKind } from "@/lib/ai/guardrails";
import { AiTag } from "./ui";

async function Inner({ kind, facts, template }: { kind: NarrationKind; facts: unknown; template: string }) {
  const n = await narrate(kind, facts, template);
  return (
    <div className="space-y-1.5">
      <p className="text-sm leading-relaxed text-char-700">{n.text}</p>
      <AiTag source={n.source} model={n.model} guardrail={n.guardrail} />
    </div>
  );
}

/** Streams in after the page renders so Bedrock latency never blocks the dashboard. */
export function AiSummary(props: { kind: NarrationKind; facts: unknown; template: string }) {
  return (
    <Suspense fallback={<div className="h-12 animate-pulse rounded bg-char-100" />}>
      <Inner {...props} />
    </Suspense>
  );
}
