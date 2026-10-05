/*
# Security Fix Batch 2: First Owner Bootstrap Function

## Purpose
Creates a SECURITY DEFINER function that allows a database administrator
(running as postgres or service_role) to safely bootstrap the first Owner
account. This function CANNOT be called by authenticated or anon users.

## Security
- Function is SECURITY DEFINER, runs as the table owner (postgres)
- Function is NOT granted to authenticated or anon — only postgres/service_role can call it
- Refuses to run if any staff_profiles row with is_owner=true already exists
- Verifies the target auth user exists in auth.users
- Prevents duplicate staff_profiles for the same user_id
- Sets is_owner=true, role_id='role-owner', status='active'
*/

-- Drop if exists from any prior attempt
DROP FUNCTION IF EXISTS public.bootstrap_first_owner(uuid);

CREATE OR REPLACE FUNCTION public.bootstrap_first_owner(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_exists boolean;
  v_existing_profile boolean;
  v_existing_owner boolean;
  v_user_email text;
  v_user_name text;
BEGIN
  -- 1. Refuse if an Owner already exists
  SELECT EXISTS (SELECT 1 FROM staff_profiles WHERE is_owner = true)
    INTO v_existing_owner;
  IF v_existing_owner THEN
    RAISE EXCEPTION 'An Owner already exists. Bootstrap is no longer available.'
      USING ERRCODE = 'P0003';
  END IF;

  -- 2. Verify the target Auth user exists
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id)
    INTO v_user_exists;
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'Auth user with UUID % does not exist.', p_user_id
      USING ERRCODE = 'P0002';
  END IF;

  -- 3. Check the user doesn't already have a staff_profile
  SELECT EXISTS (SELECT 1 FROM staff_profiles WHERE user_id = p_user_id)
    INTO v_existing_profile;
  IF v_existing_profile THEN
    RAISE EXCEPTION 'User % already has a staff_profile. Bootstrap is for new owners only.', p_user_id
      USING ERRCODE = 'P0003';
  END IF;

  -- 4. Get the user's email and name from auth metadata
  SELECT email, COALESCE(raw_user_meta_data->>'full_name', email)
    INTO v_user_email, v_user_name
    FROM auth.users
    WHERE id = p_user_id;

  -- 5. Insert the Owner profile
  INSERT INTO staff_profiles (user_id, role_id, full_name, email, status, is_owner)
  VALUES (p_user_id, 'role-owner', v_user_name, v_user_email, 'active', true);

  -- 6. Return confirmation
  RETURN format(
    'Owner created successfully: user_id=%s, email=%s, role=role-owner, is_owner=true, status=active',
    p_user_id, v_user_email
  );
END;
$function$;

-- Revoke all access from public, anon, and authenticated
REVOKE ALL ON FUNCTION public.bootstrap_first_owner(uuid) FROM PUBLIC, anon, authenticated;

-- Only postgres and service_role can call it (they have access by default as superuser/privileged roles)
