import { Logger } from "../lib/utils/logger";
import { WalletError, ErrorCodes } from "../lib/errors/AppError";
import { httpsFetch } from "../lib/utils/httpsFetch";

/**
 * @class PaystackService
 * @description Handles Paystack payment initialization and verification
 */
export class PaystackService {
    constructor() {
        this.secretKey = process.env.PAYSTACK_SECRET_KEY;
        this.baseUrl = "https://api.paystack.co";
    }

    /**
     * Initializes a transaction
     * @param {string} email 
     * @param {number} amount In Kobo
     * @param {string} callbackUrl 
     * @returns {Promise<object>}
     */
    async initializeTransaction(email, amount, callbackUrl) {
        if (!this.secretKey) {
            Logger.warn("[PaystackService] No secret key found. Mocking initialization.");
            return {
                status: true,
                data: {
                    authorization_url: `${callbackUrl}?reference=mock_ref_${Date.now()}`,
                    reference: `mock_ref_${Date.now()}`
                }
            };
        }

        try {
            const response = await httpsFetch(`${this.baseUrl}/transaction/initialize`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    amount,
                    callback_url: callbackUrl,
                    channels: ['bank_transfer', 'bank'],
                }),
            });

            const data = await response.json();
            if (!data.status) throw new WalletError(data.message || "Initialization failed");

            Logger.info("Paystack transaction initialized", { email, amountNaira: amount / 100 });
            return data;
        } catch (error) {
            Logger.error("Paystack initialization failure", error, { email, amountNaira: amount / 100 });
            throw error instanceof WalletError ? error : new WalletError("Failed to connect to payment gateway");
        }
    }

    /**
     * Verifies a transaction
     * @param {string} reference 
     * @returns {Promise<object>}
     */
    async verifyTransaction(reference) {
        if (!this.secretKey) {
            Logger.warn("[PaystackService] Mock verification", { reference });
            return { status: true, data: { status: 'success', amount: 500000 } };
        }

        try {
            const response = await httpsFetch(`${this.baseUrl}/transaction/verify/${reference}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                },
            });

            const data = await response.json();
            if (!data.status) throw new WalletError(data.message || "Verification failed");

            Logger.info("Paystack transaction verified", { reference, status: data.data.status });
            return data;
        } catch (error) {
            Logger.error("Paystack verification failure", error, { reference });
            throw error instanceof WalletError ? error : new WalletError("Failed to verify payment with provider");
        }
    }

    verifyWebhookSignature(bodyString, signature) {
        if (!this.secretKey) {
            Logger.warn("[PaystackService] No secret key for signature verification. Defaulting to true for development.");
            return true;
        }
        
        const crypto = require("crypto");
        const hash = crypto.createHmac('sha512', this.secretKey).update(bodyString).digest('hex');
        return hash === signature;
    }
}

export const paystackService = new PaystackService();
