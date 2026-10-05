/*
# Purchase Orders & Contracts — Database Tables, Storage, RLS

1. New Tables
- `purchase_orders` — B2B PO records linked to quotations/requests
  - id (uuid PK)
  - po_number (text, unique) — SAHAB-PO-XXXXXX auto-generated
  - request_type (text) — 'rental' or 'project'
  - request_id (uuid) — FK to rental_requests or project_requests
  - request_reference (text) — snapshot
  - quotation_id (uuid, nullable) — FK to quotations
  - quotation_reference (text, nullable) — snapshot
  - customer_name (text)
  - company_name (text, nullable)
  - po_date (date)
  - amount (numeric)
  - currency (text, default 'SAR')
  - status (text) — requested, received, reviewing, accepted, rejected
  - document_path (text, nullable) — storage path for uploaded PO doc
  - document_name (text, nullable) — original filename
  - notes (text, nullable)
  - created_by (uuid, nullable) — FK to staff_profiles
  - created_by_name (text, nullable)
  - created_at, updated_at (timestamptz)

- `contracts` — DB-backed contract records
  - id (uuid PK)
  - contract_number (text, unique) — SAHAB-CT-XXXXXX auto-generated
  - title (text)
  - request_type (text)
  - request_id (uuid)
  - request_reference (text, nullable)
  - quotation_id (uuid, nullable) — FK to quotations
  - quotation_reference (text, nullable)
  - purchase_order_id (uuid, nullable) — FK to purchase_orders
  - po_number (text, nullable)
  - customer_name (text)
  - company_name (text, nullable)
  - start_date (date)
  - end_date (date, nullable)
  - contract_value (numeric)
  - currency (text, default 'SAR')
  - status (text) — draft, ready, pending_signature, active, expired, cancelled
  - document_path (text, nullable) — storage path for signed contract
  - document_name (text, nullable)
  - notes (text, nullable)
  - created_by (uuid, nullable)
  - created_by_name (text, nullable)
  - created_at, updated_at (timestamptz)

- `po_history` — audit trail for PO events
- `contract_history` — audit trail for contract events

2. Storage
- `po-documents` bucket (private) — for PO document uploads
- `contract-documents` bucket (private) — for contract document uploads

3. Security
- RLS on all tables: staff-only access gated by is_staff() and staff_can()
- Storage policies: only staff can read/write PO and contract documents
- History tables: trigger-written only, no manual INSERT/UPDATE/DELETE

4. Triggers
- Auto-generate SAHAB-PO-XXXXXX and SAHAB-CT-XXXXXX references
- Auto-update updated_at
- Record status changes in po_history and contract_history
*/

-- ─── purchase_orders table ────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text UNIQUE,
  request_type text NOT NULL,
  request_id uuid NOT NULL,
  request_reference text,
  quotation_id uuid REFERENCES quotations(id) ON DELETE SET NULL,
  quotation_reference text,
  customer_name text NOT NULL,
  company_name text,
  po_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'SAR',
  status text NOT NULL DEFAULT 'requested',
  document_path text,
  document_name text,
  notes text,
  created_by uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_po_request ON purchase_orders(request_type, request_id);
