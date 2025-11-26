import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProviderForm } from '@/components/admin/provider-form';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

export default async function EditProviderPage({
    params,
}: {
    params: { id: string };
}) {
    const supabase = createClient();

    // Check if user is admin
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

    // Fetch provider (without encrypted key for display)
    const { data: provider } = await supabase
        .from('ai_providers')
        .select('id, name, display_name, type, base_url, status, priority, config')
        .eq('id', params.id)
        .single();

    if (!provider) {
        notFound();
    }

    // Fetch models for this provider
    const { data: models } = await supabase
        .from('ai_models')
        .select('*')
        .eq('provider_id', params.id)
        .order('display_name', { ascending: true });

    return (
        <div className="container mx-auto py-8">
            <div className="mb-6">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href="/admin/providers">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Providers
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">Edit Provider</h1>
                <p className="text-muted-foreground mt-1">{provider.display_name}</p>
            </div>

            <div className="space-y-6">
                <div className="bg-card rounded-lg border p-6">
                    <h2 className="text-xl font-semibold mb-4">Provider Configuration</h2>
                    <ProviderForm provider={{ ...provider, api_key: '' }} isEdit />
                </div>

                <div className="bg-card rounded-lg border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Available Models</h2>
                        <Badge variant="secondary">{models?.length || 0} models</Badge>
                    </div>
                    {models && models.length > 0 ? (
                        <div className="space-y-2">
                            {models.map((model) => (
                                <div
                                    key={model.id}
                                    className="border rounded p-3 flex items-center justify-between"
                                >
                                    <div>
                                        <p className="font-medium">{model.display_name}</p>
                                        <p className="text-sm text-muted-foreground">{model.model_id}</p>
                                    </div>
                                    <Badge variant={model.status === 1 ? 'default' : 'secondary'}>
                                        {model.status === 1 ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">
                            No models synced yet. Use the &quot;Sync Models&quot; button in the providers list to fetch available models.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
