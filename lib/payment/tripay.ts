import crypto from 'crypto';

interface TripayCredentials {
    apiKey: string;
    privateKey: string;
    merchantCode: string;
}

interface TripayTransaction {
    method: string;
    merchantRef: string;
    amount: number;
    customerName: string;
    customerEmail: string;
    orderItems: Array<{
        name: string;
        price: number;
        quantity: number;
    }>;
    returnUrl?: string;
    expiredTime?: number;
}

interface TripayResponse {
    success: boolean;
    message?: string;
    data?: any;
}

export class TripayClient {
    private credentials: TripayCredentials;
    private baseUrl: string;

    constructor(credentials: TripayCredentials, isSandbox: boolean = false) {
        this.credentials = credentials;
        this.baseUrl = isSandbox
            ? 'https://tripay.co.id/api-sandbox'
            : 'https://tripay.co.id/api';
    }

    private generateSignature(data: string): string {
        return crypto
            .createHmac('sha256', this.credentials.privateKey)
            .update(data)
            .digest('hex');
    }

    async getPaymentChannels(): Promise<TripayResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/merchant/payment-channel`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.credentials.apiKey}`,
                },
            });

            return await response.json();
        } catch (error: any) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    async createTransaction(params: TripayTransaction): Promise<TripayResponse> {
        try {
            const signature = this.generateSignature(
                this.credentials.merchantCode + params.merchantRef + params.amount
            );

            const payload = {
                method: params.method,
                merchant_ref: params.merchantRef,
                amount: params.amount,
                customer_name: params.customerName,
                customer_email: params.customerEmail,
                order_items: params.orderItems,
                return_url: params.returnUrl,
                expired_time: params.expiredTime || (24 * 60 * 60), // 24 hours default
                signature,
            };

            const response = await fetch(`${this.baseUrl}/transaction/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.credentials.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            return await response.json();
        } catch (error: any) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    async getTransactionDetail(reference: string): Promise<TripayResponse> {
        try {
            const response = await fetch(
                `${this.baseUrl}/transaction/detail?reference=${reference}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.credentials.apiKey}`,
                    },
                }
            );

            return await response.json();
        } catch (error: any) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    verifyCallback(signature: string, data: any): boolean {
        const json = JSON.stringify(data);
        const expectedSignature = crypto
            .createHmac('sha256', this.credentials.privateKey)
            .update(json)
            .digest('hex');

        return signature === expectedSignature;
    }
}
