"use client";

import { useState } from "react";

const input = "w-full rounded-lg border border-char-600 bg-char-800 px-3 py-2.5 text-sm text-white placeholder:text-char-500 focus:border-safety-500 focus:outline-none";

export function DemoRequestForm() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const body = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/demo-request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) setState("done");
    else {
      setError((await res.json().catch(() => ({}))).error ?? "Something went wrong.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-xl border border-ok-600/50 bg-ok-600/10 p-6 text-white">
        <p className="font-display text-lg font-bold">Request received.</p>
        <p className="mt-1 text-sm text-char-300">A construction specialist will reach out within one business day to schedule a walkthrough using one of your own projects.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <label className="sm:col-span-1"><span className="sr-only">Full name</span><input name="name" required placeholder="Full name" className={input} autoComplete="name" /></label>
      <label><span className="sr-only">Work email</span><input name="email" type="email" required placeholder="Work email" className={input} autoComplete="email" /></label>
      <label><span className="sr-only">Company</span><input name="company" required placeholder="Company" className={input} autoComplete="organization" /></label>
      <label><span className="sr-only">Role</span><input name="role" placeholder="Role (e.g. Superintendent)" className={input} /></label>
      <label>
        <span className="sr-only">Company type</span>
        <select name="companyType" required defaultValue="" className={input}>
          <option value="" disabled>Company type</option>
          <option value="general_contractor">General contractor</option>
          <option value="subcontractor">Subcontractor / specialty trade</option>
          <option value="owner_developer">Owner / developer</option>
          <option value="enterprise">Enterprise construction company (50+ projects)</option>
        </select>
      </label>
      <label>
        <span className="sr-only">Active projects</span>
        <select name="activeProjects" defaultValue="" className={input}>
          <option value="" disabled>Active projects</option>
          <option>1–5</option><option>6–20</option><option>21–50</option><option>50+</option>
        </select>
      </label>
      <label className="sm:col-span-2"><span className="sr-only">What would you like to see?</span><textarea name="message" rows={3} placeholder="What coordination problem should we focus on?" className={input} /></label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button disabled={state === "sending"} className="rounded-lg bg-safety-500 px-6 py-3 text-sm font-bold text-white hover:bg-safety-600 disabled:opacity-60">
          {state === "sending" ? "Sending…" : "Request a demo"}
        </button>
        {state === "error" && <span className="text-sm text-bad-100">{error}</span>}
        <span className="text-xs text-char-500">We only use your details to arrange the demo.</span>
      </div>
    </form>
  );
}
