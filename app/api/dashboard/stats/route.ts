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

        // Get workspace stats
        const { data: workspace } = await supabase
            .from('workspaces')
            .select('*')
            .eq('id', profile.current_workspace_id)
            .single();

        // Get total library items
        const { count: totalItems } = await supabase
            .from('library_items')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', profile.current_workspace_id);

        // Get member count
        const { count: memberCount } = await supabase
            .from('workspace_members')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', profile.current_workspace_id);

        // Get items created this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: itemsThisMonth } = await supabase
            .from('library_items')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', profile.current_workspace_id)
            .gte('created_at', startOfMonth.toISOString());

        // Calculate credits used this month (simplified - would need actual usage tracking)
        const creditsUsedThisMonth = workspace?.credit_count
            ? Math.max(0, 10000 - workspace.credit_count)
            : 0;

        return NextResponse.json({
            totalItems: totalItems || 0,
            creditsUsedThisMonth,
            memberCount: memberCount || 0,
            itemsThisMonth: itemsThisMonth || 0,
        });
    } catch (error: any) {
        console.error('Dashboard stats error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}
