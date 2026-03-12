import { NextResponse } from "next/server";
import { paystackService } from "@/services/PaystackService";
import { walletService } from "@/services/WalletService";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * @description Paystack Webhook Handler
 * @endpoint /api/webhooks/paystack
 */
export async function POST(req) {
    try {
        const body = await req.json();
        const signature = req.headers.get('x-paystack-signature');

        // 1. Verify Signature (Security)
        if (!paystackService.verifyWebhookSignature(JSON.stringify(body), signature)) {
            return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
        }

        const { event, data } = body;

        // 2. Handle Charge Success
        if (event === "charge.success") {
            const reference = data.reference;
            const amount = data.amount / 100; // Convert Kobo to NGN
            const email = data.customer.email;

            // Find profile by email (use admin client to bypass RLS)
            const { data: profile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('email', email)
                .single();

            if (profileError || !profile) {
                console.error(`[Webhook] Profile not found for email: ${email}`);
                return NextResponse.json({ message: "User profile not found" }, { status: 404 });
            }

            // 3. Fund Wallet
            try {
                await walletService.fundWallet(profile.id, amount, reference);
                console.log(`[Webhook] Successfully funded profile ${profile.id} with ${amount} NGN. Ref: ${reference}`);
            } catch (fundError) {
                if (fundError.message.includes("Duplicate")) {
                    return NextResponse.json({ message: "Transaction already processed" }, { status: 200 });
                }
                throw fundError;
            }
        }

        return NextResponse.json({ message: "Webhook received" }, { status: 200 });
    } catch (error) {
        console.error("[Webhook Error]:", error);
        return NextResponse.json({ message: "Webhook error" }, { status: 500 });
    }
}
