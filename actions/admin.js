"use server";

import { adminService } from "../services/AdminService";

/**
 * Server Action: Fetches platform-wide stats for the admin dashboard
 * @param {string} userEmail The email of the user requesting stats
 * @returns {Promise<object>}
 */
export async function getPlatformStatsAction(userEmail) {
    try {
        // Simple authorization check: Only allow specific admin email
        // In a real app, this would use RBAC/Roles from the DB.
        const adminEmail = process.env.ADMIN_EMAIL || "admin@ninplatform.com";

        if (userEmail !== adminEmail) {
            throw new Error("Unauthorized access to admin dashboard.");
        }

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
