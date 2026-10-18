"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Horizontal scroller that starts with `x` (px) a little in from the left edge. */
export function ScrollTo({ x, children, className }: { x: number; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollLeft = Math.max(0, x - ref.current.clientWidth * 0.25);
  }, [x]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
