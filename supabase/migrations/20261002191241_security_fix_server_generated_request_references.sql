/*
# Security fix F7: request reference numbers are always generated server-side

1. Changes
- `generate_rental_request_reference()` and `generate_project_request_reference()` now
  overwrite any reference supplied by the caller unless the caller is active staff.
- Both functions get a fixed `search_path`.

2. Security
- Previously the trigger only generated a reference when the submitted value was null, so
  an attacker could submit requests carrying hand-picked reference numbers. Because the
  reference column is unique, squatting future numbers made later genuine submissions fail,
  blocking the request pipeline. Staff tooling that supplies an explicit reference keeps
  working.
*/

CREATE OR REPLACE FUNCTION public.generate_rental_request_reference()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
seq_num bigint;
BEGIN
IF NEW.request_reference IS NULL OR NEW.request_reference = '' OR NOT is_staff() THEN
  seq_num := nextval('rental_request_ref_seq');
  NEW.request_reference := 'SAHAB-RR-' || lpad(seq_num::text, 6, '0');
END IF;
RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_project_request_reference()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
IF NEW.request_reference IS NULL OR NEW.request_reference = '' OR NOT is_staff() THEN
  NEW.request_reference := 'SAHAB-PR-' || LPAD(nextval('project_request_seq')::text, 6, '0');
END IF;
NEW.updated_at := now();
RETURN NEW;
END;
$function$;