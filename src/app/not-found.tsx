import Link from "next/link";
import { Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="blueprint-grid flex min-h-screen flex-col items-center justify-center bg-char-900 px-4 text-center text-white">
      <Link href="/" aria-label="CrewCanvas home"><Logo dark /></Link>
      <p className="mt-10 font-mono text-sm text-safety-400">404</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">This page isn&apos;t on the schedule.</h1>
      <p className="mt-3 max-w-md text-char-300">The link may be out of date. Head back to the site or open the demo dashboard.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="rounded-lg bg-safety-500 px-6 py-3 text-sm font-bold text-white hover:bg-safety-600">Back to crewcanvas.site</Link>
        <Link href="/app" className="rounded-lg border border-char-600 px-6 py-3 text-sm font-semibold text-white hover:border-char-400">Open dashboard</Link>
      </div>
    </main>
  );
}
