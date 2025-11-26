'use client';

import { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

interface AdminSubscription {
    id: string;
    workspace_id: string;
    plan_id: string | null;
    status: string;
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean | null;
    created_at: string;
    subscription_plans?: {
        id: string;
        display_name: string;
        price: number;
    } | null;
    workspace?: {
        name: string;
    } | null;
}

export default function AdminSubscriptionsPage() {
    const { toast } = useToast();

    const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [workspaceIdFilter, setWorkspaceIdFilter] = useState('');
    const [planIdFilter, setPlanIdFilter] = useState('');

    const fetchSubscriptions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter && statusFilter !== 'all') {
                params.set('status', statusFilter);
            }
            if (workspaceIdFilter) {
                params.set('workspaceId', workspaceIdFilter);
            }
            if (planIdFilter) {
                params.set('planId', planIdFilter);
            }

            const res = await fetch(`/api/admin/subscriptions?${params.toString()}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to load subscriptions');
            }

            setSubscriptions(data.subscriptions || []);
        } catch (error: any) {
            console.error('Error loading subscriptions:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to load subscriptions',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);

    const handleToggleCancelAtPeriodEnd = async (subscription: AdminSubscription) => {
        const newValue = !subscription.cancel_at_period_end;
        try {
            const res = await fetch(`/api/admin/subscriptions/${subscription.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cancel_at_period_end: newValue }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update subscription');
            }
            toast({
                title: 'Updated',
                description: newValue
                    ? 'Subscription will be canceled at the end of the period.'
                    : 'Subscription cancellation has been revoked.',
            });
            fetchSubscriptions();
        } catch (error: any) {
            console.error('Error updating subscription:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update subscription',
                variant: 'destructive',
            });
        }
    };

    const statusVariant = (status: string) => {
        switch (status) {
            case 'active':
                return 'default';
            case 'pending':
            case 'trialing':
                return 'secondary';
            case 'canceled':
            case 'expired':
            case 'ended':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Subscriptions</h1>
                <p className="text-muted-foreground">
                    View and manage workspace subscriptions.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>Filter subscriptions by status or IDs.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="canceled">Canceled</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                                <SelectItem value="ended">Ended</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Workspace ID</label>
                        <Input
                            value={workspaceIdFilter}
                            onChange={(e) => setWorkspaceIdFilter(e.target.value)}
                            placeholder="Filter by workspace id"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Plan ID</label>
                        <Input
                            value={planIdFilter}
                            onChange={(e) => setPlanIdFilter(e.target.value)}
                            placeholder="Filter by plan id"
                        />
                    </div>
                    <div className="md:col-span-3 flex justify-end">
                        <Button onClick={fetchSubscriptions} disabled={loading}>
                            Apply Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>All Subscriptions</CardTitle>
                    <CardDescription>
                        Latest subscriptions across all workspaces.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {subscriptions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No subscriptions found.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {subscriptions.map((sub) => (
                                <div
                                    key={sub.id}
                                    className="flex flex-col md:flex-row md:items-center md:justify-between border rounded-lg p-3 gap-3"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold">
                                                {sub.subscription_plans?.display_name || 'Unknown plan'}
                                            </p>
                                            <Badge variant={statusVariant(sub.status)}>
                                                {sub.status}
                                            </Badge>
                                            {sub.cancel_at_period_end && (
                                                <Badge variant="outline" className="text-xs">
                                                    Cancel at period end
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Workspace:{' '}
                                            <Link
                                                href={`/admin/workspaces/${sub.workspace_id}`}
                                                className="underline underline-offset-2"
                                            >
                                                {sub.workspace?.name || sub.workspace_id}
                                            </Link>
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Current period:{' '}
                                            {sub.current_period_start
                                                ? new Date(
                                                      sub.current_period_start
                                                  ).toLocaleDateString()
                                                : 'N/A'}{' '}
                                            -{' '}
                                            {sub.current_period_end
                                                ? new Date(sub.current_period_end).toLocaleDateString()
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleToggleCancelAtPeriodEnd(sub)}
                                        >
                                            {sub.cancel_at_period_end
                                                ? 'Resume'
                                                : 'Cancel at period end'}
                                        </Button>
                                        <Link href={`/admin/workspaces/${sub.workspace_id}`}>
                                            <Button variant="ghost" size="sm">
                                                View workspace
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}