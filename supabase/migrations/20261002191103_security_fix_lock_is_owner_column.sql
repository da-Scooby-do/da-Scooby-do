/*
# Security fix F4: the owner flag is no longer writable from the browser

1. Changes
- `staff_profiles.is_owner` gets an explicit `false` default.
- `INSERT` and `UPDATE` privileges on `staff_profiles.is_owner` are revoked from
  `anon` and `authenticated`. All other columns keep their existing privileges.

2. Security
- Previously any staff member holding the `employees:manage` permission could set
  `is_owner = true` on their own profile row, because the row level policy had no
  column restriction, and the owner flag bypasses every permission check.
- The flag can now only be set by the privileged bootstrap function, which runs with
  owner rights.
*/

ALTER TABLE staff_profiles ALTER COLUMN is_owner SET DEFAULT false;

REVOKE INSERT (is_owner), UPDATE (is_owner) ON staff_profiles FROM anon;
REVOKE INSERT (is_owner), UPDATE (is_owner) ON staff_profiles FROM authenticated;