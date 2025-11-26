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
              <span>Multi-skill AI assistant in Bahasa Indonesia</span>
            </div>

            <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Satu ruang kerja untuk
              <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
                {' '}
                semua AI kamu
              </span>
              .
            </h1>

            <p className="mt-4 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              Nusanexus menghubungkan kamu ke banyak model dan keahlian AI dalam satu
              tempat: menulis, desain, coding, riset, voice, dan banyak lagi. Tanpa
              perlu berpindah tools atau belajar prompt yang rumit.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:opacity-90"
              >
                Coba gratis sekarang
              </Link>
              <Link
                href="/pricing"
                className="rounded-lg border px-6 py-3 text-sm font-semibold text-muted-foreground hover:bg-background"
              >
                Lihat paket & harga
              </Link>
              <p className="w-full text-xs text-muted-foreground sm:w-auto">
                Cocok untuk kreator, karyawan, mahasiswa, dan agency konten
              </p>
            </div>

            {/* Mini feature strip */}
            <div className="mt-10 grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 rounded-md bg-sky-100 p-1.5 text-sky-700 dark:bg-sky-950 dark:text-sky-200">
                  <PenSquare className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Tulis & susun ide</p>
                  <p>Bikin artikel, caption, dan outline konten dalam hitungan menit.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-0.5 rounded-md bg-indigo-100 p-1.5 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Visual & desain</p>
                  <p>Generate gambar dan konsep desain untuk social media & iklan.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-0.5 rounded-md bg-emerald-100 p-1.5 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
                  <Mic className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Voice & meeting notes</p>
                  <p>Transkrip meeting dan ubah text jadi voiceover bahasa Indonesia.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side – example tasks */}
          <div className="hidden md:block">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Contoh tugas yang bisa dikerjakan Nusanexus
              </p>
              <div className="mt-4 space-y-4 text-sm">
                <FeatureRow
                  icon={<PenSquare className="h-4 w-4" />}
                  title="Tulis 30 caption Instagram"
                  description="Berikan satu deskripsi brand, Nusanexus buatkan puluhan variasi caption dan hook."
                />
                <FeatureRow
                  icon={<MessageCircle className="h-4 w-4" />}
                  title="Rangkum dokumen panjang"
                  description="Upload teks atau paste artikel panjang, dapatkan ringkasan poin-poin penting."
                />
                <FeatureRow
                  icon={<ImageIcon className="h-4 w-4" />}
                  title="Thumbnail & ide visual"
                  description="Generate konsep gambar dan prompt siap pakai untuk kampanye visual kamu."
                />
                <FeatureRow
                  icon={<Code2 className="h-4 w-4" />}
                  title="Debug & snippet kode"
                  description="Tanya masalah coding, dapatkan penjelasan plus contoh kode yang bisa dicoba."
                />
                <FeatureRow
                  icon={<Mic className="h-4 w-4" />}
                  title="Transkrip meeting otomatis"
                  description="Ubah rekaman meeting jadi catatan rapi dengan action item dan ringkasan."
                />
              </div>

              <div className="mt-6 rounded-lg bg-muted p-4 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">
                  Satu akun, banyak kemampuan AI
                </p>
                <p className="mt-1">
                  Nusanexus menggabungkan berbagai model AI dan preset dalam satu
                  antarmuka; kamu cukup fokus pada pekerjaan, bukan teknologinya.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="mt-20 space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Jadikan AI teman kerja sehari-hari
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Dari ide awal sampai eksekusi, Nusanexus menemani proses kamu dengan
              kumpulan AI writer, designer, coder, dan asisten riset dalam satu
              dashboard.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<PenSquare className="h-5 w-5" />}
              title="Penulisan & konten"
              description="Brief singkat, hasil panjang. Artikel, skrip video, email, dan copy ditulis dalam gaya yang bisa kamu atur."
            />
            <FeatureCard
              icon={<ImageIcon className="h-5 w-5" />}
              title="Desain & gambar"
              description="Buat referensi visual, moodboard, atau materi kampanye dengan prompt bahasa Indonesia."
            />
            <FeatureCard
              icon={<Code2 className="h-5 w-5" />}
              title="Coding & automation"
              description="Tanya error, minta snippet, atau minta bantuan membuat script kecil untuk otomasi."
            />
            <FeatureCard
              icon={<MessageCircle className="h-5 w-5" />}
              title="Riset & ringkasan"
              description="Minta rangkuman artikel, ide topik, atau struktur deck presentasi dengan cepat."
            />
            <FeatureCard
              icon={<Mic className="h-5 w-5" />}
              title="Voice & meeting notes"
              description="Transkripsikan audio dan ubah menjadi catatan, outline, atau artikel lanjutan."
            />
            <FeatureCard
              icon={<Sparkles className="h-5 w-5" />}
              title="Terhubung ke banyak model"
              description="Nusanexus memilih model AI yang tepat di belakang layar, kamu cukup mengirim tugas."
            />
          </div>
        </section>

        {/* Built for Indonesia section */}
        <section className="mt-20 rounded-2xl border bg-card px-6 py-10 md:px-10">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Nyaman dipakai pengguna Indonesia
              </h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                Bahasa, payment, dan flow di Nusanexus dirancang agar familiar untuk
                pengguna di Indonesia – tanpa ribet kartu kredit luar negeri.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>- Antarmuka dan contoh prompt dalam Bahasa Indonesia</li>
                <li>- Pembayaran melalui bank transfer, e-wallet, dan QRIS</li>
                <li>- Harga paket dan credits dalam Rupiah, transparan dan jelas</li>
              </ul>
            </div>
            <div className="space-y-3 rounded-xl bg-muted p-5 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                Contoh alur penggunaan:
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                <li>Sign up dan pilih paket yang sesuai kebutuhan.</li>
                <li>Gunakan writer, image, chat, dan tools lain dari satu dashboard.</li>
                <li>Simpan hasil penting ke Library agar mudah diakses kembali.</li>
                <li>Pantau credits dan riwayat pembayaran dari halaman Billing.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-20 border-t pt-12 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Siap kerja bareng banyak AI dalam satu tempat?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Buat akun Nusanexus, kirim tugas pertama kamu, dan lihat bagaimana AI bisa
            mempercepat pekerjaan harianmu.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:opacity-90"
            >
              Mulai gunakan Nusanexus
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
