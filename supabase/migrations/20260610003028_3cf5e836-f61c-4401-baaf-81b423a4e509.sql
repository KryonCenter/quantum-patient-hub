
CREATE POLICY "doctor_logos_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'doctor-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "doctor_logos_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'doctor-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "doctor_logos_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'doctor-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "doctor_logos_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'doctor-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
