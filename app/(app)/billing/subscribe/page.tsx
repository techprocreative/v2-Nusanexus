'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2, Clock } from 'lucide-react';

export default function SubscribePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const planId = searchParams.get('plan');

    const [plan, setPlan] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (planId) {
            fetchPlan();
        }
    }, [planId]);

    const fetchPlan = async () => {
        try {
            const response = await fetch('/api/billing/plans');
            const data = await response.json();
            const selectedPlan = data.plans?.find((p: any) => p.id === planId);
            setPlan(selectedPlan);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load plan details',
                variant: 'destructive',
            });
        }
    };

    const handleSubscribe = async () => {
        setProcessing(true);

        try {
            const response = await fetch('/api/billing/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Subscription failed');
            }

            if (data.requiresPayment) {
                // Redirect to payment URL
                if (data.paymentUrl) {
                    window.location.href = data.paymentUrl;
                } else if (data.snapToken) {
                    // For Midtrans Snap
                    // @ts-ignore
                    window.snap.pay(data.snapToken, {
                        onSuccess: () => {
                            router.push('/settings/billing?success=true');
                        },
                        onPending: () => {
                            router.push('/settings/billing?pending=true');
                        },
                        onError: () => {
                            toast({
                                title: 'Payment Failed',
                                description: 'Please try again',
                                variant: 'destructive',
                            });
                        },
                    });
                }
            } else {
                // Free plan activated
                toast({
                    title: 'Success!',
                    description: 'Free plan activated',
                });
                router.push('/settings/billing');
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setProcessing(false);
        }
    };

    if (!plan) {
        return (
            <div className="container mx-auto py-12 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const features = Array.isArray(plan.features) ? plan.features : [];

    return (
        <div className="container mx-auto py-12 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Subscribe to {plan.display_name}</CardTitle>
                    <CardDescription>Confirm your subscription details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Plan Details */}
                    <div className="border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-bold">{plan.display_name}</h3>
                            <div className="text-right">
                                <p className="text-3xl font-bold">
                                    {plan.price === 0 ? 'Free' : `Rp ${plan.price.toLocaleString('id-ID')}`}
                                </p>
                                {plan.price > 0 && <p className="text-sm text-muted-foreground">/month</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                <span className="font-medium">{plan.monthly_credits.toLocaleString()} credits/month</span>
                            </div>
                            {features.map((feature: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Info */}
                    {plan.price > 0 && (
                        <div className="bg-muted rounded-lg p-4">
                            <div className="flex items-start gap-2">
                                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium">Payment Instructions</p>
                                    <p className="text-muted-foreground mt-1">
                                        After clicking subscribe, you'll be redirected to complete your payment.
                                        Your subscription will be activated once payment is confirmed.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => router.back()}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleSubscribe}
                            disabled={processing}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Subscribe Now'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
