/*
# Customers need an account (with a company profile) to place requests

Website flow: choose equipment -> fill the request -> submit -> log in or
create an account -> create the company profile -> request is sent -> the
customer follows it in their dashboard.

1. customer_profiles: one company profile per customer account (was only
   kept in browser memory before). Customers read/insert/update their own
   row; active staff can read all.
2. Visitors (anon) can no longer insert rental/project requests.
3. Signed-in customers may insert only with their own account email and
   only once their company profile exists, so every request shows up in
   their dashboard (customer read policies match on email).
*/

CREATE TABLE IF NOT EXISTS customer_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  commercial_registration text NOT NULL DEFAULT '',
  national_unified_number text NOT NULL DEFAULT '',
  vat_number text NOT NULL DEFAULT '',
  company_phone text NOT NULL DEFAULT '',
  official_email text NOT NULL DEFAULT '',
  region text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  contact_person text NOT NULL DEFAULT '',
  job_title text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customer_profiles_company_name_not_blank CHECK (btrim(company_name) <> '')
);

ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY customer_read_own_profile ON customer_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_staff());

CREATE POLICY customer_insert_own_profile ON customer_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY customer_update_own_profile ON customer_profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.touch_customer_profile()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_customer_profiles_updated
  BEFORE UPDATE ON customer_profiles
  FOR EACH ROW EXECUTE FUNCTION touch_customer_profile();

-- Visitors can no longer create requests.
ALTER POLICY anon_insert_rental_requests ON rental_requests WITH CHECK (false);
ALTER POLICY anon_insert_project_requests ON project_requests WITH CHECK (false);

-- Customers: own email + company profile required.
ALTER POLICY authed_insert_rental_requests ON rental_requests
  WITH CHECK (
    status = 'new'
    AND terms_accepted
    AND email IS NOT NULL
    AND email = customer_email()
    AND EXISTS (SELECT 1 FROM customer_profiles cp WHERE cp.user_id = auth.uid())
    AND coalesce(internal_notes, '') = ''
    AND assigned_to IS NULL
  );

ALTER POLICY authed_insert_project_requests ON project_requests
  WITH CHECK (
    status = 'new'
    AND terms_accepted
    AND email IS NOT NULL
    AND email = customer_email()
    AND EXISTS (SELECT 1 FROM customer_profiles cp WHERE cp.user_id = auth.uid())
    AND coalesce(internal_notes, '') = ''
    AND assigned_to IS NULL
  );
