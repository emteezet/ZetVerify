"use server";

import { adminService } from "../services/AdminService";
import { getServerUser } from "../lib/auth/session";

/**
 * Server Action: Fetches platform statistics for the admin dashboard
 */
export async function getPlatformStatsAction() {
    try {
        const user = await getServerUser();
        
        // Security Check: Only allow if the logged-in user email matches the admin email
        const adminEmail = (process.env.ADMIN_EMAIL || "emteezetdesigns@gmail.com").toLowerCase().trim();
        
        if (!user || user.email.toLowerCase().trim() !== adminEmail) {
            console.error(`[Admin Auth] Unauthorized access attempt by: ${user?.email || 'Anonymous'}`);
            return {
                success: false,
                error: "Unauthorized access. Admin privileges required.",
                code: "UNAUTHORIZED"
            };
        }

        console.log(`[Admin Auth] Authorized access for: ${user.email}`);
        const stats = await adminService.getPlatformStats();
        return { success: true, stats };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            code: error.code || 'AUTH_ERROR'
        };
    }
}
