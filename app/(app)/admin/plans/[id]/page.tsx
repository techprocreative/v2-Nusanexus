import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlanForm } from '@/components/admin/plan-form';
import { ArrowLeft } from 'lucide-react';

export default async function EditPlanPage({
    params,
}: {
    params: { id: string };
}) {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        redirect('/dashboard');
    }

    const { data: plan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!plan) {
        notFound();
    }

    return (
        <div className="container mx-auto py-8">
            <Button variant="ghost" asChild className="mb-4">
                <Link href="/admin/plans">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Plans
                </Link>
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Edit Plan</CardTitle>
                </CardHeader>
                <CardContent>
                    <PlanForm
                        isEdit
                        plan={{
                            id: plan.id,
                            name: plan.name,
                            display_name: plan.display_name,
                            monthly_credits: plan.monthly_credits,
                            price: plan.price,
                            features: Array.isArray(plan.features)
                                ? plan.features
                                : [],
                            is_active: plan.is_active,
                            sort_order: plan.sort_order,
                        }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}