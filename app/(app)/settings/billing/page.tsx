import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function BillingSettingsPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>Unauthorized</div>;
    }

    const { data: profile } = await supabase
        .from('users')
        .select('current_workspace_id')
        .eq('id', user.id)
        .single();

    // Get current subscription
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*, subscription_plans(*), payment_gateways(display_name)')
        .eq('workspace_id', profile?.current_workspace_id ?? '')
        .eq('status', 'active')
        .single();

    // Get workspace credits
    const { data: workspace } = await supabase
        .from('workspaces')
        .select('credit_count')
        .eq('id', profile?.current_workspace_id ?? '')
        .single();

    // Get payment preference
    const { data: preference } = await supabase
        .from('user_payment_preferences')
        .select('*, payment_gateways(id, display_name)')
        .eq('user_id', user.id)
        .single();

    // Get active gateways
    const { data: gateways } = await supabase
        .from('payment_gateways')
        .select('id, display_name')
        .eq('is_active', true);

    // Get recent transactions
    const { data: transactions } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Current Plan */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Current Plan</CardTitle>
                            <CardDescription>Manage your subscription</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {subscription ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-2xl font-bold">{subscription.subscription_plans.display_name}</h3>
                                            <p className="text-muted-foreground">
                                                {subscription.subscription_plans.monthly_credits.toLocaleString()} credits/month
                                            </p>
                                        </div>
                                        <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                                            {subscription.status}
                                        </Badge>
                                    </div>

                                    {subscription.subscription_plans.price > 0 && (
                                        <div className="text-sm text-muted-foreground">
                                            <p>Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}</p>
                                            <p>Payment via: {subscription.payment_gateways?.display_name || 'N/A'}</p>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Link href="/pricing">
                                            <Button variant="outline">Change Plan</Button>
                                        </Link>
                                        {subscription.subscription_plans.price > 0 && (
                                            <Button variant="destructive" disabled>Cancel Subscription</Button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-muted-foreground mb-4">No active subscription</p>
                                    <Link href="/pricing">
                                        <Button>View Plans</Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment History</CardTitle>
                            <CardDescription>Recent transactions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {transactions && transactions.length > 0 ? (
                                <div className="space-y-3">
                                    {transactions.map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                            <div>
                                                <p className="font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(tx.created_at).toLocaleDateString()}
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

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Credit Balance */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Credit Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center">
                                <p className="text-4xl font-bold">{workspace?.credit_count?.toLocaleString() || 0}</p>
                                <p className="text-sm text-muted-foreground mt-2">Available Credits</p>
                                <Link href="/pricing#credits">
                                    <Button className="w-full mt-4" variant="outline">Buy More Credits</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Gateway Preference */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Gateway</CardTitle>
                            <CardDescription>Your preferred payment method</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {gateways?.map((gateway) => (
                                    <div key={gateway.id} className="flex items-center justify-between">
                                        <span>{gateway.display_name}</span>
                                        {preference?.preferred_gateway_id === gateway.id && (
                                            <Badge>Active</Badge>
                                        )}
                                    </div>
                                ))}
                                <Button variant="outline" className="w-full" disabled>
                                    Change Gateway
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
