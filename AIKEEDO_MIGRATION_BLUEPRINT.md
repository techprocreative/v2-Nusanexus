# Blueprint Migrasi Aikeedo ke Vercel/Netlify + Supabase

## 📋 Executive Summary

**Project:** Aikeedo - AI-Powered Content Platform (SaaS Ready)  
**Current Stack:** PHP 8.2 + Doctrine ORM + MySQL + Alpine.js + Vite  
**Target Stack:** Next.js/Nuxt.js + Supabase + Vercel/Netlify  
**Migration Complexity:** 🔴 HIGH (Complete rewrite required)

---

## 🔍 Analisis Codebase Saat Ini

### Arsitektur Existing

#### Backend Architecture
- **Framework:** Custom PHP framework dengan PSR compliance
- **Pattern:** Domain-Driven Design (DDD)
- **ORM:** Doctrine ORM 3.3
- **Database:** MySQL/SQLite dengan migrations
- **Routing:** Custom router (iziphp/router)
- **DI Container:** Custom container (iziphp/container)

#### Frontend Architecture
- **Framework:** Alpine.js 3.14
- **Build Tool:** Vite 6.4
- **CSS:** TailwindCSS 4.1
- **UI Libraries:** ApexCharts, WaveSurfer.js, Highlight.js

#### Struktur Modul (17 Modules)
```
src/
├── User/          # User management & authentication
├── Ai/            # AI service integrations (213 files)
├── Billing/       # Payment & subscriptions (183 files)
├── Workspace/     # Multi-tenancy workspace
├── Preset/        # AI presets/templates
├── Assistant/     # AI assistants
├── Voice/         # Text-to-speech
├── File/          # File storage
├── Dataset/       # Training datasets
├── Category/      # Content categories
├── Option/        # System settings
├── Plugin/        # Plugin system
├── Affiliate/     # Affiliate program
├── Cron/          # Scheduled tasks
├── Stat/          # Analytics
├── Shared/        # Shared utilities
└── Presentation/  # HTTP handlers (353 files)
```

### Database Schema

#### Core Tables
```sql
-- User Management
user                    # Users
workspace               # Multi-tenant workspaces
workspace_user          # Workspace members
workspace_invitation    # Pending invitations

-- Billing & Subscriptions
plan                    # Subscription plans
plan_snapshot           # Historical plan versions
subscription            # Active subscriptions
order                   # Payment orders

-- AI Content
library_item            # Generated content (polymorphic)
preset                  # AI templates
voice                   # TTS voices
category                # Content categories

-- System
option                  # Key-value settings
file                    # Uploaded/generated files
```

#### Key Features
- ✅ UUID-based primary keys (BINARY(16))
- ✅ Soft deletes via ON DELETE CASCADE
- ✅ Polymorphic associations (library_item)
- ✅ Multi-currency support
- ✅ Credit-based usage tracking

### API Endpoints (254 Request Handlers)

#### Public Routes
- `/` - Landing page
- `/login` - Authentication
- `/signup` - Registration
- `/recovery` - Password reset
- `/verify-email` - Email verification

#### API Routes (`/api/`)
- User management
- Workspace operations
- AI content generation
- File uploads
- Billing & payments
- Analytics

#### Admin Routes (`/admin/`)
- User management (126 handlers)
- Plan management
- System settings
- Plugin management

---

## 🎯 Target Architecture: Vercel/Netlify + Supabase

### Tech Stack Mapping

| Current | Target | Rationale |
|---------|--------|-----------|
| PHP 8.2 | Next.js 14 / Nuxt 3 | Serverless compatibility |
| Doctrine ORM | Supabase Client | Native PostgreSQL |
| MySQL | Supabase PostgreSQL | Managed database |
| Custom Auth | Supabase Auth | Built-in auth system |
| Stripe PHP | Stripe.js | Client-side integration |
| Alpine.js | React / Vue 3 | Better ecosystem |
| Vite | Next.js / Nuxt | Integrated tooling |
| Custom Storage | Supabase Storage | Managed file storage |

### Recommended Stack

