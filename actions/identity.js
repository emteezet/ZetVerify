"use server";

import { identityService } from "../services/IdentityService";
import { requireAuth } from "../lib/auth/session";

/**
 * Server Action: Verifies identity (NIN/BVN)
 * @param {string} type 'NIN' | 'BVN'
 * @param {string} value 
 */
export async function verifyIdentityAction(type, value) {
    try {
        const user = await requireAuth();
        let result;
        if (type === 'NIN') {
            result = await identityService.verifyNin(user.id, value);
        } else if (type === 'BVN') {
            result = await identityService.verifyBvn(user.id, value);
        } else {
            throw new Error("Invalid identity type");
        }

        return { success: true, ...result };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            code: error.code || 'IDENTITY_ERROR'
        };
    }
}
