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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

interface AdminOrder {
    id: string;
    workspace_id: string;
    plan_snapshot_id: string;
    coupon_id: string | null;
    currency_code: string;
    is_paid: boolean;
    is_fulfilled: boolean;
    payment_gateway: string | null;
    external_id: string | null;
    total_amount: number;
    discount_amount: number;
    created_at: string;
    workspace?: {
        id: string;
        name: string;
    } | null;
    plan_snapshot?: {
        id: string;
        title: string;
    } | null;
    coupon?: {
        id: string;
        code: string;
    } | null;
}

export default function AdminOrdersPage() {
    const { toast } = useToast();

    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [isPaidFilter, setIsPaidFilter] = useState<string>('all');
    const [isFulfilledFilter, setIsFulfilledFilter] = useState<string>('all');
    const [workspaceIdFilter, setWorkspaceIdFilter] = useState('');

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (isPaidFilter !== 'all') {
                params.set('is_paid', isPaidFilter);
            }
            if (isFulfilledFilter !== 'all') {
                params.set('is_fulfilled', isFulfilledFilter);
            }
            if (workspaceIdFilter) {
                params.set('workspaceId', workspaceIdFilter);
            }

            const res = await fetch(`/api/admin/orders?${params.toString()}`);
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to load orders');
            }
            setOrders(data.orders || []);
        } catch (error: any) {
            console.error('Error loading orders:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to load orders',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleUpdateOrder = async (
        order: AdminOrder,
        updates: { is_paid?: boolean; is_fulfilled?: boolean }
    ) => {
        try {
            const res = await fetch(`/api/admin/orders/${order.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update order');
            }
            toast({ title: 'Order updated' });
            fetchOrders();
        } catch (error: any) {
            console.error('Error updating order:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update order',
                variant: 'destructive',
            });
        }
    };

    const paidVariant = (isPaid: boolean) => (isPaid ? 'default' : 'outline');
    const fulfilledVariant = (isFulfilled: boolean) =>
        isFulfilled ? 'default' : 'secondary';

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Orders</h1>
                <p className="text-muted-foreground">
                    View and manage subscription and one-time purchase orders.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>Filter orders by payment and fulfillment.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Paid</label>
                        <Select
                            value={isPaidFilter}
                            onValueChange={(value) => setIsPaidFilter(value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="true">Paid</SelectItem>
                                <SelectItem value="false">Unpaid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Fulfilled</label>
                        <Select
                            value={isFulfilledFilter}
                            onValueChange={(value) => setIsFulfilledFilter(value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="true">Fulfilled</SelectItem>
                                <SelectItem value="false">Unfulfilled</SelectItem>
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
                    <div className="flex items-end">
                        <Button onClick={fetchOrders} disabled={loading} className="w-full">
                            Apply Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>All Orders</CardTitle>
                    <CardDescription>
                        Latest orders from Stripe and local payment gateways.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {orders.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No orders found.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {orders.map((order) => (
                                <div
                                    key={order.id}
                                    className="flex flex-col md:flex-row md:items-center md:justify-between border rounded-lg p-3 gap-3"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold">
                                                {order.plan_snapshot?.title || 'Custom order'}
                                            </p>
                                            <Badge variant={paidVariant(order.is_paid)}>
                                                {order.is_paid ? 'Paid' : 'Unpaid'}
                                            </Badge>
                                            <Badge variant={fulfilledVariant(order.is_fulfilled)}>
                                                {order.is_fulfilled ? 'Fulfilled' : 'Unfulfilled'}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Workspace:{' '}
                                            <Link
                                                href={`/admin/workspaces/${order.workspace_id}`}
                                                className="underline underline-offset-2"
                                            >
                                                {order.workspace?.name || order.workspace_id}
                                            </Link>{' '}
                                            • Gateway:{' '}
                                            {order.payment_gateway || 'N/A'} • Created:{' '}
                                            {new Date(order.created_at).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Total: {order.currency_code}{' '}
                                            {(order.total_amount / 100).toLocaleString('id-ID')}{' '}
                                            {order.discount_amount > 0 &&
                                                `(discount ${(order.discount_amount / 100).toLocaleString('id-ID')})`}
                                        </p>
                                        {order.coupon && (
                                            <p className="text-xs text-muted-foreground">
                                                Coupon: {order.coupon.code}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!order.is_paid && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    handleUpdateOrder(order, { is_paid: true })
                                                }
                                            >
                                                Mark Paid
                                            </Button>
                                        )}
                                        {!order.is_fulfilled && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    handleUpdateOrder(order, {
                                                        is_fulfilled: true,
                                                    })
                                                }
                                            >
                                                Mark Fulfilled
                                            </Button>
                                        )}
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