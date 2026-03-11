import { supabase } from "../lib/supabase/client";
import { Logger } from "../lib/utils/logger";
import { WalletError, ErrorCodes } from "../lib/errors/AppError";

/**
 * @class WalletService
 * @description Manages atomic wallet operations (Credits, Debits) using a ledger-based approach.
 */
export class WalletService {
    /**
     * Fetches the current balance for a user by summing the transactions ledger.
     * @param {string} userId 
     * @returns {Promise<number>}
     */
    async getBalance(userId) {
        try {
            const { data: wallet, error: walletError } = await supabase
                .from('wallets')
                .select('id')
                .eq('user_id', userId)
                .single();

            if (walletError || !wallet) {
                Logger.info("Balance requested for non-existent wallet", { userId });
                return 0;
            }

            const { data, error } = await supabase
                .from('transactions')
                .select('amount')
                .eq('wallet_id', wallet.id);

            if (error) throw error;

            const balance = data.reduce((acc, curr) => acc + Number(curr.amount), 0);
            return balance;
        } catch (error) {
            Logger.error("Failed to fetch wallet balance", error, { userId });
            throw new WalletError("System could not retrieve balance.");
        }
    }

    /**
     * Funds the wallet (Atomic Credit)
     * @param {string} userId 
     * @param {number} amount 
     * @param {string} reference Paystack reference
     */
    async fundWallet(userId, amount, reference) {
        try {
            if (amount <= 0) throw new WalletError("Amount must be positive", ErrorCodes.VALIDATION_ERROR);

            const { data: wallet } = await supabase
                .from('wallets')
                .select('id')
                .eq('user_id', userId)
                .single();

            const { error } = await supabase
                .from('transactions')
                .insert({
                    wallet_id: wallet.id,
                    amount: amount,
                    type: 'FUNDING',
                    reference: reference,
                    metadata: { date: new Date().toISOString() }
                });

            if (error) {
                if (error.code === '23505') throw new WalletError("Duplicate transaction reference", ErrorCodes.TRANSACTION_FAILED);
                throw error;
            }

            Logger.info("Wallet funded successfully", { userId, amount, reference });
            return { success: true, amount };
        } catch (error) {
            Logger.error("Wallet funding failure", error, { userId, amount, reference });
            throw error instanceof WalletError ? error : new WalletError("Funding process failed.");
        }
    }

    /**
     * Debits the wallet (Atomic Debit with check constraint)
     * @param {string} userId 
     * @param {number} amount 
     * @param {string} serviceType e.g., 'NIN_VERIFY'
     */
    async debitWallet(userId, amount, serviceType) {
        try {
            if (amount <= 0) throw new WalletError("Amount must be positive", ErrorCodes.VALIDATION_ERROR);

            const { data: wallet } = await supabase
                .from('wallets')
                .select('id')
                .eq('user_id', userId)
                .single();

            const { error } = await supabase
                .from('transactions')
                .insert({
                    wallet_id: wallet.id,
                    amount: -amount,
                    type: 'SERVICE_FEE',
                    metadata: { service: serviceType, date: new Date().toISOString() }
                });

            if (error) {
                if (error.message.includes('no_negative_balance')) {
                    throw new WalletError("Insufficient wallet balance", ErrorCodes.INSUFFICIENT_BALANCE);
                }
                throw error;
            }

            Logger.info("Service debit successful", { userId, amount, serviceType });
            return { success: true, debited: amount };
        } catch (error) {
            Logger.error("Service debit failure", error, { userId, amount, serviceType });
            throw error instanceof WalletError ? error : new WalletError("Debit operation failed.");
        }
    }

    /**
     * Fetches the transaction history for a user
     * @param {string} userId 
     * @param {number} limit 
     * @returns {Promise<Array>}
     */
    async getTransactions(userId, limit = 10) {
        const { data: wallet } = await supabase
            .from('wallets')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (!wallet) return [];

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('wallet_id', wallet.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw new Error(`Could not fetch transactions: ${error.message}`);

        return data;
    }
}

export const walletService = new WalletService();
