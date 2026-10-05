/*
# Security Fix Batch 3: Authenticated Request Email Matching

## Purpose
Tighten the INSERT policies on `rental_requests` and `project_requests` so that
authenticated users must submit requests using their own email address.
Anonymous users retain the ability to submit requests with any email.

## Changes

### rental_requests
- Drops the existing `public_insert_rental_requests` policy
- Creates two replacement INSERT policies:
  - `anon_insert_rental_requests`: allows anonymous submissions with status='new'
  - `authed_insert_rental_requests`: requires email = customer_email() AND status='new'

### project_requests
- Drops the existing `public_insert_project_requests` policy
- Creates two replacement INSERT policies:
  - `anon_insert_project_requests`: allows anonymous submissions with status='new'
  - `authed_insert_project_requests`: requires email = customer_email() AND status='new'

## Security
- Anonymous submissions are preserved — visitors can still submit requests without registering
- Authenticated users cannot submit a request using another person's email
- The email-based ownership model (request.email ↔ auth user email) is enforced at the database level
- No schema changes, no new tables, no column changes
- Staff INSERT policies on these tables remain unchanged
*/

-- ============================================================
-- rental_requests: tighten INSERT for authenticated users
-- ============================================================

DROP POLICY IF EXISTS "public_insert_rental_requests" ON rental_requests;

-- Anonymous visitors: can submit with any email, status must be 'new'
CREATE POLICY "anon_insert_rental_requests"
ON rental_requests FOR INSERT
TO anon
WITH CHECK (status = 'new'::text);

-- Authenticated customers: must use their own email, status must be 'new'
CREATE POLICY "authed_insert_rental_requests"
ON rental_requests FOR INSERT
TO authenticated
WITH CHECK (
  status = 'new'::text
  AND email IS NOT NULL
  AND email = customer_email()
);

-- ============================================================
-- project_requests: tighten INSERT for authenticated users
-- ============================================================

DROP POLICY IF EXISTS "public_insert_project_requests" ON project_requests;

-- Anonymous visitors: can submit with any email, status must be 'new'
CREATE POLICY "anon_insert_project_requests"
ON project_requests FOR INSERT
TO anon
WITH CHECK (status = 'new'::text);

-- Authenticated customers: must use their own email, status must be 'new'
CREATE POLICY "authed_insert_project_requests"
ON project_requests FOR INSERT
TO authenticated
WITH CHECK (
  status = 'new'::text
  AND email IS NOT NULL
  AND email = customer_email()
);
