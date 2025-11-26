import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CreditUsageChart } from '@/components/dashboard/credit-usage-chart';
import { RevenueChart } from '@/components/admin/revenue-chart';

interface UsagePoint {
    date: string;
    credits: number;
}

interface RevenuePoint {
    date: string;
    amount: number;
}

export default async function AdminAnalyticsPage() {
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

    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 29);
    const fromDate = startDate.toISOString().slice(0, 10);

    // Usage stats (credits) from stats table
    const { data: usageRows } = await supabase
        .from('stats')
        .select('date, metric, type')
        .eq('type', 'usage')
        .gte('date', fromDate)
        .order('date', { ascending: true });

    const usageByDate = new Map<string, number>();

    for (const row of usageRows || []) {
        const d = row.date as string;
        const current = usageByDate.get(d) || 0;
        usageByDate.set(d, current + Number(row.metric || 0));
    }

    const usageData: UsagePoint[] = [];
    for (let i = 0; i < 30; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        usageData.push({
            date: key,
            credits: usageByDate.get(key) || 0,
        });
    }

    // Revenue stats from stats table (order + subscription)
    const { data: revenueRows } = await supabase
        .from('stats')
        .select('date, metric, type')
        .in('type', ['order', 'subscription'])
        .gte('date', fromDate)
        .order('date', { ascending: true });

    const revenueByDate = new Map<string, number>();

    for (const row of revenueRows || []) {
        const d = row.date as string;
        const current = revenueByDate.get(d) || 0;
        revenueByDate.set(d, current + Number(row.metric || 0));
    }

    const revenueData: RevenuePoint[] = [];
    for (let i = 0; i < 30; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        revenueData.push({
            date: key,
            amount: revenueByDate.get(key) || 0,
        });
    }

    // Summary metrics
    const totalCredits30Days = usageData.reduce((sum, item) => sum + item.credits, 0);
    const totalRevenue30Days = revenueData.reduce((sum, item) => sum + item.amount, 0);

    const { count: newUsers30Days } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

    const { count: activeWorkspaces } = await supabase
        .from('workspaces')
        .select('*', { count: 'exact', head: true });

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Analytics</h1>
                <p className="text-sm text-muted-foreground">
                    Statistik penggunaan credits dan revenue lintas semua workspace.
                </p>
            </div>

            {/* Summary cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Credits used (30 hari)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">
                            {Math.round(totalCredits30Days).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Total credits yang terpakai di seluruh workspace
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Revenue (30 hari)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">
                            Rp {totalRevenue30Days.toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Berdasarkan transaksi dengan status paid
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            User baru (30 hari)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{newUsers30Days || 0}</p>
                        <p className="text-xs text-muted-foreground">
                            Profile baru yang dibuat dalam 30 hari terakhir
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total workspace
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{activeWorkspaces || 0}</p>
                        <p className="text-xs text-muted-foreground">
                            Workspace terdaftar di sistem
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
                <CreditUsageChart data={usageData} />
                <RevenueChart data={revenueData} />
            </div>
        </div>
    );
}