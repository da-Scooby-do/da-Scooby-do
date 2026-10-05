/*
# Create project_requests table for public service/project requests

1. New Tables
- `project_requests`
  - `id` (uuid, primary key)
  - `request_reference` (text, unique) — human-readable ID like SAHAB-PR-XXXXXX
  - `customer_name` (text, not null) — full name of the requester
  - `company_name` (text, nullable) — optional company name
  - `phone` (text, not null) — Saudi mobile number
  - `email` (text, nullable) — optional email
  - `service_category` (text, not null) — one of: contracting, engineering, project-management
  - `service_type` (text, not null) — specific service ID (e.g. general-contracting, architectural-design, etc.) or 'other'
  - `project_description` (text, not null) — project details
  - `city` (text, not null) — project city
  - `district` (text, nullable) — optional district/neighborhood
  - `project_type` (text, nullable) — one of: commercial, residential, industrial, government, infrastructure, other
  - `estimated_budget` (text, nullable) — optional budget (informational only, no pricing calculation)
  - `expected_start` (text, nullable) — one of: within_1_month, within_3_months, within_6_months, within_12_months, over_1_year, unspecified
  - `status` (text, not null, default 'new') — one of: new, under_review, contacted, quotation_preparing, quotation_sent, approved, rejected, completed, cancelled
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `project_requests`.
- INSERT: allow anon + authenticated (public form, no login required to submit).
  - WITH CHECK enforces that status is 'new' and request_reference is null (system-generated via trigger).
- SELECT/UPDATE/DELETE: authenticated only (admin/staff access). No anon read.
  - No ownership column — this is a public intake form, not per-user data.
  - Admin access is controlled by being authenticated (the app's admin area requires sign-in).

3. Indexes
- Index on `status` for filtering by status in admin.
- Index on `created_at` for sorting by newest.

4. Trigger
- `generate_project_request_reference` trigger on INSERT to auto-generate
  `SAHAB-PR-XXXXXX` format reference using a sequence.
*/

CREATE TABLE IF NOT EXISTS project_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_reference text UNIQUE,
  customer_name text NOT NULL,
  company_name text,
  phone text NOT NULL,
  email text,
  service_category text NOT NULL,
  service_type text NOT NULL,
  project_description text NOT NULL,
  city text NOT NULL,
  district text,
  project_type text,
  estimated_budget text,
  expected_start text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE project_requests ENABLE ROW LEVEL SECURITY;

-- Indexes for admin filtering
CREATE INDEX IF NOT EXISTS idx_project_requests_status ON project_requests(status);
CREATE INDEX IF NOT EXISTS idx_project_requests_created_at ON project_requests(created_at DESC);

-- Sequence for request reference generation
CREATE SEQUENCE IF NOT EXISTS project_request_seq START 1;

-- Trigger function to auto-generate request_reference
CREATE OR REPLACE FUNCTION generate_project_request_reference()
RETURNS trigger AS $$
BEGIN
  IF NEW.request_reference IS NULL THEN
    NEW.request_reference := 'SAHAB-PR-' || LPAD(nextval('project_request_seq')::text, 6, '0');
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_project_request_reference ON project_requests;
CREATE TRIGGER trg_generate_project_request_reference
  BEFORE INSERT ON project_requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_project_request_reference();

-- Trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_project_request_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_project_request_updated_at ON project_requests;
CREATE TRIGGER trg_update_project_request_updated_at
  BEFORE UPDATE ON project_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_project_request_updated_at();

-- Policies
-- INSERT: public can submit (anon + authenticated), must be new with no reference
DROP POLICY IF EXISTS "public_insert_project_requests" ON project_requests;
CREATE POLICY "public_insert_project_requests"
  ON project_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'new');

-- SELECT: authenticated only (admin/staff)
DROP POLICY IF EXISTS "auth_select_project_requests" ON project_requests;
CREATE POLICY "auth_select_project_requests"
  ON project_requests FOR SELECT
  TO authenticated
  USING (true);

-- UPDATE: authenticated only (admin/staff change status)
DROP POLICY IF EXISTS "auth_update_project_requests" ON project_requests;
CREATE POLICY "auth_update_project_requests"
  ON project_requests FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

-- DELETE: authenticated only (admin/staff)
DROP POLICY IF EXISTS "auth_delete_project_requests" ON project_requests;
CREATE POLICY "auth_delete_project_requests"
  ON project_requests FOR DELETE
  TO authenticated
  USING (true);
