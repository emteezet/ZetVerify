import { MockKycProvider } from "../lib/adapters/MockKycProvider";
import { NinBvnPortalProvider } from "../lib/adapters/NinBvnPortalProvider";
import { walletService } from "./WalletService";
import { encryptIdentity, maskData } from "../lib/crypto/encryption";
import { Logger } from "../lib/utils/logger";
import { IdentityError, ErrorCodes } from "../lib/errors/AppError";

const VERIFICATION_FEES = {
    NIN: 150, // Updated based on NinBvnPortal pricing
    BVN: 100
};

/**
 * @class IdentityService
 * @description Core service for identity verification logic
 */
export class IdentityService {
    constructor(provider = null, walletSvc = null) {
        // Resolve provider based on environment if not explicitly provided
        if (!provider) {
            const providerType = process.env.KYC_PROVIDER || 'mock';
            switch (providerType.toLowerCase()) {
                case 'ninbvnportal':
                    provider = new NinBvnPortalProvider();
                    break;
                case 'mock':
                default:
                    provider = new MockKycProvider();
                    break;
            }
        }

        this.provider = provider;
        this.walletService = walletSvc || walletService;
    }

    /**
     * Processes a NIN verification request with atomic debit
     * @param {string} userId
     * @param {string} nin 
     * @returns {Promise<object>}
     */
    async verifyNin(userId, nin) {
        Logger.info("Initiating NIN verification", { userId, nin: maskData(nin) });

        try {
            // 1. Deduct fee first (Atomic Debit with check constraint)
            await this.walletService.debitWallet(userId, VERIFICATION_FEES.NIN, 'NIN_VERIFY');

            // 2. Fetch data from provider
            const result = await this.provider.fetchByNin(nin);

            if (result.success) {
                Logger.info("NIN verification successful", { userId, nin: maskData(nin) });
                // NDPR: Encrypt sensitive data before returning
                return {
                    ...result,
                    data: {
                        ...result.data,
                        nin: encryptIdentity(result.data.nin) // Encrypt raw NIN
                    }
                };
            }

            Logger.warn("NIN verification failed by provider", { userId, error: result.error });
            throw new IdentityError(result.error || "Identity not found in registry", ErrorCodes.IDENTITY_NOT_FOUND);
        } catch (error) {
            Logger.error("IdentityService NIN verification failure", error, { userId });
            throw error instanceof IdentityError ? error : new IdentityError(`Verification system error: ${error.message}`);
        }
    }

    /**
     * Processes a BVN verification request with atomic debit
     * @param {string} userId
     * @param {string} bvn 
     * @returns {Promise<object>}
     */
    async verifyBvn(userId, bvn) {
        Logger.info("Initiating BVN verification", { userId, bvn: maskData(bvn) });

        try {
            // 1. Deduct fee
            await this.walletService.debitWallet(userId, VERIFICATION_FEES.BVN, 'BVN_VERIFY');

            const result = await this.provider.fetchByBvn(bvn);

            if (result.success) {
                Logger.info("BVN verification successful", { userId, bvn: maskData(bvn) });
                return {
                    ...result,
                    data: {
                        ...result.data,
                        bvn: encryptIdentity(result.data.bvn) // Encrypt raw BVN
                    }
                };
            }

            Logger.warn("BVN verification failed by provider", { userId, error: result.error });
            throw new IdentityError(result.error || "BVN record not found", ErrorCodes.IDENTITY_NOT_FOUND);
        } catch (error) {
            Logger.error("IdentityService BVN verification failure", error, { userId });
            throw error instanceof IdentityError ? error : new IdentityError(`Verification system error: ${error.message}`);
        }
    }
}

// Export a singleton instance with Mock default
export const identityService = new IdentityService();
