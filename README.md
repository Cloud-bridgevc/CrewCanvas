# CrewCanvas

AI-native crew coordination and site-readiness platform for general contractors. It coordinates subcontractors, work dependencies, crew availability, readiness checklists and progress evidence. Readiness is grounded in verified checklist records and **human approval**. AI writes summaries and explains suggestions, but it never decides whether work can start.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. The app runs on seeded, fictional demo data in memory, so it needs no database or AWS account.

| URL | What |
|---|---|
| `/` | Public website: product, use cases, **interactive readiness demo**, pricing, demo request form |
| `/app` | Portfolio dashboard (3 fictional projects) |
| `/app/projects/hpm` | Harbor Point Medical Pavilion: timeline, act-now actions, conflicts |
| `…/work-packages` · `/readiness` · `/crews` · `/subcontractors` · `/evidence` · `/risks` · `/report` | Work packages and dependencies, checklists and approvals, crew availability grid, subcontractor assignments, evidence and AI summaries, blocker and risk ranking, daily coordination report |

Use **Acting as** in the sidebar to switch between team members. Only a superintendent or project manager can record a readiness approval. **Reset demo data** puts the scenario back to its starting state.

## The demonstration scenario
The demo date is fixed at **Mon Oct 19, 2026**, so the scenario plays out the same way every time.

- **Level 2 slab-on-deck pour** (Oct 22) has 5 of 6 required items verified. The **special inspection of the L2 steel connections** (Keystone Testing) is still *pending*. Result: the package is **Blocked**, raises a **critical** missing-prerequisite warning and ranks as the top risk. The suggested actions are: hold the pour and the pump, get the inspection report by Oct 21, and swap in the fully verified loading dock slab so Summit's crew stays productive.
- Mark the inspection **verified** and the state becomes **Checklist verified · awaiting approval**. The suggestion changes to *route to the superintendent for a decision*. Nothing is released automatically.
- Approve as Dana Ruiz (Superintendent) and the package is **Approved for work**. Reopen any item and the approval is voided.
- The scenario also includes: Brightline Crew A double-booked (suggestion: reassign to Crew B), an exclusive-zone overlap in Level 1 East, Clearview's crew unavailable on the curtain-wall start date, steel L3–Roof trending 4 days late (which threatens curtain wall and roofing), and a reduced-capacity ironworker crew.

## Tests
```bash
npm test        # engine and guardrail tests
npm run typecheck
```

## Configuration (`.env.example`)
| Variable | Purpose |
|---|---|
| `DATA_SOURCE=postgres`, `DATABASE_URL` | Use PostgreSQL instead of the in-memory demo data |
| `AS_OF_DATE` | Override the evaluation date (`today` for real time). Unset = demo date |
| `BEDROCK_ENABLED=true`, `BEDROCK_MODEL_ID`, `AWS_REGION` | Amazon Bedrock narration (`anthropic.claude-opus-5-5`). When off, deterministic templates are used |
| `S3_EVIDENCE_BUCKET` | Presigned direct-to-S3 uploads for photos and PDFs. When unset, metadata only is recorded |
| `HUBSPOT_ACCESS_TOKEN`, `HUBSPOT_PIPELINE_ID`, `HUBSPOT_DEALSTAGE_ID` | Send demo requests to HubSpot as a contact, company and deal |

### PostgreSQL locally
```bash
npm run db:up
DATABASE_URL=postgres://crewcanvas:crewcanvas@localhost:5432/crewcanvas npm run db:migrate
DATABASE_URL=postgres://crewcanvas:crewcanvas@localhost:5432/crewcanvas npm run db:seed
DATA_SOURCE=postgres DATABASE_URL=postgres://crewcanvas:crewcanvas@localhost:5432/crewcanvas npm run dev
```

## Layout
```
src/lib/engine/     deterministic readiness, conflicts, risk, recommendations, daily report
src/lib/ai/         Bedrock narration, system prompt, guardrail, deterministic templates
src/lib/data/       repository interface, in-memory and PostgreSQL implementations, seed data
src/lib/storage.ts  S3 presigned uploads
src/lib/hubspot.ts  demo request → HubSpot CRM
src/app/            public site (/), dashboard (/app), API routes
db/                 schema.sql, seed.ts
infra/              SAM template (Aurora PostgreSQL, S3, SNS, Lambda, IAM), notifications Lambda
docs/               architecture.md, hubspot-crm-workflows.md
```

See [docs/architecture.md](docs/architecture.md) for the trust boundary and the gaps before production (auth, multi-tenancy), and [docs/hubspot-crm-workflows.md](docs/hubspot-crm-workflows.md) for the CRM plan.

All projects, companies and people in the demo are fictional. Pricing on the website is placeholder.
