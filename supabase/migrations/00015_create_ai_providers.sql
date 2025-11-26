-- AI Providers (Admin-managed)
CREATE TABLE public.ai_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('llm', 'image', 'tts', 'transcription')),
  base_url TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  status SMALLINT DEFAULT 1,
  priority INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Available Models per Provider
CREATE TABLE public.ai_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES public.ai_providers(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('llm', 'image', 'tts', 'transcription')),
  context_length INTEGER,
  input_cost NUMERIC(10, 6),
  output_cost NUMERIC(10, 6),
  status SMALLINT DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(provider_id, model_id)
);

-- Indexes
CREATE INDEX idx_ai_providers_type ON public.ai_providers(type);
CREATE INDEX idx_ai_providers_status ON public.ai_providers(status);
CREATE INDEX idx_ai_providers_priority ON public.ai_providers(priority DESC);
CREATE INDEX idx_ai_models_provider ON public.ai_models(provider_id);
CREATE INDEX idx_ai_models_type ON public.ai_models(type);
CREATE INDEX idx_ai_models_status ON public.ai_models(status);

-- Enable RLS
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage providers"
  ON public.ai_providers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can view active providers"
  ON public.ai_providers FOR SELECT
  USING (status = 1);

CREATE POLICY "Admins can manage models"
  ON public.ai_models FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can view active models"
  ON public.ai_models FOR SELECT
  USING (status = 1);

-- Triggers
CREATE TRIGGER update_ai_providers_updated_at
  BEFORE UPDATE ON public.ai_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default providers (optional - can be added via admin UI)
-- Example: OpenRouter
INSERT INTO public.ai_providers (name, display_name, type, base_url, api_key_encrypted, status, priority)
VALUES 
  ('openrouter-llm', 'OpenRouter (LLM)', 'llm', 'https://openrouter.ai/api/v1', 'PLACEHOLDER_ENCRYPTED_KEY', 0, 100),
  ('openrouter-image', 'OpenRouter (Image)', 'image', 'https://openrouter.ai/api/v1', 'PLACEHOLDER_ENCRYPTED_KEY', 0, 100),
  ('openai-tts', 'OpenAI (TTS)', 'tts', 'https://api.openai.com/v1', 'PLACEHOLDER_ENCRYPTED_KEY', 0, 100),
  ('openai-transcription', 'OpenAI (Whisper)', 'transcription', 'https://api.openai.com/v1', 'PLACEHOLDER_ENCRYPTED_KEY', 0, 100);

-- Note: Admin needs to update API keys and set status=1 to activate
