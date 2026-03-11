import { NextResponse } from "next/server";
import { paystackService } from "@/services/PaystackService";
import { walletService } from "@/services/WalletService";
import { supabase } from "@/lib/supabase/client";

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

            // Find user by email in Supabase
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();

            if (userError || !user) {
                console.error(`[Webhook] User not found for email: ${email}`);
                return NextResponse.json({ message: "User not found" }, { status: 404 });
            }

            // 3. Fund Wallet (Ledger Entry)
            // This is idempotent because fundWallet checks for duplicate reference
            try {
                await walletService.fundWallet(user.id, amount, reference);
                console.log(`[Webhook] Successfully funded user ${user.id} with ${amount} NGN. Ref: ${reference}`);
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
