/*
# Create equipment-images storage bucket

Creates a public storage bucket for equipment images.
Images are stored at: equipment-images/{model_id}/{filename}
The bucket is public so the public catalog can display images.
Upload is restricted to authenticated staff (enforced by storage policies).
*/

INSERT INTO storage.buckets (id, name, public) VALUES ('equipment-images', 'equipment-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: only authenticated users can upload/manage
-- Public can read (bucket is public, but we add explicit policy too)
DROP POLICY IF EXISTS "public_read_equipment_images" ON storage.objects;
CREATE POLICY "public_read_equipment_images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'equipment-images');

DROP POLICY IF EXISTS "staff_upload_equipment_images" ON storage.objects;
CREATE POLICY "staff_upload_equipment_images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'equipment-images');

DROP POLICY IF EXISTS "staff_update_equipment_images" ON storage.objects;
CREATE POLICY "staff_update_equipment_images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'equipment-images');

DROP POLICY IF EXISTS "staff_delete_equipment_images" ON storage.objects;
CREATE POLICY "staff_delete_equipment_images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'equipment-images');
