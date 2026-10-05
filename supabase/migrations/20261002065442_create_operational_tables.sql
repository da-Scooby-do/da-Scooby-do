/*
# Operational Tables Migration

## New Tables

### 1. equipment_sources
Equipment ownership/partner source records.
- id, type (sahab_owned|partner_owner), name, contact fields, agreement_reference, internal_cost, commission_notes, created_at

### 2. equipment_units
Physical equipment units linked to equipment_models.
- id (uuid), unit_code (e.g. CAT320-001), model_id (text FK -> equipment_models.id), year, serial_number, condition, status, location fields, source_id (FK), inspection/maintenance dates, internal notes, images (jsonb), created_at, updated_at
- Unique constraint on unit_code

### 3. equipment_inspections
Inspection records linked to equipment_units.
- id, unit_id (FK CASCADE), inspection_date, inspector, condition, notes, attachments (jsonb), created_at

### 4. equipment_maintenance
Maintenance records linked to equipment_units.
- id, unit_id (FK CASCADE), maintenance_date, description, status, notes, created_at

### 5. equipment_allocations
Equipment allocation records linking units to rentals/contracts.
- id, allocation_number (ALLOC-YYYY-####), rental_operation_id (FK -> rental_operations), contract_id, contract_number, request_id, request_reference, customer_name, company_name, model_id, model_name, unit_id (FK -> equipment_units), unit_code, project_name, location, start_date, expected_end_date, assigned_employee_id, assigned_employee_name, status, override_reason, internal_notes, created_at, updated_at
- Exclusion constraint prevents overlapping active allocations for the same unit

### 6. equipment_allocation_history
- id, allocation_id (FK CASCADE), action, previous_status, new_status, employee_id, employee_name, reason, created_at

### 7. deliveries
Delivery/handover records linked to allocations.
- id, delivery_number (DLV-YYYY-####), allocation_id (FK), rental_operation_id (FK), contract_id, contract_number, customer_name, company_name, model_name, unit_code, project_name, location, rental_start, rental_end, operator, transportation, diesel, delivery_date, delivery_time, driver_contact, site_contact_name, site_contact_mobile, delivery_notes, condition (jsonb), acknowledgment (jsonb), status, delivery_photos (jsonb), internal_documents (jsonb), created_at, created_by

### 8. delivery_returns
Return records linked to deliveries.
- id, delivery_id (FK CASCADE), return_number, return_date, return_time, received_by, condition (jsonb), damage_issues, notes, photos (jsonb), status, new_damage, missing_items, condition_changed, review_notes, maintenance_required, maintenance_notes, created_at

### 9. contract_renewals
Contract renewal records linked to DB contracts.
- id, renewal_number (RNW-YYYY-####), original_contract_id (FK -> contracts), original_contract_number, previous_renewal_id, previous_renewal_number, customer_name, company_name, customer_email, customer_classification, equipment_model, quantity, renewal_period, custom_period_days, current_start_date, current_end_date, new_start_date, new_end_date, remaining_days, pricing (jsonb), operator, diesel, transportation, project_name, location, status, assigned_employee_id, assigned_employee_name, allocation_choice, new_allocation_id, new_contract_id, new_contract_number, internal_notes, customer_rejection_reason, created_at, updated_at

### 10. contract_renewal_history
- id, renewal_id (FK CASCADE), action, action_ar, employee_id, employee_name, previous_status, new_status, notes, pricing_changed, created_at

## Security
All tables get RLS with staff-only access via is_staff() and staff_can() checks.
Customer-scoped read access for deliveries and renewals via customer_email matching.
Exclusion constraint on equipment_allocations prevents double-booking.
*/

-- ─── equipment_sources ───────────────────────────────────
CREATE TABLE IF NOT EXISTS equipment_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'sahab_owned',
  name text NOT NULL DEFAULT '',
  contact_name text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  agreement_reference text NOT NULL DEFAULT '',
  internal_cost numeric NOT NULL DEFAULT 0,
  commission_margin_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE equipment_sources ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_eq_sources_type ON equipment_sources(type);

