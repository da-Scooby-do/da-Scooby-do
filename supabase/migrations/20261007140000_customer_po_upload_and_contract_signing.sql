/*
# Customers upload their purchase order (PO) and sign the contract online

Flow: quotation accepted -> customer uploads the PO -> SAHAB issues the
rental contract -> customer signs it in their dashboard.

1. purchase_orders
   - customer_email, customer_po_number (the customer's own PO number; the
     SAHAB-PO-xxxxxx reference stays the unique po_number),
     submitted_by_customer.
   - Customers can read their own POs.
   - customer_submit_po(): only for the customer's own accepted quotation,
     only with a file the customer uploaded to their own folder, one active
     PO per quotation. Status starts as 'received' for SAHAB to review.
2. Storage (po-documents): customers upload/read only under
   customer/<their user id>/...
3. contracts
   - signed_by_name, signed_by_title, signed_at, signature_image (PNG data
     URL drawn by the customer), signed_user_id.
   - customer_sign_contract(): only the contract's customer, only while it
     is 'ready' or 'pending_signature'; sets it 'active'.
*/

-- 1. Purchase orders ---------------------------------------------------------
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS customer_po_number text,
  ADD COLUMN IF NOT EXISTS submitted_by_customer boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_po_customer_email ON purchase_orders (customer_email);

CREATE POLICY customer_read_own_pos ON purchase_orders
  FOR SELECT TO authenticated
  USING (NOT is_staff() AND customer_email IS NOT NULL AND customer_email = customer_email());

CREATE OR REPLACE FUNCTION public.customer_submit_po(
  p_quotation_id uuid,
  p_po_number text,
  p_po_date date,
  p_document_path text,
  p_document_name text,
  p_notes text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_email text := customer_email();
  v_q quotations%ROWTYPE;
  v_id uuid;
BEGIN
  IF v_email IS NULL OR auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF is_staff() THEN
    RAISE EXCEPTION 'Staff must use the staff purchase order workflow' USING ERRCODE = '42501';
  END IF;
  IF p_po_number IS NULL OR btrim(p_po_number) = '' THEN
    RAISE EXCEPTION 'PO number is required' USING ERRCODE = '22023';
  END IF;
  IF p_document_path IS NULL
     OR p_document_path NOT LIKE 'customer/' || auth.uid()::text || '/%'
     OR NOT EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id = 'po-documents' AND o.name = p_document_path) THEN
    RAISE EXCEPTION 'PO document is missing' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_q FROM quotations WHERE id = p_quotation_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quotation not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_q.customer_email IS NULL OR v_q.customer_email <> v_email THEN
    RAISE EXCEPTION 'Not authorized for this quotation' USING ERRCODE = '42501';
  END IF;
  IF v_q.status <> 'accepted' THEN
    RAISE EXCEPTION 'Quotation must be accepted before uploading a PO' USING ERRCODE = 'P0003';
  END IF;
  IF EXISTS (
    SELECT 1 FROM purchase_orders po
    WHERE po.quotation_id = p_quotation_id AND po.status IN ('received', 'reviewing', 'accepted')
  ) THEN
    RAISE EXCEPTION 'A purchase order was already submitted for this quotation' USING ERRCODE = '23505';
  END IF;

  INSERT INTO purchase_orders (
    request_type, request_id, request_reference, quotation_id, quotation_reference,
    customer_name, company_name, po_date, amount, currency, status,
    document_path, document_name, notes, created_by, created_by_name,
    customer_email, customer_po_number, submitted_by_customer
  ) VALUES (
    v_q.request_type, v_q.request_id, v_q.request_reference, v_q.id, v_q.quotation_reference,
    v_q.customer_name, v_q.company_name, coalesce(p_po_date, current_date), coalesce(v_q.total, 0), coalesce(v_q.currency, 'SAR'), 'received',
    p_document_path, nullif(btrim(coalesce(p_document_name, '')), ''), nullif(btrim(coalesce(p_notes, '')), ''), NULL,
    coalesce(customer_display_name(), v_q.customer_name, v_email),
    v_email, btrim(p_po_number), true
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.customer_submit_po(uuid, text, date, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.customer_submit_po(uuid, text, date, text, text, text) TO authenticated;

-- 2. Storage: customers' own PO files -----------------------------------------
CREATE POLICY customer_upload_own_po_docs ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'po-documents'
    AND NOT is_staff()
    AND split_part(name, '/', 1) = 'customer'
    AND split_part(name, '/', 2) = auth.uid()::text
  );

CREATE POLICY customer_read_own_po_docs ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'po-documents'
    AND NOT is_staff()
    AND split_part(name, '/', 1) = 'customer'
    AND split_part(name, '/', 2) = auth.uid()::text
  );

