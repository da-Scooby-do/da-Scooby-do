/*
# Security: Customer Quotation Actions + Allocation Overlap Protection

## 1. Customer Quotation Accept/Reject (SECURITY DEFINER)

A customer may only change their own quotation status from `sent` to `accepted` or `rejected`.
No other fields may be modified. This is enforced by SECURITY DEFINER functions.

### Functions
- `customer_accept_quotation(p_quotation_id uuid)` → sets status to 'accepted', records history
- `customer_reject_quotation(p_quotation_id uuid, p_reason text)` → sets status to 'rejected', records history with reason

### Grants
- EXECUTE granted to `authenticated` role only

## 2. Equipment Allocation Overlap Protection (Exclusion Constraint)

Prevents two active allocations (status `reserved` or `allocated`) for the same physical unit
with overlapping date ranges. Uses a partial EXCLUDE constraint with GiST index.

Boundary semantics: exclusive end dates (matching frontend `datesOverlap` logic).
Allocations touching at boundaries (e.g. Jan 1-10 and Jan 10-20) do NOT conflict.

No existing active allocations found — table is empty. Safe to add constraint.
*/

-- ═══ 1. CUSTOMER QUOTATION ACCEPT/REJECT ════════════════

-- Helper: get customer display name from JWT metadata
CREATE OR REPLACE FUNCTION customer_display_name()
RETURNS text
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT (auth.jwt() -> 'user_metadata') ->> 'full_name'
$$;

-- Function: customer accepts a quotation
CREATE OR REPLACE FUNCTION customer_accept_quotation(p_quotation_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_quotation quotations%ROWTYPE;
  v_customer_email text;
  v_customer_name text;
BEGIN
  v_customer_email := customer_email();

  IF v_customer_email IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF is_staff() THEN
    RAISE EXCEPTION 'Staff must use the staff quotation workflow' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_quotation
  FROM quotations
  WHERE id = p_quotation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quotation not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_quotation.customer_email IS NULL OR v_quotation.customer_email <> v_customer_email THEN
    RAISE EXCEPTION 'Not authorized to modify this quotation' USING ERRCODE = '42501';
  END IF;

  IF v_quotation.status <> 'sent' THEN
    RAISE EXCEPTION 'Quotation is not in sent status (current: %)', v_quotation.status USING ERRCODE = 'P0003';
  END IF;

  UPDATE quotations
  SET status = 'accepted',
      accepted_at = now(),
      updated_at = now()
  WHERE id = p_quotation_id;

  v_customer_name := COALESCE(v_quotation.customer_name, customer_display_name(), v_customer_email);

  INSERT INTO quotation_history (quotation_id, action, previous_status, new_status, performed_by_name, notes)
  VALUES (p_quotation_id, 'customer_accepted', 'sent', 'accepted', v_customer_name, 'Accepted by customer');
END;
$$;

-- Function: customer rejects a quotation
CREATE OR REPLACE FUNCTION customer_reject_quotation(p_quotation_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_quotation quotations%ROWTYPE;
  v_customer_email text;
  v_customer_name text;
BEGIN
  v_customer_email := customer_email();

  IF v_customer_email IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF is_staff() THEN
    RAISE EXCEPTION 'Staff must use the staff quotation workflow' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_quotation
  FROM quotations
  WHERE id = p_quotation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quotation not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_quotation.customer_email IS NULL OR v_quotation.customer_email <> v_customer_email THEN
    RAISE EXCEPTION 'Not authorized to modify this quotation' USING ERRCODE = '42501';
  END IF;

  IF v_quotation.status <> 'sent' THEN
    RAISE EXCEPTION 'Quotation is not in sent status (current: %)', v_quotation.status USING ERRCODE = 'P0003';
  END IF;

  IF p_reason IS NULL OR btrim(p_reason) = '' THEN
    RAISE EXCEPTION 'Reject reason is required' USING ERRCODE = '23502';
  END IF;

  UPDATE quotations
  SET status = 'rejected',
      rejected_at = now(),
      reject_reason = p_reason,
      updated_at = now()
  WHERE id = p_quotation_id;

  v_customer_name := COALESCE(v_quotation.customer_name, customer_display_name(), v_customer_email);

  INSERT INTO quotation_history (quotation_id, action, previous_status, new_status, performed_by_name, notes)
  VALUES (p_quotation_id, 'customer_rejected', 'sent', 'rejected', v_customer_name, p_reason);
END;
$$;

GRANT EXECUTE ON FUNCTION customer_accept_quotation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION customer_reject_quotation(uuid, text) TO authenticated;

-- ═══ 2. ALLOCATION OVERLAP PROTECTION ════════════════════

-- Pre-check for existing conflicts
DO $$
DECLARE
  conflict_count integer;
BEGIN
  SELECT count(*) INTO conflict_count
  FROM equipment_allocations a1
  JOIN equipment_allocations a2 ON a1.unit_id = a2.unit_id
    AND a1.id < a2.id
    AND a1.status IN ('reserved', 'allocated')
    AND a2.status IN ('reserved', 'allocated')
    AND a1.unit_id IS NOT NULL
    AND daterange(a1.start_date, COALESCE(a1.expected_end_date, '9999-12-31'::date), '[)')
      && daterange(a2.start_date, COALESCE(a2.expected_end_date, '9999-12-31'::date), '[)');

  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'Found % existing overlapping active allocations. Resolve before adding exclusion constraint.', conflict_count;
  END IF;
END $$;

-- Generated column for the date range (exclusive end, matching frontend semantics)
ALTER TABLE equipment_allocations
  ADD COLUMN IF NOT EXISTS allocation_range daterange
  GENERATED ALWAYS AS (
    daterange(start_date, COALESCE(expected_end_date, '9999-12-31'::date), '[)')
  ) STORED;

-- btree_gist needed for mixing equality (=) and overlap (&&) in exclusion
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Drop existing constraint if re-running
ALTER TABLE equipment_allocations
  DROP CONSTRAINT IF EXISTS exclude_overlapping_active_allocations;

-- Partial exclusion constraint: only active allocations with a real unit
ALTER TABLE equipment_allocations
  ADD CONSTRAINT exclude_overlapping_active_allocations
  EXCLUDE USING GiST (unit_id WITH =, allocation_range WITH &&)
  WHERE (unit_id IS NOT NULL AND status IN ('reserved', 'allocated'));
