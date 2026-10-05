/*
# Customer Portal DB Integration

1. Schema Changes
- Add `customer_email` column to `contracts` (text, nullable) for customer-scoped RLS

2. Helper Function
- `customer_email()` — extracts the authenticated user's email from auth.jwt()
  Used in RLS policies to match customer records by email

3. RLS Policy Changes
- quotations: add customer_read_quotations — customers can SELECT their own quotations
  (where customer_email = customer_email() AND status NOT IN ('draft','ready_to_send'))
- quotation_items: add customer_read_quotation_items — customers can SELECT items
  for quotations they can read
- contracts: add customer_read_contracts — customers can SELECT their own contracts
  (where customer_email = customer_email() AND status NOT IN ('draft'))
- rental_requests: add customer_read_rental_requests — customers can SELECT their own
  requests (where email = customer_email())
- project_requests: add customer_read_project_requests — customers can SELECT their own
  requests (where email = customer_email())
- request_status_history: add customer_read_request_history — customers can SELECT
  history for their own requests

4. Storage
- contract-documents: add customer_read_contract_docs — customers can SELECT
  documents for contracts they own (verified via contract record ownership)

All customer policies use `auth.email() ->> 'email'` matching against the
customer_email/email column. Staff policies remain unchanged (is_staff() OR
staff_can()). Customer policies are ADDITIVE (PERMISSIVE) — they don't
restrict staff access.
*/

-- ─── Add customer_email to contracts ──────────────────────
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS customer_email text;

-- ─── Helper function: get authenticated user's email ──────
CREATE OR REPLACE FUNCTION customer_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.jwt() ->> 'email';
$$;

-- ─── quotations: customer can read their own (non-draft) ─
DROP POLICY IF EXISTS "customer_read_quotations" ON quotations;
CREATE POLICY "customer_read_quotations"
  ON quotations FOR SELECT
  TO authenticated
  USING (
    NOT is_staff()
    AND customer_email IS NOT NULL
    AND customer_email = customer_email()
    AND status NOT IN ('draft', 'ready_to_send')
  );

-- ─── quotation_items: customer can read items for their quotations ──
DROP POLICY IF EXISTS "customer_read_quotation_items" ON quotation_items;
CREATE POLICY "customer_read_quotation_items"
  ON quotation_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.id = quotation_items.quotation_id
        AND quotations.customer_email = customer_email()
        AND quotations.status NOT IN ('draft', 'ready_to_send')
    )
  );

-- ─── contracts: customer can read their own (non-draft) ──
DROP POLICY IF EXISTS "customer_read_contracts" ON contracts;
CREATE POLICY "customer_read_contracts"
  ON contracts FOR SELECT
  TO authenticated
  USING (
    NOT is_staff()
    AND customer_email IS NOT NULL
    AND customer_email = customer_email()
    AND status NOT IN ('draft')
  );

-- ─── rental_requests: customer can read their own ────────
DROP POLICY IF EXISTS "customer_read_rental_requests" ON rental_requests;
CREATE POLICY "customer_read_rental_requests"
  ON rental_requests FOR SELECT
  TO authenticated
  USING (
    NOT is_staff()
    AND email IS NOT NULL
    AND email = customer_email()
  );

-- ─── project_requests: customer can read their own ───────
DROP POLICY IF EXISTS "customer_read_project_requests" ON project_requests;
CREATE POLICY "customer_read_project_requests"
  ON project_requests FOR SELECT
  TO authenticated
  USING (
    NOT is_staff()
    AND email IS NOT NULL
    AND email = customer_email()
  );

-- ─── request_status_history: customer can read their own ─
DROP POLICY IF EXISTS "customer_read_request_history" ON request_status_history;
CREATE POLICY "customer_read_request_history"
  ON request_status_history FOR SELECT
  TO authenticated
  USING (
    NOT is_staff()
    AND EXISTS (
      SELECT 1 FROM rental_requests
      WHERE rental_requests.id = request_status_history.request_id
        AND request_status_history.request_type = 'rental'
        AND rental_requests.email = customer_email()
    )
    OR EXISTS (
      SELECT 1 FROM project_requests
      WHERE project_requests.id = request_status_history.request_id
        AND request_status_history.request_type = 'project'
        AND project_requests.email = customer_email()
    )
  );

-- ─── Storage: customer can read their contract documents ─
-- Customers can read objects in contract-documents bucket only if
-- the document path matches a contract they own.
-- The document path format is `{contract_id}.{ext}`.
-- We extract the contract_id from the path prefix and verify ownership.
DROP POLICY IF EXISTS "customer_read_contract_docs" ON storage.objects;
CREATE POLICY "customer_read_contract_docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'contract-documents'
    AND NOT is_staff()
    AND EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.document_path = storage.objects.name
        AND contracts.customer_email = customer_email()
        AND contracts.status NOT IN ('draft')
    )
  );