**Option A: Next.js (Recommended)**
```
Frontend: Next.js 14 (App Router)
Backend: Next.js API Routes / Server Actions
Database: Supabase PostgreSQL
Auth: Supabase Auth
Storage: Supabase Storage
Payments: Stripe Elements
Deployment: Vercel
```

**Option B: Nuxt.js**
```
Frontend: Nuxt 3
Backend: Nuxt Server Routes
Database: Supabase PostgreSQL
Auth: Supabase Auth
Storage: Supabase Storage
Payments: Stripe
Deployment: Netlify
```

---

## 📐 Database Migration Plan

### Supabase Schema Design

#### Step 1: Core Tables Migration

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (Supabase Auth integration)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  current_workspace_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspaces
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles NOT NULL,
  name TEXT NOT NULL,
  credit_count NUMERIC(23, 11) DEFAULT 0,
  is_trialed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace Members (Many-to-Many)
CREATE TABLE public.workspace_members (
  workspace_id UUID REFERENCES public.workspaces ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

-- Plans
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
  credit_count NUMERIC(23, 11),
  config JSONB,
  status SMALLINT DEFAULT 1,
  is_featured BOOLEAN DEFAULT false,
  superiority SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES public.workspaces ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans,
  payment_gateway TEXT,
  external_id TEXT,
  trial_period_days INTEGER,
  usage_count NUMERIC(23, 11) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  canceled_at TIMESTAMPTZ,
  renew_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- Presets (AI Templates)
CREATE TABLE public.presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.categories ON DELETE SET NULL,
  type TEXT NOT NULL,
  status SMALLINT DEFAULT 1,
  is_locked BOOLEAN DEFAULT false,
  title TEXT NOT NULL,
  description TEXT,
  template TEXT,
  image TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Library Items (Generated Content)
CREATE TABLE public.library_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES public.workspaces ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles ON DELETE CASCADE,
  preset_id UUID REFERENCES public.presets ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'text', 'image', 'audio'
  visibility SMALLINT DEFAULT 0,
  title TEXT,
  content TEXT,
  request_params JSONB NOT NULL,
  model TEXT NOT NULL,
  used_credit_count NUMERIC(23, 11),
  output_file_id UUID,
  input_file_id UUID,
  voice_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Files (Storage references)
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  storage TEXT NOT NULL, -- 'supabase', 's3', etc
  object_key TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  blur_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voices (TTS)
CREATE TABLE public.voices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status SMALLINT DEFAULT 1,
  gender TEXT,
  accent TEXT,
  age TEXT,
  sample_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Options
CREATE TABLE public.options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Step 2: Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Workspaces: Members can view their workspaces
CREATE POLICY "Users can view their workspaces"
  ON public.workspaces FOR SELECT
  USING (
    id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Library Items: Workspace members can CRUD
CREATE POLICY "Workspace members can view library items"
  ON public.library_items FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can insert library items"
  ON public.library_items FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );
```

#### Step 3: Database Functions & Triggers

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, status, first_name, last_name, language)
  VALUES (
    NEW.id,
    'user',
    'active',
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'language', 'en')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 🔄 Backend Migration Strategy

### API Routes Conversion

#### Current (PHP Request Handler)
```php
// src/Presentation/RequestHandlers/Api/User/ProfileRequestHandler.php
namespace Presentation\RequestHandlers\Api\User;

class ProfileRequestHandler {
    public function __invoke(Request $request): Response {
        $user = $this->userRepository->findById($userId);
        return new JsonResponse($user);
    }
}
```

#### Target (Next.js API Route)
```typescript
// app/api/user/profile/route.ts
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  return Response.json(profile);
}
```

### Critical Services to Migrate

#### 1. Authentication
```typescript
// lib/supabase/auth.ts
import { createClient } from '@supabase/supabase-js';

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string, metadata: any) {
  const supabase = createClient();
  return await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata }
  });
}
```

#### 2. AI Content Generation
```typescript
// lib/ai/generator.ts
export async function generateContent(
  workspaceId: string,
  presetId: string,
  params: Record<string, any>
) {
  // Call OpenAI/Anthropic API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages
    })
  });
  
  const result = await response.json();
  
  // Save to Supabase
  const supabase = createClient();
  await supabase.from('library_items').insert({
    workspace_id: workspaceId,
    preset_id: presetId,
    type: 'text',
    content: result.choices[0].message.content,
    request_params: params,
    model: params.model,
    used_credit_count: calculateCredits(result.usage)
  });
  
  return result;
}
```

#### 3. File Storage
```typescript
// lib/storage/upload.ts
export async function uploadFile(
  file: File,
  bucket: string = 'files'
) {
  const supabase = createClient();
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);
  
  if (error) throw error;
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);
  
  // Save file record
  await supabase.from('files').insert({
    storage: 'supabase',
    object_key: fileName,
    url: publicUrl,
    size: file.size
  });
  
  return { url: publicUrl, key: fileName };
}
```

#### 4. Billing Integration
```typescript
// lib/billing/stripe.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(
  workspaceId: string,
  planId: string,
  userId: string
) {
  const supabase = createClient();
  
  // Get plan details
  const { data: plan } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single();
  
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: plan.title },
        recurring: { interval: plan.billing_cycle },
        unit_amount: plan.price
      },
      quantity: 1
    }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/billing/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/billing/cancel`,
    metadata: { workspace_id: workspaceId, plan_id: planId }
  });
  
  return session;
}

export async function handleWebhook(payload: any, signature: string) {
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
  
  switch (event.type) {
    case 'checkout.session.completed':
      // Create subscription in Supabase
      break;
    case 'customer.subscription.deleted':
      // Cancel subscription
      break;
  }
}
```

