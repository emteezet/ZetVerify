"use server";

import { identityService } from "../services/IdentityService";

/**
 * Server Action: Verifies identity (NIN/BVN)
 * @param {string} userId 
 * @param {string} type 'NIN' | 'BVN'
 * @param {string} value 
 */
export async function verifyIdentityAction(userId, type, value) {
    try {
        let result;
        if (type === 'NIN') {
            result = await identityService.verifyNin(userId, value);
        } else if (type === 'BVN') {
            result = await identityService.verifyBvn(userId, value);
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
