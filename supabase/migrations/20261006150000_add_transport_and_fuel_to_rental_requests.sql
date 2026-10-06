/*
# Transport and diesel responsibility on rental requests

The customer chooses who handles moving the equipment to/from the site and
who provides the diesel: SAHAB ('sahab') or the customer ('customer').
Nullable so requests made before this change stay valid.
*/

ALTER TABLE rental_requests
  ADD COLUMN IF NOT EXISTS transport_by text CHECK (transport_by IN ('sahab', 'customer')),
  ADD COLUMN IF NOT EXISTS fuel_by text CHECK (fuel_by IN ('sahab', 'customer'));
