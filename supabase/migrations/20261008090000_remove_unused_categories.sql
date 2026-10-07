/*
# Remove equipment sections SAHAB does not offer (hidden)

Hides 9 categories and their models from the public site:
bulldozers, telehandlers, crawler-cranes, motor-graders, rollers,
concrete-pumps, concrete-mixers, air-compressors, water-tankers.
The remaining categories are renumbered 1..n in their current order.
To delete them permanently run supabase/manual/delete_hidden_categories.sql
in the Supabase SQL editor.
*/

UPDATE categories SET hidden = true
WHERE id IN ('bulldozers', 'telehandlers', 'crawler-cranes', 'motor-graders', 'rollers',
             'concrete-pumps', 'concrete-mixers', 'air-compressors', 'water-tankers');

UPDATE equipment_models SET hidden = true
WHERE category_id IN (SELECT id FROM categories WHERE hidden) AND NOT hidden;

UPDATE categories c
SET display_order = r.rn
FROM (SELECT id, row_number() OVER (ORDER BY hidden, display_order, id) AS rn FROM categories) r
WHERE r.id = c.id;
