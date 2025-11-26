-- Assistants (AI Characters/Personas)
CREATE TABLE public.assistants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status SMALLINT DEFAULT 1,
  name VARCHAR(64) NOT NULL,
  expertise VARCHAR(128),
  description VARCHAR(255),
  instructions TEXT,
  avatar_url TEXT,
  model TEXT DEFAULT 'gpt-4',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data Units (for RAG/Knowledge Base)
CREATE TABLE public.data_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('file', 'link', 'text')),
  title TEXT,
  url TEXT, -- for link type
  content TEXT, -- extracted text content
  embedding VECTOR(1536), -- for semantic search (requires pgvector)
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assistant-DataUnit relation (for RAG)
CREATE TABLE public.assistant_data_units (
  assistant_id UUID REFERENCES public.assistants(id) ON DELETE CASCADE,
  data_unit_id UUID REFERENCES public.data_units(id) ON DELETE CASCADE,
  PRIMARY KEY (assistant_id, data_unit_id)
);

-- Add FK to conversations and messages
ALTER TABLE public.conversations 
  ADD CONSTRAINT fk_conversation_assistant 
  FOREIGN KEY (assistant_id) REFERENCES public.assistants(id) ON DELETE SET NULL;

ALTER TABLE public.messages 
  ADD CONSTRAINT fk_message_assistant 
  FOREIGN KEY (assistant_id) REFERENCES public.assistants(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_assistants_status ON public.assistants(status);
CREATE INDEX idx_data_units_type ON public.data_units(type);
CREATE INDEX idx_assistant_data_units_assistant ON public.assistant_data_units(assistant_id);

-- Enable RLS
ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_data_units ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active assistants"
  ON public.assistants FOR SELECT
  USING (status = 1);

CREATE POLICY "Admins can manage assistants"
  ON public.assistants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can view data units"
  ON public.data_units FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage data units"
  ON public.data_units FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can view assistant data"
  ON public.assistant_data_units FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage assistant data"
  ON public.assistant_data_units FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Triggers
CREATE TRIGGER update_assistants_updated_at
  BEFORE UPDATE ON public.assistants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_units_updated_at
  BEFORE UPDATE ON public.data_units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
