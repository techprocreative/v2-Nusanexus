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

export default function AdminAffiliatesPage() {
    const { toast } = useToast();
    const [affiliates, setAffiliates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active'>('all');

    useEffect(() => {
        fetchAffiliates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);

    const fetchAffiliates = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter === 'active') {
                params.set('status', 'active');
            }

            const response = await fetch(`/api/admin/affiliates?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch affiliates');
            }

            setAffiliates(data.affiliates || []);
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

    const formatCurrency = (amount: number | null | undefined) =>
        `Rp ${(amount || 0).toLocaleString('id-ID')}`;

    return (
        <div className="container mx-auto py-8">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Affiliates</h1>
                    <p className="text-sm text-muted-foreground">
                        Lihat dan kelola mitra referral Nusanexus.
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
                                onValueChange={(value: 'all' | 'active') =>
                                    setStatusFilter(value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="active">Aktif</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Affiliates</CardTitle>
                    <CardDescription>
                        {affiliates.length} affiliate terdaftar di sistem.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : affiliates.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            Belum ada affiliate yang terdaftar.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Click</TableHead>
                                    <TableHead>Referral</TableHead>
                                    <TableHead>Saldo</TableHead>
                                    <TableHead>Pending</TableHead>
                                    <TableHead>Withdrawn</TableHead>
                                    <TableHead>Metode</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {affiliates.map((aff) => (
                                    <TableRow key={aff.id}>
                                        <TableCell className="text-sm">
                                            {aff.profiles
                                                ? `${aff.profiles.first_name || ''} ${
                                                      aff.profiles.last_name || ''
                                                  }`.trim() || aff.user_id
                                                : aff.user_id}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {aff.code}
                                        </TableCell>
                                        <TableCell>{aff.click_count}</TableCell>
                                        <TableCell>{aff.referral_count}</TableCell>
                                        <TableCell>{formatCurrency(aff.balance_amount)}</TableCell>
                                        <TableCell>{formatCurrency(aff.pending_amount)}</TableCell>
                                        <TableCell>
                                            {formatCurrency(aff.withdrawn_amount)}
                                        </TableCell>
                                        <TableCell>
                                            {aff.payout_method ? (
                                                <Badge variant="outline" className="capitalize">
                                                    {aff.payout_method === 'bank_transfer'
                                                        ? 'Bank transfer'
                                                        : 'PayPal'}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    Belum diatur
                                                </span>
                                            )}
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