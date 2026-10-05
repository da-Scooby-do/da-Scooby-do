/*
# Create rental_requests table

1. New Tables
- `rental_requests` — stores equipment rental requests from the public catalog
  - id (uuid, primary key)
  - request_reference (text, unique) — format: SAHAB-RR-XXXXXX
  - equipment_model_id (text, references equipment_models) — the requested equipment
  - equipment_variant_id (text, nullable) — specific variant/size if selected
  - equipment_name (text) — snapshot of equipment name at request time
  - equipment_name_ar (text) — Arabic name snapshot
  - customer_name (text, not null) — full name (required)
  - company_name (text, nullable) — company name (optional)
  - phone (text, not null) — mobile number (required)
  - email (text, nullable) — email (optional)
  - rental_period (text, not null) — daily/weekly/monthly/6months/yearly
  - requested_start_date (text, nullable) — requested start date
  - project_city (text, nullable) — project city/location
  - project_location (text, nullable) — detailed project location
  - notes (text, nullable) — additional notes
  - status (text, not null, default 'new') — see status workflow below
  - internal_notes (text, default '') — admin-only notes
  - created_at (timestamptz, default now())
  - updated_at (timestamptz, default now())

2. Status Workflow
  - new (جديد) — initial status when request is submitted
  - reviewing (قيد المراجعة) — staff is reviewing the request
  - contacted (تم التواصل) — customer has been contacted
  - awaiting_po (بانتظار PO) — waiting for purchase order from customer
  - approved (تم اعتماد الطلب) — request approved, rental can proceed
  - rejected (مرفوض) — request rejected
  - cancelled (ملغي) — request cancelled by customer or staff
  - completed (مكتمل) — rental completed

3. Security
  - RLS enabled
  - Public (anon) can INSERT new requests (status defaults to 'new')
  - Public (anon) cannot SELECT, UPDATE, or DELETE — they cannot see or modify requests
  - Authenticated staff can SELECT all requests (via is_staff() check)
  - Authenticated staff with rental_requests.edit permission can UPDATE status and internal notes
  - Authenticated staff with rental_requests.delete permission can DELETE
  - No customer can change request status, modify other customers' requests, or access internal rental requests

4. Reference Generation
  - A trigger generates SAHAB-RR-XXXXXX references automatically on insert
  - Uses a sequence counter for uniqueness
*/

CREATE TABLE IF NOT EXISTS rental_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_reference text UNIQUE NOT NULL DEFAULT '',
  equipment_model_id text REFERENCES equipment_models(id) ON DELETE RESTRICT,
  equipment_variant_id text,
  equipment_name text NOT NULL DEFAULT '',
  equipment_name_ar text NOT NULL DEFAULT '',
  customer_name text NOT NULL,
  company_name text,
  phone text NOT NULL,
  email text,
  rental_period text NOT NULL DEFAULT 'daily',
  requested_start_date text,
  project_city text,
  project_location text,
  notes text,
  status text NOT NULL DEFAULT 'new',
  internal_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rental_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_rental_requests_status ON rental_requests(status);
CREATE INDEX IF NOT EXISTS idx_rental_requests_equipment ON rental_requests(equipment_model_id);
CREATE INDEX IF NOT EXISTS idx_rental_requests_created ON rental_requests(created_at DESC);

-- ─── Reference generation sequence + trigger ────────────────
CREATE SEQUENCE IF NOT EXISTS rental_request_ref_seq START 1;

CREATE OR REPLACE FUNCTION generate_rental_request_reference()
RETURNS trigger AS $$
DECLARE
  seq_num bigint;
  ref text;
BEGIN
  IF NEW.request_reference IS NULL OR NEW.request_reference = '' THEN
    seq_num := nextval('rental_request_ref_seq');
    ref := 'SAHAB-RR-' || lpad(seq_num::text, 6, '0');
    NEW.request_reference := ref;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rental_request_reference ON rental_requests;
CREATE TRIGGER trg_rental_request_reference
  BEFORE INSERT ON rental_requests
  FOR EACH ROW EXECUTE FUNCTION generate_rental_request_reference();

-- ─── RLS Policies ───────────────────────────────────────────
-- Public can INSERT new rental requests (no auth required to submit)
DROP POLICY IF EXISTS "public_insert_rental_requests" ON rental_requests;
CREATE POLICY "public_insert_rental_requests"
  ON rental_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'new');

-- Staff can SELECT all rental requests
DROP POLICY IF EXISTS "staff_read_rental_requests" ON rental_requests;
CREATE POLICY "staff_read_rental_requests"
  ON rental_requests FOR SELECT
  TO authenticated
  USING (is_staff());

-- Staff with edit permission can UPDATE requests (status, internal notes, etc.)
DROP POLICY IF EXISTS "staff_update_rental_requests" ON rental_requests;
CREATE POLICY "staff_update_rental_requests"
  ON rental_requests FOR UPDATE
  TO authenticated
  USING (staff_can('rental_requests', 'edit'))
  WITH CHECK (staff_can('rental_requests', 'edit'));

-- Staff with delete permission can DELETE requests
DROP POLICY IF EXISTS "staff_delete_rental_requests" ON rental_requests;
CREATE POLICY "staff_delete_rental_requests"
  ON rental_requests FOR DELETE
  TO authenticated
  USING (staff_can('rental_requests', 'delete'));

-- ─── Updated_at trigger ─────────────────────────────────────
DROP TRIGGER IF EXISTS trg_rental_requests_updated ON rental_requests;
CREATE TRIGGER trg_rental_requests_updated
  BEFORE UPDATE ON rental_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
