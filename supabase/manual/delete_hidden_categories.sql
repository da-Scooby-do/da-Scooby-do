-- Permanently delete the 9 hidden equipment sections, their models and sizes.
-- Run once in Supabase → SQL Editor. Cannot be undone.
-- (No rental requests or equipment units referenced them on 2026-10-08.)
BEGIN;

DELETE FROM equipment_models
WHERE category_id IN ('bulldozers', 'telehandlers', 'crawler-cranes', 'motor-graders', 'rollers',
                      'concrete-pumps', 'concrete-mixers', 'air-compressors', 'water-tankers');

DELETE FROM categories
WHERE id IN ('bulldozers', 'telehandlers', 'crawler-cranes', 'motor-graders', 'rollers',
             'concrete-pumps', 'concrete-mixers', 'air-compressors', 'water-tankers');

COMMIT;
