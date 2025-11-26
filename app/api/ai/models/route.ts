import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let query = supabase
      .from('ai_models')
      .select(
        `
        id,
        provider_id,
        model_id,
        display_name,
        type,
        context_length,
        input_cost,
        output_cost,
        metadata,
        provider:ai_providers(display_name)
      `
      )
      .eq('status', 1)
      .order('display_name');

    if (type) {
      query = query.eq('type', type);
    }

    const { data: models, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      models: models || [],
    });
  } catch (error: any) {
    console.error('Error fetching AI models:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch models' },
      { status: 500 }
    );
  }
}