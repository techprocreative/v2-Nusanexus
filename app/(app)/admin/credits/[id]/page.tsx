import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditPackageForm } from '@/components/admin/credit-package-form';
import { ArrowLeft } from 'lucide-react';

export default async function EditCreditPackagePage({
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

    const { data: pkg } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!pkg) {
        notFound();
    }

    return (
        <div className="container mx-auto py-8">
            <Button variant="ghost" asChild className="mb-4">
                <Link href="/admin/credits">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Credit Packages
                </Link>
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Edit Credit Package</CardTitle>
                </CardHeader>
                <CardContent>
                    <CreditPackageForm
                        isEdit
                        pkg={{
                            id: pkg.id,
                            name: pkg.name,
                            credits: pkg.credits,
                            price: pkg.price,
                            discount_percentage: pkg.discount_percentage,
                            is_active: pkg.is_active,
                            sort_order: pkg.sort_order,
                        }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}