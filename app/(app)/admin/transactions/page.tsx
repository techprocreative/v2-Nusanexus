'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export default function AdminTransactionsPage() {
    const { toast } = useToast();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchTransactions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, page]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                ...(statusFilter !== 'all' && { status: statusFilter }),
            });

            const response = await fetch(`/api/admin/transactions?${params}`);
            const data = await response.json();

            if (response.ok) {
                setTransactions(data.transactions || []);
            } else {
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to fetch transactions',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch transactions',
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
                    <h1 className="text-3xl font-bold">Transaction Monitoring</h1>
                    <p className="text-muted-foreground">Monitor all payment transactions</p>
                </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="w-48">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                    <CardDescription>All payment transactions in the system</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : transactions.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Gateway</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="font-mono text-xs">
                                            {tx.id.substring(0, 8)}...
                                        </TableCell>
                                        <TableCell className="capitalize">
                                            {tx.type.replace('_', ' ')}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            Rp {tx.amount.toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell>
                                            {tx.payment_gateways?.display_name || 'N/A'}
                                        </TableCell>
                                        <TableCell>
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
                                        </TableCell>
                                        <TableCell>
                                            {new Date(tx.created_at).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No transactions found</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
