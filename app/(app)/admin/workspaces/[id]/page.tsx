'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function AdminWorkspaceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();

    const [workspace, setWorkspace] = useState<any>(null);
    const [owner, setOwner] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [creditAdjustment, setCreditAdjustment] = useState('');

    useEffect(() => {
        fetchWorkspace();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    const fetchWorkspace = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/workspaces/${params.id}`);
            const data = await response.json();

            if (response.ok) {
                setWorkspace(data.workspace);
                setOwner(data.owner);
                setMembers(data.members || []);
                setSubscriptions(data.subscriptions || []);
                setTransactions(data.transactions || []);
            } else {
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to fetch workspace details',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch workspace details',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreditAdjustment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!creditAdjustment) return;

        setProcessing(true);
        try {
            const amount = parseInt(creditAdjustment, 10);

            const response = await fetch(`/api/admin/workspaces/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creditAdjustment: amount,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: `Credits ${amount > 0 ? 'added' : 'deducted'}`,
                });
                setCreditAdjustment('');
                // refresh workspace data
                setWorkspace(data.workspace);
            } else {
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to adjust credits',
                    variant: 'destructive',
                });
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

    if (!workspace) {
        return <div className="container mx-auto py-12">Workspace not found</div>;
    }

    return (
        <div className="container mx-auto py-8">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Workspaces
            </Button>

            <h1 className="text-3xl font-bold mb-8">Workspace Details</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Workspace info, subscriptions, transactions */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Workspace Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Workspace Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Name</Label>
                                    <p className="font-medium">{workspace.name}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Workspace ID</Label>
                                    <p className="font-mono text-xs break-all">{workspace.id}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Owner</Label>
                                    <p className="font-medium">
                                        {owner
                                            ? `${owner.first_name || ''} ${owner.last_name || ''}`.trim() ||
                                              owner.id
                                            : 'No owner'}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Credits</Label>
                                    <p className="font-medium">
                                        {Number(workspace.credit_count ?? 0).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Trial Status</Label>
                                    <div>
                                        <Badge variant={workspace.is_trialed ? 'secondary' : 'outline'}>
                                            {workspace.is_trialed ? 'Trial' : 'Regular'}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Created</Label>
                                    <p className="font-medium">
                                        {workspace.created_at
                                            ? new Date(workspace.created_at).toLocaleDateString()
                                            : '-'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Members */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Members</CardTitle>
                            <CardDescription>Users in this workspace</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {members.length > 0 ? (
                                <div className="space-y-2">
                                    {members.map((member) => (
                                        <div
                                            key={member.user_id}
                                            className="flex items-center justify-between py-2 border-b last:border-0"
                                        >
                                            <div>
                                                <p className="font-mono text-xs break-all">
                                                    {member.user_id}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="uppercase">
                                                {member.role}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-4">
                                    No members found
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Subscriptions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Subscriptions</CardTitle>
                            <CardDescription>Subscription history for this workspace</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {subscriptions.length > 0 ? (
                                <div className="space-y-3">
                                    {subscriptions.map((sub) => (
                                        <div
                                            key={sub.id}
                                            className="flex items-center justify-between py-2 border-b last:border-0"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {sub.subscription_plans?.display_name || 'Unknown plan'}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {sub.subscription_plans?.monthly_credits || 0} credits/month
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {sub.current_period_start
                                                        ? new Date(
                                                              sub.current_period_start
                                                          ).toLocaleDateString()
                                                        : '-'}{' '}
                                                    -{' '}
                                                    {sub.current_period_end
                                                        ? new Date(
                                                              sub.current_period_end
                                                          ).toLocaleDateString()
                                                        : '-'}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={
                                                    sub.status === 'active' ? 'default' : 'secondary'
                                                }
                                            >
                                                {sub.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-4">
                                    No subscriptions found
                                </p>
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
                                        <div
                                            key={tx.id}
                                            className="flex items-center justify-between py-2 border-b last:border-0"
                                        >
                                            <div>
                                                <p className="font-medium capitalize">
                                                    {tx.type.replace('_', ' ')}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {tx.payment_gateways?.display_name || 'N/A'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(tx.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">
                                                    Rp {tx.amount.toLocaleString('id-ID')}
                                                </p>
                                                <Badge
                                                    variant={
                                                        tx.status === 'paid'
                                                            ? 'default'
                                                            : tx.status === 'pending'
                                                            ? 'secondary'
                                                            : 'destructive'
                                                    }
                                                >
                                                    {tx.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-4">
                                    No transactions found
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Actions */}
                <div className="space-y-6">
                    {/* Credit Adjustment */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Credit Adjustment</CardTitle>
                            <CardDescription>
                                Add or remove credits for this workspace
                            </CardDescription>
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
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={processing || !creditAdjustment}
                                >
                                    {processing ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
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