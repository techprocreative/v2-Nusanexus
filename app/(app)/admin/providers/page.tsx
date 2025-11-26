import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProviderList } from '@/components/admin/provider-list';
import { Plus } from 'lucide-react';

export default async function ProvidersPage() {
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

    // Fetch providers with API key status
    const { data: providers } = await supabase
        .from('ai_providers')
        .select('id, name, display_name, type, base_url, status, priority, api_key_encrypted')
        .order('type', { ascending: true })
        .order('priority', { ascending: true });

    // Transform data to include has_api_key flag
    const providersWithKeyStatus = providers?.map((p: any) => ({
        id: p.id,
        name: p.name,
        display_name: p.display_name,
        type: p.type,
        base_url: p.base_url,
        status: p.status,
        priority: p.priority,
        has_api_key: !!p.api_key_encrypted,
    })) || [];

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">AI Providers</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage AI provider configurations and API keys
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/providers/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Provider
                    </Link>
                </Button>
            </div>

            <div className="bg-card rounded-lg border p-6">
                <ProviderList providers={providersWithKeyStatus} />
            </div>
        </div>
    );
}
