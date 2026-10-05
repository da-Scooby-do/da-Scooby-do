/*
# Seed crane equipment models — Part 1 (Tadano, Terex, Demag, Liebherr, Grove, XCMG)

## Overview
Adds representative crane models to the `cranes-all` category. Models use basic identification fields (name, category, brand). Technical specifications are left empty — staff will fill them in via the admin catalog management interface.

## Models Added (Part 1)
### Tadano (8 models)
GR-300EX, GR-500EX, GR-600EX, GR-700EX, GR-800EX, GR-1000XL, ATF 70G-4, ATF 130G-5

### Terex (5 models)
RT 60, RT 100, AC 100, AC 200, AC 250

### Demag (5 models)
AC 100, AC 200, AC 250, AC 300, AC 500

### Liebherr (8 models)
LTM 1050, LTM 1100, LTM 1130, LTM 1160, LTM 1200, LTM 1300, LRT 1100, LR 1600

### Grove (7 models)
GMK 3055, GMK 4100, GMK 5130, GMK 6300, RT 530, RT 760, RT 880

### XCMG (4 models)
XCR Series, XCT Series, XCA Series, XGC Series

## Notes
- All models are in category `cranes-all`
- rental_info is empty {} — staff fill in pricing
- image and gallery are empty — staff upload via admin
- No fabricated specifications
*/

INSERT INTO equipment_models (id, category_id, brand_id, name_ar, name_en, description_ar, description_en, image, gallery, features_ar, features_en, rental_terms_ar, rental_terms_en, year, short_description_ar, short_description_en, rental_info, published, display_order) VALUES
-- Tadano
('cranes-all-tadano-gr300ex', 'cranes-all', 'tadano', 'تادانو GR-300EX', 'Tadano GR-300EX', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 1),
('cranes-all-tadano-gr500ex', 'cranes-all', 'tadano', 'تادانو GR-500EX', 'Tadano GR-500EX', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 2),
('cranes-all-tadano-gr600ex', 'cranes-all', 'tadano', 'تادانو GR-600EX', 'Tadano GR-600EX', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 3),
('cranes-all-tadano-gr700ex', 'cranes-all', 'tadano', 'تادانو GR-700EX', 'Tadano GR-700EX', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 4),
('cranes-all-tadano-gr800ex', 'cranes-all', 'tadano', 'تادانو GR-800EX', 'Tadano GR-800EX', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 5),
('cranes-all-tadano-gr1000xl', 'cranes-all', 'tadano', 'تادانو GR-1000XL', 'Tadano GR-1000XL', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 6),
('cranes-all-tadano-atf70g4', 'cranes-all', 'tadano', 'تادانو ATF 70G-4', 'Tadano ATF 70G-4', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 7),
('cranes-all-tadano-atf130g5', 'cranes-all', 'tadano', 'تادانو ATF 130G-5', 'Tadano ATF 130G-5', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 8),
-- Terex
('cranes-all-terex-rt60', 'cranes-all', 'terex', 'تيركس RT 60', 'Terex RT 60', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 9),
('cranes-all-terex-rt100', 'cranes-all', 'terex', 'تيركس RT 100', 'Terex RT 100', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 10),
('cranes-all-terex-ac100', 'cranes-all', 'terex', 'تيركس AC 100', 'Terex AC 100', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 11),
('cranes-all-terex-ac200', 'cranes-all', 'terex', 'تيركس AC 200', 'Terex AC 200', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 12),
('cranes-all-terex-ac250', 'cranes-all', 'terex', 'تيركس AC 250', 'Terex AC 250', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 13),
-- Demag
('cranes-all-demag-ac100', 'cranes-all', 'demag', 'ديماج AC 100', 'Demag AC 100', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 14),
('cranes-all-demag-ac200', 'cranes-all', 'demag', 'ديماج AC 200', 'Demag AC 200', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 15),
('cranes-all-demag-ac250', 'cranes-all', 'demag', 'ديماج AC 250', 'Demag AC 250', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 16),
('cranes-all-demag-ac300', 'cranes-all', 'demag', 'ديماج AC 300', 'Demag AC 300', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 17),
('cranes-all-demag-ac500', 'cranes-all', 'demag', 'ديماج AC 500', 'Demag AC 500', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 18),
-- Liebherr
('cranes-all-liebherr-ltm1050', 'cranes-all', 'liebherr', 'ليبهر LTM 1050', 'Liebherr LTM 1050', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 19),
('cranes-all-liebherr-ltm1100', 'cranes-all', 'liebherr', 'ليبهر LTM 1100', 'Liebherr LTM 1100', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 20),
('cranes-all-liebherr-ltm1130', 'cranes-all', 'liebherr', 'ليبهر LTM 1130', 'Liebherr LTM 1130', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 21),
('cranes-all-liebherr-ltm1160', 'cranes-all', 'liebherr', 'ليبهر LTM 1160', 'Liebherr LTM 1160', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 22),
('cranes-all-liebherr-ltm1200', 'cranes-all', 'liebherr', 'ليبهر LTM 1200', 'Liebherr LTM 1200', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 23),
('cranes-all-liebherr-ltm1300', 'cranes-all', 'liebherr', 'ليبهر LTM 1300', 'Liebherr LTM 1300', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 24),
('cranes-all-liebherr-lrt1100', 'cranes-all', 'liebherr', 'ليبهر LRT 1100', 'Liebherr LRT 1100', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 25),
('cranes-all-liebherr-lr1600', 'cranes-all', 'liebherr', 'ليبهر LR 1600', 'Liebherr LR 1600', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 26),
-- Grove
('cranes-all-grove-gmk3055', 'cranes-all', 'grove', 'جروف GMK 3055', 'Grove GMK 3055', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 27),
('cranes-all-grove-gmk4100', 'cranes-all', 'grove', 'جروف GMK 4100', 'Grove GMK 4100', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 28),
('cranes-all-grove-gmk5130', 'cranes-all', 'grove', 'جروف GMK 5130', 'Grove GMK 5130', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 29),
('cranes-all-grove-gmk6300', 'cranes-all', 'grove', 'جروف GMK 6300', 'Grove GMK 6300', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 30),
('cranes-all-grove-rt530', 'cranes-all', 'grove', 'جروف RT 530', 'Grove RT 530', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 31),
('cranes-all-grove-rt760', 'cranes-all', 'grove', 'جروف RT 760', 'Grove RT 760', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 32),
('cranes-all-grove-rt880', 'cranes-all', 'grove', 'جروف RT 880', 'Grove RT 880', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 33),
-- XCMG
('cranes-all-xcmg-xcr', 'cranes-all', 'xcmg', 'إكس سي إم جي XCR Series', 'XCMG XCR Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 34),
('cranes-all-xcmg-xct', 'cranes-all', 'xcmg', 'إكس سي إم جي XCT Series', 'XCMG XCT Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 35),
('cranes-all-xcmg-xca', 'cranes-all', 'xcmg', 'إكس سي إم جي XCA Series', 'XCMG XCA Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 36),
('cranes-all-xcmg-xgc', 'cranes-all', 'xcmg', 'إكس سي إم جي XGC Series', 'XCMG XGC Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 37)
ON CONFLICT (id) DO NOTHING;
