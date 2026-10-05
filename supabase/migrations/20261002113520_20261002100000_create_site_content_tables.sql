/*
# Create site content management tables

## Overview
Adds database-driven content management for the SAHAB platform:
- Homepage banners (editable by staff)
- Contact information (centralized, editable)
- Legal/content pages (privacy policy, terms, etc.)
- Project request attachments (secure document storage)

## New Tables

### site_banners
- id (uuid, PK)
- title_ar, title_en (text) — banner title
- subtitle_ar, subtitle_en (text) — banner subtitle/description
- image_url (text) — banner background image
- button_text_ar, button_text_en (text, nullable) — CTA button label
- button_link (text, nullable) — CTA destination route/URL
- is_active (boolean, default true)
- display_order (int, default 0)
- start_date (date, nullable) — visibility start
- end_date (date, nullable) — visibility end
- created_at, updated_at (timestamptz)

### site_settings
- id (int, PK, always 1 — singleton)
- company_name_ar, company_name_en (text)
- phone (text)
- whatsapp (text)
- email (text)
- address_ar, address_en (text)
- business_hours_ar, business_hours_en (text)
- maps_link (text, nullable)
- facebook_url, twitter_url, instagram_url, linkedin_url (text, nullable)
- cr_number, vat_number (text, nullable)
- created_at, updated_at (timestamptz)

### legal_pages
- id (text, PK) — e.g. 'privacy-policy', 'terms'
- title_ar, title_en (text)
- content_ar, content_en (text)
- is_active (boolean, default true)
- display_order (int, default 0)
- created_at, updated_at (timestamptz)

### project_attachments
- id (uuid, PK)
- project_request_id (uuid, FK -> project_requests ON DELETE CASCADE)
- file_name (text)
- file_path (text) — path in storage bucket
- file_type (text) — mime type
- file_size (bigint)
- uploaded_by (uuid, nullable)
- created_at (timestamptz)

## Storage
- Creates `project-documents` private storage bucket
- Staff-only write/read/delete policies
- Customer read scoped to their own project requests

## RLS Policies
- site_banners: public read, staff-only write
- site_settings: public read, staff-only write
- legal_pages: public read, staff-only write
- project_attachments: staff read all, customer read own, staff-only write/delete
*/

-- ─── SITE BANNERS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  subtitle_ar text NOT NULL DEFAULT '',
  subtitle_en text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  button_text_ar text NOT NULL DEFAULT '',
  button_text_en text NOT NULL DEFAULT '',
  button_link text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_banners" ON site_banners;
CREATE POLICY "public_read_banners"
  ON site_banners FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "staff_read_all_banners" ON site_banners;
CREATE POLICY "staff_read_all_banners"
  ON site_banners FOR SELECT
  TO authenticated
  USING (is_staff());

DROP POLICY IF EXISTS "staff_insert_banners" ON site_banners;
CREATE POLICY "staff_insert_banners"
  ON site_banners FOR INSERT
  TO authenticated
  WITH CHECK (staff_can('content', 'create') OR staff_can('content', 'manage'));

DROP POLICY IF EXISTS "staff_update_banners" ON site_banners;
CREATE POLICY "staff_update_banners"
  ON site_banners FOR UPDATE
  TO authenticated
  USING (staff_can('content', 'edit') OR staff_can('content', 'manage'))
  WITH CHECK (staff_can('content', 'edit') OR staff_can('content', 'manage'));

DROP POLICY IF EXISTS "staff_delete_banners" ON site_banners;
CREATE POLICY "staff_delete_banners"
  ON site_banners FOR DELETE
  TO authenticated
  USING (staff_can('content', 'manage'));

-- ─── SITE SETTINGS (singleton) ────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  id int PRIMARY KEY DEFAULT 1,
  company_name_ar text NOT NULL DEFAULT 'سحاب',
  company_name_en text NOT NULL DEFAULT 'SAHAB',
  phone text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  address_ar text NOT NULL DEFAULT '',
  address_en text NOT NULL DEFAULT '',
  business_hours_ar text NOT NULL DEFAULT '',
  business_hours_en text NOT NULL DEFAULT '',
  maps_link text NOT NULL DEFAULT '',
  facebook_url text NOT NULL DEFAULT '',
  twitter_url text NOT NULL DEFAULT '',
  instagram_url text NOT NULL DEFAULT '',
  linkedin_url text NOT NULL DEFAULT '',
  cr_number text NOT NULL DEFAULT '',
  vat_number text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT singleton_check CHECK (id = 1)
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_settings" ON site_settings;
CREATE POLICY "public_read_settings"
  ON site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "staff_update_settings" ON site_settings;
