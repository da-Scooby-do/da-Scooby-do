/*
# Security fix F5: public request submissions cannot write internal notes

1. Changes
- The four customer-facing INSERT policies on `rental_requests` and `project_requests`
  now additionally require `internal_notes IS NULL`.

2. Security
- Previously anyone submitting a public rental or project request could include an
  `internal_notes` value, planting fabricated staff-only annotations that employees
  read as internal commentary. Staff keep full control of the field through their own
  insert and update policies.
*/

DROP POLICY IF EXISTS "anon_insert_rental_requests" ON rental_requests;
CREATE POLICY "anon_insert_rental_requests" ON rental_requests FOR INSERT
TO anon WITH CHECK (status = 'new'::text AND internal_notes IS NULL);

DROP POLICY IF EXISTS "authed_insert_rental_requests" ON rental_requests;
CREATE POLICY "authed_insert_rental_requests" ON rental_requests FOR INSERT
TO authenticated WITH CHECK (
  status = 'new'::text
  AND email IS NOT NULL
  AND email = customer_email()
  AND internal_notes IS NULL
);

DROP POLICY IF EXISTS "anon_insert_project_requests" ON project_requests;
CREATE POLICY "anon_insert_project_requests" ON project_requests FOR INSERT
TO anon WITH CHECK (status = 'new'::text AND internal_notes IS NULL);

DROP POLICY IF EXISTS "authed_insert_project_requests" ON project_requests;
CREATE POLICY "authed_insert_project_requests" ON project_requests FOR INSERT
TO authenticated WITH CHECK (
  status = 'new'::text
  AND email IS NOT NULL
  AND email = customer_email()
  AND internal_notes IS NULL
);