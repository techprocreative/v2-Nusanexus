import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/ai/encryption';
import { fetchModelsFromProvider, determineModelType } from '@/lib/ai/model-fetcher';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get provider
        const { data: provider, error: providerError } = await supabase
            .from('ai_providers')
            .select('*')
            .eq('id', params.id)
            .single();

        if (providerError || !provider) {
            return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
        }

        // Decrypt API key
        const apiKey = decrypt(provider.api_key_encrypted);

        // Fetch models from provider
        const models = await fetchModelsFromProvider(provider.base_url, apiKey);

        // Save models to database
        let syncedCount = 0;
        for (const model of models) {
            const modelType = provider.type; // Use provider type instead of auto-detecting

            const { error } = await supabase
                .from('ai_models')
                .upsert({
                    provider_id: provider.id,
                    model_id: model.id,
                    display_name: model.name,
                    type: modelType,
                    context_length: model.context_length,
                    input_cost: model.pricing?.prompt,
                    output_cost: model.pricing?.completion,
                    status: 1,
                }, {
                    onConflict: 'provider_id,model_id',
                });

            if (!error) {
                syncedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            synced_count: syncedCount,
            total_models: models.length,
        });
    } catch (error: any) {
        console.error('Error syncing models:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to sync models' },
            { status: 500 }
        );
    }
}
