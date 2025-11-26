import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const displayName = `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'Admin';

  const navItems = [
    { href: '/admin/dashboard', label: 'Overview' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/workspaces', label: 'Workspaces' },
    { href: '/admin/plans', label: 'Plans' },
    { href: '/admin/subscriptions', label: 'Subscriptions' },
    { href: '/admin/presets', label: 'Presets' },
    { href: '/admin/voices', label: 'Voices' },
    { href: '/admin/assistants', label: 'Assistants' },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/transactions', label: 'Transactions' },
    { href: '/admin/payment-gateways', label: 'Payment Gateways' },
    { href: '/admin/models', label: 'AI Models' },
    { href: '/admin/providers', label: 'AI Providers' },
    { href: '/admin/settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <aside className="hidden md:block w-64 bg-white border-r">
          <div className="h-16 flex items-center px-6 border-b">
            <Link href="/dashboard" className="text-xl font-bold">
              Aikeedo Admin
            </Link>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 flex flex-col">
          <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <div className="md:hidden">
                <Link href="/dashboard" className="text-lg font-semibold">
                  Admin
                </Link>
              </div>
              <span className="hidden md:inline text-sm text-muted-foreground">
                Signed in as <span className="font-medium">{displayName}</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Back to app
              </Link>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </form>
            </div>
          </header>

          <div className="flex-1 p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}