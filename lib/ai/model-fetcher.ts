import OpenAI from 'openai';

interface ModelInfo {
    id: string;
    name: string;
    context_length?: number;
    pricing?: {
        prompt?: number;
        completion?: number;
    };
}

/**
 * Fetch available models from OpenRouter
 */
export async function fetchOpenRouterModels(apiKey: string): Promise<ModelInfo[]> {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.statusText}`);
        }

        const { data } = await response.json();

        return data.map((model: any) => ({
            id: model.id,
            name: model.name || model.id,
            context_length: model.context_length,
            pricing: {
                prompt: model.pricing?.prompt,
                completion: model.pricing?.completion,
            },
        }));
    } catch (error: any) {
        console.error('Error fetching OpenRouter models:', error);
        throw error;
    }
}

/**
 * Fetch available models from Together AI
 */
export async function fetchTogetherModels(apiKey: string): Promise<ModelInfo[]> {
    try {
        const client = new OpenAI({
            apiKey,
            baseURL: 'https://api.together.xyz/v1',
        });

        const response = await client.models.list();

        return response.data.map((model: any) => ({
            id: model.id,
            name: model.id,
            context_length: model.context_length,
        }));
    } catch (error: any) {
        console.error('Error fetching Together AI models:', error);
        throw error;
    }
}

/**
 * Fetch available models from OpenAI
 */
export async function fetchOpenAIModels(apiKey: string): Promise<ModelInfo[]> {
    try {
        const client = new OpenAI({
            apiKey,
            baseURL: 'https://api.openai.com/v1',
        });

        const response = await client.models.list();

        return response.data.map((model: any) => ({
            id: model.id,
            name: model.id,
        }));
    } catch (error: any) {
        console.error('Error fetching OpenAI models:', error);
        throw error;
    }
}

/**
 * Generic model fetcher using OpenAI-compatible API
 */
export async function fetchModelsFromProvider(
    baseUrl: string,
    apiKey: string
): Promise<ModelInfo[]> {
    try {
        const client = new OpenAI({
            apiKey,
            baseURL: baseUrl,
        });

        const response = await client.models.list();

        return response.data.map((model: any) => ({
            id: model.id,
            name: model.name || model.id,
            context_length: model.context_length,
            pricing: model.pricing,
        }));
    } catch (error: any) {
        console.error('Error fetching models from provider:', error);
        throw error;
    }
}

/**
 * Determine model type based on model ID
 */
export function determineModelType(modelId: string): 'llm' | 'image' | 'tts' | 'transcription' {
    const id = modelId.toLowerCase();

    if (id.includes('dall-e') || id.includes('stable-diffusion') || id.includes('midjourney')) {
        return 'image';
    }

    if (id.includes('tts') || id.includes('voice')) {
        return 'tts';
    }

    if (id.includes('whisper') || id.includes('transcrib')) {
        return 'transcription';
    }

    return 'llm';
}
