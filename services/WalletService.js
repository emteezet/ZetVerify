import { supabaseAdmin as supabase } from "../lib/supabase/admin";
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
                Logger.info("[WalletService] No wallet record found for user", { userId });
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

            let { data: wallet } = await supabase
                .from('wallets')
                .select('id')
                .eq('user_id', userId)
                .single();

            // The database trigger 'handle_new_user' should have created this.
            // We keep a lightweight fail-safe here just in case of race conditions.
            if (!wallet) {
                Logger.info("Wallet not found, attempting auto-creation fail-safe.", { userId });
                const { data: newWallet, error: createError } = await supabase
                    .from('wallets')
                    .insert({ user_id: userId })
                    .select('id')
                    .single();
                
                if (createError) throw createError;
                wallet = newWallet;
            }

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

            // ATOMIC DATABASE OPERATION: RPC Call
            // This replaces the manual check-then-insert pattern which is prone to race conditions.
            const { data, error } = await supabase.rpc('debit_wallet_v2', {
                p_user_id: userId,
                p_amount: amount,
                p_service_type: serviceType,
                p_metadata: { date: new Date().toISOString() }
            });

            if (error) {
                Logger.error('[WalletService.debitWallet] Atomic RPC failed', error, { userId });
                // Fallback for if the RPC function hasn't been created yet
                if (error.message?.includes('function') && error.message?.includes('does not exist')) {
                    throw new WalletError("System error: Atomic debit function missing. Please run the provided SQL in Supabase.");
                }
                throw error;
            }

            if (!data.success) {
                Logger.warn("Service debit denied by RPC", { userId, error: data.error, amount });
                if (data.code === 'INSUFFICIENT_BALANCE') {
                    throw new WalletError("Insufficient wallet balance", ErrorCodes.INSUFFICIENT_BALANCE);
                }
                throw new WalletError(data.error || "Debit operation failed.");
            }

            Logger.info("Service debit successful (Atomic)", { userId, amount, serviceType, txId: data.transaction_id });
            return { success: true, debited: amount, transactionId: data.transaction_id };
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

    /**
     * Refunds a previously debited amount (Atomic Credit)
     * @param {string} userId 
     * @param {number} amount 
     * @param {string} serviceType 
     */
    async refundWallet(userId, amount, serviceType) {
        try {
            const { data: wallet } = await supabase
                .from('wallets')
                .select('id')
                .eq('user_id', userId)
                .single();

            if (!wallet) throw new Error("Wallet not found for refund");

            const { error } = await supabase
                .from('transactions')
                .insert({
                    wallet_id: wallet.id,
                    amount: amount,
                    type: 'REFUND',
                    metadata: { service: serviceType, reason: 'Service failure', date: new Date().toISOString() }
                });

            if (error) throw error;

            Logger.info("Service refund successful", { userId, amount, serviceType });
            return { success: true, refunded: amount };
        } catch (error) {
            Logger.error("Service refund failure", error, { userId, amount, serviceType });
            throw error instanceof WalletError ? error : new WalletError("Refund operation failed.");
        }
    }
}

export const walletService = new WalletService();
