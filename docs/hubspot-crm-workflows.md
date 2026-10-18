# HubSpot CRM workflows — CrewCanvas

How CrewCanvas uses HubSpot to sell to, onboard and grow four kinds of account: **general contractors**, **subcontractors**, **construction companies (owners/developers and mid-market builders)** and **enterprise opportunities**. The website demo form (`POST /api/demo-request` → `src/lib/hubspot.ts`) is the main entry point today.

---

## 1. Data model

### Objects and associations
| HubSpot object | Represents | Key associations |
|---|---|---|
| Contact | A person (superintendent, PM, VP Ops, estimator, sub's owner/PM) | Company, Deal |
| Company | GC, subcontractor, owner/developer, enterprise builder | Contacts, Deals, parent/child company (enterprise regions) |
| Deal | A sales opportunity (new logo, expansion, renewal) | Contact(s), Company |
| Ticket | Onboarding / support issue after close | Company, Contact |

### Custom properties (create before turning on the integration)
| Object | Internal name | Type | Values / notes |
|---|---|---|---|
| Contact, Company, Deal | `crewcanvas_segment` | Dropdown | General Contractor · Subcontractor · Owner / Developer · Enterprise Construction Company |
| Contact | `crewcanvas_active_projects` | Dropdown | 1–5 · 6–20 · 21–50 · 50+ |
| Contact | `crewcanvas_field_role` | Dropdown | Superintendent · Project Manager · Project Engineer · Safety · Operations Exec · Sub Owner/PM · Other |
| Company | `crewcanvas_trade` | Dropdown | Concrete, Steel, Electrical, Mechanical/Plumbing, Fire Protection, Glazing, Roofing, Inspection, Other (subs only) |
| Company | `crewcanvas_annual_volume` | Dropdown | <$25M · $25–100M · $100–500M · $500M+ |
| Company | `crewcanvas_invited_by_gc` | Company reference (text ID) | Set when a sub was invited from a GC's project — powers the network loop |
| Company | `crewcanvas_workspace_id` | Single-line text | Product workspace ID after provisioning |
| Company | `crewcanvas_active_projects_product` | Number | Synced nightly from product usage |
| Company | `crewcanvas_weekly_active_users` | Number | Synced nightly |
| Deal | `crewcanvas_plan` | Dropdown | Project · Contractor · Enterprise |
| Deal | `crewcanvas_pilot_project` | Single-line text | The real project loaded for the demo/pilot |

> The integration writes `crewcanvas_segment` and `crewcanvas_active_projects`; the rest are maintained by sales/CS or the nightly usage sync.

---

## 2. Pipelines

### A. GC New Business (general contractors, owners/developers, mid-market builders)
| Stage | Entry criteria | Exit / automation |
|---|---|---|
| Demo requested | Form submit with segment GC or Owner/Developer | Auto-assign owner by territory; task “Call within 1 business day” |
| Discovery booked | Meeting scheduled | Send pre-call email asking for a current 3-week look-ahead |
| Live-project demo | Their look-ahead loaded into CrewCanvas | Log `crewcanvas_pilot_project` |
| Pilot (30 days) | Pilot workspace provisioned | Create onboarding ticket; weekly usage digest to owner |
| Proposal | Pilot success criteria reviewed | Quote generated (Project or Contractor plan) |
| Closed won / lost | — | Won → CS handoff workflow; Lost → nurture with reason |

### B. Enterprise
Same front stages, plus **Security & IT review** (SSO, data residency, dedicated AWS deployment questionnaire) and **Procurement / MSA** before Closed won. Deals ≥ $100k ARR require a manager approval property before Proposal.

### C. Subcontractor Network (non-revenue → revenue)
Subs usually arrive free, invited by a GC to verify their checklist items. Pipeline tracks conversion to paid use on their **own** projects:
`Invited by GC → Activated (first verification recorded) → Multi-GC (invited by ≥2 GCs) → Sales conversation → Converted`.

### D. Expansion & Renewal (existing customers)
`Expansion signal → Qualified → Proposal → Closed` for added projects/regions; renewals auto-created 120 days before term end.

---

## 3. Workflows

### W1 — Demo request intake & routing (contact-based)
**Trigger:** form submission via API (contact created/updated with `crewcanvas_segment` known).
1. Set lifecycle stage: GC / Enterprise → *Sales Qualified Lead*; Sub / Owner → *Lead*.
2. Branch on `crewcanvas_segment`:
   - **Enterprise** or `crewcanvas_active_projects` = 50+ → rotate to Enterprise AE team, create Deal in *Enterprise* pipeline, Slack alert to #enterprise-leads.
   - **General Contractor** / **Owner/Developer** → round-robin to territory AE, Deal in *GC New Business* at *Demo requested*.
   - **Subcontractor** → no AE; enroll in W4 (sub nurture); check `crewcanvas_invited_by_gc` and notify that GC's account owner.
3. Create task for owner: “Book discovery — request a current look-ahead”, due +1 business day.
4. Send confirmation email with calendar link.
5. If no meeting booked after 3 business days → second email + task; after 10 days → move to nurture (W5).

### W2 — Pilot health (deal-based)
**Trigger:** Deal enters *Pilot*.
1. Create onboarding ticket in CS pipeline; associate company & champion.
2. Day 3: if `crewcanvas_weekly_active_users` < 3 → task for CSM “Field adoption check”.
3. Day 10: email champion a summary of blockers caught (from product usage sync).
4. Day 25: task for AE “Pilot review & proposal”; move to *Proposal* when the review meeting is logged.

### W3 — Closed won → onboarding handoff
**Trigger:** Deal stage = Closed won.
1. Set company lifecycle = *Customer*; copy `crewcanvas_plan` to company.
2. Create onboarding ticket; assign CSM by segment.
3. Webhook to product provisioning (creates workspace, writes back `crewcanvas_workspace_id`).
4. Enroll all associated contacts in role-based onboarding emails (superintendent: readiness checklists; PM: conflicts & reports; exec: portfolio view).

### W4 — Subcontractor activation & network loop (company-based)
**Trigger:** company with segment *Subcontractor* is created.
1. Welcome email explaining what the inviting GC needs them to verify.
2. When product sync shows first recorded verification → stage *Activated*.
3. When invited by a 2nd distinct GC → stage *Multi-GC*, create task for partner/sales rep: “Offer CrewCanvas for their own projects”.
4. Monthly: sub gets a “your on-time verification rate” digest — a reason to log in and a soft upsell.

### W5 — Nurture (unconverted leads)
Segment-specific monthly content: GC (avoiding failed mobilizations), Owner (schedule certainty), Enterprise (portfolio risk), Sub (getting paid faster with clean evidence). Re-enter W1 on any high-intent action (pricing page twice in 7 days, demo video watched > 75%).

### W6 — Expansion signals (company-based, customers only)
**Trigger:** `crewcanvas_active_projects_product` ≥ 80% of plan limit **or** a new regional office contact joins.
→ Create Deal in *Expansion & Renewal*, notify account owner. Renewal deal auto-created 120 days before term end.

---

## 4. Lead scoring
| Signal | Points |
|---|---|
| Segment = Enterprise / GC | +25 / +20 |
| Active projects 21–50 / 50+ | +15 / +25 |
| Field role = Superintendent, PM or Ops Exec | +10 |
| Visited pricing page | +10 |
| Invited ≥ 2 subs to a pilot | +20 |
| Personal email domain | −15 |
| Score ≥ 50 → MQL; ≥ 70 with a booked meeting → SQL | |

---

## 5. Integration notes
- **Implemented:** `src/lib/hubspot.ts` upserts the contact by email (`/crm/v3/objects/contacts/batch/upsert`), creates company and deal, and associates all three (`/crm/v4/.../associations/default/...`). It only runs when `HUBSPOT_ACCESS_TOKEN` is set. Demo requests are always stored first (`demo_requests` table), so a HubSpot outage never loses a lead; `hubspot_synced=false` rows can be replayed.
- **Private app scopes:** `crm.objects.contacts.write`, `crm.objects.companies.write`, `crm.objects.deals.write`, `crm.schemas.*.read`.
- **Pipeline/stage IDs:** set `HUBSPOT_PIPELINE_ID` / `HUBSPOT_DEALSTAGE_ID`; enterprise routing to a separate pipeline is done by W1 inside HubSpot rather than in code, so sales ops can change it without a deploy.
- **Planned:** nightly usage sync Lambda (active projects, WAU, blockers caught) writing company properties; company dedupe by domain before create.
- **Privacy:** only form fields are sent. No project, checklist or evidence data leaves CrewCanvas for HubSpot.
