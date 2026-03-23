"use server";

import { headers } from "next/headers";
import { walletService } from "../services/WalletService";
import { paystackService } from "../services/PaystackService";
import { requireAuth } from "../lib/auth/session";

/**
 * Server Action: Fetches the current user balance
 */
export async function getBalanceAction() {
    try {
        const user = await requireAuth();
        const balance = await walletService.getBalance(user.id);
        return { success: true, balance };
    } catch (error) {
        return { success: false, error: error.message, code: error.code || 'WALLET_ERROR' };
    }
}


/**
 * Server Action: Initializes a Paystack transaction
 * @param {number} amount In NGN
 */
export async function initializePaymentAction(amount) {
    try {
        const user = await requireAuth();
        const headerList = await headers();
        const host = headerList.get("host");
        const protocol = host.includes("localhost") ? "http" : "https";
        const callbackUrl = `${protocol}://${host}/wallet/callback`;

        const response = await paystackService.initializeTransaction(
            user.email,
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
        const user = await requireAuth();
        const response = await paystackService.verifyTransaction(reference);
        
        if (response.status && response.data.status === 'success') {
            const { amount, reference: txRef, customer } = response.data;
            const amountInNGN = amount / 100; // Convert Kobo to NGN

            // Security Check: Ensure the payment was actually for THIS user
            if (customer.email.toLowerCase() !== user.email.toLowerCase()) {
                throw new Error("Transaction email mismatch. Verification failed.");
            }

            // Credit the wallet (idempotent — skips if reference already exists)
            try {
                await walletService.fundWallet(user.id, amountInNGN, txRef);
            } catch (fundErr) {
                const isDuplicate = fundErr.message?.includes('Duplicate') || fundErr.code === '23505';
                if (!isDuplicate) {
                    console.error('[verifyPaymentAction] Funding error:', fundErr.message);
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
 */
export async function getTransactionsAction(limit = 10) {
    try {
        const user = await requireAuth();
        const transactions = await walletService.getTransactions(user.id, limit);
        return { success: true, transactions };
    } catch (error) {
        return { success: false, error: error.message, code: error.code || 'WALLET_ERROR' };
    }
}
