/*
# Fix public request submissions (rental + project requests)

The reference triggers called is_staff() for every insert. After
EXECUTE on is_staff() was revoked from anon, every request sent by a
visitor who is not signed in failed with
"permission denied for function is_staff".

Anonymous inserts now always get a server-generated reference without
calling is_staff(); signed-in users keep the original behaviour (only
active staff may supply their own reference).
*/

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
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;
