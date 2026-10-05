/*
# Rental Operations & Equipment Handover — Database Tables

1. New Tables
- `rental_operations` — operational rental record created after approval
  - id (uuid PK)
  - rental_reference (text, unique) — SAHAB-RN-XXXXXX auto-generated
  - request_type (text) — 'rental' (this phase is rental-only)
  - request_id (uuid) — FK to rental_requests
  - request_reference (text) — snapshot
  - quotation_id (uuid, nullable) — FK to quotations
  - quotation_reference (text, nullable)
  - purchase_order_id (uuid, nullable) — FK to purchase_orders
  - po_number (text, nullable)
  - contract_id (uuid, nullable) — FK to contracts
  - contract_number (text, nullable)
  - customer_name (text)
  - company_name (text, nullable)
  - customer_phone (text)
  - customer_email (text, nullable)
  - equipment_model_id (uuid, nullable) — links to equipment model
  - equipment_name (text, nullable)
  - equipment_unit_id (text, nullable) — links to actual equipment unit (by unit id string)
  - category_name (text, nullable)
  - brand_name (text, nullable)
  - model_name (text, nullable)
  - year (text, nullable)
  - start_date (date)
  - expected_end_date (date, nullable)
  - rental_period (text) — daily, weekly, monthly, 6months, yearly
  - rental_location (text, nullable)
  - agreed_amount (numeric, default 0)
  - currency (text, default 'SAR')
  - status (text) — approved, awaiting_delivery, delivered, active, awaiting_return, completed, cancelled
  - transport_responsibility (text) — renter, sahab, per_agreement (default renter)
  - fuel_responsibility (text) — renter, sahab, per_agreement (default renter)
  - notes (text, nullable)
  - Handover fields:
  - handover_date (date, nullable)
  - handover_location (text, nullable)
  - handover_notes (text, nullable)
  - receiver_name (text, nullable)
  - receiver_phone (text, nullable)
  - handover_confirmed (boolean, default false)
  - Return fields:
  - actual_return_date (date, nullable)
  - return_notes (text, nullable)
  - return_condition_note (text, nullable)
  - created_by (uuid, nullable) — FK to staff_profiles
  - created_by_name (text, nullable)
  - created_at, updated_at (timestamptz)

- `rental_extensions` — extension records for active rentals
  - id (uuid PK)
  - rental_operation_id (uuid) — FK to rental_operations ON DELETE CASCADE
  - extension_date (date)
  - new_expected_end_date (date)
  - extension_period (text) — daily, weekly, monthly, 6months, yearly
  - extension_months (numeric) — computed months for validation (max 6)
  - reason (text, nullable)
  - created_by (uuid, nullable)
  - created_by_name (text, nullable)
  - created_at (timestamptz)

- `rental_operation_history` — audit trail
  - id (uuid PK)
  - rental_operation_id (uuid) — FK ON DELETE CASCADE
  - action (text)
  - previous_status (text, nullable)
  - new_status (text, nullable)
  - performed_by (uuid, nullable)
  - performed_by_name (text, nullable)
  - notes (text, nullable)
  - created_at (timestamptz)

2. Security
- RLS on all tables: staff-only via is_staff() and staff_can('rental_requests', ...)
- History: trigger-written only

3. Triggers
- Auto-generate SAHAB-RN-XXXXXX
- Auto-update updated_at
- Record status changes in rental_operation_history
*/

-- ─── rental_operations table ──────────────────────────────
CREATE TABLE IF NOT EXISTS rental_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_reference text UNIQUE,
  request_type text NOT NULL DEFAULT 'rental',
  request_id uuid NOT NULL,
  request_reference text,
  quotation_id uuid REFERENCES quotations(id) ON DELETE SET NULL,
  quotation_reference text,
  purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE SET NULL,
  po_number text,
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  contract_number text,
  customer_name text NOT NULL,
  company_name text,
  customer_phone text NOT NULL DEFAULT '',
  customer_email text,
  equipment_model_id text,
  equipment_name text,
  equipment_unit_id text,
  category_name text,
  brand_name text,
  model_name text,
  year text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_end_date date,
  rental_period text NOT NULL DEFAULT 'monthly',
  rental_location text,
  agreed_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'SAR',
  status text NOT NULL DEFAULT 'approved',
  transport_responsibility text NOT NULL DEFAULT 'renter',
  fuel_responsibility text NOT NULL DEFAULT 'renter',
  notes text,
  handover_date date,
  handover_location text,
  handover_notes text,
  receiver_name text,
  receiver_phone text,
  handover_confirmed boolean NOT NULL DEFAULT false,
  actual_return_date date,
  return_notes text,
  return_condition_note text,
  created_by uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rental_operations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_rental_ops_request ON rental_operations(request_id);
