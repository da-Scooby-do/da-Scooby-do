/*
# Seed crane equipment models — Part 2 (Zoomlion, SANY, Kato, Kobelco, Manitowoc, Sumitomo, Link-Belt, Fassi, Palfinger, UNIC, Sennebogen)

## Models Added (Part 2)
### Zoomlion (5 models)
ZAT Series, ZTC Series, ZAT6000, ZCC Series, QUY Series

### SANY (4 models)
STC Series, SRC Series, SAC Series, SCC Series

### Kato (3 models)
SR Series, NK Series, CR Series

### Kobelco (3 models)
CK Series, CKE Series, SL Series

### Manitowoc (3 models)
MLC Series, 999 Series, 16000 Series

### Sumitomo (2 models)
SC Series, SCX Series

### Link-Belt (2 models)
LS Series, HTC Series

### Fassi (1 model)
F Series

### Palfinger (1 model)
PK Series

### UNIC (1 model)
URW Series

### Sennebogen (1 model)
SENNE Series

## Notes
- All models in category `cranes-all`
- No fabricated specifications — staff fill in via admin
*/

INSERT INTO equipment_models (id, category_id, brand_id, name_ar, name_en, description_ar, description_en, image, gallery, features_ar, features_en, rental_terms_ar, rental_terms_en, year, short_description_ar, short_description_en, rental_info, published, display_order) VALUES
-- Zoomlion
('cranes-all-zoomlion-zat', 'cranes-all', 'zoomlion', 'زوومليون ZAT Series', 'Zoomlion ZAT Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 38),
('cranes-all-zoomlion-ztc', 'cranes-all', 'zoomlion', 'زوومليون ZTC Series', 'Zoomlion ZTC Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 39),
('cranes-all-zoomlion-zat6000', 'cranes-all', 'zoomlion', 'زوومليون ZAT6000', 'Zoomlion ZAT6000', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 40),
('cranes-all-zoomlion-zcc', 'cranes-all', 'zoomlion', 'زوومليون ZCC Series', 'Zoomlion ZCC Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 41),
('cranes-all-zoomlion-quy', 'cranes-all', 'zoomlion', 'زوومليون QUY Series', 'Zoomlion QUY Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 42),
-- SANY
('cranes-all-sany-stc', 'cranes-all', 'sany', 'ساني STC Series', 'SANY STC Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 43),
('cranes-all-sany-src', 'cranes-all', 'sany', 'ساني SRC Series', 'SANY SRC Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 44),
('cranes-all-sany-sac', 'cranes-all', 'sany', 'ساني SAC Series', 'SANY SAC Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 45),
('cranes-all-sany-scc', 'cranes-all', 'sany', 'ساني SCC Series', 'SANY SCC Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 46),
-- Kato
('cranes-all-kato-sr', 'cranes-all', 'kato', 'كاتو SR Series', 'Kato SR Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 47),
('cranes-all-kato-nk', 'cranes-all', 'kato', 'كاتو NK Series', 'Kato NK Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 48),
('cranes-all-kato-cr', 'cranes-all', 'kato', 'كاتو CR Series', 'Kato CR Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 49),
-- Kobelco
('cranes-all-kobelco-ck', 'cranes-all', 'kobelco', 'كوبلكو CK Series', 'Kobelco CK Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 50),
('cranes-all-kobelco-cke', 'cranes-all', 'kobelco', 'كوبلكو CKE Series', 'Kobelco CKE Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 51),
('cranes-all-kobelco-sl', 'cranes-all', 'kobelco', 'كوبلكو SL Series', 'Kobelco SL Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 52),
-- Manitowoc
('cranes-all-manitowoc-mlc', 'cranes-all', 'manitowoc', 'مانيتوووك MLC Series', 'Manitowoc MLC Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 53),
('cranes-all-manitowoc-999', 'cranes-all', 'manitowoc', 'مانيتوووك 999 Series', 'Manitowoc 999 Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 54),
('cranes-all-manitowoc-16000', 'cranes-all', 'manitowoc', 'مانيتوووك 16000 Series', 'Manitowoc 16000 Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 55),
-- Sumitomo
('cranes-all-sumitomo-sc', 'cranes-all', 'sumitomo', 'سوميتومو SC Series', 'Sumitomo SC Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 56),
('cranes-all-sumitomo-scx', 'cranes-all', 'sumitomo', 'سوميتومو SCX Series', 'Sumitomo SCX Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 57),
-- Link-Belt
('cranes-all-linkbelt-ls', 'cranes-all', 'link-belt', 'لينك بيلت LS Series', 'Link-Belt LS Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 58),
('cranes-all-linkbelt-htc', 'cranes-all', 'link-belt', 'لينك بيلت HTC Series', 'Link-Belt HTC Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 59),
-- Fassi
('cranes-all-fassi-f', 'cranes-all', 'fassi', 'فassi F Series', 'Fassi F Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 60),
-- Palfinger
('cranes-all-palfinger-pk', 'cranes-all', 'palfinger', 'بالفينجر PK Series', 'Palfinger PK Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 61),
-- UNIC
('cranes-all-unic-urw', 'cranes-all', 'unic', 'يونيك URW Series', 'UNIC URW Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 62),
-- Sennebogen
('cranes-all-sennebogen-senne', 'cranes-all', 'sennebogen', 'سنيبوجن SENNE Series', 'Sennebogen SENNE Series', '', '', '', '[]', '[]', '[]', '', '', '', '', '', '{}', true, 63)
ON CONFLICT (id) DO NOTHING;
