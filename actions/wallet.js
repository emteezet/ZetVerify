"use server";

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
        const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/wallet/callback`;
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
