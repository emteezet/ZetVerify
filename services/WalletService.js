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
            console.log('[WalletService.getBalance] Called with userId:', userId);
            
            const { data: wallet, error: walletError } = await supabase
                .from('wallets')
                .select('id')
                .eq('user_id', userId)
                .single();

            console.log('[WalletService.getBalance] Wallet query result:', { wallet, walletError: walletError?.message });

            if (walletError || !wallet) {
                Logger.info("[WalletService] No wallet record found for user", { userId });
                return 0;
            }

            const { data, error } = await supabase
                .from('transactions')
                .select('amount')
                .eq('wallet_id', wallet.id);

            console.log('[WalletService.getBalance] Transactions:', { count: data?.length, error: error?.message });

            if (error) throw error;

            const balance = data.reduce((acc, curr) => acc + Number(curr.amount), 0);
            console.log('[WalletService.getBalance] Computed balance:', balance);
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
