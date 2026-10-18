"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "./ui";

/** Hamburger button + slide-down panel. Closes on navigation and on Escape. */
export function MobileMenu({ children, dark = false, label = "Menu", panelClassName, top = "top-14" }: { children: ReactNode; dark?: boolean; label?: string; panelClassName?: string; top?: string }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close menu" : label}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cx("inline-flex h-10 w-10 items-center justify-center rounded-lg", dark ? "text-white hover:bg-char-800" : "text-char-800 hover:bg-char-100")}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {/* Portal: a backdrop-filter on the header would otherwise trap `position: fixed`. */}
      {open && createPortal(
        <div className={cx("fixed inset-x-0 bottom-0 z-50", top)} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="absolute inset-0 bg-char-950/50" onClick={() => setOpen(false)} />
          <div
            className={cx("relative max-h-full overflow-y-auto shadow-xl", panelClassName)}
            onClick={(e) => {
              // Close when a link inside is followed (same-page anchors don't change the path).
              if ((e.target as HTMLElement).closest("a")) setOpen(false);
            }}
          >
            {children}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
