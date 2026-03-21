import { NextResponse } from 'next/server';
import { identityService } from '@/services/IdentityService';
import { authenticateRequest } from '@/lib/utils/auth';

export async function POST(request) {
    try {
        const body = await request.json();
        const { firstname, lastname, dob, gender } = body;

        console.log(`[API] Verifying NIN via Demography: ${firstname} ${lastname}`);

        if (!firstname || !lastname || !dob || !gender) {
            return NextResponse.json(
                { error: 'First name, last name, gender, and Date of Birth are required.' },
                { status: 400 }
            );
        }

        // ── 1. Authenticate the request ──────────────────────────────────
        const { user: authUser, error: authErrorMsg } = await authenticateRequest(request);

        if (!authUser) {
            return NextResponse.json(
                { error: authErrorMsg || 'Session expired. Please log in again.' },
                { status: 401 }
            );
        }

        // ── 2. Call IdentityService (Handles Debit + Registry Lookup) ──
        try {
            const result = await identityService.verifyByNinDemography(authUser.id, {
                firstname,
                lastname,
                gender,
                dob
            });
            
            return NextResponse.json({
                success: true,
                status: result.status || 'VALID',
                user: result.data,
                lastGenerated: new Date().toISOString(),
                serialNumber: result.serialNumber || result.reportId || ("SRN-" + Math.random().toString(36).substring(7).toUpperCase()),
            });

        } catch (err) {
            // Handle Insufficient Balance
            if (err.message?.toLowerCase().includes('insufficient') || err.code === 'INSUFFICIENT_BALANCE') {
                return NextResponse.json(
                    {
                        error: `Insufficient wallet balance. You need at least ₦150 to verify via demography.`,
                        code: 'INSUFFICIENT_BALANCE',
                    },
                    { status: 402 }
                );
            }

            // Handle Not Found
            if (err.code === 'IDENTITY_NOT_FOUND' || err.message?.toLowerCase().includes('not found')) {
                return NextResponse.json(
                    { error: 'NIN record not found for these demographic details in the official registry.' },
                    { status: 404 }
                );
            }

            throw err;
        }

    } catch (err) {
        console.error('Verify Demography API error:', err);
        return NextResponse.json(
            { error: err.message || 'An error occurred during verification.' },
            { status: err.status || 500 }
        );
    }
}
