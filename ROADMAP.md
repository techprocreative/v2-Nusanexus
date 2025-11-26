# Aikeedo Migration Roadmap

## Overview

Migrasi Aikeedo dari PHP + MySQL ke Next.js 14 + Supabase.

**Estimasi Total:** ~556 jam (~3.5 bulan)  
**Status:** Phase 1 Complete

---

## Phase 1: Foundation ✅ COMPLETE

**Durasi:** Week 1-2  
**Status:** Done

### Tasks Completed
- [x] Project folder structure
- [x] package.json dengan dependencies
- [x] Next.js config files (next.config.js, tsconfig.json, tailwind.config.ts)
- [x] Supabase client setup (lib/supabase/)
- [x] SQL migrations (11 migration files)
- [x] Environment variables template
- [x] TypeScript database types
- [x] Basic app layout dan pages
- [x] Auth pages (login, signup, recovery)
- [x] API routes skeleton

### Deliverables
- `/aikeedo-nextjs/` project folder
- 11 SQL migration files di `/supabase/migrations/`
- Basic Next.js app structure

---

## Phase 2: Core Features ✅ COMPLETE

**Durasi:** Week 3-4  
**Estimasi:** 96 jam  
**Status:** 100% Complete

### 2.1 Authentication Enhancement ✅
- [x] Email verification flow
- [x] Password reset complete flow
- [ ] OAuth providers (Google, GitHub) - optional
- [ ] Session management improvements
- [x] Remember me functionality

### 2.2 User Profile Management ✅
- [x] Profile page (`/settings/profile`)
- [x] Avatar upload dengan Supabase Storage
- [x] Update name, language, preferences
- [x] Change password
- [x] Change email with verification
- [x] Delete account

### 2.3 Workspace Management ✅
- [x] Create workspace
- [x] Workspace settings page
- [x] Workspace switcher component
- [x] Invite members via email
- [x] Accept/decline invitations
- [x] Member list with roles
- [x] Remove members
- [x] Transfer ownership
- [x] Delete workspace

### 2.4 Dashboard Enhancement ✅
- [x] Credit usage chart (ApexCharts/Recharts)
- [x] Recent activity feed
- [x] Quick actions grid
- [x] Workspace stats summary
- [x] Usage analytics widget

### 2.5 UI Components ✅
- [x] Button, Input, Card components (shadcn/ui)
- [x] Modal/Dialog component
- [x] Dropdown menu
- [x] Toast notifications
- [x] Loading skeletons
- [x] Empty states
- [x] Error boundaries

---

### Phase 3: AI Integration ✅ COMPLETE

**Timeline**: Week 5-6  
**Status**: ✅ 100% Complete  
**Completion Date**: November 26, 2025

**All Features Implemented:**
- ✅ Admin Panel for AI Provider Management
  - Database schema for providers and models
  - Encryption utilities for API keys (AES-256-GCM)
  - Provider client helpers with fallback
  - API routes for provider/model CRUD
  - Admin UI for managing providers and models
- ✅ Preset Management System
  - Browse and search presets
  - Category filtering
  - Preset detail pages
  - Template variable support
- ✅ AI Writer
  - Text generation with LLM models
  - Dynamic model selection from database
  - Parameter controls (temperature, max tokens)
  - Markdown output with copy/download
  - Credit deduction and library saving
- ✅ Image Generator (DALL-E 3)
  - Multiple size options (square, portrait, landscape)
  - Quality settings (standard, HD)
  - Supabase Storage integration
  - Download functionality
- ✅ Code Generator
  - 10+ programming language support
  - Syntax highlighting (highlight.js)
  - Optimized system prompts
  - Code explanation generation
- ✅ Chat/Conversation System
  - Conversation history management
  - Real-time messaging
  - Conversation sidebar
  - Message persistence
- ✅ Voice/TTS Generation
  - 6 voice options
  - Speed control
  - Audio playback and download
  - Supabase Storage upload
- ✅ Audio Transcription
  - Whisper API integration
  - Multiple language support
  - Editable transcription output
  - File validation
- ✅ Library Management
  - Enhanced browsing interface
  - Real-time search functionality
  - Type-based filtering
  - Image preview

---

## Phase 4: Billing System ✅ COMPLETE

**Durasi:** Week 7-8  
**Status**: ✅ 100% Complete  
**Completion Date**: November 26, 2025

**Note**: Implemented with Tripay & Midtrans (Indonesian payment gateways) instead of Stripe

### All Features Implemented:

**Database Schema:**
- ✅ payment_gateways table (admin-managed)
- ✅ subscription_plans table
- ✅ subscriptions table
- ✅ credit_packages table
- ✅ payment_transactions table
- ✅ user_payment_preferences table

