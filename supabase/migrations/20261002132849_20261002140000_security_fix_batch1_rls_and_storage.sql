/*
# Security Fix Batch 1: RLS + Storage hardening

## Changes

### 1. project_attachments INSERT policy
- Drops the insecure `auth_insert_attachments` policy (WITH CHECK (true))
- Creates `secure_insert_attachments` requiring ownership of the linked project request
- Customers can only insert attachments for their own project requests
- Staff can insert attachments when authorized

### 2. project-documents storage policies
- Drops the permissive `auth_upload_project_docs` INSERT policy
- Creates `customer_upload_project_docs` — allows customer upload only when
  the path starts with their project request ID (format: <request_id>/<filename>)
- Creates `staff_upload_project_docs` — staff-only upload
- Creates `customer_read_project_docs` — allows customer to read objects
  whose path starts with a project request ID they own

### 3. Storage bucket limits
- equipment-images: 10MB, JPEG/PNG/WEBP only
- contract-documents: 25MB, PDF/JPEG/PNG/WEBP only
- po-documents: 25MB, PDF/JPEG/PNG/WEBP only
- project-documents: 25MB, PDF/JPEG/PNG/WEBP only

## Security
- No new tables created
- No existing policies weakened
- SELECT policies on project_attachments unchanged
*/

-- ============================================================
-- 1. Fix project_attachments INSERT RLS policy
-- ============================================================

DROP POLICY IF EXISTS "auth_insert_attachments" ON project_attachments;

CREATE POLICY "secure_insert_attachments"
ON project_attachments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_requests pr
    WHERE pr.id = project_request_id
    AND (
      is_staff()
      OR (pr.email IS NOT NULL AND pr.email = customer_email())
    )
  )
);

-- ============================================================
-- 2. Fix project-documents storage policies
-- ============================================================

-- Drop the permissive upload policy
DROP POLICY IF EXISTS "auth_upload_project_docs" ON storage.objects;

-- Customer upload: path must start with their own project request ID
-- Path format: <project_request_id>/<filename>
CREATE POLICY "customer_upload_project_docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-documents'
  AND NOT is_staff()
  AND (
    -- Extract the first path segment (project_request_id) and verify ownership
    EXISTS (
      SELECT 1 FROM project_requests pr
      WHERE pr.id::text = split_part(objects.name, '/', 1)
      AND pr.email IS NOT NULL
      AND pr.email = customer_email()
    )
  )
);

-- Staff upload: any path in project-documents
CREATE POLICY "staff_upload_project_docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-documents'
  AND is_staff()
);

-- Customer read: can read objects under their own project request ID
CREATE POLICY "customer_read_project_docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND NOT is_staff()
  AND (
    EXISTS (
      SELECT 1 FROM project_requests pr
      WHERE pr.id::text = split_part(objects.name, '/', 1)
      AND pr.email IS NOT NULL
      AND pr.email = customer_email()
    )
  )
);

-- ============================================================
-- 3. Storage bucket file size limits and MIME restrictions
-- ============================================================

UPDATE storage.buckets
SET file_size_limit = 10485760,  -- 10 MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
WHERE id = 'equipment-images';

UPDATE storage.buckets
SET file_size_limit = 26214400,  -- 25 MB
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[]
WHERE id = 'contract-documents';

UPDATE storage.buckets
SET file_size_limit = 26214400,  -- 25 MB
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[]
WHERE id = 'po-documents';

UPDATE storage.buckets
SET file_size_limit = 26214400,  -- 25 MB
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[]
WHERE id = 'project-documents';
