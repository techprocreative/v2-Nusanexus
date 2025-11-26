import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = createClient();

        // Check authentication
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('category_id');
        const type = searchParams.get('type');
        const search = searchParams.get('search');

        // Build query
        let query = supabase
            .from('presets')
            .select(
                `
        *,
        category:categories(id, title)
      `
            )
            .eq('status', 1); // Only active presets

        // Apply filters
        if (categoryId) {
            query = query.eq('category_id', categoryId);
        }

        if (type) {
            query = query.eq('type', type);
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Order by created date (newest first)
        query = query.order('created_at', { ascending: false });

        const { data: presets, error } = await query;

        if (error) {
            console.error('Error fetching presets:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ presets });
    } catch (error: any) {
        console.error('Error in presets API:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
