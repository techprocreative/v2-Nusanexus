import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlanForm } from '@/components/admin/plan-form';
import { ArrowLeft } from 'lucide-react';

export default async function NewPlanPage() {
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
                <Link href="/admin/plans">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Plans
                </Link>
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Create New Plan</CardTitle>
                </CardHeader>
                <CardContent>
                    <PlanForm />
                </CardContent>
            </Card>
        </div>
    );
}