import { NextResponse } from 'next/server';
import { StripeService } from '@/app/lib/payment/stripe-service';

const stripeService = new StripeService();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { billId } = body;

        if (!billId) {
            return NextResponse.json({ error: "Missing billId" }, { status: 400 });
        }

        // Determine return URL (current origin)
        const origin = request.headers.get('origin') || 'http://localhost:3000';
        const returnUrl = `${origin}/`;

        const url = await stripeService.createCheckoutSession(billId, returnUrl);

        return NextResponse.json({ url });
    } catch (error) {
        console.error("Checkout API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
