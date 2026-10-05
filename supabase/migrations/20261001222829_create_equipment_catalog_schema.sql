/*
# Equipment Catalog Database Schema

## Overview
Creates the complete database-backed equipment catalog system for SAHAB, replacing the in-memory seed data approach. Includes categories, brands, equipment models, variants, staff roles, and staff profiles with full RLS.

## New Tables

### categories
- id (text, primary key) — e.g. 'excavators'
- name_ar, name_en, slug, image, icon (text)
- description_ar, description_en (text)
- spec_fields (jsonb) — array of {key, labelAr, labelEn, unitAr, unitEn}
- display_order (int)
- hidden (boolean, default false)
- created_at, updated_at (timestamptz)

### brands
- id (text, primary key) — e.g. 'cat'
- name_ar, name_en (text)
- display_order (int)
- hidden (boolean, default false)
- created_at, updated_at (timestamptz)

### equipment_models
- id (text, primary key) — e.g. 'cat-320'
- category_id (text, references categories ON DELETE RESTRICT)
- brand_id (text, references brands ON DELETE RESTRICT)
- name_ar, name_en (text)
- description_ar, description_en (text)
- image (text) — primary image URL
- gallery (jsonb) — array of image URLs (up to 4)
- features_ar, features_en (jsonb) — string arrays
- rental_terms_ar, rental_terms_en (text)
- year (text)
- short_description_ar, short_description_en (text)
- rental_info (jsonb) — {dailyPrice, weeklyPrice, ...}
- published (boolean, default true)
- hidden (boolean, default false)
- archived (boolean, default false) — soft delete
- availability (text, default 'available') — available, unavailable, rented, maintenance
- display_order (int)
- created_at, updated_at (timestamptz)

### equipment_variants
- id (text, primary key)
- model_id (text, references equipment_models ON DELETE CASCADE)
- size_label_ar, size_label_en (text)
- specs (jsonb) — Record<string, string>
- published (boolean, default true)
- display_order (int)
- created_at, updated_at (timestamptz)

### staff_roles
- id (text, primary key)
- name_ar, name_en, description_ar, description_en (text)
- is_system (boolean, default false)
- is_active (boolean, default true)
- permissions (jsonb) — array of {module, actions: {view, create, edit, delete, manage}}
- created_at (timestamptz)

### staff_profiles
- id (uuid, primary key)
- user_id (uuid, references auth.users ON DELETE CASCADE)
- role_id (text, references staff_roles)
- full_name (text)
- email (text)
- mobile (text)
- status (text, default 'active') — active, inactive, pending
- is_owner (boolean, default false)
- created_at (timestamptz)
- last_activity (timestamptz, nullable)

## Security

### Public catalog tables (categories, brands, equipment_models, equipment_variants)
- SELECT: anon+authenticated can read non-hidden, published, non-archived items (public catalog)
- SELECT: authenticated staff (with staff_profile) can read ALL items including hidden/unpublished/archived
- INSERT/UPDATE/DELETE: authenticated staff only, gated by permission check function

### Staff management tables (staff_roles, staff_profiles)
- SELECT: authenticated staff only
- INSERT/UPDATE/DELETE: owner or users with 'employees' module 'manage' permission

### Permission enforcement
- `staff_can(module, action)` SECURITY DEFINER function checks the current user's role permissions
- Owner bypasses all checks (is_owner = true)
- Used in RLS policies for equipment management operations

## Indexes
- equipment_models(category_id), equipment_models(brand_id), equipment_models(availability)
- equipment_variants(model_id)
- staff_profiles(user_id) unique
*/

