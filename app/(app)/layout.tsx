import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, workspaces!current_workspace_id(*)')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold">
                Aikeedo
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link href="/writer" className="text-gray-600 hover:text-gray-900">
                  Writer
                </Link>
                <Link href="/image" className="text-gray-600 hover:text-gray-900">
                  Image
                </Link>
                <Link href="/chat" className="text-gray-600 hover:text-gray-900">
                  Chat
                </Link>
                <Link href="/library" className="text-gray-600 hover:text-gray-900">
                  Library
                </Link>
                <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
                  Pricing
                </Link>
                <Link href="/settings/billing" className="text-gray-600 hover:text-gray-900">
                  Billing
                </Link>
                {isAdmin && (
                  <Link href="/admin/dashboard" className="text-gray-600 hover:text-gray-900">
                    Admin
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {profile?.first_name} {profile?.last_name}
              </span>
              <Link
                href="/settings"
                className="text-gray-600 hover:text-gray-900"
              >
                Settings
              </Link>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </form>
            </div>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
