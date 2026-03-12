import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Diagnostic endpoint to test the wallet system end-to-end.
 * GET /api/debug/wallet?email=user@example.com
 * REMOVE THIS IN PRODUCTION
 */
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: "email parameter required" }, { status: 400 });
    }

    const results = {
        email,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasPaystackKey: !!process.env.PAYSTACK_SECRET_KEY,
        steps: {}
    };

    // Step 1: Find profile
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

    results.steps.profileLookup = {
        success: !!profile,
        data: profile ? { id: profile.id, email: profile.email } : null,
        error: profileError?.message || null
    };

    if (!profile) {
        return NextResponse.json(results);
    }

    // Step 2: Find wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('*')
        .eq('user_id', profile.id)
        .single();

    results.steps.walletLookup = {
        success: !!wallet,
        data: wallet ? { id: wallet.id, user_id: wallet.user_id } : null,
        error: walletError?.message || null
    };

    if (wallet) {
        // Step 3: Find transactions
        const { data: transactions, error: txError } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('wallet_id', wallet.id)
            .order('created_at', { ascending: false });

        const balance = transactions?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;

        results.steps.transactions = {
            count: transactions?.length || 0,
            balance,
            error: txError?.message || null,
            recent: transactions?.slice(0, 3) || []
        };
    } else {
        // Step 4: Try to create wallet deliberately and see the error
        const { data: newWallet, error: createErr } = await supabaseAdmin
            .from('wallets')
            .insert({ user_id: profile.id })
            .select()
            .single();

        results.steps.walletCreation = {
            success: !!newWallet,
            data: newWallet,
            error: createErr?.message || null,
            errorCode: createErr?.code || null
        };
    }

    return NextResponse.json(results, { status: 200 });
}
