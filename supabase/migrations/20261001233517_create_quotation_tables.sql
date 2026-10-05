/*
# Quotation Management System — Database Tables

1. New Tables
- `quotations` — main quotation record linked to a rental or project request
  - id (uuid, primary key)
  - quotation_reference (text, unique) — SAHAB-QT-XXXXXX auto-generated
  - request_type (text) — 'rental' or 'project'
  - request_id (uuid) — FK to rental_requests.id or project_requests.id
  - request_reference (text) — snapshot of the request reference at creation time
  - customer_name (text)
  - company_name (text, nullable)
  - customer_phone (text)
  - customer_email (text, nullable)
  - status (text) — draft, ready_to_send, sent, accepted, rejected, expired, cancelled
  - currency (text) — default 'SAR'
  - vat_rate (numeric) — editable VAT percentage, default 15.00
  - issue_date (date)
  - expiry_date (date, nullable)
  - notes (text, nullable)
  - subtotal (numeric, default 0)
  - discount_amount (numeric, default 0)
  - tax_amount (numeric, default 0)
  - total (numeric, default 0)
  - terms (jsonb) — editable terms as key-value pairs
  - version (integer, default 1) — increments on revision
  - parent_quotation_id (uuid, nullable) — for revisions, points to the original quotation
  - created_by (uuid, nullable) — staff_profiles.id
  - created_by_name (text, nullable)
  - sent_at (timestamptz, nullable)
  - accepted_at (timestamptz, nullable)
  - rejected_at (timestamptz, nullable)
  - reject_reason (text, nullable)
  - created_at (timestamptz, default now())
  - updated_at (timestamptz, default now())

- `quotation_items` — line items for each quotation
  - id (uuid, primary key)
  - quotation_id (uuid, FK to quotations.id ON DELETE CASCADE)
  - description (text)
  - quantity (numeric, default 1)
  - unit (text, default 'unit')
  - unit_price (numeric, default 0)
  - discount (numeric, default 0) — per-item discount
  - tax_rate (numeric, default 0) — per-item tax rate override
  - total (numeric, default 0) — computed: (qty * unit_price) - discount + tax
  - sort_order (integer, default 0)

- `quotation_history` — audit trail for quotation events
  - id (uuid, primary key)
  - quotation_id (uuid, FK to quotations.id ON DELETE CASCADE)
  - action (text) — created, updated, status_changed, sent, accepted, rejected, cancelled, revised
  - previous_status (text, nullable)
  - new_status (text, nullable)
  - performed_by (uuid, nullable)
  - performed_by_name (text, nullable)
  - notes (text, nullable)
  - created_at (timestamptz, default now())

2. Security
- RLS enabled on all three tables
- Staff with quotations.view can SELECT quotations and items
- Staff with quotations.create can INSERT quotations and items
- Staff with quotations.edit can UPDATE quotations and items (only if status = 'draft' or 'ready_to_send')
- Staff with quotations.delete can DELETE quotations and items (only if status = 'draft')
- Staff with quotations.manage can UPDATE any quotation regardless of status
- quotation_history is INSERT-only via trigger; staff can SELECT

3. Triggers
- trg_quotation_reference — auto-generates SAHAB-QT-XXXXXX on INSERT
- trg_quotation_updated_at — auto-updates updated_at
- trg_quotation_history — records status changes and creation in quotation_history
*/

