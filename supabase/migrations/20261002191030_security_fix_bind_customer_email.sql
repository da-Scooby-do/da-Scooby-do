/*
# Security fix F2: pin customer ownership to the signup email

1. New Tables
- `customer_email_bindings`
  - `user_id` (uuid, primary key) — the auth user
  - `email` (text, unique) — the lower-cased email captured when the account was created
  - `created_at` (timestamptz)

2. Changes
- A trigger on `auth.users` records the signup email once, at account creation.
- Existing users are backfilled from their current email.
- `customer_email()` now returns the recorded signup email (lower-cased), falling back to
  the session email claim only when no binding exists.

3. Security
- Previously a signed-in customer could call the auth API to change their account email to
  another person's address and immediately inherit every request, quotation, contract,
  delivery and attachment belonging to that address, because all customer policies compare
  `email = customer_email()` and `customer_email()` read the mutable session claim.
  Ownership is now anchored to the address captured at signup, so a later email change no
  longer transfers access to anyone else's records.
- The binding table has row level security enabled and no policies, and all privileges are
  revoked from `anon` and `authenticated`, so no client can read or alter it.

4. Important notes
- The trigger is exception-safe: if the binding cannot be written, account creation still
  succeeds and `customer_email()` falls back to the session claim.
*/

CREATE TABLE IF NOT EXISTS customer_email_bindings (
  user_id uuid PRIMARY KEY,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS customer_email_bindings_email_key
  ON customer_email_bindings (email);

ALTER TABLE customer_email_bindings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON customer_email_bindings FROM anon;
REVOKE ALL ON customer_email_bindings FROM authenticated;

INSERT INTO customer_email_bindings (user_id, email)
SELECT u.id, lower(btrim(u.email))
FROM auth.users u
WHERE u.email IS NOT NULL AND btrim(u.email) <> ''
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.bind_customer_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email IS NOT NULL AND btrim(NEW.email) <> '' THEN
    BEGIN
      INSERT INTO customer_email_bindings (user_id, email)
      VALUES (NEW.id, lower(btrim(NEW.email)))
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS bind_customer_email_on_signup ON auth.users;
CREATE TRIGGER bind_customer_email_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.bind_customer_email();

CREATE OR REPLACE FUNCTION public.customer_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT b.email FROM customer_email_bindings b WHERE b.user_id = auth.uid()),
    NULLIF(lower(btrim(auth.jwt() ->> 'email')), '')
  );
$function$;