-- ─── CATEGORIES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  slug text NOT NULL,
  image text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'Truck',
  description_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  spec_fields jsonb NOT NULL DEFAULT '[]',
  display_order int NOT NULL DEFAULT 0,
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ─── BRANDS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brands (
  id text PRIMARY KEY,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- ─── EQUIPMENT MODELS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS equipment_models (
  id text PRIMARY KEY,
  category_id text NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  brand_id text NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  description_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '',
  gallery jsonb NOT NULL DEFAULT '[]',
  features_ar jsonb NOT NULL DEFAULT '[]',
  features_en jsonb NOT NULL DEFAULT '[]',
  rental_terms_ar text NOT NULL DEFAULT '',
  rental_terms_en text NOT NULL DEFAULT '',
  year text NOT NULL DEFAULT '',
  short_description_ar text NOT NULL DEFAULT '',
  short_description_en text NOT NULL DEFAULT '',
  rental_info jsonb NOT NULL DEFAULT '{}',
  published boolean NOT NULL DEFAULT true,
  hidden boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  availability text NOT NULL DEFAULT 'available',
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE equipment_models ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_equipment_models_category ON equipment_models(category_id);
CREATE INDEX IF NOT EXISTS idx_equipment_models_brand ON equipment_models(brand_id);
CREATE INDEX IF NOT EXISTS idx_equipment_models_availability ON equipment_models(availability);

-- ─── EQUIPMENT VARIANTS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS equipment_variants (
  id text PRIMARY KEY,
  model_id text NOT NULL REFERENCES equipment_models(id) ON DELETE CASCADE,
  size_label_ar text NOT NULL DEFAULT '',
  size_label_en text NOT NULL DEFAULT '',
  specs jsonb NOT NULL DEFAULT '{}',
  published boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE equipment_variants ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_equipment_variants_model ON equipment_variants(model_id);

-- ─── STAFF ROLES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_roles (
  id text PRIMARY KEY,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  description_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  is_system boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  permissions jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE staff_roles ENABLE ROW LEVEL SECURITY;

-- ─── STAFF PROFILES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id text NOT NULL REFERENCES staff_roles(id),
  full_name text NOT NULL,
  email text NOT NULL,
  mobile text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  is_owner boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_activity timestamptz
);

ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_staff_profiles_user ON staff_profiles(user_id);

-- ─── PERMISSION CHECK FUNCTION ───────────────────────────────
-- SECURITY DEFINER so it can read staff_profiles/staff_roles regardless of RLS
CREATE OR REPLACE FUNCTION staff_can(check_module text, check_action text)
RETURNS boolean AS $$
DECLARE
  profile_record RECORD;
  role_perms jsonb;
  perm jsonb;
BEGIN
  -- Get the current user's staff profile
  SELECT * INTO profile_record FROM staff_profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN RETURN false; END IF;

  -- Owner bypasses all checks
  IF profile_record.is_owner THEN RETURN true; END IF;

  -- Get role permissions
  SELECT permissions INTO role_perms FROM staff_roles WHERE id = profile_record.role_id AND is_active = true;
  IF role_perms IS NULL THEN RETURN false; END IF;

  -- Check if the module+action is allowed
  FOR perm IN SELECT * FROM jsonb_array_elements(role_perms) LOOP
    IF perm->>'module' = check_module THEN
      IF (perm->'actions'->>check_action)::boolean THEN
        RETURN true;
      END IF;
    END IF;
  END LOOP;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── HELPER: Check if current user is staff ──────────────────
CREATE OR REPLACE FUNCTION is_staff()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM staff_profiles WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── RLS POLICIES: CATEGORIES ────────────────────────────────
-- Public: read non-hidden categories
DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (hidden = false);

-- Staff: read all categories (including hidden)
DROP POLICY IF EXISTS "staff_read_all_categories" ON categories;
CREATE POLICY "staff_read_all_categories"
  ON categories FOR SELECT
  TO authenticated
  USING (is_staff());

-- Staff with permission: insert
DROP POLICY IF EXISTS "staff_insert_categories" ON categories;
CREATE POLICY "staff_insert_categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (staff_can('categories', 'create'));

-- Staff with permission: update
DROP POLICY IF EXISTS "staff_update_categories" ON categories;
CREATE POLICY "staff_update_categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (staff_can('categories', 'edit'))
  WITH CHECK (staff_can('categories', 'edit'));

-- Staff with permission: delete
DROP POLICY IF EXISTS "staff_delete_categories" ON categories;
CREATE POLICY "staff_delete_categories"
  ON categories FOR DELETE
  TO authenticated
  USING (staff_can('categories', 'delete'));

-- ─── RLS POLICIES: BRANDS ────────────────────────────────────
DROP POLICY IF EXISTS "public_read_brands" ON brands;
CREATE POLICY "public_read_brands"
  ON brands FOR SELECT
  TO anon, authenticated
  USING (hidden = false);

DROP POLICY IF EXISTS "staff_read_all_brands" ON brands;
CREATE POLICY "staff_read_all_brands"
  ON brands FOR SELECT
  TO authenticated
  USING (is_staff());

DROP POLICY IF EXISTS "staff_insert_brands" ON brands;
CREATE POLICY "staff_insert_brands"
  ON brands FOR INSERT
  TO authenticated
  WITH CHECK (staff_can('brands', 'create'));

DROP POLICY IF EXISTS "staff_update_brands" ON brands;
CREATE POLICY "staff_update_brands"
  ON brands FOR UPDATE
  TO authenticated
  USING (staff_can('brands', 'edit'))
  WITH CHECK (staff_can('brands', 'edit'));

DROP POLICY IF EXISTS "staff_delete_brands" ON brands;
CREATE POLICY "staff_delete_brands"
  ON brands FOR DELETE
  TO authenticated
  USING (staff_can('brands', 'delete'));

-- ─── RLS POLICIES: EQUIPMENT MODELS ──────────────────────────
-- Public: read published, non-hidden, non-archived
DROP POLICY IF EXISTS "public_read_equipment_models" ON equipment_models;
CREATE POLICY "public_read_equipment_models"
  ON equipment_models FOR SELECT
  TO anon, authenticated
  USING (published = true AND hidden = false AND archived = false);

-- Staff: read all
DROP POLICY IF EXISTS "staff_read_all_equipment_models" ON equipment_models;
CREATE POLICY "staff_read_all_equipment_models"
  ON equipment_models FOR SELECT
  TO authenticated
  USING (is_staff());

-- Staff with equipment create permission
DROP POLICY IF EXISTS "staff_insert_equipment_models" ON equipment_models;
CREATE POLICY "staff_insert_equipment_models"
  ON equipment_models FOR INSERT
  TO authenticated
  WITH CHECK (staff_can('equipment', 'create'));

-- Staff with equipment edit permission
DROP POLICY IF EXISTS "staff_update_equipment_models" ON equipment_models;
CREATE POLICY "staff_update_equipment_models"
  ON equipment_models FOR UPDATE
  TO authenticated
  USING (staff_can('equipment', 'edit'))
  WITH CHECK (staff_can('equipment', 'edit'));

-- Staff with equipment delete permission (archive)
DROP POLICY IF EXISTS "staff_delete_equipment_models" ON equipment_models;
CREATE POLICY "staff_delete_equipment_models"
  ON equipment_models FOR DELETE
  TO authenticated
  USING (staff_can('equipment', 'delete'));

-- ─── RLS POLICIES: EQUIPMENT VARIANTS ────────────────────────
DROP POLICY IF EXISTS "public_read_equipment_variants" ON equipment_variants;
CREATE POLICY "public_read_equipment_variants"
  ON equipment_variants FOR SELECT
  TO anon, authenticated
  USING (
    published = true AND
    EXISTS (
      SELECT 1 FROM equipment_models
      WHERE equipment_models.id = equipment_variants.model_id
      AND equipment_models.published = true
      AND equipment_models.hidden = false
      AND equipment_models.archived = false
    )
  );

DROP POLICY IF EXISTS "staff_read_all_equipment_variants" ON equipment_variants;
CREATE POLICY "staff_read_all_equipment_variants"
  ON equipment_variants FOR SELECT
  TO authenticated
  USING (is_staff());

DROP POLICY IF EXISTS "staff_insert_equipment_variants" ON equipment_variants;
CREATE POLICY "staff_insert_equipment_variants"
  ON equipment_variants FOR INSERT
  TO authenticated
  WITH CHECK (staff_can('equipment', 'create'));

DROP POLICY IF EXISTS "staff_update_equipment_variants" ON equipment_variants;
CREATE POLICY "staff_update_equipment_variants"
  ON equipment_variants FOR UPDATE
  TO authenticated
  USING (staff_can('equipment', 'edit'))
  WITH CHECK (staff_can('equipment', 'edit'));

DROP POLICY IF EXISTS "staff_delete_equipment_variants" ON equipment_variants;
CREATE POLICY "staff_delete_equipment_variants"
  ON equipment_variants FOR DELETE
  TO authenticated
  USING (staff_can('equipment', 'delete'));

-- ─── RLS POLICIES: STAFF ROLES ───────────────────────────────
DROP POLICY IF EXISTS "staff_read_roles" ON staff_roles;
CREATE POLICY "staff_read_roles"
  ON staff_roles FOR SELECT
  TO authenticated
  USING (is_staff());

DROP POLICY IF EXISTS "owner_manage_roles" ON staff_roles;
CREATE POLICY "owner_manage_roles"
  ON staff_roles FOR ALL
  TO authenticated
  USING (staff_can('employees', 'manage'))
  WITH CHECK (staff_can('employees', 'manage'));

-- ─── RLS POLICIES: STAFF PROFILES ────────────────────────────
DROP POLICY IF EXISTS "staff_read_profiles" ON staff_profiles;
CREATE POLICY "staff_read_profiles"
  ON staff_profiles FOR SELECT
  TO authenticated
  USING (is_staff());

DROP POLICY IF EXISTS "owner_insert_profiles" ON staff_profiles;
CREATE POLICY "owner_insert_profiles"
  ON staff_profiles FOR INSERT
  TO authenticated
  WITH CHECK (staff_can('employees', 'manage'));

DROP POLICY IF EXISTS "owner_update_profiles" ON staff_profiles;
CREATE POLICY "owner_update_profiles"
  ON staff_profiles FOR UPDATE
  TO authenticated
  USING (staff_can('employees', 'manage'))
  WITH CHECK (staff_can('employees', 'manage'));

DROP POLICY IF EXISTS "owner_delete_profiles" ON staff_profiles;
CREATE POLICY "owner_delete_profiles"
  ON staff_profiles FOR DELETE
  TO authenticated
  USING (staff_can('employees', 'manage'));

-- ─── UPDATED_AT TRIGGERS ─────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_categories_updated ON categories;
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_brands_updated ON brands;
CREATE TRIGGER trg_brands_updated BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_equipment_models_updated ON equipment_models;
CREATE TRIGGER trg_equipment_models_updated BEFORE UPDATE ON equipment_models FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_equipment_variants_updated ON equipment_variants;
CREATE TRIGGER trg_equipment_variants_updated BEFORE UPDATE ON equipment_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
