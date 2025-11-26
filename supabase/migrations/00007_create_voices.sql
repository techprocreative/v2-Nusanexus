-- Voices (TTS)
CREATE TABLE public.voices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL, -- 'elevenlabs', 'google', 'openai', 'azure'
  model TEXT NOT NULL, -- e.g., 'eleven_multilingual_v2'
  external_id TEXT NOT NULL, -- provider's voice ID
  name TEXT NOT NULL,
  status SMALLINT DEFAULT 1,
  gender TEXT CHECK (gender IN ('male', 'female', 'neutral')),
  accent TEXT,
  age TEXT CHECK (age IN ('young', 'middle_aged', 'old')),
  tone TEXT,
  use_case TEXT,
  sample_url TEXT,
  supported_languages TEXT[], -- array of language codes
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, external_id)
);

-- Indexes
CREATE INDEX idx_voices_provider ON public.voices(provider);
CREATE INDEX idx_voices_status ON public.voices(status);
CREATE INDEX idx_voices_gender ON public.voices(gender);

-- Enable RLS
ALTER TABLE public.voices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active voices"
  ON public.voices FOR SELECT
  USING (status = 1);

CREATE POLICY "Admins can manage voices"
  ON public.voices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger
CREATE TRIGGER update_voices_updated_at
  BEFORE UPDATE ON public.voices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
