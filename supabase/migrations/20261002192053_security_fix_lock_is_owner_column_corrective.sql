/*
# Security fix F4 (corrective): owner flag locked at column level without breaking employee management

1. Problem being corrected
- The earlier column-level REVOKE on `staff_profiles.is_owner` interacted with the existing
  table-level grants: the `authenticated` role lost UPDATE on the whole table (which would
  break the admin employee screens), while table-level INSERT still covered `is_owner`.

2. Changes
- Table-level INSERT and UPDATE are revoked from `anon` and `authenticated` on
  `staff_profiles` and re-granted column by column for every column EXCEPT `is_owner`,
  for the `authenticated` role only.
- `anon` receives no INSERT or UPDATE: every policy on this table is scoped to
  `authenticated`, so anonymous callers never had usable access.

3. Security
- `is_owner` grants the full owner bypass in `staff_can()`. A staff member holding the
  `employees:manage` permission previously satisfied the row policy and could set
  `is_owner = true` on their own profile, escalating to owner. The flag can now only be
  changed by privileged server-side paths, while all other employee fields remain editable.
*/

REVOKE INSERT, UPDATE ON staff_profiles FROM anon;
REVOKE INSERT, UPDATE ON staff_profiles FROM authenticated;

GRANT INSERT (id, user_id, role_id, full_name, email, mobile, status, created_at, last_activity)
  ON staff_profiles TO authenticated;
GRANT UPDATE (id, user_id, role_id, full_name, email, mobile, status, created_at, last_activity)
  ON staff_profiles TO authenticated;