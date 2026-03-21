import { IKycProvider } from "./IKycProvider";
import { Logger } from "../utils/logger";
import { httpsFetch } from "../utils/httpsFetch";

// ─── Token Cache ──────────────────────────────────────────────────────────────
// QoreID token expires every 2 hours (7200 seconds).
// We cache it in memory and refresh 5 minutes before expiry.
let tokenCache = {
    accessToken: null,
    expiresAt: null, // Unix timestamp (ms)
};

const TOKEN_URL = "https://api.qoreid.com/token";
const BASE_URL = "https://api.qoreid.com/v1/ng/identities";
const TOKEN_EXPIRY_MS = 2 * 60 * 60 * 1000;  // 2 hours
const REFRESH_BUFFER_MS = 5 * 60 * 1000;      // refresh 5 minutes early

/**
 * @class QoreIdProvider
 * @implements {IKycProvider}
 * @description Implementation for QoreID API (NIN Premium & NIN Phone Premium)
 */
export class QoreIdProvider extends IKycProvider {
    constructor() {
        super();
        this.clientId = process.env.QOREID_CLIENT_ID;
        this.secretKey = process.env.QOREID_SECRET_KEY;

        if (!this.clientId || !this.secretKey) {
            Logger.error("QoreIdProvider: QOREID_CLIENT_ID or QOREID_SECRET_KEY is missing in environment variables.");
        }
    }

    // ─── Token Management ─────────────────────────────────────────────────────
    /**
     * Get a valid access token, using cache when possible.
     * Automatically refreshes 5 minutes before the 2-hour expiry.
     * @private
     */
    async _getAccessToken() {
        const now = Date.now();

        // Return cached token if still valid
        if (tokenCache.accessToken && tokenCache.expiresAt && now < tokenCache.expiresAt - REFRESH_BUFFER_MS) {
            console.log("[QoreID] ✅ Using cached token");
            return tokenCache.accessToken;
        }

        // Fetch a fresh token
        console.log("[QoreID] 🔄 Fetching new token...");
        console.log("[QoreID] Token URL:", TOKEN_URL);
        console.log("[QoreID] Client ID present:", !!this.clientId);
        console.log("[QoreID] Secret present:", !!this.secretKey);
        try {
            const response = await httpsFetch(TOKEN_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clientId: this.clientId,
                    secret: this.secretKey,
                }),
            });

            console.log("[QoreID] Token response status:", response.status);
            const result = await response.json();

            if (!response.ok || !result.accessToken) {
                throw new Error(result.message || `Token request failed (${response.status})`);
            }

            // Cache the token
            tokenCache = {
                accessToken: result.accessToken,
                expiresAt: now + TOKEN_EXPIRY_MS,
            };

            console.log("[QoreID] ✅ New token cached, valid for 2 hours");
            return result.accessToken;
        } catch (error) {
            console.error("[QoreID] Token fetch error details:", {
                name: error.name,
                message: error.message,
                code: error.code,
                cause: error.cause?.message || error.cause,
                stack: error.stack?.split('\n').slice(0, 3).join('\n'),
            });
            Logger.error("QoreIdProvider: Failed to obtain access token", error);
            throw new Error(`QoreID authentication failed: ${error.message}`);
        }
    }

    // ─── Generic Request Handler ──────────────────────────────────────────────
    /**
     * @private
     */
    async _request(endpoint, body = {}) {
        const token = await this._getAccessToken();
        const url = `${BASE_URL}${endpoint}`;

        try {
            console.log(`[QoreID] Sending POST request to: ${endpoint}`);
            const response = await httpsFetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            const result = await response.json();

            // If token was rejected, clear cache so it refreshes next time
            if (response.status === 401) {
                console.warn("[QoreID] Token rejected (401), clearing cache");
                tokenCache = { accessToken: null, expiresAt: null };
                return {
                    success: false,
                    error: "Authentication token expired. Please retry.",
                    code: 401,
                };
            }

            if (response.ok) {
                return {
                    success: true,
                    data: result,
                    message: "Verification successful",
                };
            } else {
                console.warn(`[QoreID] API error for ${endpoint}:`, result.message || response.statusText);
                return {
                    success: false,
                    error: result.message || "Unknown error from QoreID",
                    code: result.statusCode || response.status,
                };
            }
        } catch (error) {
            console.error(`[QoreID] Request Error [${endpoint}]:`, error.message);
            return {
                success: false,
                error: `Service connectivity error: ${error.message}`,
            };
        }
    }

    // ─── NIN Premium (by NIN number) ──────────────────────────────────────────
    /**
     * @param {string} nin - 11-digit NIN number
     */
    async fetchByNin(nin) {
        const result = await this._request(`/nin-premium/${nin}`, {});
        if (result.success) {
            return {
                ...result,
                data: this._mapNinData(result.data),
            };
        }
        return result;
    }

    // ─── NIN Phone Premium (by phone number) ─────────────────────────────────
    /**
     * @param {string} phone - Phone number
     */
    async fetchByNinPhone(phone) {
        const result = await this._request(`/nin-phone-premium/${phone}`, {});
        if (result.success) {
            return {
                ...result,
                data: this._mapNinData(result.data),
            };
        }
        return result;
    }

    // ─── Unsupported Methods ──────────────────────────────────────────────────
    async fetchByNinTracking(tracking_id) {
        throw new Error("QoreID does not support NIN lookup by Tracking ID.");
    }

    async fetchByNinDemography(firstname, lastname, gender, dob) {
        throw new Error("QoreID does not support NIN lookup by Demography.");
    }

    async fetchByBvn(bvn) {
        throw new Error("QoreID BVN verification is not configured for this provider.");
    }

    async fetchByBvnPhone(phone) {
        throw new Error("QoreID does not support BVN lookup by Phone.");
    }

    // ─── Response Mapping ─────────────────────────────────────────────────────
    /**
     * Maps QoreID NIN Premium response to the internal data format.
     * QoreID Premium returns data flat at root level, with address in a `residence` object.
     * QoreID NIN (standard) nests data under a `nin` key.
     * This handles both formats.
     * @private
     */
    _mapNinData(data) {
        if (!data) return null;

        // QoreID standard NIN nests under `data.nin`, premium is flat at root
        const d = data.nin || data;

        return {
            firstName: d.firstname,
            lastName: d.lastname,
            middleName: d.middlename,
            gender: d.gender,
            dob: d.birthdate,
            nin: d.nin,
            photo: d.photo,
            phone: d.phone,
            address: d.residence?.address1 || d.address,
            state: d.residence?.state || null,
            lga: d.residence?.lga || null,
            town: null,
            birthCountry: d.birthCountry || d.birthcountry,
            birthState: d.birthState || d.birthstate,
            birthLga: d.lgaOfOrigin || d.birthlga,
        };
    }
}
