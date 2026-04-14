import Stripe from 'stripe';

export class StripeService {
    private stripe: Stripe;

    constructor() {
        if (!process.env.STRIPE_SECRET_KEY) {
            // In dev mode without keys, we might want to warn or mock
            console.warn("Stripe Secret Key not found!");
        }
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
            apiVersion: '2025-01-27.acacia', // Latest API version
        });
    }

    async createCheckoutSession(billId: string, returnUrl: string): Promise<string | null> {
        if (!process.env.STRIPE_SECRET_KEY) {
            console.warn("Mocking Stripe Checkout (No Keys)");
            return `${returnUrl}?success=true&billId=${billId}`; // Auto-success for dev without keys
        }

        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'BillRx Audit Report',
                            description: 'Full error analysis and dispute letter generation',
                        },
                        unit_amount: 2900, // $29.00
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${returnUrl}?success=true&billId=${billId}`,
            cancel_url: `${returnUrl}?canceled=true`,
            metadata: {
                billId: billId,
            },
        });

        return session.url;
    }
}
