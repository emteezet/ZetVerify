import { IKycProvider } from "./IKycProvider";
import { Logger } from "../utils/logger";

/**
 * @class NinBvnPortalProvider
 * @implements {IKycProvider}
 * @description Implementation for NinBvnPortal.com.ng API
 */
export class NinBvnPortalProvider extends IKycProvider {
    constructor() {
        super();
        this.apiKey = process.env.NIN_BVN_PORTAL_API_KEY;
        this.baseUrl = process.env.NIN_BVN_PORTAL_BASE_URL || "https://ninbvnportal.com.ng/api";

        if (!this.apiKey) {
            Logger.error("NinBvnPortalProvider: API Key is missing in environment variables.");
        }
    }

    /**
     * Generic request handler for the API
     * @private
     */
    async _request(endpoint, method = "POST", body = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            "Content-Type": "application/json",
            "x-api-key": this.apiKey
        };

        const options = {
            method,
            headers,
        };

        if (body) {
            options.body = JSON.stringify({ ...body, consent: true });
        }

        try {
            const response = await fetch(url, options);
            const result = await response.json();

            if (result.status === "success") {
                return {
                    success: true,
                    data: result.data,
                    reportId: result.reportID,
                    message: result.message
                };
            }

            return {
                success: false,
                error: result.message || "Unknown error from NinBvnPortal",
                code: result.code || response.status
            };
        } catch (error) {
            Logger.error(`NinBvnPortal API Error [${endpoint}]`, error);
            return {
                success: false,
                error: `Service connectivity error: ${error.message}`
            };
        }
    }

    /**
     * @param {string} nin 
     */
    async fetchByNin(nin) {
        const result = await this._request("/nin-verification", "POST", { nin });
        if (result.success) {
            return {
                ...result,
                data: this._mapNinData(result.data)
            };
        }
        return result;
    }

    /**
     * @param {string} bvn 
     */
    async fetchByBvn(bvn) {
        const result = await this._request("/bvn-verification", "POST", { bvn });
        if (result.success) {
            return {
                ...result,
                data: this._mapBvnData(result.data)
            };
        }
        return result;
    }

    /**
     * Search NIN by phone number
     * @param {string} phone 
     */
    async fetchByNinPhone(phone) {
        const result = await this._request("/nin-phone", "POST", { phone });
        if (result.success) {
            return {
                ...result,
                data: this._mapNinData(result.data)
            };
        }
        return result;
    }

    /**
     * Get account balance
     */
    async getBalance() {
        return await this._request("/balance", "GET");
    }

    /**
     * Maps API NIN response to internal format
     * @private
     */
    _mapNinData(data) {
        if (!data) return null;
        return {
            firstName: data.firstname,
            lastName: data.surname,
            middleName: data.middlename,
            gender: data.gender,
            dob: data.birthdate,
            nin: data.nin,
            photo: data.photo,
            phone: data.telephoneno,
            address: data.residence_address,
            state: data.residence_state,
            lga: data.residence_lga,
            town: data.residence_town,
            birthCountry: data.birthcountry,
            birthState: data.birthstate,
            birthLga: data.birthlga
        };
    }

    /**
     * Maps API BVN response to internal format
     * @private
     */
    _mapBvnData(data) {
        if (!data) return null;
        return {
            firstName: data.firstname,
            lastName: data.lastname || data.surname,
            middleName: data.middlename,
            gender: data.gender,
            dob: data.dob,
            bvn: data.bvn,
            photo: data.photo,
            phone: data.phone || data.telephoneno,
            email: data.email,
            nationality: data.nationality,
            stateOfOrigin: data.state_of_origin,
            stateOfResidence: data.state_of_residence
        };
    }
}
