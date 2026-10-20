import Link from "next/link";
import { DemoRequestForm } from "@/components/site/DemoRequestForm";
import { PlanButton, type PlanChoice } from "@/components/site/PlanButton";
import { ReadinessDemo } from "@/components/site/ReadinessDemo";
import { MobileMenu } from "@/components/MobileMenu";
import { Logo } from "@/components/ui";

const FEATURES = [
  {
    n: "01",
    title: "Site Readiness Assistant",
    body: "Reads the recorded checklist for every upcoming activity and flags what is unverified before the crew is dispatched — with who owns it and when it is due.",
  },
  {
    n: "02",
    title: "Schedule Conflict Detection",
    body: "Finds overlapping tasks, double-booked or unavailable crews, out-of-sequence dependencies, shared equipment and conflicting work windows across your whole portfolio.",
  },
  {
    n: "03",
    title: "Readiness Risk Analysis",
    body: "Ranks the next three weeks of work by unresolved dependencies. Every point in the score has a plain-language reason, so a warning is never a black box.",
  },
  {
    n: "04",
    title: "Progress Evidence Summaries",
    body: "Turns photos, checklist results and field notes into a short activity summary per work package, compared against planned progress.",
  },
  {
    n: "05",
    title: "Corrective Action Recommendations",
    body: "Suggests the practical next move: hold, verify, resequence, reassign a crew or escalate — and changes the suggestion as soon as the facts change.",
  },
];

const USE_CASES = [
  { role: "Superintendents", title: "Walk into the 6:30 huddle knowing what can actually start.", points: ["Daily coordination report in one click", "Blockers listed with owner and due date", "Approve readiness from the field"] },
  { role: "Project managers", title: "Catch the inspection that never came back — three days early.", points: ["Prerequisite tracking tied to upstream work", "Slip impact on downstream trades", "Sub accountability without chasing emails"] },
  { role: "Subcontractors", title: "Stop mobilizing crews to areas that aren't turned over.", points: ["See exactly what's owed to unlock your start", "Earlier notice when sequences move", "Evidence uploads straight from the phone"] },
  { role: "Operations leaders", title: "See readiness risk across every job, not just the loud ones.", points: ["Portfolio-wide crew double-booking", "Consistent readiness standards", "Approval audit trail per package"] },
];

export const metadata = { alternates: { canonical: "/" } };

const NAV: [string, string][] = [["#product", "Product"], ["#use-cases", "Use cases"], ["#demo", "Live demo"], ["#pricing", "Pricing"], ["#team", "Team"]];

const TEAM = [
  { name: "King Frank", title: "Founder & CEO" },
  { name: "Donald Achong", title: "Co-Founder & CTO" },
];

const LINKEDIN_URL = "https://www.linkedin.com/company/crewcanvas/";

const PLANS = [
  { name: "Project", price: "$390", unit: "per active project / month", choice: { plan: "project" } as PlanChoice, desc: "For a single job that needs tighter trade coordination.", features: ["Unlimited work packages & checklists", "Conflict detection & risk ranking", "Daily coordination report", "Subcontractor guest access"], cta: "Start with one project" },
  { name: "Contractor", price: "$2,400", unit: "per month · up to 10 active projects", choice: { plan: "contractor", companyType: "general_contractor" } as PlanChoice, desc: "For general contractors running a multi-project portfolio.", features: ["Everything in Project", "Portfolio crew availability", "AI evidence summaries & recommendations", "HubSpot & scheduling integrations", "Priority onboarding"], cta: "Request a demo", featured: true },
  { name: "Enterprise", price: "Custom", unit: "annual agreement", choice: { plan: "enterprise", companyType: "enterprise" } as PlanChoice, desc: "For enterprise builders with regional operations and IT requirements.", features: ["Everything in Contractor", "SSO, audit export & data residency", "Dedicated AWS deployment option", "Custom readiness templates by region", "Named customer success team"], cta: "Talk to sales" },
];