-- ─── equipment_units ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS equipment_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_code text UNIQUE NOT NULL,
  model_id text REFERENCES equipment_models(id) ON DELETE SET NULL,
  year text NOT NULL DEFAULT '',
  serial_number text NOT NULL DEFAULT '',
  condition text NOT NULL DEFAULT 'good',
  status text NOT NULL DEFAULT 'available',
  current_region text NOT NULL DEFAULT '',
  current_city text NOT NULL DEFAULT '',
  current_location text NOT NULL DEFAULT '',
  available_from date,
  current_contract_reference text NOT NULL DEFAULT '',
  internal_notes text NOT NULL DEFAULT '',
  source_id uuid REFERENCES equipment_sources(id) ON DELETE SET NULL,
  last_inspection_date date,
  next_inspection_date date,
  maintenance_notes text NOT NULL DEFAULT '',
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE equipment_units ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_eq_units_model ON equipment_units(model_id);
CREATE INDEX IF NOT EXISTS idx_eq_units_status ON equipment_units(status);
CREATE INDEX IF NOT EXISTS idx_eq_units_source ON equipment_units(source_id);

-- ─── equipment_inspections ────────────────────────────────
CREATE TABLE IF NOT EXISTS equipment_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES equipment_units(id) ON DELETE CASCADE,
  inspection_date date NOT NULL DEFAULT CURRENT_DATE,
  inspector text NOT NULL DEFAULT '',
  condition text NOT NULL DEFAULT 'good',
  notes text NOT NULL DEFAULT '',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE equipment_inspections ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_eq_insp_unit ON equipment_inspections(unit_id);

-- ─── equipment_maintenance ────────────────────────────────
CREATE TABLE IF NOT EXISTS equipment_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES equipment_units(id) ON DELETE CASCADE,
  maintenance_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'scheduled',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE equipment_maintenance ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_eq_maint_unit ON equipment_maintenance(unit_id);

