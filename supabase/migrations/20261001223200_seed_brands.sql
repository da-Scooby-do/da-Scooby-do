/*
# Seed brands

The equipment model seeds reference these brand ids, but the original project
never recorded a migration that inserts them. Crane-only brands are added later
in 20261002090000_add_cranes_category_and_brands.
*/

INSERT INTO brands (id, name_ar, name_en, display_order) VALUES
  ('cat', 'كاتربيلر', 'CAT', 10),
  ('volvo', 'فولفو', 'Volvo', 20),
  ('komatsu', 'كوماتسو', 'Komatsu', 30),
  ('liebherr', 'ليبهير', 'Liebherr', 40),
  ('jcb', 'جي سي بي', 'JCB', 50),
  ('hitachi', 'هيتاشي', 'Hitachi', 60),
  ('develon', 'ديفلون', 'Develon', 70),
  ('hyundai', 'هيونداي', 'Hyundai', 80),
  ('bobcat', 'بوبكات', 'Bobcat', 90),
  ('tadano', 'تادانو', 'Tadano', 100),
  ('grove', 'جروف', 'Grove', 110),
  ('xcmg', 'إكس سي إم جي', 'XCMG', 120),
  ('sany', 'ساني', 'SANY', 130),
  ('terex', 'تيريكس', 'Terex', 140),
  ('manitou', 'مانيتو', 'Manitou', 150),
  ('genie', 'جيني', 'Genie', 160),
  ('jlg', 'جي إل جي', 'JLG', 170),
  ('skyjack', 'سكاي جاك', 'Skyjack', 180),
  ('scania', 'سكانيا', 'Scania', 190),
  ('man', 'مان', 'MAN', 200),
  ('mercedes', 'مرسيدس بنز', 'Mercedes-Benz', 210),
  ('toyota', 'تويوتا', 'Toyota', 220),
  ('mitsubishi', 'ميتسوبيشي', 'Mitsubishi', 230),
  ('tcm', 'تي سي إم', 'TCM', 240),
  ('hyster', 'هايستر', 'Hyster', 250),
  ('linde', 'ليندي', 'Linde', 260),
  ('kubota', 'كوبوتا', 'Kubota', 270),
  ('dynapac', 'ديناباك', 'Dynapac', 280),
  ('hamm', 'هام', 'HAMM', 290),
  ('sakai', 'ساكاي', 'Sakai', 300),
  ('putzmeister', 'بوتزمايستر', 'Putzmeister', 310),
  ('schwing', 'شوينج', 'Schwing', 320),
  ('atlas-copco', 'أطلس كوبكو', 'Atlas Copco', 330),
  ('cummins', 'كمنز', 'Cummins', 340),
  ('perkins', 'بيركنز', 'Perkins', 350),
  ('fg-wilson', 'إف جي ويلسون', 'FG Wilson', 360)
ON CONFLICT (id) DO NOTHING;
