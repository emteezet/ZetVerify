"use server";

import { adminService } from "../services/AdminService";
import { getServerUser } from "../lib/auth/session";

/**
 * Reusable helper to enforce admin-only access
 */
async function requireAdmin() {
    const user = await getServerUser();
    const adminEmail = (process.env.ADMIN_EMAIL || "emteezetdesigns@gmail.com").toLowerCase().trim();
    
    if (!user || user.email.toLowerCase().trim() !== adminEmail) {
        console.error(`[Admin Auth] Unauthorized access attempt by: ${user?.email || 'Anonymous'}`);
        throw new Error("Unauthorized access. Admin privileges required.");
    }
    return user;
}

/**
 * Server Action: Fetches platform statistics for the admin dashboard
 */
export async function getPlatformStatsAction() {
    try {
        await requireAdmin();
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

/**
 * Server Action: Fetches all registered users
 */
export async function getAllUsersAction() {
    try {
        await requireAdmin();
        const users = await adminService.getAllUsers();
        return { success: true, users };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Manually Adjusts user wallet
 */
export async function updateUserWalletAction(targetUserId, amount, type, description) {
    try {
        await requireAdmin();
        const result = await adminService.updateUserWallet(targetUserId, amount, type, description);
        return { success: true, ...result };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Toggles a user's status
 */
export async function updateUserStatusAction(targetUserId, status, reason) {
    try {
        await requireAdmin();
        const result = await adminService.updateUserStatus(targetUserId, status, reason);
        return { success: true, ...result };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Fetches comprehensive activity for a specific user
 */
export async function getUserActivityAction(targetUserId) {
    try {
        await requireAdmin();
        const data = await adminService.getUserActivity(targetUserId);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
/**
 * Server Action: Fetches paginated transactions for a user
 */
export async function getUserTransactionsAction(userId, limit = 10, offset = 0) {
    try {
        await requireAdmin();
        const data = await adminService.getUserTransactions(userId, limit, offset);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
/**
 * Server Action: Fetches paginated platform-wide activity
 */
export async function getPaginatedGlobalActivityAction(page = 1, pageSize = 10) {
    try {
        await requireAdmin();
        const offset = (page - 1) * pageSize;
        const result = await adminService.getPaginatedGlobalActivity(pageSize, offset);
        return { success: true, ...result };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Permanently deletes a user
 */
export async function deleteUserAction(targetUserId) {
    try {
        await requireAdmin();
        const result = await adminService.deleteUser(targetUserId);
        return { success: true, ...result };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Gets daily revenue data for the last 30 days (analytics chart)
 */
export async function getRevenueChartDataAction() {
    try {
        await requireAdmin();
        const data = await adminService.getRevenueChartData();
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Gets verification volume + breakdown for analytics
 */
export async function getVerificationChartDataAction() {
    try {
        await requireAdmin();
        const data = await adminService.getVerificationChartData();
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Gets all verification_history records (paginated)
 */
export async function getAllVerificationsAction(page = 1, pageSize = 20) {
    try {
        await requireAdmin();
        const offset = (page - 1) * pageSize;
        const result = await adminService.getAllVerifications(pageSize, offset);
        return { success: true, ...result };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
