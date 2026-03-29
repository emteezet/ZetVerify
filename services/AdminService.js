import { supabaseAdmin as supabase } from "../lib/supabase/admin";

/**
 * @class AdminService
 * @description Handles platform-wide administrative statistics and monitoring.
 */
export class AdminService {
    /**
     * Fetches aggregate statistics for the admin dashboard.
     * @returns {Promise<object>}
     */
    /**
     * Recent Activity (Last 10 transactions across the platform)
     * @returns {Promise<object>}
     */
    async getPlatformStats() {
        try {
            // ... (keeping existing logic for brevity in this replace call, but I will include the full method body below)
            const { count: userCount, error: userError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            if (userError) throw userError;

            const { count: txCount, error: txError } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true });

            if (txError) throw txError;

            const { data: revenueData, error: revenueError } = await supabase
                .from('transactions')
                .select('amount')
                .eq('type', 'SERVICE_FEE');

            if (revenueError) throw revenueError;
            const totalRevenue = revenueData.reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0);

            const { data: fundingData, error: fundingError } = await supabase
                .from('transactions')
                .select('amount')
                .eq('type', 'FUNDING');

            if (fundingError) throw fundingError;
            const totalFunding = fundingData.reduce((acc, curr) => acc + Number(curr.amount), 0);

            const { data: recentActivity, error: activityError } = await supabase
                .from('transactions')
                .select(`
                    *,
                    wallet:wallets(user:profiles(email, first_name, last_name))
                `)
                .order('created_at', { ascending: false })
                .limit(10);

            if (activityError) throw activityError;

            return {
                users: userCount || 0,
                transactions: txCount || 0,
                revenue: totalRevenue,
                funding: totalFunding,
                recentActivity: recentActivity || []
            };
        } catch (error) {
            console.error("[AdminService] Error fetching stats:", error);
            throw error;
        }
    }

    /**
     * Fetches all users with their ledger-calculated wallet balance
     */
    async getAllUsers() {
        try {
            // 1. Fetch all profiles and their associated wallets
            const { data: users, error: userError } = await supabase
                .from('profiles')
                .select(`
                    *,
                    wallet:wallets(id)
                `)
                .order('updated_at', { ascending: false });

            if (userError) throw userError;

            // 2. Fetch all transaction sums grouped by wallet_id
            // Note: Since standard Supabase JS doesn't support grouping/aggregation in select easily, 
            // we'll fetch all transaction amounts and sum them in memory for this admin list.
            const { data: transactions, error: txError } = await supabase
                .from('transactions')
                .select('wallet_id, amount');

            if (txError) throw txError;

            // 3. Create a balance map
            const balanceMap = transactions.reduce((acc, curr) => {
                acc[curr.wallet_id] = (acc[curr.wallet_id] || 0) + Number(curr.amount);
                return acc;
            }, {});

            // 4. Attach balances to users
            return users.map(u => ({
                ...u,
                wallet_balance: balanceMap[u.wallet?.[0]?.id] || 0
            }));
        } catch (error) {
            console.error("[AdminService] Error fetching users:", error);
            throw error;
        }
    }

    /**
     * Manually updates a user's wallet balance (By inserting a transaction)
     */
    async updateUserWallet(userId, amount, type, description) {
        try {
            // 1. Find the wallet
            const { data: wallet, error: walletError } = await supabase
                .from('wallets')
                .select('id')
                .eq('user_id', userId)
                .single();

            if (walletError) throw walletError;

            // 2. Create audit trail in transactions (This is the source of truth for balance)
            const { data: tx, error: txError } = await supabase
                .from('transactions')
                .insert({
                    wallet_id: wallet.id,
                    amount: amount,
                    type: type, // e.g., 'FUNDING', 'SERVICE_FEE', 'REFUND'
                    description: description,
                    reference: `ADMIN-${Math.random().toString(36).substring(7).toUpperCase()}`
                })
                .select()
                .single();

            if (txError) throw txError;

            // 3. Calculate new balance for response
            const { data: txs, error: sumError } = await supabase
                .from('transactions')
                .select('amount')
                .eq('wallet_id', wallet.id);
            
            if (sumError) throw sumError;
            const newBalance = txs.reduce((acc, curr) => acc + Number(curr.amount), 0);

            return { success: true, newBalance };
        } catch (error) {
            console.error("[AdminService] Error updating wallet:", error);
            throw error;
        }
    }
}

export const adminService = new AdminService();
