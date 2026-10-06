/*
# Let the admin add catalog items, and give brands a logo

The admin forms insert new categories, brands and equipment models without
an id, but the text primary keys had no default — so every "add" failed.
Existing ids are unchanged; new rows get a random id.

brands.logo stores an uploaded logo URL (empty = show the first letter).
*/

ALTER TABLE categories ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE brands ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE equipment_models ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE brands ADD COLUMN IF NOT EXISTS logo text NOT NULL DEFAULT '';
