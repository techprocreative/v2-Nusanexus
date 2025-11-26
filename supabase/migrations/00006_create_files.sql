-- Files (storage references)
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  storage TEXT NOT NULL DEFAULT 'supabase', -- 'supabase', 's3', 'local'
  object_key TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER NOT NULL, -- in bytes
  mime_type TEXT,
  width INTEGER, -- for images
  height INTEGER, -- for images
  blur_hash TEXT, -- for images
  duration INTEGER, -- for audio/video (in seconds)
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_files_object_key ON public.files(object_key);
CREATE INDEX idx_files_storage ON public.files(storage);

-- Enable RLS
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Files are referenced by other tables, access controlled there
CREATE POLICY "Authenticated users can view files"
  ON public.files FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert files"
  ON public.files FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage files"
  ON public.files FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
