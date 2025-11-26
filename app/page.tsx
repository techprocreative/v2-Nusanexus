import Link from 'next/link';
import {
  Sparkles,
  PenSquare,
  Image as ImageIcon,
  Code2,
  MessageCircle,
  Mic,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      {/* Top navigation */}
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-500 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-base font-semibold tracking-tight">
                Nusanexus
              </span>
              <span className="text-xs text-muted-foreground">
                AI workspace for Indonesia
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/pricing"
              className="hidden text-muted-foreground hover:text-foreground md:inline-flex"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <section className="grid items-center gap-12 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200">
                <Sparkles className="h-3 w-3" />
              </span>
              <span>Multi-tenant AI SaaS platform</span>
            </div>

            <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Build and scale your
              <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
                {' '}
                AI content business
              </span>
              .
            </h1>

            <p className="mt-4 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              Nusanexus adalah platform AI all-in-one untuk menulis konten,
              membuat gambar, generate kode, voiceover, dan transkripsi —
              lengkap dengan workspace multi-tenant, billing rupiah, dan panel
              admin siap pakai.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:opacity-90"
              >
                Mulai gratis sekarang
              </Link>
              <Link
                href="/pricing"
                className="rounded-lg border px-6 py-3 text-sm font-semibold text-muted-foreground hover:bg-background"
              >
                Lihat paket harga
              </Link>
              <p className="w-full text-xs text-muted-foreground sm:w-auto">
                Tidak perlu kartu kredit • Billing dalam Rupiah • Cocok untuk
                agency & creator
              </p>
            </div>

            {/* Mini feature strip */}
            <div className="mt-10 grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 rounded-md bg-sky-100 p-1.5 text-sky-700 dark:bg-sky-950 dark:text-sky-200">
                  <PenSquare className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">AI Writer</p>
                  <p>Artikel, copywriting, dan konten social siap publish.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-0.5 rounded-md bg-indigo-100 p-1.5 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Image & Code</p>
                  <p>Generate visual dan boilerplate kode dalam hitungan detik.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-0.5 rounded-md bg-emerald-100 p-1.5 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
                  <Mic className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Voice & Transcribe</p>
                  <p>Text-to-speech dan transkripsi audio dengan kualitas tinggi.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side – feature overview */}
          <div className="hidden md:block">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Dashboard Nusanexus
              </p>
              <div className="mt-4 space-y-4 text-sm">
                <FeatureRow
                  icon={<PenSquare className="h-4 w-4" />}
                  title="AI Writer & Chat"
                  description="Prompt builder, preset library, dan chat multi-turn untuk tim konten."
                />
                <FeatureRow
                  icon={<ImageIcon className="h-4 w-4" />}
                  title="Image Generation"
                  description="DALL·E 3 dan model image lain via router provider."
                />
                <FeatureRow
                  icon={<Code2 className="h-4 w-4" />}
                  title="Code Assistant"
                  description="Generate snippet dan boilerplate untuk berbagai bahasa pemrograman."
                />
                <FeatureRow
                  icon={<MessageCircle className="h-4 w-4" />}
                  title="Multi-tenant Workspace"
                  description="Workspace terpisah, role-based access, dan credit sharing."
                />
                <FeatureRow
                  icon={<Mic className="h-4 w-4" />}
                  title="Billing Indonesia-ready"
                  description="Tripay & Midtrans dengan pembayaran bank transfer, e-wallet, dan QRIS."
                />
              </div>

              <div className="mt-6 rounded-lg bg-muted p-4 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">
                  Siap dipasang di production
                </p>
                <p className="mt-1">
                  Termasuk admin panel lengkap, RLS Supabase, dan panduan deploy
                  ke Vercel.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="mt-20 space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Semua fitur yang kamu butuhkan untuk SaaS AI modern
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Nusanexus menyatukan seluruh stack: AI, multi-tenant workspace,
              billing, dan admin panel dalam satu platform.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<PenSquare className="h-5 w-5" />}
              title="AI konten multi-channel"
              description="Writer, chat, dan preset yang bisa kamu kurasi sendiri untuk berbagai use case pelanggan."
            />
            <FeatureCard
              icon={<ImageIcon className="h-5 w-5" />}
              title="Gambar & brand asset"
              description="Generate visual untuk social media, iklan, dan desain landing tanpa keluar dari platform."
            />
            <FeatureCard
              icon={<Code2 className="h-5 w-5" />}
              title="Dev-friendly"
              description="Next.js 14 + Supabase + Tailwind + shadcn/ui. Mudah di-extend dan diintegrasikan."
            />
            <FeatureCard
              icon={<MessageCircle className="h-5 w-5" />}
              title="Workspace multi-tenant"
              description="Pisahkan client dan tim dengan workspace terdedikasi, lengkap dengan role dan credit sharing."
            />
            <FeatureCard
              icon={<Mic className="h-5 w-5" />}
              title="Voice & transcription"
              description="Bangun fitur podcast, dubbing, atau meeting notes berbasis TTS dan Whisper."
            />
            <FeatureCard
              icon={<Sparkles className="h-5 w-5" />}
              title="Billing lokal & global"
              description="Tripay & Midtrans untuk Indonesia. Skema subscription & credit yang fleksibel."
            />
          </div>
        </section>

        {/* Built for Indonesia section */}
        <section className="mt-20 rounded-2xl border bg-card px-6 py-10 md:px-10">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Dibangun khusus untuk pasar Indonesia
              </h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                Nusanexus mengutamakan integrasi dengan payment gateway lokal,
                tampilan harga dalam Rupiah, dan infrastrukur yang mudah
                di-deploy ke Vercel + Supabase.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>- Tripay dan Midtrans siap pakai</li>
                <li>- Pricing per plan dan credit packages dalam IDR</li>
                <li>- Email auth, password reset, dan verifikasi built-in</li>
              </ul>
            </div>
            <div className="space-y-3 rounded-xl bg-muted p-5 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                Contoh alur user:
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                <li>Sign up dan buat workspace.</li>
                <li>Pilih paket langganan atau beli credits satuan.</li>
                <li>Gunakan writer, image, voice, dan chat dari satu dashboard.</li>
                <li>Pantau pemakaian dan transaksi dari halaman Billing.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-20 border-t pt-12 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Siap meluncurkan platform AI kamu sendiri?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Mulai dengan akun gratis, sambungkan provider AI, dan atur pricing
            sesuai model bisnismu.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:opacity-90"
            >
              Mulai sekarang
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border px-6 py-3 text-sm font-semibold text-muted-foreground hover:bg-background"
            >
              Lihat paket & harga
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function FeatureRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border bg-background/60 p-3">
      <div className="mt-0.5 text-primary">{icon}</div>
      <div className="space-y-0.5">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-muted text-primary">
        {icon}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
