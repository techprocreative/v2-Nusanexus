import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = createClient();

        const { data: voices, error } = await supabase
            .from('voices')
            .select('*')
            .eq('status', 1)
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching voices:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ voices: voices ?? [] });
    } catch (error: any) {
        console.error('Error in voices API:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch voices' },
            { status: 500 }
        );
    }
}