---

## 🎨 Frontend Migration Strategy

### Component Conversion

#### Current (Alpine.js)
```html
<!-- resources/views/app/dashboard.twig -->
<div x-data="{ credits: 1000, used: 250 }">
  <div class="stats">
    <span x-text="credits - used"></span> credits remaining
  </div>
  
  <button @click="generateContent()">Generate</button>
</div>

<script>
function generateContent() {
  fetch('/api/ai/generate', {
    method: 'POST',
    body: JSON.stringify({ prompt: 'Hello' })
  });
}
</script>
```

#### Target (Next.js + React)
```tsx
// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DashboardPage() {
  const [workspace, setWorkspace] = useState<any>(null);
  const supabase = createClient();
  
  useEffect(() => {
    async function loadWorkspace() {
      const { data } = await supabase
        .from('workspaces')
        .select('*')
        .single();
      setWorkspace(data);
    }
    loadWorkspace();
  }, []);
  
  async function generateContent() {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'Hello' })
    });
    const result = await response.json();
  }
  
  return (
    <div className="stats">
      <span>{workspace?.credit_count ?? 0} credits remaining</span>
      <button onClick={generateContent}>Generate</button>
    </div>
  );
}
```

### Key UI Components to Build

```typescript
// components/
├── auth/
│   ├── LoginForm.tsx
│   ├── SignupForm.tsx
│   └── PasswordReset.tsx
├── dashboard/
│   ├── CreditUsage.tsx
│   ├── RecentGenerations.tsx
│   └── QuickActions.tsx
├── ai/
│   ├── PresetSelector.tsx
│   ├── PromptEditor.tsx
│   ├── GenerationPreview.tsx
│   └── ModelSelector.tsx
├── workspace/
│   ├── WorkspaceSwitcher.tsx
│   ├── MemberList.tsx
│   └── InviteModal.tsx
└── billing/
    ├── PlanSelector.tsx
    ├── PaymentForm.tsx
    └── SubscriptionStatus.tsx
```

---

## ⚙️ Environment Configuration

### Supabase Setup

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# AI Services
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx

# Payment
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Storage
NEXT_PUBLIC_STORAGE_URL=https://xxxxx.supabase.co/storage/v1

# App
NEXT_PUBLIC_URL=http://localhost:3000
```

### Supabase Buckets

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('files', 'files', false),
  ('ai-outputs', 'ai-outputs', false);

-- Storage policies
CREATE POLICY "Users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 📦 Deployment Configuration

### Vercel Deployment (Next.js)

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

### Netlify Deployment (Nuxt)

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".output/public"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[functions]
  directory = ".netlify/functions"
```

