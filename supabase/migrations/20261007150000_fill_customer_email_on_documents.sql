/*
# Link contracts and purchase orders to the customer's account

Customers see contracts / POs by customer_email, but the admin screens never
set it, so a contract created by staff never reached the customer (and could
not be signed). Fill it on insert/update from the linked quotation, falling
back to the original request's email.
*/

CREATE OR REPLACE FUNCTION public.fill_document_customer_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.customer_email IS NULL OR btrim(NEW.customer_email) = '' THEN
    IF NEW.quotation_id IS NOT NULL THEN
      SELECT q.customer_email INTO NEW.customer_email FROM quotations q WHERE q.id = NEW.quotation_id;
    END IF;
    IF NEW.customer_email IS NULL AND NEW.request_type = 'rental' THEN
      SELECT r.email INTO NEW.customer_email FROM rental_requests r WHERE r.id = NEW.request_id;
    ELSIF NEW.customer_email IS NULL AND NEW.request_type = 'project' THEN
      SELECT p.email INTO NEW.customer_email FROM project_requests p WHERE p.id = NEW.request_id;
    END IF;
  END IF;
  NEW.customer_email := nullif(lower(btrim(NEW.customer_email)), '');
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_contracts_customer_email
  BEFORE INSERT OR UPDATE OF quotation_id, request_id, customer_email ON contracts
  FOR EACH ROW EXECUTE FUNCTION fill_document_customer_email();

CREATE TRIGGER trg_po_customer_email
  BEFORE INSERT OR UPDATE OF quotation_id, request_id, customer_email ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION fill_document_customer_email();

-- Existing rows
UPDATE contracts SET customer_email = customer_email WHERE customer_email IS NULL;
UPDATE purchase_orders SET customer_email = customer_email WHERE customer_email IS NULL;
