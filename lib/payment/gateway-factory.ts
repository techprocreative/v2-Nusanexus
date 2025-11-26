import { createServiceClient } from '@/lib/supabase/server';
import { decryptPaymentCredentials } from './encryption';
import { TripayClient } from './tripay';
import { MidtransClient } from './midtrans';

export type PaymentGatewayType = 'tripay' | 'midtrans';

export async function getPaymentGateway(gatewayId: string) {
    const supabase = createServiceClient();

    const { data: gateway, error } = await supabase
        .from('payment_gateways')
        .select('*')
        .eq('id', gatewayId)
        .eq('is_active', true)
        .single();

    if (error || !gateway) {
        throw new Error('Payment gateway not found or inactive');
    }

    // Decrypt credentials
    const credentials = decryptPaymentCredentials(gateway.credentials_encrypted);

    // Return appropriate client
    switch (gateway.name as PaymentGatewayType) {
        case 'tripay':
            return {
                type: 'tripay' as const,
                client: new TripayClient(credentials, gateway.is_sandbox),
                gateway,
            };
        case 'midtrans':
            return {
                type: 'midtrans' as const,
                client: new MidtransClient(credentials, gateway.is_sandbox),
                gateway,
            };
        default:
            throw new Error(`Unsupported payment gateway: ${gateway.name}`);
    }
}

export async function getActivePaymentGateways() {
    const supabase = createServiceClient();

    const { data: gateways, error } = await supabase
        .from('payment_gateways')
        .select('id, name, display_name, is_sandbox')
        .eq('is_active', true)
        .order('display_name');

    if (error) {
        throw new Error('Failed to fetch payment gateways');
    }

    return gateways || [];
}

export async function getUserPreferredGateway(userId: string) {
    const supabase = createServiceClient();

    const { data: preference } = await supabase
        .from('user_payment_preferences')
        .select('preferred_gateway_id, payment_gateways(id, name, display_name)')
        .eq('user_id', userId)
        .single();

    if (preference?.preferred_gateway_id) {
        return preference.preferred_gateway_id;
    }

    // Return first active gateway as default
    const gateways = await getActivePaymentGateways();
    return gateways[0]?.id || null;
}
