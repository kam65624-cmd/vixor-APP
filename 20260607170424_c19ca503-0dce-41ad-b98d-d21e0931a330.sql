
CREATE POLICY "own chart read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'charts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own chart insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'charts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own chart delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'charts' AND auth.uid()::text = (storage.foldername(name))[1]);
