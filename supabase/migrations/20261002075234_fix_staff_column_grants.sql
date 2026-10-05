/*
# Fix: Correct column-level grants on staff tables

The previous migration revoked UPDATE on all columns of staff_roles,
blocking managers from updating permissions and is_active — which are
legitimate management operations gated by the owner_manage_roles RLS policy.

This migration restores UPDATE on all columns of staff_roles for authenticated
users (the RLS policy already restricts who can update), while keeping the
restriction on staff_profiles.is_owner (the escalation vector).

staff_profiles: UPDATE allowed on full_name, email, mobile, role_id, status
  (is_owner remains revoked — prevents self-escalation to owner)
staff_roles: UPDATE restored on all columns (RLS policy gates access)
*/

-- staff_profiles: grant UPDATE on safe columns (not is_owner)
REVOKE UPDATE ON staff_profiles FROM authenticated;
GRANT UPDATE (full_name, email, mobile, role_id, status) ON staff_profiles TO authenticated;

-- staff_roles: restore full UPDATE (RLS policy restricts to employees.manage)
REVOKE UPDATE ON staff_roles FROM authenticated;
GRANT UPDATE ON staff_roles TO authenticated;
