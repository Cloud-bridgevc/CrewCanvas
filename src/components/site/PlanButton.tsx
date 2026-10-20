"use client";

import type { ReactNode } from "react";
import type { DemoRequest } from "@/lib/types";

export const PLAN_EVENT = "crewcanvas:plan";
export type PlanChoice = { plan: NonNullable<DemoRequest["plan"]>; companyType?: DemoRequest["companyType"] };

/** Pricing CTA: jumps to the demo form with this plan pre-selected (plain #request link without JS). */
export function PlanButton({ choice, className, children }: { choice: PlanChoice; className?: string; children: ReactNode }) {
  return (
    <a
      href="#request"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent<PlanChoice>(PLAN_EVENT, { detail: choice }))}
    >
      {children}
    </a>
  );
}
