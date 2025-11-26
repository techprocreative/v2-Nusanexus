-- Library Items (Generated AI Content - polymorphic)
CREATE TABLE public.library_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  preset_id UUID REFERENCES public.presets(id) ON DELETE SET NULL,
  output_file_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
  input_file_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
  voice_id UUID REFERENCES public.voices(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'document', 'image', 'speech', 'transcription', 'code', 'conversation', etc.
  visibility SMALLINT DEFAULT 0, -- 0: private, 1: public
  title TEXT,
  content TEXT, -- text content for documents
  request_params JSONB NOT NULL DEFAULT '{}',
  model TEXT NOT NULL,
  used_credit_count NUMERIC(23, 11),
  cost JSONB DEFAULT '{}', -- detailed cost breakdown
  metadata JSONB DEFAULT '{}', -- additional type-specific data
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations (Chat-based AI interactions)
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assistant_id UUID, -- FK added after assistants table
  title TEXT,
  model TEXT,
  total_credit_count NUMERIC(23, 11) DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (Chat messages within conversations)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assistant_id UUID, -- FK added after assistants table
  file_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT,
  quote TEXT, -- quoted text being responded to
  model TEXT,
  used_credit_count NUMERIC(23, 11),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Message-LibraryItem relation (for attachments)
CREATE TABLE public.message_library_items (
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  library_item_id UUID REFERENCES public.library_items(id) ON DELETE CASCADE,
  PRIMARY KEY (message_id, library_item_id)
);

-- Indexes
CREATE INDEX idx_library_items_workspace ON public.library_items(workspace_id);
CREATE INDEX idx_library_items_user ON public.library_items(user_id);
CREATE INDEX idx_library_items_preset ON public.library_items(preset_id);
CREATE INDEX idx_library_items_type ON public.library_items(type);
CREATE INDEX idx_library_items_created ON public.library_items(created_at DESC);
CREATE INDEX idx_conversations_workspace ON public.conversations(workspace_id);
CREATE INDEX idx_conversations_user ON public.conversations(user_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created ON public.messages(created_at);

-- Enable RLS
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_library_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Library Items
CREATE POLICY "Workspace members can view library items"
  ON public.library_items FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can create library items"
  ON public.library_items FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own library items"
  ON public.library_items FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own library items"
  ON public.library_items FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for Conversations
CREATE POLICY "Workspace members can view conversations"
  ON public.conversations FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own conversations"
  ON public.conversations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own conversations"
  ON public.conversations FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for Messages
CREATE POLICY "Conversation participants can view messages"
  ON public.messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Conversation participants can create messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLS for message_library_items
CREATE POLICY "Users can view message attachments"
  ON public.message_library_items FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM public.messages WHERE conversation_id IN (
        SELECT id FROM public.conversations WHERE workspace_id IN (
          SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Triggers
CREATE TRIGGER update_library_items_updated_at
  BEFORE UPDATE ON public.library_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
