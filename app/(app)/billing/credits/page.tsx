'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface CreditPackage {
    id: string;
    name: string;
    credits: number;
    price: number;
    discount_percentage: number | null;
}

export default function BillingCreditsPage() {
    const searchParams = useSearchParams();
    const initialPackageId = searchParams.get('package');
    const { toast } = useToast();

    const [packages, setPackages] = useState<CreditPackage[]>([]);
    const [selectedPackageId, setSelectedPackageId] = useState<string | null>(initialPackageId);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPackages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            // Use public query from server components via pricing page instead of admin API
            const response = await fetch('/api/billing/credits');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load credit packages');
            }

            const list: CreditPackage[] = data.packages || [];
            setPackages(list);

            if (!selectedPackageId && list.length > 0) {
                setSelectedPackageId(list[0].id);
            }
        } catch (error: any) {
            console.error('Error loading credit packages:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to load credit packages',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        if (!selectedPackageId) {
            toast({
                title: 'Select a package',
                description: 'Please choose a credit package to purchase.',
                variant: 'destructive',
            });
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch('/api/billing/credits/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    packageId: selectedPackageId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create payment');
            }

            if (data.paymentUrl) {
                window.location.href = data.paymentUrl;
            } else {
                toast({
                    title: 'Payment created',
                    description: 'Follow the instructions from the payment gateway to complete your purchase.',
                });
            }
        } catch (error: any) {
            console.error('Error purchasing credits:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to start purchase flow',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Buy Credits</h1>
                <p className="text-muted-foreground">
                    Purchase one-time credit packages to top up your workspace balance.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Select a Credit Package</CardTitle>
                    <CardDescription>
                        Credits will be added to your current workspace once the payment is confirmed.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : packages.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No credit packages are available at the moment.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {packages.map((pkg) => {
                                const perCredit = pkg.price / pkg.credits;
                                const selected = selectedPackageId === pkg.id;
                                return (
                                    <button
                                        key={pkg.id}
                                        type="button"
                                        onClick={() => setSelectedPackageId(pkg.id)}
                                        className={`flex w-full items-center justify-between border rounded-lg p-3 text-left cursor-pointer hover:bg-muted ${
                                            selected ? 'border-primary bg-muted' : ''
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                                                    selected ? 'border-primary' : 'border-muted-foreground'
                                                }`}
                                            >
                                                {selected && (
                                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold">{pkg.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {pkg.credits.toLocaleString()} credits • Rp{' '}
                                                    {pkg.price.toLocaleString('id-ID')} ({'Rp '}
                                                    {Math.round(perCredit).toLocaleString('id-ID')} per credit)
                                                </div>
                                                {pkg.discount_percentage && pkg.discount_percentage > 0 && (
                                                    <div className="text-xs text-emerald-600">
                                                        Save {pkg.discount_percentage}% compared to base price
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button
                            onClick={handlePurchase}
                            disabled={submitting || loading || !selectedPackageId}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Redirecting to payment...
                                </>
                            ) : (
                                'Continue to Payment'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}