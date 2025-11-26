import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    try {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const serviceClient = createServiceClient();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const workspaceId = searchParams.get('workspace_id');
        const planId = searchParams.get('plan_id');

        let query = serviceClient
            .from('subscriptions')
            .select(
                `
                *,
                subscription_plans(display_name, price, monthly_credits),
                workspaces(name),
                payment_gateways(display_name)
            `
            )
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        if (workspaceId) {
            query = query.eq('workspace_id', workspaceId);
        }

        if (planId) {
            query = query.eq('plan_id', planId);
        }

        const { data: subscriptions, error } = await query;

        if (error) {
            console.error('Error fetching subscriptions:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ subscriptions: subscriptions || [] });
    } catch (error: any) {
        console.error('Error in admin subscriptions GET:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}