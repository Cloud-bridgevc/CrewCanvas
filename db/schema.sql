-- CrewCanvas PostgreSQL schema (projects, dependencies, schedules, crews, readiness, evidence metadata).
-- Binary evidence (photos, PDFs) lives in Amazon S3; only object keys are stored here.

CREATE TABLE IF NOT EXISTS people (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  role        text NOT NULL CHECK (role IN ('superintendent','project_manager','project_engineer','safety_manager','foreman')),
  company     text NOT NULL,
  email       text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS projects (
  id                  text PRIMARY KEY,
  code                text NOT NULL UNIQUE,
  name                text NOT NULL,
  client              text NOT NULL,
  location            text NOT NULL,
  sector              text NOT NULL,
  start_date          date NOT NULL,
  end_date            date NOT NULL,
  status              text NOT NULL CHECK (status IN ('active','preconstruction','closeout')),
  contract_value      text NOT NULL,
  superintendent_id   text NOT NULL REFERENCES people(id),
  project_manager_id  text NOT NULL REFERENCES people(id),
  hubspot_deal_id     text
);

CREATE TABLE IF NOT EXISTS subcontractors (
  id                  text PRIMARY KEY,
  name                text NOT NULL,
  trade               text NOT NULL,
  contact_name        text NOT NULL,
  contact_email       text NOT NULL,
  phone               text NOT NULL,
  hubspot_company_id  text
);

CREATE TABLE IF NOT EXISTS crews (
  id                text PRIMARY KEY,
  subcontractor_id  text NOT NULL REFERENCES subcontractors(id),
  name              text NOT NULL,
  trade             text NOT NULL,
  headcount         int  NOT NULL CHECK (headcount > 0),
  foreman           text NOT NULL
);

CREATE TABLE IF NOT EXISTS crew_availability (
  id          text PRIMARY KEY,
  crew_id     text NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  start_date  date NOT NULL,
  end_date    date NOT NULL CHECK (end_date >= start_date),
  status      text NOT NULL CHECK (status IN ('unavailable','reduced')),
  reason      text NOT NULL
);
CREATE INDEX IF NOT EXISTS crew_availability_crew_idx ON crew_availability (crew_id, start_date);

CREATE TABLE IF NOT EXISTS work_packages (
  id                 text PRIMARY KEY,
  project_id         text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code               text NOT NULL,
  name               text NOT NULL,
  trade              text NOT NULL,
  zone               text NOT NULL,
  exclusive_zone     boolean NOT NULL DEFAULT false,
  subcontractor_id   text NOT NULL REFERENCES subcontractors(id),
  crew_id            text NOT NULL REFERENCES crews(id),
  start_date         date NOT NULL,
  end_date           date NOT NULL CHECK (end_date >= start_date),
  status             text NOT NULL CHECK (status IN ('not_started','in_progress','complete','on_hold')),
  percent_complete   int  NOT NULL DEFAULT 0 CHECK (percent_complete BETWEEN 0 AND 100),
  equipment          text[] NOT NULL DEFAULT '{}',
  UNIQUE (project_id, code)
);
CREATE INDEX IF NOT EXISTS work_packages_crew_window_idx ON work_packages (crew_id, start_date, end_date);

CREATE TABLE IF NOT EXISTS dependencies (
  id              text PRIMARY KEY,
  project_id      text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  predecessor_id  text NOT NULL REFERENCES work_packages(id) ON DELETE CASCADE,
  successor_id    text NOT NULL REFERENCES work_packages(id) ON DELETE CASCADE,
  lag_days        int  NOT NULL DEFAULT 0,
  note            text,
  CHECK (predecessor_id <> successor_id)
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id                      text PRIMARY KEY,
  work_package_id         text NOT NULL REFERENCES work_packages(id) ON DELETE CASCADE,
  label                   text NOT NULL,
  category                text NOT NULL CHECK (category IN ('prerequisite','safety','quality','logistics','permit')),
  required                boolean NOT NULL DEFAULT true,
  status                  text NOT NULL CHECK (status IN ('verified','pending','failed','not_applicable')),
  responsible_party       text NOT NULL,
  due_by                  date,
  verified_by_id          text REFERENCES people(id),
  verified_at             timestamptz,
  evidence_ids            text[] NOT NULL DEFAULT '{}',
  notes                   text,
  linked_work_package_id  text REFERENCES work_packages(id),
  -- A verified item must say who verified it and when.
  CHECK (status <> 'verified' OR (verified_by_id IS NOT NULL AND verified_at IS NOT NULL))
);

-- Append-only audit of every checklist status change.
CREATE TABLE IF NOT EXISTS checklist_events (
  id          bigserial PRIMARY KEY,
  item_id     text NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
  status      text NOT NULL,
  person_id   text NOT NULL REFERENCES people(id),
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS approvals (
  id                 text PRIMARY KEY,
  work_package_id    text NOT NULL REFERENCES work_packages(id) ON DELETE CASCADE,
  approved_by_id     text NOT NULL REFERENCES people(id),
  approved_at        timestamptz NOT NULL,
  verified_item_ids  text[] NOT NULL,
  notes              text,
  revoked_at         timestamptz,
  revoked_reason     text
);

CREATE TABLE IF NOT EXISTS evidence (
  id               text PRIMARY KEY,
  project_id       text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  work_package_id  text NOT NULL REFERENCES work_packages(id) ON DELETE CASCADE,
  type             text NOT NULL CHECK (type IN ('photo','checklist_result','progress_note','document')),
  title            text NOT NULL,
  body             text,
  submitted_by_id  text NOT NULL REFERENCES people(id),
  submitted_at     timestamptz NOT NULL,
  s3_key           text,
  tags             text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS demo_requests (
  id               text PRIMARY KEY,
  name             text NOT NULL,
  email            text NOT NULL,
  company          text NOT NULL,
  company_type     text NOT NULL,
  role             text,
  active_projects  text,
  message          text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  hubspot_synced   boolean NOT NULL DEFAULT false
);

-- Notifications produced by the background Lambda (deduplicated per day).
CREATE TABLE IF NOT EXISTS notifications (
  id          bigserial PRIMARY KEY,
  project_id  text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  kind        text NOT NULL,
  dedupe_key  text NOT NULL UNIQUE,
  payload     jsonb NOT NULL,
  sent_at     timestamptz NOT NULL DEFAULT now()
);