-- 3. Contract signing ----------------------------------------------------------
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS signed_by_name text,
  ADD COLUMN IF NOT EXISTS signed_by_title text,
  ADD COLUMN IF NOT EXISTS signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS signature_image text,
  ADD COLUMN IF NOT EXISTS signed_user_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contracts_signature_image_size') THEN
    ALTER TABLE contracts
      ADD CONSTRAINT contracts_signature_image_size CHECK (signature_image IS NULL OR length(signature_image) <= 300000);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.customer_sign_contract(
  p_contract_id uuid,
  p_name text,
  p_title text,
  p_signature text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_email text := customer_email();
  v_c contracts%ROWTYPE;
BEGIN
  IF v_email IS NULL OR auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF is_staff() THEN
    RAISE EXCEPTION 'Staff cannot sign on behalf of the customer' USING ERRCODE = '42501';
  END IF;
  IF p_name IS NULL OR btrim(p_name) = '' THEN
    RAISE EXCEPTION 'Signer name is required' USING ERRCODE = '22023';
  END IF;
  IF p_signature IS NULL OR p_signature NOT LIKE 'data:image/png;base64,%' OR length(p_signature) > 300000 THEN
    RAISE EXCEPTION 'A drawn signature is required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_c FROM contracts WHERE id = p_contract_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_c.customer_email IS NULL OR v_c.customer_email <> v_email THEN
    RAISE EXCEPTION 'Not authorized for this contract' USING ERRCODE = '42501';
  END IF;
  IF v_c.signed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Contract is already signed' USING ERRCODE = 'P0003';
  END IF;
  IF v_c.status NOT IN ('ready', 'pending_signature') THEN
    RAISE EXCEPTION 'Contract is not ready for signing (current: %)', v_c.status USING ERRCODE = 'P0003';
  END IF;

  UPDATE contracts
  SET signed_by_name = btrim(p_name),
      signed_by_title = nullif(btrim(coalesce(p_title, '')), ''),
      signed_at = now(),
      signature_image = p_signature,
      signed_user_id = auth.uid(),
      status = 'active'
  WHERE id = p_contract_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.customer_sign_contract(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.customer_sign_contract(uuid, text, text, text) TO authenticated;

-- 4. History triggers -----------------------------------------------------------
-- performed_by references staff_profiles(id), but the triggers stored auth.uid()
-- (the login id), which differs from the staff profile id. That made the
-- history insert fail, so creating or updating a quotation, PO, contract or
-- rental operation failed too. They now store the staff profile id, or NULL
-- with the customer's name when a customer acts through the RPCs above.
CREATE OR REPLACE FUNCTION public.history_actor(OUT actor_id uuid, OUT actor_name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  SELECT sp.id, sp.full_name INTO actor_id, actor_name FROM staff_profiles sp WHERE sp.user_id = auth.uid();
  IF actor_id IS NULL THEN
    actor_name := coalesce(customer_display_name(), customer_email());
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.history_actor() FROM PUBLIC, anon;

CREATE OR REPLACE FUNCTION public.record_quotation_history()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE a record;
BEGIN
  SELECT * INTO a FROM history_actor();
  IF TG_OP = 'INSERT' THEN
    INSERT INTO quotation_history (quotation_id, action, new_status, performed_by, performed_by_name)
    VALUES (NEW.id, 'created', NEW.status, a.actor_id, a.actor_name);
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO quotation_history (quotation_id, action, previous_status, new_status, performed_by, performed_by_name)
    VALUES (NEW.id, 'status_changed', OLD.status, NEW.status, a.actor_id, a.actor_name);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_po_history()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE a record;
BEGIN
  SELECT * INTO a FROM history_actor();
  IF TG_OP = 'INSERT' THEN
    INSERT INTO po_history (po_id, action, new_status, performed_by, performed_by_name)
    VALUES (NEW.id, CASE WHEN NEW.submitted_by_customer THEN 'customer_uploaded' ELSE 'created' END, NEW.status, a.actor_id, a.actor_name);
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO po_history (po_id, action, previous_status, new_status, performed_by, performed_by_name)
    VALUES (NEW.id, 'status_changed', OLD.status, NEW.status, a.actor_id, a.actor_name);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_contract_history()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE a record;
BEGIN
  SELECT * INTO a FROM history_actor();
  IF TG_OP = 'INSERT' THEN
    INSERT INTO contract_history (contract_id, action, new_status, performed_by, performed_by_name)
    VALUES (NEW.id, 'created', NEW.status, a.actor_id, a.actor_name);
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO contract_history (contract_id, action, previous_status, new_status, performed_by, performed_by_name)
    VALUES (NEW.id, CASE WHEN NEW.signed_at IS NOT NULL AND OLD.signed_at IS NULL THEN 'customer_signed' ELSE 'status_changed' END,
            OLD.status, NEW.status, a.actor_id, a.actor_name);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_rental_op_history()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE a record;
BEGIN
  SELECT * INTO a FROM history_actor();
  IF TG_OP = 'INSERT' THEN
    INSERT INTO rental_operation_history (operation_id, action, new_status, performed_by, performed_by_name)
    VALUES (NEW.id, 'created', NEW.status, a.actor_id, a.actor_name);
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO rental_operation_history (operation_id, action, previous_status, new_status, performed_by, performed_by_name)
    VALUES (NEW.id, 'status_changed', OLD.status, NEW.status, a.actor_id, a.actor_name);
  END IF;
  RETURN NEW;
END;
$function$;
