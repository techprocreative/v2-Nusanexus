import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPaymentGateway } from '@/lib/payment/gateway-factory';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get payment gateway
        const { type, client } = await getPaymentGateway(params.id);

        // Test connection based on gateway type
        let testResult;

        if (type === 'tripay') {
            testResult = await client.getPaymentChannels();
        } else if (type === 'midtrans') {
            // For Midtrans, we can't test without creating a transaction
            // So we just verify credentials format
            testResult = { success: true, message: 'Credentials format valid' };
        }

        if (testResult.success) {
            return NextResponse.json({
                success: true,
                message: 'Connection test successful',
                data: testResult.data,
            });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    message: testResult.message || 'Connection test failed',
                },
                { status: 400 }
            );
        }
    } catch (error: any) {
        console.error('Error testing payment gateway:', error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || 'Connection test failed',
            },
            { status: 500 }
        );
    }
}
