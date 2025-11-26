import crypto from 'crypto';

interface MidtransCredentials {
    serverKey: string;
    clientKey: string;
}

interface MidtransTransaction {
    orderId: string;
    grossAmount: number;
    customerName: string;
    customerEmail: string;
    itemDetails: Array<{
        id: string;
        price: number;
        quantity: number;
        name: string;
    }>;
}

interface MidtransResponse {
    status_code?: string;
    status_message?: string;
    transaction_id?: string;
    order_id?: string;
    gross_amount?: string;
    payment_type?: string;
    transaction_time?: string;
    transaction_status?: string;
    fraud_status?: string;
    token?: string;
    redirect_url?: string;
}

export class MidtransClient {
    private credentials: MidtransCredentials;
    private baseUrl: string;
    private snapUrl: string;

    constructor(credentials: MidtransCredentials, isSandbox: boolean = false) {
        this.credentials = credentials;
        this.baseUrl = isSandbox
            ? 'https://api.sandbox.midtrans.com/v2'
            : 'https://api.midtrans.com/v2';
        this.snapUrl = isSandbox
            ? 'https://app.sandbox.midtrans.com/snap/v1'
            : 'https://app.midtrans.com/snap/v1';
    }

    private getAuthHeader(): string {
        return 'Basic ' + Buffer.from(this.credentials.serverKey + ':').toString('base64');
    }

    async createTransaction(params: MidtransTransaction): Promise<MidtransResponse> {
        try {
            const payload = {
                transaction_details: {
                    order_id: params.orderId,
                    gross_amount: params.grossAmount,
                },
                customer_details: {
                    first_name: params.customerName,
                    email: params.customerEmail,
                },
                item_details: params.itemDetails,
            };

            const response = await fetch(`${this.snapUrl}/transactions`, {
                method: 'POST',
                headers: {
                    'Authorization': this.getAuthHeader(),
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            return await response.json();
        } catch (error: any) {
            throw new Error(`Midtrans transaction creation failed: ${error.message}`);
        }
    }

    async getTransactionStatus(orderId: string): Promise<MidtransResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/${orderId}/status`, {
                method: 'GET',
                headers: {
                    'Authorization': this.getAuthHeader(),
                    'Accept': 'application/json',
                },
            });

            return await response.json();
        } catch (error: any) {
            throw new Error(`Midtrans status check failed: ${error.message}`);
        }
    }

    verifyNotification(notification: any): boolean {
        const {
            order_id,
            status_code,
            gross_amount,
            signature_key,
        } = notification;

        const expectedSignature = crypto
            .createHash('sha512')
            .update(order_id + status_code + gross_amount + this.credentials.serverKey)
            .digest('hex');

        return signature_key === expectedSignature;
    }

    getSnapToken(token: string): string {
        return token;
    }
}
