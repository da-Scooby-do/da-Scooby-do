/*
# Security fix F14: request email addresses get a canonical form

1. Changes
- New trigger function `normalize_request_email()` lower-cases and trims the `email`
  column on insert and update.
- Attached to `rental_requests` and `project_requests` as a BEFORE INSERT OR UPDATE trigger.

2. Security
- Customer ownership of requests, quotations, contracts and deliveries is matched by exact
  email equality. Without a canonical form, the same address typed with different casing or
  stray spaces produced a different identifier, so ownership routing depended on how the
  visitor typed their address rather than on an enforced form.
- Row level security checks run after BEFORE triggers, so the authenticated-submission rule
  (`email = customer_email()`) now compares canonical values on both sides.
*/

CREATE OR REPLACE FUNCTION public.normalize_request_email()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := NULLIF(lower(btrim(NEW.email)), '');
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS normalize_rental_request_email ON rental_requests;
CREATE TRIGGER normalize_rental_request_email
BEFORE INSERT OR UPDATE ON rental_requests
FOR EACH ROW EXECUTE FUNCTION public.normalize_request_email();

DROP TRIGGER IF EXISTS normalize_project_request_email ON project_requests;
CREATE TRIGGER normalize_project_request_email
BEFORE INSERT OR UPDATE ON project_requests
FOR EACH ROW EXECUTE FUNCTION public.normalize_request_email();