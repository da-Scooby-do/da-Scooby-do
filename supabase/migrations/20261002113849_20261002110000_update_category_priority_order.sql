/*
# Update category display_order for business priority

## Overview
Reorders equipment categories to match SAHAB's business priorities:
1. Excavators (display_order = 1)
2. Wheel Loaders / Shovels (display_order = 2)
3. Bulldozers (display_order = 3)
4. Cranes (display_order = 4) — maps to cranes-all
5. Forklifts (display_order = 5)
6. Manlifts / Aerial Work Platforms (display_order = 6)
7. Trucks / Transport (display_order = 7)
8. Other equipment (display_order = 8+)

## Notes
- Uses UPDATE ... WHERE to target specific categories by ID
- No categories are deleted or renamed
- Staff can still change display_order via admin
*/

UPDATE categories SET display_order = 1 WHERE id = 'excavators';
UPDATE categories SET display_order = 2 WHERE id = 'shovels';
UPDATE categories SET display_order = 3 WHERE id = 'bulldozers';
UPDATE categories SET display_order = 4 WHERE id = 'cranes-all';
UPDATE categories SET display_order = 5 WHERE id = 'forklifts';
UPDATE categories SET display_order = 6 WHERE id = 'manlift';
UPDATE categories SET display_order = 7 WHERE id = 'dump-trucks';
UPDATE categories SET display_order = 8 WHERE id = 'flatbed-winch';
UPDATE categories SET display_order = 9 WHERE id = 'lowbed';
UPDATE categories SET display_order = 10 WHERE id = 'boom-loaders';
UPDATE categories SET display_order = 11 WHERE id = 'bobcat';
UPDATE categories SET display_order = 12 WHERE id = 'telehandlers';
UPDATE categories SET display_order = 13 WHERE id = 'scissor-lift';
UPDATE categories SET display_order = 14 WHERE id = 'boom-truck';
UPDATE categories SET display_order = 15 WHERE id = 'cranes';
UPDATE categories SET display_order = 16 WHERE id = 'crawler-cranes';
UPDATE categories SET display_order = 17 WHERE id = 'motor-graders';
UPDATE categories SET display_order = 18 WHERE id = 'rollers';
UPDATE categories SET display_order = 19 WHERE id = 'concrete-pumps';
UPDATE categories SET display_order = 20 WHERE id = 'concrete-mixers';
UPDATE categories SET display_order = 21 WHERE id = 'generators';
UPDATE categories SET display_order = 22 WHERE id = 'air-compressors';
UPDATE categories SET display_order = 23 WHERE id = 'water-tankers';
