/*
# Security fix F16: internal helper routines are no longer callable from the browser

1. Changes
- EXECUTE is revoked from the `anon` and `authenticated` roles on the internal reference
  generators, history recorders and timestamp triggers. These are only ever invoked by
  database triggers, which run as the table owner and are unaffected by these grants.

2. Security
- Every function in the public schema is executable by the client API roles by default.
  The reference generators consume sequences, and the history recorders write audit rows,
  so leaving them callable gave any visitor a way to burn reference numbers or write audit
  entries directly. Removing the grant leaves them reachable only through their triggers.

3. Notes
- Functions the application legitimately calls (`is_staff`, `staff_can`, `customer_email`
  and the `customer_*` RPCs) are untouched.
*/

DO $$
DECLARE
  fn text;
  sig text;
  internal_fns text[] := ARRAY[
    'generate_allocation_number','generate_contract_reference','generate_delivery_number',
    'generate_po_reference','generate_quotation_reference','generate_renewal_number',
    'generate_rental_reference','generate_return_number','generate_rental_request_reference',
    'generate_project_request_reference','record_allocation_history','record_contract_history',
    'record_po_history','record_project_status_change','record_quotation_history',
    'record_rental_op_history','record_rental_status_change','record_request_status_change',
    'update_contract_updated_at','update_po_updated_at','update_quotation_updated_at',
    'update_rental_op_updated_at','update_project_request_updated_at','update_updated_at',
    'normalize_request_email','bind_customer_email'
  ];
BEGIN
  FOREACH fn IN ARRAY internal_fns LOOP
    FOR sig IN
      SELECT format('public.%I(%s)', p.proname, pg_get_function_identity_arguments(p.oid))
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = fn
    LOOP
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', sig);
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', sig);
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', sig);
    END LOOP;
  END LOOP;
END $$;