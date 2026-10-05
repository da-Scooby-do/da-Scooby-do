/*
# Security fix F6: public request submissions cannot set the assigned employee

1. Changes
- The four customer-facing INSERT policies on `rental_requests` and `project_requests`
  now additionally require `assigned_to IS NULL`, keeping the `internal_notes IS NULL`
  restriction added previously.

2. Security
- Previously anyone submitting a public request could set `assigned_to`, routing or
  hiding the request inside the staff queue without any staff action. Assignment is now
  exclusively a staff operation performed through the staff update policies.
*/

DROP POLICY IF EXISTS "anon_insert_rental_requests" ON rental_requests;
CREATE POLICY "anon_insert_rental_requests" ON rental_requests FOR INSERT
TO anon WITH CHECK (
  status = 'new'::text
  AND internal_notes IS NULL
  AND assigned_to IS NULL
);

DROP POLICY IF EXISTS "authed_insert_rental_requests" ON rental_requests;
CREATE POLICY "authed_insert_rental_requests" ON rental_requests FOR INSERT
TO authenticated WITH CHECK (
  status = 'new'::text
  AND email IS NOT NULL
  AND email = customer_email()
  AND internal_notes IS NULL
  AND assigned_to IS NULL
);

DROP POLICY IF EXISTS "anon_insert_project_requests" ON project_requests;
CREATE POLICY "anon_insert_project_requests" ON project_requests FOR INSERT
TO anon WITH CHECK (
  status = 'new'::text
  AND internal_notes IS NULL
  AND assigned_to IS NULL
);

DROP POLICY IF EXISTS "authed_insert_project_requests" ON project_requests;
CREATE POLICY "authed_insert_project_requests" ON project_requests FOR INSERT
TO authenticated WITH CHECK (
  status = 'new'::text
  AND email IS NOT NULL
  AND email = customer_email()
  AND internal_notes IS NULL
  AND assigned_to IS NULL
);