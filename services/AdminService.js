import { decryptIdentity } from "../lib/crypto/encryption";
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
     * Fetches all users with their calculated wallet balance
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
            return users.map(u => {
                const wallet = Array.isArray(u.wallet) ? u.wallet[0] : u.wallet;
                return {
                    ...u,
                    wallet_balance: balanceMap[wallet?.id] || 0
                };
            });
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
                    metadata: { 
                        description: description,
                        admin_adjustment: true,
                        date: new Date().toISOString()
                    },
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

    /**
     * Updates the status of a user (ACTIVE, SUSPENDED, BLOCKED)
     */
    async updateUserStatus(userId, status, reason = "") {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({ 
                    status: status,
                    suspension_reason: reason,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, profile: data };
        } catch (error) {
            console.error("[AdminService] Error updating user status:", error);
            throw error;
        }
    }

    /**
     * Fetches comprehensive activity for a specific user
     */
    async getUserActivity(userId) {
        try {
            // 1. Fetch verification history
            const { data: verifications, error: vError } = await supabase
                .from('verification_history')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (vError) throw vError;

            // Decrypt identifiers for admin view
            const decryptedVerifications = verifications?.map(v => ({
                ...v,
                decrypted_identifier: decryptIdentity(v.identifier)
            })) || [];

            // 2. Fetch wallet and transactions
            const { data: wallet, error: wError } = await supabase
                .from('wallets')
                .select('id')
                .eq('user_id', userId)
                .single();

            if (wError && wError.code !== 'PGRST116') throw wError;

            let transactions = [];
            if (wallet) {
                const { data: txs, error: tError } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('wallet_id', wallet.id)
                    .order('created_at', { ascending: false })
                    .limit(10); // Initial 10
                
                if (tError) throw tError;
                transactions = txs;
            }

            // 3. Get total transaction count and total spent for stats
            let totalTransactions = 0;
            let totalSpent = 0;
            if (wallet) {
                const { data: allTxs, count, error: countError } = await supabase
                    .from('transactions')
                    .select('amount', { count: 'exact' })
                    .eq('wallet_id', wallet.id);
                
                if (!countError) {
                    totalTransactions = count || 0;
                    totalSpent = allTxs
                        ?.filter(t => Number(t.amount) < 0)
                        .reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0) || 0;
                }
            }

            return {
                verifications: decryptedVerifications,
                transactions: transactions || [],
                hasMoreTransactions: (transactions?.length || 0) < totalTransactions,
                totalTransactions,
                stats: {
                    totalVerifications: decryptedVerifications.length,
                    totalSpent: totalSpent
                }
            };
        } catch (error) {
            console.error("[AdminService] Error fetching user activity:", error);
            throw error;
        }
    }

    /**
     * Fetches paginated transactions for a user
     */
    async getUserTransactions(userId, limit = 10, offset = 0) {
        try {
            const { data: wallet, error: wError } = await supabase
                .from('wallets')
                .select('id')
                .eq('user_id', userId)
                .single();

            if (wError) throw wError;

            const { data: transactions, error: tError } = await supabase
                .from('transactions')
                .select('*')
                .eq('wallet_id', wallet.id)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (tError) throw tError;

            const { count, error: countError } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true })
                .eq('wallet_id', wallet.id);

            return {
                transactions: transactions || [],
                hasMore: (offset + transactions.length) < (count || 0)
            };
        } catch (error) {
            console.error("[AdminService] Error fetching paginated transactions:", error);
            throw error;
        }
    }
    /**
     * Fetches paginated platform-wide transactions
     */
    async getPaginatedGlobalActivity(limit = 10, offset = 0) {
        try {
            const { data: transactions, error: txError } = await supabase
                .from('transactions')
                .select(`
                    *,
                    wallet:wallets(user:profiles(email, first_name, last_name))
                `)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (txError) throw txError;

            const { count, error: countError } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true });

            if (countError) throw countError;

            return {
                transactions: transactions || [],
                total: count || 0
            };
        } catch (error) {
            console.error("[AdminService] Error fetching paginated global activity:", error);
            throw error;
        }
    }

    /**
     * Permanently deletes a user and all associated data.
     */
    async deleteUser(userId) {
        try {
            // Deletion order to respect FKs (if not handled by cascade)
            // 1. Delete transactions
            const { data: wallet } = await supabase
                .from('wallets')
                .select('id')
                .eq('user_id', userId)
                .single();

            if (wallet) {
                await supabase.from('transactions').delete().eq('wallet_id', wallet.id);
                await supabase.from('wallets').delete().eq('id', wallet.id);
            }

            // 2. Delete verification history
            await supabase.from('verification_history').delete().eq('user_id', userId);

            // 3. Delete profile
            await supabase.from('profiles').delete().eq('id', userId);

            // 4. Delete Auth user
            const { error: authError } = await supabase.auth.admin.deleteUser(userId);
            if (authError) throw authError;

            return { success: true };
        } catch (error) {
            console.error("[AdminService] Error deleting user:", error);
            throw error;
        }
    }
    /**
     * Groups SERVICE_FEE transactions by day for the last 30 days (revenue chart)
     */
    async getRevenueChartData() {
        try {
            const since = new Date();
            since.setDate(since.getDate() - 30);

            const { data, error } = await supabase
                .from('transactions')
                .select('amount, created_at')
                .eq('type', 'SERVICE_FEE')
                .gte('created_at', since.toISOString())
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Group by date string
            const grouped = {};
            for (let i = 29; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                grouped[d.toISOString().slice(0, 10)] = 0;
            }
            (data || []).forEach(tx => {
                const day = tx.created_at.slice(0, 10);
                if (grouped[day] !== undefined) {
                    grouped[day] += Math.abs(Number(tx.amount));
                }
            });

            return Object.entries(grouped).map(([date, value]) => ({ date, value }));
        } catch (error) {
            console.error('[AdminService] getRevenueChartData error:', error);
            throw error;
        }
    }

    /**
     * Groups verifications by day + type for the last 30 days, and top users by spend
     */
    async getVerificationChartData() {
        try {
            const since = new Date();
            since.setDate(since.getDate() - 30);

            const { data: verifs, error: vError } = await supabase
                .from('verification_history')
                .select('type, created_at')
                .gte('created_at', since.toISOString())
                .order('created_at', { ascending: true });

            if (vError) throw vError;

            // Daily volume
            const dailyMap = {};
            for (let i = 29; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                dailyMap[d.toISOString().slice(0, 10)] = { nin: 0, bvn: 0 };
            }
            (verifs || []).forEach(v => {
                const day = v.created_at.slice(0, 10);
                if (dailyMap[day]) {
                    if (v.type?.includes('BVN')) dailyMap[day].bvn++;
                    else dailyMap[day].nin++;
                }
            });
            const daily = Object.entries(dailyMap).map(([date, counts]) => ({ date, ...counts }));

            // Overall split totals
            const ninTotal = (verifs || []).filter(v => !v.type?.includes('BVN')).length;
            const bvnTotal = (verifs || []).filter(v => v.type?.includes('BVN')).length;

            // Top 5 spenders (by SERVICE_FEE)
            const { data: spenders, error: sError } = await supabase
                .from('transactions')
                .select('amount, wallet:wallets(user:profiles(first_name, last_name, email))')
                .eq('type', 'SERVICE_FEE');

            if (sError) throw sError;

            const spendMap = {};
            (spenders || []).forEach(tx => {
                const u = tx.wallet?.user;
                if (!u) return;
                const key = u.email;
                if (!spendMap[key]) spendMap[key] = { name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email, total: 0 };
                spendMap[key].total += Math.abs(Number(tx.amount));
            });
            const topSpenders = Object.values(spendMap)
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

            return { daily, ninTotal, bvnTotal, topSpenders };
        } catch (error) {
            console.error('[AdminService] getVerificationChartData error:', error);
            throw error;
        }
    }

    /**
     * Fetches all verification_history records (paginated) for the identity logs page
     */
    async getAllVerifications(limit = 20, offset = 0) {
        try {
            const { data, error, count } = await supabase
                .from('verification_history')
                .select('*, user:profiles(first_name, last_name, email)', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            const decrypted = (data || []).map(v => ({
                ...v,
                decrypted_identifier: decryptIdentity(v.identifier)
            }));

            return { verifications: decrypted, total: count || 0 };
        } catch (error) {
            console.error('[AdminService] getAllVerifications error:', error);
            throw error;
        }
    }
}

export const adminService = new AdminService();