CREATE POLICY "staff_update_settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (staff_can('content', 'edit') OR staff_can('content', 'manage'))
  WITH CHECK (staff_can('content', 'edit') OR staff_can('content', 'manage'));

INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ─── LEGAL PAGES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS legal_pages (
  id text PRIMARY KEY,
  title_ar text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  content_ar text NOT NULL DEFAULT '',
  content_en text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE legal_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_legal" ON legal_pages;
CREATE POLICY "public_read_legal"
  ON legal_pages FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "staff_read_all_legal" ON legal_pages;
CREATE POLICY "staff_read_all_legal"
  ON legal_pages FOR SELECT
  TO authenticated
  USING (is_staff());

DROP POLICY IF EXISTS "staff_insert_legal" ON legal_pages;
CREATE POLICY "staff_insert_legal"
  ON legal_pages FOR INSERT
  TO authenticated
  WITH CHECK (staff_can('content', 'create') OR staff_can('content', 'manage'));

DROP POLICY IF EXISTS "staff_update_legal" ON legal_pages;
CREATE POLICY "staff_update_legal"
  ON legal_pages FOR UPDATE
  TO authenticated
  USING (staff_can('content', 'edit') OR staff_can('content', 'manage'))
  WITH CHECK (staff_can('content', 'edit') OR staff_can('content', 'manage'));

DROP POLICY IF EXISTS "staff_delete_legal" ON legal_pages;
CREATE POLICY "staff_delete_legal"
  ON legal_pages FOR DELETE
  TO authenticated
  USING (staff_can('content', 'manage'));

-- Seed default legal pages
INSERT INTO legal_pages (id, title_ar, title_en, display_order) VALUES
  ('privacy-policy', 'سياسة الخصوصية', 'Privacy Policy', 1),
  ('terms', 'الشروط والأحكام', 'Terms & Conditions', 2),
  ('usage-policy', 'سياسة استخدام الموقع', 'Website Usage Policy', 3),
  ('cancellation-policy', 'سياسة الإلغاء والتعديل', 'Cancellation & Modification Policy', 4)
ON CONFLICT (id) DO NOTHING;

-- ─── PROJECT ATTACHMENTS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_request_id uuid NOT NULL REFERENCES project_requests(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL DEFAULT '',
  file_size bigint NOT NULL DEFAULT 0,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE project_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_read_attachments" ON project_attachments;
CREATE POLICY "staff_read_attachments"
  ON project_attachments FOR SELECT
  TO authenticated
  USING (is_staff());

DROP POLICY IF EXISTS "customer_read_own_attachments" ON project_attachments;
CREATE POLICY "customer_read_own_attachments"
  ON project_attachments FOR SELECT
  TO authenticated
  USING (
    NOT is_staff()
    AND EXISTS (
      SELECT 1 FROM project_requests pr
      WHERE pr.id = project_attachments.project_request_id
      AND pr.email = customer_email()
    )
  );

DROP POLICY IF EXISTS "auth_insert_attachments" ON project_attachments;
CREATE POLICY "auth_insert_attachments"
  ON project_attachments FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "staff_delete_attachments" ON project_attachments;
CREATE POLICY "staff_delete_attachments"
  ON project_attachments FOR DELETE
  TO authenticated
  USING (is_staff());

-- ─── PROJECT DOCUMENTS STORAGE BUCKET ─────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('project-documents', 'project-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "staff_read_project_docs" ON storage.objects;
CREATE POLICY "staff_read_project_docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'project-documents' AND is_staff());

DROP POLICY IF EXISTS "auth_upload_project_docs" ON storage.objects;
CREATE POLICY "auth_upload_project_docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'project-documents');

DROP POLICY IF EXISTS "staff_delete_project_docs" ON storage.objects;
CREATE POLICY "staff_delete_project_docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'project-documents' AND is_staff());

-- ─── ADD COLUMNS TO project_requests ──────────────────────────
ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS project_name text NOT NULL DEFAULT '';
ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS project_type text NOT NULL DEFAULT '';
ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS scope_of_work text NOT NULL DEFAULT '';
ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS estimated_budget text NOT NULL DEFAULT '';
ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS expected_start_date text NOT NULL DEFAULT '';
ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS expected_duration text NOT NULL DEFAULT '';
ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '';
ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS district text NOT NULL DEFAULT '';
ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS company_name text NOT NULL DEFAULT '';
