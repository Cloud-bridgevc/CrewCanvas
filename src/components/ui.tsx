import type { ReactNode } from "react";
import type { ReadinessState, RiskLevel, Severity } from "@/lib/engine";
import { READINESS_LABEL } from "@/lib/engine/readiness";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
        <rect width="26" height="26" rx="5" fill="#f26b1d" />
        <path d="M6 18 L13 6 L20 18 Z" fill="none" stroke="#1b1e21" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M9.5 14h7" stroke="#1b1e21" strokeWidth="2.2" />
      </svg>
      <span className={cx("font-display text-[17px] font-extrabold tracking-tight", dark ? "text-white" : "text-char-900")}>
        Crew<span className="text-safety-500">Canvas</span>
      </span>
    </span>
  );
}

export const STATE_STYLE: Record<ReadinessState, { chip: string; bar: string; dot: string }> = {
  blocked: { chip: "bg-bad-100 text-bad-600 ring-bad-600/20", bar: "#c23b3b", dot: "bg-bad-600" },
  not_verified: { chip: "bg-warn-100 text-warn-600 ring-warn-600/20", bar: "#d99a06", dot: "bg-warn-600" },
  awaiting_approval: { chip: "bg-steel-100 text-steel-700 ring-steel-600/20", bar: "#5b7a99", dot: "bg-steel-500" },
  approved: { chip: "bg-ok-100 text-ok-600 ring-ok-600/20", bar: "#2f9e6b", dot: "bg-ok-600" },
  complete: { chip: "bg-char-100 text-char-600 ring-char-500/20", bar: "#8a9199", dot: "bg-char-400" },
};

export function StateBadge({ state, short = false }: { state: ReadinessState; short?: boolean }) {
  const label = short && state === "awaiting_approval" ? "Awaiting approval" : READINESS_LABEL[state];
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset", STATE_STYLE[state].chip)}>
      <span className={cx("h-1.5 w-1.5 rounded-full", STATE_STYLE[state].dot)} />
      {label}
    </span>
  );
}

const LEVEL_STYLE: Record<RiskLevel | Severity, string> = {
  critical: "bg-bad-600 text-white",
  high: "bg-safety-500 text-white",
  medium: "bg-warn-100 text-warn-600",
  low: "bg-char-100 text-char-600",
};

export function LevelBadge({ level }: { level: RiskLevel | Severity }) {
  return <span className={cx("inline-block rounded px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide", LEVEL_STYLE[level])}>{level}</span>;
}

export function Card({ children, className, title, action, subtitle }: { children: ReactNode; className?: string; title?: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <section className={cx("min-w-0 rounded-xl border border-char-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]", className)}>
      {title && (
        <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 border-b border-char-100 px-4 py-3.5 sm:px-5">
          <div>
            <h2 className="font-display text-[15px] font-bold text-char-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-char-500">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, hint, tone = "default" }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "default" | "bad" | "warn" | "ok" | "steel" }) {
  const toneCls = { default: "text-char-900", bad: "text-bad-600", warn: "text-warn-600", ok: "text-ok-600", steel: "text-steel-600" }[tone];
  return (
    <div className="min-w-0 rounded-xl border border-char-200 bg-white px-3.5 py-3 sm:px-4 sm:py-3.5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-char-500">{label}</div>
      <div className={cx("mt-1 font-display text-xl font-bold tabular-nums sm:text-2xl", toneCls)}>{value}</div>
      {hint && <div className="mt-0.5 text-[11px] leading-snug text-char-500 sm:text-xs">{hint}</div>}
    </div>
  );
}

export function GroundingNote({ className }: { className?: string }) {
  return (
    <p className={cx("flex items-start gap-2 rounded-lg border border-steel-200 bg-steel-50 px-3 py-2 text-xs leading-relaxed text-steel-700", className)}>
      <svg className="mt-0.5 h-3.5 w-3.5 flex-none" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M8 1 2 3.5v4C2 11 4.6 14.2 8 15c3.4-.8 6-4 6-7.5v-4L8 1Zm-.8 10L4.5 8.3l1.1-1.1 1.6 1.6 3.3-3.3 1.1 1.1L7.2 11Z" />
      </svg>
      <span>
        Readiness comes only from verified checklist records and an authorized person&apos;s approval. AI text summarizes those records and suggests actions; it never marks work safe or ready.
      </span>
    </p>
  );
}

export function AiTag({ source, model, guardrail }: { source: "bedrock" | "template"; model?: string; guardrail?: string }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-[11px] text-char-500">
      <span className="rounded bg-char-900 px-1.5 py-0.5 font-mono text-[10px] font-medium text-safety-400">AI</span>
      {source === "bedrock" ? `Amazon Bedrock · ${model}` : "Deterministic summary (Bedrock off)"}
      {guardrail && <span className="text-warn-600">· {guardrail}</span>}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="px-5 py-8 text-center text-sm text-char-500">{children}</div>;
}
