import { SupabaseClient } from '@supabase/supabase-js';

type ModelType = 'llm' | 'image' | 'tts' | 'transcription';

interface PricingOptions {
  modelId: string;
  type: ModelType;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    textLength?: number;
    fileSizeMb?: number;
  };
  fallback?: {
    credits?: number;
    costPerThousandTokensUsd?: number;
  };
}

/**
 * Load global credits_per_usd setting from options table with default fallback.
 */
export async function loadCreditsPerUsd(supabase: SupabaseClient): Promise<number> {
  const { data: rows } = await supabase
    .from('options')
    .select('key, value')
    .eq('key', 'credits_per_usd')
    .maybeSingle();

  if (!rows) {
    return 100;
  }

  const value = (rows as any).value;
  if (typeof value === 'number') {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
}

/**
 * Load provider pricing for a given model and type.
 */
export async function loadModelPricing(
  supabase: SupabaseClient,
  modelId: string,
  type: ModelType
): Promise<{
  providerInputCost: number;
  providerOutputCost: number;
  markupMultiplier: number;
}> {
  const { data: modelRow } = await supabase
    .from('ai_models')
    .select(
      `
        input_cost,
        output_cost,
        provider:ai_providers(config)
      `
    )
    .eq('model_id', modelId)
    .eq('type', type)
    .eq('status', 1)
    .limit(1)
    .maybeSingle();

  const providerInputCost =
    typeof modelRow?.input_cost === 'number'
      ? (modelRow as any).input_cost
      : Number((modelRow as any)?.input_cost) || 0;

  const providerOutputCost =
    typeof modelRow?.output_cost === 'number'
      ? (modelRow as any).output_cost
      : Number((modelRow as any)?.output_cost) || 0;

  const markupMultiplier =
    (modelRow as any)?.provider?.config?.markup_multiplier ?? 1.5;

  return {
    providerInputCost,
    providerOutputCost,
    markupMultiplier,
  };
}

/**
 * Calculate credits for LLM usage based on provider pricing and markup.
 */
export function calculateLlmCredits(args: {
  promptTokens: number;
  completionTokens: number;
  creditsPerUsd: number;
  providerInputCost: number;
  providerOutputCost: number;
  markupMultiplier: number;
  fallbackCostPerThousandTokensUsd?: number;
}): {
  creditsUsed: number;
  tokensUsed: number;
  providerCostUsd: number;
  platformCostUsd: number;
} {
  const {
    promptTokens,
    completionTokens,
    creditsPerUsd,
    providerInputCost,
    providerOutputCost,
    markupMultiplier,
    fallbackCostPerThousandTokensUsd = 0.002,
  } = args;

  const tokensUsed = (promptTokens || 0) + (completionTokens || 0);

  const providerCostUsd =
    (promptTokens / 1000) * providerInputCost +
    (completionTokens / 1000) * providerOutputCost;

  const platformCostUsd =
    (providerCostUsd || (tokensUsed / 1000) * fallbackCostPerThousandTokensUsd) *
    markupMultiplier;

  const creditsUsed = Math.max(
    1,
    Math.ceil(platformCostUsd * creditsPerUsd)
  );

  return {
    creditsUsed,
    tokensUsed,
    providerCostUsd,
    platformCostUsd,
  };
}

/**
 * Calculate credits for simple, per-request style pricing.
 */
export function calculateSimpleCredits(args: {
  baseCostUnit: number;
  usageUnit: number;
  creditsPerUsd: number;
  markupMultiplier: number;
  fallbackCredits?: number;
}): {
  creditsUsed: number;
  providerCostUsd: number;
  platformCostUsd: number;
} {
  const {
    baseCostUnit,
    usageUnit,
    creditsPerUsd,
    markupMultiplier,
    fallbackCredits,
  } = args;

  if (!baseCostUnit || baseCostUnit <= 0) {
    const fallback = fallbackCredits ?? 1;
    return {
      creditsUsed: fallback,
      providerCostUsd: 0,
      platformCostUsd: 0,
    };
  }

  const providerCostUsd = baseCostUnit * usageUnit;
  const platformCostUsd = providerCostUsd * markupMultiplier;

  const creditsUsed = Math.max(
    1,
    Math.ceil(platformCostUsd * creditsPerUsd)
  );

  return {
    creditsUsed,
    providerCostUsd,
    platformCostUsd,
  };
}