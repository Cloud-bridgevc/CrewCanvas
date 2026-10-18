# CrewCanvas architecture

```
            ┌──────────────── Next.js app (App Router) ────────────────┐
 Browser ──▶│ Public site · Interactive demo · Dashboard · API routes  │
   │        │                                                          │
   │        │   Repository ──▶ PostgreSQL (Aurora Serverless v2)       │
   │        │   Readiness engine (pure TS, deterministic)              │
   │        │   Narration ──▶ Amazon Bedrock (Claude) ──▶ guardrail    │
   │        │   Presign  ──▶ Amazon S3 (KMS)                           │
   │        │   Demo form ─▶ HubSpot CRM API                           │
   │        └──────────────────────────────────────────────────────────┘
   └── PUT photo/PDF directly to S3 (presigned, 5 min)
                                    EventBridge (schedule · checklist.changed)
                                               │
                                     AWS Lambda: notifications
                                     (same engine, PostgreSQL) ──▶ SNS ──▶ email/SMS
```

## The trust boundary

| Layer | Decides | Inputs | Model involved? |
|---|---|---|---|
| Checklist records | What has been verified, by whom, when | People in the field | No |
| Readiness engine (`src/lib/engine`) | `blocked` · `not_verified` · `awaiting_approval` · `approved` · `complete`; conflicts; risk score; corrective actions | Checklist records, schedule, crews, approvals | **No** |
| Human approval | Whether work is released | A superintendent or PM, re-validated on the server (`approveWorkPackage`) | No |
| Narration (`src/lib/ai`) | Wording of summaries and explanations | Engine output only (JSON facts) | Yes — Bedrock |

Rules enforced in code:
- `approved` requires every required item verified **and** a non-revoked approval whose `verifiedItemIds` cover them. Reopening an item voids the approval (`approvalStatus: "invalidated"`).
- `canApprove` refuses approval while any required item is unverified; the server action also checks the approver's role.
- Bedrock never sees anything but engine facts; responses that claim safety/readiness/release (`applyGuardrail`) are discarded and replaced by the deterministic template. Refusals and errors also fall back.
- The notification Lambda does not use Bedrock — alerts are exact and reproducible.

## Engine rules (summary)
- **Blocking window:** outstanding required items become blockers 3 days before start, when overdue, when failed, or when work is in progress.
- **Conflicts:** missing prerequisite · crew double-booked (portfolio-wide) · crew unavailable/reduced · exclusive-zone overlap · single-unit equipment overlap · dependency out of sequence · predecessor slip (projected from actual production rate).
- **Risk score:** additive and explained — state (blocked 50, outstanding 15, awaiting approval 8) + conflicts (critical 30 / high 20 / medium 10) + blocked predecessors (15) + downstream exposure (5 each, max 15) + urgency (≤3 days 15, ≤7 days 8).
- **Recommendations:** hold · verify · resequence (swap in a fully verified package for the same crew) · reassign (free crew from the same sub) · approve (route to a person) · escalate · notify.

## AWS
`infra/template.yaml` (SAM): Aurora PostgreSQL Serverless v2 + Secrets Manager, KMS-encrypted versioned S3 bucket with public access blocked, SNS alerts topic, notification Lambda (EventBridge Scheduler weekdays 05:30 PT + `checklist.changed` rule), and an app IAM role with Bedrock, S3, Secrets and EventBridge permissions. The web app can run on App Runner or ECS Fargate with that role.

Bedrock calls use `@anthropic-ai/bedrock-sdk` (`AnthropicBedrockMantle`) with model `anthropic.claude-opus-5-5`, adaptive thinking and `effort: "low"` (summaries are short). Enable model access in the Bedrock console for the region first.

## Production gaps (deliberately out of scope for the demo)
- Authentication: the demo uses an "acting as" cookie. Replace with Cognito/SSO; approvals must bind to the authenticated identity.
- Multi-tenancy: add `org_id` to every table and row-level security.
- The app doesn't yet emit `checklist.changed` to EventBridge (the Lambda rule is ready).
- Evidence thumbnails: serve via presigned GET or CloudFront signed URLs.
