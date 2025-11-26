import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from './encryption';

export type ProviderType = 'llm' | 'image' | 'tts' | 'transcription';

interface AIProvider {
    id: string;
    name: string;
    display_name: string;
    type: ProviderType;
    base_url: string;
    api_key_encrypted: string;
    status: number;
    priority: number;
    config: Record<string, any>;
}

/**
 * Get OpenAI client for a specific provider type
 * Fetches the highest priority active provider from database
 */
export async function getAIClient(type: ProviderType): Promise<OpenAI> {
    const supabase = createClient();

    const { data: provider, error } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('type', type)
        .eq('status', 1)
        .order('priority', { ascending: false })
        .limit(1)
        .single();

    if (error || !provider) {
        throw new Error(`No active provider found for type: ${type}`);
    }

    // Decrypt API key
    const apiKey = decrypt(provider.api_key_encrypted);

    return new OpenAI({
        apiKey,
        baseURL: provider.base_url,
        defaultHeaders: provider.config?.headers || {},
    });
}

/**
 * Get all available models for a specific type
 */
export async function getAvailableModels(type: ProviderType) {
    const supabase = createClient();

    const { data: models, error } = await supabase
        .from('ai_models')
        .select('*, ai_providers(*)')
        .eq('type', type)
        .eq('status', 1)
        .eq('ai_providers.status', 1)
        .order('display_name');

    if (error) {
        console.error('Error fetching models:', error);
        return [];
    }

    return models || [];
}

/**
 * Generate with automatic fallback to secondary providers
 */
export async function generateWithFallback(
    type: ProviderType,
    generateFn: (client: OpenAI) => Promise<any>
): Promise<any> {
    const supabase = createClient();

    // Get all active providers for this type, ordered by priority
    const { data: providers, error } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('type', type)
        .eq('status', 1)
        .order('priority', { ascending: false });

    if (error || !providers || providers.length === 0) {
        throw new Error(`No active providers found for type: ${type}`);
    }

    let lastError: Error | null = null;

    // Try each provider in order of priority
    for (const provider of providers) {
        try {
            const apiKey = decrypt(provider.api_key_encrypted);
            const client = new OpenAI({
                apiKey,
                baseURL: provider.base_url,
                defaultHeaders: provider.config?.headers || {},
            });

            return await generateFn(client);
        } catch (error: any) {
            console.error(`Provider ${provider.name} failed:`, error.message);
            lastError = error;
            // Continue to next provider
        }
    }

    throw lastError || new Error('All providers failed');
}

/**
 * Test connection to a provider
 */
export async function testProviderConnection(
    baseUrl: string,
    apiKey: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const client = new OpenAI({
            apiKey,
            baseURL: baseUrl,
        });

        // Try to list models as a connection test
        await client.models.list();

        return { success: true };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Connection failed',
        };
    }
}
