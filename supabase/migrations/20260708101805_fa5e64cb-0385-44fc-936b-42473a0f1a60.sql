
CREATE POLICY "admin_read_patient_files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'patient-files' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin_insert_patient_files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'patient-files' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin_update_patient_files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'patient-files' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin_delete_patient_files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'patient-files' AND public.has_role(auth.uid(),'admin'));