CREATE INDEX IF NOT EXISTS idx_rental_ops_status ON rental_operations(status);
CREATE INDEX IF NOT EXISTS idx_rental_ops_quotation ON rental_operations(quotation_id);
CREATE INDEX IF NOT EXISTS idx_rental_ops_po ON rental_operations(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_rental_ops_contract ON rental_operations(contract_id);
CREATE INDEX IF NOT EXISTS idx_rental_ops_created ON rental_operations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rental_ops_unit ON rental_operations(equipment_unit_id);

-- ─── rental_extensions table ──────────────────────────────
CREATE TABLE IF NOT EXISTS rental_extensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_operation_id uuid NOT NULL REFERENCES rental_operations(id) ON DELETE CASCADE,
  extension_date date NOT NULL DEFAULT CURRENT_DATE,
  new_expected_end_date date NOT NULL,
  extension_period text NOT NULL,
  extension_months numeric NOT NULL DEFAULT 0,
  reason text,
  created_by uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rental_extensions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_rental_ext_op ON rental_extensions(rental_operation_id);

-- ─── rental_operation_history table ───────────────────────
CREATE TABLE IF NOT EXISTS rental_operation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_operation_id uuid NOT NULL REFERENCES rental_operations(id) ON DELETE CASCADE,
  action text NOT NULL,
  previous_status text,
  new_status text,
  performed_by uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  performed_by_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rental_operation_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_rental_hist_op ON rental_operation_history(rental_operation_id);
CREATE INDEX IF NOT EXISTS idx_rental_hist_created ON rental_operation_history(created_at DESC);

-- ─── Sequence ─────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS rental_op_ref_seq START 1;

-- ─── Trigger: auto-generate rental reference ──────────────
CREATE OR REPLACE FUNCTION generate_rental_reference()
RETURNS trigger AS $$
DECLARE seq_val bigint;
BEGIN
  IF NEW.rental_reference IS NULL OR NEW.rental_reference = '' THEN
    seq_val := nextval('rental_op_ref_seq');
    NEW.rental_reference := 'SAHAB-RN-' || lpad(seq_val::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_rental_op_reference ON rental_operations;
CREATE TRIGGER trg_rental_op_reference
  BEFORE INSERT ON rental_operations
  FOR EACH ROW EXECUTE FUNCTION generate_rental_reference();

-- ─── Trigger: auto-update updated_at ──────────────────────
CREATE OR REPLACE FUNCTION update_rental_op_updated_at()
RETURNS trigger AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_rental_op_updated_at ON rental_operations;
CREATE TRIGGER trg_rental_op_updated_at
  BEFORE UPDATE ON rental_operations
  FOR EACH ROW EXECUTE FUNCTION update_rental_op_updated_at();

-- ─── Trigger: record history ──────────────────────────────
CREATE OR REPLACE FUNCTION record_rental_op_history()
RETURNS trigger AS $$
DECLARE staff_name text;
BEGIN
  SELECT full_name INTO staff_name FROM staff_profiles WHERE id = auth.uid();
  IF TG_OP = 'INSERT' THEN
    INSERT INTO rental_operation_history (rental_operation_id, action, new_status, performed_by, performed_by_name)
    VALUES (NEW.id, 'created', NEW.status, auth.uid(), staff_name);
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO rental_operation_history (rental_operation_id, action, previous_status, new_status, performed_by, performed_by_name)
    VALUES (NEW.id, 'status_changed', OLD.status, NEW.status, auth.uid(), staff_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_rental_op_history ON rental_operations;
CREATE TRIGGER trg_rental_op_history
  AFTER INSERT OR UPDATE ON rental_operations
  FOR EACH ROW EXECUTE FUNCTION record_rental_op_history();

-- ─── RLS: rental_operations ───────────────────────────────
DROP POLICY IF EXISTS "staff_read_rental_ops" ON rental_operations;
CREATE POLICY "staff_read_rental_ops" ON rental_operations FOR SELECT TO authenticated USING (is_staff());

DROP POLICY IF EXISTS "staff_create_rental_ops" ON rental_operations;
CREATE POLICY "staff_create_rental_ops" ON rental_operations FOR INSERT TO authenticated WITH CHECK (staff_can('rental_requests', 'create') OR staff_can('rental_requests', 'manage'));

DROP POLICY IF EXISTS "staff_update_rental_ops" ON rental_operations;
CREATE POLICY "staff_update_rental_ops" ON rental_operations FOR UPDATE TO authenticated
  USING (staff_can('rental_requests', 'manage') OR staff_can('rental_requests', 'edit'))
  WITH CHECK (staff_can('rental_requests', 'manage') OR staff_can('rental_requests', 'edit'));

DROP POLICY IF EXISTS "staff_delete_rental_ops" ON rental_operations;
CREATE POLICY "staff_delete_rental_ops" ON rental_operations FOR DELETE TO authenticated
  USING (staff_can('rental_requests', 'manage'));

-- ─── RLS: rental_extensions ───────────────────────────────
DROP POLICY IF EXISTS "staff_read_rental_ext" ON rental_extensions;
CREATE POLICY "staff_read_rental_ext" ON rental_extensions FOR SELECT TO authenticated USING (is_staff());

DROP POLICY IF EXISTS "staff_create_rental_ext" ON rental_extensions;
CREATE POLICY "staff_create_rental_ext" ON rental_extensions FOR INSERT TO authenticated
  WITH CHECK (staff_can('rental_requests', 'edit') OR staff_can('rental_requests', 'manage'));

DROP POLICY IF EXISTS "staff_delete_rental_ext" ON rental_extensions;
CREATE POLICY "staff_delete_rental_ext" ON rental_extensions FOR DELETE TO authenticated
  USING (staff_can('rental_requests', 'manage'));

-- ─── RLS: rental_operation_history ────────────────────────
DROP POLICY IF EXISTS "staff_read_rental_op_history" ON rental_operation_history;
CREATE POLICY "staff_read_rental_op_history" ON rental_operation_history FOR SELECT TO authenticated USING (is_staff());
