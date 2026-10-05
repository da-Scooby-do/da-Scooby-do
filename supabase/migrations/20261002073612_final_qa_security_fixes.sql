/*
# Final QA Security Fixes

## Changes
1. CRITICAL: Drop USING(true) policies on project_requests, replace with staff-scoped policies
2. HIGH: Add SET search_path to is_staff() and staff_can(), REVOKE FROM anon/PUBLIC, GRANT TO authenticated
3. HIGH: Add is_staff() check to equipment-images storage write/delete policies
4. HIGH: Add column-level grants on staff_profiles and staff_roles to prevent privilege escalation
5. MEDIUM: Replace customer_update_renewals broad UPDATE policy with SECURITY DEFINER functions for accept/reject
6. LOW: Fix trigger functions to look up staff name by user_id instead of id
7. REVOKE EXECUTE on customer_accept/reject_quotation FROM PUBLIC/anon (was only GRANT to authenticated)
*/

-- ═══ 1. CRITICAL: project_requests RLS fix ═══════════════

-- Drop the open USING(true) policies
DROP POLICY IF EXISTS "auth_select_project_requests" ON project_requests;
DROP POLICY IF EXISTS "auth_update_project_requests" ON project_requests;
DROP POLICY IF EXISTS "auth_delete_project_requests" ON project_requests;

-- Replace with staff-scoped SELECT
DROP POLICY IF EXISTS "staff_read_project_requests" ON project_requests;
CREATE POLICY "staff_read_project_requests" ON project_requests FOR SELECT
  TO authenticated USING (is_staff());

-- Staff-scoped UPDATE (the existing staff_update_project_requests stays)
-- Staff-scoped DELETE
DROP POLICY IF EXISTS "staff_delete_project_requests" ON project_requests;
CREATE POLICY "staff_delete_project_requests" ON project_requests FOR DELETE
  TO authenticated USING (staff_can('projects', 'manage'));

-- Staff-scoped INSERT (for staff creating requests on behalf of customers)
DROP POLICY IF EXISTS "staff_insert_project_requests" ON project_requests;
CREATE POLICY "staff_insert_project_requests" ON project_requests FOR INSERT
  TO authenticated WITH CHECK (staff_can('projects', 'create') OR staff_can('projects', 'manage'));

-- Note: public_insert_project_requests (TO anon, authenticated) stays for public form submissions
-- Note: customer_read_project_requests stays for customer portal access

-- ═══ 2. HIGH: is_staff() and staff_can() hardening ═══════

ALTER FUNCTION is_staff() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION staff_can(text, text) SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION is_staff() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION staff_can(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION staff_can(text, text) TO authenticated;

-- Also revoke PUBLIC execute on customer quotation functions (were granted to authenticated but not revoked from PUBLIC)
REVOKE EXECUTE ON FUNCTION customer_accept_quotation(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION customer_reject_quotation(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION customer_email() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION customer_display_name() FROM PUBLIC, anon;

-- ═══ 3. HIGH: equipment-images storage policies ══════════

DROP POLICY IF EXISTS "staff_upload_equipment_images" ON storage.objects;
CREATE POLICY "staff_upload_equipment_images" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'equipment-images' AND is_staff());

DROP POLICY IF EXISTS "staff_update_equipment_images" ON storage.objects;
CREATE POLICY "staff_update_equipment_images" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'equipment-images' AND is_staff())
  WITH CHECK (bucket_id = 'equipment-images' AND is_staff());

DROP POLICY IF EXISTS "staff_delete_equipment_images" ON storage.objects;
CREATE POLICY "staff_delete_equipment_images" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'equipment-images' AND is_staff());

-- ═══ 4. HIGH: Column-level grants on staff tables ════════

-- staff_profiles: revoke broad UPDATE, grant only safe columns
REVOKE UPDATE ON staff_profiles FROM authenticated;
GRANT UPDATE (full_name, email, mobile) ON staff_profiles TO authenticated;

-- staff_roles: revoke broad UPDATE, grant only safe columns
REVOKE UPDATE ON staff_roles FROM authenticated;
GRANT UPDATE (name_ar, name_en, description_ar, description_en) ON staff_roles TO authenticated;

-- ═══ 5. MEDIUM: Customer renewal accept/reject via RPC ════

-- Drop the broad customer UPDATE policy
DROP POLICY IF EXISTS "customer_update_renewals" ON contract_renewals;