-- ─── equipment_allocations ────────────────────────────────
CREATE TABLE IF NOT EXISTS equipment_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_number text UNIQUE,
  rental_operation_id uuid REFERENCES rental_operations(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  contract_number text NOT NULL DEFAULT '',
  request_id text NOT NULL DEFAULT '',
  request_reference text NOT NULL DEFAULT '',
  customer_name text NOT NULL DEFAULT '',
  company_name text NOT NULL DEFAULT '',
  model_id text,
  model_name text NOT NULL DEFAULT '',
  unit_id uuid REFERENCES equipment_units(id) ON DELETE SET NULL,
  unit_code text NOT NULL DEFAULT '',
  project_name text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_end_date date,
  assigned_employee_id uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  assigned_employee_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  override_reason text NOT NULL DEFAULT '',
  internal_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE equipment_allocations ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_alloc_op ON equipment_allocations(rental_operation_id);
CREATE INDEX IF NOT EXISTS idx_alloc_contract ON equipment_allocations(contract_id);
CREATE INDEX IF NOT EXISTS idx_alloc_unit ON equipment_allocations(unit_id);
CREATE INDEX IF NOT EXISTS idx_alloc_status ON equipment_allocations(status);

-- ─── equipment_allocation_history ─────────────────────────
CREATE TABLE IF NOT EXISTS equipment_allocation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id uuid NOT NULL REFERENCES equipment_allocations(id) ON DELETE CASCADE,
  action text NOT NULL,
  previous_status text,
  new_status text,
  employee_id uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  employee_name text NOT NULL DEFAULT '',
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE equipment_allocation_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_alloc_hist_alloc ON equipment_allocation_history(allocation_id);

-- ─── deliveries ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_number text UNIQUE,
  allocation_id uuid REFERENCES equipment_allocations(id) ON DELETE SET NULL,
  rental_operation_id uuid REFERENCES rental_operations(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  contract_number text NOT NULL DEFAULT '',
  customer_name text NOT NULL DEFAULT '',
  company_name text NOT NULL DEFAULT '',
  customer_email text,
  model_name text NOT NULL DEFAULT '',
  unit_code text NOT NULL DEFAULT '',
  project_name text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  rental_start date,
  rental_end date,
  operator text NOT NULL DEFAULT '',
  transportation text NOT NULL DEFAULT '',
  diesel text NOT NULL DEFAULT '',
  delivery_date date,
  delivery_time text NOT NULL DEFAULT '',
  driver_contact text NOT NULL DEFAULT '',
  site_contact_name text NOT NULL DEFAULT '',
  site_contact_mobile text NOT NULL DEFAULT '',
  delivery_notes text NOT NULL DEFAULT '',
  condition jsonb NOT NULL DEFAULT '{}'::jsonb,
  acknowledgment jsonb,
  status text NOT NULL DEFAULT 'scheduled',
  delivery_photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  internal_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_deliv_alloc ON deliveries(allocation_id);
CREATE INDEX IF NOT EXISTS idx_deliv_op ON deliveries(rental_operation_id);
CREATE INDEX IF NOT EXISTS idx_deliv_status ON deliveries(status);

-- ─── delivery_returns ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  return_number text UNIQUE,
  return_date date,
  return_time text NOT NULL DEFAULT '',
  received_by text NOT NULL DEFAULT '',
  condition jsonb NOT NULL DEFAULT '{}'::jsonb,
  damage_issues text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'received',
  new_damage boolean NOT NULL DEFAULT false,
  missing_items boolean NOT NULL DEFAULT false,
  condition_changed boolean NOT NULL DEFAULT false,
  review_notes text NOT NULL DEFAULT '',
  maintenance_required boolean NOT NULL DEFAULT false,
  maintenance_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE delivery_returns ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_returns_deliv ON delivery_returns(delivery_id);

-- ─── contract_renewals ────────────────────────────────────
CREATE TABLE IF NOT EXISTS contract_renewals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  renewal_number text UNIQUE,
  original_contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  original_contract_number text NOT NULL DEFAULT '',
  previous_renewal_id uuid REFERENCES contract_renewals(id) ON DELETE SET NULL,
  previous_renewal_number text,
  customer_name text NOT NULL DEFAULT '',
  company_name text NOT NULL DEFAULT '',
  customer_email text,
  customer_classification text NOT NULL DEFAULT 'standard',
  equipment_model text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 1,
  renewal_period text NOT NULL DEFAULT '1_month',
  custom_period_days integer NOT NULL DEFAULT 0,
  current_start_date date,
  current_end_date date,
  new_start_date date,
  new_end_date date,
  remaining_days integer NOT NULL DEFAULT 0,
  pricing jsonb NOT NULL DEFAULT '{}'::jsonb,
  operator text NOT NULL DEFAULT '',
  diesel text NOT NULL DEFAULT '',
  transportation text NOT NULL DEFAULT '',
  project_name text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  assigned_employee_id uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  assigned_employee_name text NOT NULL DEFAULT '',
  allocation_choice text NOT NULL DEFAULT 'pending',
  new_allocation_id text,
  new_contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  new_contract_number text,
  internal_notes text NOT NULL DEFAULT '',
  customer_rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE contract_renewals ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_renewal_contract ON contract_renewals(original_contract_id);
CREATE INDEX IF NOT EXISTS idx_renewal_status ON contract_renewals(status);
CREATE INDEX IF NOT EXISTS idx_renewal_customer ON contract_renewals(customer_email);

-- ─── contract_renewal_history ─────────────────────────────
CREATE TABLE IF NOT EXISTS contract_renewal_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  renewal_id uuid NOT NULL REFERENCES contract_renewals(id) ON DELETE CASCADE,
  action text NOT NULL,
  action_ar text NOT NULL DEFAULT '',
  employee_id uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  employee_name text NOT NULL DEFAULT '',
  previous_status text,
  new_status text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  pricing_changed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE contract_renewal_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_renewal_hist_renewal ON contract_renewal_history(renewal_id);

-- ─── Sequences for auto-numbering ─────────────────────────
CREATE SEQUENCE IF NOT EXISTS allocation_ref_seq START 1;
CREATE SEQUENCE IF NOT EXISTS delivery_ref_seq START 1;
CREATE SEQUENCE IF NOT EXISTS return_ref_seq START 1;
CREATE SEQUENCE IF NOT EXISTS renewal_ref_seq START 1;

-- ─── Trigger: allocation number ───────────────────────────
CREATE OR REPLACE FUNCTION generate_allocation_number()
RETURNS trigger AS $$
DECLARE seq_val bigint;
BEGIN
  IF NEW.allocation_number IS NULL OR NEW.allocation_number = '' THEN
    seq_val := nextval('allocation_ref_seq');
    NEW.allocation_number := 'ALLOC-' || extract(year from now()) || '-' || lpad(seq_val::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_alloc_number ON equipment_allocations;
CREATE TRIGGER trg_alloc_number BEFORE INSERT ON equipment_allocations
  FOR EACH ROW EXECUTE FUNCTION generate_allocation_number();

-- ─── Trigger: delivery number ─────────────────────────────
CREATE OR REPLACE FUNCTION generate_delivery_number()
RETURNS trigger AS $$
DECLARE seq_val bigint;
BEGIN
  IF NEW.delivery_number IS NULL OR NEW.delivery_number = '' THEN
    seq_val := nextval('delivery_ref_seq');
    NEW.delivery_number := 'DLV-' || extract(year from now()) || '-' || lpad(seq_val::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_deliv_number ON deliveries;
CREATE TRIGGER trg_deliv_number BEFORE INSERT ON deliveries
  FOR EACH ROW EXECUTE FUNCTION generate_delivery_number();

-- ─── Trigger: return number ───────────────────────────────
CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS trigger AS $$
DECLARE seq_val bigint;
BEGIN
  IF NEW.return_number IS NULL OR NEW.return_number = '' THEN
    seq_val := nextval('return_ref_seq');
    NEW.return_number := 'RTN-' || extract(year from now()) || '-' || lpad(seq_val::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_return_number ON delivery_returns;
CREATE TRIGGER trg_return_number BEFORE INSERT ON delivery_returns
  FOR EACH ROW EXECUTE FUNCTION generate_return_number();

-- ─── Trigger: renewal number ──────────────────────────────
CREATE OR REPLACE FUNCTION generate_renewal_number()
RETURNS trigger AS $$
DECLARE seq_val bigint;
BEGIN
  IF NEW.renewal_number IS NULL OR NEW.renewal_number = '' THEN
    seq_val := nextval('renewal_ref_seq');
    NEW.renewal_number := 'RNW-' || extract(year from now()) || '-' || lpad(seq_val::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_renewal_number ON contract_renewals;
CREATE TRIGGER trg_renewal_number BEFORE INSERT ON contract_renewals
  FOR EACH ROW EXECUTE FUNCTION generate_renewal_number();

-- ─── Trigger: allocation history ──────────────────────────
CREATE OR REPLACE FUNCTION record_allocation_history()
RETURNS trigger AS $$
DECLARE staff_name text;
BEGIN
  SELECT full_name INTO staff_name FROM staff_profiles WHERE id = auth.uid();
  IF TG_OP = 'INSERT' THEN
    INSERT INTO equipment_allocation_history (allocation_id, action, new_status, employee_id, employee_name)
    VALUES (NEW.id, 'created', NEW.status, auth.uid(), staff_name);
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO equipment_allocation_history (allocation_id, action, previous_status, new_status, employee_id, employee_name)
    VALUES (NEW.id, 'status_changed', OLD.status, NEW.status, auth.uid(), staff_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_alloc_history ON equipment_allocations;
CREATE TRIGGER trg_alloc_history AFTER INSERT OR UPDATE ON equipment_allocations
  FOR EACH ROW EXECUTE FUNCTION record_allocation_history();

-- ─── RLS: equipment_sources ───────────────────────────────
DROP POLICY IF EXISTS "staff_read_eq_sources" ON equipment_sources;
CREATE POLICY "staff_read_eq_sources" ON equipment_sources FOR SELECT TO authenticated USING (is_staff());
DROP POLICY IF EXISTS "staff_create_eq_sources" ON equipment_sources;
CREATE POLICY "staff_create_eq_sources" ON equipment_sources FOR INSERT TO authenticated WITH CHECK (staff_can('equipment', 'create') OR staff_can('equipment', 'manage'));
DROP POLICY IF EXISTS "staff_update_eq_sources" ON equipment_sources;
CREATE POLICY "staff_update_eq_sources" ON equipment_sources FOR UPDATE TO authenticated USING (staff_can('equipment', 'edit') OR staff_can('equipment', 'manage')) WITH CHECK (staff_can('equipment', 'edit') OR staff_can('equipment', 'manage'));
DROP POLICY IF EXISTS "staff_delete_eq_sources" ON equipment_sources;
CREATE POLICY "staff_delete_eq_sources" ON equipment_sources FOR DELETE TO authenticated USING (staff_can('equipment', 'manage'));

-- ─── RLS: equipment_units ─────────────────────────────────
DROP POLICY IF EXISTS "staff_read_eq_units" ON equipment_units;
CREATE POLICY "staff_read_eq_units" ON equipment_units FOR SELECT TO authenticated USING (is_staff());
DROP POLICY IF EXISTS "staff_create_eq_units" ON equipment_units;
CREATE POLICY "staff_create_eq_units" ON equipment_units FOR INSERT TO authenticated WITH CHECK (staff_can('equipment', 'create') OR staff_can('equipment', 'manage'));
DROP POLICY IF EXISTS "staff_update_eq_units" ON equipment_units;
CREATE POLICY "staff_update_eq_units" ON equipment_units FOR UPDATE TO authenticated USING (staff_can('equipment', 'edit') OR staff_can('equipment', 'manage')) WITH CHECK (staff_can('equipment', 'edit') OR staff_can('equipment', 'manage'));
DROP POLICY IF EXISTS "staff_delete_eq_units" ON equipment_units;
CREATE POLICY "staff_delete_eq_units" ON equipment_units FOR DELETE TO authenticated USING (staff_can('equipment', 'manage'));

-- ─── RLS: equipment_inspections ───────────────────────────
DROP POLICY IF EXISTS "staff_read_eq_inspections" ON equipment_inspections;
CREATE POLICY "staff_read_eq_inspections" ON equipment_inspections FOR SELECT TO authenticated USING (is_staff());
DROP POLICY IF EXISTS "staff_create_eq_inspections" ON equipment_inspections;
CREATE POLICY "staff_create_eq_inspections" ON equipment_inspections FOR INSERT TO authenticated WITH CHECK (staff_can('equipment', 'edit') OR staff_can('equipment', 'manage'));
DROP POLICY IF EXISTS "staff_update_eq_inspections" ON equipment_inspections;
CREATE POLICY "staff_update_eq_inspections" ON equipment_inspections FOR UPDATE TO authenticated USING (staff_can('equipment', 'edit') OR staff_can('equipment', 'manage')) WITH CHECK (staff_can('equipment', 'edit') OR staff_can('equipment', 'manage'));
DROP POLICY IF EXISTS "staff_delete_eq_inspections" ON equipment_inspections;
CREATE POLICY "staff_delete_eq_inspections" ON equipment_inspections FOR DELETE TO authenticated USING (staff_can('equipment', 'manage'));

-- ─── RLS: equipment_maintenance ───────────────────────────
DROP POLICY IF EXISTS "staff_read_eq_maintenance" ON equipment_maintenance;
CREATE POLICY "staff_read_eq_maintenance" ON equipment_maintenance FOR SELECT TO authenticated USING (is_staff());
DROP POLICY IF EXISTS "staff_create_eq_maintenance" ON equipment_maintenance;
CREATE POLICY "staff_create_eq_maintenance" ON equipment_maintenance FOR INSERT TO authenticated WITH CHECK (staff_can('equipment', 'edit') OR staff_can('equipment', 'manage'));
DROP POLICY IF EXISTS "staff_update_eq_maintenance" ON equipment_maintenance;
CREATE POLICY "staff_update_eq_maintenance" ON equipment_maintenance FOR UPDATE TO authenticated USING (staff_can('equipment', 'edit') OR staff_can('equipment', 'manage')) WITH CHECK (staff_can('equipment', 'edit') OR staff_can('equipment', 'manage'));
DROP POLICY IF EXISTS "staff_delete_eq_maintenance" ON equipment_maintenance;
CREATE POLICY "staff_delete_eq_maintenance" ON equipment_maintenance FOR DELETE TO authenticated USING (staff_can('equipment', 'manage'));

-- ─── RLS: equipment_allocations ───────────────────────────
DROP POLICY IF EXISTS "staff_read_allocations" ON equipment_allocations;
CREATE POLICY "staff_read_allocations" ON equipment_allocations FOR SELECT TO authenticated USING (is_staff());
DROP POLICY IF EXISTS "staff_create_allocations" ON equipment_allocations;
CREATE POLICY "staff_create_allocations" ON equipment_allocations FOR INSERT TO authenticated WITH CHECK (staff_can('rental_requests', 'create') OR staff_can('rental_requests', 'manage'));
DROP POLICY IF EXISTS "staff_update_allocations" ON equipment_allocations;
CREATE POLICY "staff_update_allocations" ON equipment_allocations FOR UPDATE TO authenticated USING (staff_can('rental_requests', 'edit') OR staff_can('rental_requests', 'manage')) WITH CHECK (staff_can('rental_requests', 'edit') OR staff_can('rental_requests', 'manage'));
DROP POLICY IF EXISTS "staff_delete_allocations" ON equipment_allocations;
CREATE POLICY "staff_delete_allocations" ON equipment_allocations FOR DELETE TO authenticated USING (staff_can('rental_requests', 'manage'));

-- ─── RLS: equipment_allocation_history ────────────────────
DROP POLICY IF EXISTS "staff_read_alloc_history" ON equipment_allocation_history;
CREATE POLICY "staff_read_alloc_history" ON equipment_allocation_history FOR SELECT TO authenticated USING (is_staff());

-- ─── RLS: deliveries (staff + customer) ───────────────────
DROP POLICY IF EXISTS "staff_read_deliveries" ON deliveries;
CREATE POLICY "staff_read_deliveries" ON deliveries FOR SELECT TO authenticated USING (is_staff());
DROP POLICY IF EXISTS "staff_create_deliveries" ON deliveries;
CREATE POLICY "staff_create_deliveries" ON deliveries FOR INSERT TO authenticated WITH CHECK (staff_can('rental_requests', 'create') OR staff_can('rental_requests', 'manage'));
DROP POLICY IF EXISTS "staff_update_deliveries" ON deliveries;
CREATE POLICY "staff_update_deliveries" ON deliveries FOR UPDATE TO authenticated USING (staff_can('rental_requests', 'edit') OR staff_can('rental_requests', 'manage')) WITH CHECK (staff_can('rental_requests', 'edit') OR staff_can('rental_requests', 'manage'));
DROP POLICY IF EXISTS "staff_delete_deliveries" ON deliveries;
CREATE POLICY "staff_delete_deliveries" ON deliveries FOR DELETE TO authenticated USING (staff_can('rental_requests', 'manage'));
DROP POLICY IF EXISTS "customer_read_deliveries" ON deliveries;
CREATE POLICY "customer_read_deliveries" ON deliveries FOR SELECT TO authenticated
  USING (NOT is_staff() AND customer_email IS NOT NULL AND customer_email = customer_email());

-- ─── RLS: delivery_returns ────────────────────────────────
DROP POLICY IF EXISTS "staff_read_returns" ON delivery_returns;
CREATE POLICY "staff_read_returns" ON delivery_returns FOR SELECT TO authenticated USING (is_staff());
DROP POLICY IF EXISTS "staff_create_returns" ON delivery_returns;
CREATE POLICY "staff_create_returns" ON delivery_returns FOR INSERT TO authenticated WITH CHECK (staff_can('rental_requests', 'edit') OR staff_can('rental_requests', 'manage'));
DROP POLICY IF EXISTS "staff_update_returns" ON delivery_returns;
CREATE POLICY "staff_update_returns" ON delivery_returns FOR UPDATE TO authenticated USING (staff_can('rental_requests', 'edit') OR staff_can('rental_requests', 'manage')) WITH CHECK (staff_can('rental_requests', 'edit') OR staff_can('rental_requests', 'manage'));
DROP POLICY IF EXISTS "staff_delete_returns" ON delivery_returns;
CREATE POLICY "staff_delete_returns" ON delivery_returns FOR DELETE TO authenticated USING (staff_can('rental_requests', 'manage'));
DROP POLICY IF EXISTS "customer_read_returns" ON delivery_returns;
CREATE POLICY "customer_read_returns" ON delivery_returns FOR SELECT TO authenticated
  USING (NOT is_staff() AND EXISTS (
    SELECT 1 FROM deliveries
    WHERE deliveries.id = delivery_returns.delivery_id
      AND deliveries.customer_email = customer_email()
  ));

-- ─── RLS: contract_renewals (staff + customer) ────────────
DROP POLICY IF EXISTS "staff_read_renewals" ON contract_renewals;
CREATE POLICY "staff_read_renewals" ON contract_renewals FOR SELECT TO authenticated USING (is_staff());
DROP POLICY IF EXISTS "staff_create_renewals" ON contract_renewals;
CREATE POLICY "staff_create_renewals" ON contract_renewals FOR INSERT TO authenticated WITH CHECK (staff_can('contracts', 'create') OR staff_can('contracts', 'manage'));
DROP POLICY IF EXISTS "staff_update_renewals" ON contract_renewals;
CREATE POLICY "staff_update_renewals" ON contract_renewals FOR UPDATE TO authenticated USING (staff_can('contracts', 'edit') OR staff_can('contracts', 'manage')) WITH CHECK (staff_can('contracts', 'edit') OR staff_can('contracts', 'manage'));
DROP POLICY IF EXISTS "staff_delete_renewals" ON contract_renewals;
CREATE POLICY "staff_delete_renewals" ON contract_renewals FOR DELETE TO authenticated USING (staff_can('contracts', 'manage'));
DROP POLICY IF EXISTS "customer_read_renewals" ON contract_renewals;
CREATE POLICY "customer_read_renewals" ON contract_renewals FOR SELECT TO authenticated
  USING (NOT is_staff() AND customer_email IS NOT NULL AND customer_email = customer_email());
-- Allow customers to update status (accept/reject) on their own renewals
DROP POLICY IF EXISTS "customer_update_renewals" ON contract_renewals;
CREATE POLICY "customer_update_renewals" ON contract_renewals FOR UPDATE TO authenticated
  USING (NOT is_staff() AND customer_email IS NOT NULL AND customer_email = customer_email())
  WITH CHECK (NOT is_staff() AND customer_email IS NOT NULL AND customer_email = customer_email());

-- ─── RLS: contract_renewal_history ────────────────────────
DROP POLICY IF EXISTS "staff_read_renewal_history" ON contract_renewal_history;
CREATE POLICY "staff_read_renewal_history" ON contract_renewal_history FOR SELECT TO authenticated USING (is_staff());