export default function Home() {
  return (
    <div className="bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-char-800 bg-char-900/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/"><Logo dark /></Link>
          <nav className="hidden items-center gap-7 text-sm text-char-300 md:flex">
            <a href="#product" className="hover:text-white">Product</a>
            <a href="#use-cases" className="hover:text-white">Use cases</a>
            <a href="#demo" className="hover:text-white">Live demo</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#team" className="hover:text-white">Team</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/app" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-char-200 hover:text-white sm:block">Open dashboard</Link>
            <a href="#request" className="rounded-lg bg-safety-500 px-3 py-2 text-sm font-bold text-white hover:bg-safety-600 sm:px-4">Request demo</a>
            <div className="md:hidden">
              <MobileMenu dark top="top-16" panelClassName="border-b border-char-800 bg-char-900">
                <nav className="flex flex-col px-4 py-3 text-base text-char-200">
                  {NAV.map(([h, l]) => (
                    <a key={h} href={h} className="border-b border-char-800 py-3.5 font-medium hover:text-white">{l}</a>
                  ))}
                  <Link href="/app" className="mt-3 rounded-lg border border-char-600 py-3 text-center font-semibold text-white">Open dashboard</Link>
                </nav>
              </MobileMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="blueprint-grid relative overflow-hidden bg-char-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:pb-28 lg:pt-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-char-700 bg-char-800 px-3 py-1 text-xs font-medium text-char-300">
              <span className="h-1.5 w-1.5 rounded-full bg-safety-500" /> Crew coordination & site readiness for general contractors
            </p>
            <h1 className="mt-6 font-display text-[2.5rem] font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Know what&apos;s ready <span className="text-safety-500">before</span> the crew shows up.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-char-300">
              CrewCanvas connects your schedule, subcontractors, crew availability and site checklists — then flags the missing inspection, the double-booked crew and the overlapping work window days before they cost you a mobilization.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href="#demo" className="rounded-lg text-center bg-safety-500 px-6 py-3 text-sm font-bold text-white hover:bg-safety-600">Try the readiness demo</a>
              <a href="#request" className="rounded-lg border border-char-600 px-6 py-3 text-center text-sm font-semibold text-white hover:border-char-400">Book a walkthrough</a>
            </div>
            <p className="mt-6 max-w-lg text-sm text-char-400">
              AI explains risk and suggests next steps. Readiness is still decided by verified checklist results and an authorized person&apos;s sign-off.
            </p>
          </div>

          {/* Hero visual */}
          <div className="relative">
            <div className="rounded-2xl border border-char-700 bg-char-800/80 p-5 shadow-2xl">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-char-400">LOOK-AHEAD · WEEK OF OCT 19</span>
                <span className="rounded bg-bad-600 px-2 py-0.5 font-bold">1 BLOCKED</span>
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  ["Level 1 electrical rough-in", "Oct 20", "bg-ok-600", "Approved · D. Ruiz"],
                  ["Fire sprinkler mains — L1", "Oct 20", "bg-warn-600", "Zone overlap"],
                  ["Level 2 slab-on-deck pour", "Oct 22", "bg-bad-600", "Inspection report missing"],
                  ["Temporary power — L2–3", "Oct 22", "bg-steel-500", "Crew double-booked"],
                  ["Curtain wall — north & east", "Oct 26", "bg-warn-600", "Steel trending late"],
                ].map(([n, d, c, s]) => (
                  <div key={n} className="flex items-center gap-3 rounded-lg bg-char-900/70 px-3 py-2.5">
                    <span className={`h-8 w-1 rounded-full ${c}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{n}</p>
                      <p className="text-xs text-char-400">{s}</p>
                    </div>
                    <span className="font-mono text-xs text-char-400">{d}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-safety-500/40 bg-safety-500/10 p-3 text-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-safety-400">Suggested action</p>
                <p className="mt-1 text-char-100">Hold the L2 pour. Swap in the loading dock slab Oct 22 so Summit Crew 1 stays productive.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="hazard-stripe h-2" />
      </section>

      {/* Built for */}
      <section className="border-b border-char-100 bg-char-50">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-6 text-sm font-semibold uppercase tracking-wider text-char-400 sm:px-6 lg:px-8">
          <span className="text-char-500">Built for</span>
          <span>Healthcare</span><span>Commercial</span><span>Industrial</span><span>Multifamily</span><span>Education</span><span>Interiors</span>
        </div>
      </section>

      {/* Product */}
      <section id="product" className="scroll-mt-16 py-16 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-safety-600">Product</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-char-900 sm:text-4xl">One coordination layer between your schedule and the field.</h2>
            <p className="mt-4 text-lg text-char-600">Work packages, dependencies, crews, checklists and evidence live together, so every warning traces back to a record someone can act on.</p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-char-200 bg-char-200 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.n} className="bg-white p-6 sm:p-7">
                <span className="font-mono text-sm font-medium text-safety-600">{f.n}</span>
                <h3 className="mt-3 font-display text-lg font-bold text-char-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-char-600">{f.body}</p>
              </div>
            ))}
            <div className="flex flex-col justify-between bg-char-900 p-6 text-white sm:p-7">
              <div>
                <span className="font-mono text-sm text-safety-400">+</span>
                <h3 className="mt-3 font-display text-lg font-bold">Daily coordination report</h3>
                <p className="mt-2 text-sm leading-relaxed text-char-300">Blockers, conflicts, approvals needed and today&apos;s actions — ready for the morning huddle.</p>
              </div>
              <Link href="/app/projects/hpm/report" className="mt-6 text-sm font-semibold text-safety-400 hover:text-safety-500">See a sample report →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Grounding */}
      <section className="bg-steel-50 py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-steel-600">How readiness is decided</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-char-900 sm:text-4xl">AI explains. People approve.</h2>
            <p className="mt-4 text-lg text-char-600">
              CrewCanvas never declares a site safe or ready because a model said so. A package is only marked approved when every required checklist item has a recorded verification <em>and</em> an authorized superintendent or project manager signs off.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-char-700">
              <li className="flex gap-3"><Check /> Readiness states are computed by deterministic rules from checklist records — no model in the loop.</li>
              <li className="flex gap-3"><Check /> Reopening a verified item automatically voids the approval it supported.</li>
              <li className="flex gap-3"><Check /> AI text is labeled, grounded only in recorded facts, and filtered for safety or readiness claims.</li>
            </ul>
          </div>
          <div className="grid content-center gap-3 font-mono text-sm">
            {[
              ["Checklist records", "Verified · pending · failed — with who and when", "bg-white border-char-200 text-char-800"],
              ["Readiness rules", "Deterministic: blocked · outstanding · awaiting approval", "bg-white border-char-200 text-char-800"],
              ["Human approval", "Superintendent or PM records the decision", "bg-char-900 border-char-900 text-white"],
            ].map(([t, s, cls], i) => (
              <div key={t}>
                <div className={`rounded-xl border px-5 py-4 ${cls}`}>
                  <p className="font-sans font-bold">{t}</p>
                  <p className="mt-0.5 text-xs opacity-70">{s}</p>
                </div>
                {i < 2 && <div className="ml-8 h-4 w-px bg-steel-400" />}
              </div>
            ))}
            <div className="mt-2 rounded-xl border border-dashed border-steel-400 px-5 py-3 text-xs text-steel-700">
              <span className="font-sans font-bold">Amazon Bedrock</span> — reads the outputs above to write summaries and explain recommendations. It cannot change a readiness state.
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="use-cases" className="scroll-mt-16 py-16 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-wider text-safety-600">Contractor use cases</p>
          <h2 className="mt-2 max-w-2xl font-display text-3xl font-extrabold tracking-tight text-char-900 sm:text-4xl">Built around the people who keep jobs moving.</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map((u) => (
              <div key={u.role} className="rounded-2xl border border-char-200 p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-steel-600">{u.role}</p>
                <h3 className="mt-3 font-display text-lg font-bold leading-snug text-char-900">{u.title}</h3>
                <ul className="mt-4 space-y-2 text-sm text-char-600">
                  {u.points.map((p) => <li key={p} className="flex gap-2"><span className="mt-2 h-1 w-3 flex-none bg-safety-500" />{p}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="scroll-mt-16 bg-char-950 py-20 text-white lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-safety-400">Interactive demo</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">One missing inspection. Watch the plan change.</h2>
              <p className="mt-4 text-char-300">
                The Level 2 deck pour on our fictional medical office project is three days out. Everything is verified except the third-party inspection of the steel connections below it.
              </p>
              <ol className="mt-6 space-y-3 text-sm text-char-300">
                <li><span className="font-mono text-safety-400">1 ·</span> See the warning and the suggested hold-and-swap.</li>
                <li><span className="font-mono text-safety-400">2 ·</span> Mark the inspection <strong className="text-white">✓ verified</strong> — the action changes to an approval request, not a release.</li>
                <li><span className="font-mono text-safety-400">3 ·</span> Approve as the superintendent. Then reopen any item and watch the approval void.</li>
              </ol>
              <Link href="/app/projects/hpm" className="mt-8 inline-block text-sm font-semibold text-safety-400 hover:text-safety-500">Explore the full project dashboard →</Link>
            </div>
            <ReadinessDemo />
          </div>
        </div>
      </section>

      {/* Platform */}
      <section className="border-b border-char-100 py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            ["PostgreSQL", "Projects, schedules, dependencies, crews, checklists and an append-only verification audit trail."],
            ["Amazon S3", "Site photos and inspection reports, uploaded directly from the field with encrypted, short-lived links."],
            ["Amazon Bedrock", "Grounded summaries and recommendation explanations, with deterministic fallbacks."],
            ["AWS Lambda", "Background checks each morning and on change — blocker and conflict notifications to the right people."],
          ].map(([t, d]) => (
            <div key={t}>
              <p className="font-display font-bold text-char-900">{t}</p>
              <p className="mt-1 text-sm text-char-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-16 py-16 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-safety-600">Pricing</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-char-900 sm:text-4xl">Priced per active project, not per seat.</h2>
            <p className="mx-auto mt-4 max-w-xl text-char-600">Invite every foreman and subcontractor at no extra cost. Closed-out projects stay read-only for free.</p>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {PLANS.map((p) => (
              <div key={p.name} className={`flex flex-col rounded-2xl border p-6 sm:p-7 ${p.featured ? "border-safety-500 bg-char-900 text-white shadow-xl" : "border-char-200"}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold">{p.name}</h3>
                  {p.featured && <span className="rounded-full bg-safety-500 px-2.5 py-0.5 text-[11px] font-bold uppercase">Most popular</span>}
                </div>
                <p className={`mt-2 text-sm ${p.featured ? "text-char-300" : "text-char-600"}`}>{p.desc}</p>
                <p className="mt-6 font-display text-4xl font-extrabold">{p.price}</p>
                <p className={`text-xs ${p.featured ? "text-char-400" : "text-char-500"}`}>{p.unit}</p>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                  {p.features.map((f) => <li key={f} className="flex gap-2.5"><Check light={p.featured} />{f}</li>)}
                </ul>
                <PlanButton choice={p.choice} className={`mt-8 rounded-lg px-4 py-2.5 text-center text-sm font-bold ${p.featured ? "bg-safety-500 text-white hover:bg-safety-600" : "border border-char-300 text-char-800 hover:border-char-500"}`}>{p.cta}</PlanButton>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="scroll-mt-16 border-t border-char-100 bg-char-50 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-safety-600">Team</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-char-900 sm:text-4xl">The people building CrewCanvas.</h2>
            <p className="mt-4 text-lg text-char-600">We&apos;re building the coordination layer between the schedule and the field — so crews show up to work that&apos;s actually ready.</p>
          </div>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:max-w-3xl">
            {TEAM.map((m) => (
              <li key={m.name} className="flex items-center gap-4 rounded-2xl border border-char-200 bg-white p-5 sm:p-6">
                <span className="flex h-16 w-16 flex-none items-center justify-center rounded-xl bg-char-900 font-display text-xl font-extrabold text-safety-400" aria-hidden>
                  {m.name.split(" ").map((w) => w[0]).join("")}
                </span>
                <div>
                  <p className="font-display text-lg font-bold text-char-900">{m.name}</p>
                  <p className="text-sm font-medium text-steel-600">{m.title}</p>
                </div>
              </li>
            ))}
          </ul>
          <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-char-700 hover:text-safety-600">
            <LinkedInIcon className="h-4 w-4" /> Follow CrewCanvas on LinkedIn
          </a>
        </div>
      </section>

      {/* Request */}
      <section id="request" className="scroll-mt-16 bg-char-900 py-16 text-white lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.3fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-safety-400">Request a demo</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Bring a real look-ahead. We&apos;ll find the blockers.</h2>
            <p className="mt-4 text-char-300">In 30 minutes we load one of your active projects and walk through readiness, conflicts and the daily report with your team.</p>
          </div>
          <DemoRequestForm />
        </div>
      </section>

      <footer className="bg-char-950 text-sm text-char-400">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
          <div>
            <Link href="/" aria-label="CrewCanvas home"><Logo dark /></Link>
            <p className="mt-3 max-w-xs text-char-500">Crew coordination and site readiness for general contractors.</p>
          </div>
          <nav aria-label="Product">
            <p className="text-xs font-semibold uppercase tracking-wider text-char-500">Product</p>
            <ul className="mt-3 space-y-2">
              <li><a href="#product" className="hover:text-white">Overview</a></li>
              <li><a href="#demo" className="hover:text-white">Live demo</a></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              <li><Link href="/app" className="hover:text-white">Dashboard</Link></li>
            </ul>
          </nav>
          <nav aria-label="Company">
            <p className="text-xs font-semibold uppercase tracking-wider text-char-500">Company</p>
            <ul className="mt-3 space-y-2">
              <li><a href="#team" className="hover:text-white">Team</a></li>
              <li><a href="#use-cases" className="hover:text-white">Use cases</a></li>
              <li><a href="#request" className="hover:text-white">Request a demo</a></li>
            </ul>
          </nav>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-char-500">Follow</p>
            <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" aria-label="CrewCanvas on LinkedIn" className="mt-3 inline-flex items-center gap-2 rounded-lg border border-char-700 px-3 py-2 text-char-200 hover:border-char-500 hover:text-white">
              <LinkedInIcon className="h-4 w-4" /> LinkedIn
            </a>
          </div>
        </div>
        <div className="border-t border-char-800">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-char-500 sm:px-6 lg:px-8">
            <p>© {new Date().getFullYear()} CrewCanvas · crewcanvas.site</p>
            <p>The demo project and the companies and people in it are fictional.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Check({ light = false }: { light?: boolean }) {
  return (
    <svg className={`mt-0.5 h-4 w-4 flex-none ${light ? "text-safety-400" : "text-safety-600"}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M3 8.5 6.5 12 13 4.5" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}
