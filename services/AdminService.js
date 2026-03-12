import { supabase } from "../lib/supabase/client";

/**
 * @class AdminService
 * @description Handles platform-wide administrative statistics and monitoring.
 */
export class AdminService {
    /**
     * Fetches aggregate statistics for the admin dashboard.
     * @returns {Promise<object>}
     */
    async getPlatformStats() {
        try {
            // 1. Total Users
            const { count: userCount, error: userError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            if (userError) throw userError;

            // 2. Total Transactions (Ledger Entries)
            const { count: txCount, error: txError } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true });

            if (txError) throw txError;

            // 3. Total Revenue (Sum of all negative SERVICE_FEE amounts)
            const { data: revenueData, error: revenueError } = await supabase
                .from('transactions')
                .select('amount')
                .eq('type', 'SERVICE_FEE');

            if (revenueError) throw revenueError;

            const totalRevenue = revenueData.reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0);

            // 4. Total Funding (Sum of all positive FUNDING amounts)
            const { data: fundingData, error: fundingError } = await supabase
                .from('transactions')
                .select('amount')
                .eq('type', 'FUNDING');

            if (fundingError) throw fundingError;

            const totalFunding = fundingData.reduce((acc, curr) => acc + Number(curr.amount), 0);

            // 5. Recent Activity (Last 10 transactions across the platform)
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
            throw new Error(`Failed to fetch platform stats: ${error.message}`);
        }
    }
}

export const adminService = new AdminService();