**Payment Gateway Integration:**
- ✅ Tripay client (Bank Transfer, E-Wallet, QRIS, Alfamart/Indomaret)
- ✅ Midtrans client (Bank Transfer, E-Wallet, Credit Card, QRIS)
- ✅ Gateway factory pattern
- ✅ Credential encryption (AES-256-GCM)

**Subscription Plans (IDR):**
- ✅ Free: Rp 0 (100 credits/month, Basic models only)
- ✅ Starter: Rp 149,000 (1,500 credits/month, All models)
- ✅ Pro: Rp 399,000 (5,000 credits/month, All models)
- ✅ Enterprise: Rp 1,499,000 (25,000 credits/month, All models)

**Credit Packages:**
- ✅ 500 credits: Rp 59,000
- ✅ 1,000 credits: Rp 109,000
- ✅ 2,500 credits: Rp 249,000
- ✅ 5,000 credits: Rp 449,000

**API Routes:**
- ✅ GET /api/billing/plans
- ✅ POST /api/billing/subscribe
- ✅ POST /api/billing/credits/purchase
- ✅ GET /api/billing/transactions
- ✅ Admin gateway management APIs

**Webhook Handlers:**
- ✅ POST /api/webhooks/tripay (signature verification, credit allocation)
- ✅ POST /api/webhooks/midtrans (notification verification, subscription activation)

**UI Components:**
- ✅ Pricing page (plan comparison, credit packages, FAQ)
- ✅ Billing settings page (subscription info, payment history, credit balance)
- ✅ Subscribe/checkout page (payment integration)
- ✅ Admin payment gateway management UI

**Security:**
- ✅ Webhook signature verification
- ✅ Encrypted credentials storage
- ✅ RLS policies on all tables
- ✅ Idempotent credit allocation

**Profitability:**
- ✅ Tiered credit system (1-10 credits per 1K tokens based on model)
- ✅ Profit margins: 19-84% across all services
- ✅ MRR projection: Rp 91.6M (1K users)

---

## Phase 5: Admin Panel 🔲 PENDING

**Durasi:** Week 9-10  
**Estimasi:** 80 jam

### 5.1 Admin Layout
- [ ] Admin sidebar navigation
- [ ] Admin header
- [ ] Role-based access control
- [ ] Admin dashboard overview

### 5.2 User Management
- [ ] Users list with pagination
- [ ] User search/filter
- [ ] User detail view
- [ ] Edit user (role, status)
- [ ] Create user
- [ ] Delete/suspend user
- [ ] Export users CSV

### 5.3 Workspace Management
- [ ] Workspaces list
- [ ] Workspace detail
- [ ] Edit workspace credits
- [ ] View workspace members
- [ ] Export workspaces

### 5.4 Plan Management
- [ ] Plans list
- [ ] Create plan
- [ ] Edit plan (title, price, features, credits)
- [ ] Delete/archive plan
- [ ] Reorder plans
- [ ] Plan snapshots view

### 5.5 Subscription Management
- [ ] Subscriptions list
- [ ] Filter by status, plan
- [ ] Cancel subscription (admin)
- [ ] Create manual subscription
- [ ] Export subscriptions

### 5.6 Preset Management
- [ ] Presets list
- [ ] Create preset
- [ ] Edit preset (title, template, type)
- [ ] Delete preset
- [ ] Lock/unlock preset
- [ ] Category management

### 5.7 Voice Management
- [ ] Voices list
- [ ] Sync voices from providers
- [ ] Enable/disable voices
- [ ] Voice preview

### 5.8 Assistant Management
- [ ] Assistants list
- [ ] Create assistant
- [ ] Edit assistant (name, instructions, avatar)
- [ ] Delete assistant
- [ ] Data units/knowledge base

### 5.9 Order Management
- [ ] Orders list
- [ ] Order detail
- [ ] Refund handling (manual)
- [ ] Export orders

### 5.10 Settings
- [ ] Site settings (name, logo, etc.)
- [ ] AI provider settings (API keys)
- [ ] SMTP settings
- [ ] Payment settings
- [ ] Feature flags

### 5.11 Analytics Dashboard
- [ ] Revenue chart
- [ ] User signups chart
- [ ] Credit usage chart
- [ ] Top presets usage
- [ ] Geographic distribution

---

## Phase 6: Testing & Polish 🔲 PENDING

**Durasi:** Week 11-12  
**Estimasi:** 60 jam

### 6.1 Unit Tests
- [ ] Utility functions tests
- [ ] API route tests
- [ ] Component tests (React Testing Library)
- [ ] Supabase query tests

### 6.2 Integration Tests
- [ ] Auth flow tests
- [ ] Billing flow tests
- [ ] AI generation flow tests
- [ ] Admin CRUD tests

### 6.3 E2E Tests (Playwright)
- [ ] User signup/login flow
- [ ] Content generation flow
- [ ] Subscription purchase flow
- [ ] Admin management flow

