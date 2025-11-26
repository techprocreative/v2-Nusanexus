import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import Link from 'next/link';

export default async function PricingPage() {
    const supabase = createClient();

    const { data: plans } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

    const { data: packages } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

    return (
        <div className="container mx-auto py-12">
            {/* Subscription Plans */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Pricing Plans</h1>
                <p className="text-xl text-muted-foreground">
                    Choose the perfect plan for your AI needs
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {plans?.map((plan, index) => {
                    const features = Array.isArray(plan.features) ? plan.features : [];
                    const isPopular = plan.name === 'pro';

                    return (
                        <Card key={plan.id} className={`relative ${isPopular ? 'border-primary shadow-lg' : ''}`}>
                            {isPopular && (
                                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    Most Popular
                                </Badge>
                            )}
                            <CardHeader>
                                <CardTitle>{plan.display_name}</CardTitle>
                                <CardDescription>
                                    <div className="mt-4">
                                        <span className="text-4xl font-bold">
                                            {plan.price === 0 ? 'Free' : `Rp ${plan.price.toLocaleString('id-ID')}`}
                                        </span>
                                        {plan.price > 0 && <span className="text-muted-foreground">/month</span>}
                                    </div>
                                    <div className="mt-2 text-sm">
                                        {plan.monthly_credits.toLocaleString()} credits/month
                                    </div>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3 mb-6">
                                    {features.map((feature: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm">
                                            <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link href={plan.price === 0 ? '/dashboard' : `/billing/subscribe?plan=${plan.id}`}>
                                    <Button className="w-full" variant={isPopular ? 'default' : 'outline'}>
                                        {plan.price === 0 ? 'Get Started' : 'Subscribe Now'}
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Credit Packages */}
            <div id="credits" className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">One-Time Credit Packages</h2>
                <p className="text-muted-foreground">
                    Need extra credits? Purchase them anytime
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {packages?.map((pkg) => {
                    const perCredit = pkg.price / pkg.credits;
                    const isBestValue = pkg.name === 'Mega Pack';

                    return (
                        <Card key={pkg.id} className={isBestValue ? 'border-primary' : ''}>
                            {isBestValue && (
                                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="secondary">
                                    Best Value
                                </Badge>
                            )}
                            <CardHeader>
                                <CardTitle>{pkg.name}</CardTitle>
                                <CardDescription>
                                    <div className="mt-4">
                                        <span className="text-3xl font-bold">
                                            Rp {pkg.price.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-sm">
                                        {pkg.credits.toLocaleString()} credits
                                    </div>
                                    {pkg.discount_percentage > 0 && (
                                        <Badge variant="secondary" className="mt-2">
                                            Save {pkg.discount_percentage}%
                                        </Badge>
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground mb-4">
                                    Rp {Math.round(perCredit).toLocaleString()} per credit
                                </div>
                                <Link href={`/billing/credits?package=${pkg.id}`}>
                                    <Button className="w-full" variant={isBestValue ? 'default' : 'outline'}>
                                        Purchase Credits
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* FAQ Section */}
            <div className="mt-16 max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">How do credits work?</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            Credits are consumed based on the AI model you use. Basic models (GPT-3.5) use 1 credit per 1K tokens,
                            while advanced models (GPT-4 Turbo) use 5 credits per 1K tokens.
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Can I change my plan?</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            Yes! You can upgrade or downgrade your plan at any time from your billing settings.
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">What payment methods are supported?</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            We support Bank Transfer, E-Wallet (OVO, DANA, GoPay, ShopeePay), QRIS, and Credit Card via Tripay and Midtrans.
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
