import { IKycProvider } from "./IKycProvider";

/**
 * @class PrimaryKycProvider
 * @implements {IKycProvider}
 * @description Production wrapper for real KYC vendor API (e.g., SmileID, YouVerify)
 */
export class PrimaryKycProvider extends IKycProvider {
    constructor() {
        super();
        this.apiKey = process.env.KYC_VENDOR_API_KEY;
        this.baseUrl = process.env.KYC_VENDOR_BASE_URL;
    }

    /**
     * @param {string} nin 
     */
    async fetchByNin(nin) {
        if (!this.apiKey) {
            throw new Error("KYC Vendor API Key not configured.");
        }

        console.log(`[PrimaryKycProvider] Real Fetch for NIN: ${nin}`);

        // Logic for actual vendor HTTP call would go here
        // Example: const res = await fetch(`${this.baseUrl}/nin`, { ... });

        throw new Error("PrimaryKycProvider logic not fully implemented for specific vendor.");
    }

    /**
     * @param {string} bvn 
     */
    async fetchByBvn(bvn) {
        if (!this.apiKey) {
            throw new Error("KYC Vendor API Key not configured.");
        }

        console.log(`[PrimaryKycProvider] Real Fetch for BVN: ${bvn}`);

        // Logic for actual vendor HTTP call would go here

        throw new Error("PrimaryKycProvider logic not fully implemented for specific vendor.");
    }
}
