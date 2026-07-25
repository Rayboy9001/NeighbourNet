
CREATE POLICY "report_images_read" ON storage.objects FOR SELECT USING (bucket_id = 'reports-images');
CREATE POLICY "report_images_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'reports-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "report_images_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'reports-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "report_images_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'reports-images' AND (storage.foldername(name))[1] = auth.uid()::text);