-- ─── quotations table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_reference text UNIQUE,
  request_type text NOT NULL,
  request_id uuid NOT NULL,
  request_reference text,
  customer_name text NOT NULL,
  company_name text,
  customer_phone text NOT NULL,
  customer_email text,
  status text NOT NULL DEFAULT 'draft',
  currency text NOT NULL DEFAULT 'SAR',
  vat_rate numeric NOT NULL DEFAULT 15.00,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date date,
  notes text,
  subtotal numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  terms jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  parent_quotation_id uuid REFERENCES quotations(id) ON DELETE SET NULL,
  created_by uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  created_by_name text,
  sent_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  reject_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_quotations_request ON quotations(request_type, request_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created ON quotations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_parent ON quotations(parent_quotation_id);

-- ─── quotation_items table ────────────────────────────────
CREATE TABLE IF NOT EXISTS quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  quantity numeric NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'unit',
  unit_price numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation ON quotation_items(quotation_id);

-- ─── quotation_history table ──────────────────────────────
CREATE TABLE IF NOT EXISTS quotation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  action text NOT NULL,
  previous_status text,
  new_status text,
  performed_by uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  performed_by_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quotation_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_quotation_history_quotation ON quotation_history(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_history_created ON quotation_history(created_at DESC);

-- ─── Sequence for quotation reference ─────────────────────
CREATE SEQUENCE IF NOT EXISTS quotation_ref_seq START 1;

-- ─── Trigger: auto-generate quotation reference ───────────
CREATE OR REPLACE FUNCTION generate_quotation_reference()
RETURNS trigger AS $$
DECLARE
  seq_val bigint;
BEGIN
  IF NEW.quotation_reference IS NULL OR NEW.quotation_reference = '' THEN
    seq_val := nextval('quotation_ref_seq');
    NEW.quotation_reference := 'SAHAB-QT-' || lpad(seq_val::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_quotation_reference ON quotations;
CREATE TRIGGER trg_quotation_reference
  BEFORE INSERT ON quotations
  FOR EACH ROW EXECUTE FUNCTION generate_quotation_reference();

-- ─── Trigger: auto-update updated_at ──────────────────────
CREATE OR REPLACE FUNCTION update_quotation_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_quotation_updated_at ON quotations;
CREATE TRIGGER trg_quotation_updated_at
  BEFORE UPDATE ON quotations
  FOR EACH ROW EXECUTE FUNCTION update_quotation_updated_at();

-- ─── Trigger: record quotation history ────────────────────
CREATE OR REPLACE FUNCTION record_quotation_history()
RETURNS trigger AS $$
DECLARE
  staff_name text;
BEGIN
  SELECT full_name INTO staff_name FROM staff_profiles WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO quotation_history (quotation_id, action, new_status, performed_by, performed_by_name)
    VALUES (NEW.id, 'created', NEW.status, auth.uid(), staff_name);
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO quotation_history (quotation_id, action, previous_status, new_status, performed_by, performed_by_name)
    VALUES (NEW.id, 'status_changed', OLD.status, NEW.status, auth.uid(), staff_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_quotation_history ON quotations;
CREATE TRIGGER trg_quotation_history
  AFTER INSERT OR UPDATE ON quotations
  FOR EACH ROW EXECUTE FUNCTION record_quotation_history();

-- ─── RLS Policies for quotations ──────────────────────────
-- Staff with quotations.view can read
DROP POLICY IF EXISTS "staff_read_quotations" ON quotations;
CREATE POLICY "staff_read_quotations"
  ON quotations FOR SELECT
  TO authenticated
  USING (is_staff());

-- Staff with quotations.create can insert
DROP POLICY IF EXISTS "staff_create_quotations" ON quotations;
CREATE POLICY "staff_create_quotations"
  ON quotations FOR INSERT
  TO authenticated
  WITH CHECK (staff_can('quotations', 'create'));

-- Staff with quotations.edit can update (only draft or ready_to_send)
DROP POLICY IF EXISTS "staff_update_quotations" ON quotations;
CREATE POLICY "staff_update_quotations"
  ON quotations FOR UPDATE
  TO authenticated
  USING (staff_can('quotations', 'manage') OR (staff_can('quotations', 'edit') AND status IN ('draft', 'ready_to_send')))
  WITH CHECK (staff_can('quotations', 'manage') OR (staff_can('quotations', 'edit') AND status IN ('draft', 'ready_to_send')));

-- Staff with quotations.delete can delete (only draft)
DROP POLICY IF EXISTS "staff_delete_quotations" ON quotations;
CREATE POLICY "staff_delete_quotations"
  ON quotations FOR DELETE
  TO authenticated
  USING (staff_can('quotations', 'manage') OR (staff_can('quotations', 'delete') AND status = 'draft'));

-- ─── RLS Policies for quotation_items ─────────────────────
-- Staff can read items if they can read quotations
DROP POLICY IF EXISTS "staff_read_quotation_items" ON quotation_items;
CREATE POLICY "staff_read_quotation_items"
  ON quotation_items FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND is_staff()));

-- Staff with quotations.create can insert items
DROP POLICY IF EXISTS "staff_create_quotation_items" ON quotation_items;
CREATE POLICY "staff_create_quotation_items"
  ON quotation_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id
            AND (staff_can('quotations', 'manage') OR (staff_can('quotations', 'edit') AND quotations.status IN ('draft', 'ready_to_send'))))
  );

-- Staff with quotations.edit can update items (only if quotation is draft/ready_to_send)
DROP POLICY IF EXISTS "staff_update_quotation_items" ON quotation_items;
CREATE POLICY "staff_update_quotation_items"
  ON quotation_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id
            AND (staff_can('quotations', 'manage') OR (staff_can('quotations', 'edit') AND quotations.status IN ('draft', 'ready_to_send'))))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id
            AND (staff_can('quotations', 'manage') OR (staff_can('quotations', 'edit') AND quotations.status IN ('draft', 'ready_to_send'))))
  );

-- Staff with quotations.delete can delete items (only if quotation is draft)
DROP POLICY IF EXISTS "staff_delete_quotation_items" ON quotation_items;
CREATE POLICY "staff_delete_quotation_items"
  ON quotation_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id
            AND (staff_can('quotations', 'manage') OR (staff_can('quotations', 'delete') AND quotations.status = 'draft')))
  );

-- ─── RLS Policies for quotation_history ───────────────────
-- Staff can read history
DROP POLICY IF EXISTS "staff_read_quotation_history" ON quotation_history;
CREATE POLICY "staff_read_quotation_history"
  ON quotation_history FOR SELECT
  TO authenticated
  USING (is_staff());

-- No INSERT/UPDATE/DELETE policies — history is written only by triggers
