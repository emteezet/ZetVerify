import { IKycProvider } from "./IKycProvider";
import { getMockByNin, getMockByBvn, mockUsers } from "../../../lib/mockData";

/**
 * @class MockKycProvider
 * @implements {IKycProvider}
 * @description Mock implementation for local development and testing
 */
export class MockKycProvider extends IKycProvider {
    /**
     * @param {string} nin 
     */
    async fetchByNin(nin) {
        console.log(`[MockKycProvider] Fetching NIN: ${nin}`);

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Attempt to find specific mock user, otherwise fall back to the first one
        const user = getMockByNin(nin) || mockUsers[0];

        console.log(`[MockKycProvider] Result: ${user === mockUsers[0] ? 'FALLBACK' : 'MATCH'} Found ${user.firstName} ${user.lastName}`);

        return {
            success: true,
            data: {
                firstName: user.firstName,
                lastName: user.lastName,
                middleName: user.middleName,
                gender: user.gender,
                dob: user.dob,
                nin: user.nin || nin, // Use searched NIN if fallback
                photo: user.photo,
                phone: user.phone,
                state: user.state,
                lga: user.lga
            }
        };
    }

    /**
     * @param {string} bvn 
     */
    async fetchByBvn(bvn) {
        console.log(`[MockKycProvider] Fetching BVN: ${bvn}`);

        await new Promise(resolve => setTimeout(resolve, 800));

        // Attempt to find specific mock user, otherwise fall back to the first BVN-capable one
        const user = getMockByBvn(bvn) || mockUsers.find(u => u.bvn) || mockUsers[0];

        console.log(`[MockKycProvider] Result: ${user.bvn === bvn ? 'MATCH' : 'FALLBACK'} Found ${user.firstName} ${user.lastName}`);

        return {
            success: true,
            data: {
                firstName: user.firstName,
                lastName: user.lastName,
                bvn: user.bvn || bvn, // Use searched BVN if fallback
                gender: user.gender,
                dob: user.dob
            }
        };
    }
}