-- Create SECURITY DEFINER functions for customer accept/reject
CREATE OR REPLACE FUNCTION customer_accept_renewal(p_renewal_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_renewal contract_renewals%ROWTYPE;
  v_customer_email text;
  v_customer_name text;
BEGIN
  v_customer_email := customer_email();
  IF v_customer_email IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF is_staff() THEN
    RAISE EXCEPTION 'Staff must use the staff renewal workflow' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_renewal FROM contract_renewals WHERE id = p_renewal_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Renewal not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_renewal.customer_email IS NULL OR v_renewal.customer_email <> v_customer_email THEN
    RAISE EXCEPTION 'Not authorized to modify this renewal' USING ERRCODE = '42501';
  END IF;

  IF v_renewal.status <> 'pending_customer_approval' THEN
    RAISE EXCEPTION 'Renewal is not pending customer approval (current: %)', v_renewal.status USING ERRCODE = 'P0003';
  END IF;

  UPDATE contract_renewals SET status = 'approved', updated_at = now() WHERE id = p_renewal_id;

  v_customer_name := COALESCE(v_renewal.customer_name, customer_display_name(), v_customer_email);
  INSERT INTO contract_renewal_history (renewal_id, action, action_ar, employee_name, previous_status, new_status, notes)
  VALUES (p_renewal_id, 'customer_accepted', 'موافقة العميل', v_customer_name, 'pending_customer_approval', 'approved', 'Accepted by customer');
END;
$$;

CREATE OR REPLACE FUNCTION customer_reject_renewal(p_renewal_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_renewal contract_renewals%ROWTYPE;
  v_customer_email text;
  v_customer_name text;
BEGIN
  v_customer_email := customer_email();
  IF v_customer_email IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF is_staff() THEN
    RAISE EXCEPTION 'Staff must use the staff renewal workflow' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_renewal FROM contract_renewals WHERE id = p_renewal_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Renewal not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_renewal.customer_email IS NULL OR v_renewal.customer_email <> v_customer_email THEN
    RAISE EXCEPTION 'Not authorized to modify this renewal' USING ERRCODE = '42501';
  END IF;

  IF v_renewal.status <> 'pending_customer_approval' THEN
    RAISE EXCEPTION 'Renewal is not pending customer approval (current: %)', v_renewal.status USING ERRCODE = 'P0003';
  END IF;

  IF p_reason IS NULL OR btrim(p_reason) = '' THEN
    RAISE EXCEPTION 'Reject reason is required' USING ERRCODE = '23502';
  END IF;

  UPDATE contract_renewals SET status = 'rejected', customer_rejection_reason = p_reason, updated_at = now() WHERE id = p_renewal_id;

  v_customer_name := COALESCE(v_renewal.customer_name, customer_display_name(), v_customer_email);
  INSERT INTO contract_renewal_history (renewal_id, action, action_ar, employee_name, previous_status, new_status, notes)
  VALUES (p_renewal_id, 'customer_rejected', 'رفض العميل', v_customer_name, 'pending_customer_approval', 'rejected', p_reason);
END;
$$;

GRANT EXECUTE ON FUNCTION customer_accept_renewal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION customer_reject_renewal(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION customer_accept_renewal(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION customer_reject_renewal(uuid, text) FROM PUBLIC, anon;

-- ═══ 6. LOW: Fix trigger functions staff name lookup ══════

-- Fix record_allocation_history
CREATE OR REPLACE FUNCTION record_allocation_history()
RETURNS trigger AS $$
DECLARE staff_name text;
BEGIN
  SELECT full_name INTO staff_name FROM staff_profiles WHERE user_id = auth.uid();
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

-- Fix the rental_operation_history trigger
CREATE OR REPLACE FUNCTION record_rental_op_history()
RETURNS trigger AS $$
DECLARE staff_name text;
BEGIN
  SELECT full_name INTO staff_name FROM staff_profiles WHERE user_id = auth.uid();
  IF TG_OP = 'INSERT' THEN
    INSERT INTO rental_operation_history (operation_id, action, new_status, performed_by, performed_by_name)
    VALUES (NEW.id, 'created', NEW.status, auth.uid(), staff_name);
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO rental_operation_history (operation_id, action, previous_status, new_status, performed_by, performed_by_name)
    VALUES (NEW.id, 'status_changed', OLD.status, NEW.status, auth.uid(), staff_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix quotation history trigger
CREATE OR REPLACE FUNCTION record_quotation_history()
RETURNS trigger AS $$
DECLARE staff_name text;
BEGIN
  SELECT full_name INTO staff_name FROM staff_profiles WHERE user_id = auth.uid();
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

-- Fix PO history trigger
CREATE OR REPLACE FUNCTION record_po_history()
RETURNS trigger AS $$
DECLARE staff_name text;
BEGIN
  SELECT full_name INTO staff_name FROM staff_profiles WHERE user_id = auth.uid();
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

-- Fix contract history trigger
CREATE OR REPLACE FUNCTION record_contract_history()
RETURNS trigger AS $$
DECLARE staff_name text;
BEGIN
  SELECT full_name INTO staff_name FROM staff_profiles WHERE user_id = auth.uid();
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

-- Fix request_status_history trigger
CREATE OR REPLACE FUNCTION record_request_status_change()
RETURNS trigger AS $$
DECLARE staff_name text;
BEGIN
  SELECT full_name INTO staff_name FROM staff_profiles WHERE user_id = auth.uid();
  IF TG_OP = 'INSERT' THEN
    INSERT INTO request_status_history (request_id, request_type, action, new_status, performed_by, performed_by_name)
    VALUES (NEW.id, NEW.request_type, 'created', NEW.status, auth.uid(), staff_name);
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO request_status_history (request_id, request_type, action, previous_status, new_status, performed_by, performed_by_name)
    VALUES (NEW.id, NEW.request_type, 'status_changed', OLD.status, NEW.status, auth.uid(), staff_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
