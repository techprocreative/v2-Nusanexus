import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/analytics', label: 'Analytics' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/workspaces', label: 'Workspaces' },
    { href: '/admin/plans', label: 'Plans' },
    { href: '/admin/credits', label: 'Credits' },
    { href: '/admin/subscriptions', label: 'Subscriptions' },
    { href: '/admin/transactions', label: 'Transactions' },
    { href: '/admin/payment-gateways', label: 'Gateways' },
    { href: '/admin/providers', label: 'AI Providers' },
    { href: '/admin/affiliates', label: 'Affiliates' },
    { href: '/admin/payouts', label: 'Payouts' },
    { href: '/admin/settings', label: 'Settings' },
];

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
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen">
            <header className="border-b bg-background">
                <div className="container mx-auto flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Admin Panel
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Manage users, billing, and AI providers
                        </span>
                    </div>
                    <Link
                        href="/dashboard"
                        className="text-xs text-muted-foreground hover:text-foreground"
                    >
                        Back to App
                    </Link>
                </div>
                <nav className="border-t bg-muted/40">
                    <div className="container mx-auto flex flex-wrap gap-3 px-4 py-2 text-sm">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="rounded-md px-3 py-1 text-muted-foreground hover:bg-background hover:text-foreground"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </nav>
            </header>
            <main>{children}</main>
        </div>
    );
}