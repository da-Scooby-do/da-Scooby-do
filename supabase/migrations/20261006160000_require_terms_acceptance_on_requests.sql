/*
# Customers must accept the terms & privacy policy when placing a request

- `terms_accepted` (boolean) and `terms_accepted_at` (set by the server at
  insert time, only when accepted) on rental_requests and project_requests.
- Public/customer insert policies now require `terms_accepted = true`, so a
  request cannot be created without consent even by calling the API
  directly. Staff-created requests are unaffected.
*/

ALTER TABLE rental_requests
  ADD COLUMN IF NOT EXISTS terms_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

ALTER TABLE project_requests
  ADD COLUMN IF NOT EXISTS terms_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

-- Server-side timestamp (clients cannot backdate it).
CREATE OR REPLACE FUNCTION public.generate_rental_request_reference()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.request_reference IS NULL OR NEW.request_reference = '' THEN
    NEW.request_reference := 'SAHAB-RR-' || lpad(nextval('rental_request_ref_seq')::text, 6, '0');
  ELSIF current_user = 'anon' THEN
    NEW.request_reference := 'SAHAB-RR-' || lpad(nextval('rental_request_ref_seq')::text, 6, '0');
  ELSIF NOT is_staff() THEN
    NEW.request_reference := 'SAHAB-RR-' || lpad(nextval('rental_request_ref_seq')::text, 6, '0');
  END IF;
  NEW.terms_accepted_at := CASE WHEN NEW.terms_accepted THEN now() END;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_project_request_reference()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.request_reference IS NULL OR NEW.request_reference = '' THEN
    NEW.request_reference := 'SAHAB-PR-' || LPAD(nextval('project_request_seq')::text, 6, '0');
  ELSIF current_user = 'anon' THEN
    NEW.request_reference := 'SAHAB-PR-' || LPAD(nextval('project_request_seq')::text, 6, '0');
  ELSIF NOT is_staff() THEN
    NEW.request_reference := 'SAHAB-PR-' || LPAD(nextval('project_request_seq')::text, 6, '0');
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.terms_accepted_at := CASE WHEN NEW.terms_accepted THEN now() END;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

ALTER POLICY anon_insert_rental_requests ON rental_requests
  WITH CHECK (status = 'new' AND terms_accepted AND coalesce(internal_notes, '') = '' AND assigned_to IS NULL);

ALTER POLICY authed_insert_rental_requests ON rental_requests
  WITH CHECK (
    status = 'new'
    AND terms_accepted
    AND (email IS NULL OR email = customer_email())
    AND coalesce(internal_notes, '') = ''
    AND assigned_to IS NULL
  );

ALTER POLICY anon_insert_project_requests ON project_requests
  WITH CHECK (status = 'new' AND terms_accepted AND coalesce(internal_notes, '') = '' AND assigned_to IS NULL);

ALTER POLICY authed_insert_project_requests ON project_requests
  WITH CHECK (
    status = 'new'
    AND terms_accepted
    AND (email IS NULL OR email = customer_email())
    AND coalesce(internal_notes, '') = ''
    AND assigned_to IS NULL
  );
