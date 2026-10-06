/*
# Make the public request forms work again

Every rental/project/service request failed for every user:

1. The INSERT policies required `internal_notes IS NULL`, but the column is
   NOT NULL DEFAULT '' — so the check could never pass. Now it requires the
   notes to be empty instead.
2. Signed-in users had to supply an email equal to their account email.
   A request without an email is now also accepted (it simply won't show
   in a customer portal); a *different* email is still rejected.
3. Staff may create rental requests (matching the existing project policy).
4. Visitors cannot read requests back (no SELECT for anon, by design), so
   the site could not show the new reference number. `request_reference_for`
   returns only the reference of a request created in the last 15 minutes,
   looked up by its (unguessable) uuid.
*/

-- rental_requests -----------------------------------------------------------
ALTER POLICY anon_insert_rental_requests ON rental_requests
  WITH CHECK (status = 'new' AND coalesce(internal_notes, '') = '' AND assigned_to IS NULL);

ALTER POLICY authed_insert_rental_requests ON rental_requests
  WITH CHECK (
    status = 'new'
    AND (email IS NULL OR email = customer_email())
    AND coalesce(internal_notes, '') = ''
    AND assigned_to IS NULL
  );

CREATE POLICY staff_insert_rental_requests ON rental_requests
  FOR INSERT TO authenticated
  WITH CHECK (staff_can('rental_requests', 'create') OR staff_can('rental_requests', 'manage'));

-- project_requests (also used by service requests) --------------------------
ALTER POLICY anon_insert_project_requests ON project_requests
  WITH CHECK (status = 'new' AND coalesce(internal_notes, '') = '' AND assigned_to IS NULL);

ALTER POLICY authed_insert_project_requests ON project_requests
  WITH CHECK (
    status = 'new'
    AND (email IS NULL OR email = customer_email())
    AND coalesce(internal_notes, '') = ''
    AND assigned_to IS NULL
  );

-- reference lookup for the confirmation screen -------------------------------
CREATE OR REPLACE FUNCTION public.request_reference_for(p_kind text, p_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE p_kind
    WHEN 'rental' THEN (SELECT request_reference FROM rental_requests
                        WHERE id = p_id AND created_at > now() - interval '15 minutes')
    WHEN 'project' THEN (SELECT request_reference FROM project_requests
                         WHERE id = p_id AND created_at > now() - interval '15 minutes')
  END;
$function$;

REVOKE ALL ON FUNCTION public.request_reference_for(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_reference_for(text, uuid) TO anon, authenticated;
