/*
# Add Cranes category and crane-specific brands

## Overview
Adds a new "Cranes / الكرينات" category to the SAHAB equipment catalog, encompassing all crane types (mobile, all terrain, rough terrain, crawler, truck-mounted, etc.). Also adds 11 new crane manufacturer brands that don't already exist in the database. 6 existing brands (Grove, Liebherr, Sany, Tadano, Terex, XCMG) are reused.

## New Category
- `cranes-all` — "Cranes" / "الكرينات"
  - Broad crane category covering all crane types
  - spec_fields: craneType, liftingCapacity, boomLength, maxWorkingHeight, operatingWeight
  - display_order: 23 (after existing 22 categories)

## New Brands (11)
- Tadano — already exists, reused
- Terex — already exists, reused
- Demag — new
- Liebherr — already exists, reused
- Grove — already exists, reused
- XCMG — already exists, reused
- Zoomlion — new
- SANY — already exists (as "Sany"), reused
- Kato — new
- Kobelco — new
- Manitowoc — new
- Sumitomo — new
- Link-Belt — new
- Fassi — new
- Palfinger — new
- UNIC — new
- Sennebogen — new

## Security
- No RLS changes — existing policies on categories and brands apply automatically to new rows.
- No storage changes.
- No function changes.
*/

-- ─── NEW CATEGORY: Cranes ─────────────────────────────────────
INSERT INTO categories (id, name_ar, name_en, slug, image, icon, description_ar, description_en, spec_fields, display_order)
VALUES (
  'cranes-all',
  'الكرينات',
  'Cranes',
  'cranes-all',
  '',
  'Construction',
  'كرينات بمختلف الأنواع والأحجام لعمليات الرفع الثقيل في المشاريع',
  'Cranes of all types and sizes for heavy lifting operations in projects',
  '[
    {"key":"craneType","labelAr":"نوع الكرين","labelEn":"Crane Type","unitAr":"","unitEn":""},
    {"key":"liftingCapacity","labelAr":"قدرة الرفع","labelEn":"Lifting Capacity","unitAr":"طن","unitEn":"ton"},
    {"key":"boomLength","labelAr":"طول الذراع","labelEn":"Boom Length","unitAr":"م","unitEn":"m"},
    {"key":"maxWorkingHeight","labelAr":"أقصى ارتفاع عمل","labelEn":"Max Working Height","unitAr":"م","unitEn":"m"},
    {"key":"operatingWeight","labelAr":"وزن التشغيل","labelEn":"Operating Weight","unitAr":"طن","unitEn":"ton"}
  ]'::jsonb,
  23
) ON CONFLICT (id) DO NOTHING;

-- ─── NEW BRANDS ───────────────────────────────────────────────
-- Only insert brands that don't already exist (id-based dedup)
INSERT INTO brands (id, name_ar, name_en, display_order) VALUES
  ('demag', 'ديماج', 'Demag', 0),
  ('zoomlion', 'زوومليون', 'Zoomlion', 0),
  ('kato', 'كاتو', 'Kato', 0),
  ('kobelco', 'كوبلكو', 'Kobelco', 0),
  ('manitowoc', 'مانيتوووك', 'Manitowoc', 0),
  ('sumitomo', 'سوميتومو', 'Sumitomo', 0),
  ('link-belt', 'لينك بيلت', 'Link-Belt', 0),
  ('fassi', 'فاسي', 'Fassi', 0),
  ('palfinger', 'بالفينجر', 'Palfinger', 0),
  ('unic', 'يونيك', 'UNIC', 0),
  ('sennebogen', 'سنيبوجن', 'Sennebogen', 0)
ON CONFLICT (id) DO NOTHING;
