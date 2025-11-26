'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus } from 'lucide-react';

export default function AdminPlansPage() {
    const { toast } = useToast();
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/plans?include_inactive=true');
            const data = await response.json();

            if (response.ok) {
                setPlans(data.plans || []);
            } else {
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to fetch plans',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch plans',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Subscription Plans</h1>
                    <p className="text-muted-foreground">
                        Manage subscription plans shown on the pricing page
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/plans/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Plan
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Plans</CardTitle>
                    <CardDescription>
                        {plans.length > 0
                            ? `Total ${plans.length} plans (including inactive)`
                            : 'No plans found'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : plans.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Display Name</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Monthly Credits</TableHead>
                                    <TableHead>Active</TableHead>
                                    <TableHead>Sort</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {plans.map((plan) => (
                                    <TableRow key={plan.id}>
                                        <TableCell className="font-mono text-xs">
                                            {plan.name}
                                        </TableCell>
                                        <TableCell>{plan.display_name}</TableCell>
                                        <TableCell>
                                            {plan.price === 0
                                                ? 'Free'
                                                : `Rp ${plan.price.toLocaleString('id-ID')}/month`}
                                        </TableCell>
                                        <TableCell>
                                            {plan.monthly_credits.toLocaleString()} credits
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    plan.is_active ? 'default' : 'secondary'
                                                }
                                            >
                                                {plan.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{plan.sort_order}</TableCell>
                                        <TableCell>
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                            >
                                                <Link href={`/admin/plans/${plan.id}`}>
                                                    Edit
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No plans configured yet</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}