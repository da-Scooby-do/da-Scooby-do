/*
# Seed default variants for crane models

## Overview
Each equipment model in SAHAB's catalog architecture has at least one variant (size/configuration). For the new crane models, we create a single "Standard" variant with empty specs. Staff will add specific tonnage/configurations and fill in specifications via the admin catalog management interface.

## Pattern
- Variant ID: {model_id}-std
- size_label_en: "Standard"
- size_label_ar: "قياسي"
- specs: {} (empty — no fabricated values)
- published: true
- display_order: 1

## Notes
- No fabricated specifications
- Staff can add additional variants (e.g., "50 Ton", "100 Ton") via admin
- Existing variant pattern followed exactly
*/

INSERT INTO equipment_variants (id, model_id, size_label_ar, size_label_en, specs, published, display_order)
SELECT
  m.id || '-std',
  m.id,
  'قياسي',
  'Standard',
  '{}'::jsonb,
  true,
  1
FROM equipment_models m
WHERE m.category_id = 'cranes-all'
  AND NOT EXISTS (
    SELECT 1 FROM equipment_variants v WHERE v.model_id = m.id
  );
