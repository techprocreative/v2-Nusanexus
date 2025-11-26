import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getPaymentGateway, getUserPreferredGateway } from '@/lib/payment/gateway-factory';

export async function POST(request: Request) {
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
            return NextResponse.json({ error: 'No workspace selected' }, { status: 400 });
        }

        const body = await request.json();
        const { packageId, gatewayId } = body;

        if (!packageId) {
            return NextResponse.json({ error: 'Package ID required' }, { status: 400 });
        }

        // Get package details
        const { data: creditPackage } = await supabase
            .from('credit_packages')
            .select('*')
            .eq('id', packageId)
            .single();

        if (!creditPackage) {
            return NextResponse.json({ error: 'Package not found' }, { status: 404 });
        }

        // Determine payment gateway
        const selectedGatewayId = gatewayId || await getUserPreferredGateway(user.id);

        if (!selectedGatewayId) {
            return NextResponse.json({ error: 'No payment gateway available' }, { status: 400 });
        }

        // Get payment gateway
        const { type, client } = await getPaymentGateway(selectedGatewayId);

        // Create merchant reference
        const merchantRef = `CREDIT-${packageId}-${Date.now()}`;

        let paymentResult;

        if (type === 'tripay') {
            paymentResult = await client.createTransaction({
                method: 'BRIVA',
                merchantRef,
                amount: creditPackage.price,
                customerName: user.email?.split('@')[0] || 'User',
                customerEmail: user.email || '',
                orderItems: [
                    {
                        name: creditPackage.name,
                        price: creditPackage.price,
                        quantity: 1,
                    },
                ],
                returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
                expiredTime: 24 * 60 * 60,
            });
        } else {
            // Midtrans
            paymentResult = await client.createTransaction({
                orderId: merchantRef,
                grossAmount: creditPackage.price,
                customerName: user.email?.split('@')[0] || 'User',
                customerEmail: user.email || '',
                itemDetails: [
                    {
                        id: packageId,
                        price: creditPackage.price,
                        quantity: 1,
                        name: creditPackage.name,
                    },
                ],
            });
        }

        // Save transaction
        const { data: transaction } = await supabase
            .from('payment_transactions')
            .insert({
                workspace_id: profile.current_workspace_id,
                user_id: user.id,
                payment_gateway_id: selectedGatewayId,
                external_transaction_id: merchantRef,
                type: 'credit_purchase',
                amount: creditPackage.price,
                status: 'pending',
                credit_package_id: packageId,
                credits_purchased: creditPackage.credits,
                payment_url: type === 'tripay' ? paymentResult.data?.checkout_url : paymentResult.redirect_url,
                payment_instructions: type === 'tripay' ? paymentResult.data?.instructions : null,
                expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            })
            .select()
            .single();

        return NextResponse.json({
            transaction,
            paymentUrl: type === 'tripay' ? paymentResult.data?.checkout_url : paymentResult.redirect_url,
            snapToken: type === 'midtrans' ? paymentResult.token : null,
        });
    } catch (error: any) {
        console.error('Error purchasing credits:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to purchase credits' },
            { status: 500 }
        );
    }
}
