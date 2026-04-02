import { NinBvnPortalProvider } from "../lib/adapters/NinBvnPortalProvider";
import { QoreIdProvider } from "../lib/adapters/QoreIdProvider";
import { walletService } from "./WalletService";
import { supabaseAdmin as supabase } from "../lib/supabase/admin";
import { encryptIdentity, maskData } from "../lib/crypto/encryption";
import { Logger } from "../lib/utils/logger";
import { IdentityError, ErrorCodes } from "../lib/errors/AppError";

const VERIFICATION_FEES = {
    NIN: 150,           // Verify NIN (Direct)
    NIN_PHONE: 150,     // Search NIN by Phone
    NIN_TRACKING: 150,  // Search NIN by Tracking ID
    BVN: 150,           // Verify BVN (Direct)
    BVN_PHONE: 150      // Search BVN by Phone
};

/**
 * @class IdentityService
 * @description Core service for identity verification logic
 */
export class IdentityService {
    constructor(provider = null, walletSvc = null) {
        // Resolve provider based on environment if not explicitly provided
        if (!provider) {
            const providerType = process.env.KYC_PROVIDER || 'ninbvnportal';
            switch (providerType.toLowerCase()) {
                case 'ninbvnportal':
                    provider = new NinBvnPortalProvider();
                    break;
                case 'qoreid':
                    provider = new QoreIdProvider();
                    break;
                default:
                    throw new Error(`Invalid or unsupported KYC provider: ${providerType}`);
            }
        }

        this.provider = provider;
        this.walletService = walletSvc || walletService;
    }

    /**
     * Common handler for verification with debit
     * @private
     */
    /**
     * Common handler for verification with debit
     * @private
     */
    async _processVerification(userId, identifier, fee, type, fetchMethod, slipType = 'regular') {
        Logger.info(`Initiating ${type} verification (Debit-First)`, { userId, identifier: maskData(identifier) });

        try {
            // 1. Debit wallet first! (Atomic protection against race conditions)
            await this.walletService.debitWallet(userId, fee, type, { identifier });

            // 2. Fetch data from provider
            let result;
            try {
                result = await fetchMethod();
            } catch (providerError) {
                // 3. REFUND if the provider call itself fails
                Logger.error(`${type} Provider system error. Rolling back debit.`, providerError, { userId });
                await this.walletService.refundWallet(userId, fee, type);
                throw providerError;
            }

            if (result.success) {
                Logger.info(`${type} verification successful`, { userId });

                const mappedData = { ...result.data };
                
                // 4. Normalize and Encrypt sensitive data
                if (mappedData.nin) mappedData.nin = encryptIdentity(mappedData.nin);
                if (mappedData.bvn) mappedData.bvn = encryptIdentity(mappedData.bvn);
                
                // Standardize Photo/DOB formats
                if (mappedData.photo && !mappedData.photo.startsWith('http') && !mappedData.photo.startsWith('data:image')) {
                    mappedData.photo = `data:image/jpeg;base64,${mappedData.photo}`;
                }
                if (mappedData.dob) {
                    const dob = mappedData.dob;
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
                        const parts = dob.split(/[-/]/);
                        if (parts.length === 3) {
                            if (parts[0].length === 2 && parts[2].length === 4) {
                                mappedData.dob = `${parts[2]}-${parts[1]}-${parts[0]}`;
                            }
                        }
                    }
                }
                
                // 5. Save to History
                await this._saveVerificationHistory(userId, type, identifier, mappedData, slipType);

                return {
                    ...result,
                    data: mappedData
                };
            }

            // 6. REFUND if provider returns success: false
            Logger.warn(`${type} verification failed by provider. Rolling back debit.`, { userId, error: result.error });
            await this.walletService.refundWallet(userId, fee, type);
            throw new IdentityError(result.error || "Identity not found in registry", ErrorCodes.IDENTITY_NOT_FOUND);

        } catch (error) {
            Logger.error(`IdentityService ${type} verification failure`, error, { userId });
            throw error instanceof IdentityError ? error : new IdentityError(`Verification system error: ${error.message}`);
        }
    }

    /**
     * Persists verification result to the history table
     * @private
     */
    async _saveVerificationHistory(userId, type, identifier, data, slipType = 'regular') {
        try {
            Logger.info(`Saving ${type} to verification history`, { userId, identifier: maskData(identifier) });
            
            const { error } = await supabase
                .from('verification_history')
                .insert({
                    user_id: userId,
                    type: type,
                    identifier: encryptIdentity(identifier),
                    id_data: JSON.stringify(data),
                    slip_type: slipType
                });

            if (error) {
                Logger.error("Failed to save verification history", error, { userId });
            }
        } catch (err) {
            Logger.error("Critical error in _saveVerificationHistory", err, { userId });
        }
    }

    /**
     * Processes a NIN verification request
     */
    async verifyNin(userId, nin, slipType = 'regular') {
        return this._processVerification(userId, nin, VERIFICATION_FEES.NIN, 'NIN_VERIFY', () => this.provider.fetchByNin(nin), slipType);
    }

    /**
     * Processes a NIN by Phone verification request
     */
    async verifyByNinPhone(userId, phone, slipType = 'regular') {
        return this._processVerification(userId, phone, VERIFICATION_FEES.NIN_PHONE, 'NIN_PHONE_VERIFY', () => this.provider.fetchByNinPhone(phone), slipType);
    }

    /**
     * Processes a NIN by Tracking ID verification request
     */
    async verifyByNinTracking(userId, trackingId, slipType = 'regular') {
        return this._processVerification(userId, trackingId, VERIFICATION_FEES.NIN_TRACKING, 'NIN_TRACKING_VERIFY', () => this.provider.fetchByNinTracking(trackingId), slipType);
    }

    /**
     * Processes a NIN by Demography verification request
     */
    async verifyByNinDemography(userId, payload, slipType = 'regular') {
        const identifier = `${payload.firstname} ${payload.lastname}`;
        return this._processVerification(userId, identifier, VERIFICATION_FEES.NIN_TRACKING, 'NIN_DEMO_VERIFY', () =>
            this.provider.fetchByNinDemography(payload.firstname, payload.lastname, payload.gender, payload.dob),
            slipType
        );
    }

    /**
     * Processes a BVN verification request
     */
    async verifyBvn(userId, bvn, slipType = 'regular') {
        return this._processVerification(userId, bvn, VERIFICATION_FEES.BVN, 'BVN_VERIFY', () => this.provider.fetchByBvn(bvn), slipType);
    }

    /**
     * Processes a BVN by Phone verification request
     */
    async verifyBvnPhone(userId, phone, slipType = 'regular') {
        return this._processVerification(userId, phone, VERIFICATION_FEES.BVN_PHONE, 'BVN_PHONE_VERIFY', () => this.provider.fetchByBvnPhone(phone), slipType);
    }
}

// Export a singleton instance 
export const identityService = new IdentityService();
