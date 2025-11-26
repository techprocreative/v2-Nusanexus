import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold">Aikeedo</div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          AI-Powered Content Platform
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Generate high-quality content with AI. From text and images to audio and code,
          create anything you need in seconds.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/signup"
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg text-lg hover:opacity-90"
          >
            Start Free Trial
          </Link>
          <Link
            href="/billing"
            className="border border-gray-300 px-6 py-3 rounded-lg text-lg hover:bg-gray-50"
          >
            View Pricing
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl bg-white shadow-sm border">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2">AI Writer</h3>
            <p className="text-gray-600">
              Generate blog posts, articles, and marketing copy with advanced AI models.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-white shadow-sm border">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold mb-2">Image Generation</h3>
            <p className="text-gray-600">
              Create stunning images from text descriptions using state-of-the-art models.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-white shadow-sm border">
            <div className="text-4xl mb-4">🎙️</div>
            <h3 className="text-xl font-semibold mb-2">Voice & Audio</h3>
            <p className="text-gray-600">
              Convert text to natural speech and transcribe audio files with AI.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
