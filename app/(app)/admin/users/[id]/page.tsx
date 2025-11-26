'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function AdminUserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [user, setUser] = useState<any>(null);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creditAdjustment, setCreditAdjustment] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchUserDetails();
    }, [params.id]);

    const fetchUserDetails = async () => {
        try {
            const response = await fetch(`/api/admin/users/${params.id}`);
            const data = await response.json();

            if (response.ok) {
                setUser(data.user);
                setSubscriptions(data.subscriptions || []);
                setTransactions(data.transactions || []);
            } else {
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to fetch user details',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch user details',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async () => {
        setProcessing(true);
        try {
            const newStatus = user.status === 'active' ? 'suspended' : 'active';
            const response = await fetch(`/api/admin/users/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: `User ${newStatus === 'active' ? 'activated' : 'suspended'}`,
                });
                fetchUserDetails();
            } else {
                throw new Error('Failed to update status');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update user status',
                variant: 'destructive',
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleCreditAdjustment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!creditAdjustment || !user?.current_workspace_id) return;

        setProcessing(true);
        try {
            const amount = parseInt(creditAdjustment);
            const response = await fetch(`/api/admin/users/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creditAdjustment: amount,
                    workspaceId: user.current_workspace_id,
                }),
            });

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: `Credits ${amount > 0 ? 'added' : 'deducted'}`,
                });
                setCreditAdjustment('');
                fetchUserDetails();
            } else {
                throw new Error('Failed to adjust credits');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to adjust credits',
                variant: 'destructive',
            });
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-12 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <div className="container mx-auto py-12">User not found</div>;
    }

    return (
        <div className="container mx-auto py-8">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
            </Button>

            <h1 className="text-3xl font-bold mb-8">User Details</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Name</Label>
                                    <p className="font-medium">{user.name || 'No name'}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Email</Label>
                                    <p className="font-medium">{user.email}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <div>
                                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                                            {user.status}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Role</Label>
                                    <div>
                                        <Badge variant="outline">{user.role}</Badge>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Workspace</Label>
                                    <p className="font-medium">{user.workspaces?.name || 'No workspace'}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Credits</Label>
                                    <p className="font-medium">{user.workspaces?.credit_count?.toLocaleString() || 0}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Created</Label>
                                    <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Last Login</Label>
                                    <p className="font-medium">
                                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Subscriptions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Subscriptions</CardTitle>
                            <CardDescription>User's subscription history</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {subscriptions.length > 0 ? (
                                <div className="space-y-3">
                                    {subscriptions.map((sub) => (
                                        <div key={sub.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                            <div>
                                                <p className="font-medium">{sub.subscription_plans?.display_name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {sub.subscription_plans?.monthly_credits} credits/month
                                                </p>
                                            </div>
                                            <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                                                {sub.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-6">No subscriptions</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Transactions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Transactions</CardTitle>
                            <CardDescription>Last 10 payment transactions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {transactions.length > 0 ? (
                                <div className="space-y-3">
                                    {transactions.map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                            <div>
                                                <p className="font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                                                <p className="text-sm text-muted-foreground">
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
                                <p className="text-center text-muted-foreground py-6">No transactions</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                variant={user.status === 'active' ? 'destructive' : 'default'}
                                className="w-full"
                                onClick={handleStatusToggle}
                                disabled={processing}
                            >
                                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {user.status === 'active' ? 'Suspend User' : 'Activate User'}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Credit Adjustment</CardTitle>
                            <CardDescription>Add or remove credits</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreditAdjustment} className="space-y-3">
                                <div>
                                    <Label>Amount</Label>
                                    <Input
                                        type="number"
                                        placeholder="Enter amount (+ or -)"
                                        value={creditAdjustment}
                                        onChange={(e) => setCreditAdjustment(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Use positive for adding, negative for removing
                                    </p>
                                </div>
                                <Button type="submit" className="w-full" disabled={processing || !creditAdjustment}>
                                    {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Adjust Credits
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
