import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = createClient();

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        let query = supabase
            .from('ai_models')
            .select(
                `
        *,
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
            console.error('Error fetching models:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ models: models ?? [] });
    } catch (error: any) {
        console.error('Error in models API:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch models' },
            { status: 500 }
        );
    }
}