/*
# Security fix F3: staff access requires an active profile

1. Changes
- `is_staff()` now returns true only when the caller's staff profile has status 'active'.
- `staff_can(module, action)` now ignores profiles whose status is not 'active'.

2. Security
- Deactivated or pending employees no longer retain read/write access to customer data
  through the data API, matching what the employees screen implies.
*/

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE user_id = auth.uid() AND status = 'active'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.staff_can(check_module text, check_action text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
profile_record RECORD;
role_perms jsonb;
perm jsonb;
BEGIN
SELECT * INTO profile_record FROM staff_profiles WHERE user_id = auth.uid() AND status = 'active';
IF NOT FOUND THEN RETURN false; END IF;

IF profile_record.is_owner THEN RETURN true; END IF;

SELECT permissions INTO role_perms FROM staff_roles WHERE id = profile_record.role_id AND is_active = true;
IF role_perms IS NULL THEN RETURN false; END IF;

FOR perm IN SELECT * FROM jsonb_array_elements(role_perms) LOOP
IF perm->>'module' = check_module THEN
IF (perm->'actions'->>check_action)::boolean THEN
RETURN true;
END IF;
END IF;
END LOOP;

RETURN false;
END;
$function$;