### 6.4 Performance Optimization
- [ ] Image optimization (next/image)
- [ ] Code splitting
- [ ] API response caching
- [ ] Database query optimization
- [ ] Bundle size analysis

### 6.5 Security Audit
- [ ] RLS policy review
- [ ] API authentication check
- [ ] Input sanitization
- [ ] Rate limiting
- [ ] CORS configuration
- [ ] Environment secrets audit

### 6.6 Accessibility
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Color contrast
- [ ] Screen reader testing

### 6.7 Documentation
- [ ] API documentation
- [ ] Deployment guide
- [ ] Environment setup guide
- [ ] Feature documentation

---

## Phase 7: Deployment 🔲 PENDING

**Durasi:** Week 12+

### 7.1 Vercel Deployment
- [ ] Connect GitHub repo
- [ ] Configure environment variables
- [ ] Set up custom domain
- [ ] Configure edge functions

### 7.2 Supabase Production
- [ ] Create production project
- [ ] Run migrations
- [ ] Configure auth settings
- [ ] Set up storage buckets
- [ ] Configure RLS policies

### 7.3 Payment Gateway Production (Tripay & Midtrans)
- [ ] Switch Tripay/Midtrans credentials to live mode
- [ ] Configure Tripay callback endpoint
- [ ] Configure Midtrans notification endpoint
- [ ] Test live subscription and credit purchase flows

### 7.4 Monitoring
- [ ] Error tracking (Sentry)
- [ ] Analytics (Vercel Analytics)
- [ ] Uptime monitoring
- [ ] Log aggregation

### 7.5 Backup & Recovery
- [ ] Database backup schedule
- [ ] Point-in-time recovery setup
- [ ] Disaster recovery plan

---

## Tech Stack Reference

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Payments | Tripay, Midtrans |
| AI - Text | OpenAI GPT-4, Anthropic Claude |
| AI - Image | OpenAI DALL-E 3 |
| AI - Audio | OpenAI Whisper, TTS |
| Styling | TailwindCSS |
| UI Components | shadcn/ui, Radix UI |
| Forms | React Hook Form + Zod |
| State | SWR / React Query |
| Deployment | Vercel |

---

## File Structure Reference

```
aikeedo-nextjs/
├── app/
│   ├── (auth)/           # Public auth pages
│   ├── (app)/            # Protected app pages
│   ├── (admin)/          # Admin panel
│   └── api/              # API routes
├── components/
│   ├── ui/               # Base UI components
│   ├── auth/             # Auth-related components
│   ├── dashboard/        # Dashboard widgets
│   ├── ai/               # AI generation components
│   ├── workspace/        # Workspace components
│   └── billing/          # Billing components
├── lib/
│   ├── supabase/         # Supabase clients
│   ├── ai/               # AI service integrations
│   ├── payment/          # Paymentintegration
│   └── storage/          # File storage utilities
├── types/                # TypeScript types
├── hooks/                # Custom React hooks
├── supabase/
│   └── migrations/       # SQL migrations
└── public/               # Static assets
```

---

## Migration Checklist from PHP

### Entities Migrated
- [x] User → profiles
- [x] Workspace → workspaces
- [x] WorkspaceUser → workspace_members
- [x] WorkspaceInvitation → workspace_invitations
- [x] Plan → plans
- [x] PlanSnapshot → plan_snapshots
- [x] Subscription → subscriptions
- [x] Order → orders
- [x] Coupon → coupons
- [x] Category → categories
- [x] Preset → presets
- [x] Voice → voices
- [x] File → files
- [x] LibraryItem → library_items
- [x] Conversation → conversations
- [x] Message → messages
- [x] Assistant → assistants
- [x] DataUnit → data_units
- [x] Affiliate → affiliates
- [x] Payout → payouts
- [x] Stat → stats
- [x] Option → options

### Features to Port
- [ ] All 17 PHP modules functionality
- [ ] 145+ API endpoints
- [ ] Admin panel (126 handlers)
- [ ] Plugin system (consider alternative approach)

---

## Notes

- Start setiap phase dengan review tasks
- Update status di file ini setelah complete task
- Prioritaskan MVP features terlebih dahulu
- Test setiap feature sebelum lanjut ke berikutnya
- Document any blockers atau changes dari plan

---

## Changelog

| Date | Phase | Update |
|------|-------|--------|
| 2024-XX-XX | 1 | Initial project setup complete |
| 2025-11-26 | 2 | UI Components library complete (15 components) |
| 2025-11-26 | 2 | User Profile Management complete |
| 2025-11-26 | 2 | Workspace Management complete |
| 2025-11-26 | 2 | Dashboard Enhancement complete (charts, stats, activity feed) |
| 2025-11-26 | 2 | Authentication Enhancement complete (email verification, password reset) |
| 2025-11-26 | 2 | **Phase 2: Core Features - 100% COMPLETE** |
| | | |

