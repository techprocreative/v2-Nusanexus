import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('current_workspace_id')
            .eq('id', user.id)
            .single();

        if (!profile?.current_workspace_id) {
            return NextResponse.json({ error: 'No workspace' }, { status: 400 });
        }

        // Get recent activities
        const { data: activities, error } = await supabase
            .from('activity_log')
            .select('*, profiles(first_name, last_name)')
            .eq('workspace_id', profile.current_workspace_id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        return NextResponse.json(activities || []);
    } catch (error: any) {
        console.error('Activity feed error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch activities' },
            { status: 500 }
        );
    }
}
