import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditPackageForm } from '@/components/admin/credit-package-form';
import { ArrowLeft } from 'lucide-react';

export default async function NewCreditPackagePage() {
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
                    <CardTitle>Create New Credit Package</CardTitle>
                </CardHeader>
                <CardContent>
                    <CreditPackageForm />
                </CardContent>
            </Card>
        </div>
    );
}