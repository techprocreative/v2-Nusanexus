'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, LinkIcon, Wallet, ArrowRight } from 'lucide-react';

interface Affiliate {
    id: string;
    user_id: string;
    code: string;
    payout_method: 'paypal' | 'bank_transfer' | null;
    paypal_email: string | null;
    bank_requisites: string | null;
    click_count: number;
    referral_count: number;
    balance_amount: number;
    pending_amount: number;
    withdrawn_amount: number;
    created_at: string;
}

interface Payout {
    id: string;
    amount: number;
    status: 'pending' | 'processing' | 'completed' | 'rejected';
    notes: string | null;
    created_at: string;
}

export default function AffiliatePage() {
    const { toast } = useToast();
    const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [requestingPayout, setRequestingPayout] = useState(false);

    const [payoutMethod, setPayoutMethod] = useState<'paypal' | 'bank_transfer' | ''>('');
    const [paypalEmail, setPaypalEmail] = useState('');
    const [bankRequisites, setBankRequisites] = useState('');
    const [payoutAmount, setPayoutAmount] = useState('');

    const searchParams = useSearchParams();

    const referralLink = useMemo(() => {
        if (!affiliate) return '';
        const baseUrl =
            typeof window !== 'undefined'
                ? window.location.origin
                : process.env.NEXT_PUBLIC_APP_URL || '';
        return `${baseUrl}/signup?ref=${affiliate.code}`;
    }, [affiliate]);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [affRes, payoutRes] = await Promise.all([
                fetch('/api/affiliate'),
                fetch('/api/affiliate/payouts'),
            ]);

            const affData = await affRes.json();
            const payoutData = await payoutRes.json();

            if (affRes.ok) {
                setAffiliate(affData.affiliate);
                if (affData.affiliate) {
                    setPayoutMethod(
                        (affData.affiliate.payout_method as 'paypal' | 'bank_transfer') || ''
                    );
                    setPaypalEmail(affData.affiliate.paypal_email || '');
                    setBankRequisites(affData.affiliate.bank_requisites || '');
                }
            } else if (affData.error) {
                toast({
                    title: 'Error',
                    description: affData.error,
                    variant: 'destructive',
                });
            }

            if (payoutRes.ok) {
                setPayouts(payoutData.payouts || []);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load affiliate data',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAffiliate = async () => {
        setCreating(true);
        try {
            const response = await fetch('/api/affiliate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to activate affiliate program');
            }

            setAffiliate(data.affiliate);
            toast({
                title: 'Program referral aktif',
                description: 'Kamu sekarang punya kode referral sendiri.',
            });
        } catch (error: any) {
            toast({
                title: 'Gagal mengaktifkan',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setCreating(false);
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!affiliate) return;

        setSavingSettings(true);
        try {
            const response = await fetch('/api/affiliate', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payout_method: payoutMethod || null,
                    paypal_email: payoutMethod === 'paypal' ? paypalEmail : null,
                    bank_requisites: payoutMethod === 'bank_transfer' ? bankRequisites : null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save settings');
            }

            setAffiliate(data.affiliate);
            toast({
                title: 'Pengaturan disimpan',
                description: 'Metode payout berhasil diperbarui.',
            });
        } catch (error: any) {
            toast({
                title: 'Gagal menyimpan',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setSavingSettings(false);
        }
    };

    const handleRequestPayout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!affiliate) return;

        const amount = parseInt(payoutAmount || '0', 10);
        if (!amount || amount <= 0) {
            toast({
                title: 'Nominal tidak valid',
                description: 'Masukkan jumlah payout yang ingin kamu tarik.',
                variant: 'destructive',
            });
            return;
        }

        if (amount > (affiliate.balance_amount || 0)) {
            toast({
                title: 'Saldo tidak cukup',
                description: 'Jumlah yang kamu minta melebihi saldo tersedia.',
                variant: 'destructive',
            });
            return;
        }

        setRequestingPayout(true);
        try {
            const response = await fetch('/api/affiliate/payouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to request payout');
            }

            setPayoutAmount('');
            await fetchData();
            toast({
                title: 'Payout diminta',
                description: 'Permintaan payout kamu sudah dikirim ke tim kami.',
            });
        } catch (error: any) {
            toast({
                title: 'Gagal mengajukan payout',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setRequestingPayout(false);
        }
    };

    const handleCopyLink = async () => {
        if (!referralLink) return;
        try {
            await navigator.clipboard.writeText(referralLink);
            toast({
                title: 'Tautan disalin',
                description: 'Referral link kamu sudah disalin ke clipboard.',
            });
        } catch {
            toast({
                title: 'Gagal menyalin',
                description: 'Silakan salin tautan secara manual.',
                variant: 'destructive',
            });
        }
    };

    const formatCurrency = (amount: number | null | undefined) =>
        `Rp ${(amount || 0).toLocaleString('id-ID')}`;

    if (loading) {
        return (
            <div className="container mx-auto flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container mx-auto space-y-8 py-8">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Program Referral</h1>
                    <p className="text-sm text-muted-foreground">
                        Ajak teman dan klien menggunakan Nusanexus, dapatkan komisi dari setiap
                        pembayaran mereka.
                    </p>
                </div>
                <Badge variant="outline" className="flex items-center gap-2">
                    <Wallet className="h-3.5 w-3.5" />
                    <span className="text-xs">
                        Saldo: {formatCurrency(affiliate?.balance_amount)}
                    </span>
                </Badge>
            </div>

            {!affiliate ? (
                <Card className="max-w-xl">
                    <CardHeader>
                        <CardTitle>Aktifkan program referral kamu</CardTitle>
                        <CardDescription>
                            Dapatkan kode dan link referral unik. Setiap pengguna berbayar yang
                            mendaftar melalui kamu akan menambah saldo komisi.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={handleCreateAffiliate}
                            disabled={creating}
                            className="w-full"
                        >
                            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Aktifkan Program Referral
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
                    {/* Left column: link & stats */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Link referral kamu</CardTitle>
                                <CardDescription>
                                    Bagikan link ini ke teman, follower, atau klien. Setiap orang
                                    yang mendaftar dan berlangganan melalui link ini akan tercatat
                                    sebagai referral kamu.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase text-muted-foreground">
                                        Referral link
                                    </Label>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <Input
                                            readOnly
                                            value={referralLink}
                                            className="font-mono text-xs"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="shrink-0"
                                            onClick={handleCopyLink}
                                        >
                                            <LinkIcon className="mr-2 h-4 w-4" />
                                            Copy
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-3">
                                    <StatBox
                                        label="Klik"
                                        value={affiliate.click_count}
                                        helper="Total orang yang membuka link kamu"
                                    />
                                    <StatBox
                                        label="Referral"
                                        value={affiliate.referral_count}
                                        helper="Pengguna yang mendaftar via kamu"
                                    />
                                    <StatBox
                                        label="Total Ditarik"
                                        value={formatCurrency(affiliate.withdrawn_amount)}
                                        helper="Komisi yang sudah dibayarkan"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payouts history */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Riwayat payout</CardTitle>
                                <CardDescription>
                                    Pantau permintaan payout yang pernah kamu ajukan.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {payouts.length === 0 ? (
                                    <p className="py-4 text-sm text-muted-foreground">
                                        Belum ada payout yang diajukan.
                                    </p>
                                ) : (
                                    <div className="space-y-3 text-sm">
                                        {payouts.map((payout) => (
                                            <div
                                                key={payout.id}
                                                className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
                                            >
                                                <div>
                                                    <p className="font-medium">
                                                        {formatCurrency(payout.amount)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(
                                                            payout.created_at
                                                        ).toLocaleString('id-ID')}
                                                    </p>
                                                    {payout.notes && (
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            Catatan: {payout.notes}
                                                        </p>
                                                    )}
                                                </div>
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
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right column: payout settings & request */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pengaturan payout</CardTitle>
                                <CardDescription>
                                    Atur bagaimana kamu ingin menerima komisi referral.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSaveSettings} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm">Metode payout</Label>
                                        <div className="flex flex-col gap-2 text-sm">
                                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2">
                                                <input
                                                    type="radio"
                                                    className="h-4 w-4"
                                                    checked={payoutMethod === 'bank_transfer'}
                                                    onChange={() =>
                                                        setPayoutMethod('bank_transfer')
                                                    }
                                                />
                                                <span>Transfer bank</span>
                                            </label>
                                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2">
                                                <input
                                                    type="radio"
                                                    className="h-4 w-4"
                                                    checked={payoutMethod === 'paypal'}
                                                    onChange={() => setPayoutMethod('paypal')}
                                                />
                                                <span>PayPal</span>
                                            </label>
                                        </div>
                                    </div>

                                    {payoutMethod === 'bank_transfer' && (
                                        <div className="space-y-2">
                                            <Label>Detail rekening bank</Label>
                                            <Textarea
                                                value={bankRequisites}
                                                onChange={(e) =>
                                                    setBankRequisites(e.target.value)
                                                }
                                                rows={4}
                                                placeholder="Contoh: BCA – 1234567890 a.n. Nama Kamu"
                                            />
                                        </div>
                                    )}

                                    {payoutMethod === 'paypal' && (
                                        <div className="space-y-2">
                                            <Label>Alamat email PayPal</Label>
                                            <Input
                                                type="email"
                                                value={paypalEmail}
                                                onChange={(e) =>
                                                    setPaypalEmail(e.target.value)
                                                }
                                                placeholder="email@paypal.com"
                                            />
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={savingSettings || !payoutMethod}
                                    >
                                        {savingSettings && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Simpan pengaturan
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Ajukan payout</CardTitle>
                                <CardDescription>
                                    Tarik komisi yang sudah terkumpul ke rekening atau PayPal kamu.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleRequestPayout} className="space-y-3">
                                    <div className="space-y-1">
                                        <Label>Saldo tersedia</Label>
                                        <p className="text-lg font-semibold">
                                            {formatCurrency(affiliate.balance_amount)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Menunggu proses: {formatCurrency(affiliate.pending_amount)}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Jumlah yang ingin ditarik (Rp)</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={payoutAmount}
                                            onChange={(e) => setPayoutAmount(e.target.value)}
                                            placeholder="Contoh: 100000"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Pastikan pengaturan payout sudah diisi dengan benar
                                            sebelum mengajukan.
                                        </p>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={
                                            requestingPayout ||
                                            !affiliate.balance_amount ||
                                            affiliate.balance_amount <= 0
                                        }
                                    >
                                        {requestingPayout && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Ajukan payout
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatBox({
    label,
    value,
    helper,
}: {
    label: string;
    value: string | number;
    helper: string;
}) {
    return (
        <div className="space-y-1 rounded-lg border bg-card p-3 text-xs">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p className="text-lg font-semibold text-foreground">{value}</p>
            <p className="text-[11px] text-muted-foreground">{helper}</p>
        </div>
    );
}