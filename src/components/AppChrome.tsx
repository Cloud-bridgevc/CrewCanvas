"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { resetDemo, switchUser } from "@/app/app/actions";
import type { Person, Project } from "@/lib/types";
import { cx } from "./ui";

export function SideNav({ projects }: { projects: Project[] }) {
  const path = usePathname();
  return (
    <nav className="space-y-6 text-sm">
      <div>
        <Link href="/app" className={cx("flex items-center gap-2 rounded-md px-3 py-2 font-medium", path === "/app" ? "bg-char-700 text-white" : "text-char-300 hover:bg-char-800 hover:text-white")}>
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M1 2h6v5H1zM9 2h6v3H9zM9 7h6v7H9zM1 9h6v5H1z" /></svg>
          Portfolio
        </Link>
      </div>
      <div>
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-char-500">Projects</div>
        {projects.map((p) => {
          const active = path.startsWith(`/app/projects/${p.id}`);
          return (
            <Link key={p.id} href={`/app/projects/${p.id}`} className={cx("block rounded-md px-3 py-2", active ? "bg-char-700 text-white" : "text-char-300 hover:bg-char-800 hover:text-white")}>
              <span className="block font-mono text-[10px] text-safety-400">{p.code}</span>
              <span className="block leading-snug">{p.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function UserSwitcher({ people, current }: { people: Person[]; current: Person }) {
  const [pending, start] = useTransition();
  return (
    <label className="block text-xs text-char-400">
      <span className="mb-1 block font-semibold uppercase tracking-wider text-char-500">Acting as</span>
      <select
        className="w-full rounded-md border border-char-600 bg-char-800 px-2 py-1.5 text-sm text-white"
        defaultValue={current.id}
        disabled={pending}
        onChange={(e) => start(() => switchUser(e.target.value))}
      >
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} — {p.role.replace("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ResetButton() {
  const [pending, start] = useTransition();
  return (
    <button onClick={() => start(() => resetDemo())} disabled={pending} className="w-full rounded-md border border-char-600 px-3 py-1.5 text-xs text-char-300 hover:border-char-400 hover:text-white disabled:opacity-50">
      {pending ? "Resetting…" : "Reset demo data"}
    </button>
  );
}

const TABS = [
  ["", "Overview"],
  ["/work-packages", "Work packages"],
  ["/readiness", "Readiness"],
  ["/crews", "Crews"],
  ["/subcontractors", "Subcontractors"],
  ["/evidence", "Evidence"],
  ["/risks", "Blockers & risk"],
  ["/report", "Daily report"],
] as const;

export function ProjectTabs({ projectId, counts }: { projectId: string; counts: Partial<Record<string, number>> }) {
  const path = usePathname();
  const base = `/app/projects/${projectId}`;
  const nav = useRef<HTMLElement>(null);
  // Keep the active tab visible on narrow screens (scrolls the strip only, never the page).
  useEffect(() => {
    const el = nav.current?.querySelector<HTMLElement>("[data-active]");
    if (nav.current && el) nav.current.scrollLeft = el.offsetLeft - (nav.current.clientWidth - el.offsetWidth) / 2;
  }, [path]);
  return (
    <nav ref={nav} className="relative -mb-px flex gap-1 overflow-x-auto text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map(([seg, label]) => {
        const href = base + seg;
        const active = seg === "" ? path === base : path.startsWith(href);
        const n = counts[seg];
        return (
          <Link key={seg} href={href} data-active={active || undefined} className={cx("flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 font-medium", active ? "border-safety-500 text-char-900" : "border-transparent text-char-500 hover:text-char-800")}>
            {label}
            {n ? <span className="rounded-full bg-bad-600 px-1.5 text-[10px] font-bold text-white">{n}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
