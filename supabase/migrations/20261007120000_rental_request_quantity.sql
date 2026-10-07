/*
# Customers can request several units of the same machine

- rental_requests.quantity: number of machines requested (1-100, default 1).
*/

ALTER TABLE rental_requests
  ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rental_requests_quantity_range') THEN
    ALTER TABLE rental_requests
      ADD CONSTRAINT rental_requests_quantity_range CHECK (quantity BETWEEN 1 AND 100);
  END IF;
END $$;
