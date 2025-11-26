import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, CreditCard, Activity, TrendingUp } from 'lucide-react';

export default async function AdminDashboardPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>Unauthorized</div>;
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return <div>Access Denied - Admin Only</div>;
    }

    // Get revenue stats
    const { data: revenueToday } = await supabase
        .from('payment_transactions')
        .select('amount')
        .eq('status', 'paid')
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

    const { data: revenueMonth } = await supabase
        .from('payment_transactions')
        .select('amount')
        .eq('status', 'paid')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    const { data: revenueTotal } = await supabase
        .from('payment_transactions')
        .select('amount')
        .eq('status', 'paid');

    const todayRevenue = revenueToday?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const monthRevenue = revenueMonth?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const totalRevenue = revenueTotal?.reduce((sum, t) => sum + t.amount, 0) || 0;

    // Get user stats
    const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

    // Get subscription stats
    const { count: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .neq('plan_id', null);

    // Get recent transactions
    const { data: recentTransactions } = await supabase
        .from('payment_transactions')
        .select('*, payment_gateways(display_name)')
        .order('created_at', { ascending: false })
        .e })
        .limit(10);

    // Get credit usage stats
    const { data: workspaces } = await supabase
        .from('workspaces')
        .select('credit_count');

    const totalCreditsRemaining = workspaces?.reduce((sum, w) => sum + (w.credit_count || 0), 0) || 0;

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Today Revenue */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rp {todayRevenue.toLocaleString('id-ID')}</div>
                        <p className="text-xs text-muted-foreground">From paid transactions</p>
                    </CardContent>
                </Card>

                {/* Month Revenue */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Month</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rp {monthRevenue.toLocaleString('id-ID')}</div>
                        <p className="text-xs text-muted-foreground">Monthly revenue</p>
                    </CardContent>
                </Card>

                {/* Total Users */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsers || 0}</div>
                        <p className="text-xs text-muted-foreground">{activeUsers || 0} active</p>
                    </CardContent>
                </Card>

                {/* Active Subscriptions */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeSubscriptions || 0}</div>
                        <p className="text-xs text-muted-foreground">Active paid plans</p>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                        <CardDescription>All-time revenue statistics</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Total Revenue</span>
                                <span className="text-2xl font-bold">Rp {totalRevenue.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">This Month</span>
                                <span className="font-medium">Rp {monthRevenue.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Today</span>
                                <span className="font-medium">Rp {todayRevenue.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Credit Usage</CardTitle>
                        <CardDescription>System-wide credit statistics</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Credits Remaining</span>
                                <span className="text-2xl font-bold">{totalCreditsRemaining.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Active Workspaces</span>
                                <span className="font-medium">{workspaces?.length || 0}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Last 10 payment transactions</CardDescription>
                </CardHeader>
                <CardContent>
                    {recentTransactions && recentTransactions.length > 0 ? (
                        <div className="space-y-3">
                            {recentTransactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                    <div className="flex-1">
                                        <p className="font-medium">{tx.user_id}</p>
                                        <p className="text-sm text-muted-foreground capitalize">
                                            {tx.type.replace('_', ' ')} • {tx.payment_gateways?.display_name || 'N/A'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(tx.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">Rp {tx.amount.toLocaleString('id-ID')}</p>
                                        <Badge variant={
                                            tx.status === 'paid' ? 'default' :
                                                tx.status === 'pending' ? 'secondary' :
                                                    'destructive'
                                        }>
                                            {tx.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-6">No transactions yet</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
