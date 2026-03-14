"use server";

import { headers } from "next/headers";
import { walletService } from "../services/WalletService";
import { paystackService } from "../services/PaystackService";

/**
 * Server Action: Fetches the current user balance
 * @param {string} userId 
 */
export async function getBalanceAction(userId) {
    try {
        const balance = await walletService.getBalance(userId);
        return { success: true, balance };
    } catch (error) {
        return { success: false, error: error.message, code: error.code || 'WALLET_ERROR' };
    }
}

/**
 * Server Action: Funds the wallet
 * @param {string} userId 
 * @param {number} amount 
 * @param {string} reference 
 */
export async function fundWalletAction(userId, amount, reference) {
    try {
        const result = await walletService.fundWallet(userId, amount, reference);
        return { success: true, ...result };
    } catch (error) {
        return { success: false, error: error.message, code: error.code || 'WALLET_ERROR' };
    }
}

/**
 * Server Action: Initializes a Paystack transaction
 * @param {string} email 
 * @param {number} amount In NGN
 */
export async function initializePaymentAction(email, amount) {
    try {
        const headerList = await headers();
        const host = headerList.get("host");
        const protocol = host.includes("localhost") ? "http" : "https";
        const callbackUrl = `${protocol}://${host}/wallet/callback`;

        const response = await paystackService.initializeTransaction(
            email,
            amount * 100, // Convert to Kobo
            callbackUrl
        );

        if (response.status) {
            return { success: true, data: response.data };
        }
        throw new Error(response.message);
    } catch (error) {
        return { success: false, error: error.message, code: error.code || 'WALLET_ERROR' };
    }
}

/**
 * Server Action: Verifies a Paystack transaction AND credits the wallet
 * @param {string} reference 
 */
export async function verifyPaymentAction(reference) {
    try {
        const response = await paystackService.verifyTransaction(reference);
        
        if (response.status && response.data.status === 'success') {
            const { amount, customer, reference: txRef } = response.data;
            const amountInNGN = amount / 100; // Convert Kobo to NGN
            const email = customer.email;

            // Look up the user's profile by email
            const { supabaseAdmin } = await import('../lib/supabase/admin');
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('email', email)
                .single();

            if (profile) {
                // Credit the wallet (idempotent — skips if reference already exists)
                try {
                    await walletService.fundWallet(profile.id, amountInNGN, txRef);
                } catch (fundErr) {
                    // Duplicate reference means it was already processed (by webhook) — that's a success case for the UI
                    const isDuplicate = fundErr.message?.includes('Duplicate') || fundErr.code === '23505' || (fundErr.message?.includes('Duplicate transaction reference'));
                    
                    if (!isDuplicate) {
                        console.error('[verifyPaymentAction] Funding error:', fundErr.message);
                        // We still return success: true because Paystack confirmed the payment.
                        // The user's balance should reflect the update via the webhook.
                    }
                }
            }

            return { success: true, data: response.data };
        }
        
        return { success: false, error: response.message || "Transaction not successful" };
    } catch (error) {
        return { success: false, error: error.message, code: error.code || 'WALLET_ERROR' };
    }
}

/**
 * Server Action: Fetches recent transactions
 * @param {string} userId 
 */
export async function getTransactionsAction(userId) {
    try {
        const transactions = await walletService.getTransactions(userId);
        return { success: true, transactions };
    } catch (error) {
        return { success: false, error: error.message, code: error.code || 'WALLET_ERROR' };
    }
}
