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

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        let query = supabase
            .from('ai_models')
            .select('*, ai_providers(*)')
            .order('display_name');

        if (type) {
            query = query.eq('type', type);
        }

        const { data: models, error } = await query;

        if (error) throw error;

        return NextResponse.json({
            models: models || [],
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch models' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

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

        const body = await request.json();
        const { id, input_cost, output_cost, cost_per_unit, status } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing model ID' }, { status: 400 });
        }

        const updateData: any = {};
        if (input_cost !== undefined) updateData.input_cost = input_cost;
        if (output_cost !== undefined) updateData.output_cost = output_cost;
        if (status !== undefined) updateData.status = status;
        if (cost_per_unit !== undefined) {
            updateData.metadata = {
                cost_per_unit,
            };
        }

        const {
            data: model,
            error,
        } = await supabase
            .from('ai_models')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(model);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to update model' },
            { status: 500 }
        );
    }
}
