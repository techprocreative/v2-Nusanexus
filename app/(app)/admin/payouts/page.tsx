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
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function AdminPayoutsPage() {
    const { toast } = useToast();
    const [payouts, setPayouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('pending');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        fetchPayouts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);

    const fetchPayouts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter && statusFilter !== 'all') {
                params.set('status', statusFilter);
            }

            const response = await fetch(`/api/admin/payouts?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch payouts');
            }

            setPayouts(data.payouts || []);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        setUpdatingId(id);
        try {
            const response = await fetch('/api/admin/payouts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update payout status');
            }

            toast({
                title: 'Status diperbarui',
                description: `Payout diubah menjadi ${status}.`,
            });

            await fetchPayouts();
        } catch (error: any) {
            toast({
                title: 'Gagal memperbarui',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setUpdatingId(null);
        }
    };

    const formatCurrency = (amount: number | null | undefined) =>
        `Rp ${(amount || 0).toLocaleString('id-ID')}`;

    return (
        <div className="container mx-auto py-8">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Payouts</h1>
                    <p className="text-sm text-muted-foreground">
                        Kelola permintaan pencairan komisi dari affiliates.
                    </p>
                </div>
            </div>

            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="w-48">
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Filter status
                            </label>
                            <Select
                                value={statusFilter}
                                onValueChange={(value) => setStatusFilter(value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="all">Semua</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Payouts</CardTitle>
                    <CardDescription>
                        {payouts.length} payout ditemukan untuk filter saat ini.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : payouts.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            Belum ada payout untuk filter ini.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Affiliate</TableHead>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Jumlah</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payouts.map((payout) => (
                                    <TableRow key={payout.id}>
                                        <TableCell className="text-sm">
                                            {payout.affiliates?.profiles
                                                ? `${payout.affiliates.profiles.first_name || ''} ${
                                                      payout.affiliates.profiles.last_name || ''
                                                  }`.trim() || payout.affiliates.user_id
                                                : payout.affiliates?.user_id || '-'}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {payout.affiliates?.code || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {formatCurrency(payout.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    payout.status === 'completed'
                                                        ? 'default'
                                                        : payout.status === 'pending'
                                                        ? 'secondary'
                                                        : 'outline'
                                                }
                                                className="capitalize"
                                            >
                                                {payout.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(
                                                payout.created_at
                                            ).toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-2">
                                                {['processing', 'completed', 'rejected'].map(
                                                    (status) => (
                                                        <Button
                                                            key={status}
                                                            size="xs"
                                                            variant="outline"
                                                            disabled={updatingId === payout.id}
                                                            onClick={() =>
                                                                updateStatus(payout.id, status)
                                                            }
                                                        >
                                                            {updatingId === payout.id ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                status
                                                            )}
                                                        </Button>
                                                    )
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}