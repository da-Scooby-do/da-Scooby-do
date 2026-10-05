/*
# Security fix F15: pin the lookup path of the remaining trigger functions

1. Changes
- `update_project_request_updated_at()` and `update_updated_at()` now run with a fixed
  `search_path` of `public`, matching every other function in the schema.

2. Security
- A function without a pinned search path resolves unqualified names using the caller's
  search path, so a caller able to create an object in an earlier schema could shadow a
  name the function relies on. Pinning the path removes that hijacking surface.
- No behaviour changes for existing triggers.
*/

ALTER FUNCTION public.update_project_request_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.update_updated_at() SET search_path TO 'public';