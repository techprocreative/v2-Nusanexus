import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProviderForm } from '@/components/admin/provider-form';
import { ArrowLeft } from 'lucide-react';

export default async function NewProviderPage() {
    const supabase = createClient();

    // Check if user is admin
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        redirect('/dashboard');
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-6">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href="/admin/providers">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Providers
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">Add New Provider</h1>
                <p className="text-muted-foreground mt-1">
                    Configure a new AI provider with API credentials
                </p>
            </div>

            <div className="bg-card rounded-lg border p-6">
                <ProviderForm />
            </div>
        </div>
    );
}
