import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();

        // Check authentication
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: preset, error } = await supabase
            .from('presets')
            .select(
                `
        *,
        category:categories(id, title)
      `
            )
            .eq('id', params.id)
            .eq('status', 1)
            .single();

        if (error) {
            console.error('Error fetching preset:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!preset) {
            return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
        }

        return NextResponse.json({ preset });
    } catch (error: any) {
        console.error('Error in preset detail API:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
