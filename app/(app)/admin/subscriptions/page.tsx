'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export default function AdminSubscriptionsPage() {
    const { toast } = useToast();
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchSubscriptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);

    const fetchSubscriptions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                ...(statusFilter !== 'all' && { status: statusFilter }),
            });

            const response = await fetch(`/api/admin/subscriptions?${params.toString()}`);
            const data = await response.json();

            if (response.ok) {
                setSubscriptions(data.subscriptions || []);
            } else {
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to fetch subscriptions',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch subscriptions',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const formatPeriod = (sub: any) => {
        if (!sub.current_period_start && !sub.current_period_end) return '-';
        const start = sub.current_period_start
            ? new Date(sub.current_period_start).toLocaleDateString()
            : '-';
        const end = sub.current_period_end
            ? new Date(sub.current_period_end).toLocaleDateString()
            : '-';
        return `${start} - ${end}`;
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Subscriptions</h1>
                    <p className="text-muted-foreground">
                        Monitor all workspace subscriptions
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="w-48">
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="canceled">Canceled</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Subscriptions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Subscriptions</CardTitle>
                    <CardDescription>
                        All subscriptions across all workspaces
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : subscriptions.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Workspace</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Gateway</TableHead>
                                    <TableHead>Price</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subscriptions.map((sub) => (
                                    <TableRow key={sub.id}>
                                        <TableCell>
                                            {sub.workspaces?.name || sub.workspace_id}
                                        </TableCell>
                                        <TableCell>
                                            {sub.subscription_plans?.display_name || sub.plan_id}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    sub.status === 'active'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {sub.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatPeriod(sub)}</TableCell>
                                        <TableCell>
                                            {sub.payment_gateways?.display_name || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {sub.subscription_plans?.price
                                                ? `Rp ${sub.subscription_plans.price.toLocaleString(
                                                      'id-ID'
                                                  )}/month`
                                                : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No subscriptions found</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}