---

## 🚀 Migration Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Setup Supabase project
- [ ] Create database schema & migrations
- [ ] Setup RLS policies
- [ ] Initialize Next.js/Nuxt project
- [ ] Configure Supabase client
- [ ] Setup Stripe integration

### Phase 2: Core Features (Week 3-4)
- [ ] Authentication system
- [ ] User profile management
- [ ] Workspace management
- [ ] Basic UI components
- [ ] Dashboard layout

### Phase 3: AI Integration (Week 5-6)
- [ ] Preset management
- [ ] AI content generation
- [ ] File upload/storage
- [ ] Library/history view
- [ ] Voice/TTS integration

### Phase 4: Billing (Week 7-8)
- [ ] Plan management
- [ ] Subscription checkout
- [ ] Webhook handlers
- [ ] Credit system
- [ ] Usage tracking

### Phase 5: Admin Panel (Week 9-10)
- [ ] Admin dashboard
- [ ] User management
- [ ] Plan editor
- [ ] System settings
- [ ] Analytics

### Phase 6: Testing & Launch (Week 11-12)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Security audit
- [ ] Production deployment

---

## 💡 Best Practices & Recommendations

### Performance
1. **Use Server Components** where possible (Next.js App Router)
2. **Implement caching** with React Query / SWR
3. **Lazy load** AI models and heavy components
4. **Optimize images** with Next.js Image component
5. **Use Edge Functions** for low-latency API routes

### Security
1. **Always validate** user permissions via RLS
2. **Never expose** service role keys client-side
3. **Implement rate limiting** on AI endpoints
4. **Sanitize user inputs** before AI generation
5. **Use HTTPS** for all API calls

### Cost Optimization
1. **Cache AI responses** to reduce API costs
2. **Use Supabase Realtime** instead of polling
3. **Implement pagination** for large queries
4. **Compress images** before storage
5. **Monitor Stripe webhooks** to avoid duplicates

---

## 📊 Estimated Migration Effort

| Component | Complexity | Estimated Hours |
|-----------|------------|-----------------|
| Database Schema | Medium | 40h |
| Authentication | Low | 16h |
| Core API Routes | High | 80h |
| AI Integration | High | 100h |
| Frontend Components | High | 120h |
| Billing System | Medium | 60h |
| Admin Panel | Medium | 80h |
| Testing | Medium | 60h |
| **TOTAL** | | **556h (~3.5 months)** |

---

## 🔗 Resources

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Nuxt Docs](https://nuxt.com/docs)
- [Stripe API](https://stripe.com/docs/api)

### Templates
- [Next.js Supabase Starter](https://github.com/vercel/next.js/tree/canary/examples/with-supabase)
- [Nuxt Supabase Starter](https://github.com/nuxt-modules/supabase)

### Tools
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Prisma Schema Generator](https://www.prisma.io/)
- [Vercel CLI](https://vercel.com/docs/cli)

---

## ⚠️ Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data migration errors | High | Test with subset, use transactions |
| Feature parity gaps | Medium | Document all existing features first |
| Third-party API limits | High | Implement caching & rate limiting |
| Cost overruns | Medium | Set Supabase/Vercel usage alerts |
| Timeline slippage | Medium | Use agile sprints, prioritize MVP |

---

## ✅ Conclusion

Migration dari PHP+MySQL stack ke Vercel/Netlify+Supabase **memungkinkan** namun memerlukan **complete rewrite**. Keuntungan yang didapat:

**Pros:**
- ✅ Serverless architecture (auto-scaling)
- ✅ Better developer experience
- ✅ Built-in auth & storage
- ✅ Modern frontend stack
- ✅ Lower operational overhead

**Cons:**
- ❌ Complete rewrite required (~3.5 months)
- ❌ Learning curve for new stack
- ❌ Potential feature gaps
- ❌ Migration risks

**Recommendation:** Mulai dengan **MVP feature set** terlebih dahulu, kemudian iterasi bertahap untuk menambahkan fitur lengkap dari platform existing.
