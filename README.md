# Aikeedo - Next.js + Supabase

AI-Powered Content Platform built with Next.js 14 and Supabase.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Payments**: Tripay, Midtrans
- **AI**: OpenAI, Anthropic
- **Styling**: TailwindCSS

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm/npm/yarn
- Supabase account
- Tripay and/or Midtrans account (for payments)
- OpenAI API key

### Installation

1. Clone the repository:
```bash
cd aikeedo-nextjs
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.local.example .env.local
```

4. Configure your `.env.local` with your credentials.

### Supabase Setup

1. Create a new Supabase project at https://supabase.com

2. Run the migrations in order:
```bash
# Using Supabase CLI
supabase db push

# Or manually run each migration in Supabase SQL Editor
```

3. Set up storage buckets (already included in migrations)

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
npm start
```

## Project Structure

```
aikeedo-nextjs/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (app)/             # Main application pages
│   ├── (admin)/           # Admin panel
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # UI components
│   ├── auth/             # Auth components
│   └── ...
├── lib/                   # Utilities
│   ├── supabase/         # Supabase client
│   ├── ai/               # AI integrations
│   ├── payment/          # Payment gateway integrations (Tripay, Midtrans)
│   storage
├── types/                 # TypeScript types
└── supabase/
    └── migrations/        # SQL migrations
```

## Features

- User authentication (email/password)
- Multi-tenant workspaces
- AI content generation (text, images, audio)
- Subscription billing via local gateways (Tripay, Midtrans)
- Credit-based usage system
- File storage and management
- Admin panel

## Database Schema

The database includes these main tables:
- `profiles` - User profiles (extends Supabase Auth)
- `workspaces` - Multi-tenant workspaces
- `workspace_members` - Workspace membership
- `plans` - Subscription plans
- `subscriptions` - Active subscriptions
- `orders` - Payment orders
- `library_items` - Generated AI content
- `conversations` - Chat conversations
- `messages` - Chat messages
- `presets` - AI templates
- `voices` - TTS voices
- `assistants` - AI assistants

## Environment Variables

See `.env.local.example` for all required environment variables.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

### Payment Gateway Webhooks

After deployment, configure your payment gateway webhooks:

- Tripay Callback URL: `https://your-domain.com/api/webhooks/tripay`
- Midtrans Notification URL: `https://your-domain.com/api/webhooks/midtrans`

## License

See LICENSE file.
