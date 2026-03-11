/**
 * @interface IKycProvider
 * @description Universal interface for Identity Providers (Strategy Pattern)
 */
export class IKycProvider {
    /**
     * Fetch Identity data by NIN
     * @param {string} nin 
     * @returns {Promise<object>}
     */
    async fetchByNin(nin) {
        throw new Error("Method 'fetchByNin()' must be implemented.");
    }

    /**
     * Fetch Identity data by BVN
     * @param {string} bvn 
     * @returns {Promise<object>}
     */
    async fetchByBvn(bvn) {
        throw new Error("Method 'fetchByBvn()' must be implemented.");
    }
}
