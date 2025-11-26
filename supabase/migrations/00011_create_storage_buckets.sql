-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('files', 'files', false, 52428800, NULL),
  ('ai-outputs', 'ai-outputs', false, 104857600, NULL),
  ('voice-samples', 'voice-samples', true, 10485760, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for files (private bucket)
CREATE POLICY "Workspace members can view files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'files'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'files'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can delete files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'files'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Storage policies for ai-outputs (private bucket)
CREATE POLICY "Workspace members can view AI outputs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ai-outputs'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can create AI outputs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ai-outputs'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Storage policies for voice-samples (public bucket)
CREATE POLICY "Anyone can view voice samples"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'voice-samples');

CREATE POLICY "Admins can manage voice samples"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'voice-samples'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
