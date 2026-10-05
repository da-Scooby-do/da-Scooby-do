/*
# Request status history + assignment columns

1. New Tables
- `request_status_history` — audit trail for status changes on both rental_requests and project_requests
  - id (uuid, primary key)
  - request_type (text) — 'rental' or 'project'
  - request_id (uuid) — the request row ID
  - previous_status (text, nullable) — null for initial status
  - new_status (text, not null)
  - changed_by (uuid, nullable) — auth.uid() of the staff member
  - changed_by_name (text, nullable) — staff name snapshot
  - created_at (timestamptz, default now())

2. Modified Tables
- `rental_requests` — added `assigned_to` (uuid, nullable, references staff_profiles)
- `project_requests` — added `assigned_to` (uuid, nullable, references staff_profiles)
- `project_requests` — added `internal_notes` (text, default '')

3. Security
- RLS enabled on `request_status_history`
- Staff can SELECT status history (is_staff() check)
- Status history is INSERT-only via trigger — no manual INSERT/UPDATE/DELETE from the API
- Staff with edit permission can UPDATE assigned_to on both request tables

4. Triggers
- `trg_rental_status_history` — AFTER UPDATE on rental_requests, when status changes, inserts a history row
- `trg_project_status_history` — AFTER UPDATE on project_requests, when status changes, inserts a history row
*/

-- ─── Add assigned_to + internal_notes columns ──────────────
ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES staff_profiles(id) ON DELETE SET NULL;
ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES staff_profiles(id) ON DELETE SET NULL;
ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS internal_notes text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_rental_requests_assigned ON rental_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_requests_assigned ON project_requests(assigned_to);

-- ─── Status history table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS request_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type text NOT NULL,
  request_id uuid NOT NULL,
  previous_status text,
  new_status text NOT NULL,
  changed_by uuid,
  changed_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE request_status_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_status_history_request ON request_status_history(request_type, request_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created ON request_status_history(created_at DESC);

-- Staff can read status history
DROP POLICY IF EXISTS "staff_read_status_history" ON request_status_history;
CREATE POLICY "staff_read_status_history"
  ON request_status_history FOR SELECT
  TO authenticated
  USING (is_staff());

-- No INSERT/UPDATE/DELETE policies — history is written only by triggers

-- ─── Trigger functions ─────────────────────────────────────
CREATE OR REPLACE FUNCTION record_rental_status_change()
RETURNS trigger AS $$
DECLARE
  staff_name text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT full_name INTO staff_name FROM staff_profiles WHERE id = auth.uid();
    INSERT INTO request_status_history (request_type, request_id, previous_status, new_status, changed_by, changed_by_name)
    VALUES ('rental', NEW.id, OLD.status, NEW.status, auth.uid(), staff_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION record_project_status_change()
RETURNS trigger AS $$
DECLARE
  staff_name text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT full_name INTO staff_name FROM staff_profiles WHERE id = auth.uid();
    INSERT INTO request_status_history (request_type, request_id, previous_status, new_status, changed_by, changed_by_name)
    VALUES ('project', NEW.id, OLD.status, NEW.status, auth.uid(), staff_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_rental_status_history ON rental_requests;
CREATE TRIGGER trg_rental_status_history
  AFTER UPDATE ON rental_requests
  FOR EACH ROW EXECUTE FUNCTION record_rental_status_change();

DROP TRIGGER IF EXISTS trg_project_status_history ON project_requests;
CREATE TRIGGER trg_project_status_history
  AFTER UPDATE ON project_requests
  FOR EACH ROW EXECUTE FUNCTION record_project_status_change();

-- ─── Allow staff to update assigned_to on rental_requests ──
-- The existing staff_update_rental_requests policy already covers UPDATE
-- (USING staff_can('rental_requests', 'edit'))
-- No new policy needed — assigned_to is just another updatable column.

-- ─── Allow staff to update project_requests (including assigned_to) ──
-- Check existing policies on project_requests
DROP POLICY IF EXISTS "staff_update_project_requests" ON project_requests;
CREATE POLICY "staff_update_project_requests"
  ON project_requests FOR UPDATE
  TO authenticated
  USING (staff_can('projects', 'edit'))
  WITH CHECK (staff_can('projects', 'edit'));