CREATE INDEX IF NOT EXISTS idx_po_quotation ON purchase_orders(quotation_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_created ON purchase_orders(created_at DESC);

-- ─── contracts table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number text UNIQUE,
  title text NOT NULL DEFAULT '',
  request_type text NOT NULL,
  request_id uuid NOT NULL,
  request_reference text,
  quotation_id uuid REFERENCES quotations(id) ON DELETE SET NULL,
  quotation_reference text,
  purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE SET NULL,
  po_number text,
  customer_name text NOT NULL,
  company_name text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  contract_value numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'SAR',
  status text NOT NULL DEFAULT 'draft',
  document_path text,
  document_name text,
  notes text,
  created_by uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_contracts_request ON contracts(request_type, request_id);
CREATE INDEX IF NOT EXISTS idx_contracts_quotation ON contracts(quotation_id);
CREATE INDEX IF NOT EXISTS idx_contracts_po ON contracts(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created ON contracts(created_at DESC);

-- ─── po_history table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS po_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  action text NOT NULL,
  previous_status text,
  new_status text,
  performed_by uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  performed_by_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE po_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_po_history_po ON po_history(po_id);

-- ─── contract_history table ───────────────────────────────
CREATE TABLE IF NOT EXISTS contract_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  action text NOT NULL,
  previous_status text,
  new_status text,
  performed_by uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  performed_by_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contract_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_contract_history_contract ON contract_history(contract_id);

-- ─── Sequences ────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS po_ref_seq START 1;
CREATE SEQUENCE IF NOT EXISTS contract_ref_seq START 1;

-- ─── Trigger functions: reference generation ──────────────
CREATE OR REPLACE FUNCTION generate_po_reference()
RETURNS trigger AS $$
DECLARE seq_val bigint;
BEGIN
  IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
    seq_val := nextval('po_ref_seq');
    NEW.po_number := 'SAHAB-PO-' || lpad(seq_val::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION generate_contract_reference()
RETURNS trigger AS $$
DECLARE seq_val bigint;
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    seq_val := nextval('contract_ref_seq');
    NEW.contract_number := 'SAHAB-CT-' || lpad(seq_val::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_po_reference ON purchase_orders;
CREATE TRIGGER trg_po_reference BEFORE INSERT ON purchase_orders FOR EACH ROW EXECUTE FUNCTION generate_po_reference();

DROP TRIGGER IF EXISTS trg_contract_reference ON contracts;
CREATE TRIGGER trg_contract_reference BEFORE INSERT ON contracts FOR EACH ROW EXECUTE FUNCTION generate_contract_reference();

-- ─── Trigger functions: updated_at ────────────────────────
CREATE OR REPLACE FUNCTION update_po_updated_at() RETURNS trigger AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE OR REPLACE FUNCTION update_contract_updated_at() RETURNS trigger AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_po_updated_at ON purchase_orders;
CREATE TRIGGER trg_po_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_po_updated_at();

DROP TRIGGER IF EXISTS trg_contract_updated_at ON contracts;
CREATE TRIGGER trg_contract_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_contract_updated_at();

-- ─── Trigger functions: history ───────────────────────────
CREATE OR REPLACE FUNCTION record_po_history() RETURNS trigger AS $$
DECLARE staff_name text;
BEGIN
  SELECT full_name INTO staff_name FROM staff_profiles WHERE id = auth.uid();
  IF TG_OP = 'INSERT' THEN
    INSERT INTO po_history (po_id, action, new_status, performed_by, performed_by_name)
    VALUES (NEW.id, 'created', NEW.status, auth.uid(), staff_name);
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO po_history (po_id, action, previous_status, new_status, performed_by, performed_by_name)
    VALUES (NEW.id, 'status_changed', OLD.status, NEW.status, auth.uid(), staff_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION record_contract_history() RETURNS trigger AS $$
DECLARE staff_name text;
BEGIN
  SELECT full_name INTO staff_name FROM staff_profiles WHERE id = auth.uid();
  IF TG_OP = 'INSERT' THEN
    INSERT INTO contract_history (contract_id, action, new_status, performed_by, performed_by_name)
    VALUES (NEW.id, 'created', NEW.status, auth.uid(), staff_name);
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO contract_history (contract_id, action, previous_status, new_status, performed_by, performed_by_name)
    VALUES (NEW.id, 'status_changed', OLD.status, NEW.status, auth.uid(), staff_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_po_history ON purchase_orders;
CREATE TRIGGER trg_po_history AFTER INSERT OR UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION record_po_history();

DROP TRIGGER IF EXISTS trg_contract_history ON contracts;
CREATE TRIGGER trg_contract_history AFTER INSERT OR UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION record_contract_history();

-- ─── RLS: purchase_orders ─────────────────────────────────
DROP POLICY IF EXISTS "staff_read_pos" ON purchase_orders;
CREATE POLICY "staff_read_pos" ON purchase_orders FOR SELECT TO authenticated USING (is_staff());

DROP POLICY IF EXISTS "staff_create_pos" ON purchase_orders;
CREATE POLICY "staff_create_pos" ON purchase_orders FOR INSERT TO authenticated WITH CHECK (staff_can('contracts', 'create') OR staff_can('quotations', 'create'));

DROP POLICY IF EXISTS "staff_update_pos" ON purchase_orders;
CREATE POLICY "staff_update_pos" ON purchase_orders FOR UPDATE TO authenticated
  USING (staff_can('contracts', 'manage') OR staff_can('quotations', 'manage') OR staff_can('contracts', 'edit') OR staff_can('quotations', 'edit'))
  WITH CHECK (staff_can('contracts', 'manage') OR staff_can('quotations', 'manage') OR staff_can('contracts', 'edit') OR staff_can('quotations', 'edit'));

DROP POLICY IF EXISTS "staff_delete_pos" ON purchase_orders;
CREATE POLICY "staff_delete_pos" ON purchase_orders FOR DELETE TO authenticated
  USING (staff_can('contracts', 'manage') OR staff_can('quotations', 'manage'));

-- ─── RLS: contracts ───────────────────────────────────────
DROP POLICY IF EXISTS "staff_read_contracts" ON contracts;
CREATE POLICY "staff_read_contracts" ON contracts FOR SELECT TO authenticated USING (is_staff());

DROP POLICY IF EXISTS "staff_create_contracts" ON contracts;
CREATE POLICY "staff_create_contracts" ON contracts FOR INSERT TO authenticated WITH CHECK (staff_can('contracts', 'create'));

DROP POLICY IF EXISTS "staff_update_contracts" ON contracts;
CREATE POLICY "staff_update_contracts" ON contracts FOR UPDATE TO authenticated
  USING (staff_can('contracts', 'manage') OR staff_can('contracts', 'edit'))
  WITH CHECK (staff_can('contracts', 'manage') OR staff_can('contracts', 'edit'));

DROP POLICY IF EXISTS "staff_delete_contracts" ON contracts;
CREATE POLICY "staff_delete_contracts" ON contracts FOR DELETE TO authenticated
  USING (staff_can('contracts', 'manage'));

-- ─── RLS: po_history ──────────────────────────────────────
DROP POLICY IF EXISTS "staff_read_po_history" ON po_history;
CREATE POLICY "staff_read_po_history" ON po_history FOR SELECT TO authenticated USING (is_staff());

-- ─── RLS: contract_history ────────────────────────────────
DROP POLICY IF EXISTS "staff_read_contract_history" ON contract_history;
CREATE POLICY "staff_read_contract_history" ON contract_history FOR SELECT TO authenticated USING (is_staff());

-- ─── Storage buckets (private) ────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('po-documents', 'po-documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('contract-documents', 'contract-documents', false) ON CONFLICT (id) DO NOTHING;

-- ─── Storage RLS: po-documents ────────────────────────────
DROP POLICY IF EXISTS "staff_read_po_docs" ON storage.objects;
CREATE POLICY "staff_read_po_docs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'po-documents' AND is_staff());

DROP POLICY IF EXISTS "staff_upload_po_docs" ON storage.objects;
CREATE POLICY "staff_upload_po_docs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'po-documents' AND is_staff());

DROP POLICY IF EXISTS "staff_update_po_docs" ON storage.objects;
CREATE POLICY "staff_update_po_docs" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'po-documents' AND is_staff())
  WITH CHECK (bucket_id = 'po-documents' AND is_staff());

DROP POLICY IF EXISTS "staff_delete_po_docs" ON storage.objects;
CREATE POLICY "staff_delete_po_docs" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'po-documents' AND is_staff());

-- ─── Storage RLS: contract-documents ──────────────────────
DROP POLICY IF EXISTS "staff_read_contract_docs" ON storage.objects;
CREATE POLICY "staff_read_contract_docs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'contract-documents' AND is_staff());

DROP POLICY IF EXISTS "staff_upload_contract_docs" ON storage.objects;
CREATE POLICY "staff_upload_contract_docs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contract-documents' AND is_staff());

DROP POLICY IF EXISTS "staff_update_contract_docs" ON storage.objects;
CREATE POLICY "staff_update_contract_docs" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'contract-documents' AND is_staff())
  WITH CHECK (bucket_id = 'contract-documents' AND is_staff());

DROP POLICY IF EXISTS "staff_delete_contract_docs" ON storage.objects;
CREATE POLICY "staff_delete_contract_docs" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'contract-documents' AND is_staff());
